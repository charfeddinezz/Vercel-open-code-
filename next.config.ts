import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // مهم لـ Vercel preview host
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
  // السماح بتحميل صور خارجية (أفاتار GitHub)
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "**.vercel.run" },
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: ["*"] },
  },
};

export default nextConfig;
