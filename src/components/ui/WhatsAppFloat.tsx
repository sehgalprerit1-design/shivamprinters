"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { whatsappUrl, WhatsAppIcon } from "./CallUs";

/** Floating "Chat on WhatsApp" button, bottom-right on every page.
 *  On product/editor pages the message pre-fills the product name so the shop knows what the customer is looking at. */
export function WhatsAppFloat() {
  const pathname = usePathname();
  const [msg, setMsg] = useState("Hi Shivam Printers, I have a question.");

  useEffect(() => {
    const h1 = document.querySelector("h1")?.textContent?.trim();
    const onProduct = pathname.startsWith("/p/") || pathname.startsWith("/design/");
    const url = typeof window !== "undefined" ? window.location.href : "";
    setMsg(onProduct && h1 ? `Hi Shivam Printers, I have a question about "${h1}" (${url})` : "Hi Shivam Printers, I have a question.");
  }, [pathname]);

  // Hide on checkout/admin so it doesn't cover the Place order button.
  if (pathname.startsWith("/checkout") || pathname.startsWith("/admin")) return null;

  return (
    <a
      href={whatsappUrl(msg)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed z-50 right-4 bottom-20 md:bottom-6 flex items-center gap-2 rounded-full bg-[#25D366] text-white shadow-lg pl-3 pr-4 py-2.5 text-sm font-semibold hover:bg-[#1ebe5b] transition-colors"
    >
      <WhatsAppIcon size={22} />
      <span className="hidden sm:inline">Chat on WhatsApp</span>
    </a>
  );
}
