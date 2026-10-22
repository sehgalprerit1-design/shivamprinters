import Link from "next/link";
import { isAdmin } from "@/lib/admin";
import { listCoupons } from "@/lib/coupons";
import { Login } from "../Login";
import { SignOut } from "../SignOut";
import { CouponManager } from "./CouponManager";
export const dynamic = "force-dynamic";

export default async function Coupons() {
  if (!(await isAdmin())) return <Login />;
  const coupons = await listCoupons();
  return (
    <div>
      <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-4"><h1 className="text-3xl font-bold">Coupons</h1><Link href="/admin" className="text-brand text-sm font-semibold">Orders →</Link><Link href="/admin/pricing" className="text-brand text-sm font-semibold">Catalogue &amp; pricing →</Link></div><SignOut /></div>
      <CouponManager coupons={JSON.parse(JSON.stringify(coupons))} />
    </div>
  );
}
