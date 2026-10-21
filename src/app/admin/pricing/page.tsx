import Link from "next/link";
import { isAdmin } from "@/lib/admin";
import { pricingRows, pricingPublishMode } from "@/lib/pricing";
import { Login } from "../Login";
import { SignOut } from "../SignOut";
import { PricingSheet } from "./PricingSheet";
export const dynamic = "force-dynamic";

export default async function Pricing() {
  if (!(await isAdmin())) return <Login />;
  const rows = pricingRows();
  return (
    <div>
      <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-4"><h1 className="text-3xl font-bold">Pricing</h1><Link href="/admin" className="text-brand text-sm font-semibold">Orders →</Link><Link href="/admin/enquiries" className="text-brand text-sm font-semibold">Enquiries →</Link></div><SignOut /></div>
      <PricingSheet initial={rows} mode={pricingPublishMode()} />
    </div>
  );
}
