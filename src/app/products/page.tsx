import type { Metadata } from "next";
import { categories, productsInCategory } from "@/data/catalog";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = { title: "All Products — Photobooks, Frames, Calendars, Gifts" };

export default function AllProducts() {
  return (
    <div>
      <div className="container-x pt-8"><h1 className="text-3xl md:text-5xl font-bold">All products</h1></div>
      {categories.map((c) => (
        <Section key={c.slug} title={c.name} subtitle={c.tagline} href={`/c/${c.slug}`}>
          <ProductGrid products={productsInCategory(c.slug).slice(0, 8)} />
        </Section>
      ))}
    </div>
  );
}
