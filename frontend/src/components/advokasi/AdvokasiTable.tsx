import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Eye, RefreshCw, Archive } from 'lucide-react';
import { cn, formatHealthStatus } from '@/lib/utils';
import { StatusAdvokasi } from '@/types';
import { Pagination } from '@/components/ui/Pagination';

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
  currentPage: number;
  perPage: number;
  lastPage: number;
  onPageChange: (page: number) => void;
  isStaffOrAbove: boolean;
}

export default function AdvokasiTable({ 
  loading, 
  filteredCases, 
  totalCount, 
  currentPage,
  perPage,
  lastPage,
  onPageChange,
  isStaffOrAbove 
}: AdvokasiTableProps) {
  const router = useRouter();

  return (
    <>
      <div className="mt-4 w-full">
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-slate-100">
              <TableHead className="py-3 pl-4 pr-1 font-bold text-[10px] tracking-widest text-[#94a3b8] w-10">NO.</TableHead>
              <TableHead className="py-3 px-3 font-bold text-[10px] tracking-widest text-[#94a3b8] w-[15%]">NAMA PEKERJA</TableHead>
              <TableHead className="py-3 px-3 font-bold text-[10px] tracking-widest text-[#94a3b8] w-[13%]">PERUSAHAAN</TableHead>
              <TableHead className="py-3 px-3 font-bold text-[10px] tracking-widest text-[#94a3b8] w-[12%]">JENIS KASUS</TableHead>
              <TableHead className="py-3 px-3 font-bold text-[10px] tracking-widest text-[#94a3b8] w-[18%]">MEDIS & PAJANAN</TableHead>
              <TableHead className="py-3 px-3 font-bold text-[10px] tracking-widest text-[#94a3b8] w-[16%]">PROGRES ALUR</TableHead>
              <TableHead className="py-3 px-3 font-bold text-[10px] tracking-widest text-[#94a3b8] w-[14%]">STATUS</TableHead>
              <TableHead className="py-3 px-3 font-bold text-[10px] tracking-widest text-[#94a3b8] w-[9%]">UPDATE</TableHead>
              <TableHead className="py-3 px-2 font-bold text-[10px] tracking-widest text-[#94a3b8] w-10">AKSI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="py-20 text-center text-slate-400">Memuat data...</TableCell>
              </TableRow>
            ) : filteredCases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-20 text-center text-slate-400 font-medium italic">Belum ada kasus advokasi terdaftar.</TableCell>
              </TableRow>
            ) : filteredCases.map((c, index) => {
              const worker = c.pekerja;
              const initials = worker?.nama_lengkap.split(' ').map((n) => n[0]).join('').substring(0, 2);
              
              // Calculate real row number based on pagination
              const rowNumber = (currentPage - 1) * perPage + index + 1;

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
                <TableRow 
                  key={c.id} 
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  onClick={() => router.push(`/advokasi/${c.id}`)}
                >
                  <TableCell className="py-3 pl-4 pr-1 w-10">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">
                      {rowNumber}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 px-3">
                    <div className="flex items-center gap-2 group/name text-left outline-none w-full transition-transform hover:translate-x-1">
                      <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0 transition-all group-hover/name:border-[#0ea5e9] group-hover/name:bg-blue-50 group-hover/name:scale-110 group-hover/name:ring-2 group-hover/name:ring-blue-100">
                        <img 
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${worker?.nama_lengkap || 'Guest'}`} 
                          alt={worker?.nama_lengkap || 'User'} 
                          className="w-full h-full object-cover object-top" 
                        />
                      </div>
                      <span className="font-bold text-[#1e293b] text-xs group-hover/name:text-[#0284c7] transition-colors truncate">
                        {worker?.nama_lengkap}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-3 text-xs text-[#475569] truncate max-w-0">
                    <span className="block truncate">{worker?.perusahaan?.nama_perusahaan || '-'}</span>
                  </TableCell>
                  <TableCell className="py-3 px-3 text-xs text-[#475569]">
                    <span className="block truncate">
                      {c.jenis_kasus ? (caseTypeLabels[c.jenis_kasus.toUpperCase()] || c.jenis_kasus.toUpperCase()) : '-'}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 px-3">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[11px] font-bold text-slate-700 truncate uppercase tracking-tight">
                        {worker?.latest_detail_medis?.hasil_diagnosis || '-'}
                      </p>
                      <div className="flex items-center gap-1">
                        <div className="h-1 w-1 rounded-full bg-rose-400 shrink-0" />
                        <p className="text-[10px] text-slate-500 font-semibold truncate">
                          Pajanan: <span className="text-slate-700">{worker?.current_job?.jenis_pajanan || '-'}</span>
                          {worker?.current_job?.durasi_pajanan && ` (${worker.current_job.durasi_pajanan})`}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-3">
                    <div className="flex flex-col gap-0.5">
                      <ProgressDots level={completedCount} />
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                        {completedCount}/6: <span className="text-[#0284c7]">{currentStatusLabel}</span>
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-3 max-w-[140px]">
                    <span title={formatHealthStatus(c.status_detail) || 'PROSES'} className={`inline-flex items-center px-2 py-1 rounded-md text-[9px] font-bold border uppercase tracking-wide truncate max-w-full block ${statusColor}`}>
                      {formatHealthStatus(c.status_detail) || 'PROSES'}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 px-3 text-xs text-[#475569] whitespace-nowrap">{new Date(c.updated_at).toLocaleDateString('id-ID')}</TableCell>
                  <TableCell className="py-3 px-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger 
                        onClick={(e) => e.stopPropagation()}
                        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-7 w-7 text-slate-400 hover:text-slate-700")}
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
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

      <Pagination 
        currentPage={currentPage}
        total={totalCount}
        perPage={perPage}
        lastPage={lastPage}
        onPageChange={onPageChange}
        label="kasus"
      />
    </>
  );
}
