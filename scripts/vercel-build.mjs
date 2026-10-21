// Build entry for Vercel. Prisma steps run only when a database is configured,
// so the site deploys even before DATABASE_URL / Razorpay / R2 are added.
import { execSync } from "node:child_process";
const run = (cmd) => { console.log(`\n$ ${cmd}`); execSync(cmd, { stdio: "inherit" }); };
if (process.env.DATABASE_URL) {
  try { run("npx prisma generate"); run("npx prisma db push --accept-data-loss --skip-generate"); run("npx tsx prisma/seed.ts"); }
  catch (e) { console.warn("Prisma step failed; continuing build without DB sync.", e?.message); }
} else {
  console.log("DATABASE_URL not set — skipping prisma generate/db push (orders use in-memory store).");
}
run("npx next build");
