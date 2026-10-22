// Custom-printing / quote enquiries. Saved to Postgres (or the in-memory store
// when DATABASE_URL is unset) and emailed to the shop inbox.
import { z } from "zod";
import { getPrisma, memStore } from "./db";
import { sendMail, NOTIFY_EMAIL } from "./email";
import { presignGet, storageEnabled } from "./storage";
import { notifyOwner } from "./notify";
import { recordCustomer } from "./customers";

export const ENQUIRY_KINDS = ["Business cards", "Stickers & labels", "Brochures & flyers", "Postcards & invites", "Banners & standees", "Letterheads & envelopes", "Packaging & boxes", "Diaries & notebooks", "Something else"] as const;

export const EnquiryInput = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number"),
  email: z.string().trim().email().max(120).optional().or(z.literal("")),
  company: z.string().trim().max(120).optional(),
  kind: z.enum(ENQUIRY_KINDS),
  quantity: z.string().trim().max(60).optional(),
  deadline: z.string().trim().max(40).optional(),
  message: z.string().trim().min(5).max(2000),
  artworkKey: z.string().trim().max(300).optional(),
  website: z.string().max(500).optional(), // honeypot — any value means a bot; the API pretends success
});
export type EnquiryInputT = z.infer<typeof EnquiryInput>;

export async function createEnquiry(input: EnquiryInputT) {
  const data = { name: input.name, phone: input.phone, email: input.email || null, company: input.company || null, kind: input.kind, quantity: input.quantity || null, deadline: input.deadline || null, message: input.message, artworkKey: input.artworkKey || null };
  const prisma = await getPrisma();
  let row: Record<string, unknown>;
  if (prisma) row = await prisma.enquiry.create({ data });
  else { const id = `enq_${Date.now().toString(36)}`; row = { id, createdAt: new Date().toISOString(), status: "NEW", ...data }; memStore().enquiries.set(id, row); }
  await recordCustomer({ email: data.email, phone: data.phone, name: data.name, company: data.company, source: "enquiry" });

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://shivamprinters.vercel.app");
  const art = data.artworkKey && storageEnabled ? await presignGet(data.artworkKey).catch(() => null) : null;
  const rows = Object.entries({ Name: data.name, Phone: data.phone, Email: data.email, Company: data.company, "What": data.kind, Quantity: data.quantity, Deadline: data.deadline }).filter(([, v]) => v).map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#777">${k}</td><td style="padding:4px 0">${v}</td></tr>`).join("");
  await sendMail(NOTIFY_EMAIL, `Quote request: ${data.kind} — ${data.name} (${data.phone})`, `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;color:#1d1a17"><h2 style="margin:0 0 8px">New custom-printing enquiry</h2><table>${rows}</table><p style="white-space:pre-wrap;border-left:3px solid #e2573f;padding-left:12px">${data.message}</p>${art ? `<p><a href="${art}">Download attached artwork</a> (link valid 7 days)</p>` : ""}<p><a href="tel:+91${data.phone}">Call ${data.phone}</a> · <a href="https://wa.me/91${data.phone}">WhatsApp</a> · <a href="${base}/admin/enquiries">All enquiries</a></p></div>`);
  await notifyOwner({ what: `New quote request: ${data.kind}${data.quantity ? ` × ${data.quantity}` : ""}`, details: `${data.name}${data.company ? ` (${data.company})` : ""}, ${data.phone}${data.deadline ? `, needed by ${data.deadline}` : ""} — "${data.message.slice(0, 120)}${data.message.length > 120 ? "…" : ""}"`, link: `${base}/admin/enquiries` });
  if (data.email) await sendMail(data.email, "We got your printing enquiry — Shivam Printers", `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;color:#1d1a17"><h2 style="margin:0 0 8px">Thanks, ${data.name.split(" ")[0]}!</h2><p>We've received your enquiry for <b>${data.kind}</b> and will call or WhatsApp you on ${data.phone} within one working day with a quote.</p><p style="color:#777;font-size:12px">In a hurry? Call us 9910888217.</p></div>`);
  return row;
}

export async function listEnquiries() {
  const prisma = await getPrisma();
  if (prisma) return prisma.enquiry.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return [...memStore().enquiries.values()].reverse();
}

export async function setEnquiryStatus(id: string, status: string) {
  const prisma = await getPrisma();
  if (prisma) return prisma.enquiry.update({ where: { id }, data: { status } });
  const e = memStore().enquiries.get(id); if (e) e.status = status;
}
