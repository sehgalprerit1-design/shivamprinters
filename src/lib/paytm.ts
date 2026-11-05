// Paytm Payment Gateway (JS Checkout). Turns on by itself once PAYTM_MID and PAYTM_MERCHANT_KEY are set.
// PAYTM_ENV=staging uses Paytm's test host + WEBSTAGING; anything else is production.
// Docs: https://www.paytmpayments.com/docs/jscheckout-integration-overview
import crypto from "node:crypto";

const MID = process.env.PAYTM_MID?.trim();
const KEY = process.env.PAYTM_MERCHANT_KEY?.trim();
const STAGING = process.env.PAYTM_ENV?.trim().toLowerCase() === "staging";
export const paytmHost = process.env.PAYTM_HOST?.trim() || (STAGING ? "https://securestage.paytmpayments.com" : "https://secure.paytmpayments.com");
const WEBSITE = process.env.PAYTM_WEBSITE?.trim() || (STAGING ? "WEBSTAGING" : "DEFAULT");
export const paytmEnabled = Boolean(MID && KEY);

// ---- Checksum (same algorithm as Paytm's official `paytmchecksum` package) ----
const IV = "@@@@&&&&####$$$$";
const hash = (s: string, salt: string) => crypto.createHash("sha256").update(`${s}|${salt}`).digest("hex") + salt;
function encrypt(text: string) { const c = crypto.createCipheriv("aes-128-cbc", KEY!, IV); return c.update(text, "binary", "base64") + c.final("base64"); }
function decrypt(b64: string) { const d = crypto.createDecipheriv("aes-128-cbc", KEY!, IV); return d.update(b64, "base64", "binary") + d.final("binary"); }
export function signString(s: string) { const salt = crypto.randomBytes(3).toString("base64"); return encrypt(hash(s, salt)); }
export function verifyString(s: string, checksum: string) {
  try { const h = decrypt(checksum); return h === hash(s, h.slice(-4)); } catch { return false; }
}
/** Callback form posts are signed over the values sorted by key, joined with "|" (CHECKSUMHASH excluded). */
export function verifyForm(params: Record<string, string>, checksum: string) {
  const s = Object.keys(params).filter((k) => k !== "CHECKSUMHASH").sort().map((k) => params[k] ?? "").join("|");
  return verifyString(s, checksum);
}

const siteBase = () => process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://www.shivamprinters.com");

/** Paytm order ids are single-use even when a payment fails, so each attempt gets its own: SP<orderNumber>_<random>. */
export const paytmOrderIdFor = (orderNumber: number) => `SP${orderNumber}_${Date.now().toString(36)}${crypto.randomBytes(2).toString("hex")}`;
export const orderNumberFromPaytmId = (id: string) => { const m = /^SP(\d+)_[a-z0-9]+$/i.exec(id); return m ? Number(m[1]) : null; };

async function post(path: string, body: Record<string, unknown>) {
  const json = JSON.stringify(body); // sign exactly the string we send
  const res = await fetch(`${paytmHost}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: `{"body":${json},"head":{"signature":"${signString(json)}"}}`, cache: "no-store" });
  if (!res.ok) throw new Error(`Paytm ${path} failed (${res.status})`);
  return (await res.json()) as { body?: Record<string, any> }; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export async function createPaytmTxn(orderNumber: number, amountInr: number, user: { phone: string; email: string }) {
  if (!paytmEnabled) return null;
  const orderId = paytmOrderIdFor(orderNumber);
  const amount = amountInr.toFixed(2);
  const r = await post(`/theia/api/v1/initiateTransaction?mid=${encodeURIComponent(MID!)}&orderId=${encodeURIComponent(orderId)}`, {
    requestType: "Payment", mid: MID, websiteName: WEBSITE, orderId,
    callbackUrl: `${siteBase()}/api/payments/paytm/callback`,
    txnAmount: { value: amount, currency: "INR" },
    userInfo: { custId: `CUST_${orderNumber}`, mobile: user.phone, email: user.email },
  });
  const token = r.body?.txnToken as string | undefined;
  if (!token) { console.error("Paytm initiateTransaction:", JSON.stringify(r.body?.resultInfo ?? r)); throw new Error("Couldn't start Paytm payment — please try again, or choose Cash on delivery."); }
  return { mid: MID!, host: paytmHost, orderId, txnToken: token, amount };
}

export type PaytmStatus = { status: "TXN_SUCCESS" | "TXN_FAILURE" | "PENDING" | string; txnId?: string; amount?: number; message?: string };
/** Source of truth for whether a payment went through: always ask Paytm server-to-server, never trust the browser. */
export async function paytmStatus(orderId: string): Promise<PaytmStatus> {
  if (!paytmEnabled) throw new Error("Paytm not configured");
  const r = await post("/v3/order/status", { mid: MID, orderId });
  const b = r.body ?? {};
  return { status: b.resultInfo?.resultStatus ?? "PENDING", txnId: b.txnId, amount: b.txnAmount != null ? Number(b.txnAmount) : undefined, message: b.resultInfo?.resultMsg };
}
