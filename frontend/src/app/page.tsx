'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Cookies from 'js-cookie';
import { Button } from '@/components/ui/button';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { 
  ShieldCheck, MapPin, HeartPulse, Scale, 
  ArrowRight, FileText, Activity, Shield, 
  ChevronRight, Users, Loader2, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import HeroSlider from '@/components/landing/HeroSlider';

const MapContainer = dynamic(() => import('@/components/map/MapContainer').then(mod => mod.MapContainer), {
  ssr: false,
  loading: () => (
    <div className="h-[80vh] lg:h-[700px] w-full bg-slate-100 animate-pulse rounded-3xl flex flex-col items-center justify-center border border-slate-200">
      <Loader2 className="h-10 w-10 text-[#0284c7] animate-spin mb-4" />
      <p className="text-slate-500 font-bold">Memuat Peta Interaktif...</p>
      <p className="text-slate-400 text-xs mt-2 text-center px-4">Mengoptimalkan performa untuk perangkat Anda</p>
    </div>
  )
});

function CountUp({ end, duration = 2000 }: { end: number, duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;
    
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4); // easeOutQuart
      setCount(Math.floor(easeProgress * end));
      
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };
    
    if (end > 0) {
      animationFrameId = window.requestAnimationFrame(step);
    } else {
      setCount(0);
    }
    
    return () => {
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    };
  }, [end, duration]);

  return <span suppressHydrationWarning>{count.toLocaleString('id-ID')}</span>;
}

export default function LandingPage() {
  const { stats, loading } = useDashboardStats();

  // Auto-logout: Clear session when landing page is mounted
  useEffect(() => {
    Cookies.remove('auth_token', { path: '/' });
    localStorage.removeItem('user');
    // Clear any other session data if necessary
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-200 selection:text-blue-900 overflow-x-hidden">
      
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 h-20 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Rekam Jejak PAK Logo" width={40} height={40} className="h-10 w-10 object-contain drop-shadow-sm" />
            <span className="font-extrabold text-[#0f172a] text-xl tracking-tight hidden sm:block whitespace-nowrap">
              Rekam Jejak PAK
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-sm font-bold text-slate-600 hover:text-[#0284c7] transition-colors"
              suppressHydrationWarning
            >
              Masuk
            </Link>
            <Link href="/pendaftaran">
              <Button className="rounded-full px-6 font-bold bg-[#0f172a] hover:bg-[#1e293b] text-white shadow-xl shadow-slate-900/20 transition-all hover:scale-105 active:scale-95">
                Daftar Sekarang <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section with Slider */}
      <section className="pt-20 overflow-hidden">
        <HeroSlider />
      </section>

      {/* Edukasi K3 & PAK Section */}
      <section className="py-20 relative bg-slate-50 border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100/50 text-[#0284c7] font-bold text-sm tracking-wide uppercase mb-4 border border-blue-200/50">
              <Info className="h-4 w-4" /> Informasi Dasar
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-[#0f172a] tracking-tight mb-4">
              Memahami Penyakit Akibat Kerja (PAK) & Hak Pekerja
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto font-medium">
              Kenali apa itu Penyakit Akibat Kerja (PAK) dan pahami hak-hak Anda untuk mendapatkan perlindungan, pemeriksaan medis, serta kompensasi yang layak.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/40 hover:-translate-y-2 transition-transform duration-300">
              <h3 className="text-xl font-black text-slate-800 mb-3">Hak Pekerja</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                Setiap pekerja berhak mendapatkan perlindungan Jaminan sosial ketenagakerjaan, mendapatkan pemeriksaan medis berkala, mendapatkan Kompensasi dan rehabilitasi jika mengalami PAK.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/40 hover:-translate-y-2 transition-transform duration-300">
              <h3 className="text-xl font-black text-slate-800 mb-3">Apa itu PAK?</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                Penyakit Akibat Kerja (PAK) adalah penyakit yang disebabkan oleh pekerjaan atau lingkungan kerja. Meliputi pajanan Faktor Fisik (Bising, Radiasi), Kimia (Debu, Asbes, Gas), Biologi (Bakteri, virus), Postur tubuh, dan Psikososial.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Heat Map Section */}
      <section className="py-20 relative bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-[#0f172a] tracking-tight mb-4">
              Peta Sebaran Laporan Nasional
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto font-medium">
              Pantau secara real-time distribusi kasus Penyakit Akibat Kerja (PAK) di seluruh provinsi di Indonesia.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-4 md:p-8 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
            {/* Map Decoration */}
            <div className="absolute top-0 right-0 opacity-[0.02] pointer-events-none -mt-20 -mr-20">
              <MapPin className="w-96 h-96" />
            </div>

            <div className="relative z-10 w-full">
              <MapContainer />
            </div>


          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-[#0f172a] tracking-tight mb-4">
              Fitur Utama Sistem
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto font-medium">
              Dirancang khusus untuk mempermudah pelaporan, pemantauan, dan penyelesaian kasus Penyakit Akibat Kerja.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                title: 'Pencatatan Medis Digital', 
                desc: 'Simpan riwayat kesehatan, pajanan, dan diagnosis pekerja dalam satu platform yang aman dan terpusat.',
              },
              { 
                title: 'Monitor Advokasi Real-time', 
                desc: 'Pantau status penanganan kasus, kompensasi, hingga rehabilitasi secara transparan dari dashboard Anda.',
              },
              { 
                title: 'Keamanan Data Prioritas', 
                desc: 'Informasi rekam medis dilindungi dengan enkripsi standar industri untuk menjaga privasi data pekerja.',
              }
            ].map((f, i) => (
              <div key={i} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/40 hover:-translate-y-2 transition-transform duration-300">
                <h3 className="text-xl font-black text-slate-800 mb-3">{f.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Audience / Roles */}
      <section className="py-20 relative bg-[#0f172a] text-white overflow-hidden">
         <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[100px] pointer-events-none" />
         
         <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">
                Siapa yang Membutuhkan Sistem Ini?
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {[
                {
                  role: 'Pekerja',
                  desc: 'Laporkan keluhan kesehatan, riwayat pajanan kerja, dan pantau proses bantuan advokasi Anda secara mandiri.',
                },
                {
                  role: 'Serikat Pekerja',
                  desc: 'Dampingi pekerja dalam pelaporan kasus, kelola data anggota, dan koordinasikan langkah advokasi hak-hak K3 secara kolektif dan efisien.',
                }
              ].map((t, i) => (
                <div key={i} className="bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-8 hover:bg-white/10 transition-colors">
                  <h3 className="text-2xl font-black text-white mb-4">{t.role}</h3>
                  <p className="text-slate-300 leading-relaxed font-medium">
                    {t.desc}
                  </p>
                </div>
              ))}
            </div>
         </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
           <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-[#0f172a] tracking-tight mb-4">
                Alur Kerja Mudah
              </h2>
            </div>
            
            <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-12 md:gap-8 relative">
              {/* Horizontal Line connector for desktop */}
              <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-0.5 bg-slate-100 z-0" />
              
              {/* Vertical Line connector for mobile */}
              <div className="md:hidden absolute top-8 bottom-8 left-1/2 w-0.5 bg-slate-100 z-0 -translate-x-1/2" />
              
              {[
                { step: '01', title: 'Registrasi', desc: 'Buat akun pekerja Anda dalam hitungan menit.' },
                { step: '02', title: 'Input Data', desc: 'Masukkan riwayat pekerjaan & catatan medis.' },
                { step: '03', title: 'Verifikasi', desc: 'Admin akan meninjau dan memverifikasi data Anda.' },
                { step: '04', title: 'Advokasi', desc: 'Pantau proses penyelesaian kasus hingga tuntas.' }
              ].map((s, i) => (
                <div key={i} className="relative z-10 flex-1 text-center group w-full md:w-auto px-4 bg-white md:bg-transparent rounded-3xl py-4 md:py-0">
                  <div className="w-16 h-16 mx-auto bg-white border-4 border-slate-50 rounded-2xl shadow-xl shadow-slate-200/50 flex items-center justify-center mb-6 group-hover:-translate-y-2 group-hover:border-blue-100 transition-all duration-300 relative z-10">
                    <span className="text-xl font-black text-[#0284c7]">{s.step}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-800 mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-500 font-medium">{s.desc}</p>
                </div>
              ))}
            </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="max-w-4xl mx-auto px-6 relative z-10">
           <div className="bg-gradient-to-br from-[#0284c7] to-[#0369a1] rounded-[3rem] p-12 md:p-16 text-center text-white shadow-2xl shadow-blue-900/20 overflow-hidden relative">
              <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-[-50%] left-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6 relative z-10">
                Siap Melindungi Pekerja?
              </h2>
              <p className="text-blue-100 text-lg md:text-xl font-medium mb-10 max-w-2xl mx-auto relative z-10">
                Bergabunglah dengan platform kami dan mulai langkah pertama untuk manajemen rekam medis dan advokasi yang lebih baik.
              </p>
              <Link href="/pendaftaran" className="relative z-10 inline-block">
                <Button size="lg" className="rounded-full px-10 h-14 text-lg font-black bg-white text-[#0284c7] hover:bg-slate-50 shadow-xl transition-transform hover:scale-105 active:scale-95">
                  Daftar Sekarang
                </Button>
              </Link>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Rekam Jejak PAK Logo" width={32} height={32} className="h-8 w-8 object-contain drop-shadow-sm" />
            <span className="font-black text-slate-800 text-lg tracking-tight whitespace-nowrap">Rekam Jejak PAK</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">
            &copy; {new Date().getFullYear()} Sistem Rekam Jejak PAK. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
