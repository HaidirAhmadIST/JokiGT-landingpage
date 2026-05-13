'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Plus, ExternalLink, ChevronLeft, ChevronRight, AlertTriangle, Save, Users, Trash2, Search, ArrowDownAZ, ArrowUpAZ } from 'lucide-react';
import { toast } from 'sonner';
import { useRole } from '@/hooks/useRole';
import { cn } from '@/lib/utils';
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
import { Pagination } from '@/components/ui/Pagination';

export default function PekerjaPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const { isSuperAdmin, isStaffOrAbove, loading: roleLoading } = useRole();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [sortField, setSortField] = useState('nama_lengkap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Bulk Edit Sheet State
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkEdits, setBulkEdits] = useState<Record<number, { jenis_kelamin: string, tanggal_lahir: string }>>({});

  // Delete Dialog State
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/pekerja', { 
        params: { 
          search,
          page: currentPage,
          per_page: perPage,
          sort_by: sortField,
          sort_dir: sortOrder
        } 
      });
      if (response.data.status === 'success') {
        const result = response.data.data;
        setData(result.data || []);
        setTotal(result.total || 0);
        setLastPage(result.last_page || 1);
      }
    } catch (error: any) {
      if (error.response?.status !== 401) {
        toast.error('Gagal mengambil data pekerja. Cek koneksi server.');
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, currentPage, sortField, sortOrder]);

  const toggleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    setSortField('nama_lengkap');
  };

  // Find workers with incomplete data
  const incompleteWorkers = useMemo(() => {
    return data.filter(p => !p.jenis_kelamin || !p.tanggal_lahir);
  }, [data]);

  // Initialize bulk edit form when sheet opens
  useEffect(() => {
    if (bulkOpen && incompleteWorkers.length > 0) {
      const initial: Record<number, { jenis_kelamin: string; tanggal_lahir: string }> = {};
      incompleteWorkers.forEach(p => {
        initial[p.id] = {
          jenis_kelamin: p.jenis_kelamin || '',
          tanggal_lahir: p.tanggal_lahir || '',
        };
      });
      setBulkEdits(initial);
    }
  }, [bulkOpen, incompleteWorkers]);

  const handleBulkSave = async () => {
    const updates = Object.entries(bulkEdits)
      .filter(([_, v]) => v.jenis_kelamin || v.tanggal_lahir)
      .map(([id, v]) => ({
        id: Number(id),
        ...(v.jenis_kelamin ? { jenis_kelamin: v.jenis_kelamin } : {}),
        ...(v.tanggal_lahir ? { tanggal_lahir: v.tanggal_lahir } : {}),
      }));

    if (updates.length === 0) {
      toast.error('Tidak ada data yang diubah.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('/pekerja-bulk-update', { updates });
      toast.success(res.data.message || 'Data berhasil diperbarui!');
      setBulkOpen(false);
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal menyimpan data.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/pekerja/${deleteId}`);
      toast.success('Pekerja dihapus secara permanen');
      setIsDeleteDialogOpen(false);
      setDeleteId(null);
      fetchData();
    } catch (e) {
      toast.error('Gagal menghapus');
    }
  };

  const confirmDelete = (id: number) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col mb-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Daftar Pekerja</h1>
          <p className="text-slate-500 mt-2 text-sm max-w-2xl leading-relaxed">
            Kelola dan pantau data rekam jejak kesehatan pekerja di sistem ADVOKASI PAK untuk pencegahan risiko kesehatan kerja.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {isStaffOrAbove && incompleteWorkers.length > 0 && (
            <Button
              onClick={() => setBulkOpen(true)}
              variant="outline"
              className="rounded-xl px-5 h-11 text-sm border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 font-bold"
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              {incompleteWorkers.length} Data Belum Lengkap
            </Button>
          )}
          <Button onClick={() => router.push('/pendaftaran')} className="bg-[#0ea5e9] hover:bg-[#0284c7] rounded-xl px-5 h-11 text-sm shadow-sm transition-all" size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Tambah Pekerja
          </Button>
        </div>
      </div>

      {/* Minimalist Search & Sort Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari pekerja berdasarkan nama atau NIK..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/30 focus:border-[#0ea5e9] transition-all"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSort}
          className={cn(
            "h-11 w-11 rounded-xl border border-slate-200 transition-all active:scale-95",
            sortField === 'nama_lengkap' ? "bg-slate-800 text-white hover:bg-slate-900 border-transparent shadow-sm" : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          )}
          title="Urutkan A-Z"
        >
          {sortOrder === 'desc' ? (
            <ArrowUpAZ className="h-5 w-5" />
          ) : (
            <ArrowDownAZ className="h-5 w-5" />
          )}
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 sm:p-6 pb-2 w-full">
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow className="border-b border-slate-100 hover:bg-transparent">
                <TableHead className="text-[11px] font-bold text-slate-400 tracking-widest uppercase bg-transparent w-12 pl-4 pr-1">NO.</TableHead>
                <TableHead className="text-[11px] font-bold text-slate-400 tracking-widest uppercase bg-transparent w-[22%]">NAMA PEKERJA</TableHead>
                <TableHead className="text-[11px] font-bold text-slate-400 tracking-widest uppercase bg-transparent w-[14%]">NIK</TableHead>
                <TableHead className="text-[11px] font-bold text-slate-400 tracking-widest uppercase bg-transparent w-[18%]">PERUSAHAAN</TableHead>
                <TableHead className="text-[11px] font-bold text-slate-400 tracking-widest uppercase bg-transparent w-[15%]">LOKASI / UNIT</TableHead>
                <TableHead className="text-[11px] font-bold text-slate-400 tracking-widest uppercase bg-transparent w-[12%]">STATUS</TableHead>
                <TableHead className="text-[11px] font-bold text-slate-400 tracking-widest uppercase bg-transparent text-right w-12 pr-4">AKSI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-32 text-slate-500 font-medium">Memuat data pekerja...</TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-32 text-slate-500 font-medium">Data tidak ditemukan.</TableCell>
                </TableRow>
              ) : (
                data.map((p, index) => {
                const rowNumber = (currentPage - 1) * perPage + index + 1;
                return (
                  <TableRow 
                    key={p.id} 
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer group"
                    onClick={() => router.push(`/pekerja/${p.id}`)}
                  >
                    <TableCell className="pl-4 pr-1 py-4 w-12">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-500 text-[11px] font-bold">
                        {rowNumber}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 px-3">
                      <div className="flex items-center gap-3 w-full text-left group/worker transition-transform hover:translate-x-1">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0 transition-all group-hover/worker:border-[#0ea5e9] group-hover/worker:ring-2 group-hover/worker:ring-blue-100 group-hover/worker:scale-110">
                           <img 
                             src={p.pas_foto ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://127.0.0.1:8000'}/storage/profil/${p.pas_foto}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.nama_lengkap}`} 
                             alt="avatar" 
                             className="w-full h-full object-cover object-top" 
                           />
                        </div>
                        <div className="flex flex-col min-w-0 transition-all group-hover/worker:translate-x-1">
                          <span className="font-bold text-slate-900 text-[15px] truncate group-hover/worker:text-[#0284c7] transition-colors leading-tight">{p.nama_lengkap}</span>
                          <span className="text-[11px] text-slate-500 mt-1 truncate font-medium">
                            {p.jenis_kelamin === 'L' ? 'Laki-laki' : p.jenis_kelamin === 'P' ? 'Perempuan' : '-'} • {p.tanggal_lahir ? (new Date().getFullYear() - new Date(p.tanggal_lahir).getFullYear()) + ' Tahun' : '-'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-3 text-[13px] font-medium text-slate-500 tabular-nums truncate">{p.nik}</TableCell>
                    <TableCell className="py-4 px-3 text-[13px] text-slate-600 font-semibold truncate max-w-0">
                      {(() => {
                        if (p.perusahaan?.nama_perusahaan) return p.perusahaan.nama_perusahaan;
                        
                        const job = p.current_job;
                        if (!job) return <span className="text-slate-300 italic">Tidak ada data</span>;

                        if (job.status_pekerjaan === 'Outsourcing') {
                          return (
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Agency</span>
                              <span className="truncate">{job.nama_agen_penyalur || 'Pihak Ketiga'}</span>
                            </div>
                          );
                        }

                        if (job.status_pekerjaan === 'Borongan' || job.status_pekerjaan === 'Harian Lepas') {
                          return (
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Pekerja Lapangan</span>
                              <span className="truncate">{job.status_pekerjaan}</span>
                            </div>
                          );
                        }

                        return <span className="text-slate-400">Pekerja Mandiri</span>;
                      })()}
                    </TableCell>
                    <TableCell className="py-4 px-3 text-[13px] text-slate-500 font-medium truncate max-w-0">
                      {(() => {
                        const job = p.current_job;
                        if (!job) return '-';

                        if (job.status_pekerjaan === 'Borongan' || job.status_pekerjaan === 'Harian Lepas') {
                          let info: any = {};
                          if (job.informal_data) {
                            try {
                              info = typeof job.informal_data === 'string' ? JSON.parse(job.informal_data) : job.informal_data;
                            } catch(e) {}
                          }
                          const lokasi = Array.isArray(info?.lokasi_proyek) 
                            ? info.lokasi_proyek.filter(Boolean).join(', ') 
                            : (info?.lokasi_proyek || '-');
                          return <span className="truncate text-orange-600 font-semibold">{lokasi}</span>;
                        }

                        if (job.status_pekerjaan === 'Outsourcing') {
                          return <span className="truncate">{job.bagian || job.jabatan || 'Unit Luar'}</span>;
                        }

                        return <span className="truncate">{job.bagian || job.jabatan || '-'}</span>;
                      })()}
                    </TableCell>
                    <TableCell className="py-4 px-3">
                       {/* Normalize status logic for display */}
                       {(() => {
                         const s = p.status_kesehatan;
                         if (s === 'sehat' || s === 'fit') {
                           return (
                             <div className="inline-flex items-center justify-center px-2.5 py-1 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 font-bold text-[10px] tracking-wide">
                               Sehat
                             </div>
                           );
                         }
                         if (s === 'sehat_dengan_catatan' || s === 'sakit_ringan' || s === 'fit_with_note') {
                           return (
                             <div className="inline-flex items-center justify-center px-2.5 py-1 rounded-md border border-amber-200 bg-amber-50 text-amber-700 font-bold text-[10px] tracking-wide">
                               Fit c/ Catatan
                             </div>
                           );
                         }
                         if (s === 'tidak_sehat' || s === 'sakit_berat' || s === 'unfit' || s === 'sakit') {
                           return (
                             <div className="inline-flex items-center justify-center px-2.5 py-1 rounded-md border border-rose-200 bg-rose-50 text-rose-700 font-bold text-[10px] tracking-wide">
                               Tidak Sehat
                             </div>
                           );
                         }
                         return (
                           <div className="inline-flex items-center justify-center px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-500 font-bold text-[10px] tracking-wide">
                             Belum Dicek
                           </div>
                         );
                       })()}
                    </TableCell>
                    <TableCell className="text-right py-4 pr-4 w-12">
                      <div className="flex justify-end">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            onClick={(e) => { e.stopPropagation(); confirmDelete(p.id); }}
                            title="Hapus Permanen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );})
              )}
            </TableBody>
          </Table>
        </div>
        
        <Pagination 
          currentPage={currentPage}
          total={total}
          perPage={perPage}
          lastPage={lastPage}
          onPageChange={setCurrentPage}
          label="pekerja"
        />
      </div>

      {/* ===== Bulk Update Sheet ===== */}
      <Sheet open={bulkOpen} onOpenChange={setBulkOpen}>
        <SheetContent className="sm:max-w-2xl p-0 overflow-hidden flex flex-col bg-white border-l shadow-2xl">
          <SheetHeader className="px-8 py-6 border-b border-slate-100 bg-white z-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <SheetTitle className="text-xl font-bold text-slate-900">Lengkapi Data Pekerja</SheetTitle>
                <SheetDescription className="mt-0.5 text-slate-500 text-sm">
                  {incompleteWorkers.length} pekerja belum memiliki data jenis kelamin atau tanggal lahir.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="space-y-6 pb-4">
              {incompleteWorkers.map((p) => (
                <div key={p.id} className="rounded-xl border border-slate-200 p-5 bg-slate-50/50 hover:bg-white transition-colors">
                  {/* Worker Identity */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      <img 
                        src={p.pas_foto ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://127.0.0.1:8000'}/storage/profil/${p.pas_foto}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.nama_lengkap}`} 
                        alt="avatar" 
                        className="w-full h-full object-cover object-top" 
                      />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{p.nama_lengkap}</p>
                      <p className="text-xs text-slate-500">NIK: {p.nik}</p>
                    </div>
                    {/* Missing indicator */}
                    <div className="ml-auto flex gap-1.5">
                      {!p.jenis_kelamin && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md">Gender ✗</span>
                      )}
                      {!p.tanggal_lahir && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md">Tgl Lahir ✗</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Edit Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-500 tracking-wider">JENIS KELAMIN</Label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setBulkEdits(prev => ({ ...prev, [p.id]: { ...prev[p.id], jenis_kelamin: 'L' } }))}
                          className={`flex-1 h-9 text-xs font-bold rounded-lg border transition-colors ${
                            bulkEdits[p.id]?.jenis_kelamin === 'L'
                              ? 'border-[#0284c7] bg-sky-50 text-[#0284c7]'
                              : 'border-slate-200 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          Laki-laki
                        </button>
                        <button
                          type="button"
                          onClick={() => setBulkEdits(prev => ({ ...prev, [p.id]: { ...prev[p.id], jenis_kelamin: 'P' } }))}
                          className={`flex-1 h-9 text-xs font-bold rounded-lg border transition-colors ${
                            bulkEdits[p.id]?.jenis_kelamin === 'P'
                              ? 'border-[#0284c7] bg-sky-50 text-[#0284c7]'
                              : 'border-slate-200 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          Perempuan
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-500 tracking-wider">TANGGAL LAHIR</Label>
                      <Input
                        type="date"
                        className="h-9 text-sm bg-white border-slate-200 focus-visible:ring-[#0ea5e9]"
                        value={bulkEdits[p.id]?.tanggal_lahir || ''}
                        onChange={(e) => setBulkEdits(prev => ({
                          ...prev,
                          [p.id]: { ...prev[p.id], tanggal_lahir: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {incompleteWorkers.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-semibold">Semua data pekerja sudah lengkap!</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="border-t border-slate-100 p-6 bg-slate-50/50 flex flex-col gap-3">
            <Button
              onClick={handleBulkSave}
              disabled={saving}
              className="w-full h-12 text-sm font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Menyimpan...' : 'Simpan Semua Perubahan'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setBulkOpen(false)}
              className="w-full h-12 text-sm font-bold bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
            >
              Batal
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
          <AlertDialogHeader>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 mb-2">
              <Trash2 className="h-7 w-7 text-rose-500" />
            </div>
            <AlertDialogTitle className="text-xl font-black text-slate-900 text-center">Hapus Data Pekerja?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 text-center text-sm px-2">
              Tindakan ini <span className="text-rose-600 font-bold">tidak dapat dibatalkan</span>. Semua riwayat kesehatan dan pajanan pekerja ini akan dihapus permanen dari sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-3 mt-4">
            <AlertDialogCancel className="rounded-xl border-slate-200 text-slate-500 font-bold hover:bg-slate-50 px-6">
              Batalkan
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
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
