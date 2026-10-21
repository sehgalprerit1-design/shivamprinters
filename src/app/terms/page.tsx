import type { Metadata } from "next";
export const metadata: Metadata = { title: "Terms of use" };
export default function Page() {
  return (
    <div className="container-x pt-10 max-w-3xl">
      <h1 className="text-4xl font-bold">Terms of use</h1>
      <p className="text-ink-2 text-lg mt-4 leading-relaxed">Standard terms covering orders, pricing, personalised products and delivery.</p>
      <p className="text-ink-3 text-sm mt-8">Full policy text to be supplied by the Shivam Printers team before launch.</p>
    </div>
  );
}
