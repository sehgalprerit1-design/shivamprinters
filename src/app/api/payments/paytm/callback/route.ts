// Paytm POSTs here when its checkout redirects (e.g. mobile UPI app flows / popup fallback).
// We never trust the form: the payment is re-checked with Paytm's status API before the order is marked paid.
import { NextResponse } from "next/server";
import { confirmPaytm } from "@/lib/paytm-confirm";
import { verifyForm } from "@/lib/paytm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = Object.fromEntries([...(await req.formData()).entries()].map(([k, v]) => [k, String(v)]));
  const base = new URL(req.url).origin;
  if (form.CHECKSUMHASH && !verifyForm(form, form.CHECKSUMHASH)) console.warn("Paytm callback checksum mismatch for", form.ORDERID);
  try {
    const r = form.ORDERID ? await confirmPaytm(form.ORDERID) : { ok: false as const, error: "Missing order" };
    if (r.ok) return NextResponse.redirect(`${base}/orders/${r.orderId}?placed=1`, 303);
    if (r.orderId) return NextResponse.redirect(`${base}/orders/${r.orderId}?payment=${r.pending ? "pending" : "failed"}`, 303);
  } catch (e) { console.error("Paytm callback:", (e as Error).message); }
  return NextResponse.redirect(`${base}/checkout?payment=failed`, 303);
}
