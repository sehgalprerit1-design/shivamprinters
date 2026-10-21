"use client";
import { useMemo, useRef, useState } from "react";
import { Download, Upload, Search, Save, AlertTriangle, CheckCircle2 } from "lucide-react";

type V = { sku: string; category: string; product: string; slug: string; name: string; price: number; compareAt: number | null };
type O = { key: string; group: string; groupId: string; name: string; delta: number };
type Props = { initial: { variants: V[]; options: O[] }; mode: "github" | "local" | "none" };

const num = (s: string) => { const n = Math.round(Number(String(s).replace(/[₹,\s]/g, ""))); return Number.isFinite(n) ? n : NaN; };
const csvCell = (s: string | number | null) => { const t = s == null ? "" : String(s); return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
    else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export function PricingSheet({ initial, mode }: Props) {
  const [vars, setVars] = useState<V[]>(initial.variants);
  const [opts, setOpts] = useState<O[]>(initial.options);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"variants" | "options">("variants");
  const [msg, setMsg] = useState<{ kind: "ok" | "err" | "info"; text: string; url?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const dirty = useMemo(() => {
    const a = new Map(initial.variants.map((v) => [v.sku, v])); const b = new Map(initial.options.map((o) => [o.key, o]));
    return vars.filter((v) => { const x = a.get(v.sku)!; return x.price !== v.price || (x.compareAt ?? null) !== (v.compareAt ?? null); }).length + opts.filter((o) => b.get(o.key)!.delta !== o.delta).length;
  }, [vars, opts, initial]);

  const ql = q.trim().toLowerCase();
  const shownV = vars.filter((v) => !ql || `${v.category} ${v.product} ${v.name} ${v.sku}`.toLowerCase().includes(ql));
  const shownO = opts.filter((o) => !ql || `${o.group} ${o.name} ${o.key}`.toLowerCase().includes(ql));

  const setV = (sku: string, patch: Partial<V>) => setVars((xs) => xs.map((x) => (x.sku === sku ? { ...x, ...patch } : x)));
  const setO = (key: string, delta: number) => setOpts((xs) => xs.map((x) => (x.key === key ? { ...x, delta } : x)));

  function download() {
    const lines = [["type", "key", "category / option group", "product", "variant / choice", "price", "mrp"].map(csvCell).join(",")];
    for (const v of vars) lines.push(["variant", v.sku, v.category, v.product, v.name, v.price, v.compareAt].map(csvCell).join(","));
    for (const o of opts) lines.push(["option", o.key, o.group, "", o.name, o.delta, ""].map(csvCell).join(","));
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `shivam-prices-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
  }

  async function upload(file: File) {
    const rows = parseCsv(await file.text());
    const head = rows[0]?.map((h) => h.trim().toLowerCase()) ?? [];
    const col = (names: string[]) => head.findIndex((h) => names.some((n) => h.startsWith(n)));
    const iType = col(["type"]), iKey = col(["key", "sku"]), iPrice = col(["price"]), iMrp = col(["mrp", "compare"]);
    if (iKey < 0 || iPrice < 0) { setMsg({ kind: "err", text: "CSV needs at least 'key' (or 'sku') and 'price' columns. Download the sheet first and edit that file." }); return; }
    let applied = 0, skipped = 0;
    const nv = [...vars]; const no = [...opts];
    for (const r of rows.slice(1)) {
      const key = (r[iKey] ?? "").trim(); const type = iType >= 0 ? (r[iType] ?? "").trim().toLowerCase() : key.includes(":") ? "option" : "variant";
      const price = num(r[iPrice] ?? "");
      if (!key || Number.isNaN(price)) { skipped++; continue; }
      if (type === "option") { const i = no.findIndex((o) => o.key === key); if (i < 0) { skipped++; continue; } no[i] = { ...no[i], delta: price }; applied++; }
      else { const i = nv.findIndex((v) => v.sku === key); if (i < 0) { skipped++; continue; } const mraw = iMrp >= 0 ? (r[iMrp] ?? "").trim() : ""; const mrp = mraw === "" ? null : num(mraw); nv[i] = { ...nv[i], price, compareAt: Number.isNaN(mrp as number) ? nv[i].compareAt : mrp }; applied++; }
    }
    setVars(nv); setOpts(no);
    setMsg({ kind: "info", text: `Loaded ${applied} rows from ${file.name}${skipped ? ` (${skipped} skipped)` : ""}. Review below, then press Save & publish.` });
  }

  async function save() {
    const bad = vars.find((v) => v.compareAt != null && v.compareAt < v.price);
    if (bad) { setMsg({ kind: "err", text: `${bad.product} — ${bad.name}: MRP (₹${bad.compareAt}) is lower than price (₹${bad.price}).` }); return; }
    setBusy(true); setMsg(null);
    const body = { variants: Object.fromEntries(vars.map((v) => [v.sku, { price: v.price, compareAt: v.compareAt }])), options: Object.fromEntries(opts.map((o) => [o.key, o.delta])) };
    const r = await fetch("/api/admin/pricing", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) { setMsg({ kind: "err", text: j.error ?? "Could not publish" }); return; }
    setMsg({ kind: "ok", text: j.note, url: j.url });
  }

  const inp = "w-24 rounded-lg border border-line bg-surface px-2 py-1 text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-brand/30";
  const pct = (v: V) => (v.compareAt && v.compareAt > v.price ? `${Math.round((1 - v.price / v.compareAt) * 100)}% off` : "");

  return (
    <div>
      <p className="text-ink-2 text-sm mb-4">Edit prices like a spreadsheet, or download the CSV, change it in Excel and upload it back. Prices are inclusive of GST. {mode === "none" && <span className="text-brand font-semibold">Publishing isn&apos;t configured yet — add GITHUB_TOKEN in Vercel (see below).</span>}</p>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative"><Search size={14} className="absolute left-3 top-2.5 text-ink-3" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search product, variant, SKU…" className="rounded-xl border border-line bg-surface pl-8 pr-3 py-2 text-sm w-72" /></div>
        <div className="flex rounded-xl border border-line overflow-hidden text-sm">
          <button onClick={() => setTab("variants")} className={`px-3 py-2 ${tab === "variants" ? "bg-ink text-white" : "bg-surface"}`}>Products ({vars.length})</button>
          <button onClick={() => setTab("options")} className={`px-3 py-2 ${tab === "options" ? "bg-ink text-white" : "bg-surface"}`}>Option surcharges ({opts.length})</button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={download} className="btn btn-secondary !py-2 text-sm"><Download size={14} />Download CSV</button>
          <button onClick={() => fileRef.current?.click()} className="btn btn-secondary !py-2 text-sm"><Upload size={14} />Upload CSV</button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
          <button onClick={save} disabled={busy || dirty === 0} className="btn btn-primary !py-2 text-sm"><Save size={14} />{busy ? "Publishing…" : `Save & publish${dirty ? ` (${dirty})` : ""}`}</button>
        </div>
      </div>
      {msg && <div className={`mb-4 flex items-start gap-2 text-sm rounded-xl p-3 border ${msg.kind === "err" ? "bg-brand-soft border-brand/30 text-brand-ink" : msg.kind === "ok" ? "bg-accent-soft border-accent/30 text-accent" : "bg-surface-2 border-line text-ink-2"}`}>{msg.kind === "err" ? <AlertTriangle size={16} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={16} className="mt-0.5 shrink-0" />}<span>{msg.text}{msg.url && <> <a href={msg.url} target="_blank" rel="noopener noreferrer" className="underline">View change</a></>}</span></div>}

      {tab === "variants" ? (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left text-xs text-ink-3 sticky top-0"><tr><th className="p-2 pl-3">Category</th><th className="p-2">Product</th><th className="p-2">Variant</th><th className="p-2 text-ink-3 font-normal">SKU</th><th className="p-2 text-right">Price ₹</th><th className="p-2 text-right">MRP ₹</th><th className="p-2">Discount</th></tr></thead>
            <tbody>
              {shownV.map((v, i) => { const prev = shownV[i - 1]; const first = !prev || prev.slug !== v.slug; const changed = (() => { const x = initial.variants.find((y) => y.sku === v.sku)!; return x.price !== v.price || (x.compareAt ?? null) !== (v.compareAt ?? null); })(); return (
                <tr key={v.sku} className={`border-t ${first ? "border-line" : "border-line/40"} ${changed ? "bg-amber-50" : "hover:bg-surface-2"}`}>
                  <td className="p-2 pl-3 text-ink-3 text-xs">{first ? v.category : ""}</td>
                  <td className="p-2 font-medium">{first ? <a href={`/p/${v.slug}`} target="_blank" rel="noopener noreferrer" className="hover:text-brand">{v.product}</a> : ""}</td>
                  <td className="p-2 text-ink-2">{v.name}</td>
                  <td className="p-2 text-ink-3 text-xs font-mono">{v.sku}</td>
                  <td className="p-2 text-right"><input className={inp} inputMode="numeric" value={v.price} onChange={(e) => { const n = num(e.target.value); if (!Number.isNaN(n)) setV(v.sku, { price: n }); else if (e.target.value === "") setV(v.sku, { price: 0 }); }} /></td>
                  <td className="p-2 text-right"><input className={inp} inputMode="numeric" placeholder="—" value={v.compareAt ?? ""} onChange={(e) => { const t = e.target.value.trim(); if (t === "") setV(v.sku, { compareAt: null }); else { const n = num(t); if (!Number.isNaN(n)) setV(v.sku, { compareAt: n }); } }} /></td>
                  <td className="p-2 text-xs text-accent">{pct(v)}</td>
                </tr>
              ); })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left text-xs text-ink-3"><tr><th className="p-2 pl-3">Option group</th><th className="p-2">Choice</th><th className="p-2 text-ink-3 font-normal">Key</th><th className="p-2 text-right">Surcharge ₹ (per unit)</th></tr></thead>
            <tbody>
              {shownO.map((o, i) => { const first = !shownO[i - 1] || shownO[i - 1].groupId !== o.groupId; const changed = initial.options.find((y) => y.key === o.key)!.delta !== o.delta; return (
                <tr key={o.key} className={`border-t ${first ? "border-line" : "border-line/40"} ${changed ? "bg-amber-50" : "hover:bg-surface-2"}`}>
                  <td className="p-2 pl-3 font-medium">{first ? o.group : ""}</td>
                  <td className="p-2 text-ink-2">{o.name}</td>
                  <td className="p-2 text-ink-3 text-xs font-mono">{o.key}</td>
                  <td className="p-2 text-right"><input className={inp} inputMode="numeric" value={o.delta} onChange={(e) => { const n = num(e.target.value); if (!Number.isNaN(n)) setO(o.key, n); else if (e.target.value === "" || e.target.value === "-") setO(o.key, 0); }} /></td>
                </tr>
              ); })}
            </tbody>
          </table>
          <p className="p-3 text-xs text-ink-3">Surcharges are added per unit on top of the variant price when a customer picks that choice. Use 0 for included, negative for a discount.</p>
        </div>
      )}

      {mode === "none" && (
        <div className="card p-4 mt-6 text-sm text-ink-2">
          <div className="font-semibold text-ink mb-1">One-time setup to enable publishing</div>
          <ol className="list-decimal ml-5 space-y-1">
            <li>GitHub → Settings → Developer settings → Personal access tokens → <b>Fine-grained tokens</b> → Generate new token.</li>
            <li>Repository access: <b>Only select repositories → shivamprinters</b>. Permissions → Repository → <b>Contents: Read and write</b>. Expiry: 1 year.</li>
            <li>Copy the token into Vercel → shivamprinters → Settings → Environment Variables as <code>GITHUB_TOKEN</code>, then Redeploy.</li>
          </ol>
        </div>
      )}
    </div>
  );
}
