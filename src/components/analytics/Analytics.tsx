"use client";
import Script from "next/script";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { track } from "@/lib/track";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID?.trim();
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();

/** Site-wide analytics: Vercel Analytics always; GA4 and Meta pixel when their IDs are configured.
 *  Also records every WhatsApp / phone click as a "contact" conversion. */
export function Analytics() {
  const pathname = usePathname();

  // Meta pixel needs a manual PageView on client-side route changes (GA4 tracks history changes itself).
  useEffect(() => {
    const w = window as Window & { fbq?: (...a: unknown[]) => void };
    w.fbq?.("track", "PageView");
  }, [pathname]);

  useEffect(() => {
    function onClick(ev: MouseEvent) {
      const a = (ev.target as HTMLElement | null)?.closest?.("a");
      const href = a?.getAttribute("href") ?? "";
      if (href.includes("wa.me/")) track({ name: "contact", channel: "whatsapp", path: window.location.pathname });
      else if (href.startsWith("tel:")) track({ name: "contact", channel: "phone", path: window.location.pathname });
    }
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return (
    <>
      <VercelAnalytics />
      {GA_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}');`}
          </Script>
        </>
      )}
      {PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL_ID}');`}
        </Script>
      )}
    </>
  );
}

/** Fires a purchase conversion once, on the order page right after checkout. */
export function TrackPurchase({ orderId, value }: { orderId: string; value: number }) {
  useEffect(() => {
    const key = `tracked-order-${orderId}`;
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, "1"); } catch { /* ignore */ }
    track({ name: "purchase", orderId, value });
  }, [orderId, value]);
  return null;
}
