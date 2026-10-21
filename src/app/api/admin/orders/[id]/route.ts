import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { setOrderStatus } from "@/lib/orders";
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params; const { status, trackingUrl } = (await req.json()) as { status: string; trackingUrl?: string };
  await setOrderStatus(id, status, trackingUrl);
  return NextResponse.json({ ok: true });
}
