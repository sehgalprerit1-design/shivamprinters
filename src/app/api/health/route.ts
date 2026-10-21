// Health check + daily keep-alive (called by the Vercel cron in vercel.json).
// Touching the database once a day keeps a free-tier Supabase/Neon project from pausing.
import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { storageSelfTest } from "@/lib/storage";
import { emailSelfTest } from "@/lib/email";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const out: Record<string, unknown> = { ok: true, time: new Date().toISOString(), db: "not configured" };
  try {
    const prisma = await getPrisma();
    if (prisma) { const n = await prisma.product.count(); out.db = "ok"; out.products = n; }
  } catch (e) { out.ok = false; out.db = (e as Error).message; }
  const q = new URL(req.url).searchParams;
  if (q.get("storage")) out.storage = await storageSelfTest();
  if (q.get("email")) out.email = await emailSelfTest();
  return NextResponse.json(out, { status: out.ok ? 200 : 500 });
}
