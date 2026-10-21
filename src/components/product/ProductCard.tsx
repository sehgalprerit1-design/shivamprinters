import Link from "next/link";
import { Star } from "lucide-react";
import { minPrice, maxCompare, type Product } from "@/data/catalog";
import { inr } from "@/lib/format";

export function ProductCard({ p, priority = false }: { p: Product; priority?: boolean }) {
  const price = minPrice(p);
  const compare = maxCompare(p);
  const pct = compare ? Math.round(((compare - price) / compare) * 100) : 0;
  return (
    <Link href={`/p/${p.slug}`} className="card group block">
      <div className="relative aspect-square bg-surface-2 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.image} alt={p.name} loading={priority ? "eager" : "lazy"} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
        {p.badges?.[0] && <span className="chip bg-white/90 text-ink absolute top-2 left-2">{p.badges[0]}</span>}
        {pct > 0 && <span className="chip bg-brand text-white absolute top-2 right-2">{pct}% off</span>}
      </div>
      <div className="p-3">
        <div className="font-semibold leading-tight line-clamp-2">{p.name}</div>
        <div className="flex items-center gap-1 text-xs text-ink-3 mt-1"><Star size={12} className="fill-gold text-gold" />{p.rating} · {p.reviews.toLocaleString("en-IN")}</div>
        <div className="mt-1.5 flex items-baseline gap-2"><span className="font-bold">From {inr(price)}</span>{compare && <span className="price-strike text-xs">{inr(compare)}</span>}</div>
      </div>
    </Link>
  );
}
