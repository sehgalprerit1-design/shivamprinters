"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
const FLOW = ["IN_PRODUCTION", "SHIPPED", "DELIVERED", "CANCELLED"];
export function StatusButtons({ id, status, trackingUrl }: { id: string; status: string; trackingUrl: string }) {
  const [t, setT] = useState(trackingUrl); const [busy, setBusy] = useState(false); const r = useRouter();
  const set = async (s: string) => { setBusy(true); await fetch(`/api/admin/orders/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: s, trackingUrl: t || undefined }) }); setBusy(false); r.refresh(); };
  return (
    <div className="card p-4 text-sm space-y-2">
      <div className="font-bold">Update status</div>
      <input className="input !py-2" placeholder="Tracking URL (optional)" value={t} onChange={(e) => setT(e.target.value)} />
      <div className="flex flex-wrap gap-2">{FLOW.map((s) => <button key={s} disabled={busy || s === status} onClick={() => set(s)} className={`btn !py-1.5 text-xs ${s === "CANCELLED" ? "btn-ghost" : "btn-secondary"}`}>{s.replace(/_/g, " ")}</button>)}</div>
      <p className="text-xs text-ink-3">Marking as Shipped emails the customer with the tracking link.</p>
    </div>
  );
}
