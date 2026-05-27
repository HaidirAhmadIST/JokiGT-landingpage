'use client';

import { useState } from 'react';
import { useGetReportSummary, useSearchCases, useGetSectors } from '@/hooks/useReport';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ArrowDownAZ,
  ArrowUpAZ,
  Download,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import PriorityCasesCard from '@/components/dashboard/PriorityCasesCard';
import AdvokasiBarChart from '@/components/AdvokasiBarChart';

export default function LaporanPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [timeRange, setTimeRange] = useState('all');
  const [sector, setSector] = useState('all');

  const { data: reportData, isLoading } = useGetReportSummary(timeRange, sector);
  const { data: searchResults, isFetching: searching } = useSearchCases(searchQuery);
  const { data: sectorsList } = useGetSectors();

  const loading = isLoading;
  const summaryData = reportData?.summary;
  const chartData = reportData?.chart_data || [];
  const sectorData = reportData?.sector_data || [];
  const recentSuccesses = reportData?.recent_successes || [];
  
  const recentAdvocacy = (searchResults || []).slice().sort((a: any, b: any) => {
    const nameA = a.worker.toLowerCase();
    const nameB = b.worker.toLowerCase();
    if (sortOrder === 'asc') return nameA > nameB ? 1 : -1;
    return nameA < nameB ? 1 : -1;
  });

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await api.get('/laporan/export', {
        responseType: 'blob', // Important
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      // Ambil filename dari header jika ada, atau gunakan default
      const contentDisposition = response.headers['content-disposition'];
      let fileName = 'Laporan_Pekerja.csv';
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (fileNameMatch && fileNameMatch.length === 2)
          fileName = fileNameMatch[1];
      }
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Laporan berhasil diunduh');
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengunduh laporan');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      {/* PRINT ONLY TABLE LAYOUT */}
      <style type="text/css" media="print">
        {`
          @page { size: A4 portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        `}
      </style>
      <div className="hidden print:block print:w-full print:bg-white text-black font-serif print:p-16 print:pt-12">
        <div className="text-center mb-10 border-b-[3px] border-black pb-6">
          <h1 className="text-3xl font-extrabold uppercase tracking-wider text-black">Laporan Data Penyakit Akibat Kerja & Advokasi Nasional</h1>
          <p className="text-base mt-2 font-medium">Dicetak pada: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="mb-10 break-inside-avoid">
          <h2 className="text-xl font-extrabold mb-4 text-black">A. Ringkasan Statistik</h2>
          <table className="w-full border-collapse border border-black text-base">
            <thead>
              <tr className="bg-gray-100/80 print:bg-gray-100">
                <th className="border border-black p-4 text-left w-1/3 uppercase tracking-wider text-xs font-bold">Total Kasus PAK</th>
                <th className="border border-black p-4 text-left w-1/3 uppercase tracking-wider text-xs font-bold">Advokasi Dalam Proses</th>
                <th className="border border-black p-4 text-left w-1/3 uppercase tracking-wider text-xs font-bold">Tingkat Keberhasilan</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-4 text-2xl font-black">{summaryData?.total_kasus?.value || 0} <span className="text-base font-medium">Kasus</span></td>
                <td className="border border-black p-4 text-2xl font-black">{summaryData?.kepatuhan?.value || 0} <span className="text-base font-medium">Kasus</span></td>
                <td className="border border-black p-4 text-2xl font-black">{summaryData?.sukses_advokasi?.value || 0}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-10 break-inside-avoid">
          <h2 className="text-xl font-extrabold mb-4 text-black">B. Distribusi Jenis Kasus Sektoral</h2>
          <table className="w-full border-collapse border border-black text-base">
            <thead>
              <tr className="bg-gray-100/80 print:bg-gray-100">
                <th className="border border-black p-4 text-left uppercase tracking-wider text-xs font-bold">Jenis Penyakit / Kasus</th>
                <th className="border border-black p-4 text-center w-40 uppercase tracking-wider text-xs font-bold">Persentase</th>
              </tr>
            </thead>
            <tbody>
              {sectorData?.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td className="border border-black p-4 font-semibold">{item.name}</td>
                  <td className="border border-black p-4 text-center font-bold text-lg">{item.value}%</td>
                </tr>
              ))}
              {(!sectorData || sectorData.length === 0) && (
                <tr>
                  <td colSpan={2} className="border border-black p-4 text-center italic text-gray-500">Data sektor tidak tersedia</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mb-10 break-before-auto">
          <h2 className="text-xl font-extrabold mb-4 text-black">C. Rincian Data Kasus Advokasi Terkini</h2>
          <table className="w-full border-collapse border border-black text-base">
            <thead>
              <tr className="bg-gray-100/80 print:bg-gray-100">
                <th className="border border-black p-4 text-center w-14 uppercase tracking-wider text-xs font-bold">No</th>
                <th className="border border-black p-4 text-left uppercase tracking-wider text-xs font-bold">Nama Pekerja</th>
                <th className="border border-black p-4 text-left uppercase tracking-wider text-xs font-bold">Perusahaan Asal</th>
                <th className="border border-black p-4 text-left uppercase tracking-wider text-xs font-bold">Jenis Kasus</th>
                <th className="border border-black p-4 text-center w-36 uppercase tracking-wider text-xs font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentAdvocacy?.map((row: any, i: number) => (
                <tr key={i} className="break-inside-avoid">
                  <td className="border border-black p-4 text-center font-medium">{i + 1}</td>
                  <td className="border border-black p-4 font-bold">{row.worker}</td>
                  <td className="border border-black p-4 text-gray-800">{row.company}</td>
                  <td className="border border-black p-4 text-gray-800">{row.case}</td>
                  <td className="border border-black p-3 text-center">
                    <span className="uppercase text-xs font-bold border border-gray-400 px-3 py-1.5 rounded">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
              {(!recentAdvocacy || recentAdvocacy.length === 0) && (
                <tr>
                  <td colSpan={5} className="border border-black p-6 text-center italic text-gray-500">Tidak ada kasus yang sesuai filter</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="mt-20 pt-8 flex justify-end break-inside-avoid">
          <div className="text-center w-72">
            <p className="text-base mb-24">Mengetahui, Administrator</p>
            <div className="border-b border-black w-full"></div>
            <p className="text-sm mt-2 uppercase tracking-widest font-bold">Tanda Tangan & Cap</p>
          </div>
        </div>
      </div>

      {/* REGULAR DASHBOARD VIEW (HIDDEN ON PRINT) */}
      <div className="space-y-8 print:hidden">

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#0f172a]">Laporan Data Penyakit Akibat Kerja (PAK)</h1>
          <p className="text-[#64748b] mt-1.5 text-[15px]">
            Ringkasan statistik, analisis tren kasus PAK, dan status advokasi pekerja
          </p>
        </div>
        <div className="flex gap-3 print:hidden">
          <Button 
            onClick={handleExport}
            disabled={isExporting}
            className="h-11 px-6 font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Unduh Excel / CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-5 md:grid-cols-3">
        {/* Total Kasus PAK */}
        <Card className="rounded-[20px] shadow-sm border-slate-100 p-6 flex flex-col justify-between min-h-[152px] hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-[#94a3b8] tracking-widest uppercase">Total Kasus PAK</p>
            <div className="bg-blue-50 text-blue-500 p-2 rounded-xl">
              <ClipboardList className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            {loading ? <div className="h-9 w-24 bg-slate-100 animate-pulse rounded" /> : (
              <h3 className="text-4xl font-extrabold text-[#0f172a]">{summaryData?.total_kasus.value}</h3>
            )}
            {!loading && summaryData?.total_kasus.new > 0 && (
              <span className="text-xs font-bold text-emerald-500 mb-1.5 whitespace-nowrap">
                (+{summaryData.total_kasus.new})
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-[#94a3b8]">Akumulasi total</p>
        </Card>

        {/* Kepatuhan Monitoring */}
        <Card className="rounded-[20px] shadow-sm border-slate-100 p-6 flex flex-col justify-between min-h-[152px] hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-[#94a3b8] tracking-widest uppercase">Total Advokasi Dalam Proses</p>
            <div className="bg-orange-50 text-orange-500 p-2 rounded-xl">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            {loading ? <div className="h-9 w-24 bg-slate-100 animate-pulse rounded" /> : (
              <h3 className="text-4xl font-extrabold text-[#0f172a]">{summaryData?.kepatuhan.value}</h3>
            )}
            {!loading && summaryData?.kepatuhan.new > 0 && (
              <span className="text-xs font-bold text-emerald-500 mb-1.5 whitespace-nowrap">
                (+{summaryData.kepatuhan.new})
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-[#94a3b8]">Kasus sedang berjalan</p>
        </Card>

        {/* Sukses Advokasi */}
        <Card className="rounded-[20px] shadow-sm border-slate-100 p-6 flex flex-col justify-between min-h-[152px] hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-[#94a3b8] tracking-widest uppercase">total kasus selesai</p>
            <div className="bg-emerald-50 text-emerald-500 p-2 rounded-xl">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div>
            {loading ? <div className="h-8 w-24 bg-slate-100 animate-pulse rounded" /> : (
              <>
                <h3 className="text-3xl font-extrabold text-[#0f172a]">{summaryData?.kasus_selesai?.value}</h3>
                <span className={`flex items-center text-xs font-bold gap-0.5 mt-1 ${summaryData?.kasus_selesai?.trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {summaryData?.kasus_selesai?.trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {summaryData?.kasus_selesai?.trend >= 0 ? '+' : ''}{summaryData?.kasus_selesai?.trend}%
                  <span className="text-[#94a3b8] font-medium ml-1">advokasi berhasil ditutup</span>
                </span>
              </>
            )}
          </div>
          <p className="text-xs font-medium text-[#94a3b8]">Variasi tipe penyakit</p>
        </Card>
      </div>

      {/* Filter Options for Report (Placeholder for future) */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-[20px] shadow-sm border border-slate-100">
        <div className="flex-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Pilih Rentang Waktu</p>
          <Select value={timeRange} onValueChange={(val) => setTimeRange(val || 'all')}>
            <SelectTrigger className="w-full md:w-[200px] h-10 border-slate-200 rounded-xl">
              <SelectValue placeholder="Semua Waktu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Waktu</SelectItem>
              <SelectItem value="Bulan Ini">Bulan Ini</SelectItem>
              <SelectItem value="3 Bulan Terakhir">3 Bulan Terakhir</SelectItem>
              <SelectItem value="Tahun Ini">Tahun Ini</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Pilih Sektor Industri</p>
          <Select value={sector} onValueChange={(val) => setSector(val || 'all')}>
            <SelectTrigger className="w-full md:w-[200px] h-10 border-slate-200 rounded-xl">
              <SelectValue placeholder="Semua Sektor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Sektor</SelectItem>
              {sectorsList?.map((s: string) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>



      {/* Charts Row */}
      {/* Detailed Chart */}
      <Card className="rounded-[20px] shadow-sm border-slate-100 p-6">
        <AdvokasiBarChart />
      </Card>

      {/* Bottom Section */}
      <div className="grid gap-6 md:grid-cols-1">
        {/* Recent Advocacy Table (Full Width for Reporting) */}
        <Card className="rounded-[20px] shadow-sm border-slate-100 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-[17px] font-bold text-[#0f172a]">Data Tabel Kasus Advokasi</h2>
            <div className="flex items-center gap-2 w-full sm:w-auto print:hidden">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cari NIK atau Nama..."
                  className="pl-9 h-10 text-xs border-slate-200 focus:ring-[#0ea5e9] rounded-xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-slate-400" />}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className={cn(
                  "h-10 w-10 rounded-xl border border-slate-200 transition-all active:scale-95 shrink-0",
                  "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                )}
                title="Urutkan A-Z"
              >
                {sortOrder === 'desc' ? (
                  <ArrowUpAZ className="h-4 w-4" />
                ) : (
                  <ArrowDownAZ className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="p-0 w-full">
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="py-3 font-bold text-[10px] tracking-widest text-[#94a3b8] w-12 pl-2 pr-1">NO.</TableHead>
                  <TableHead className="py-3 font-bold text-[10px] tracking-widest text-[#94a3b8] w-[35%] pl-3">PEKERJA / PERUSAHAAN</TableHead>
                  <TableHead className="py-3 font-bold text-[10px] tracking-widest text-[#94a3b8] w-[30%]">KASUS</TableHead>
                  <TableHead className="py-3 font-bold text-[10px] tracking-widest text-[#94a3b8] w-[15%]">STATUS</TableHead>
                  <TableHead className="py-3 font-bold text-[10px] tracking-widest text-[#94a3b8] text-right pr-4 print:hidden">AKSI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searching && recentAdvocacy.length === 0 ? (
                  [1, 2, 3].map((i: number) => (
                    <TableRow key={i}><TableCell colSpan={5} className="h-16 bg-slate-50/50 animate-pulse" /></TableRow>
                  ))
                ) : (
                  recentAdvocacy.map((row: any, i: number) => (
                    <TableRow key={i} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="pl-2 pr-1 w-12">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-500 text-[11px] font-bold">
                          {i + 1}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 pl-3 truncate max-w-0">
                        <button 
                          onClick={() => router.push(`/pekerja/${row.pekerja_id}?tab=advokasi`)}
                          className="flex flex-col text-left group/worker outline-none transition-transform hover:translate-x-1 w-full"
                        >
                          <div className="font-bold text-[#1e293b] text-sm truncate group-hover/worker:text-[#0284c7] transition-colors">{row.worker}</div>
                          <div className="text-[11px] text-[#94a3b8] font-medium truncate mt-0.5">
                            {row.company} {row.union_name ? `— ${row.union_name}` : ''}
                          </div>
                        </button>
                      </TableCell>
                      <TableCell className="py-4 text-sm text-[#475569] font-medium truncate max-w-0">
                        <span className="truncate block">{row.case}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[11px] font-bold border ${row.statusColor}`}>
                          {row.status}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 text-right pr-4 print:hidden">
                        <button
                          onClick={() => router.push(`/pekerja/${row.pekerja_id}?tab=advokasi`)}
                          className="text-xs font-bold text-[#0ea5e9] hover:text-[#0284c7] transition-colors bg-[#0ea5e9]/10 hover:bg-[#0ea5e9]/20 px-3 py-1.5 rounded-lg"
                        >
                          Detail Pekerja
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {!searching && recentAdvocacy.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-slate-400 text-sm">
                      Tidak ada kasus ditemukan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      </div>
    </div>
  );
}
