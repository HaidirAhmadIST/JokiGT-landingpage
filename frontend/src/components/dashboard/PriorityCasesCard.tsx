'use client';

import { useGetPriorityCases } from '@/hooks/useAdvokasi';
import { Card } from '@/components/ui/card';
import { AlertCircle, Clock, ChevronRight, HardHat, RefreshCw, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function PriorityCasesCard() {
  const router = useRouter();
  const { data: priorityCases, isLoading } = useGetPriorityCases(5);

  if (isLoading) {
    return (
      <Card className="rounded-[20px] shadow-sm border-slate-100 p-6 flex flex-col justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 text-[#0284c7] animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-400">Memuat kasus prioritas...</p>
      </Card>
    );
  }

  if (!priorityCases || priorityCases.length === 0) {
    return (
      <Card className="rounded-[20px] shadow-sm border-slate-100 p-8 flex flex-col items-center justify-center text-center bg-slate-50/50">
        <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-slate-100">
          <Clock className="h-8 w-8 text-slate-200" />
        </div>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Kasus Prioritas</h3>
        <p className="text-xs text-slate-400 mt-2 max-w-[200px]">
          Tidak ada kasus yang mendekati tenggat waktu advokasi 3 tahun.
        </p>
      </Card>
    );
  }

  return (
    <Card className="rounded-[20px] shadow-sm border-slate-100 overflow-hidden flex flex-col">
      <div className="p-6 border-b border-slate-50 bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1e293b] uppercase tracking-tight">Kasus Prioritas (Deadline PAK)</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Tenggat Waktu Advokasi 3 Tahun</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-full border border-rose-100 flex items-center gap-1 shrink-0 whitespace-nowrap">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
          {priorityCases.length} URGENT
        </span>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[400px] no-scrollbar">
        <div className="divide-y divide-slate-50">
          {priorityCases.map((item: any, idx: number) => {
            const isVeryUrgent = item.is_very_urgent;
            return (
              <div 
                key={idx} 
                onClick={() => router.push(`/advokasi/${item.id}`)}
                className="p-5 hover:bg-slate-50 transition-all cursor-pointer group flex items-start gap-4"
              >
                <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
                  <div className={cn(
                    "h-3 w-3 rounded-full border-2 bg-white",
                    isVeryUrgent ? "border-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)] animate-pulse" : "border-amber-400"
                  )} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-extrabold text-slate-800 truncate group-hover:text-[#0ea5e9] transition-colors uppercase">
                      {item.pekerja?.nama_lengkap}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                       <Clock className={cn("h-3 w-3", isVeryUrgent ? "text-rose-500" : "text-amber-500")} />
                       <span className={cn("text-[10px] font-black uppercase tracking-tighter", isVeryUrgent ? "text-rose-600" : "text-amber-600")}>
                         {item.days_remaining <= 0 ? 'LEWAT DEADLINE' : `${Math.ceil(item.days_remaining / 30)} BULAN LAGI`}
                       </span>
                    </div>
                  </div>
                  
                  <p className="text-[11px] text-slate-400 font-medium truncate mb-2">
                    {item.pekerja?.perusahaan?.nama_perusahaan || 'Pekerja Informal'}
                  </p>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                      <HardHat className="h-2.5 w-2.5" />
                      <span className="text-[9px] font-bold uppercase truncate max-w-[120px]">
                        {item.latest_pajanan || 'Tanpa Pajanan'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 rounded text-[#0ea5e9]">
                      <RefreshCw className="h-2.5 w-2.5" />
                      <span className="text-[9px] font-bold uppercase tracking-tight">
                        {Math.floor(item.progress_percentage || 0)}% PROGRESS
                      </span>
                    </div>
                  </div>
                </div>

                <div className="self-center">
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#0ea5e9] group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="p-4 bg-slate-50/50 border-t border-slate-100 mt-auto">
        <button 
          onClick={() => router.push('/advokasi')}
          className="w-full py-2.5 text-[10px] font-black text-slate-400 hover:text-[#0ea5e9] uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
        >
          Lihat Semua Kasus Aktif <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </Card>
  );
}
