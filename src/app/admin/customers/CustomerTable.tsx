"use client";
import { useMemo, useState } from "react";
import { Download, Plus, Trash2, Search } from "lucide-react";
import type { Customer } from "@/lib/customers";

const SOURCE: Record<string, string> = { order: "Order", enquiry: "Enquiry", newsletter: "Sign-up", admin: "Added by you" };
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const when = (d: Date | string | null | undefined) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit", timeZone: "Asia/Kolkata" }) : "—");
const inp = "rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30";

export function CustomerTable({ initial }: { initial: Customer[] }) {
  const [rows, setRows] = useState<Customer[]>(initial);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "optin" | "buyers">("all");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", city: "" });
  const [err, setErr] = useState("");

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((c) => (filter === "optin" ? c.marketingOptIn : filter === "buyers" ? c.ordersCount > 0 : true))
      .filter((c) => !needle || [c.name, c.email, c.phone, c.company, c.city, c.tags.join(" ")].some((v) => (v ?? "").toLowerCase().includes(needle)));
  }, [rows, q, filter]);

  const optIn = rows.filter((c) => c.marketingOptIn).length, buyers = rows.filter((c) => c.ordersCount > 0).length;
  const month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0);
  const thisMonth = rows.filter((c) => new Date(c.createdAt) >= month).length;

  async function toggle(c: Customer) {
    const next = !c.marketingOptIn;
    setRows((rs) => rs.map((r) => (r.id === c.id ? { ...r, marketingOptIn: next } : r)));
    const res = await fetch("/api/admin/customers", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: c.id, marketingOptIn: next }) });
    if (!res.ok) setRows((rs) => rs.map((r) => (r.id === c.id ? { ...r, marketingOptIn: !next } : r)));
  }
  async function remove(c: Customer) {
    if (!confirm(`Delete ${c.name ?? c.email ?? c.phone}? Their orders stay; only the customer record goes.`)) return;
    await fetch("/api/admin/customers", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: c.id }) });
    setRows((rs) => rs.filter((r) => r.id !== c.id));
  }
  async function add(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    const res = await fetch("/api/admin/customers", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...form, marketingOptIn: true }) });
    const j = await res.json();
    if (!res.ok) { setErr(j.error ?? "Could not add"); return; }
    const fresh = await (await fetch("/api/admin/customers")).json();
    setRows(fresh.customers); setAdding(false); setForm({ name: "", phone: "", email: "", city: "" });
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[["All customers", rows.length, "orders, enquiries and sign-ups"], ["Opted in to offers", optIn, "can be emailed / WhatsApped"], ["Have ordered", buyers, "at least one order"], ["New this month", thisMonth, ""]].map(([t, n, d]) => (
          <div key={String(t)} className="card p-4"><div className="text-xs text-ink-3">{t}</div><div className="text-2xl font-bold">{n}</div><div className="text-xs text-ink-2">{d}</div></div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative"><Search size={14} className="absolute left-2.5 top-2.5 text-ink-3" /><input className={`${inp} pl-8 w-64`} placeholder="Search name, phone, email, city" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="flex gap-1.5">{([["all", "All"], ["optin", "Opted in"], ["buyers", "Buyers"]] as const).map(([k, l]) => <button key={k} onClick={() => setFilter(k)} className={`chip border ${filter === k ? "bg-ink text-white border-ink" : "border-line bg-surface"}`}>{l}</button>)}</div>
        <span className="text-ink-3 text-sm">{list.length} shown</span>
        <div className="ml-auto flex gap-2">
          <a href="/api/admin/customers?format=csv&optin=1" className="btn btn-secondary !py-2 text-sm"><Download size={14} />Opted-in CSV</a>
          <a href="/api/admin/customers?format=csv" className="btn btn-ghost !py-2 text-sm"><Download size={14} />All CSV</a>
          <button onClick={() => setAdding((v) => !v)} className="btn btn-primary !py-2 text-sm"><Plus size={14} />Add</button>
        </div>
      </div>
      {adding && (
        <form onSubmit={add} className="card p-4 mb-4 flex flex-wrap gap-2 items-end bg-brand-soft/30">
          <label className="block text-xs text-ink-3">Name<input className={`${inp} block w-44`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="block text-xs text-ink-3">Mobile<input className={`${inp} block w-36`} inputMode="numeric" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <label className="block text-xs text-ink-3">Email<input className={`${inp} block w-56`} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label className="block text-xs text-ink-3">City<input className={`${inp} block w-36`} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
          <button className="btn btn-primary !py-2 text-sm">Save</button><button type="button" onClick={() => setAdding(false)} className="btn btn-ghost !py-2 text-sm">Cancel</button>
          {err && <span className="text-brand text-xs w-full">{err}</span>}
        </form>
      )}
      <p className="text-ink-3 text-xs mb-3">Everyone who orders, sends an enquiry or signs up in the footer lands here automatically — one row per person, matched by phone or email. &ldquo;Offers&rdquo; is the consent they gave at checkout; switch it off if someone asks to stop. The opted-in CSV opens in Excel and imports into WhatsApp Business broadcast lists or any email tool.</p>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs text-ink-3"><tr><th className="p-3">Customer</th><th className="p-3">Contact</th><th className="p-3">Place</th><th className="p-3">From</th><th className="p-3">Orders</th><th className="p-3">Spent</th><th className="p-3">Last order</th><th className="p-3">Added</th><th className="p-3">Offers</th><th className="p-3"></th></tr></thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} className="border-t border-line hover:bg-surface-2">
                <td className="p-3"><div className="font-semibold">{c.name ?? <span className="text-ink-3 font-normal">—</span>}</div>{c.company && <div className="text-xs text-ink-3">{c.company}</div>}</td>
                <td className="p-3 whitespace-nowrap">{c.phone && <div><a className="text-brand" href={`tel:+91${c.phone}`}>{c.phone}</a> <a className="text-[#128C7E] text-xs" href={`https://wa.me/91${c.phone}`} target="_blank" rel="noopener noreferrer">WhatsApp</a></div>}{c.email && <div className="text-xs"><a className="text-brand" href={`mailto:${c.email}`}>{c.email}</a></div>}</td>
                <td className="p-3 text-ink-2">{[c.city, c.state].filter(Boolean).join(", ") || "—"}</td>
                <td className="p-3 text-xs text-ink-2">{SOURCE[c.source] ?? c.source}</td>
                <td className="p-3">{c.ordersCount}</td>
                <td className="p-3">{c.totalSpent ? inr(c.totalSpent) : "—"}</td>
                <td className="p-3 whitespace-nowrap text-ink-2">{when(c.lastOrderAt)}</td>
                <td className="p-3 whitespace-nowrap text-ink-3 text-xs">{when(c.createdAt)}</td>
                <td className="p-3"><button onClick={() => toggle(c)} className={`chip text-[11px] border ${c.marketingOptIn ? "bg-accent-soft text-accent border-transparent" : "bg-surface-2 text-ink-3 border-line"}`} aria-label={c.marketingOptIn ? "Opted in — click to opt out" : "Opted out — click to opt in"}>{c.marketingOptIn ? "Yes" : "No"}</button></td>
                <td className="p-3"><button onClick={() => remove(c)} className="text-ink-3 hover:text-brand" aria-label="Delete"><Trash2 size={14} /></button></td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={10} className="p-8 text-center text-ink-3">{rows.length === 0 ? "No customers yet — the first order or enquiry will appear here." : "Nothing matches."}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
