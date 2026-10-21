"use client";
export function SignOut() { return <button onClick={async () => { await fetch("/api/admin/login", { method: "DELETE" }); location.reload(); }} className="btn btn-ghost text-sm">Sign out</button>; }
