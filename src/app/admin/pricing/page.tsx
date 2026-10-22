import Link from "next/link";
import { isAdmin } from "@/lib/admin";
import { catalogueState, publishMode } from "@/lib/catalogue";
import { Login } from "../Login";
import { SignOut } from "../SignOut";
import { CatalogueSheet } from "./CatalogueSheet";
export const dynamic = "force-dynamic";

export default async function Pricing() {
  if (!(await isAdmin())) return <Login />;
  const state = catalogueState();
  return (
    <div>
      <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-4"><h1 className="text-3xl font-bold">Catalogue &amp; pricing</h1><Link href="/admin" className="text-brand text-sm font-semibold">Orders →</Link><Link href="/admin/enquiries" className="text-brand text-sm font-semibold">Enquiries →</Link><Link href="/admin/reviews" className="text-brand text-sm font-semibold">Reviews →</Link><Link href="/admin/coupons" className="text-brand text-sm font-semibold">Coupons →</Link></div><SignOut /></div>
      <CatalogueSheet initial={state} mode={publishMode()} />
    </div>
  );
}
