import { create } from "zustand";

/** Lets a product's option picker (e.g. the visiting-card type tiles) swap the big gallery photo on the product page. */
export const useGalleryOverride = create<{ image: { src: string; fallback?: string; label: string } | null; set: (image: { src: string; fallback?: string; label: string } | null) => void }>((set) => ({
  image: null,
  set: (image) => set({ image }),
}));
