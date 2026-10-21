import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CustomPrintingSection } from "@/components/business/CustomPrintingSection";
import { ProductGrid } from "@/components/product/ProductGrid";
import { productsInCategory } from "@/data/catalog";
import { CallUs } from "@/components/ui/CallUs";

export const metadata: Metadata = { title: "Custom Printing — Get a Quote", description: "Letterheads, envelopes, bill books, menus, packaging, wedding cards, labels, posters and bulk print jobs from our own print unit. Quote within one working day. Call 9910888217.", alternates: { canonical: "/custom-printing" } };

const JOBS = ["Letterheads & envelopes", "Bill books & invoices", "Visiting cards (bulk)", "Wedding & event cards", "Menus & table cards", "Product labels & tags", "Boxes & packaging", "Posters & hoardings", "Certificates & ID cards", "Calendars for your company", "Diaries & notebooks with logo", "Catalogues & booklets"];

export default function Page() {
  const related = productsInCategory("business-printing");
  return (
    <div className="container-x">
      <Breadcrumbs items={[{ href: "/c/business-printing", label: "Business Printing" }, { label: "Custom Printing" }]} />
      <h1 className="text-3xl md:text-5xl font-bold">Custom printing, quoted in a day</h1>
      <p className="text-ink-2 mt-3 max-w-2xl text-lg">If it can be printed, we print it — offset and digital, any size, any quantity from 50 to 50,000. Send us the job and get a price and a free proof within one working day.</p>
      <div className="mt-4"><CallUs whatsapp="Hi Shivam Printers, I need a quote for custom printing." /></div>
      <div className="mt-8 flex flex-wrap gap-2">{JOBS.map((j) => <span key={j} className="chip bg-surface-2 text-ink-2">{j}</span>)}</div>
      <div className="mt-10"><CustomPrintingSection full /></div>
      <div className="mt-16">
        <div className="flex items-end justify-between mb-5"><h2 className="text-2xl font-bold">Order online instead</h2></div>
        <p className="text-ink-2 text-sm mb-5">Standard sizes and quantities can be ordered straight from the site with instant pricing.</p>
        <ProductGrid products={related} />
      </div>
    </div>
  );
}
