import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Star, Truck, RotateCcw, ShieldCheck } from "lucide-react";
import { products, getProduct, getCategory, productsInCategory, minPrice } from "@/data/catalog";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { BuyBox } from "@/components/product/BuyBox";

export const dynamicParams = false;
export function generateStaticParams() { return products.map((p) => ({ slug: p.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = getProduct((await params).slug);
  if (!p) return {};
  return {
    title: `${p.name} — From ₹${minPrice(p)}`,
    description: p.description,
    alternates: { canonical: `/p/${p.slug}` },
    openGraph: { images: [p.image], title: p.name, description: p.description },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = getProduct((await params).slug);
  if (!p) notFound();
  const c = getCategory(p.category)!;
  const related = productsInCategory(p.category).filter((x) => x.slug !== p.slug).slice(0, 4);
  const kind = { photo: "Add 1 photo", text: "Add a name", "photo+text": "Add a photo and text", "multi-photo": `Add up to ${p.template.photoSlots} photos` }[p.personalisation];

  return (
    <div className="container-x">
      <Breadcrumbs items={[{ href: `/c/${c.slug}`, label: c.name }, { label: p.name }]} />
      <div className="grid md:grid-cols-2 gap-8 lg:gap-14">
        <div className="md:sticky md:top-32 self-start">
          <div className="card aspect-square">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.image} alt={p.name} className="w-full h-full object-cover" fetchPriority="high" />
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4 text-xs text-ink-2">
            <div className="flex items-center gap-2"><Truck size={16} className="text-accent" />Express 4–6 days</div>
            <div className="flex items-center gap-2"><RotateCcw size={16} className="text-accent" />Reprint or refund</div>
            <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-accent" />COD available</div>
          </div>
        </div>
        <div>
          <div className="flex gap-2 mb-2">{p.badges?.map((b) => <span key={b} className="chip bg-brand-soft text-brand-ink">{b}</span>)}</div>
          <h1 className="text-3xl md:text-4xl font-bold">{p.name}</h1>
          <div className="flex items-center gap-2 mt-2 text-sm"><span className="flex items-center gap-1 text-gold"><Star size={14} className="fill-gold" />{p.rating}</span><span className="text-ink-3">{p.reviews.toLocaleString("en-IN")} ratings</span><span className="text-ink-3">·</span><span className="text-ink-2">{kind}</span></div>
          <p className="text-ink-2 mt-4 leading-relaxed">{p.description}</p>
          <BuyBox product={p} />
          <details className="mt-8 border-t border-line pt-4 group">
            <summary className="font-semibold cursor-pointer list-none flex justify-between">Delivery & returns<span className="text-ink-3 group-open:rotate-45 transition-transform">+</span></summary>
            <div className="text-sm text-ink-2 mt-3 space-y-2">
              <p>Express delivery takes 4–6 working days; economy takes 10–12. Free economy shipping on orders over ₹999. Cash on delivery is available on most pincodes.</p>
              <p>Personalised products can&apos;t be returned, but if there&apos;s a print defect or damage in transit we reprint or refund — send a photo to the help desk within 7 days.</p>
            </div>
          </details>
          <details className="mt-3 border-t border-line pt-4 group">
            <summary className="font-semibold cursor-pointer list-none flex justify-between">Photo requirements<span className="text-ink-3 group-open:rotate-45 transition-transform">+</span></summary>
            <div className="text-sm text-ink-2 mt-3 space-y-2">
              <p>JPG, PNG or HEIC. Phone photos are fine for everything up to 8x10&quot;; for larger wall art we recommend 2,000px on the long edge or more. The editor warns you if a photo is too small for the size chosen.</p>
            </div>
          </details>
        </div>
      </div>
      <div className="mt-16">
        <div className="flex items-end justify-between mb-5"><h2 className="text-2xl font-bold">More {c.name.toLowerCase()}</h2><Link href={`/c/${c.slug}`} className="text-brand text-sm font-semibold">View all →</Link></div>
        <ProductGrid products={related} />
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "Product", name: p.name, description: p.description, image: p.image, brand: { "@type": "Brand", name: "Shivam Printers" }, sku: p.variants[0].sku,
        aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.reviews },
        offers: { "@type": "AggregateOffer", priceCurrency: "INR", lowPrice: minPrice(p), highPrice: Math.max(...p.variants.map((v) => v.price)), offerCount: p.variants.length, availability: "https://schema.org/InStock" },
      }) }} />
    </div>
  );
}
