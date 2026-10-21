// Pricing sheet: reads/writes src/data/prices.json. In production the file is
// committed to GitHub (Vercel rebuilds, ~2–3 min); in local dev it is written
// to disk directly.
import { z } from "zod";
import { products, categories } from "@/data/catalog";
import { ALL_OPTION_GROUPS } from "@/data/options";

export const PricesFile = z.object({
  variants: z.record(z.string(), z.object({ price: z.number().int().min(0).max(1_000_000), compareAt: z.number().int().min(0).max(1_000_000).nullable().optional() })),
  options: z.record(z.string(), z.number().int().min(-100_000).max(100_000)),
});
export type PricesFileT = z.infer<typeof PricesFile>;

/** Rows for the sheet: every variant and every option choice with its *current* effective price. */
export function pricingRows() {
  const catName = Object.fromEntries(categories.map((c) => [c.slug, c.name]));
  const variants = products.flatMap((p) => p.variants.map((v) => ({ sku: v.sku, category: catName[p.category] ?? p.category, product: p.name, slug: p.slug, name: v.name, price: v.price, compareAt: v.compareAt ?? null })));
  const options = ALL_OPTION_GROUPS.flatMap((g) => g.choices.map((c) => ({ key: `${g.id}:${c.id}`, group: g.label, groupId: g.id, name: c.label, delta: c.delta ?? 0 })));
  return { variants, options };
}

const OWNER_REPO = process.env.GITHUB_REPO ?? "sehgalprerit1-design/shivamprinters";
const BRANCH = process.env.GITHUB_BRANCH ?? "main";
const PATH = "src/data/prices.json";
const token = () => (process.env.GITHUB_TOKEN ?? "").trim() || undefined;

export const pricingPublishMode = (): "github" | "local" | "none" => (token() ? "github" : process.env.NODE_ENV === "development" ? "local" : "none");

export async function publishPrices(data: PricesFileT, who = "admin") {
  const body = JSON.stringify(data, null, 2) + "\n";
  const mode = pricingPublishMode();
  if (mode === "local") {
    const fs = await import("node:fs/promises"); const path = await import("node:path");
    await fs.writeFile(path.join(process.cwd(), PATH), body, "utf8");
    return { mode, note: "Saved locally; restart the dev server to see new prices." };
  }
  if (mode === "none") throw new Error("Publishing is not configured: add a GITHUB_TOKEN (fine-grained, Contents: read & write on the site repo) in Vercel.");
  const h = { Authorization: `Bearer ${token()}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "content-type": "application/json" };
  const url = `https://api.github.com/repos/${OWNER_REPO}/contents/${PATH}`;
  const cur = await fetch(`${url}?ref=${BRANCH}`, { headers: h, cache: "no-store" });
  const sha = cur.ok ? ((await cur.json()) as { sha: string }).sha : undefined;
  const put = await fetch(url, { method: "PUT", headers: h, body: JSON.stringify({ message: `Prices updated from admin (${who})`, content: Buffer.from(body).toString("base64"), sha, branch: BRANCH }) });
  if (!put.ok) throw new Error(`GitHub replied ${put.status}: ${(await put.text()).slice(0, 200)}`);
  const j = (await put.json()) as { commit: { sha: string; html_url: string } };
  return { mode, commit: j.commit.sha.slice(0, 7), url: j.commit.html_url, note: "Published. The site rebuilds automatically; new prices are live in about 2–3 minutes." };
}
