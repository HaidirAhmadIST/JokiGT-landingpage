'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
import api from '@/lib/axios';
import { Card } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  ClipboardList,
  ArrowLeftRight,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Plus,
  MoreVertical,
  Eye,
  RefreshCw,
  Archive,
  Search,
  SlidersHorizontal,
  Activity,
  HardHat,
  Gavel,
  Coins,
  ChevronDown,
  Check,
} from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useRole } from '@/hooks/useRole';

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

const tabs = ['Semua Kasus', 'Tahap UPTD', 'Tahap BPJS', 'Tahap Pengadilan'];

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


export default function AdvokasiPage() {
  const router = useRouter();
  const { isSuperAdmin, isStaffOrAbove, loading: roleLoading } = useRole();
  const [activeTab, setActiveTab] = useState('Semua Kasus');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cases, setCases] = useState<any[]>([]);
  const [summaryStats, setSummaryStats] = useState({
    total: { count: 0, trend: 0 },
    proses: { count: 0, trend: 0 },
    selesai: { count: 0, trend: 0 }
  });

  const [openWorkerSearch, setOpenWorkerSearch] = useState(false);
  const [workers, setWorkers] = useState<any[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);

  const [formData, setFormData] = useState({
    pekerja_id: '',
    pekerja_name: '',
    jenis_kasus: '',
    perusahaan: '',
    tahap: 'UPTD',
    status_detail: 'Verifikasi Dokumen',
    tanggal_pelaporan: new Date().toISOString().split('T')[0],
    catatan: '',
  });

  const fetchCases = async () => {
    setLoading(true);
    try {
      const resp = await api.get('/advokasi');
      if (resp.data.status === 'success') {
        setCases(resp.data.data);
      }
    } catch (err) {
      toast.error('Gagal memuat data kasus.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummaryStats = async () => {
    try {
      const resp = await api.get('/advokasi/stats');
      if (resp.data.status === 'success') {
        setSummaryStats(resp.data.summary);
      }
    } catch (err) {
      console.error('Gagal memuat statistik:', err);
    }
  };

  useEffect(() => {
    fetchCases();
    fetchSummaryStats();
  }, []);

  const defaultNotes: Record<string, string> = {
    PAK: "Pekerja didiagnosa mengalami Penyakit Akibat Kerja (PAK) berupa [NAMA PENYAKIT]. Dilaporkan adanya pajanan [JENIS PAJANAN] di area kerja [NAMA AREA] yang berlangsung selama [DURASI]. Dibutuhkan pendampingan medis dan pelaporan ke pihak berwenang.",
    K3: "Terjadi kecelakaan kerja pada tanggal [TANGGAL] pukul [JAM] di lokasi [LOKASI]. Kejadian bermula saat [KRONOLOGI SINGKAT]. Kondisi pekerja saat ini [KONDISI].",
    PHK: "Pekerja mengalami perselisihan hubungan kerja terkait [ALASAN PHK]. Hak-hak pekerja seperti pesangon dan uang penggantian hak masih dalam tahap perundingan.",
    JHT: "Pendampingan pengurusan klaim Jaminan Hari Tua (JHT) / Jaminan Pensiun bagi pekerja yang telah memasuki masa purna tugas atau kondisi tertentu.",
  };

  const handleCaseTypeSelect = (typeId: string) => {
    setFormData(prev => ({ 
      ...prev, 
      jenis_kasus: typeId,
      // Auto-fill catatan only if it's empty or currently matches another default note
      catatan: (!prev.catatan || Object.values(defaultNotes).includes(prev.catatan)) 
        ? defaultNotes[typeId] 
        : prev.catatan
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pekerja_id || !formData.jenis_kasus) {
      toast.error('Mohon lengkapi data pekerja dan jenis kasus.');
      return;
    }

    setIsSubmitting(true);
    try {
      const resp = await api.post(`/pekerja/${formData.pekerja_id}/advokasi`, formData);
      if (resp.data.status === 'success') {
        toast.success('Kasus berhasil disimpan.');
        setSheetOpen(false);
        fetchCases();
        fetchSummaryStats();
        // Reset form
        setFormData({
          pekerja_id: '', pekerja_name: '', jenis_kasus: '', perusahaan: '',
          tahap: 'UPTD', status_detail: 'Verifikasi Dokumen',
          tanggal_pelaporan: new Date().toISOString().split('T')[0], catatan: ''
        });
      }
    } catch (err) {
      toast.error('Gagal menyimpan kasus.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchWorkers = async (search: string) => {
    if (!search || search.length < 2) return;
    setLoadingWorkers(true);
    try {
      const resp = await api.get(`/pekerja?search=${search}`);
      if (resp.data.status === 'success') {
        setWorkers(resp.data.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWorkers(false);
    }
  };

  const caseTypes = [
    { id: 'PAK', label: 'PAK (Penyakit Kerja)', icon: Activity, desc: 'Penyakit akibat lingkungan kerja', color: 'text-rose-500', bg: 'bg-rose-50' },
    { id: 'K3', label: 'K3 (Kecelakaan)', icon: HardHat, desc: 'Kecelakaan saat bekerja', color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 'PHK', label: 'PHK (Kasus)', icon: Gavel, desc: 'Perselisihan hubungan kerja', color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'JHT', label: 'JHT (Jaminan)', icon: Coins, desc: 'Klaim jaminan sosial/tua', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-extrabold tracking-tight text-[#0f172a]">Dashboard Advokasi</h1>
        <p className="text-[#64748b] mt-1.5 text-[15px]">
          Pantau progres kasus advokasi yang sedang berjalan secara real-time
        </p>
      </div>

      {/* Stats Cards */}
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

      {/* Table Section */}
      <Card className="rounded-[20px] shadow-sm border-slate-100 overflow-hidden">
        {/* Tabs + Actions */}
        <div className="px-6 pt-6 pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-[#0f172a]">Daftar Kasus Aktif</h2>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Tabs */}
            <div className="flex border-b border-slate-200">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 pb-3 text-sm font-semibold whitespace-nowrap transition-colors relative ${activeTab === tab
                    ? 'text-[#0284c7]'
                    : 'text-[#94a3b8] hover:text-slate-600'
                    }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <span className="absolute bottom-0 inset-x-0 h-[2px] bg-[#0284c7] rounded-t" />
                  )}
                </button>
              ))}
            </div>
            <Button variant="outline" className="h-9 px-4 text-sm font-semibold border-slate-200 text-slate-600">
              <SlidersHorizontal className="mr-2 h-4 w-4" /> Filter
            </Button>
            {isStaffOrAbove && (
              <Button onClick={() => setSheetOpen(true)} className="h-9 px-4 text-sm font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white">
                <Plus className="mr-2 h-4 w-4" /> Tambah Kasus
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mt-4">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-slate-100">
                <TableHead className="py-4 px-6 font-bold text-[10px] tracking-widest text-[#94a3b8]">NAMA PEKERJA</TableHead>
                <TableHead className="py-4 px-6 font-bold text-[10px] tracking-widest text-[#94a3b8]">PERUSAHAAN</TableHead>
                <TableHead className="py-4 px-6 font-bold text-[10px] tracking-widest text-[#94a3b8]">JENIS KASUS</TableHead>
                <TableHead className="py-4 px-6 font-bold text-[10px] tracking-widest text-[#94a3b8]">PROGRES ALUR</TableHead>
                <TableHead className="py-4 px-6 font-bold text-[10px] tracking-widest text-[#94a3b8]">STATUS TERAKHIR</TableHead>
                <TableHead className="py-4 px-6 font-bold text-[10px] tracking-widest text-[#94a3b8]">TANGGAL UPDATE</TableHead>
                <TableHead className="py-4 px-6 font-bold text-[10px] tracking-widest text-[#94a3b8]">AKSI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center text-slate-400">Memuat data...</TableCell>
                </TableRow>
              ) : cases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center text-slate-400 font-medium italic">Belum ada kasus advokasi terdaftar.</TableCell>
                </TableRow>
              ) : cases.map((c) => {
                const worker = c.pekerja;
                const initials = worker?.nama_lengkap.split(' ').map((n: string) => n[0]).join('').substring(0, 2);
                
                // Calculate progress based on milestones
                const completedCount = milestoneKeys.filter(key => !!c[key]).length;
                const nextStepIdx = milestoneKeys.findIndex(key => !c[key]);
                const currentStatusLabel = nextStepIdx === -1 ? 'Selesai' : milestoneLabels[nextStepIdx];
                
                // Style for the "tahap" badge logic (keep it legacy-compatible for now or use a generic one)
                const statusColor = completedCount === 6 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-blue-50 text-blue-700 border-blue-200';

                return (
                  <TableRow key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0 border border-slate-200">
                          {initials}
                        </div>
                        <span className="font-bold text-[#1e293b] text-sm">{worker?.nama_lengkap}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-sm text-[#475569]">{worker?.perusahaan?.nama_perusahaan}</TableCell>
                    <TableCell className="py-4 px-6 text-sm text-[#475569]">{caseTypeLabels[c.jenis_kasus]}</TableCell>
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
                        {c.status_detail?.replace(/_/g, ' ') || 'PROSES'}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-sm text-[#475569]">{new Date(c.updated_at).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell className="py-4 px-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 text-slate-400 hover:text-slate-700")}>
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        {/* @ts-ignore */}
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
            MENAMPILKAN {cases.length} DARI {summaryStats.total.count} KASUS
          </p>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" disabled>&lt;</Button>
            <Button variant="ghost" className="h-8 w-8 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-full text-xs font-bold">1</Button>
            <Button variant="ghost" className="h-8 w-8 rounded-full hover:bg-slate-100 text-xs font-bold">2</Button>
            <Button variant="ghost" className="h-8 w-8 rounded-full hover:bg-slate-100 text-xs font-bold">3</Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:bg-slate-100">&gt;</Button>
          </div>
        </div>
      </Card>

      {/* ===== Add New Case Sheet ===== */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-xl p-0 overflow-hidden flex flex-col bg-white border-l shadow-2xl">
          <SheetHeader className="px-8 py-6 border-b border-slate-100 bg-white z-10">
            <SheetTitle className="text-xl font-bold text-slate-900">Tambah Kasus Baru</SheetTitle>
            <SheetDescription className="mt-1 text-slate-500">
              Masukkan profil kasus pendampingan baru untuk pekerja.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-8 py-6">
            <form id="advokasi-form" className="space-y-8 pb-4">

              {/* Section 01 */}
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-[#0ea5e9] text-white text-[10px] font-bold">01</span>
                  <h3 className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest">IDENTITAS PEKERJA & KASUS</h3>
                </div>

                <div className="space-y-3">
                  <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cari Pekerja</Label>
                  <Popover open={openWorkerSearch} onOpenChange={setOpenWorkerSearch}>
                    <PopoverTrigger
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "w-full justify-between h-12 bg-slate-50 border-slate-200 hover:bg-slate-100 px-4 font-normal"
                      )}
                      role="combobox"
                      aria-expanded={openWorkerSearch}
                    >
                      {formData.pekerja_name ? (
                        <span className="font-semibold text-slate-900">{formData.pekerja_name}</span>
                      ) : (
                        <span className="text-slate-400">Pilih pekerja yang terdaftar...</span>
                      )}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Ketik nama atau NIK..."
                          className="h-10"
                          onValueChange={(v) => fetchWorkers(v)}
                        />
                        <CommandList>
                          <CommandEmpty className="py-6 text-center text-sm text-slate-500 italic">
                            {loadingWorkers ? 'Mencari...' : 'Pekerja tidak ditemukan.'}
                          </CommandEmpty>
                          <CommandGroup>
                            {workers.map((worker) => (
                              <CommandItem
                                key={worker.id}
                                value={worker.id.toString()}
                                onSelect={() => {
                                  setFormData({
                                    ...formData,
                                    pekerja_id: worker.id.toString(),
                                    pekerja_name: worker.nama_lengkap,
                                    perusahaan: worker.perusahaan?.nama_perusahaan || 'N/A'
                                  });
                                  setOpenWorkerSearch(false);
                                }}
                                className="flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-slate-50 border-b border-slate-50 last:border-0"
                              >
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-800">{worker.nama_lengkap}</span>
                                  <span className="text-[10px] text-slate-400 font-medium">NIK: {worker.nik} • {worker.perusahaan?.nama_perusahaan}</span>
                                </div>
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4 text-[#0ea5e9]",
                                    formData.pekerja_id === worker.id.toString() ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-3">
                  <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Jenis Kasus Advokasi</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {caseTypes.map((type) => {
                      const Icon = type.icon;
                      const isActive = formData.jenis_kasus === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => handleCaseTypeSelect(type.id)}
                          className={cn(
                            "flex flex-col items-start p-4 rounded-[16px] border-2 text-left transition-all duration-200",
                            isActive
                              ? "border-[#0ea5e9] bg-[#f0f9ff] ring-1 ring-[#0ea5e9]/20 shadow-sm"
                              : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                          )}
                        >
                          <div className={cn("p-2 rounded-lg mb-3", type.bg, type.color)}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <span className={cn("text-sm font-bold block", isActive ? "text-[#0369a1]" : "text-slate-700")}>
                            {type.label}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium mt-1">
                            {type.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Perusahaan Terkait</Label>
                  <div className="h-12 flex items-center px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-sm font-medium italic">
                    {formData.perusahaan || 'Otomatis terisi saat pekerja dipilih'}
                  </div>
                </div>
              </div>

              {/* Section 02 */}
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-[#0ea5e9] text-white text-[10px] font-bold">02</span>
                  <h3 className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest">PROGRES AWAL</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-600">TAHAP SAAT INI</Label>
                    {/* @ts-ignore */}
                    <Select value={formData.tahap || undefined} onValueChange={(v: any) => setFormData({ ...formData, tahap: v })}>
                      <SelectTrigger className="h-11 bg-slate-50/50 border-slate-200 focus:ring-[#0ea5e9]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UPTD">UPTD</SelectItem>
                        <SelectItem value="BPJS">BPJS</SelectItem>
                        <SelectItem value="Pengadilan">Pengadilan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-600">STATUS DETAIL</Label>
                    {/* @ts-ignore */}
                    <Select value={formData.status_detail || undefined} onValueChange={(v: any) => setFormData({ ...formData, status_detail: v })}>
                      <SelectTrigger className="h-11 bg-slate-50/50 border-slate-200 focus:ring-[#0ea5e9]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Verifikasi Dokumen">Verifikasi Dokumen</SelectItem>
                        <SelectItem value="Mediasi 1">Mediasi 1</SelectItem>
                        <SelectItem value="Mediasi 2">Mediasi 2</SelectItem>
                        <SelectItem value="Sidang">Sidang</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Section 03 */}
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-[#0ea5e9] text-white text-[10px] font-bold">03</span>
                  <h3 className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest">DOKUMENTASI AWAL</h3>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-600">TANGGAL PELAPORAN</Label>
                  <Input type="date" className="h-11 bg-slate-50/50 border-slate-200 focus-visible:ring-[#0ea5e9]"
                    value={formData.tanggal_pelaporan} onChange={(e) => setFormData({ ...formData, tanggal_pelaporan: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-600">CATATAN AWAL KASUS</Label>
                  <Textarea placeholder="Tuliskan ringkasan singkat kasus..." className="min-h-[100px] resize-none bg-slate-50/50 border-slate-200 focus-visible:ring-[#0ea5e9]"
                    value={formData.catatan} onChange={(e) => setFormData({ ...formData, catatan: e.target.value })} />
                </div>
              </div>

            </form>
          </div>

          <div className="border-t border-slate-100 p-6 bg-slate-50/50 flex flex-col gap-3">
            <Button type="submit" onClick={handleSave} disabled={isSubmitting} className="w-full h-12 text-sm font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white">
              {isSubmitting ? 'Menyimpan...' : 'Simpan Kasus'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setSheetOpen(false)} className="w-full h-12 text-sm font-bold bg-white text-slate-600 border-slate-200 hover:bg-slate-100">
              Batal
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
