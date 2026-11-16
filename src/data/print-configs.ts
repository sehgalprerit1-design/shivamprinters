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
//
// The wedding products at the bottom of PRINT_CONFIGS are the exception to the pricing rule:
// their rows come from wedding-prices.ts, already priced Rs 1 under the competitor (no PRICE_FACTOR).

import data from "./print-configs.data.json";
import cardArt from "../../public/images/cards/index.json";
import { WEDDING_CONFIG_ROWS } from "./wedding-prices";

export type Tier = [qty: number, total: number];
export type ConfigRow = { sel: Record<string, string>; tiers: Tier[] };
export type CardImage = { photo: string; art: string };
export type ConfigField = { key: string; label: string; hint?: Record<string, string>; /** Picture per value (photo + illustration fallback): shown as a clickable tile grid instead of a plain dropdown, and swapped into the product gallery. */ images?: Record<string, CardImage> };
export type ConfigExtra = { key: string; label: string; choices: string[]; when?: Record<string, string>; /** Hide when sel[key] is one of these values. */ unless?: Record<string, string[]> };
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

/** Fixed prices that replace the grid price for one combination: Rs 1 under the cheapest competitor (checked 4 Nov 2026).
 *  `each` sets every quantity tier to each × qty; `tiers` sets only the listed quantities. */
const PINNED: Record<string, { sel: Record<string, string>; each?: number; tiers?: Record<number, number> }[]> = {
  "business-cards": [{ sel: { type: "Standard" }, tiers: { 100: 178 } }], // PrintStop 100 standard cards ₹179
  "banners-standees": [{ sel: { type: "Flex banner", size: "1 x 2 ft" }, each: 117 }], // PrintStop 3x1 ft flex ₹177, scaled by area
};
for (const [slug, pins] of Object.entries(PINNED)) {
  for (const pin of pins) {
    const row = D[slug]?.find((r) => Object.keys(r.sel).length === Object.keys(pin.sel).length && Object.entries(pin.sel).every(([k, v]) => r.sel[k] === v));
    if (!row) continue;
    row.tiers = row.tiers.map(([q, t]) => [q, pin.each != null ? pin.each * q : pin.tiers?.[q] ?? t] as Tier);
  }
}
const BROCHURE_FLAT: Record<string, string> = { "bi-A5": "297 x 210 mm", "bi-DL": "198 x 210 mm", "bi-A6": "210 x 148 mm", "tri-DL": "297 x 210 mm", "tri-A6": "315 x 148 mm" };

const CARD_SIZE: Record<string, string> = { Classic: "91 x 55 mm", "Custom Shape": "91 x 55 mm", Square: "63.5 x 63.5 mm", Circle: "63.5 x 63.5 mm", Transparent: "85 x 54 mm", Magnetic: "87 x 49 mm" };
const CARD_HINT: Record<string, string> = {
  Standard: "Our everyday card: 89 × 51 mm on 300 gsm board, full colour both sides.",
  Classic: "Slightly larger 91 × 55 mm card on thick 350 gsm board.",
  "Premium Plus": "Extra-thick 400 gsm board with a soft matte laminate.",
  Matte: "Smooth matte laminate, no glare. Also in square or with rounded corners.",
  Glossy: "High-gloss laminate for vivid colour. Also in square or with rounded corners.",
  "Velvet Touch": "Soft-touch velvet laminate that feels like suede.",
  "Spot UV": "Glossy raised UV highlights on a matte card: logo, name or pattern.",
  "Raised Gold Foil": "Raised metallic gold foil on your logo or text, on 350 gsm board.",
  Pearl: "Shimmering pearlescent 250 gsm paper.",
  Kraft: "Natural brown kraft board, 250 gsm, with a rustic feel.",
  Transparent: "Frosted clear plastic card, 85 × 54 mm.",
  "Non-Tearable": "Waterproof, tear-proof 260 micron synthetic card.",
  Magnetic: "Flexible fridge magnet card, 87 × 49 mm: stays on the fridge, not in a drawer.",
  "QR Code": "Standard card with a scannable QR code to your website, UPI or vCard.",
  "Rounded Corner": "Standard 89 × 51 mm card with softly rounded corners.",
  Square: "Square 63.5 × 63.5 mm card on 350 gsm board.",
  Circle: "Round 63.5 mm card on 350 gsm board.",
  Oval: "Oval die-cut card, 89 × 51 mm, on 350 gsm board.",
  Leaf: "Leaf-shaped die-cut card, 89 × 51 mm, on 350 gsm board.",
  Diamond: "Diamond-shaped die-cut card, 89 × 51 mm.",
  "Custom Shape": "Die-cut to your own outline (send us the shape), 91 × 55 mm area, 350 gsm.",
  Bulk: "Standard 89 × 51 mm cards at trade prices for 1,500 or more.",
};

export const PRINT_CONFIGS: Record<string, PrintConfig> = {
  "business-cards": {
    fields: [
      { key: "type", label: "Card type", hint: CARD_HINT, images: cardArt as Record<string, CardImage> },
      { key: "shape", label: "Shape" },
      { key: "corners", label: "Corners" },
      { key: "stock", label: "Card stock" },
    ],
    extras: [{ key: "orientation", label: "Orientation", choices: ["Horizontal", "Vertical"], unless: { type: ["Square", "Circle", "Custom Shape"], shape: ["Square (63.5 × 63.5 mm)"] } }],
    rows: D["business-cards"],
    unit: "cards",
    printSize: (s) => (s.shape?.startsWith("Square") ? "63.5 x 63.5 mm" : CARD_SIZE[s.type] ?? "89 x 51 mm"),
    note: "Printed full colour on both sides. Prices include GST; delivery is free on orders over ₹999.",
  },
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
  // ---------- Wedding (rows and prices: wedding-prices.ts) ----------
  "wedding-invitation-cards": {
    fields: [
      { key: "style", label: "Card style", hint: { "Flat card": "Single card printed on both sides.", "Folded card": "Folds like a greeting card: cover, inside spread and back. 5 × 7 in only." } },
      { key: "size", label: "Size" },
    ],
    extras: [{ key: "paper", label: "Paper", choices: ["Premium matte 350 gsm", "Premium glossy 350 gsm"] }, { key: "orientation", label: "Orientation", choices: ["Vertical", "Horizontal"] }],
    rows: WEDDING_CONFIG_ROWS["wedding-invitation-cards"],
    unit: "cards",
    printSize: (s) => (s.size === '6 x 9"' ? "6 x 9 in" : "5 x 7 in"),
    orient: (s) => (s.orientation === "Horizontal" ? "landscape" : "portrait"),
    note: "Prices include GST. Matching envelopes, function cards and seals are sold separately. Need a language other than English? Add it in the notes and our designer sets it.",
  },
  "wedding-function-cards": {
    fields: [{ key: "size", label: "Size" }],
    extras: [
      { key: "function", label: "Function", choices: ["Haldi", "Mehndi", "Sangeet", "Cocktail", "Reception", "Roka / Sagai (engagement)", "Tilak", "Chooda / Jaago", "Mayra / Bhaat", "Griha Pravesh", "RSVP card", "Itinerary / schedule", "Other (tell us)"] },
      { key: "paper", label: "Paper", choices: ["Premium matte 350 gsm", "Premium glossy 350 gsm"] },
    ],
    rows: WEDDING_CONFIG_ROWS["wedding-function-cards"],
    unit: "cards",
    printSize: (s) => (s.size.startsWith("7.2") ? "182 x 117 mm" : "139 x 107 mm"),
    note: "One function per order line: add the product again for each function so every card gets its own quantity.",
  },
  "save-the-date-cards": {
    fields: [{ key: "size", label: "Size" }],
    extras: [{ key: "paper", label: "Paper", choices: ["Premium matte 350 gsm", "Premium glossy 350 gsm"] }],
    rows: WEDDING_CONFIG_ROWS["save-the-date-cards"],
    unit: "cards",
    printSize: (s) => (s.size.startsWith("7.2") ? "182 x 117 mm" : "139 x 107 mm"),
  },
  "wedding-card-envelopes": {
    fields: [{ key: "size", label: "Envelope size", hint: { "14.6 x 11 cm": "Fits A6 function, save-the-date and thank-you cards.", "19 x 12 cm": "Fits 5 × 7 in invitations and the larger function cards.", "22 x 11 cm (DL)": "Long envelope; also used for shagun.", "22.9 x 16.2 cm (C5)": "Fits 6 × 9 in invitations." } }],
    rows: WEDDING_CONFIG_ROWS["wedding-card-envelopes"],
    unit: "envelopes",
    printSize: (s) => ({ "14.6 x 11 cm": "146 x 110 mm", "19 x 12 cm": "190 x 120 mm", "22 x 11 cm (DL)": "220 x 110 mm", "22.9 x 16.2 cm (C5)": "229 x 162 mm" }[s.size] ?? "190 x 120 mm"),
  },
  "wedding-welcome-boards": {
    fields: [{ key: "size", label: "Board size" }],
    extras: [
      { key: "sign", label: "Sign type", choices: ["Welcome board", "Seating chart", "Direction sign", "Bride's side / Groom's side", "Hashtag / Instagram sign", "Bar or counter sign", "Mandap ritual guide", "Other (tell us)"] },
      { key: "orientation", label: "Orientation", choices: ["Vertical", "Horizontal"] },
    ],
    rows: WEDDING_CONFIG_ROWS["wedding-welcome-boards"],
    unit: "boards",
    printSize: (s) => (s.size.startsWith("A2") ? "420 x 594 mm" : s.size.replace('"', " in")),
    orient: (s) => (s.orientation === "Horizontal" ? "landscape" : "portrait"),
    note: "Printed on rigid 5 mm foam board. Need a taller board or a flex welcome standee? See Banners & Standees, or message us on WhatsApp.",
  },
  "wedding-menu-cards": {
    fields: [{ key: "size", label: "Size" }],
    extras: [
      { key: "card", label: "Card type", choices: ["Menu card", "Ceremony programme", "Mandap & phere guide", "Welcome letter", "Itinerary"] },
      { key: "paper", label: "Paper", choices: ["Premium matte 350 gsm", "Premium glossy 350 gsm"] },
    ],
    rows: WEDDING_CONFIG_ROWS["wedding-menu-cards"],
    unit: "cards",
    printSize: (s) => (s.size === '6 x 9"' ? "6 x 9 in" : "5 x 7 in"),
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
  const extras = (cfg.extras ?? []).filter((x) => (!x.when || Object.entries(x.when).every(([k, v]) => sel[k] === v)) && (!x.unless || Object.entries(x.unless).every(([k, vs]) => !vs.includes(sel[k]))));
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
