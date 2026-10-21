import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { PricesFile, publishPrices, pricingRows, pricingPublishMode } from "@/lib/pricing";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ ...pricingRows(), mode: pricingPublishMode() });
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = PricesFile.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid prices: " + (parsed.error.issues[0]?.message ?? "") }, { status: 400 });
  try { return NextResponse.json({ ok: true, ...(await publishPrices(parsed.data)) }); }
  catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 500 }); }
}
