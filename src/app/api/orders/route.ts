import { NextResponse } from "next/server";
import { OrderInput, createOrder } from "@/lib/orders";
import { createRazorpayOrder, razorpayEnabled } from "@/lib/razorpay";
import { createPaytmTxn, paytmEnabled } from "@/lib/paytm";

const OFFLINE = "Online payment isn't available right now — please choose Cash on delivery.";

export async function POST(req: Request) {
  const parsed = OrderInput.safeParse(await req.json());
  if (!parsed.success) { const i = parsed.error.issues[0]; return NextResponse.json({ error: `Please check ${String(i?.path.slice(-1)[0] ?? "the form")}: ${i?.message ?? "invalid"}` }, { status: 400 }); }
  const pm = parsed.data.paymentMethod;
  if ((pm === "RAZORPAY" && !razorpayEnabled) || (pm === "PAYTM" && !paytmEnabled)) return NextResponse.json({ error: OFFLINE }, { status: 400 });
  try {
    const order = await createOrder(parsed.data);
    let razorpay = null, paytm = null;
    if (pm === "RAZORPAY") razorpay = await createRazorpayOrder(order.total, String(order.number));
    if (pm === "PAYTM") paytm = await createPaytmTxn(order.number, order.total, { phone: parsed.data.address.phone, email: parsed.data.address.email });
    return NextResponse.json({ orderId: order.id, number: order.number, total: order.total, razorpay, paytm });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
