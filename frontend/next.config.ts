import type { NextConfig } from "next";

import path from 'path';

const nextConfig: NextConfig = {
  // Aktifkan mode export agar menjadi HTML statis murni (Sangat cocok untuk cPanel / hPanel Hostinger)
  output: 'export',
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
