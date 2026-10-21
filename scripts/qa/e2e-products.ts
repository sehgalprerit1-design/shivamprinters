// End-to-end test of every product: product page → editor → cart, with price checks.
// npx tsx scripts/e2e-products.ts http://localhost:3000 [slug-filter]
import { chromium, type Page, type ConsoleMessage } from "playwright";
import { products, type Product } from "../../src/data/catalog";
import { optionsFor, optionDelta, defaultOptions } from "../../src/data/options";

const BASE = process.argv[2] ?? "http://localhost:3000";
const FILTER = process.argv[3];
const IMG = (i: number) => `scripts/qa/img/test${i}.jpg`;
const SHOTS = ".qa/shots";
const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
const fail: string[] = []; const notes: string[] = [];
const consoleErrs = new Map<string, string[]>();
const sample = (s: string, max = 30) => s.repeat(1).slice(0, max);

async function testProduct(page: Page, p: Product, idx: number) {
  const id = p.slug; const errs: string[] = []; consoleErrs.set(id, errs);
  const onConsole = (m: ConsoleMessage) => { if (m.type() === "error" || /hydrat|Warning:/i.test(m.text())) errs.push(m.text().slice(0, 200)); };
  const onErr = (e: Error) => errs.push("pageerror: " + e.message.slice(0, 200));
  page.on("console", onConsole); page.on("pageerror", onErr);
  try {
    // --- product page
    await page.goto(`${BASE}/p/${p.slug}`, { waitUntil: "networkidle" });
    const groups = optionsFor(p.slug, p.category);
    const v0 = p.variants[0]; const d0 = optionDelta(groups, defaultOptions(groups));
    const priceText = await page.locator("span.text-3xl.font-bold").first().textContent();
    if (priceText?.trim() !== inr(v0.price + d0)) fail.push(`${id}: product page price "${priceText}" != ${inr(v0.price + d0)}`);
    // sticky bar/min price sanity: "From ₹x" in title
    const title = await page.title(); const min = Math.min(...p.variants.map((v) => v.price));
    if (!title.includes(`From ${inr(min)}`)) fail.push(`${id}: title "${title}" lacks From ${inr(min)}`);
    // variant + option pick on product page: choose last variant, last choice of each group, qty 2
    const vLast = p.variants[p.variants.length - 1];
    if (p.variants.length > 1) await page.locator("#buy button").filter({ has: page.locator(".font-medium", { hasText: vLast.name }) }).first().click();
    const chosen: Record<string, string> = {};
    for (const g of groups) { const c = g.choices[g.choices.length - 1]; chosen[g.key] = c.id; await page.locator("#buy button").filter({ hasText: c.label }).first().click(); }
    await page.locator("#buy .inline-flex.border.rounded-full button").nth(1).click();
    const expectUnit = vLast.price + optionDelta(groups, chosen);
    const priceText2 = await page.locator("span.text-3xl.font-bold").first().textContent();
    if (priceText2?.trim() !== inr(expectUnit)) fail.push(`${id}: product page price after selection "${priceText2}" != ${inr(expectUnit)}`);
    if (p.personalisation === "none") {
      await page.locator("#buy button:has-text('Add to cart')").first().click();
      await page.waitForTimeout(400);
      const drawer = await page.locator("body").innerText();
      if (!drawer.includes(p.name)) fail.push(`${id}: ready-made add to cart did not show in cart drawer`);
      await page.goto(`${BASE}/cart`, { waitUntil: "networkidle" });
      const ct = await page.locator("main").innerText();
      if (!ct.includes(inr(expectUnit * 2))) fail.push(`${id}: cart line total != ${inr(expectUnit * 2)}`);
      await page.evaluate(() => localStorage.removeItem("shivam-cart"));
      return;
    }
    const href = await page.locator("a:has-text('Personalise this')").first().getAttribute("href");
    if (!href?.startsWith(`/design/${p.slug}?`)) fail.push(`${id}: personalise href ${href}`);
    const qs = new URLSearchParams(href!.split("?")[1]);
    if (qs.get("v") !== vLast.sku || qs.get("qty") !== "2") fail.push(`${id}: personalise link lost selection (${href})`);

    // --- editor
    await page.goto(`${BASE}${href}`, { waitUntil: "networkidle" });
    const n = p.template.photoSlots;
    const eachText = await page.locator("aside .text-sm.text-ink-2").first().textContent();
    if (!eachText?.startsWith(`${inr(expectUnit)} each`)) fail.push(`${id}: editor price line "${eachText}" != ${inr(expectUnit)} each`);
    if (n > 0) {
      const files = Array.from({ length: Math.min(n, 3) }, (_, i) => IMG(i % 4));
      const input = page.locator("input[type=file]").first();
      if (n > 1) await input.setInputFiles(files); else await input.setInputFiles(files[0]);
      await page.waitForFunction((k) => document.body.innerText.includes(`${k}/`), Math.min(n, 3), { timeout: 8000 }).catch(() => fail.push(`${id}: photos did not load`));
      const cont = page.locator("aside button:has-text('Continue')").first();
      if (await cont.isDisabled()) fail.push(`${id}: Continue disabled after adding photos`);
      await cont.click();
    }
    if (p.template.textFields.length) {
      for (const f of p.template.textFields) {
        const loc = page.locator(`aside label:has-text("${f.label.replace(/"/g, '\\"')}") :is(input, textarea)`).first();
        if (!(await loc.count())) { fail.push(`${id}: text field "${f.label}" not found`); continue; }
        await loc.fill(f.key === "start" ? "2027" : f.max <= 4 ? "2027" : `Test ${f.key}`.slice(0, f.max));
      }
      await page.locator("aside button:has-text('Continue')").first().click();
    }
    const addBtn = page.locator("aside button:has-text('to cart')").first();
    await addBtn.waitFor({ timeout: 5000 }).catch(() => fail.push(`${id}: no Add to cart button on review step`));
    const btnText = (await addBtn.textContent().catch(() => "")) ?? "";
    if (!btnText.includes(inr(expectUnit * 2))) fail.push(`${id}: add-to-cart button "${btnText.trim()}" != ${inr(expectUnit * 2)}`);
    if (await addBtn.isDisabled()) fail.push(`${id}: Add to cart disabled (canReview false)`);
    if (idx < 6) { await page.screenshot({ path: `${SHOTS}/editor-${p.slug}.png`, fullPage: false }).catch(() => {}); }
    await addBtn.click();
    await page.waitForURL(/\/cart$/, { timeout: 15000 }).catch(() => fail.push(`${id}: did not navigate to /cart after add`));
    const cartText = await page.locator("main").innerText();
    if (!cartText.includes(p.name)) fail.push(`${id}: cart does not show product name`);
    if (!cartText.includes(inr(expectUnit * 2))) fail.push(`${id}: cart does not show line total ${inr(expectUnit * 2)}`);
    const sub = await page.locator("main aside").innerText();
    if (!sub.includes(`Subtotal (2)`) || !sub.includes(inr(expectUnit * 2))) fail.push(`${id}: cart summary wrong: ${sub.replace(/\n+/g, " | ").slice(0, 120)}`);
    // preview image present?
    const hasPreview = await page.locator("main [style*='data:image']").count();
    if (!hasPreview) notes.push(`${id}: no design preview image in cart`);
    // clear the cart for next product (keep last one for checkout test)
    await page.evaluate(() => localStorage.removeItem("shivam-cart"));
  } catch (e) { fail.push(`${id}: EXCEPTION ${(e as Error).message.split("\n")[0].slice(0, 200)}`); await page.screenshot({ path: `${SHOTS}/fail-${p.slug}.png` }).catch(() => {}); }
  page.off("console", onConsole); page.off("pageerror", onErr);
}

(async () => {
  const fs = await import("node:fs"); fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const list = FILTER ? products.filter((p) => p.slug.includes(FILTER)) : products;
  let i = 0;
  for (const p of list) { await testProduct(page, p, i++); process.stdout.write(`${i}/${list.length} ${p.slug}${fail.some((f) => f.startsWith(p.slug + ":")) ? " FAIL" : ""}\n`); }
  console.log(`\n=== ${fail.length} failures`); for (const f of fail) console.log(" - " + f);
  console.log(`\n=== notes`); for (const n of [...new Set(notes)]) console.log(" - " + n);
  console.log(`\n=== console errors`); for (const [k, v] of consoleErrs) if (v.length) console.log(` - ${k}: ${[...new Set(v)].slice(0, 3).join(" | ")}`);
  await browser.close();
})();
