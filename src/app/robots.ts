import { SITE_URL } from "@/lib/site";
import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  const base = SITE_URL;
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/cart", "/checkout", "/account", "/orders/", "/design/", "/search", "/api/"] }], sitemap: `${base}/sitemap.xml` };
}
