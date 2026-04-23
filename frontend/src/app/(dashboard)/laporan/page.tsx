'use client';

import { useState } from 'react';
import { useGetReportSummary, useSearchCases } from '@/hooks/useReport';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  ClipboardList,
  Building2,
  CheckCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Printer,
  MoreHorizontal,
  Loader2,
  Search,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function LaporanPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const { data: reportData, isLoading } = useGetReportSummary();
  const { data: searchResults, isFetching: searching } = useSearchCases(searchQuery);

  const loading = isLoading;
  const summaryData = reportData?.summary;
  const chartData = reportData?.chart_data || [];
  const sectorData = reportData?.sector_data || [];
  const recentSuccesses = reportData?.recent_successes || [];
  const recentAdvocacy = searchResults || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#0f172a]">Statistik Penyakit Akibat Kerja & Kepatuhan</h1>
          <p className="text-[#64748b] mt-1.5 text-[15px]">
            Analisis tren terkini di seluruh sektor industri nasional
          </p>
        </div>
        <Button className="h-11 px-6 font-bold bg-[#0f172a] hover:bg-[#1e293b] text-white">
          <Printer className="mr-2 h-4 w-4" /> Cetak Laporan
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-5 md:grid-cols-3">
        {/* Total Kasus PAK */}
        <Card className="rounded-[20px] shadow-sm border-slate-100 p-6 flex flex-col justify-between h-36 hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-[#94a3b8] tracking-widest uppercase">Total Kasus PAK</p>
            <div className="bg-blue-50 text-blue-500 p-2 rounded-xl">
              <ClipboardList className="h-5 w-5" />
            </div>
          </div>
          <div>
            {loading ? <div className="h-8 w-24 bg-slate-100 animate-pulse rounded" /> : (
              <>
                <h3 className="text-3xl font-extrabold text-[#0f172a]">{summaryData?.total_kasus.value}</h3>
                <span className={`flex items-center text-xs font-bold gap-0.5 mt-1 ${summaryData?.total_kasus.trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {summaryData?.total_kasus.trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {summaryData?.total_kasus.trend >= 0 ? '+' : ''}{summaryData?.total_kasus.trend}%
                  <span className="text-[#94a3b8] font-medium ml-1">akumulasi total</span>
                </span>
              </>
            )}
          </div>
        </Card>

        {/* Kepatuhan Monitoring */}
        <Card className="rounded-[20px] shadow-sm border-slate-100 p-6 flex flex-col justify-between h-36 hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-[#94a3b8] tracking-widest uppercase">total advokasi dalam proses</p>
            <div className="bg-orange-50 text-orange-500 p-2 rounded-xl">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div>
            {loading ? <div className="h-8 w-24 bg-slate-100 animate-pulse rounded" /> : (
              <>
                <h3 className="text-3xl font-extrabold text-[#0f172a]">{summaryData?.kepatuhan.value}</h3>
                <span className={`flex items-center text-xs font-bold gap-0.5 mt-1 ${summaryData?.kepatuhan.trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {summaryData?.kepatuhan.trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {summaryData?.kepatuhan.trend >= 0 ? '+' : ''}{summaryData?.kepatuhan.trend}%
                  <span className="text-[#94a3b8] font-medium ml-1">kasus sedang berjalan</span>
                </span>
              </>
            )}
          </div>
        </Card>

        {/* Sukses Advokasi */}
        <Card className="rounded-[20px] shadow-sm border-slate-100 p-6 flex flex-col justify-between h-36 hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-[#94a3b8] tracking-widest uppercase">jenis Kasus</p>
            <div className="bg-emerald-50 text-emerald-500 p-2 rounded-xl">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div>
            {loading ? <div className="h-8 w-24 bg-slate-100 animate-pulse rounded" /> : (
              <>
                <h3 className="text-3xl font-extrabold text-[#0f172a]">{summaryData?.sukses_advokasi.value}</h3>
                <span className={`flex items-center text-xs font-bold gap-0.5 mt-1 ${summaryData?.sukses_advokasi.trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {summaryData?.sukses_advokasi.trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {summaryData?.sukses_advokasi.trend >= 0 ? '+' : ''}{summaryData?.sukses_advokasi.trend}%
                  <span className="text-[#94a3b8] font-medium ml-1">variasi tipe penyakit</span>
                </span>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Bar Chart */}
        <Card className="rounded-[20px] shadow-sm border-slate-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[17px] font-bold text-[#0f172a]">Tren Penyakit Akibat Kerja</h2>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">Bulanan</span>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                  dy={10}
                />
                <RechartsTooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="kasus" fill="#0ea5e9" radius={[6, 6, 0, 0]} name="Jumlah Kasus" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Compliance Bars */}
        <Card className="rounded-[20px] shadow-sm border-slate-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[17px] font-bold text-[#0f172a]">Jenis Kasus</h2>
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-6">
            {loading ? [1, 2, 3, 4].map((i: number) => <div key={i} className="h-10 bg-slate-50 animate-pulse rounded-lg" />) : (
              sectorData.map((item: any) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-[#1e293b]">{item.name}</span>
                    <span className="text-sm font-bold text-[#0f172a]">{item.value}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div className={`${item.color} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))
            )}
            {!loading && sectorData.length === 0 && (
              <p className="text-center text-slate-400 text-sm py-10">Belum ada data sektor.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Recent Advocacy Table */}
        <Card className="md:col-span-2 rounded-[20px] shadow-sm border-slate-100 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-[17px] font-bold text-[#0f172a]">Pencarian Kasus Advokasi</h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari NIK atau Nama..."
                className="pl-9 h-9 text-xs border-slate-200 focus:ring-[#0ea5e9]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-slate-400" />}
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="py-3 font-bold text-[10px] tracking-widest text-[#94a3b8]">PEKERJA / PERUSAHAAN</TableHead>
                  <TableHead className="py-3 font-bold text-[10px] tracking-widest text-[#94a3b8]">KASUS</TableHead>
                  <TableHead className="py-3 font-bold text-[10px] tracking-widest text-[#94a3b8]">STATUS</TableHead>
                  <TableHead className="py-3 font-bold text-[10px] tracking-widest text-[#94a3b8]">AKSI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searching && recentAdvocacy.length === 0 ? (
                  [1, 2, 3].map((i: number) => (
                    <TableRow key={i}><TableCell colSpan={4} className="h-16 bg-slate-50/50 animate-pulse" /></TableRow>
                  ))
                ) : (
                  recentAdvocacy.map((row: any, i: number) => (
                    <TableRow key={i} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="py-3.5">
                        <div className="font-bold text-[#1e293b] text-sm">{row.worker}</div>
                        <div className="text-[11px] text-[#94a3b8] font-medium">{row.company}</div>
                      </TableCell>
                      <TableCell className="py-3.5 text-sm text-[#475569] font-medium">{row.case}</TableCell>
                      <TableCell className="py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold border ${row.statusColor}`}>
                          {row.status}
                        </span>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <button
                          onClick={() => router.push(`/pekerja/${row.pekerja_id}?tab=advokasi`)}
                          className="text-sm font-bold text-[#0ea5e9] hover:text-[#0284c7] transition-colors"
                        >
                          Detail
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {!searching && recentAdvocacy.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-slate-400 text-sm">
                      Tidak ada kasus ditemukan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Success Rate Card */}
        <Card className="rounded-[20px] shadow-sm border-slate-100 bg-gradient-to-br from-[#0c4a6e] to-[#0284c7] text-white p-8 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold">Tingkat Keberhasilan</h2>
            <p className="text-white/70 text-sm mt-1.5">Efektivitas pendampingan dan advokasi hukum nasional</p>
          </div>
          <div className="my-6">
            <h3 className="text-6xl font-extrabold">{summaryData ? `${summaryData.sukses_advokasi.value}%` : '0%'}</h3>
          </div>
          <div>
            <p className="text-white/70 text-sm">
              {summaryData && parseFloat(summaryData.sukses_advokasi.value) >= 90 
                ? 'Melampaui target KPI tahunan (90%)' 
                : 'Belum mencapai target KPI tahunan (90%)'}
            </p>
            <Button
              onClick={() => setIsReviewOpen(true)}
              className="mt-4 bg-white/10 hover:bg-white/20 text-white border-white/20 border h-11 px-6 font-bold"
              variant="outline"
            >
              Lihat Review
            </Button>
          </div>
        </Card>
      </div>

      {/* Success Review Modal */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden border-none rounded-3xl">
          <div className="bg-gradient-to-br from-[#0c4a6e] to-[#0284c7] p-8 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-extrabold flex items-center gap-3">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                Review Tingkat Keberhasilan
              </DialogTitle>
              <DialogDescription className="text-white/70 text-base mt-2">
                Analisis mendalam mengenai pencapaian target advokasi nasional tahun {new Date().getFullYear()}.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
                <p className="text-white/60 text-[10px] font-bold tracking-widest uppercase">Target KPI</p>
                <p className="text-2xl font-black mt-1">90.0%</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
                <p className="text-white/60 text-[10px] font-bold tracking-widest uppercase">Pencapaian Riil</p>
                <p className="text-2xl font-black mt-1 text-emerald-400">{summaryData ? `${summaryData.sukses_advokasi.value}%` : '0%'}</p>
              </div>
            </div>
          </div>

          <div className="p-8 bg-white">
            <h4 className="text-sm font-bold text-[#0f172a] mb-4 uppercase tracking-wider flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-[#0ea5e9]" />
              Kisah Sukses Terakhir
            </h4>

            <div className="space-y-4">
              {recentSuccesses.length > 0 ? (
                recentSuccesses.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-[#0ea5e9]/30 transition-all">
                    <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl shrink-0">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-[#1e293b] text-sm leading-tight">{item.worker}</p>
                        <span className="text-[10px] font-bold text-[#94a3b8]">{item.date}</span>
                      </div>
                      <p className="text-xs text-[#64748b] mt-0.5">{item.company}</p>
                      <div className="mt-2 text-[11px] font-medium text-[#0ea5e9] bg-[#e0f2fe] px-2 py-0.5 rounded-md inline-block">
                        {item.case}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-10 text-slate-400 text-sm">Belum ada data keberhasilan terbaru.</p>
              )}
            </div>

            <Button
              onClick={() => setIsReviewOpen(false)}
              className="w-full mt-8 h-12 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] font-bold"
            >
              Tutup Review
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
