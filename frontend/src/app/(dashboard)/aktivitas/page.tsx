'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Search,
  Filter,
  Calendar,
  RefreshCw,
  Plus,
  Trash2,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronLeft,
  ChevronRight,
  History,
  UserCog,
  ShieldCheck,
  FileClock,
  Download,
  Eye,
  FileSpreadsheet,
  FileText as FilePdf,
  FileJson,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Pagination } from '@/components/ui/Pagination';

interface ActivityLog {
  id: number;
  action: string;
  description: string;
  category: 'sistem' | 'admin';
  user_name: string;
  perusahaan?: string;
  metadata: any;
  created_at: string;
  time_ago: string;
}

export default function AktivitasPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [perPage] = useState(20);

  // Filters
  const [category, setCategory] = useState('all');
  const [action, setAction] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf' | 'csv'>('excel');
  const [isExporting, setIsExporting] = useState(false);

  // Archive Management
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [archives, setArchives] = useState<any[]>([]);
  const [loadingArchives, setLoadingArchives] = useState(false);

  // Debouncing logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500); // 500ms delay

    return () => clearTimeout(handler);
  }, [search]);

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        per_page: perPage,
        category,
        action,
        search: debouncedSearch,
        start_date: startDate,
        end_date: endDate,
      };
      const res = await api.get('/activity-logs', { params });
      if (res.data.status === 'success') {
        setLogs(res.data.data.data);
        setTotal(res.data.data.total);
        setCurrentPage(res.data.data.current_page);
        setLastPage(res.data.data.last_page);
      }
    } catch (err) {
      toast.error('Gagal mengambil data riwayat aktivitas');
    } finally {
      setLoading(false);
    }
  }, [category, action, debouncedSearch, startDate, endDate, perPage]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const getActionConfig = (action: string) => {
    switch (action) {
      case 'create':
        return { icon: Plus, label: 'Tambah', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', dot: 'bg-emerald-500' };
      case 'update':
        return { icon: RefreshCw, label: 'Update', color: 'bg-blue-50 text-blue-600 border-blue-100', dot: 'bg-blue-500' };
      case 'soft_delete':
        return { icon: Trash2, label: 'Hapus', color: 'bg-rose-50 text-rose-600 border-rose-100', dot: 'bg-rose-500' };
      case 'restore':
        return { icon: RotateCcw, label: 'Restore', color: 'bg-purple-50 text-purple-600 border-purple-100', dot: 'bg-purple-500' };
      case 'warning':
        return { icon: AlertTriangle, label: 'Peringatan', color: 'bg-amber-50 text-amber-600 border-amber-100', dot: 'bg-amber-500' };
      default:
        return { icon: Info, label: 'Info', color: 'bg-slate-50 text-slate-600 border-slate-100', dot: 'bg-slate-500' };
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({
        format: exportFormat,
        category,
        action,
        search,
        start_date: startDate,
        end_date: endDate,
      });

      const response = await api.get(`/activity-logs/export?${params.toString()}`, {
        responseType: 'blob',
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const extension = exportFormat === 'pdf' ? 'pdf' : 'csv';
      link.setAttribute('download', `activity-logs-${new Date().toISOString().split('T')[0]}.${extension}`);
      
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setIsExportOpen(false);
      toast.success(`Log aktivitas berhasil diunduh dalam format ${exportFormat.toUpperCase()}`);
    } catch (err) {
      toast.error('Gagal mengunduh file laporan');
    } finally {
      setIsExporting(false);
    }
  };

  const fetchArchives = async () => {
    setLoadingArchives(true);
    try {
      const res = await api.get('/activity-logs/archives');
      if (res.data.status === 'success') {
        setArchives(res.data.data);
      }
    } catch (err) {
      toast.error('Gagal mengambil daftar arsip');
    } finally {
      setLoadingArchives(false);
    }
  };

  const downloadArchive = async (filename: string) => {
    try {
      const response = await api.get(`/activity-logs/archives/download?filename=${filename}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('File arsip berhasil diunduh');
    } catch (err) {
      toast.error('Gagal mengunduh file arsip');
    }
  };

  useEffect(() => {
    if (isArchiveOpen) {
      fetchArchives();
    }
  }, [isArchiveOpen]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#0f172a] flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-[#0ea5e9]" />
            Riwayat Aktivitas Admin
          </h1>
          <p className="text-[#64748b] mt-1.5 text-[15px]">
            Audit log lengkap aktivitas sistem dan staf administrator
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button 
            onClick={() => setIsArchiveOpen(true)}
            variant="outline" 
            className="h-11 px-6 font-bold border-blue-200 text-blue-600 rounded-xl bg-blue-50/50 shadow-sm hover:bg-blue-50 transition-all active:scale-95"
          >
            <History className="mr-2 h-4 w-4" /> Manajemen Arsip
          </Button>
          <Button 
            onClick={() => setIsExportOpen(true)}
            variant="outline" 
            className="h-11 px-6 font-bold border-slate-200 rounded-xl bg-white shadow-sm hover:bg-slate-50 transition-all active:scale-95"
          >
            <Download className="mr-2 h-4 w-4" /> Export Log
          </Button>
        </div>
      </div>

      {/* Metric Highlights */}
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="rounded-[20px] shadow-sm border-slate-100 p-6 bg-white flex flex-col items-center justify-center text-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
            <History className="h-7 w-7" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Aktivitas</p>
            <h3 className="text-3xl font-black text-[#0f172a] mt-1">{total.toLocaleString('id-ID')}</h3>
          </div>
        </Card>
        <Card className="rounded-[20px] shadow-sm border-slate-100 p-6 bg-white flex flex-col items-center justify-center text-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center">
            <UserCog className="h-7 w-7" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Aktivitas Admin</p>
            <h3 className="text-3xl font-black text-[#0f172a] mt-1">{logs.filter(l => l.category === 'admin').length}+</h3>
          </div>
        </Card>
        <Card className="rounded-[20px] shadow-sm border-slate-100 p-6 bg-white flex flex-col items-center justify-center text-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
            <FileClock className="h-7 w-7" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Update Terakhir</p>
            <h3 className="text-2xl font-black text-[#0f172a] mt-1">{logs[0]?.time_ago || '-'}</h3>
          </div>
        </Card>
      </div>

      {/* Filters Area */}
      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari aktivitas atau nama admin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/30 focus:border-[#0ea5e9] transition-all"
            />
          </div>

          <Select value={category} onValueChange={(v) => setCategory(v || 'all')}>
            <SelectTrigger className="w-full sm:w-40 h-11 border-slate-200 rounded-xl bg-white font-semibold text-slate-600">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="sistem">Sistem</SelectItem>
            </SelectContent>
          </Select>

          <Select value={action} onValueChange={(v) => setAction(v || 'all')}>
            <SelectTrigger className="w-full sm:w-40 h-11 border-slate-200 rounded-xl bg-white font-semibold text-slate-600">
              <SelectValue placeholder="Tipe Aksi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Aksi</SelectItem>
              <SelectItem value="create">Tambah</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="soft_delete">Hapus</SelectItem>
              <SelectItem value="restore">Restore</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 h-11">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-600 outline-none" 
            />
            <span className="text-slate-300 mx-1">/</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-600 outline-none" 
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <Card className="rounded-[24px] shadow-sm border-slate-100 overflow-hidden bg-white">
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-slate-100 bg-slate-50/50">
              <TableHead className="py-4 pl-8 font-bold text-[10px] tracking-widest text-[#94a3b8] w-[180px]">WAKTU</TableHead>
              <TableHead className="py-4 px-6 font-bold text-[10px] tracking-widest text-[#94a3b8] w-[200px]">ADMIN / USER</TableHead>
              <TableHead className="py-4 px-6 font-bold text-[10px] tracking-widest text-[#94a3b8] w-[200px]">PERUSAHAAN</TableHead>
              <TableHead className="py-4 px-6 font-bold text-[10px] tracking-widest text-[#94a3b8] flex-1">DESKRIPSI AKTIVITAS</TableHead>
              <TableHead className="py-4 pr-8 font-bold text-[10px] tracking-widest text-[#94a3b8] text-right w-[100px]">DETAIL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}><TableCell colSpan={5} className="h-16 bg-slate-50/30 animate-pulse" /></TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-20 text-center">
                  <div className="flex flex-col items-center">
                    <Filter className="h-12 w-12 text-slate-100 mb-4" />
                    <p className="text-slate-400 font-medium">Tidak ada riwayat aktivitas ditemukan.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const config = getActionConfig(log.action);
                const ActionIcon = config.icon;
                return (
                  <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                    <TableCell className="py-5 pl-8">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-slate-700 whitespace-nowrap">{log.created_at}</span>
                        <span className="text-[11px] text-slate-400 font-medium mt-0.5">{log.time_ago}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-9 w-9 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 shadow-sm",
                          log.category === 'admin' ? "bg-indigo-50 text-indigo-500 border border-indigo-100" : "bg-slate-100 text-slate-500 border border-slate-200"
                        )}>
                          {log.user_name.charAt(0)}
                        </div>
                        <span className="text-sm font-bold text-slate-600 truncate max-w-[140px]">{log.user_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-6">
                      <span className="text-[13px] font-bold text-slate-700">
                        {log.perusahaan || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="py-5 px-6">
                      <p className="text-sm text-slate-600 font-medium leading-relaxed">
                        {log.description}
                      </p>
                    </TableCell>
                    <TableCell className="py-5 pr-8 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedLog(log)}
                        className="h-9 w-9 rounded-full text-[#0ea5e9] hover:bg-blue-50 transition-all active:scale-90"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
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
          onPageChange={fetchLogs}
          label="Aktivitas"
        />
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl rounded-[32px] border-none shadow-2xl p-0 overflow-hidden">
          {selectedLog && (
            <>
              <DialogHeader className="p-8 bg-slate-900 text-white">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                    getActionConfig(selectedLog.action).dot
                  )}>
                    {(() => {
                      const Icon = getActionConfig(selectedLog.action).icon;
                      return <Icon className="h-6 w-6 text-white" />;
                    })()}
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-xl font-bold">{selectedLog.description}</DialogTitle>
                    <DialogDescription className="text-white/60 font-medium">
                      Detail perubahan yang dilakukan pada {selectedLog.created_at}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-8 space-y-6 bg-white">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PELAKU AKTIVITAS</p>
                    <p className="text-sm font-bold text-slate-700">{selectedLog.user_name} ({selectedLog.category.toUpperCase()})</p>
                  </div>
                  <div className="space-y-1.5 text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID AKTIVITAS</p>
                    <p className="text-sm font-mono font-bold text-slate-700">#LOG-{selectedLog.id}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">METADATA / DATA TERKAIT</p>
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 font-mono text-[12px] text-slate-600 overflow-x-auto max-h-60 custom-scrollbar">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.metadata || { message: "Tidak ada data tambahan" }, null, 2)}
                    </pre>
                  </div>
                </div>

                <Button 
                  onClick={() => setSelectedLog(null)}
                  className="w-full h-12 rounded-xl bg-slate-900 hover:bg-black text-white font-bold transition-all shadow-xl shadow-slate-200"
                >
                  Tutup Detail
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent className="max-w-md rounded-[32px] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-8 bg-[#0ea5e9] text-white">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Download className="h-6 w-6" />
              Ekspor Log Aktivitas
            </DialogTitle>
            <DialogDescription className="text-white/80 font-medium">
              Pilih format dan kriteria data untuk laporan audit Anda.
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PILIH FORMAT FILE</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'excel', label: 'Excel', icon: FileSpreadsheet, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                  { id: 'pdf', label: 'PDF', icon: FilePdf, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100' },
                  { id: 'csv', label: 'CSV', icon: FileJson, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
                ].map((format) => {
                  const Icon = format.icon;
                  const isActive = exportFormat === format.id;
                  return (
                    <button
                      key={format.id}
                      onClick={() => setExportFormat(format.id as any)}
                      className={cn(
                        "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all",
                        isActive 
                          ? "border-[#0ea5e9] bg-blue-50/50 ring-2 ring-[#0ea5e9]/10" 
                          : "border-slate-100 hover:border-slate-200"
                      )}
                    >
                      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", format.bg, format.color)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">{format.label}</span>
                      {isActive && (
                        <div className="absolute top-2 right-2 h-4 w-4 bg-[#0ea5e9] rounded-full flex items-center justify-center">
                          <Check className="h-2 w-2 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CAKUPAN DATA</p>
              <div className="space-y-2">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-700">Filter Aktif</span>
                    <span className="text-[11px] text-slate-500">Mengekspor {total} baris sesuai filter</span>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setIsExportOpen(false)}
                className="flex-1 h-12 rounded-xl font-bold text-slate-500 border-slate-200"
              >
                Batal
              </Button>
              <Button 
                onClick={handleExport}
                disabled={isExporting}
                className="flex-[2] h-12 rounded-xl bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-bold transition-all shadow-lg shadow-blue-100"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Menyiapkan...
                  </>
                ) : (
                  'Unduh Sekarang'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Archive Management Dialog */}
      <Dialog open={isArchiveOpen} onOpenChange={setIsArchiveOpen}>
        <DialogContent className="max-w-2xl rounded-3xl overflow-hidden p-0 gap-0">
          <DialogHeader className="p-8 bg-blue-50/50 border-b border-blue-100">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-200">
                <FileClock className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-blue-900">Arsip Pemeliharaan Log</DialogTitle>
                <DialogDescription className="text-blue-600/70">
                  Daftar file CSV hasil pembersihan log otomatis (Data &gt; 6 Bulan)
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-0 max-h-[400px] overflow-y-auto">
            {loadingArchives ? (
              <div className="p-12 text-center flex flex-col items-center gap-4">
                <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
                <p className="text-sm font-medium text-slate-500">Memuat berkas arsip...</p>
              </div>
            ) : archives.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
                  <FileSpreadsheet className="h-8 w-8 text-slate-200" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-700">Belum ada arsip</p>
                  <p className="text-sm text-slate-500 mt-1">Sistem belum melakukan pembersihan otomatis.</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {archives.map((archive, idx) => (
                  <div key={idx} className="p-6 hover:bg-slate-50 flex items-center justify-between group transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-emerald-500">
                        <FileSpreadsheet className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{archive.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {archive.created_at}
                          </span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Info className="h-3 w-3" /> {archive.size}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => downloadArchive(archive.name)}
                      className="rounded-lg bg-[#0ea5e9] hover:bg-[#0284c7] font-bold"
                    >
                      <Download className="h-3.5 w-3.5 mr-2" /> Download CSV
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              Catatan: Data yang sudah diarsipkan telah dihapus dari database utama untuk performa server.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
