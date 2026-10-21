import { cookies } from "next/headers";
import crypto from "node:crypto";

const secret = () => process.env.ADMIN_PASSWORD ?? "";
export const adminToken = () => crypto.createHmac("sha256", secret()).update("admin-session").digest("hex");
export async function isAdmin() {
  if (!secret()) return false;
  const c = (await cookies()).get("sp_admin")?.value;
  return !!c && crypto.timingSafeEqual(Buffer.from(c), Buffer.from(adminToken()));
}
