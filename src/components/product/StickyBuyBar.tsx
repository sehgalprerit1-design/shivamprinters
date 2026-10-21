"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { inr } from "@/lib/format";

export function StickyBuyBar({ name, price, href }: { name: string; price: number; href: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const f = () => setShow(window.scrollY > 500); f(); addEventListener("scroll", f); return () => removeEventListener("scroll", f); }, []);
  if (!show) return null;
  return (
    <div className="fixed bottom-0 inset-x-0 z-30 md:hidden bg-surface border-t border-line p-3 flex items-center gap-3 shadow-[0_-8px_24px_-12px_rgba(0,0,0,.2)]">
      <div className="min-w-0"><div className="font-semibold text-sm truncate">{name}</div><div className="text-xs text-ink-3">From {inr(price)}</div></div>
      <Link href={href} className="btn btn-primary ml-auto !py-2.5">Personalise</Link>
    </div>
  );
}
