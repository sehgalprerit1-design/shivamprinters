import { BIZ } from "@/data/legal";
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="container-x pt-10 max-w-3xl">
      <h1 className="text-4xl font-bold">{title}</h1>
      <p className="text-ink-3 text-sm mt-2">Last updated {BIZ.updated} · {BIZ.legalName}, {BIZ.address}, {BIZ.city}</p>
      <div className="prose mt-8 text-ink-2 leading-relaxed space-y-4 [&_h2]:text-ink [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-8 [&_ul]:list-disc [&_ul]:pl-5">{children}</div>
    </div>
  );
}
