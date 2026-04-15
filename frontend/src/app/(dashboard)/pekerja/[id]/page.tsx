'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Printer, Pin, Mail, Phone, MapPin,
  Briefcase, ShieldAlert, CheckCircle2, Circle, Edit3,
  Download, Image as ImageIcon, Activity, FileText, FileCheck, ClipboardList
} from 'lucide-react';
import { format, differenceInYears, parseISO } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { useRole } from '@/hooks/useRole';
import { Skeleton } from '@/components/ui/skeleton';

export default function PekerjaDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [isEditingCatatan, setIsEditingCatatan] = useState(false);
  const [catatanInput, setCatatanInput] = useState('');
  const [savingCatatan, setSavingCatatan] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | string | null>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(false);
  const { isSuperAdmin, isStaffOrAbove, loading: roleLoading } = useRole();

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/pekerja/${id}`);
      setData(res.data.data);
    } catch (e) {
      toast.error('Gagal mengambil detail pekerja');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  // Simulate fetching when selected job changes
  useEffect(() => {
    if (selectedJobId !== null) {
      setIsHealthLoading(true);
      const timer = setTimeout(() => {
        setIsHealthLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedJobId]);

  // Set default selection to first job
  useEffect(() => {
    if (data?.riwayat_pekerja?.length > 0 && selectedJobId === null) {
      // Find active job first, otherwise first in list
      const activeIdx = data.riwayat_pekerja.findIndex((r: any) => !r.tgl_keluar);
      setSelectedJobId(activeIdx !== -1 ? activeIdx : 0);
    }
  }, [data]);

  const toggleAdvokasi = async (field: string, checked: boolean) => {
    try {
      await api.post(`/pekerja/${id}/advokasi`, { [field]: checked });
      toast.success('Status advokasi diperbarui');
      fetchDetail();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal memperbarui status');
    }
  };

  const handleFileUpload = async (stepKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(stepKey);
    const formData = new FormData();
    formData.append('step_key', stepKey);
    formData.append('file', file);

    try {
      await api.post(`/pekerja/${id}/advokasi`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('File bukti berhasil diunggah');
      fetchDetail();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengunggah file');
    } finally {
      setUploadLoading(null);
    }
  };

  const downloadFile = async (stepKey: string) => {
    try {
      const toastId = toast.loading('Memproses file...');
      const response = await api.get(`/pekerja/${id}/files/advokasi/${stepKey}`, {
        responseType: 'blob',
      });

      const fileUrl = window.URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] }));
      window.open(fileUrl, '_blank');
      toast.dismiss(toastId);
    } catch (error) {
      toast.dismiss();
      toast.error('Gagal membuka dokumen yang terunggah.');
    }
  };

  const downloadMedisDoc = async (medisId: number) => {
    try {
      const toastId = toast.loading('Memproses berkas medis...');
      const response = await api.get(`/medis/${medisId}/file`, {
        responseType: 'blob',
      });
      
      const fileUrl = window.URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] }));
      window.open(fileUrl, '_blank');
      toast.dismiss(toastId);
    } catch (error) {
      toast.dismiss();
      toast.error('Gagal membuka berkas medis.');
    }
  };

  const updateStatusKesehatan = async (newStatus: string) => {
    try {
      setStatusLoading(true);
      await api.put(`/pekerja/${id}`, { status_kesehatan: newStatus });
      toast.success('Status kesehatan berhasil diperbarui');
      setData((prev: any) => ({ ...prev, status_kesehatan: newStatus }));
    } catch (e: any) {
      const status = e.response?.status;
      const msg = status === 403
        ? 'Hanya admin yang dapat mengubah status kesehatan.'
        : e.response?.data?.message || e.response?.data?.errors?.status_kesehatan?.[0] || 'Gagal memperbarui status kesehatan';
      toast.error(msg);
    } finally {
      setStatusLoading(false);
    }
  };

  // Normalize legacy status values to new enum values
  const normalizeStatus = (s: string) => {
    const map: Record<string, string> = {
      'sehat': 'fit',
      'sakit_ringan': 'fit_with_note',
      'sakit': 'unfit',
      'sakit_berat': 'unfit',
    };
    return map[s] || s;
  };

  const getStatusLabel = (s: string) => {
    const normalized = normalizeStatus(s);
    if (normalized === 'fit') return 'Fit';
    if (normalized === 'fit_with_note') return 'Fit with Note';
    if (normalized === 'unfit') return 'Unfit';
    return s;
  };

  const getStatusColor = (s: string) => {
    const normalized = normalizeStatus(s);
    if (normalized === 'fit') return 'text-emerald-600';
    if (normalized === 'fit_with_note') return 'text-amber-600';
    return 'text-rose-600';
  };

  const handleEditCatatan = () => {
    setCatatanInput(data?.catatan_admin || '');
    setIsEditingCatatan(true);
  };

  const handleSaveCatatan = async () => {
    try {
      setSavingCatatan(true);
      await api.put(`/pekerja/${id}`, { catatan_admin: catatanInput });
      toast.success('Catatan berhasil diperbarui');
      setData({ ...data, catatan_admin: catatanInput });
      setIsEditingCatatan(false);
    } catch (e: any) {
      toast.error('Gagal memperbarui catatan');
    } finally {
      setSavingCatatan(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Memuat detail pekerja...</div>;
  if (!data) return <div className="p-8 text-center text-red-500 font-medium">Data pekerja tidak ditemukan.</div>;

  // Derived Data Calculations
  const currentJob = data.riwayat_pekerja?.find((r: any) => !r.tgl_keluar) || data.riwayat_pekerja?.[0];
  let masaKerjaText = '-';
  let sejakText = '-';
  if (currentJob?.tgl_masuk) {
    const masukDate = parseISO(currentJob.tgl_masuk);
    const years = differenceInYears(new Date(), masukDate);
    masaKerjaText = years > 0 ? `${years} Tahun` : '< 1 Tahun';
    sejakText = `Sejak ${format(masukDate, 'MMM yyyy', { locale: localeID })}`;
  }

  const adv = data.status_advokasi;
  const isAdvocacyActive = adv && Object.values(adv).some(v => v === true);
  const advSteps = [
    { key: 'riwayat_pajanan', label: 'Riwayat Pajanan' },
    { key: 'persetujuan_dokter', label: 'Evaluasi Dokter Okupasi' },
    { key: 'perusahaan_lapor', label: 'Laporan Perusahaan' },
    { key: 'penetapan_pak', label: 'Penetapan Sah PAK' },
    { key: 'kompensasi_bpjstk', label: 'Klaim JKK BPJS' },
    { key: 'rehabilitasi_bpjskes', label: 'Rehabilitasi Medik' },
  ];

  // Find current step index (first step that is false)
  const isStepCompleted = (stepKey: string) => {
    if (stepKey === 'riwayat_pajanan' && data?.riwayat_pekerja && data.riwayat_pekerja.length > 0) return true;
    if (stepKey === 'persetujuan_dokter' && data?.detail_medis && data.detail_medis.length > 0) return true;
    return !!adv?.[stepKey];
  };

  const terkiniMedis = data.detail_medis?.[0]; // Assuming first is most recent

  // Interactive Health Filtering Logic
  const filteredHealthRecords = data?.detail_medis?.filter((m: any) => {
    if (selectedJobId === null) return true;
    
    const job = data.riwayat_pekerja?.[selectedJobId as number];
    if (!job) return true;
    
    const checkDate = parseISO(m.tanggal_pemeriksaan || m.tgl_pemeriksaan);
    const startDate = parseISO(job.tgl_masuk);
    const endDate = job.tgl_keluar ? parseISO(job.tgl_keluar) : null;
    
    if (endDate) {
      return checkDate >= startDate && checkDate <= endDate;
    } else {
      return checkDate >= startDate;
    }
  });

  const getFilePath = (stepKey: string) => {
    const map: Record<string, string> = {
      'riwayat_pajanan': 'bukti_pajanan_path',
      'persetujuan_dokter': 'bukti_persetujuan_dokter_path',
      'perusahaan_lapor': 'bukti_perusahaan_lapor_path',
      'penetapan_pak': 'bukti_penetapan_pak_path',
      'kompensasi_bpjstk': 'bukti_kompensasi_bpjstk_path',
      'rehabilitasi_bpjskes': 'bukti_rehabilitasi_bpjskes_path',
    };
    return adv?.[map[stepKey]];
  };

  const currentStepIdx = advSteps.findIndex(step => !isStepCompleted(step.key));
  const activeStepIndex = currentStepIdx === -1 ? advSteps.length : currentStepIdx;

  const getUploadDate = (stepKey: string) => {
    if (!data?.status_advokasi) return null;
    const validColumns: Record<string, string> = {
      riwayat_pajanan: 'bukti_pajanan_at',
      persetujuan_dokter: 'bukti_persetujuan_dokter_at',
      perusahaan_lapor: 'bukti_perusahaan_lapor_at',
      penetapan_pak: 'bukti_penetapan_pak_at',
      kompensasi_bpjstk: 'bukti_kompensasi_bpjstk_at',
      rehabilitasi_bpjskes: 'bukti_rehabilitasi_bpjskes_at'
    };
    return data.status_advokasi[validColumns[stepKey]];
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).format(date);
    } catch (e) {
      return '';
    }
  };

  const completedStepsCount = advSteps.filter(step => !!getFilePath(step.key)).length;

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-20 font-sans text-slate-800">

      {/* Top Navigation Bar Helper */}
      <div className="flex items-center gap-4 mb-6 pt-4 px-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-slate-200 bg-white shadow-sm border border-slate-200">
          <ArrowLeft className="h-4 w-4 text-slate-600" />
        </Button>
        <div className="flex-1">
          <span className="text-sm font-medium text-slate-500">Kembali ke Daftar Pekerja</span>
        </div>
        
        {isSuperAdmin && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-xl font-semibold text-slate-400 hover:text-rose-600 hover:bg-rose-50 px-5 border border-transparent hover:border-rose-100 transition-all duration-200"
            onClick={async () => {
              if (confirm('Hapus data pekerja ini secara PERMANEN?')) {
                try {
                  await api.delete(`/pekerja/${id}`);
                  toast.success('Pekerja dihapus secara permanen');
                  router.push('/pekerja');
                } catch (e) {
                  toast.error('Gagal menghapus pekerja');
                }
              }
            }}
          >
            Hapus Data Pekerja (S.Admin)
          </Button>
        )}
      </div>

      <div className="max-w-6xl mx-auto space-y-6">

        {/* HEADER CARD */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left: Profile Info */}
          <div className="flex items-center gap-6 w-full lg:w-auto">
            <div className="h-24 w-24 rounded-2xl bg-orange-50 flex items-center justify-center border-4 border-white shadow-sm overflow-hidden relative">
              {/* Placeholder Avatar - replacing with an icon wrapper */}
              {data.pas_foto ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://127.0.0.1:8000'}/storage/profil/${data.pas_foto}`}
                  alt="avatar"
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
                  <ImageIcon className="h-10 w-10 text-orange-300" />
                </div>
              )}
              <div className="absolute bottom-[-4px] right-[-4px] bg-[#0ea5e9] rounded-full p-1.5 border-2 border-white text-white">
                <CheckCircle2 className="h-3 w-3" />
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#1e293b]">{data.nama_lengkap}</h1>
              <p className="text-slate-500 font-medium tracking-wide mt-1 text-sm">NIK: {data.nik}</p>
              <p className="text-slate-400 text-[13px] mt-1.5 flex items-center gap-1.5 flex-wrap">
                {data.jenis_kelamin && (
                  <span className="inline-flex items-center gap-1">
                    <span>{data.jenis_kelamin === 'L' ? '♂' : '♀'}</span>
                    <span className="font-semibold text-slate-500">{data.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                  </span>
                )}
                {data.jenis_kelamin && data.tanggal_lahir && <span className="text-slate-300">•</span>}
                {data.tanggal_lahir && (
                  <span className="font-semibold text-slate-500">
                    {differenceInYears(new Date(), parseISO(data.tanggal_lahir))} Tahun
                  </span>
                )}
                {data.tanggal_lahir && <span className="text-slate-300">•</span>}
                {data.tanggal_lahir && (
                  <span className="text-slate-400">
                    Lahir {format(parseISO(data.tanggal_lahir), 'dd MMM yyyy', { locale: localeID })}
                  </span>
                )}
                {!data.jenis_kelamin && !data.tanggal_lahir && (
                  <span className="text-amber-500 font-medium text-xs">Data pribadi belum lengkap</span>
                )}
              </p>
              <div className="flex gap-2 mt-3 text-[10px] font-bold">
                <span className="px-3 py-1 bg-[#0ea5e9]/10 text-[#0ea5e9] rounded-md tracking-wider uppercase">{currentJob?.bagian || 'PRODUKSI'}</span>
                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-md tracking-wider uppercase">{currentJob?.status_pekerjaan || 'TETAP'}</span>
              </div>
            </div>
          </div>

          {/* Right: Stats */}
          <div className="flex flex-wrap lg:flex-nowrap gap-4 w-full lg:w-auto h-full">
            <div className={`bg-slate-50/50 border border-slate-100 rounded-xl p-4 flex-1 min-w-[170px] relative transition-all ${isStaffOrAbove ? 'hover:bg-blue-50/30 cursor-pointer group/status border-dashed' : ''}`}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Status Kesehatan</p>
              <div className="flex items-center gap-2">
                <span className={`text-xl font-bold capitalize ${getStatusColor(data.status_kesehatan)}`}>
                  {getStatusLabel(data.status_kesehatan)}
                </span>

                {isStaffOrAbove && <Edit3 className="h-3.5 w-3.5 text-slate-400 group-hover/status:text-[#0ea5e9] transition-colors" />}

                {/* Status Switcher Popover Logic (Only for Staff+) */}
                {isStaffOrAbove && (
                  <select 
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    value={data.status_kesehatan === 'sehat' ? 'fit' : data.status_kesehatan === 'sakit_ringan' ? 'fit_with_note' : data.status_kesehatan === 'sakit_berat' ? 'unfit' : data.status_kesehatan}
                    onChange={(e) => updateStatusKesehatan(e.target.value)}
                    disabled={statusLoading}
                  >
                    <option value="fit">Fit</option>
                    <option value="fit_with_note">Fit with Note</option>
                    <option value="unfit">Unfit</option>
                  </select>
                )}
              </div>
              
              {/* Suggestion Indicator (Only for Staff+) */}
              {isStaffOrAbove && data.status_saran && data.status_saran !== data.status_kesehatan && (
                <div className="mt-2 flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                  <span className="text-[9px] font-extrabold text-amber-600 uppercase tracking-tighter">
                    Saran: {getStatusLabel(data.status_saran)}
                  </span>
                </div>
              )}
            </div>
            <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 flex-1 min-w-[140px]">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Masa Kerja</p>
              <span className="text-xl font-bold text-slate-800 block">{masaKerjaText}</span>
              <span className="text-[11px] text-slate-400 mt-1 block">{sejakText}</span>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* LEFT COLUMN (Wider) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Profil Medis Dasar (Baseline) */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
               <h3 className="text-sm font-bold text-[#1e293b] flex items-center mb-6">
                 <ClipboardList className="h-4 w-4 text-[#0ea5e9] mr-2" /> Profil Medis Dasar
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                 <div className="space-y-6">
                   <div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Golongan Darah & Rhesus</p>
                     <p className="text-[14px] font-bold text-slate-700">
                        {data.riwayat_medis?.golongan_darah || '-'} {data.riwayat_medis?.rhesus || ''}
                     </p>
                   </div>
                   <div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Penyakit Bawaan / Kronis</p>
                     <p className="text-[13px] font-semibold text-slate-600 leading-relaxed">
                        {Array.isArray(data.riwayat_medis?.riwayat_penyakit) && data.riwayat_medis.riwayat_penyakit.length > 0 
                          ? data.riwayat_medis.riwayat_penyakit.join(', ') 
                          : (data.riwayat_medis?.riwayat_penyakit || 'Tidak ada catatan')}
                     </p>
                   </div>
                   <div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Alergi (Obat/Makanan/Debu)</p>
                     <p className="text-[13px] font-semibold text-slate-600 leading-relaxed">
                        {Array.isArray(data.riwayat_medis?.alergi) && data.riwayat_medis.alergi.length > 0 
                          ? data.riwayat_medis.alergi.join(', ') 
                          : (data.riwayat_medis?.alergi || 'Tidak ada catatan')}
                     </p>
                   </div>
                 </div>

                 <div className="space-y-6">
                   <div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Riwayat Operasi</p>
                     <p className="text-[13px] font-semibold text-slate-600 leading-relaxed">
                        {Array.isArray(data.riwayat_medis?.riwayat_operasi) && data.riwayat_medis.riwayat_operasi.length > 0 
                          ? data.riwayat_medis.riwayat_operasi.join(', ') 
                          : (data.riwayat_medis?.riwayat_operasi || 'Tidak ada catatan')}
                     </p>
                   </div>
                   <div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Obat Rutin Yang Dikonsumsi</p>
                     <p className="text-[13px] font-semibold text-slate-600 leading-relaxed">
                        {data.riwayat_medis?.obat_rutin || 'Tidak ada catatan'}
                     </p>
                   </div>
                 </div>
               </div>
            </div>

            {/* Contact Info Card */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
              <h3 className="text-sm font-bold text-[#1e293b] flex items-center mb-6">
                <MapPin className="h-4 w-4 text-[#0ea5e9] mr-2" /> Informasi Kontak
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email Address</p>
                    <p className="text-sm font-semibold text-slate-700 flex items-center hover:text-[#0ea5e9] transition-colors cursor-pointer"><Mail className="h-3 w-3 mr-1.5 text-slate-400" /> {data.user?.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Telepon / WhatsApp</p>
                    <p className="text-sm font-semibold text-slate-700 flex items-center hover:text-[#0ea5e9] transition-colors cursor-pointer"><Phone className="h-3 w-3 mr-1.5 text-slate-400" /> {data.whatsapp || '-'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Alamat Tinggal</p>
                  <p className="text-sm font-semibold text-slate-700 leading-relaxed pr-8">
                    {data.domisili || 'Alamat belum diatur dalam sistem.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Admin Note Card */}
            <div className="bg-[#fffdf5] border border-orange-100/60 shadow-sm rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-300"></div>
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-sm font-bold text-orange-800 flex items-center">
                  <Pin className="h-4 w-4 mr-2" /> Catatan Internal Admin
                </h3>
                {isStaffOrAbove && !isEditingCatatan && (
                  <button onClick={handleEditCatatan} className="text-orange-400 hover:text-orange-600 transition-colors" title="Edit Catatan">
                    <Edit3 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {isEditingCatatan ? (
                <div className="space-y-3 mt-2">
                  <textarea
                    className="w-full text-sm p-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-300 outline-none resize-y min-h-[100px] text-orange-900 bg-white"
                    placeholder="Tulis catatan admin di sini..."
                    value={catatanInput}
                    onChange={(e) => setCatatanInput(e.target.value)}
                    disabled={savingCatatan}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingCatatan(false)} disabled={savingCatatan} className="text-orange-600 hover:bg-orange-100 h-8 text-xs">
                      Batal
                    </Button>
                    <Button size="sm" onClick={handleSaveCatatan} disabled={savingCatatan} className="bg-orange-500 hover:bg-orange-600 text-white h-8 text-xs">
                      {savingCatatan ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-orange-900/80 text-[13px] leading-relaxed font-medium whitespace-pre-wrap">
                  {data.catatan_admin || 'Tidak ada catatan khusus untuk pekerja ini. Kondisi keseluruhan dalam pemantauan wajar.'}
                </p>
              )}

              <div className="mt-5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-orange-200 text-orange-700 flex items-center justify-center text-[9px] font-bold">AS</span>
                <span className="text-[10px] font-semibold text-orange-600/70">Terakhir diubah oleh Admin Sentinel</span>
              </div>
            </div>

            {/* MASTER-DETAIL GRID: Riwayat Pekerjaan & Riwayat Kesehatan */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {/* Left Column: Riwayat Pekerjaan (Master) */}
              <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold text-[#1e293b] flex items-center">
                    <Briefcase className="h-4 w-4 text-[#0ea5e9] mr-2" /> Riwayat Pekerjaan
                  </h3>
                  <button 
                    onClick={() => setSelectedJobId(null)} 
                    className="text-[11px] font-bold text-[#0ea5e9] tracking-wider uppercase hover:underline"
                  >
                    LIHAT SEMUA
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 -mr-1">
                  <div className="space-y-3">
                    {data.riwayat_pekerja?.map((r: any, idx: number) => {
                       const isActive = !r.tgl_keluar;
                       let wText = `${r.tgl_masuk ? format(parseISO(r.tgl_masuk), 'MMM yy', {locale: localeID}) : '-'} - ${r.tgl_keluar ? format(parseISO(r.tgl_keluar), 'MMM yy', {locale: localeID}) : 'Now'}`;
                       const isSelected = selectedJobId === idx;

                       return (
                         <div
                           key={idx}
                           onClick={() => setSelectedJobId(idx)}
                           className={`p-4 rounded-xl border-l-4 cursor-pointer transition-all duration-200 flex items-center justify-between group ${
                             isSelected 
                               ? 'bg-slate-50 border-[#0ea5e9] shadow-inner ring-1 ring-slate-200/50' 
                               : 'bg-white border-transparent hover:bg-slate-50/50 hover:border-slate-200'
                           }`}
                         >
                           <div className="min-w-0 flex-1">
                             <div className="flex items-center gap-2 mb-1">
                               <p className={`text-[13px] font-bold truncate ${isSelected ? 'text-[#0ea5e9]' : 'text-slate-800'}`}>
                                 {r.nama_perusahaan}
                               </p>
                               {isActive && (
                                 <span className="shrink-0 w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                               )}
                             </div>
                             <p className="text-[11px] text-slate-400 font-medium truncate">
                               {r.bagian || r.jabatan || 'Produksi'} • {wText}
                             </p>
                           </div>
                           <div className="ml-4 shrink-0">
                             {isActive ? (
                               <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded uppercase">Aktif</span>
                             ) : (
                               <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded uppercase">Selesai</span>
                             )}
                           </div>
                         </div>
                       );
                    })}
                    {(!data.riwayat_pekerja || data.riwayat_pekerja.length === 0) && (
                      <div className="py-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                        <Briefcase className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-slate-400">Belum ada riwayat pekerjaan.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Riwayat Kesehatan (Detail) */}
              <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold text-[#1e293b] flex items-center">
                    <Activity className="h-4 w-4 text-[#0ea5e9] mr-2" /> Riwayat Kesehatan
                  </h3>
                  {selectedJobId !== null && !isHealthLoading && (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                      Filtered by Job
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  {isHealthLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-4 border border-slate-100 rounded-xl space-y-3">
                          <div className="flex justify-between">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      ))}
                    </div>
                  ) : filteredHealthRecords && filteredHealthRecords.length > 0 ? (
                    <div className="space-y-4">
                      {filteredHealthRecords.map((m: any, idx: number) => (
                         <div key={idx} className="p-4 bg-white border border-slate-100 rounded-xl hover:border-blue-100 transition-colors group">
                           <div className="flex justify-between items-start mb-2">
                             <div>
                               <p className="text-[12px] font-bold text-slate-800">
                                  {m.tanggal_pemeriksaan ? format(parseISO(m.tanggal_pemeriksaan), 'dd MMM yyyy', {locale: localeID}) : '-'}
                               </p>
                               <p className="text-[10px] text-[#0ea5e9] font-bold mt-0.5 uppercase tracking-wider">
                                 {m.jenis_pemeriksaan || '-'}
                               </p>
                             </div>
                             <span className="text-[10px] text-slate-400 font-medium">
                               {m.tempat_pemeriksaan || '-'}
                             </span>
                           </div>
                           <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/50">
                             <p className="text-[12px] text-slate-600 leading-relaxed font-medium">
                                {m.hasil_diagnosis || '-'}
                             </p>
                           </div>
                         </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center py-12 bg-slate-50/30 rounded-xl border border-dashed border-slate-100">
                      <Activity className="h-10 w-10 text-slate-200 mb-3" />
                      <p className="text-sm font-bold text-slate-400 text-center">
                        Tidak ada rekam medis pada periode ini.
                      </p>
                      {selectedJobId !== null && (
                        <button 
                          onClick={() => setSelectedJobId(null)} 
                          className="mt-3 text-[11px] font-bold text-[#0ea5e9] hover:underline uppercase tracking-wider"
                        >
                          Lihat Seluruh Riwayat
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-[#1e293b] flex items-center">
                  <Activity className="h-4 w-4 text-[#0ea5e9] mr-2" /> Hasil Diagnosis Terkini
                </h3>
                <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">{data.detail_medis?.length || 0} REKAM MEDIS</span>
              </div>

              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                      <th className="pb-3 px-2 font-bold">Tanggal & Tempat</th>
                      <th className="pb-3 px-2 font-bold">Jenis & Dokter</th>
                      <th className="pb-3 px-2 font-bold">Hasil Diagnosis</th>
                      <th className="pb-3 px-2 font-bold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50/80">
                    {data.detail_medis?.map((m: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="py-4 px-2">
                          <p className="text-[13px] font-bold text-slate-800">
                             {m.tanggal_pemeriksaan ? format(parseISO(m.tanggal_pemeriksaan), 'dd MMM yyyy', {locale: localeID}) : '-'}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{m.tempat_pemeriksaan || '-'}</p>
                        </td>
                        <td className="py-4 px-2">
                          <p className="text-[13px] font-medium text-slate-700">{m.jenis_pemeriksaan || '-'}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">dr. {m.dokter || '-'}</p>
                        </td>
                        <td className="py-4 px-2 max-w-[250px]">
                          <p className="text-[12px] text-slate-600 line-clamp-2" title={m.hasil_diagnosis}>
                            {m.hasil_diagnosis || '-'}
                          </p>
                        </td>
                        <td className="py-4 px-2 text-right">
                          {m.file_bukti_path || m.file_hasil_path ? (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => downloadMedisDoc(m.id)}
                              className="h-8 text-[10px] font-bold text-[#0ea5e9] hover:bg-blue-50 border border-blue-100 rounded-lg px-3"
                            >
                              <FileCheck className="h-3 w-3 mr-1.5" /> Berkas
                            </Button>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-300 px-3 italic">Tanpa File</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {(!data.detail_medis || data.detail_medis.length === 0) && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">Belum ada rekam medis terdaftar.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (Stacking Cards) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Status Advokasi Box */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
               <h3 className="text-sm font-bold text-[#1e293b] flex items-center mb-6">
                 <ShieldAlert className="h-4 w-4 text-[#0ea5e9] mr-2" /> Status Advokasi
               </h3>
               
               <div className="relative pl-3 space-y-6">
                 {/* Timeline line connecting items */}
                 <div className="absolute top-2 bottom-5 left-[19px] w-[2px] bg-slate-100 rounded-full" />
                 
                 {advSteps.map((step, idx) => {
                    const isCompleted = isStepCompleted(step.key);
                    const hasFile = !!getFilePath(step.key);
                    const isCurrent = idx === activeStepIndex;
                    const isFuture = idx > activeStepIndex && !isCurrent;
                    
                    return (
                      <div key={step.key} className="relative z-10 flex items-start group">
                        {/* Interactive Toggle Target on the Icon */}
                        <button 
                          onClick={() => {
                            if (isStaffOrAbove) toggleAdvokasi(step.key, !isCompleted);
                          }}
                          disabled={!isStaffOrAbove}
                          className={`mt-0.5 z-20 flex-shrink-0 mr-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0ea5e9] rounded-full transition-transform transform ${isStaffOrAbove ? 'active:scale-90' : 'cursor-default'}`}
                          title={isStaffOrAbove ? "Klik untuk mengubah status" : ""}
                        >
                          {hasFile ? (
                             <CheckCircle2 className="h-6 w-6 text-emerald-500 bg-white" />
                          ) : isCurrent ? (
                             <div className="h-6 w-6 rounded-full border-[3px] border-[#0ea5e9] bg-white flex items-center justify-center">
                               <div className="h-2 w-2 rounded-full bg-[#0ea5e9]" />
                             </div>
                          ) : (
                             <Circle className="h-6 w-6 text-slate-200 fill-white" />
                          )}
                        </button>

                        <div className="flex-1 pb-1">
                          <p className={`text-[13px] font-bold ${hasFile ? 'text-slate-800' : isCurrent ? 'text-[#0ea5e9]' : 'text-slate-400'}`}>
                            {step.label}
                          </p>
                          <p className={`text-[10px] mt-1 ${hasFile ? 'text-emerald-500 font-bold' : 'text-slate-400'}`}>
                            {hasFile ? 'Dokumen Terunggah' : isCurrent ? 'Sedang Berjalan' : 'Belum Dimulai'}
                          </p>

                          {/* File Upload / Display for Each Step */}
                          <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                             <div className="flex justify-between items-center mb-2">
                               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dokumen / Bukti Pendukung</span>
                               {getFilePath(step.key) && getUploadDate(step.key) && (
                                 <span className="text-[9px] font-medium text-slate-400 italic">
                                   Diunggah: {formatDate(getUploadDate(step.key))}
                                 </span>
                               )}
                             </div>
                             
                             <div className="flex flex-col gap-2">
                               {!isStaffOrAbove ? (
                                  <div className="h-10 w-full border border-slate-200 border-dashed rounded-md flex items-center justify-center px-3 text-[10px] font-medium text-slate-400 italic">
                                     Akses unggah hanya untuk Staff
                                  </div>
                                ) : (
                                 <div className="relative w-full">
                                   <input 
                                      type="file" 
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                      accept=".pdf,.jpg,.jpeg,.png"
                                      onChange={(e) => handleFileUpload(step.key, e)}
                                      disabled={uploadLoading === step.key}
                                   />
                                   <div className={`h-10 w-full bg-white border ${uploadLoading === step.key ? 'border-[#0ea5e9] bg-blue-50' : 'border-slate-200 border-dashed'} rounded-md flex items-center justify-center px-3 text-[10px] font-bold text-[#0ea5e9] hover:bg-blue-50 transition-colors whitespace-nowrap`}>
                                      {uploadLoading === step.key ? 'Mengunggah...' : '+ Pilih File Bukti (Max 5MB)'}
                                   </div>
                                 </div>
                               )}

                               {getFilePath(step.key) ? (
                                  <button onClick={() => downloadFile(step.key)} className="h-10 w-full bg-white border border-slate-200 rounded-md flex items-center justify-center text-[10px] font-bold text-slate-600 hover:text-[#0ea5e9] hover:border-[#0ea5e9] transition-colors cursor-pointer">
                                     <FileText className="h-3.5 w-3.5 mr-1.5" /> Lihat Terunggah
                                  </button>
                               ) : isStaffOrAbove ? (
                                  <div className="h-10 w-full border border-slate-200 border-dashed rounded-md flex items-center justify-center px-3 text-[10px] font-medium text-slate-400 italic">
                                     Belum ada dokumen terunggah
                                  </div>
                               ) : null}
                             </div>
                          </div>
                        </div>
                      </div>
                    )
                 })}
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button (Print) */}
      <button className="fixed bottom-8 right-8 z-50 bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded-full w-14 h-14 shadow-lg shadow-blue-500/30 flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
        <Printer className="h-6 w-6" />
      </button>

    </div>
  );
}
