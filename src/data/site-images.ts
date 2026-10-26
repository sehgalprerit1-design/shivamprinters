// Site images that aren't part of the product catalogue: hero, seasonal panels, gift-page
// banners, the corporate page photo. Admin replaces them in /admin/images; the choices are
// saved to src/data/site-image-overrides.json and committed to GitHub like the catalogue overrides.
import overrides from "./site-image-overrides.json";

const OV: Record<string, string> = (() => { const o = overrides as Record<string, unknown>; const out: Record<string, string> = {}; for (const [k, v] of Object.entries(o)) if (typeof v === "string" && v.trim()) out[k] = v.trim(); return out; })();

/** Effective image for a slot: the admin's choice if there is one, else what the code ships with. */
export const siteImage = (key: string, fallback?: string): string | undefined => OV[key] ?? fallback;
export const siteImageOverrides = () => ({ ...OV });

export type ImageSlot = { key: string; label: string; group: string; usedOn: string; size: string; fallback?: string };

/** Fixed slots (gift pages and seasonal events are added at runtime from their data files). */
export const FIXED_SLOTS: ImageSlot[] = [
  { key: "home.hero", label: "Homepage hero", group: "Homepage", usedOn: "/", size: "1800×1000 or wider, landscape", fallback: "/images/hero.jpg" },
  { key: "home.kids-banner", label: "Kids range banner", group: "Homepage", usedOn: "/ (lower down)", size: "1400×1000, landscape", fallback: "/images/cat-kids.jpg" },
  { key: "corporate.hero", label: "Corporate gifting header photo", group: "Corporate gifting", usedOn: "/corporate-gifting", size: "1800×1000, landscape", fallback: "/images/corporate-diwali.jpg" },
];
