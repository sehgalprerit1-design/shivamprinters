"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import type { NavItem } from "@/data/nav";
import type { GiftPage } from "@/data/gifts";
import { SearchBox } from "./SearchBox";

export function MobileNav({ items, occasions, recipients }: { items: NavItem[]; occasions: GiftPage[]; recipients: GiftPage[] }) {
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
  const close = () => setOpen(false);
  const main = items.filter((it) => it.kind === "category" || !it.group.highlight);
  const highlighted = items.filter((it): it is Extract<NavItem, { kind: "group" }> => it.kind === "group" && Boolean(it.group.highlight));
  // The drawer is portalled to <body>: the sticky header's backdrop-blur would otherwise
  // become the containing block for position:fixed and clip the menu to the header's height.
  const drawer = open && mounted ? createPortal(
        <div className="fixed inset-0 z-[70] bg-black/40 md:hidden" role="dialog" aria-modal="true" onClick={close}>
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-sm bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] overflow-y-auto overscroll-contain shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <span className="display text-xl font-bold">Shivam <span className="text-brand">Printers</span></span>
              <button aria-label="Close" onClick={close} className="p-2"><X /></button>
            </div>
            <SearchBox />
            <div className="mt-5 text-xs font-semibold uppercase tracking-wide text-ink-3">Shop</div>
            {main.map((it) => it.kind === "category" ? (
              <Link key={it.category.slug} href={`/c/${it.category.slug}`} onClick={close} className="block py-2.5 border-b border-line font-medium">{it.category.name}</Link>
            ) : (
              <div key={it.group.slug} className="border-b border-line py-2.5">
                <Link href={`/c/${it.group.slug}`} onClick={close} className="block font-medium">{it.group.name}</Link>
                {it.group.categories.map((c) => (
                  <Link key={c.slug} href={`/c/${c.slug}`} onClick={close} className="block py-1.5 pl-4 text-ink-2 text-sm">{c.name}</Link>
                ))}
              </div>
            ))}
            {highlighted.map((it) => (
              <div key={it.group.slug} className="mt-3">
                <Link href={`/c/${it.group.slug}`} onClick={close} className="inline-flex items-center rounded-full bg-amber-300 text-ink px-4 py-2 font-semibold">{it.group.name}</Link>
                {it.group.categories.filter((c) => c.slug !== it.group.slug).map((c) => (
                  <Link key={c.slug} href={`/c/${c.slug}`} onClick={close} className="block py-1.5 pl-4 mt-1 text-ink-2 text-sm">{c.name}</Link>
                ))}
                <Link href="/custom-printing" onClick={close} className="block py-1.5 pl-4 text-ink-2 text-sm">Custom printing — get a quote</Link>
              </div>
            ))}
            <div className="mt-5 text-xs font-semibold uppercase tracking-wide text-ink-3">Gifts by occasion</div>
            {occasions.map((g) => (
              <Link key={g.slug} href={`/gifts/${g.slug}`} onClick={close} className="block py-2 text-ink-2">{g.title}</Link>
            ))}
            <div className="mt-5 text-xs font-semibold uppercase tracking-wide text-ink-3">Gifts for</div>
            {recipients.map((g) => (
              <Link key={g.slug} href={`/gifts/${g.slug}`} onClick={close} className="block py-2 text-ink-2">{g.title.replace("Gifts for ", "")}</Link>
            ))}
            <div className="mt-5 text-xs font-semibold uppercase tracking-wide text-ink-3">More</div>
            <Link href="/help" onClick={close} className="block py-2 text-ink-2">Help &amp; FAQ</Link>
            <Link href="/wishlist" onClick={close} className="block py-2 text-ink-2">Saved items</Link>
            <Link href="/account" onClick={close} className="btn btn-ghost w-full mt-4">Track your order</Link>
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
