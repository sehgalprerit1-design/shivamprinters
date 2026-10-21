import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { giftPages, getGiftPage, giftPagesByGroup } from "@/data/gifts";
import { productsByTag } from "@/data/catalog";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CallUs } from "@/components/ui/CallUs";

export const dynamicParams = false;
export function generateStaticParams() { return giftPages.map((g) => ({ slug: g.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const g = getGiftPage((await params).slug);
  if (!g) return {};
  return {
    title: `${g.title} — Personalised Photo Gifts`,
    description: g.intro || `Personalised ${g.title.toLowerCase()} made from your photos: frames, mugs, cushions, photobooks and more. Delivered across India.`,
    alternates: { canonical: `/gifts/${g.slug}` },
  };
}

export default async function GiftPage({ params }: { params: Promise<{ slug: string }> }) {
  const g = getGiftPage((await params).slug);
  if (!g) notFound();
  const items = productsByTag(g.tags, 24);
  const related = giftPagesByGroup(g.group).filter((x) => x.slug !== g.slug).slice(0, 10);
  return (
    <div className="container-x">
      <Breadcrumbs items={[{ href: "/gifts", label: "Gift ideas" }, { label: g.title }]} />
      <div className={`rounded-3xl overflow-hidden relative ${g.image ? "text-white min-h-[300px] flex items-end" : "bg-brand-soft"} p-6 md:p-10 mb-8`}>
        {g.image && <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={g.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        </>}
        <div className="relative max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-bold">{g.h1}</h1>
          <p className={`mt-3 ${g.image ? "text-white/85" : "text-ink-2"}`}>{g.intro || `Personalised ${g.title.toLowerCase()} made from your photos — frames, mugs, cushions, photobooks and more, delivered across India.`}</p>
        </div>
      </div>
      {items.length ? <ProductGrid products={items} /> : <p className="text-ink-3">Nothing tagged yet — check the full range.</p>}
      <div className="mt-8 card p-4 flex flex-wrap items-center gap-3 justify-between"><span className="text-sm text-ink-2">Not sure what to pick? We&apos;ll help you choose.</span><CallUs /></div>
      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-bold mb-3">More {g.group === "recipient" ? "gifts for" : g.group === "festival" ? "festivals" : "occasions"}</h2>
          <div className="flex flex-wrap gap-2">{related.map((r) => <Link key={r.slug} href={`/gifts/${r.slug}`} className="chip bg-surface-2 border border-line hover:border-brand">{r.title}</Link>)}</div>
        </div>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "CollectionPage", name: g.title,
        breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: "/" }, { "@type": "ListItem", position: 2, name: "Gift ideas", item: "/gifts" }, { "@type": "ListItem", position: 3, name: g.title }] },
      }) }} />
    </div>
  );
}
