"use client";
import { useEffect, useState } from "react";
import { Star, BadgeCheck, ThumbsUp, Camera } from "lucide-react";
import type { Review } from "@/data/reviews";

function Stars({ n, size = 14 }: { n: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${n} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={size} className={i <= Math.round(n) ? "fill-gold text-gold" : "text-line"} />)}
    </span>
  );
}

export function Reviews({ reviews: sample, avg: sampleAvg, counts: sampleCounts, productSlug }: { reviews: Review[]; avg: number; counts: number[]; productSlug: string }) {
  // Real, approved customer reviews are fetched client-side and shown above the sample ones.
  const [live, setLive] = useState<(Review & { live?: boolean })[]>([]);
  useEffect(() => { fetch(`/api/reviews?product=${encodeURIComponent(productSlug)}`, { cache: "no-store" }).then((r) => r.json()).then((j) => setLive((j.reviews ?? []).map((r: Review) => ({ ...r, live: true })))).catch(() => {}); }, [productSlug]);
  const reviews: (Review & { live?: boolean })[] = live.length ? [...live, ...sample] : sample;
  // Summary (average + star bars) recomputed so real reviews count.
  const total = reviews.length;
  const counts = live.length ? [0, 1, 2, 3, 4, 5].map((s) => reviews.filter((r) => r.rating === s).length) : sampleCounts;
  const avg = live.length ? Math.round((reviews.reduce((a, r) => a + r.rating, 0) / Math.max(1, total)) * 10) / 10 : sampleAvg;
  const [form, setForm] = useState({ rating: "", title: "", body: "", author: "", city: "", website: "" });
  const [formState, setFormState] = useState<"idle" | "sending" | "done" | "error">("idle"); const [formErr, setFormErr] = useState("");
  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault(); setFormState("sending"); setFormErr("");
    const r = await fetch("/api/reviews", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...form, rating: Number(form.rating), productSlug }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setFormErr(j.error ?? "Could not send your review"); setFormState("error"); return; }
    setFormState("done");
  };
  const [filter, setFilter] = useState<number | "photo" | null>(null);
  const [sort, setSort] = useState<"helpful" | "recent" | "high" | "low">("helpful");
  const [shown, setShown] = useState(6);
  const [helped, setHelped] = useState<Set<string>>(new Set());
  const [writing, setWriting] = useState(false);
  let list = reviews.filter((r) => (filter === "photo" ? r.photo : filter ? r.rating === filter : true));
  // Real customer reviews always come first; the chosen sort applies within each group.
  list = [...list].sort((a, b) => (Number(!!b.live) - Number(!!a.live)) || (sort === "recent" ? (a.date < b.date ? 1 : -1) : sort === "high" ? b.rating - a.rating : sort === "low" ? a.rating - b.rating : b.helpful - a.helpful));

  return (
    <section id="reviews" className="mt-16 scroll-mt-32">
      <h2 className="text-2xl md:text-3xl font-bold mb-6">Customer reviews</h2>
      <div className="grid md:grid-cols-[280px_1fr] gap-8">
        <aside className="card p-5 h-fit md:sticky md:top-32">
          <div className="flex items-end gap-3"><span className="display text-5xl font-bold">{avg}</span><div><Stars n={avg} size={16} /><div className="text-xs text-ink-3 mt-1">{total} reviews</div></div></div>
          <div className="mt-4 space-y-1.5">
            {[5, 4, 3, 2, 1].map((s) => {
              const c = counts[s] ?? 0; const pct = total ? Math.round((c / total) * 100) : 0;
              return (
                <button key={s} onClick={() => setFilter(filter === s ? null : s)} className={`w-full flex items-center gap-2 text-xs ${filter === s ? "font-bold" : ""}`}>
                  <span className="w-8 text-left">{s} ★</span>
                  <span className="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden"><span className="block h-full bg-gold" style={{ width: `${pct}%` }} /></span>
                  <span className="w-8 text-right text-ink-3">{c}</span>
                </button>
              );
            })}
          </div>
          <button onClick={() => setFilter(filter === "photo" ? null : "photo")} className={`mt-4 chip w-full justify-center ${filter === "photo" ? "bg-ink text-white" : "bg-surface-2"}`}><Camera size={12} className="mr-1" /> With photos ({reviews.filter((r) => r.photo).length})</button>
          <button onClick={() => setWriting(!writing)} className="btn btn-ghost w-full mt-3 text-sm">Write a review</button>
          {writing && formState === "done" && <div className="mt-3 text-sm bg-accent-soft text-accent rounded-xl p-3">Thanks, {form.author.split(" ")[0]}! Your review will appear once we&apos;ve checked it (usually within a day).</div>}
          {writing && formState !== "done" && (
            <form onSubmit={submitReview} className="mt-3 space-y-2 text-sm">
              <select className="input" required value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })}><option value="" disabled>Your rating</option>{[5, 4, 3, 2, 1].map((s) => <option key={s} value={s}>{s} stars</option>)}</select>
              <input className="input" placeholder="Title" required maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <textarea className="input" rows={3} placeholder="What did you think? (10+ characters)" required minLength={10} maxLength={2000} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
              <input className="input" placeholder="Your name" required maxLength={60} value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
              <input className="input" placeholder="City (optional)" maxLength={60} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <input className="hidden" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} aria-hidden />
              {formErr && <div className="text-brand text-xs">{formErr}</div>}
              <button disabled={formState === "sending"} className="btn btn-primary w-full !py-2">{formState === "sending" ? "Sending…" : "Submit review"}</button>
            </form>
          )}
        </aside>
        <div>
          <div className="flex items-center justify-between text-sm mb-4">
            <span className="text-ink-3">{list.length} of {total}{filter ? " (filtered)" : ""}</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="input !w-auto !py-1.5 text-sm">
              <option value="helpful">Most helpful</option><option value="recent">Most recent</option><option value="high">Highest rated</option><option value="low">Lowest rated</option>
            </select>
          </div>
          <ul className="divide-y divide-line">
            {list.slice(0, shown).map((r) => (
              <li key={r.id} className="py-5">
                <div className="flex items-center gap-2 flex-wrap"><Stars n={r.rating} /><span className="font-semibold">{r.title}</span></div>
                <p className="text-ink-2 mt-2 leading-relaxed">{r.body}</p>
                {r.photo && <div className="mt-3 w-16 h-16 rounded-lg bg-surface-2 border border-line grid place-items-center text-ink-3"><Camera size={18} /></div>}
                <div className="flex items-center gap-3 flex-wrap text-xs text-ink-3 mt-3">
                  <span className="font-medium text-ink-2">{r.author}</span><span>{r.city}</span>
                  {r.live ? <span className="inline-flex items-center gap-1 text-accent"><BadgeCheck size={12} />Customer review</span> : r.verified && <span className="inline-flex items-center gap-1 text-accent"><BadgeCheck size={12} />Verified purchase</span>}
                  {r.variant && <span>· {r.variant}</span>}
                  <span>· {new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  <button onClick={() => setHelped(new Set(helped).add(r.id))} className={`ml-auto inline-flex items-center gap-1 ${helped.has(r.id) ? "text-accent" : "hover:text-ink"}`}><ThumbsUp size={12} />Helpful ({r.helpful + (helped.has(r.id) ? 1 : 0)})</button>
                </div>
              </li>
            ))}
          </ul>
          {shown < list.length && <button onClick={() => setShown(shown + 6)} className="btn btn-ghost mt-4">Show more reviews</button>}
        </div>
      </div>
    </section>
  );
}
