import { SITE_URL } from "@/lib/site";
import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { WhatsAppFloat } from "@/components/ui/WhatsAppFloat";
import { bannerCoupon } from "@/lib/coupons";
import { Analytics } from "@/components/analytics/Analytics";

// Pages are static but re-rendered every 10 minutes so the advertised coupon and seasonal tiles stay current.
export const revalidate = 600;


export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Shivam Printers — Photobooks, Frames, Prints & Personalised Gifts", template: "%s | Shivam Printers" },
  description:
    "India's online store for photo printing and personalised gifts. Photobooks, framed prints, calendars, mugs, cushions and kids' essentials, made from your photos. Free design tools, pan-India delivery, COD available.",
  openGraph: { type: "website", siteName: "Shivam Printers", locale: "en_IN" },
  robots: { index: true, follow: true },
  alternates: { languages: { "en-IN": "/" } },
  other: { "geo.region": "IN", "geo.placename": "India" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const promo = await bannerCoupon();
  return (
    <html lang="en-IN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Header promo={promo} />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
        <WhatsAppFloat />
        <Analytics />
      </body>
    </html>
  );
}
