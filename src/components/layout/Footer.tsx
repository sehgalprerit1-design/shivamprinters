import Link from "next/link";
import { navItems } from "@/data/nav";
import { giftPagesByGroup } from "@/data/gifts";
import { CallUs } from "@/components/ui/CallUs";
import { SubscribeForm } from "./SubscribeForm";

export function Footer() {
  const recipients = giftPagesByGroup("recipient").filter((g) => !g.slug.includes("-gifts-for-")).slice(0, 10);
  const occasions = giftPagesByGroup("occasion").slice(0, 10);
  return (
    <footer className="bg-surface-2 border-t border-line mt-20">
      <div className="container-x py-12 grid grid-cols-2 md:grid-cols-5 gap-8 text-sm">
        <div className="col-span-2 md:col-span-1">
          <div className="display text-2xl font-bold">Shivam <span className="text-brand">Printers</span></div>
          <p className="text-ink-2 mt-3">Photo printing and personalised gifts, made in our own print centre and delivered across India.</p>
          <div className="mt-4 text-ink-3 text-xs">Personalised kids&apos; essentials too — see our Kids range</div>
          <div className="mt-4"><CallUs /></div>
          <SubscribeForm />
        </div>
        <div>
          <div className="font-semibold mb-3">Shop</div>
          {navItems.map((it) => it.kind === "category" ? (
            <Link key={it.category.slug} href={`/c/${it.category.slug}`} className="block py-1 text-ink-2 hover:text-brand">{it.category.name}</Link>
          ) : (
            <div key={it.group.slug}>
              <Link href={`/c/${it.group.slug}`} className="block py-1 text-ink-2 hover:text-brand">{it.group.name}</Link>
              {it.group.categories.filter((c) => c.slug !== it.group.slug).map((c) => <Link key={c.slug} href={`/c/${c.slug}`} className="block py-1 pl-3 text-ink-3 hover:text-brand">{c.name}</Link>)}
            </div>
          ))}
        </div>
        <div>
          <div className="font-semibold mb-3">Gifts for</div>
          {recipients.map((g) => <Link key={g.slug} href={`/gifts/${g.slug}`} className="block py-1 text-ink-2 hover:text-brand">{g.title.replace("Gifts for ", "")}</Link>)}
        </div>
        <div>
          <div className="font-semibold mb-3">Occasions</div>
          {occasions.map((g) => <Link key={g.slug} href={`/gifts/${g.slug}`} className="block py-1 text-ink-2 hover:text-brand">{g.title}</Link>)}
        </div>
        <div>
          <div className="font-semibold mb-3">Help</div>
          {[["/about", "About Shivam Printers"], ["/about#promise", "Our promise"], ["/help", "Help desk"], ["/returns", "Returns & refunds"], ["/bulk-orders", "Bulk & corporate orders"], ["/corporate-gifting", "Corporate Diwali gifts"], ["/refer", "Refer a friend"], ["/blog", "Ideas & inspiration"], ["/careers", "Careers"]].map(([h, t]) => (
            <Link key={h} href={h} className="block py-1 text-ink-2 hover:text-brand">{t}</Link>
          ))}
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-x py-5 flex flex-col md:flex-row gap-3 justify-between text-xs text-ink-3">
          <div>© {new Date().getFullYear()} Shivam Printers. All rights reserved.</div>
          <div className="flex gap-4"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms of use</Link><Link href="/sitemap.xml">Sitemap</Link></div>
        </div>
      </div>
    </footer>
  );
}
