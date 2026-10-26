// Catalogue & pricing sheet: reads the effective catalogue, and publishes admin changes as a
// minimal diff to src/data/overrides.json. In production the file is committed to GitHub
// (Vercel rebuilds, ~2–3 min); in local dev it is written to disk directly.
import { z } from "zod";
import { base, categories, allProductsIncludingHidden, type Product } from "@/data/catalog";
import { ALL_OPTION_GROUPS } from "@/data/options";
import { OverridesZ, VariantZ, TemplateZ, KindZ, type Overrides } from "@/data/overrides-schema";

export const ASPECT_PRESETS: [string, number][] = [["Square (1:1)", 1], ["Landscape 4:3", 1.333], ["Landscape 3:2", 1.5], ["Wide 2:1", 2], ["Banner 3:1", 3], ["Portrait 3:4", 0.75], ["Portrait 2:3", 0.667], ["A4 portrait", 0.707], ["Business card", 1.75], ["Mug wrap", 2.4]];

const CategoryRowZ = z.object({ slug: z.string(), name: z.string().trim().min(2).max(40), tagline: z.string().trim().max(60), description: z.string().trim().max(400), image: z.string().trim().max(400) });
const ProductRowZ = z.object({
  slug: z.string().trim().min(2).max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Product slug must be lowercase-with-dashes"),
  added: z.boolean().optional(), deleted: z.boolean().optional(), hidden: z.boolean().optional(),
  category: z.string(), name: z.string().trim().min(2).max(80), description: z.string().trim().min(10).max(1000),
  image: z.string().trim().min(1).max(400), images: z.array(z.string().trim().min(1).max(400)).max(6).optional(),
  badges: z.array(z.string().trim().min(1).max(20)).max(3).optional(), tags: z.array(z.string().trim().min(1).max(30)).max(20),
  personalisation: KindZ, template: TemplateZ, variants: z.array(VariantZ).min(1).max(30),
});
export const CatalogueStateZ = z.object({ categories: z.array(CategoryRowZ), products: z.array(ProductRowZ), options: z.record(z.string(), z.number().int().min(-100_000).max(100_000)) });
export type CatalogueState = z.infer<typeof CatalogueStateZ>;

/** Everything the sheet needs, as it currently is (code + overrides). */
export function catalogueState(): CatalogueState & { baseSlugs: string[]; optionGroups: { key: string; group: string; groupId: string; name: string; delta: number }[]; aspectPresets: [string, number][] } {
  const prods = allProductsIncludingHidden();
  return {
    categories: categories.map((c) => ({ slug: c.slug, name: c.name, tagline: c.tagline, description: c.description, image: c.image })),
    products: prods.map((p) => ({ slug: p.slug, added: !!p.added, hidden: !!p.hidden, category: p.category, name: p.name, description: p.description, image: p.image, images: p.images, badges: p.badges, tags: p.tags, personalisation: p.personalisation, template: p.template, variants: p.variants.map((v) => ({ sku: v.sku, name: v.name, price: v.price, compareAt: v.compareAt ?? null })) })),
    options: Object.fromEntries(ALL_OPTION_GROUPS.flatMap((g) => g.choices.map((c) => [`${g.id}:${c.id}`, c.delta ?? 0]))),
    baseSlugs: base.products.map((p) => p.slug),
    optionGroups: ALL_OPTION_GROUPS.flatMap((g) => g.choices.map((c) => ({ key: `${g.id}:${c.id}`, group: g.label, groupId: g.id, name: c.label, delta: c.delta ?? 0 }))),
    aspectPresets: ASPECT_PRESETS,
  };
}

const sameVariants = (a: { sku: string; name: string; price: number; compareAt?: number | null }[], b: { sku: string; name: string; price: number; compareAt?: number | null }[]) =>
  a.length === b.length && a.every((v, i) => v.sku === b[i].sku && v.name === b[i].name && v.price === b[i].price && (v.compareAt ?? null) === (b[i].compareAt ?? null));
const sameList = (a?: string[], b?: string[]) => JSON.stringify(a ?? []) === JSON.stringify(b ?? []);

/** Turn the full sheet state into a minimal overrides file, validating as we go. */
export function buildOverrides(state: CatalogueState): Overrides {
  const errors: string[] = [];
  const catSlugs = new Set(state.categories.map((c) => c.slug));
  const slugs = new Map<string, number>(); const skus = new Map<string, string>();
  for (const p of state.products) {
    if (p.deleted) continue;
    slugs.set(p.slug, (slugs.get(p.slug) ?? 0) + 1);
    if (!catSlugs.has(p.category)) errors.push(`${p.name}: unknown category ${p.category}`);
    for (const v of p.variants) { if (skus.has(v.sku)) errors.push(`SKU ${v.sku} is used by both "${skus.get(v.sku)}" and "${p.name}"`); skus.set(v.sku, p.name); if (v.compareAt != null && v.compareAt < v.price) errors.push(`${p.name} — ${v.name}: MRP below price`); }
  }
  for (const [s, n] of slugs) if (n > 1) errors.push(`Two products share the slug ${s}`);
  if (errors.length) throw new Error(errors.slice(0, 5).join(" · "));

  const ov: Overrides = { categories: {}, products: {}, added: [], options: {} };
  for (const c of state.categories) {
    const b = base.categories.find((x) => x.slug === c.slug); if (!b) continue;
    const patch: Record<string, string> = {};
    for (const k of ["name", "tagline", "description", "image"] as const) if (c[k] !== b[k]) patch[k] = c[k];
    if (Object.keys(patch).length) ov.categories[c.slug] = patch;
  }
  for (const p of state.products) {
    const b = base.products.find((x) => x.slug === p.slug);
    if (!b) { if (!p.deleted) ov.added.push({ slug: p.slug, category: p.category, name: p.name, description: p.description, image: p.image, images: p.images, badges: p.badges, personalisation: p.personalisation, template: p.template, variants: p.variants, tags: p.tags, hidden: p.hidden || undefined }); continue; }
    const patch: NonNullable<Overrides["products"][string]> = {};
    if (p.name !== b.name) patch.name = p.name; if (p.description !== b.description) patch.description = p.description; if (p.category !== b.category) patch.category = p.category; if (p.image !== b.image) patch.image = p.image;
    if (!sameList(p.badges, b.badges)) patch.badges = p.badges ?? []; if (!sameList(p.tags, b.tags)) patch.tags = p.tags;
    if (!sameList(p.images, b.images)) patch.images = p.images ?? [];
    if (p.hidden || p.deleted) patch.hidden = true;
    if (!sameVariants(p.variants, b.variants)) patch.variants = p.variants.map((v) => ({ sku: v.sku, name: v.name, price: v.price, compareAt: v.compareAt ?? null }));
    if (Object.keys(patch).length) ov.products[p.slug] = patch;
  }
  const baseOpt = Object.fromEntries(ALL_OPTION_GROUPS.flatMap((g) => g.choices.map((c) => [`${g.id}:${c.id}`, c.delta ?? 0])));
  for (const [k, v] of Object.entries(state.options)) if (k in baseOpt && v !== baseOpt[k]) ov.options[k] = v;
  return OverridesZ.parse(ov);
}

const OWNER_REPO = process.env.GITHUB_REPO ?? "sehgalprerit1-design/shivamprinters";
const BRANCH = process.env.GITHUB_BRANCH ?? "main";
const PATH = "src/data/overrides.json";
const token = () => (process.env.GITHUB_TOKEN ?? "").trim() || undefined;
export const publishMode = (): "github" | "local" | "none" => (token() ? "github" : process.env.NODE_ENV === "development" || process.env.ALLOW_LOCAL_PUBLISH ? "local" : "none");

/** Commit one JSON data file to the site repo (or write it locally in dev). Shared by the catalogue sheet and /admin/images. */
export async function publishDataFile(filePath: string, body: string, message: string) {
  const mode = publishMode();
  if (mode === "local") {
    const fs = await import("node:fs/promises"); const path = await import("node:path");
    // Literal paths keep Next's file tracer from pulling the whole repo into the server bundle.
    if (filePath === "src/data/overrides.json") await fs.writeFile(path.join(process.cwd(), "src/data/overrides.json"), body, "utf8");
    else if (filePath === "src/data/site-image-overrides.json") await fs.writeFile(path.join(process.cwd(), "src/data/site-image-overrides.json"), body, "utf8");
    else throw new Error(`Unknown data file ${filePath}`);
    return { mode, note: "Saved locally; restart the dev server to see the changes." };
  }
  if (mode === "none") throw new Error("Publishing is not configured: add a GITHUB_TOKEN (fine-grained, Contents: read & write on the site repo) in Vercel.");
  const h = { Authorization: `Bearer ${token()}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "content-type": "application/json" };
  const url = `https://api.github.com/repos/${OWNER_REPO}/contents/${filePath}`;
  const cur = await fetch(`${url}?ref=${BRANCH}`, { headers: h, cache: "no-store" });
  const sha = cur.ok ? ((await cur.json()) as { sha: string }).sha : undefined;
  const put = await fetch(url, { method: "PUT", headers: h, body: JSON.stringify({ message, content: Buffer.from(body).toString("base64"), sha, branch: BRANCH }) });
  if (!put.ok) throw new Error(`GitHub replied ${put.status}: ${(await put.text()).slice(0, 200)}`);
  const j = (await put.json()) as { commit: { sha: string; html_url: string } };
  return { mode, commit: j.commit.sha.slice(0, 7), url: j.commit.html_url, note: "Published. The site rebuilds automatically; changes are live in about 2–3 minutes." };
}

export async function publishCatalogue(state: CatalogueState, who = "admin") {
  const ov = buildOverrides(state);
  const body = JSON.stringify(ov, null, 2) + "\n";
  const mode = publishMode();
  const summary = `${Object.keys(ov.products).length} product change(s), ${ov.added.length} new product(s), ${Object.keys(ov.categories).length} category change(s), ${Object.keys(ov.options).length} surcharge change(s)`;
  if (mode === "local") {
    const fs = await import("node:fs/promises"); const path = await import("node:path");
    await fs.writeFile(path.join(process.cwd(), PATH), body, "utf8");
    return { mode, summary, note: "Saved locally; restart the dev server to see the changes." };
  }
  if (mode === "none") throw new Error("Publishing is not configured: add a GITHUB_TOKEN (fine-grained, Contents: read & write on the site repo) in Vercel.");
  const h = { Authorization: `Bearer ${token()}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "content-type": "application/json" };
  const url = `https://api.github.com/repos/${OWNER_REPO}/contents/${PATH}`;
  const cur = await fetch(`${url}?ref=${BRANCH}`, { headers: h, cache: "no-store" });
  const sha = cur.ok ? ((await cur.json()) as { sha: string }).sha : undefined;
  const put = await fetch(url, { method: "PUT", headers: h, body: JSON.stringify({ message: `Catalogue updated from admin (${who}): ${summary}`, content: Buffer.from(body).toString("base64"), sha, branch: BRANCH }) });
  if (!put.ok) throw new Error(`GitHub replied ${put.status}: ${(await put.text()).slice(0, 200)}`);
  const j = (await put.json()) as { commit: { sha: string; html_url: string } };
  return { mode, summary, commit: j.commit.sha.slice(0, 7), url: j.commit.html_url, note: `Published (${summary}). The site rebuilds automatically; changes are live in about 2–3 minutes.` };
}

export type { Product };
