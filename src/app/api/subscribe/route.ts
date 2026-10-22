// "Get offers" sign-up from the footer. Saves the contact to the customer list with marketing consent.
import { NextResponse } from "next/server";
import { z } from "zod";
import { recordCustomer, normEmail, normPhone } from "@/lib/customers";

const Input = z.object({
  contact: z.string().trim().min(5).max(120), // an email address or a 10-digit mobile number
  name: z.string().trim().max(80).optional(),
  website: z.string().max(500).optional(), // honeypot
});

export async function POST(req: Request) {
  const parsed = Input.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Enter your email or mobile number" }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ ok: true }); // bot — pretend success
  const email = normEmail(parsed.data.contact), phone = normPhone(parsed.data.contact);
  if (!email && !phone) return NextResponse.json({ error: "That doesn't look like an email address or a 10-digit mobile number" }, { status: 400 });
  const id = await recordCustomer({ email, phone, name: parsed.data.name, source: "newsletter", optIn: true });
  return NextResponse.json({ ok: Boolean(id), channel: email ? "email" : "whatsapp" });
}
