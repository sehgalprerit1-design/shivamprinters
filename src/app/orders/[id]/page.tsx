import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrder } from "@/lib/orders";
import { inr } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order", robots: { index: false } };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ placed?: string }> }) {
  const o = (await getOrder((await params).id)) as Record<string, unknown> | null;
  if (!o) notFound();
  const placed = (await searchParams).placed === "1";
  const items = o.items as { name: string; variant: string; qty: number; unitPrice: number; preview?: string }[];
  const addr = o.shippingJson as Record<string, string>;
  const status = String(o.status).replace(/_/g, " ").toLowerCase();
  return (
    <div className="container-x pt-10 max-w-3xl">
      {placed && <div className="rounded-2xl bg-accent-soft text-accent p-5 mb-6"><div className="font-bold text-lg">Order placed. Thank you!</div><div className="text-sm">We&apos;ve emailed {String(o.email)}. Production starts within 24 hours.</div></div>}
      <h1 className="text-3xl font-bold">Order #{String(o.number)}</h1>
      <div className="text-sm text-ink-2 mt-1 capitalize">Status: {status} · {String(o.shipMethod)} delivery</div>
      <div className="card mt-6 divide-y divide-line">
        {items.map((i, k) => (
          <div key={k} className="flex gap-4 p-4">
            <div className="w-16 h-16 rounded-lg bg-surface-2 bg-cover bg-center border border-line" style={{ backgroundImage: i.preview ? `url(${i.preview})` : undefined }} />
            <div className="flex-1"><div className="font-semibold">{i.name}</div><div className="text-xs text-ink-3">{i.variant} × {i.qty}</div></div>
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
      <Link href="/products" className="btn btn-ghost mt-6">Continue shopping</Link>
    </div>
  );
}
