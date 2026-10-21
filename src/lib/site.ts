// Canonical site origin. Set NEXT_PUBLIC_SITE_URL once the custom domain is live;
// until then we fall back to the Vercel production URL so canonicals/sitemap point at a real host.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/+$/, "")
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "")
  || "https://shivamprinters.vercel.app";
