import type { Metadata } from "next";
import { CallUs } from "@/components/ui/CallUs";
export const metadata: Metadata = { title: "Refer a friend" };
export default function Page() {
  return (
    <div className="container-x pt-10 max-w-3xl">
      <h1 className="text-4xl font-bold">Refer a friend</h1>
      <p className="text-ink-2 text-lg mt-4 leading-relaxed">Know someone who&apos;d love a photobook or a mug with their face on it? Send them our way — their first order gets <b>10% off</b> (up to ₹300) with the code below.</p>
      <div className="card inline-flex items-center gap-4 p-4 mt-6"><span className="text-ink-3 text-sm">Their code</span><span className="font-mono text-2xl font-bold tracking-wider">WELCOME10</span></div>
      <p className="text-ink-2 text-sm mt-4">They enter it in the cart before checkout. One use per customer, can&apos;t be combined with other codes.</p>
      <a href={`https://wa.me/?text=${encodeURIComponent("Check out Shivam Printers for photobooks, frames, mugs and personalised gifts — use code WELCOME10 for 10% off your first order: https://shivamprinters.vercel.app")}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-6">Share on WhatsApp</a>
      <div className="mt-6"><CallUs /></div>
    </div>
  );
}
