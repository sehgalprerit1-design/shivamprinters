"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, AlertTriangle, Megaphone } from "lucide-react";
import type { Coupon } from "@/lib/coupons";

type Form = { id?: string; code: string; description: string; kind: "percent" | "flat"; value: string; maxOff: string; minOrder: string; startsAt: string; expiresAt: string; maxUses: string; showInBanner: boolean; active: boolean };
const empty: Form = { code: "", description: "", kind: "percent", value: "", maxOff: "", minOrder: "0", startsAt: "", expiresAt: "", maxUses: "", showInBanner: false, active: true };
const toIst = (d: Date | string | null | undefined) => (d ? new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) : ""); // yyyy-mm-dd in IST
const fmt = (d: Date | string | null | undefined) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "—");
const inp = "rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 w-full";

function status(c: Coupon) {
  const now = Date.now();
  if (!c.active) return ["Off", "bg-surface-2 text-ink-3"];
  if (c.startsAt && now < new Date(c.startsAt).getTime()) return ["Scheduled", "bg-blue-100 text-blue-900"];
  if (c.expiresAt && now > new Date(c.expiresAt).getTime()) return ["Expired", "bg-surface-2 text-ink-3"];
  if (c.maxUses != null && c.usedCount >= c.maxUses) return ["Used up", "bg-amber-100 text-amber-900"];
  return ["Live", "bg-accent-soft text-accent"];
}

export function CouponManager({ coupons }: { coupons: Coupon[] }) {
  const r = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const set = (k: keyof Form, v: string | boolean) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const edit = (c: Coupon) => setForm({ id: c.id, code: c.code, description: c.description ?? "", kind: c.percentOff ? "percent" : "flat", value: String(c.percentOff ?? c.flatOff ?? ""), maxOff: c.maxOff ? String(c.maxOff) : "", minOrder: String(c.minOrder ?? 0), startsAt: toIst(c.startsAt), expiresAt: toIst(c.expiresAt), maxUses: c.maxUses ? String(c.maxUses) : "", showInBanner: c.showInBanner, active: c.active });

  async function save(e: React.FormEvent) {
    e.preventDefault(); if (!form) return; setBusy(true); setErr("");
    const body = { id: form.id, code: form.code.toUpperCase().trim(), description: form.description, kind: form.kind, value: Number(form.value), maxOff: form.maxOff ? Number(form.maxOff) : null, minOrder: Number(form.minOrder) || 0, startsAt: form.startsAt || null, expiresAt: form.expiresAt || null, maxUses: form.maxUses ? Number(form.maxUses) : null, showInBanner: form.showInBanner, active: form.active };
    const res = await fetch("/api/admin/coupons", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const j = await res.json(); setBusy(false);
    if (!res.ok) { setErr(j.error ?? "Could not save"); return; }
    setForm(null); r.refresh();
  }
  async function remove(c: Coupon) {
    if (!confirm(`Delete ${c.code}? Customers won't be able to use it any more.`)) return;
    await fetch("/api/admin/coupons", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: c.id }) }); r.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-ink-2 text-sm">Codes are checked live in the cart and at checkout. Dates are in Indian time: a code starts at 00:00 on the start date and stops after 23:59 on the expiry date. The code marked <Megaphone size={12} className="inline" /> is advertised in the top bar of every page (within ~10 minutes).</p>
        <button onClick={() => { setForm({ ...empty }); setErr(""); }} className="btn btn-primary !py-2 text-sm shrink-0"><Plus size={14} />New coupon</button>
      </div>

      {form && (
        <form onSubmit={save} className="card p-5 mb-6 grid md:grid-cols-4 gap-3 text-sm bg-brand-soft/30">
          <div className="md:col-span-4 font-bold">{form.id ? `Edit ${form.code}` : "New coupon"}</div>
          <label className="block"><span className="text-xs text-ink-3">Code *</span><input className={`${inp} font-mono uppercase`} value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} placeholder="DIWALI20" required /></label>
          <label className="block"><span className="text-xs text-ink-3">Name / description</span><input className={inp} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Diwali offer" /></label>
          <label className="block"><span className="text-xs text-ink-3">Type *</span><select className={inp} value={form.kind} onChange={(e) => set("kind", e.target.value)}><option value="percent">Percentage off</option><option value="flat">Flat ₹ off</option></select></label>
          <label className="block"><span className="text-xs text-ink-3">{form.kind === "percent" ? "Percent off *" : "Amount off ₹ *"}</span><input className={inp} inputMode="numeric" value={form.value} onChange={(e) => set("value", e.target.value.replace(/\D/g, ""))} required /></label>
          {form.kind === "percent" && <label className="block"><span className="text-xs text-ink-3">Maximum discount ₹ (optional)</span><input className={inp} inputMode="numeric" value={form.maxOff} onChange={(e) => set("maxOff", e.target.value.replace(/\D/g, ""))} placeholder="1000" /></label>}
          <label className="block"><span className="text-xs text-ink-3">Minimum order ₹</span><input className={inp} inputMode="numeric" value={form.minOrder} onChange={(e) => set("minOrder", e.target.value.replace(/\D/g, ""))} /></label>
          <label className="block"><span className="text-xs text-ink-3">Start date</span><input type="date" className={inp} value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} /></label>
          <label className="block"><span className="text-xs text-ink-3">Expiry date</span><input type="date" className={inp} value={form.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} /></label>
          <label className="block"><span className="text-xs text-ink-3">Max redemptions (optional)</span><input className={inp} inputMode="numeric" value={form.maxUses} onChange={(e) => set("maxUses", e.target.value.replace(/\D/g, ""))} placeholder="unlimited" /></label>
          <label className="flex items-center gap-2 self-end"><input type="checkbox" checked={form.showInBanner} onChange={(e) => set("showInBanner", e.target.checked)} />Advertise in the top bar</label>
          <label className="flex items-center gap-2 self-end"><input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} />Active</label>
          {err && <div className="md:col-span-4 flex items-center gap-1 text-brand text-xs"><AlertTriangle size={14} />{err}</div>}
          <div className="md:col-span-4 flex gap-2"><button disabled={busy} className="btn btn-primary !py-2 text-sm">{busy ? "Saving…" : "Save coupon"}</button><button type="button" onClick={() => setForm(null)} className="btn btn-ghost !py-2 text-sm">Cancel</button></div>
        </form>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs text-ink-3"><tr><th className="p-3">Code</th><th className="p-3">Discount</th><th className="p-3">Min order</th><th className="p-3">Start</th><th className="p-3">Expiry</th><th className="p-3">Used</th><th className="p-3">Status</th><th className="p-3"></th></tr></thead>
          <tbody>
            {coupons.map((c) => { const [label, cls] = status(c); return (
              <tr key={c.id} className="border-t border-line hover:bg-surface-2">
                <td className="p-3"><div className="font-mono font-semibold">{c.code} {c.showInBanner && <Megaphone size={12} className="inline text-brand" />}</div><div className="text-xs text-ink-3">{c.description}</div></td>
                <td className="p-3">{c.percentOff ? `${c.percentOff}%${c.maxOff ? ` (max ₹${c.maxOff.toLocaleString("en-IN")})` : ""}` : `₹${(c.flatOff ?? 0).toLocaleString("en-IN")}`}</td>
                <td className="p-3">{c.minOrder ? `₹${c.minOrder.toLocaleString("en-IN")}` : "—"}</td>
                <td className="p-3 whitespace-nowrap">{fmt(c.startsAt)}</td><td className="p-3 whitespace-nowrap">{fmt(c.expiresAt)}</td>
                <td className="p-3">{c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ""}</td>
                <td className="p-3"><span className={`chip text-[11px] ${cls}`}>{label}</span></td>
                <td className="p-3 whitespace-nowrap"><button onClick={() => edit(c)} className="text-ink-3 hover:text-ink mr-3" aria-label="Edit"><Pencil size={14} /></button><button onClick={() => remove(c)} className="text-ink-3 hover:text-brand" aria-label="Delete"><Trash2 size={14} /></button></td>
              </tr>
            ); })}
            {coupons.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-ink-3">No coupons yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
