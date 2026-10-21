"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartLine = {
  id: string; // line id
  productSlug: string;
  productName: string;
  variantSku: string;
  variantName: string;
  unitPrice: number;
  qty: number;
  image: string;
  /** Saved personalisation; preview is a data URL rendered by the editor */
  design?: { preview?: string; text?: Record<string, string>; photoCount: number };
};

type CartState = {
  lines: CartLine[];
  open: boolean;
  coupon?: { code: string; percentOff?: number; flatOff?: number; maxOff?: number };
  add: (line: Omit<CartLine, "id">) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
  applyCoupon: (code: string) => { ok: boolean; message: string };
  removeCoupon: () => void;
};

const COUPONS: Record<string, NonNullable<CartState["coupon"]>> = {
  PATAKA25: { code: "PATAKA25", percentOff: 25, maxOff: 1000 },
  WELCOME10: { code: "WELCOME10", percentOff: 10, maxOff: 300 },
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      open: false,
      add: (line) =>
        set((s) => ({
          lines: [...s.lines, { ...line, id: `${line.variantSku}-${Date.now().toString(36)}` }],
        })),
      remove: (id) => set((s) => ({ lines: s.lines.filter((l) => l.id !== id) })),
      setQty: (id, qty) =>
        set((s) => ({ lines: s.lines.map((l) => (l.id === id ? { ...l, qty: Math.max(1, Math.min(99, qty)) } : l)) })),
      clear: () => set({ lines: [], coupon: undefined }),
      setOpen: (open) => set({ open }),
      applyCoupon: (code) => {
        const c = COUPONS[code.trim().toUpperCase()];
        if (!c) return { ok: false, message: "That code isn't valid." };
        set({ coupon: c });
        return { ok: true, message: `${c.code} applied.` };
      },
      removeCoupon: () => set({ coupon: undefined }),
    }),
    { name: "zoomin-cart", partialize: (s) => ({ lines: s.lines, coupon: s.coupon }) },
  ),
);

export function cartTotals(lines: CartLine[], coupon?: CartState["coupon"], shipMethod: "express" | "economy" = "economy") {
  const subtotal = lines.reduce((a, l) => a + l.unitPrice * l.qty, 0);
  let discount = 0;
  if (coupon) {
    discount = coupon.percentOff ? Math.round((subtotal * coupon.percentOff) / 100) : (coupon.flatOff ?? 0);
    if (coupon.maxOff) discount = Math.min(discount, coupon.maxOff);
  }
  const afterDiscount = subtotal - discount;
  const shipping = afterDiscount === 0 ? 0 : shipMethod === "express" ? 149 : afterDiscount >= 999 ? 0 : 79;
  return { subtotal, discount, shipping, total: afterDiscount + shipping, count: lines.reduce((a, l) => a + l.qty, 0) };
}

export { inr } from "./format";
