import { NextResponse } from "next/server";
import { OrderInput, createOrder } from "@/lib/orders";
import { createRazorpayOrder, razorpayEnabled } from "@/lib/razorpay";

export async function POST(req: Request) {
  const parsed = OrderInput.safeParse(await req.json());
  if (!parsed.success) { const i = parsed.error.issues[0]; return NextResponse.json({ error: `Please check ${String(i?.path.slice(-1)[0] ?? "the form")}: ${i?.message ?? "invalid"}` }, { status: 400 }); }
  if (parsed.data.paymentMethod === "RAZORPAY" && !razorpayEnabled) return NextResponse.json({ error: "Online payment isn't available right now — please choose Cash on delivery." }, { status: 400 });
  try {
    const order = await createOrder(parsed.data);
    let razorpay = null;
    if (parsed.data.paymentMethod === "RAZORPAY" && razorpayEnabled) razorpay = await createRazorpayOrder(order.total, String(order.number));
    return NextResponse.json({ orderId: order.id, number: order.number, total: order.total, razorpay });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
