"use client";
import { useState } from "react";

export function Gallery({ images, alt }: { images: { src: string; label: string }[]; alt: string }) {
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  return (
    <div>
      <div className="card aspect-square relative overflow-hidden cursor-zoom-in" onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }); }} onMouseLeave={() => setZoom(null)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[i].src} alt={alt} className="w-full h-full object-cover transition-transform duration-150" style={zoom ? { transform: "scale(1.8)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined} fetchPriority="high" />
        <span className="chip bg-white/90 absolute bottom-3 left-3">{images[i].label}</span>
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 mt-3">
          {images.map((im, k) => (
            <button key={k} onClick={() => setI(k)} className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${k === i ? "border-brand" : "border-transparent"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={im.src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
