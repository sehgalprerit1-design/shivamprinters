import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Building2, FileText, Truck, Stamp, Clock } from "lucide-react";
import { getProduct, type Product } from "@/data/catalog";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Section } from "@/components/ui/Section";
import { EnquiryForm } from "@/components/business/EnquiryForm";
import { CallUs, whatsappUrl, WhatsAppIcon } from "@/components/ui/CallUs";
import { BIZ } from "@/data/legal";
import { siteImage } from "@/data/site-images";
import { inr } from "@/lib/format";

export const metadata: Metadata = {
  title: "Corporate Diwali Gifts in Delhi — Branded Diaries, Gift Sets & Calendars",
  description:
    "Diwali gifts for employees and clients, printed with your logo in our Kalkaji, New Delhi unit. Branded diaries, executive gift sets, 2027 calendars and mugs. Volume pricing, free proof in one working day, GST invoice, delivery to one or many addresses.",
  alternates: { canonical: "/corporate-gifting" },
};

const PICKS = [
  "custom-corporate-printing",
  "combo-gift-set",
  "executive-leather-diary",
  "daily-planner",
  "desktop-calendar-6x8",
  "mini-desktop-calendar",
  "coffee-mug-white",
  "desk-mat",
  "tote-bag",
  "a5-notebook",
  "money-envelopes",
  "gift-tags",
];

// Volume tiers already offered in the catalogue (see src/data/catalog.ts).
const TIERS = [
  { what: "Logo-embossed diaries", rows: [["50 units", 549], ["100 units", 449], ["250+ units, foiled", 379]] as [string, number][], href: "/p/custom-corporate-printing" },
  { what: "Gift set team pack (diary + pen + keychain)", rows: [["10 sets", 12999]] as [string, number][], note: "₹1,300 a set, vs ₹1,499 single", href: "/p/combo-gift-set" },
];

const WHY = [
  [Building2, "Printed in our own unit", "Kalkaji, New Delhi. No middlemen, so we can turn bulk jobs round quickly and you can visit to see samples."],
  [Stamp, "Your logo, done properly", "Embossing, foiling or full-colour print. You approve a free digital proof before anything is printed."],
  [FileText, "GST invoice", "Proper tax invoice for every order so your company can claim input credit."],
  [Truck, "One address or fifty", "We deliver in bulk to your office or ship gift-wrapped to each employee or client across India."],
] as const;

export default function CorporateGifting() {
  const picks = PICKS.map(getProduct).filter(Boolean) as Product[];
  return (
    <div>
      <section className="container-x pt-8 md:pt-12">
        <div className="relative rounded-3xl overflow-hidden bg-ink text-white p-6 md:p-10 grid lg:grid-cols-[1.15fr_1fr] gap-8 items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={siteImage("corporate.hero", "/images/corporate-diwali.jpg")} alt="" className="absolute inset-0 w-full h-full object-cover" fetchPriority="high" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/20" />
          <div className="relative">
            <div className="chip bg-white/10 text-white mb-3">Diwali corporate gifting</div>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">Diwali gifts your team will actually use</h1>
            <p className="text-white/80 mt-4 text-lg leading-relaxed">
              Branded diaries, executive gift sets, 2027 desk calendars and mugs, printed with your logo in our Delhi unit.
              Tell us how many people and your budget per gift; we&apos;ll send options and a quote within one working day.
            </p>
            <ul className="mt-6 grid sm:grid-cols-2 gap-3 text-sm">
              {["Volume pricing from 25 units", "Free proof before printing", "GST invoice", "Delivery across India"].map((t) => (
                <li key={t} className="flex items-center gap-2"><BadgeCheck size={16} className="text-[#7dd3c0]" />{t}</li>
              ))}
            </ul>
            <div className="mt-6 rounded-2xl bg-white/10 backdrop-blur-sm p-4 flex gap-3 text-sm">
              <Clock size={18} className="shrink-0 mt-0.5" />
              <p><b>Diwali is on 8 November.</b> Bulk orders need time for proofing and printing, so send your enquiry as early as you can. We confirm the delivery date before you pay.</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <a href={whatsappUrl("Hi Shivam Printers, I'm looking for Diwali corporate gifts. Quantity: __, budget per gift: ₹__")} target="_blank" rel="noopener noreferrer" className="btn bg-[#25D366] text-white hover:bg-[#1ebe5b] inline-flex items-center gap-2"><WhatsAppIcon size={16} />WhatsApp for a quote</a>
              <a href="tel:+919910888217" className="btn bg-white text-ink hover:bg-white/90">Call 9910888217</a>
            </div>
          </div>
          <div id="quote" className="relative text-ink scroll-mt-28"><EnquiryForm defaultKind="Corporate gifts" compact /></div>
        </div>
      </section>

      <Section title="Popular corporate Diwali gifts" subtitle="Every item can carry your logo or each person's name. Prices shown are for single units; bulk prices are lower.">
        <ProductGrid products={picks} />
      </Section>

      <section className="container-x pb-4">
        <h2 className="text-2xl md:text-3xl font-bold">Volume pricing</h2>
        <p className="text-ink-2 mt-1">Per-unit prices including your logo. For other products or larger quantities, ask for a quote.</p>
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          {TIERS.map((t) => (
            <Link key={t.what} href={t.href} className="card p-5 hover:border-brand">
              <div className="font-bold">{t.what}</div>
              <table className="w-full text-sm mt-3">
                <tbody>{t.rows.map(([q, p]) => <tr key={q} className="border-t border-line"><td className="py-2 text-ink-2">{q}</td><td className="py-2 text-right font-semibold">{inr(p)}{q.includes("set") ? "" : " each"}</td></tr>)}</tbody>
              </table>
              {t.note && <div className="text-xs text-ink-3 mt-2">{t.note}</div>}
            </Link>
          ))}
        </div>
      </section>

      <Section title="Why companies order from us">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {WHY.map(([Icon, t, d]) => (
            <div key={t} className="card p-5">
              <div className="w-10 h-10 rounded-full bg-brand-soft text-brand flex items-center justify-center"><Icon size={18} /></div>
              <div className="font-bold mt-3">{t}</div>
              <p className="text-sm text-ink-2 mt-1">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <section className="container-x pb-14">
        <div className="card p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Ready to sort this year&apos;s Diwali gifts?</h2>
            <p className="text-ink-2 mt-1">{BIZ.legalName}, {BIZ.address}, {BIZ.city} · GSTIN {BIZ.gstin}</p>
            <div className="mt-2"><CallUs whatsapp="Hi Shivam Printers, I'm looking for Diwali corporate gifts." /></div>
          </div>
          <a href="#quote" className="btn btn-primary whitespace-nowrap">Get a quote</a>
        </div>
      </section>
    </div>
  );
}
