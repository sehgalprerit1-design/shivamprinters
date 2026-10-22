// Owner alerts by SMS and WhatsApp. Email is handled in email.ts.
//
// Two providers, picked automatically from the environment:
//  • MSG91 (Indian; recommended): MSG91_AUTHKEY + MSG91_SMS_TEMPLATE_ID/MSG91_SMS_SENDER for SMS,
//    MSG91_WA_NUMBER + MSG91_WA_TEMPLATE for WhatsApp. Both templates take 3 variables:
//    {{1}} what happened, {{2}} the details, {{3}} the admin link.
//  • Twilio (fallback): TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM, TWILIO_WHATSAPP_FROM.
// Everything is a no-op when nothing is configured, so the site works without alerts.
const env = (k: string) => (process.env[k] ?? "").trim().replace(/^["']|["']$/g, "") || undefined;

const TO = (env("NOTIFY_PHONE") ?? "+919910888217").replace(/[^\d+]/g, "");
const TO_E164 = TO.startsWith("+") ? TO : `+${TO}`;
const TO_DIGITS = TO_E164.slice(1); // 91XXXXXXXXXX

// MSG91
const M_KEY = env("MSG91_AUTHKEY");
const M_SMS_TPL = env("MSG91_SMS_TEMPLATE_ID"), M_SMS_SENDER = env("MSG91_SMS_SENDER");
const M_WA_NUMBER = env("MSG91_WA_NUMBER")?.replace(/\D/g, ""), M_WA_TPL = env("MSG91_WA_TEMPLATE"), M_WA_LANG = env("MSG91_WA_LANG") ?? "en";
// Twilio
const T_SID = env("TWILIO_ACCOUNT_SID"), T_TOKEN = env("TWILIO_AUTH_TOKEN"), T_SMS_FROM = env("TWILIO_SMS_FROM"), T_WA_FROM = env("TWILIO_WHATSAPP_FROM") ?? "whatsapp:+14155238886";

export const smsProvider: "msg91" | "twilio" | null = M_KEY && M_SMS_TPL ? "msg91" : T_SID && T_TOKEN && T_SMS_FROM ? "twilio" : null;
export const whatsappProvider: "msg91" | "twilio" | null = M_KEY && M_WA_NUMBER && M_WA_TPL ? "msg91" : T_SID && T_TOKEN ? "twilio" : null;

export type Alert = { what: string; details: string; link: string };
type Result = { ok: boolean; provider?: string; id?: string; status?: number; error?: string };

async function post(url: string, headers: Record<string, string>, body: string): Promise<{ status: number; json: Record<string, unknown> }> {
  const r = await fetch(url, { method: "POST", headers, body });
  return { status: r.status, json: (await r.json().catch(() => ({}))) as Record<string, unknown> };
}

// ---- MSG91
async function msg91Sms(a: Alert): Promise<Result> {
  try {
    const { status, json } = await post("https://control.msg91.com/api/v5/flow/", { authkey: M_KEY!, "content-type": "application/json", accept: "application/json" },
      JSON.stringify({ template_id: M_SMS_TPL, short_url: "0", ...(M_SMS_SENDER ? { sender: M_SMS_SENDER } : {}), recipients: [{ mobiles: TO_DIGITS, VAR1: a.what.slice(0, 60), VAR2: a.details.slice(0, 120), VAR3: a.link }] }));
    const ok = status < 300 && String(json.type ?? "success") !== "error";
    if (!ok) console.error("msg91 sms failed", status, json);
    return { ok, provider: "msg91", status, id: String(json.request_id ?? json.message ?? ""), error: ok ? undefined : String(json.message ?? `HTTP ${status}`) };
  } catch (e) { return { ok: false, provider: "msg91", error: (e as Error).message }; }
}
async function msg91WhatsApp(a: Alert): Promise<Result> {
  try {
    const { status, json } = await post("https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/", { authkey: M_KEY!, "content-type": "application/json", accept: "application/json" },
      JSON.stringify({ integrated_number: M_WA_NUMBER, content_type: "template", payload: { messaging_product: "whatsapp", type: "template", template: { name: M_WA_TPL, language: { code: M_WA_LANG, policy: "deterministic" }, namespace: null, to_and_components: [{ to: [TO_DIGITS], components: { body_1: { type: "text", value: a.what.slice(0, 200) }, body_2: { type: "text", value: a.details.slice(0, 500) }, body_3: { type: "text", value: a.link } } }] } } }));
    const ok = status < 300 && String(json.type ?? "success") !== "error" && String(json.status ?? "").toLowerCase() !== "fail";
    if (!ok) console.error("msg91 whatsapp failed", status, json);
    return { ok, provider: "msg91", status, id: String(json.request_id ?? json.messageId ?? ""), error: ok ? undefined : String(json.message ?? json.error ?? `HTTP ${status}`) };
  } catch (e) { return { ok: false, provider: "msg91", error: (e as Error).message }; }
}

// ---- Twilio
async function twilio(from: string, to: string, body: string): Promise<Result> {
  try {
    const { status, json } = await post(`https://api.twilio.com/2010-04-01/Accounts/${T_SID}/Messages.json`, { Authorization: "Basic " + Buffer.from(`${T_SID}:${T_TOKEN}`).toString("base64"), "content-type": "application/x-www-form-urlencoded" }, new URLSearchParams({ From: from, To: to, Body: body }).toString());
    const ok = status < 300; if (!ok) console.error("twilio failed", status, json.message);
    return { ok, provider: "twilio", status, id: String(json.sid ?? ""), error: ok ? undefined : String(json.message ?? `HTTP ${status}`) };
  } catch (e) { return { ok: false, provider: "twilio", error: (e as Error).message }; }
}
const plain = (a: Alert) => `Shivam Printers: ${a.what}\n${a.details}\n${a.link}`;

export async function sendSms(a: Alert): Promise<Result> {
  if (smsProvider === "msg91") return msg91Sms(a);
  if (smsProvider === "twilio") return twilio(T_SMS_FROM!, TO_E164, plain(a).slice(0, 480));
  return { ok: false, error: "SMS not configured" };
}
export async function sendWhatsApp(a: Alert): Promise<Result> {
  if (whatsappProvider === "msg91") return msg91WhatsApp(a);
  if (whatsappProvider === "twilio") return twilio(T_WA_FROM, `whatsapp:${TO_E164}`, plain(a).slice(0, 1500));
  return { ok: false, error: "WhatsApp not configured" };
}

/** Alert the shop owner on every channel that is configured. Never throws. */
export async function notifyOwner(a: Alert) {
  const [sms, wa] = await Promise.all([sendSms(a), sendWhatsApp(a)]);
  return { sms, whatsapp: wa };
}

export async function notifySelfTest() {
  const r = await notifyOwner({ what: "Test alert", details: `Sent ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} — if you can read this, alerts work`, link: "https://shivamprinters.vercel.app/admin" });
  return { to: TO_E164, smsProvider, whatsappProvider, ...r };
}
