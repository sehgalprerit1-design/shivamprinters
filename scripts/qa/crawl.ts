// Crawl every route of a running site and report problems.
// npx tsx scripts/crawl.ts http://localhost:3000
import { products, categories } from "../../src/data/catalog";
import { groupPages } from "../../src/data/nav";
import { giftPages } from "../../src/data/gifts";
import { posts } from "../../src/data/blog";
import { redirects } from "../../src/lib/redirects";

const BASE = process.argv[2] ?? "http://localhost:3000";
const STATIC = ["/", "/products", "/gifts", "/blog", "/about", "/help", "/returns", "/privacy", "/terms", "/careers", "/refer", "/bulk-orders", "/custom-printing", "/cart", "/checkout", "/wishlist", "/account", "/search?q=mug", "/search?q=", "/sitemap.xml", "/robots.txt", "/admin", "/this-page-does-not-exist", "/p/nope", "/c/nope", "/gifts/nope", "/design/nope"];
const routes = [
  ...STATIC,
  ...groupPages.map((g) => `/c/${g.slug}`), ...categories.map((c) => `/c/${c.slug}`),
  ...products.map((p) => `/p/${p.slug}`),
  ...products.map((p) => `/design/${p.slug}`),
  ...giftPages.map((g) => `/gifts/${g.slug}`),
  ...posts.map((b) => `/blog/${b.slug}`),
];
const BAD = [/\bundefined\b/, /\bNaN\b/, /\[object Object\]/, /₹\s*(undefined|NaN|null)/, /\bnull\b(?![^<]*<\/script>)/];
const problems: string[] = []; const seenAssets = new Map<string, number>();
let okCount = 0;

async function head(u: string) { if (seenAssets.has(u)) return seenAssets.get(u)!; const r = await fetch(u, { method: "GET", redirect: "manual" }).catch(() => null); const s = r?.status ?? 0; seenAssets.set(u, s); return s; }

const limit = 8; let i = 0;
async function worker() {
  while (i < routes.length) {
    const route = routes[i++];
    const expect404 = /nope|does-not-exist/.test(route);
    try {
      const r = await fetch(BASE + route, { redirect: "manual" });
      if (expect404) { if (r.status !== 404) problems.push(`${route}: expected 404, got ${r.status}`); else okCount++; continue; }
      if (route === "/admin" && r.status === 200) { okCount++; continue; }
      if (r.status !== 200) { problems.push(`${route}: status ${r.status}${r.status >= 300 && r.status < 400 ? " → " + r.headers.get("location") : ""}`); continue; }
      const html = await r.text();
      if (route.endsWith(".xml") || route.endsWith(".txt")) { okCount++; continue; }
      // strip scripts/JSON blobs before text checks
      const text = html.replace(/<script[\s\S]*?<\/script>/g, "");
      for (const re of BAD) { const m = text.match(re); if (m) problems.push(`${route}: suspicious text "${m[0]}" …${text.slice(Math.max(0, (m.index ?? 0) - 60), (m.index ?? 0) + 40).replace(/\s+/g, " ")}`); }
      if (!/<title>[^<]+<\/title>/.test(html)) problems.push(`${route}: no <title>`);
      if (!/<h1/.test(html) && !route.startsWith("/search") && route !== "/cart" && route !== "/checkout") problems.push(`${route}: no <h1>`);
      // JSON-LD validity
      for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch { problems.push(`${route}: invalid JSON-LD`); } }
      // images + internal links
      const imgs = [...html.matchAll(/(?:src|srcSet|srcset)="([^"]+)"/g)].map((m) => m[1].split(",")[0].split(" ")[0]).filter((s) => s.startsWith("/") && !s.startsWith("/_next/"));
      const bg = [...html.matchAll(/url\(([^)]+)\)/g)].map((m) => m[1].replace(/['"]/g, "")).filter((s) => s.startsWith("/images"));
      for (const a of new Set([...imgs, ...bg])) { const s = await head(BASE + a); if (s !== 200) problems.push(`${route}: asset ${a} → ${s}`); }
      const links = [...html.matchAll(/href="(\/[^"#?]*)/g)].map((m) => m[1]).filter((l) => !l.startsWith("/_next") && !l.startsWith("/api"));
      for (const l of new Set(links)) { const s = await head(BASE + l); if (s !== 200) problems.push(`${route}: link ${l} → ${s}`); }
      okCount++;
    } catch (e) { problems.push(`${route}: ${(e as Error).message}`); }
  }
}
(async () => {
  await Promise.all(Array.from({ length: limit }, worker));
  // redirects sample
  let redirOk = 0; const redirBad: string[] = [];
  for (const rd of redirects) { const r = await fetch(BASE + rd.source, { redirect: "manual" }); const loc = r.headers.get("location") ?? ""; if ((r.status === 308 || r.status === 301) && loc.endsWith(rd.destination)) redirOk++; else redirBad.push(`${rd.source} → ${r.status} ${loc} (want ${rd.destination})`); }
  console.log(`Routes OK: ${okCount}/${routes.length}; redirects OK: ${redirOk}/${redirects.length}`);
  console.log(`\n${problems.length} problems:`); for (const p of [...new Set(problems)]) console.log(" - " + p);
  if (redirBad.length) { console.log(`\nBad redirects (${redirBad.length}):`); for (const b of redirBad.slice(0, 30)) console.log(" - " + b); }
})();
