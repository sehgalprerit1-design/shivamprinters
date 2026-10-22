import { isAdmin } from "@/lib/admin";
import { listCustomers } from "@/lib/customers";
import { Login } from "../Login";
import { AdminNav } from "../AdminNav";
import { CustomerTable } from "./CustomerTable";
export const dynamic = "force-dynamic";

export default async function Customers() {
  if (!(await isAdmin())) return <Login />;
  const rows = await listCustomers();
  return (
    <div>
      <AdminNav title={<>Customers</>} current="/admin/customers" />
      <CustomerTable initial={JSON.parse(JSON.stringify(rows))} />
    </div>
  );
}
