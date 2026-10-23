import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { products, getProduct } from "@/data/catalog";
import { Editor } from "@/components/editor/Editor";

export const metadata: Metadata = { title: "Personalise", robots: { index: false } };
export function generateStaticParams() { return products.map((p) => ({ slug: p.slug })); }

export default async function DesignPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const p = getProduct((await params).slug);
  if (!p) notFound();
  const sp = await searchParams;
  const variant = p.variants.find((x) => x.sku === sp.v) ?? p.variants[0];
  const { v: _v, qty, edit, mode, ...opts } = sp;
  const initialOptions = Object.fromEntries(Object.entries(opts).filter(([, val]) => typeof val === "string")) as Record<string, string>;
  return (
    <div className="container-x py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold">Personalise your {p.name.toLowerCase()}</h1>
        <Link href={`/p/${p.slug}`} className="text-sm text-ink-2">← Back to product</Link>
      </div>
      <Editor product={p} variant={variant} initialOptions={initialOptions} initialQty={Math.max(1, Number(qty) || 1)} editLineId={edit} initialMode={mode} />
    </div>
  );
}
