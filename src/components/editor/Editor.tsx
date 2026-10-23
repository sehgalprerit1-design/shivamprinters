"use client";
/**
 * Personalisation editor entry point. The design studio (Fabric.js) is loaded
 * on the client only; see ./studio/Studio.tsx.
 */
import dynamic from "next/dynamic";

export const Editor = dynamic(() => import("./studio/Studio").then((m) => m.Studio), {
  ssr: false,
  loading: () => <div className="h-[60vh] rounded-2xl border border-line bg-surface-2 grid place-items-center text-sm text-ink-2">Opening the design studio…</div>,
});
