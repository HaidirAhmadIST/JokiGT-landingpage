'use client';

/**
 * Dashboard User (Pekerja)
 *
 * Halaman dashboard pribadi pekerja untuk melihat profil, status kesehatan,
 * progres advokasi, riwayat pajanan, dan riwayat kesehatan per perusahaan.
 *
 * Semua state dan logika bisnis dikelola oleh hook `useUserDashboard`.
 * File ini hanya berisi JSX layout dan UI rendering.
 */

import { cn, formatHealthStatus } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import {
  User2, Building2, Briefcase, MapPin, HeartPulse, ShieldCheck,
  Search, Stethoscope, FileText, Scale, Coins, Clock, LogOut,
  Download, CheckCircle2, AlertCircle, Loader2, FileStack, Activity, Upload,
  Calendar, Shield, Zap, Settings, ClipboardList, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserDashboard } from '@/hooks/useUserDashboard';
import type { StatusAdvokasi } from '@/types';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace('/api', '');

/** Konfigurasi tampilan untuk setiap status kesehatan. */
const healthConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  sehat:                { label: 'Sehat / Fit',           color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200',  dot: 'bg-emerald-500' },
  sehat_dengan_catatan: { label: 'Sehat dengan Catatan',  color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',      dot: 'bg-amber-500'   },
  tidak_sehat:          { label: 'Tidak Sehat / Unfit',   color: 'text-rose-700',    bg: 'bg-rose-50 border-rose-200',        dot: 'bg-rose-500'    },
};

/** 6 tahapan advokasi PAK secara berurutan. */
const STEPS = [
  { key: 'riwayat_pajanan',     label: 'Pajanan',     icon: Search,      color: 'bg-blue-500'    },
  { key: 'persetujuan_dokter',  label: 'Diagnosis',   icon: Stethoscope, color: 'bg-emerald-500' },
  { key: 'perusahaan_lapor',    label: 'Pelaporan',   icon: FileText,    color: 'bg-amber-500'   },
  { key: 'penetapan_pak',       label: 'Penetapan',   icon: Scale,       color: 'bg-indigo-500'  },
  { key: 'kompensasi_bpjstk',   label: 'Kompensasi',  icon: Coins,       color: 'bg-rose-500'    },
  { key: 'rehabilitasi_bpjskes',label: 'Rehabilitasi',icon: HeartPulse,  color: 'bg-sky-500'     },
];

/** Mapping key tahap ke kolom path dan tanggal dokumen di database. */
const DOC_KEYS = [
  { key: 'riwayat_pajanan',     name: 'Bukti Pajanan',        pathKey: 'bukti_pajanan_path',               dateKey: 'bukti_pajanan_at'               },
  { key: 'persetujuan_dokter',  name: 'Diagnosis Dokter',     pathKey: 'bukti_persetujuan_dokter_path',    dateKey: 'bukti_persetujuan_dokter_at'    },
  { key: 'perusahaan_lapor',    name: 'Laporan Perusahaan',   pathKey: 'bukti_perusahaan_lapor_path',      dateKey: 'bukti_perusahaan_lapor_at'      },
  { key: 'penetapan_pak',       name: 'Penetapan PAK',        pathKey: 'bukti_penetapan_pak_path',         dateKey: 'bukti_penetapan_pak_at'         },
  { key: 'kompensasi_bpjstk',   name: 'Kompensasi BPJSTK',   pathKey: 'bukti_kompensasi_bpjstk_path',     dateKey: 'bukti_kompensasi_bpjstk_at'     },
  { key: 'rehabilitasi_bpjskes',name: 'Rehabilitasi BPJSKES', pathKey: 'bukti_rehabilitasi_bpjskes_path', dateKey: 'bukti_rehabilitasi_bpjskes_at'  },
];

/** Jenis kasus advokasi yang tersedia. */
const JENIS: Record<string, string> = {
  PAK: 'Penyakit Akibat Kerja (PAK)',
  K3:  'Kecelakaan Kerja (K3)',
  PHK: 'Pemutusan Hubungan Kerja',
  JHT: 'Jaminan Hari Tua',
};

/** Format tanggal ke format lokal Indonesia. */
const fmt = (d: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

// ─── Komponen Utama ────────────────────────────────────────────────────────────

export default function UserDashboardPage() {
  // Semua logika dikelola oleh hook ini
  const {
    user, pekerja, loading, incompleteData, selectedRiwayatId, setSelectedRiwayatId,
    uploadModal, setUploadModal, uploading, uploadForm, setUploadForm, handleUpload,
    isProfileModalOpen, setIsProfileModalOpen, profileForm, setProfileForm,
    profileLoading, handleUpdateProfile, openProfileEdit,
    isAdvModalOpen, setIsAdvModalOpen, advForm, setAdvForm, advLoading,
    handleUpdateAdvokasi, openAdvEdit,
    isExposureModalOpen, setIsExposureModalOpen, exposureForm, setExposureForm,
    exposureLoading, handleUpdateExposure, openExposureEdit,
    logout, handleViewFile,
  } = useUserDashboard();

  if (loading) return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 text-[#0284c7] animate-spin" />
        <p className="text-slate-400 font-medium animate-pulse">Memuat dashboard...</p>
      </div>
    </div>
  );

  // ── Derived data ────────────────────────────────────────────────────────────
  const adv = (pekerja?.status_advokasi ?? (pekerja as any)?.statusAdvokasi ?? null) as StatusAdvokasi | null;
  const job = pekerja?.riwayat_pekerja?.find((r) => !r.tgl_keluar) ?? pekerja?.riwayat_pekerja?.[0] ?? null;
  const medis = pekerja?.latest_detail_medis ?? null;
  const hCfg = healthConfig[pekerja?.status_kesehatan ?? 'sehat'] ?? healthConfig.sehat;
  const done = adv ? STEPS.filter(s => (adv as any)[s.key]).length : 0;
  const pct  = Math.round((done / 6) * 100);
  const photo = pekerja?.pas_foto ? `${API_BASE}/storage/profil/${pekerja.pas_foto}` : null;
  const timeline = [
    { label: 'Terdaftar', at: pekerja?.created_at, icon: Shield, color: 'bg-slate-400' },
    ...STEPS.filter(s => adv && (adv as any)[s.key]).map(s => ({
      label: s.label, icon: s.icon, color: s.color,
      at: (adv as any)[`bukti_${s.key === 'riwayat_pajanan' ? 'pajanan' : s.key}_at`],
    }))
  ].filter(t => !!t.at).sort((a, b) => new Date(a.at!).getTime() - new Date(b.at!).getTime());

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans">
      {/* HEADER */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-[50] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#0284c7] rounded-lg flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <span className="font-extrabold text-[#0f172a] text-lg tracking-tight hidden sm:block">Rekam Jejak PAK</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800">{user?.nama || '-'}</p>
            <p className="text-[10px] text-slate-400 font-medium">Akun Pekerja</p>
          </div>
          <div className="h-9 w-9 rounded-full overflow-hidden border-2 border-[#0284c7] shadow-sm">
            {photo ? <img src={photo} alt="foto" className="w-full h-full object-cover object-top" /> :
              <div className="w-full h-full bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] flex items-center justify-center text-white text-sm font-bold">
                {user?.nama?.charAt(0)?.toUpperCase() || 'P'}
              </div>}
          </div>
          <button onClick={openProfileEdit} title="Pengaturan Profil" className="p-2 rounded-lg text-slate-400 hover:text-[#0284c7] hover:bg-blue-50 transition-all">
            <Settings className="h-4 w-4" />
          </button>
          <button onClick={logout} title="Keluar" className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {incompleteData.length > 0 && (
          <div className="bg-amber-50/90 backdrop-blur-md border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500 sticky top-[80px] z-[40] shadow-lg shadow-amber-900/5 mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black text-amber-900">Data Pajanan Belum Lengkap!</p>
                <p className="text-xs text-amber-700 font-medium">Ada {incompleteData.length} riwayat pekerjaan yang belum memiliki data pajanan. Hal ini penting untuk deteksi Penyakit Akibat Kerja.</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white border-amber-200 text-amber-700 hover:bg-amber-100 font-bold text-[10px]"
              onClick={() => {
                const first = incompleteData[0];
                if (first) {
                  document.getElementById('section-pajanan')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  setTimeout(() => openExposureEdit(first), 500);
                }
              }}
            >
              Lengkapi Sekarang
            </Button>
          </div>
        )}

        <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#0284c7] via-[#0369a1] to-[#0ea5e9] p-8 text-white shadow-xl shadow-blue-100">
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 bg-blue-400/20 rounded-full blur-2xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight">Halo, {user?.nama?.split(' ')[0]}! 👋</h1>
              <p className="text-blue-100 font-medium max-w-md leading-relaxed">
                Selamat datang kembali. Berikut adalah ringkasan rekam jejak kesehatan dan progres advokasi Anda hari ini.
              </p>
              <p className="text-[11px] font-bold text-white/60 bg-white/10 w-fit px-3 py-1 rounded-full border border-white/10">
                NIK: {pekerja?.nik ?? '-'}
              </p>
            </div>
            {adv && (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl flex flex-col items-center min-w-[140px] shadow-lg">
                <div className="relative h-16 w-16 mb-2">
                  <svg className="h-full w-full" viewBox="0 0 36 36">
                    <path className="stroke-white/20" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="stroke-white transition-all duration-1000 ease-out" strokeDasharray={`${pct}, 100`} strokeWidth="3" strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-black italic">{pct}%</div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-50">PROGRES TOTAL</span>
              </div>
            )}
          </div>
        </section>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Briefcase, label: 'Status Kerja', value: job?.status_pekerjaan ?? '-', cls: 'text-blue-600 bg-blue-50' },
            { icon: Building2, label: 'Perusahaan', value: job?.nama_perusahaan ?? '-', cls: 'text-indigo-600 bg-indigo-50' },
            { icon: User2, label: 'Jabatan', value: job?.jabatan ?? '-', cls: 'text-rose-600 bg-rose-50' },
            { icon: MapPin, label: 'Domisili', value: pekerja?.domisili ?? '-', cls: 'text-emerald-600 bg-emerald-50' },
          ].map((c, i) => (
            <Card key={i} className="group rounded-[20px] border-slate-100 shadow-sm p-5 hover:shadow-md transition-all duration-300 bg-white">
              <div className={'w-10 h-10 rounded-xl flex items-center justify-center mb-4 ' + c.cls}>
                <c.icon className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{c.label}</p>
              <p className="text-sm font-bold text-slate-800 break-words leading-relaxed">{c.value}</p>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className={cn("rounded-[24px] border shadow-sm p-6 overflow-hidden relative group", hCfg.bg)}>
            <div className="absolute top-[-20px] right-[-20px] opacity-10 transition-transform group-hover:scale-125 duration-500">
              <HeartPulse className="h-32 w-32" />
            </div>
            <div className="flex items-center gap-2 mb-6 relative z-10">
              <Activity className="h-4 w-4 text-slate-400" />
              <h2 className="text-xs font-black text-slate-400 tracking-widest">STATUS KESEHATAN</h2>
            </div>
            <div className="flex items-center gap-5 relative z-10">
              <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center shadow-inner", hCfg.bg.replace('bg-','bg-white/50 '))}>
                <div className={cn("h-4 w-4 rounded-full animate-ping absolute", hCfg.dot)} />
                <div className={cn("h-4 w-4 rounded-full relative", hCfg.dot)} />
              </div>
              <div>
                <p className={cn("text-xl font-black tracking-tight", hCfg.color)}>{hCfg.label}</p>
                <p className="text-xs font-medium text-slate-500 mt-1">
                  Pembaruan: {medis ? fmt(medis.updated_at) : '-'}
                </p>
              </div>
            </div>
            {medis && (
              <div className="mt-6 bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/50 relative z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Diagnosis Terbaru</p>
                <p className="text-sm font-bold text-slate-800">{medis.hasil_diagnosis ?? '-'}</p>
              </div>
            )}
          </Card>

          <Card className="rounded-[24px] border-slate-100 shadow-sm p-6 overflow-hidden relative group bg-white">
            <div className="absolute top-[-20px] right-[-20px] opacity-[0.03] transition-transform group-hover:rotate-12 duration-500 pointer-events-none">
              <Shield className="h-32 w-32" />
            </div>
            <div className="flex items-center gap-2 mb-6 relative z-10">
              <AlertCircle className="h-4 w-4 text-[#0284c7]" />
              <h2 className="text-xs font-black text-[#94a3b8] tracking-widest">RINGKASAN ADVOKASI</h2>
            </div>
            {adv && !adv.jenis_kasus && (
              <button 
                onClick={openAdvEdit}
                className="absolute top-6 right-6 p-2 rounded-lg text-slate-400 hover:text-[#0284c7] hover:bg-blue-50 transition-all"
                title="Ajukan Advokasi Baru"
              >
                <FileStack className="h-4 w-4" />
              </button>
            )}
            {adv && adv.jenis_kasus ? (
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-5">
                  <div className="h-16 w-16 rounded-2xl bg-blue-50 text-[#0284c7] flex items-center justify-center font-black text-xl shadow-inner">
                    {adv.jenis_kasus}
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-800 tracking-tight">Kasus {adv.jenis_kasus}</p>
                    <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" /> 
                      Progres: {pct}% Selesai
                    </p>
                  </div>
                </div>
                {adv.catatan && (
                  <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 relative group/note overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1.5 flex items-center justify-between gap-1.5">
                      <span className="flex items-center gap-1.5">
                        <FileText className="h-3 w-3" /> 
                        {adv.is_admin_note ? 'Catatan Admin' : 'Catatan Mandiri'}
                      </span>
                      {adv.is_admin_note && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[8px] border border-blue-200">
                          DIPERBARUI OLEH ADMIN
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-700 leading-relaxed italic">
                      "{adv.catatan}"
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center relative z-10 flex flex-col items-center gap-4">
                <p className="text-sm text-slate-400 font-medium italic">Belum ada kasus advokasi aktif.</p>
                <Button 
                  onClick={openAdvEdit}
                  variant="outline"
                  className="rounded-xl border-blue-200 text-[#0284c7] hover:bg-blue-50 font-bold text-xs"
                >
                  Ajukan Advokasi Baru
                </Button>
              </div>
            )}
          </Card>
        </div>

        {adv && (
          <Card className="rounded-[24px] border-slate-100 shadow-sm p-6 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 mb-8">
              <Activity className="h-4 w-4 text-[#0284c7]" />
              <h2 className="text-xs font-black text-[#94a3b8] tracking-widest uppercase">Tahapan Advokasi</h2>
            </div>
            <div className="flex items-start min-w-[700px]">
              {STEPS.map((step, i) => {
                const isDone = !!(adv?.[step.key]);
                const isActive = !isDone && (i === 0 || !!(adv?.[STEPS[i-1]?.key]));
                const Icon = step.icon;
                return (
                  <div key={step.key} className="flex items-start flex-1 last:flex-none">
                    <div className="flex flex-col items-center min-w-[100px]">
                      <div className={cn(
                        "h-12 w-12 rounded-full flex items-center justify-center border-[3px] transition-all duration-500",
                        isDone ? step.color + " border-transparent text-white shadow-lg" : 
                        isActive ? "bg-white border-[#0284c7] text-[#0284c7] shadow-lg shadow-sky-100" : 
                        "bg-slate-50 border-slate-200 text-slate-300"
                      )}>
                        {isDone ? <CheckCircle2 className="h-6 w-6" /> : <Icon className="h-5 w-5" />}
                      </div>
                      <p className={cn("text-[10px] font-black mt-3 text-center uppercase tracking-tight", (isDone || isActive ? "text-slate-800" : "text-slate-400"))}>
                        {step.label}
                      </p>
                      <p className={cn("text-[9px] font-bold mt-1", (isDone ? "text-emerald-500" : isActive ? "text-[#0284c7] animate-pulse" : "text-slate-300"))}>
                        {isDone ? 'Selesai' : isActive ? 'Di Proses' : 'Menunggu'}
                      </p>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={cn("flex-1 h-[3px] mt-[22px] mx-1 rounded-full transition-colors duration-1000", (isDone ? "bg-emerald-400" : "bg-slate-100"))} />
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {adv && (
          <Card className="rounded-[24px] border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <FileStack className="h-4 w-4 text-[#0284c7]" />
                <h2 className="text-xs font-black text-[#94a3b8] tracking-widest uppercase">Dokumen Bukti</h2>
              </div>
            </div>
            <div className="space-y-4">
              {STEPS.map((step, i) => {
                const isDone = !!(adv?.[step.key]);
                const isActive = !isDone && (i === 0 || !!(adv?.[STEPS[i-1]?.key]));
                const docKey = DOC_KEYS.find(d => d.key === step.key);
                const hasDoc = docKey ? (adv?.[docKey.pathKey] as string | undefined) : undefined;
                const docDate = docKey ? (adv?.[docKey.dateKey] as string | undefined) : undefined;
                const Icon = step.icon;
                return (
                  <div key={step.key} className={cn(
                    "flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl border transition-all",
                    isDone ? "bg-emerald-50/40 border-emerald-100" :
                    isActive ? "bg-blue-50/40 border-blue-100 ring-1 ring-blue-500/10 shadow-sm" :
                    "bg-slate-50/50 border-slate-100 opacity-60"
                  )}>
                    <div className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                      isDone ? step.color + " text-white" :
                      isActive ? "bg-white border-2 border-blue-500 text-blue-600" :
                      "bg-slate-200 text-slate-400"
                    )}>
                      {isDone ? <CheckCircle2 className="h-6 w-6" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className={cn("text-sm font-black", (isDone ? "text-slate-800" : isActive ? "text-blue-700" : "text-slate-400"))}>
                          {docKey?.name ?? step.label}
                        </h4>
                        <span className={cn(
                          "text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider",
                          isDone ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                          isActive ? "bg-blue-100 text-blue-700 border-blue-200" :
                          "bg-slate-100 text-slate-400 border-slate-200"
                        )}>
                          {isDone ? 'SELESAI' : isActive ? 'DI PROSES' : 'MENUNGGU'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {isDone && docDate && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                            <Calendar className="h-3 w-3" /> {fmt(docDate)}
                          </div>
                        )}
                        {isActive && !hasDoc && <p className="text-[10px] text-blue-500 font-bold italic">Unggah dokumen untuk memulai</p>}
                        {isActive && hasDoc && <p className="text-[10px] text-emerald-600 font-bold italic">Dokumen terunggah</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasDoc && (
                        <button
                          onClick={() => handleViewFile('/pekerja/' + pekerja?.id + '/files/advokasi/' + step.key)}
                          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                      {(isActive || isDone) && (
                        <button
                          onClick={() => { setUploadForm({ step_key: step.key, file: null }); setUploadModal(true); }}
                          className={cn(
                            "p-2.5 rounded-xl border transition-all shadow-sm",
                            (isActive && !hasDoc ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700" : "bg-white border-slate-200 text-slate-400 hover:text-blue-600")
                          )}
                          title="Upload"
                        >
                          <Upload className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        <Card id="section-pajanan" className="rounded-[24px] border-slate-100 shadow-sm p-6 bg-white overflow-hidden relative scroll-mt-32 transition-all duration-500">
          <div className="absolute top-[-20px] right-[-20px] opacity-[0.02] pointer-events-none">
             <Zap className="h-40 w-40" />
          </div>
          <div className="flex items-center gap-2 mb-6 relative z-10">
            <Zap className="h-4 w-4 text-amber-500" />
            <h2 className="text-xs font-black text-[#94a3b8] tracking-widest uppercase">Riwayat Pajanan (Exposure History)</h2>
          </div>
          
          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-sm text-left border-separate border-spacing-y-2">
              <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-4 py-2">Perusahaan / Proyek</th>
                  <th className="px-4 py-2">Jenis Pajanan</th>
                  <th className="px-4 py-2">APD yang Digunakan</th>
                  <th className="px-4 py-2">Durasi</th>
                  <th className="px-4 py-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pekerja?.riwayat_pekerja?.some((r: any) => r.jenis_pajanan || r.durasi_pajanan || r.informal_data) ? (
                  pekerja.riwayat_pekerja.map((r: any, idx: number) => {
                    const hasData = r.jenis_pajanan || r.durasi_pajanan || r.informal_data;
                    if (!hasData) return null;
                    
                    return (
                      <tr key={idx} className="group">
                        <td className="px-4 py-4 bg-slate-50/50 rounded-l-2xl border-y border-l border-slate-100 group-hover:bg-blue-50/30 transition-colors">
                          <p className="font-bold text-slate-800">{r.nama_perusahaan}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{r.jabatan || 'Pekerja'}</p>
                        </td>
                        <td className="px-4 py-4 bg-slate-50/50 border-y border-slate-100 group-hover:bg-blue-50/30 transition-colors">
                          <span className="inline-flex px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[10px] font-black uppercase tracking-wide border border-amber-100">
                            {r.jenis_pajanan || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-4 bg-slate-50/50 border-y border-slate-100 group-hover:bg-blue-50/30 transition-colors">
                           <div className="flex flex-col gap-1.5">
                             {(() => {
                                try {
                                  const info = typeof r.informal_data === 'string' ? JSON.parse(r.informal_data) : r.informal_data;
                                  const provided = info?.apd_disediakan;
                                  const own = info?.jenis_apd_sendiri;
                                  const legacy = info?.apd_list;
                                  
                                  const hasProvided = provided && provided !== '-' && provided.toLowerCase() !== 'tidak ada';
                                  const hasOwn = own && own !== '-' && own.toLowerCase() !== 'tidak ada';

                                  if (!hasProvided && !hasOwn && !legacy) return <span className="text-slate-400 italic text-[11px]">-</span>;

                                  return (
                                    <div className="flex flex-col gap-2 py-1">
                                      {hasProvided && (
                                        <div className="flex flex-col">
                                          <span className="text-[8px] font-black text-blue-500 uppercase tracking-tighter mb-0.5">Disediakan Perusahaan:</span>
                                          <span className="text-[11px] text-slate-700 font-bold leading-snug">{provided}</span>
                                        </div>
                                      )}
                                      {hasOwn && (
                                        <div className="flex flex-col">
                                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Milik Mandiri:</span>
                                          <span className="text-[11px] text-slate-700 font-bold leading-snug">{own}</span>
                                        </div>
                                      )}
                                      {!hasProvided && !hasOwn && legacy && (
                                         <div className="flex flex-col">
                                           <span className="text-[8px] font-black text-blue-400 uppercase tracking-tighter mb-0.5">Riwayat APD:</span>
                                           <span className="text-[11px] text-slate-600 font-medium leading-snug">{legacy}</span>
                                         </div>
                                      )}
                                    </div>
                                  );
                                } catch(e) { return <span className="text-slate-400">-</span>; }
                             })()}
                           </div>
                        </td>
                         <td className="px-4 py-4 bg-slate-50/50 border-y border-slate-100 group-hover:bg-blue-50/30 transition-colors text-right whitespace-nowrap">
                           <span className="inline-flex items-center px-2.5 py-1 bg-white text-slate-700 rounded-full border border-slate-200 text-[11px] font-black shadow-sm">
                             {r.durasi_pajanan ? `${r.durasi_pajanan} Tahun` : '-'}
                           </span>
                         </td>
                        <td className="px-4 py-4 bg-slate-50/50 rounded-r-2xl border-y border-r border-slate-100 group-hover:bg-blue-50/30 transition-colors text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openExposureEdit(r)}
                            className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-slate-400 italic">
                      Tidak ada data riwayat pajanan yang tercatat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="rounded-[24px] border-slate-100 shadow-sm p-6 bg-white">
            <div className="flex items-center gap-2 mb-6">
              <Briefcase className="h-4 w-4 text-[#0284c7]" />
              <h2 className="text-xs font-black text-[#94a3b8] tracking-widest uppercase">Pilih Pekerjaan</h2>
            </div>
            {(pekerja?.riwayat_pekerja?.length ?? 0) > 0 ? (
              <div className="space-y-3">
                {pekerja!.riwayat_pekerja!.map((r, i: number) => (
                  <button 
                    key={i} 
                    onClick={() => setSelectedRiwayatId(r.id)}
                    className={cn(
                      "w-full text-left p-4 rounded-2xl border transition-all hover:shadow-md",
                      selectedRiwayatId === r.id 
                        ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100 scale-[1.02]" 
                        : "bg-slate-50 border-slate-100 text-slate-800 hover:bg-slate-100"
                    )}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-xs font-black truncate", selectedRiwayatId === r.id ? "text-white" : "text-slate-800")}>{r.nama_perusahaan}</p>
                        <p className={cn("text-[10px] font-bold mt-0.5", selectedRiwayatId === r.id ? "text-blue-100" : "text-slate-500")}>{r.jabatan}</p>
                        <div className={cn("flex items-center gap-1 mt-2 text-[9px] font-bold", selectedRiwayatId === r.id ? "text-blue-200" : "text-slate-400")}>
                          <Calendar className="h-2.5 w-2.5" /> {fmt(r.tgl_masuk)} - {r.tgl_keluar ? fmt(r.tgl_keluar) : 'Sekarang'}
                        </div>
                      </div>
                      {!r.tgl_keluar && <span className={cn("text-[8px] font-black px-1.5 py-0.5 rounded-full", selectedRiwayatId === r.id ? "bg-white text-blue-600" : "bg-blue-600 text-white")}>AKTIF</span>}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic text-center py-10">Belum ada data riwayat.</p>
            )}
          </Card>

          <Card className="rounded-[24px] border-slate-100 shadow-sm p-6 bg-white min-h-[400px]">
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <HeartPulse className="h-4 w-4 text-[#0284c7]" />
                <h2 className="text-xs font-black text-[#94a3b8] tracking-widest uppercase">Riwayat Kesehatan di Perusahaan Ini</h2>
              </div>
              {selectedRiwayatId && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50/50 text-blue-700 rounded-2xl border border-blue-100/50 w-fit">
                  <div className="h-6 w-6 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-100">
                    <Building2 className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-tight pr-1">
                    {pekerja?.riwayat_pekerja?.find((r) => r.id === selectedRiwayatId)?.nama_perusahaan}
                  </span>
                </div>
              )}
            </div>
            
            {(() => {
              const selectedJob = pekerja?.riwayat_pekerja?.find((r: any) => r.id === selectedRiwayatId);
              const medicalRecords = selectedJob?.detail_medis || [];
              
              if (medicalRecords.length > 0) {
                return (
                  <div className="space-y-4">
                    {medicalRecords.map((m: any, idx: number) => (
                      <div key={idx} className="p-5 rounded-[20px] bg-slate-50/50 border border-slate-100 hover:border-blue-200 transition-all">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                              <ClipboardList className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-800">{m.jenis_pemeriksa || m.jenis_pemeriksaan || '-'}</p>
                              <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> {fmt(m.tgl_pemeriksaan || m.tanggal_pemeriksaan)}
                              </p>
                            </div>
                          </div>
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                            m.status_kesehatan === 'sehat' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                            m.status_kesehatan === 'tidak_sehat' ? "bg-red-50 text-red-600 border-red-100" :
                            "bg-amber-50 text-amber-600 border-amber-100"
                          )}>
                            {formatHealthStatus(m.status_kesehatan)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Diagnosis</p>
                            <p className="text-xs text-slate-700 font-bold leading-relaxed">{m.hasil_diagnosis || '-'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rekomendasi</p>
                            <p className="text-xs text-slate-700 font-bold leading-relaxed italic">{m.rekomendasi || '-'}</p>
                          </div>
                          <div className="space-y-1 col-span-2 pt-2 border-t border-slate-100">
                             <div className="flex items-center justify-between">
                               <div className="flex items-center gap-2">
                                  <User className="h-3 w-3 text-slate-400" />
                                  <p className="text-[10px] font-bold text-slate-500">Pemeriksa: <span className="text-slate-700">{m.dokter_pemeriksa || m.dokter || '-'}</span></p>
                               </div>
                               {m.file_hasil && (
                                 <Button 
                                   variant="ghost" 
                                   size="sm" 
                                   onClick={() => handleViewFile('/detail-medis/' + m.id + '/file')}
                                   className="h-7 text-[9px] font-black text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                 >
                                   <Download className="h-3 w-3 mr-1" /> Unduh Berkas
                                 </Button>
                               )}
                             </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }
              return (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                  <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center border-2 border-dashed border-slate-200">
                    <HeartPulse className="h-8 w-8 text-slate-300" />
                  </div>
                  <div className="max-w-[200px]">
                    <p className="text-sm font-black text-slate-800">Tidak Ada Data Medis</p>
                    <p className="text-[10px] text-slate-400 font-medium">Belum ada catatan kesehatan yang terlampir untuk periode pekerjaan ini.</p>
                  </div>
                </div>
              );
            })()}
          </Card>
        </div>

        {timeline.length > 0 && (
          <div className="grid lg:grid-cols-1 gap-8">
            <Card className="rounded-[24px] border-slate-100 shadow-sm p-6 bg-white">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="h-4 w-4 text-[#0284c7]" />
                <h2 className="text-xs font-black text-[#94a3b8] tracking-widest uppercase">Lini Masa Aktivitas</h2>
              </div>
              <div className="relative space-y-6 before:absolute before:inset-0 before:ml-[15.5px] before:h-full before:w-[2px] before:bg-slate-100">
                {timeline.map((t, i) => {
                  const Icon = t.icon;
                  const isLast = i === timeline.length - 1;
                  return (
                    <div key={i} className="relative flex items-start gap-4 group">
                      <div className={cn(
                        "relative z-10 flex items-center justify-center h-8 w-8 rounded-full border-2 border-white shadow-sm shrink-0 transition-transform group-hover:scale-110",
                        t.color
                      )}>
                        <Icon className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="flex-1 pt-0.5 pb-2">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{t.label}</p>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                            BERHASIL
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                          <Calendar className="h-3 w-3" /> {fmt(t.at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}
      </main>

      {uploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !uploading && setUploadModal(false)} />
          <Card className="relative w-full max-w-md rounded-[24px] shadow-2xl bg-white border-none overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800">Unggah Dokumen</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Pastikan file berformat PDF/JPG/PNG dan terbaca jelas.</p>
            </div>
            <form onSubmit={handleUpload} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tahapan Dokumen</label>
                <select 
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={uploadForm.step_key}
                  onChange={(e) => setUploadForm({ ...uploadForm, step_key: e.target.value })}
                >
                  <option value="" disabled hidden>Pilih Tahapan...</option>
                  {STEPS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">File Dokumen</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="h-24 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 group-hover:border-blue-400 transition-all bg-slate-50/50">
                    <Upload className="h-6 w-6 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    <p className="text-[11px] font-bold text-slate-400 group-hover:text-blue-600">
                      {uploadForm.file ? uploadForm.file.name : 'Klik atau tarik file ke sini'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setUploadModal(false)} disabled={uploading} className="flex-1 h-11 rounded-xl font-bold text-slate-500">Batal</Button>
                <Button type="submit" disabled={uploading} className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-100">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                  Unggah
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Profile Edit Modal */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-800">Edit Profil Saya</DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-500">
              Perbarui informasi kontak agar tim advokasi dapat menghubungi Anda dengan mudah.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile} className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="wa" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nomor WhatsApp</Label>
              <Input 
                id="wa"
                placeholder="Contoh: 08123456789"
                className="rounded-xl bg-slate-50 border-slate-200 h-11 font-bold focus:ring-blue-500"
                value={profileForm.whatsapp}
                onChange={(e) => setProfileForm({...profileForm, whatsapp: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alamat Domisili</Label>
              <Textarea 
                id="addr"
                placeholder="Masukkan alamat tinggal Anda saat ini..."
                className="rounded-xl bg-slate-50 border-slate-200 min-h-[100px] font-bold focus:ring-blue-500"
                value={profileForm.domisili}
                onChange={(e) => setProfileForm({...profileForm, domisili: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="photo" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pas Foto Baru (Opsional)</Label>
              <Input 
                id="photo"
                type="file"
                accept="image/*"
                className="rounded-xl bg-slate-50 border-slate-200 h-11 cursor-pointer pt-2"
                onChange={(e) => setProfileForm({...profileForm, pas_foto: e.target.files?.[0] || null})}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" disabled={profileLoading} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-lg shadow-blue-100 transition-all">
                {profileLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Advocacy Edit Modal */}
      <Dialog open={isAdvModalOpen} onOpenChange={setIsAdvModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-800">Ajukan Advokasi Baru</DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-500">
              Lengkapi informasi dasar untuk memulai proses pendampingan advokasi Anda.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateAdvokasi} className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori Kasus</Label>
              <Select 
                value={advForm.jenis_kasus} 
                onValueChange={(v) => setAdvForm({...advForm, jenis_kasus: v || ''})}
              >
                <SelectTrigger className="rounded-xl bg-slate-50 border-slate-200 h-11 font-bold focus:ring-blue-500">
                  <SelectValue placeholder="Pilih Kategori..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100">
                  {Object.entries(JENIS).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="font-bold text-slate-700">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="adv-note" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Catatan / Pesan untuk Admin</Label>
              <Textarea 
                id="adv-note"
                placeholder="Jelaskan secara singkat kronologi atau kebutuhan Anda..."
                className="rounded-xl bg-slate-50 border-slate-200 min-h-[120px] font-bold focus:ring-blue-500"
                value={advForm.catatan}
                onChange={(e) => setAdvForm({...advForm, catatan: e.target.value})}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" disabled={advLoading} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-lg shadow-blue-100 transition-all">
                {advLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileStack className="h-4 w-4 mr-2" />}
                Ajukan Advokasi Sekarang
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Exposure Edit Modal */}
      <Dialog open={isExposureModalOpen} onOpenChange={setIsExposureModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-800">Lengkapi Data Pajanan</DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-500">
              Informasi pajanan di {exposureForm.nama_perusahaan} sangat penting untuk mendeteksi Penyakit Akibat Kerja (PAK).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateExposure} className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jenis Pajanan</Label>
              <Select 
                value={exposureForm.jenis_pajanan} 
                onValueChange={(v) => setExposureForm({...exposureForm, jenis_pajanan: v || ''})}
              >
                <SelectTrigger className="rounded-xl bg-slate-50 border-slate-200 h-11 font-bold focus:ring-blue-500">
                  <SelectValue placeholder="Pilih Jenis Pajanan..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100">
                  <SelectItem value="Kimia" className="font-bold text-slate-700">Kimia</SelectItem>
                  <SelectItem value="Fisik" className="font-bold text-slate-700">Fisik (Bising/Getaran)</SelectItem>
                  <SelectItem value="Biologi" className="font-bold text-slate-700">Biologi</SelectItem>
                  <SelectItem value="Psikososial" className="font-bold text-slate-700">Psikososial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="durasi" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Durasi Pajanan (Tahun)</Label>
              <Input 
                id="durasi"
                type="number"
                placeholder="Contoh: 3"
                className="rounded-xl bg-slate-50 border-slate-200 h-11 font-bold focus:ring-blue-500"
                value={exposureForm.durasi_pajanan}
                onChange={(e) => setExposureForm({...exposureForm, durasi_pajanan: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apd_dist" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">APD yang Disediakan Perusahaan</Label>
              <Input 
                id="apd_dist"
                placeholder="Contoh: Masker N95, Sarung Tangan..."
                className="rounded-xl bg-slate-50 border-slate-200 h-11 font-bold focus:ring-blue-500"
                value={exposureForm.apd_disediakan}
                onChange={(e) => setExposureForm({...exposureForm, apd_disediakan: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apd_own" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">APD yang Dibawa Mandiri</Label>
              <Input 
                id="apd_own"
                placeholder="Contoh: Masker Kain sendiri..."
                className="rounded-xl bg-slate-50 border-slate-200 h-11 font-bold focus:ring-blue-500"
                value={exposureForm.jenis_apd_sendiri}
                onChange={(e) => setExposureForm({...exposureForm, jenis_apd_sendiri: e.target.value})}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" disabled={exposureLoading} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-lg shadow-blue-100 transition-all">
                {exposureLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Simpan Data Pajanan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
