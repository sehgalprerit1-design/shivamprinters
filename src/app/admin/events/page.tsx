import Link from "next/link";
import { isAdmin } from "@/lib/admin";
import { Login } from "../Login";
import { AdminNav } from "../AdminNav";
import { liveEvents, upcomingEvents, eventsNeedingDates, todayIST, formatDate, countdownLine } from "@/lib/events";
import { events } from "@/data/events";
export const dynamic = "force-dynamic";
export const metadata = { title: "Seasonal events", robots: { index: false } };

/** What the homepage is pushing today, what comes next, and whether next year's festival dates are still missing.
 *  Add ?on=YYYY-MM-DD to preview another day. */
export default async function AdminEvents({ searchParams }: { searchParams: Promise<{ on?: string }> }) {
  if (!(await isAdmin())) return <Login />;
  const { on } = await searchParams;
  const today = on && /^\d{4}-\d{2}-\d{2}$/.test(on) ? on : todayIST();
  const live = liveEvents(today);
  const upcoming = upcomingEvents(today, 150);
  const missing = eventsNeedingDates(today);
  const lastYear = Math.max(...events.flatMap((e) => (e.dates ? Object.keys(e.dates).map(Number) : [])));

  return (
    <div>
      <AdminNav title={<>Seasonal events</>} current="/admin/events" className="mb-2" />
      <p className="text-sm text-ink-2 mb-6">
        The homepage banner, the header &ldquo;shop the season&rdquo; card and the occasion tiles follow this calendar automatically. Edit <code className="font-mono text-xs bg-surface-2 px-1 rounded">src/data/events.ts</code> to change copy, dates or lead times.
        {" "}Showing <b>{formatDate(today)} {today.slice(0, 4)}</b>{on && <> · <Link href="/admin/events" className="text-brand">back to today</Link></>}.
        {" "}Preview a day: <Link href={`/admin/events?on=${today.slice(0, 4)}-12-10`} className="text-brand">10 Dec</Link>, <Link href={`/admin/events?on=${Number(today.slice(0, 4)) + 1}-03-01`} className="text-brand">1 Mar</Link>, <Link href={`/admin/events?on=${Number(today.slice(0, 4)) + 1}-08-10`} className="text-brand">10 Aug</Link>.
      </p>

      {missing.length > 0 && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 p-4 mb-6 text-sm">
          <b>Dates needed:</b> {missing.map((e) => e.name).join(", ")} have no future date in the calendar, so they will not appear until next year&apos;s dates are added.
        </div>
      )}
      {lastYear - Number(today.slice(0, 4)) <= 1 && (
        <div className="rounded-2xl bg-surface-2 p-4 mb-6 text-sm text-ink-2">Festival dates are filled in up to <b>{lastYear}</b>. Add {lastYear + 1} dates before the end of {lastYear} so the banner keeps running.</div>
      )}

      <h2 className="text-xl font-bold mb-3">Live now <span className="text-ink-3 text-sm font-normal">— the top consumer event is the main banner; the top corporate one is the card under it</span></h2>
      <div className="card overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs text-ink-3"><tr><th className="p-3">Event</th><th className="p-3">Audience</th><th className="p-3">Date</th><th className="p-3">Countdown</th><th className="p-3">Showing until</th><th className="p-3">Priority</th><th className="p-3">Links to</th></tr></thead>
          <tbody>
            {live.length === 0 && <tr><td className="p-3 text-ink-3" colSpan={7}>Nothing in season — the evergreen hero shows full width.</td></tr>}
            {live.map((l) => (
              <tr key={l.event.id} className="border-t border-line">
                <td className="p-3 font-semibold">{l.event.name}</td>
                <td className="p-3 capitalize">{l.event.audience}</td>
                <td className="p-3 whitespace-nowrap">{l.date ? `${formatDate(l.date)} ${l.date.slice(0, 4)}` : "season"}</td>
                <td className="p-3 text-ink-2">{countdownLine(l) ?? `${formatDate(l.opens)} – ${formatDate(l.closes)}`}</td>
                <td className="p-3 whitespace-nowrap">{formatDate(l.closes)}</td>
                <td className="p-3">{l.event.priority}</td>
                <td className="p-3"><Link href={l.event.href} className="text-brand">{l.event.href}</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-bold mb-3">Coming up <span className="text-ink-3 text-sm font-normal">— next 5 months</span></h2>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs text-ink-3"><tr><th className="p-3">Event</th><th className="p-3">Audience</th><th className="p-3">Date</th><th className="p-3">Banner starts</th><th className="p-3">Lead</th><th className="p-3">Links to</th></tr></thead>
          <tbody>
            {upcoming.map((l) => (
              <tr key={`${l.event.id}-${l.opens}`} className="border-t border-line">
                <td className="p-3 font-semibold">{l.event.name}</td>
                <td className="p-3 capitalize">{l.event.audience}</td>
                <td className="p-3 whitespace-nowrap">{l.date ? `${formatDate(l.date)} ${l.date.slice(0, 4)}` : `${formatDate(l.opens)} – ${formatDate(l.closes)}`}</td>
                <td className="p-3 whitespace-nowrap">{formatDate(l.opens)} {l.opens.slice(0, 4)}</td>
                <td className="p-3">{l.event.leadDays ? `${l.event.leadDays} days` : "—"}</td>
                <td className="p-3"><Link href={l.event.href} className="text-brand">{l.event.href}</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
