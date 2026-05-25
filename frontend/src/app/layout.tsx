import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from 'sonner';
import { Providers } from "@/components/providers";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rekamjejakpak.com"),
  title: {
    default: "Rekam Jejak PAK | Platform Perlindungan Kesehatan Pekerja",
    template: "%s | Rekam Jejak PAK"
  },
  description: "Sistem Informasi Rekam Jejak Penyakit Akibat Kerja Terpadu. Lindungi hak pekerja, pantau keluhan kesehatan, dan kelola advokasi medis secara mudah, aman, dan transparan.",
  keywords: [
    "Penyakit Akibat Kerja",
    "Rekam Jejak PAK",
    "Kesehatan Pekerja",
    "Pelaporan Penyakit Kerja",
    "Advokasi Medis",
    "Kompensasi Pekerja",
    "Sistem Manajemen K3",
    "K3 Indonesia",
    "Keselamatan Kerja"
  ],
  authors: [{ name: "Sistem Rekam Jejak PAK" }],
  creator: "Sistem Rekam Jejak PAK",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://rekamjejakpak.com",
    title: "Rekam Jejak PAK | Perlindungan Pekerja",
    description: "Pantau keluhan kesehatan, riwayat pajanan kerja, dan selesaikan kasus Penyakit Akibat Kerja (PAK) dengan mudah.",
    siteName: "Rekam Jejak PAK",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rekam Jejak PAK | Platform Perlindungan Kesehatan Pekerja",
    description: "Sistem Informasi Rekam Jejak Penyakit Akibat Kerja Terpadu.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${jakarta.variable} font-sans h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans bg-[#F8FAFC]">
        <Providers>
          {children}
        </Providers>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}

