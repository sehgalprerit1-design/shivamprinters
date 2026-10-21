import type { Product } from "@/data/catalog";
import { ProductCard } from "./ProductCard";

export function ProductGrid({ products, cols = 4 }: { products: Product[]; cols?: 3 | 4 | 5 }) {
  const cls = { 3: "lg:grid-cols-3", 4: "lg:grid-cols-4", 5: "lg:grid-cols-5" }[cols];
  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 ${cls} gap-3 md:gap-5`}>
      {products.map((p, i) => <ProductCard key={p.slug} p={p} priority={i < 4} />)}
    </div>
  );
}
