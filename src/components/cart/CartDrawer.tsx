"use client";
import Link from "next/link";
import { X, Trash2 } from "lucide-react";
import { useCart, cartTotals, inr } from "@/lib/cart";
import { CallUs } from "@/components/ui/CallUs";

export function CartDrawer() {
  const { lines, open, setOpen, remove, setQty, coupon } = useCart();
  const t = cartTotals(lines, coupon);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)}>
      <aside className="absolute inset-y-0 right-0 w-full max-w-md bg-surface flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-line">
          <h2 className="text-xl font-bold">Your cart ({t.count})</h2>
          <button onClick={() => setOpen(false)} aria-label="Close" className="p-1"><X /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {lines.length === 0 && <div className="text-ink-3 text-center py-16">Nothing here yet. Go print something.</div>}
          {lines.map((l) => (
            <div key={l.id} className="flex gap-3">
              <div className="w-20 h-20 rounded-lg bg-surface-2 bg-cover bg-center shrink-0 border border-line" style={{ backgroundImage: `url(${l.design?.preview ?? l.image})` }} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{l.productName}</div>
                <div className="text-xs text-ink-3">{l.variantName}{l.design?.photoCount ? ` · ${l.design.photoCount} photo${l.design.photoCount > 1 ? "s" : ""}` : ""}</div>
                <div className="flex items-center gap-3 mt-2">
                  <div className="inline-flex border border-line rounded-full">
                    <button className="px-2.5" onClick={() => setQty(l.id, l.qty - 1)}>−</button>
                    <span className="px-1 text-sm py-1">{l.qty}</span>
                    <button className="px-2.5" onClick={() => setQty(l.id, l.qty + 1)}>+</button>
                  </div>
                  <span className="font-semibold ml-auto">{inr(l.unitPrice * l.qty)}</span>
                  <button onClick={() => remove(l.id)} aria-label="Remove" className="text-ink-3 hover:text-brand"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {lines.length > 0 && (
          <div className="p-5 border-t border-line space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{inr(t.subtotal)}</span></div>
            {t.discount > 0 && <div className="flex justify-between text-accent"><span>{coupon?.code}</span><span>−{inr(t.discount)}</span></div>}
            <div className="text-xs text-ink-3">{t.subtotal - t.discount >= 999 ? "Free economy shipping unlocked." : `Add ${inr(999 - (t.subtotal - t.discount))} more for free shipping.`}</div>
            <Link href="/checkout" onClick={() => setOpen(false)} className="btn btn-primary w-full mt-2">Checkout · {inr(t.subtotal - t.discount)}</Link>
            <Link href="/cart" onClick={() => setOpen(false)} className="block text-center text-ink-2 pt-1">View cart</Link>
            <div className="text-center pt-1"><CallUs compact /></div>
          </div>
        )}
      </aside>
    </div>
  );
}
