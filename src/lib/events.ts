// Picks which seasonal events are live on a given day. Pure functions, safe on server and client.
import { events, type SeasonalEvent, type Audience } from "@/data/events";

const DAY = 86_400_000;
const IST = "Asia/Kolkata";

/** Today's date as YYYY-MM-DD in India, so the switch happens at Indian midnight whatever the server's zone. */
export function todayIST(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: IST, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

const toUTC = (ymd: string) => { const [y, m, d] = ymd.split("-").map(Number); return Date.UTC(y, m - 1, d); };
const daysBetween = (a: string, b: string) => Math.round((toUTC(b) - toUTC(a)) / DAY);

export type LiveEvent = {
  event: SeasonalEvent;
  /** The occurrence this is about (YYYY-MM-DD); undefined for seasons. */
  date?: string;
  /** Days until the date; 0 on the day. Undefined for seasons. */
  daysLeft?: number;
  /** When this event started/will start showing (YYYY-MM-DD). */
  opens: string;
  /** Last day it shows (YYYY-MM-DD). */
  closes: string;
};

/** Next occurrence of a dated event on or after `today`, within the data we have. */
export function nextOccurrence(e: SeasonalEvent, today: string): string | undefined {
  const year = Number(today.slice(0, 4));
  const candidates: string[] = [];
  if (e.fixed) for (const y of [year, year + 1]) candidates.push(`${y}-${e.fixed}`);
  if (e.dates) candidates.push(...Object.values(e.dates));
  return candidates.filter((d) => d >= today).sort()[0];
}

/** Replace "{year}" with the year the customer is buying calendars for: next year from October, else this year. */
export function fillYear(e: SeasonalEvent, today: string): SeasonalEvent {
  const y = Number(today.slice(0, 4)) + (Number(today.slice(5, 7)) >= 10 ? 1 : 0);
  const f = (t: string) => t.replace(/\{year\}/g, String(y));
  return { ...e, name: f(e.name), headline: f(e.headline), sub: f(e.sub), cta: f(e.cta) };
}

function occurrenceFor(e: SeasonalEvent, today: string): LiveEvent | null {
  if (e.range) {
    const year = Number(today.slice(0, 4));
    const wraps = e.range.from > e.range.to;
    // A wrapping range (Nov→Feb) is live if today is after `from` this year or before `to` this year.
    const fromY = wraps && today <= `${year}-${e.range.to}` ? year - 1 : year;
    const opens = `${fromY}-${e.range.from}`;
    const closes = `${wraps ? fromY + 1 : fromY}-${e.range.to}`;
    return today >= opens && today <= closes ? { event: e, opens, closes } : null;
  }
  const date = nextOccurrence(e, today);
  if (!date) return null;
  const daysLeft = daysBetween(today, date);
  if (daysLeft > e.leadDays) return null;
  const opens = new Date(toUTC(date) - e.leadDays * DAY).toISOString().slice(0, 10);
  return { event: e, date, daysLeft, opens, closes: date };
}

/** Everything live today, highest priority first. */
export function liveEvents(today = todayIST()): LiveEvent[] {
  return events.map((e) => occurrenceFor(fillYear(e, today), today)).filter((x): x is LiveEvent => !!x).sort((a, b) => b.event.priority - a.event.priority);
}

export function liveFor(audience: Audience, today = todayIST()): LiveEvent[] {
  return liveEvents(today).filter((l) => l.event.audience === audience);
}

/** Events that will open within the next `horizonDays`, soonest first — for the admin view. */
export function upcomingEvents(today = todayIST(), horizonDays = 120): LiveEvent[] {
  const out: LiveEvent[] = [];
  for (const e of events.map((x) => fillYear(x, today))) {
    if (e.range) {
      const year = Number(today.slice(0, 4));
      for (const y of [year, year + 1]) {
        const opens = `${y}-${e.range.from}`;
        if (opens > today && daysBetween(today, opens) <= horizonDays) { out.push({ event: e, opens, closes: `${e.range.from > e.range.to ? y + 1 : y}-${e.range.to}` }); break; }
      }
      continue;
    }
    const date = nextOccurrence(e, today);
    if (!date) continue;
    const daysLeft = daysBetween(today, date);
    if (daysLeft <= e.leadDays) continue; // already live
    const opens = new Date(toUTC(date) - e.leadDays * DAY).toISOString().slice(0, 10);
    if (daysBetween(today, opens) <= horizonDays) out.push({ event: e, date, daysLeft, opens, closes: date });
  }
  return out.sort((a, b) => a.opens.localeCompare(b.opens));
}

/** Dated events whose data runs out — so someone adds next year's dates before the site goes quiet. */
export function eventsNeedingDates(today = todayIST()): SeasonalEvent[] {
  return events.filter((e) => e.dates && !e.fixed && !nextOccurrence(e, today));
}

export function formatDate(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
}

/** "Diwali is on 8 Nov · 13 days to go" style line, or the urgency line in the final stretch. */
export function countdownLine(l: LiveEvent): string | null {
  if (l.daysLeft === undefined || !l.date) return null;
  const when = formatDate(l.date);
  const n = l.event.dayName ?? l.event.name;
  if (l.daysLeft === 0) return `${n} is today`;
  if (l.daysLeft === 1) return `${n} is tomorrow`;
  return `${n} is on ${when} · ${l.daysLeft} days to go`;
}

/** Inside the last 10 days, nudge the customer to confirm delivery with the shop instead of promising a cut-off we can't guarantee. */
export const needsDeliveryCheck = (l: LiveEvent) => l.daysLeft !== undefined && l.daysLeft <= 10;
