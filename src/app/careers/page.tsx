import type { Metadata } from "next";
export const metadata: Metadata = { title: "Careers" };
export default function Page() {
  return (
    <div className="container-x pt-10 max-w-3xl">
      <h1 className="text-4xl font-bold">Careers</h1>
      <p className="text-ink-2 text-lg mt-4 leading-relaxed">We're a Mumbai-based print and product team. Open roles are posted here.</p>
      <p className="text-ink-3 text-sm mt-8">Full policy text to be supplied by the Zoomin team before launch.</p>
    </div>
  );
}
