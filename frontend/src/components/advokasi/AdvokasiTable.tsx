import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Eye, RefreshCw, Archive } from 'lucide-react';
import { cn, formatHealthStatus } from '@/lib/utils';
import { StatusAdvokasi } from '@/types';

const milestoneKeys = [
  'riwayat_pajanan',
  'persetujuan_dokter',
  'perusahaan_lapor',
  'penetapan_pak',
  'kompensasi_bpjstk',
  'rehabilitasi_bpjskes'
];

const milestoneLabels = [
  'Pajanan',
  'Diagnosis',
  'Pelaporan',
  'Penetapan',
  'Kompensasi',
  'Rehabilitasi'
];

const caseTypeLabels: Record<string, string> = {
  PAK: 'PAK (Penyakit Kerja)',
  K3: 'Kecelakaan K3',
  PHK: 'Kasus PHK',
  JHT: 'Jaminan / JHT',
};

function ProgressDots({ level, total = 6 }: { level: number; total?: number }) {
  const steps = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center">
            <div className={cn(
              "w-2.5 h-2.5 rounded-full transition-all duration-500",
              s <= level ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-200'
            )} />
            {i < steps.length - 1 && (
              <div className={cn(
                "w-3 h-[2px] transition-all duration-500",
                s < level ? 'bg-emerald-500' : 'bg-slate-100'
              )} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface AdvokasiTableProps {
  loading: boolean;
  filteredCases: StatusAdvokasi[];
  totalCount: number;
  isStaffOrAbove: boolean;
}

export default function AdvokasiTable({ loading, filteredCases, totalCount, isStaffOrAbove }: AdvokasiTableProps) {
  const router = useRouter();

  return (
    <>
      <div className="overflow-x-auto mt-4">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-slate-100">
              <TableHead className="py-4 px-6 font-bold text-[10px] tracking-widest text-[#94a3b8]">NAMA PEKERJA</TableHead>
              <TableHead className="py-4 px-6 font-bold text-[10px] tracking-widest text-[#94a3b8]">PERUSAHAAN</TableHead>
              <TableHead className="py-4 px-6 font-bold text-[10px] tracking-widest text-[#94a3b8]">JENIS KASUS</TableHead>
              <TableHead className="py-4 px-6 font-bold text-[10px] tracking-widest text-[#94a3b8]">INFORMASI MEDIS & PAJANAN</TableHead>
              <TableHead className="py-4 px-6 font-bold text-[10px] tracking-widest text-[#94a3b8]">PROGRES ALUR</TableHead>
              <TableHead className="py-4 px-6 font-bold text-[10px] tracking-widest text-[#94a3b8]">STATUS TERAKHIR</TableHead>
              <TableHead className="py-4 px-6 font-bold text-[10px] tracking-widest text-[#94a3b8]">TANGGAL UPDATE</TableHead>
              <TableHead className="py-4 px-6 font-bold text-[10px] tracking-widest text-[#94a3b8]">AKSI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-20 text-center text-slate-400">Memuat data...</TableCell>
              </TableRow>
            ) : filteredCases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-20 text-center text-slate-400 font-medium italic">Belum ada kasus advokasi terdaftar.</TableCell>
              </TableRow>
            ) : filteredCases.map((c) => {
              const worker = c.pekerja;
              const initials = worker?.nama_lengkap.split(' ').map((n) => n[0]).join('').substring(0, 2);
              
              // Calculate progress based on milestones
              // @ts-ignore
              const completedCount = milestoneKeys.filter(key => !!c[key]).length;
              // @ts-ignore
              const nextStepIdx = milestoneKeys.findIndex(key => !c[key]);
              const currentStatusLabel = nextStepIdx === -1 ? 'Selesai' : milestoneLabels[nextStepIdx];
              
              // Style for the "tahap" badge logic
              const statusColor = completedCount === 6 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-blue-50 text-blue-700 border-blue-200';

              return (
                <TableRow key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                  <TableCell className="py-4 px-6">
                    <button 
                      onClick={() => router.push(`/advokasi/${c.id}`)}
                      className="flex items-center gap-3 group/name text-left outline-none"
                    >
                      <div className="h-9 w-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0 border border-slate-200 group-hover/name:border-[#0ea5e9] group-hover/name:bg-blue-50 group-hover/name:text-[#0284c7] transition-all">
                        {initials}
                      </div>
                      <span className="font-bold text-[#1e293b] text-sm group-hover/name:text-[#0284c7] transition-colors">
                        {worker?.nama_lengkap}
                      </span>
                    </button>
                  </TableCell>
                  <TableCell className="py-4 px-6 text-sm text-[#475569]">{worker?.perusahaan?.nama_perusahaan}</TableCell>
                  <TableCell className="py-4 px-6 text-sm text-[#475569]">{caseTypeLabels[c.jenis_kasus?.toUpperCase()]}</TableCell>
                  <TableCell className="py-4 px-6 min-w-[200px]">
                    <div className="flex flex-col gap-1">
                      <p className="text-[11px] font-bold text-slate-700 line-clamp-1 uppercase tracking-tight">
                        {worker?.latest_detail_medis?.hasil_diagnosis || '-'}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1 w-1 rounded-full bg-rose-400" />
                        <p className="text-[10px] text-slate-500 font-semibold truncate">
                          Pajanan: <span className="text-slate-700">{worker?.current_job?.jenis_pajanan || '-'}</span> 
                          {worker?.current_job?.durasi_pajanan && ` (${worker.current_job.durasi_pajanan})`}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="flex flex-col gap-1">
                      <ProgressDots level={completedCount} />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        Langkah {completedCount}/6: <span className="text-[#0284c7]">{currentStatusLabel}</span>
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wide ${statusColor}`}>
                      {formatHealthStatus(c.status_detail) || 'PROSES'}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 px-6 text-sm text-[#475569]">{new Date(c.updated_at).toLocaleDateString('id-ID')}</TableCell>
                  <TableCell className="py-4 px-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 text-slate-400 hover:text-slate-700")}>
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`/advokasi/${c.id}`)}><Eye className="mr-2 h-4 w-4" /> Lihat Detail</DropdownMenuItem>
                        {isStaffOrAbove && (
                          <>
                            <DropdownMenuItem className="cursor-pointer"><RefreshCw className="mr-2 h-4 w-4" /> Update Status</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer"><Archive className="mr-2 h-4 w-4" /> Tutup/Arsip Kasus</DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="border-t border-slate-100 p-4 px-6 flex items-center justify-between text-sm text-slate-500 font-medium">
        <p className="text-xs font-bold text-[#94a3b8] tracking-wider uppercase">
          MENAMPILKAN {filteredCases.length} DARI {totalCount} KASUS
        </p>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" disabled>&lt;</Button>
          <Button variant="ghost" className="h-8 w-8 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-full text-xs font-bold">1</Button>
          <Button variant="ghost" className="h-8 w-8 rounded-full hover:bg-slate-100 text-xs font-bold">2</Button>
          <Button variant="ghost" className="h-8 w-8 rounded-full hover:bg-slate-100 text-xs font-bold">3</Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:bg-slate-100">&gt;</Button>
        </div>
      </div>
    </>
  );
}
