import type { Metadata } from "next";
import Link from "next/link";
import { products } from "@/data/catalog";
import { giftPages } from "@/data/gifts";
import { ProductGrid } from "@/components/product/ProductGrid";

export const metadata: Metadata = { title: "Search", robots: { index: false } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim().toLowerCase();
  const words = q.split(/\s+/).filter(Boolean);
  const score = (hay: string) => words.reduce((a, w) => a + (hay.includes(w) ? 1 : 0), 0);
  const hits = products.map((p) => ({ p, s: score(`${p.name} ${p.description} ${p.tags.join(" ")} ${p.category}`.toLowerCase()) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).map((x) => x.p);
  const pages = giftPages.filter((g) => score(g.title.toLowerCase()) > 0).slice(0, 8);
  return (
    <div className="container-x pt-8">
      <h1 className="text-2xl md:text-4xl font-bold">{q ? <>Results for “{q}”</> : "Search"}</h1>
      {pages.length > 0 && <div className="flex flex-wrap gap-2 mt-4">{pages.map((g) => <Link key={g.slug} href={`/gifts/${g.slug}`} className="chip bg-brand-soft text-brand-ink">{g.title}</Link>)}</div>}
      <div className="mt-6">{hits.length ? <ProductGrid products={hits} /> : <p className="text-ink-3">No products matched. Try “frame”, “mug”, “calendar” or an occasion.</p>}</div>
    </div>
  );
}
