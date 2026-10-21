/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import { getPrisma, memStore } from "./db";
import { getProduct } from "@/data/catalog";

export const OrderInput = z.object({
  address: z.object({ name: z.string(), phone: z.string(), email: z.string().email(), line1: z.string(), line2: z.string().optional(), city: z.string(), state: z.string(), pincode: z.string() }),
  lines: z.array(z.object({ productSlug: z.string(), variantSku: z.string(), qty: z.number().int().min(1).max(99), design: z.any().optional() })).min(1),
  coupon: z.string().optional(),
  shipMethod: z.enum(["economy", "express"]),
  paymentMethod: z.enum(["RAZORPAY", "COD"]),
  giftMessage: z.string().max(200).optional(),
});
export type OrderInputT = z.infer<typeof OrderInput>;

const COUPONS: Record<string, { percentOff: number; maxOff: number }> = { PATAKA25: { percentOff: 25, maxOff: 1000 }, WELCOME10: { percentOff: 10, maxOff: 300 } };

/** Prices are always recomputed server-side from the catalog; never trusted from the client. */
export function priceOrder(input: OrderInputT) {
  const items = input.lines.map((l) => {
    const p = getProduct(l.productSlug); const v = p?.variants.find((x) => x.sku === l.variantSku);
    if (!p || !v) throw new Error(`Unknown item ${l.productSlug}/${l.variantSku}`);
    return { product: p, variant: v, qty: l.qty, unitPrice: v.price, design: l.design };
  });
  const subtotal = items.reduce((a, i) => a + i.unitPrice * i.qty, 0);
  const c = input.coupon ? COUPONS[input.coupon.toUpperCase()] : undefined;
  const discount = c ? Math.min(Math.round((subtotal * c.percentOff) / 100), c.maxOff) : 0;
  const after = subtotal - discount;
  const shipping = input.shipMethod === "express" ? 149 : after >= 999 ? 0 : 79;
  return { items, subtotal, discount, shipping, total: after + shipping };
}

export async function createOrder(input: OrderInputT) {
  const priced = priceOrder(input);
  const prisma = await getPrisma();
  const base = {
    email: input.address.email, phone: input.address.phone, shippingJson: input.address, paymentMethod: input.paymentMethod,
    subtotal: priced.subtotal, discount: priced.discount, shipping: priced.shipping, total: priced.total, couponCode: input.coupon ?? null, shipMethod: input.shipMethod,
    status: input.paymentMethod === "COD" ? "COD_CONFIRMED" : "PENDING_PAYMENT",
    giftMessage: input.giftMessage ?? null,
  };
  if (prisma) {
    const order = await prisma.order.create({
      data: {
        ...base, status: base.status as "COD_CONFIRMED" | "PENDING_PAYMENT",
        items: { create: await Promise.all(priced.items.map(async (i) => ({
          product: { connect: { slug: i.product.slug } }, variant: { connect: { sku: i.variant.sku } }, qty: i.qty, unitPrice: i.unitPrice,
          project: i.design ? { create: { productSlug: i.product.slug, variantSku: i.variant.sku, design: i.design } } : undefined,
        }))) },
      },
    });
    return { id: order.id, number: order.number, total: order.total };
  }
  const id = `ord_${Date.now().toString(36)}`; const number = 100000 + memStore().orders.size + 1;
  memStore().orders.set(id, { id, number, ...base, items: priced.items.map((i) => ({ name: i.product.name, variant: i.variant.name, qty: i.qty, unitPrice: i.unitPrice, preview: i.design?.preview })), createdAt: new Date().toISOString() });
  return { id, number, total: priced.total };
}

export async function getOrder(id: string) {
  const prisma = await getPrisma();
  if (prisma) {
    const o = await prisma.order.findUnique({ where: { id }, include: { items: { include: { product: true, variant: true, project: true } } } });
    if (!o) return null;
    return { ...o, items: o.items.map((i: any) => ({ name: i.product.name, variant: i.variant.name, qty: i.qty, unitPrice: i.unitPrice, preview: (i.project?.design as { preview?: string } | null)?.preview })) };
  }
  return memStore().orders.get(id) ?? null;
}

export async function markPaid(id: string, razorpayPaymentId: string) {
  const prisma = await getPrisma();
  if (prisma) { await prisma.order.update({ where: { id }, data: { status: "PAID", razorpayPaymentId } }); return; }
  const o = memStore().orders.get(id); if (o) { o.status = "PAID"; o.razorpayPaymentId = razorpayPaymentId; }
}
