/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import { getPrisma, memStore } from "./db";
import { getProduct } from "@/data/catalog";
import { optionsFor, optionDelta } from "@/data/options";
import { sendOrderEmails, sendShippedEmail } from "./email";
import { notifyOwner } from "./notify";
import { findCoupon, couponProblem, couponDiscount, incrementCouponUse } from "./coupons";
import { recordCustomer } from "./customers";

const siteBase = () => process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://shivamprinters.vercel.app");
const orderAlert = (o: { id: string; number: number; total: number; paymentMethod: string; shippingJson: Record<string, string>; items: { name: string; qty: number }[] }) => notifyOwner({ what: `New order #${o.number} · ₹${o.total.toLocaleString("en-IN")} · ${o.paymentMethod}`, details: `${o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")} — ${o.shippingJson.name}, ${o.shippingJson.city}, ${o.shippingJson.phone}`, link: `${siteBase()}/admin/orders/${o.id}` });

export const OrderInput = z.object({
  address: z.object({ name: z.string().trim().min(2).max(80), phone: z.string().trim().regex(/^[6-9]\d{9}$/, "10-digit Indian mobile"), email: z.string().trim().email().max(120), line1: z.string().trim().min(4).max(200), line2: z.string().trim().max(200).optional(), city: z.string().trim().min(2).max(60), state: z.string().trim().min(2).max(60), pincode: z.string().trim().regex(/^\d{6}$/, "6-digit PIN") }),
  lines: z.array(z.object({ productSlug: z.string(), variantSku: z.string(), variantName: z.string().optional(), qty: z.number().int().min(1).max(99), design: z.any().optional() })).min(1),
  coupon: z.string().optional(),
  shipMethod: z.enum(["economy", "express"]),
  paymentMethod: z.enum(["RAZORPAY", "COD"]),
  giftMessage: z.string().max(200).optional(),
  marketingOptIn: z.boolean().optional(), // "keep me posted about offers" at checkout
});
export type OrderInputT = z.infer<typeof OrderInput>;

/** Prices are always recomputed server-side from the catalog; never trusted from the client. */
export async function priceOrder(input: OrderInputT) {
  const items = input.lines.map((l) => {
    const p = getProduct(l.productSlug); const v = p?.variants.find((x) => x.sku === l.variantSku);
    if (!p || !v) throw new Error(`Unknown item ${l.productSlug}/${l.variantSku}`);
    const extra = (l.design?.options && Object.keys(l.design.options).length) ? optionDelta(optionsFor(p.slug, p.category), l.design.options) : 0;
    return { product: p, variant: v, variantLabel: l.variantName ?? v.name, qty: l.qty, unitPrice: v.price + extra, design: l.design };
  });
  const subtotal = items.reduce((a, i) => a + i.unitPrice * i.qty, 0);
  let discount = 0; let couponCode: string | null = null;
  if (input.coupon) {
    const c = await findCoupon(input.coupon);
    if (c && !couponProblem(c, subtotal)) { discount = couponDiscount(c, subtotal); couponCode = c.code; }
  }
  const after = subtotal - discount;
  const shipping = input.shipMethod === "express" ? 149 : after >= 999 ? 0 : 79;
  return { items, subtotal, discount, shipping, total: after + shipping, couponCode };
}

export async function createOrder(input: OrderInputT) {
  const priced = await priceOrder(input);
  const prisma = await getPrisma();
  if (priced.couponCode) await incrementCouponUse(priced.couponCode);
  const base = {
    email: input.address.email, phone: input.address.phone, shippingJson: input.address, paymentMethod: input.paymentMethod,
    subtotal: priced.subtotal, discount: priced.discount, shipping: priced.shipping, total: priced.total, couponCode: priced.couponCode, shipMethod: input.shipMethod,
    status: input.paymentMethod === "COD" ? "COD_CONFIRMED" : "PENDING_PAYMENT",
    giftMessage: input.giftMessage ?? null,
  };
  if (prisma) {
    const order = await prisma.order.create({
      data: {
        ...base, status: base.status as "COD_CONFIRMED" | "PENDING_PAYMENT",
        items: { create: await Promise.all(priced.items.map(async (i) => ({
          product: { connect: { slug: i.product.slug } }, variant: { connect: { sku: i.variant.sku } }, qty: i.qty, unitPrice: i.unitPrice,
          project: i.design ? { create: { productSlug: i.product.slug, variantSku: i.variant.sku, design: { ...i.design, variantLabel: i.variantLabel } } } : undefined,
        }))) },
      },
    });
    // Confirmation emails go out now for COD; for online payment they are sent once the payment is verified (markPaid).
    await recordCustomer({ ...input.address, source: "order", optIn: input.marketingOptIn, order: input.paymentMethod === "COD" ? { total: order.total } : undefined });
    if (input.paymentMethod === "COD") { const full = await getOrder(order.id); if (full) { await sendOrderEmails(full as any); await orderAlert(full as any); } }
    return { id: order.id, number: order.number, total: order.total };
  }
  const id = `ord_${Date.now().toString(36)}`; const number = 100000 + memStore().orders.size + 1;
  memStore().orders.set(id, { id, number, ...base, items: priced.items.map((i) => ({ name: i.product.name, variant: i.variantLabel, qty: i.qty, unitPrice: i.unitPrice, preview: i.design?.preview, design: i.design })), createdAt: new Date().toISOString() });
  await recordCustomer({ ...input.address, source: "order", optIn: input.marketingOptIn, order: input.paymentMethod === "COD" ? { total: priced.total } : undefined });
  if (input.paymentMethod === "COD") { await sendOrderEmails(memStore().orders.get(id) as any); await orderAlert(memStore().orders.get(id) as any); }
  return { id, number, total: priced.total };
}

export async function findOrderByNumber(number: number): Promise<{ id: string; phone: string } | null> {
  const prisma = await getPrisma();
  if (prisma) { const o = await prisma.order.findUnique({ where: { number }, select: { id: true, phone: true } }); return o ?? null; }
  const o = [...memStore().orders.values()].find((x) => Number(x.number) === number); return o ? { id: String(o.id), phone: String(o.phone) } : null;
}

export async function getOrder(id: string) {
  const prisma = await getPrisma();
  if (prisma) {
    const o = await prisma.order.findUnique({ where: { id }, include: { items: { include: { product: true, variant: true, project: true } } } });
    if (!o) return null;
    return { ...o, items: o.items.map((i: any) => ({ name: i.product.name, variant: (i.project?.design as any)?.variantLabel ?? i.variant.name, qty: i.qty, unitPrice: i.unitPrice, preview: (i.project?.design as { preview?: string } | null)?.preview, design: i.project?.design ?? null })) };
  }
  return memStore().orders.get(id) ?? null;
}

export async function markPaid(id: string, razorpayPaymentId: string) {
  const prisma = await getPrisma();
  if (prisma) { await prisma.order.update({ where: { id }, data: { status: "PAID", razorpayPaymentId } }); }
  else { const o = memStore().orders.get(id); if (o) { o.status = "PAID"; o.razorpayPaymentId = razorpayPaymentId; } }
  const full = await getOrder(id); if (full) { await sendOrderEmails(full as any); await orderAlert(full as any); await recordCustomer({ email: (full as any).email, phone: (full as any).phone, source: "order", order: { total: Number((full as any).total) } }); }
}

export async function listOrders(limit = 200) {
  const prisma = await getPrisma();
  if (prisma) {
    const os = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: limit, include: { items: { include: { product: true } } } });
    return os.map((o: any) => ({ ...o, items: o.items.map((i: any) => ({ name: i.product.name, qty: i.qty })) }));
  }
  return [...memStore().orders.values()].reverse();
}

export async function setOrderStatus(id: string, status: string, trackingUrl?: string) {
  const prisma = await getPrisma();
  if (prisma) { await prisma.order.update({ where: { id }, data: { status: status as any, trackingUrl: trackingUrl ?? undefined } }); }
  else { const o = memStore().orders.get(id); if (o) { o.status = status; if (trackingUrl) o.trackingUrl = trackingUrl; } }
  if (status === "SHIPPED") { const o = await getOrder(id); if (o) await sendShippedEmail(o as any); }
}
