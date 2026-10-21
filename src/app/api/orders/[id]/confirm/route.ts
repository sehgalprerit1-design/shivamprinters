import { NextResponse } from "next/server";
import { markPaid } from "@/lib/orders";
import { verifySignature } from "@/lib/razorpay";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = (await req.json()) as { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
  if (!verifySignature(b.razorpay_order_id, b.razorpay_payment_id, b.razorpay_signature)) return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  await markPaid(id, b.razorpay_payment_id);
  return NextResponse.json({ ok: true });
}
