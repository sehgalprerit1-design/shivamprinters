// Admin catalogue sheet flow: login → rename product → add variant → add product → hide product → publish.
// Needs the server started with ADMIN_PASSWORD=<pw> and (locally) ALLOW_LOCAL_PUBLISH=1.
// npx tsx scripts/qa/e2e-admin.ts http://localhost:3000 <password>
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.argv[2] ?? "http://localhost:3000"; const PW = process.argv[3] ?? "qa-test-pass";
const SHOTS = ".qa/shots"; fs.mkdirSync(SHOTS, { recursive: true });
const fail: string[] = []; const check = (c: boolean, m: string) => { if (!c) fail.push(m); };

(async () => {
  const browser = await chromium.launch(); const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
  // login via API, copy cookie without the Secure flag so it works over http
  const res = await ctx.request.post(`${BASE}/api/admin/login`, { data: { password: PW } });
  const setCookie = res.headers()["set-cookie"] ?? ""; const m = setCookie.match(/sp_admin=([^;]+)/);
  if (!m) { console.log("login failed", res.status(), await res.text()); process.exit(1); }
  await ctx.addCookies([{ name: "sp_admin", value: m[1], domain: "localhost", path: "/" }]);
  const page = await ctx.newPage(); const errs: string[] = [];
  page.on("pageerror", (e) => errs.push(e.message.slice(0, 160))); page.on("console", (c) => { if (c.type() === "error") errs.push(c.text().slice(0, 160)); });

  await page.goto(`${BASE}/admin/pricing`, { waitUntil: "networkidle" });
  check((await page.locator("h1").innerText()).includes("Catalogue"), "sheet page loads");
  // wait for hydration: switching tabs only works once React is live
  for (let i = 0; i < 40; i++) { await page.locator("button:has-text('Option surcharges')").click(); if (await page.locator("th:has-text('Surcharge')").count()) break; await page.waitForTimeout(250); }
  await page.locator("button:has-text('Products (')").click();
  const mugSection = () => page.locator("section", { has: page.locator("input[value='GF-MUG-W']") }).first();
  // search + rename the white mug
  await page.fill("input[placeholder*='Search product']", "GF-MUG-W");
  await page.waitForTimeout(300);
  const nameInput = mugSection().locator("input.font-medium").first(); check((await nameInput.inputValue()) === "Coffee Mug (White)", "found mug row");
  await nameInput.fill("Coffee Mug (White) 325 ml");
  // change price + MRP of first variant
  const priceInputs = mugSection().locator("tbody input[inputmode=numeric]"); await priceInputs.nth(0).fill("259"); await priceInputs.nth(1).fill("449");
  // add a variant
  await mugSection().locator("button:has-text('variant')").first().click();
  const rows = mugSection().locator("tbody tr"); check((await rows.count()) === 2, "variant row added (" + (await rows.count()) + ")");
  await rows.nth(1).locator("input").nth(0).fill("Twin pack (2 mugs)"); await rows.nth(1).locator("input").nth(1).fill("GF-MUG-W-TWIN"); await rows.nth(1).locator("input[inputmode=numeric]").nth(0).fill("479"); await rows.nth(1).locator("input[inputmode=numeric]").nth(1).fill("699");
  // open details, hide product? no — keep visible. Instead hide washi tapes
  await page.fill("input[placeholder*='Search product']", "washi"); await page.waitForTimeout(300);
  const washiSection = page.locator("section", { has: page.locator("input[value='AC-WASHI']") }).first();
  await washiSection.locator("tbody button[aria-label='More']").first().click();
  await page.locator("button:has-text('Hide from site')").click();
  check(await page.locator("text=hidden").count() > 0, "washi tapes marked hidden");
  // add a new product in Gifts
  await page.fill("input[placeholder*='Search product']", "");
  const giftsSection = page.locator("section", { has: page.locator("div.font-bold", { hasText: /^Gifts / }) }).first();
  await giftsSection.locator("button:has-text('Add product')").click();
  const form = page.locator("[data-testid=new-product-form]");
  await form.locator("input[placeholder='e.g. Photo Fridge Magnet']").fill("Photo Fridge Magnet Set");
  await form.locator("select").first().selectOption("multi-photo");
  await form.locator("textarea").first().fill("Six 2x2 inch photo magnets printed from your favourite pictures. Fridge-safe, gift-boxed.");
  await form.locator("input[placeholder*='existing image path']").fill("/images/p/photo-magnets.jpg");
  await form.locator("input[placeholder*='Variant name']").first().fill("Set of 6");
  await form.locator("input[placeholder='SKU']").first().fill("GF-MAGSET-6");
  await form.locator("input[placeholder='Price ₹']").first().fill("349");
  await form.locator("input[placeholder='MRP ₹']").first().fill("499");
  await form.locator("button:has-text('Add to sheet')").click();
  await page.waitForTimeout(300);
  check(await page.locator("input[value='Photo Fridge Magnet Set']").count() > 0, "new product row appears");
  const formErr = await page.locator("div.text-brand.text-xs").allInnerTexts(); check(!formErr.some((t) => t.length > 0), "no form error: " + formErr.join(" | "));
  await page.screenshot({ path: `${SHOTS}/admin-sheet.png`, fullPage: false });
  // publish
  await page.locator("button:has-text('Save & publish')").click();
  await page.waitForTimeout(1500);
  const note = await page.locator("main").innerText();
  check(/Saved locally|Published/.test(note), "publish note shown: " + (note.match(/(Saved locally|Published|Could not|Invalid|GitHub)[^\n]{0,120}/)?.[0] ?? "none"));
  const ov = JSON.parse(fs.readFileSync("src/data/overrides.json", "utf8"));
  check(ov.products["coffee-mug-white"]?.name === "Coffee Mug (White) 325 ml", "override: mug renamed");
  check(ov.products["coffee-mug-white"]?.variants?.length === 2 && ov.products["coffee-mug-white"].variants[1].sku === "GF-MUG-W-TWIN", "override: twin variant saved");
  check(ov.products["washi-tapes"]?.hidden === true, "override: washi hidden");
  check(ov.added?.[0]?.slug === "photo-fridge-magnet-set" && ov.added[0].variants[0].price === 349, "override: new product saved");
  console.log(JSON.stringify(ov, null, 1).slice(0, 900));

  // ---- coupons: create, validate, scheduled/expired, delete
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10); const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const mk = async (body: Record<string, unknown>) => { const r = await ctx.request.post(`${BASE}/api/admin/coupons`, { data: body }); return { status: r.status(), json: await r.json() }; };
  const c1 = await mk({ code: "QA15", description: "QA test", kind: "percent", value: 15, maxOff: 200, minOrder: 300, startsAt: null, expiresAt: tomorrow, maxUses: null, showInBanner: false, active: true });
  check(c1.status === 200, "coupon create: " + JSON.stringify(c1.json).slice(0, 120));
  const c2 = await mk({ code: "OLD10", kind: "flat", value: 10, minOrder: 0, startsAt: yesterday, expiresAt: yesterday, showInBanner: false, active: true });
  const c3 = await mk({ code: "SOON20", kind: "percent", value: 20, minOrder: 0, startsAt: tomorrow, expiresAt: null, showInBanner: false, active: true });
  const val = async (code: string, subtotal: number) => (await (await ctx.request.post(`${BASE}/api/coupons/validate`, { data: { code, subtotal } })).json()) as { ok: boolean; message: string; coupon?: { maxOff?: number } };
  const v1 = await val("qa15", 1000); check(v1.ok && v1.coupon?.maxOff === 200, "validate QA15 ok: " + v1.message);
  const v2 = await val("QA15", 200); check(!v2.ok && /minimum/i.test(v2.message), "QA15 min order enforced: " + v2.message);
  const v3 = await val("OLD10", 1000); check(!v3.ok && /expired/i.test(v3.message), "OLD10 expired: " + v3.message);
  const v4 = await val("SOON20", 1000); check(!v4.ok && /starts/i.test(v4.message), "SOON20 scheduled: " + v4.message);
  const v5 = await val("NOPE", 1000); check(!v5.ok, "unknown code rejected");
  // cart UI applies QA15
  await page.goto(`${BASE}/design/name-keychain`, { waitUntil: "networkidle" });
  await page.locator("aside label :is(input,textarea)").first().fill("Aarav"); await page.locator("aside button:has-text('Continue')").first().click(); await page.locator("aside button:has-text('to cart')").first().click(); await page.waitForURL(/\/cart$/);
  await page.locator("main button:has-text('+')").first().click(); await page.locator("main button:has-text('+')").first().click(); // qty 3 → ₹447
  await page.locator("input[placeholder='Coupon code']").fill("qa15"); await page.locator("main form button").first().click(); await page.waitForTimeout(600);
  const cartTxt = await page.locator("main").innerText(); check(cartTxt.includes("QA15") && /−₹67/.test(cartTxt), "cart applied QA15 (15% of 447 = 67): " + (cartTxt.match(/QA15[^\n]*\n[^\n]*/)?.[0] ?? "no"));
  await page.evaluate(() => localStorage.removeItem("shivam-cart"));
  // admin coupons page renders rows
  await page.goto(`${BASE}/admin/coupons`, { waitUntil: "networkidle" });
  const ct = await page.locator("main").innerText(); check(ct.includes("QA15") && ct.includes("Scheduled") && ct.includes("Expired"), "admin coupons page shows statuses");
  for (const j of [c1, c2, c3]) if (j.json?.coupon?.id) await ctx.request.delete(`${BASE}/api/admin/coupons`, { data: { id: j.json.coupon.id } });
  const after = await val("QA15", 1000); check(!after.ok, "QA15 deleted");
  console.log(`\n=== ${fail.length} failures`); for (const f of fail) console.log(" - " + f);
  console.log(`=== errors`); for (const e of [...new Set(errs)]) console.log(" - " + e);
  await browser.close();
})();
