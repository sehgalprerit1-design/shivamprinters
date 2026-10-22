import { SITE_URL } from "@/lib/site";
import type { MetadataRoute } from "next";
import { categories, products } from "@/data/catalog";
import { groupPages } from "@/data/nav";
import { giftPages } from "@/data/gifts";
import { posts } from "@/data/blog";
const base = SITE_URL;
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/products`, lastModified: now, priority: 0.8 },
    { url: `${base}/gifts`, lastModified: now, priority: 0.8 },
    ...groupPages.map((g) => ({ url: `${base}/c/${g.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.9 })),
    ...categories.map((c) => ({ url: `${base}/c/${c.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.9 })),
    ...products.map((p) => ({ url: `${base}/p/${p.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...giftPages.map((g) => ({ url: `${base}/gifts/${g.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...posts.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: new Date(p.date), priority: 0.5 })),
    ...["about", "help", "returns", "bulk-orders", "blog"].map((s) => ({ url: `${base}/${s}`, lastModified: now, priority: 0.4 })),
  ];
}
