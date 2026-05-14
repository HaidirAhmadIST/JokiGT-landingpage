import type { NextConfig } from "next";

import path from 'path';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  experimental: {
    // @ts-ignore Next.js 15+ turbopack root config types might be incomplete
    turbopack: {
      root: path.resolve(__dirname),
    },
  },
};

export default nextConfig;
