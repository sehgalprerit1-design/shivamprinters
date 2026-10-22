import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { CouponInput, listCoupons, saveCoupon, deleteCoupon } from "@/lib/coupons";
export const dynamic = "force-dynamic";

export async function GET() { if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); return NextResponse.json({ coupons: await listCoupons() }); }

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { id?: string } & Record<string, unknown> | null;
  const parsed = CouponInput.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form" }, { status: 400 });
  if (parsed.data.startsAt && parsed.data.expiresAt && parsed.data.expiresAt < parsed.data.startsAt) return NextResponse.json({ error: "Expiry date is before the start date" }, { status: 400 });
  try { return NextResponse.json({ ok: true, coupon: await saveCoupon(parsed.data, body?.id) }); }
  catch (e) { const m = (e as Error).message; return NextResponse.json({ error: /Unique|unique/.test(m) ? "That code already exists" : m }, { status: 400 }); }
}

export async function DELETE(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await deleteCoupon(id); return NextResponse.json({ ok: true });
}
