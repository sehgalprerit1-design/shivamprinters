// Downloads the visiting-card product photos listed in scripts/card-photos.json into
// public/images/cards/photos/ (not committed; fetched on every Vercel build) and converts
// them to JPEG. Pages fall back to the SVG illustration for any photo that is missing.
import { readFileSync, existsSync, mkdirSync, writeFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(join(root, "scripts/card-photos.json"), "utf8"));
mkdirSync(join(root, "public/images/cards/photos"), { recursive: true });
let ok = 0, skipped = 0, failed = 0;
for (const [name, { url, file }] of Object.entries(manifest)) {
  const out = join(root, "public", file);
  if (existsSync(out) && statSync(out).size > 10_000) { skipped++; continue; }
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const png = Buffer.from(await res.arrayBuffer());
    const jpg = await sharp(png).resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    writeFileSync(out, jpg); ok++;
  } catch (e) { failed++; console.warn(`card photo "${name}" not fetched (${e?.message}); the page will show the illustration instead`); }
}
console.log(`card photos: ${ok} fetched, ${skipped} already present, ${failed} failed`);
