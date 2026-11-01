"use client";
import { ChevronDown } from "lucide-react";
import { inr } from "@/lib/format";
import { perPiece, type ConfigState, type Resolved, type PrintConfig } from "@/data/print-configs";

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
  const hint = value.fields.map(({ field }) => field.hint?.[value.sel[field.key]]).filter(Boolean);
  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <div className={`grid gap-3 ${compact ? "" : "sm:grid-cols-2"}`}>
        {value.fields.map(({ field, values }) => (
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
