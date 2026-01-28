import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Externalize native modules for server-side
  serverExternalPackages: ['better-sqlite3'],

  // Empty turbopack config to silence the warning
  turbopack: {},

  // Allow images from ESPN CDN
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'a.espncdn.com',
        pathname: '/i/teamlogos/**',
      },
    ],
  },
};

export default nextConfig;
