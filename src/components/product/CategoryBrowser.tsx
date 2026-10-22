"use client";
import { useMemo, useState } from "react";
import type { Product, Category } from "@/data/catalog";
import { minPrice } from "@/data/catalog";
import { ProductGrid } from "./ProductGrid";

export function CategoryBrowser({ products, sections }: { products: Product[]; sections?: Category[] }) {
  const [sort, setSort] = useState<"popular" | "low" | "high" | "rating">("popular");
  const [max, setMax] = useState<number | null>(null);
  const [kind, setKind] = useState<string | null>(null);
  const [section, setSection] = useState<string | null>(null);
  const kinds = useMemo(() => Array.from(new Set(products.map((p) => p.personalisation))), [products]);
  const list = useMemo(() => {
    let l = products.filter((p) => (max ? minPrice(p) <= max : true) && (kind ? p.personalisation === kind : true) && (section ? p.category === section : true));
    l = [...l].sort((a, b) => sort === "low" ? minPrice(a) - minPrice(b) : sort === "high" ? minPrice(b) - minPrice(a) : sort === "rating" ? b.rating - a.rating : b.reviews - a.reviews);
    return l;
  }, [products, sort, max, kind, section]);
  const KIND: Record<string, string> = { photo: "1 photo", "multi-photo": "Many photos", text: "Name only", "photo+text": "Photo + text", none: "Ready-made" };
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-5 text-sm">
        <span className="text-ink-3">{list.length} products</span>
        {sections && sections.length > 1 && <div className="flex gap-1.5 ml-2">{sections.map((c) => <button key={c.slug} onClick={() => setSection(section === c.slug ? null : c.slug)} className={`chip border ${section === c.slug ? "bg-brand text-white border-brand" : "border-line bg-surface"}`}>{c.name}</button>)}</div>}
        <div className="flex gap-1.5 ml-2">{[499, 999, 1999].map((m) => <button key={m} onClick={() => setMax(max === m ? null : m)} className={`chip border ${max === m ? "bg-ink text-white border-ink" : "border-line bg-surface"}`}>Under ₹{m}</button>)}</div>
        {kinds.length > 1 && <div className="flex gap-1.5">{kinds.map((k) => <button key={k} onClick={() => setKind(kind === k ? null : k)} className={`chip border ${kind === k ? "bg-ink text-white border-ink" : "border-line bg-surface"}`}>{KIND[k]}</button>)}</div>}
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="input !w-auto !py-1.5 ml-auto">
          <option value="popular">Most popular</option><option value="rating">Top rated</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option>
        </select>
      </div>
      {list.length ? <ProductGrid products={list} /> : <p className="text-ink-3 py-12 text-center">Nothing matches those filters.</p>}
    </div>
  );
}
