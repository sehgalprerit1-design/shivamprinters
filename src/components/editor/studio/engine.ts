// Fabric.js scene helpers for the design studio. Everything is in canvas units
// of 0.1 mm, so a design's geometry is the print geometry.
import * as F from "fabric";
import qrcode from "qrcode-generator";
import type { PrintSpec } from "@/lib/print-spec";

export const MM = 10; // canvas units per millimetre
export const PT = 0.3528 * MM; // canvas units per typographic point
/** Custom properties that travel with every object through JSON. */
export const PROPS = ["role", "field", "locked", "frameBox", "fileId", "srcKey", "isIcon", "name"];
F.FabricObject.customProperties = PROPS;
Object.assign(F.InteractiveFabricObject.ownDefaults, {
  transparentCorners: false, cornerColor: "#ffffff", cornerStrokeColor: "#e2573f", borderColor: "#e2573f",
  cornerSize: 11, cornerStyle: "circle", padding: 2, borderScaleFactor: 1.5,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Obj = F.FabricObject & Record<string, any>;

export type Geo = { W: number; H: number; b: number; s: number; tw: number; th: number };
export function geo(spec: PrintSpec): Geo {
  const b = spec.bleedMM * MM;
  return { b, s: spec.safeMM * MM, tw: spec.wMM * MM, th: spec.hMM * MM, W: spec.wMM * MM + 2 * b, H: spec.hMM * MM + 2 * b };
}

export const FONTS = ["Inter Variable", "Fraunces Variable", "Montserrat", "Poppins", "Raleway", "Josefin Sans", "Oswald", "Playfair Display", "DM Serif Display", "Lora", "Cormorant Garamond", "Roboto Slab", "Space Mono", "Great Vibes", "Baloo 2", "Pacifico"];
export const fontLabel = (f: string) => f.replace(" Variable", "");
export const GOOGLE_FONTS_URL = "https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,600;0,700;1,400&family=Poppins:ital,wght@0,400;0,600;0,700;1,400&family=Raleway:ital,wght@0,400;0,600;0,800;1,400&family=Josefin+Sans:ital,wght@0,400;0,600;1,400&family=Oswald:wght@400;600&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Serif+Display:ital@0;1&family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,500;0,700;1,500&family=Roboto+Slab:wght@400;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Great+Vibes&family=Baloo+2:wght@400;700&family=Pacifico&display=swap";

export const ICONS: Record<string, string> = {
  phone: "M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z",
  mail: "M3 5h18v14H3z M3 6l9 7 9-7",
  globe: "M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20z M2 12h20 M12 2c2.8 2.8 4 6.2 4 10s-1.2 7.2-4 10c-2.8-2.8-4-6.2-4-10s1.2-7.2 4-10z",
  pin: "M12 22s7-7.4 7-13a7 7 0 0 0-14 0c0 5.6 7 13 7 13z M12 11.5a2.5 2.5 0 1 0 0-5a2.5 2.5 0 1 0 0 5z",
  heart: "M12 20s-7-4.4-9-8.6C1.6 8.2 3.6 5 6.8 5c2 0 3.4 1.1 5.2 3 1.8-1.9 3.2-3 5.2-3 3.2 0 5.2 3.2 3.8 6.4C19 15.6 12 20 12 20z",
  star: "m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z",
  cake: "M4 21h16 M5 21v-7h14v7 M5 15c2 1.5 4.5 1.5 7 0s5-1.5 7 0 M12 14V9 M12 7a1.5 1.5 0 0 0 1.5-1.5C13.5 4 12 3 12 3s-1.5 1-1.5 2.5A1.5 1.5 0 0 0 12 7z",
  paw: "M8.5 10a2 2 0 1 0 0-4a2 2 0 0 0 0 4z M15.5 10a2 2 0 1 0 0-4a2 2 0 0 0 0 4z M5 14a2 2 0 1 0 0-4a2 2 0 0 0 0 4z M19 14a2 2 0 1 0 0-4a2 2 0 0 0 0 4z M12 13c-3 0-5 3-5 5s2 2.5 5 2.5 5-.5 5-2.5-2-5-5-5z",
  user: "M12 12a4.5 4.5 0 1 0 0-9a4.5 4.5 0 1 0 0 9z M3.5 21c1-4.2 4.4-6.5 8.5-6.5s7.5 2.3 8.5 6.5",
  clock: "M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20z M12 6v6l4 2",
};

/* ---------------- factories (trim-relative millimetres) ---------------- */
type TOpts = { f?: string; pt?: number; c?: string; w?: string; it?: boolean; cs?: number; ox?: "left" | "center" | "right"; oy?: "top" | "center" | "bottom"; field?: string; width?: number; lh?: number };
export function T(g: Geo, text: string, x: number, y: number, o: TOpts = {}): Obj {
  const base = {
    left: x * MM + g.b, top: y * MM + g.b, fontFamily: o.f ?? "Montserrat", fontSize: (o.pt ?? 8) * PT, fill: o.c ?? "#1d1a17",
    fontWeight: o.w ?? "400", fontStyle: o.it ? "italic" : "normal", charSpacing: o.cs ?? 0, originX: o.ox ?? "left", originY: o.oy ?? "top",
    textAlign: o.ox === "center" ? "center" : o.ox === "right" ? "right" : "left", lineHeight: o.lh ?? 1.15,
  } as const;
  const t = (o.width ? new F.Textbox(text, { ...base, width: o.width * MM, splitByGrapheme: false }) : new F.IText(text, base)) as Obj;
  if (o.field) t.field = o.field;
  return t;
}
export const R = (g: Geo, x: number, y: number, w: number, h: number, fill: string, extra: Record<string, unknown> = {}) =>
  new F.Rect({ left: x * MM + g.b, top: y * MM + g.b, width: w * MM, height: h * MM, fill, strokeWidth: 0, originX: "left", originY: "top", ...extra }) as Obj;
export const C = (g: Geo, cx: number, cy: number, r: number, fill: string, extra: Record<string, unknown> = {}) =>
  new F.Circle({ left: cx * MM + g.b, top: cy * MM + g.b, radius: r * MM, fill, originX: "center", originY: "center", strokeWidth: 0, ...extra }) as Obj;
export const Ring = (g: Geo, cx: number, cy: number, r: number, stroke: string, wmm: number) => C(g, cx, cy, r, "transparent", { stroke, strokeWidth: wmm * MM });
export const Ln = (g: Geo, x1: number, y1: number, x2: number, y2: number, stroke: string, wmm: number) =>
  new F.Line([x1 * MM + g.b, y1 * MM + g.b, x2 * MM + g.b, y2 * MM + g.b], { stroke, strokeWidth: wmm * MM, originX: "center", originY: "center" }) as Obj;
export const P = (g: Geo, pts: [number, number][], fill: string) =>
  new F.Polygon(pts.map(([x, y]) => ({ x: x * MM + g.b, y: y * MM + g.b })), { fill, strokeWidth: 0 }) as Obj;
export function Icon(g: Geo, name: string, x: number, y: number, sizeMM: number, color: string): Obj {
  const p = new F.Path(ICONS[name], { fill: "transparent", stroke: color, strokeWidth: 1.8, strokeLineCap: "round", strokeLineJoin: "round", originX: "left", originY: "top" }) as Obj;
  const s = (sizeMM * MM) / 24;
  p.set({ scaleX: s, scaleY: s, left: x * MM + g.b, top: y * MM + g.b });
  p.isIcon = true; p.name = "icon:" + name;
  return p;
}
export function QR(g: Geo, text: string, x: number, y: number, sizeMM: number, color: string): Obj {
  const q = qrcode(0, "M"); q.addData(text || " "); q.make();
  const n = q.getModuleCount(); let d = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
  const p = new F.Path(d, { fill: color, strokeWidth: 0, originX: "left", originY: "top" }) as Obj;
  const s = (sizeMM * MM) / n;
  p.set({ scaleX: s, scaleY: s, left: x * MM + g.b, top: y * MM + g.b });
  p.name = "qr:" + text; p.role = "qr";
  return p;
}
/** An empty photo frame. Frames are placeholders: they never print. */
export function Frame(g: Geo, x: number, y: number, w: number, h: number): Obj {
  const r = R(g, x, y, w, h, "#ece5da", { stroke: "#b5a998", strokeWidth: 2, strokeUniform: true, strokeDashArray: [10, 7], lockRotation: true });
  r.role = "frame";
  return r;
}
/** Frame covering the whole sheet including bleed. */
export const FullFrame = (g: Geo) => Frame(g, -g.b / MM, -g.b / MM, g.W / MM, g.H / MM);

/* ---------------- photos in frames ---------------- */
export function frameBoxOf(o: Obj): [number, number, number, number] {
  if (o.role === "photo" && o.frameBox) return o.frameBox;
  const r = o.getBoundingRect();
  return [r.left, r.top, r.width, r.height];
}
function coverScale(box: number[], iw: number, ih: number) { return Math.max(box[2] / iw, box[3] / ih); }

export function makePhoto(el: HTMLImageElement, box: [number, number, number, number], fileId?: string, srcKey?: string): Obj {
  const img = new F.FabricImage(el, { originX: "center", originY: "center", left: box[0] + box[2] / 2, top: box[1] + box[3] / 2 }) as Obj;
  img.scale(coverScale(box, el.naturalWidth || el.width, el.naturalHeight || el.height));
  img.clipPath = new F.Rect({ left: box[0], top: box[1], width: box[2], height: box[3], originX: "left", originY: "top", absolutePositioned: true });
  img.role = "photo"; img.frameBox = box; img.fileId = fileId; img.srcKey = srcKey;
  img.set({ lockScalingFlip: true });
  return img;
}
/** Put a photo into a frame (or replace a photo), keeping its place in the stack. */
export function fillFrame(c: F.StaticCanvas, target: Obj, el: HTMLImageElement, fileId?: string, srcKey?: string): Obj {
  const box = frameBoxOf(target);
  const img = makePhoto(el, box, fileId, srcKey);
  const idx = c.getObjects().indexOf(target);
  c.remove(target); c.insertAt(Math.max(0, idx), img);
  return img;
}
export function photoToFrame(c: F.StaticCanvas, photo: Obj): Obj {
  const [l, t, w, h] = photo.frameBox;
  const fr = new F.Rect({ left: l, top: t, width: w, height: h, fill: "#ece5da", stroke: "#b5a998", strokeWidth: 2, strokeUniform: true, strokeDashArray: [10, 7], originX: "left", originY: "top", lockRotation: true }) as Obj;
  fr.role = "frame";
  const idx = c.getObjects().indexOf(photo);
  c.remove(photo); c.insertAt(Math.max(0, idx), fr);
  return fr;
}
export function fitPhoto(p: Obj) {
  const box = p.frameBox; if (!box) return;
  p.set({ angle: 0, left: box[0] + box[2] / 2, top: box[1] + box[3] / 2, originX: "center", originY: "center" });
  p.scale(coverScale(box, p.width, p.height)); p.setCoords();
}
/** Print resolution of a placed photo, in dots per inch. */
export const photoDpi = (p: Obj) => Math.round((25.4 * MM) / Math.max(p.scaleX ?? 1, 1e-6));

/* ---------------- calendars ---------------- */
const DOW = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
export function MonthGrid(g: Geo, year: number, month: number, box: { x: number; y: number; w: number; h: number }, col: { ink: string; accent: string; muted: string }, font = "Montserrat"): Obj {
  const objs: F.FabricObject[] = [];
  const cw = box.w / 7, rows = 7, ch = box.h / rows;
  const pt = Math.max(4.5, Math.min(cw, ch) * 0.42 / 0.3528);
  DOW.forEach((d, i) => objs.push(T(g, d, box.x + cw * (i + 0.5), box.y + ch * 0.5, { f: font, pt: pt * 0.8, c: i === 6 ? col.accent : col.muted, w: "600", ox: "center", oy: "center" })));
  const first = (new Date(year, month, 1).getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= days; d++) {
    const k = first + d - 1, r = Math.floor(k / 7) + 1, cI = k % 7;
    if (r >= rows) { objs.push(T(g, `${d}`, box.x + cw * (cI + 0.5), box.y + ch * (rows - 0.5), { f: font, pt, c: cI === 6 ? col.accent : col.ink, ox: "center", oy: "center" })); continue; }
    objs.push(T(g, `${d}`, box.x + cw * (cI + 0.5), box.y + ch * (r + 0.5), { f: font, pt, c: cI === 6 ? col.accent : col.ink, ox: "center", oy: "center" }));
  }
  const grp = new F.Group(objs, { subTargetCheck: false, interactive: false }) as Obj;
  grp.role = "calendar"; grp.name = `calendar:${year}-${month + 1}`;
  return grp;
}

/* ---------------- rendering ---------------- */
export async function renderJSON(json: string, spec: PrintSpec, o: { width?: number; trim?: boolean; format?: "png" | "jpeg"; quality?: number; showFrames?: boolean } = {}) {
  const g = geo(spec);
  const el = document.createElement("canvas");
  const sc = new F.StaticCanvas(el, { width: g.W, height: g.H, enableRetinaScaling: false });
  try {
    await sc.loadFromJSON(json);
    if (!o.showFrames) sc.getObjects().forEach((x) => { if ((x as Obj).role === "frame") x.visible = false; });
    sc.renderAll();
    const w = o.trim ? g.tw : g.W;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const opt: any = { format: o.format ?? "png", quality: o.quality ?? 0.85, multiplier: (o.width ?? 600) / w };
    if (o.trim) Object.assign(opt, { left: g.b, top: g.b, width: g.tw, height: g.th });
    return sc.toDataURL(opt);
  } finally { sc.dispose(); }
}

/** Run a mutation against a face that isn't on screen, returning its new JSON. */
export async function withJSON(json: string, spec: PrintSpec, fn: (c: F.StaticCanvas) => void | Promise<void>) {
  const g = geo(spec);
  const sc = new F.StaticCanvas(document.createElement("canvas"), { width: g.W, height: g.H, enableRetinaScaling: false });
  try { await sc.loadFromJSON(json); await fn(sc); return JSON.stringify(sc.toObject(PROPS)); } finally { sc.dispose(); }
}

/** Walk every object in a face's JSON, groups included. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function walk(objects: any[], fn: (o: any) => void) { for (const o of objects ?? []) { fn(o); if (o.objects) walk(o.objects, fn); } }

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => res(i); i.onerror = () => rej(new Error("load")); i.src = src; });
}
