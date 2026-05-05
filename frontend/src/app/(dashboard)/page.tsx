'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Card } from "@/components/ui/card";
import Link from "next/link";
import {
  Users,
  Building2,
  ClipboardList,
  CheckCircle2,
  BadgeCheck,
  TrendingUp,
  TrendingDown,
  FilePlus,
} from "lucide-react";
import ActivitySidebar from "@/components/ActivitySidebar";
import AdvokasiBarChart from "@/components/AdvokasiBarChart";
import { toast } from 'sonner';

interface DashboardStats {
  total_pekerja: number;
  total_pekerja_new: number;
  total_perusahaan: number;
  total_perusahaan_new: number;
  kasus_aktif: number;
  kasus_aktif_new: number;
  advokasi_selesai: number;
  advokasi_selesai_new: number;
  klaim_disetujui: number;
  klaim_disetujui_new: number;
  kesehatan: {
    fit: number;
    note: number;
    unfit: number;
  };
}


export default function DashboardIndexPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      if (res.data.status === 'success') {
        setStats(res.data.data);
      }
    } catch (e) {
      console.error('Failed to fetch dashboard stats', e);
      toast.error('Gagal mengambil statistik dashboard. Periksa koneksi database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Animated number display
  const StatValue = ({ value, loading: isLoading }: { value: number; loading: boolean }) => {
    if (isLoading) {
      return <div className="h-9 w-20 bg-slate-200 rounded-lg animate-pulse" />;
    }
    return (
      <h3 className="text-4xl font-extrabold text-[#0f172a] tabular-nums transition-all duration-300">
        {value.toLocaleString('id-ID')}
      </h3>
    );
  };


  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div>
        <h1 className="text-[28px] font-extrabold tracking-tight text-[#0f172a]">
          Dashboard Utama
        </h1>
        <p className="text-[#64748b] mt-1.5 text-[15px]">
          Pantau status pekerja dan kemajuan advokasi PAK secara real-time.
        </p>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

        {/* Card 1 — Total Pekerja */}
        <Card className="rounded-[20px] shadow-sm border-slate-100 p-6 flex flex-col justify-between min-h-[152px] hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-[#94a3b8] tracking-widest uppercase">Total Pekerja</p>
            <div className="bg-blue-50 text-blue-500 p-2.5 rounded-xl">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <StatValue value={stats?.total_pekerja ?? 0} loading={loading} />
            {stats && stats.total_pekerja_new > 0 && (
              <span className="text-xs font-bold text-emerald-500 mb-1.5 whitespace-nowrap">
                (+{stats.total_pekerja_new})
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-[#94a3b8]">Live monitoring</p>
        </Card>

        {/* Card 2 — Kasus Aktif */}
        <Card className="rounded-[20px] shadow-sm border-slate-100 p-6 flex flex-col justify-between min-h-[152px] hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-[#94a3b8] tracking-widest uppercase">Kasus Aktif</p>
            <div className="bg-orange-50 text-orange-500 p-2.5 rounded-xl">
              <ClipboardList className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <StatValue value={stats?.kasus_aktif ?? 0} loading={loading} />
            {stats && stats.kasus_aktif_new > 0 && (
              <span className="text-xs font-bold text-orange-500 mb-1.5 whitespace-nowrap">
                (+{stats.kasus_aktif_new})
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-[#94a3b8]">Sedang diproses</p>
        </Card>

        {/* Card 3 — Advokasi Selesai */}
        <Card className="rounded-[20px] shadow-sm border-slate-100 p-6 flex flex-col justify-between min-h-[152px] hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-[#94a3b8] tracking-widest uppercase">Advokasi Selesai</p>
            <div className="bg-emerald-50 text-emerald-500 p-2.5 rounded-xl">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <StatValue value={stats?.advokasi_selesai ?? 0} loading={loading} />
            {stats && stats.advokasi_selesai_new > 0 && (
              <span className="text-xs font-bold text-emerald-500 mb-1.5 whitespace-nowrap">
                (+{stats.advokasi_selesai_new})
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-[#94a3b8]">Kasus tuntas</p>
        </Card>

        {/* Card 4 — Klaim Disetujui */}
        <Card className="rounded-[20px] shadow-sm border-slate-100 p-6 flex flex-col justify-between min-h-[152px] hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-[#94a3b8] tracking-widest uppercase">Klaim Disetujui</p>
            <div className="bg-indigo-50 text-indigo-500 p-2.5 rounded-xl">
              <BadgeCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <StatValue value={stats?.klaim_disetujui ?? 0} loading={loading} />
            {stats && stats.klaim_disetujui_new > 0 && (
              <span className="text-xs font-bold text-emerald-500 mb-1.5 whitespace-nowrap">
                (+{stats.klaim_disetujui_new})
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-[#94a3b8]">Approved claims</p>
        </Card>

      </div>



      {/* ── Middle Section: Bar Chart + ActivitySidebar ── */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Bar Chart — 2/3 width */}
        <Card className="lg:col-span-2 rounded-[20px] shadow-sm border-slate-100 p-6 flex flex-col min-h-[400px]">
          <AdvokasiBarChart />
        </Card>

        {/* Activity Sidebar — 1/3 width */}
        <ActivitySidebar />

      </div>

      {/* ── Bottom Banner ── */}
      <Card className="rounded-[20px] shadow-sm border-slate-100 p-6 bg-white overflow-hidden relative">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-white border-2 border-[#e0f2fe] text-[#0ea5e9] p-3 rounded-2xl shadow-sm shrink-0">
              <FilePlus className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0f172a]">Butuh input data baru?</h3>
              <p className="text-sm text-[#64748b] mt-1">
                Tambahkan rekam jejak pekerja atau ajukan advokasi PAK sekarang.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/laporan"
              className="inline-flex items-center h-11 px-6 font-bold text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-lg text-sm transition-colors bg-white"
            >
              Panduan Pengguna
            </Link>
            <Link
              href="/pekerja"
              className="inline-flex items-center h-11 px-6 font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-lg text-sm transition-colors"
            >
              Tambah Data Baru
            </Link>
          </div>
        </div>
      </Card>

    </div>
  );
}
