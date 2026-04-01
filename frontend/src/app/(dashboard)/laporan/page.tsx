'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  ClipboardList,
  Building2,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Printer,
  MoreHorizontal,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const chartData = [
  { month: 'JAN', kasus: 28 },
  { month: 'FEB', kasus: 35 },
  { month: 'MAR', kasus: 32 },
  { month: 'APR', kasus: 45 },
  { month: 'MEI', kasus: 55 },
  { month: 'JUN', kasus: 62 },
];

const complianceData = [
  { name: 'Manufaktur', value: 92, color: 'bg-[#0ea5e9]' },
  { name: 'Pertambangan', value: 85, color: 'bg-[#0ea5e9]' },
  { name: 'Konstruksi', value: 76, color: 'bg-[#0ea5e9]' },
  { name: 'Agrikultur', value: 64, color: 'bg-[#0ea5e9]' },
];

const recentAdvocacy = [
  { company: 'PT. Maju Mundur', case: 'Gangguan Pendengaran', status: 'SELESAI', statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { company: 'Cahaya Abadi Ltd.', case: 'Penyakit Kulit Okupasi', status: 'PROSES', statusColor: 'bg-red-50 text-red-600 border-red-200' },
  { company: 'Sumber Energi Tbk.', case: 'Kecelakaan Kerja Ringan', status: 'SELESAI', statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
];

export default function LaporanPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

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
            <p className="text-xs font-bold text-[#94a3b8] tracking-widest">Total Kasus PAK</p>
            <div className="bg-blue-50 text-blue-500 p-2 rounded-xl">
              <ClipboardList className="h-5 w-5" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-[#0f172a]">1,240</h3>
            <span className="flex items-center text-emerald-500 text-xs font-bold gap-0.5 mt-1">
              <TrendingUp className="h-3 w-3" /> +5.4% <span className="text-[#94a3b8] font-medium ml-1">dari bulan lalu</span>
            </span>
          </div>
        </Card>

        {/* Kepatuhan Perusahaan */}
        <Card className="rounded-[20px] shadow-sm border-slate-100 p-6 flex flex-col justify-between h-36 hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-[#94a3b8] tracking-widest">Kepatuhan Perusahaan</p>
            <div className="bg-orange-50 text-orange-500 p-2 rounded-xl">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-[#0f172a]">88.2%</h3>
            <span className="flex items-center text-red-500 text-xs font-bold gap-0.5 mt-1">
              <TrendingDown className="h-3 w-3" /> -2.1% <span className="text-[#94a3b8] font-medium ml-1">dari kuartal lalu</span>
            </span>
          </div>
        </Card>

        {/* Sukses Advokasi */}
        <Card className="rounded-[20px] shadow-sm border-slate-100 p-6 flex flex-col justify-between h-36 hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-[#94a3b8] tracking-widest">Sukses Advokasi</p>
            <div className="bg-emerald-50 text-emerald-500 p-2 rounded-xl">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-[#0f172a]">92.5%</h3>
            <span className="flex items-center text-emerald-500 text-xs font-bold gap-0.5 mt-1">
              <TrendingUp className="h-3 w-3" /> +4.2% <span className="text-[#94a3b8] font-medium ml-1">angka penyelesaian</span>
            </span>
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
            <h2 className="text-[17px] font-bold text-[#0f172a]">Kepatuhan per Sektor Industri</h2>
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-6">
            {complianceData.map((item) => (
              <div key={item.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-[#1e293b]">{item.name}</span>
                  <span className="text-sm font-bold text-[#0f172a]">{item.value}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div className={`${item.color} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Recent Advocacy Table */}
        <Card className="md:col-span-2 rounded-[20px] shadow-sm border-slate-100 p-6">
          <h2 className="text-[17px] font-bold text-[#0f172a] mb-4">Status Advokasi Terakhir</h2>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-slate-100">
                <TableHead className="py-3 font-bold text-[10px] tracking-widest text-[#94a3b8]">NAMA PERUSAHAAN</TableHead>
                <TableHead className="py-3 font-bold text-[10px] tracking-widest text-[#94a3b8]">KASUS</TableHead>
                <TableHead className="py-3 font-bold text-[10px] tracking-widest text-[#94a3b8]">STATUS</TableHead>
                <TableHead className="py-3 font-bold text-[10px] tracking-widest text-[#94a3b8]">AKSI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentAdvocacy.map((row, i) => (
                <TableRow key={i} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="py-3.5 font-bold text-[#1e293b] text-sm">{row.company}</TableCell>
                  <TableCell className="py-3.5 text-sm text-[#475569]">{row.case}</TableCell>
                  <TableCell className="py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold border ${row.statusColor}`}>
                      {row.status}
                    </span>
                  </TableCell>
                  <TableCell className="py-3.5">
                    <button className="text-sm font-bold text-[#0ea5e9] hover:text-[#0284c7] transition-colors">Detail</button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Success Rate Card */}
        <Card className="rounded-[20px] shadow-sm border-slate-100 bg-gradient-to-br from-[#0c4a6e] to-[#0284c7] text-white p-8 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold">Tingkat Keberhasilan</h2>
            <p className="text-white/70 text-sm mt-1.5">Efektivitas pendampingan dan advokasi hukum nasional</p>
          </div>
          <div className="my-6">
            <h3 className="text-6xl font-extrabold">94%</h3>
          </div>
          <div>
            <p className="text-white/70 text-sm">Melampaui target KPI tahunan (90%)</p>
            <Button className="mt-4 bg-white/10 hover:bg-white/20 text-white border-white/20 border h-11 px-6 font-bold" variant="outline">
              Lihat Review
            </Button>
          </div>
        </Card>
      </div>

    </div>
  );
}
