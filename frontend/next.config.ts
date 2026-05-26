import type { NextConfig } from "next";

import path from 'path';

const nextConfig: NextConfig = {
  // Aktifkan mode export agar menjadi HTML statis murni (Sangat cocok untuk cPanel / hPanel Hostinger)
  // Di Next.js 15, "output: export" membuat dynamic routes error di mode dev. Kita aktifkan hanya saat build production.
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  // Matikan optimasi gambar bawaan Next.js karena tidak didukung di mode export HTML statis
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  experimental: {
    // Other experimental features can go here
  },
};

export default nextConfig;
