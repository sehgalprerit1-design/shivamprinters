import type { Metadata } from "next";
import { CallUs } from "@/components/ui/CallUs";
import { findCoupon, couponProblem, describeCoupon, toPublic } from "@/lib/coupons";
export const metadata: Metadata = { title: "Refer a friend" };
export const revalidate = 600;

export default async function Page() {
  const c = await findCoupon("WELCOME10").catch(() => null); // never let a DB blip fail the page (or the build)
  const live = c && !couponProblem(c, Number.MAX_SAFE_INTEGER) ? toPublic(c) : null;
  const share = live ? `Check out Shivam Printers for photobooks, frames, mugs and personalised gifts — use code ${live.code} for ${describeCoupon(live)} on your first order: https://shivamprinters.vercel.app` : "Check out Shivam Printers for photobooks, frames, mugs and personalised gifts: https://shivamprinters.vercel.app";
  return (
    <div className="container-x pt-10 max-w-3xl">
      <h1 className="text-4xl font-bold">Refer a friend</h1>
      {live ? (
        <>
          <p className="text-ink-2 text-lg mt-4 leading-relaxed">Know someone who&apos;d love a photobook or a mug with their face on it? Send them our way — their first order gets <b>{describeCoupon(live)}</b> with the code below.</p>
          <div className="card inline-flex items-center gap-4 p-4 mt-6"><span className="text-ink-3 text-sm">Their code</span><span className="font-mono text-2xl font-bold tracking-wider">{live.code}</span></div>
          <p className="text-ink-2 text-sm mt-4">They enter it in the cart before checkout.{live.minOrder ? ` Minimum order ₹${live.minOrder.toLocaleString("en-IN")}.` : ""} Can&apos;t be combined with other codes.</p>
        </>
      ) : (
        <p className="text-ink-2 text-lg mt-4 leading-relaxed">Know someone who&apos;d love a photobook or a mug with their face on it? Share the site with them — and keep an eye on the top bar for the current offer.</p>
      )}
      <a href={`https://wa.me/?text=${encodeURIComponent(share)}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-6">Share on WhatsApp</a>
      <div className="mt-6"><CallUs /></div>
    </div>
  );
}
