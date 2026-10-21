import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Star, Truck, RotateCcw, ShieldCheck, Printer } from "lucide-react";
import { products, getProduct, getCategory, productsInCategory, productsByTag, minPrice } from "@/data/catalog";
import { inr } from "@/lib/format";
import { reviewsFor, ratingSummary } from "@/data/reviews";
import { optionsFor } from "@/data/options";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { BuyBox } from "@/components/product/BuyBox";
import { Reviews } from "@/components/product/Reviews";
import { Gallery } from "@/components/product/Gallery";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { StickyBuyBar } from "@/components/product/StickyBuyBar";
import { CallUs } from "@/components/ui/CallUs";

export const dynamicParams = false;
export function generateStaticParams() { return products.map((p) => ({ slug: p.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = getProduct((await params).slug);
  if (!p) return {};
  return { title: `${p.name} — From ${inr(minPrice(p))}`, description: p.description, alternates: { canonical: `/p/${p.slug}` }, openGraph: { images: [p.image], title: p.name, description: p.description } };
}

const SPECS: Record<string, [string, string][]> = {
  photobooks: [["Pages", "20 (add up to 100 in the editor)"], ["Paper", "170gsm matte, glossy or 250gsm premium"], ["Cover", "Laminated hardcover / softcover / linen"], ["Binding", "Perfect-bound; layflat on board pages"]],
  "framed-prints": [["Frame", "Solid wood or polymer moulding"], ["Glazing", "Clear glass"], ["Mat", "Acid-free white mat (designer/premium)"], ["Hanging", "Wall hook + tabletop stand included"]],
  calendars: [["Months", "12 + cover, start any month"], ["Paper", "300gsm card, matte or glossy"], ["Stand", "Wooden easel (desktop) / spiral + hook (wall)"], ["Holidays", "Indian national holidays pre-marked"]],
  kids: [["Material", "Food-grade steel / BPA-free plastic / coated fabric"], ["Print", "UV printed, dishwasher-safe"], ["Personalisation", "Name + theme"], ["Age", "3+"]],
  "home-decor": [["Material", "5–8 mm acrylic / cotton canvas / lustre paper"], ["Mounting", "Floating mount or stretcher bar"], ["Finish", "Glossy, matte or textured"], ["Lifespan", "UV-resistant inks, 25+ years indoors"]],
  gifts: [["Material", "Ceramic / cotton / flexible magnet"], ["Print", "Sublimation, dishwasher-safe"], ["Capacity", "325–350 ml (mugs)"], ["Personalisation", "Photo + caption"]],
  prints: [["Paper", "Fuji glossy / matte / pearl, or 300gsm card stock"], ["Pack", "As listed"], ["Border", "Optional white border"], ["Sleeves", "Each print sleeved"]],
  "bags-stationery": [["Material", "12oz canvas / 100gsm paper"], ["Print", "Full-colour, wash-safe"], ["Personalisation", "Photo or name"], ["Pages", "192 ruled (notebooks)"]],
  "business-printing": [["Printing", "Full-colour offset / digital, CMYK"], ["Artwork", "JPG or PNG, 300 dpi; we add bleed and send a proof"], ["Turnaround", "Proof within 1 working day, dispatch 2–4 days after approval"], ["Minimums", "As listed per product; bulk pricing on request"], ["Design help", "Call us — our designer can lay it out from your text and photos"]],
  "diaries-planners": [["Cover", "PU leather, full-grain leather or linen hardcover"], ["Paper", "100gsm cream, fountain-pen friendly"], ["Pages", "Dated 2027 (Indian holidays marked) or undated"], ["Personalisation", "Name/initials/logo — deboss or foil"], ["Extras", "Ribbon markers, pen loop, back pocket, gift box on sets"]],
  accessories: [["Material", "Acrylic / steel / vinyl"], ["Print", "UV or engraved"], ["Personalisation", "Name, phone or photo"], ["Fit", "Model-specific (skins)"]],
};

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = getProduct((await params).slug);
  if (!p) notFound();
  const c = getCategory(p.category)!;
  const related = productsInCategory(p.category).filter((x) => x.slug !== p.slug).slice(0, 4);
  const pairs = productsByTag(p.tags.slice(0, 3), 12).filter((x) => x.slug !== p.slug && x.category !== p.category).slice(0, 3);
  const reviews = reviewsFor(p); const sum = ratingSummary(reviews);
  const groups = optionsFor(p.slug, p.category);
  const kind = { photo: "Add 1 photo", text: "Add a name", "photo+text": "Add a photo and text", "multi-photo": `Add up to ${p.template.photoSlots} photos`, none: "Ready-made, ships as is" }[p.personalisation];
  const gallery = [{ src: p.image, label: "Product" }, ...(p.images ?? []).map((src, i) => ({ src, label: i === 0 ? "In use" : "Detail" })), ...(p.images ? [] : [{ src: c.image, label: "In context" }])];

  return (
    <div className="container-x">
      <Breadcrumbs items={[{ href: `/c/${c.slug}`, label: c.name }, { label: p.name }]} />
      <div className="grid md:grid-cols-2 gap-8 lg:gap-14">
        <div className="md:sticky md:top-32 self-start">
          <Gallery images={gallery} alt={p.name} />
          <div className="grid grid-cols-3 gap-3 mt-4 text-xs text-ink-2">
            <div className="flex items-center gap-2"><Truck size={16} className="text-accent" />Express 4–6 days</div>
            <div className="flex items-center gap-2"><RotateCcw size={16} className="text-accent" />Reprint or refund</div>
            <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-accent" />COD available</div>
          </div>
        </div>
        <div>
          <div className="flex gap-2 mb-2">{p.badges?.map((b) => <span key={b} className="chip bg-brand-soft text-brand-ink">{b}</span>)}</div>
          <h1 className="text-3xl md:text-4xl font-bold">{p.name}</h1>
          <a href="#reviews" className="flex items-center gap-2 mt-2 text-sm hover:underline"><span className="flex items-center gap-1 text-gold"><Star size={14} className="fill-gold" />{sum.avg}</span><span className="text-ink-3">{p.reviews.toLocaleString("en-IN")} ratings · {sum.total} reviews</span><span className="text-ink-3">·</span><span className="text-ink-2">{kind}</span></a>
          <p className="text-ink-2 mt-4 leading-relaxed">{p.description}</p>
          <BuyBox product={p} />

          <div className="mt-8 border-t border-line pt-5">
            <div className="flex items-center gap-2 font-semibold mb-3"><Printer size={16} className="text-accent" />Specifications</div>
            <dl className="grid grid-cols-[120px_1fr] gap-y-1.5 text-sm">
              {(SPECS[p.category] ?? []).map(([k, v]) => <div key={k} className="contents"><dt className="text-ink-3">{k}</dt><dd className="text-ink-2">{v}</dd></div>)}
              {groups.length > 0 && <div className="contents"><dt className="text-ink-3">Options</dt><dd className="text-ink-2">{groups.map((g) => g.label).join(", ")}</dd></div>}
            </dl>
            <div className="mt-3"><CallUs whatsapp={`Hi Shivam Printers, I have a question about "${p.name}".`} /></div>
          </div>
          <details className="mt-3 border-t border-line pt-4 group">
            <summary className="font-semibold cursor-pointer list-none flex justify-between">Delivery & returns<span className="text-ink-3 group-open:rotate-45 transition-transform">+</span></summary>
            <div className="text-sm text-ink-2 mt-3 space-y-2">
              <p>Express delivery takes 4–6 working days; economy takes 10–12. Free economy shipping on orders over ₹999. Cash on delivery is available on most pincodes.</p>
              <p>Personalised products can&apos;t be returned, but if there&apos;s a print defect or damage in transit we reprint or refund — send a photo to the help desk within 7 days.</p>
              <CallUs whatsapp={`Hi Shivam Printers, I have a question about "${p.name}".`} />
            </div>
          </details>
          <details className="mt-3 border-t border-line pt-4 group">
            <summary className="font-semibold cursor-pointer list-none flex justify-between">Photo requirements<span className="text-ink-3 group-open:rotate-45 transition-transform">+</span></summary>
            <div className="text-sm text-ink-2 mt-3"><p>JPG, PNG or HEIC. Phone photos are fine for everything up to 8x10&quot;; for larger wall art we recommend 2,000px on the long edge or more. The editor warns you if a photo is too small for the size chosen.</p><div className="mt-2"><CallUs whatsapp={`Hi Shivam Printers, I have a question about "${p.name}".`} /></div></div>
          </details>
          <details className="mt-3 border-t border-line pt-4 group">
            <summary className="font-semibold cursor-pointer list-none flex justify-between">Frequently asked<span className="text-ink-3 group-open:rotate-45 transition-transform">+</span></summary>
            <div className="text-sm text-ink-2 mt-3 space-y-3">
              <p><b>Can I see a proof before it prints?</b> Yes — the preview in the editor is the exact file we print. For the designer service we email a proof.</p>
              <p><b>Can I ship it directly as a gift?</b> Yes. Enter their address at checkout and add a gift message; no invoice goes in the box.</p>
              <p><b>Can I reorder the same design?</b> Yes — the design file is saved with your order. Call or WhatsApp us with the order number and we print it again.</p>
              <CallUs whatsapp={`Hi Shivam Printers, I have a question about "${p.name}".`} />
            </div>
          </details>
        </div>
      </div>

      {pairs.length > 0 && (
        <div className="mt-16">
          <div className="flex items-end justify-between mb-5"><div><h2 className="text-2xl font-bold">Complete the gift</h2><p className="text-ink-2 text-sm">Often bought together with this.</p></div></div>
          <ProductGrid products={pairs} cols={3} />
        </div>
      )}

      <Reviews reviews={reviews} avg={sum.avg} counts={sum.counts} productSlug={p.slug} />

      <div className="mt-16">
        <div className="flex items-end justify-between mb-5"><h2 className="text-2xl font-bold">More {c.name.toLowerCase()}</h2><Link href={`/c/${c.slug}`} className="text-brand text-sm font-semibold">View all →</Link></div>
        <ProductGrid products={related} />
      </div>
      <RecentlyViewed current={p.slug} />
      <StickyBuyBar name={p.name} price={minPrice(p)} href={p.personalisation === "none" ? "#buy" : `/design/${p.slug}`} label={p.personalisation === "none" ? "Add to cart" : "Personalise"} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "Product", name: p.name, description: p.description, image: p.image, brand: { "@type": "Brand", name: "Shivam Printers" }, sku: p.variants[0].sku,
        aggregateRating: { "@type": "AggregateRating", ratingValue: sum.avg, reviewCount: sum.total },
        review: reviews.slice(0, 5).map((r) => ({ "@type": "Review", author: { "@type": "Person", name: r.author }, datePublished: r.date, reviewBody: r.body, name: r.title, reviewRating: { "@type": "Rating", ratingValue: r.rating } })),
        offers: { "@type": "AggregateOffer", priceCurrency: "INR", lowPrice: minPrice(p), highPrice: Math.max(...p.variants.map((v) => v.price)), offerCount: p.variants.length, availability: "https://schema.org/InStock" },
      }) }} />
    </div>
  );
}
