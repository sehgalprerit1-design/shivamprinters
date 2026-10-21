import { NextResponse } from "next/server";
import { ReviewInput, createReview, approvedReviews } from "@/lib/reviews-db";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("product") ?? "";
  if (!slug) return NextResponse.json({ reviews: [] });
  const rows = await approvedReviews(slug);
  return NextResponse.json({ reviews: rows.map((r) => ({ id: r.id, author: r.author, city: r.city ?? "", rating: r.rating, title: r.title, body: r.body, date: new Date(r.createdAt).toISOString().slice(0, 10), verified: true, helpful: 0 })) }, { headers: { "cache-control": "public, max-age=60, s-maxage=300" } });
}

export async function POST(req: Request) {
  const parsed = ReviewInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the form" }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ ok: true });
  try { await createReview(parsed.data); return NextResponse.json({ ok: true }); }
  catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }); }
}
