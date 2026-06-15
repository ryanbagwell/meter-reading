import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // In production, nginx routes /api/ directly to Django.
  // This rewrite handles the same path in local development (no nginx).
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:9005/api/:path*",
      },
    ];
  },
};

export default nextConfig;
