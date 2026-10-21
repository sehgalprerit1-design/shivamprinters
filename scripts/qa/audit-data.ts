// Static audit of catalog data: run with `npx tsx scripts/audit-data.ts`.
// Reports inconsistencies that would show up as bugs on the storefront.
import fs from "node:fs";
import path from "node:path";
import { products, categories } from "../../src/data/catalog";
import { optionsFor, ALL_OPTION_GROUPS } from "../../src/data/options";
import { giftPages } from "../../src/data/gifts";
import { reviewsFor } from "../../src/data/reviews";
import { redirects } from "../../src/lib/redirects";
import { posts } from "../../src/data/blog";

const issues: string[] = [];
const warn = (s: string) => issues.push(s);
const pub = (p: string) => fs.existsSync(path.join(process.cwd(), "public", p));

// --- slugs / skus
const slugs = new Map<string, number>(); const skus = new Map<string, string[]>();
for (const p of products) {
  slugs.set(p.slug, (slugs.get(p.slug) ?? 0) + 1);
  for (const v of p.variants) skus.set(v.sku, [...(skus.get(v.sku) ?? []), p.slug]);
}
for (const [s, n] of slugs) if (n > 1) warn(`DUP slug ${s} ×${n}`);
for (const [s, ps] of skus) if (ps.length > 1) warn(`DUP sku ${s} in ${ps.join(", ")}`);

// --- categories
const catSlugs = new Set(categories.map((c) => c.slug));
for (const c of categories) { if (!pub(c.image)) warn(`CAT ${c.slug}: image missing ${c.image}`); if (products.filter((p) => p.category === c.slug).length === 0) warn(`CAT ${c.slug}: no products`); }
const orders = categories.map((c) => c.order); if (new Set(orders).size !== orders.length) warn(`CAT order numbers not unique: ${orders.join(",")}`);
const catImages = categories.map((c) => c.image); if (new Set(catImages).size !== catImages.length) warn(`CAT images reused: ${catImages.filter((x, i) => catImages.indexOf(x) !== i).join(", ")}`);

// --- gift tags
const giftTags = new Set(giftPages.flatMap((g) => g.tags));
const tagUse = new Map<string, number>();

for (const p of products) {
  const id = `P ${p.slug}`;
  if (!catSlugs.has(p.category)) warn(`${id}: unknown category ${p.category}`);
  if (!pub(p.image)) warn(`${id}: image missing ${p.image}`);
  for (const im of p.images ?? []) if (!pub(im)) warn(`${id}: gallery image missing ${im}`);
  if (p.images?.includes(p.image)) warn(`${id}: gallery repeats main image`);
  if (p.variants.length === 0) warn(`${id}: no variants`);
  for (const v of p.variants) {
    if (v.compareAt != null && v.compareAt <= v.price) warn(`${id}: ${v.sku} compareAt ${v.compareAt} <= price ${v.price}`);
    if (!Number.isInteger(v.price) || v.price <= 0) warn(`${id}: ${v.sku} bad price ${v.price}`);
    if (!v.name) warn(`${id}: ${v.sku} empty variant name`);
  }
  const t = p.template;
  if (p.personalisation === "text" && t.photoSlots !== 0) warn(`${id}: text-only but photoSlots=${t.photoSlots}`);
  if (p.personalisation === "text" && t.textFields.length === 0) warn(`${id}: text-only but no textFields`);
  if (p.personalisation === "photo" && t.photoSlots !== 1) warn(`${id}: photo kind but photoSlots=${t.photoSlots}`);
  if (p.personalisation === "photo+text" && (t.photoSlots < 1 || t.textFields.length === 0)) warn(`${id}: photo+text but slots=${t.photoSlots} fields=${t.textFields.length}`);
  if (p.personalisation === "multi-photo" && t.photoSlots < 2) warn(`${id}: multi-photo but photoSlots=${t.photoSlots}`);
  if (!(t.aspect > 0.2 && t.aspect <= 5)) warn(`${id}: odd aspect ${t.aspect}`);
  const keys = t.textFields.map((f) => f.key); if (new Set(keys).size !== keys.length) warn(`${id}: duplicate textField keys`);
  if (!p.description || p.description.length < 30) warn(`${id}: short description`);
  if (p.tags.length === 0) warn(`${id}: no tags (won't appear on any gift page)`);
  for (const tag of p.tags) { tagUse.set(tag, (tagUse.get(tag) ?? 0) + 1); if (!giftTags.has(tag)) warn(`${id}: tag "${tag}" has no gift page`); }
  const groups = optionsFor(p.slug, p.category);
  const gk = groups.map((g) => g.key); if (new Set(gk).size !== gk.length) warn(`${id}: duplicate option keys ${gk.join(",")}`);
  const r = reviewsFor(p); if (r.length < 15) warn(`${id}: only ${r.length} reviews`);
  const bodies = r.map((x) => x.body); if (new Set(bodies).size !== bodies.length) warn(`${id}: duplicate review bodies`);
  for (const x of r) if (/\{[a-z]+\}/.test(x.body + x.title)) warn(`${id}: unfilled placeholder in review: ${x.title}`);
  if (p.rating < 3 || p.rating > 5) warn(`${id}: rating ${p.rating}`);
}

// --- gift pages
for (const g of giftPages) {
  const n = products.filter((p) => p.tags.some((t) => g.tags.includes(t))).length;
  if (n === 0) warn(`GIFT ${g.slug}: no products match tags ${g.tags.join(",")}`);
  else if (n < 3) warn(`GIFT ${g.slug}: only ${n} products`);
  if (g.image && !pub(g.image)) warn(`GIFT ${g.slug}: image missing ${g.image}`);
}
const gs = giftPages.map((g) => g.slug); if (new Set(gs).size !== gs.length) warn(`GIFT duplicate slugs`);

// --- options: ids unique, choice ids unique
const gids = ALL_OPTION_GROUPS.map((g) => g.id); if (new Set(gids).size !== gids.length) warn(`OPT duplicate group ids`);
for (const g of ALL_OPTION_GROUPS) { const ids = g.choices.map((c) => c.id); if (new Set(ids).size !== ids.length) warn(`OPT ${g.id}: duplicate choice ids`); }

// --- redirects: destinations exist
const known = new Set<string>(["/products", "/about", "/about#promise", "/careers", "/terms", "/refer", "/blog"]);
for (const p of products) known.add(`/p/${p.slug}`); for (const c of categories) known.add(`/c/${c.slug}`); for (const g of giftPages) known.add(`/gifts/${g.slug}`);
const srcs = new Map<string, number>();
for (const r of redirects) { if (!known.has(r.destination)) warn(`REDIRECT ${r.source} → ${r.destination} (unknown destination)`); srcs.set(r.source, (srcs.get(r.source) ?? 0) + 1); }
for (const [s, n] of srcs) if (n > 1) warn(`REDIRECT duplicate source ${s} ×${n}`);
for (const r of redirects) if (known.has(r.source)) warn(`REDIRECT source ${r.source} is itself a live page (loop)`);

// --- blog
for (const b of posts) if (!b.body?.length) warn(`BLOG ${b.slug}: empty body`);

// --- unused public images
const used = new Set<string>([...products.map((p) => p.image), ...products.flatMap((p) => p.images ?? []), ...categories.map((c) => c.image), ...giftPages.map((g) => g.image ?? "")]);
const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const unused = walk("public/images").map((f) => "/" + path.relative("public", f)).filter((f) => !used.has(f));

console.log(`Products: ${products.length}, categories: ${categories.length}, gift pages: ${giftPages.length}, redirects: ${redirects.length}`);
console.log(`Tags used: ${[...tagUse.entries()].sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t}:${n}`).join(" ")}`);
console.log(`\n${issues.length} issues:`); for (const i of issues) console.log(" - " + i);
console.log(`\nUnused images (${unused.length}): ${unused.join(", ")}`);
