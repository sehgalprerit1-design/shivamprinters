import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrder } from "@/lib/orders";
import { inr } from "@/lib/format";
import { CallUs } from "@/components/ui/CallUs";
import { TrackPurchase } from "@/components/analytics/Analytics";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order", robots: { index: false } };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ placed?: string }> }) {
  const o = (await getOrder((await params).id)) as Record<string, unknown> | null;
  if (!o) notFound();
  const placed = (await searchParams).placed === "1";
  const items = o.items as { name: string; variant: string; qty: number; unitPrice: number; preview?: string; design?: { text?: Record<string, string>; photoCount?: number } | null }[];
  const addr = o.shippingJson as Record<string, string>;
  const status = String(o.status).replace(/_/g, " ").toLowerCase();
  return (
    <div className="container-x pt-10 max-w-3xl">
      {placed && <TrackPurchase orderId={String(o.number)} value={Number(o.total)} />}
      {placed && <div className="rounded-2xl bg-accent-soft text-accent p-5 mb-6"><div className="font-bold text-lg">Order placed. Thank you!</div><div className="text-sm">We&apos;ve emailed {String(o.email)}. Production starts within 24 hours.</div></div>}
      {String(o.status) === "PENDING_PAYMENT" && <div className="rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 p-5 mb-6"><div className="font-bold">Payment not received yet</div><div className="text-sm">This order will start production once payment is confirmed. If the payment window closed, call or WhatsApp us on 9910888217 to pay by UPI, or place the order again with cash on delivery.</div></div>}
      <h1 className="text-3xl font-bold">Order #{String(o.number)}</h1>
      <div className="text-sm text-ink-2 mt-1 capitalize">Status: {status} · {String(o.shipMethod)} delivery</div>
      <div className="card mt-6 divide-y divide-line">
        {items.map((i, k) => (
          <div key={k} className="flex gap-4 p-4">
            <div className="w-16 h-16 rounded-lg bg-surface-2 bg-cover bg-center border border-line" style={{ backgroundImage: i.preview ? `url(${i.preview})` : undefined }} />
            <div className="flex-1 min-w-0"><div className="font-semibold">{i.name}</div><div className="text-xs text-ink-3">{i.variant} × {i.qty}</div>
              {i.design?.text && Object.entries(i.design.text).filter(([, v]) => v).length > 0 && <div className="text-xs text-ink-2 mt-1 truncate">{Object.entries(i.design.text).filter(([, v]) => v).map(([k, v]) => `${k}: “${v}”`).join(" · ")}</div>}
              {(i.design?.photoCount ?? 0) > 0 && <div className="text-xs text-ink-3">{i.design!.photoCount} photo{i.design!.photoCount === 1 ? "" : "s"} · design saved for print</div>}</div>
            <div className="font-semibold">{inr(i.unitPrice * i.qty)}</div>
          </div>
        ))}
        <div className="p-4 text-sm space-y-1">
          <div className="flex justify-between"><span>Subtotal</span><span>{inr(Number(o.subtotal))}</span></div>
          {Number(o.discount) > 0 && <div className="flex justify-between text-accent"><span>Discount</span><span>−{inr(Number(o.discount))}</span></div>}
          <div className="flex justify-between"><span>Shipping</span><span>{Number(o.shipping) === 0 ? "Free" : inr(Number(o.shipping))}</span></div>
          <div className="flex justify-between font-bold text-base pt-2"><span>Total</span><span>{inr(Number(o.total))}</span></div>
        </div>
      </div>
      <div className="card p-4 mt-4 text-sm"><div className="font-semibold mb-1">Delivering to</div><div className="text-ink-2">{addr.name}, {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state} {addr.pincode} · {addr.phone}</div></div>
      <div className="mt-4"><CallUs /></div>
      <Link href="/products" className="btn btn-ghost mt-4">Continue shopping</Link>
    </div>
  );
}
