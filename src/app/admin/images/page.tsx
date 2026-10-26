import { isAdmin } from "@/lib/admin";
import { Login } from "../Login";
import { AdminNav } from "../AdminNav";
import { ImagesManager } from "./ImagesManager";
export const dynamic = "force-dynamic";
export const metadata = { title: "Images", robots: { index: false } };

export default async function AdminImages() {
  if (!(await isAdmin())) return <Login />;
  return (
    <div>
      <AdminNav title={<>Images</>} current="/admin/images" className="mb-2" />
      <p className="text-sm text-ink-2 mb-6">Every picture on the site, in one place. Replace any of them with an upload or a link, then press <b>Publish</b>. Changes go live in about 2–3 minutes.</p>
      <ImagesManager />
    </div>
  );
}
