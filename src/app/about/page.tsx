import type { Metadata } from "next";
export const metadata: Metadata = { title: "About Zoomin", description: "Zoomin has printed photos and personalised gifts for Indian families since 2009, from our own print and production centre." };
export default function About() {
  return (
    <div className="container-x pt-10 max-w-3xl">
      <h1 className="text-4xl md:text-5xl font-bold">We print the photos you&apos;d otherwise forget.</h1>
      <p className="text-ink-2 text-lg mt-5 leading-relaxed">Zoomin started in 2009 with a simple idea: the best photos on your phone deserve to exist off it. Fifteen years, 55 lakh customers and two crore deliveries later, we still print everything in our own production centre so quality is the same whether you order from Mumbai or Manipur.</p>
      <div className="grid sm:grid-cols-3 gap-4 mt-10">
        {[["55 lakh", "customers"], ["2 crore", "smiles delivered"], ["3 lakh+", "five-star ratings"]].map(([n, l]) => <div key={l} className="card p-5"><div className="display text-3xl font-bold text-brand">{n}</div><div className="text-ink-2 text-sm">{l}</div></div>)}
      </div>
      <h2 id="promise" className="text-2xl font-bold mt-14 scroll-mt-32">Our promise</h2>
      <div className="grid sm:grid-cols-3 gap-4 mt-4">
        {[["Personalised, your way", "100+ products, every one of them made for you and by you. Preview before you pay."], ["100% happiness", "If it isn't right, we reprint or refund. No forms."], ["Trusted quality", "Our own print and production centre, so the result is the same from any corner of India."]].map(([t, d]) => <div key={t} className="card p-5"><div className="font-bold">{t}</div><p className="text-ink-2 text-sm mt-1">{d}</p></div>)}
      </div>
      <h2 className="text-2xl font-bold mt-14">Our brands</h2>
      <p className="text-ink-2 mt-2"><b>Zoomin</b> — bring your memories to life. <b>Zooboo</b> — personalised kids&apos; accessories for school and play.</p>
    </div>
  );
}
