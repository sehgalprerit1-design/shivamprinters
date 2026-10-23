"use client";
/* The studio drives an imperative Fabric canvas: it deliberately reads refs and
   mutates canvas objects from event handlers, which the React Compiler lint rules flag. */
/* eslint-disable react-hooks/refs, react-hooks/immutability */
/**
 * Design studio: a print-accurate editor for every personalisable product.
 * - Works in real millimetres (0.1 mm canvas units) with bleed, trim and safe zone.
 * - Each product has one or more faces (front/back, book pages, calendar months, prints).
 * - Photos sit in frames (clip + pan + zoom); originals upload to object storage at add-to-cart.
 * - The cart line stores every face as Fabric JSON with storage keys, plus a preview.
 *   A print worker can re-render the same JSON at full resolution.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as F from "fabric";
import {
  Undo2, Redo2, ZoomIn, ZoomOut, Eye, LayoutTemplate, Images, Type, Shapes, QrCode, Palette, Trash2, Copy, Lock, LockOpen,
  ArrowUp, ArrowDown, AlignLeft, AlignCenter, AlignRight, Upload, AlertTriangle, Check, X, Crosshair, Maximize2, RefreshCw, Contrast, Group, Ungroup,
} from "lucide-react";
import type { Product, Variant } from "@/data/catalog";
import { optionsFor, optionDelta, defaultOptions, optionLabel } from "@/data/options";
import { useCart, type CartLine } from "@/lib/cart";
import { inr } from "@/lib/format";
import { CallUs } from "@/components/ui/CallUs";
import { printSpec, printedFields } from "@/lib/print-spec";
import {
  MM, PT, PROPS, ICONS, FONTS, GOOGLE_FONTS_URL, fontLabel, geo, T, R, C, Ring, Ln, P, Icon, QR, Frame, fillFrame, photoToFrame, fitPhoto, photoDpi,
  renderJSON, withJSON, walk, loadImage, type Obj,
} from "./engine";
import { build, defaultPreset, presetsFor, applyBuilt, sample, type Ctx } from "./layouts";

type Photo = { id: string; el: HTMLImageElement; file?: File; url: string; name: string; key?: string };
type Tab = "layouts" | "photos" | "text" | "graphics" | "qr" | "colour";
const SWATCHES = ["#FFFFFF", "#FAF6F0", "#F3E9DC", "#FDEBE6", "#F6E1E1", "#E3F1F2", "#DDE5D8", "#F5C400", "#E9A23B", "#E2573F", "#C2185B", "#1F6F78", "#1D3B2F", "#1F2A44", "#5A3A28", "#1D1A17"];
const INK = ["#1D1A17", "#FFFFFF", "#E2573F", "#1F6F78", "#C8962E", "#1F2A44", "#6B1E2A", "#2E9E5B"];
const uid = () => Math.random().toString(36).slice(2, 10);
const LOW_DPI = 150, GOOD_DPI = 220;

export function Studio({ product, variant: initialVariant, initialOptions = {}, initialQty = 1, editLineId }: { product: Product; variant: Variant; initialOptions?: Record<string, string>; initialQty?: number; editLineId?: string }) {
  const router = useRouter();
  const add = useCart((s) => s.add); const replace = useCart((s) => s.replace);
  const groups = useMemo(() => optionsFor(product.slug, product.category), [product.slug, product.category]);
  const [variant, setVariant] = useState<Variant>(initialVariant);
  const [opts, setOpts] = useState<Record<string, string>>({ ...defaultOptions(groups), ...initialOptions });
  const [qty, setQty] = useState(initialQty);
  const unitPrice = variant.price + optionDelta(groups, opts);
  const spec = useMemo(() => printSpec(product, variant, opts), [product, variant, opts]);
  const specKey = useMemo(() => JSON.stringify([spec.wMM, spec.hMM, spec.bleedMM, spec.faces.map((f) => [f.id, f.role, f.month?.month, f.month?.year])]), [spec]);
  const styleKey = `${opts.colour ?? ""}|${opts.theme ?? ""}|${opts.emboss ?? ""}`;
  const g = useMemo(() => geo(spec), [spec]);
  const fields = product.template.textFields;
  const printed = useMemo(() => new Set(printedFields(product).map((f) => f.key)), [product]);

  // ---- refs that the canvas callbacks read (so handlers never go stale) ----
  const elRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cvRef = useRef<F.Canvas | null>(null);
  const specRef = useRef(spec); specRef.current = spec;
  const facesRef = useRef<string[]>([]);
  const faceRef = useRef(0);
  const hist = useRef<Record<number, { stack: string[]; i: number }>>({});
  const restoring = useRef(false);
  const photos = useRef(new Map<string, Photo>());
  const pendingTarget = useRef<Obj | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const guidesRef = useRef(true);
  const snap = useRef({ x: false, y: false });
  const builtFor = useRef<string | null>(null);
  const styleFor = useRef(styleKey);
  const dirty = useRef(false);

  const [faceIdx, setFaceIdx] = useState(0);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [selV, setSelV] = useState(0);
  const [histV, setHistV] = useState(0);
  const [tab, setTab] = useState<Tab>("layouts");
  const [tray, setTray] = useState<Photo[]>([]);
  const [zoomMul, setZoomMul] = useState(1);
  const [guides, setGuides] = useState(true);
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);
  const [preview, setPreview] = useState<{ label: string; url: string }[] | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [presetThumbs, setPresetThumbs] = useState<Record<string, string>>({});
  const [qrText, setQrText] = useState("https://wa.me/919000000000");
  const toast = useCallback((m: string) => { setToastMsg(m); window.setTimeout(() => setToastMsg((x) => (x === m ? null : x)), 3200); }, []);

  const ctxFor = useCallback((i: number, vals = values): Ctx => ({ g: geo(specRef.current), spec: specRef.current, product, face: specRef.current.faces[i], opts, values: vals }), [product, opts, values]);

  /* ---------------- canvas plumbing ---------------- */
  const snapshot = () => JSON.stringify(cvRef.current!.toObject(PROPS));
  const applyLock = (o: Obj) => {
    const l = !!o.locked;
    o.set({ lockMovementX: l, lockMovementY: l, lockScalingX: l, lockScalingY: l, lockRotation: l || o.role === "frame", hasControls: !l });
    if ("editable" in o) o.editable = !l;
  };
  const pushHistory = useCallback(() => {
    const c = cvRef.current; if (!c || restoring.current) return;
    const i = faceRef.current; const h = (hist.current[i] ??= { stack: [], i: -1 });
    const s = snapshot(); if (h.stack[h.i] === s) return;
    h.stack = h.stack.slice(0, h.i + 1); h.stack.push(s); if (h.stack.length > 60) h.stack.shift(); h.i = h.stack.length - 1;
    facesRef.current[i] = s; dirty.current = true; setHistV((v) => v + 1);
  }, []);
  const loadFace = useCallback(async (i: number) => {
    const c = cvRef.current!; restoring.current = true;
    try {
      await c.loadFromJSON(facesRef.current[i]);
      c.getObjects().forEach((o) => applyLock(o as Obj));
      c.requestRenderAll();
    } finally { restoring.current = false; }
    if (!hist.current[i]?.stack.length) hist.current[i] = { stack: [facesRef.current[i]], i: 0 };
    setHistV((v) => v + 1); setSelV((v) => v + 1);
  }, []);
  const refreshThumb = useCallback(async (i: number) => {
    const json = facesRef.current[i]; if (!json) return;
    try { const url = await renderJSON(json, specRef.current, { width: 160, trim: true, format: "jpeg", quality: 0.7, showFrames: true }); setThumbs((t) => { const n = [...t]; n[i] = url; return n; }); } catch { /* image gone */ }
  }, []);
  const goFace = useCallback(async (i: number) => {
    if (i === faceRef.current || !cvRef.current) return;
    cvRef.current.discardActiveObject();
    const prev = faceRef.current; facesRef.current[prev] = snapshot(); void refreshThumb(prev);
    faceRef.current = i; setFaceIdx(i); await loadFace(i);
  }, [loadFace, refreshThumb]);

  const fit = useCallback(() => {
    const c = cvRef.current, st = stageRef.current; if (!c || !st) return;
    const r = st.getBoundingClientRect(); const gg = geo(specRef.current);
    const base = Math.max(0.02, Math.min((r.width - 48) / gg.W, (r.height - 76) / gg.H));
    const z = base * zoomMul;
    c.setDimensions({ width: Math.round(gg.W * z), height: Math.round(gg.H * z) }); c.setZoom(z); c.requestRenderAll();
  }, [zoomMul]);
  useEffect(() => { fit(); }, [fit, specKey]);
  useEffect(() => { const st = stageRef.current; if (!st) return; const ro = new ResizeObserver(() => fit()); ro.observe(st); return () => ro.disconnect(); }, [fit]);

  // Card fonts (Google Fonts) are only needed inside the studio.
  useEffect(() => {
    if (document.querySelector("link[data-studio-fonts]")) return;
    const l = document.createElement("link"); l.rel = "stylesheet"; l.href = GOOGLE_FONTS_URL; l.dataset.studioFonts = "1"; document.head.appendChild(l);
  }, []);

  // Create the canvas once.
  useEffect(() => {
    const c = new F.Canvas(elRef.current!, { preserveObjectStacking: true, selectionColor: "rgba(226,87,63,.08)", selectionBorderColor: "#e2573f", backgroundColor: "#fff" });
    cvRef.current = c;
    c.on("after:render", () => {
      const sp = specRef.current, gg = geo(sp), ctx = c.getContext(), z = c.getZoom(), v = c.viewportTransform;
      ctx.save(); ctx.transform(v[0], v[1], v[2], v[3], v[4], v[5]);
      // Empty frames: label them so people know where photos go.
      c.getObjects().forEach((o0) => {
        const o = o0 as Obj; if (o.role !== "frame" || !o.visible) return;
        const r = o.getBoundingRect(); const fs = Math.max(10 / z, Math.min(r.width, r.height) * 0.09);
        ctx.fillStyle = "rgba(91,85,78,.85)"; ctx.font = `600 ${fs}px Inter Variable, system-ui, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(r.width > fs * 7 ? "+ Add photo" : "+", r.left + r.width / 2, r.top + r.height / 2);
      });
      if (guidesRef.current) {
        const b = gg.b, s = gg.b + gg.s;
        ctx.beginPath(); ctx.rect(0, 0, gg.W, gg.H); ctx.rect(b, b, gg.tw, gg.th); ctx.fillStyle = "rgba(226,87,63,.18)"; ctx.fill("evenodd");
        ctx.lineWidth = 1.2 / z; ctx.strokeStyle = "#e2573f"; ctx.strokeRect(b, b, gg.tw, gg.th);
        ctx.setLineDash([5 / z, 4 / z]); ctx.strokeStyle = "#1f6f78"; ctx.strokeRect(s, s, gg.tw - 2 * gg.s, gg.th - 2 * gg.s); ctx.setLineDash([]);
        if (sp.wrap === "mug") {
          const hw = 14 * MM; ctx.fillStyle = "rgba(29,26,23,.10)";
          ctx.fillRect(0, 0, b + hw, gg.H); ctx.fillRect(gg.W - b - hw, 0, b + hw, gg.H);
          ctx.fillStyle = "rgba(29,26,23,.55)"; ctx.font = `600 ${12 / z}px Inter Variable, system-ui, sans-serif`; ctx.textAlign = "center";
          ctx.fillText("Handle", (b + hw) / 2, gg.H - 14 / z); ctx.fillText("Handle", gg.W - (b + hw) / 2, gg.H - 14 / z);
        }
      }
      ctx.strokeStyle = "#e2573f"; ctx.lineWidth = 1 / z;
      if (snap.current.x) { ctx.beginPath(); ctx.moveTo(gg.W / 2, 0); ctx.lineTo(gg.W / 2, gg.H); ctx.stroke(); }
      if (snap.current.y) { ctx.beginPath(); ctx.moveTo(0, gg.H / 2); ctx.lineTo(gg.W, gg.H / 2); ctx.stroke(); }
      ctx.restore();
    });
    c.on("object:moving", (e) => {
      const o = e.target as Obj; if (o.role === "photo") return; // photos pan inside their frame
      const gg = geo(specRef.current), p = o.getCenterPoint(), th = 8 / c.getZoom();
      snap.current = { x: Math.abs(p.x - gg.W / 2) < th, y: Math.abs(p.y - gg.H / 2) < th };
      if (snap.current.x || snap.current.y) o.setPositionByOrigin(new F.Point(snap.current.x ? gg.W / 2 : p.x, snap.current.y ? gg.H / 2 : p.y), "center", "center");
    });
    c.on("mouse:up", () => { if (snap.current.x || snap.current.y) { snap.current = { x: false, y: false }; c.requestRenderAll(); } });
    c.on("mouse:dblclick", (e) => { const t = e.target as Obj | undefined; if (t && (t.role === "frame" || t.role === "photo")) { pendingTarget.current = t; fileInput.current?.click(); } });
    (["object:added", "object:removed", "object:modified"] as const).forEach((ev) => c.on(ev, () => pushHistory()));
    (["selection:created", "selection:updated", "selection:cleared"] as const).forEach((ev) => c.on(ev, () => setSelV((v) => v + 1)));
    c.on("text:changed", (e) => { const t = e.target as Obj; if (t.field) setValues((v) => ({ ...v, [t.field]: t.text })); });
    c.on("text:editing:exited", (e) => { const t = e.target as Obj; pushHistory(); if (t.field) void syncField(t.field, t.text, true); });
    return () => { void c.dispose(); cvRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- building faces ---------------- */
  const jsonFromBuilt = (b: ReturnType<typeof build>) => {
    const gg = geo(specRef.current);
    const sc = new F.StaticCanvas(document.createElement("canvas"), { width: gg.W, height: gg.H, enableRetinaScaling: false });
    applyBuilt(sc, b); b.objs.forEach((o) => { if (o.role === "calendar") o.locked = true; });
    const j = JSON.stringify(sc.toObject(PROPS)); void sc.dispose(); return j;
  };
  /** Collect photos from faces (in order) so a new layout can be refilled with them. */
  const collectPhotos = async (jsons: string[]) => {
    const out: { el: HTMLImageElement; fileId?: string; srcKey?: string }[] = [];
    for (const j of jsons) {
      if (!j) continue;
      await withJSON(j, specRef.current, (sc) => { sc.getObjects().forEach((o0) => { const o = o0 as Obj; if (o.role === "photo") out.push({ el: (o as unknown as F.FabricImage).getElement() as HTMLImageElement, fileId: o.fileId, srcKey: o.srcKey }); }); }).catch(() => undefined);
    }
    return out;
  };
  const fillFrames = (sc: F.StaticCanvas, queue: { el: HTMLImageElement; fileId?: string; srcKey?: string }[]) => {
    sc.getObjects().filter((o) => (o as Obj).role === "frame").forEach((fr) => { const it = queue.shift(); if (it) fillFrame(sc, fr as Obj, it.el, it.fileId, it.srcKey); });
  };
  const buildFace = async (i: number, presetId: string, queue: { el: HTMLImageElement; fileId?: string; srcKey?: string }[], vals = values) => {
    const ctx = ctxFor(i, vals);
    let j = jsonFromBuilt(build(presetId, ctx));
    if (queue.length) j = await withJSON(j, specRef.current, (sc) => fillFrames(sc, queue));
    return j;
  };
  const rebuildAll = async (keepPhotos: boolean, vals = values) => {
    const queue = keepPhotos ? await collectPhotos(facesRef.current) : [];
    const sp = specRef.current; const out: string[] = [];
    for (let i = 0; i < sp.faces.length; i++) out.push(await buildFace(i, defaultPreset(ctxFor(i, vals)), queue, vals));
    facesRef.current = out; hist.current = {}; faceRef.current = Math.min(faceRef.current, out.length - 1);
    setFaceIdx(faceRef.current); setThumbs([]);
    await loadFace(faceRef.current);
    for (let i = 0; i < out.length; i++) await refreshThumb(i);
  };

  // Restore a cart line being edited.
  const restoreLine = async (line: CartLine) => {
    const st = line.design?.studio; if (!st) return false;
    const urls: Record<string, string | null> = {};
    let missing = 0;
    const faces: string[] = [];
    for (const f of st.faces) {
      const d = JSON.parse(f.json);
      const imgs: Obj[] = []; walk(d.objects, (o) => { if (o.type?.toLowerCase() === "image") imgs.push(o); });
      for (const o of imgs) {
        if (o.srcKey && !(o.srcKey in urls)) { try { const r = await fetch(`/api/upload/url?key=${encodeURIComponent(o.srcKey)}`); urls[o.srcKey] = ((await r.json()) as { url: string | null }).url; } catch { urls[o.srcKey] = null; } }
        const src = (o.srcKey && urls[o.srcKey]) || o.src;
        const ok = await loadImage(src).then((el) => { o.src = src; return el; }).catch(() => null);
        if (ok && o.fileId && !photos.current.has(o.fileId)) photos.current.set(o.fileId, { id: o.fileId, el: ok, url: src, name: "photo", key: o.srcKey });
        if (!ok) {
          missing++;
          const [l, t, w, h] = o.frameBox ?? [o.left - (o.width * o.scaleX) / 2, o.top - (o.height * o.scaleY) / 2, o.width * o.scaleX, o.height * o.scaleY];
          Object.keys(o).forEach((k) => delete o[k]);
          Object.assign(o, { type: "Rect", version: d.version, left: l, top: t, width: w, height: h, originX: "left", originY: "top", fill: "#ece5da", stroke: "#b5a998", strokeWidth: 2, strokeUniform: true, strokeDashArray: [10, 7], role: "frame" });
        }
      }
      faces.push(JSON.stringify(d));
    }
    if (faces.length !== specRef.current.faces.length) return false;
    facesRef.current = faces; hist.current = {};
    setTray([...photos.current.values()]);
    if (missing) toast(`${missing} earlier photo${missing > 1 ? "s weren't" : " wasn't"} stored, so ${missing > 1 ? "their frames are" : "its frame is"} empty again. Add ${missing > 1 ? "them" : "it"} back from Photos.`);
    await loadFace(0);
    for (let i = 0; i < faces.length; i++) await refreshThumb(i);
    return true;
  };

  // First build (after fonts load) and rebuilds when size/sides/start month change.
  useEffect(() => {
    if (!cvRef.current) return;
    let cancelled = false;
    (async () => {
      if (builtFor.current === null) {
        const loads = FONTS.flatMap((f) => [`400 20px "${f}"`, `700 20px "${f}"`]).map((s) => document.fonts.load(s).catch(() => []));
        await Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, 3500))]);
        if (cancelled) return;
        let restored = false;
        const line = editLineId ? useCart.getState().lines.find((l) => l.id === editLineId) : undefined;
        let vals = values;
        if (line) {
          const v = product.variants.find((x) => x.sku === line.variantSku);
          setQty(line.qty);
          if (line.design?.text) { vals = { ...line.design.text }; setValues(vals); }
          if (v && v.sku !== variant.sku) { setVariant(v); return; } // effect re-runs with the right spec
          if (line.design?.options && JSON.stringify({ ...opts, ...line.design.options }) !== JSON.stringify(opts)) { setOpts((o) => ({ ...o, ...line.design!.options })); return; }
          restored = await restoreLine(line);
          if (!restored) toast("That cart item was made in the older editor, so we've started a fresh design with your text.");
        } else if (editLineId) toast("That cart item no longer exists, so here's a fresh design.");
        if (!restored) await rebuildAll(false, vals);
        builtFor.current = specKey; styleFor.current = styleKey; dirty.current = false; setReady(true);
        return;
      }
      if (builtFor.current === specKey) return;
      builtFor.current = specKey;
      await rebuildAll(true);
      toast("Layout updated for the new size or pages. Your photos were kept.");
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specKey]);

  // Option colours (diary, bottle, kids theme): restyle if the customer hasn't started editing yet.
  useEffect(() => {
    if (!ready || styleFor.current === styleKey) return;
    styleFor.current = styleKey;
    if (!dirty.current) void rebuildAll(true).then(() => { dirty.current = false; });
    else toast("New colour selected. Pick a layout again to restyle the design.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleKey, ready]);

  /* ---------------- fields ---------------- */
  const syncField = async (key: string, text: string, fromCanvas = false) => {
    const shown = text.trim() ? text : sample(key, fields.find((f) => f.key === key)?.label ?? key);
    const c = cvRef.current!;
    if (!fromCanvas) {
      c.getObjects().forEach((o0) => { const o = o0 as Obj; if (o.field === key) { o.set("text", shown); o.setCoords(); } });
      c.requestRenderAll();
    }
    for (let i = 0; i < facesRef.current.length; i++) {
      if (i === faceRef.current) continue;
      const d = JSON.parse(facesRef.current[i]); let hit = false;
      walk(d.objects, (o) => { if (o.field === key) { o.text = shown; hit = true; } });
      if (hit) { facesRef.current[i] = JSON.stringify(d); hist.current[i] = { stack: [facesRef.current[i]], i: 0 }; void refreshThumb(i); }
    }
  };
  const fieldTimer = useRef<number | undefined>(undefined);
  const onField = (key: string, text: string) => {
    setValues((v) => ({ ...v, [key]: text }));
    if (!printed.has(key)) return;
    void syncField(key, text);
    window.clearTimeout(fieldTimer.current); fieldTimer.current = window.setTimeout(() => pushHistory(), 500);
  };

  /* ---------------- photos ---------------- */
  const placePhotos = async (items: Photo[], target?: Obj | null) => {
    const c = cvRef.current!; const queue = items.map((p) => ({ el: p.el, fileId: p.id, srcKey: p.key }));
    let placed = 0;
    if (target && (target.role === "frame" || target.role === "photo") && queue.length) { const it = queue.shift()!; const img = fillFrame(c, target, it.el, it.fileId, it.srcKey); c.setActiveObject(img); placed++; }
    c.getObjects().filter((o) => (o as Obj).role === "frame").forEach((fr) => { const it = queue.shift(); if (it) { fillFrame(c, fr as Obj, it.el, it.fileId, it.srcKey); placed++; } });
    c.requestRenderAll(); pushHistory();
    const n = facesRef.current.length;
    for (let k = 1; k < n && queue.length; k++) {
      const i = (faceRef.current + k) % n; const before = queue.length;
      facesRef.current[i] = await withJSON(facesRef.current[i], specRef.current, (sc) => fillFrames(sc, queue));
      if (queue.length !== before) { placed += before - queue.length; hist.current[i] = { stack: [facesRef.current[i]], i: 0 }; void refreshThumb(i); }
    }
    if (queue.length && placed === 0) {
      // Nothing to fill (text-only design or every frame removed): add the first photo freely.
      const gg = geo(specRef.current);
      queue.splice(0, 1).forEach((it, k) => {
        const img = new F.FabricImage(it.el, { originX: "center", originY: "center", left: gg.W / 2 + k * 40, top: gg.H / 2 + k * 40 }) as Obj;
        img.scale((Math.min(gg.tw, gg.th) * 0.5) / Math.max(it.el.naturalWidth, it.el.naturalHeight)); img.role = "image"; img.fileId = it.fileId; img.srcKey = it.srcKey;
        c.add(img); c.setActiveObject(img); placed++;
      });
    }
    if (queue.length) { toast(`${placed} photo${placed === 1 ? "" : "s"} placed. The other ${queue.length} ${queue.length === 1 ? "is" : "are"} in Your photos: select a photo on the design, then tap one to swap it in.`); setTab("photos"); }
    else if (items.length > 1) toast(`${placed} photos placed${n > 1 ? " across the pages" : ""}.`);
    void refreshThumb(faceRef.current);
  };
  const readFiles = async (list: FileList | File[] | null, target?: Obj | null) => {
    if (!list) return;
    const files = [...list].filter((f) => f.type.startsWith("image/"));
    if (!files.length) { toast("Choose JPG, PNG or WebP photos."); return; }
    setBusy(files.length > 1 ? `Opening ${files.length} photos…` : "Opening photo…");
    const items: Photo[] = [];
    for (const f of files) {
      const url = URL.createObjectURL(f);
      try { const el = await loadImage(url); const p = { id: uid(), el, file: f, url, name: f.name }; photos.current.set(p.id, p); items.push(p); }
      catch { toast(`${f.name} couldn't be opened. HEIC photos from iPhone may need converting to JPG first.`); }
    }
    setBusy(null); setTray([...photos.current.values()]);
    if (items.length) await placePhotos(items, target ?? (cvRef.current?.getActiveObject() as Obj | undefined));
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); const c = cvRef.current; if (!c) return;
    const pt = c.getScenePoint(e.nativeEvent as unknown as MouseEvent);
    const hit = [...c.getObjects()].reverse().find((o) => ((o as Obj).role === "frame" || (o as Obj).role === "photo") && (o as Obj).frameBox
      ? (() => { const [l, t, w, h] = (o as Obj).frameBox; return pt.x >= l && pt.x <= l + w && pt.y >= t && pt.y <= t + h; })()
      : o.containsPoint(pt)) as Obj | undefined;
    void readFiles(e.dataTransfer.files, hit && (hit.role === "frame" || hit.role === "photo") ? hit : null);
  };

  /* ---------------- adding objects ---------------- */
  const centerAdd = (o: Obj) => {
    const c = cvRef.current!; const gg = geo(specRef.current);
    o.setPositionByOrigin(new F.Point(gg.W / 2, gg.H / 2), "center", "center"); c.add(o); o.setCoords(); c.setActiveObject(o); c.requestRenderAll();
  };
  const z0 = useMemo(() => ({ ...g, b: 0 }), [g]); // factories with bleed offset removed (we centre afterwards)
  const ptScale = Math.max(1, Math.min(spec.wMM, spec.hMM) / 51);
  const addText = (txt: string, o: Parameters<typeof T>[4]) => centerAdd(T(z0, txt, 0, 0, { ...o, pt: (o?.pt ?? 8) * ptScale }));
  const applyPreset = async (id: string, all = false) => {
    const c = cvRef.current!; c.discardActiveObject();
    facesRef.current[faceRef.current] = snapshot();
    const card = id.startsWith("card:");
    const targets = card ? spec.faces.map((_, i) => i) : all ? spec.faces.map((f, i) => (f.role === spec.faces[faceRef.current].role ? i : -1)).filter((i) => i >= 0) : [faceRef.current];
    setBusy("Applying layout…");
    for (const i of targets) {
      const queue = await collectPhotos([facesRef.current[i]]);
      facesRef.current[i] = await buildFace(i, id, queue);
      hist.current[i] = { stack: hist.current[i]?.stack.concat(facesRef.current[i]) ?? [facesRef.current[i]], i: (hist.current[i]?.stack.length ?? 0) };
      if (i !== faceRef.current) void refreshThumb(i);
    }
    await loadFace(faceRef.current); void refreshThumb(faceRef.current); dirty.current = true; setBusy(null);
  };

  /* ---------------- selection actions ---------------- */
  const active = () => cvRef.current?.getActiveObject() as Obj | undefined;
  const mod = (o: Obj, commit = true) => { o.setCoords(); cvRef.current!.requestRenderAll(); if (commit) pushHistory(); setSelV((v) => v + 1); };
  const removeActive = () => {
    const c = cvRef.current!; const objs = c.getActiveObjects() as Obj[]; if (!objs.length || (objs[0] as Obj).isEditing) return;
    c.discardActiveObject(); restoring.current = true; objs.forEach((o) => c.remove(o)); restoring.current = false; c.requestRenderAll(); pushHistory();
  };
  const duplicate = async () => {
    const c = cvRef.current!; const objs = c.getActiveObjects(); if (!objs.length) return;
    c.discardActiveObject(); const clones: F.FabricObject[] = [];
    for (const o of objs) { const k = await o.clone(PROPS); k.set({ left: k.left + 3 * MM, top: k.top + 3 * MM }); c.add(k); clones.push(k); }
    c.setActiveObject(clones.length > 1 ? new F.ActiveSelection(clones, { canvas: c }) : clones[0]); c.requestRenderAll();
  };
  const step = async (d: number) => {
    const i = faceRef.current; const h = hist.current[i]; if (!h) return; const ni = h.i + d; if (ni < 0 || ni >= h.stack.length) return;
    h.i = ni; facesRef.current[i] = h.stack[ni]; await loadFace(i); setHistV((v) => v + 1);
  };
  const groupSel = () => { const c = cvRef.current!; const objs = c.getActiveObjects(); if (objs.length < 2) return; c.discardActiveObject(); restoring.current = true; objs.forEach((o) => c.remove(o)); restoring.current = false; const grp = new F.Group(objs); c.add(grp); c.setActiveObject(grp); c.requestRenderAll(); };
  const ungroupSel = () => { const c = cvRef.current!; const grp = active(); if (!grp || !(grp instanceof F.Group) || grp instanceof F.ActiveSelection) return; restoring.current = true; const items = (grp as F.Group).removeAll(); c.remove(grp); items.forEach((x) => c.add(x)); restoring.current = false; c.setActiveObject(new F.ActiveSelection(items, { canvas: c })); c.requestRenderAll(); pushHistory(); };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement | null)?.tagName; if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const c = cvRef.current; if (!c) return; const o = c.getActiveObject() as Obj | undefined; if (o?.isEditing) return;
      const m = e.metaKey || e.ctrlKey, k = e.key.toLowerCase();
      if (m && k === "z") { e.preventDefault(); void step(e.shiftKey ? 1 : -1); }
      else if (m && k === "y") { e.preventDefault(); void step(1); }
      else if (m && k === "d" && o) { e.preventDefault(); void duplicate(); }
      else if ((e.key === "Delete" || e.key === "Backspace") && o) { e.preventDefault(); removeActive(); }
      else if (o && e.key.startsWith("Arrow") && !o.locked) {
        e.preventDefault(); const dd = (e.shiftKey ? 2 : 0.5) * MM;
        if (e.key === "ArrowLeft") o.left -= dd; if (e.key === "ArrowRight") o.left += dd; if (e.key === "ArrowUp") o.top -= dd; if (e.key === "ArrowDown") o.top += dd;
        o.setCoords(); c.requestRenderAll(); window.clearTimeout(fieldTimer.current); fieldTimer.current = window.setTimeout(() => pushHistory(), 300);
      }
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { guidesRef.current = guides; cvRef.current?.requestRenderAll(); }, [guides]);

  // Layout thumbnails for the current face
  const presets = useMemo(() => (ready ? presetsFor(ctxFor(faceIdx)) : []), [ready, faceIdx, ctxFor]);
  useEffect(() => {
    if (tab !== "layouts" || !ready) return; let stop = false;
    (async () => {
      for (const p of presets) {
        const key = `${specKey}|${faceIdx}|${styleKey}|${p.id}`; if (presetThumbs[key] || stop) continue;
        try { const j = jsonFromBuilt(build(p.id, ctxFor(faceIdx))); const url = await renderJSON(j, specRef.current, { width: 220, trim: true, format: "jpeg", quality: 0.75, showFrames: true }); if (!stop) setPresetThumbs((t) => ({ ...t, [key]: url })); } catch { /* skip */ }
      }
    })();
    return () => { stop = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, ready, presets, specKey, faceIdx, styleKey]);

  /* ---------------- review, preview, cart ---------------- */
  const audit = () => {
    if (cvRef.current) facesRef.current[faceRef.current] = snapshot();
    const low: string[] = []; let empty = 0, photosUsed = 0;
    facesRef.current.forEach((j, i) => {
      const d = JSON.parse(j);
      walk(d.objects, (o) => {
        if (o.role === "frame") empty++;
        if (o.type?.toLowerCase() === "image") { photosUsed++; const dpi = Math.round((25.4 * MM) / (o.scaleX || 1)); if (dpi < LOW_DPI) low.push(`${spec.faces[i].label}: ${dpi} dpi`); }
      });
    });
    return { low, empty, photosUsed };
  };
  const openPreview = async () => {
    const c = cvRef.current; if (!c) return; c.discardActiveObject(); facesRef.current[faceRef.current] = snapshot();
    setBusy("Rendering preview…");
    const out: { label: string; url: string }[] = [];
    const n = Math.min(facesRef.current.length, 24);
    for (let i = 0; i < n; i++) out.push({ label: spec.faces[i].label, url: await renderJSON(facesRef.current[i], spec, { width: 520, trim: true, format: "jpeg", quality: 0.85 }) });
    setBusy(null); setPreview(out);
  };
  const addToCart = async () => {
    const c = cvRef.current; if (!c) return; c.discardActiveObject(); facesRef.current[faceRef.current] = snapshot();
    setError(null);
    const used = new Set<string>();
    facesRef.current.forEach((j) => walk(JSON.parse(j).objects, (o) => { if (o.fileId) used.add(o.fileId); }));
    const keys: Record<string, string> = {};
    try {
      const todo = [...used].map((id) => photos.current.get(id)).filter(Boolean) as Photo[];
      for (let k = 0; k < todo.length; k++) {
        const p = todo[k]; if (p.key) { keys[p.id] = p.key; continue; } if (!p.file) continue;
        setBusy(`Uploading photo ${k + 1} of ${todo.length}…`);
        const r = await fetch("/api/upload", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ filename: p.file.name, mime: p.file.type || "image/jpeg", bytes: p.file.size }) });
        const j = (await r.json()) as { key: string; url: string | null; error?: string };
        if (!r.ok) throw new Error(j.error ?? "Upload failed");
        if (j.url) {
          let put: Response;
          try { put = await fetch(j.url, { method: "PUT", body: p.file, headers: { "content-type": p.file.type || "image/jpeg" } }); }
          catch { throw new Error("Photo upload was blocked by the browser (storage CORS). Please call us and we'll sort it out."); }
          if (!put.ok) throw new Error(`Photo upload failed (storage replied ${put.status}).`);
          p.key = j.key;
        }
        keys[p.id] = j.key;
      }
    } catch (e) { setBusy(null); setError((e as Error).message); return; }
    setBusy("Saving your design…");
    const faces = facesRef.current.map((j) => { const d = JSON.parse(j); walk(d.objects, (o) => { if (o.fileId && keys[o.fileId]) o.srcKey = keys[o.fileId]; }); return JSON.stringify(d); });
    let previewUrl = product.image;
    try { previewUrl = await renderJSON(faces[0], spec, { width: 640, trim: true, format: "jpeg", quality: 0.72 }); } catch { /* keep product image */ }
    const slots = [...used].map((id) => { const p = photos.current.get(id); return { key: keys[id], zoom: 1, dx: 0, dy: 0, rot: 0, w: p?.el.naturalWidth ?? 0, h: p?.el.naturalHeight ?? 0 }; });
    const text = Object.fromEntries(Object.entries(values).filter(([, v]) => v?.trim()));
    const label = optionLabel(groups, opts);
    const line = {
      productSlug: product.slug, productName: product.name, variantSku: variant.sku, variantName: label ? `${variant.name} · ${label}` : variant.name, unitPrice, qty, image: product.image,
      design: { preview: previewUrl, text, photoCount: used.size, options: opts, slots, canvas: { w: g.W, h: g.H, aspect: spec.wMM / spec.hMM },
        studio: { v: 1, spec: { wMM: spec.wMM, hMM: spec.hMM, bleedMM: spec.bleedMM, safeMM: spec.safeMM }, faces: spec.faces.map((f, i) => ({ id: f.id, label: f.label, json: faces[i] })) } },
    };
    if (editLineId) replace(editLineId, line); else add(line);
    setBusy(null); router.push("/cart");
  };

  /* ---------------- render ---------------- */
  void selV; void histV;
  const sel = ready ? active() : undefined;
  const h = hist.current[faceIdx];
  const multiFace = spec.faces.length > 1;
  const isText = !!sel && inst(sel, F.IText);
  const isMulti = !!sel && inst(sel, F.ActiveSelection);
  const isGroup = !!sel && inst(sel, F.Group) && !isMulti;
  const { low, empty } = ready && approved ? audit() : { low: [] as string[], empty: 0 };


  return (
    <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)_320px]">
      <input ref={fileInput} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { const t = pendingTarget.current; pendingTarget.current = null; void readFiles(e.target.files, t); e.target.value = ""; }} />

      {/* ---------- tools ---------- */}
      <section className="order-2 xl:order-1 card p-3 self-start xl:sticky xl:top-28">
        <div className="grid grid-cols-6 gap-1">
          <TabBtn id="layouts" icon={LayoutTemplate} label="Layouts" tab={tab} setTab={setTab} />
          <TabBtn id="photos" icon={Images} label="Photos" tab={tab} setTab={setTab} />
          <TabBtn id="text" icon={Type} label="Text" tab={tab} setTab={setTab} />
          <TabBtn id="graphics" icon={Shapes} label="Graphics" tab={tab} setTab={setTab} />
          <TabBtn id="qr" icon={QrCode} label="QR" tab={tab} setTab={setTab} />
          <TabBtn id="colour" icon={Palette} label="Colour" tab={tab} setTab={setTab} />
        </div>
        <div className="mt-3 max-h-[calc(100vh-15rem)] overflow-y-auto pr-1 space-y-3">
          {tab === "layouts" && (<>
            <p className="text-xs text-ink-3">{product.slug === "business-cards" ? "Each template sets up the front and the back. Your details carry over." : `Layouts for ${multiFace ? spec.faces[faceIdx]?.label.toLowerCase() : "your design"}. Photos you've added move into the new frames.`}</p>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((p) => { const key = `${specKey}|${faceIdx}|${styleKey}|${p.id}`; return (
                <button key={p.id} type="button" onClick={() => void applyPreset(p.id)} className="text-left group">
                  <div className="rounded-md bg-surface-2 border border-line overflow-hidden group-hover:border-brand transition-colors" style={{ aspectRatio: `${spec.wMM} / ${spec.hMM}` }}>{presetThumbs[key] && <img src={presetThumbs[key]} alt="" className="w-full h-full object-cover" />}</div>
                  <div className="text-xs font-semibold mt-1">{p.label}</div>{p.hint && <div className="text-[11px] text-ink-3">{p.hint}</div>}
                </button>); })}
            </div>
            {multiFace && product.slug !== "business-cards" && spec.faces.filter((f) => f.role === spec.faces[faceIdx]?.role).length > 1 && (
              <p className="text-xs text-ink-3">Tip: <button type="button" className="underline text-brand" onClick={() => void applyPreset(defaultPreset(ctxFor(faceIdx)), true)}>reset every {spec.faces[faceIdx].role === "month" ? "month" : "page"} to the standard layout</button></p>
            )}
          </>)}

          {tab === "photos" && (<>
            <label className="card border-dashed p-5 text-center cursor-pointer hover:border-brand block" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void readFiles(e.dataTransfer.files); }}>
              <Upload className="mx-auto text-brand" />
              <div className="font-semibold mt-2">{multiFace ? "Add photos for every page" : "Add photos"}</div>
              <div className="text-xs text-ink-3">JPG, PNG or WebP. They fill empty frames in order{multiFace ? ", then the next pages" : ""}.</div>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { void readFiles(e.target.files); e.target.value = ""; }} />
            </label>
            {tray.length > 0 && (<>
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-3">Your photos</div>
              <p className="text-xs text-ink-3">Select a frame on the design, then tap a photo to put it there.</p>
              <div className="grid grid-cols-3 gap-1.5">
                {tray.map((p) => <button key={p.id} type="button" onClick={() => void placePhotos([p], active())} className="aspect-square rounded-md bg-surface-2 bg-cover bg-center border border-line hover:border-brand" style={{ backgroundImage: `url(${p.url})` }} aria-label={`Place ${p.name}`} />)}
              </div>
            </>)}
            <button type="button" className="btn btn-ghost w-full !py-2 text-sm" onClick={() => { const fr = Frame(z0, 0, 0, Math.min(spec.wMM, spec.hMM) * 0.5, Math.min(spec.wMM, spec.hMM) * 0.5); centerAdd(fr); }}>Add an empty photo frame</button>
          </>)}

          {tab === "text" && (<>
            {fields.length > 0 && (<div className="space-y-2.5">
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-3">Your details</div>
              {fields.map((f) => (
                <label key={f.key} className="block">
                  <span className="text-sm font-semibold">{f.label}</span>{!printed.has(f.key) && <span className="text-[11px] text-ink-3"> · for our team, not printed</span>}
                  {f.max > 60 ? <textarea className="input mt-1 !py-2 text-sm" rows={3} maxLength={f.max} value={values[f.key] ?? ""} onChange={(e) => onField(f.key, e.target.value)} />
                    : <input className="input mt-1 !py-2 text-sm" maxLength={f.max} value={values[f.key] ?? ""} placeholder={printed.has(f.key) ? sample(f.key, f.label) : ""} onChange={(e) => onField(f.key, e.target.value)} />}
                </label>))}
            </div>)}
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-3 pt-1">Add text</div>
            <div className="grid gap-2">
              <button type="button" className="btn btn-ghost !justify-start !py-2" onClick={() => addText("Your heading", { f: "Fraunces Variable", pt: 14, w: "600" })}><span className="font-display text-lg font-semibold">Add a heading</span></button>
              <button type="button" className="btn btn-ghost !justify-start !py-2" onClick={() => addText("SUBHEADING", { pt: 7, w: "600", cs: 200, c: "#5b554e" })}><span className="text-xs font-semibold tracking-[.15em]">ADD A SUBHEADING</span></button>
              <button type="button" className="btn btn-ghost !justify-start !py-2" onClick={() => addText("A line of text", { pt: 7 })}><span className="text-sm">Add body text</span></button>
              <button type="button" className="btn btn-ghost !justify-start !py-2" onClick={() => addText("With love", { f: "Great Vibes", pt: 16 })}><span style={{ fontFamily: "'Great Vibes', cursive" }} className="text-xl">Add a script line</span></button>
            </div>
            <p className="text-xs text-ink-3">Double-click any text on the design to edit it. Keep small text at 6 pt or larger so it prints clearly.</p>
          </>)}

          {tab === "graphics" && (<>
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-3">Shapes</div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { k: "Rectangle", f: () => R(z0, 0, 0, spec.wMM * 0.3, spec.hMM * 0.2, "#1F6F78") },
                { k: "Rounded", f: () => R(z0, 0, 0, spec.wMM * 0.3, spec.hMM * 0.2, "#1F6F78", { rx: 25, ry: 25 }) },
                { k: "Circle", f: () => C(z0, 0, 0, Math.min(spec.wMM, spec.hMM) * 0.15, "#E2573F") },
                { k: "Ring", f: () => Ring(z0, 0, 0, Math.min(spec.wMM, spec.hMM) * 0.15, "#E2573F", 0.6) },
                { k: "Line", f: () => Ln(z0, 0, 0, spec.wMM * 0.35, 0, "#1D1A17", 0.4) },
                { k: "Triangle", f: () => P(z0, [[0, 10], [5.8, 0], [11.6, 10]], "#C8962E") },
                { k: "Band", f: () => R(z0, 0, 0, spec.wMM + 2 * spec.bleedMM, spec.hMM * 0.18, "#1F2A44") },
                { k: "Star", f: () => Icon(z0, "star", 0, 0, Math.min(spec.wMM, spec.hMM) * 0.25, "#C8962E") },
              ].map((s) => <button key={s.k} type="button" onClick={() => centerAdd(s.f())} className="aspect-square rounded-lg border border-line hover:bg-surface-2 text-[11px] font-semibold text-ink-2">{s.k}</button>)}
            </div>
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-3">Icons</div>
            <div className="grid grid-cols-5 gap-2">
              {Object.keys(ICONS).map((n) => <button key={n} type="button" aria-label={`${n} icon`} onClick={() => centerAdd(Icon(z0, n, 0, 0, Math.max(4, Math.min(spec.wMM, spec.hMM) * 0.1), "#1D1A17"))} className="aspect-square rounded-lg border border-line hover:bg-surface-2 grid place-items-center"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={ICONS[n]} /></svg></button>)}
            </div>
          </>)}

          {tab === "qr" && (<>
            <p className="text-xs text-ink-3">Link to a website, WhatsApp chat, UPI ID, Google review page or menu. Keep it at least 15 mm wide so phones can scan it.</p>
            <label className="block"><span className="text-sm font-semibold">Link or text</span><input className="input mt-1 !py-2 text-sm" value={qrText} onChange={(e) => setQrText(e.target.value)} /></label>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {[["WhatsApp", "https://wa.me/91"], ["UPI", "upi://pay?pa=yourname@upi&pn=Your%20Name"], ["Website", "https://"]].map(([l, v]) => <button key={l} type="button" className="chip bg-surface-2" onClick={() => setQrText(v)}>{l}</button>)}
            </div>
            <button type="button" className="btn btn-primary w-full !py-2" onClick={() => { if (!qrText.trim()) { toast("Enter a link or some text first."); return; } try { centerAdd(QR(z0, qrText.trim(), 0, 0, Math.max(15, Math.min(spec.wMM, spec.hMM) * 0.3), "#1D1A17")); } catch { toast("That's too long for a QR code. Shorten it."); } }}>Add QR code</button>
          </>)}

          {tab === "colour" && (<>
            <p className="text-xs text-ink-3">Background colour for {multiFace ? spec.faces[faceIdx]?.label.toLowerCase() : "the design"}. It runs into the bleed so there are no white slivers after trimming.</p>
            <div className="grid grid-cols-8 gap-1.5">{SWATCHES.map((c) => <button key={c} type="button" aria-label={c} onClick={() => { const cv = cvRef.current!; cv.backgroundColor = c; cv.requestRenderAll(); pushHistory(); }} className="aspect-square rounded-full border border-black/10" style={{ background: c }} />)}</div>
            <label className="flex items-center justify-between text-sm font-semibold">Custom colour<input type="color" className="h-9 w-12 rounded border border-line" defaultValue="#ffffff" onChange={(e) => { const cv = cvRef.current!; cv.backgroundColor = e.target.value; cv.requestRenderAll(); }} onBlur={() => pushHistory()} /></label>
            {multiFace && <button type="button" className="btn btn-ghost w-full !py-2 text-sm" onClick={() => { const bg = cvRef.current!.backgroundColor as string; facesRef.current = facesRef.current.map((j, i) => { if (i === faceRef.current) return j; const d = JSON.parse(j); d.background = bg; hist.current[i] = { stack: [JSON.stringify(d)], i: 0 }; return JSON.stringify(d); }); facesRef.current.forEach((_, i) => i !== faceRef.current && void refreshThumb(i)); toast("Background applied to every page."); }}>Use on every page</button>}
          </>)}
        </div>
      </section>

      {/* ---------- stage ---------- */}
      <section className="order-1 xl:order-2 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <button type="button" className="btn btn-ghost !p-2" aria-label="Undo" disabled={!h || h.i <= 0} onClick={() => void step(-1)}><Undo2 size={18} /></button>
          <button type="button" className="btn btn-ghost !p-2" aria-label="Redo" disabled={!h || h.i >= h.stack.length - 1} onClick={() => void step(1)}><Redo2 size={18} /></button>
          <div className="inline-flex items-center border border-line rounded-full">
            <button type="button" className="p-2" aria-label="Zoom out" onClick={() => setZoomMul((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}><ZoomOut size={16} /></button>
            <span className="text-xs w-11 text-center tabular-nums">{Math.round(zoomMul * 100)}%</span>
            <button type="button" className="p-2" aria-label="Zoom in" onClick={() => setZoomMul((z) => Math.min(3, +(z + 0.25).toFixed(2)))}><ZoomIn size={16} /></button>
          </div>
          <label className="flex items-center gap-1.5 text-xs text-ink-2"><input type="checkbox" checked={guides} onChange={(e) => setGuides(e.target.checked)} />Print guides</label>
          <button type="button" className="btn btn-ghost !py-1.5 !px-3 text-sm ml-auto" onClick={() => void openPreview()} disabled={!ready}><Eye size={16} />Preview</button>
        </div>
        <div ref={stageRef} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}
          className="relative rounded-2xl border border-line overflow-hidden grid place-items-center h-[58vh] min-h-[320px] xl:h-[calc(100vh-15rem)] xl:min-h-[480px]"
          style={{ backgroundColor: "#ece6dd", backgroundImage: "radial-gradient(#d6cdbf 1px, transparent 1px)", backgroundSize: "14px 14px" }}>
          <div className="shadow-[0_2px_4px_rgba(0,0,0,.08),0_14px_36px_rgba(29,26,23,.18)] leading-[0]"><canvas ref={elRef} /></div>
          {!ready && <div className="absolute inset-0 grid place-items-center text-sm text-ink-2 bg-[#ece6dd]">Setting up your {product.shortName ?? product.name.toLowerCase()}…</div>}
          {busy && <div className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-ink text-white text-xs font-semibold px-3 py-1.5">{busy}</div>}
          {guides && <div className="absolute bottom-2 left-3 flex flex-wrap gap-3 text-[11px] text-ink-2 pointer-events-none">
            <span className="flex items-center gap-1"><i className="inline-block w-3 h-2 bg-[rgba(226,87,63,.35)]" />Bleed, trimmed off</span>
            <span className="flex items-center gap-1"><i className="inline-block w-3 border-t-2 border-brand" />Cut line</span>
            <span className="flex items-center gap-1"><i className="inline-block w-3 border-t-2 border-dashed border-accent" />Safe zone</span>
          </div>}
        </div>
        {multiFace && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Pages">
            {spec.faces.map((f, i) => (
              <button key={f.id} type="button" role="tab" aria-selected={i === faceIdx} onClick={() => void goFace(i)} className="shrink-0 text-center">
                <div className={`h-16 rounded-md bg-white border-2 overflow-hidden ${i === faceIdx ? "border-brand" : "border-line"}`} style={{ aspectRatio: `${spec.wMM} / ${spec.hMM}` }}>{thumbs[i] && <img src={thumbs[i]} alt="" className="w-full h-full object-cover" />}</div>
                <div className={`text-[11px] mt-1 ${i === faceIdx ? "font-semibold text-ink" : "text-ink-3"}`}>{f.label}</div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ---------- inspector + order ---------- */}
      <aside className="order-3 space-y-4 self-start xl:sticky xl:top-28 xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto no-scrollbar">
        {sel && (
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between"><div className="font-semibold">{isMulti ? "Several items" : isText ? "Text" : sel.role === "frame" ? "Photo frame" : sel.role === "photo" ? "Photo" : sel.role === "image" ? "Image" : sel.role === "qr" ? "QR code" : sel.role === "calendar" ? "Calendar dates" : isGroup ? "Group" : "Shape"}</div>
              <button type="button" aria-label="Deselect" className="text-ink-3" onClick={() => { const c = cvRef.current!; c.discardActiveObject(); c.requestRenderAll(); }}><X size={16} /></button></div>

            {sel.role === "frame" && (<>
              <p className="text-sm text-ink-2">Drag the frame or its handles to change where the photo goes.</p>
              <button type="button" className="btn btn-primary w-full !py-2" onClick={() => { pendingTarget.current = sel; fileInput.current?.click(); }}><Upload size={16} />Add photo here</button>
              {tray.length > 0 && <p className="text-xs text-ink-3">Or tap one of Your photos in the Photos tab.</p>}
            </>)}

            {sel.role === "photo" && (() => { const dpi = photoDpi(sel); const q = dpi >= GOOD_DPI ? ["Sharp", "text-accent"] : dpi >= LOW_DPI ? ["Good", "text-accent"] : ["May print soft", "text-amber-700"]; return (<>
              <div className="flex items-center justify-between text-sm"><span>Print quality</span><span className={`font-semibold ${q[1]}`}>{q[0]} · {dpi} dpi</span></div>
              {dpi < LOW_DPI && <div className="flex gap-2 text-xs bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-2"><AlertTriangle size={14} className="shrink-0 mt-0.5" />Zoom out a little or use a larger original for a crisper print.</div>}
              <p className="text-xs text-ink-3">Drag to reposition inside the frame. Use the corner handles to zoom.</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="btn btn-ghost !py-1.5 text-sm" onClick={() => { fitPhoto(sel); mod(sel); }}><Maximize2 size={15} />Fill frame</button>
                <button type="button" className="btn btn-ghost !py-1.5 text-sm" onClick={() => { pendingTarget.current = sel; fileInput.current?.click(); }}><RefreshCw size={15} />Replace</button>
                <button type="button" className="btn btn-ghost !py-1.5 text-sm" onClick={() => { const img = sel as unknown as F.FabricImage; const on = !img.filters?.length; img.filters = on ? [new F.filters.Grayscale()] : []; img.applyFilters(); mod(sel); }}><Contrast size={15} />{(sel as unknown as F.FabricImage).filters?.length ? "Colour" : "B & W"}</button>
                <button type="button" className="btn btn-ghost !py-1.5 text-sm" onClick={() => { const c = cvRef.current!; c.discardActiveObject(); photoToFrame(c, sel); c.requestRenderAll(); }}><Trash2 size={15} />Remove</button>
              </div>
            </>); })()}

            {isText && (<>
              <select className="input !py-2 text-sm" value={sel.fontFamily} onChange={(e) => { sel.set("fontFamily", e.target.value); void document.fonts.load(`20px "${e.target.value}"`).then(() => { sel.initDimensions?.(); mod(sel); }); }}>
                {FONTS.map((f) => <option key={f} value={f} style={{ fontFamily: `'${f}'` }}>{fontLabel(f)}</option>)}
              </select>
              <div className="flex items-center gap-2">
                <label className="text-sm flex-1">Size (pt)</label>
                <input type="number" min={4} max={400} step={0.5} className="input !py-1.5 !w-24 text-sm" value={+(sel.fontSize / PT).toFixed(1)} onChange={(e) => { const v = Math.max(4, Math.min(400, Number(e.target.value) || 8)); sel.set("fontSize", v * PT); mod(sel); }} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button type="button" aria-pressed={+sel.fontWeight >= 600 || sel.fontWeight === "bold"} className="tog" onClick={() => { sel.set("fontWeight", +sel.fontWeight >= 600 || sel.fontWeight === "bold" ? "400" : "700"); mod(sel); }}><b>B</b></button>
                <button type="button" aria-pressed={sel.fontStyle === "italic"} className="tog" onClick={() => { sel.set("fontStyle", sel.fontStyle === "italic" ? "normal" : "italic"); mod(sel); }}><i>I</i></button>
                <button type="button" aria-pressed={!!sel.underline} className="tog" onClick={() => { sel.set("underline", !sel.underline); mod(sel); }}><u>U</u></button>
                <button type="button" className="tog" onClick={() => { const t: string = sel.text; sel.set("text", t === t.toUpperCase() ? t.toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase()) : t.toUpperCase()); mod(sel); }}>Aa</button>
                {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]] as const).map(([a, I]) => (
                  <button key={a} type="button" aria-label={`Align ${a}`} aria-pressed={sel.textAlign === a} className="tog" onClick={() => { const p = sel.getPointByOrigin(a, "top"); sel.set({ textAlign: a, originX: a }); sel.setPositionByOrigin(p, a, "top"); mod(sel); }}><I size={15} /></button>))}
              </div>
              <label className="block text-xs text-ink-3">Letter spacing<input type="range" min={-50} max={800} step={10} className="w-full accent-[var(--brand)]" value={sel.charSpacing ?? 0} onChange={(e) => { sel.set("charSpacing", Number(e.target.value)); mod(sel, false); }} onMouseUp={() => pushHistory()} onTouchEnd={() => pushHistory()} /></label>
              <label className="block text-xs text-ink-3">Line height<input type="range" min={0.8} max={2.2} step={0.05} className="w-full accent-[var(--brand)]" value={sel.lineHeight ?? 1.15} onChange={(e) => { sel.set("lineHeight", Number(e.target.value)); mod(sel, false); }} onMouseUp={() => pushHistory()} onTouchEnd={() => pushHistory()} /></label>
            </>)}

            {sel.role !== "photo" && sel.role !== "frame" && sel.role !== "image" && (
              <div>
                <div className="text-xs text-ink-3 mb-1.5">Colour</div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {INK.map((c) => <button key={c} type="button" aria-label={c} className="w-6 h-6 rounded-full border border-black/15" style={{ background: c }} onClick={() => { setColour(sel, c); mod(sel); }} />)}
                  <input type="color" className="h-7 w-9 rounded border border-line" aria-label="Custom colour" onChange={(e) => { setColour(sel, e.target.value); mod(sel, false); }} onBlur={() => pushHistory()} />
                </div>
              </div>
            )}

            <label className="block text-xs text-ink-3">Opacity<input type="range" min={0.1} max={1} step={0.05} className="w-full accent-[var(--brand)]" value={sel.opacity ?? 1} onChange={(e) => { sel.set("opacity", Number(e.target.value)); mod(sel, false); }} onMouseUp={() => pushHistory()} onTouchEnd={() => pushHistory()} /></label>
            <div className="grid grid-cols-4 gap-1.5">
              <button type="button" className="tog !w-full" title="Bring forward" aria-label="Bring forward" onClick={() => { cvRef.current!.bringObjectForward(sel); mod(sel); }}><ArrowUp size={15} /></button>
              <button type="button" className="tog !w-full" title="Send backward" aria-label="Send backward" onClick={() => { cvRef.current!.sendObjectBackwards(sel); mod(sel); }}><ArrowDown size={15} /></button>
              <button type="button" className="tog !w-full" title="Centre on the design" aria-label="Centre" onClick={() => { sel.setPositionByOrigin(new F.Point(g.W / 2, g.H / 2), "center", "center"); if (sel.role === "photo") sel.frameBox = undefined; mod(sel); }} disabled={sel.role === "photo"}><Crosshair size={15} /></button>
              <button type="button" className="tog !w-full" title="Duplicate" aria-label="Duplicate" onClick={() => void duplicate()}><Copy size={15} /></button>
              {!isMulti && <button type="button" className="tog !w-full" title={sel.locked ? "Unlock" : "Lock"} aria-label={sel.locked ? "Unlock" : "Lock"} onClick={() => { sel.locked = !sel.locked; applyLock(sel); mod(sel); }}>{sel.locked ? <LockOpen size={15} /> : <Lock size={15} />}</button>}
              {isMulti && <button type="button" className="tog !w-full" title="Group" aria-label="Group" onClick={groupSel}><Group size={15} /></button>}
              {isGroup && sel.role !== "calendar" && <button type="button" className="tog !w-full" title="Ungroup" aria-label="Ungroup" onClick={ungroupSel}><Ungroup size={15} /></button>}
              <button type="button" className="tog !w-full text-brand" title="Delete" aria-label="Delete" onClick={removeActive}><Trash2 size={15} /></button>
            </div>
          </div>
        )}

        <div className="card p-4 space-y-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-3">Designing</div>
            <div className="font-bold text-lg leading-snug">{product.name}</div>
            <div className="text-sm text-ink-2">{inr(unitPrice)} each{qty > 1 ? ` · ${inr(unitPrice * qty)} for ${qty}` : ""}</div>
            <div className="text-xs text-ink-3 mt-0.5 tabular-nums">Print size {spec.label}{multiFace ? ` · ${spec.faces.length} ${spec.faces[1]?.role === "back" || spec.faces[1]?.role === "postcard-back" ? "sides" : "pages"}` : ""}</div>
          </div>
          <details className="text-sm group" open={product.variants.length > 1 || groups.length > 0}>
            <summary className="cursor-pointer list-none flex justify-between font-semibold">Size, finish & quantity<span className="text-ink-3 group-open:rotate-45 transition-transform">+</span></summary>
            {product.variants.length > 1 && (
              <div className="mt-3"><div className="text-xs font-semibold text-ink-3 mb-1">Size</div>
                <select className="input !py-2" value={variant.sku} onChange={(e) => setVariant(product.variants.find((x) => x.sku === e.target.value)!)}>
                  {product.variants.map((x) => <option key={x.sku} value={x.sku}>{x.name} — {inr(x.price)}</option>)}
                </select></div>)}
            {groups.map((gr) => (
              <div key={gr.key} className="mt-3"><div className="text-xs font-semibold text-ink-3 mb-1">{gr.label}</div>
                <div className="flex flex-wrap gap-1.5">{gr.choices.map((c) => (
                  <button key={c.id} type="button" title={c.hint} onClick={() => setOpts({ ...opts, [gr.key]: c.id })} className={`rounded-full border px-2.5 py-1 text-xs ${opts[gr.key] === c.id ? "border-brand bg-brand-soft" : "border-line"}`}>{c.label}{c.delta ? ` ${c.delta > 0 ? "+" : "−"}₹${Math.abs(c.delta)}` : ""}</button>))}</div></div>))}
            <div className="mt-3 flex items-center justify-between"><div className="text-xs font-semibold text-ink-3">Quantity</div>
              <div className="inline-flex border border-line rounded-full"><button type="button" className="px-3" onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span className="px-1 py-1 w-6 text-center">{qty}</span><button type="button" className="px-3" onClick={() => setQty(Math.min(99, qty + 1))}>+</button></div></div>
          </details>

          <label className="flex gap-2 text-sm items-start"><input type="checkbox" className="mt-1" checked={approved} onChange={(e) => setApproved(e.target.checked)} /><span>I&apos;ve checked spelling, photos and layout. Print it as shown.</span></label>
          {approved && (low.length > 0 || empty > 0) && (
            <div className="text-xs bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-2.5 space-y-1">
              {empty > 0 && <div className="flex gap-1.5"><AlertTriangle size={14} className="shrink-0" />{empty} empty frame{empty > 1 ? "s" : ""}. Empty frames print blank (the dashed lines don&apos;t print).</div>}
              {low.slice(0, 4).map((l) => <div key={l} className="flex gap-1.5"><AlertTriangle size={14} className="shrink-0" />Photo may print soft · {l}</div>)}
            </div>)}
          {error && <div className="flex items-start gap-2 text-sm bg-brand-soft border border-brand/30 text-brand-ink rounded-xl p-3"><AlertTriangle size={16} className="mt-0.5 shrink-0" /><span>{error} <button type="button" className="underline" onClick={() => void addToCart()}>Try again</button></span></div>}
          <button type="button" disabled={!ready || !approved || !!busy} onClick={() => void addToCart()} className="btn btn-primary w-full text-base !py-3.5">{busy && busy.startsWith("Upload") ? busy : <>{editLineId ? "Update cart" : `Add ${qty > 1 ? `${qty} ` : ""}to cart`} · {inr(unitPrice * qty)}</>}</button>
          <p className="text-xs text-ink-3 flex gap-1.5"><Check size={14} className="text-accent shrink-0" />Your design is saved with the order, so reorders print the same file.</p>
          <CallUs compact />
        </div>
      </aside>

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setPreview(null); }}>
          <div className="bg-surface rounded-2xl max-w-5xl w-full max-h-full overflow-auto p-5">
            <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold">Preview after trimming</h2><button type="button" className="btn btn-ghost !py-1.5" onClick={() => setPreview(null)}>Close</button></div>
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))] bg-[#ece6dd] rounded-xl p-5">
              {preview.map((p) => <figure key={p.label} className="m-0"><img src={p.url} alt={p.label} className="w-full shadow-md" /><figcaption className="text-xs text-ink-2 mt-1.5 font-semibold">{p.label}</figcaption></figure>)}
            </div>
            {spec.faces.length > preview.length && <p className="text-xs text-ink-3 mt-3">Showing the first {preview.length} of {spec.faces.length} pages.</p>}
            <p className="text-xs text-ink-3 mt-3">Bleed, cut lines and empty frame outlines are not printed. Colours on paper look slightly softer than on screen.</p>
          </div>
        </div>
      )}
      {toastMsg && <div role="status" className="fixed left-1/2 -translate-x-1/2 bottom-5 z-50 bg-ink text-white text-sm font-medium rounded-xl px-4 py-2.5 shadow-lg max-w-[calc(100%-2rem)]">{toastMsg}</div>}
    </div>
  );
}

function TabBtn({ id, icon: I, label, tab, setTab }: { id: Tab; icon: typeof Images; label: string; tab: Tab; setTab: (t: Tab) => void }) {
  return <button type="button" onClick={() => setTab(id)} aria-pressed={tab === id} className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold ${tab === id ? "bg-brand-soft text-brand-ink" : "text-ink-2 hover:bg-surface-2"}`}><I size={18} />{label}</button>;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function inst(o: unknown, k: any): boolean { return o instanceof k; }
function setColour(o: Obj, c: string) {
  if (o instanceof F.Group) { o.getObjects().forEach((x) => setColour(x as Obj, c)); o.set("dirty", true); return; }
  if (o.isIcon || o.type === "line" || o instanceof F.Line || (o.fill === "transparent" && o.stroke)) o.set("stroke", c); else o.set("fill", c);
}
