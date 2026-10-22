// Build entry for Vercel. Prisma steps run only when a database is configured,
// so the site deploys even before DATABASE_URL / Razorpay / R2 are added.
// Each database step has a hard time limit: a wrong pooler URL must never hang a deploy.
import { execSync } from "node:child_process";
const run = (cmd, opts = {}) => { console.log(`\n$ ${cmd}`); execSync(cmd, { stdio: "inherit", ...opts }); };
const port = (u) => { try { return new URL(u).port; } catch { return ""; } };

if (process.env.DATABASE_URL) {
  // Prisma CLI (db push/seed) needs a session-mode / direct connection (Supabase port 5432).
  if (!process.env.DIRECT_URL) process.env.DIRECT_URL = process.env.DATABASE_URL;
  if (port(process.env.DIRECT_URL) === "6543") console.warn("WARNING: DIRECT_URL points at the transaction pooler (6543). Schema push may fail — set DIRECT_URL to the session pooler (5432) URL.");
  if (port(process.env.DATABASE_URL) === "5432") console.warn("NOTE: DATABASE_URL uses the session pooler (5432, max 15 clients). The transaction pooler (6543) is recommended for the app.");
  try { run("npx prisma generate", { timeout: 180_000 }); } catch (e) { console.warn("prisma generate failed:", e?.message); }
  try { run("npx prisma db push --accept-data-loss --skip-generate", { timeout: 150_000 }); } catch (e) { console.warn("Schema push skipped/failed (continuing; tables stay as they are):", e?.message?.split("\n")[0]); }
  try { run("npx tsx prisma/seed.ts", { timeout: 150_000 }); } catch (e) { console.warn("Seed skipped/failed (continuing):", e?.message?.split("\n")[0]); }
} else {
  console.log("DATABASE_URL not set — skipping prisma generate/db push (orders use in-memory store).");
}
run("npx next build");
