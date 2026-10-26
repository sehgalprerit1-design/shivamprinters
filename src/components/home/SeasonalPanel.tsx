"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Phone } from "lucide-react";
import { useRecent } from "@/lib/recent";
import { products, type Product } from "@/data/catalog";
import { whatsappUrl, WhatsAppIcon } from "@/components/ui/CallUs";

/** Serialisable slice of a LiveEvent, computed on the server and handed to this client component. */
export type PanelEvent = {
  id: string;
  name: string;
  audience: "consumer" | "corporate";
  headline: string;
  sub: string;
  cta: string;
  href: string;
  image?: string;
  tone: string;
  tags: string[];
  countdown: string | null;
  deliveryCheck: boolean;
};

const CORPORATE_SIGNALS = ["corporate", "business", "small-business"];

/** The seasonal half of the homepage hero.
 *  Server picks the live events; this component re-orders them for the visitor:
 *  someone who has been looking at business printing sees the corporate card first,
 *  and anyone with a recently viewed product gets a "finish it in time" nudge. */
export function SeasonalPanel({ primary, secondary }: { primary: PanelEvent; secondary?: PanelEvent | null }) {
  const { slugs } = useRecent();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const recent = useMemo(() => (mounted ? slugs.map((s) => products.find((p) => p.slug === s)).filter((p): p is Product => !!p) : []), [mounted, slugs]);
  const leansCorporate = recent.length > 0 && recent.filter((p) => p.tags?.some((t) => CORPORATE_SIGNALS.includes(t)) || p.category === "business-printing").length >= Math.ceil(recent.length / 2);

  let top = primary, under = secondary ?? null;
  if (leansCorporate && secondary && secondary.audience === "corporate") { top = secondary; under = primary; }

  // Most relevant recently viewed product for the top event: shares a tag with it, else the latest one.
  const nudge = recent.find((p) => p.tags?.some((t) => top.tags.includes(t))) ?? recent[0];

  return (
    <div className="flex flex-col gap-3 h-full">
      <Link href={top.href} className={`relative flex-1 min-h-[300px] md:min-h-0 rounded-3xl overflow-hidden text-white bg-gradient-to-br ${top.tone} group`}>
        {top.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={top.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity" loading="eager" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="relative h-full p-6 md:p-8 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs md:text-sm font-semibold">
            <span className="chip bg-white/20 backdrop-blur text-white inline-flex items-center gap-1.5"><CalendarDays size={14} />{top.countdown ?? top.name}</span>
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold leading-tight">{top.headline}</h2>
            <p className="text-white/85 mt-2 text-sm md:text-base max-w-md">{top.sub}</p>
            <span className="btn bg-white text-ink hover:bg-white/90 mt-4 inline-flex items-center gap-2">{top.cta} <ArrowRight size={16} /></span>
          </div>
        </div>
      </Link>

      {nudge && (
        <Link href={`/p/${nudge.slug}`} className="card flex items-center gap-3 p-3 hover:border-brand">
          <div className="w-14 h-14 rounded-lg bg-surface-2 bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${nudge.image})` }} />
          <div className="min-w-0 flex-1">
            <div className="text-xs text-ink-3">You were looking at</div>
            <div className="font-semibold truncate">{nudge.name}</div>
            <div className="text-xs text-brand font-semibold">{top.countdown ? `Finish it in time for ${top.name} →` : "Pick up where you left off →"}</div>
          </div>
        </Link>
      )}

      {under && (
        <Link href={under.href} className={`relative rounded-2xl overflow-hidden text-white bg-gradient-to-r ${under.tone} p-4 md:p-5 flex items-center justify-between gap-4 group`}>
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wide text-white/70">{under.audience === "corporate" ? "For companies" : under.countdown ?? under.name}</div>
            <div className="font-bold leading-tight mt-0.5">{under.headline}</div>
            <div className="text-xs text-white/75 mt-1 line-clamp-1">{under.sub}</div>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1 text-sm font-semibold whitespace-nowrap">{under.cta} <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" /></span>
        </Link>
      )}

      {top.deliveryCheck && (
        <div className="card p-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="font-semibold">Need it before {top.name}?</span>
          <span className="text-ink-2">Check delivery with us before you order:</span>
          <a href="tel:+919910888217" className="inline-flex items-center gap-1 font-semibold text-brand"><Phone size={14} />9910888217</a>
          <a href={whatsappUrl(`Hi Shivam Printers, can you deliver before ${top.name} if I order today?`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#128C7E]"><WhatsAppIcon size={14} />WhatsApp</a>
        </div>
      )}
    </div>
  );
}
