import Link from "next/link";
import { Check, FileCheck2, Languages, Zap, PackageCheck } from "lucide-react";
import { WEDDING_CHECKLIST, weddingAlso } from "@/data/nav";
import { getProduct } from "@/data/catalog";
import { ProductGrid } from "@/components/product/ProductGrid";
import { whatsappUrl, WhatsAppIcon, SUPPORT_PHONE } from "@/components/ui/CallUs";

const PROMISES = [
  [Zap, "Same day in Delhi NCR", "Order before 2 pm on WhatsApp or phone for last-minute inserts, menus and boards."],
  [PackageCheck, "From 10 cards", "Small guest list for the Mehndi or cocktail? Order only what that function needs."],
  [Languages, "Any language", "English, Hindi, Punjabi or Urdu, or two together. Send the wording; we set it."],
  [FileCheck2, "Proof before print", "You approve a digital proof on WhatsApp before anything goes to press."],
] as const;

/** Lower half of /c/wedding: the full print checklist, products from other ranges, and the quote panel. */
export function WeddingExtras() {
  const also = weddingAlso();
  return (
    <>
      <section className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        {PROMISES.map(([Icon, t, d]) => (
          <div key={t} className="card p-4 md:p-5">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-700 grid place-items-center"><Icon size={18} /></div>
            <div className="font-bold mt-3">{t}</div>
            <div className="text-ink-2 text-sm mt-1">{d}</div>
          </div>
        ))}
      </section>

      <section className="mt-14" id="checklist">
        <h2 className="text-2xl md:text-3xl font-bold">Everything we print for a wedding</h2>
        <p className="text-ink-2 mt-2 max-w-2xl">One design carried across every piece, printed in our own unit. Tap an item to see sizes and prices; items marked &ldquo;quote&rdquo; are made to order.</p>
        <div className="grid md:grid-cols-3 gap-4 md:gap-5 mt-6">
          {WEDDING_CHECKLIST.map((g) => (
            <div key={g.stage} className="card p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-rose-700">{g.stage}</div>
              <ul className="mt-3 space-y-2 text-sm">
                {g.items.map((it) => {
                  const live = it.slug ? getProduct(it.slug) : undefined;
                  return (
                    <li key={it.label} className="flex gap-2">
                      <Check size={16} className="text-rose-600 shrink-0 mt-0.5" />
                      {live
                        ? <Link href={`/p/${live.slug}`} className="text-ink-2 hover:text-brand hover:underline">{it.label}</Link>
                        : <span className="text-ink-2">{it.label} <Link href="/custom-printing" className="chip bg-rose-50 text-rose-700 ml-1 hover:underline">quote</Link></span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {also.length > 0 && (
        <section className="mt-14">
          <h2 className="text-2xl md:text-3xl font-bold">More for the wedding</h2>
          <p className="text-ink-2 mt-2 max-w-2xl">Flex backdrops and standees, carry bags, favour labels, and albums and wall prints for after the big day.</p>
          <div className="mt-6"><ProductGrid products={also} /></div>
        </section>
      )}

      <section className="mt-14 rounded-3xl bg-rose-900 text-white p-6 md:p-10 grid md:grid-cols-[1.4fr_1fr] gap-6 items-center">
        <div>
          <div className="chip bg-white/10 text-white mb-3">Made to order</div>
          <h2 className="text-2xl md:text-3xl font-bold leading-tight">Boxed, laser-cut, acrylic or scroll invitations?</h2>
          <p className="text-white/80 mt-3 leading-relaxed">Designer invitations, padded and hardcover cards, mithai-box sleeves, luggage tags, door hangers and complete hotel welcome kits are quoted per job. Send us a reference photo and your quantity; we reply with a price within a working day.</p>
        </div>
        <div className="flex flex-wrap md:flex-col gap-3 md:items-stretch text-sm">
          <a href={whatsappUrl("Hi Shivam Printers, I'd like a quote for wedding printing.")} target="_blank" rel="noopener noreferrer" className="btn bg-[#25D366] text-white hover:bg-[#1ebe5b]"><WhatsAppIcon size={16} className="mr-2" />WhatsApp for a quote</a>
          <a href={`tel:+91${SUPPORT_PHONE}`} className="btn bg-white text-ink hover:bg-white/90">Call {SUPPORT_PHONE}</a>
          <Link href="/custom-printing" className="btn bg-white/10 text-white hover:bg-white/20">Send an enquiry →</Link>
        </div>
      </section>
    </>
  );
}
