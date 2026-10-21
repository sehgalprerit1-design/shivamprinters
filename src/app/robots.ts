import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.shivamprinters.com";
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/cart", "/checkout", "/account", "/orders/", "/design/", "/search", "/api/"] }], sitemap: `${base}/sitemap.xml` };
}
