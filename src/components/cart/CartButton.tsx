"use client";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useEffect, useState } from "react";

export function CartButton() {
  const count = useCart((s) => s.lines.reduce((a, l) => a + l.qty, 0));
  const setOpen = useCart((s) => s.setOpen);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <button onClick={() => setOpen(true)} className="btn btn-ghost !px-3 relative" aria-label="Cart">
      <ShoppingBag size={18} />
      <span className="hidden sm:inline text-sm">Cart</span>
      {mounted && count > 0 && <span className="absolute -top-1 -right-1 bg-brand text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1 grid place-items-center">{count}</span>}
    </button>
  );
}
