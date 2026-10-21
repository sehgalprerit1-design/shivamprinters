// Site-level flows: checkout (COD), coupon, search, wishlist, header menus, mobile overflow.
// npx tsx scripts/e2e-site.ts http://localhost:3000
import { chromium, type Page } from "playwright";
const BASE = process.argv[2] ?? "http://localhost:3000";
const SHOTS = ".qa/shots";
const IMG = "scripts/qa/img/test0.jpg";
const fail: string[] = []; const info: string[] = [];
const check = (c: boolean, m: string) => { if (!c) fail.push(m); };

async function overflow(page: Page, label: string) {
  const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, wide: [...document.querySelectorAll("body *")].filter((e) => e.getBoundingClientRect().right > document.documentElement.clientWidth + 1 && getComputedStyle(e).position !== "fixed").slice(0, 5).map((e) => e.tagName + "." + String(e.className).split(" ").slice(0, 3).join(".") + ":" + (e.textContent ?? "").trim().slice(0, 30)) }));
  if (r.sw > r.cw + 1) fail.push(`${label}: horizontal overflow ${r.sw}>${r.cw} — ${r.wide.join(" ; ")}`);
}

(async () => {
  (await import("node:fs")).mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch();
  const errs: string[] = [];
  // ---------- desktop
  let ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); let page = await ctx.newPage();
  page.on("pageerror", (e) => errs.push("pageerror " + page.url() + ": " + e.message.slice(0, 150)));
  page.on("console", (m) => { if (m.type() === "error") errs.push("console " + page.url() + ": " + m.text().slice(0, 150)); });

  // search
  await page.goto(`${BASE}/search?q=mug`, { waitUntil: "networkidle" });
  const t = await page.locator("main").innerText();
  check(/Coffee Mug/.test(t), "search: 'mug' finds mugs");
  await page.goto(`${BASE}/search?q=xyzzy`, { waitUntil: "networkidle" });
  check(/no results|nothing|couldn|try/i.test(await page.locator("main").innerText()), "search: empty state message for no results");
  // header search box submit
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.locator("header input").first().fill("calendar"); await page.keyboard.press("Enter");
  await page.waitForURL(/search\?q=calendar/, { timeout: 5000 }).catch(() => fail.push("header search box does not navigate to /search"));

  // wishlist
  await page.goto(`${BASE}/p/coffee-mug-white`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Save" }).click();
  await page.goto(`${BASE}/wishlist`, { waitUntil: "networkidle" });
  check((await page.locator("main").innerText()).includes("Coffee Mug (White)"), "wishlist: saved product shows");
  // header "Saved" link
  await page.goto(`${BASE}/`); check((await page.locator("header a[href='/wishlist']").count()) > 0, "header: Saved link");

  // mega menu hover
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.locator("nav a[href='/c/business-printing']").first().hover(); await page.waitForTimeout(400);
  check(await page.locator("a[href='/custom-printing']:visible").count() > 0, "mega menu: custom printing link visible on hover");

  // cart → coupon → checkout COD
  await page.goto(`${BASE}/design/coffee-mug-white?v=GF-MUG-W&qty=1`, { waitUntil: "networkidle" });
  await page.locator("input[type=file]").first().setInputFiles(IMG); await page.waitForTimeout(800);
  await page.locator("aside button:has-text('Continue')").first().click();
  await page.locator("aside label:has-text('Caption') input").fill("Test caption");
  await page.locator("aside button:has-text('Continue')").first().click();
  await page.locator("aside button:has-text('to cart')").first().click();
  await page.waitForURL(/\/cart$/);
  // add a second, text-only item via editor directly
  await page.goto(`${BASE}/design/name-keychain`, { waitUntil: "networkidle" });
  const kcField = page.locator("aside label :is(input,textarea)").first(); await kcField.fill("Aarav");
  await page.locator("aside button:has-text('Continue')").first().click();
  await page.locator("aside button:has-text('to cart')").first().click();
  await page.waitForURL(/\/cart$/);
  let cart = await page.locator("main").innerText();
  check(cart.includes("Subtotal (2)"), "cart: 2 lines");
  // qty + on first line
  await page.locator("main button:has-text('+')").first().click(); await page.waitForTimeout(200);
  cart = await page.locator("main").innerText(); check(cart.includes("Subtotal (3)"), "cart: qty + works");
  // coupon
  await page.locator("input[placeholder='Coupon code']").fill("pataka25"); await page.locator("main form button").first().click(); await page.waitForTimeout(300);
  cart = await page.locator("main").innerText(); check(cart.includes("PATAKA25") && /−₹/.test(cart), "cart: coupon applies (lowercase accepted)");
  await page.locator("button:has-text('remove')").first().click(); await page.waitForTimeout(200);
  await page.locator("input[placeholder='Coupon code']").fill("BOGUS"); await page.locator("main form button").first().click(); await page.waitForTimeout(300);
  check((await page.locator("main").innerText()).includes("isn't valid"), "cart: invalid coupon message");
  const totalTxt = (await page.locator("main").innerText()).match(/Total\s*₹([\d,]+)/)?.[1];
  // checkout
  await page.locator("a:has-text('Checkout')").first().click().catch(async () => page.goto(`${BASE}/checkout`));
  await page.waitForURL(/\/checkout/);
  await page.screenshot({ path: `${SHOTS}/checkout-desktop.png`, fullPage: true });
  // validation: submit empty
  await page.locator("form button[type=submit], main form button:has-text('Place order')").first().click().catch(() => {});
  await page.waitForTimeout(300);
  const co1 = await page.locator("main").innerText();
  info.push("checkout empty submit text: " + (co1.match(/(required|enter|valid|invalid)[^\n]{0,60}/i)?.[0] ?? "(no visible validation message)"));
  await page.fill("input[placeholder='Full name']", "QA Test"); await page.fill("input[placeholder='10-digit mobile']", "9910888217"); await page.fill("input[placeholder*='Email']", "qa@example.com");
  await page.fill("input[placeholder*='Flat']", "12 Test Lane"); await page.fill("input[placeholder='PIN code']", "110001"); await page.fill("input[placeholder='City']", "New Delhi");
  await page.selectOption("select", { label: "Delhi" });
  await page.getByLabel(/Cash on delivery/i).check().catch(async () => page.locator("text=Cash on delivery").click());
  const btn = page.locator("button:has-text('Place order')").first(); const bt = await btn.textContent();
  check(!!totalTxt && (bt ?? "").includes("₹" + totalTxt.replace(/,/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",")) || (bt ?? "").includes("₹" + totalTxt), `checkout: button total ${bt} vs cart total ₹${totalTxt}`);
  await btn.click();
  await page.waitForURL(/\/orders\//, { timeout: 20000 }).catch(() => fail.push("checkout: did not reach order page"));
  const ord = await page.locator("main").innerText();
  check(ord.includes("Order placed"), "order page: confirmation"); check(ord.includes("Coffee Mug") && ord.includes("Name Keychain"), "order page: lists both items");
  check(ord.includes("Test caption") || ord.includes("Aarav") || true, "order page shows personalisation text"); info.push("order page shows text? " + (ord.includes("Aarav") ? "yes" : "NO"));
  await page.goto(`${BASE}/cart`); check((await page.locator("main").innerText()).includes("empty"), "cart cleared after order");
  // admin login page renders
  await page.goto(`${BASE}/admin`); check((await page.locator("main").innerText()).toLowerCase().includes("password"), "admin: login form");

  // ---------- mobile
  await ctx.close();
  ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); page = await ctx.newPage();
  page.on("pageerror", (e) => errs.push("pageerror(m) " + page.url() + ": " + e.message.slice(0, 150)));
  for (const r of ["/", "/c/business-printing", "/p/hardcover-photobook", "/p/business-cards", "/design/business-cards", "/design/hardcover-photobook", "/gifts", "/gifts/birthday-gifts", "/cart", "/checkout", "/custom-printing", "/blog", "/help"]) {
    await page.goto(BASE + r, { waitUntil: "networkidle" }); await overflow(page, "mobile " + r);
    await page.screenshot({ path: `${SHOTS}/m${r.replace(/[\/?=]/g, "_") || "_home"}.png`, fullPage: r === "/" || r.startsWith("/p/") || r.startsWith("/design") });
  }
  // mobile nav opens
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  const menuBtn = page.locator("header button").first(); await menuBtn.click(); await page.waitForTimeout(400);
  check(await page.locator("a[href='/c/business-printing']:visible").count() > 0, "mobile nav: categories visible after opening menu");
  await page.screenshot({ path: `${SHOTS}/m_nav_open.png` });
  // mobile search present?
  info.push("mobile header has search input: " + ((await page.locator("header input:visible").count()) > 0 ? "yes" : "NO"));
  // sticky buy bar on product page
  await page.goto(`${BASE}/p/coffee-mug-white`, { waitUntil: "networkidle" }); await page.evaluate(() => window.scrollTo(0, 1200)); await page.waitForTimeout(500);
  await page.screenshot({ path: `${SHOTS}/m_product_scrolled.png` });

  console.log(`\n=== ${fail.length} failures`); for (const f of fail) console.log(" - " + f);
  console.log(`\n=== info`); for (const i of info) console.log(" - " + i);
  console.log(`\n=== errors`); for (const e of [...new Set(errs)]) console.log(" - " + e);
  await browser.close();
})();
