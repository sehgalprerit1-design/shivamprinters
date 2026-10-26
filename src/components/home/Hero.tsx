import Link from "next/link";
import { liveFor, countdownLine, needsDeliveryCheck, type LiveEvent } from "@/lib/events";
import { SeasonalPanel, type PanelEvent } from "./SeasonalPanel";
import { siteImage } from "@/data/site-images";

const toPanel = (l: LiveEvent): PanelEvent => ({
  id: l.event.id, name: l.event.dayName ?? l.event.name, audience: l.event.audience, headline: l.event.headline, sub: l.event.sub, cta: l.event.cta,
  href: l.event.href, image: l.event.image, tone: l.event.tone, tags: l.event.tags, countdown: countdownLine(l), deliveryCheck: needsDeliveryCheck(l),
});

/** Homepage hero: evergreen message on the left, whatever is in season on the right.
 *  With nothing in season (rare — wedding season and calendars cover most of the year) the evergreen panel takes the full width. */
export function Hero() {
  const consumer = liveFor("consumer");
  const corporate = liveFor("corporate");
  const primary = consumer[0] ?? corporate[0];
  // Second card: the corporate event if one is open, otherwise the next consumer event (e.g. wedding season under Diwali).
  const secondary = primary ? (corporate[0] && corporate[0] !== primary ? corporate[0] : consumer.find((l) => l !== primary && l.event.kind === "season") ?? consumer.find((l) => l !== primary)) : undefined;

  return (
    <section className="container-x pt-6 md:pt-10">
      <div className={`grid gap-4 ${primary ? "lg:grid-cols-2" : ""}`}>
        <div className="relative rounded-3xl overflow-hidden bg-ink text-white min-h-[380px] md:min-h-[520px] flex items-end">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={siteImage("home.hero", "/images/hero.jpg")} alt="" className="absolute inset-0 w-full h-full object-cover opacity-90" fetchPriority="high" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="relative p-6 md:p-10 max-w-2xl fade-up">
            <span className="chip bg-white/15 backdrop-blur text-white mb-4">Made in our own print centre · Pan-India delivery</span>
            <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold leading-[1.05]">Your photos, <em className="not-italic text-brand">printed properly.</em></h1>
            <p className="text-white/85 text-lg mt-4 max-w-lg">Photobooks, frames, calendars and gifts made from the pictures on your phone. Upload, personalise in minutes, delivered anywhere in India.</p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link href="/products" className="btn btn-primary">Start creating</Link>
              <Link href="/gifts" className="btn bg-white text-ink hover:bg-surface-2">Find a gift</Link>
            </div>
          </div>
        </div>
        {primary && <div className="order-first lg:order-none"><SeasonalPanel primary={toPanel(primary)} secondary={secondary ? toPanel(secondary) : null} /></div>}
      </div>
    </section>
  );
}
