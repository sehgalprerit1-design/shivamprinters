"use client";
/**
 * Personalisation editor.
 * - Loads photos client-side (no upload until add-to-cart; the real pipeline
 *   PUTs originals to object storage via /api/upload and stores keys in Project).
 * - Each slot holds an image with pan/zoom crop inside the slot rect.
 * - Renders a preview PNG via canvas, which is what the cart shows and what the
 *   print worker regenerates at full resolution from the saved design JSON.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, ZoomIn, ZoomOut, RotateCw, Trash2, AlertTriangle, Check } from "lucide-react";
import type { Product, Variant } from "@/data/catalog";
import { optionsFor, optionDelta, defaultOptions, optionLabel } from "@/data/options";
import { useCart } from "@/lib/cart";
import { inr } from "@/lib/format";
import { CallUs } from "@/components/ui/CallUs";

type Slot = { img?: HTMLImageElement; src?: string; file?: File; key?: string; zoom: number; dx: number; dy: number; rot: 0 | 90 | 180 | 270; w: number; h: number };

const MIN_PX_PER_INCH = 150; // warn below this at print size

function slotLayout(n: number, aspect: number): { x: number; y: number; w: number; h: number }[] {
  // Simple grid layout inside a unit rect; multi-photo products get a grid,
  // single-photo products fill the face with a small bleed margin.
  if (n <= 1) return [{ x: 0.04, y: 0.04, w: 0.92, h: 0.92 }];
  const cols = Math.ceil(Math.sqrt(n * aspect));
  const rows = Math.ceil(n / cols);
  const gap = 0.02;
  const w = (1 - gap * (cols + 1)) / cols;
  const h = (1 - gap * (rows + 1)) / rows;
  return Array.from({ length: n }, (_, i) => ({ x: gap + (i % cols) * (w + gap), y: gap + Math.floor(i / cols) * (h + gap), w, h }));
}

/** Text fields that are instructions for us, not printed on the product. */
const NON_PRINT_KEYS = new Set(["notes", "brief", "back", "message", "start", "tagline", "address", "email", "phone"]);
const FRAME_COLOURS: Record<string, string> = { black: "#1c1a18", white: "#f5f2ec", oak: "#c9a06a", walnut: "#5a3a28", red: "#d7352b", yellow: "#f2c230", blue: "#2f6fd6", green: "#2e9e5b", pink: "#ef6fa0", teal: "#1f9c9c" };

export function Editor({ product, variant: initialVariant, initialOptions = {}, initialQty = 1, editLineId }: { product: Product; variant: Variant; initialOptions?: Record<string, string>; initialQty?: number; editLineId?: string }) {
  const router = useRouter();
  const add = useCart((s) => s.add); const replace = useCart((s) => s.replace);
  const [variant, setVariant] = useState<Variant>(initialVariant);
  const groups = useMemo(() => optionsFor(product.slug, product.category), [product.slug, product.category]);
  const [opts, setOpts] = useState<Record<string, string>>({ ...defaultOptions(groups), ...initialOptions });
  const [qty, setQty] = useState(initialQty);
  const unitPrice = variant.price + optionDelta(groups, opts);
  const n = product.template.photoSlots;
  const baseAspect = product.template.aspect;
  // Orientation option flips the canvas (landscape templates become portrait and vice versa).
  const aspect = opts.orientation === "portrait" && baseAspect > 1 ? 1 / baseAspect : opts.orientation === "landscape" && baseAspect < 1 ? 1 / baseAspect : baseAspect;
  const framed = product.category === "framed-prints";
  const frameColour = framed ? FRAME_COLOURS[opts.colour ?? ""] ?? (product.slug === "premium-frame" ? "#5a3a28" : "#1c1a18") : undefined;
  const matted = framed && /designer|premium|art/.test(product.slug);
  const printableField = product.template.textFields.find((f) => !NON_PRINT_KEYS.has(f.key));
  const titleBand = n > 1 && !!printableField; // multi-photo products keep a cover-title strip above the grid
  const [slots, setSlots] = useState<Slot[]>(() => Array.from({ length: Math.max(n, 0) }, () => ({ zoom: 1, dx: 0, dy: 0, rot: 0, w: 0, h: 0 })));
  const [active, setActive] = useState(0);
  const [text, setText] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"photos" | "text" | "review">(n > 0 ? "photos" : "text");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layout = useMemo(() => {
    const inset = framed ? (matted ? 0.16 : 0.08) : 0;
    const top = titleBand ? 0.14 : 0;
    return slotLayout(n, aspect).map((r) => ({ x: inset + r.x * (1 - 2 * inset), y: inset + top + r.y * (1 - 2 * inset - top), w: r.w * (1 - 2 * inset), h: r.h * (1 - 2 * inset - top) }));
  }, [n, aspect, framed, matted, titleBand]);
  const W = 900, H = Math.round(W / aspect);
  const filled = slots.filter((s) => s.img).length;

  // Approximate print width in inches from variant name, e.g. "8x10"
  const printInches = useMemo(() => {
    const m = variant.name.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/i);
    return m ? Math.max(Number(m[1]), Number(m[2])) : 8;
  }, [variant.name]);

  const draw = useCallback(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d")!;
    ctx.fillStyle = "#f3eee6"; ctx.fillRect(0, 0, W, H);
    if (framed) {
      // Frame moulding, then mat (if any), then the print area.
      const fw = Math.round(Math.min(W, H) * 0.08);
      ctx.fillStyle = frameColour!; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.fillRect(fw * 0.8, fw * 0.8, W - fw * 1.6, H - fw * 1.6);
      ctx.fillStyle = matted ? "#fbfaf7" : "#e9e2d8"; ctx.fillRect(fw, fw, W - 2 * fw, H - 2 * fw);
      if (matted) { ctx.strokeStyle = "rgba(0,0,0,.12)"; ctx.lineWidth = 2; const m = Math.round(Math.min(W, H) * 0.16); ctx.strokeRect(m - 1, m - 1, W - 2 * m + 2, H - 2 * m + 2); }
    }
    if (titleBand) { ctx.fillStyle = "#2a2622"; ctx.fillRect(0, 0, W, H * 0.14); }
    layout.forEach((r, i) => {
      const s = slots[i];
      const x = r.x * W, y = r.y * H, w = r.w * W, h = r.h * H;
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      if (s?.img) {
        const iw = s.rot % 180 ? s.img.height : s.img.width, ih = s.rot % 180 ? s.img.width : s.img.height;
        const scale = Math.max(w / iw, h / ih) * s.zoom;
        ctx.translate(x + w / 2 + s.dx, y + h / 2 + s.dy); ctx.rotate((s.rot * Math.PI) / 180); ctx.scale(scale, scale);
        ctx.drawImage(s.img, -s.img.width / 2, -s.img.height / 2);
      } else {
        ctx.fillStyle = "#e9e2d8"; ctx.fillRect(x, y, w, h);
        ctx.fillStyle = "#8c857c"; ctx.font = `${Math.max(12, Math.min(w, h) / 9)}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(n > 1 ? `${i + 1}` : "Add photo", x + w / 2, y + h / 2);
      }
      ctx.restore();
      if (i === active && n > 1) { ctx.strokeStyle = "#e2573f"; ctx.lineWidth = 4; ctx.strokeRect(x + 2, y + 2, w - 4, h - 4); }
    });
    // Text overlay: the first *printable* field (title/caption/name). Notes and instructions are never drawn.
    const val = printableField ? (text[printableField.key] ?? "").trim() : "";
    if (titleBand) {
      ctx.save(); ctx.font = `600 ${Math.round(H * 0.07)}px Georgia, serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = val ? "#fff" : "rgba(255,255,255,.45)"; ctx.fillText(val || `${printableField!.label} (cover)`, W / 2, H * 0.07, W * 0.9); ctx.restore();
    } else if (n === 0) {
      // Text-only products (names, initials): big centred text on a product-coloured face.
      ctx.save();
      ctx.fillStyle = "#e9e2d8"; ctx.fillRect(0, 0, W, H);
      ctx.font = `600 ${Math.round(Math.min(H * 0.42, W / Math.max(6, (val || "Your name").length) * 1.5))}px Georgia, serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = val ? "#1d1a17" : "#9a938a"; ctx.fillText(val || (printableField ? printableField.label : ""), W / 2, H / 2, W * 0.9);
      ctx.restore();
    } else if (val) {
      ctx.save();
      const inset = framed ? Math.round(Math.min(W, H) * (matted ? 0.16 : 0.08)) : 0;
      const bandH = Math.max(28, Math.min(H / 6, 120));
      ctx.font = `600 ${Math.round(bandH * 0.5)}px Georgia, serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillRect(inset, H - inset - bandH, W - 2 * inset, bandH);
      ctx.fillStyle = "#fff"; ctx.fillText(val, W / 2, H - inset - bandH / 2, W - 2 * inset - 20);
      ctx.restore();
    }
  }, [slots, layout, active, text, n, W, H, framed, matted, frameColour, titleBand, printableField]);
  useEffect(() => { draw(); }, [draw]);

  const loadFiles = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, n);
    let idx = slots.findIndex((s) => !s.img); if (idx < 0) idx = active;
    arr.forEach((f) => {
      const url = URL.createObjectURL(f);
      const img = new Image();
      img.onload = () => {
        setSlots((prev) => { const next = [...prev]; const i = next.findIndex((s) => !s.img); const t = i < 0 ? active : i; next[t] = { img, src: url, file: f, zoom: 1, dx: 0, dy: 0, rot: 0, w: img.width, h: img.height }; return next; });
      };
      img.src = url;
    });
  };

  const upd = (patch: Partial<Slot>) => setSlots((prev) => prev.map((s, i) => (i === active ? { ...s, ...patch } : s)));
  const cur = slots[active];
  const lowRes = cur?.img && Math.max(cur.w, cur.h) / cur.zoom < printInches * MIN_PX_PER_INCH;

  // drag to pan
  const drag = useRef<{ x: number; y: number } | null>(null);
  const onDown = (e: React.PointerEvent) => {
    const cv = canvasRef.current!; const r = cv.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width), py = ((e.clientY - r.top) / r.height);
    const hit = layout.findIndex((l) => px >= l.x && px <= l.x + l.w && py >= l.y && py <= l.y + l.h);
    if (hit >= 0) setActive(hit);
    drag.current = { x: e.clientX, y: e.clientY }; (e.target as Element).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current || !cur?.img) return;
    const cv = canvasRef.current!; const k = W / cv.getBoundingClientRect().width;
    upd({ dx: cur.dx + (e.clientX - drag.current.x) * k, dy: cur.dy + (e.clientY - drag.current.y) * k });
    drag.current = { x: e.clientX, y: e.clientY };
  };
  const onUp = () => { drag.current = null; };

  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [restoreNote, setRestoreNote] = useState<string | null>(null);

  // Editing an existing cart line: restore its variant, options, quantity, text and (when stored) photos.
  useEffect(() => {
    if (!editLineId) return;
    const line = useCart.getState().lines.find((l) => l.id === editLineId);
    if (!line) { setRestoreNote("That cart item no longer exists — starting a fresh design."); return; }
    const v = product.variants.find((x) => x.sku === line.variantSku); if (v) setVariant(v);
    setQty(line.qty);
    if (line.design?.options) setOpts((o) => ({ ...o, ...line.design!.options }));
    if (line.design?.text) setText(line.design.text);
    const saved = line.design?.slots ?? [];
    const withKeys = saved.map((sl, i) => ({ sl, i })).filter(({ sl }) => sl.key);
    if (withKeys.length === 0) { if ((line.design?.photoCount ?? 0) > 0) setRestoreNote("Your earlier photos weren't stored, so please add them again."); return; }
    let cancelled = false;
    (async () => {
      let ok = 0;
      for (const { sl, i } of withKeys) {
        try {
          const r = await fetch(`/api/upload/url?key=${encodeURIComponent(sl.key!)}`); const j = (await r.json()) as { url: string | null };
          if (!j.url) continue;
          await new Promise<void>((res) => { const img = new Image(); img.crossOrigin = "anonymous"; img.onload = () => { if (!cancelled) setSlots((prev) => prev.map((s0, k) => (k === i ? { ...s0, img, src: img.src, key: sl.key, zoom: sl.zoom, dx: sl.dx, dy: sl.dy, rot: sl.rot as Slot["rot"], w: img.width, h: img.height } : s0))); ok++; res(); }; img.onerror = () => res(); img.src = j.url!; });
        } catch { /* skip */ }
      }
      if (!cancelled) { setRestoreNote(ok === withKeys.length ? null : `Restored ${ok} of ${withKeys.length} photos — please re-add the rest.`); setStep("review"); }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editLineId]);

  const addToCart = async () => {
    const preview = canvasRef.current!.toDataURL("image/jpeg", 0.7);
    const label = optionLabel(groups, opts);
    // Upload original files to object storage (presigned PUT), keep only the keys.
    const slotDesign: { key?: string; zoom: number; dx: number; dy: number; rot: number; w: number; h: number }[] = [];
    const toUpload = slots.map((s, i) => ({ s, i })).filter(({ s }) => s.file && !s.key);
    try {
      for (let k = 0; k < toUpload.length; k++) {
        const { s, i } = toUpload[k];
        setUploading(`Uploading photo ${k + 1} of ${toUpload.length}…`);
        const r = await fetch("/api/upload", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ filename: s.file!.name, mime: s.file!.type || "image/jpeg", bytes: s.file!.size }) });
        const j = (await r.json()) as { key: string; url: string | null; error?: string };
        if (!r.ok) throw new Error(j.error ?? "Upload failed");
        if (j.url) {
          let put: Response;
          try { put = await fetch(j.url, { method: "PUT", body: s.file, headers: { "content-type": s.file!.type || "image/jpeg" } }); }
          catch { throw new Error("Photo upload was blocked by the browser (storage CORS). Please call us and we'll sort it out."); }
          if (!put.ok) throw new Error(`Photo upload failed (storage replied ${put.status}).`);
        }
        slots[i].key = j.key;
      }
    } catch (e) { setUploading(null); setUploadError((e as Error).message); return; }
    setUploading(null); setUploadError(null);
    slots.forEach((s) => slotDesign.push({ key: s.key, zoom: s.zoom, dx: s.dx, dy: s.dy, rot: s.rot, w: s.w, h: s.h }));
    const line = { productSlug: product.slug, productName: product.name, variantSku: variant.sku, variantName: label ? `${variant.name} · ${label}` : variant.name, unitPrice, qty, image: product.image, design: { preview, text, photoCount: filled, options: opts, slots: slotDesign, canvas: { w: W, h: H, aspect } } };
    if (editLineId) replace(editLineId, line); else add(line);
    router.push("/cart");
  };

  const textOk = product.template.textFields.every((f) => f.key === "notes" || (text[f.key] ?? "").trim().length > 0 || !["name", "initial"].includes(f.key));
  const canReview = (n === 0 || filled > 0) && textOk;

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-8">
      <div>
        <div className="card p-3 bg-surface-2">
          <canvas ref={canvasRef} width={W} height={H} className="w-full h-auto rounded-lg touch-none cursor-grab shadow-sm" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} />
        </div>
        {cur?.img && (
          <div className="flex flex-wrap items-center gap-2 mt-3 text-sm">
            <button className="btn btn-ghost !py-1.5" onClick={() => upd({ zoom: Math.min(4, cur.zoom * 1.15) })}><ZoomIn size={16} />Zoom in</button>
            <button className="btn btn-ghost !py-1.5" onClick={() => upd({ zoom: Math.max(1, cur.zoom / 1.15), dx: 0, dy: 0 })}><ZoomOut size={16} />Zoom out</button>
            <button className="btn btn-ghost !py-1.5" onClick={() => upd({ rot: ((cur.rot + 90) % 360) as Slot["rot"] })}><RotateCw size={16} />Rotate</button>
            <button className="btn btn-ghost !py-1.5 text-brand" onClick={() => upd({ img: undefined, src: undefined, zoom: 1, dx: 0, dy: 0 })}><Trash2 size={16} />Remove</button>
            <span className="text-ink-3 ml-auto">Drag the photo to reposition</span>
          </div>
        )}
        {lowRes && <div className="mt-3 flex items-start gap-2 text-sm bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3"><AlertTriangle size={16} className="mt-0.5 shrink-0" />This photo is on the small side for a {printInches}&quot; print at this zoom. It will print, but may look soft. A larger original or less zoom fixes it. <CallUs compact className="ml-1" /></div>}
      </div>

      <aside className="space-y-5 lg:sticky lg:top-32 self-start max-h-[calc(100vh-9rem)] overflow-y-auto no-scrollbar">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-3">Personalising</div>
          <div className="font-bold text-lg">{product.name}</div>
          <div className="text-sm text-ink-2">{inr(unitPrice)} each{qty > 1 ? ` · ${inr(unitPrice * qty)} for ${qty}` : ""}</div>
        </div>
        <details className="card p-3 text-sm group" open={product.variants.length > 1 || groups.length > 0}>
          <summary className="cursor-pointer list-none flex justify-between font-semibold">Size, finish & quantity<span className="text-ink-3 group-open:rotate-45 transition-transform">+</span></summary>
          {product.variants.length > 1 && (
            <div className="mt-3">
              <div className="text-xs font-semibold text-ink-3 mb-1">Size</div>
              <select className="input !py-2" value={variant.sku} onChange={(e) => setVariant(product.variants.find((x) => x.sku === e.target.value)!)}>
                {product.variants.map((x) => <option key={x.sku} value={x.sku}>{x.name} — {inr(x.price)}</option>)}
              </select>
            </div>
          )}
          {groups.map((g) => (
            <div key={g.key} className="mt-3">
              <div className="text-xs font-semibold text-ink-3 mb-1">{g.label}</div>
              <div className="flex flex-wrap gap-1.5">
                {g.choices.map((c) => (
                  <button key={c.id} type="button" title={c.hint} onClick={() => setOpts({ ...opts, [g.key]: c.id })} className={`rounded-full border px-2.5 py-1 text-xs ${opts[g.key] === c.id ? "border-brand bg-brand-soft" : "border-line"}`}>{c.label}{c.delta ? ` +₹${c.delta}` : ""}</button>
                ))}
              </div>
            </div>
          ))}
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs font-semibold text-ink-3">Quantity</div>
            <div className="inline-flex border border-line rounded-full"><button type="button" className="px-3" onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span className="px-1 py-1 w-6 text-center">{qty}</span><button type="button" className="px-3" onClick={() => setQty(Math.min(99, qty + 1))}>+</button></div>
          </div>
        </details>
        {restoreNote && <div className="flex items-start gap-2 text-sm bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3"><AlertTriangle size={16} className="mt-0.5 shrink-0" />{restoreNote}</div>}
        <CallUs compact />
        <ol className="flex gap-2 text-xs">
          {(["photos", "text", "review"] as const).filter((s) => s !== "photos" || n > 0).filter((s) => s !== "text" || product.template.textFields.length > 0).map((s, i) => (
            <li key={s}><button onClick={() => setStep(s)} className={`chip ${step === s ? "bg-ink text-white" : "bg-surface-2"}`}>{i + 1}. {s === "photos" ? "Photos" : s === "text" ? "Text" : "Review"}</button></li>
          ))}
        </ol>

        {step === "photos" && (
          <div className="space-y-3">
            <label className="card border-dashed p-6 text-center cursor-pointer hover:border-brand block">
              <Upload className="mx-auto text-brand" />
              <div className="font-semibold mt-2">{n > 1 ? `Add up to ${n} photos` : "Add a photo"}</div>
              <div className="text-xs text-ink-3">JPG, PNG or HEIC · from your phone or computer</div>
              <input type="file" accept="image/*" multiple={n > 1} className="hidden" onChange={(e) => loadFiles(e.target.files)} />
            </label>
            {n > 1 && (
              <div className="grid grid-cols-6 gap-1.5">
                {slots.map((s, i) => (
                  <button key={i} onClick={() => setActive(i)} className={`aspect-square rounded-md bg-surface-2 bg-cover bg-center border-2 ${i === active ? "border-brand" : "border-transparent"}`} style={{ backgroundImage: s.src ? `url(${s.src})` : undefined }} aria-label={`Slot ${i + 1}`}>{!s.src && <span className="text-[10px] text-ink-3">{i + 1}</span>}</button>
                ))}
              </div>
            )}
            <div className="text-sm text-ink-2">{filled}/{n} added{filled < n && n > 1 ? " — empty slots stay blank on the print." : ""}</div>
            <button disabled={filled === 0} onClick={() => setStep(product.template.textFields.length ? "text" : "review")} className="btn btn-primary w-full">Continue</button>
          </div>
        )}

        {step === "text" && (
          <div className="space-y-3">
            {product.template.textFields.map((f) => (
              <label key={f.key} className="block">
                <span className="text-sm font-semibold">{f.label}</span>
                {f.max > 60
                  ? <textarea className="input mt-1" rows={3} maxLength={f.max} value={text[f.key] ?? ""} onChange={(e) => setText({ ...text, [f.key]: e.target.value })} />
                  : <input className="input mt-1" maxLength={f.max} value={text[f.key] ?? ""} onChange={(e) => setText({ ...text, [f.key]: e.target.value })} />}
                <span className="text-xs text-ink-3">{(text[f.key] ?? "").length}/{f.max}</span>
              </label>
            ))}
            <button onClick={() => setStep("review")} className="btn btn-primary w-full">Continue</button>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-3">
            <ul className="text-sm space-y-1.5">
              {n > 0 && <li className="flex gap-2"><Check size={16} className="text-accent" />{filled} photo{filled !== 1 ? "s" : ""} placed</li>}
              {product.template.textFields.map((f) => <li key={f.key} className="flex gap-2"><Check size={16} className={text[f.key] ? "text-accent" : "text-ink-3"} />{f.label}: {text[f.key] || <span className="text-ink-3">blank</span>}</li>)}
              <li className="flex gap-2"><Check size={16} className="text-accent" />{variant.name}{optionLabel(groups, opts) ? ` · ${optionLabel(groups, opts)}` : ""} × {qty}</li>
              <li className="flex gap-2"><Check size={16} className="text-accent" />Preview checked — what you see is what prints</li>
            </ul>
            {uploadError && <div className="flex items-start gap-2 text-sm bg-brand-soft border border-brand/30 text-brand-ink rounded-xl p-3"><AlertTriangle size={16} className="mt-0.5 shrink-0" /><span>{uploadError} <button type="button" className="underline" onClick={addToCart}>Try again</button> · <CallUs compact /></span></div>}
            <button disabled={!canReview || !!uploading} onClick={addToCart} className="btn btn-primary w-full text-base !py-3.5">{uploading ?? <>{editLineId ? "Update cart" : `Add ${qty > 1 ? `${qty} ` : ""}to cart`} · {inr(unitPrice * qty)}</>}</button>
            <p className="text-xs text-ink-3">Your design is saved with the order. Reorders print the same file.</p>
            <CallUs compact />
          </div>
        )}
      </aside>
    </div>
  );
}
