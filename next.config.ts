import type { NextConfig } from "next";
import { redirects } from "./src/lib/redirects";

const nextConfig: NextConfig = {
  async redirects() {
    return redirects;
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
