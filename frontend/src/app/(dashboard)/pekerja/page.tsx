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
import { Plus, ExternalLink, ChevronLeft, ChevronRight, AlertTriangle, Save, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function PekerjaPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(10);
  const [lastPage, setLastPage] = useState(1);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkEdits, setBulkEdits] = useState<Record<number, { jenis_kelamin: string; tanggal_lahir: string }>>({});
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/pekerja', { 
        params: { 
          search,
          page: currentPage,
          per_page: perPage 
        } 
      });
      if (response.data.status === 'success') {
        const result = response.data.data;
        setData(result.data || []);
        setTotal(result.total || 0);
        setLastPage(result.last_page || 1);
      }
    } catch (error) {
      toast.error('Gagal mengambil data pekerja. Cek koneksi server.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, currentPage]);

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

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus pekerja ini (Soft Delete)?')) return;
    try {
      await api.delete(`/pekerja/${id}`);
      toast.success('Pekerja dihapus');
      fetchData();
    } catch (e) {
      toast.error('Gagal menghapus');
    }
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
          {incompleteWorkers.length > 0 && (
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

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto p-4 sm:p-6 pb-2">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 hover:bg-transparent">
                <TableHead className="text-xs font-bold text-slate-400 tracking-wider uppercase bg-transparent">NAMA PEKERJA</TableHead>
                <TableHead className="text-xs font-bold text-slate-400 tracking-wider uppercase bg-transparent">NIK</TableHead>
                <TableHead className="text-xs font-bold text-slate-400 tracking-wider uppercase bg-transparent">PERUSAHAAN SAAT INI</TableHead>
                <TableHead className="text-xs font-bold text-slate-400 tracking-wider uppercase bg-transparent w-[180px]">STATUS KESEHATAN</TableHead>
                <TableHead className="text-xs font-bold text-slate-400 tracking-wider uppercase bg-transparent text-right">AKSI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-32 text-slate-500 font-medium">Memuat data pekerja...</TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-32 text-slate-500 font-medium">Data tidak ditemukan.</TableCell>
                </TableRow>
              ) : (
                data.map((p) => (
                  <TableRow key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-4 py-1">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                           <img 
                             src={p.pas_foto ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://127.0.0.1:8000'}/storage/profil/${p.pas_foto}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.nama_lengkap}`} 
                             alt="avatar" 
                             className="w-full h-full object-cover object-top" 
                           />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-[15px]">{p.nama_lengkap}</span>
                          <span className="text-xs text-slate-500 mt-0.5">
                            {p.jenis_kelamin === 'L' ? 'Laki-laki' : p.jenis_kelamin === 'P' ? 'Perempuan' : <span className="text-amber-500 font-medium">Belum diisi</span>}
                            {' • '}
                            {p.tanggal_lahir
                              ? (new Date().getFullYear() - new Date(p.tanggal_lahir).getFullYear()) + ' Tahun'
                              : <span className="text-amber-500 font-medium">Belum diisi</span>
                            }
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-sm text-slate-600 tracking-wide">{p.nik}</TableCell>
                    <TableCell className="text-slate-600 font-medium text-sm max-w-[200px] truncate">{p.perusahaan?.nama_perusahaan}</TableCell>
                    <TableCell>
                       {p.status_kesehatan === 'sehat' && (
                         <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-emerald-200 bg-emerald-100/50 text-emerald-700 font-bold text-[11px] tracking-wide shadow-[0_2px_10px_-3px_rgba(16,185,129,0.2)]">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                           Sehat
                         </div>
                       )}
                       {p.status_kesehatan === 'sakit_ringan' && (
                         <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-amber-200 bg-amber-100/50 text-amber-700 font-bold text-[11px] tracking-wide shadow-[0_2px_10px_-3px_rgba(245,158,11,0.2)]">
                           <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                           Sehat dengan Catatan
                         </div>
                       )}
                       {p.status_kesehatan === 'sakit_berat' && (
                         <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-rose-200 bg-rose-100/50 text-rose-700 font-bold text-[11px] tracking-wide shadow-[0_2px_10px_-3px_rgba(244,63,94,0.2)]">
                           <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-2 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
                           Tidak Sehat
                         </div>
                       )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" className="text-[#0ea5e9] hover:text-[#0284c7] hover:bg-[#F0F9FF] font-bold text-sm h-10 px-4 rounded-xl" onClick={() => router.push(`/pekerja/${p.id}`)}>
                        Lihat Detail <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between mt-2">
          <p className="text-sm font-medium text-slate-500">
            Menampilkan <span className="text-slate-900 font-bold">
              {total > 0 ? (currentPage - 1) * perPage + 1 : 0}-
              {Math.min(currentPage * perPage, total)}
            </span> dari <span className="text-slate-900 font-bold">{total}</span> pekerja
          </p>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="h-9 w-9 rounded-lg border-slate-200 text-slate-600 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1 px-2">
              <span className="text-sm font-bold text-slate-900">Halaman {currentPage}</span>
              <span className="text-sm text-slate-400">dari {lastPage}</span>
            </div>

            <Button 
              variant="outline" 
              size="icon"
              disabled={currentPage === lastPage || total === 0}
              onClick={() => setCurrentPage(prev => Math.min(lastPage, prev + 1))}
              className="h-9 w-9 rounded-lg border-slate-200 text-slate-600 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
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
    </div>
  );
}
