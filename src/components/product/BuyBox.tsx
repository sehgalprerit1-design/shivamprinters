"use client";
import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/data/catalog";
import { inr } from "@/lib/format";

export function BuyBox({ product }: { product: Product }) {
  const [v, setV] = useState(product.variants[0]);
  const pct = v.compareAt ? Math.round(((v.compareAt - v.price) / v.compareAt) * 100) : 0;
  return (
    <div className="mt-6">
      {product.variants.length > 1 && (
        <div>
          <div className="text-sm font-semibold mb-2">Choose a size / finish</div>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((x) => (
              <button key={x.sku} onClick={() => setV(x)} className={`rounded-xl border px-3 py-2 text-sm text-left ${x.sku === v.sku ? "border-brand bg-brand-soft" : "border-line hover:border-ink-3"}`}>
                <div className="font-medium">{x.name}</div>
                <div className="text-xs text-ink-3">{inr(x.price)}</div>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-baseline gap-3 mt-6">
        <span className="text-3xl font-bold">{inr(v.price)}</span>
        {v.compareAt && <><span className="price-strike">{inr(v.compareAt)}</span><span className="chip bg-brand text-white">{pct}% off</span></>}
      </div>
      <div className="text-xs text-ink-3 mt-1">Inclusive of GST. Use <b>PATAKA25</b> for 25% off at checkout.</div>
      <Link href={`/design/${product.slug}?v=${encodeURIComponent(v.sku)}`} className="btn btn-primary w-full mt-5 text-base !py-3.5">Personalise this →</Link>
      <p className="text-xs text-ink-3 text-center mt-2">Upload photos, preview the real thing, then add to cart. Takes about two minutes.</p>
    </div>
  );
}
