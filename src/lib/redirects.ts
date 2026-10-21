// Legacy URL → new URL. Consumed by next.config.ts so every old zoomin.com
// URL from the current sitemap 301s to its new home. Nothing in the old
// sitemap should 404 after launch.
import { products } from "../data/catalog";
import { giftPages } from "../data/gifts";

type R = { source: string; destination: string; permanent: true };
const r = (source: string, destination: string): R => ({ source, destination, permanent: true });

const staticRedirects: R[] = [
  r("/shop", "/products"),
  // /gifts is now the gift-ideas hub; the old "Gifts" product category lives at /c/gifts and is linked from nav.
  r("/photo-prints", "/c/prints"),
  r("/prints", "/c/prints"),
  r("/framed-prints-regular", "/c/framed-prints"),
  r("/home-decor", "/c/home-decor"),
  r("/bags", "/c/bags-stationery"),
  r("/stationery", "/c/bags-stationery"),
  r("/aboutus", "/about"),
  r("/service-promise", "/about#promise"),
  r("/career", "/careers"),
  r("/term-of-use", "/terms"),
  r("/refer-code", "/refer"),
  r("/prices", "/products"),
  r("/pages/birthday-sale", "/gifts/birthday-gifts"),
  r("/pages/wishes-and-messages", "/blog"),
  r("/pages/gifts-for-favourite-people", "/gifts/personalized-gifts-for-favourite-people"),
  // legacy per-finish premium frame URLs collapse into one product with variants
  ...[
    "modern-chestnut", "modern-wood", "modern-vogue", "urban-touch", "metallic-lustre", "metallic-brush",
    "rustic-vibe", "natural-wood", "natural-grooves", "imperial-wood", "classic-wood", "classic-achromatic", "distressed",
  ].map((f) => r(`/framed-prints/photo-frame-${f}-8x8`, "/p/premium-frame")),
  r("/framed-prints-regular/framedprint-4-4", "/p/coloured-frame"),
  r("/framed-prints-regular/frame-designer-mat-8x10-4x6", "/p/designer-frame"),
  r("/photobooks/softcover-5.5-book-20", "/p/softcover-photobook"),
  r("/photobooks/hardcover-5.5-book-20", "/p/hardcover-photobook"),
  r("/photobooks/softcover-8x10-book-prmatte-20", "/p/softcover-photobook"),
  r("/photobooks/hardcover-8x10-book-20", "/p/hardcover-photobook"),
  r("/photobooks/hardcover-10x8-book-20", "/p/hardcover-photobook"),
  r("/photobooks/layflat-10x8-book-20", "/p/layflat-photobook"),
];

// Top-level category paths that are unchanged keep working via /c/<slug>
const categoryRedirects: R[] = ["photobooks", "framed-prints", "calendars", "kids", "accessories"].map((c) =>
  r(`/${c}`, `/c/${c}`),
);

const productRedirects: R[] = products
  .filter((p) => p.legacyPath)
  .map((p) => r(p.legacyPath!, `/p/${p.slug}`));

const giftRedirects: R[] = giftPages.map((g) => r(`/pages/${g.legacySlug ?? g.slug}`, `/gifts/${g.slug}`));

const seen = new Set<string>();
export const redirects: R[] = [...staticRedirects, ...categoryRedirects, ...productRedirects, ...giftRedirects].filter((x) => (seen.has(x.source) ? false : (seen.add(x.source), true)));
