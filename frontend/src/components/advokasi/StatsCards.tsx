import { Card } from '@/components/ui/card';
import { ClipboardList, ArrowLeftRight, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardsProps {
  summaryStats: {
    total: { count: number; new: number };
    proses: { count: number; new: number };
    selesai: { count: number; new: number };
  };
}

export default function StatsCards({ summaryStats }: StatsCardsProps) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {/* Total Kasus */}
      <Card className="rounded-[20px] shadow-sm border-slate-100 p-6 flex flex-col justify-between min-h-[152px] hover:shadow-md transition-all">
        <div className="flex justify-between items-start">
          <p className="text-xs font-bold text-[#94a3b8] tracking-widest uppercase">TOTAL KASUS</p>
          <div className="bg-blue-50 text-blue-500 p-2 rounded-xl">
            <ClipboardList className="h-5 w-5" />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <h3 className="text-4xl font-extrabold text-[#0f172a]">{summaryStats.total.count}</h3>
          {summaryStats.total.new > 0 && (
            <span className="text-xs font-bold text-emerald-500 mb-1.5 whitespace-nowrap">
              (+{summaryStats.total.new})
            </span>
          )}
        </div>
        <p className="text-xs font-medium text-[#94a3b8]">Akumulasi total</p>
      </Card>

      {/* Dalam Proses */}
      <Card className="rounded-[20px] shadow-sm border-slate-100 p-6 flex flex-col justify-between min-h-[152px] hover:shadow-md transition-all">
        <div className="flex justify-between items-start">
          <p className="text-xs font-bold text-[#94a3b8] tracking-widest uppercase">DALAM PROSES</p>
          <div className="bg-orange-50 text-orange-500 p-2 rounded-xl">
            <ArrowLeftRight className="h-5 w-5" />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <h3 className="text-4xl font-extrabold text-[#0f172a]">{summaryStats.proses.count}</h3>
        </div>
        <p className="text-xs font-medium text-[#94a3b8]">Sedang berjalan</p>
      </Card>

      {/* Selesai */}
      <Card className="rounded-[20px] shadow-sm border-slate-100 p-6 flex flex-col justify-between min-h-[152px] hover:shadow-md transition-all">
        <div className="flex justify-between items-start">
          <p className="text-xs font-bold text-[#94a3b8] tracking-widest uppercase">SELESAI</p>
          <div className="bg-emerald-50 text-emerald-500 p-2 rounded-xl">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <h3 className="text-4xl font-extrabold text-[#0f172a]">{summaryStats.selesai.count}</h3>
        </div>
        <p className="text-xs font-medium text-[#94a3b8]">Kasus tuntas</p>
      </Card>
    </div>
  );

}
