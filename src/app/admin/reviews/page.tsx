import Link from "next/link";
import { isAdmin } from "@/lib/admin";
import { listReviews } from "@/lib/reviews-db";
import { getProduct } from "@/data/catalog";
import { Login } from "../Login";
import { SignOut } from "../SignOut";
import { ReviewActions } from "./ReviewActions";
export const dynamic = "force-dynamic";

export default async function AdminReviews() {
  if (!(await isAdmin())) return <Login />;
  const rows = await listReviews();
  return (
    <div>
      <div className="flex items-center justify-between mb-6"><div className="flex items-center gap-4"><h1 className="text-3xl font-bold">Reviews</h1><Link href="/admin" className="text-brand text-sm font-semibold">Orders →</Link><Link href="/admin/enquiries" className="text-brand text-sm font-semibold">Enquiries →</Link><Link href="/admin/pricing" className="text-brand text-sm font-semibold">Catalogue &amp; pricing →</Link></div><SignOut /></div>
      <p className="text-ink-2 text-sm mb-4">{rows.filter((r) => !r.approved).length} waiting · {rows.filter((r) => r.approved).length} live. Approved reviews show at the top of the product&apos;s reviews, above the sample ones.</p>
      {rows.length === 0 ? <div className="card p-8 text-center text-ink-3">No customer reviews yet.</div> : (
        <div className="space-y-3">
          {rows.map((r) => { const p = getProduct(r.productSlug); return (
            <div key={r.id} className="card p-4 grid md:grid-cols-[1fr_2fr_auto] gap-4 text-sm">
              <div>
                <div className="flex items-center gap-2"><span className={`chip text-[11px] ${r.approved ? "bg-accent-soft text-accent" : "bg-amber-100 text-amber-900"}`}>{r.approved ? "LIVE" : "WAITING"}</span><span className="text-ink-3 text-xs">{new Date(r.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span></div>
                <div className="font-semibold mt-1">{p ? <Link href={`/p/${p.slug}`} className="hover:text-brand">{p.name}</Link> : r.productSlug}</div>
                <div className="text-ink-2">{r.author}{r.city ? ` · ${r.city}` : ""}</div>
              </div>
              <div><div className="text-gold">{"★".repeat(r.rating)}<span className="text-line">{"★".repeat(5 - r.rating)}</span> <b className="text-ink">{r.title}</b></div><p className="text-ink-2 whitespace-pre-wrap mt-1">{r.body}</p></div>
              <div><ReviewActions id={r.id} approved={r.approved} /></div>
            </div>
          ); })}
        </div>
      )}
    </div>
  );
}
