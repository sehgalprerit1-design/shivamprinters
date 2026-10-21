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
      <div className="mt-10"><CustomPrintingSection full /></div>
    </div>
  );
}
