'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Cookies from 'js-cookie';
import { Button } from '@/components/ui/button';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { 
  ShieldCheck, MapPin, HeartPulse, Scale, 
  ArrowRight, FileText, Activity, Shield, 
  ChevronRight, Users, Loader2 
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Lazy load the Map to avoid SSR issues
const IndonesiaMap = dynamic(() => import('@/components/dashboard/IndonesiaMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] flex flex-col items-center justify-center bg-slate-50/50 rounded-3xl border border-slate-100">
      <Loader2 className="h-10 w-10 text-[#0284c7] animate-spin mb-3" />
      <p className="text-sm font-bold text-slate-400 animate-pulse">Memuat Peta Sebaran Nasional...</p>
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
            <div className="w-10 h-10 bg-gradient-to-br from-[#0284c7] to-[#0ea5e9] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="font-extrabold text-[#0f172a] text-xl tracking-tight hidden sm:block">
              Rekam Jejak PAK
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard-admin" 
              className="text-sm font-bold text-slate-600 hover:text-[#0284c7] transition-colors hidden sm:block"
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

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-blue-50 to-slate-50 pointer-events-none" />
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-widest mb-8 animate-in slide-in-from-bottom-4 duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Sistem Informasi Terpadu
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-[#0f172a] tracking-tight leading-[1.1] mb-6 animate-in slide-in-from-bottom-6 duration-700 delay-100">
            Lindungi Hak & Kesehatan <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0284c7] to-[#0ea5e9]">
              Pekerja Anda
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed mb-10 animate-in slide-in-from-bottom-8 duration-700 delay-200">
            Sistem manajemen terpadu untuk merekam riwayat pajanan, memantau kondisi medis, 
            dan mengadvokasi Penyakit Akibat Kerja (PAK) secara transparan dan akurat.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in slide-in-from-bottom-10 duration-700 delay-300">
            <Link href="/pendaftaran" className="w-full sm:w-auto">
              <Button size="lg" className="w-full rounded-full px-8 h-14 text-base font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-xl shadow-blue-500/25 transition-all hover:scale-105">
                Mulai Gratis
              </Button>
            </Link>
            <Link 
              href="/dashboard-admin" 
              className="w-full sm:w-auto"
              suppressHydrationWarning
            >
              <Button size="lg" variant="outline" className="w-full rounded-full px-8 h-14 text-base font-bold bg-white border-slate-200 text-slate-700 hover:bg-slate-50 transition-all hover:scale-105">
                Masuk ke Dashboard
              </Button>
            </Link>
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

            <div className="relative z-10 w-full rounded-3xl overflow-hidden bg-white shadow-sm ring-1 ring-slate-100">
              {loading ? (
                <div className="w-full h-[400px] flex flex-col items-center justify-center bg-slate-50/50">
                  <Loader2 className="h-10 w-10 text-[#0284c7] animate-spin mb-3" />
                  <p className="text-sm font-bold text-slate-400">Memuat Data Wilayah...</p>
                </div>
              ) : (
                <div className="p-4 md:p-8">
                   <div className="flex items-center gap-2 mb-6">
                     <span className="relative flex h-3 w-3">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                     </span>
                     <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Live Map</h3>
                   </div>
                   <IndonesiaMap data={stats?.sebaran_wilayah || {}} />
                </div>
              )}
            </div>

            {/* Quick Stats below map */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
               {[
                 { label: 'Total Pekerja', value: stats?.total_pekerja || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                 { label: 'Kasus Aktif', value: stats?.kasus_aktif || 0, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
                 { label: 'Advokasi Selesai', value: stats?.advokasi_selesai || 0, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
               ].map((item, i) => (
                 <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
                   <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", item.bg)}>
                     <item.icon className={cn("h-5 w-5", item.color)} />
                   </div>
                   <div>
                     <p className="text-xl font-black text-slate-800"><CountUp end={item.value} /></p>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
                   </div>
                 </div>
               ))}
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
                icon: HeartPulse, 
                title: 'Pencatatan Medis Digital', 
                desc: 'Simpan riwayat kesehatan, pajanan, dan diagnosis pekerja dalam satu platform yang aman dan terpusat.',
                color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100'
              },
              { 
                icon: Activity, 
                title: 'Monitor Advokasi Real-time', 
                desc: 'Pantau status penanganan kasus, kompensasi, hingga rehabilitasi secara transparan dari dashboard Anda.',
                color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100'
              },
              { 
                icon: Shield, 
                title: 'Keamanan Data Prioritas', 
                desc: 'Informasi rekam medis dilindungi dengan enkripsi standar industri untuk menjaga privasi data pekerja.',
                color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100'
              }
            ].map((f, i) => (
              <div key={i} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/40 hover:-translate-y-2 transition-transform duration-300">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border", f.bg, f.color, f.border)}>
                  <f.icon className="h-6 w-6" />
                </div>
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

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  role: 'Pekerja',
                  desc: 'Laporkan keluhan kesehatan, riwayat pajanan kerja, dan pantau proses bantuan advokasi Anda secara mandiri.',
                },
                {
                  role: 'Perusahaan',
                  desc: 'Pastikan kepatuhan regulasi K3, pantau kesehatan lingkungan kerja, dan kelola data karyawan dengan baik.',
                },
                {
                  role: 'Admin / Advokat',
                  desc: 'Kelola database pekerja, verifikasi laporan, dan koordinasikan langkah advokasi secara efisien.',
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
            
            <div className="flex flex-col md:flex-row items-start justify-center gap-8 relative">
              {/* Line connector */}
              <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-0.5 bg-slate-100 z-0" />
              
              {[
                { step: '01', title: 'Registrasi', desc: 'Buat akun pekerja Anda dalam hitungan menit.' },
                { step: '02', title: 'Input Data', desc: 'Masukkan riwayat pekerjaan & catatan medis.' },
                { step: '03', title: 'Verifikasi', desc: 'Admin akan meninjau dan memverifikasi data Anda.' },
                { step: '04', title: 'Advokasi', desc: 'Pantau proses penyelesaian kasus hingga tuntas.' }
              ].map((s, i) => (
                <div key={i} className="relative z-10 flex-1 text-center group">
                  <div className="w-16 h-16 mx-auto bg-white border-4 border-slate-50 rounded-2xl shadow-xl shadow-slate-200/50 flex items-center justify-center mb-6 group-hover:-translate-y-2 group-hover:border-blue-100 transition-all duration-300">
                    <span className="text-xl font-black text-[#0284c7]">{s.step}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-800 mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-500 font-medium px-4">{s.desc}</p>
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
           <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-[#0284c7]" />
            <span className="font-black text-slate-800 text-lg tracking-tight">Rekam Jejak PAK</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">
            &copy; {new Date().getFullYear()} Sistem Rekam Jejak PAK. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
