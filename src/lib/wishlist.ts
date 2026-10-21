"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type W = { slugs: string[]; has: (s: string) => boolean; toggle: (s: string) => void };
export const useWishlist = create<W>()(
  persist(
    (set, get) => ({
      slugs: [],
      has: (s) => get().slugs.includes(s),
      toggle: (s) => set((st) => ({ slugs: st.slugs.includes(s) ? st.slugs.filter((x) => x !== s) : [...st.slugs, s] })),
    }),
    { name: "shivam-wishlist" },
  ),
);
