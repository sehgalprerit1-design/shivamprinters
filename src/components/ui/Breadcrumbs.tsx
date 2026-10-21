import Link from "next/link";
export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-ink-3 flex flex-wrap gap-1.5 py-3">
      <Link href="/" className="hover:text-brand">Home</Link>
      {items.map((it, i) => (
        <span key={i} className="flex gap-1.5"><span>/</span>{it.href ? <Link href={it.href} className="hover:text-brand">{it.label}</Link> : <span className="text-ink-2">{it.label}</span>}</span>
      ))}
    </nav>
  );
}
