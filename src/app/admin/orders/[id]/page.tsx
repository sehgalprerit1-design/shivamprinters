import Link from "next/link";
import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { getOrder } from "@/lib/orders";
import { presignGet, storageEnabled } from "@/lib/storage";
import { inr } from "@/lib/format";
import { Login } from "../../Login";
import { StatusButtons } from "./StatusButtons";
export const dynamic = "force-dynamic";

type Slot = { key?: string; zoom: number; dx: number; dy: number; rot: number; w: number; h: number };
type Design = { preview?: string; text?: Record<string, string>; options?: Record<string, string>; slots?: Slot[]; canvas?: { w: number; h: number; aspect: number } };

export default async function AdminOrder({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return <Login />;
  const o = (await getOrder((await params).id)) as Record<string, unknown> | null;
  if (!o) notFound();
  const a = o.shippingJson as Record<string, string>;
  const items = o.items as { name: string; variant: string; qty: number; unitPrice: number; preview?: string; design?: Design | null }[];
  const links: Record<string, string> = {};
  if (storageEnabled) for (const it of items) for (const s of it.design?.slots ?? []) if (s.key && !links[s.key]) links[s.key] = await presignGet(s.key);
  return (
    <div>
      <Link href="/admin" className="text-sm text-ink-3">← All orders</Link>
      <div className="flex flex-wrap items-center gap-4 mt-2 mb-6"><h1 className="text-3xl font-bold">Order #{String(o.number)}</h1><span className="chip bg-surface-2">{String(o.status).replace(/_/g, " ")}</span><span className="text-ink-3 text-sm">{new Date(String(o.createdAt)).toLocaleString("en-IN")}</span></div>
      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-4">
          {items.map((it, k) => (
            <div key={k} className="card p-4">
              <div className="flex gap-4">
                {it.preview && /* eslint-disable-next-line @next/next/no-img-element */ <img src={it.preview} alt="" className="w-40 h-40 object-contain rounded-lg border border-line bg-surface-2" />}
                <div className="flex-1">
                  <div className="font-bold text-lg">{it.qty}× {it.name}</div>
                  <div className="text-ink-2">{it.variant}</div>
                  <div className="text-sm text-ink-3">{inr(it.unitPrice)} each</div>
                  {it.design?.text && Object.entries(it.design.text).filter(([, v]) => v).length > 0 && <div className="mt-2 text-sm"><b>Text:</b> {Object.entries(it.design.text).filter(([, v]) => v).map(([k, v]) => `${k}: “${v}”`).join(" · ")}</div>}
                  {it.design?.options && <div className="text-sm"><b>Options:</b> {Object.entries(it.design.options).map(([k, v]) => `${k}=${v}`).join(", ")}</div>}
                </div>
              </div>
              {it.design?.slots && (
                <div className="mt-4">
                  <div className="text-sm font-semibold mb-2">Original photos ({it.design.slots.filter((s) => s.key).length})</div>
                  <div className="flex flex-wrap gap-2">
                    {it.design.slots.map((s, i) => s.key ? (
                      <a key={i} href={links[s.key] ?? "#"} target="_blank" rel="noreferrer" className={`chip border border-line ${links[s.key] ? "hover:border-brand" : "opacity-50"}`} title={`${s.w}×${s.h}px · zoom ${s.zoom.toFixed(2)} · rot ${s.rot}°`}>Slot {i + 1} ↓ {s.w}×{s.h}</a>
                    ) : null)}
                    {!storageEnabled && <span className="text-xs text-ink-3">Object storage not configured — originals were not stored.</span>}
                  </div>
                  <details className="mt-2 text-xs"><summary className="cursor-pointer text-ink-3">Design JSON (crop data for print)</summary><pre className="bg-surface-2 p-3 rounded-lg overflow-x-auto mt-1">{JSON.stringify({ canvas: it.design.canvas, slots: it.design.slots, text: it.design.text, options: it.design.options }, null, 2)}</pre></details>
                </div>
              )}
            </div>
          ))}
        </div>
        <aside className="space-y-4">
          <div className="card p-4 text-sm">
            <div className="font-bold mb-2">Customer</div>
            <div>{a.name}</div><div>{a.line1}{a.line2 ? `, ${a.line2}` : ""}</div><div>{a.city}, {a.state} {a.pincode}</div>
            <div className="mt-2"><a href={`tel:+91${a.phone}`} className="text-brand">{a.phone}</a> · <a href={`mailto:${String(o.email)}`} className="text-brand">{String(o.email)}</a></div>
            {o.giftMessage ? <div className="mt-3 p-2 bg-brand-soft rounded-lg"><b>Gift message:</b> {String(o.giftMessage)}</div> : null}
          </div>
          <div className="card p-4 text-sm space-y-1">
            <div className="font-bold mb-2">Payment</div>
            <div className="flex justify-between"><span>Subtotal</span><span>{inr(Number(o.subtotal))}</span></div>
            {Number(o.discount) > 0 && <div className="flex justify-between"><span>Discount {String(o.couponCode ?? "")}</span><span>−{inr(Number(o.discount))}</span></div>}
            <div className="flex justify-between"><span>Shipping ({String(o.shipMethod)})</span><span>{inr(Number(o.shipping))}</span></div>
            <div className="flex justify-between font-bold border-t border-line pt-1"><span>Total</span><span>{inr(Number(o.total))}</span></div>
            <div className="text-ink-3">{String(o.paymentMethod)}{o.razorpayPaymentId ? ` · ${String(o.razorpayPaymentId)}` : ""}</div>
          </div>
          <StatusButtons id={String(o.id)} status={String(o.status)} trackingUrl={(o.trackingUrl as string) ?? ""} />
        </aside>
      </div>
    </div>
  );
}
