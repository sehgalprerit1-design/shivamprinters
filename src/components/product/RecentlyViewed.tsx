"use client";
import { useEffect, useState } from "react";
import { useRecent } from "@/lib/recent";
import { products } from "@/data/catalog";
import { ProductGrid } from "./ProductGrid";

export function RecentlyViewed({ current }: { current?: string }) {
  const { slugs, push } = useRecent();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); if (current) push(current); }, [current, push]);
  if (!mounted) return null;
  const list = slugs.filter((s) => s !== current).map((s) => products.find((p) => p.slug === s)!).filter(Boolean).slice(0, 4);
  if (!list.length) return null;
  return (
    <div className="mt-16"><h2 className="text-2xl font-bold mb-5">Recently viewed</h2><ProductGrid products={list} /></div>
  );
}
