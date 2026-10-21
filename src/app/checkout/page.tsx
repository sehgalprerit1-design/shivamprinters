"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart, cartTotals, inr } from "@/lib/cart";
import { z } from "zod";

const Address = z.object({
  name: z.string().min(2, "Name"), phone: z.string().regex(/^[6-9]\d{9}$/, "10-digit mobile"), email: z.string().email("Email"),
  line1: z.string().min(4, "Address"), line2: z.string().optional(), city: z.string().min(2, "City"), state: z.string().min(2, "State"), pincode: z.string().regex(/^\d{6}$/, "6-digit PIN"),
});
type AddressT = z.infer<typeof Address>;

declare global { interface Window { Razorpay?: new (o: Record<string, unknown>) => { open: () => void } } }

export default function Checkout() {
  const router = useRouter();
  const { lines, coupon, clear } = useCart();
  const [ship, setShip] = useState<"economy" | "express">("economy");
  const [pay, setPay] = useState<"RAZORPAY" | "COD">("RAZORPAY");
  const [a, setA] = useState<AddressT>({ name: "", phone: "", email: "", line1: "", line2: "", city: "", state: "", pincode: "" });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [gift, setGift] = useState(""); const [isGift, setIsGift] = useState(false);
  const t = cartTotals(lines, coupon, ship);
  const f = (k: keyof AddressT) => ({ value: a[k] ?? "", onChange: (e: React.ChangeEvent<HTMLInputElement>) => setA({ ...a, [k]: e.target.value }), className: `input ${errs[k] ? "!border-brand" : ""}` });

  if (lines.length === 0) return <div className="container-x py-20 text-center text-ink-2">Your cart is empty.</div>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = Address.safeParse(a);
    if (!r.success) { setErrs(Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message]))); return; }
    setErrs({}); setBusy(true);
    try {
      const res = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ address: r.data, lines, coupon: coupon?.code, shipMethod: ship, paymentMethod: pay, giftMessage: isGift ? gift : undefined }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not place order");
      if (pay === "COD" || !data.razorpay) { clear(); router.push(`/orders/${data.orderId}?placed=1`); return; }
      // Razorpay checkout (script loaded lazily)
      if (!window.Razorpay) await new Promise<void>((ok, bad) => { const s = document.createElement("script"); s.src = "https://checkout.razorpay.com/v1/checkout.js"; s.onload = () => ok(); s.onerror = () => bad(new Error("Payment script failed")); document.body.appendChild(s); });
      const rz = new window.Razorpay!({
        key: data.razorpay.key, amount: data.razorpay.amount, currency: "INR", name: "Shivam Printers", description: `Order #${data.number}`, order_id: data.razorpay.orderId,
        prefill: { name: a.name, email: a.email, contact: a.phone }, theme: { color: "#e2573f" },
        handler: async (resp: Record<string, string>) => {
          await fetch(`/api/orders/${data.orderId}/confirm`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(resp) });
          clear(); router.push(`/orders/${data.orderId}?placed=1`);
        },
      });
      rz.open();
    } catch (err) { setErrs({ form: (err as Error).message }); } finally { setBusy(false); }
  };

  return (
    <div className="container-x pt-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-6">Checkout</h1>
      <form onSubmit={submit} className="grid lg:grid-cols-[1fr_380px] gap-8">
        <div className="space-y-8">
          <section className="card p-5">
            <h2 className="font-bold text-lg mb-4">Delivery address</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <input placeholder="Full name" {...f("name")} />
              <input placeholder="Mobile number" inputMode="numeric" {...f("phone")} />
              <input placeholder="Email (for order updates)" type="email" className="sm:col-span-2 input" value={a.email} onChange={(e) => setA({ ...a, email: e.target.value })} />
              <input placeholder="Flat / house no., building, street" className="sm:col-span-2 input" value={a.line1} onChange={(e) => setA({ ...a, line1: e.target.value })} />
              <input placeholder="Landmark (optional)" className="sm:col-span-2 input" value={a.line2} onChange={(e) => setA({ ...a, line2: e.target.value })} />
              <input placeholder="PIN code" inputMode="numeric" {...f("pincode")} />
              <input placeholder="City" {...f("city")} />
              <input placeholder="State" {...f("state")} />
            </div>
            {Object.keys(errs).filter((k) => k !== "form").length > 0 && <div className="text-brand text-sm mt-2">Please check: {Object.values(errs).join(", ")}</div>}
          </section>
          <section className="card p-5">
            <h2 className="font-bold text-lg mb-4">Delivery speed</h2>
            {([["economy", "Economy", "10–12 working days", t.subtotal - t.discount >= 999 ? "Free" : "₹79"], ["express", "Express", "4–6 working days", "₹149"]] as const).map(([k, l, d, p]) => (
              <label key={k} className={`flex items-center gap-3 p-3 rounded-xl border mb-2 cursor-pointer ${ship === k ? "border-brand bg-brand-soft" : "border-line"}`}>
                <input type="radio" name="ship" checked={ship === k} onChange={() => setShip(k)} /><div className="flex-1"><div className="font-semibold">{l}</div><div className="text-xs text-ink-3">{d}</div></div><div className="font-semibold">{p}</div>
              </label>
            ))}
          </section>
          <section className="card p-5">
            <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={isGift} onChange={(e) => setIsGift(e.target.checked)} /><div><div className="font-bold">This is a gift</div><div className="text-xs text-ink-3">We leave the invoice out of the box and add a printed card with your message.</div></div></label>
            {isGift && <textarea className="input mt-3" rows={3} maxLength={200} placeholder="Your message (up to 200 characters)" value={gift} onChange={(e) => setGift(e.target.value)} />}
          </section>
          <section className="card p-5">
            <h2 className="font-bold text-lg mb-4">Payment</h2>
            {([["RAZORPAY", "UPI, cards, net banking, wallets", "Secure payment via Razorpay"], ["COD", "Cash on delivery", "Pay when it arrives. Available on most pincodes."]] as const).map(([k, l, d]) => (
              <label key={k} className={`flex items-center gap-3 p-3 rounded-xl border mb-2 cursor-pointer ${pay === k ? "border-brand bg-brand-soft" : "border-line"}`}>
                <input type="radio" name="pay" checked={pay === k} onChange={() => setPay(k)} /><div><div className="font-semibold">{l}</div><div className="text-xs text-ink-3">{d}</div></div>
              </label>
            ))}
          </section>
        </div>
        <aside className="card p-5 h-fit space-y-3 text-sm lg:sticky lg:top-32">
          <div className="font-bold text-lg">Order summary</div>
          {lines.map((l) => <div key={l.id} className="flex justify-between gap-2"><span className="text-ink-2 truncate">{l.qty}× {l.productName}</span><span>{inr(l.unitPrice * l.qty)}</span></div>)}
          <div className="border-t border-line pt-3 flex justify-between"><span>Subtotal</span><span>{inr(t.subtotal)}</span></div>
          {t.discount > 0 && <div className="flex justify-between text-accent"><span>{coupon?.code}</span><span>−{inr(t.discount)}</span></div>}
          <div className="flex justify-between"><span>Shipping</span><span>{t.shipping === 0 ? "Free" : inr(t.shipping)}</span></div>
          <div className="flex justify-between font-bold text-base border-t border-line pt-3"><span>Total</span><span>{inr(t.total)}</span></div>
          {errs.form && <div className="text-brand text-xs">{errs.form}</div>}
          <button disabled={busy} className="btn btn-primary w-full !py-3.5 text-base">{busy ? "Placing order…" : pay === "COD" ? `Place order · ${inr(t.total)}` : `Pay ${inr(t.total)}`}</button>
          <p className="text-xs text-ink-3">By placing the order you agree to our terms. Personalised items are made to order and can&apos;t be cancelled once in production.</p>
        </aside>
      </form>
    </div>
  );
}
