'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, X, Building2, Briefcase, Info, CheckCircle2, ShieldAlert, CheckCircle, AtSign,
  Users, UserCheck, UserMinus, AlertTriangle, Search, Eye, ArrowUpDown, ArrowUp, ArrowDown,
  Phone, Mail, UserCircle, Package, Loader2, ChevronDown, Trash2, Pencil, ArrowDownAZ, ArrowUpAZ
} from 'lucide-react';
import { toast } from 'sonner';
import { useRole } from '@/hooks/useRole';
import { Pagination } from '@/components/ui/Pagination';

// ============================================================================
// Types
// ============================================================================

interface Perusahaan {
  id: number;
  nama_perusahaan: string;
  sektor_industri: string;
  status_pendamping: 'Berkasus' | 'Dalam Pantauan';
  alamat?: string;
  nama_pic?: string;
  kontak_pic?: string;
  nama_pic_lion?: string;
  nara_hubung_lion?: string;
  pekerja_count: number;
}

interface PekerjaDetail {
  id: number;
  nik: string;
  nama_lengkap: string;
  status_kesehatan: string;
  riwayat_pekerja?: any[];
  status_advokasi?: any;
  detail_medis?: any[];
  user?: any;
}

interface PerusahaanDetail extends Perusahaan {
  aktif_count: number;
  mantan_count: number;
  advokasi_count: number;
}

type SortField = 'nama_lengkap' | 'jabatan' | 'status_kerja' | 'kesehatan';
type SortOrder = 'asc' | 'desc';

// ============================================================================
// Helpers
// ============================================================================

const iconsList = [Building2, Briefcase, ShieldAlert, CheckCircle2];
const colorsList = [
  'text-blue-500 bg-blue-50 border-blue-100',
  'text-amber-500 bg-amber-50 border-amber-100',
  'text-emerald-500 bg-emerald-50 border-emerald-100',
  'text-purple-500 bg-purple-50 border-purple-100'
];

const getRandomIcon = (id: number) => {
  const Icon = iconsList[id % iconsList.length];
  const colorClass = colorsList[id % colorsList.length];
  return (
    <div className={`p-2.5 rounded-xl border ${colorClass} shrink-0`}>
      <Icon className="h-5 w-5" />
    </div>
  );
};

const getBigIcon = (id: number) => {
  const Icon = iconsList[id % iconsList.length];
  const colorClass = colorsList[id % colorsList.length];
  return (
    <div className={`p-4 rounded-2xl border ${colorClass} shrink-0`}>
      <Icon className="h-8 w-8" />
    </div>
  );
};

/** Check if a pekerja is "active" — has at least one riwayat with no tgl_keluar */
const isPekerjaAktif = (p: PekerjaDetail) => {
  return p.riwayat_pekerja?.some((r: any) => !r.tgl_keluar) ?? false;
};

/** Get the current/latest job title */
const getJabatan = (p: PekerjaDetail) => {
  const current = p.riwayat_pekerja?.find((r: any) => !r.tgl_keluar);
  if (current) return current.bagian || current.jabatan || '-';
  const latest = p.riwayat_pekerja?.[0];
  return latest?.bagian || latest?.jabatan || '-';
};

/** Check if pekerja has open advocacy */
const hasOpenAdvokasi = (p: PekerjaDetail) => {
  const adv = p.status_advokasi;
  if (!adv) return false;
  const steps = ['riwayat_pajanan', 'persetujuan_dokter', 'perusahaan_lapor', 'penetapan_pak', 'kompensasi_bpjstk', 'rehabilitasi_bpjskes'];
  const hasAny = steps.some(s => adv[s] === true);
  const allDone = steps.every(s => adv[s] === true);
  return hasAny && !allDone;
};

/** Map health status to display label */
const getHealthLabel = (status: string) => {
  switch (status) {
    case 'sehat': return 'Sehat';
    case 'sehat_dengan_catatan': return 'Sehat dengan Catatan';
    case 'tidak_sehat': return 'Tidak Sehat';
    case 'sakit_ringan': return 'Sehat dengan Catatan'; // Legacy fallback
    case 'sakit_berat': return 'Tidak Sehat';           // Legacy fallback
    default: return status ? status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '-';
  }
};

/** Map health status to priority for sorting (lower = healthier) */
const getHealthPriority = (status: string) => {
  switch (status) {
    case 'sehat': return 0;
    case 'sehat_dengan_catatan': return 1;
    case 'tidak_sehat': return 2;
    case 'sakit_ringan': return 1;
    case 'sakit_berat': return 2;
    case 'dalam_perawatan': return 3;
    default: return 4;
  }
};

// ============================================================================
// Main Page
// ============================================================================

export default function PerusahaanPage() {
  const router = useRouter();
  const { isSuperAdmin, isStaffOrAbove, loading: roleLoading } = useRole();
  const [data, setData] = useState<Perusahaan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua Status');
  const [mainSortField, setMainSortField] = useState('nama_perusahaan');
  const [mainSortOrder, setMainSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage, setPerPage] = useState(15);

  // Sheet State (Add/Edit form)
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nama_perusahaan: '',
    sektor_industri: '',
    status_pendamping: 'Berkasus',
    alamat: '',
    nama_pic: '',
    kontak_pic: '',
    nama_pic_lion: '',
    nara_hubung_lion: '',
  });

  // Detail Sheet State
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<PerusahaanDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [workerSearch, setWorkerSearch] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('nama_lengkap');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Lazy-loaded workers state
  const [workers, setWorkers] = useState<PekerjaDetail[]>([]);
  const [workersLoading, setWorkersLoading] = useState(false);
  const [workersLoadingMore, setWorkersLoadingMore] = useState(false);
  const [workersPage, setWorkersPage] = useState(1);
  const [workersLastPage, setWorkersLastPage] = useState(1);
  const [workersTotal, setWorkersTotal] = useState(0);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentCompanyIdRef = useRef<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { 
        search, 
        page,
        sort_by: mainSortField,
        sort_dir: mainSortOrder
      };
      if (statusFilter && statusFilter !== 'Semua Status') {
        params.status = statusFilter;
      }
      const response = await api.get('/perusahaan', { params });
      if (response.data.status === 'success') {
        const pageData = response.data.data;
        setData(pageData.data);
        setCurrentPage(pageData.current_page);
        setLastPage(pageData.last_page);
        setTotal(pageData.total);
        setPerPage(pageData.per_page);
      }
    } catch (error: any) {
      if (error.response?.status !== 401) {
        toast.error('Gagal mengambil data perusahaan');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchData(1);
  }, [search, statusFilter, mainSortField, mainSortOrder]);

  const toggleMainSort = () => {
    setMainSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    setMainSortField('nama_perusahaan');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/perusahaan/${editId}`, formData);
        toast.success('Data Perusahaan berhasil diperbarui');
      } else {
        await api.post('/perusahaan', formData);
        toast.success('Perusahaan baru berhasil ditambahkan');
      }
      setSheetOpen(false);
      fetchData(currentPage);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan data');
    }
  };

  const openEdit = (p: Perusahaan) => {
    setEditId(p.id);
    setFormData({
      nama_perusahaan: p.nama_perusahaan,
      sektor_industri: p.sektor_industri || '',
      status_pendamping: 
        (p.status_pendamping as any) === 'aktif' ? 'Berkasus' :
        (p.status_pendamping as any) === 'pending' ? 'Dalam Pantauan' :
        (p.status_pendamping as any) === 'tidak_aktif' ? 'Dalam Pantauan' :
        (p.status_pendamping as any) === 'Selesai' ? 'Dalam Pantauan' :
        p.status_pendamping,
      alamat: p.alamat || '',
      nama_pic: p.nama_pic || '',
      kontak_pic: p.kontak_pic || '',
      nama_pic_lion: p.nama_pic_lion || '',
      nara_hubung_lion: p.nara_hubung_lion || '',
    });
    setSheetOpen(true);
  };

  const openCreate = () => {
    setEditId(null);
    setFormData({
      nama_perusahaan: '',
      sektor_industri: '',
      status_pendamping: 'Berkasus',
      alamat: '',
      nama_pic: '',
      kontak_pic: '',
      nama_pic_lion: '',
      nara_hubung_lion: '',
    });
    setSheetOpen(true);
  };

  // ---- Detail Sheet Logic ----
  const fetchWorkers = useCallback(async (companyId: number, page: number, searchQuery: string, letter: string = 'all', append: boolean = false) => {
    if (append) {
      setWorkersLoadingMore(true);
    } else {
      setWorkersLoading(true);
    }
    try {
      const params: any = { perusahaan_id: companyId, page };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (letter !== 'all') params.letter = letter;
      
      const res = await api.get('/pekerja', { params });
      if (res.data.status === 'success') {
        const pageData = res.data.data;
        if (append) {
          setWorkers(prev => [...prev, ...pageData.data]);
        } else {
          setWorkers(pageData.data);
        }
        setWorkersPage(pageData.current_page);
        setWorkersLastPage(pageData.last_page);
        setWorkersTotal(pageData.total);
      }
    } catch (error: any) {
      if (error.response?.status !== 401) {
        toast.error('Gagal mengambil data pekerja');
      }
    } finally {
      setWorkersLoading(false);
      setWorkersLoadingMore(false);
    }
  }, []);

  const openDetail = async (p: Perusahaan) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setWorkerSearch('');
    setSelectedLetter('all');
    setSortField('nama_lengkap');
    setSortOrder('asc');
    setWorkers([]);
    setWorkersPage(1);
    currentCompanyIdRef.current = p.id;
    try {
      const res = await api.get(`/perusahaan/${p.id}`);
      if (res.data.status === 'success') {
        setDetailData(res.data.data);
      }
      // Fetch first page of workers in parallel-ish
      await fetchWorkers(p.id, 1, '', 'all');
    } catch (error) {
      toast.error('Gagal mengambil detail perusahaan');
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const loadMoreWorkers = () => {
    if (currentCompanyIdRef.current && workersPage < workersLastPage) {
      fetchWorkers(currentCompanyIdRef.current, workersPage + 1, workerSearch, selectedLetter, true);
    }
  };

  // Debounced search for workers
  const handleWorkerSearchChange = (value: string) => {
    setWorkerSearch(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      if (currentCompanyIdRef.current) {
        setWorkers([]);
        setWorkersPage(1);
        fetchWorkers(currentCompanyIdRef.current, 1, value, selectedLetter);
      }
    }, 400);
  };

  const handleLetterSelect = (letter: string) => {
    setSelectedLetter(letter);
    if (currentCompanyIdRef.current) {
      setWorkers([]);
      setWorkersPage(1);
      fetchWorkers(currentCompanyIdRef.current, 1, workerSearch, letter, false);
    }
  };

  // Computed metrics from backend
  const metrics = useMemo(() => {
    if (!detailData) return { total: 0, aktif: 0, mantan: 0, advokasi: 0 };
    return {
      total: detailData.pekerja_count,
      aktif: detailData.aktif_count || 0,
      mantan: detailData.mantan_count || 0,
      advokasi: detailData.advokasi_count || 0,
    };
  }, [detailData]);

  // Sort loaded workers client-side
  const sortedWorkers = useMemo(() => {
    let sorted = [...workers];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'nama_lengkap':
          cmp = a.nama_lengkap.localeCompare(b.nama_lengkap);
          break;
        case 'jabatan':
          cmp = getJabatan(a).localeCompare(getJabatan(b));
          break;
        case 'status_kerja':
          cmp = (isPekerjaAktif(a) ? 0 : 1) - (isPekerjaAktif(b) ? 0 : 1);
          break;
        case 'kesehatan':
          cmp = getHealthPriority(a.status_kesehatan) - getHealthPriority(b.status_kesehatan);
          break;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [workers, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 text-slate-300" />;
    return sortOrder === 'asc'
      ? <ArrowUp className="h-3 w-3 ml-1 text-[#0ea5e9]" />
      : <ArrowDown className="h-3 w-3 ml-1 text-[#0ea5e9]" />;
  };

  const getStatusDisplay = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'berkasus' || s === 'aktif') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>
          Berkasus
        </span>
      );
    }
    if (s === 'dalam pantauan' || s === 'pending') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
          Dalam Pantauan
        </span>
      );
    }
    // Selesai / tidak_aktif / default fallback
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
        Dalam Pantauan
      </span>
    );
  };

  // ---- Health indicator component ----
  const HealthIndicator = ({ status }: { status: string }) => {
    const config: Record<string, { dot: string; bg: string; text: string; label: string }> = {
      sehat: { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Sehat' },
      sehat_dengan_catatan: { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', label: 'Sehat dengan Catatan' },
      tidak_sehat: { dot: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-700', label: 'Tidak Sehat' },
      sakit_ringan: { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', label: 'Sehat dengan Catatan' },
      sakit_berat: { dot: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-700', label: 'Tidak Sehat' },
    };
    const c = config[status] || { 
      dot: 'bg-slate-400', 
      bg: 'bg-slate-50', 
      text: 'text-slate-600', 
      label: status ? status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '-' 
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${c.bg} ${c.text}`}>
        <span className={`w-2 h-2 rounded-full ${c.dot} animate-pulse`} />
        {c.label}
      </span>
    );
  };

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://127.0.0.1:8000';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#0f172a]">Daftar Perusahaan</h1>
          <p className="text-[#64748b] mt-1.5 text-[15px]">
            Kelola informasi dan status kerjasama perusahaan mitra Anda secara terpusat.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full sm:w-auto">

          {isStaffOrAbove && (
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger
                onClick={openCreate}
                className={cn(
                  buttonVariants({ variant: 'default' }),
                  "bg-[#0284c7] hover:bg-[#0369a1] text-white font-semibold h-11 px-6 rounded-lg shadow-sm w-full sm:w-auto"
                )}
              >
                <Plus className="mr-2 h-5 w-5" />
                Tambah Perusahaan
              </SheetTrigger>
              <SheetContent className="sm:max-w-xl p-0 overflow-hidden flex flex-col bg-white border-l shadow-2xl">
                <SheetHeader className="px-8 py-6 border-b border-slate-100 bg-white z-10">
                  <div className="flex justify-between items-start">
                    <div>
                      <SheetTitle className="text-xl font-bold text-slate-900">{editId ? 'Edit Data Perusahaan' : 'Tambah Perusahaan Baru'}</SheetTitle>
                      <SheetDescription className="mt-1 text-slate-500">
                        {editId ? 'Update company profile and compliance status' : 'Masukkan profil perusahaan mitra baru ke dalam sistem advokasi.'}
                      </SheetDescription>
                    </div>
                  </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
                  <form id="perusahaan-form" onSubmit={handleSubmit} className="space-y-8 pb-4">

                    {/* Section 1 */}
                    <div className="space-y-5">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-[#0ea5e9] rounded-full"></div>
                        <h3 className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest">DATA UTAMA</h3>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-600">NAMA PERUSAHAAN</Label>
                        <Input
                          placeholder="Contoh: PT. Maju Bersama"
                          className="h-11 bg-slate-50/50 border-slate-200 focus-visible:ring-[#0ea5e9]"
                          value={formData.nama_perusahaan}
                          onChange={(e) => setFormData({ ...formData, nama_perusahaan: e.target.value })}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-600">SEKTOR INDUSTRI</Label>
                          <Input
                            placeholder="Contoh: Teknologi"
                            className="h-11 bg-slate-50/50 border-slate-200 focus-visible:ring-[#0ea5e9]"
                            value={formData.sektor_industri}
                            onChange={(e) => setFormData({ ...formData, sektor_industri: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-600">STATUS PERUSAHAAN</Label>
                          <Select
                            value={formData.status_pendamping}
                            onValueChange={(v: any) => setFormData({ ...formData, status_pendamping: v })}
                          >
                            <SelectTrigger className="h-11 bg-slate-50/50 border-slate-200 focus:ring-[#0ea5e9]">
                              <SelectValue placeholder="Pilih status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Berkasus">Berkasus</SelectItem>
                              <SelectItem value="Dalam Pantauan">Dalam Pantauan</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Section 2 */}
                    <div className="space-y-5">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-[#0ea5e9] rounded-full"></div>
                        <h3 className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest">KONTAK ADMINISTRATIF</h3>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-600">ALAMAT PERUSAHAAN</Label>
                        <Textarea
                          placeholder="Masukkan alamat lengkap kantor pusat..."
                          className="min-h-[100px] resize-none bg-slate-50/50 border-slate-200 focus-visible:ring-[#0ea5e9]"
                          value={formData.alamat}
                          onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-600">NAMA PIC Serikat di Perusahaan</Label>
                        <Input
                          placeholder="Nama Lengkap Penanggung Jawab"
                          className="h-11 bg-slate-50/50 border-slate-200 focus-visible:ring-[#0ea5e9]"
                          value={formData.nama_pic}
                          onChange={(e) => setFormData({ ...formData, nama_pic: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-600">NO.TELEPON/EMAIL PIC Serikat di Perusahaan</Label>
                        <div className="relative">
                          <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            placeholder="08xx-xxxx / email@perusahaan.com"
                            className="h-11 pl-10 bg-slate-50/50 border-slate-200 focus-visible:ring-[#0ea5e9]"
                            value={formData.kontak_pic}
                            onChange={(e) => setFormData({ ...formData, kontak_pic: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-start gap-3 mt-4">
                        <CheckCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-xs font-medium text-blue-700 leading-relaxed">
                          Data perusahaan akan diverifikasi secara manual oleh tim admin Lion Indonesia.
                        </p>
                      </div>
                    </div>

                  </form>
                </div>

                <div className="border-t border-slate-100 p-6 bg-slate-50/50 flex flex-col gap-3">
                  <Button type="submit" form="perusahaan-form" className="w-full h-12 text-sm font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white">
                    {editId ? 'Simpan Perubahan' : 'Simpan Perusahaan'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setSheetOpen(false)} className="w-full h-12 text-sm font-bold bg-white text-slate-600 border-slate-200 hover:bg-slate-100">
                    Batal
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>

      {/* Standardized Minimalist Filter Row */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari perusahaan berdasarkan nama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/30 focus:border-[#0ea5e9] transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v || 'Semua Status')}>
            <SelectTrigger className="flex-1 md:w-48 h-11 border-slate-200 rounded-xl bg-slate-50 text-sm font-semibold text-slate-600 focus:ring-[#0ea5e9]/30">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Semua Status">Semua Status</SelectItem>
              <SelectItem value="Berkasus">Berkasus</SelectItem>
              <SelectItem value="Dalam Pantauan">Dalam Pantauan</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMainSort}
            className={cn(
              "h-11 w-11 rounded-xl border border-slate-200 transition-all active:scale-95 shrink-0",
              mainSortField === 'nama_perusahaan' ? "bg-slate-800 text-white hover:bg-slate-900 border-transparent shadow-sm" : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            )}
            title="Urutkan A-Z"
          >
            {mainSortOrder === 'desc' ? (
              <ArrowUpAZ className="h-5 w-5" />
            ) : (
              <ArrowDownAZ className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden">

        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-slate-100">
              <TableHead className="py-4 pl-6 pr-1 font-bold text-[11px] tracking-widest text-[#94a3b8] w-12">NO.</TableHead>
              <TableHead className="py-4 px-4 font-bold text-[11px] tracking-widest text-[#94a3b8] w-[28%]">NAMA PERUSAHAAN</TableHead>
              <TableHead className="py-4 px-4 font-bold text-[11px] tracking-widest text-[#94a3b8] w-[22%]">SEKTOR INDUSTRI</TableHead>
              <TableHead className="py-4 px-4 font-bold text-[11px] tracking-widest text-[#94a3b8] w-[15%]">PEKERJA</TableHead>
              <TableHead className="py-4 px-4 font-bold text-[11px] tracking-widest text-[#94a3b8] w-[15%]">STATUS</TableHead>
              <TableHead className="py-4 px-6 font-bold text-[11px] tracking-widest text-[#94a3b8] text-right w-24">AKSI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16 text-slate-400 font-medium">
                  Memuat data perusahaan...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                  <div className="flex flex-col items-center">
                    <Building2 className="h-10 w-10 text-slate-200 mb-3" />
                    <p className="font-semibold text-slate-600">Belum ada data perusahaan.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((p, index) => {
                const rowNumber = (currentPage - 1) * perPage + index + 1;

                return (
                  <TableRow 
                    key={p.id} 
                    className="hover:bg-slate-50/50 transition-colors group border-b border-slate-50 cursor-pointer"
                    onClick={() => openDetail(p)}
                  >
                    <TableCell className="py-4 pl-6 pr-1">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-500 text-[11px] font-bold">
                        {rowNumber}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <div className="flex items-center gap-3 w-full text-left group/company transition-transform hover:translate-x-1">
                        <div className="shrink-0 scale-75 origin-left transition-all group-hover/company:scale-90 group-hover/company:drop-shadow-md">
                          {getRandomIcon(p.id)}
                        </div>
                        <span className="font-bold text-[#1e293b] group-hover/company:text-[#0284c7] transition-all text-[14px] truncate">
                          {p.nama_perusahaan}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-4 truncate max-w-0">
                      <span className="font-medium text-[#475569] text-[13px] block truncate">{p.sektor_industri || '-'}</span>
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <span className="text-[#0284c7] font-bold text-[13px]">{p.pekerja_count} Pekerja</span>
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <div className="scale-95 origin-left">
                        {getStatusDisplay(p.status_pendamping)}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      {isStaffOrAbove && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => { e.stopPropagation(); openEdit(p); }} 
                          className="h-8 w-8 text-[#0ea5e9] hover:text-[#0284c7] hover:bg-sky-50 rounded-lg transition-all hover:scale-110 active:scale-95 group/edit"
                        >
                          <Pencil className="h-4 w-4 transition-transform group-hover/edit:rotate-12" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <Pagination 
          currentPage={currentPage}
          total={total}
          perPage={perPage}
          lastPage={lastPage}
          onPageChange={(p) => { setCurrentPage(p); fetchData(p); }}
          label="perusahaan"
        />
      </div>

      {/* ================================================================== */}
      {/* DETAIL SHEET MODAL                                                 */}
      {/* ================================================================== */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent
          className="sm:max-w-5xl w-full p-0 overflow-hidden flex flex-col bg-[#f8fafc] border-l shadow-2xl"
          style={{ maxWidth: '64rem' }}
        >
          {detailLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 border-4 border-[#0ea5e9]/30 border-t-[#0ea5e9] rounded-full animate-spin mx-auto" />
                <p className="text-sm font-semibold text-slate-500">Memuat data perusahaan...</p>
              </div>
            </div>
          ) : detailData ? (
            <>
              {/* ---- HEADER SECTION ---- */}
              <div className="bg-white border-b border-slate-100 px-8 py-6">
                {/* Top row: Icon + Name + Close hint */}
                <div className="flex items-start gap-5 mb-6">
                  {getBigIcon(detailData.id)}
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-2xl font-extrabold text-[#0f172a] tracking-tight truncate">
                      {detailData.nama_perusahaan}
                    </SheetTitle>
                    <SheetDescription className="sr-only">Detail perusahaan {detailData.nama_perusahaan}</SheetDescription>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {detailData.sektor_industri && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                          <Package className="h-3 w-3" />
                          {detailData.sektor_industri}
                        </span>
                      )}
                      {getStatusDisplay(detailData.status_pendamping)}
                    </div>

                    {/* PIC Info */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-[11px] text-slate-500 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      {(detailData.nama_pic || detailData.kontak_pic) && (
                        <div className="space-y-1.5 min-w-[180px]">
                          <p className="font-extrabold text-[9px] uppercase tracking-wider text-slate-400 mb-2">PIC SERIKAT DI PERUSAHAAN</p>
                          {detailData.nama_pic && (
                            <span className="flex items-center gap-1.5 font-medium">
                              <UserCircle className="h-3 w-3 text-slate-400" />
                              <span className="text-slate-700 font-bold">{detailData.nama_pic}</span>
                            </span>
                          )}
                          {detailData.kontak_pic && (
                            <span className="flex items-center gap-1.5 font-medium">
                              <AtSign className="h-3 w-3 text-slate-400" />
                              <span className="text-slate-700 font-bold">{detailData.kontak_pic}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {isSuperAdmin && (
                    <div className="flex items-center gap-3 pr-8">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-xl font-bold border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 hover:border-rose-300 px-4 transition-all"
                        onClick={() => setIsDeleteDialogOpen(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Hapus (S.Admin)
                      </Button>
                    </div>
                  )}
                </div>
              </div>

                {/* Metrics Cards Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Total Pekerja */}
                  <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-100 rounded-xl p-4 relative overflow-hidden group/card hover:border-slate-200 transition-colors">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-slate-100/50 rounded-bl-[40px] -mr-2 -mt-2" />
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-slate-400" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Pekerja</p>
                      </div>
                      <p className="text-2xl font-extrabold text-[#1e293b]">{metrics.total}</p>
                    </div>
                  </div>

                  {/* Pekerja Aktif */}
                  <div className="bg-gradient-to-br from-emerald-50/50 to-white border border-emerald-100 rounded-xl p-4 relative overflow-hidden group/card hover:border-emerald-200 transition-colors">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50/80 rounded-bl-[40px] -mr-2 -mt-2" />
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-2">
                        <UserCheck className="h-4 w-4 text-emerald-500" />
                        <p className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-widest">Pekerja Aktif</p>
                      </div>
                      <p className="text-2xl font-extrabold text-emerald-600">{metrics.aktif}</p>
                    </div>
                  </div>

                  {/* Mantan Pekerja */}
                  <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-100 rounded-xl p-4 relative overflow-hidden group/card hover:border-slate-200 transition-colors">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-slate-100/50 rounded-bl-[40px] -mr-2 -mt-2" />
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-2">
                        <UserMinus className="h-4 w-4 text-slate-400" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mantan Pekerja</p>
                      </div>
                      <p className="text-2xl font-extrabold text-slate-600">{metrics.mantan}</p>
                    </div>
                  </div>

                  {/* Kasus Advokasi */}
                  <div className={`bg-gradient-to-br ${metrics.advokasi > 0 ? 'from-orange-50/50 to-white border-orange-100 hover:border-orange-200' : 'from-slate-50 to-white border-slate-100 hover:border-slate-200'} border rounded-xl p-4 relative overflow-hidden group/card transition-colors`}>
                    <div className={`absolute top-0 right-0 w-16 h-16 ${metrics.advokasi > 0 ? 'bg-orange-50/80' : 'bg-slate-100/50'} rounded-bl-[40px] -mr-2 -mt-2`} />
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className={`h-4 w-4 ${metrics.advokasi > 0 ? 'text-orange-500' : 'text-slate-400'}`} />
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${metrics.advokasi > 0 ? 'text-orange-500/70' : 'text-slate-400'}`}>Advokasi Terbuka</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className={`text-2xl font-extrabold ${metrics.advokasi > 0 ? 'text-orange-600' : 'text-slate-600'}`}>{metrics.advokasi}</p>
                        {metrics.advokasi > 0 && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[9px] font-extrabold tracking-wide rounded-full animate-pulse">
                            PROSES
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ---- MAIN CONTENT: WORKER TABLE ---- */}
                <div className="flex-1 overflow-hidden flex flex-col">
                {/* Search Bar & Filter - Minimalist Layout */}
                <div className="px-8 py-4 bg-white border-b border-slate-100 flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari pekerja berdasarkan nama atau No. Kartu..."
                      value={workerSearch}
                      onChange={(e) => handleWorkerSearchChange(e.target.value)}
                      className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/30 focus:border-[#0ea5e9] transition-all"
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleSort('nama_lengkap')}
                    className={cn(
                      "h-10 w-10 rounded-lg border border-slate-200 transition-all active:scale-95",
                      sortField === 'nama_lengkap' ? "bg-slate-800 text-white hover:bg-slate-900 border-transparent shadow-sm" : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    )}
                    title="Urutkan A-Z"
                  >
                    {sortField === 'nama_lengkap' && sortOrder === 'desc' ? (
                      <ArrowUpAZ className="h-5 w-5" />
                    ) : (
                      <ArrowDownAZ className="h-5 w-5" />
                    )}
                  </Button>
                </div>


                {/* Table Scroll Area */}
                <div className="flex-1 overflow-y-auto px-8 py-2 custom-scrollbar">
                  {workersLoading ? (
                    /* ---- LOADING SKELETON ---- */
                    <div className="space-y-3 py-4">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
                          <div className="h-9 w-9 rounded-full bg-slate-200" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 bg-slate-200 rounded w-1/3" />
                            <div className="h-2.5 bg-slate-100 rounded w-1/4" />
                          </div>
                          <div className="h-6 w-14 bg-slate-100 rounded-full" />
                          <div className="h-6 w-14 bg-slate-100 rounded-full" />
                        </div>
                      ))}
                    </div>
                  ) : metrics.total === 0 && !workerSearch.trim() ? (
                    /* ---- EMPTY STATE ---- */
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-5">
                        <Users className="h-10 w-10 text-slate-300" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-700 mb-2">Belum Ada Data Pekerja</h3>
                      <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
                        Perusahaan <span className="font-semibold text-slate-500">{detailData.nama_perusahaan}</span> belum memiliki pekerja terdaftar dalam sistem. Tambahkan pekerja pertama untuk mulai memantau status kesehatan dan advokasi.
                      </p>
                      <Button
                        onClick={() => { setDetailOpen(false); router.push('/pekerja'); }}
                        className="bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold px-6 h-11 shadow-sm"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Pekerja
                      </Button>
                    </div>
                  ) : (
                    /* ---- TABLE AREA ---- */
                    <>
                      {sortedWorkers.length === 0 && workerSearch.trim() ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <Search className="h-10 w-10 text-slate-200 mb-4" />
                          <h3 className="text-base font-bold text-slate-600 mb-1">Tidak Ditemukan</h3>
                          <p className="text-sm text-slate-400">Tidak ada pekerja yang cocok dengan pencarian "{workerSearch}"</p>
                        </div>
                      ) : sortedWorkers.length === 0 && metrics.total > 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Users className="h-8 w-8 text-slate-200" />
                          </div>
                          <h3 className="text-base font-bold text-slate-600 mb-1">Data Pekerja Tidak Muncul?</h3>
                          <p className="text-sm text-slate-400 mb-4">Gagal memuat daftar pekerja atau data sedang diperbarui.</p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => fetchWorkers(currentCompanyIdRef.current!, 1, workerSearch, selectedLetter)}
                            className="rounded-lg font-bold"
                          >
                            Muat Ulang Daftar
                          </Button>
                        </div>
                      ) : (

                    <>
                      <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-[#f8fafc] z-10">
                          <tr className="border-b border-slate-200">
                            <th className="pb-3 pt-2 px-2">
                              <button onClick={() => toggleSort('nama_lengkap')} className="flex items-center text-[10px] font-extrabold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">
                                Nama Pekerja <SortIcon field="nama_lengkap" />
                              </button>
                            </th>
                            <th className="pb-3 pt-2 px-2">
                              <button onClick={() => toggleSort('jabatan')} className="flex items-center text-[10px] font-extrabold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">
                                Jabatan <SortIcon field="jabatan" />
                              </button>
                            </th>
                            <th className="pb-3 pt-2 px-2">
                              <button onClick={() => toggleSort('status_kerja')} className="flex items-center text-[10px] font-extrabold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">
                                Status Kerja <SortIcon field="status_kerja" />
                              </button>
                            </th>
                            <th className="pb-3 pt-2 px-2">
                              <button onClick={() => toggleSort('kesehatan')} className="flex items-center text-[10px] font-extrabold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">
                                Kesehatan <SortIcon field="kesehatan" />
                              </button>
                            </th>
                            <th className="pb-3 pt-2 px-2 text-right">
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Aksi</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {sortedWorkers.map((w) => {
                            const aktif = isPekerjaAktif(w);
                            const jabatan = getJabatan(w);

                            return (
                              <tr
                                key={w.id}
                                className="hover:bg-white transition-colors group/row"
                              >
                                {/* Avatar + Name + NIK */}
                                <td className="py-3.5 px-2">
                                  <div className="flex items-center gap-3">
                                    <div className="min-w-0">
                                      <p className="text-[13px] font-bold text-slate-800 truncate">{w.nama_lengkap}</p>
                                      <p className="text-[11px] text-slate-400 font-medium">No. Kartu: {w.nik}</p>
                                    </div>
                                  </div>
                                </td>

                                {/* Jabatan */}
                                <td className="py-3.5 px-2">
                                  <span className="text-[13px] font-medium text-slate-600">{jabatan}</span>
                                </td>

                                {/* Status Kerja */}
                                <td className="py-3.5 px-2">
                                  {aktif ? (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                                      Aktif
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />
                                      Mantan
                                    </span>
                                  )}
                                </td>

                                {/* Kesehatan */}
                                <td className="py-3.5 px-2">
                                  <HealthIndicator status={w.status_kesehatan} />
                                </td>

                                {/* Aksi */}
                                <td className="py-3.5 px-2 text-right">
                                  <button
                                    onClick={() => { setDetailOpen(false); router.push(`/pekerja/${w.id}`); }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-[#0ea5e9] hover:bg-blue-50 hover:text-[#0284c7] transition-all border border-transparent hover:border-blue-100"
                                    title="Lihat Profil Pekerja"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Lihat Profil</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {/* Load More Button */}
                      {workersPage < workersLastPage && (
                        <div className="flex justify-center py-5">
                          <button
                            onClick={loadMoreWorkers}
                            disabled={workersLoadingMore}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-[#0284c7] bg-blue-50 hover:bg-blue-100 border border-blue-100 hover:border-blue-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {workersLoadingMore ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Memuat...
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4" />
                                Muat Lebih Banyak ({workers.length} dari {workersTotal})
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

                {/* Footer summary */}
                {metrics.total > 0 && (
                  <div className="border-t border-slate-100 bg-white px-8 py-3 flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span>Menampilkan {workers.length} dari {workersTotal} pekerja</span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {metrics.aktif} Aktif
                      <span className="mx-1">&middot;</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> {metrics.mantan} Mantan
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
          <AlertDialogHeader>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 mb-2">
              <Trash2 className="h-7 w-7 text-rose-500" />
            </div>
            <AlertDialogTitle className="text-xl font-black text-slate-900 text-center">Hapus Data Perusahaan?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 text-center text-sm px-2">
              Tindakan ini <span className="text-rose-600 font-bold">tidak dapat dibatalkan</span>. Semua data perusahaan dan riwayat pekerja terkait akan dihapus permanen dari sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-3 mt-4">
            <AlertDialogCancel className="rounded-xl border-slate-200 text-slate-500 font-bold hover:bg-slate-50 px-6">
              Batalkan
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                if (!detailData) return;
                try {
                  await api.delete(`/perusahaan/${detailData.id}`);
                  toast.success('Perusahaan dihapus secara permanen');
                  setIsDeleteDialogOpen(false);
                  setDetailOpen(false);
                  fetchData();
                } catch (e: any) {
                  toast.error(e.response?.data?.message || 'Gagal menghapus perusahaan');
                }
              }}
              className="rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-lg shadow-rose-200 border-none px-6"
            >
              Ya, Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
