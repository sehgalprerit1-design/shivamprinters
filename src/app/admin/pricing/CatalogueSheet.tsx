"use client";
import { useMemo, useRef, useState } from "react";
import { Download, Upload, Search, Save, AlertTriangle, CheckCircle2, Plus, Trash2, ChevronDown, ChevronRight, EyeOff, Eye, ImagePlus } from "lucide-react";
import type { CatalogueState } from "@/lib/catalogue";

type Cat = CatalogueState["categories"][number];
type Prod = CatalogueState["products"][number];
type Props = { initial: CatalogueState & { baseSlugs: string[]; optionGroups: { key: string; group: string; groupId: string; name: string; delta: number }[]; aspectPresets: [string, number][] }; mode: "github" | "local" | "none" };

const num = (s: string) => { const n = Math.round(Number(String(s).replace(/[₹,\s]/g, ""))); return Number.isFinite(n) ? n : NaN; };
const csvCell = (s: string | number | null | undefined) => { const t = s == null ? "" : String(s); return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
const KIND_LABEL: Record<Prod["personalisation"], string> = { photo: "1 photo", "photo+text": "Photo + text", "multi-photo": "Many photos", text: "Text / name only", none: "Ready-made (no editor)" };
function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let q = false;
  for (let i = 0; i < text.length; i++) { const ch = text[i]; if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; } else if (ch === '"') q = true; else if (ch === ",") { row.push(cell); cell = ""; } else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; } else cell += ch; }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

const inp = "rounded-lg border border-line bg-surface px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30";
const numInp = `${inp} w-24 text-right tabular-nums`;

export function CatalogueSheet({ initial, mode }: Props) {
  const [cats, setCats] = useState<Cat[]>(initial.categories);
  const [prods, setProds] = useState<Prod[]>(initial.products);
  const [opts, setOpts] = useState<Record<string, number>>(initial.options);
  const [tab, setTab] = useState<"products" | "options" | "categories">("products");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState<string | null>(null); // category slug where a new product form is open
  const [msg, setMsg] = useState<{ kind: "ok" | "err" | "info"; text: string; url?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const baseSlugs = useMemo(() => new Set(initial.baseSlugs), [initial.baseSlugs]);

  const dirty = useMemo(() => JSON.stringify({ cats, prods, opts }) !== JSON.stringify({ cats: initial.categories, prods: initial.products, opts: initial.options }), [cats, prods, opts, initial]);
  const changedProd = (p: Prod) => JSON.stringify(p) !== JSON.stringify(initial.products.find((x) => x.slug === p.slug) ?? null);

  const setP = (slug: string, patch: Partial<Prod> | ((p: Prod) => Prod)) => setProds((xs) => xs.map((x) => (x.slug === slug ? (typeof patch === "function" ? patch(x) : { ...x, ...patch }) : x)));
  const setV = (slug: string, i: number, patch: Partial<Prod["variants"][number]>) => setP(slug, (p) => ({ ...p, variants: p.variants.map((v, k) => (k === i ? { ...v, ...patch } : v)) }));
  const addVariant = (slug: string) => setP(slug, (p) => { const last = p.variants[p.variants.length - 1]; const skuBase = (last?.sku ?? slug.toUpperCase()).replace(/-\d+$/, ""); return { ...p, variants: [...p.variants, { sku: `${skuBase}-${p.variants.length + 1}`, name: "", price: last?.price ?? 0, compareAt: last?.compareAt ?? null }] }; });
  const removeVariant = (slug: string, i: number) => setP(slug, (p) => (p.variants.length > 1 ? { ...p, variants: p.variants.filter((_, k) => k !== i) } : p));
  const toggle = (slug: string) => setOpen((s) => { const n = new Set(s); if (n.has(slug)) n.delete(slug); else n.add(slug); return n; });

  async function uploadImage(file: File): Promise<string> {
    const r = await fetch("/api/upload", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ filename: file.name, mime: file.type || "image/jpeg", bytes: file.size }) });
    const j = await r.json(); if (!r.ok) throw new Error(j.error ?? "Upload failed");
    if (!j.url) throw new Error("Photo storage isn't configured, so images can't be uploaded here yet.");
    const put = await fetch(j.url, { method: "PUT", body: file, headers: { "content-type": file.type || "image/jpeg" } }); if (!put.ok) throw new Error(`Image upload failed (${put.status})`);
    return `/api/img?key=${encodeURIComponent(j.key)}`;
  }

  function download() {
    const lines = [["type", "key", "category", "product", "variant / choice", "price", "mrp", "product slug"].map(csvCell).join(",")];
    for (const p of prods) for (const v of p.variants) lines.push(["variant", v.sku, cats.find((c) => c.slug === p.category)?.name ?? p.category, p.name, v.name, v.price, v.compareAt, p.slug].map(csvCell).join(","));
    for (const o of initial.optionGroups) lines.push(["option", o.key, o.group, "", o.name, opts[o.key] ?? o.delta, "", ""].map(csvCell).join(","));
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `shivam-catalogue-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
  }
  async function upload(file: File) {
    const rows = parseCsv(await file.text()); const head = rows[0]?.map((h) => h.trim().toLowerCase()) ?? [];
    const col = (names: string[]) => head.findIndex((h) => names.some((n) => h.startsWith(n)));
    const iType = col(["type"]), iKey = col(["key", "sku"]), iPrice = col(["price"]), iMrp = col(["mrp", "compare"]), iVar = col(["variant"]), iProd = col(["product"]);
    if (iKey < 0 || iPrice < 0) { setMsg({ kind: "err", text: "CSV needs 'key' (or 'sku') and 'price' columns. Download the sheet first and edit that file." }); return; }
    let applied = 0, skipped = 0; const np = prods.map((p) => ({ ...p, variants: p.variants.map((v) => ({ ...v })) })); const no = { ...opts };
    for (const r of rows.slice(1)) {
      const key = (r[iKey] ?? "").trim(); const type = iType >= 0 ? (r[iType] ?? "").trim().toLowerCase() : key.includes(":") ? "option" : "variant"; const price = num(r[iPrice] ?? "");
      if (!key || Number.isNaN(price)) { skipped++; continue; }
      if (type === "option") { if (key in no || initial.optionGroups.some((o) => o.key === key)) { no[key] = price; applied++; } else skipped++; continue; }
      let hit = false;
      for (const p of np) { const v = p.variants.find((x) => x.sku === key); if (!v) continue; hit = true; v.price = price; const mraw = iMrp >= 0 ? (r[iMrp] ?? "").trim() : ""; if (mraw !== "") { const m = num(mraw); if (!Number.isNaN(m)) v.compareAt = m; } else if (iMrp >= 0) v.compareAt = null; if (iVar >= 0 && (r[iVar] ?? "").trim()) v.name = r[iVar].trim(); if (iProd >= 0 && (r[iProd] ?? "").trim()) p.name = r[iProd].trim(); }
      if (hit) applied++; else skipped++;
    }
    setProds(np); setOpts(no); setMsg({ kind: "info", text: `Loaded ${applied} rows from ${file.name}${skipped ? ` (${skipped} skipped — unknown SKU or bad price)` : ""}. Review, then Save & publish.` });
  }

  async function save() {
    setBusy(true); setMsg(null);
    const r = await fetch("/api/admin/pricing", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ categories: cats, products: prods, options: opts }) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) { setMsg({ kind: "err", text: j.error ?? "Could not publish" }); return; }
    setMsg({ kind: "ok", text: j.note, url: j.url });
  }

  const ql = q.trim().toLowerCase();
  const visible = prods.filter((p) => !p.deleted && (!ql || `${p.name} ${p.slug} ${p.variants.map((v) => v.sku + " " + v.name).join(" ")}`.toLowerCase().includes(ql)));
  const byCat = cats.map((c) => ({ c, items: visible.filter((p) => p.category === c.slug) }));

  return (
    <div>
      <p className="text-ink-2 text-sm mb-4">Edit names, variants, SKUs and prices like a spreadsheet, add variants or whole products, or download the CSV, change it in Excel and upload it back. Changes go live ~2–3 minutes after you press <b>Save &amp; publish</b>. Prices are inclusive of GST. {mode === "none" && <span className="text-brand font-semibold">Publishing isn&apos;t configured yet — add GITHUB_TOKEN in Vercel.</span>}</p>
      <div className="flex flex-wrap items-center gap-2 mb-4 sticky top-[7.5rem] z-10 bg-bg/95 backdrop-blur py-2">
        <div className="relative"><Search size={14} className="absolute left-3 top-2.5 text-ink-3" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search product, variant, SKU…" className="rounded-xl border border-line bg-surface pl-8 pr-3 py-2 text-sm w-64" /></div>
        <div className="flex rounded-xl border border-line overflow-hidden text-sm">
          {([["products", `Products (${prods.filter((p) => !p.deleted).length})`], ["options", `Option surcharges (${initial.optionGroups.length})`], ["categories", `Categories (${cats.length})`]] as const).map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`px-3 py-2 ${tab === k ? "bg-ink text-white" : "bg-surface"}`}>{l}</button>)}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={download} className="btn btn-secondary !py-2 text-sm"><Download size={14} />CSV</button>
          <button onClick={() => fileRef.current?.click()} className="btn btn-secondary !py-2 text-sm"><Upload size={14} />Upload CSV</button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
          <button onClick={save} disabled={busy || !dirty} className="btn btn-primary !py-2 text-sm"><Save size={14} />{busy ? "Publishing…" : "Save & publish"}</button>
        </div>
      </div>
      {msg && <div className={`mb-4 flex items-start gap-2 text-sm rounded-xl p-3 border ${msg.kind === "err" ? "bg-brand-soft border-brand/30 text-brand-ink" : msg.kind === "ok" ? "bg-accent-soft border-accent/30 text-accent" : "bg-surface-2 border-line text-ink-2"}`}>{msg.kind === "err" ? <AlertTriangle size={16} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={16} className="mt-0.5 shrink-0" />}<span>{msg.text}{msg.url && <> <a href={msg.url} target="_blank" rel="noopener noreferrer" className="underline">View change</a></>}</span></div>}

      {tab === "products" && (
        <div className="space-y-6">
          {byCat.map(({ c, items }) => (
            <section key={c.slug} className="card">
              <div className="flex items-center justify-between px-4 py-3 bg-surface-2 border-b border-line">
                <div className="font-bold">{c.name} <span className="text-ink-3 font-normal text-sm">· {items.length} product{items.length === 1 ? "" : "s"}</span></div>
                <button onClick={() => setAdding(adding === c.slug ? null : c.slug)} className="btn btn-ghost !py-1.5 text-xs"><Plus size={14} />Add product</button>
              </div>
              {adding === c.slug && <NewProductForm category={c.slug} presets={initial.aspectPresets} existing={new Set(prods.map((p) => p.slug))} uploadImage={uploadImage} onCancel={() => setAdding(null)} onCreate={(p) => { setProds((xs) => [...xs, p]); setOpen((s) => new Set(s).add(p.slug)); setAdding(null); }} />}
              <div className="overflow-x-auto"><table className="w-full min-w-[1080px] text-sm table-fixed">
                <colgroup><col className="w-9" /><col className="w-[30%]" /><col className="w-44" /><col className="w-[22%]" /><col className="w-40" /><col className="w-28" /><col className="w-28" /><col className="w-24" /></colgroup>
                <thead className="text-left text-xs text-ink-3"><tr><th className="p-2 pl-3"></th><th className="p-2">Product</th><th className="p-2">Category</th><th className="p-2">Variant</th><th className="p-2">SKU</th><th className="p-2 text-right">Price ₹</th><th className="p-2 text-right">MRP ₹</th><th className="p-2"></th></tr></thead>
                <tbody>
                  {items.map((p) => { const isOpen = open.has(p.slug); const ch = changedProd(p); return [...p.variants.map((v, i) => (
                    <tr key={`${p.slug}-${i}`} className={`border-t ${i === 0 ? "border-line" : "border-line/40"} ${p.hidden ? "opacity-50" : ""} ${ch ? "bg-amber-50" : ""}`}>
                      <td className="p-2 pl-3 align-top">{i === 0 && <button onClick={() => toggle(p.slug)} className="text-ink-3 hover:text-ink" aria-label="More">{isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button>}</td>
                      <td className="p-2 align-top">{i === 0 && <div className="flex items-center gap-2"><input className={`${inp} w-full font-medium`} value={p.name} onChange={(e) => setP(p.slug, { name: e.target.value })} />{p.hidden && <span className="chip bg-surface-2 text-ink-3 text-[10px]">hidden</span>}{!baseSlugs.has(p.slug) && <span className="chip bg-brand-soft text-brand-ink text-[10px]">new</span>}</div>}
</td>
                      <td className="p-2 align-top">{i === 0 && <select className={`${inp} w-full`} value={p.category} onChange={(e) => setP(p.slug, { category: e.target.value })}>{cats.map((x) => <option key={x.slug} value={x.slug}>{x.name}</option>)}</select>}</td>
                      <td className="p-2 align-top"><input className={`${inp} w-full`} placeholder='e.g. 8x8", 20 pages' value={v.name} onChange={(e) => setV(p.slug, i, { name: e.target.value })} /></td>
                      <td className="p-2 align-top"><input className={`${inp} w-full font-mono text-xs`} value={v.sku} onChange={(e) => setV(p.slug, i, { sku: e.target.value.toUpperCase().replace(/[^A-Z0-9._-]/g, "") })} /></td>
                      <td className="p-2 align-top text-right"><input className={numInp} inputMode="numeric" value={v.price} onChange={(e) => { const n = num(e.target.value); setV(p.slug, i, { price: Number.isNaN(n) ? 0 : n }); }} /></td>
                      <td className="p-2 align-top text-right"><input className={numInp} inputMode="numeric" placeholder="—" value={v.compareAt ?? ""} onChange={(e) => { const t = e.target.value.trim(); setV(p.slug, i, { compareAt: t === "" ? null : Number.isNaN(num(t)) ? v.compareAt : num(t) }); }} /></td>
                      <td className="p-2 align-top whitespace-nowrap">
                        {p.variants.length > 1 && <button onClick={() => removeVariant(p.slug, i)} className="text-ink-3 hover:text-brand mr-2" title="Remove variant"><Trash2 size={14} /></button>}
                        {i === p.variants.length - 1 && <button onClick={() => addVariant(p.slug)} className="text-brand text-xs font-semibold inline-flex items-center gap-1"><Plus size={12} />variant</button>}
                      </td>
                    </tr>
                  )), isOpen ? <tr key={`${p.slug}-details`} className={ch ? "bg-amber-50" : ""}><td /><td colSpan={7} className="p-2 pr-3"><ProductDetails p={p} cats={cats} presets={initial.aspectPresets} setP={setP} uploadImage={uploadImage} isBase={baseSlugs.has(p.slug)} /></td></tr> : null]; })}
                  {items.length === 0 && <tr><td colSpan={8} className="p-4 text-ink-3 text-sm">No products here yet.</td></tr>}
                </tbody>
              </table></div>
            </section>
          ))}
        </div>
      )}

      {tab === "options" && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left text-xs text-ink-3"><tr><th className="p-2 pl-3">Option group</th><th className="p-2">Choice</th><th className="p-2 text-ink-3 font-normal">Key</th><th className="p-2 text-right">Surcharge ₹ (per unit)</th></tr></thead>
            <tbody>
              {initial.optionGroups.filter((o) => !ql || `${o.group} ${o.name} ${o.key}`.toLowerCase().includes(ql)).map((o, i, arr) => { const first = !arr[i - 1] || arr[i - 1].groupId !== o.groupId; const val = opts[o.key] ?? o.delta; const changed = val !== (initial.options[o.key] ?? o.delta); return (
                <tr key={o.key} className={`border-t ${first ? "border-line" : "border-line/40"} ${changed ? "bg-amber-50" : "hover:bg-surface-2"}`}>
                  <td className="p-2 pl-3 font-medium">{first ? o.group : ""}</td><td className="p-2 text-ink-2">{o.name}</td><td className="p-2 text-ink-3 text-xs font-mono">{o.key}</td>
                  <td className="p-2 text-right"><input className={numInp} inputMode="numeric" value={val} onChange={(e) => { const n = num(e.target.value); setOpts({ ...opts, [o.key]: Number.isNaN(n) ? 0 : n }); }} /></td>
                </tr>
              ); })}
            </tbody>
          </table>
          <p className="p-3 text-xs text-ink-3">Surcharges are added per unit on top of the variant price when a customer picks that choice. 0 = included, negative = discount.</p>
        </div>
      )}

      {tab === "categories" && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left text-xs text-ink-3"><tr><th className="p-2 pl-3">Slug (URL)</th><th className="p-2">Name (menu tab)</th><th className="p-2">Tagline</th><th className="p-2">Description</th></tr></thead>
            <tbody>{cats.map((c) => { const changed = JSON.stringify(c) !== JSON.stringify(initial.categories.find((x) => x.slug === c.slug)); return (
              <tr key={c.slug} className={`border-t border-line ${changed ? "bg-amber-50" : ""}`}>
                <td className="p-2 pl-3 font-mono text-xs text-ink-3">/c/{c.slug}</td>
                <td className="p-2"><input className={`${inp} w-44`} value={c.name} onChange={(e) => setCats((xs) => xs.map((x) => (x.slug === c.slug ? { ...x, name: e.target.value } : x)))} /></td>
                <td className="p-2"><input className={`${inp} w-56`} value={c.tagline} onChange={(e) => setCats((xs) => xs.map((x) => (x.slug === c.slug ? { ...x, tagline: e.target.value } : x)))} /></td>
                <td className="p-2"><textarea className={`${inp} w-full min-w-[280px]`} rows={2} value={c.description} onChange={(e) => setCats((xs) => xs.map((x) => (x.slug === c.slug ? { ...x, description: e.target.value } : x)))} /></td>
              </tr>
            ); })}</tbody>
          </table>
          <p className="p-3 text-xs text-ink-3">Category URLs and menu order are fixed in code; names, taglines and descriptions can be changed here.</p>
        </div>
      )}

      {mode === "none" && (
        <div className="card p-4 mt-6 text-sm text-ink-2">
          <div className="font-semibold text-ink mb-1">One-time setup to enable publishing</div>
          <ol className="list-decimal ml-5 space-y-1">
            <li>GitHub → Settings → Developer settings → Personal access tokens → <b>Fine-grained tokens</b> → Generate new token.</li>
            <li>Repository access: <b>Only select repositories → shivamprinters</b>. Permissions → Repository → <b>Contents: Read and write</b>.</li>
            <li>Copy the token into Vercel → shivamprinters → Settings → Environment Variables as <code>GITHUB_TOKEN</code>, then Redeploy.</li>
          </ol>
        </div>
      )}
    </div>
  );
}

function ProductDetails({ p, cats, presets, setP, uploadImage, isBase }: { p: Prod; cats: Cat[]; presets: [string, number][]; setP: (slug: string, patch: Partial<Prod>) => void; uploadImage: (f: File) => Promise<string>; isBase: boolean }) {
  const [imgErr, setImgErr] = useState(""); const [uploading, setUploading] = useState(false);
  void cats;
  return (
    <div className="p-3 rounded-xl bg-surface-2 border border-line space-y-2 text-xs w-full">
      <label className="block"><span className="text-ink-3">Description (shown on the product page)</span><textarea className={`${inp} w-full mt-1`} rows={3} value={p.description} onChange={(e) => setP(p.slug, { description: e.target.value })} /></label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block"><span className="text-ink-3">Badges (comma-separated, e.g. Bestseller)</span><input className={`${inp} w-full mt-1`} value={(p.badges ?? []).join(", ")} onChange={(e) => setP(p.slug, { badges: e.target.value.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 3) })} /></label>
        <label className="block"><span className="text-ink-3">Tags for gift pages (comma-separated)</span><input className={`${inp} w-full mt-1`} value={p.tags.join(", ")} onChange={(e) => setP(p.slug, { tags: e.target.value.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean) })} /></label>
      </div>
      <div>
        <div className="text-ink-3 mb-1">Images — first is the main photo; the rest show in the gallery (up to 6). Click a gallery image to make it the main one.</div>
        <div className="flex flex-wrap items-center gap-2">
          {[p.image, ...(p.images ?? [])].map((src, i) => (
            <div key={`${src}-${i}`} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" title={i === 0 ? "Main image" : "Click to make main"} onClick={() => { if (i === 0) return; const rest = (p.images ?? []).filter((_, k) => k !== i - 1); setP(p.slug, { image: src, images: [p.image, ...rest].slice(0, 6) }); }} className={`w-16 h-16 rounded-lg object-cover border bg-surface ${i === 0 ? "border-brand ring-2 ring-brand/30" : "border-line cursor-pointer hover:opacity-80"}`} />
              {i > 0 && <button type="button" onClick={() => setP(p.slug, { images: (p.images ?? []).filter((_, k) => k !== i - 1) })} className="absolute -top-1.5 -right-1.5 bg-ink text-white rounded-full w-5 h-5 text-[10px] leading-5 text-center opacity-0 group-hover:opacity-100" aria-label="Remove image">✕</button>}
              {i === 0 && <span className="absolute bottom-0 inset-x-0 bg-brand text-white text-[9px] text-center rounded-b-lg">main</span>}
            </div>
          ))}
          <label className="btn btn-ghost !py-1.5 text-xs cursor-pointer"><ImagePlus size={14} />{uploading ? "Uploading…" : "Upload images"}<input type="file" accept="image/*" multiple className="hidden" onChange={async (e) => { const files = Array.from(e.target.files ?? []); if (!files.length) return; setUploading(true); setImgErr(""); try { const urls: string[] = []; for (const f of files) urls.push(await uploadImage(f)); const gallery = [...(p.images ?? []), ...urls].slice(0, 6); setP(p.slug, { images: gallery }); } catch (err) { setImgErr((err as Error).message); } finally { setUploading(false); e.target.value = ""; } }} /></label>
          <label className="btn btn-ghost !py-1.5 text-xs cursor-pointer">{uploading ? "…" : "Replace main"}<input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; setUploading(true); setImgErr(""); try { setP(p.slug, { image: await uploadImage(f) }); } catch (err) { setImgErr((err as Error).message); } finally { setUploading(false); e.target.value = ""; } }} /></label>
        </div>
        {imgErr && <div className="text-brand mt-1">{imgErr}</div>}
        <div className="text-ink-3 mt-1 truncate">Main: {p.image}</div>
      </div>
      {!isBase && (
        <div className="grid grid-cols-3 gap-2">
          <label className="block"><span className="text-ink-3">Personalisation</span><select className={`${inp} w-full mt-1`} value={p.personalisation} onChange={(e) => setP(p.slug, { personalisation: e.target.value as Prod["personalisation"] })}>{Object.entries(KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
          <label className="block"><span className="text-ink-3">Photo slots</span><input className={`${inp} w-full mt-1`} inputMode="numeric" value={p.template.photoSlots} onChange={(e) => setP(p.slug, { template: { ...p.template, photoSlots: Math.max(0, Math.min(100, num(e.target.value) || 0)) } })} /></label>
          <label className="block"><span className="text-ink-3">Shape</span><select className={`${inp} w-full mt-1`} value={String(p.template.aspect)} onChange={(e) => setP(p.slug, { template: { ...p.template, aspect: Number(e.target.value) } })}>{presets.map(([l, a]) => <option key={l} value={String(a)}>{l}</option>)}{!presets.some(([, a]) => a === p.template.aspect) && <option value={String(p.template.aspect)}>Custom ({p.template.aspect})</option>}</select></label>
          <label className="block col-span-3"><span className="text-ink-3">Text fields the customer fills in (one per line, e.g. &quot;Name on cover&quot;)</span><textarea className={`${inp} w-full mt-1`} rows={2} value={p.template.textFields.map((f) => f.label).join("\n")} onChange={(e) => setP(p.slug, { template: { ...p.template, textFields: e.target.value.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 10).map((label, i) => ({ key: slugify(label).replace(/-/g, "_").slice(0, 30) || `field${i + 1}`, label, max: 40 })) } })} /></label>
        </div>
      )}
      <div className="flex items-center gap-2 pt-1">
        <button onClick={() => setP(p.slug, { hidden: !p.hidden })} className="btn btn-ghost !py-1.5 text-xs">{p.hidden ? <><Eye size={14} />Show on site</> : <><EyeOff size={14} />Hide from site</>}</button>
        {!isBase && <button onClick={() => setP(p.slug, { deleted: true })} className="btn btn-ghost !py-1.5 text-xs text-brand"><Trash2 size={14} />Delete product</button>}
        <span className="text-ink-3">URL: /p/{p.slug}</span>
      </div>
    </div>
  );
}

function NewProductForm({ category, presets, existing, uploadImage, onCancel, onCreate }: { category: string; presets: [string, number][]; existing: Set<string>; uploadImage: (f: File) => Promise<string>; onCancel: () => void; onCreate: (p: Prod) => void }) {
  const [name, setName] = useState(""); const [desc, setDesc] = useState(""); const [kind, setKind] = useState<Prod["personalisation"]>("photo");
  const [aspect, setAspect] = useState(1); const [slots, setSlots] = useState(1); const [fields, setFields] = useState("Name"); const [tags, setTags] = useState("");
  const [image, setImage] = useState(""); const [uploading, setUploading] = useState(false); const [err, setErr] = useState("");
  const [variants, setVariants] = useState([{ sku: "", name: "Standard", price: 0, compareAt: null as number | null }]);
  const slug = slugify(name);
  const create = () => {
    setErr("");
    if (name.trim().length < 2) return setErr("Give the product a name.");
    if (existing.has(slug)) return setErr(`A product with the URL /p/${slug} already exists — change the name slightly.`);
    if (desc.trim().length < 10) return setErr("Add a short description (10+ characters).");
    if (!image) return setErr("Upload a product image.");
    if (variants.some((v) => !v.sku || !v.name || v.price <= 0)) return setErr("Each variant needs a SKU, a name and a price.");
    const n = kind === "none" || kind === "text" ? 0 : kind === "multi-photo" ? Math.max(2, slots) : 1;
    const tf = kind === "none" || kind === "photo" ? [] : fields.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 10).map((label, i) => ({ key: slugify(label).replace(/-/g, "_").slice(0, 30) || `field${i + 1}`, label, max: 40 }));
    onCreate({ slug, added: true, hidden: false, category, name: name.trim(), description: desc.trim(), image, badges: [], tags: tags.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean), personalisation: kind, template: { aspect, photoSlots: n, textFields: tf }, variants: variants.map((v) => ({ ...v, sku: v.sku.toUpperCase() })) });
  };
  return (
    <div className="p-4 border-b border-line bg-brand-soft/40 text-sm space-y-3" data-testid="new-product-form">
      <div className="font-semibold">New product</div>
      <div className="grid md:grid-cols-2 gap-2">
        <label className="block"><span className="text-xs text-ink-3">Name *</span><input className={`${inp} w-full mt-1`} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Photo Fridge Magnet" />{slug && <div className="text-[11px] text-ink-3 mt-0.5">URL: /p/{slug}</div>}</label>
        <label className="block"><span className="text-xs text-ink-3">Personalisation *</span><select className={`${inp} w-full mt-1`} value={kind} onChange={(e) => setKind(e.target.value as Prod["personalisation"])}>{Object.entries(KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <label className="block md:col-span-2"><span className="text-xs text-ink-3">Description *</span><textarea className={`${inp} w-full mt-1`} rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} /></label>
        <label className="block"><span className="text-xs text-ink-3">Shape of the print area</span><select className={`${inp} w-full mt-1`} value={String(aspect)} onChange={(e) => setAspect(Number(e.target.value))}>{presets.map(([l, a]) => <option key={l} value={String(a)}>{l}</option>)}</select></label>
        {kind === "multi-photo" && <label className="block"><span className="text-xs text-ink-3">Number of photos</span><input className={`${inp} w-full mt-1`} inputMode="numeric" value={slots} onChange={(e) => setSlots(Math.max(2, Math.min(100, num(e.target.value) || 2)))} /></label>}
        {(kind === "text" || kind === "photo+text" || kind === "multi-photo") && <label className="block"><span className="text-xs text-ink-3">Text fields (one per line)</span><textarea className={`${inp} w-full mt-1`} rows={2} value={fields} onChange={(e) => setFields(e.target.value)} /></label>}
        <label className="block"><span className="text-xs text-ink-3">Tags for gift pages (comma-separated, e.g. birthday, under-499)</span><input className={`${inp} w-full mt-1`} value={tags} onChange={(e) => setTags(e.target.value)} /></label>
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {image ? <img src={image} alt="" className="w-16 h-16 rounded-lg object-cover border border-line" /> : <div className="w-16 h-16 rounded-lg border border-dashed border-line grid place-items-center text-ink-3"><ImagePlus size={18} /></div>}
          <div className="flex flex-col gap-1">
            <label className="btn btn-ghost !py-1.5 text-xs cursor-pointer w-fit">{uploading ? "Uploading…" : "Upload image *"}<input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; setUploading(true); setErr(""); try { setImage(await uploadImage(f)); } catch (x) { setErr((x as Error).message); } finally { setUploading(false); e.target.value = ""; } }} /></label>
            <input className={`${inp} w-64 text-xs`} placeholder="…or an existing image path, e.g. /images/p/tote-bag.jpg" value={image} onChange={(e) => setImage(e.target.value.trim())} />
          </div>
        </div>
      </div>
      <div>
        <div className="text-xs text-ink-3 mb-1">Variants (sizes / packs) *</div>
        {variants.map((v, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 mb-1">
            <input className={`${inp} w-44`} placeholder='Variant name, e.g. 6x4"' value={v.name} onChange={(e) => setVariants(variants.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} />
            <input className={`${inp} w-32 font-mono text-xs`} placeholder="SKU" value={v.sku} onChange={(e) => setVariants(variants.map((x, k) => (k === i ? { ...x, sku: e.target.value.toUpperCase().replace(/[^A-Z0-9._-]/g, "") } : x)))} />
            <input className={numInp} placeholder="Price ₹" inputMode="numeric" value={v.price || ""} onChange={(e) => setVariants(variants.map((x, k) => (k === i ? { ...x, price: num(e.target.value) || 0 } : x)))} />
            <input className={numInp} placeholder="MRP ₹" inputMode="numeric" value={v.compareAt ?? ""} onChange={(e) => setVariants(variants.map((x, k) => (k === i ? { ...x, compareAt: e.target.value.trim() === "" ? null : num(e.target.value) || null } : x)))} />
            {variants.length > 1 && <button onClick={() => setVariants(variants.filter((_, k) => k !== i))} className="text-ink-3 hover:text-brand"><Trash2 size={14} /></button>}
          </div>
        ))}
        <button onClick={() => setVariants([...variants, { sku: "", name: "", price: 0, compareAt: null }])} className="text-brand text-xs font-semibold inline-flex items-center gap-1"><Plus size={12} />Add variant</button>
      </div>
      {err && <div className="text-brand text-xs flex items-center gap-1"><AlertTriangle size={14} />{err}</div>}
      <div className="flex gap-2"><button onClick={create} className="btn btn-primary !py-2 text-sm">Add to sheet</button><button onClick={onCancel} className="btn btn-ghost !py-2 text-sm">Cancel</button><span className="text-xs text-ink-3 self-center">Remember to Save &amp; publish afterwards.</span></div>
    </div>
  );
}
