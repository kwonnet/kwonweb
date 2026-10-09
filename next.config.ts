import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [{ source: "/ai-catalog.json", destination: "/.well-known/ai-catalog.json" }];
  },
  reactStrictMode: false,
};

export default nextConfig;
