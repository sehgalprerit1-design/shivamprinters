import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin";
import { listCustomers, updateCustomer, deleteCustomer, customersCsv, recordCustomer } from "@/lib/customers";
export const dynamic = "force-dynamic";

/** GET → JSON list; GET ?format=csv[&optin=1] → downloadable CSV for mailing / WhatsApp tools. */
export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const rows = await listCustomers();
  if (url.searchParams.get("format") === "csv") {
    const csv = customersCsv(rows, url.searchParams.get("optin") === "1");
    return new NextResponse(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="customers-${new Date().toISOString().slice(0, 10)}.csv"` } });
  }
  return NextResponse.json({ customers: rows });
}

const Patch = z.object({ id: z.string().min(1), marketingOptIn: z.boolean().optional(), tags: z.array(z.string().trim().min(1).max(30)).max(20).optional(), notes: z.string().max(1000).nullable().optional(), name: z.string().trim().max(80).nullable().optional() });
export async function PATCH(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = Patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const { id, ...patch } = parsed.data;
  const row = await updateCustomer(id, patch);
  return row ? NextResponse.json({ ok: true, customer: row }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

/** Add a customer by hand (walk-in, phone order). */
const Add = z.object({ name: z.string().trim().max(80).optional(), email: z.string().trim().max(120).optional(), phone: z.string().trim().max(20).optional(), company: z.string().trim().max(120).optional(), city: z.string().trim().max(60).optional(), marketingOptIn: z.boolean().optional() });
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = Add.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const id = await recordCustomer({ ...parsed.data, source: "admin", optIn: parsed.data.marketingOptIn });
  return id ? NextResponse.json({ ok: true, id }) : NextResponse.json({ error: "Enter a valid email address or 10-digit mobile number" }, { status: 400 });
}

export async function DELETE(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await deleteCustomer(id); return NextResponse.json({ ok: true });
}
