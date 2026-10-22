// Coupon codes: stored in Postgres (admin-managed) with an in-memory fallback for local dev.
import { z } from "zod";
import { getPrisma, memStore } from "./db";

export type Coupon = { id: string; code: string; description: string | null; percentOff: number | null; flatOff: number | null; maxOff: number | null; minOrder: number; startsAt: Date | string | null; expiresAt: Date | string | null; maxUses: number | null; usedCount: number; showInBanner: boolean; active: boolean; createdAt?: Date | string };
export type CouponPublic = { code: string; description?: string; percentOff?: number; flatOff?: number; maxOff?: number; minOrder: number; expiresAt?: string };

export const CouponInput = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{3,20}$/, "Code: 3–20 letters/numbers, no spaces"),
  description: z.string().trim().max(60).optional(),
  kind: z.enum(["percent", "flat"]),
  value: z.number().int().min(1).max(100000),
  maxOff: z.number().int().min(0).max(100000).nullable().optional(),
  minOrder: z.number().int().min(0).max(1000000).default(0),
  startsAt: z.string().optional().nullable(), // ISO date (yyyy-mm-dd) or empty
  expiresAt: z.string().optional().nullable(),
  maxUses: z.number().int().min(1).max(1000000).nullable().optional(),
  showInBanner: z.boolean().default(false),
  active: z.boolean().default(true),
});
export type CouponInputT = z.infer<typeof CouponInput>;

const DEFAULTS: Coupon[] = [
  { id: "c1", code: "PATAKA25", description: "Festive offer", percentOff: 25, flatOff: null, maxOff: 1000, minOrder: 0, startsAt: null, expiresAt: null, maxUses: null, usedCount: 0, showInBanner: true, active: true },
  { id: "c2", code: "WELCOME10", description: "First order", percentOff: 10, flatOff: null, maxOff: 300, minOrder: 0, startsAt: null, expiresAt: null, maxUses: null, usedCount: 0, showInBanner: false, active: true },
];
const mem = () => { const s = memStore() as unknown as { coupons?: Map<string, Coupon> }; if (!s.coupons) { s.coupons = new Map(DEFAULTS.map((c) => [c.code, { ...c }])); } return s.coupons; };

// Dates are interpreted in IST: start = 00:00 IST, expiry = 23:59:59 IST of that day.
const istStart = (d: string) => new Date(`${d}T00:00:00+05:30`);
const istEnd = (d: string) => new Date(`${d}T23:59:59+05:30`);

export async function listCoupons(): Promise<Coupon[]> {
  const prisma = await getPrisma();
  if (prisma) return prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return [...mem().values()];
}

export async function saveCoupon(input: CouponInputT, id?: string): Promise<Coupon> {
  const data = { code: input.code, description: input.description || null, percentOff: input.kind === "percent" ? Math.min(100, input.value) : null, flatOff: input.kind === "flat" ? input.value : null, maxOff: input.kind === "percent" ? (input.maxOff ?? null) : null, minOrder: input.minOrder, startsAt: input.startsAt ? istStart(input.startsAt) : null, expiresAt: input.expiresAt ? istEnd(input.expiresAt) : null, maxUses: input.maxUses ?? null, showInBanner: input.showInBanner, active: input.active };
  const prisma = await getPrisma();
  if (prisma) {
    if (data.showInBanner) await prisma.coupon.updateMany({ where: { showInBanner: true, ...(id ? { NOT: { id } } : {}) }, data: { showInBanner: false } });
    if (id) return prisma.coupon.update({ where: { id }, data });
    return prisma.coupon.create({ data });
  }
  const m = mem(); if (data.showInBanner) for (const c of m.values()) c.showInBanner = false;
  const existing = id ? [...m.values()].find((c) => c.id === id) : undefined;
  if (existing) m.delete(existing.code);
  const row: Coupon = { id: existing?.id ?? `c_${Date.now().toString(36)}`, usedCount: existing?.usedCount ?? 0, ...data };
  m.set(row.code, row); return row;
}

export async function deleteCoupon(id: string) {
  const prisma = await getPrisma();
  if (prisma) { await prisma.coupon.delete({ where: { id } }); return; }
  const m = mem(); for (const [k, c] of m) if (c.id === id) m.delete(k);
}

export async function findCoupon(code: string): Promise<Coupon | null> {
  const c = code.trim().toUpperCase(); if (!c) return null;
  const prisma = await getPrisma();
  if (prisma) return prisma.coupon.findUnique({ where: { code: c } });
  return mem().get(c) ?? null;
}

/** Why a coupon can't be used right now, or null if it can. */
export function couponProblem(c: Coupon | null, subtotal: number, now = new Date()): string | null {
  if (!c || !c.active) return "That code isn't valid.";
  if (c.startsAt && now < new Date(c.startsAt)) return `${c.code} starts on ${new Date(c.startsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}.`;
  if (c.expiresAt && now > new Date(c.expiresAt)) return `${c.code} has expired.`;
  if (c.maxUses != null && c.usedCount >= c.maxUses) return `${c.code} has been fully redeemed.`;
  if (subtotal < c.minOrder) return `${c.code} needs a minimum order of ₹${c.minOrder.toLocaleString("en-IN")}.`;
  return null;
}

export function couponDiscount(c: Coupon | CouponPublic, subtotal: number) {
  let d = c.percentOff ? Math.round((subtotal * c.percentOff) / 100) : (c.flatOff ?? 0);
  if (c.maxOff) d = Math.min(d, c.maxOff);
  return Math.max(0, Math.min(d, subtotal));
}

export const toPublic = (c: Coupon): CouponPublic => ({ code: c.code, description: c.description ?? undefined, percentOff: c.percentOff ?? undefined, flatOff: c.flatOff ?? undefined, maxOff: c.maxOff ?? undefined, minOrder: c.minOrder, expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString() : undefined });

export async function incrementCouponUse(code: string) {
  const prisma = await getPrisma();
  if (prisma) { await prisma.coupon.updateMany({ where: { code }, data: { usedCount: { increment: 1 } } }); return; }
  const c = mem().get(code); if (c) c.usedCount++;
}

/** The coupon to advertise in the top bar (active, in date, flagged showInBanner). */
const bannerCache: { at: number; value: CouponPublic | null } = { at: 0, value: null };
export async function bannerCoupon(): Promise<CouponPublic | null> {
  if (Date.now() - bannerCache.at < 5 * 60_000) return bannerCache.value; // per-instance cache: pages render often, the banner changes rarely
  try {
    const all = await listCoupons();
    const c = all.find((x) => x.showInBanner && !couponProblem(x, Number.MAX_SAFE_INTEGER));
    bannerCache.value = c ? toPublic(c) : null; bannerCache.at = Date.now();
    return bannerCache.value;
  } catch { return bannerCache.value; }
}
export const describeCoupon = (c: CouponPublic) => c.percentOff ? `${c.percentOff}% off${c.maxOff ? ` up to ₹${c.maxOff.toLocaleString("en-IN")}` : ""}` : `₹${(c.flatOff ?? 0).toLocaleString("en-IN")} off`;
