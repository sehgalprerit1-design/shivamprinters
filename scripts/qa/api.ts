// Backend/API tests against a running server (no browser). Covers validation, auth and happy paths.
// npx tsx scripts/qa/api.ts http://localhost:3000 [admin-password]
import { products, categories } from "../../src/data/catalog";
const BASE = process.argv[2] ?? "http://localhost:3000"; const PW = process.argv[3] ?? "qa-test-pass";
const fail: string[] = []; const ok = (c: boolean, m: string) => { if (!c) fail.push(m); };
const j = async (r: Response) => ({ status: r.status, body: await r.json().catch(() => ({})) as Record<string, unknown> });
const post = (p: string, body: unknown, headers: Record<string, string> = {}) => fetch(BASE + p, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) }).then(j);
const get = (p: string, headers: Record<string, string> = {}) => fetch(BASE + p, { headers }).then(j);
const addr = { name: "QA Api", phone: "9910888217", email: "qa@example.com", line1: "1 Test Road", city: "New Delhi", state: "Delhi", pincode: "110001" };
const mug = products.find((p) => p.slug === "coffee-mug-white")!;

(async () => {
  // health
  const h = await get("/api/health"); ok(h.status === 200 && h.body.ok === true, "health ok");
  // search page (server-rendered)
  const s = await fetch(`${BASE}/search?q=mug`); ok(s.status === 200 && (await s.text()).includes("Coffee Mug"), "search page finds mugs");
  // upload presign (storage off locally → url null, still a key)
  const up = await post("/api/upload", { filename: "a.jpg", mime: "image/jpeg", bytes: 1000 }); ok(up.status === 200 && typeof up.body.key === "string", "upload presign returns key");
  const upBad = await post("/api/upload", { filename: "a.exe", mime: "application/x-msdownload", bytes: 1000 }); ok(upBad.status === 400, "upload rejects non-image");
  const upBig = await post("/api/upload", { filename: "a.jpg", mime: "image/jpeg", bytes: 50 * 1024 * 1024 }); ok(upBig.status === 400, "upload rejects >40MB");
  const pdf = await post("/api/upload", { filename: "art.pdf", mime: "application/pdf", bytes: 1000 }); ok(pdf.status === 200, "upload accepts PDF (enquiry artwork)");
  const badUrl = await get("/api/upload/url?key=../../etc/passwd"); ok(badUrl.status === 400, "upload/url rejects bad key");
  const badImg = await get("/api/img?key=foo"); ok(badImg.status === 400, "img rejects bad key");

  // orders: validation
  const o0 = await post("/api/orders", {}); ok(o0.status === 400, "order: empty body rejected");
  const o1 = await post("/api/orders", { address: { ...addr, phone: "123" }, lines: [{ productSlug: mug.slug, variantSku: mug.variants[0].sku, qty: 1 }], shipMethod: "economy", paymentMethod: "COD" }); ok(o1.status === 400, "order: bad phone rejected");
  const o2 = await post("/api/orders", { address: addr, lines: [{ productSlug: "nope", variantSku: "X", qty: 1 }], shipMethod: "economy", paymentMethod: "COD" }); ok(o2.status === 400 && /Unknown item/.test(String(o2.body.error)), "order: unknown product rejected");
  const o3 = await post("/api/orders", { address: addr, lines: [{ productSlug: mug.slug, variantSku: mug.variants[0].sku, qty: 1 }], shipMethod: "economy", paymentMethod: "RAZORPAY" }); ok(o3.status === 400 && /Cash on delivery/.test(String(o3.body.error)), "order: online payment refused when Razorpay not configured");
  const o4 = await post("/api/orders", { address: addr, lines: [{ productSlug: mug.slug, variantSku: mug.variants[0].sku, qty: 100 }], shipMethod: "economy", paymentMethod: "COD" }); ok(o4.status === 400, "order: qty > 99 rejected");
  // orders: happy path with options + coupon + express shipping; price must be server-computed
  const o5 = await post("/api/orders", { address: addr, lines: [{ productSlug: mug.slug, variantSku: mug.variants[0].sku, qty: 2, design: { options: { handle: "wrap" }, text: { caption: "hi" }, photoCount: 1 } }, { productSlug: "executive-leather-diary", variantSku: "EX-GEN-A5", qty: 1, design: { options: { emboss: "gold", colour: "brown", paper: "ruled" } } }], coupon: "pataka25", shipMethod: "express", paymentMethod: "COD" });
  ok(o5.status === 200 && typeof o5.body.orderId === "string", "order: COD created " + JSON.stringify(o5.body).slice(0, 120));
  const expectedSub = mug.variants[0].price * 2 + (1899 + 100); const expectedDisc = Math.min(Math.round(expectedSub * 0.25), 1000); const expectedTotal = expectedSub - expectedDisc + 149;
  ok(o5.body.total === expectedTotal, `order: server total ${o5.body.total} == expected ${expectedTotal} (subtotal ${expectedSub}, discount ${expectedDisc}, express 149)`);
  // tampered unit price is ignored (client can't set price)
  const o6 = await post("/api/orders", { address: addr, lines: [{ productSlug: mug.slug, variantSku: mug.variants[0].sku, qty: 1, unitPrice: 1 }], shipMethod: "economy", paymentMethod: "COD" }); ok(o6.status === 200 && o6.body.total === mug.variants[0].price + 79, "order: client-sent price ignored");
  // order page + lookup
  const page = await fetch(`${BASE}/orders/${o5.body.orderId}`); ok(page.status === 200 && (await page.text()).includes("Order #"), "order page renders");
  const lk1 = await post("/api/orders/lookup", { number: o5.body.number, phone: "9910888217" }); ok(lk1.status === 200 && lk1.body.id === o5.body.orderId, "lookup: number+phone finds order");
  const lk2 = await post("/api/orders/lookup", { number: o5.body.number, phone: "9999999999" }); ok(lk2.status === 404, "lookup: wrong phone rejected");
  const lk3 = await post("/api/orders/lookup", { number: "abc", phone: "99" }); ok(lk3.status === 400, "lookup: bad input rejected");
  const conf = await post(`/api/orders/${o5.body.orderId}/confirm`, { razorpay_order_id: "x", razorpay_payment_id: "y", razorpay_signature: "z" }); ok(conf.status === 400, "confirm: bad signature rejected");

  // enquiry
  const e0 = await post("/api/enquiry", { name: "A", phone: "1", message: "x" }); ok(e0.status === 400, "enquiry: validation");
  const e1 = await post("/api/enquiry", { name: "QA Bot", phone: "9910888217", email: "", company: "", kind: "Letterheads & envelopes", quantity: "500", deadline: "", message: "API test enquiry — ignore", website: "" }); ok(e1.status === 200 && e1.body.ok === true, "enquiry: created");
  const e2 = await post("/api/enquiry", { name: "Spam Bot", phone: "9910888217", kind: "Something else", message: "spam spam spam", website: "http://spam" }); ok(e2.status === 200 && e2.body.ok === true && !e2.body.id, "enquiry: honeypot silently dropped");

  // reviews
  const r0 = await post("/api/reviews", { productSlug: mug.slug, author: "Q", rating: 7, title: "x", body: "short" }); ok(r0.status === 400, "review: validation");
  const r1 = await post("/api/reviews", { productSlug: mug.slug, author: "QA Reviewer", city: "Delhi", rating: 5, title: "API review", body: "Posted by the API test suite, please ignore.", website: "" }); ok(r1.status === 200, "review: created (pending approval)");
  const r2 = await get(`/api/reviews?product=${mug.slug}`); ok(r2.status === 200 && Array.isArray(r2.body.reviews) && !(r2.body.reviews as unknown[]).some((x) => (x as { title: string }).title === "API review"), "review: unapproved review not public");
  const r3 = await post("/api/reviews", { productSlug: "nope", author: "QA", rating: 5, title: "x y", body: "0123456789abc" }); ok(r3.status === 400, "review: unknown product rejected");

  // offers sign-up (footer)
  const s1 = await post("/api/subscribe", { contact: "qa-sub@example.com" }); ok(s1.status === 200 && s1.body.ok === true && s1.body.channel === "email", "subscribe: email accepted");
  const s2 = await post("/api/subscribe", { contact: "abc" }); ok(s2.status === 400, "subscribe: junk rejected");
  const s3 = await post("/api/subscribe", { contact: "9876543210", website: "http://spam" }); ok(s3.status === 200 && s3.body.ok === true, "subscribe: honeypot pretends success");
  // group landing pages + grouped breadcrumbs
  const photo = await (await fetch(`${BASE}/c/photo`)).text(); ok(photo.includes("Photobooks") && photo.includes("Framed Prints") && photo.includes("Photo Prints"), "/c/photo lists its three sub-categories");
  const biz = await (await fetch(`${BASE}/c/business-printing`)).text(); ok(biz.includes("Bags &amp; Stationery") && biz.includes("Custom printing"), "/c/business-printing includes Bags & Stationery");
  const bags = await (await fetch(`${BASE}/c/bags-stationery`)).text(); ok(/Breadcrumb[\s\S]*Business Printing[\s\S]*Bags &amp; Stationery/.test(bags), "/c/bags-stationery breadcrumb goes through Business Printing");
  const pb = await (await fetch(`${BASE}/c/photobooks`)).text(); ok(/Breadcrumb[\s\S]*href="\/c\/photo"/.test(pb), "/c/photobooks breadcrumb goes through Photo");

  // coupons validate
  const c1 = await post("/api/coupons/validate", { code: "pataka25", subtotal: 2000 }); ok(c1.status === 200 && c1.body.ok === true, "coupon: PATAKA25 valid");
  const c2 = await post("/api/coupons/validate", { code: "NOPE", subtotal: 2000 }); ok(c2.body.ok === false, "coupon: unknown rejected");

  // admin auth
  for (const p of ["/api/admin/pricing", "/api/admin/coupons", "/api/admin/customers", "/api/admin/reviews", "/api/admin/enquiries", "/api/admin/orders/x"]) {
    const m = p.endsWith("/x") || p.endsWith("reviews") || p.endsWith("enquiries") ? "PATCH" : "GET";
    const r = await fetch(BASE + p, { method: m, headers: { "content-type": "application/json" }, body: m === "PATCH" ? "{}" : undefined }); ok(r.status === 401, `admin ${m} ${p} requires login (got ${r.status})`);
  }
  const wrong = await post("/api/admin/login", { password: "wrong" }); ok(wrong.status === 401, "admin: wrong password rejected");
  const login = await fetch(`${BASE}/api/admin/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: PW }) });
  const cookie = (login.headers.get("set-cookie") ?? "").split(";")[0]; ok(login.status === 200 && cookie.startsWith("sp_admin="), "admin: login sets cookie");
  const H = { cookie };
  const adminOrders = await fetch(`${BASE}/admin`, { headers: H }); ok(adminOrders.status === 200 && (await adminOrders.text()).includes("QA Api"), "admin: orders page lists the new order");
  const st = await fetch(`${BASE}/api/admin/orders/${o5.body.orderId}`, { method: "PATCH", headers: { ...H, "content-type": "application/json" }, body: JSON.stringify({ status: "CANCELLED" }) }); ok(st.status === 200, "admin: order status update");
  const after = await fetch(`${BASE}/orders/${o5.body.orderId}`); ok((await after.text()).toLowerCase().includes("cancelled"), "order page reflects CANCELLED");
  const cat = await get("/api/admin/pricing", H); ok(cat.status === 200 && Array.isArray(cat.body.products) && (cat.body.products as unknown[]).length >= products.length, "admin: catalogue state includes all products");
  const enq = await fetch(`${BASE}/admin/enquiries`, { headers: H }); ok((await enq.text()).includes("API test enquiry"), "admin: enquiry listed");
  const rev = await fetch(`${BASE}/admin/reviews`, { headers: H }); ok((await rev.text()).includes("API review"), "admin: review listed for moderation");
  // customers: order + enquiry with the same phone merge into one row; sign-up is its own row; honeypot row absent
  const cus = await get("/api/admin/customers", H); const list = (cus.body.customers ?? []) as { id: string; phone: string | null; email: string | null; name: string | null; source: string; ordersCount: number; totalSpent: number; marketingOptIn: boolean }[];
  const qa = list.filter((c) => c.phone === "9910888217"); ok(qa.length === 1, `customers: one row for the QA phone (got ${qa.length})`);
  ok(qa[0]?.email === "qa@example.com" && qa[0]?.ordersCount >= 2 && qa[0]?.totalSpent > 0, "customers: QA row has email, order count and spend " + JSON.stringify(qa[0]).slice(0, 160));
  ok(list.some((c) => c.email === "qa-sub@example.com" && c.source === "newsletter" && c.marketingOptIn), "customers: footer sign-up recorded with opt-in");
  ok(!list.some((c) => c.phone === "9876543210"), "customers: honeypot sign-up not recorded");
  const csv = await fetch(`${BASE}/api/admin/customers?format=csv&optin=1`, { headers: H }); ok(csv.status === 200 && (csv.headers.get("content-type") ?? "").includes("text/csv") && (await csv.text()).includes("qa-sub@example.com"), "customers: opted-in CSV downloads");
  if (qa[0]) { const pt = await fetch(`${BASE}/api/admin/customers`, { method: "PATCH", headers: { ...H, "content-type": "application/json" }, body: JSON.stringify({ id: qa[0].id, marketingOptIn: false }) }); ok(pt.status === 200, "customers: opt-out toggle"); const again = await get("/api/admin/customers", H); ok(((again.body.customers ?? []) as typeof list).find((c) => c.id === qa[0].id)?.marketingOptIn === false, "customers: opt-out persisted"); }
  const cpage = await fetch(`${BASE}/admin/customers`, { headers: H }); ok(cpage.status === 200 && (await cpage.text()).includes("QA Api"), "admin: customers page lists the buyer");
  // sitemap / robots include everything
  const sm = await (await fetch(`${BASE}/sitemap.xml`)).text(); ok(sm.includes("/c/photo<"), "sitemap has /c/photo"); for (const p of products) if (!sm.includes(`/p/${p.slug}<`)) fail.push(`sitemap missing /p/${p.slug}`); for (const c of categories) if (!sm.includes(`/c/${c.slug}<`)) fail.push(`sitemap missing /c/${c.slug}`);
  const rb = await (await fetch(`${BASE}/robots.txt`)).text(); ok(/Disallow: \/admin|Disallow: \/api/.test(rb) || rb.includes("/api/"), "robots has disallows");
  ok(/Disallow: \/admin/.test(rb), "robots disallows /admin");

  console.log(`\n=== ${fail.length} failures`); for (const f of fail) console.log(" - " + f);
})();
