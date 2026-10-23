// Starter layouts. Every product face opens on one of these, and customers can
// switch layouts from the Layouts tab. All coordinates are trim-relative mm.
import * as F from "fabric";
import type { Product } from "@/data/catalog";
import { MONTH_NAMES, printedFields, type Face, type PrintSpec } from "@/lib/print-spec";
import { C, Frame, FullFrame, Icon, Ln, MonthGrid, P, QR, R, Ring, T, type Geo, type Obj } from "./engine";

export type Built = { bg: string; objs: Obj[] };
export type Ctx = { g: Geo; spec: PrintSpec; product: Product; face: Face; opts: Record<string, string>; values: Record<string, string> };
export type Preset = { id: string; label: string; hint?: string };

/* ---------- palettes driven by product options ---------- */
const THEME: Record<string, { bg: string; ink: string; accent: string; dot: string }> = {
  dinosaurs: { bg: "#DDEFD3", ink: "#21452A", accent: "#4F9D4A", dot: "#B9DDA9" },
  space: { bg: "#1B2246", ink: "#FFFFFF", accent: "#F7C948", dot: "#2F3A72" },
  unicorns: { bg: "#F1E4FA", ink: "#5B2C83", accent: "#E77FC2", dot: "#E3CCF4" },
  jungle: { bg: "#E6EFD0", ink: "#2E4A1E", accent: "#E08E2B", dot: "#CFE0A8" },
  cars: { bg: "#FDE6E2", ink: "#7A1E14", accent: "#E2412F", dot: "#F8C7BF" },
  ocean: { bg: "#DCEFFB", ink: "#0E3D63", accent: "#1F8CC8", dot: "#B9DDF4" },
  princess: { bg: "#FDE4EE", ink: "#7B1F4B", accent: "#D94F8C", dot: "#F9C6DA" },
  superhero: { bg: "#FFF1C9", ink: "#1F2F7A", accent: "#E23B2E", dot: "#FFE08A" },
};
const BOTTLE: Record<string, string> = { "sky-blue": "#CFE6F7", mint: "#D3F0E3", lilac: "#E6DDF6", coral: "#FBD9CF", steel: "#DDE1E5" };
const DIARY: Record<string, string> = { black: "#1F1D1B", brown: "#5A3A28", tan: "#B98A5C", navy: "#1F2A44", red: "#7A2430", green: "#24463A", grey: "#4A4E52" };

function palette(ctx: Ctx) {
  const o = ctx.opts;
  if (o.theme && THEME[o.theme]) return THEME[o.theme];
  if (ctx.product.category === "diaries-planners") {
    const bg = DIARY[o.colour ?? "black"] ?? "#1F1D1B";
    const ink = o.emboss === "gold" ? "#D8B25A" : o.emboss === "silver" ? "#D7D9DC" : shade(bg, 0.25);
    return { bg, ink, accent: ink, dot: shade(bg, 0.08) };
  }
  if (o.colour && BOTTLE[o.colour]) return { bg: BOTTLE[o.colour], ink: "#1F2A44", accent: "#E2573F", dot: "#FFFFFF" };
  return { bg: "#FFFFFF", ink: "#1D1A17", accent: "#E2573F", dot: "#F3EEE6" };
}
function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16); const f = (c: number) => Math.round(Math.min(255, c + (255 - c) * amt));
  return "#" + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(f).map((v) => v.toString(16).padStart(2, "0")).join("");
}

const SAMPLE: Record<string, string> = {
  name: "Aarav", title: "Our Story", caption: "Best day ever", headline: "GRAND OPENING", subline: "This Saturday · 10 am onwards",
  company: "Your Company", event: "Annual Tech Summit 2027", role: "DELEGATE", initial: "A", age: "5", class: "Class 2-B",
  message: "Made with love, just for you.", back: "Wish you were here!", model: "", phone: "+91 90000 00000",
};
export const sample = (key: string, label: string) => SAMPLE[key] ?? label.replace(/\(.*?\)/g, "").trim();
const val = (ctx: Ctx, key: string, label: string) => ctx.values[key]?.trim() || sample(key, label);

/* ---------- which presets a face offers ---------- */
export function presetsFor(ctx: Ctx): Preset[] {
  const { face, product, spec } = ctx;
  if (product.slug === "business-cards") return CARDS.map((c) => ({ id: "card:" + c.id, label: c.name, hint: c.note }));
  if (face.role === "month") return [{ id: "month", label: "Photo above dates" }, { id: "month-full", label: "Full photo, date panel" }, { id: "blank", label: "Blank" }];
  if (face.role === "postcard-back") return [{ id: "postcard", label: "Postcard back" }, { id: "message", label: "Message" }, { id: "blank", label: "Blank" }];
  if (face.role === "collage") return [{ id: "grid", label: "Grid with title" }, { id: "grid-tight", label: "Edge-to-edge grid" }, { id: "mosaic", label: "Mosaic" }];
  const list: Preset[] = [];
  if (spec.textFirst) list.push({ id: "name", label: "Name" }, { id: "name-badge", label: "Name badge" }, { id: "name-icon", label: "Name with icon" });
  else {
    list.push({ id: "full", label: "Full photo" }, { id: "border", label: "Photo with border" }, { id: "band", label: "Photo with title band" }, { id: "split", label: "Photo and text" }, { id: "two", label: "Two photos" }, { id: "grid", label: "Four photos" });
    if (face.month?.month === -1) list.unshift({ id: "poster-year", label: "Photo with full year" });
    if (product.slug === "event-id-cards") list.unshift({ id: "id-card", label: "ID badge" });
    if (product.slug === "banners-standees") list.unshift({ id: "banner", label: "Banner" });
  }
  if (face.role === "back") list.unshift({ id: "back-plain", label: "Simple back" });
  list.push({ id: "blank", label: "Blank" });
  return list;
}

export function defaultPreset(ctx: Ctx): string {
  const { face, product, spec } = ctx;
  if (product.slug === "business-cards") return "card:ledger";
  if (face.role === "month") return "month";
  if (face.role === "postcard-back") return "postcard";
  if (face.role === "collage") return "grid";
  if (face.month?.month === -1) return "poster-year";
  if (product.slug === "event-id-cards" && face.role === "front") return "id-card";
  if (product.slug === "banners-standees") return "banner";
  if (face.role === "back") return face.slots ? "full" : "back-plain";
  if (spec.textFirst) return "name";
  if (face.slots >= 2) return face.slots === 2 ? "two" : "grid";
  if (face.role === "cover") return "band";
  if (face.role === "page" || face.role === "print") return "full";
  return printedFields(product).length ? "band" : "full";
}

/* ---------- builders ---------- */
export function build(id: string, ctx: Ctx): Built {
  if (id.startsWith("card:")) return buildCard(id.slice(5), ctx.face.role === "back" ? "back" : "front", ctx);
  const { g, spec, product } = ctx;
  const W = spec.wMM, H = spec.hMM, s = spec.safeMM, b = spec.bleedMM;
  const pal = palette(ctx);
  const fields = printedFields(product);
  const first = fields[0], second = fields[1];
  const minSide = Math.min(W, H);
  const titlePt = Math.max(7, Math.min(48, (minSide / 10) / 0.3528 * 0.9));
  const objs: Obj[] = [];
  const field = (f: { key: string; label: string } | undefined, x: number, y: number, o: Parameters<typeof T>[4]) => f && objs.push(T(g, val(ctx, f.key, f.label), x, y, { ...o, field: f.key }));

  switch (id) {
    case "full": {
      objs.push(FullFrame(g));
      return { bg: "#FFFFFF", objs };
    }
    case "border": {
      const m = Math.max(s, minSide * 0.06);
      const capH = first ? Math.max(8, H * 0.14) : 0;
      objs.push(Frame(g, m, m, W - 2 * m, H - 2 * m - capH));
      field(first, W / 2, H - m - capH / 2, { f: "Playfair Display", pt: titlePt * 0.55, c: "#1d1a17", ox: "center", oy: "center", it: true });
      return { bg: "#FFFFFF", objs };
    }
    case "band": {
      objs.push(FullFrame(g));
      if (first) {
        const bh = Math.max(10, H * 0.2);
        objs.push(R(g, -b, H - bh, W + 2 * b, bh + b, "rgba(20,16,12,0.55)"));
        field(first, W / 2, H - bh / 2, { f: "Fraunces Variable", pt: titlePt * 0.75, c: "#FFFFFF", w: "600", ox: "center", oy: "center" });
      }
      return { bg: "#FFFFFF", objs };
    }
    case "split": {
      const land = W >= H;
      if (land) { objs.push(Frame(g, -b, -b, W * 0.55 + b, H + 2 * b)); field(first, W * 0.775, H * 0.42, { f: "Fraunces Variable", pt: titlePt * 0.7, c: pal.ink, w: "600", ox: "center", oy: "center" }); field(second, W * 0.775, H * 0.58, { pt: titlePt * 0.35, c: "#5b554e", ox: "center", oy: "center" }); }
      else { objs.push(Frame(g, -b, -b, W + 2 * b, H * 0.68 + b)); field(first, W / 2, H * 0.8, { f: "Fraunces Variable", pt: titlePt * 0.7, c: pal.ink, w: "600", ox: "center", oy: "center" }); field(second, W / 2, H * 0.9, { pt: titlePt * 0.35, c: "#5b554e", ox: "center", oy: "center" }); }
      return { bg: pal.bg === "#FFFFFF" ? "#FAF6F0" : pal.bg, objs };
    }
    case "two": {
      const gap = Math.max(1.5, minSide * 0.02);
      if (W >= H) { objs.push(Frame(g, -b, -b, W / 2 - gap / 2 + b, H + 2 * b), Frame(g, W / 2 + gap / 2, -b, W / 2 - gap / 2 + b, H + 2 * b)); }
      else { objs.push(Frame(g, -b, -b, W + 2 * b, H / 2 - gap / 2 + b), Frame(g, -b, H / 2 + gap / 2, W + 2 * b, H / 2 - gap / 2 + b)); }
      return { bg: "#FFFFFF", objs };
    }
    case "grid": case "grid-tight": case "mosaic": {
      const n = ctx.face.role === "collage" ? Math.max(4, ctx.face.slots) : 4;
      const tight = id === "grid-tight";
      const top = ctx.face.role === "collage" && !tight && first ? Math.max(12, H * 0.1) : 0;
      const gap = tight ? 0.8 : Math.max(1.5, minSide * 0.012);
      const m = tight ? 0 : Math.max(s, gap * 2);
      const area = { x: m, y: m + top, w: W - 2 * m, h: H - 2 * m - top };
      const cells = id === "mosaic" ? mosaic(n, area, gap) : grid(n, area, gap);
      cells.forEach((r) => objs.push(Frame(g, r.x, r.y, r.w, r.h)));
      if (top) field(first, W / 2, m + top / 2, { f: "Fraunces Variable", pt: titlePt * 0.8, c: "#1d1a17", w: "600", ox: "center", oy: "center" });
      return { bg: tight ? "#FFFFFF" : "#FAF6F0", objs };
    }
    case "poster-year": {
      const ph = H * 0.55;
      objs.push(Frame(g, -b, -b, W + 2 * b, ph + b));
      field(first, W / 2, ph + H * 0.05, { f: "Fraunces Variable", pt: titlePt * 0.7, c: "#1d1a17", w: "600", ox: "center", oy: "center" });
      const year = ctx.face.month!.year;
      const gx = s + 4, gy = ph + H * 0.1, gw = W - 2 * gx, gh = H - gy - s - 2;
      const cw = gw / 4, ch = gh / 3;
      for (let m = 0; m < 12; m++) {
        const cx = gx + (m % 4) * cw, cy = gy + Math.floor(m / 4) * ch;
        objs.push(T(g, MONTH_NAMES[m].toUpperCase(), cx + cw / 2, cy + 1, { pt: Math.max(5, cw / 14 / 0.3528), w: "700", c: "#E2573F", ox: "center", cs: 150 }));
        objs.push(MonthGrid(g, year, m, { x: cx + cw * 0.06, y: cy + ch * 0.14, w: cw * 0.88, h: ch * 0.8 }, { ink: "#1d1a17", accent: "#E2573F", muted: "#8c857c" }));
      }
      return { bg: "#FFFFFF", objs };
    }
    case "month": case "month-full": {
      const { year, month } = ctx.face.month!;
      const col = { ink: "#1d1a17", accent: "#E2573F", muted: "#8c857c" };
      if (id === "month") {
        const ph = H * (W > H * 1.6 ? 0.5 : 0.58);
        objs.push(Frame(g, -b, -b, W + 2 * b, ph + b));
        objs.push(T(g, MONTH_NAMES[month], s + 2, ph + H * 0.035, { f: "Fraunces Variable", pt: Math.max(8, H * 0.06 / 0.3528), w: "600", c: col.ink }));
        objs.push(T(g, String(year), W - s - 2, ph + H * 0.045, { pt: Math.max(6, H * 0.035 / 0.3528), w: "600", c: col.accent, ox: "right", cs: 200 }));
        const gy = ph + H * 0.13;
        objs.push(MonthGrid(g, year, month, { x: s + 1, y: gy, w: W - 2 * s - 2, h: H - gy - s }, col));
        return { bg: "#FFFFFF", objs };
      }
      objs.push(FullFrame(g));
      const pw = W * 0.42, ph = H * 0.5, px = W - s - pw, py = H - s - ph;
      objs.push(R(g, px, py, pw, ph, "rgba(255,255,255,0.92)", { rx: 2 * 10, ry: 2 * 10 }));
      objs.push(T(g, MONTH_NAMES[month], px + 3, py + 2.5, { f: "Fraunces Variable", pt: Math.max(7, ph * 0.12 / 0.3528), w: "600", c: col.ink }));
      objs.push(MonthGrid(g, year, month, { x: px + 2, y: py + ph * 0.24, w: pw - 4, h: ph * 0.72 }, col));
      return { bg: "#FFFFFF", objs };
    }
    case "postcard": {
      objs.push(Ln(g, W / 2, s + 4, W / 2, H - s - 4, "#c9c1b5", 0.3));
      objs.push(T(g, "POST CARD", W / 2, s, { pt: 7, w: "700", c: "#8c857c", ox: "center", cs: 400 }));
      objs.push(R(g, W - s - 20, s + 2, 18, 22, "transparent", { stroke: "#c9c1b5", strokeWidth: 3, strokeDashArray: [8, 6] }));
      objs.push(T(g, "STAMP", W - s - 11, s + 13, { pt: 5, c: "#b5a998", ox: "center", oy: "center", cs: 200 }));
      for (let i = 0; i < 4; i++) objs.push(Ln(g, W / 2 + 6, H * 0.5 + i * 10, W - s - 2, H * 0.5 + i * 10, "#c9c1b5", 0.3));
      objs.push(T(g, val(ctx, "back", "Message"), s + 2, s + 12, { f: "Lora", pt: 10, it: true, c: "#3b3530", width: W / 2 - s - 8, field: "back" }));
      return { bg: "#FFFFFF", objs };
    }
    case "message": case "back-plain": {
      const msgKey = product.template.textFields.find((f) => f.key === "message" || f.key === "back");
      if (id === "message" || (msgKey && ctx.opts.back === "message")) {
        objs.push(T(g, val(ctx, msgKey?.key ?? "message", "Message"), W / 2, H / 2, { f: "Lora", pt: titlePt * 0.55, it: true, c: pal.ink, ox: "center", oy: "center", width: W * 0.8, field: msgKey?.key ?? "message" }));
        return { bg: "#FFFFFF", objs };
      }
      // Cushion pattern back / generic back: a quiet repeating dot pattern.
      const step = Math.max(6, minSide / 10);
      for (let y = step / 2; y < H; y += step) for (let x = ((y / step) % 2) * step / 2 + step / 2; x < W; x += step) objs.push(C(g, x, y, step * 0.12, pal.accent === "#E2573F" ? "#F0C9BE" : pal.dot));
      return { bg: pal.bg === "#FFFFFF" ? "#FDF6F1" : pal.bg, objs };
    }
    case "name": case "name-badge": case "name-icon": {
      const name = product.template.textFields[0];
      const pt = Math.max(8, Math.min(H * 0.42, W / Math.max(5, val(ctx, name?.key ?? "name", "Name").length) * 1.6) / 0.3528);
      if (id === "name-badge") {
        objs.push(R(g, s, s, W - 2 * s, H - 2 * s, pal.bg === "#FFFFFF" ? "#FDEBE6" : pal.dot, { rx: minSide * 0.15 * 10, ry: minSide * 0.15 * 10 }));
      } else if (!ctx.product.category.startsWith("diaries")) {
        const step = Math.max(4, minSide / 4);
        for (let x = step / 2; x < W; x += step) { objs.push(C(g, x, step * 0.3, step * 0.12, pal.dot)); objs.push(C(g, x, H - step * 0.3, step * 0.12, pal.dot)); }
      }
      const iconW = id === "name-icon" ? Math.min(H * 0.55, W * 0.2) : 0;
      if (iconW) objs.push(Icon(g, ctx.opts.theme === "space" ? "star" : product.slug === "pet-tags" ? "paw" : product.slug === "cake-topper" ? "cake" : "heart", s + 1, H / 2 - iconW / 2, iconW, pal.accent));
      if (name) objs.push(T(g, val(ctx, name.key, name.label), (W + iconW) / 2, H / 2, { f: product.category.startsWith("diaries") ? "Playfair Display" : "Baloo 2", pt: iconW ? pt * 0.85 : pt, w: "700", c: pal.ink, ox: "center", oy: "center", field: name.key }));
      const extra = product.template.textFields[1];
      if (extra && !["tagline", "start", "message"].includes(extra.key) && H > 20) objs.push(T(g, val(ctx, extra.key, extra.label), (W + iconW) / 2, H / 2 + pt * 0.3528 * 0.75, { pt: pt * 0.35, c: pal.ink, ox: "center", oy: "top", field: extra.key }));
      return { bg: pal.bg, objs };
    }
    case "id-card": {
      objs.push(R(g, -b, -b, W + 2 * b, H * 0.3 + b, "#1F2A44"));
      objs.push(T(g, val(ctx, "event", "Event"), W / 2, H * 0.15, { pt: 7, w: "700", c: "#FFFFFF", ox: "center", oy: "center", field: "event", width: W - 2 * s }));
      objs.push(Frame(g, W / 2 - W * 0.28, H * 0.36, W * 0.56, W * 0.56));
      objs.push(T(g, "Attendee Name", W / 2, H * 0.36 + W * 0.56 + 5, { f: "Poppins", pt: 10, w: "700", c: "#1d1a17", ox: "center" }));
      objs.push(R(g, -b, H - H * 0.12, W + 2 * b, H * 0.12 + b, "#E2573F"));
      objs.push(T(g, val(ctx, "role", "Role"), W / 2, H - H * 0.06, { pt: 7, w: "700", c: "#FFFFFF", ox: "center", oy: "center", cs: 300, field: "role" }));
      return { bg: "#FFFFFF", objs };
    }
    case "banner": {
      objs.push(Frame(g, W * 0.58, -b, W * 0.42 + b, H + 2 * b));
      objs.push(T(g, val(ctx, "headline", "Headline"), s, H * 0.28, { f: "Oswald", pt: H * 0.11 / 0.3528, w: "600", c: "#FFFFFF", field: "headline", width: W * 0.55 - s }));
      objs.push(T(g, val(ctx, "subline", "Subline"), s, H * 0.62, { pt: H * 0.06 / 0.3528, c: "#FDEBE6", field: "subline", width: W * 0.55 - s }));
      return { bg: "#E2573F", objs };
    }
    default:
      return { bg: "#FFFFFF", objs: [] };
  }
}

function grid(n: number, a: { x: number; y: number; w: number; h: number }, gap: number) {
  const aspect = a.w / a.h;
  const cols = Math.max(1, Math.round(Math.sqrt(n * aspect))), rows = Math.ceil(n / cols);
  const w = (a.w - gap * (cols - 1)) / cols, h = (a.h - gap * (rows - 1)) / rows;
  return Array.from({ length: n }, (_, i) => ({ x: a.x + (i % cols) * (w + gap), y: a.y + Math.floor(i / cols) * (h + gap), w, h }));
}
function mosaic(n: number, a: { x: number; y: number; w: number; h: number }, gap: number) {
  // One hero photo across the top two thirds, the rest in a strip grid below.
  const heroH = a.h * 0.45;
  return [{ x: a.x, y: a.y, w: a.w, h: heroH }, ...grid(n - 1, { x: a.x, y: a.y + heroH + gap, w: a.w, h: a.h - heroH - gap }, gap)];
}

/* ---------- business card templates (89 × 51 mm, front + back) ---------- */
type Card = { id: string; name: string; note: string; front: (g: Geo, v: (k: string, d: string) => string) => Built; back: (g: Geo, v: (k: string, d: string) => string) => Built };
const contact = (g: Geo, x: number, y: number, gap: number, rows: [string, string, string][], ic: string, tc: string, f = "Montserrat", pt = 6.3) => {
  const out: Obj[] = [];
  rows.forEach(([icon, field, text], i) => { out.push(Icon(g, icon, x, y + i * gap - 0.2, 2.6, ic)); out.push(T(g, text, x + 4.4, y + i * gap, { f, pt, c: tc, field })); });
  return out;
};
export const CARDS: Card[] = [
  { id: "ledger", name: "Ledger", note: "Consulting",
    front: (g, v) => ({ bg: "#FFFFFF", objs: [
      R(g, -2, -2, 32, 55, "#1F2A44"), Frame(g, 7, 13, 16, 16),
      T(g, v("name", "Aarav Mehta"), 36, 7, { f: "Playfair Display", pt: 13, c: "#1F2A44", w: "700", field: "name" }),
      T(g, v("title", "PRINCIPAL CONSULTANT").toUpperCase(), 36, 14.5, { pt: 5.5, c: "#8A6D1F", w: "600", cs: 200, field: "title" }),
      ...contact(g, 36, 24, 5.4, [["phone", "phone", v("phone", "+91 98100 24680")], ["mail", "email", v("email", "aarav@ledgerpartners.in")], ["pin", "address", v("address", "Connaught Place, New Delhi")]], "#8A6D1F", "#2B3446"),
    ] }),
    back: (g, v) => ({ bg: "#1F2A44", objs: [
      T(g, v("company", "LEDGER").toUpperCase(), 44.5, 22, { f: "Playfair Display", pt: 18, c: "#E9D8A6", ox: "center", oy: "center", cs: 300, field: "company" }),
      T(g, "STRATEGY · FINANCE · GROWTH", 44.5, 32, { pt: 5.5, c: "#C9CED8", ox: "center", cs: 200 }),
    ] }) },
  { id: "keystone", name: "Keystone", note: "Real estate",
    front: (g, v) => ({ bg: "#FFFFFF", objs: [
      R(g, -2, 36, 93, 17, "#1D3B2F"), R(g, -2, 35.2, 93, 0.8, "#C8A24A"),
      T(g, v("company", "KEYSTONE REALTY").toUpperCase(), 6, 6, { f: "Oswald", pt: 13, c: "#1D3B2F", w: "600", cs: 200, field: "company" }),
      T(g, v("name", "Rohan Verma"), 6, 17, { pt: 9, c: "#1D3B2F", w: "700", field: "name" }),
      T(g, v("title", "Senior Property Advisor"), 6, 23, { pt: 6, c: "#5B6B63", field: "title" }),
      T(g, "RERA Reg. DL/AGT/2026/0412", 6, 28.5, { pt: 5, c: "#8A958F" }),
      T(g, v("phone", "+91 98111 22334"), 6, 39.5, { pt: 6.5, c: "#FFFFFF", w: "600", field: "phone" }),
      T(g, v("email", "rohan@keystonerealty.in"), 6, 44.5, { pt: 6, c: "#DCE5DF", field: "email" }),
      T(g, v("address", "Sector 29, Gurugram"), 83, 42, { pt: 6, c: "#C8A24A", ox: "right", field: "address" }),
    ] }),
    back: (g) => ({ bg: "#1D3B2F", objs: [
      P(g, [[38.5, 12], [50.5, 12], [48.5, 22], [40.5, 22]], "#C8A24A"),
      T(g, "Homes · Plots · Commercial", 44.5, 33, { pt: 6, c: "#C8A24A", ox: "center" }),
    ] }) },
  { id: "chambers", name: "Chambers", note: "Law firm",
    front: (g, v) => ({ bg: "#F4F5F7", objs: [
      T(g, v("company", "MEHTA & RAO").toUpperCase(), 44.5, 8, { f: "Playfair Display", pt: 12, c: "#6B1E2A", w: "700", ox: "center", cs: 300, field: "company" }),
      T(g, "ADVOCATES & SOLICITORS", 44.5, 15.5, { pt: 5, c: "#555555", ox: "center", cs: 300 }),
      R(g, 39.5, 21.5, 10, 0.4, "#6B1E2A"),
      T(g, v("name", "Adv. Meera Rao"), 44.5, 25, { f: "Playfair Display", pt: 9, c: "#222222", it: true, ox: "center", field: "name" }),
      T(g, v("title", "Partner"), 44.5, 32, { pt: 5.5, c: "#555555", ox: "center", field: "title" }),
      T(g, v("phone", "+91 11 4567 8900"), 44.5, 39, { pt: 5.6, c: "#333333", ox: "center", field: "phone" }),
      T(g, v("email", "meera@mehtarao.law"), 44.5, 43.5, { pt: 5.6, c: "#333333", ox: "center", field: "email" }),
    ] }),
    back: (g, v) => ({ bg: "#6B1E2A", objs: [
      T(g, "M&R", 44.5, 21, { f: "Playfair Display", pt: 24, c: "#F4F5F7", ox: "center", oy: "center" }),
      T(g, v("address", "Chambers 112, Lawyers’ Block, Saket"), 44.5, 35, { pt: 5.5, c: "#E8D9DB", ox: "center", field: "address" }),
    ] }) },
  { id: "plainspoken", name: "Plainspoken", note: "Designer",
    front: (g, v) => ({ bg: "#FAFAFA", objs: [
      T(g, v("name", "Sana Qureshi"), 6, 7, { pt: 11, c: "#111111", w: "700", field: "name" }),
      T(g, v("title", "Brand & Product Designer"), 6, 13.5, { pt: 6.5, c: "#666666", field: "title" }),
      R(g, 6, 20.5, 6, 0.6, "#111111"),
      T(g, v("email", "sana@sanaq.design"), 6, 36, { pt: 6, c: "#111111", field: "email" }),
      T(g, v("phone", "+91 99100 33221"), 6, 41.5, { pt: 6, c: "#111111", field: "phone" }),
      T(g, v("company", "sanaq.design"), 83, 41.5, { pt: 6, c: "#111111", w: "700", ox: "right", field: "company" }),
    ] }),
    back: (g) => ({ bg: "#111111", objs: [Frame(g, 34.5, 15.5, 20, 20)] }) },
  { id: "aperture", name: "Aperture", note: "Photographer",
    front: (g, v) => { const c = "#F2F2F2", w = 0.35; return { bg: "#111111", objs: [
      Ln(g, 6, 6, 11, 6, c, w), Ln(g, 6, 6, 6, 11, c, w), Ln(g, 78, 6, 83, 6, c, w), Ln(g, 83, 6, 83, 11, c, w),
      Ln(g, 6, 45, 11, 45, c, w), Ln(g, 6, 40, 6, 45, c, w), Ln(g, 78, 45, 83, 45, c, w), Ln(g, 83, 40, 83, 45, c, w),
      T(g, v("company", "FRAME & LIGHT").toUpperCase(), 44.5, 16, { f: "Space Mono", pt: 11, c, w: "700", ox: "center", cs: 200, field: "company" }),
      T(g, v("name", "Kabir Sethi"), 44.5, 25, { f: "Space Mono", pt: 6.5, c: "#BDBDBD", ox: "center", field: "name" }),
      T(g, "f/1.8   1/250s   ISO 100", 44.5, 35.5, { f: "Space Mono", pt: 5, c: "#F2C14E", ox: "center" }),
    ] }; },
    back: (g, v) => ({ bg: "#F2F2F2", objs: [
      T(g, v("phone", "+91 98710 55443"), 8, 10, { f: "Space Mono", pt: 7, c: "#111111", field: "phone" }),
      T(g, v("email", "kabir@frameandlight.in"), 8, 17, { f: "Space Mono", pt: 6.5, c: "#111111", field: "email" }),
      T(g, v("title", "Weddings · Portraits"), 8, 38, { f: "Space Mono", pt: 5.5, c: "#666666", field: "title" }),
      Ring(g, 76, 15, 6, "#111111", 0.5), C(g, 76, 15, 3.2, "#F2C14E"),
    ] }) },
  { id: "forge", name: "Forge", note: "Tech, with QR",
    front: (g, v) => ({ bg: "#0F1B3D", objs: [
      R(g, -2, -2, 4.5, 55, "#3EE6C1"),
      T(g, v("company", "pixel/forge"), 8, 7, { f: "Space Mono", pt: 12, c: "#FFFFFF", w: "700", field: "company" }),
      T(g, v("name", "Dev Malhotra"), 8, 24, { f: "Poppins", pt: 9, c: "#FFFFFF", w: "600", field: "name" }),
      T(g, v("title", "Founder & Lead Engineer"), 8, 30.5, { f: "Poppins", pt: 6, c: "#A9B4D0", field: "title" }),
      T(g, v("email", "dev@pixelforge.io"), 8, 38.5, { f: "Space Mono", pt: 5, c: "#A9B4D0", field: "email" }),
      T(g, v("phone", "+91 97111 00011"), 8, 42.5, { f: "Space Mono", pt: 5, c: "#A9B4D0", field: "phone" }),
      R(g, 63, 13, 20, 20, "#FFFFFF", { rx: 12, ry: 12 }), QR(g, "https://example.com", 64.5, 14.5, 17, "#0F1B3D"),
    ] }),
    back: (g, v) => ({ bg: "#3EE6C1", objs: [T(g, v("company", "pixel/forge"), 44.5, 25.5, { f: "Space Mono", pt: 16, c: "#0F1B3D", w: "700", ox: "center", oy: "center", field: "company" })] }) },
  { id: "petal", name: "Petal", note: "Florist, boutique",
    front: (g, v) => ({ bg: "#F6E1E1", objs: [
      C(g, 80, 4, 16, "#E8B4B8"), C(g, 89, 47, 10, "#D98E96"),
      T(g, v("company", "Bloom & Petal"), 6, 6, { f: "DM Serif Display", pt: 16, c: "#5A1F2B", field: "company" }),
      T(g, "Floral design studio", 6, 15.5, { f: "Lora", pt: 7, c: "#5A1F2B", it: true }),
      T(g, v("name", "Ishita Kapoor"), 6, 30, { f: "Lora", pt: 8, c: "#5A1F2B", w: "600", field: "name" }),
      T(g, v("phone", "+91 99887 66554"), 6, 36.5, { f: "Lora", pt: 6, c: "#7A3B47", field: "phone" }),
      T(g, v("address", "Shop 4, Khan Market, New Delhi"), 6, 41.5, { f: "Lora", pt: 6, c: "#7A3B47", field: "address" }),
    ] }),
    back: (g) => ({ bg: "#5A1F2B", objs: [Ring(g, 44.5, 23, 12, "#F6E1E1", 0.4), T(g, "B&P", 44.5, 23, { f: "DM Serif Display", pt: 18, c: "#F6E1E1", ox: "center", oy: "center" })] }) },
  { id: "ritual", name: "Ritual", note: "Café, loyalty back",
    front: (g, v) => ({ bg: "#C9A27E", objs: [
      Ring(g, 70, 25.5, 14, "#3B2416", 0.5), Ring(g, 70, 25.5, 11.8, "#3B2416", 0.25),
      T(g, "R&R", 70, 23.5, { f: "Oswald", pt: 16, c: "#3B2416", w: "600", ox: "center", oy: "center" }),
      T(g, v("company", "ROAST & RITUAL").toUpperCase(), 6, 6, { f: "Oswald", pt: 13, c: "#3B2416", w: "600", cs: 100, field: "company" }),
      T(g, "Specialty coffee bar", 6, 16, { f: "Lora", pt: 7, c: "#3B2416", it: true }),
      T(g, v("address", "Hauz Khas Village, New Delhi"), 6, 37, { pt: 5.8, c: "#3B2416", field: "address" }),
      T(g, v("phone", "+91 98100 77665"), 6, 42, { pt: 5.8, c: "#3B2416", field: "phone" }),
    ] }),
    back: (g) => { const o: Obj[] = [T(g, "LOYALTY CARD", 44.5, 6, { f: "Oswald", pt: 9, c: "#3B2416", w: "600", ox: "center", cs: 300 }), T(g, "Buy 9 cups, the 10th is on us", 44.5, 12.5, { f: "Lora", pt: 6.5, c: "#5A3B28", it: true, ox: "center" })];
      for (let i = 0; i < 10; i++) { const x = 26.5 + (i % 5) * 9, y = i < 5 ? 26 : 36; o.push(i === 9 ? C(g, x, y, 3.4, "#3B2416") : Ring(g, x, y, 3.4, "#3B2416", 0.3)); }
      o.push(T(g, "FREE", 62.5, 36, { f: "Oswald", pt: 4.6, c: "#F3E9DC", ox: "center", oy: "center" })); return { bg: "#F3E9DC", objs: o }; } },
  { id: "saffron", name: "Saffron", note: "Caterer",
    front: (g, v) => { const o: Obj[] = [R(g, -2, -2, 93, 8.5, "#7A2E1E")]; for (let x = 4; x < 88; x += 6) o.push(C(g, x, 2.2, 0.7, "#E9A23B"));
      o.push(T(g, v("company", "Spice Route"), 44.5, 11, { f: "DM Serif Display", pt: 17, c: "#3A1A10", ox: "center", field: "company" }),
        T(g, "CATERING · TIFFIN · EVENTS", 44.5, 21, { pt: 5.5, c: "#3A1A10", w: "600", ox: "center", cs: 250 }),
        T(g, v("name", "Chef Harpreet Gill"), 44.5, 28.5, { f: "Lora", pt: 8, c: "#3A1A10", it: true, ox: "center", field: "name" }),
        T(g, v("phone", "+91 98761 23450"), 44.5, 36, { pt: 5.8, c: "#3A1A10", ox: "center", field: "phone" }),
        T(g, "FSSAI Lic. 13326001000123", 44.5, 42.5, { pt: 4.6, c: "#5A2E1E", ox: "center" }));
      return { bg: "#E9A23B", objs: o }; },
    back: (g) => ({ bg: "#7A2E1E", objs: [T(g, "Today’s menu, your table.", 44.5, 25.5, { f: "DM Serif Display", pt: 11, c: "#E9A23B", ox: "center", oy: "center" })] }) },
  { id: "hazard", name: "Hazard", note: "Builder",
    front: (g, v) => { const o: Obj[] = [R(g, -2, 41, 93, 12, "#F5C400")]; for (let x = -14; x < 93; x += 7) o.push(P(g, [[x, 53], [x + 3.5, 53], [x + 15.5, 41], [x + 12, 41]], "#1A1A1A"));
      o.push(T(g, v("company", "BRICKLINE").toUpperCase(), 6, 5.5, { f: "Oswald", pt: 15, c: "#1A1A1A", w: "600", cs: 100, field: "company" }),
        T(g, v("name", "Vikram Singh"), 6, 22, { pt: 8, c: "#1A1A1A", w: "700", field: "name" }),
        T(g, v("title", "Site Manager"), 6, 27.5, { pt: 6, c: "#555555", field: "title" }),
        T(g, v("phone", "+91 98989 12121"), 83, 22, { pt: 6.5, c: "#1A1A1A", w: "600", ox: "right", field: "phone" }),
        T(g, v("email", "site@brickline.co.in"), 83, 27.5, { pt: 6, c: "#1A1A1A", ox: "right", field: "email" }));
      return { bg: "#FFFFFF", objs: o }; },
    back: (g, v) => ({ bg: "#F5C400", objs: [T(g, v("company", "BRICKLINE").toUpperCase(), 44.5, 22, { f: "Oswald", pt: 20, c: "#1A1A1A", w: "600", ox: "center", oy: "center", cs: 150, field: "company" }), T(g, "Residential · Commercial · Renovation", 44.5, 32, { pt: 6, c: "#1A1A1A", ox: "center" })] }) },
  { id: "stillwater", name: "Stillwater", note: "Wellness",
    front: (g, v) => ({ bg: "#DDE5D8", objs: [
      Ring(g, 76, 40, 22, "#7E9A7A", 0.3), Ring(g, 76, 40, 16, "#7E9A7A", 0.3), Ring(g, 76, 40, 10, "#7E9A7A", 0.3),
      T(g, v("company", "Stillwater"), 6, 6, { f: "Cormorant Garamond", pt: 19, c: "#2F4A3A", it: true, w: "500", field: "company" }),
      T(g, v("name", "Ananya Iyer, RYT-500"), 6, 27, { f: "Cormorant Garamond", pt: 9.5, c: "#2F4A3A", w: "700", field: "name" }),
      T(g, v("title", "Yoga & breathwork"), 6, 33.5, { f: "Josefin Sans", pt: 5.5, c: "#4F6A5A", field: "title" }),
      T(g, v("phone", "+91 90000 11223"), 6, 39.5, { f: "Josefin Sans", pt: 5.5, c: "#4F6A5A", field: "phone" }),
    ] }),
    back: (g) => ({ bg: "#2F4A3A", objs: [Ring(g, 44.5, 21, 10, "#DDE5D8", 0.3), Ring(g, 44.5, 21, 6.5, "#DDE5D8", 0.3), C(g, 44.5, 21, 2, "#DDE5D8"), T(g, "breathe in. breathe out.", 44.5, 38, { f: "Cormorant Garamond", pt: 8.5, c: "#DDE5D8", it: true, ox: "center" })] }) },
  { id: "clinic", name: "Clinic", note: "Doctor, appointment back",
    front: (g, v) => ({ bg: "#FFFFFF", objs: [
      C(g, 96, 25.5, 30, "#E3F4F2"), C(g, 96, 25.5, 21, "#BFE6E1"),
      T(g, v("company", "Smile Studio"), 6, 6, { f: "Poppins", pt: 13, c: "#0E6E68", w: "700", field: "company" }),
      T(g, v("name", "Dr. Neha Bansal, BDS, MDS"), 6, 24, { f: "Poppins", pt: 7.5, c: "#1E2B2A", w: "600", field: "name" }),
      T(g, v("title", "Orthodontist"), 6, 29.5, { f: "Poppins", pt: 6, c: "#5C6B6A", field: "title" }),
      T(g, v("phone", "+91 11 2345 6789"), 6, 37, { f: "Poppins", pt: 6, c: "#1E2B2A", field: "phone" }),
      T(g, "Mon–Sat · 10 am – 7 pm", 6, 42, { f: "Poppins", pt: 5.5, c: "#5C6B6A" }),
    ] }),
    back: (g) => { const o: Obj[] = [T(g, "NEXT APPOINTMENT", 8, 6, { f: "Poppins", pt: 6.5, c: "#FFFFFF", w: "600", cs: 250 })];
      [["Date", 21], ["Time", 31], ["With", 41]].forEach(([l, y]) => { o.push(T(g, l as string, 8, (y as number) - 3.2, { f: "Poppins", pt: 5.5, c: "#BFE6E1" })); o.push(Ln(g, 19, y as number, 81, y as number, "#BFE6E1", 0.25)); });
      return { bg: "#0E6E68", objs: o }; } },
];

function buildCard(id: string, side: "front" | "back", ctx: Ctx): Built {
  const card = CARDS.find((c) => c.id === id) ?? CARDS[0];
  const v = (k: string, d: string) => ctx.values[k]?.trim() || d;
  return card[side](ctx.g, v);
}

/** Apply a built layout to a canvas (replacing its contents). */
export function applyBuilt(c: F.StaticCanvas, built: Built) {
  c.getObjects().slice().forEach((o) => c.remove(o));
  c.backgroundColor = built.bg;
  built.objs.forEach((o) => c.add(o));
}
