// Physical print specification for every personalisable product.
// The design studio works in real millimetres so that what customers see on
// screen (bleed, trim, safe zone, photo quality) matches what the press prints.
import type { Product, Variant } from "@/data/catalog";

export type Face = {
  id: string;
  label: string;
  /** Photo frames the starter layout puts on this face. */
  slots: number;
  /** What the face is for; drives the starter layout. */
  role: "single" | "front" | "back" | "cover" | "page" | "month" | "print" | "collage" | "postcard-back";
  /** Calendar month pages: year and 0-based month. */
  month?: { year: number; month: number };
};

export type PrintSpec = {
  wMM: number; // trim width
  hMM: number; // trim height
  bleedMM: number;
  safeMM: number;
  faces: Face[];
  /** Short line shown in the studio header, e.g. "89 × 51 mm business card". */
  label: string;
  /** Mugs and bottles wrap around; the studio shows where the handle sits. */
  wrap?: "mug";
  /** Text-first products (labels, name stickers) open on a name layout. */
  textFirst: boolean;
};

const IN = 25.4;
const PAPER: Record<string, [number, number]> = { A3: [297, 420], A4: [210, 297], A5: [148, 210], A6: [105, 148], B5: [176, 250] };

/** Sizes for products whose variant names don't state one (trim, in mm). */
const FIXED: Record<string, [number, number]> = {
  "business-cards": [89, 51], "event-id-cards": [54, 86], "custom-stickers": [51, 51],
  "lunch-box": [130, 100], "snack-box": [130, 100], "name-stickers": [60, 20], "iron-on-labels": [45, 15], "name-slips": [100, 50],
  "name-tag": [75, 50], "letter-charms": [40, 40], "drawstring-bag": [280, 350], "pencil-pouch": [200, 100],
  "personalised-pencils": [150, 30], "doms-pencils": [150, 30], "crayon-box": [140, 100], "exam-board": [230, 330],
  "weekly-planner": [260, 200], "foldable-study-table": [600, 400], "name-board": [300, 150], "photo-puzzle": [254, 191],
  "rakhi-for-kids": [60, 60], "money-envelopes": [90, 180], "gift-tags": [50, 72], "cake-topper": [150, 100],
  "insulated-water-bottle": [80, 200], "hydro-water-bottle-600": [80, 200], "personalised-water-bottle": [80, 200],
  "pet-tags": [32, 32], "name-keychain": [40, 40], "designer-keytag": [40, 40], "mobile-skin": [75, 160], "laptop-skin": [330, 220],
  "tote-bag": [270, 300], pouch: [210, 130], "pocket-notebook": [91, 130], "photo-magnets": [64, 64], "bag-tag": [90, 60],
  "wall-calendar-portrait": [300, 400], "wall-calendar-landscape": [400, 300], "five-year-diary": [150, 200], "combo-gift-set": [200, 154],
  "custom-corporate-printing": [148, 210], "storybook": [140, 140], "childrens-wall-clock": [254, 254], "designer-wall-clock": [305, 305],
};
const MUG: [number, number] = [228, 95];

function parseSize(name: string): [number, number] | null {
  const withPrint = name.match(/with\s+(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*print/i);
  if (withPrint) return [Number(withPrint[1]) * IN, Number(withPrint[2]) * IN];
  const paper = name.match(/\b(A[3-6]|B5)\b/);
  const pair = name.match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)(?:\s*[x×]\s*\d+(?:\.\d+)?)?\s*(ft|cm|mm|"|in)?/i);
  if (pair) {
    const unit = (pair[3] ?? '"').toLowerCase();
    const k = unit === "ft" ? 304.8 : unit === "cm" ? 10 : unit === "mm" ? 1 : IN;
    return [Number(pair[1]) * k, Number(pair[2]) * k];
  }
  if (paper) return PAPER[paper[1]];
  const single = name.match(/(\d+(?:\.\d+)?)\s*"/);
  if (single) return [Number(single[1]) * IN, Number(single[1]) * IN];
  return null;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
export const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function printSpec(product: Product, variant: Variant, opts: Record<string, string> = {}): PrintSpec {
  const t = product.template;
  let size = product.slug.includes("mug") ? MUG : FIXED[product.slug] ?? parseSize(variant.name);
  if (!size) {
    const long = product.category === "calendars" ? 300 : 150;
    size = t.aspect >= 1 ? [long, long / t.aspect] : [long * t.aspect, long];
  }
  let [w, h] = size;
  // Match the template's orientation (variant names often list the short side first).
  if ((t.aspect > 1.02 && w < h) || (t.aspect < 0.98 && w > h)) [w, h] = [h, w];
  if (opts.orientation === "portrait" && w > h) [w, h] = [h, w];
  if (opts.orientation === "landscape" && h > w) [w, h] = [h, w];
  w = Math.round(w * 10) / 10; h = Math.round(h * 10) / 10;

  const big = Math.max(w, h);
  const banner = product.slug === "banners-standees";
  const small = big <= 100;
  const bleedMM = banner ? 10 : small ? 2 : 3;
  const safeMM = banner ? 25 : big > 400 ? 8 : big > 200 ? 5 : 3;

  const faces = facesFor(product, variant, opts);
  const textFirst = t.photoSlots === 0;
  const dims = `${fmt(w)} × ${fmt(h)} mm`;
  return { wMM: w, hMM: h, bleedMM, safeMM, faces, label: dims, wrap: product.slug.includes("mug") ? "mug" : undefined, textFirst };
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

function facesFor(product: Product, variant: Variant, opts: Record<string, string>): Face[] {
  const t = product.template, slug = product.slug;
  const one = (role: Face["role"] = "single", label = "Design", slots = t.photoSlots): Face[] => [{ id: "f1", label, slots, role }];
  const two = (a: string, b: string, backRole: Face["role"] = "back", backSlots = 0): Face[] => [
    { id: "front", label: a, slots: t.photoSlots ? 1 : 0, role: "front" }, { id: "back", label: b, slots: backSlots, role: backRole }];

  if (slug === "business-cards") return two("Front", "Back");
  if (slug === "photo-postcards") return two("Front", "Back", opts.back === "postcard" || !opts.back ? "postcard-back" : "back");
  if (slug === "event-id-cards") return opts.sides === "double" ? two("Front", "Back") : one("front", "Front", 1);
  if (slug === "brochures-flyers") return opts.sides === "single" ? one("front", "Front", 1) : two("Front", "Back", "back", 1);
  if (slug === "gift-paper-bags") return opts.sides === "two" ? two("Side A", "Side B", "back", 1) : one("front", "Side A", 1);
  if (slug.startsWith("photo-cushion")) return opts.back === "photo" ? two("Front", "Back", "back", 1) : opts.back === "message" ? two("Front", "Back") : one("front", "Front", 1);
  if (product.category === "photobooks") {
    const pages = slug === "book-designing-service" ? 12 : t.photoSlots;
    return [{ id: "cover", label: "Cover", slots: 1, role: "cover" }, ...Array.from({ length: pages - 1 }, (_, i) => ({ id: `p${i + 1}`, label: `Page ${i + 1}`, slots: i % 3 === 2 ? 2 : 1, role: "page" as const }))];
  }
  if (product.category === "calendars" && t.photoSlots > 1) {
    const year = Number(product.name.match(/20\d\d/)?.[0] ?? new Date().getFullYear() + 1);
    const start = Math.max(0, MONTHS.indexOf(opts.start ?? "jan"));
    return [{ id: "cover", label: "Cover", slots: 1, role: "cover" }, ...Array.from({ length: 12 }, (_, i) => {
      const m = (start + i) % 12, y = year + Math.floor((start + i) / 12);
      return { id: `m${i + 1}`, label: MONTH_NAMES[m].slice(0, 3) + (y !== year ? ` ${y}` : ""), slots: 1, role: "month" as const, month: { year: y, month: m } };
    })];
  }
  if (slug === "collage-poster") return one("collage", "Poster", t.photoSlots);
  if (t.photoSlots > 1) return Array.from({ length: t.photoSlots }, (_, i) => ({ id: `p${i + 1}`, label: `${i + 1}`, slots: 1, role: "print" as const }));
  if (slug === "poster-calendar") return [{ id: "f1", label: "Poster", slots: 1, role: "single", month: { year: Number(product.name.match(/20\d\d/)?.[0] ?? 2027), month: -1 } }];
  return one();
}

/** Text fields that are instructions for the team, not printed on the product. */
export const NON_PRINT_KEYS = new Set(["notes", "brief", "message", "start", "tagline", "address", "email", "phone", "names", "model", "back", "spine"]);
/** Fields that are printed for a given product (business cards print contact details). */
export function printedFields(product: Product) {
  const card = ["business-cards", "event-id-cards", "name-tag", "bag-tag", "pet-tags"].includes(product.slug);
  return product.template.textFields.filter((f) => (card ? !["names"].includes(f.key) : !NON_PRINT_KEYS.has(f.key)));
}

/** Products where customers can upload a finished, print-ready design instead of using the editor. */
export function allowsOwnDesign(product: Product) {
  if (product.personalisation === "none" || product.category === "diaries-planners" || product.slug === "book-designing-service") return false;
  return product.template.photoSlots > 0 || product.category === "business-printing";
}

/** File requirements shown to customers uploading their own design. */
export function artworkRequirements(spec: PrintSpec) {
  const W = spec.wMM + 2 * spec.bleedMM, H = spec.hMM + 2 * spec.bleedMM, big = Math.max(W, H);
  const dpi = big > 1000 ? 100 : big > 500 ? 150 : 300;
  const px = (mm: number) => Math.round((mm / 25.4) * dpi);
  return { W: fmt(W), H: fmt(H), w: fmt(spec.wMM), h: fmt(spec.hMM), bleed: spec.bleedMM, safe: spec.safeMM, dpi, pxW: px(W), pxH: px(H) };
}
