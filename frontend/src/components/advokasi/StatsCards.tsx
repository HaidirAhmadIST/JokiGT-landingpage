import { Card } from '@/components/ui/card';
import { ClipboardList, ArrowLeftRight, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardsProps {
  summaryStats: {
    total: { count: number; trend: number };
    proses: { count: number; trend: number };
    selesai: { count: number; trend: number };
  };
}

export default function StatsCards({ summaryStats }: StatsCardsProps) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {/* Total Kasus */}
      <Card className="rounded-[20px] shadow-sm border-slate-100 p-6 flex flex-col justify-between min-h-[152px] hover:shadow-md transition-all">
        <div className="flex justify-between items-start">
          <p className="text-xs font-bold text-[#94a3b8] tracking-widest">TOTAL KASUS</p>
          <div className="bg-blue-50 text-blue-500 p-2 rounded-xl">
            <ClipboardList className="h-5 w-5" />
          </div>
        </div>
        <div className="flex items-end gap-3">
          <h3 className="text-4xl font-extrabold text-[#0f172a]">{summaryStats.total.count}</h3>
          <span className={cn(
            "flex items-center text-xs font-bold gap-0.5 mb-1.5",
            summaryStats.total.trend >= 0 ? "text-emerald-500" : "text-rose-500"
          )}>
            {summaryStats.total.trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {summaryStats.total.trend >= 0 ? '+' : ''}{summaryStats.total.trend}%
          </span>
        </div>
        <p className="text-xs font-medium text-[#94a3b8]">Sejak bulan lalu</p>
      </Card>

      {/* Dalam Proses */}
      <Card className="rounded-[20px] shadow-sm border-slate-100 p-6 flex flex-col justify-between min-h-[152px] hover:shadow-md transition-all">
        <div className="flex justify-between items-start">
          <p className="text-xs font-bold text-[#94a3b8] tracking-widest">DALAM PROSES</p>
          <div className="bg-orange-50 text-orange-500 p-2 rounded-xl">
            <ArrowLeftRight className="h-5 w-5" />
          </div>
        </div>
        <div className="flex items-end gap-3">
          <h3 className="text-4xl font-extrabold text-[#0f172a]">{summaryStats.proses.count}</h3>
          <span className={cn(
            "flex items-center text-xs font-bold gap-0.5 mb-1.5",
            summaryStats.proses.trend >= 0 ? "text-emerald-500" : "text-rose-500"
          )}>
            {summaryStats.proses.trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {summaryStats.proses.trend >= 0 ? '+' : ''}{summaryStats.proses.trend}%
          </span>
        </div>
        <p className="text-xs font-medium text-[#94a3b8]">Aktif di lapangan</p>
      </Card>

      {/* Selesai */}
      <Card className="rounded-[20px] shadow-sm border-slate-100 p-6 flex flex-col justify-between min-h-[152px] hover:shadow-md transition-all">
        <div className="flex justify-between items-start">
          <p className="text-xs font-bold text-[#94a3b8] tracking-widest">SELESAI</p>
          <div className="bg-emerald-50 text-emerald-500 p-2 rounded-xl">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
        <div className="flex items-end gap-3">
          <h3 className="text-4xl font-extrabold text-[#0f172a]">{summaryStats.selesai.count}</h3>
          <span className={cn(
            "flex items-center text-xs font-bold gap-0.5 mb-1.5",
            summaryStats.selesai.trend >= 0 ? "text-emerald-500" : "text-rose-500"
          )}>
            {summaryStats.selesai.trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {summaryStats.selesai.trend >= 0 ? '+' : ''}{summaryStats.selesai.trend}%
          </span>
        </div>
        <p className="text-xs font-medium text-[#94a3b8]">Kasus tertutup</p>
      </Card>
    </div>
  );
}
