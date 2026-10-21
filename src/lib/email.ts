// Transactional email via Resend's HTTP API (no SDK). No-op when RESEND_API_KEY is unset.
import { inr } from "./format";

const env = (k: string) => (process.env[k] ?? "").trim().replace(/^["']|["']$/g, "") || undefined;
// Until a domain is verified in Resend, only the sandbox sender works (and only to the account owner's inbox).
const FROM = env("EMAIL_FROM") ?? "Shivam Printers <onboarding@resend.dev>";
const NOTIFY = env("ORDER_NOTIFY_EMAIL") ?? "sehgalprerit1@gmail.com";
const KEY = env("RESEND_API_KEY");
export const emailEnabled = Boolean(KEY);
const siteUrl = () => env("NEXT_PUBLIC_SITE_URL") ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://shivamprinters.vercel.app");

async function send(to: string | string[], subject: string, html: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  if (!KEY) return { ok: false, error: "RESEND_API_KEY not set" };
  try {
    const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "content-type": "application/json" }, body: JSON.stringify({ from: FROM, to, subject, html }) });
    if (!r.ok) { const t = await r.text(); console.error("email failed", r.status, t); return { ok: false, status: r.status, error: t.slice(0, 300) }; }
    return { ok: true, status: r.status };
  } catch (e) { console.error("email failed", e); return { ok: false, error: (e as Error).message }; }
}

/** Sends a test email to the order-notification inbox; used by /api/health?email=1. */
export async function emailSelfTest() {
  const r = await send(NOTIFY, "Shivam Printers — email test", `<p>Email is working. Sent ${new Date().toISOString()} from <b>${FROM}</b> to <b>${NOTIFY}</b>.</p>`);
  return { configured: emailEnabled, from: FROM, notify: NOTIFY, ...r };
}

type OrderLike = { id: string; number: number; email: string; total: number; subtotal: number; discount: number; shipping: number; shipMethod: string; paymentMethod: string; status: string; giftMessage?: string | null; shippingJson: Record<string, string>; items: { name: string; variant: string; qty: number; unitPrice: number }[] };

export async function sendOrderEmails(o: OrderLike) {
  const base = siteUrl();
  const rows = o.items.map((i) => `<tr><td style="padding:6px 0">${i.name}<br><span style="color:#777;font-size:12px">${i.variant} × ${i.qty}</span></td><td align="right">${inr(i.unitPrice * i.qty)}</td></tr>`).join("");
  const a = o.shippingJson;
  const html = `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;color:#1d1a17">
  <h2 style="margin:0 0 4px">Thanks for your order, ${a.name?.split(" ")[0] ?? ""}!</h2>
  <p style="color:#5b554e;margin:0 0 16px">Order <b>#${o.number}</b> · ${o.paymentMethod === "COD" ? "Cash on delivery" : "Paid online"} · ${o.shipMethod === "express" ? "Express (4–6 working days)" : "Economy (10–12 working days)"}</p>
  <table width="100%" style="border-collapse:collapse;border-top:1px solid #eee;border-bottom:1px solid #eee">${rows}</table>
  <table width="100%" style="margin-top:8px"><tr><td>Subtotal</td><td align="right">${inr(o.subtotal)}</td></tr>${o.discount ? `<tr><td>Discount</td><td align="right">−${inr(o.discount)}</td></tr>` : ""}<tr><td>Shipping</td><td align="right">${o.shipping ? inr(o.shipping) : "Free"}</td></tr><tr><td><b>Total</b></td><td align="right"><b>${inr(o.total)}</b></td></tr></table>
  <p style="margin-top:16px"><b>Delivering to</b><br>${a.name}, ${a.line1}${a.line2 ? ", " + a.line2 : ""}, ${a.city}, ${a.state} ${a.pincode}<br>${a.phone}</p>
  ${o.giftMessage ? `<p><b>Gift message:</b> ${o.giftMessage}</p>` : ""}
  <p><a href="${base}/orders/${o.id}" style="background:#e2573f;color:#fff;padding:10px 16px;border-radius:999px;text-decoration:none;display:inline-block">View your order</a></p>
  <p style="color:#777;font-size:12px">Questions? Call us 9910888217. Production starts within 24 hours; personalised items can't be cancelled once in production.</p></div>`;
  await send(o.email, `Order #${o.number} confirmed — Shivam Printers`, html);
  if (NOTIFY) await send(NOTIFY, `New order #${o.number} · ${inr(o.total)} · ${o.paymentMethod}`, `<p>New order from ${a.name} (${a.phone}, ${o.email}).</p><p><a href="${base}/admin/orders/${o.id}">Open in admin</a></p>${html}`);
}

export async function sendShippedEmail(o: OrderLike & { trackingUrl?: string | null }) {
  const base = siteUrl();
  await send(o.email, `Order #${o.number} is on its way`, `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto"><h2>Your order has shipped</h2><p>Order #${o.number} is on its way to ${o.shippingJson.city}.</p>${o.trackingUrl ? `<p><a href="${o.trackingUrl}">Track your parcel</a></p>` : ""}<p><a href="${base}/orders/${o.id}">View order</a></p><p style="color:#777;font-size:12px">Questions? Call us 9910888217.</p></div>`);
}
