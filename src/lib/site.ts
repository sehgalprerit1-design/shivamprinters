// Canonical site origin. Set NEXT_PUBLIC_SITE_URL once the custom domain is live;
// until then we fall back to the Vercel production URL so canonicals/sitemap point at a real host.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/+$/, "")
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "")
  || "https://shivamprinters.vercel.app";

// TEMPORARY: sell only through WhatsApp / phone. While true, the cart button, cart drawer,
// Add-to-cart buttons and the /cart + /checkout pages are hidden and replaced with
// "Order on WhatsApp" / "Call to order". Flip back by setting NEXT_PUBLIC_ENQUIRY_ONLY=false
// in Vercel (or changing the default below) and redeploying.
export const ENQUIRY_ONLY = (process.env.NEXT_PUBLIC_ENQUIRY_ONLY ?? "true") !== "false";
