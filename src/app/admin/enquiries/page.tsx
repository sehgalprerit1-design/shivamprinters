import { isAdmin } from "@/lib/admin";
import { listEnquiries } from "@/lib/enquiries";
import { presignGet, storageEnabled } from "@/lib/storage";
import { Login } from "../Login";
import { AdminNav } from "../AdminNav";
import { EnquiryStatus } from "./EnquiryStatus";
export const dynamic = "force-dynamic";

const COLOR: Record<string, string> = { NEW: "bg-amber-100 text-amber-900", QUOTED: "bg-blue-100 text-blue-900", WON: "bg-accent-soft text-accent", CLOSED: "bg-surface-2 text-ink-3" };

export default async function Enquiries() {
  if (!(await isAdmin())) return <Login />;
  const rows = (await listEnquiries()) as Record<string, unknown>[];
  const links = await Promise.all(rows.map((e) => (e.artworkKey && storageEnabled ? presignGet(String(e.artworkKey)).catch(() => null) : Promise.resolve(null))));
  return (
    <div>
      <AdminNav title={<>Enquiries</>} current="/admin/enquiries" className="mb-6" />
      <p className="text-ink-2 text-sm mb-4">{rows.filter((e) => e.status === "NEW").length} new · {rows.length} total. Each one was also emailed to you.</p>
      {rows.length === 0 ? <div className="card p-8 text-center text-ink-3">No enquiries yet.</div> : (
        <div className="space-y-3">
          {rows.map((e, i) => (
            <div key={String(e.id)} className="card p-4 grid md:grid-cols-[1fr_2fr_auto] gap-4 text-sm">
              <div>
                <div className="flex items-center gap-2"><span className={`chip text-[11px] ${COLOR[String(e.status)] ?? ""}`}>{String(e.status)}</span><span className="text-ink-3 text-xs">{new Date(String(e.createdAt)).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span></div>
                <div className="font-semibold mt-1">{String(e.name)}{e.company ? <span className="text-ink-3 font-normal"> · {String(e.company)}</span> : null}</div>
                <div className="mt-1 flex flex-wrap gap-x-3"><a className="text-brand" href={`tel:+91${e.phone}`}>{String(e.phone)}</a><a className="text-[#128C7E]" href={`https://wa.me/91${e.phone}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>{e.email ? <a className="text-brand" href={`mailto:${e.email}`}>{String(e.email)}</a> : null}</div>
              </div>
              <div>
                <div className="font-semibold">{[String(e.kind), e.quantity ? String(e.quantity) : "", e.deadline ? `by ${e.deadline}` : ""].filter(Boolean).join(" · ")}</div>
                <p className="text-ink-2 whitespace-pre-wrap mt-1">{String(e.message)}</p>
                {links[i] ? <a href={links[i]!} className="inline-block mt-2 text-brand font-semibold">Download artwork ↓</a> : null}
                {Boolean(e.artworkKey) && !links[i] && <div className="text-ink-3 text-xs mt-2">Artwork attached (storage not configured)</div>}
              </div>
              <div><EnquiryStatus id={String(e.id)} status={String(e.status)} /></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
