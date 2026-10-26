"use client";
import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Link2, RotateCcw, Search, Trash2, Upload } from "lucide-react";
import type { ImageSlot } from "@/data/site-images";

type Cat = { slug: string; name: string; image: string };
type Prod = { slug: string; name: string; category: string; image: string; images?: string[]; hidden?: boolean };
type CatalogueState = { categories: Cat[]; products: Prod[]; options: Record<string, number> } & Record<string, unknown>;

async function uploadImage(file: File): Promise<string> {
  const r = await fetch("/api/upload", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ filename: file.name, mime: file.type || "image/jpeg", bytes: file.size }) });
  const j = await r.json(); if (!r.ok) throw new Error(j.error ?? "Upload failed");
  if (!j.url) throw new Error("Photo storage isn't configured, so images can't be uploaded here yet.");
  const put = await fetch(j.url, { method: "PUT", body: file, headers: { "content-type": file.type || "image/jpeg" } }); if (!put.ok) throw new Error(`Image upload failed (${put.status})`);
  return `/api/img?key=${encodeURIComponent(j.key)}`;
}

/** One image with Replace / Link / Reset controls. `current` is what shows on the site now; `original` is what the code ships (undefined = none). */
function Slot({ label, meta, current, original, onChange, allowRemove = false, wide = false }: { label: string; meta?: string; current?: string; original?: string; onChange: (v: string | undefined) => void; allowRemove?: boolean; wide?: boolean }) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [linking, setLinking] = useState(false); const [url, setUrl] = useState("");
  const changed = (current ?? "") !== (original ?? "");
  return (
    <div className={`card p-3 flex gap-3 ${changed ? "ring-2 ring-brand/40" : ""}`}>
      <div className={`${wide ? "w-40 aspect-[16/9]" : "w-24 aspect-square"} shrink-0 rounded-lg bg-white border border-line bg-contain bg-no-repeat bg-center`} style={current ? { backgroundImage: `url(${current})` } : undefined}>
        {!current && <div className="w-full h-full flex items-center justify-center text-[10px] text-ink-3 text-center px-1">No image</div>}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-sm truncate">{label} {changed && <span className="chip bg-brand-soft text-brand-ink !text-[10px] ml-1">changed</span>}</div>
        {meta && <div className="text-xs text-ink-3 mt-0.5">{meta}</div>}
        <div className="text-[11px] text-ink-3 mt-0.5 truncate" title={current}>{current ?? "—"}</div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <label className="btn btn-ghost !py-1 !px-2.5 text-xs cursor-pointer"><Upload size={12} />{busy ? "Uploading…" : "Replace"}<input type="file" accept="image/*" className="hidden" disabled={busy} onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; setBusy(true); setErr(""); try { onChange(await uploadImage(f)); } catch (x) { setErr((x as Error).message); } finally { setBusy(false); e.target.value = ""; } }} /></label>
          <button type="button" onClick={() => setLinking((v) => !v)} className="btn btn-ghost !py-1 !px-2.5 text-xs"><Link2 size={12} />Link</button>
          {changed && original !== undefined && <button type="button" onClick={() => onChange(original)} className="btn btn-ghost !py-1 !px-2.5 text-xs"><RotateCcw size={12} />Reset</button>}
          {(allowRemove || original === undefined) && current && <button type="button" onClick={() => onChange(undefined)} className="btn btn-ghost !py-1 !px-2.5 text-xs text-red-700"><Trash2 size={12} />Remove</button>}
        </div>
        {linking && (
          <form className="flex gap-1.5 mt-2" onSubmit={(e) => { e.preventDefault(); if (/^(\/|https:\/\/)/.test(url.trim())) { onChange(url.trim()); setUrl(""); setLinking(false); setErr(""); } else setErr("Paste a full https:// link to an image"); }}>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…/photo.jpg" className="flex-1 rounded-lg border border-line px-2 py-1 text-xs" />
            <button className="btn btn-primary !py-1 !px-2.5 text-xs">Use</button>
          </form>
        )}
        {err && <div className="text-xs text-red-700 mt-1">{err}</div>}
      </div>
    </div>
  );
}

export function ImagesManager() {
  const [slots, setSlots] = useState<ImageSlot[]>([]);
  const [ov, setOv] = useState<Record<string, string>>({});
  const [savedOv, setSavedOv] = useState<Record<string, string>>({});
  const [cat, setCat] = useState<CatalogueState | null>(null);
  const [savedCat, setSavedCat] = useState<string>("");
  const [orig, setOrig] = useState<{ cats: Record<string, string>; prods: Record<string, { image: string; images: string[] }> }>({ cats: {}, prods: {} });
  const [mode, setMode] = useState("");
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<string>("Homepage");
  const [state, setState] = useState<"idle" | "loading" | "saving" | "done" | "error">("loading");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [a, b] = await Promise.all([fetch("/api/admin/images").then((r) => r.json()), fetch("/api/admin/pricing").then((r) => r.json())]);
        if (a.error) throw new Error(a.error); if (b.error) throw new Error(b.error);
        setSlots(a.slots); setOv(a.overrides); setSavedOv(a.overrides); setMode(a.mode);
        setCat(b); setOrig({ cats: Object.fromEntries(b.categories.map((c: Cat) => [c.slug, c.image])), prods: Object.fromEntries(b.products.map((p: Prod) => [p.slug, { image: p.image, images: p.images ?? [] }])) }); setSavedCat(JSON.stringify({ c: b.categories.map((c: Cat) => c.image), p: b.products.map((p: Prod) => [p.image, p.images]) }));
        setState("idle");
      } catch (e) { setMsg((e as Error).message); setState("error"); }
    })();
  }, []);

  const groups = useMemo(() => Array.from(new Set(slots.map((s) => s.group))), [slots]);
  const tabs = [...groups, "Categories", "Products"];
  const catSig = cat ? JSON.stringify({ c: cat.categories.map((c) => c.image), p: cat.products.map((p) => [p.image, p.images]) }) : "";
  const slotsDirty = JSON.stringify(ov) !== JSON.stringify(savedOv);
  const catDirty = !!cat && catSig !== savedCat;
  const dirty = slotsDirty || catDirty;

  const setSlot = (key: string, v: string | undefined, original?: string) => setOv((o) => { const n = { ...o }; if (v === undefined || v === original) delete n[key]; else n[key] = v; return n; });
  const setProd = (slug: string, patch: Partial<Prod>) => setCat((c) => c && { ...c, products: c.products.map((p) => (p.slug === slug ? { ...p, ...patch } : p)) });
  const setCatImg = (slug: string, image: string) => setCat((c) => c && { ...c, categories: c.categories.map((x) => (x.slug === slug ? { ...x, image } : x)) });

  async function publish() {
    setState("saving"); setMsg("");
    try {
      const notes: string[] = [];
      if (slotsDirty) { const r = await fetch("/api/admin/images", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ overrides: ov }) }); const j = await r.json(); if (!r.ok) throw new Error(j.error); setSavedOv(ov); notes.push("site images"); }
      if (catDirty && cat) { const { mode: _m, ...body } = cat; void _m; const r = await fetch("/api/admin/pricing", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); const j = await r.json(); if (!r.ok) throw new Error(j.error); setSavedCat(catSig); setOrig({ cats: Object.fromEntries(cat.categories.map((c) => [c.slug, c.image])), prods: Object.fromEntries(cat.products.map((p) => [p.slug, { image: p.image, images: p.images ?? [] }])) }); notes.push("product & category images"); }
      setMsg(`Published ${notes.join(" and ")}. ${mode === "github" ? "Live in about 2–3 minutes." : "Saved locally."}`); setState("done");
    } catch (e) { setMsg((e as Error).message); setState("error"); }
  }

  if (state === "loading") return <div className="text-ink-3 text-sm">Loading images…</div>;
  const filter = (s: string) => !q || s.toLowerCase().includes(q.toLowerCase());
  const prods = cat?.products.filter((p) => !p.hidden && (filter(p.name) || filter(p.slug))) ?? [];

  return (
    <div>
      <div className="sticky top-16 z-20 bg-surface/95 backdrop-blur py-3 -mx-1 px-1 flex flex-wrap items-center gap-2 border-b border-line mb-4">
        <div className="flex flex-wrap gap-1.5">{tabs.map((t) => <button key={t} type="button" onClick={() => setTab(t)} className={`chip !py-1.5 !text-xs ${tab === t ? "bg-ink text-white" : "bg-surface-2 text-ink-2 hover:bg-line"}`}>{t}</button>)}</div>
        <div className="flex-1" />
        {tab === "Products" && <div className="relative"><Search size={14} className="absolute left-2.5 top-2.5 text-ink-3" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a product" className="rounded-lg border border-line pl-8 pr-3 py-1.5 text-sm w-56" /></div>}
        <button type="button" onClick={publish} disabled={!dirty || state === "saving"} className="btn btn-primary !py-2 text-sm disabled:opacity-50">{state === "saving" ? "Publishing…" : dirty ? "Publish changes" : "Nothing to publish"}</button>
      </div>
      {msg && <div className={`rounded-xl p-3 text-sm mb-4 ${state === "error" ? "bg-red-50 text-red-800" : "bg-accent-soft text-accent"}`}>{msg}</div>}
      {mode === "none" && <div className="rounded-xl p-3 text-sm mb-4 bg-amber-50 text-amber-900">Publishing isn&apos;t configured on this deployment (no GITHUB_TOKEN), so changes can&apos;t be saved from here yet.</div>}

      {groups.includes(tab) && (
        <div className="grid md:grid-cols-2 gap-3">
          {slots.filter((s) => s.group === tab).map((s) => (
            <Slot key={s.key} label={s.label} meta={`${s.usedOn} · ${s.size}`} current={ov[s.key] ?? s.fallback} original={s.fallback} onChange={(v) => setSlot(s.key, v, s.fallback)} wide={tab !== "Gift page banners"} />
          ))}
        </div>
      )}

      {tab === "Categories" && cat && (
        <div className="grid md:grid-cols-2 gap-3">
          {cat.categories.map((c) => <Slot key={c.slug} label={c.name} meta={`/c/${c.slug} · homepage tile · 1400×1000`} current={c.image} original={orig.cats[c.slug] ?? c.image} onChange={(v) => v && setCatImg(c.slug, v)} wide />)}
        </div>
      )}

      {tab === "Products" && cat && (
        <div className="space-y-3">
          <p className="text-xs text-ink-3">Main photo shows on listing cards and first on the product page; gallery photos follow it. Up to 6 gallery photos. Square photos with the product filling the frame look best.</p>
          {prods.map((p) => (
            <div key={p.slug} className="card p-3">
              <div className="flex items-baseline justify-between gap-3"><div className="font-semibold">{p.name}</div><a href={`/p/${p.slug}`} target="_blank" rel="noreferrer" className="text-xs text-brand">/p/{p.slug} ↗</a></div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                <Slot label="Main photo" current={p.image} original={orig.prods[p.slug]?.image ?? p.image} onChange={(v) => v && setProd(p.slug, { image: v })} />
                {(p.images ?? []).map((src, i) => (
                  <Slot key={i} label={`Gallery ${i + 1}`} current={src} original={orig.prods[p.slug]?.images[i] ?? src} allowRemove onChange={(v) => { const imgs = [...(p.images ?? [])]; if (v === undefined) imgs.splice(i, 1); else imgs[i] = v; setProd(p.slug, { images: imgs }); }} />
                ))}
                {(p.images?.length ?? 0) < 6 && (
                  <AddGallery onAdd={(url) => setProd(p.slug, { images: [...(p.images ?? []), url] })} />
                )}
              </div>
            </div>
          ))}
          {!prods.length && <div className="text-sm text-ink-3">No products match.</div>}
        </div>
      )}
    </div>
  );
}

function AddGallery({ onAdd }: { onAdd: (url: string) => void }) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  return (
    <label className="card p-3 flex items-center justify-center gap-2 text-sm text-ink-2 border-dashed cursor-pointer hover:border-brand min-h-[88px]">
      <ImagePlus size={16} />{busy ? "Uploading…" : "Add gallery photo"}
      <input type="file" accept="image/*" multiple className="hidden" disabled={busy} onChange={async (e) => { const files = Array.from(e.target.files ?? []); if (!files.length) return; setBusy(true); setErr(""); try { for (const f of files) onAdd(await uploadImage(f)); } catch (x) { setErr((x as Error).message); } finally { setBusy(false); e.target.value = ""; } }} />
      {err && <span className="text-xs text-red-700">{err}</span>}
    </label>
  );
}
