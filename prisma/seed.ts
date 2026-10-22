// Seeds categories, products and variants from src/data/catalog.ts.
// Run: npx tsx prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import { categories, products } from "../src/data/catalog";

const prisma = new PrismaClient();
async function main() {
  for (const c of categories) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: { name: c.name, tagline: c.tagline, description: c.description, image: c.image, order: c.order }, create: { ...c } });
  }
  for (const p of products) {
    const cat = await prisma.category.findUniqueOrThrow({ where: { slug: p.category } });
    const data = { name: p.name, description: p.description, image: p.image, badges: p.badges ?? [], personalisation: p.personalisation, templateAspect: p.template.aspect, photoSlots: p.template.photoSlots, textFields: p.template.textFields, tags: p.tags, rating: p.rating, reviews: p.reviews, featured: !!p.featured, legacyPath: p.legacyPath ?? null, categoryId: cat.id };
    const prod = await prisma.product.upsert({ where: { slug: p.slug }, update: data, create: { slug: p.slug, ...data } });
    for (const v of p.variants) {
      await prisma.variant.upsert({ where: { sku: v.sku }, update: { name: v.name, price: v.price, compareAt: v.compareAt ?? null }, create: { sku: v.sku, name: v.name, price: v.price, compareAt: v.compareAt ?? null, productId: prod.id } });
    }
  }
  await prisma.coupon.upsert({ where: { code: "PATAKA25" }, update: {}, create: { code: "PATAKA25", description: "Festive offer", percentOff: 25, maxOff: 1000, showInBanner: true } });
  await prisma.coupon.upsert({ where: { code: "WELCOME10" }, update: {}, create: { code: "WELCOME10", description: "First order", percentOff: 10, maxOff: 300 } });
  console.log(`Seeded ${categories.length} categories, ${products.length} products`);
}
main().finally(() => prisma.$disconnect());
