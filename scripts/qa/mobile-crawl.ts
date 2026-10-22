// Every route at phone width: horizontal overflow, console/page errors, empty main, tap-target sanity on key pages.
// npx tsx scripts/qa/mobile-crawl.ts http://localhost:3000
import { chromium } from "playwright";
import { products, categories } from "../../src/data/catalog";
import { groupPages } from "../../src/data/nav";
import { giftPages } from "../../src/data/gifts";
import { posts } from "../../src/data/blog";
const BASE = process.argv[2] ?? "http://localhost:3000";
const routes = ["/", "/products", "/gifts", "/blog", "/about", "/help", "/returns", "/privacy", "/terms", "/careers", "/refer", "/bulk-orders", "/custom-printing", "/cart", "/checkout", "/wishlist", "/account", "/search?q=mug",
  ...groupPages.map((g) => `/c/${g.slug}`), ...categories.map((c) => `/c/${c.slug}`), ...products.map((p) => `/p/${p.slug}`), ...products.map((p) => `/design/${p.slug}`), ...giftPages.map((g) => `/gifts/${g.slug}`), ...posts.map((b) => `/blog/${b.slug}`)];
const fail: string[] = []; const errs = new Map<string, string[]>();

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errs.set(page.url(), [...(errs.get(page.url()) ?? []), "pageerror: " + e.message.slice(0, 150)]));
  page.on("console", (m) => { if (m.type() === "error" && !/favicon/.test(m.text())) errs.set(page.url(), [...(errs.get(page.url()) ?? []), m.text().slice(0, 150)]); });
  let i = 0;
  for (const r of routes) {
    i++;
    try {
      const res = await page.goto(BASE + r, { waitUntil: "networkidle", timeout: 30000 });
      if (!res || res.status() !== 200) { fail.push(`${r}: status ${res?.status()}`); continue; }
      const info = await page.evaluate(() => {
        const sw = document.documentElement.scrollWidth, cw = document.documentElement.clientWidth;
        const wide = [...document.querySelectorAll("body *")].filter((e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.right > cw + 1 && cs.position !== "fixed" && cs.overflowX !== "auto" && cs.overflowX !== "scroll" && !e.closest("[style*='overflow-x: auto'], .overflow-x-auto, .no-scrollbar"); }).slice(0, 3).map((e) => e.tagName.toLowerCase() + "." + String(e.className).split(" ").slice(0, 2).join(".") + ":" + (e.textContent ?? "").trim().slice(0, 25));
        const main = document.querySelector("main"); const mh = main ? main.getBoundingClientRect().height : 0;
        const tiny = [...document.querySelectorAll("main a, main button")].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && (b.height < 24 || b.width < 24) && getComputedStyle(e).display !== "inline"; }).length;
        const imgs = [...document.querySelectorAll("img")].filter((im) => im.complete && im.naturalWidth === 0 && im.getAttribute("src")).map((im) => im.getAttribute("src")!).slice(0, 3);
        return { sw, cw, wide, mh, tiny, imgs };
      });
      if (info.sw > info.cw + 1) fail.push(`${r}: overflow ${info.sw}>${info.cw} — ${info.wide.join(" ; ")}`);
      if (info.mh < 200 && !r.startsWith("/search")) fail.push(`${r}: main only ${Math.round(info.mh)}px tall`);
      if (info.imgs.length) fail.push(`${r}: broken images ${info.imgs.join(", ")}`);
    } catch (e) { fail.push(`${r}: ${(e as Error).message.split("\n")[0].slice(0, 120)}`); }
    if (i % 50 === 0) process.stdout.write(`${i}/${routes.length}\n`);
  }
  // key interactions on mobile
  try {
    await page.goto(`${BASE}/`, { waitUntil: "load" }); await page.waitForTimeout(800);
    await page.locator("header button[aria-label='Menu']").click(); await page.waitForTimeout(400);
    const d = await page.evaluate(() => { const el = document.querySelector("[role=dialog] > div") as HTMLElement | null; return el ? el.getBoundingClientRect().height : 0; });
    if (d < 800) fail.push(`mobile menu drawer height ${d}`);
    await page.locator("[role=dialog] a[href='/c/kids']").click(); await page.waitForURL(/\/c\/kids/);
    await page.goto(`${BASE}/p/coffee-mug-white`, { waitUntil: "load" }); await page.waitForTimeout(800); await page.evaluate(() => window.scrollTo(0, 1500)); await page.waitForTimeout(600);
    const bar = await page.locator(".fixed.bottom-0 a:has-text('Personalise')").isVisible().catch(() => false); if (!bar) fail.push("sticky buy bar not visible on mobile product page");
    if (bar) { await page.locator(".fixed.bottom-0 a:has-text('Personalise')").click(); await page.waitForURL(/\/design\/coffee-mug-white/); const canvasW = await page.locator("canvas").first().evaluate((c) => c.getBoundingClientRect().width); if (canvasW > 390 || canvasW < 300) fail.push(`editor canvas width on mobile ${canvasW}`); }
  } catch (e) { fail.push("mobile interactions: " + (e as Error).message.split("\n")[0].slice(0, 120)); }
  console.log(`\nRoutes: ${routes.length}\n=== ${fail.length} failures`); for (const f of fail) console.log(" - " + f);
  console.log(`=== console/page errors`); for (const [u, v] of errs) console.log(` - ${u.replace(BASE, "")}: ${[...new Set(v)].slice(0, 2).join(" | ")}`);
  await browser.close();
})();
