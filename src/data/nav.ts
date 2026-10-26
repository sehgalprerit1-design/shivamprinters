// Top navigation. Categories stay as they are (URLs, admin sheet, sitemap); this file only
// decides how they are grouped in the header, the mobile drawer, the footer and breadcrumbs.
//
//  • "Photo" is a virtual tab with its own landing page (/c/photo) that gathers Photo Prints,
//    Photobooks and Framed Prints.
//  • "Business Printing" is a real category whose tab also holds Bags & Stationery.
import { categories, getCategory, productsInCategory, type Category, type Product } from "./catalog";

export type NavGroup = {
  slug: string;         // URL: /c/<slug>
  name: string;
  tagline: string;
  description: string;
  image: string;
  categories: Category[];
  highlight?: boolean;  // rendered as the yellow button at the right of the nav
  ownPage: boolean;     // true = virtual group page; false = <slug> is itself a category and its page serves as the landing
};

type GroupDef = { slug: string; name?: string; tagline?: string; description?: string; image?: string; categories: string[]; highlight?: boolean };

const GROUP_DEFS: GroupDef[] = [
  {
    slug: "photo", name: "Photo", tagline: "Print the ones you love",
    description: "Everything printed from your photos: glossy and card-stock prints in packs, hardcover and layflat photobooks, framed prints delivered ready to hang, and restickable photo tiles.",
    image: "/images/cat-prints.jpg",
    categories: ["prints", "photobooks", "framed-prints", "photo-tiles"],
  },
  { slug: "business-printing", categories: ["business-printing", "bags-stationery"], highlight: true },
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
