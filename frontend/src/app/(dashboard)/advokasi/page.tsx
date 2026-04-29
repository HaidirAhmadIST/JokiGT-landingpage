'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useRole } from '@/hooks/useRole';
import { Pekerja } from '@/types';
import StatsCards from '@/components/advokasi/StatsCards';
import AdvokasiTable from '@/components/advokasi/AdvokasiTable';
import { useGetAdvokasiCases, useGetAdvokasiStats, useUpdateAdvokasi } from '@/hooks/useAdvokasi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { simpanKasusSchema, SimpanKasusFormData } from '@/lib/validations/advokasi';

const tabs = ['Semua Kasus', 'PAK', 'K3', 'PHK', 'JHT'];


export default function AdvokasiPage() {
  const router = useRouter();
  const { isStaffOrAbove } = useRole();
  const [activeTab, setActiveTab] = useState('Semua Kasus');
  const [sheetOpen, setSheetOpen] = useState(false);

  // Data Fetching with React Query
  const { data: casesData, isLoading: loadingCases } = useGetAdvokasiCases();
  const { data: statsData, isLoading: loadingStats } = useGetAdvokasiStats();

  const cases = casesData || [];
  const summaryStats = statsData?.summary || {
    total: { count: 0, trend: 0 },
    proses: { count: 0, trend: 0 },
    selesai: { count: 0, trend: 0 }
  };

  const loading = loadingCases || loadingStats;

  const [openWorkerSearch, setOpenWorkerSearch] = useState(false);
  const [workers, setWorkers] = useState<Pekerja[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<SimpanKasusFormData>({
    resolver: zodResolver(simpanKasusSchema),
    defaultValues: {
      pekerja_id: '',
      pekerja_name: '',
      jenis_kasus: '',
      perusahaan: '',
      tahap: 'UPTD',
      status_detail: 'Dalam Proses',
      tanggal_pelaporan: new Date().toISOString().split('T')[0],
      catatan: '',
    }
  });

  const formData = watch();

  const { mutateAsync: saveAdvokasi, isPending: isSubmitting } = useUpdateAdvokasi(formData.pekerja_id?.toString() || '');

  const onSubmit = async (data: SimpanKasusFormData) => {

    try {
      await saveAdvokasi(data);
      toast.success('Kasus baru berhasil didaftarkan. Pengajuan dokumen dapat dilakukan pada detail kasus.');
      setSheetOpen(false);
      reset(); // Reset form smoothly
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menambahkan kasus.');
    }
  };

  const filteredCases = cases
    .filter(c => {
      if (activeTab === 'Semua Kasus') return true;
      return c.jenis_kasus?.toUpperCase() === activeTab.toUpperCase();
    })
    .sort((a, b) => {
      const nameA = a.pekerja?.nama_lengkap || '';
      const nameB = b.pekerja?.nama_lengkap || '';
      return nameA.localeCompare(nameB);
    });

  const defaultNotes: Record<string, string> = {
    PAK: "Pekerja didiagnosa mengalami Penyakit Akibat Kerja (PAK) berupa [NAMA PENYAKIT]. Dilaporkan adanya pajanan [JENIS PAJANAN] di area kerja [NAMA AREA] yang berlangsung selama [DURASI]. Dibutuhkan pendampingan medis dan pelaporan ke pihak berwenang.",
    K3: "Terjadi kecelakaan kerja pada tanggal [TANGGAL] pukul [JAM] di lokasi [LOKASI]. Kejadian bermula saat [KRONOLOGI SINGKAT]. Kondisi pekerja saat ini [KONDISI].",
    PHK: "Pekerja mengalami perselisihan hubungan kerja terkait [ALASAN PHK]. Hak-hak pekerja seperti pesangon dan uang penggantian hak masih dalam tahap perundingan.",
    JHT: "Pendampingan pengurusan klaim Jaminan Hari Tua (JHT) / Jaminan Pensiun bagi pekerja yang telah memasuki masa purna tugas atau kondisi tertentu.",
  };

  const handleCaseTypeSelect = (typeId: string) => {
    setValue('jenis_kasus', typeId, { shouldValidate: true });

    // Auto-fill catatan
    const currentCatatan = formData.catatan;
    if (!currentCatatan || Object.values(defaultNotes).includes(currentCatatan)) {
      setValue('catatan', defaultNotes[typeId]);
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
      <StatsCards summaryStats={summaryStats} />

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
                  suppressHydrationWarning
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

            {isStaffOrAbove && (
              <Button onClick={() => setSheetOpen(true)} className="h-9 px-4 text-sm font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white">
                <Plus className="mr-2 h-4 w-4" /> Tambah Kasus
              </Button>
            )}
          </div>
        </div>

  {/* Table Content */ }
  <AdvokasiTable
    loading={loading}
    filteredCases={filteredCases}
    totalCount={summaryStats.total.count}
    isStaffOrAbove={isStaffOrAbove}
  />
      </Card >

    {/* ===== Add New Case Sheet ===== */ }
    < Sheet open = { sheetOpen } onOpenChange = { setSheetOpen } >
      <SheetContent className="sm:max-w-xl p-0 overflow-hidden flex flex-col bg-white border-l shadow-2xl">
        <SheetHeader className="px-8 py-6 border-b border-slate-100 bg-white z-10">
          <SheetTitle className="text-xl font-bold text-slate-900">Tambah Kasus Baru</SheetTitle>
          <SheetDescription className="mt-1 text-slate-500">
            Masukkan profil kasus pendampingan baru untuk pekerja.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          <form id="advokasi-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-4">

            {/* Section 01: Identitas Pekerja & Kasus */}
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-[#0ea5e9] text-white text-[10px] font-bold">01</span>
                <h3 className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest">IDENTITAS PEKERJA & KASUS</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-600">PILIH PEKERJA</Label>
                  <Popover open={openWorkerSearch} onOpenChange={setOpenWorkerSearch}>
                    <PopoverTrigger
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "w-full justify-between h-11 bg-slate-50/50 border-slate-200 text-slate-700 font-medium"
                      )}
                    >
                      {formData.pekerja_name || "Cari nama atau NIK pekerja..."}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command>
                        <CommandInput 
                          placeholder="Ketik nama atau NIK..." 
                          onValueChange={(v) => fetchWorkers(v)}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {loadingWorkers ? (
                              <div className="py-6 flex flex-col items-center gap-2">
                                <RefreshCw className="h-4 w-4 animate-spin text-[#0ea5e9]" />
                                <span className="text-xs text-slate-400">Mencari data...</span>
                              </div>
                            ) : "Pekerja tidak ditemukan."}
                          </CommandEmpty>
                          <CommandGroup>
                            {workers.map((worker) => (
                              <CommandItem
                                key={worker.id}
                                value={worker.nama_lengkap}
                                onSelect={() => {
                                  setValue('pekerja_id', worker.id.toString());
                                  setValue('pekerja_name', worker.nama_lengkap);
                                  setValue('perusahaan', worker.perusahaan?.nama_perusahaan || 'Pekerja Informal');
                                  setOpenWorkerSearch(false);
                                }}
                                className="flex flex-col items-start py-3 px-4 cursor-pointer"
                              >
                                <div className="flex items-center w-full justify-between">
                                  <span className="font-bold text-slate-800">{worker.nama_lengkap}</span>
                                  {formData.pekerja_id === worker.id.toString() && <Check className="h-4 w-4 text-emerald-500" />}
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                                  NIK: {worker.nik} | {worker.perusahaan?.nama_perusahaan || 'Informal'}
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {errors.pekerja_id && <p className="text-red-500 text-[11px] font-medium">{errors.pekerja_id.message}</p>}
                </div>

                <div className="space-y-3 pt-2">
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
                        </button>
                      );
                    })}
                  </div>
                  {errors.jenis_kasus && <p className="text-red-500 text-[11px] font-medium">{errors.jenis_kasus.message}</p>}
                </div>

                <div className="space-y-3">
                  <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Perusahaan Terkait</Label>
                  <div className="h-11 flex items-center px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-sm font-medium italic">
                    {formData.perusahaan || 'Otomatis terisi saat pekerja dipilih'}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 02: Progres Awal */}
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-[#0ea5e9] text-white text-[10px] font-bold">02</span>
                <h3 className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest">PROGRES AWAL</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-600">Tahap Saat Ini</Label>
                  <Select value={formData.tahap} onValueChange={(v) => setValue('tahap', v)}>
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
                  <Label className="text-xs font-bold text-slate-600">Status Detail</Label>
                  <Select value={formData.status_detail} onValueChange={(v) => setValue('status_detail', v)}>
                    <SelectTrigger className="h-11 bg-slate-50/50 border-slate-200 focus:ring-[#0ea5e9]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dalam Proses">Dalam Proses</SelectItem>
                      <SelectItem value="Verifikasi Dokumen">Verifikasi Dokumen</SelectItem>
                      <SelectItem value="Mediasi 1">Mediasi 1</SelectItem>
                      <SelectItem value="Mediasi 2">Mediasi 2</SelectItem>
                      <SelectItem value="Sidang">Sidang</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Section 03: Dokumentasi Awal */}
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-[#0ea5e9] text-white text-[10px] font-bold">03</span>
                <h3 className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest">DOKUMENTASI AWAL</h3>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-600">Tanggal Pelaporan</Label>
                <Input type="date" className="h-11 bg-slate-50/50 border-slate-200 focus-visible:ring-[#0ea5e9]"
                  {...register('tanggal_pelaporan')} />
                {errors.tanggal_pelaporan && <p className="text-red-500 text-[11px] font-medium">{errors.tanggal_pelaporan.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-600">Catatan Awal Kasus</Label>
                <Textarea placeholder="Tuliskan ringkasan singkat kasus..." className="min-h-[100px] resize-none bg-slate-50/50 border-slate-200 focus-visible:ring-[#0ea5e9]"
                  {...register('catatan')} />
              </div>
            </div>

          </form>
        </div>

        <div className="border-t border-slate-100 p-6 bg-slate-50/50 flex flex-col gap-3">
          <Button type="submit" form="advokasi-form" disabled={isSubmitting} className="w-full h-12 text-sm font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white">
            {isSubmitting ? 'Menyimpan...' : 'Simpan Kasus'}
          </Button>
          <Button type="button" variant="outline" onClick={() => setSheetOpen(false)} className="w-full h-12 text-sm font-bold bg-white text-slate-600 border-slate-200 hover:bg-slate-100">
            Batal
          </Button>
        </div>
      </SheetContent>
      </Sheet >
    </div >
  );
}
