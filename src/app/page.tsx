import Link from "next/link";
import { categories, products, productsByTag } from "@/data/catalog";
import { giftPagesByGroup } from "@/data/gifts";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Section } from "@/components/ui/Section";
import { Upload, Palette, Truck, ShieldCheck } from "lucide-react";

const month = new Date().getMonth() + 1;

export default function Home() {
  const featured = products.filter((p) => p.featured);
  const seasonal = [...giftPagesByGroup("festival"), ...giftPagesByGroup("occasion")].filter(
    (g) => g.season && month >= g.season.startMonth && month <= g.season.endMonth,
  );
  const occasionTiles = [...seasonal, ...giftPagesByGroup("occasion").filter((g) => ["birthday-gifts", "anniversary-gifts", "wedding-gifts", "corporate-gifts"].includes(g.slug))].slice(0, 4);
  const under499 = productsByTag(["under-499"], 8);
  const steps = [
    { Icon: Upload, t: "Upload", d: "From your phone, Google Photos or Instagram. Any size, we handle the rest." },
    { Icon: Palette, t: "Personalise", d: "Pick a layout, drop in photos, add names and captions. Preview before you pay." },
    { Icon: Truck, t: "We print & ship", d: "Made in our own print centre. Express in 4–6 days, economy in 10–12." },
    { Icon: ShieldCheck, t: "100% happiness", d: "Not right? We reprint or refund. No forms, no fuss." },
  ];

  return (
    <>
      <section className="container-x pt-6 md:pt-10">
        <div className="relative rounded-3xl overflow-hidden bg-ink text-white min-h-[460px] md:min-h-[560px] flex items-end">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/hero.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-90" fetchPriority="high" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="relative p-6 md:p-12 max-w-2xl fade-up">
            <span className="chip bg-white/15 backdrop-blur text-white mb-4">Made in our own print centre · Pan-India delivery</span>
            <h1 className="text-4xl md:text-6xl font-bold leading-[1.05]">Your photos, <em className="not-italic text-brand">printed properly.</em></h1>
            <p className="text-white/85 text-lg mt-4 max-w-lg">Photobooks, frames, calendars and gifts made from the pictures on your phone. Upload, personalise in minutes, delivered anywhere in India.</p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link href="/products" className="btn btn-primary">Start creating</Link>
              <Link href="/gifts" className="btn bg-white text-ink hover:bg-surface-2">Find a gift</Link>
            </div>
          </div>
        </div>
      </section>

      <Section title="What would you like to make?">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
          {categories.slice(0, 8).map((c) => (
            <Link key={c.slug} href={`/c/${c.slug}`} className="card group relative aspect-[4/3]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.image} alt={c.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <div className="font-bold text-lg leading-tight">{c.name}</div>
                <div className="text-white/80 text-xs">{c.tagline}</div>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Customer favourites" subtitle="The products that get reordered most." href="/products">
        <ProductGrid products={featured} />
      </Section>

      <Section title="Shop by occasion" href="/gifts" hrefLabel="All gift ideas">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
          {occasionTiles.map((g) => (
            <Link key={g.slug} href={`/gifts/${g.slug}`} className="card p-5 hover:border-brand transition-colors">
              <div className="text-xs font-semibold uppercase tracking-wide text-brand">{g.group === "festival" ? "This season" : "Occasion"}</div>
              <div className="font-bold text-lg mt-1">{g.title}</div>
              <p className="text-ink-2 text-sm mt-1 line-clamp-2">{g.intro}</p>
            </Link>
          ))}
        </div>
      </Section>

      <section className="bg-surface-2 border-y border-line">
        <div className="container-x py-12 grid md:grid-cols-4 gap-6">
          {steps.map(({ Icon, t, d }) => (
            <div key={t} className="flex gap-4">
              <div className="w-11 h-11 rounded-full bg-brand-soft text-brand grid place-items-center shrink-0"><Icon size={20} /></div>
              <div><div className="font-bold">{t}</div><div className="text-ink-2 text-sm mt-0.5">{d}</div></div>
            </div>
          ))}
        </div>
      </section>

      <Section title="Gifts under ₹499" subtitle="Small, personal, no reason needed." href="/gifts/budget-gifts">
        <ProductGrid products={under499} />
      </Section>

      <section className="container-x">
        <div className="rounded-3xl overflow-hidden grid md:grid-cols-2 bg-[#fff4c7]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/cat-kids.jpg" alt="Shivam Printers kids range" className="w-full h-64 md:h-full object-cover" loading="lazy" />
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-2">Shivam Printers Kids</div>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">Name it. Label it. Never lose it.</h2>
            <p className="text-ink-2 mt-3">Bottles, lunch boxes, labels, pencils and storybooks with your child&apos;s name on. School-proof and dishwasher-safe.</p>
            <Link href="/c/kids" className="btn btn-secondary mt-6 self-start">Shop kids</Link>
          </div>
        </div>
      </section>

      <Section title="What customers say" subtitle="Rated by real customers.">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            ["Priya S., Pune", "The layflat album for our wedding came out better than the photographer's own. Pages are thick and the colours are exact."],
            ["Arjun M., Bengaluru", "Ordered 40 desktop calendars for the team on a Monday, had them by Friday. Printing is sharp and the stand is solid."],
            ["Neha K., Delhi", "The name stickers survived a whole term of washing. Lunch box lid print still looks new."],
          ].map(([who, text]) => (
            <figure key={who} className="card p-5">
              <div className="text-gold text-sm">★★★★★</div>
              <blockquote className="mt-2 text-ink-2">{text}</blockquote>
              <figcaption className="mt-3 text-sm font-semibold">{who}</figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <section className="container-x pb-6">
        <div className="max-w-3xl text-ink-2 text-sm leading-relaxed">
          <h2 className="text-xl font-bold text-ink mb-2">Print photos online and make personalised gifts at Shivam Printers</h2>
          <p>Shivam Printers prints photos and personalised gifts for Indian families. Everything on this site — photobooks, framed prints, acrylic and canvas wall art, calendars, mugs, cushions and the Shivam Printers kids&apos; range — is printed and assembled in our own production centre and shipped anywhere in India, with cash on delivery on most orders. Upload from your phone, personalise in the browser and preview before you pay.</p>
        </div>
      </section>
    </>
  );
}
