import type { Metadata } from "next";
export const metadata: Metadata = { title: "Help desk" };
export default function Page() {
  return (
    <div className="container-x pt-10 max-w-3xl">
      <h1 className="text-4xl font-bold">Help desk</h1>
      <p className="text-ink-2 text-lg mt-4 leading-relaxed">Order issues, delivery questions and reprints. Email help@zoomin.com or raise a ticket; we reply within one working day.</p>
      <p className="text-ink-3 text-sm mt-8">Full policy text to be supplied by the Zoomin team before launch.</p>
    </div>
  );
}
