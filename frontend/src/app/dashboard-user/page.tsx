'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import Cookies from 'js-cookie';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import {
  User2, Building2, Briefcase, MapPin, HeartPulse, ShieldCheck,
  Search, Stethoscope, FileText, Scale, Coins, Clock, LogOut,
  Download, CheckCircle2, AlertCircle, Loader2, FileStack, Activity, Upload,
  Calendar, Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace('/api', '');

const healthConfig: Record<string,{label:string;color:string;bg:string;dot:string}> = {
  sehat: { label:'Sehat / Fit', color:'text-emerald-700', bg:'bg-emerald-50 border-emerald-200', dot:'bg-emerald-500' },
  sehat_dengan_catatan: { label:'Sehat dengan Catatan', color:'text-amber-700', bg:'bg-amber-50 border-amber-200', dot:'bg-amber-500' },
  tidak_sehat: { label:'Tidak Sehat / Unfit', color:'text-rose-700', bg:'bg-rose-50 border-rose-200', dot:'bg-rose-500' },
};

const STEPS = [
  { key:'riwayat_pajanan', label:'Pajanan', icon:Search, color:'bg-blue-500' },
  { key:'persetujuan_dokter', label:'Diagnosis', icon:Stethoscope, color:'bg-emerald-500' },
  { key:'perusahaan_lapor', label:'Pelaporan', icon:FileText, color:'bg-amber-500' },
  { key:'penetapan_pak', label:'Penetapan', icon:Scale, color:'bg-indigo-500' },
  { key:'kompensasi_bpjstk', label:'Kompensasi', icon:Coins, color:'bg-rose-500' },
  { key:'rehabilitasi_bpjskes', label:'Rehabilitasi', icon:HeartPulse, color:'bg-sky-500' },
];

const DOC_KEYS = [
  { key:'riwayat_pajanan', name:'Bukti Pajanan', pathKey:'bukti_pajanan_path', dateKey:'bukti_pajanan_at' },
  { key:'persetujuan_dokter', name:'Diagnosis Dokter', pathKey:'bukti_persetujuan_dokter_path', dateKey:'bukti_persetujuan_dokter_at' },
  { key:'perusahaan_lapor', name:'Laporan Perusahaan', pathKey:'bukti_perusahaan_lapor_path', dateKey:'bukti_perusahaan_lapor_at' },
  { key:'penetapan_pak', name:'Penetapan PAK', pathKey:'bukti_penetapan_pak_path', dateKey:'bukti_penetapan_pak_at' },
  { key:'kompensasi_bpjstk', name:'Kompensasi BPJSTK', pathKey:'bukti_kompensasi_bpjstk_path', dateKey:'bukti_kompensasi_bpjstk_at' },
  { key:'rehabilitasi_bpjskes', name:'Rehabilitasi BPJSKES', pathKey:'bukti_rehabilitasi_bpjskes_path', dateKey:'bukti_rehabilitasi_bpjskes_at' },
];

const JENIS: Record<string,string> = {
  PAK:'Penyakit Akibat Kerja (PAK)', K3:'Kecelakaan Kerja (K3)', PHK:'Pemutusan Hubungan Kerja', JHT:'Jaminan Hari Tua',
};

const fmt = (d: string) => d ? new Date(d).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}) : '-';

export default function UserDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [pekerja, setPekerja] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadModal, setUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({ step_key: '', file: null as File | null });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const userRes = await api.get('/me');
      const u = userRes.data.data;
      setUser(u);
      const pid = u?.pekerja?.id;
      if (pid) {
        const r = await api.get('/pekerja/' + pid);
        setPekerja(r.data.data);
      } else {
        const s = await api.get('/pekerja', { params: { search: u.email } });
        const items = s.data.data?.data || s.data.data || [];
        const match = items.find((p: any) => p.user?.email === u.email);
        if (match) { const r = await api.get('/pekerja/' + match.id); setPekerja(r.data.data); }
      }
    } catch { toast.error('Gagal memuat data dashboard.'); }
    finally { setLoading(false); }
  };


  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.step_key || !uploadForm.file) {
      toast.error('Pilih jenis dokumen dan file terlebih dahulu.');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('step_key', uploadForm.step_key);
      fd.append('file', uploadForm.file);
      const res = await api.post('/pekerja/' + pekerja.id + '/advokasi', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.status === 'success') {
        toast.success('Dokumen berhasil diunggah!');
        setUploadModal(false);
        setUploadForm({ step_key: '', file: null });
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengunggah dokumen.');
    } finally {
      setUploading(false);
    }
  };

  const logout = async () => {
    try { await api.post('/logout'); } catch {}
    Cookies.remove('auth_token', { path: '/' });
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 text-[#0284c7] animate-spin" />
        <p className="text-slate-400 font-medium animate-pulse">Memuat dashboard...</p>
      </div>
    </div>
  );

  const adv = pekerja?.status_advokasi ?? pekerja?.statusAdvokasi ?? null;
  const job = pekerja?.riwayat_pekerja?.find((r: any) => !r.tgl_keluar) ?? pekerja?.riwayat_pekerja?.[0] ?? null;
  const medis = pekerja?.latest_detail_medis ?? pekerja?.detail_medis?.[0] ?? null;
  const hCfg = healthConfig[pekerja?.status_kesehatan ?? 'sehat'] ?? healthConfig.sehat;
  const done = adv ? STEPS.filter(s => adv[s.key]).length : 0;
  const pct = Math.round((done / 6) * 100);
  const photo = pekerja?.pas_foto ? API_BASE + '/storage/profil/' + pekerja.pas_foto : null;
  const docs = adv ? DOC_KEYS.filter(d => adv[d.pathKey]) : [];
  const timeline = [
    { label: 'Terdaftar', at: pekerja?.created_at, icon: Shield, color: 'bg-slate-400' },
    ...STEPS.filter(s => adv && adv[s.key]).map(s => ({
      label: s.label, icon: s.icon, color: s.color,
      at: adv['bukti_' + (s.key === 'riwayat_pajanan' ? 'pajanan' : s.key) + '_at'],
    }))
  ].filter(t => !!t.at).sort((a,b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans">
      {/* HEADER */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm">
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
          <button onClick={logout} title="Keluar" className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
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
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <FileText className="h-3 w-3" /> Catatan Admin
                    </p>
                    <p className="text-xs text-slate-700 leading-relaxed italic">
                      "{adv.catatan}"
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center relative z-10">
                <p className="text-sm text-slate-400 font-medium italic">Belum ada kasus advokasi aktif.</p>
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
                const isDone = !!(adv[step.key]);
                const isActive = !isDone && (i === 0 || !!(adv[STEPS[i-1]?.key]));
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

        {adv && adv.jenis_kasus && (
          <Card className="rounded-[24px] border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#0284c7]" />
                <h2 className="text-xs font-black text-[#94a3b8] tracking-widest uppercase">Daftar Dokumen & Status</h2>
              </div>
            </div>
            <div className="space-y-4">
              {STEPS.map((step, i) => {
                const isDone = !!(adv[step.key]);
                const isActive = !isDone && (i === 0 || !!(adv[STEPS[i-1]?.key]));
                const docKey = DOC_KEYS.find(d => d.key === step.key);
                const hasDoc = docKey && adv[docKey.pathKey];
                const docDate = docKey && adv[docKey.dateKey];
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
                          onClick={() => window.open(API_BASE + '/pekerja/' + pekerja?.id + '/files/advokasi/' + step.key, '_blank')}
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

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="rounded-[24px] border-slate-100 shadow-sm p-6 bg-white">
            <div className="flex items-center gap-2 mb-6">
              <Briefcase className="h-4 w-4 text-[#0284c7]" />
              <h2 className="text-xs font-black text-[#94a3b8] tracking-widest uppercase">Riwayat Pekerjaan</h2>
            </div>
            {pekerja?.riwayat_pekerja?.length > 0 ? (
              <div className="space-y-4">
                {pekerja.riwayat_pekerja.slice(0, 4).map((r: any, i: number) => (
                  <div key={i} className={cn(
                    "p-4 rounded-2xl border transition-all hover:shadow-md",
                    !r.tgl_keluar ? "bg-blue-50/50 border-blue-100" : "bg-slate-50 border-slate-100"
                  )}>
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-slate-800 truncate">{r.nama_perusahaan}</p>
                        <p className="text-[11px] font-bold text-slate-500 mt-0.5">{r.jabatan}</p>
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 font-bold">
                          <Calendar className="h-3 w-3" /> {fmt(r.tgl_masuk)} - {r.tgl_keluar ? fmt(r.tgl_keluar) : 'Sekarang'}
                        </div>
                      </div>
                      {!r.tgl_keluar && <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">AKTIF</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic text-center py-10">Belum ada data riwayat.</p>
            )}
          </Card>

          {timeline.length > 0 && (
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
          )}
        </div>
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
                  <option value="">Pilih Tahapan...</option>
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
    </div>
  );
}
