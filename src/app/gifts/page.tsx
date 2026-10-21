import Link from "next/link";
import type { Metadata } from "next";
import { giftPagesByGroup } from "@/data/gifts";
import { productsByTag } from "@/data/catalog";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = { title: "Gift Ideas — Personalised Gifts by Occasion & Recipient", description: "Find a personalised photo gift by occasion, recipient, festival or budget." };

export default function GiftsHub() {
  const groups: [string, ReturnType<typeof giftPagesByGroup>][] = [
    ["By occasion", giftPagesByGroup("occasion")],
    ["Festivals", giftPagesByGroup("festival")],
    ["For someone", giftPagesByGroup("recipient").filter((g) => !g.slug.includes("-gifts-for-"))],
    ["Collections", giftPagesByGroup("collection")],
  ];
  return (
    <div>
      <div className="container-x pt-8">
        <h1 className="text-3xl md:text-5xl font-bold">Gift ideas</h1>
        <p className="text-ink-2 mt-2 max-w-xl">Start with who it&apos;s for or what it&apos;s for. Everything is personalised with your photos.</p>
      </div>
      {groups.map(([title, pages]) => (
        <section key={title} className="container-x py-8">
          <h2 className="text-xl font-bold mb-3">{title}</h2>
          <div className="flex flex-wrap gap-2">{pages.map((g) => <Link key={g.slug} href={`/gifts/${g.slug}`} className="chip bg-surface border border-line hover:border-brand !py-1.5 !text-sm !font-medium">{g.title}</Link>)}</div>
        </section>
      ))}
      <Section title="Popular gifts right now" href="/products">
        <ProductGrid products={productsByTag(["birthday", "anniversary", "friends"], 8)} />
      </Section>
    </div>
  );
}
