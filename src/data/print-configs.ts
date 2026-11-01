// Dropdown price configurators for print products whose price depends on a
// combination of choices (shape × size × material × quantity, etc.) rather than
// a single variant plus surcharges.
//
// Prices are full-order totals in INR (GST inclusive) per quantity tier, taken
// from Vistaprint India's public configurators on 1 Nov 2026 and multiplied by
// PRICE_FACTOR below (we sell 5% under Vistaprint). The grids live in
// print-configs.data.json (regenerate rather than hand-edit). They are NOT read
// from /admin/pricing — change them here.
//
// How a configurator works:
//  - `fields` are cascading dropdowns. Each one only offers values that exist in
//    some row matching the choices above it, so incompatible combinations
//    (e.g. A5 tri-fold) can never be picked. A field a row doesn't use is hidden.
//  - `extras` are dropdowns that don't change the price (orientation, eyelets).
//  - Quantity is a dropdown of the matching row's tiers.

import data from "./print-configs.data.json";

export type Tier = [qty: number, total: number];
export type ConfigRow = { sel: Record<string, string>; tiers: Tier[] };
export type ConfigField = { key: string; label: string; hint?: Record<string, string> };
export type ConfigExtra = { key: string; label: string; choices: string[]; when?: Record<string, string> };
export type PrintConfig = {
  fields: ConfigField[];
  extras?: ConfigExtra[];
  rows: ConfigRow[];
  /** Plural noun for the quantity dropdown ("stickers", "brochures"). */
  unit: string;
  /** Size string in a form the print-spec parser understands ("5 x 7 in", "4 x 6 ft", "A5"). */
  printSize: (sel: Record<string, string>) => string;
  /** Force the design orientation for a combination (otherwise the product template / Orientation dropdown decides). */
  orient?: (sel: Record<string, string>) => "portrait" | "landscape" | undefined;
  note?: string;
};

/** Our price vs the Vistaprint India MRP the grids were taken from (0.95 = 5% cheaper). Totals round to the nearest rupee. */
export const PRICE_FACTOR = 0.95;
const D = Object.fromEntries(
  Object.entries(data as unknown as Record<string, ConfigRow[]>).map(([k, rows]) => [k, rows.map((r) => ({ ...r, tiers: r.tiers.map(([q, t]) => [q, Math.round(t * PRICE_FACTOR)] as Tier) }))]),
) as Record<string, ConfigRow[]>;
const BROCHURE_FLAT: Record<string, string> = { "bi-A5": "297 x 210 mm", "bi-DL": "198 x 210 mm", "bi-A6": "210 x 148 mm", "tri-DL": "297 x 210 mm", "tri-A6": "315 x 148 mm" };

export const PRINT_CONFIGS: Record<string, PrintConfig> = {
  "sheet-stickers": {
    fields: [
      { key: "shape", label: "Shape" },
      { key: "size", label: "Size" },
      { key: "material", label: "Material", hint: { "Clear Plastic": "White ink can't be printed on clear plastic.", "Gold Foil Paper": "Metallic gold sheet — great for labels and seals.", "Silver Foil Paper": "Metallic silver sheet." } },
    ],
    extras: [{ key: "orientation", label: "Orientation", choices: ["Horizontal", "Vertical"] }],
    rows: D["sheet-stickers"],
    unit: "stickers",
    printSize: (s) => s.size,
    note: "Quantity is the total number of stickers. They're printed on sheets, so quantities go up a full sheet at a time.",
  },
  brochures: {
    fields: [
      { key: "fold", label: "Fold" },
      { key: "style", label: "Size", hint: { A5: "148 × 210 mm folded", DL: "99 × 210 mm folded", A6: "105 × 148 mm folded" } },
      { key: "paper", label: "Paper stock" },
    ],
    rows: D["brochures"],
    unit: "brochures",
    // Artwork is the flat, unfolded sheet.
    printSize: (s) => BROCHURE_FLAT[`${s.fold === "Bi-fold" ? "bi" : "tri"}-${s.style}`] ?? s.style,
    note: "A5 is available as a bi-fold only.",
  },
  "photo-postcards": {
    fields: [
      { key: "corner", label: "Corners" },
      { key: "size", label: "Size" },
      { key: "paper", label: "Paper stock" },
    ],
    rows: D["photo-postcards"],
    unit: "postcards",
    printSize: (s) => s.size,
    note: "Rounded corners are available on 4×6, 4.21×5.47, 5×7 and 5.47×8.5 in.",
  },
  "banners-standees": {
    fields: [
      { key: "type", label: "Product" },
      { key: "size", label: "Size" },
      { key: "cassette", label: "Cassette", hint: { Premium: "Heavier premium base, 3×6 ft only." } },
      { key: "colour", label: "Cassette colour" },
    ],
    extras: [
      { key: "eyelets", label: "Eyelets", choices: ["With eyelets", "No eyelets"], when: { type: "Flex banner" } },
      { key: "orientation", label: "Orientation", choices: ["Horizontal", "Vertical"], when: { type: "Flex banner" } },
    ],
    rows: D["banners-standees"],
    unit: "pcs",
    printSize: (s) => s.size,
    orient: (s) => (s.type === "Roll-up standee" ? "portrait" : undefined),
    note: "Need a size that isn't listed? Message us on WhatsApp for a custom-size banner quote.",
  },
};

export function configFor(slug: string): PrintConfig | undefined {
  return PRINT_CONFIGS[slug];
}

export type ConfigState = { sel: Record<string, string>; qty: number };

const matches = (row: ConfigRow, sel: Record<string, string>, keys: string[]) => keys.every((k) => !(k in row.sel) || row.sel[k] === sel[k]);

export type Resolved = {
  sel: Record<string, string>;
  /** Dropdowns to show, in order, with the values allowed given the choices above. */
  fields: { field: ConfigField; values: string[] }[];
  extras: ConfigExtra[];
  row: ConfigRow;
  qty: number;
  total: number;
  each: number;
  label: string;
};

/** Normalise a (possibly partial or stale) selection to a valid combination and work out the price. */
export function resolveConfig(cfg: PrintConfig, input: Partial<ConfigState> = {}): Resolved {
  const want = input.sel ?? {};
  const sel: Record<string, string> = {};
  const fields: Resolved["fields"] = [];
  const done: string[] = [];
  let pool = cfg.rows;
  for (const f of cfg.fields) {
    const usable = pool.filter((r) => f.key in r.sel);
    if (!usable.length) continue; // field not used by this product type
    const values = [...new Set(usable.map((r) => r.sel[f.key]))];
    sel[f.key] = values.includes(want[f.key]) ? want[f.key] : values[0];
    done.push(f.key);
    pool = pool.filter((r) => matches(r, sel, done));
    fields.push({ field: f, values });
  }
  const row = pool[0];
  const extras = (cfg.extras ?? []).filter((x) => !x.when || Object.entries(x.when).every(([k, v]) => sel[k] === v));
  for (const x of extras) sel[x.key] = x.choices.includes(want[x.key]) ? want[x.key] : x.choices[0];
  const qtys = row.tiers.map((t) => t[0]);
  const q = input.qty && qtys.includes(input.qty) ? input.qty : nearestTier(qtys, input.qty);
  const total = row.tiers.find((t) => t[0] === q)![1];
  const label = [...fields.map(({ field }) => sel[field.key]), ...extras.map((x) => sel[x.key])].join(" · ");
  return { sel, fields, extras, row, qty: q, total, each: total / q, label };
}

function nearestTier(qtys: number[], want?: number) {
  if (!want) return qtys[0];
  return qtys.find((q) => q >= want) ?? qtys[qtys.length - 1];
}

/** Lowest order total across every combination — used for "From ₹…" on cards. */
export function configMinTotal(cfg: PrintConfig) {
  return Math.min(...cfg.rows.map((r) => r.tiers[0][1]));
}

export const encodeConfig = (s: ConfigState) => JSON.stringify({ ...s.sel, qty: s.qty });
export function decodeConfig(raw: string | undefined | null): Partial<ConfigState> {
  if (!raw) return {};
  try {
    const o = JSON.parse(raw) as Record<string, string | number>;
    const { qty, ...sel } = o;
    return { sel: Object.fromEntries(Object.entries(sel).map(([k, v]) => [k, String(v)])), qty: Number(qty) || undefined };
  } catch { return {}; }
}

/** Per-piece price for display, e.g. ₹1.98 or ₹245. */
export const perPiece = (n: number) => `₹${n >= 100 ? Math.round(n).toLocaleString("en-IN") : n.toFixed(2).replace(/\.00$/, "")}`;
