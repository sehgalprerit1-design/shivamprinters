import Link from "next/link";
import { Printer, Clock, FileCheck2, Truck } from "lucide-react";
import { EnquiryForm } from "./EnquiryForm";

const STEPS = [["Tell us the job", "Product, size, quantity, finish and when you need it. Attach artwork if you have it.", FileCheck2], ["Quote in a day", "We call or WhatsApp you with a price and a free digital proof.", Clock], ["Approve & print", "Say yes to the proof and we print in our own unit — no middlemen.", Printer], ["Delivered", "Shipped across India, or pick up from the shop.", Truck]] as const;

export function CustomPrintingSection({ full = false }: { full?: boolean }) {
  return (
    <section id="custom-printing" className={`${full ? "" : "mt-16"} scroll-mt-28`}>
      <div className="rounded-3xl bg-ink text-white p-6 md:p-10 grid lg:grid-cols-[1.1fr_1fr] gap-8 items-start">
        <div>
          <div className="chip bg-white/10 text-white mb-3">Custom Printing</div>
          <h2 className="text-3xl md:text-4xl font-bold leading-tight">Need something that isn&apos;t on the shelf?</h2>
          <p className="text-white/80 mt-3 leading-relaxed">Letterheads, envelopes, bill books, menus, packaging, wedding cards, tags, labels, posters, or 5,000 of anything above — we print it in our own unit. Tell us what you need and we&apos;ll quote within a working day.</p>
          <ul className="mt-6 grid sm:grid-cols-2 gap-4">
            {STEPS.map(([t, d, Icon], i) => <li key={t} className="flex gap-3"><div className="shrink-0 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"><Icon size={16} /></div><div><div className="font-semibold">{i + 1}. {t}</div><div className="text-white/70 text-sm">{d}</div></div></li>)}
          </ul>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <a href="tel:+919910888217" className="btn bg-white text-ink hover:bg-white/90">Call 9910888217</a>
            <a href="https://wa.me/919910888217?text=Hi%20Shivam%20Printers%2C%20I%20need%20a%20quote%20for%20custom%20printing." target="_blank" rel="noopener noreferrer" className="btn bg-[#25D366] text-white hover:bg-[#1ebe5b]">WhatsApp us</a>
            {!full && <Link href="/custom-printing" className="btn bg-white/10 text-white hover:bg-white/20">More about custom printing →</Link>}
          </div>
        </div>
        <div className="text-ink"><EnquiryForm defaultKind="Something else" compact /></div>
      </div>
    </section>
  );
}
