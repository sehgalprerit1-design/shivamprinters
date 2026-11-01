"use client";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useGalleryOverride } from "@/lib/gallery-override";
import { inr } from "@/lib/format";
import { perPiece, type ConfigState, type Resolved, type PrintConfig } from "@/data/print-configs";

/** Image with a fallback source; also catches images that failed before React attached its handlers. */
function Pic({ src, fallback, alt, className }: { src: string; fallback: string; alt: string; className: string }) {
  const [cur, setCur] = useState(src);
  const check = (el: HTMLImageElement | null) => { if (el && el.complete && el.naturalWidth === 0 && el.src.endsWith(src)) setCur(fallback); };
  // eslint-disable-next-line @next/next/no-img-element
  return <img key={src} ref={check} src={cur} onError={() => { if (cur !== fallback) setCur(fallback); }} alt={alt} loading="lazy" className={className} />;
}

function Select({ id, label, value, onChange, children, compact }: { id: string; label: string; value: string | number; onChange: (v: string) => void; children: React.ReactNode; compact?: boolean }) {
  return (
    <label htmlFor={id} className="block">
      <span className={`block font-semibold mb-1 ${compact ? "text-xs text-ink-3" : "text-sm"}`}>{label}</span>
      <span className="relative block">
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={`input appearance-none w-full pr-9 ${compact ? "!py-2 text-sm" : "!py-2.5"}`}>
          {children}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-3" />
      </span>
    </label>
  );
}

/** Cascading dropdowns + quantity/price dropdown for a PrintConfig. Controlled: pass the resolved state, get a new state back. */
export function Configurator({ cfg, value, onChange, compact = false, idPrefix = "cfg" }: { cfg: PrintConfig; value: Resolved; onChange: (s: ConfigState) => void; compact?: boolean; idPrefix?: string }) {
  const set = (key: string, v: string) => onChange({ sel: { ...value.sel, [key]: v }, qty: value.qty });
  // Show the chosen type's photo as the main product image.
  const pictured = value.fields.find(({ field }) => field.images);
  const picturedKey = pictured?.field.key, picturedVal = picturedKey ? value.sel[picturedKey] : undefined;
  const picturedImg = pictured && picturedVal ? pictured.field.images![picturedVal] : undefined;
  const setGallery = useGalleryOverride((s) => s.set);
  useEffect(() => {
    if (compact || !picturedImg || !picturedVal) return;
    setGallery({ src: picturedImg.photo, fallback: picturedImg.art, label: picturedVal });
    return () => setGallery(null);
  }, [compact, picturedImg, picturedVal, setGallery]);
  const hint = value.fields.map(({ field }) => field.hint?.[value.sel[field.key]]).filter(Boolean);
  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <div className={`grid gap-3 ${compact ? "" : "sm:grid-cols-2"}`}>
        {value.fields.map(({ field, values }) => field.images && !compact ? (
          <div key={field.key} className="sm:col-span-2">
            <div className="text-sm font-semibold mb-2">{field.label}</div>
            <div role="radiogroup" aria-label={field.label} className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {values.map((v) => {
                const on = value.sel[field.key] === v;
                return (
                  <button key={v} type="button" role="radio" aria-checked={on} onClick={() => set(field.key, v)} title={field.hint?.[v]} className={`rounded-xl border overflow-hidden text-left bg-white transition-shadow ${on ? "border-brand ring-2 ring-brand/30" : "border-line hover:border-ink-3"}`}>
                    <Pic src={field.images![v].photo} fallback={field.images![v].art} alt={`${v} visiting card`} className="w-full aspect-[4/3] object-cover block" />
                    <span className={`block text-center text-[11px] sm:text-xs font-semibold leading-tight px-1 py-1.5 ${on ? "bg-brand text-white" : "bg-surface-2 text-ink"}`}>{v}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <Select key={field.key} id={`${idPrefix}-${field.key}`} label={field.label} value={value.sel[field.key]} onChange={(v) => set(field.key, v)} compact={compact}>
            {values.map((v) => <option key={v} value={v}>{v}</option>)}
          </Select>
        ))}
        {value.extras.map((x) => (
          <Select key={x.key} id={`${idPrefix}-${x.key}`} label={x.label} value={value.sel[x.key]} onChange={(v) => set(x.key, v)} compact={compact}>
            {x.choices.map((v) => <option key={v} value={v}>{v}</option>)}
          </Select>
        ))}
      </div>
      {hint.length > 0 && <div className="text-xs text-ink-3 -mt-1">{hint.join(" ")}</div>}
      <Select id={`${idPrefix}-qty`} label="Quantity" value={value.qty} onChange={(v) => onChange({ sel: value.sel, qty: Number(v) })} compact={compact}>
        {value.row.tiers.map(([q, t]) => (
          <option key={q} value={q}>{q.toLocaleString("en-IN")} {cfg.unit} — {inr(t)} ({perPiece(t / q)} each)</option>
        ))}
      </Select>
      {cfg.note && <div className="text-xs text-ink-3">{cfg.note}</div>}
    </div>
  );
}
