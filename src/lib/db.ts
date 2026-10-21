// Prisma client singleton. When DATABASE_URL is absent (local preview / CI),
// a tiny in-memory store stands in so checkout can be exercised end to end.
// The client is imported dynamically so the app builds before `prisma generate`.
/* eslint-disable @typescript-eslint/no-explicit-any */
type Store = { orders: Map<string, Record<string, unknown>> };
const g = globalThis as unknown as { prisma?: any; memStore?: Store };

export async function getPrisma(): Promise<any | null> {
  if (!process.env.DATABASE_URL) return null;
  if (!g.prisma) {
    const mod: any = await import("@prisma/client");
    g.prisma = new mod.PrismaClient();
  }
  return g.prisma;
}

export function memStore(): Store {
  if (!g.memStore) g.memStore = { orders: new Map() };
  return g.memStore;
}
