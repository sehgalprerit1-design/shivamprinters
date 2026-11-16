// End-to-end test of the Wedding section: nav highlight, landing page, every wedding product
// (price = Rs 1 under the competitor list in src/data/wedding-prices.ts), the configurators,
// the design studio, and the admin catalogue sheet.
// npx tsx scripts/qa/e2e-wedding.ts http://localhost:3000 [admin-password]
// Server: ADMIN_PASSWORD=qa-test-pass ALLOW_LOCAL_PUBLISH=1 (overrides.json is restored afterwards).
import { chromium, type Page } from "playwright";
import fs from "node:fs";
import { products, categories, minPrice } from "../../src/data/catalog";
import { navGroups, WEDDING_CHECKLIST } from "../../src/data/nav";
import { configFor, resolveConfig } from "../../src/data/print-configs";
import { optionsFor } from "../../src/data/options";
import { WEDDING_CONFIG_ROWS, WEDDING_VARIANTS } from "../../src/data/wedding-prices";

const BASE = process.argv[2] ?? "http://localhost:3000"; const PW = process.argv[3] ?? "qa-test-pass";
const SHOTS = ".qa/shots"; fs.mkdirSync(SHOTS, { recursive: true });
const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
const fail: string[] = []; let passed = 0;
const check = (c: boolean, m: string) => { if (c) passed++; else fail.push(m); };
const OVERRIDES = "src/data/overrides.json";

const wedding = navGroups.find((g) => g.slug === "wedding")!;
const wedCats = categories.filter((c) => c.slug.startsWith("wedding-"));
const wedProducts = products.filter((p) => p.category.startsWith("wedding-"));

async function overflow(page: Page, label: string) {
  const w = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  check(w[0] <= w[1] + 1, `${label}: horizontal overflow ${w[0]} > ${w[1]}`);
}

(async () => {
  // ---------- static data checks (no browser)
  check(!!wedding && wedding.highlight === true && wedding.categories.length === 3, "nav: wedding group is highlighted with 3 categories");
  check(wedProducts.length === 15, `catalogue: 15 wedding products (found ${wedProducts.length})`);
  for (const [slug, rows] of Object.entries(WEDDING_CONFIG_ROWS)) {
    const p = products.find((x) => x.slug === slug); const cfg = configFor(slug);
    check(!!p && !!cfg, `${slug}: has a product and a configurator`);
    if (!p || !cfg) continue;
    check(p.variants[0].price === rows[0].tiers[0][1], `${slug}: "From" price ${p.variants[0].price} = first tier ${rows[0].tiers[0][1]}`);
    for (const r of rows) { const q = r.tiers.map((x) => x[0]); const t = r.tiers.map((x) => x[1]); check(q.every((v, i) => i === 0 || v > q[i - 1]) && t.every((v, i) => i === 0 || v >= t[i - 1]), `${slug} ${JSON.stringify(r.sel)}: tiers ascend`); }
  }
  for (const [slug, vs] of Object.entries(WEDDING_VARIANTS)) check(products.find((x) => x.slug === slug)?.variants.length === vs.length, `${slug}: variants wired from wedding-prices`);
  for (const g of WEDDING_CHECKLIST) for (const it of g.items) if (it.slug) check(!!products.find((p) => p.slug === it.slug), `checklist: ${it.label} → /p/${it.slug} exists`);
  // spot checks against the competitor figures (Vistaprint India / IndianWeddingCards.in, 16 Nov 2026)
  const price = (slug: string, sku: string) => products.find((p) => p.slug === slug)!.variants.find((v) => v.sku === sku)?.price;
  check(resolveConfig(configFor("wedding-invitation-cards")!, { sel: { style: "Flat card", size: '5 x 7"' }, qty: 100 }).total === 1399, "invitation: 100 flat 5x7 = ₹1,399 (Vistaprint ₹1,400)");
  check(resolveConfig(configFor("wedding-invitation-cards")!, { sel: { style: "Folded card", size: '5 x 7"' }, qty: 50 }).total === 1099, "invitation: 50 folded = ₹1,099 (Vistaprint ₹1,100)");
  check(price("gold-foil-wedding-cards", "WD-GF-100") === 2499, "gold foil: 100 = ₹2,499 (Vistaprint ₹2,500)");
  check(price("wedding-card-packages", "WD-PKG-LUXURY") === 18000, "package: Luxury = ₹18,000 (IndianWeddingCards ₹18,001)");
  check(price("digital-wedding-invite", "WD-EINV") === 1000, "e-invite = ₹1,000 (IndianWeddingCards ₹1,001)");
  check(price("shagun-envelopes", "WD-SHG-100") === 1236, "shagun envelopes: 100 = ₹1,236 (Vistaprint ₹1,237)");
  check(resolveConfig(configFor("wedding-welcome-boards")!, { sel: { size: '18 x 24"' }, qty: 1 }).total === 624, "welcome board 18x24 = ₹624 (Vistaprint ₹625)");

  const browser = await chromium.launch();
  let ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } }); let page = await ctx.newPage();
  const errs: string[] = [];
  const watch = (p: Page, tag: string) => { p.on("pageerror", (e) => errs.push(`${tag} pageerror ${p.url()}: ${e.message.slice(0, 160)}`)); p.on("console", (c) => { if (c.type() === "error" && !/Failed to load resource/.test(c.text())) errs.push(`${tag} console ${p.url()}: ${c.text().slice(0, 160)}`); }); };
  watch(page, "desktop");

  // ---------- header: highlighted button + mega menu
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  const btn = page.locator("header nav a[href='/c/wedding']").first();
  check((await btn.innerText()).trim() === "Wedding", "header: Wedding button label");
  check(/bg-rose-600/.test((await btn.getAttribute("class")) ?? ""), "header: Wedding button is highlighted (rose)");
  const biz = page.locator("header nav a[href='/c/business-printing']").first();
  const [wb, bb] = [await btn.boundingBox(), await biz.boundingBox()];
  check(!!wb && !!bb && wb.x < bb.x && bb.x - (wb.x + wb.width) < 40 && Math.abs(wb.y - bb.y) < 2, "header: Wedding sits next to Business Printing on the right");
  await btn.hover(); await page.waitForTimeout(400);
  for (const c of wedCats) check(await page.locator(`header nav a[href='/c/${c.slug}']:visible`).count() > 0, `mega menu: ${c.name} column visible`);
  check(await page.locator("header nav a[href='/p/wedding-invitation-cards']:visible").count() > 0, "mega menu: invitation cards link visible");
  await page.screenshot({ path: `${SHOTS}/wedding-mega.png` });
  check(await page.locator("a:has-text('Shop wedding printing')").count() > 0, "home: wedding band present");
  await page.mouse.move(5, 500);
  await page.locator("a:has-text('Shop wedding printing')").scrollIntoViewIfNeeded(); await page.waitForTimeout(600);
  await page.screenshot({ path: `${SHOTS}/wedding-home-band.png` });

  // ---------- landing page
  await page.goto(`${BASE}/c/wedding`, { waitUntil: "networkidle" });
  check((await page.locator("h1").innerText()).trim() === "Wedding", "/c/wedding: h1");
  const cards = await page.locator("a[href^='/p/']").evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute("href")))]);
  for (const p of wedProducts) check(cards.includes(`/p/${p.slug}`), `/c/wedding lists ${p.slug}`);
  check(await page.locator("h2:has-text('Everything we print for a wedding')").count() === 1, "/c/wedding: checklist section");
  check(await page.locator("h2:has-text('More for the wedding')").count() === 1, "/c/wedding: cross-listed products section");
  const broken = await page.evaluate(async () => { const imgs = [...document.querySelectorAll("img")]; imgs.forEach((i) => (i.loading = "eager")); await new Promise((r) => setTimeout(r, 1500)); return imgs.filter((i) => i.complete && i.naturalWidth === 0 && !i.src.includes("/api/img") && i.src.startsWith(location.origin)).map((i) => i.src); });
  check(broken.length === 0, `/c/wedding: broken local images ${broken.join(", ")}`);
  await page.screenshot({ path: `${SHOTS}/wedding-landing.png`, fullPage: true });
  for (const c of wedCats) {
    await page.goto(`${BASE}/c/${c.slug}`, { waitUntil: "networkidle" });
    check((await page.locator("h1").innerText()).trim() === c.name, `/c/${c.slug}: h1`);
    check(await page.locator("nav[aria-label='Breadcrumb'] a[href='/c/wedding'], a[href='/c/wedding']:has-text('Wedding')").count() > 0, `/c/${c.slug}: breadcrumb through Wedding`);
  }

  // ---------- every wedding product page
  for (const p of wedProducts) {
    await page.goto(`${BASE}/p/${p.slug}`, { waitUntil: "networkidle" });
    check((await page.locator("h1").innerText()).trim() === p.name, `${p.slug}: h1`);
    check((await page.title()).includes(`From ${inr(minPrice(p))}`), `${p.slug}: title has From ${inr(minPrice(p))}`);
    const shown = (await page.locator("span.text-3xl.font-bold").first().textContent())?.trim();
    const cfg = configFor(p.slug);
    if (cfg) {
      const r0 = resolveConfig(cfg);
      check(shown === inr(r0.total), `${p.slug}: opens on ${inr(r0.total)} (shown ${shown})`);
      // walk every row: pick each dropdown value, then the last quantity, and compare the total
      for (const row of cfg.rows) {
        for (const f of cfg.fields) if (f.key in row.sel) {
          const sel = page.locator("#buy select").filter({ has: page.locator(`option[value="${row.sel[f.key].replace(/"/g, '\\"')}"]`) }).first();
          if (await sel.count()) await sel.selectOption(row.sel[f.key]);
        }
        const last = row.tiers[row.tiers.length - 1];
        const qtySel = page.locator("#buy select").filter({ has: page.locator(`option[value="${last[0]}"]`) }).last();
        await qtySel.selectOption(String(last[0])); await page.waitForTimeout(80);
        const t = (await page.locator("span.text-3xl.font-bold").first().textContent())?.trim();
        check(t === inr(last[1]), `${p.slug} ${Object.values(row.sel).join(" / ")} × ${last[0]}: shown ${t}, expected ${inr(last[1])}`);
      }
    } else {
      check(shown === inr(p.variants[0].price), `${p.slug}: opens on ${inr(p.variants[0].price)} (shown ${shown})`);
      const vLast = p.variants[p.variants.length - 1];
      await page.locator("#buy button").filter({ has: page.locator(".font-medium", { hasText: vLast.name }) }).first().click();
      for (const g of optionsFor(p.slug, p.category)) await page.locator("#buy button").filter({ hasText: g.choices[g.choices.length - 1].label }).first().click();
      const t = (await page.locator("span.text-3xl.font-bold").first().textContent())?.trim();
      check(t === inr(vLast.price), `${p.slug} ${vLast.name}: shown ${t}, expected ${inr(vLast.price)}`);
    }
    check(await page.locator("#buy a[href*='wa.me'], #buy a:has-text('Personalise this')").count() > 0, `${p.slug}: order / personalise button present`);
    check(await page.locator("a:has-text('Upload your design')").count() > 0, `${p.slug}: upload-your-own-design link`);
    check(await page.locator("text=Same Day Express Delivery in Delhi NCR").count() > 0, `${p.slug}: same-day note`);
    await overflow(page, `/p/${p.slug}`);
  }
  await page.goto(`${BASE}/p/wedding-invitation-cards`, { waitUntil: "networkidle" }); await page.screenshot({ path: `${SHOTS}/wedding-product-config.png` });
  await page.goto(`${BASE}/p/shagun-envelopes`, { waitUntil: "networkidle" }); await page.screenshot({ path: `${SHOTS}/wedding-product-variants.png` });

  // ---------- design studio opens for a configurator product and a variant product
  for (const slug of ["wedding-invitation-cards", "wedding-welcome-boards", "shagun-envelopes", "wedding-thank-you-cards"]) {
    const p = products.find((x) => x.slug === slug)!;
    await page.goto(`${BASE}/design/${slug}?v=${p.variants[0].sku}`, { waitUntil: "networkidle" }); await page.waitForTimeout(1200);
    check(await page.locator("canvas").count() > 0, `/design/${slug}: canvas rendered`);
    const body = await page.locator("body").innerText();
    check(!/Application error|undefined|NaN/.test(body), `/design/${slug}: no error / undefined / NaN text`);
    await page.screenshot({ path: `${SHOTS}/wedding-design-${slug}.png` });
  }

  // ---------- search finds wedding products
  await page.goto(`${BASE}/search?q=shagun`, { waitUntil: "networkidle" });
  check(await page.locator("a[href='/p/shagun-envelopes']").count() > 0, "search: 'shagun' finds Shagun Envelopes");
  await page.goto(`${BASE}/search?q=wedding+card`, { waitUntil: "networkidle" });
  check(await page.locator("a[href='/p/wedding-invitation-cards']").count() > 0, "search: 'wedding card' finds Wedding Invitation Cards");
  const sm = await (await ctx.request.get(`${BASE}/sitemap.xml`)).text();
  check(sm.includes("/c/wedding<") && wedProducts.every((p) => sm.includes(`/p/${p.slug}<`)), "sitemap: wedding landing page and all products");

  // ---------- mobile
  await ctx.close();
  ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); page = await ctx.newPage(); watch(page, "mobile");
  for (const r of ["/", "/c/wedding", "/c/wedding-invitations", "/p/wedding-invitation-cards", "/p/wedding-function-cards", "/p/wedding-card-packages", "/p/table-numbers-place-cards"]) {
    await page.goto(BASE + r, { waitUntil: "networkidle" }); await overflow(page, "mobile " + r);
    await page.screenshot({ path: `${SHOTS}/wedding-m${r.replace(/[\/?=]/g, "_") || "_home"}.png`, fullPage: r === "/c/wedding" });
  }
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.locator("header button[aria-label='Menu']").click(); await page.waitForTimeout(400);
  const mBtn = page.locator("[role=dialog] a[href='/c/wedding']").first();
  check(await mBtn.isVisible() && /bg-rose-600/.test((await mBtn.getAttribute("class")) ?? ""), "mobile menu: highlighted Wedding button");
  for (const c of wedCats) check(await page.locator(`[role=dialog] a[href='/c/${c.slug}']`).count() > 0, `mobile menu: ${c.name}`);
  await mBtn.scrollIntoViewIfNeeded(); await page.screenshot({ path: `${SHOTS}/wedding-m_nav.png` });
  await ctx.close();

  // ---------- admin: catalogue sheet + images
  ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
  const res = await ctx.request.post(`${BASE}/api/admin/login`, { data: { password: PW } });
  const m = (res.headers()["set-cookie"] ?? "").match(/sp_admin=([^;]+)/);
  if (!m) fail.push(`admin login failed (${res.status()}) — start the server with ADMIN_PASSWORD=${PW}`);
  else {
    const before = fs.readFileSync(OVERRIDES, "utf8");
    try {
      await ctx.addCookies([{ name: "sp_admin", value: m[1], domain: "localhost", path: "/" }]);
      page = await ctx.newPage(); watch(page, "admin");
      await page.goto(`${BASE}/admin/pricing`, { waitUntil: "networkidle" });
      for (let i = 0; i < 40; i++) { await page.locator("button:has-text('Option surcharges')").click(); if (await page.locator("th:has-text('Surcharge')").count()) break; await page.waitForTimeout(250); }
      check(await page.locator("td:has-text('Card language'), td:has-text('Premium matte 350 gsm')").count() > 0, "admin: wedding option groups listed under Option surcharges");
      await page.locator("button:has-text('Products (')").click();
      await page.fill("input[placeholder*='Search product']", "WD-SHG-10"); await page.waitForTimeout(400);
      const sec = page.locator("section", { has: page.locator("input[value='WD-SHG-10']") }).first();
      check(await sec.count() === 1, "admin: Shagun Envelopes found in the catalogue sheet");
      check((await sec.locator("input.font-medium").first().inputValue()) === "Shagun Envelopes (Lifafa)", "admin: product name editable");
      const priceInputs = sec.locator("tbody input[inputmode=numeric]");
      check((await priceInputs.nth(0).inputValue()) === "178", `admin: 10 envelopes shows 178 (${await priceInputs.nth(0).inputValue()})`);
      await page.screenshot({ path: `${SHOTS}/wedding-admin-sheet.png` });
      // change a price, publish, confirm it lands in overrides.json
      await priceInputs.nth(0).fill("175");
      await page.locator("button:has-text('Save & publish')").click();
      let saved = false;
      for (let i = 0; i < 40 && !saved; i++) { await page.waitForTimeout(250); const j = JSON.parse(fs.readFileSync(OVERRIDES, "utf8")); saved = j.products?.["shagun-envelopes"]?.variants?.[0]?.price === 175; }
      check(saved, "admin: price change on a wedding product publishes to overrides.json");
      await page.fill("input[placeholder*='Search product']", "WD-INV-CFG"); await page.waitForTimeout(400);
      check(await page.locator("section", { has: page.locator("input[value='WD-INV-CFG']") }).count() === 1, "admin: Wedding Invitation Cards found in the catalogue sheet");
      // categories tab lists the three wedding categories
      const catTab = page.locator("button:has-text('Categories')").first();
      if (await catTab.count()) { await catTab.click(); await page.waitForTimeout(300); for (const c of wedCats) check(await page.locator(`input[value="${c.name.replace(/"/g, '\\"')}"]`).count() > 0, `admin: category ${c.name} editable`); await page.screenshot({ path: `${SHOTS}/wedding-admin-categories.png` }); }
      else fail.push("admin: no Categories tab found");
      await page.goto(`${BASE}/admin/images`, { waitUntil: "networkidle" }); await page.waitForTimeout(600);
      const imgText = await page.locator("body").innerText();
      check(/Wedding/.test(imgText), "admin images: Wedding group listed");
      if (await page.locator("button:has-text('Wedding')").count()) { await page.locator("button:has-text('Wedding')").first().click(); await page.waitForTimeout(300); }
      check(await page.locator("text=Wedding section header photo").count() > 0, "admin images: wedding header photo slot");
      await page.screenshot({ path: `${SHOTS}/wedding-admin-images.png` });
    } finally { fs.writeFileSync(OVERRIDES, before); }
  }
  await browser.close();

  console.log(`\n${passed} checks passed, ${fail.length} failed`);
  for (const f of fail) console.log(" ✗ " + f);
  if (errs.length) { console.log(`\nConsole / page errors (${errs.length}):`); for (const e of [...new Set(errs)].slice(0, 20)) console.log(" - " + e); }
  process.exit(fail.length ? 1 : 0);
})();
