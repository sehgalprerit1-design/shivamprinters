import Link from "next/link";
import { isAdmin } from "@/lib/admin";
import { listOrders } from "@/lib/orders";
import { inr } from "@/lib/format";
import { Login } from "./Login";
import { SignOut } from "./SignOut";
export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = { PENDING_PAYMENT: "bg-amber-100 text-amber-900", PAID: "bg-accent-soft text-accent", COD_CONFIRMED: "bg-accent-soft text-accent", IN_PRODUCTION: "bg-blue-100 text-blue-900", SHIPPED: "bg-purple-100 text-purple-900", DELIVERED: "bg-green-100 text-green-900", CANCELLED: "bg-surface-2 text-ink-3", REFUNDED: "bg-surface-2 text-ink-3" };

export default async function Admin() {
  if (!(await isAdmin())) return <Login />;
  const orders = (await listOrders()) as Record<string, unknown>[];
  const today = new Date().toISOString().slice(0, 10);
  const todays = orders.filter((o) => String(o.createdAt).slice(0, 10) === today);
  const open = orders.filter((o) => ["PAID", "COD_CONFIRMED", "IN_PRODUCTION"].includes(String(o.status)));
  return (
    <div>
      <div className="flex items-center justify-between mb-6"><div className="flex items-center gap-4"><h1 className="text-3xl font-bold">Orders</h1><Link href="/admin/enquiries" className="text-brand text-sm font-semibold">Enquiries →</Link></div><SignOut /></div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[["Today", todays.length, inr(todays.reduce((a, o) => a + Number(o.total), 0))], ["To produce / ship", open.length, ""], ["All orders", orders.length, inr(orders.reduce((a, o) => a + Number(o.total), 0))]].map(([t, n, v]) => <div key={String(t)} className="card p-4"><div className="text-xs text-ink-3">{t}</div><div className="text-2xl font-bold">{n}</div><div className="text-sm text-ink-2">{v}</div></div>)}
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs text-ink-3"><tr><th className="p-3">Order</th><th className="p-3">When</th><th className="p-3">Customer</th><th className="p-3">Items</th><th className="p-3">Total</th><th className="p-3">Pay</th><th className="p-3">Status</th></tr></thead>
          <tbody>
            {orders.map((o) => { const a = o.shippingJson as Record<string, string>; const items = o.items as { name: string; qty: number }[]; return (
              <tr key={String(o.id)} className="border-t border-line hover:bg-surface-2">
                <td className="p-3 font-semibold"><Link href={`/admin/orders/${o.id}`} className="text-brand">#{String(o.number)}</Link></td>
                <td className="p-3 text-ink-3 whitespace-nowrap">{new Date(String(o.createdAt)).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                <td className="p-3">{a.name}<div className="text-xs text-ink-3">{a.city} · {a.phone}</div></td>
                <td className="p-3 text-ink-2">{items.map((i) => `${i.qty}× ${i.name}`).join(", ")}</td>
                <td className="p-3 font-semibold">{inr(Number(o.total))}</td>
                <td className="p-3 text-xs">{String(o.paymentMethod)}</td>
                <td className="p-3"><span className={`chip ${STATUS_COLOR[String(o.status)] ?? ""}`}>{String(o.status).replace(/_/g, " ")}</span></td>
              </tr>); })}
            {orders.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-ink-3">No orders yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
