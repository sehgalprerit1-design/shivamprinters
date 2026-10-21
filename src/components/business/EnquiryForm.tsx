"use client";
import { useState } from "react";
import { CheckCircle2, Paperclip, AlertTriangle } from "lucide-react";
import { CallUs } from "@/components/ui/CallUs";

const KINDS = ["Business cards", "Stickers & labels", "Brochures & flyers", "Postcards & invites", "Banners & standees", "Letterheads & envelopes", "Packaging & boxes", "Diaries & notebooks", "Something else"];

export function EnquiryForm({ defaultKind, compact = false }: { defaultKind?: string; compact?: boolean }) {
  const [f, setF] = useState({ name: "", phone: "", email: "", company: "", kind: defaultKind ?? KINDS[0], quantity: "", deadline: "", message: "", website: "" });
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setState("sending"); setErr("");
    try {
      let artworkKey: string | undefined;
      if (file) {
        const r = await fetch("/api/upload", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ filename: file.name, mime: file.type || "application/octet-stream", bytes: file.size }) });
        const j = await r.json(); if (!r.ok) throw new Error(j.error ?? "Upload failed");
        if (j.url) { const put = await fetch(j.url, { method: "PUT", body: file, headers: { "content-type": file.type || "application/octet-stream" } }); if (!put.ok) throw new Error("Artwork upload failed — you can WhatsApp it to us instead."); artworkKey = j.key; }
      }
      const r = await fetch("/api/enquiry", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...f, artworkKey }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error ?? "Something went wrong");
      setState("done");
    } catch (e) { setErr((e as Error).message); setState("error"); }
  }

  if (state === "done") return (
    <div className="card p-6 text-center">
      <CheckCircle2 size={36} className="mx-auto text-accent" />
      <h3 className="text-xl font-bold mt-3">Got it, {f.name.split(" ")[0]}!</h3>
      <p className="text-ink-2 mt-2">We&apos;ll call or WhatsApp you on {f.phone} within one working day with a quote{f.email ? ` and send a copy to ${f.email}` : ""}.</p>
      <div className="mt-4 flex justify-center"><CallUs whatsapp={`Hi Shivam Printers, I just sent an enquiry for ${f.kind}.`} /></div>
    </div>
  );

  const inp = "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30";
  return (
    <form onSubmit={submit} className={`card p-5 md:p-6 grid gap-3 ${compact ? "" : "md:grid-cols-2"}`}>
      <input className={inp} placeholder="Your name *" required value={f.name} onChange={set("name")} />
      <input className={inp} placeholder="10-digit mobile *" required inputMode="numeric" pattern="[6-9][0-9]{9}" value={f.phone} onChange={set("phone")} />
      <input className={inp} type="email" placeholder="Email (for the written quote)" value={f.email} onChange={set("email")} />
      <input className={inp} placeholder="Company / shop (optional)" value={f.company} onChange={set("company")} />
      <select className={inp} value={f.kind} onChange={set("kind")}>{KINDS.map((k) => <option key={k}>{k}</option>)}</select>
      <input className={inp} placeholder="Quantity (e.g. 500)" value={f.quantity} onChange={set("quantity")} />
      <input className={inp} placeholder="Needed by (date)" value={f.deadline} onChange={set("deadline")} />
      <label className={`${inp} flex items-center gap-2 cursor-pointer text-ink-2`}><Paperclip size={14} className="shrink-0" /><span className="truncate">{file ? file.name : "Attach artwork / logo (JPG, PNG, PDF)"}</span><input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
      <textarea className={`${inp} md:col-span-2`} rows={4} required placeholder="Tell us what you need: size, paper, finish, single/double side, delivery city… *" value={f.message} onChange={set("message")} />
      <input className="hidden" tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} aria-hidden />
      {err && <div className="md:col-span-2 flex items-start gap-2 text-sm bg-brand-soft border border-brand/30 text-brand-ink rounded-xl p-3"><AlertTriangle size={16} className="mt-0.5 shrink-0" />{err}</div>}
      <div className="md:col-span-2 flex flex-wrap items-center gap-4">
        <button disabled={state === "sending"} className="btn btn-primary !py-3 px-8">{state === "sending" ? "Sending…" : "Get a quote"}</button>
        <CallUs whatsapp="Hi Shivam Printers, I need a quote for custom printing." />
      </div>
      <p className="md:col-span-2 text-xs text-ink-3">We reply within one working day. No spam, no sharing your number.</p>
    </form>
  );
}
