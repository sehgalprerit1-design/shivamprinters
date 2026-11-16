// Top navigation. Categories stay as they are (URLs, admin sheet, sitemap); this file only
// decides how they are grouped in the header, the mobile drawer, the footer and breadcrumbs.
//
//  • "Photo" is a virtual tab with its own landing page (/c/photo) that gathers Photo Prints,
//    Photobooks and Framed Prints.
//  • "Business Printing" is a real category whose tab also holds Bags & Stationery.
//  • "Wedding" is a virtual tab with its own landing page (/c/wedding) that gathers the three
//    wedding categories. Like Business Printing it is a highlighted button at the right of the nav.
import { categories, getCategory, getProduct, productsInCategory, type Category, type Product } from "./catalog";
import { siteImage, WEDDING_HERO } from "./site-images";

export type NavGroup = {
  slug: string;         // URL: /c/<slug>
  name: string;
  tagline: string;
  description: string;
  image: string;
  categories: Category[];
  highlight?: boolean;  // rendered as a coloured button at the right of the nav
  tone?: "amber" | "rose"; // button colour when highlighted (default amber)
  quote?: { href: string; label: string }; // "get a quote" link shown under the group in menus
  ownPage: boolean;     // true = virtual group page; false = <slug> is itself a category and its page serves as the landing
};

type GroupDef = { slug: string; name?: string; tagline?: string; description?: string; image?: string; categories: string[]; highlight?: boolean; tone?: "amber" | "rose"; quote?: { href: string; label: string } };

const GROUP_DEFS: GroupDef[] = [
  {
    slug: "photo", name: "Photo", tagline: "Print the ones you love",
    description: "Everything printed from your photos: glossy and card-stock prints in packs, hardcover and layflat photobooks, framed prints delivered ready to hang, and restickable photo tiles.",
    image: "/images/cat-prints.jpg",
    categories: ["prints", "photobooks", "framed-prints", "photo-tiles"],
  },
  {
    slug: "wedding", name: "Wedding", tagline: "Cards, signs and shagun envelopes",
    description: "Everything printed for an Indian wedding, from one press: invitation cards and a card for every function, e-invites, welcome boards, menus and table cards, shagun envelopes, favour tags and thank-you cards. Design online, upload your own, or send us the wording. Same-day printing in Delhi NCR.",
    image: siteImage("wedding.hero", WEDDING_HERO)!,
    categories: ["wedding-invitations", "wedding-venue", "wedding-gifting"], highlight: true, tone: "rose",
    quote: { href: "/custom-printing", label: "Boxed, laser-cut & acrylic invites — get a quote" },
  },
  { slug: "business-printing", categories: ["business-printing", "bags-stationery"], highlight: true, quote: { href: "/custom-printing", label: "Custom printing — get a quote" } },
];

function build(def: GroupDef): NavGroup | null {
  const cats = def.categories.map(getCategory).filter((c): c is Category => Boolean(c));
  if (cats.length === 0) return null;
  const head = getCategory(def.slug);
  return {
    slug: def.slug,
    name: def.name ?? head?.name ?? cats[0].name,
    tagline: def.tagline ?? head?.tagline ?? cats[0].tagline,
    description: def.description ?? head?.description ?? cats[0].description,
    image: def.image ?? head?.image ?? cats[0].image,
    categories: cats,
    highlight: def.highlight,
    tone: def.tone,
    quote: def.quote,
    ownPage: !head,
  };
}

export const navGroups: NavGroup[] = GROUP_DEFS.map(build).filter((g): g is NavGroup => Boolean(g));

const grouped = new Set(navGroups.flatMap((g) => g.categories.map((c) => c.slug)));

export type NavItem = { kind: "group"; group: NavGroup } | { kind: "category"; category: Category };

/** Ordered top-level nav: Photo first, then the ungrouped categories, then highlighted groups (Business Printing) last. */
export const navItems: NavItem[] = [
  ...navGroups.filter((g) => !g.highlight).map((group): NavItem => ({ kind: "group", group })),
  ...categories.filter((c) => !grouped.has(c.slug)).map((category): NavItem => ({ kind: "category", category })),
  ...navGroups.filter((g) => g.highlight).map((group): NavItem => ({ kind: "group", group })),
];

export const getGroup = (slug: string) => navGroups.find((g) => g.slug === slug);
/** The group a category belongs to, if any. */
export const groupFor = (categorySlug: string) => navGroups.find((g) => g.categories.some((c) => c.slug === categorySlug));
export const groupProducts = (g: NavGroup): Product[] => g.categories.flatMap((c) => productsInCategory(c.slug));
/** Virtual group pages that need routes of their own (business-printing already has a category page). */
export const groupPages = navGroups.filter((g) => g.ownPage);

/** Breadcrumb trail for a category page: Home / Photo / Photobooks, Home / Business Printing / Bags & Stationery. */
export function categoryTrail(c: Category): { href?: string; label: string }[] {
  const g = groupFor(c.slug);
  if (g && g.slug !== c.slug) return [{ href: `/c/${g.slug}`, label: g.name }, { label: c.name }];
  return [{ label: c.name }];
}

/** Highlighted button colours (kept as literal class names so Tailwind picks them up). */
export const HIGHLIGHT_TONE: Record<"amber" | "rose", string> = {
  amber: "bg-amber-300 text-ink hover:bg-amber-400",
  rose: "bg-rose-600 text-white hover:bg-rose-700",
};

// ---------- Wedding landing page (/c/wedding) ----------

/** Existing products from other categories that wedding customers also order; shown under the wedding ranges. */
const WEDDING_ALSO = ["banners-standees", "gift-paper-bags", "sheet-stickers", "photo-postcards", "money-envelopes", "layflat-photobook", "photo-tile-set-4", "canvas-print"];
export const weddingAlso = (): Product[] => WEDDING_ALSO.map(getProduct).filter((p): p is Product => Boolean(p));

/** What we print for each stage of the wedding, with the product that covers it. Items without a slug are quoted on request. */
export const WEDDING_CHECKLIST: { stage: string; items: { label: string; slug?: string }[] }[] = [
  { stage: "Before the wedding", items: [
    { label: "Save-the-date cards", slug: "save-the-date-cards" },
    { label: "Roka, sagai & ring ceremony invites", slug: "wedding-function-cards" },
    { label: "Main wedding invitation", slug: "wedding-invitation-cards" },
    { label: "Gold foil invitations", slug: "gold-foil-wedding-cards" },
    { label: "Haldi, Mehndi, Sangeet, Cocktail & Reception cards", slug: "wedding-function-cards" },
    { label: "Tilak, Chooda, Jaago, Mayra & Griha Pravesh cards", slug: "wedding-function-cards" },
    { label: "RSVP & itinerary cards", slug: "wedding-function-cards" },
    { label: "Envelopes with names or monogram", slug: "wedding-card-envelopes" },
    { label: "Seals & monogram stickers", slug: "wedding-envelope-seals" },
    { label: "Card + inserts + e-card packages", slug: "wedding-card-packages" },
    { label: "PDF & WhatsApp e-invites", slug: "digital-wedding-invite" },
    { label: "Carry bags for delivering cards", slug: "gift-paper-bags" },
    { label: "Scroll, laser-cut, padded, acrylic & boxed invites" },
  ] },
  { stage: "At the venue", items: [
    { label: "Welcome board", slug: "wedding-welcome-boards" },
    { label: "Seating chart", slug: "wedding-welcome-boards" },
    { label: "Direction & bride's side / groom's side signs", slug: "wedding-welcome-boards" },
    { label: "Hashtag & Instagram signs", slug: "wedding-welcome-boards" },
    { label: "Mandap & phere guide for guests", slug: "wedding-menu-cards" },
    { label: "Menu cards", slug: "wedding-menu-cards" },
    { label: "Ceremony programme cards", slug: "wedding-menu-cards" },
    { label: "Table numbers & place cards", slug: "table-numbers-place-cards" },
    { label: "Food counter labels", slug: "table-numbers-place-cards" },
    { label: "Photo booth props & cutouts", slug: "photo-booth-props" },
    { label: "Welcome standee & flex backdrops", slug: "banners-standees" },
    { label: "Hotel-room welcome letter & itinerary", slug: "wedding-menu-cards" },
    { label: "Luggage tags & door hangers" },
  ] },
  { stage: "Gifting & after", items: [
    { label: "Shagun envelopes (lifafe)", slug: "shagun-envelopes" },
    { label: "Return-gift & favour tags", slug: "wedding-gift-tags" },
    { label: "Sticker labels for mithai & favour boxes", slug: "sheet-stickers" },
    { label: "Mithai & chocolate box sleeves" },
    { label: "Thank-you cards", slug: "wedding-thank-you-cards" },
    { label: "Wedding albums", slug: "layflat-photobook" },
    { label: "Photo tiles, canvas & framed prints", slug: "photo-tile-set-4" },
  ] },
];
