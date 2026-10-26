"use client";
// One place to fire conversion events to every analytics tool that is switched on.
// GA4 and the Meta pixel only load when their IDs are set in Vercel env vars
// (NEXT_PUBLIC_GA_ID, NEXT_PUBLIC_META_PIXEL_ID), so these calls are safe no-ops otherwise.
import { track as vercelTrack } from "@vercel/analytics";

type W = Window & { gtag?: (...a: unknown[]) => void; fbq?: (...a: unknown[]) => void };

export type TrackEvent =
  | { name: "lead"; kind: string; source: string }
  | { name: "contact"; channel: "whatsapp" | "phone"; path: string }
  | { name: "purchase"; orderId: string; value: number };

export function track(e: TrackEvent) {
  if (typeof window === "undefined") return;
  const w = window as W;
  try {
    if (e.name === "lead") {
      w.gtag?.("event", "generate_lead", { lead_kind: e.kind, lead_source: e.source });
      w.fbq?.("track", "Lead", { content_name: e.kind });
      vercelTrack("Enquiry", { kind: e.kind, source: e.source });
    } else if (e.name === "contact") {
      w.gtag?.("event", "contact", { method: e.channel, page_path: e.path });
      w.fbq?.("track", "Contact", { content_name: e.channel });
      vercelTrack("Contact", { channel: e.channel, path: e.path });
    } else if (e.name === "purchase") {
      w.gtag?.("event", "purchase", { transaction_id: e.orderId, value: e.value, currency: "INR" });
      w.fbq?.("track", "Purchase", { value: e.value, currency: "INR" });
      vercelTrack("Purchase", { orderId: e.orderId, value: e.value });
    }
  } catch { /* analytics must never break the page */ }
}
