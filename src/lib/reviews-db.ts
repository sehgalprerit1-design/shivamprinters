// Customer-submitted reviews (moderated). Generated sample reviews live in src/data/reviews.ts.
import { z } from "zod";
import { getPrisma, memStore } from "./db";
import { sendMail, NOTIFY_EMAIL } from "./email";
import { getProduct } from "@/data/catalog";

export const ReviewInput = z.object({
  productSlug: z.string().min(1),
  author: z.string().trim().min(2).max(60),
  city: z.string().trim().max(60).optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().min(10).max(2000),
  website: z.string().max(500).optional(), // honeypot — any value means a bot; the API pretends success
});
export type ReviewInputT = z.infer<typeof ReviewInput>;
export type DbReview = { id: string; createdAt: string | Date; productSlug: string; author: string; city: string | null; rating: number; title: string; body: string; approved: boolean };

const mem = () => { const s = memStore() as unknown as { reviews?: Map<string, DbReview> }; if (!s.reviews) s.reviews = new Map(); return s.reviews; };

export async function createReview(input: ReviewInputT) {
  const p = getProduct(input.productSlug); if (!p) throw new Error("Unknown product");
  const data = { productSlug: p.slug, author: input.author, city: input.city || null, rating: input.rating, title: input.title, body: input.body };
  const prisma = await getPrisma();
  let row: DbReview;
  if (prisma) row = await prisma.review.create({ data });
  else { row = { id: `rev_${Date.now().toString(36)}`, createdAt: new Date().toISOString(), approved: false, ...data }; mem().set(row.id, row); }
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://shivamprinters.vercel.app");
  await sendMail(NOTIFY_EMAIL, `New review (${data.rating}★) for ${p.name} — approve?`, `<div style="font-family:Inter,Arial,sans-serif;max-width:560px"><p><b>${data.author}</b>${data.city ? ` (${data.city})` : ""} left ${data.rating}★ on <b>${p.name}</b>:</p><p><b>${data.title}</b><br>${data.body}</p><p><a href="${base}/admin/reviews">Approve or delete in admin</a></p></div>`);
  return row;
}

export async function approvedReviews(productSlug: string): Promise<DbReview[]> {
  const prisma = await getPrisma();
  if (prisma) return prisma.review.findMany({ where: { productSlug, approved: true }, orderBy: { createdAt: "desc" }, take: 50 });
  return [...mem().values()].filter((r) => r.productSlug === productSlug && r.approved).reverse();
}

export async function latestApprovedReviews(n = 3): Promise<DbReview[]> {
  const prisma = await getPrisma();
  if (prisma) return prisma.review.findMany({ where: { approved: true, rating: { gte: 4 } }, orderBy: { createdAt: "desc" }, take: n });
  return [...mem().values()].filter((r) => r.approved && r.rating >= 4).reverse().slice(0, n);
}

export async function listReviews(): Promise<DbReview[]> {
  const prisma = await getPrisma();
  if (prisma) return prisma.review.findMany({ orderBy: { createdAt: "desc" }, take: 300 });
  return [...mem().values()].reverse();
}

export async function setReview(id: string, action: "approve" | "unapprove" | "delete") {
  const prisma = await getPrisma();
  if (prisma) { if (action === "delete") await prisma.review.delete({ where: { id } }); else await prisma.review.update({ where: { id }, data: { approved: action === "approve" } }); return; }
  if (action === "delete") mem().delete(id); else { const r = mem().get(id); if (r) r.approved = action === "approve"; }
}
