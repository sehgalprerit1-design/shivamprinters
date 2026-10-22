import { isAdmin } from "@/lib/admin";
import { listCoupons } from "@/lib/coupons";
import { Login } from "../Login";
import { AdminNav } from "../AdminNav";
import { CouponManager } from "./CouponManager";
export const dynamic = "force-dynamic";

export default async function Coupons() {
  if (!(await isAdmin())) return <Login />;
  const coupons = await listCoupons();
  return (
    <div>
      <AdminNav title={<>Coupons</>} current="/admin/coupons" className="mb-4" />
      <CouponManager coupons={JSON.parse(JSON.stringify(coupons))} />
    </div>
  );
}
