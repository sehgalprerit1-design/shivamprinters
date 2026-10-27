// Shape of src/data/overrides.json — everything the admin Catalogue & pricing sheet can change.
// Only differences from the code catalogue are stored, so the file stays small and readable.
import { z } from "zod";

export const VariantZ = z.object({ sku: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9._-]+$/, "SKU: letters, numbers, - . _ only"), name: z.string().trim().min(1).max(80), price: z.number().int().min(0).max(1_000_000), compareAt: z.number().int().min(0).max(1_000_000).nullable().optional() });
export const TextFieldZ = z.object({ key: z.string().trim().min(1).max(30).regex(/^[a-z][a-z0-9_-]*$/), label: z.string().trim().min(1).max(80), max: z.number().int().min(1).max(2000) });
export const TemplateZ = z.object({ aspect: z.number().min(0.2).max(6), photoSlots: z.number().int().min(0).max(100), textFields: z.array(TextFieldZ).max(10) });
export const KindZ = z.enum(["photo", "text", "photo+text", "multi-photo", "none"]);

// Per-product option groups (Finish, Card stock, Corners…). When present, the list replaces the code defaults for that product.
export const OptionChoiceZ = z.object({ id: z.string().trim().min(1).max(30).regex(/^[a-z0-9][a-z0-9_-]*$/), label: z.string().trim().min(1).max(60), hint: z.string().trim().max(120).optional(), delta: z.number().int().min(-100_000).max(100_000).optional() });
export const OptionGroupZ = z.object({ id: z.string().trim().min(1).max(60), key: z.string().trim().min(1).max(30).regex(/^[a-z][a-z0-9_-]*$/), label: z.string().trim().min(1).max(40), choices: z.array(OptionChoiceZ).min(1).max(30) });
const uniqueKeys = (gs: { key: string; choices: { id: string }[] }[]) => new Set(gs.map((g) => g.key)).size === gs.length && gs.every((g) => new Set(g.choices.map((c) => c.id)).size === g.choices.length);
export const OptionGroupsZ = z.array(OptionGroupZ).max(8).refine(uniqueKeys, "Option groups and choices must have unique keys");

export const ProductPatchZ = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().min(10).max(1000).optional(),
  category: z.string().trim().min(1).optional(),
  image: z.string().trim().min(1).max(400).optional(),
  images: z.array(z.string().trim().min(1).max(400)).max(6).optional(), // gallery — replaces the code list
  badges: z.array(z.string().trim().min(1).max(20)).max(3).optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(20).optional(),
  hidden: z.boolean().optional(),
  variants: z.array(VariantZ).min(1).max(30).optional(), // full list — replaces the code variants
  variantLabel: z.string().trim().min(1).max(30).optional(), // heading above the variant picker, default "Size"
  options: OptionGroupsZ.optional(), // full list — replaces the code option groups
});

export const AddedProductZ = z.object({
  slug: z.string().trim().min(2).max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug: lowercase words joined by -"),
  category: z.string().trim().min(1),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().min(10).max(1000),
  image: z.string().trim().min(1).max(400),
  images: z.array(z.string().trim().min(1).max(400)).max(6).optional(),
  badges: z.array(z.string().trim().min(1).max(20)).max(3).optional(),
  personalisation: KindZ,
  template: TemplateZ,
  variants: z.array(VariantZ).min(1).max(30),
  variantLabel: z.string().trim().min(1).max(30).optional(),
  options: OptionGroupsZ.optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(20),
  hidden: z.boolean().optional(),
});

export const CategoryPatchZ = z.object({ name: z.string().trim().min(2).max(40).optional(), tagline: z.string().trim().max(60).optional(), description: z.string().trim().max(400).optional(), image: z.string().trim().max(400).optional() });

export const OverridesZ = z.object({
  categories: z.record(z.string(), CategoryPatchZ).default({}),
  products: z.record(z.string(), ProductPatchZ).default({}),
  added: z.array(AddedProductZ).default([]),
  options: z.record(z.string(), z.number().int().min(-100_000).max(100_000)).default({}),
});
export type Overrides = z.infer<typeof OverridesZ>;
export type AddedProduct = z.infer<typeof AddedProductZ>;
