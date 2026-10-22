import { NextResponse } from "next/server";
import { findCoupon, couponProblem, toPublic, describeCoupon } from "@/lib/coupons";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { code, subtotal } = (await req.json().catch(() => ({}))) as { code?: string; subtotal?: number };
  const c = await findCoupon(String(code ?? ""));
  const problem = couponProblem(c, Number(subtotal) || 0);
  if (problem) return NextResponse.json({ ok: false, message: problem }, { status: 200 });
  const pub = toPublic(c!);
  return NextResponse.json({ ok: true, coupon: pub, message: `${pub.code} applied — ${describeCoupon(pub)}.` });
}
