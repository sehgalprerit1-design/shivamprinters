import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { setEnquiryStatus } from "@/lib/enquiries";

export async function PATCH(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, status } = (await req.json()) as { id: string; status: string };
  if (!["NEW", "QUOTED", "WON", "CLOSED"].includes(status)) return NextResponse.json({ error: "Bad status" }, { status: 400 });
  await setEnquiryStatus(id, status);
  return NextResponse.json({ ok: true });
}
