"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type R = { slugs: string[]; push: (s: string) => void };
export const useRecent = create<R>()(
  persist(
    (set) => ({ slugs: [], push: (s) => set((st) => ({ slugs: [s, ...st.slugs.filter((x) => x !== s)].slice(0, 8) })) }),
    { name: "shivam-recent" },
  ),
);
