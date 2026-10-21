"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function ReviewActions({ id, approved }: { id: string; approved: boolean }) {
  const [busy, setBusy] = useState(false); const r = useRouter();
  const act = async (action: string) => { setBusy(true); await fetch("/api/admin/reviews", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, action }) }); setBusy(false); r.refresh(); };
  return (
    <div className="flex gap-2">
      {approved ? <button disabled={busy} onClick={() => act("unapprove")} className="btn btn-ghost !py-1.5 text-xs">Hide</button> : <button disabled={busy} onClick={() => act("approve")} className="btn btn-secondary !py-1.5 text-xs">Approve & show</button>}
      <button disabled={busy} onClick={() => act("delete")} className="btn btn-ghost !py-1.5 text-xs text-brand">Delete</button>
    </div>
  );
}
