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
  design?: { preview?: string; text?: Record<string, string>; photoCount: number; options?: Record<string, string>; slots?: { key?: string; zoom: number; dx: number; dy: number; rot: number; w: number; h: number }[]; canvas?: { w: number; h: number; aspect: number } };
};

type CartState = {
  lines: CartLine[];
  open: boolean;
  coupon?: { code: string; description?: string; percentOff?: number; flatOff?: number; maxOff?: number; minOrder?: number; expiresAt?: string };
  add: (line: Omit<CartLine, "id">) => void;
  /** Replace an existing line (edit flow); falls back to add if the id is gone. */
  replace: (id: string, line: Omit<CartLine, "id">) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
  applyCoupon: (code: string) => Promise<{ ok: boolean; message: string }>;
  removeCoupon: () => void;
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
      replace: (id, line) =>
        set((s) => (s.lines.some((l) => l.id === id) ? { lines: s.lines.map((l) => (l.id === id ? { ...line, id } : l)) } : { lines: [...s.lines, { ...line, id: `${line.variantSku}-${Date.now().toString(36)}` }] })),
      remove: (id) => set((s) => ({ lines: s.lines.filter((l) => l.id !== id) })),
      setQty: (id, qty) =>
        set((s) => ({ lines: s.lines.map((l) => (l.id === id ? { ...l, qty: Math.max(1, Math.min(99, qty)) } : l)) })),
      clear: () => set({ lines: [], coupon: undefined }),
      setOpen: (open) => set({ open }),
      applyCoupon: async (code) => {
        const subtotal = get().lines.reduce((a, l) => a + l.unitPrice * l.qty, 0);
        try {
          const r = await fetch("/api/coupons/validate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: code.trim().toUpperCase(), subtotal }) });
          const j = (await r.json()) as { ok: boolean; message: string; coupon?: NonNullable<CartState["coupon"]> };
          if (!j.ok || !j.coupon) return { ok: false, message: j.message ?? "That code isn't valid." };
          set({ coupon: j.coupon });
          return { ok: true, message: j.message };
        } catch { return { ok: false, message: "Couldn't check that code — please try again." }; }
      },
      removeCoupon: () => set({ coupon: undefined }),
    }),
    { name: "shivam-cart", partialize: (s) => ({ lines: s.lines, coupon: s.coupon }) },
  ),
);

export function cartTotals(lines: CartLine[], coupon?: CartState["coupon"], shipMethod: "express" | "economy" = "economy") {
  const subtotal = lines.reduce((a, l) => a + l.unitPrice * l.qty, 0);
  let discount = 0;
  if (coupon && subtotal >= (coupon.minOrder ?? 0) && !(coupon.expiresAt && Date.now() > new Date(coupon.expiresAt).getTime())) {
    discount = coupon.percentOff ? Math.round((subtotal * coupon.percentOff) / 100) : (coupon.flatOff ?? 0);
    if (coupon.maxOff) discount = Math.min(discount, coupon.maxOff);
    discount = Math.min(discount, subtotal);
  }
  const afterDiscount = subtotal - discount;
  const shipping = afterDiscount === 0 ? 0 : shipMethod === "express" ? 149 : afterDiscount >= 999 ? 0 : 79;
  return { subtotal, discount, shipping, total: afterDiscount + shipping, count: lines.reduce((a, l) => a + l.qty, 0) };
}

export { inr } from "./format";
