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

type Slot = { img?: HTMLImageElement; src?: string; zoom: number; dx: number; dy: number; rot: 0 | 90 | 180 | 270; w: number; h: number };

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

export function Editor({ product, variant: initialVariant, initialOptions = {}, initialQty = 1 }: { product: Product; variant: Variant; initialOptions?: Record<string, string>; initialQty?: number }) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const [variant, setVariant] = useState<Variant>(initialVariant);
  const groups = useMemo(() => optionsFor(product.slug, product.category), [product.slug, product.category]);
  const [opts, setOpts] = useState<Record<string, string>>({ ...defaultOptions(groups), ...initialOptions });
  const [qty, setQty] = useState(initialQty);
  const unitPrice = variant.price + optionDelta(groups, opts);
  const n = product.template.photoSlots;
  const aspect = product.template.aspect;
  const [slots, setSlots] = useState<Slot[]>(() => Array.from({ length: Math.max(n, 0) }, () => ({ zoom: 1, dx: 0, dy: 0, rot: 0, w: 0, h: 0 })));
  const [active, setActive] = useState(0);
  const [text, setText] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"photos" | "text" | "review">(n > 0 ? "photos" : "text");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layout = useMemo(() => slotLayout(n, aspect), [n, aspect]);
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
    // Text overlay (title/caption/name) along the bottom
    const first = product.template.textFields[0];
    const val = first ? text[first.key] : "";
    if (val) {
      ctx.save();
      ctx.font = `600 ${Math.round(H / 12)}px Georgia, serif`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillRect(0, H - H / 6, W, H / 6);
      ctx.fillStyle = "#fff"; ctx.fillText(val, W / 2, H - H / 16);
      ctx.restore();
    }
  }, [slots, layout, active, text, product.template.textFields, n, W, H]);
  useEffect(() => { draw(); }, [draw]);

  const loadFiles = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, n);
    let idx = slots.findIndex((s) => !s.img); if (idx < 0) idx = active;
    arr.forEach((f) => {
      const url = URL.createObjectURL(f);
      const img = new Image();
      img.onload = () => {
        setSlots((prev) => { const next = [...prev]; const i = next.findIndex((s) => !s.img); const t = i < 0 ? active : i; next[t] = { img, src: url, zoom: 1, dx: 0, dy: 0, rot: 0, w: img.width, h: img.height }; return next; });
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

  const addToCart = () => {
    const preview = canvasRef.current!.toDataURL("image/jpeg", 0.7);
    const label = optionLabel(groups, opts);
    add({ productSlug: product.slug, productName: product.name, variantSku: variant.sku, variantName: label ? `${variant.name} · ${label}` : variant.name, unitPrice, qty, image: product.image, design: { preview, text, photoCount: filled, options: opts } });
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
        {lowRes && <div className="mt-3 flex items-start gap-2 text-sm bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3"><AlertTriangle size={16} className="mt-0.5 shrink-0" />This photo is on the small side for a {printInches}&quot; print at this zoom. It will print, but may look soft. A larger original or less zoom fixes it.</div>}
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
            <button disabled={!canReview} onClick={addToCart} className="btn btn-primary w-full text-base !py-3.5">Add {qty > 1 ? `${qty} ` : ""}to cart · {inr(unitPrice * qty)}</button>
            <p className="text-xs text-ink-3">Your design is saved with the order. Reorders print the same file.</p>
          </div>
        )}
      </aside>
    </div>
  );
}
