import { isAdmin } from "@/lib/admin";
import { catalogueState, publishMode } from "@/lib/catalogue";
import { Login } from "../Login";
import { AdminNav } from "../AdminNav";
import { CatalogueSheet } from "./CatalogueSheet";
export const dynamic = "force-dynamic";

export default async function Pricing() {
  if (!(await isAdmin())) return <Login />;
  const state = catalogueState();
  return (
    <div>
      <AdminNav title={<>Catalogue &amp; pricing</>} current="/admin/pricing" className="mb-2" />
      <CatalogueSheet initial={state} mode={publishMode()} />
    </div>
  );
}
