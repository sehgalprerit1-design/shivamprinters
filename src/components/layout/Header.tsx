import Link from "next/link";
import { productsInCategory, type Category } from "@/data/catalog";
import { navItems, type NavGroup } from "@/data/nav";
import { giftPagesByGroup } from "@/data/gifts";
import { CartButton } from "@/components/cart/CartButton";
import { MobileNav } from "./MobileNav";
import { SearchBox } from "./SearchBox";
import { describeCoupon, type CouponPublic } from "@/lib/coupons";

const month = new Date().getMonth() + 1;
const seasonal = [...giftPagesByGroup("festival"), ...giftPagesByGroup("occasion")]
  .filter((g) => g.season && month >= g.season.startMonth && month <= g.season.endMonth)
  .slice(0, 1)[0];

function PromoCard({ href, image, title, tagline }: { href: string; image: string; title: string; tagline: string }) {
  return (
    <Link href={href} className="card block">
      <div className="aspect-[4/3] bg-surface-2 bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} />
      <div className="p-3">
        <div className="font-semibold">{title}</div>
        <div className="text-ink-3 text-xs">{tagline}</div>
      </div>
    </Link>
  );
}

/** Mega menu for a single category: products in three columns + the category card. */
function CategoryMega({ c }: { c: Category }) {
  return (
    <div className="mega">
      <div className="container-x grid grid-cols-[1fr_1fr_1fr_280px] gap-8 py-8">
        <div className="col-span-3 grid grid-cols-3 gap-x-8 gap-y-1">
          {productsInCategory(c.slug).slice(0, 18).map((p) => (
            <Link key={p.slug} href={`/p/${p.slug}`} className="py-1.5 text-ink-2 hover:text-brand">{p.name}</Link>
          ))}
          <Link href={`/c/${c.slug}`} className="py-1.5 font-semibold text-brand">All {c.name} →</Link>
        </div>
        <PromoCard href={`/c/${c.slug}`} image={c.image} title={c.name} tagline={c.tagline} />
      </div>
    </div>
  );
}

/** Mega menu for a group (Photo, Business Printing): one column per sub-category + the group card. */
function GroupMega({ g }: { g: NavGroup }) {
  const cols = g.categories.length;
  const per = cols >= 3 ? 10 : 12;
  return (
    <div className="mega">
      <div className="container-x grid gap-8 py-8" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr)) 280px` }}>
        {g.categories.map((c) => (
          <div key={c.slug}>
            <Link href={`/c/${c.slug}`} className="block text-xs font-semibold uppercase tracking-wide text-ink-3 mb-2 hover:text-brand">{c.name}</Link>
            {productsInCategory(c.slug).slice(0, per).map((p) => (
              <Link key={p.slug} href={`/p/${p.slug}`} className="block py-1.5 text-ink-2 hover:text-brand">{p.name}</Link>
            ))}
            <Link href={`/c/${c.slug}`} className="block py-1.5 font-semibold text-brand">All {c.name} →</Link>
            {c.slug === "business-printing" && <Link href="/custom-printing" className="block py-1.5 font-semibold text-ink">Custom printing — get a quote</Link>}
          </div>
        ))}
        <PromoCard href={`/c/${g.slug}`} image={g.image} title={g.name} tagline={g.tagline} />
      </div>
    </div>
  );
}

export function Header({ promo }: { promo?: CouponPublic | null }) {
  const occasions = giftPagesByGroup("occasion").slice(0, 12);
  const recipients = giftPagesByGroup("recipient").filter((g) => !g.slug.includes("-gifts-for-")).slice(0, 14);
  const festivals = giftPagesByGroup("festival").slice(0, 8);
  const collections = giftPagesByGroup("collection").slice(0, 8);

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur border-b border-line">
      <div className="bg-ink text-white text-xs text-center py-1.5 px-4">
        {promo ? <><span className="font-semibold">{describeCoupon(promo)}</span> with code <span className="font-mono bg-white/15 px-1.5 py-0.5 rounded">{promo.code}</span><span className="hidden sm:inline"> · Free shipping over ₹999 · COD available</span></> : <><span className="font-semibold">Free shipping over ₹999</span> · COD available</>} · <a href="tel:+919910888217" className="underline underline-offset-2"><span className="hidden sm:inline">Questions? </span>Call<span className="hidden sm:inline"> us</span> 9910888217</a> · <a href="https://wa.me/919910888217?text=Hi%20Shivam%20Printers%2C%20I%20have%20a%20question." target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">WhatsApp</a>
      </div>
      <div className="container-x flex items-center gap-4 h-16">
        <MobileNav items={navItems} occasions={occasions} recipients={recipients} />
        <Link href="/" className="display text-xl md:text-2xl font-bold tracking-tight text-ink shrink-0 whitespace-nowrap">
          Shivam <span className="text-brand">Printers</span>
        </Link>
        <div className="hidden md:block flex-1 max-w-xl">
          <SearchBox />
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Link href="/wishlist" className="btn btn-ghost !px-3 hidden sm:inline-flex text-sm">Saved</Link>
          <Link href="/account" className="btn btn-ghost !px-3 hidden sm:inline-flex text-sm">Track order</Link>
          <CartButton />
        </div>
      </div>
      <nav className="hidden md:block border-t border-line relative">
        <ul className="container-x flex items-center gap-x-4 xl:gap-x-5 h-11 text-[13px] xl:text-sm font-medium whitespace-nowrap overflow-x-auto no-scrollbar">
          {navItems.filter((it) => it.kind === "category" || !it.group.highlight).map((it) => it.kind === "category" ? (
            <li key={it.category.slug} className="nav-item static">
              <Link href={`/c/${it.category.slug}`} className="py-3 inline-block whitespace-nowrap hover:text-brand">{it.category.name}</Link>
              <CategoryMega c={it.category} />
            </li>
          ) : (
            <li key={it.group.slug} className="nav-item static">
              <Link href={`/c/${it.group.slug}`} className="py-3 inline-block whitespace-nowrap hover:text-brand">{it.group.name}</Link>
              <GroupMega g={it.group} />
            </li>
          ))}
          <li className="nav-item static">
            <Link href="/gifts" className="py-3 inline-block whitespace-nowrap hover:text-brand">Gift Ideas</Link>
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
          {navItems.filter((it) => it.kind === "group" && it.group.highlight).map((it) => it.kind === "group" && (
            <li key={it.group.slug} className="nav-item static ml-auto">
              <Link href={`/c/${it.group.slug}`} className="my-1.5 inline-flex items-center whitespace-nowrap rounded-full bg-amber-300 text-ink px-3.5 py-1.5 font-semibold hover:bg-amber-400 shadow-sm">{it.group.name}</Link>
              <GroupMega g={it.group} />
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
