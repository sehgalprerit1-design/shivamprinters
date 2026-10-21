import type { Metadata } from "next";
export const metadata: Metadata = { title: "Privacy policy" };
export default function Page() {
  return (
    <div className="container-x pt-10 max-w-3xl">
      <h1 className="text-4xl font-bold">Privacy policy</h1>
      <p className="text-ink-2 text-lg mt-4 leading-relaxed">We store your photos only to print your order and to let you reorder. We never use them for anything else and delete them on request.</p>
      <p className="text-ink-3 text-sm mt-8">Full policy text to be supplied by the Shivam Printers team before launch.</p>
    </div>
  );
}
