import Link from "next/link";
import type { Metadata } from "next";
import { CallUs } from "@/components/ui/CallUs";
import { CustomPrintingSection } from "@/components/business/CustomPrintingSection";
export const metadata: Metadata = { title: "Bulk & corporate orders" };
export default function Page() {
  return (
    <div className="container-x pt-10">
      <h1 className="text-4xl font-bold">Bulk & corporate orders</h1>
      <p className="text-ink-2 text-lg mt-4 leading-relaxed">Calendars, notebooks, mugs and desk mats for teams, events and clients. Volume pricing from 25 units; tell us quantity, product and date.</p>
      <div className="mt-6"><CallUs /></div>
      <Link href="/corporate-gifting" className="mt-6 flex items-center justify-between gap-4 rounded-2xl bg-brand-soft p-5 hover:ring-2 hover:ring-brand/30"><div><div className="font-bold text-brand-ink">Diwali gifting for your team or clients?</div><div className="text-sm text-ink-2">Branded diaries, gift sets, calendars and mugs, with volume prices and a GST invoice.</div></div><span className="text-brand font-semibold whitespace-nowrap">See gift ideas →</span></Link>
      <div className="mt-10"><CustomPrintingSection full /></div>
    </div>
  );
}
