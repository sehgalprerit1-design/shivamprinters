"use client";
import { useState } from "react";
import { CallUs } from "@/components/ui/CallUs";
export default function Account() {
  const [sent, setSent] = useState(false); const [v, setV] = useState("");
  return (
    <div className="container-x pt-10 max-w-md">
      <h1 className="text-3xl font-bold">Sign in</h1>
      <p className="text-ink-2 mt-2">Enter your mobile number or email and we&apos;ll send a one-time code. No passwords.</p>
      <div className="mt-2"><CallUs /></div>
      {!sent ? (
        <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="mt-6 space-y-3">
          <input className="input" placeholder="Mobile number or email" value={v} onChange={(e) => setV(e.target.value)} required />
          <button className="btn btn-primary w-full">Send code</button>
        </form>
      ) : (
        <form onSubmit={(e) => e.preventDefault()} className="mt-6 space-y-3">
          <div className="text-sm text-ink-2">Code sent to {v}. (OTP delivery via MSG91/Twilio is wired in production.)</div>
          <input className="input tracking-[.5em] text-center" placeholder="••••••" maxLength={6} />
          <button className="btn btn-primary w-full">Verify</button>
        </form>
      )}
    </div>
  );
}
