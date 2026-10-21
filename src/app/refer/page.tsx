import type { Metadata } from "next";
export const metadata: Metadata = { title: "Refer a friend" };
export default function Page() {
  return (
    <div className="container-x pt-10 max-w-3xl">
      <h1 className="text-4xl font-bold">Refer a friend</h1>
      <p className="text-ink-2 text-lg mt-4 leading-relaxed">Share your code; they get ₹100 off their first order and you get ₹100 off your next.</p>
      <p className="text-ink-3 text-sm mt-8">Full policy text to be supplied by the Zoomin team before launch.</p>
    </div>
  );
}
