import Link from "next/link";
import { SignOut } from "./SignOut";

export const ADMIN_SECTIONS = [
  { href: "/admin", label: "Orders" },
  { href: "/admin/enquiries", label: "Enquiries" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/pricing", label: "Catalogue & pricing" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/reviews", label: "Reviews" },
] as const;

/** Page title plus links to every other admin section. */
export function AdminNav({ title, current, className = "mb-6" }: { title: React.ReactNode; current: (typeof ADMIN_SECTIONS)[number]["href"]; className?: string }) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-y-2 ${className}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <h1 className="text-3xl font-bold">{title}</h1>
        {ADMIN_SECTIONS.filter((s) => s.href !== current).map((s) => <Link key={s.href} href={s.href} className="text-brand text-sm font-semibold whitespace-nowrap">{s.label} →</Link>)}
      </div>
      <SignOut />
    </div>
  );
}
