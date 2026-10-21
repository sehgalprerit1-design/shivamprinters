// Find an order by its number + the mobile used at checkout (no account needed).
import { NextResponse } from "next/server";
import { findOrderByNumber } from "@/lib/orders";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { number, phone } = (await req.json().catch(() => ({}))) as { number?: string; phone?: string };
  const n = Number(String(number ?? "").replace(/\D/g, "")); const ph = String(phone ?? "").replace(/\D/g, "").slice(-10);
  if (!n || !/^[6-9]\d{9}$/.test(ph)) return NextResponse.json({ error: "Enter your order number and the 10-digit mobile used at checkout." }, { status: 400 });
  const o = await findOrderByNumber(n);
  if (!o || String(o.phone).replace(/\D/g, "").slice(-10) !== ph) return NextResponse.json({ error: "We couldn't find an order with that number and mobile. Call us on 9910888217 and we'll look it up." }, { status: 404 });
  return NextResponse.json({ id: o.id });
}
