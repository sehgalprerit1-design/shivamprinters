import type { Metadata } from "next";
export const metadata: Metadata = { title: "Bulk & corporate orders" };
export default function Page() {
  return (
    <div className="container-x pt-10 max-w-3xl">
      <h1 className="text-4xl font-bold">Bulk & corporate orders</h1>
      <p className="text-ink-2 text-lg mt-4 leading-relaxed">Calendars, notebooks, mugs and desk mats for teams, events and clients. Volume pricing from 25 units; tell us quantity, product and date.</p>
      <p className="text-ink-3 text-sm mt-8">Full policy text to be supplied by the Zoomin team before launch.</p>
    </div>
  );
}
