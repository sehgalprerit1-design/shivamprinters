import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin";
import { publishDataFile, publishMode } from "@/lib/catalogue";
import { siteImageOverrides } from "@/data/site-images";
import { allSlots } from "@/lib/site-images";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ slots: allSlots(), overrides: siteImageOverrides(), mode: publishMode() });
}

const Body = z.object({ overrides: z.record(z.string().regex(/^[a-z]+\.[a-z0-9-]+$/), z.string().trim().max(600)) });

export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const valid = new Set(allSlots().map((s) => s.key));
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(parsed.data.overrides)) {
    if (!valid.has(k) || !v) continue;
    if (!/^(\/|https:\/\/)/.test(v)) return NextResponse.json({ error: `${k}: image must be an uploaded file or an https:// URL` }, { status: 400 });
    clean[k] = v;
  }
  const n = Object.keys(clean).length;
  try {
    const r = await publishDataFile("src/data/site-image-overrides.json", JSON.stringify(clean, null, 2) + "\n", `Site images updated from admin: ${n} custom image(s)`);
    return NextResponse.json({ ok: true, ...r });
  } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 500 }); }
}
