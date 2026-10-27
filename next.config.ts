import type { NextConfig } from "next";
import { redirects } from "./src/lib/redirects";
import { ENQUIRY_ONLY } from "./src/lib/site";

const nextConfig: NextConfig = {
  async redirects() {
    if (!ENQUIRY_ONLY) return redirects;
    // Temporary WhatsApp/phone-only selling: cart and checkout are not reachable.
    return [
      { source: "/cart", destination: "/products", permanent: false },
      { source: "/checkout", destination: "/products", permanent: false },
      ...redirects,
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
