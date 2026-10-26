"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart, cartTotals, inr } from "@/lib/cart";
import { Trash2 } from "lucide-react";
import { CallUs } from "@/components/ui/CallUs";

export default function CartPage() {
  const { lines, remove, setQty, coupon, applyCoupon, removeCoupon } = useCart();
  const [code, setCode] = useState(""); const [msg, setMsg] = useState("");
  const [online, setOnline] = useState<boolean | null>(null);
  useEffect(() => { fetch("/api/payments").then((r) => r.json()).then((j) => setOnline(!!j.online)).catch(() => setOnline(false)); }, []);
  const t = cartTotals(lines, coupon);
  return (
    <div className="container-x pt-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-6">Your cart</h1>
      {lines.length === 0 ? (
        <div className="card p-12 text-center"><p className="text-ink-2">Your cart is empty.</p><Link href="/products" className="btn btn-primary mt-4">Start creating</Link></div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          <div className="space-y-4">
            {lines.map((l) => (
              <div key={l.id} className="card p-4 flex gap-4">
                <div className="w-28 h-28 rounded-lg bg-white bg-contain bg-no-repeat bg-center shrink-0 border border-line" style={{ backgroundImage: `url(${l.design?.preview ?? l.image})` }} />
                <div className="flex-1">
                  <div className="font-semibold">{l.productName}</div>
                  <div className="text-sm text-ink-3">{l.variantName}</div>
                  {l.design?.text && Object.values(l.design.text).filter(Boolean).length > 0 && <div className="text-xs text-ink-2 mt-1">“{Object.values(l.design.text).filter(Boolean).join(" · ")}”</div>}
                  {l.design && <Link href={`/design/${l.productSlug}?edit=${l.id}`} className="text-xs text-brand font-semibold mt-1 inline-block">Edit design</Link>}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="inline-flex border border-line rounded-full"><button className="px-3" onClick={() => setQty(l.id, l.qty - 1)}>−</button><span className="px-1 py-1 text-sm">{l.qty}</span><button className="px-3" onClick={() => setQty(l.id, l.qty + 1)}>+</button></div>
                    <span className="font-semibold ml-auto">{inr(l.unitPrice * l.qty)}</span>
                    <button onClick={() => remove(l.id)} className="text-ink-3 hover:text-brand" aria-label="Remove"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <aside className="card p-5 h-fit space-y-3 text-sm lg:sticky lg:top-32">
            <div className="font-bold text-lg">Summary</div>
            <div className="flex justify-between"><span>Subtotal ({t.count})</span><span>{inr(t.subtotal)}</span></div>
            {t.discount > 0 && <div className="flex justify-between text-accent"><span>{coupon?.code} <button onClick={removeCoupon} className="underline text-ink-3 ml-1">remove</button></span><span>−{inr(t.discount)}</span></div>}
            <div className="flex justify-between"><span>Economy shipping</span><span>{t.shipping === 0 ? "Free" : inr(t.shipping)}</span></div>
            <div className="flex justify-between font-bold text-base border-t border-line pt-3"><span>Total</span><span>{inr(t.total)}</span></div>
            {!coupon && (
              <form onSubmit={async (e) => { e.preventDefault(); setMsg("Checking…"); setMsg((await applyCoupon(code)).message); }} className="flex gap-2 pt-2">
                <input className="input !py-2" placeholder="Coupon code" value={code} onChange={(e) => setCode(e.target.value)} />
                <button className="btn btn-ghost !py-2">Apply</button>
              </form>
            )}
            {msg && <div className="text-xs text-ink-2">{msg}</div>}
            <Link href="/checkout" className="btn btn-primary w-full !py-3.5 text-base">Checkout</Link>
            <div className="text-xs text-ink-3 text-center">{online === false ? "Cash on delivery (UPI & cards coming soon)" : online ? "UPI · Cards · Net banking · Cash on delivery" : "Cash on delivery available"}</div>
            <div className="text-center pt-1"><CallUs /></div>
          </aside>
        </div>
      )}
    </div>
  );
}
