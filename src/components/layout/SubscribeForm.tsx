"use client";
import { useState } from "react";

export function SubscribeForm() {
  const [contact, setContact] = useState("");
  const [state, setState] = useState<{ kind: "idle" | "busy" | "done" | "error"; msg?: string }>({ kind: "idle" });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state.kind === "busy") return;
    setState({ kind: "busy" });
    try {
      const res = await fetch("/api/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ contact, website: "" }) });
      const j = await res.json();
      if (!res.ok) { setState({ kind: "error", msg: j.error ?? "Please try again" }); return; }
      setState({ kind: "done", msg: j.channel === "whatsapp" ? "You're in — offers will come on WhatsApp." : "You're in — offers will come by email." });
    } catch { setState({ kind: "error", msg: "Please try again" }); }
  }
  if (state.kind === "done") return <p className="text-accent text-sm mt-4">{state.msg}</p>;
  return (
    <form onSubmit={submit} className="mt-4">
      <label htmlFor="subscribe-contact" className="block text-xs font-semibold text-ink-2 mb-1.5">Get offers on WhatsApp or email</label>
      <div className="flex gap-2">
        <input id="subscribe-contact" className="input !py-2 text-sm min-w-0" placeholder="Email or 10-digit mobile" value={contact} onChange={(e) => setContact(e.target.value)} required />
        <button className="btn btn-primary !py-2 !px-3 text-sm shrink-0" disabled={state.kind === "busy"}>{state.kind === "busy" ? "…" : "Join"}</button>
      </div>
      {state.kind === "error" && <p className="text-brand text-xs mt-1.5">{state.msg}</p>}
      <p className="text-ink-3 text-[11px] mt-1.5">Occasional offers only. Unsubscribe any time.</p>
    </form>
  );
}
