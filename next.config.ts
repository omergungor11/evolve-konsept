import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  // The archived images already have local, optimized originals.
  images: { unoptimized: true },
  poweredByHeader: false,
};

export default nextConfig;
