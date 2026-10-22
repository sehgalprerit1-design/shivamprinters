// Customer list for marketing and order history. One row per person, matched by email or phone.
// recordCustomer() is called from checkout, the enquiry form and the offers sign-up; it never throws,
// so a problem here can't stop an order going through.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getPrisma, memStore } from "./db";

export type CustomerSource = "order" | "enquiry" | "newsletter" | "admin";
export type Customer = {
  id: string; email: string | null; phone: string | null; name: string | null; company: string | null;
  city: string | null; state: string | null; pincode: string | null; source: string;
  marketingOptIn: boolean; emailVerified: boolean; phoneVerified: boolean;
  ordersCount: number; totalSpent: number; lastOrderAt: Date | string | null; tags: string[]; notes: string | null;
  createdAt: Date | string; updatedAt: Date | string;
};

export const normEmail = (e?: string | null) => { const v = (e ?? "").trim().toLowerCase(); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : null; };
export const normPhone = (p?: string | null) => { const d = (p ?? "").replace(/\D/g, "").replace(/^(91|0)(?=[6-9]\d{9}$)/, ""); return /^[6-9]\d{9}$/.test(d) ? d : null; };

type Record_ = {
  email?: string | null; phone?: string | null; name?: string | null; company?: string | null;
  city?: string | null; state?: string | null; pincode?: string | null;
  source: CustomerSource;
  /** Consent for offers. Omit to leave an existing choice untouched (a new row defaults to true). */
  optIn?: boolean;
  /** A confirmed order to count towards this customer. */
  order?: { total: number; at?: Date };
};

const fill = (cur: any, k: string, v?: string | null) => (v && !cur[k] ? v : undefined);

/** Create or update the customer row for these contact details. Returns the row id, or null if nothing identifiable was given. */
export async function recordCustomer(r: Record_): Promise<string | null> {
  const email = normEmail(r.email), phone = normPhone(r.phone);
  if (!email && !phone) return null;
  const name = r.name?.trim() || undefined;
  try {
    const prisma = await getPrisma();
    if (prisma) {
      const or: any[] = []; if (email) or.push({ email }); if (phone) or.push({ phone });
      const cur = await prisma.customer.findFirst({ where: { OR: or }, orderBy: { createdAt: "asc" } });
      if (cur) {
        const data: any = {
          // An order's name is authoritative; an enquiry or sign-up only fills a blank.
          name: r.source === "order" ? name : fill(cur, "name", name), company: fill(cur, "company", r.company),
          city: r.city?.trim() || undefined, state: r.state?.trim() || undefined, pincode: r.pincode?.trim() || undefined,
          marketingOptIn: r.optIn,
        };
        // Attach a contact detail the row is missing — unless another row already owns it.
        if (email && !cur.email && !(await prisma.customer.findUnique({ where: { email }, select: { id: true } }))) data.email = email;
        if (phone && !cur.phone && !(await prisma.customer.findUnique({ where: { phone }, select: { id: true } }))) data.phone = phone;
        if (r.order) { data.ordersCount = { increment: 1 }; data.totalSpent = { increment: r.order.total }; data.lastOrderAt = r.order.at ?? new Date(); }
        await prisma.customer.update({ where: { id: cur.id }, data });
        return cur.id;
      }
      const row = await prisma.customer.create({ data: {
        email, phone, name: name ?? null, company: r.company?.trim() || null, city: r.city?.trim() || null, state: r.state?.trim() || null, pincode: r.pincode?.trim() || null,
        source: r.source, marketingOptIn: r.optIn ?? true,
        ordersCount: r.order ? 1 : 0, totalSpent: r.order?.total ?? 0, lastOrderAt: r.order ? r.order.at ?? new Date() : null,
      } });
      return row.id;
    }
    // in-memory fallback
    const m = memStore().customers;
    let cur = [...m.values()].find((c: any) => (email && c.email === email) || (phone && c.phone === phone)) as any;
    if (!cur) {
      cur = { id: `cus_${Date.now().toString(36)}${m.size}`, email: null, phone: null, name: null, company: null, city: null, state: null, pincode: null, source: r.source, marketingOptIn: r.optIn ?? true, emailVerified: false, phoneVerified: false, ordersCount: 0, totalSpent: 0, lastOrderAt: null, tags: [], notes: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      m.set(cur.id, cur);
    }
    if (email && !cur.email) cur.email = email; if (phone && !cur.phone) cur.phone = phone;
    if (name && (r.source === "order" || !cur.name)) cur.name = name; if (r.company && !cur.company) cur.company = r.company.trim();
    if (r.city) cur.city = r.city.trim(); if (r.state) cur.state = r.state.trim(); if (r.pincode) cur.pincode = r.pincode.trim();
    if (r.optIn !== undefined) cur.marketingOptIn = r.optIn;
    if (r.order) { cur.ordersCount += 1; cur.totalSpent += r.order.total; cur.lastOrderAt = (r.order.at ?? new Date()).toISOString(); }
    cur.updatedAt = new Date().toISOString();
    return cur.id;
  } catch (e) { console.error("recordCustomer failed", (e as Error).message); return null; }
}

export async function listCustomers(limit = 2000): Promise<Customer[]> {
  const prisma = await getPrisma();
  if (prisma) return prisma.customer.findMany({ orderBy: { createdAt: "desc" }, take: limit });
  return [...memStore().customers.values()].reverse() as Customer[];
}

export async function updateCustomer(id: string, patch: { marketingOptIn?: boolean; tags?: string[]; notes?: string | null; name?: string | null }) {
  const prisma = await getPrisma();
  if (prisma) return prisma.customer.update({ where: { id }, data: patch });
  const c = memStore().customers.get(id) as any; if (c) Object.assign(c, patch, { updatedAt: new Date().toISOString() }); return c ?? null;
}

export async function deleteCustomer(id: string) {
  const prisma = await getPrisma();
  if (prisma) { await prisma.customer.delete({ where: { id } }); return; }
  memStore().customers.delete(id);
}

/** Plain CSV for mailing / WhatsApp tools. Excel opens it directly. */
export function customersCsv(rows: Customer[], onlyOptIn = false) {
  const esc = (v: unknown) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const head = ["Name", "Email", "Phone", "Company", "City", "State", "PIN", "Source", "Offers opt-in", "Orders", "Total spent (₹)", "Last order", "Tags", "Notes", "Added"];
  const lines = rows.filter((c) => !onlyOptIn || c.marketingOptIn).map((c) => [c.name, c.email, c.phone, c.company, c.city, c.state, c.pincode, c.source, c.marketingOptIn ? "yes" : "no", c.ordersCount, c.totalSpent, c.lastOrderAt ? new Date(c.lastOrderAt).toISOString().slice(0, 10) : "", c.tags.join("|"), c.notes, new Date(c.createdAt).toISOString().slice(0, 10)].map(esc).join(","));
  return "﻿" + [head.join(","), ...lines].join("\r\n");
}
