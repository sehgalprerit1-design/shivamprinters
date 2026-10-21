"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function Login() {
  const [pw, setPw] = useState(""); const [err, setErr] = useState(""); const r = useRouter();
  return (
    <form onSubmit={async (e) => { e.preventDefault(); const res = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: pw }) }); if (res.ok) r.refresh(); else setErr("Wrong password"); }} className="max-w-sm card p-6 space-y-3">
      <h1 className="text-2xl font-bold">Admin sign in</h1>
      <input type="password" className="input" placeholder="Admin password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
      {err && <div className="text-brand text-sm">{err}</div>}
      <button className="btn btn-primary w-full">Sign in</button>
      <p className="text-xs text-ink-3">Set <code>ADMIN_PASSWORD</code> in the environment to enable this.</p>
    </form>
  );
}
