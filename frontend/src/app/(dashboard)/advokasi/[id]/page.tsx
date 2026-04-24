'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/axios';
import {
  CheckCircle2,
  ClipboardList,
  Waves,
  Printer,
  Pencil,
  Eye,
  Download,
  Upload,
  FileText,
  ArrowLeft,
  User2,
  Stethoscope,
  Clock,
  FileStack,
  HeartPulse,
  Scale,
  Search,
  Coins,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import SheetEditKasus from '@/components/SheetEditKasus';
import { useGetAdvokasiDetail } from '@/hooks/useAdvokasi';

const caseTypeLabels: Record<string, string> = {
  PAK: 'PAK (Penyakit Akibat Kerja)',
  K3: 'K3 (Kecelakaan Kerja)',
  PHK: 'PHK (Pemutusan Hubungan Kerja)',
  JHT: 'JHT (Jaminan / JHT)',
};

// Helpers for Status Kesehatan
const normalizeStatus = (s: string) => {
  const map: Record<string, string> = {
    'fit': 'sehat',
    'fit_with_note': 'sehat_dengan_catatan',
    'unfit': 'tidak_sehat',
    'sakit_ringan': 'sehat_dengan_catatan',
    'sakit_berat': 'tidak_sehat',
    'sakit': 'tidak_sehat',
  };
  return map[s] || s;
};

const getStatusLabel = (s?: string) => {
  if (!s) return 'Sehat';
  const normalized = normalizeStatus(s);
  if (normalized === 'sehat') return 'Sehat';
  if (normalized === 'sehat_dengan_catatan') return 'Sehat dengan Catatan';
  if (normalized === 'tidak_sehat') return 'Tidak Sehat';
  return s.replace(/_/g, ' ');
};

const getStatusColor = (s?: string) => {
  if (!s) return 'text-emerald-600';
  const normalized = normalizeStatus(s);
  if (normalized === 'sehat') return 'text-emerald-600';
  if (normalized === 'sehat_dengan_catatan') return 'text-amber-600';
  if (normalized === 'tidak_sehat') return 'text-rose-600';
  return 'text-slate-600';
};

export default function AdvokasiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Document Upload State
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docForm, setDocForm] = useState({
    step_key: '',
    file: null as File | null
  });

  const { data, isLoading: loading, refetch } = useGetAdvokasiDetail(id);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 text-[#0284c7] animate-spin" />
        <p className="text-slate-400 font-medium italic">Memuat detail kasus...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-slate-500 font-bold">Kasus tidak ditemukan.</p>
        <Button onClick={() => router.push('/advokasi')}>Kembali ke Daftar</Button>
      </div>
    );
  }

  // Map backend data to UI structure
  const code = `ADV-${data.id.toString().padStart(5, '0')}`;
  const statusLabel = data.rehabilitasi_bpjskes ? 'SELESAI' : (data.status_detail || 'DALAM PROSES');
  const normalizedType = data.jenis_kasus?.toUpperCase();
  const title = caseTypeLabels[normalizedType] || normalizedType || 'Penyakit Akibat Kerja';
  
  const currentStages = [
    { name: 'Pajanan', status: data?.riwayat_pajanan ? 'Selesai' : 'Pending', icon: Search, done: !!data?.riwayat_pajanan, active: !data?.riwayat_pajanan },
    { name: 'Diagnosis', status: data?.persetujuan_dokter ? 'Selesai' : 'Pending', icon: Stethoscope, done: !!data?.persetujuan_dokter, active: !!data?.riwayat_pajanan && !data?.persetujuan_dokter },
    { name: 'Pelaporan', status: data?.perusahaan_lapor ? 'Selesai' : 'Pending', icon: FileText, done: !!data?.perusahaan_lapor, active: !!data?.persetujuan_dokter && !data?.perusahaan_lapor },
    { name: 'Penetapan', status: data?.penetapan_pak ? 'Selesai' : 'Pending', icon: Scale, done: !!data?.penetapan_pak, active: !!data?.perusahaan_lapor && !data?.penetapan_pak },
    { name: 'Kompensasi', status: data?.kompensasi_bpjstk ? 'Selesai' : 'Pending', icon: Coins, done: !!data?.kompensasi_bpjstk, active: !!data?.penetapan_pak && !data?.kompensasi_bpjstk },
    { name: 'Rehabilitasi', status: data?.rehabilitasi_bpjskes ? 'Selesai' : 'Pending', icon: HeartPulse, done: !!data?.rehabilitasi_bpjskes, active: !!data?.kompensasi_bpjstk && !data?.rehabilitasi_bpjskes },
  ];

  // Derived Data
  const currentJob = data?.pekerja?.riwayat_pekerja?.find(r => !r.tgl_keluar) || data?.pekerja?.riwayat_pekerja?.[0];

  const documents = [
    { key: 'riwayat_pajanan', name: 'Bukti Pajanan', path: data.bukti_pajanan_path, fileName: data.bukti_pajanan_name, date: data.bukti_pajanan_at },
    { key: 'persetujuan_dokter', name: 'Diagnosis Dokter', path: data.bukti_persetujuan_dokter_path, fileName: data.bukti_persetujuan_dokter_name, date: data.bukti_persetujuan_dokter_at },
    { key: 'perusahaan_lapor', name: 'Laporan Perusahaan', path: data.bukti_perusahaan_lapor_path, fileName: data.bukti_perusahaan_lapor_name, date: data.bukti_perusahaan_lapor_at },
    { key: 'penetapan_pak', name: 'Penetapan PAK', path: data.bukti_penetapan_pak_path, fileName: data.bukti_penetapan_pak_name, date: data.bukti_penetapan_pak_at },
    { key: 'kompensasi_bpjstk', name: 'Kompensasi BPJSTK', path: data.bukti_kompensasi_bpjstk_path, fileName: data.bukti_kompensasi_bpjstk_name, date: data.bukti_kompensasi_bpjstk_at },
    { key: 'rehabilitasi_bpjskes', name: 'Rehabilitasi BPJSKES', path: data.bukti_rehabilitasi_bpjskes_path, fileName: data.bukti_rehabilitasi_bpjskes_name, date: data.bukti_rehabilitasi_bpjskes_at },
  ].filter(d => !!d.path);

  const handleExportPdf = async () => {
    setDownloading(true);
    try {
      const response = await api.get(`/advokasi/${id}/pdf`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Laporan-Advokasi-${code}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Buku PDF berhasil diunduh.');
    } catch (err) {
      toast.error('Gagal saat membuat PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.step_key || !docForm.file) {
      toast.error('Pilih jenis dokumen dan file yang akan diunggah.');
      return;
    }
    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('step_key', docForm.step_key);
      formData.append('file', docForm.file);
      if (data.jenis_kasus) formData.append('jenis_kasus', data.jenis_kasus);
      if (data.tahap) formData.append('tahap', data.tahap);

      const resp = await api.post(`/pekerja/${data.pekerja_id}/advokasi`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (resp.data.status === 'success') {
        toast.success('Dokumen berhasil diunggah.');
        setIsDocModalOpen(false);
        setDocForm({ step_key: '', file: null });
        refetch();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengunggah dokumen.');
    } finally {
      setUploadingDoc(false);
    }
  };

  // Timeline Logic
  const timelineMilestones = [
    { key: 'riwayat_pajanan', label: 'Verifikasi Pajanan', at: data.bukti_pajanan_at, icon: Search, color: 'bg-blue-500' },
    { key: 'persetujuan_dokter', label: 'Diagnosis Dokter', at: data.bukti_persetujuan_dokter_at, icon: Stethoscope, color: 'bg-emerald-500' },
    { key: 'perusahaan_lapor', label: 'Laporan Perusahaan', at: data.bukti_perusahaan_lapor_at, icon: FileText, color: 'bg-amber-500' },
    { key: 'penetapan_pak', label: 'Penetapan PAK', at: data.bukti_penetapan_pak_at, icon: Scale, color: 'bg-indigo-500' },
    { key: 'kompensasi_bpjstk', label: 'Klaim Kompensasi', at: data.bukti_kompensasi_bpjstk_at, icon: Coins, color: 'bg-rose-500' },
    { key: 'rehabilitasi_bpjskes', label: 'Prosedur Rehabilitasi', at: data.bukti_rehabilitasi_bpjskes_at, icon: HeartPulse, color: 'bg-sky-500' },
  ];

  const timelineItems = [
    // System initiation event
    { label: 'Kasus Didaftarkan', at: data.created_at, icon: ClipboardList, color: 'bg-slate-400' },
    // Milestone events
    ...timelineMilestones
      // @ts-ignore
      .filter(m => !!data[m.key] && !!m.at)
      .map(m => ({ ...m }))
  ]
    // @ts-ignore
    .map(m => ({ ...m, date: new Date(m.at) }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());


  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => router.push('/advokasi')} className="text-slate-400 hover:text-slate-700 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-bold text-[#0284c7]">{code}</span>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${data.rehabilitasi_bpjskes ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${data.rehabilitasi_bpjskes ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
              {statusLabel}
            </span>
          </div>
          <h1 className="text-[24px] font-extrabold tracking-tight text-[#0f172a]">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleExportPdf}
            disabled={downloading}
            className="h-10 px-5 font-bold text-slate-700 border-slate-200"
          >
            {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
            {downloading ? 'Memproses...' : 'Export PDF'}
          </Button>
          <Button 
            onClick={() => setIsEditOpen(true)}
            className="h-10 px-5 font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white"
          >
            <Pencil className="mr-2 h-4 w-4" /> Edit Kasus
          </Button>
        </div>
      </div>

      {/* Progress Stepper */}
      <Card className="rounded-[20px] shadow-sm border-slate-100 px-6 py-10 overflow-x-auto overflow-y-hidden no-scrollbar">
        <div className="flex items-start min-w-[800px] w-full">
          {currentStages.map((stage: any, i: number) => {
            const Icon = stage.icon;
            return (
              <div key={i} className="flex items-start flex-1 last:flex-none">
                <div className="flex flex-col items-center min-w-[100px]">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center border-[3px] transition-all duration-500 ${
                    stage.done ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100' :
                    stage.active ? 'bg-white border-[#0284c7] text-[#0284c7] shadow-lg shadow-sky-100 animate-pulse' :
                    'bg-slate-50 border-slate-200 text-slate-300'
                  }`}>
                    {stage.done ? <CheckCircle2 className="h-6 w-6" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <p className={`text-[11px] font-bold mt-2.5 text-center whitespace-nowrap ${stage.active || stage.done ? 'text-[#1e293b]' : 'text-slate-400'}`}>
                    {stage.name}
                  </p>
                  <p className={`text-[10px] font-medium mt-0.5 ${stage.done ? 'text-emerald-500' : (stage.active ? 'text-[#0284c7]' : 'text-slate-400')}`}>
                    {stage.status}
                  </p>
                </div>
                {i < currentStages.length - 1 && (
                  <div className={`flex-1 h-[3px] mt-[22px] mx-1 rounded-full transition-colors duration-1000 ${stage.done ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* LEFT COLUMN (2/3) */}
        <div className="md:col-span-2 space-y-6">
          {/* Profil Pekerja */}
          <Card className="rounded-[20px] shadow-sm border-slate-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <User2 className="h-4 w-4 text-[#0284c7]" />
              <h3 className="text-xs font-bold text-[#94a3b8] tracking-widest">PROFIL PEKERJA</h3>
            </div>
            <div className="flex items-start gap-6">
              <div className="h-20 w-20 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden relative">
                {data.pekerja?.pas_foto ? (
                  <img 
                    src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://127.0.0.1:8000'}/storage/profil/${data.pekerja.pas_foto}`}
                    alt={data.pekerja?.nama_lengkap}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <User2 className="h-10 w-10 text-slate-300" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 flex-1">
                <div>
                  <p className="text-[10px] font-bold text-[#94a3b8] tracking-wider">NAMA LENGKAP</p>
                  <p className="text-sm font-bold text-[#1e293b] mt-0.5">{data.pekerja?.nama_lengkap}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#94a3b8] tracking-wider">NIK</p>
                  <p className="text-sm font-bold text-[#1e293b] mt-0.5">{data.pekerja?.nik}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#94a3b8] tracking-wider">PERUSAHAAN</p>
                  <p className="text-sm font-bold text-[#1e293b] mt-0.5">{data.pekerja?.perusahaan?.nama_perusahaan || currentJob?.nama_perusahaan || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#94a3b8] tracking-wider">JABATAN / PEKERJAAN</p>
                  <p className="text-sm font-bold text-[#1e293b] mt-0.5">{currentJob?.jabatan || 'OPERATOR'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#94a3b8] tracking-wider">BAGIAN</p>
                  <div className="mt-1">
                    <span className="px-2 py-1 bg-sky-50 text-[#0284c7] text-[10px] font-bold rounded-md uppercase tracking-wide">
                      {currentJob?.bagian || 'PRODUKSI'}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#94a3b8] tracking-wider">STATUS PEKERJAAN</p>
                  <div className="mt-1">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md uppercase tracking-wide">
                      {currentJob?.status_pekerjaan || 'TETAP'}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#94a3b8] tracking-wider">STATUS KESEHATAN</p>
                  <p className={cn("text-sm font-bold mt-0.5 capitalize", getStatusColor(data.pekerja?.status_kesehatan))}>
                    {getStatusLabel(data.pekerja?.status_kesehatan)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Detail Kasus */}
          <Card className="rounded-[20px] shadow-sm border-slate-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <ClipboardList className="h-4 w-4 text-[#0284c7]" />
              <h3 className="text-xs font-bold text-[#94a3b8] tracking-widest">DETAIL KASUS</h3>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-5">
              <div>
                <p className="text-[10px] font-bold text-[#94a3b8] tracking-wider">JENIS KASUS</p>
                <p className="text-sm font-bold text-[#1e293b] mt-0.5">{title}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#94a3b8] tracking-wider">TANGGAL PELAPORAN</p>
                <p className="text-sm font-bold text-[#1e293b] mt-0.5">
                  {data.tanggal_pelaporan ? new Date(data.tanggal_pelaporan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                </p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#94a3b8] tracking-wider mb-2">CATATAN KASUS</p>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <p className="text-sm text-[#475569] leading-relaxed whitespace-pre-wrap">{data.catatan || 'Tidak ada catatan.'}</p>
              </div>
            </div>
          </Card>

          {/* Data Medis (Simplified) */}
          <Card className="rounded-[20px] shadow-sm border-slate-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <Stethoscope className="h-4 w-4 text-[#0284c7]" />
              <h3 className="text-xs font-bold text-[#94a3b8] tracking-widest">DATA MEDIS</h3>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-amber-700 text-xs font-medium">
              Data medis utama dapat diakses melalui profil pekerja. Kasus ini berkaitan dengan diagnosis yang melibatkan paparan di lingkungan kerja.
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN (1/3) */}
        <div className="space-y-6">

          {/* Lini Masa Aktivitas */}
          <Card className="rounded-[20px] shadow-sm border-slate-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="h-4 w-4 text-[#0284c7]" />
              <h3 className="text-xs font-bold text-[#94a3b8] tracking-widest">LINI MASA AKTIVITAS</h3>
            </div>
            <div className="relative space-y-6 before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-100 last:before:h-[calc(100%-1.5rem)]">
              {timelineItems.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">Belum ada aktivitas tercatat.</p>
              ) : timelineItems.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="relative flex items-start gap-4">
                    <div className={cn(
                      "relative z-10 flex items-center justify-center h-[31px] w-[31px] rounded-full border-4 border-white shadow-sm shrink-0",
                      item.color
                    )}>
                      <Icon className="h-3 w-3 text-white" />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className="text-[11px] font-bold text-slate-900 uppercase tracking-tight">{item.label}</p>
                      <p className="text-[10px] font-medium text-slate-400 leading-none mt-1">
                        {item.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} • {item.date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Dokumen Bukti */}
          <Card className="rounded-[20px] shadow-sm border-slate-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <FileStack className="h-4 w-4 text-[#0284c7]" />
              <h3 className="text-xs font-bold text-[#94a3b8] tracking-widest">DOKUMEN BUKTI</h3>
            </div>
            <div className="space-y-4">
              {documents.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">Belum ada dokumen diunggah.</p>
              ) : documents.map((doc: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-red-50 text-red-500">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#1e293b] truncate uppercase text-[11px]">{doc.name}</p>
                    <p className="text-[10px] text-[#94a3b8] font-medium truncate">{doc.fileName}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}/api/pekerja/${data.pekerja_id}/files/advokasi/${doc.key}`, '_blank')}
                      className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setIsDocModalOpen(true)}
              className="w-full mt-4 py-3 border-2 border-dashed border-slate-200 rounded-xl text-xs font-bold text-[#94a3b8] hover:border-[#0ea5e9] hover:text-[#0284c7] transition-all flex items-center justify-center gap-2"
            >
              <Upload className="h-4 w-4" /> KELOLA DOKUMEN
            </button>
          </Card>
        </div>
      </div>

      <SheetEditKasus 
        open={isEditOpen} 
        onOpenChange={setIsEditOpen} 
        data={data} 
        onSuccess={() => refetch()}
      />

      {/* KELOLA DOKUMEN MODAL */}
      <Dialog open={isDocModalOpen} onOpenChange={setIsDocModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-white border-slate-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Unggah Dokumen Bukti</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Tambahkan dokumen pendukung untuk kasus advokasi ini.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUploadDoc} className="space-y-5 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-600">JENIS DOKUMEN</Label>
              <Select value={docForm.step_key} onValueChange={(v) => setDocForm({ ...docForm, step_key: v })}>
                <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200 focus:ring-[#0ea5e9]">
                  <SelectValue placeholder="Pilih jenis dokumen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="riwayat_pajanan">Bukti Pajanan</SelectItem>
                  <SelectItem value="persetujuan_dokter">Diagnosis Dokter</SelectItem>
                  <SelectItem value="perusahaan_lapor">Laporan Perusahaan</SelectItem>
                  <SelectItem value="penetapan_pak">Penetapan PAK</SelectItem>
                  <SelectItem value="kompensasi_bpjstk">Kompensasi BPJSTK</SelectItem>
                  <SelectItem value="rehabilitasi_bpjskes">Rehabilitasi BPJSKES</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-600">FILE DOKUMEN (PDF, JPG, PNG)</Label>
              <Input 
                type="file" 
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setDocForm({ ...docForm, file: e.target.files?.[0] || null })}
                className="h-11 rounded-xl bg-slate-50 border-slate-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#0ea5e9] file:text-white hover:file:bg-[#0369a1] transition-colors cursor-pointer"
              />
            </div>
            <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 mt-6">
              <Button type="button" variant="ghost" onClick={() => setIsDocModalOpen(false)} className="rounded-xl font-bold text-slate-500 hover:text-slate-700">
                Batal
              </Button>
              <Button type="submit" disabled={uploadingDoc} className="bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl font-bold shadow-sm">
                {uploadingDoc ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                Unggah Dokumen
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
