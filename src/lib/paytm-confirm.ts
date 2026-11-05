import { findOrderByNumber, getOrder, markPaid } from "./orders";
import { orderNumberFromPaytmId, paytmStatus } from "./paytm";

export type PaytmResult = { ok: true; orderId: string } | { ok: false; orderId?: string; pending?: boolean; error: string };

/** Re-checks a Paytm payment with Paytm itself and, if it really succeeded for the full amount, marks our order paid. */
export async function confirmPaytm(paytmOrderId: string, expectOrderId?: string): Promise<PaytmResult> {
  const num = orderNumberFromPaytmId(paytmOrderId);
  if (num == null) return { ok: false, error: "Unknown payment reference" };
  const found = await findOrderByNumber(num);
  if (!found || (expectOrderId && found.id !== expectOrderId)) return { ok: false, error: "Order not found" };
  const order = (await getOrder(found.id)) as { id: string; total: number; status: string } | null;
  if (!order) return { ok: false, error: "Order not found" };
  if (order.status !== "PENDING_PAYMENT") return order.status === "PAID" || order.status === "IN_PRODUCTION" || order.status === "SHIPPED" || order.status === "DELIVERED" ? { ok: true, orderId: order.id } : { ok: false, orderId: order.id, error: "This order isn't awaiting payment." };
  const s = await paytmStatus(paytmOrderId);
  if (s.status === "TXN_SUCCESS") {
    if (s.amount == null || Math.abs(s.amount - Number(order.total)) > 0.001) { console.error(`Paytm amount mismatch on ${paytmOrderId}: paid ${s.amount}, order ${order.total}`); return { ok: false, orderId: order.id, error: "Payment amount didn't match the order" }; }
    await markPaid(order.id, s.txnId ?? paytmOrderId, "PAYTM");
    return { ok: true, orderId: order.id };
  }
  if (s.status === "PENDING") return { ok: false, orderId: order.id, pending: true, error: "Payment is still processing with your bank." };
  return { ok: false, orderId: order.id, error: s.message || "Payment failed" };
}
