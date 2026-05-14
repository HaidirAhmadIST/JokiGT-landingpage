'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const slides = [
  {
    image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=2070&auto=format&fit=crop',
    badge: 'Perlindungan Pekerja',
    title: 'Lindungi Hak & Kesehatan Seluruh Pekerja',
    description: 'Solusi terpadu untuk memastikan setiap pekerja mendapatkan hak kesehatan dan perlindungan hukum yang layak.',
    ctaText: 'Daftar Sekarang',
    ctaLink: '/pendaftaran'
  },
  {
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=2080&auto=format&fit=crop',
    badge: 'Rekam Jejak PAK',
    title: 'Pantau Riwayat Kesehatan Secara Digital',
    description: 'Teknologi pelacakan pajanan dan kondisi medis yang akurat untuk deteksi dini Penyakit Akibat Kerja.',
    ctaText: 'Mulai Pelacakan',
    ctaLink: '/pendaftaran'
  },
  {
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop',
    badge: 'Data Transparan',
    title: 'Manajemen Rekam Medis yang Terpercaya',
    description: 'Akses data kesehatan dan riwayat pekerjaan Anda kapan saja dengan sistem keamanan tingkat tinggi.',
    ctaText: 'Lihat Dashboard',
    ctaLink: '/dashboard-admin'
  },
  {
    image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop',
    badge: 'Advokasi Medis',
    title: 'Pendampingan Kasus dari Ahli Profesional',
    description: 'Dukungan penuh dalam proses verifikasi dan advokasi kasus PAK hingga mendapatkan solusi terbaik.',
    ctaText: 'Konsultasi Gratis',
    ctaLink: '/pendaftaran'
  }
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const nextSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrent((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning]);

  const prevSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning]);

  useEffect(() => {
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <section className="relative h-[600px] md:h-[700px] lg:h-[800px] w-full overflow-hidden bg-slate-900">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={cn(
            "absolute inset-0 transition-opacity duration-1000 ease-in-out",
            index === current ? "opacity-100 z-10" : "opacity-0 z-0"
          )}
        >
          {/* Background Image using Next/Image */}
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              priority={index === 0}
              className={cn(
                "object-cover transition-transform duration-[10000ms] ease-linear",
                index === current ? "scale-110" : "scale-100"
              )}
            />
            {/* Premium Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/40 to-transparent" />
            <div className="absolute inset-0 bg-slate-900/10" />
          </div>

          {/* Content */}
          <div className="relative h-full max-w-7xl mx-auto px-6 flex flex-col justify-center text-left">
            <div className={cn(
              "max-w-2xl transition-all duration-700 delay-300",
              index === current ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            )}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-widest mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400"></span>
                </span>
                {slide.badge}
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] mb-6">
                {slide.title.split(' ').map((word, i) => (
                  <span key={i} className={cn(i > 2 && "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400")}>
                    {word}{' '}
                  </span>
                ))}
              </h1>
              
              <p className="text-lg md:text-xl text-slate-300 font-medium leading-relaxed mb-10 max-w-xl">
                {slide.description}
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link href={slide.ctaLink} className="w-full sm:w-auto">
                  <Button size="lg" className="w-full rounded-full px-8 h-14 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-900/40 transition-all hover:scale-105">
                    {slide.ctaText} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/pendaftaran" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full rounded-full px-8 h-14 text-base font-bold bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 transition-all hover:scale-105">
                    Konsultasi Gratis
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Controls */}
      <div className="absolute bottom-10 left-0 right-0 z-20 flex items-center justify-between max-w-7xl mx-auto px-6">
        {/* Dots */}
        <div className="flex gap-3">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                "h-1.5 transition-all duration-300 rounded-full",
                i === current ? "w-8 bg-blue-500" : "w-2 bg-white/30 hover:bg-white/50"
              )}
            />
          ))}
        </div>

        {/* Arrows */}
        <div className="flex gap-4">
          <button
            onClick={prevSlide}
            className="w-12 h-12 rounded-full border border-white/20 bg-white/5 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/10 transition-all"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="w-12 h-12 rounded-full border border-white/20 bg-white/5 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/10 transition-all"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Decorative Blur */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none -mr-40 -mt-40 z-20" />
    </section>
  );
}
