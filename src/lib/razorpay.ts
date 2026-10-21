import crypto from "node:crypto";

const KEY = process.env.RAZORPAY_KEY_ID, SECRET = process.env.RAZORPAY_KEY_SECRET;
export const razorpayEnabled = Boolean(KEY && SECRET);

export async function createRazorpayOrder(amountInr: number, receipt: string) {
  if (!razorpayEnabled) return null;
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: "Basic " + Buffer.from(`${KEY}:${SECRET}`).toString("base64"), "content-type": "application/json" },
    body: JSON.stringify({ amount: amountInr * 100, currency: "INR", receipt }),
  });
  if (!res.ok) throw new Error("Razorpay order failed");
  const o = (await res.json()) as { id: string; amount: number };
  return { key: KEY!, orderId: o.id, amount: o.amount };
}

export function verifySignature(orderId: string, paymentId: string, signature: string) {
  if (!SECRET) return false;
  const h = crypto.createHmac("sha256", SECRET).update(`${orderId}|${paymentId}`).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(h), Buffer.from(signature));
}
