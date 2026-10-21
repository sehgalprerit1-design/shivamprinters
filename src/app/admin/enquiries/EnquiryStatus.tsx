"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
const FLOW = ["NEW", "QUOTED", "WON", "CLOSED"];
export function EnquiryStatus({ id, status }: { id: string; status: string }) {
  const [busy, setBusy] = useState(false); const r = useRouter();
  const set = async (s: string) => { setBusy(true); await fetch("/api/admin/enquiries", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status: s }) }); setBusy(false); r.refresh(); };
  return <select disabled={busy} value={status} onChange={(e) => set(e.target.value)} className="rounded-lg border border-line bg-surface px-2 py-1 text-xs">{FLOW.map((s) => <option key={s}>{s}</option>)}</select>;
}
