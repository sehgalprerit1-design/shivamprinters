import type { Metadata } from "next";
import { CallUs } from "@/components/ui/CallUs";
export const metadata: Metadata = { title: "Returns & refunds" };
export default function Page() {
  return (
    <div className="container-x pt-10 max-w-3xl">
      <h1 className="text-4xl font-bold">Returns & refunds</h1>
      <p className="text-ink-2 text-lg mt-4 leading-relaxed">Personalised items can't be returned, but any print defect or transit damage is reprinted or refunded. Send a photo within 7 days of delivery.</p>
      <div className="mt-6"><CallUs /></div>
      <p className="text-ink-3 text-sm mt-8">Full policy text to be supplied by the Shivam Printers team before launch.</p>
    </div>
  );
}
