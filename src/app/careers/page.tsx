import type { Metadata } from "next";
export const metadata: Metadata = { title: "Careers" };
export default function Page() {
  return (
    <div className="container-x pt-10 max-w-3xl">
      <h1 className="text-4xl font-bold">Careers</h1>
      <p className="text-ink-2 text-lg mt-4 leading-relaxed">We&apos;re a small print and product team. There are no open roles right now, but we&apos;re always happy to hear from print operators, designers and customer-support people — call or WhatsApp us on 9910888217 and tell us what you do.</p>
    </div>
  );
}
