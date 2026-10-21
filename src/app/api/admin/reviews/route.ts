import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { setReview } from "@/lib/reviews-db";

export async function PATCH(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, action } = (await req.json()) as { id: string; action: "approve" | "unapprove" | "delete" };
  if (!id || !["approve", "unapprove", "delete"].includes(action)) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  await setReview(id, action);
  return NextResponse.json({ ok: true });
}
