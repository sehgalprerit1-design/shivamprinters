"use client";
// Builds a print-ready PDF from a design-studio order: every face at 300 dpi
// (capped for very large items like banners), trim size plus bleed, one page per face.
import { useState } from "react";
import { FileDown } from "lucide-react";

const BLANK = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
type Studio = { spec: { wMM: number; hMM: number; bleedMM: number; safeMM: number }; faces: { id: string; label: string; json: string }[] };

export function PrintFiles({ studio, links, name }: { studio: Studio; links: Record<string, string>; name: string }) {
  const [state, setState] = useState<string | null>(null);
  const run = async () => {
    setState("Loading…");
    try {
      const [{ jsPDF }, engine] = await Promise.all([import("jspdf"), import("@/components/editor/studio/engine")]);
      const { spec } = studio;
      const full = { ...spec, faces: [], label: "", textFirst: false };
      const w = spec.wMM + 2 * spec.bleedMM, h = spec.hMM + 2 * spec.bleedMM;
      const longest = Math.max(w, h);
      const px = Math.min(Math.round((w / 25.4) * 300), Math.round((12000 * w) / longest)); // 300 dpi, max 12000 px
      const pdf = new jsPDF({ unit: "mm", format: [w, h], orientation: w > h ? "landscape" : "portrait", compress: true });
      let missing = 0;
      for (let i = 0; i < studio.faces.length; i++) {
        setState(`Rendering ${studio.faces[i].label} (${i + 1}/${studio.faces.length})…`);
        const d = JSON.parse(studio.faces[i].json);
        engine.walk(d.objects, (o) => { if (o.type?.toLowerCase() !== "image") return; if (o.srcKey && links[o.srcKey]) o.src = links[o.srcKey]; else { o.src = BLANK; o.visible = false; missing++; } });
        const url = await engine.renderJSON(JSON.stringify(d), full, { width: px, format: "jpeg", quality: 0.95 });
        if (i > 0) pdf.addPage([w, h], w > h ? "landscape" : "portrait");
        pdf.addImage(url, "JPEG", 0, 0, w, h);
      }
      pdf.save(`${name}-print.pdf`);
      setState(missing ? `Done, but ${missing} photo${missing > 1 ? "s were" : " was"} not in storage and left blank. Ask the customer to re-upload.` : "Done.");
    } catch (e) { setState(`Couldn't build the PDF: ${(e as Error).message}. A customer photo may be missing from storage.`); }
  };
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <button type="button" onClick={run} className="btn btn-secondary !py-2 text-sm"><FileDown size={16} />Print-ready PDF</button>
      <span className="text-xs text-ink-3">{state ?? `${studio.faces.length} page${studio.faces.length > 1 ? "s" : ""} · ${studio.spec.wMM} × ${studio.spec.hMM} mm + ${studio.spec.bleedMM} mm bleed · 300 dpi`}</span>
    </div>
  );
}
