import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { categories, getCategory, productsInCategory } from "@/data/catalog";
import { CategoryBrowser } from "@/components/product/CategoryBrowser";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CallUs } from "@/components/ui/CallUs";

export const dynamicParams = false;
export function generateStaticParams() { return categories.map((c) => ({ slug: c.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = getCategory((await params).slug);
  if (!c) return {};
  return { title: `${c.name} — Personalised ${c.name} Online`, description: c.description, alternates: { canonical: `/c/${c.slug}` } };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const c = getCategory((await params).slug);
  if (!c) notFound();
  const items = productsInCategory(c.slug);
  return (
    <div className="container-x">
      <Breadcrumbs items={[{ label: c.name }]} />
      <div className="grid md:grid-cols-[1fr_360px] gap-6 items-end mb-8">
        <div>
          <h1 className="text-3xl md:text-5xl font-bold">{c.name}</h1>
          <p className="text-ink-2 mt-3 max-w-xl">{c.description}</p>
          <div className="mt-3"><CallUs /></div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={c.image} alt="" className="rounded-2xl aspect-[4/3] object-cover w-full hidden md:block" />
      </div>
      <CategoryBrowser products={items} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "CollectionPage", name: c.name, description: c.description,
        mainEntity: { "@type": "ItemList", itemListElement: items.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `/p/${p.slug}`, name: p.name })) },
      }) }} />
    </div>
  );
}
