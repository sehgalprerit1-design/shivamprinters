import Link from "next/link";

export function Section({ title, subtitle, href, hrefLabel = "View all", children, className = "" }: { title: string; subtitle?: string; href?: string; hrefLabel?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`container-x py-10 md:py-14 ${className}`}>
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
          {subtitle && <p className="text-ink-2 mt-1">{subtitle}</p>}
        </div>
        {href && <Link href={href} className="text-sm font-semibold text-brand whitespace-nowrap">{hrefLabel} →</Link>}
      </div>
      {children}
    </section>
  );
}
