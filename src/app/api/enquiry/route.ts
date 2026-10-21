import { NextResponse } from "next/server";
import { EnquiryInput, createEnquiry } from "@/lib/enquiries";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }
  const parsed = EnquiryInput.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the form" }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ ok: true }); // honeypot: pretend success
  try { const row = await createEnquiry(parsed.data); return NextResponse.json({ ok: true, id: (row as { id: string }).id }); }
  catch (e) { console.error("enquiry failed", e); return NextResponse.json({ error: "Could not save your enquiry. Please call us on 9910888217." }, { status: 500 }); }
}
