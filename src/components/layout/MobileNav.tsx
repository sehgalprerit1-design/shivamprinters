"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import type { Category } from "@/data/catalog";
import type { GiftPage } from "@/data/gifts";
import { SearchBox } from "./SearchBox";

export function MobileNav({ categories, occasions, recipients }: { categories: Category[]; occasions: GiftPage[]; recipients: GiftPage[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button aria-label="Menu" onClick={() => setOpen(true)} className="p-2 -ml-2"><Menu /></button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)}>
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-sm bg-surface p-5 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <span className="display text-xl font-bold">Shivam <span className="text-brand">Printers</span></span>
              <button aria-label="Close" onClick={() => setOpen(false)} className="p-2"><X /></button>
            </div>
            <SearchBox />
            <div className="mt-5 text-xs font-semibold uppercase tracking-wide text-ink-3">Shop</div>
            {categories.map((c) => (
              <Link key={c.slug} href={`/c/${c.slug}`} onClick={() => setOpen(false)} className="block py-2.5 border-b border-line font-medium">{c.name}</Link>
            ))}
            <div className="mt-5 text-xs font-semibold uppercase tracking-wide text-ink-3">Gifts by occasion</div>
            {occasions.map((g) => (
              <Link key={g.slug} href={`/gifts/${g.slug}`} onClick={() => setOpen(false)} className="block py-2 text-ink-2">{g.title}</Link>
            ))}
            <div className="mt-5 text-xs font-semibold uppercase tracking-wide text-ink-3">Gifts for</div>
            {recipients.map((g) => (
              <Link key={g.slug} href={`/gifts/${g.slug}`} onClick={() => setOpen(false)} className="block py-2 text-ink-2">{g.title.replace("Gifts for ", "")}</Link>
            ))}
            <Link href="/account" onClick={() => setOpen(false)} className="btn btn-ghost w-full mt-6">Account & orders</Link>
          </div>
        </div>
      )}
    </div>
  );
}
