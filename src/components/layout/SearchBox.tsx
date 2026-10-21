"use client";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchBox() {
  const [q, setQ] = useState("");
  const router = useRouter();
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`); }}
      className="flex items-center gap-2 bg-surface-2 border border-line rounded-full px-4 h-10 focus-within:border-brand"
    >
      <Search size={16} className="text-ink-3" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search photobooks, frames, mugs, Diwali gifts…" className="bg-transparent flex-1 outline-none text-sm" />
    </form>
  );
}
