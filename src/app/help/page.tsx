import type { Metadata } from "next";
import Link from "next/link";
import { CallUs } from "@/components/ui/CallUs";
export const metadata: Metadata = { title: "Help desk & FAQ", description: "Delivery times, cash on delivery, reprints and refunds, photo requirements, bulk orders and GST invoices — answers from Shivam Printers." };

const FAQ: [string, string][] = [
  ["How long does delivery take?", "Personalised items go into production within 24 hours of your order (or of proof approval for brochures and corporate jobs). Express delivery then takes 4–6 working days and economy 10–12 working days, anywhere in India. Metro pincodes are usually at the faster end."],
  ["Is cash on delivery available?", "Yes, on most pincodes. Choose Cash on delivery at checkout; there is no extra charge. Online payment (UPI, cards, net banking) is also available."],
  ["How much is shipping?", "Economy shipping is ₹79, free on orders over ₹999 after discounts. Express is ₹149."],
  ["Can I see a proof before it prints?", "For editor products, the preview in the editor is exactly the file we print — what you see is what you get. For brochures, flyers, banners and corporate diaries we email a digital proof and wait for your approval."],
  ["What if the print is damaged or wrong?", "Send a photo of the problem to us on WhatsApp within 7 days of delivery and we reprint it free, or refund you if a reprint isn't possible. Personalised items can't be returned for a change of mind, because they can't be resold."],
  ["Can I change or cancel my order?", "Call or WhatsApp us as soon as possible. Orders can be changed or cancelled until they enter production, usually within a few hours of placing them."],
  ["What photo quality do I need?", "JPG, PNG or HEIC. Phone photos are fine for anything up to 8x10\". For large wall art, aim for 2,000 px on the long edge or more. WhatsApp forwards are compressed — ask the sender to share the original file instead. The editor warns you if a photo is too small for the size chosen."],
  ["Do I need an account?", "No. Your design is saved with the order. To check an order's status or reorder the same design, use Track your order with your order number and mobile."],
  ["Can you design it for me?", "Yes. The Book Designing Service lays out a photobook from your photos, and for business printing our designer can create your artwork from your text and logo — call us for a quote."],
  ["Do you do bulk and corporate orders?", "Yes — calendars, diaries, mugs, business cards and more with volume pricing from 25 units, and delivery to one or many addresses. See Custom printing or call us."],
  ["Will I get a GST invoice?", "Yes. Add your company name and GSTIN in the order notes or tell us on WhatsApp after ordering and we'll issue a GST invoice with the order."],
  ["Can I ship it directly as a gift?", "Yes. Enter the recipient's address at checkout and tick the gift message box. No invoice goes in the box."],
];

export default function Page() {
  return (
    <div className="container-x pt-10 max-w-3xl">
      <h1 className="text-4xl font-bold">Help desk</h1>
      <p className="text-ink-2 text-lg mt-4 leading-relaxed">Fastest way to reach us is a call or WhatsApp — we reply within working hours, usually within the hour.</p>
      <div className="mt-4"><CallUs whatsapp="Hi Shivam Printers, I need help with my order." /></div>
      <div className="mt-4 flex flex-wrap gap-2 text-sm"><Link href="/account" className="btn btn-secondary !py-2">Track your order</Link><Link href="/returns" className="btn btn-ghost !py-2">Returns & reprints</Link><Link href="/custom-printing" className="btn btn-ghost !py-2">Get a quote</Link></div>
      <h2 className="text-2xl font-bold mt-10 mb-2">Frequently asked</h2>
      <div className="divide-y divide-line">
        {FAQ.map(([q, a]) => (
          <details key={q} className="py-3 group">
            <summary className="font-semibold cursor-pointer list-none flex justify-between gap-4">{q}<span className="text-ink-3 group-open:rotate-45 transition-transform">+</span></summary>
            <p className="text-ink-2 text-sm mt-2 leading-relaxed">{a}</p>
          </details>
        ))}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }) }} />
    </div>
  );
}
