"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import type { Category } from "@/data/catalog";
import type { GiftPage } from "@/data/gifts";
import { SearchBox } from "./SearchBox";

export function MobileNav({ categories, occasions, recipients }: { categories: Category[]; occasions: GiftPage[]; recipients: GiftPage[] }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // Lock page scroll while the drawer is open; Escape closes it.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [open]);
  // The drawer is portalled to <body>: the sticky header's backdrop-blur would otherwise
  // become the containing block for position:fixed and clip the menu to the header's height.
  const drawer = open && mounted ? createPortal(
        <div className="fixed inset-0 z-[70] bg-black/40 md:hidden" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-sm bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] overflow-y-auto overscroll-contain shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <span className="display text-xl font-bold">Shivam <span className="text-brand">Printers</span></span>
              <button aria-label="Close" onClick={() => setOpen(false)} className="p-2"><X /></button>
            </div>
            <SearchBox />
            <div className="mt-5 text-xs font-semibold uppercase tracking-wide text-ink-3">Shop</div>
            {categories.filter((c) => c.slug !== "business-printing").map((c) => (
              <Link key={c.slug} href={`/c/${c.slug}`} onClick={() => setOpen(false)} className="block py-2.5 border-b border-line font-medium">{c.name}</Link>
            ))}
            <Link href="/c/business-printing" onClick={() => setOpen(false)} className="mt-3 inline-flex items-center rounded-full bg-amber-300 text-ink px-4 py-2 font-semibold">Business Printing</Link>
            <div className="mt-5 text-xs font-semibold uppercase tracking-wide text-ink-3">Gifts by occasion</div>
            {occasions.map((g) => (
              <Link key={g.slug} href={`/gifts/${g.slug}`} onClick={() => setOpen(false)} className="block py-2 text-ink-2">{g.title}</Link>
            ))}
            <div className="mt-5 text-xs font-semibold uppercase tracking-wide text-ink-3">Gifts for</div>
            {recipients.map((g) => (
              <Link key={g.slug} href={`/gifts/${g.slug}`} onClick={() => setOpen(false)} className="block py-2 text-ink-2">{g.title.replace("Gifts for ", "")}</Link>
            ))}
            <div className="mt-5 text-xs font-semibold uppercase tracking-wide text-ink-3">More</div>
            <Link href="/custom-printing" onClick={() => setOpen(false)} className="block py-2 text-ink-2">Custom printing — get a quote</Link>
            <Link href="/help" onClick={() => setOpen(false)} className="block py-2 text-ink-2">Help &amp; FAQ</Link>
            <Link href="/wishlist" onClick={() => setOpen(false)} className="block py-2 text-ink-2">Saved items</Link>
            <Link href="/account" onClick={() => setOpen(false)} className="btn btn-ghost w-full mt-4">Track your order</Link>
            <a href="tel:+919910888217" className="btn btn-secondary w-full mt-2">Call us 9910888217</a>
          </div>
        </div>, document.body) : null;
  return (
    <div className="md:hidden">
      <button aria-label="Menu" onClick={() => setOpen(true)} className="p-2 -ml-2"><Menu /></button>
      {drawer}
    </div>
  );
}
