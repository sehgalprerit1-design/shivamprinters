// Prisma client singleton. When DATABASE_URL is absent (local preview / CI),
// a tiny in-memory store stands in so checkout can be exercised end to end.
// The client is imported dynamically so the app builds before `prisma generate`.
/* eslint-disable @typescript-eslint/no-explicit-any */
type Store = { orders: Map<string, Record<string, unknown>>; enquiries: Map<string, Record<string, unknown>>; customers: Map<string, Record<string, unknown>> };
const g = globalThis as unknown as { prisma?: any; memStore?: Store };

/** Serverless-safe connection string: one pooled connection per function instance.
 *  Supabase's session pooler allows only ~15 clients, so without this a handful of
 *  concurrent Vercel functions exhaust it ("max clients reached"). */
function serverlessUrl(raw: string) {
  try {
    const u = new URL(raw);
    if (!u.searchParams.has("connection_limit")) u.searchParams.set("connection_limit", "1");
    if (!u.searchParams.has("pool_timeout")) u.searchParams.set("pool_timeout", "20");
    // Supabase transaction pooler (port 6543) needs pgbouncer mode so Prisma skips prepared statements.
    if (u.port === "6543" && !u.searchParams.has("pgbouncer")) u.searchParams.set("pgbouncer", "true");
    return u.toString();
  } catch { return raw; }
}

export async function getPrisma(): Promise<any | null> {
  if (!process.env.DATABASE_URL) return null;
  if (!g.prisma) {
    const mod: any = await import("@prisma/client");
    g.prisma = new mod.PrismaClient({ datasources: { db: { url: serverlessUrl(process.env.DATABASE_URL) } } });
  }
  return g.prisma;
}

export function memStore(): Store {
  if (!g.memStore) g.memStore = { orders: new Map(), enquiries: new Map(), customers: new Map() };
  return g.memStore;
}
