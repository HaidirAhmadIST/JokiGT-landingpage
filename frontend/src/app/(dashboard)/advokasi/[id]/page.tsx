'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  ImageIcon,
  ArrowLeft,
  User2,
  Stethoscope,
  Clock,
  FileStack,
} from 'lucide-react';

// Mock detailed data keyed by ID
const caseDetails: Record<string, any> = {
  '1': {
    code: 'ADV-00129', statusLabel: 'DALAM PROSES',
    title: 'Penyakit Akibat Kerja - Asbes',
    stages: [
      { name: 'UPTD', status: 'Selesai', active: false, done: true },
      { name: 'BPJS (MEDIASI 1)', status: 'Aktif', active: true, done: false },
      { name: 'COURT', status: 'Menunggu', active: false, done: false },
    ],
    worker: { name: 'Bambang Pamungkas', nik: '3275012304900001', company: 'PT. Teknologi Maju', job: 'Operator Alat Berat' },
    caseDetail: { type: 'Asbes (Penyakit Kerja)', date: '12 Oktober 2023', note: 'Keluhan sesak napas setelah bekerja 10 tahun di area pengolahan material bangunan. Pasien mulai merasa kelelahan ekstrem saat melakukan aktivitas fisik ringan di lokasi proyek.' },
    timeline: [
      { date: '15 Okt', label: 'Verifikasi Dokumen (UPTD)', by: 'Oleh Admin Utama', active: false },
      { date: '20 Okt', label: 'Mediasi 1 (BPJS)', by: 'SEDANG BERLANGSUNG - ADMIN', active: true },
    ],
    documents: [
      { name: 'Surat Pengantar UPTD....', size: '2 MB', date: '15 Okt 2023', icon: 'pdf' },
      { name: 'Hasil Lab RS.jpg', size: '4 MB', date: '18 Okt 2023', icon: 'img' },
    ],
    medis: { diagnosis: 'Asbestosis Kronis', file: 'Hasil Rontgen.pdf', recommendations: ['PINDAH AREA NON-PAJANAN', 'PENGOBATAN RUTIN'] },
  },
  '2': {
    code: 'ADV-00130', statusLabel: 'SELESAI',
    title: 'Pemutusan Hubungan Kerja',
    stages: [
      { name: 'UPTD', status: 'Selesai', active: false, done: true },
      { name: 'BPJS', status: 'Selesai', active: false, done: true },
      { name: 'COURT', status: 'Selesai', active: false, done: true },
    ],
    worker: { name: 'Siti Rahmawati', nik: '3275034509850002', company: 'CV. Agrikultur Jaya', job: 'Pekerja Lapangan' },
    caseDetail: { type: 'Pemutusan Hubungan Kerja', date: '10 Oktober 2023', note: 'Pekerja diberhentikan secara sepihak tanpa pesangon setelah didiagnosa mengalami gangguan pernapasan akibat paparan pestisida.' },
    timeline: [
      { date: '10 Okt', label: 'Pendaftaran Kasus (UPTD)', by: 'Oleh Admin', active: false },
      { date: '15 Okt', label: 'Mediasi BPJS', by: 'Oleh Mediator', active: false },
      { date: '20 Okt', label: 'Sidang Pengadilan', by: 'Selesai', active: false },
    ],
    documents: [
      { name: 'Surat PHK.pdf', size: '1 MB', date: '10 Okt 2023', icon: 'pdf' },
    ],
    medis: { diagnosis: 'Gangguan Pernapasan', file: 'Rekam Medis.pdf', recommendations: ['ISTIRAHAT TOTAL', 'TERAPI REHABILITASI'] },
  },
  '3': {
    code: 'ADV-00131', statusLabel: 'DALAM PROSES',
    title: 'Keselamatan Kerja (K3)',
    stages: [
      { name: 'UPTD', status: 'Aktif', active: true, done: false },
      { name: 'BPJS', status: 'Menunggu', active: false, done: false },
      { name: 'COURT', status: 'Menunggu', active: false, done: false },
    ],
    worker: { name: 'Agus Mulyadi', nik: '3275078712900003', company: 'PT. Logistik Cepat', job: 'Sopir Truk' },
    caseDetail: { type: 'Keselamatan Kerja (K3)', date: '08 Oktober 2023', note: 'Kecelakaan saat bongkar muat barang di gudang. Pekerja mengalami patah tulang kaki kanan.' },
    timeline: [
      { date: '08 Okt', label: 'Verifikasi Dokumen (UPTD)', by: 'SEDANG BERLANGSUNG', active: true },
    ],
    documents: [
      { name: 'Laporan Kecelakaan.pdf', size: '3 MB', date: '08 Okt 2023', icon: 'pdf' },
    ],
    medis: { diagnosis: 'Fraktur Tibia Dextra', file: 'Hasil X-Ray.pdf', recommendations: ['OPERASI TULANG', 'REHABILITASI MEDIS'] },
  },
  '4': {
    code: 'ADV-00132', statusLabel: 'DALAM PROSES',
    title: 'Jaminan Hari Tua',
    stages: [
      { name: 'UPTD', status: 'Selesai', active: false, done: true },
      { name: 'BPJS', status: 'Aktif', active: true, done: false },
      { name: 'COURT', status: 'Menunggu', active: false, done: false },
    ],
    worker: { name: 'Dewi Handayani', nik: '3275091234560004', company: 'PT. Garmen Indah', job: 'Penjahit Senior' },
    caseDetail: { type: 'Jaminan Hari Tua', date: '05 Oktober 2023', note: 'Klaim JHT ditolak oleh BPJS dengan alasan administrasi. Pekerja telah bekerja selama 25 tahun.' },
    timeline: [
      { date: '05 Okt', label: 'Pendaftaran Kasus (UPTD)', by: 'Oleh Admin', active: false },
      { date: '12 Okt', label: 'Review Dokumen BPJS', by: 'DOKUMEN DITOLAK', active: true },
    ],
    documents: [
      { name: 'Dokumen JHT.pdf', size: '2 MB', date: '05 Okt 2023', icon: 'pdf' },
    ],
    medis: { diagnosis: '-', file: '-', recommendations: [] },
  },
};

export default function AdvokasiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const data = caseDetails[id] || caseDetails['1'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => router.push('/advokasi')} className="text-slate-400 hover:text-slate-700 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-bold text-[#0284c7]">{data.code}</span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
              {data.statusLabel}
            </span>
          </div>
          <h1 className="text-[24px] font-extrabold tracking-tight text-[#0f172a]">{data.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-10 px-5 font-bold text-slate-700 border-slate-200">
            <Printer className="mr-2 h-4 w-4" /> Export PDF
          </Button>
          <Button className="h-10 px-5 font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white">
            <Pencil className="mr-2 h-4 w-4" /> Edit Kasus
          </Button>
        </div>
      </div>

      {/* Progress Stepper — full width with long connecting lines */}
      <Card className="rounded-[20px] shadow-sm border-slate-100 px-10 py-10">
        <div className="flex items-start w-full">
          {data.stages.map((stage: any, i: number) => (
            <div key={i} className="flex items-start flex-1 last:flex-none">
              {/* Node + Label */}
              <div className="flex flex-col items-center min-w-[80px]">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center border-[3px] transition-all ${
                  stage.done ? 'bg-[#0284c7] border-[#0284c7] text-white shadow-lg shadow-sky-200' :
                  stage.active ? 'bg-white border-[#0284c7] text-[#0284c7] shadow-lg shadow-sky-100' :
                  'bg-slate-50 border-slate-200 text-slate-400'
                }`}>
                  {stage.done ? <CheckCircle2 className="h-6 w-6" /> :
                   stage.active ? <ClipboardList className="h-6 w-6" /> :
                   <Waves className="h-6 w-6" />}
                </div>
                <p className={`text-[11px] font-bold mt-2.5 text-center whitespace-nowrap ${stage.active || stage.done ? 'text-[#0284c7]' : 'text-slate-400'}`}>
                  {stage.name}
                </p>
                <p className={`text-[10px] font-medium mt-0.5 ${stage.active ? 'text-[#0284c7]' : 'text-slate-400'}`}>
                  {stage.status}
                </p>
              </div>
              {/* Long connecting line */}
              {i < data.stages.length - 1 && (
                <div className={`flex-1 h-[3px] mt-[22px] mx-1 rounded-full ${stage.done ? 'bg-[#0284c7]' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Main Content Grid */}
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
              <div className="h-20 w-20 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                <User2 className="h-10 w-10 text-slate-300" />
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 flex-1">
                <div>
                  <p className="text-[10px] font-bold text-[#94a3b8] tracking-wider">NAMA LENGKAP</p>
                  <p className="text-sm font-bold text-[#1e293b] mt-0.5">{data.worker.name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#94a3b8] tracking-wider">NIK</p>
                  <p className="text-sm font-bold text-[#1e293b] mt-0.5">{data.worker.nik}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#94a3b8] tracking-wider">PERUSAHAAN</p>
                  <p className="text-sm font-bold text-[#1e293b] mt-0.5">{data.worker.company}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#94a3b8] tracking-wider">PEKERJAAN</p>
                  <p className="text-sm font-bold text-[#1e293b] mt-0.5">{data.worker.job}</p>
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
                <p className="text-sm font-bold text-[#1e293b] mt-0.5">{data.caseDetail.type}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#94a3b8] tracking-wider">TANGGAL KEJADIAN</p>
                <p className="text-sm font-bold text-[#1e293b] mt-0.5">{data.caseDetail.date}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#94a3b8] tracking-wider mb-2">CATATAN AWAL</p>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <p className="text-sm text-[#475569] leading-relaxed">{data.caseDetail.note}</p>
              </div>
            </div>
          </Card>

          {/* Data Medis */}
          <Card className="rounded-[20px] shadow-sm border-slate-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <Stethoscope className="h-4 w-4 text-[#0284c7]" />
              <h3 className="text-xs font-bold text-[#94a3b8] tracking-widest">DATA MEDIS</h3>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-5">
              <div>
                <p className="text-[10px] font-bold text-[#94a3b8] tracking-wider">DIAGNOSIS</p>
                <p className="text-sm font-bold text-red-500 mt-0.5">{data.medis.diagnosis}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#94a3b8] tracking-wider">LINK FILE</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <FileText className="h-4 w-4 text-[#0284c7]" />
                  <span className="text-sm font-bold text-[#0284c7] hover:underline cursor-pointer">{data.medis.file}</span>
                </div>
              </div>
            </div>
            {data.medis.recommendations.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-[#94a3b8] tracking-wider mb-2">REKOMENDASI</p>
                <div className="flex gap-2 flex-wrap">
                  {data.medis.recommendations.map((r: string, i: number) => (
                    <span key={i} className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-200 bg-emerald-50 text-emerald-700">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN (1/3) */}
        <div className="space-y-6">
          
          {/* Lini Masa Aktivitas */}
          <Card className="rounded-[20px] shadow-sm border-slate-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <Clock className="h-4 w-4 text-[#0284c7]" />
              <h3 className="text-xs font-bold text-[#94a3b8] tracking-widest">LINI MASA AKTIVITAS</h3>
            </div>
            <div className="space-y-0">
              {data.timeline.map((item: any, i: number) => (
                <div key={i} className="flex gap-4 relative">
                  {/* Vertical Line */}
                  {i < data.timeline.length - 1 && (
                    <div className="absolute left-[13px] top-7 bottom-0 w-0.5 bg-slate-200" />
                  )}
                  {/* Dot */}
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 z-10 ${
                    item.active ? 'bg-[#0284c7] text-white border-2 border-[#0284c7]' : 'bg-white border-2 border-slate-300 text-slate-400'
                  }`}>
                    <div className={`h-2 w-2 rounded-full ${item.active ? 'bg-white' : 'bg-slate-300'}`} />
                  </div>
                  <div className={`pb-6 ${item.active ? '' : ''}`}>
                    <p className="text-[13px] font-bold text-[#1e293b]">{item.date}: {item.label}</p>
                    <p className={`text-[11px] font-semibold mt-0.5 ${item.active ? 'text-[#0284c7]' : 'text-[#94a3b8]'}`}>{item.by}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Dokumen Bukti */}
          <Card className="rounded-[20px] shadow-sm border-slate-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <FileStack className="h-4 w-4 text-[#0284c7]" />
              <h3 className="text-xs font-bold text-[#94a3b8] tracking-widest">DOKUMEN BUKTI</h3>
            </div>
            <div className="space-y-4">
              {data.documents.map((doc: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                    doc.icon === 'pdf' ? 'bg-red-50 text-red-500' : 'bg-purple-50 text-purple-500'
                  }`}>
                    {doc.icon === 'pdf' ? <FileText className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#1e293b] truncate">{doc.name}</p>
                    <p className="text-[10px] text-[#94a3b8] font-medium">{doc.size} · {doc.date}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-3 border-2 border-dashed border-slate-200 rounded-xl text-xs font-bold text-[#94a3b8] hover:border-[#0ea5e9] hover:text-[#0284c7] transition-all flex items-center justify-center gap-2">
              <Upload className="h-4 w-4" /> UNGGAH DOKUMEN BARU
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
