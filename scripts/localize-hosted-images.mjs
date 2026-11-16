// Downloads every image in scripts/hosted-images.json (photos generated on Higgsfield's CDN)
// into public/ as an optimised JPEG, so the site serves its own copies and nothing depends on
// the Higgsfield account. Files that already exist are skipped (FORCE=1 re-downloads).
//   npm run images:localize        then commit public/images
import { readFileSync, existsSync, mkdirSync, writeFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(join(root, "scripts/hosted-images.json"), "utf8"));
let ok = 0, skipped = 0; const failed = [];
for (const { url, file, width } of manifest) {
  const out = join(root, "public", file);
  if (process.env.FORCE !== "1" && existsSync(out) && statSync(out).size > 10_000) { skipped++; continue; }
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const src = Buffer.from(await res.arrayBuffer());
    const jpg = await sharp(src).resize({ width: width ?? 1200, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    mkdirSync(dirname(out), { recursive: true }); writeFileSync(out, jpg); ok++;
    console.log(`ok ${file} (${Math.round(jpg.length / 1024)} KB)`);
  } catch (e) { failed.push(`${file}: ${e?.message}`); }
}
console.log(`\n${ok} downloaded, ${skipped} already present, ${failed.length} failed`);
for (const f of failed) console.log(" FAILED " + f);
process.exit(failed.length ? 1 : 0);
