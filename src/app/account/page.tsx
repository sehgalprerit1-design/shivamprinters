"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PackageSearch, AlertTriangle } from "lucide-react";
import { CallUs } from "@/components/ui/CallUs";

export default function TrackOrder() {
  const r = useRouter();
  const [number, setNumber] = useState(""); const [phone, setPhone] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const res = await fetch("/api/orders/lookup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ number, phone }) });
    const j = await res.json(); setBusy(false);
    if (!res.ok) { setErr(j.error ?? "Something went wrong"); return; }
    r.push(`/orders/${j.id}`);
  }
  return (
    <div className="container-x pt-10 max-w-md">
      <div className="w-12 h-12 rounded-full bg-brand-soft text-brand flex items-center justify-center"><PackageSearch size={22} /></div>
      <h1 className="text-3xl font-bold mt-4">Track your order</h1>
      <p className="text-ink-2 mt-2">No account needed. Enter the order number from your confirmation page or email and the mobile number you used at checkout.</p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <input className="input" placeholder="Order number (e.g. 1042)" inputMode="numeric" value={number} onChange={(e) => setNumber(e.target.value)} required />
        <div className="flex"><span className="inline-flex items-center px-3 border border-r-0 border-line rounded-l-[10px] bg-surface-2 text-sm text-ink-2">+91</span><input className="input !rounded-l-none" placeholder="10-digit mobile" inputMode="numeric" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value)} required /></div>
        {err && <div className="flex items-start gap-2 text-sm bg-brand-soft border border-brand/30 text-brand-ink rounded-xl p-3"><AlertTriangle size={16} className="mt-0.5 shrink-0" />{err}</div>}
        <button disabled={busy} className="btn btn-primary w-full">{busy ? "Looking up…" : "Find my order"}</button>
      </form>
      <div className="mt-6 text-sm text-ink-2">Your designs are saved with each order, so reorders print the same file — just tell us the order number.</div>
      <div className="mt-4"><CallUs whatsapp="Hi Shivam Printers, I'd like an update on my order." /></div>
    </div>
  );
}
