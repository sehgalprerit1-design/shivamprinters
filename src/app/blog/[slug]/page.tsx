import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { posts, getPost } from "@/data/blog";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
export const dynamicParams = false;
export function generateStaticParams() { return posts.map((p) => ({ slug: p.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const p = getPost((await params).slug); return p ? { title: p.title, description: p.excerpt, alternates: { canonical: `/blog/${p.slug}` } } : {}; }
export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const p = getPost((await params).slug); if (!p) notFound();
  return (
    <article className="container-x max-w-3xl">
      <Breadcrumbs items={[{ href: "/blog", label: "Blog" }, { label: p.title }]} />
      <h1 className="text-3xl md:text-5xl font-bold leading-tight">{p.title}</h1>
      <div className="text-sm text-ink-3 mt-3">{new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>
      <div className="mt-8 space-y-5 text-lg text-ink-2 leading-relaxed">{p.body.map((b, i) => <p key={i}>{b}</p>)}</div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BlogPosting", headline: p.title, datePublished: p.date, description: p.excerpt, author: { "@type": "Organization", name: "Shivam Printers" } }) }} />
    </article>
  );
}
