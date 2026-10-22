import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { CatalogueStateZ, publishCatalogue, catalogueState, publishMode } from "@/lib/catalogue";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ ...catalogueState(), mode: publishMode() });
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = CatalogueStateZ.safeParse(await req.json().catch(() => null));
  if (!parsed.success) { const i = parsed.error.issues[0]; return NextResponse.json({ error: `Invalid: ${i?.path.join(".")} — ${i?.message}` }, { status: 400 }); }
  try { return NextResponse.json({ ok: true, ...(await publishCatalogue(parsed.data)) }); }
  catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 500 }); }
}
