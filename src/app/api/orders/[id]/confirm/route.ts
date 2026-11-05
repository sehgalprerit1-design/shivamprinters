import { NextResponse } from "next/server";
import { markPaid } from "@/lib/orders";
import { verifySignature } from "@/lib/razorpay";
import { confirmPaytm } from "@/lib/paytm-confirm";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = (await req.json()) as { gateway?: string; paytmOrderId?: string; razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
  if (b.gateway === "paytm") {
    if (!b.paytmOrderId) return NextResponse.json({ error: "Missing payment reference" }, { status: 400 });
    try {
      const r = await confirmPaytm(b.paytmOrderId, id);
      return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error, pending: r.pending ?? false }, { status: r.pending ? 202 : 400 });
    } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 502 }); }
  }
  if (!verifySignature(b.razorpay_order_id, b.razorpay_payment_id, b.razorpay_signature)) return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  await markPaid(id, b.razorpay_payment_id, "RAZORPAY");
  return NextResponse.json({ ok: true });
}
