import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { products, getProduct } from "@/data/catalog";
import { Editor } from "@/components/editor/Editor";

export const metadata: Metadata = { title: "Personalise", robots: { index: false } };
export function generateStaticParams() { return products.map((p) => ({ slug: p.slug })); }

export default async function DesignPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ v?: string }> }) {
  const p = getProduct((await params).slug);
  if (!p) notFound();
  const sku = (await searchParams).v;
  const variant = p.variants.find((x) => x.sku === sku) ?? p.variants[0];
  return (
    <div className="container-x py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold">Personalise your {p.name.toLowerCase()}</h1>
        <Link href={`/p/${p.slug}`} className="text-sm text-ink-2">← Back to product</Link>
      </div>
      <Editor product={p} variant={variant} />
    </div>
  );
}
