"use client";
import { useState } from "react";
import { Tag } from "lucide-react";
import { useCart } from "@/lib/cart";

/** Coupon entry used in the cart drawer, cart page and checkout. Shows the applied code with a remove link once one is on. */
export function CouponBox({ compact = false }: { compact?: boolean }) {
  const { coupon, applyCoupon, removeCoupon } = useCart();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (coupon) {
    return (
      <div className="flex items-center justify-between gap-2 text-sm rounded-xl bg-accent-soft text-accent px-3 py-2">
        <span className="inline-flex items-center gap-1.5 font-semibold"><Tag size={14} />{coupon.code} applied{coupon.description && !compact ? <span className="font-normal text-accent/80"> · {coupon.description}</span> : null}</span>
        <button type="button" onClick={() => { removeCoupon(); setMsg(null); }} className="text-xs underline underline-offset-2 text-accent/80 hover:text-accent">Remove</button>
      </div>
    );
  }
  return (
    <div>
      <form
        onSubmit={async (e) => { e.preventDefault(); if (!code.trim() || busy) return; setBusy(true); const r = await applyCoupon(code); setMsg({ ok: r.ok, text: r.message }); setBusy(false); if (r.ok) setCode(""); }}
        className="flex gap-2"
      >
        <input className="input !py-2 flex-1 min-w-0 uppercase placeholder:normal-case" placeholder="Have a coupon code?" value={code} onChange={(e) => setCode(e.target.value)} autoCapitalize="characters" autoCorrect="off" spellCheck={false} aria-label="Coupon code" />
        <button disabled={busy || !code.trim()} className="btn btn-ghost !py-2 disabled:opacity-50">{busy ? "…" : "Apply"}</button>
      </form>
      {msg && <div className={`text-xs mt-1.5 ${msg.ok ? "text-accent" : "text-brand"}`}>{msg.text}</div>}
    </div>
  );
}
