import { NextResponse } from "next/server";
import { adminToken } from "@/lib/admin";
export async function POST(req: Request) {
  const { password } = (await req.json()) as { password: string };
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("sp_admin", adminToken(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 14 });
  return res;
}
export async function DELETE() { const res = NextResponse.json({ ok: true }); res.cookies.set("sp_admin", "", { maxAge: 0, path: "/" }); return res; }
