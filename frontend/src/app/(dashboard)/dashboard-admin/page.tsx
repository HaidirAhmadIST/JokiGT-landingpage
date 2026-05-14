'use client';

/**
 * Halaman Dashboard Admin Utama
 *
 * Menampilkan statistik real-time sistem: jumlah pekerja, kasus aktif,
 * advokasi selesai, dan klaim disetujui. Data di-refresh otomatis setiap
 * 30 detik melalui hook `useDashboardStats`.
 *
 * Komponen yang digunakan:
 * - `StatCard` — kartu metrik yang reusable
 * - `AdvokasiBarChart` — grafik batang progres advokasi per tahap
 * - `ActivitySidebar` — panel aktivitas admin/sistem terkini
 */

import Link from 'next/link';
import { Users, Building2, ClipboardList, CheckCircle2, BadgeCheck, FilePlus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import ActivitySidebar from '@/components/ActivitySidebar';
import AdvokasiBarChart from '@/components/AdvokasiBarChart';
import StatCard from '@/components/dashboard/StatCard';
import PriorityCasesCard from '@/components/dashboard/PriorityCasesCard';
import { useDashboardStats } from '@/hooks/useDashboardStats';

export default function DashboardIndexPage() {
  const { stats, loading } = useDashboardStats();

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
        <StatCard
          label="Total Pekerja"
          value={stats?.total_pekerja ?? 0}
          delta={stats?.total_pekerja_new}
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
          subtitle="Live monitoring"
          loading={loading}
        />
        <StatCard
          label="Kasus Aktif"
          value={stats?.kasus_aktif ?? 0}
          delta={stats?.kasus_aktif_new}
          icon={ClipboardList}
          iconBg="bg-orange-50"
          iconColor="text-orange-500"
          deltaColor="text-orange-500"
          subtitle="Sedang diproses"
          loading={loading}
        />
        <StatCard
          label="Advokasi Selesai"
          value={stats?.advokasi_selesai ?? 0}
          delta={stats?.advokasi_selesai_new}
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-500"
          subtitle="Kasus tuntas"
          loading={loading}
        />
        <StatCard
          label="Klaim Disetujui"
          value={stats?.klaim_disetujui ?? 0}
          delta={stats?.klaim_disetujui_new}
          icon={BadgeCheck}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-500"
          subtitle="Approved claims"
          loading={loading}
        />
      </div>

      {/* ── Middle Section: Bar Chart + Activity Sidebar ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Bar Chart — 2/3 width */}
        <Card className="lg:col-span-2 rounded-[20px] shadow-sm border-slate-100 p-6 flex flex-col min-h-[400px]">
          <AdvokasiBarChart />
        </Card>

        {/* Right Column: Priority Cases + Activity Sidebar */}
        <div className="flex flex-col gap-6">
          <PriorityCasesCard />
          <ActivitySidebar />
        </div>
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
