import Link from "next/link";
import type { Metadata } from "next";
import { posts } from "@/data/blog";
export const metadata: Metadata = { title: "Ideas & Inspiration — Blog", description: "Gift ideas, print sizes, photobook titles and how-tos from Zoomin." };
export default function Blog() {
  return (
    <div className="container-x pt-10">
      <h1 className="text-4xl md:text-5xl font-bold">Ideas & inspiration</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
        {posts.map((p) => <Link key={p.slug} href={`/blog/${p.slug}`} className="card p-5 hover:border-brand"><div className="text-xs text-ink-3">{new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div><h2 className="font-bold text-lg mt-1 leading-snug">{p.title}</h2><p className="text-ink-2 text-sm mt-2">{p.excerpt}</p></Link>)}
      </div>
    </div>
  );
}
