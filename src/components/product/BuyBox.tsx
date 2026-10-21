"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Share2, MapPin } from "lucide-react";
import type { Product } from "@/data/catalog";
import { optionsFor, optionDelta, defaultOptions } from "@/data/options";
import { inr } from "@/lib/format";
import { useWishlist } from "@/lib/wishlist";
import { useCart } from "@/lib/cart";
import { CallUs } from "@/components/ui/CallUs";

export function BuyBox({ product }: { product: Product }) {
  const [v, setV] = useState(product.variants[0]);
  const groups = optionsFor(product.slug, product.category);
  const [opts, setOpts] = useState<Record<string, string>>(defaultOptions(groups));
  const [qty, setQty] = useState(1);
  const [pin, setPin] = useState(""); const [eta, setEta] = useState<string | null>(null);
  const wish = useWishlist(); const [mounted, setMounted] = useState(false);
  const addLine = useCart((s) => s.add); const openCart = useCart((s) => s.setOpen); const [added, setAdded] = useState(false); const [copied, setCopied] = useState(false);
  const readyMade = product.personalisation === "none";
  useEffect(() => setMounted(true), []);
  const unit = v.price + optionDelta(groups, opts);
  const pct = v.compareAt ? Math.round(((v.compareAt - unit) / v.compareAt) * 100) : 0;
  const q = new URLSearchParams({ v: v.sku, qty: String(qty), ...opts }).toString();
  const wished = mounted && wish.has(product.slug);

  const checkPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pin)) { setEta("Enter a 6-digit PIN code"); return; }
    const metro = /^(1[01]|40|41|56|60|70|50|38|30)/.test(pin);
    setEta(metro ? "Express by 4–5 days · Economy by 8–10 days · COD available" : "Express by 5–6 days · Economy by 10–12 days · COD available");
  };

  return (
    <div className="mt-6" id="buy">
      {product.variants.length > 1 && (
        <div>
          <div className="text-sm font-semibold mb-2">Size</div>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((x) => (
              <button key={x.sku} onClick={() => setV(x)} className={`rounded-xl border px-3 py-2 text-sm text-left ${x.sku === v.sku ? "border-brand bg-brand-soft" : "border-line hover:border-ink-3"}`}>
                <div className="font-medium">{x.name}</div><div className="text-xs text-ink-3">{inr(x.price)}</div>
              </button>
            ))}
          </div>
        </div>
      )}
      {groups.map((g) => (
        <div key={g.key} className="mt-4">
          <div className="text-sm font-semibold mb-2">{g.label}</div>
          <div className="flex flex-wrap gap-2">
            {g.choices.map((c) => (
              <button key={c.id} onClick={() => setOpts({ ...opts, [g.key]: c.id })} title={c.hint} className={`rounded-full border px-3 py-1.5 text-sm ${opts[g.key] === c.id ? "border-brand bg-brand-soft" : "border-line hover:border-ink-3"}`}>
                {c.label}{c.delta ? <span className="text-ink-3 text-xs"> +{inr(c.delta)}</span> : null}
              </button>
            ))}
          </div>
          {g.choices.find((c) => c.id === opts[g.key])?.hint && <div className="text-xs text-ink-3 mt-1">{g.choices.find((c) => c.id === opts[g.key])!.hint}</div>}
        </div>
      ))}

      <div className="flex items-end gap-4 mt-6">
        <div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">{inr(unit)}</span>
            {v.compareAt && pct > 0 && <><span className="price-strike">{inr(v.compareAt)}</span><span className="chip bg-brand text-white">{pct}% off</span></>}
          </div>
          <div className="text-xs text-ink-3 mt-1">Inclusive of GST · <b>PATAKA25</b> for 25% off at checkout</div>
        </div>
        <div className="ml-auto">
          <div className="text-xs font-semibold mb-1">Qty</div>
          <div className="inline-flex border border-line rounded-full"><button className="px-3 py-1.5" onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span className="px-1 py-1.5 text-sm w-6 text-center">{qty}</span><button className="px-3 py-1.5" onClick={() => setQty(Math.min(99, qty + 1))}>+</button></div>
        </div>
      </div>
      {qty >= 10 && <div className="text-xs text-accent mt-2">Ordering {qty}? <Link href="/bulk-orders" className="underline">Bulk pricing</Link> starts at 25 units.</div>}

      <div className="flex gap-2 mt-5">
        {readyMade
          ? <button onClick={() => { addLine({ productSlug: product.slug, productName: product.name, variantSku: v.sku, variantName: v.name, unitPrice: unit, qty, image: product.image }); setAdded(true); openCart(true); setTimeout(() => setAdded(false), 2500); }} className="btn btn-primary flex-1 text-base !py-3.5">{added ? "Added ✓" : `Add to cart · ${inr(unit * qty)}`}</button>
          : <Link href={`/design/${product.slug}?${q}`} className="btn btn-primary flex-1 text-base !py-3.5">Personalise this →</Link>}
        <button onClick={() => wish.toggle(product.slug)} aria-label="Save" className={`btn btn-ghost !px-4 ${wished ? "text-brand border-brand" : ""}`}><Heart size={18} className={wished ? "fill-brand" : ""} /></button>
        <button onClick={() => { if (navigator.share) navigator.share({ title: product.name, url: location.href }).catch(() => {}); else { navigator.clipboard?.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); } }} aria-label="Share" title={copied ? "Link copied" : "Share"} className="btn btn-ghost !px-4 relative"><Share2 size={18} />{copied && <span className="absolute -top-8 right-0 text-xs bg-ink text-white rounded-md px-2 py-1 whitespace-nowrap">Link copied</span>}</button>
      </div>
      <p className="text-xs text-ink-3 text-center mt-2">{readyMade ? "No personalisation needed — ships as shown." : "You can still change size, finish and quantity while personalising."}</p>
      <div className="text-center mt-2"><CallUs whatsapp={`Hi Shivam Printers, I have a question about "${product.name}".`} /></div>

      <form onSubmit={checkPin} className="mt-5 flex gap-2 items-center">
        <MapPin size={16} className="text-ink-3" />
        <input className="input !py-2 !w-40" placeholder="PIN code" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value)} />
        <button className="btn btn-ghost !py-2 text-sm">Check delivery</button>
      </form>
      {eta && <div className="text-xs text-ink-2 mt-2">{eta}</div>}
    </div>
  );
}
