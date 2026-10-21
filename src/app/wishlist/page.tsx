"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useWishlist } from "@/lib/wishlist";
import { products } from "@/data/catalog";
import { ProductGrid } from "@/components/product/ProductGrid";

export default function Wishlist() {
  const { slugs } = useWishlist(); const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  const list = m ? slugs.map((s) => products.find((p) => p.slug === s)!).filter(Boolean) : [];
  return (
    <div className="container-x pt-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-6">Saved for later</h1>
      {m && list.length === 0 ? <div className="card p-12 text-center text-ink-2">Nothing saved yet. Tap the heart on any product.<br /><Link href="/products" className="btn btn-primary mt-4">Browse products</Link></div> : <ProductGrid products={list} />}
    </div>
  );
}
