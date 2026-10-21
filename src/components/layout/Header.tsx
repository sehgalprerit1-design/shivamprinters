import Link from "next/link";
import { categories, productsInCategory } from "@/data/catalog";
import { giftPagesByGroup } from "@/data/gifts";
import { CartButton } from "@/components/cart/CartButton";
import { MobileNav } from "./MobileNav";
import { SearchBox } from "./SearchBox";

const month = new Date().getMonth() + 1;
const seasonal = [...giftPagesByGroup("festival"), ...giftPagesByGroup("occasion")]
  .filter((g) => g.season && month >= g.season.startMonth && month <= g.season.endMonth)
  .slice(0, 1)[0];

export function Header() {
  const occasions = giftPagesByGroup("occasion").slice(0, 12);
  const recipients = giftPagesByGroup("recipient").filter((g) => !g.slug.includes("-gifts-for-")).slice(0, 14);
  const festivals = giftPagesByGroup("festival").slice(0, 8);
  const collections = giftPagesByGroup("collection").slice(0, 8);

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur border-b border-line">
      <div className="bg-ink text-white text-xs text-center py-1.5 px-4">
        <span className="font-semibold">25% off up to ₹1,000</span> with code <span className="font-mono bg-white/15 px-1.5 py-0.5 rounded">PATAKA25</span> · Free shipping over ₹999 · COD available · <a href="tel:+919910888217" className="underline underline-offset-2">Questions? Call us 9910888217</a> · <a href="https://wa.me/919910888217?text=Hi%20Shivam%20Printers%2C%20I%20have%20a%20question." target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">WhatsApp</a>
      </div>
      <div className="container-x flex items-center gap-4 h-16">
        <MobileNav categories={categories} occasions={occasions} recipients={recipients} />
        <Link href="/" className="display text-xl md:text-2xl font-bold tracking-tight text-ink shrink-0 whitespace-nowrap">
          Shivam <span className="text-brand">Printers</span>
        </Link>
        <div className="hidden md:block flex-1 max-w-xl">
          <SearchBox />
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Link href="/wishlist" className="btn btn-ghost !px-3 hidden sm:inline-flex text-sm">Saved</Link>
          <Link href="/account" className="btn btn-ghost !px-3 hidden sm:inline-flex text-sm">Account</Link>
          <CartButton />
        </div>
      </div>
      <nav className="hidden md:block border-t border-line relative">
        <ul className="container-x flex items-center gap-5 h-11 text-sm font-medium">
          {categories.slice(0, 9).map((c) => (
            <li key={c.slug} className="nav-item static">
              <Link href={`/c/${c.slug}`} className="py-3 inline-block hover:text-brand">{c.name}</Link>
              <div className="mega">
                <div className="container-x grid grid-cols-[1fr_1fr_1fr_280px] gap-8 py-8">
                  <div className="col-span-3 grid grid-cols-3 gap-x-8 gap-y-1">
                    {productsInCategory(c.slug).slice(0, 18).map((p) => (
                      <Link key={p.slug} href={`/p/${p.slug}`} className="py-1.5 text-ink-2 hover:text-brand">{p.name}</Link>
                    ))}
                    <Link href={`/c/${c.slug}`} className="py-1.5 font-semibold text-brand">All {c.name} →</Link>
                  </div>
                  <Link href={`/c/${c.slug}`} className="card block">
                    <div className="aspect-[4/3] bg-surface-2 bg-cover bg-center" style={{ backgroundImage: `url(${c.image})` }} />
                    <div className="p-3">
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-ink-3 text-xs">{c.tagline}</div>
                    </div>
                  </Link>
                </div>
              </div>
            </li>
          ))}
          <li className="nav-item static">
            <Link href="/gifts" className="py-3 inline-block hover:text-brand">Gift Ideas</Link>
            <div className="mega">
              <div className="container-x grid grid-cols-4 gap-8 py-8 text-ink-2">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-ink-3 mb-2">By occasion</div>
                  {occasions.map((g) => <Link key={g.slug} href={`/gifts/${g.slug}`} className="block py-1 hover:text-brand">{g.title}</Link>)}
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-ink-3 mb-2">By recipient</div>
                  {recipients.map((g) => <Link key={g.slug} href={`/gifts/${g.slug}`} className="block py-1 hover:text-brand">{g.title.replace("Gifts for ", "")}</Link>)}
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-ink-3 mb-2">Festivals</div>
                  {festivals.map((g) => <Link key={g.slug} href={`/gifts/${g.slug}`} className="block py-1 hover:text-brand">{g.title}</Link>)}
                  <div className="text-xs font-semibold uppercase tracking-wide text-ink-3 mb-2 mt-5">Collections</div>
                  {collections.map((g) => <Link key={g.slug} href={`/gifts/${g.slug}`} className="block py-1 hover:text-brand">{g.title}</Link>)}
                </div>
                <Link href={seasonal ? `/gifts/${seasonal.slug}` : "/gifts"} className="card block">
                  <div className="aspect-[4/3] bg-surface-2 bg-cover bg-center" style={{ backgroundImage: `url(${seasonal?.image ?? "/images/diwali.jpg"})` }} />
                  <div className="p-3">
                    <div className="font-semibold text-ink">{seasonal?.title ?? "Gift finder"}</div>
                    <div className="text-ink-3 text-xs">Shop the season →</div>
                  </div>
                </Link>
              </div>
            </div>
          </li>
          {seasonal && (
            <li className="ml-auto">
              <Link href={`/gifts/${seasonal.slug}`} className="chip bg-brand-soft text-brand-ink">{seasonal.title}</Link>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
}
