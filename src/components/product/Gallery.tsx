"use client";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react";

type Img = { src: string; label: string };

/** Product photos. Images are shown whole (never cropped) and open full-screen on click/tap,
 *  with arrows, swipe and keyboard navigation. */
export function Gallery({ images, alt }: { images: Img[]; alt: string }) {
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)} className="card block aspect-square relative overflow-hidden w-full max-w-full bg-white cursor-zoom-in group" aria-label="View larger image">
        {/* Positioned so the photo's own size can never widen the box (a wide photo inside an auto-sized button did). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[i].src} alt={alt} className="absolute inset-0 w-full h-full object-contain" fetchPriority="high" />
        <span className="chip bg-white/90 absolute bottom-3 left-3">{images[i].label}</span>
        <span className="absolute top-3 right-3 rounded-full bg-white/90 text-ink p-2 shadow-sm opacity-80 group-hover:opacity-100" aria-hidden><Maximize2 size={16} /></span>
      </button>
      {images.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto max-w-full">
          {images.map((im, k) => (
            <button key={k} type="button" onClick={() => setI(k)} aria-label={`Show ${im.label}`} className={`relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-white border-2 ${k === i ? "border-brand" : "border-line"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={im.src} alt="" className="absolute inset-0 w-full h-full object-contain" />
            </button>
          ))}
        </div>
      )}
      {open && <Lightbox images={images} index={i} alt={alt} onIndex={setI} onClose={() => setOpen(false)} />}
    </div>
  );
}

export function Lightbox({ images, index, alt, onIndex, onClose }: { images: Img[]; index: number; alt: string; onIndex: (i: number) => void; onClose: () => void }) {
  const n = images.length;
  const prev = useCallback(() => onIndex((index - 1 + n) % n), [index, n, onIndex]);
  const next = useCallback(() => onIndex((index + 1) % n), [index, n, onIndex]);
  const [touchX, setTouchX] = useState<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); else if (e.key === "ArrowLeft") prev(); else if (e.key === "ArrowRight") next(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; };
  }, [onClose, prev, next]);

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/95 text-white flex flex-col" role="dialog" aria-modal="true" aria-label={`${alt} photos`} onClick={onClose}>
      <div className="flex items-center justify-between p-3 md:p-4 text-sm" onClick={(e) => e.stopPropagation()}>
        <span className="text-white/80">{images[index].label}{n > 1 && <span className="text-white/50"> · {index + 1} / {n}</span>}</span>
        <button type="button" onClick={onClose} className="rounded-full bg-white/10 hover:bg-white/20 p-2" aria-label="Close"><X size={22} /></button>
      </div>
      <div
        className="flex-1 min-h-0 flex items-center justify-center px-2 md:px-16 pb-4 select-none"
        onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
        onTouchEnd={(e) => { if (touchX === null) return; const dx = e.changedTouches[0].clientX - touchX; if (Math.abs(dx) > 50) (dx < 0 ? next : prev)(); setTouchX(null); }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[index].src} alt={alt} className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} draggable={false} />
      </div>
      {n > 1 && (
        <>
          <button type="button" onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 hover:bg-white/25 p-2 md:p-3" aria-label="Previous image"><ChevronLeft size={26} /></button>
          <button type="button" onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 hover:bg-white/25 p-2 md:p-3" aria-label="Next image"><ChevronRight size={26} /></button>
          <div className="flex gap-2 justify-center p-3 overflow-x-auto" onClick={(e) => e.stopPropagation()}>
            {images.map((im, k) => (
              <button key={k} type="button" onClick={() => onIndex(k)} className={`w-14 h-14 shrink-0 rounded-md overflow-hidden bg-white border-2 ${k === index ? "border-brand" : "border-transparent opacity-70 hover:opacity-100"}`} aria-label={`Show ${im.label}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={im.src} alt="" className="w-full h-full object-contain" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>,
    document.body,
  );
}
