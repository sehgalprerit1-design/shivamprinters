import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { categories, getCategory, productsInCategory } from "@/data/catalog";
import { getGroup, groupPages, groupProducts, categoryTrail } from "@/data/nav";
import { CategoryBrowser } from "@/components/product/CategoryBrowser";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CallUs } from "@/components/ui/CallUs";
import { CustomPrintingSection } from "@/components/business/CustomPrintingSection";

export const dynamicParams = false;
export function generateStaticParams() { return [...categories.map((c) => ({ slug: c.slug })), ...groupPages.map((g) => ({ slug: g.slug }))]; }

function resolve(slug: string) {
  const c = getCategory(slug); const g = getGroup(slug);
  if (c) return { head: c, category: c, group: g ?? null };
  if (g) return { head: g, category: null, group: g };
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const r = resolve((await params).slug);
  if (!r) return {};
  return { title: `${r.head.name} — Personalised ${r.head.name} Online`, description: r.head.description, alternates: { canonical: `/c/${r.head.slug}` } };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const r = resolve((await params).slug);
  if (!r) notFound();
  const { head, category, group } = r;
  // A group landing (Photo, Business Printing) shows every product in its sub-categories; a plain category shows its own.
  const sections = group && group.slug === head.slug ? group.categories : null;
  const items = sections ? groupProducts(group!) : productsInCategory(category!.slug);
  const trail = category ? categoryTrail(category) : [{ label: head.name }];
  return (
    <div className="container-x">
      <Breadcrumbs items={trail} />
      <div className="grid md:grid-cols-[1fr_360px] gap-6 items-end mb-8">
        <div>
          <h1 className="text-3xl md:text-5xl font-bold">{head.name}</h1>
          <p className="text-ink-2 mt-3 max-w-xl">{head.description}</p>
          <div className="mt-3"><CallUs /></div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={head.image} alt="" className="rounded-2xl aspect-[4/3] object-cover w-full hidden md:block" />
      </div>
      {sections && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {sections.map((c) => (
            <Link key={c.slug} href={`/c/${c.slug}`} className="card flex items-center gap-3 p-3 hover:border-brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.image} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
              <div className="min-w-0"><div className="font-semibold leading-tight">{c.name}</div><div className="text-xs text-ink-3 mt-0.5">{productsInCategory(c.slug).length} products</div></div>
            </Link>
          ))}
          {head.slug === "business-printing" && (
            <Link href="/custom-printing" className="card flex items-center gap-3 p-3 bg-amber-50 hover:border-brand">
              <div className="w-14 h-14 rounded-lg bg-amber-300 shrink-0 flex items-center justify-center text-xl">✎</div>
              <div className="min-w-0"><div className="font-semibold leading-tight">Custom printing</div><div className="text-xs text-ink-3 mt-0.5">Get a quote</div></div>
            </Link>
          )}
        </div>
      )}
      <CategoryBrowser products={items} sections={sections ?? undefined} />
      {head.slug === "business-printing" && <CustomPrintingSection />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "CollectionPage", name: head.name, description: head.description,
        mainEntity: { "@type": "ItemList", itemListElement: items.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `/p/${p.slug}`, name: p.name })) },
      }) }} />
    </div>
  );
}
