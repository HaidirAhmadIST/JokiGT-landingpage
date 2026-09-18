'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Printer, Pin, Mail, Phone, MapPin,
  Briefcase, ShieldAlert, CheckCircle2, Circle, Edit3,
  Download, Image as ImageIcon, Activity, FileText, FileCheck, ClipboardList, HeartPulse, HardHat, Zap, Building2, User, RefreshCw, Plus, History as TenureIcon, Stethoscope
} from 'lucide-react';
import { format, differenceInYears, differenceInMonths, parseISO, isValid } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { useRole } from '@/hooks/useRole';
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
import { Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatHealthStatus } from '@/lib/utils';
import { PekerjaFull, RiwayatPekerja, InformalData } from '@/types';

export default function PekerjaDetailPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();
  const [data, setData] = useState<PekerjaFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbiddenError, setForbiddenError] = useState(false);
  const [uploadLoading, setUploadLoading] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [isEditingCatatan, setIsEditingCatatan] = useState(false);
  const [catatanInput, setCatatanInput] = useState('');
  const [savingCatatan, setSavingCatatan] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | string | null>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(false);
  const [isRekamJejakOpen, setIsRekamJejakOpen] = useState(false);
  const [isEditRiwayatOpen, setIsEditRiwayatOpen] = useState(false);
  const [editingRiwayat, setEditingRiwayat] = useState<any>(null);
  const [riwayatForm, setRiwayatForm] = useState({
    jenis_pajanan: '',
    durasi_pajanan: '',
    apd_disediakan: '',
    jenis_apd_sendiri: '',
    mutasi_jabatan: [] as Array<{bagian: string, jabatan: string, tahun_mulai: string, tahun_selesai: string}>
  });
  const [savingRiwayat, setSavingRiwayat] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [isFaktorModalOpen, setIsFaktorModalOpen] = useState(false);
  const [selectedFaktor, setSelectedFaktor] = useState('');
  const [savingFaktor, setSavingFaktor] = useState(false);
  const { isSuperAdmin, isStaffOrAbove } = useRole();

  const openEditRiwayat = (riwayat: RiwayatPekerja) => {
    setEditingRiwayat(riwayat);
    let info: InformalData = {};
    try {
      info = typeof riwayat.informal_data === 'string' 
        ? JSON.parse(riwayat.informal_data) 
        : (riwayat.informal_data || {});
    } catch (e) {}
    
    setRiwayatForm({
      jenis_pajanan: riwayat.jenis_pajanan || '',
      durasi_pajanan: riwayat.durasi_pajanan?.toString() || '',
      apd_disediakan: info.apd_disediakan || '',
      jenis_apd_sendiri: info.jenis_apd_sendiri || '',
      mutasi_jabatan: (info.mutasi_jabatan || []).map((m: any) => ({
        bagian: m.bagian || '',
        jabatan: m.jabatan || '',
        tahun_mulai: m.tahun_mulai || m.tahun || '',
        tahun_selesai: m.tahun_selesai || ''
      }))
    });
    setIsEditRiwayatOpen(true);
  };

  const addMutasi = () => {
    setRiwayatForm({
      ...riwayatForm,
      mutasi_jabatan: [...riwayatForm.mutasi_jabatan, { bagian: '', jabatan: '', tahun_mulai: '', tahun_selesai: '' }]
    });
  };

  const removeMutasi = (index: number) => {
    const newMutasi = [...riwayatForm.mutasi_jabatan];
    newMutasi.splice(index, 1);
    setRiwayatForm({ ...riwayatForm, mutasi_jabatan: newMutasi });
  };

  const updateMutasi = (index: number, field: string, value: string) => {
    const newMutasi = [...riwayatForm.mutasi_jabatan];
    newMutasi[index] = { ...newMutasi[index], [field]: value };
    setRiwayatForm({ ...riwayatForm, mutasi_jabatan: newMutasi });
  };

  const handleUpdateRiwayat = async () => {
    try {
      setSavingRiwayat(true);
      let info: any = {};
      try {
        info = typeof editingRiwayat.informal_data === 'string' ? JSON.parse(editingRiwayat.informal_data) : (editingRiwayat.informal_data || {});
      } catch (e) {}

      const updatedInformal = {
        ...info,
        apd_disediakan: riwayatForm.apd_disediakan,
        jenis_apd_sendiri: riwayatForm.jenis_apd_sendiri,
        mutasi_jabatan: riwayatForm.mutasi_jabatan,
      };

      await api.put(`/riwayat-pekerja/${editingRiwayat.id}`, {
        jenis_pajanan: riwayatForm.jenis_pajanan,
        durasi_pajanan: riwayatForm.durasi_pajanan,
        informal_data: updatedInformal,
      });

      toast.success('Riwayat pajanan berhasil diperbarui');
      setIsEditRiwayatOpen(false);
      fetchDetail(); 
    } catch (e) {
      toast.error('Gagal memperbarui riwayat');
    } finally {
      setSavingRiwayat(false);
    }
  };

  const handleSaveFaktor = async () => {
    if (!data) return;
    setSavingFaktor(true);
    try {
      const res = await api.post(`/pekerja/${data.id}/faktor-pak`, {
        faktor_pak: selectedFaktor
      });
      if (res.data.status === 'success') {
        toast.success('Faktor PAK berhasil disimpan!');
        setIsFaktorModalOpen(false);
        fetchDetail();
      } else {
        toast.error('Gagal menyimpan Faktor PAK');
      }
    } catch (e) {
      console.error(e);
      toast.error('Gagal menyimpan Faktor PAK');
    } finally {
      setSavingFaktor(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/pekerja/${id}`);
      toast.success('Pekerja dihapus secara permanen');
      router.push('/pekerja');
    } catch (e) {
      toast.error('Gagal menghapus pekerja');
    }
  };

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/pekerja/${id}`);
      setData(res.data.data);
    } catch (e: any) {
      if (e.response?.status === 403) {
        setForbiddenError(true);
      } else if (e.response?.status !== 401) {
        toast.error('Gagal mengambil detail pekerja');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);
  
  const handleExportPdf = async () => {
    if (!data?.status_advokasi?.id) {
      toast.error('Pekerja ini belum memiliki data advokasi untuk dicetak.');
      return;
    }
    
    const toastId = toast.loading('Menyiapkan dokumen PDF...');
    try {
      const response = await api.get(`/advokasi/${data.status_advokasi.id}/pdf`, {
        responseType: 'blob',
      });
      
      const fileUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = fileUrl;
      link.setAttribute('download', `Laporan-Advokasi-${data.nama_lengkap.replace(/\s+/g, '-')}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(fileUrl);
      
      toast.dismiss(toastId);
      toast.success('Laporan PDF berhasil diunduh');
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('Gagal mengunduh laporan PDF.');
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id, fetchDetail]);

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
    if (data?.riwayat_pekerja && data.riwayat_pekerja.length > 0 && selectedJobId === null) {
      // Find active job first, otherwise first in list
      const activeIdx = data.riwayat_pekerja.findIndex((r) => !r.tgl_keluar);
      setSelectedJobId(activeIdx !== -1 ? activeIdx : 0);
    }
  }, [data, selectedJobId]);

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
    // Menggunakan file[] agar backend menerimanya sebagai array sesuai validasi
    formData.append('file[]', file);

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

  const handleDeleteAdvokasiFile = async (stepKey: string) => {
    setFileToDelete(stepKey);
  };

  const confirmDeleteAdvokasiFile = async () => {
    if (!fileToDelete) return;
    
    setDeleteLoading(fileToDelete);
    try {
      await api.delete(`/pekerja/${id}/files/advokasi/${fileToDelete}`);
      toast.success('Dokumen berhasil dihapus');
      fetchDetail();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menghapus dokumen');
    } finally {
      setDeleteLoading(null);
      setFileToDelete(null);
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

  const downloadRiwayatDoc = async (riwayatId: number) => {
    try {
      const toastId = toast.loading('Memproses berkas riwayat...');
      const response = await api.get(`/riwayat/${riwayatId}/file`, {
        responseType: 'blob',
      });
      
      const fileUrl = window.URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] }));
      window.open(fileUrl, '_blank');
      toast.dismiss(toastId);
    } catch (error) {
      toast.dismiss();
      toast.error('Gagal membuka berkas riwayat.');
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
      'fit': 'sehat',
      'fit_with_note': 'sehat_dengan_catatan',
      'unfit': 'tidak_sehat',
      'sakit_ringan': 'sehat_dengan_catatan',
      'sakit_berat': 'tidak_sehat',
      'sakit': 'tidak_sehat',
    };
    return map[s] || s;
  };

  const getStatusLabel = (s: string) => {
    return formatHealthStatus(s);
  };

  const getStatusColor = (s: string) => {
    const normalized = normalizeStatus(s);
    if (normalized === 'sehat') return 'text-emerald-600';
    if (normalized === 'sehat_dengan_catatan') return 'text-amber-600';
    if (normalized === 'tidak_sehat') return 'text-rose-600';
    return 'text-slate-600';
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
      if (data) setData({ ...data, catatan_admin: catatanInput });
      setIsEditingCatatan(false);
    } catch (e: any) {
      toast.error('Gagal memperbarui catatan');
    } finally {
      setSavingCatatan(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Memuat detail pekerja...</div>;
  
  if (forbiddenError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-rose-50 p-6 rounded-full mb-6">
          <ShieldAlert className="h-16 w-16 text-rose-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-3">Akses Terbatas</h2>
        <p className="text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
          Anda tidak bisa melihat detail data dari serikat lain. Sesuai dengan kebijakan privasi data antar serikat, Pengurus hanya diizinkan untuk melihat rekam jejak pekerja yang terdaftar di bawah serikatnya masing-masing.
        </p>
        <Button onClick={() => router.back()} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-8 h-12 font-bold shadow-lg shadow-slate-200 transition-all">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Kembali Sebelumnya
        </Button>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-center text-red-500 font-medium">Data pekerja tidak ditemukan.</div>;

  // Derived Data Calculations
  const allRiwayat = data.riwayat_pekerja || [];
  const currentJob = allRiwayat.find((r: any) => !r.tgl_keluar) || allRiwayat[0];
  let masaKerjaText = '-';
  let sejakText = '-';
  
  // Pekerja Formal (PKWT/PKWTT/Outsourcing)
  // Cari tgl_masuk paling awal
    const earliestRiwayat = allRiwayat
      .filter((r: any) => r.tgl_masuk)
      .sort((a: any, b: any) => new Date(a.tgl_masuk).getTime() - new Date(b.tgl_masuk).getTime())[0];

    if (earliestRiwayat?.tgl_masuk && isValid(parseISO(earliestRiwayat.tgl_masuk))) {
      const masukDate = parseISO(earliestRiwayat.tgl_masuk);
      const years = differenceInYears(new Date(), masukDate);
      const months = differenceInMonths(new Date(), masukDate) % 12;
      
      if (years > 0) {
        masaKerjaText = `${years} Tahun${months > 0 ? ` ${months} Bulan` : ''}`;
      } else {
        masaKerjaText = months > 0 ? `${months} Bulan` : '< 1 Bulan';
      }
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

  // Interactive Health Filtering Logic — menggunakan relasi eksplisit riwayat_pekerja_id
  const filteredHealthRecords = (() => {
    if (selectedJobId === null) {
      // "Lihat Semua" — tampilkan seluruh detail_medis
      return data?.detail_medis || [];
    }
    
    const job = data.riwayat_pekerja?.[selectedJobId as number];
    if (!job) return data?.detail_medis || [];
    
    // Gunakan relasi langsung: ambil detail_medis dari dalam objek riwayat_pekerja
    // (sudah di-eager-load oleh backend via riwayatPekerja.detailMedis)
    const linkedMedis = job.detail_medis || [];
    
    // Jika ada data medis yang linked ke pekerjaan ini, gunakan itu
    if (linkedMedis.length > 0) return linkedMedis;
    
    // Fallback: jika masih kosong (data lama yang belum ter-migrasi), 
    // gunakan filter tanggal sebagai safety net
    return data?.detail_medis?.filter((m: any) => {
      const tgl = m.tgl_pemeriksaan || m.tanggal_pemeriksaan;
      if (!tgl || !job.tgl_masuk) return false;
      const checkDate = parseISO(tgl);
      const startDate = parseISO(job.tgl_masuk);
      const endDate = job.tgl_keluar ? parseISO(job.tgl_keluar) : null;
      return endDate
        ? checkDate >= startDate && checkDate <= endDate
        : checkDate >= startDate;
    }) || [];
  })();

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
  const isProfilePetugas = data?.user?.role === 'petugas';

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
        
        {isStaffOrAbove && !isProfilePetugas && (
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-xl font-semibold text-[#0284c7] border-[#0284c7] hover:bg-[#0284c7] hover:text-white transition-all duration-200 shadow-sm flex items-center gap-2"
            onClick={() => {
              setSelectedFaktor(data?.faktor_pak && data.faktor_pak !== 'Belum Ditentukan' ? data.faktor_pak : '');
              setIsFaktorModalOpen(true);
            }}
          >
            <Stethoscope className="h-4 w-4" /> Tentukan Faktor PAK
          </Button>
        )}
        {isSuperAdmin && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-xl font-semibold text-slate-400 hover:text-rose-600 hover:bg-rose-50 px-5 border border-transparent hover:border-rose-100 transition-all duration-200"
            onClick={() => setIsDeleteDialogOpen(true)}
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
                {data.jenis_kelamin && data.tanggal_lahir && isValid(parseISO(data.tanggal_lahir)) && <span className="text-slate-300">•</span>}
                {data.tanggal_lahir && isValid(parseISO(data.tanggal_lahir)) && (
                  <span className="font-semibold text-slate-500">
                    {differenceInYears(new Date(), parseISO(data.tanggal_lahir))} Tahun
                  </span>
                )}
                {data.tanggal_lahir && isValid(parseISO(data.tanggal_lahir)) && <span className="text-slate-300">•</span>}
                {data.tanggal_lahir && isValid(parseISO(data.tanggal_lahir)) && (
                  <span className="text-slate-400">
                    Lahir {format(parseISO(data.tanggal_lahir), 'dd MMM yyyy', { locale: localeID })}
                  </span>
                )}
                {!data.jenis_kelamin && (!data.tanggal_lahir || !isValid(parseISO(data.tanggal_lahir))) && (
                  <span className="text-amber-500 font-medium text-xs">Data pribadi belum lengkap</span>
                )}
              </p>
              <div className="flex flex-wrap gap-2 mt-3 text-[10px] font-bold">
                <span className="px-3 py-1 bg-[#0ea5e9]/10 text-[#0ea5e9] rounded-md tracking-widest uppercase">
                  {currentJob?.bagian || currentJob?.jabatan || 'PEKERJA'}
                </span>

                {/* Status Keanggotaan Organisasi Badge */}
                <span className={`px-3 py-1 rounded-md tracking-widest uppercase flex items-center ${
                  data.anggota_organisasi 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  <User className="h-2.5 w-2.5 mr-1" />
                  {data.user?.role === 'petugas'
                    ? `Admin Serikat${data.nama_serikat ? ` (${data.nama_serikat})` : ''}`
                    : data.anggota_organisasi 
                      ? `Anggota Serikat${data.nama_serikat ? ` (${data.nama_serikat})` : ''}` 
                      : 'Bukan Anggota Serikat'}
                </span>
                
                {/* Hanya tampilkan status jika tidak sama dengan label pertama */}
                {currentJob?.status_pekerjaan && currentJob?.status_pekerjaan !== currentJob?.bagian && currentJob?.status_pekerjaan !== currentJob?.jabatan && (
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-md tracking-widest uppercase">{currentJob?.status_pekerjaan}</span>
                )}
                
              </div>
            </div>
          </div>

          {/* Right: Stats */}
          {!isProfilePetugas && (
          <div className="flex flex-wrap lg:flex-nowrap gap-4 w-full lg:w-auto h-full">
            <div className={`bg-slate-50/50 border border-slate-100 rounded-xl p-4 flex-1 min-w-[170px] relative transition-all ${isStaffOrAbove ? 'hover:bg-blue-50/30 cursor-pointer group/status border-dashed' : ''}`}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Status Kesehatan</p>
              <div className="flex items-center gap-2">
                <span className={`text-xl font-bold capitalize ${getStatusColor(data?.status_kesehatan || '')}`}>
                  {getStatusLabel(data?.status_kesehatan || '')}
                </span>

                {isStaffOrAbove && <Edit3 className="h-3.5 w-3.5 text-slate-400 group-hover/status:text-[#0ea5e9] transition-colors" />}

                {/* Status Switcher Popover Logic (Only for Staff+) */}
                {isStaffOrAbove && (
                  <select 
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    value={normalizeStatus(data?.status_kesehatan || '')}
                    disabled={statusLoading}
                    onChange={(e) => updateStatusKesehatan(e.target.value)}
                  >
                    <option value="sehat">Sehat</option>
                    <option value="sehat_dengan_catatan">Sehat dengan Catatan</option>
                    <option value="tidak_sehat">Tidak Sehat</option>
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
            <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 flex-1 min-w-[140px]">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Kasus Advokasi</p>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-slate-800">
                  {completedStepsCount > 0 ? `${completedStepsCount} / 6 Langkah` : 'Tidak Ada'}
                </span>
                {completedStepsCount > 0 && (
                  <span className={`px-2 py-0.5 ${completedStepsCount === 6 ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'} text-[9px] font-extrabold tracking-wide rounded-full`}>
                    {completedStepsCount === 6 ? 'SELESAI' : 'PROSES'}
                  </span>
                )}
              </div>
            </div>
          </div>
          )}
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* LEFT COLUMN (Wider) */}
          <div className={`space-y-6 ${isProfilePetugas ? 'lg:col-span-12' : 'lg:col-span-8'}`}>
            
            {/* Diagnosa Awal */}
            {!isProfilePetugas && (
              <>
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
               <h3 className="text-sm font-bold text-[#1e293b] flex items-center mb-6">
                 <Stethoscope className="h-4 w-4 text-[#0ea5e9] mr-2" /> Diagnosa Awal
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                 <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Keluhan Utama / Apa yang dialami</p>
                   <p className="text-sm font-semibold text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {data.riwayat_medis?.keluhan_utama || 'Tidak ada keluhan utama yang tercatat'}
                   </p>
                 </div>
                 <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Diagnosa Dokter</p>
                   <p className="text-sm font-semibold text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {data.riwayat_medis?.diagnosa_dokter || 'Tidak ada diagnosa dokter yang tercatat'}
                   </p>
                 </div>
               </div>
            </div>

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
              </>
            )}

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
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Telepon / WhatsApp Utama</p>
                    <p className="text-sm font-semibold text-slate-700 flex items-center hover:text-[#0ea5e9] transition-colors cursor-pointer"><Phone className="h-3 w-3 mr-1.5 text-slate-400" /> {data.whatsapp || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">No HP Alternatif</p>
                    <p className="text-sm font-semibold text-slate-700 flex items-center hover:text-[#0ea5e9] transition-colors cursor-pointer"><Phone className="h-3 w-3 mr-1.5 text-slate-400" /> {data.no_hp || '-'}</p>
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
            {!isProfilePetugas && (
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
            )}

            {/* ACTION BAR: Rekam Jejak Terpadu */}
            {!isProfilePetugas && (
              <>
            <div className="bg-gradient-to-r from-[#0ea5e9] to-blue-600 rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-4 text-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl">
                  <ClipboardList className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Rekam Jejak Terpadu</h3>
                  <p className="text-blue-100 text-xs font-medium">Lihat seluruh riwayat pekerjaan & kesehatan dalam satu tampilan panel.</p>
                </div>
              </div>
              
              <Dialog open={isRekamJejakOpen} onOpenChange={setIsRekamJejakOpen}>
                <DialogTrigger 
                  render={
                    <Button className="bg-white text-[#0ea5e9] hover:bg-blue-50 font-bold px-6 py-6 rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]">
                      Buka Rekam Jejak Lengkap
                    </Button>
                  }
                />
                <DialogContent className="max-w-[95vw] lg:max-w-6xl h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl bg-slate-50">
                  <DialogHeader className="p-6 bg-white border-b border-slate-100 flex flex-row items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                      <div className="bg-[#0ea5e9] p-2.5 rounded-xl">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <DialogTitle className="text-xl font-extrabold text-[#1e293b]">Rekam Jejak Pekerja</DialogTitle>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{data.nama_lengkap} • NIK: {data.nik}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mr-8">
                       <Button variant="outline" size="sm" className="rounded-lg h-9 border-slate-200 text-slate-600 font-bold" onClick={() => window.print()}>
                          <Printer className="h-4 w-4 mr-2" /> Cetak PDF
                       </Button>
                    </div>
                  </DialogHeader>

                  <div className="flex-1 p-6 overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                      
                      {/* MODAL LEFT: Riwayat Pekerjaan */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <Briefcase className="h-5 w-5 text-[#0ea5e9]" />
                          <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Riwayat Pekerjaan Lengkap</h4>
                        </div>
                        
                        <div className="space-y-4">
                          {data.riwayat_pekerja?.map((r: any, idx: number) => (
                            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-[#0ea5e9]/30 transition-all">
                              {/* Background highlight for active job */}
                              {!r.tgl_keluar && <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-[100px] -mr-12 -mt-12 group-hover:bg-emerald-100/50 transition-colors" />}
                              
                              <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h5 className="text-base font-extrabold text-slate-900 leading-tight">{r.nama_perusahaan}</h5>
                                      {!r.tgl_keluar ? (
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[10px] font-extrabold rounded-md uppercase tracking-wider">AKTIF</span>
                                      ) : (
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-extrabold rounded-md uppercase tracking-wider">SELESAI</span>
                                      )}
                                    </div>
                                    {r.deskripsi_usaha && (
                                      <p className="text-[#0ea5e9] text-xs font-bold uppercase tracking-tight flex items-center gap-1 mt-1">
                                        {r.deskripsi_usaha}
                                      </p>
                                    )}
                                  </div>
                                  {isStaffOrAbove && (
                                    <button 
                                      onClick={() => openEditRiwayat(r)}
                                      className="p-2 text-slate-400 hover:text-[#0ea5e9] hover:bg-blue-50 rounded-lg transition-all"
                                      title="Edit Pajanan & APD"
                                    >
                                      <Edit3 className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                                {(r.jenis_pajanan || r.durasi_pajanan) && (
                                  <div className="flex gap-3 mt-1.5">
                                    {r.jenis_pajanan && (
                                      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-tight flex items-center gap-1">
                                        <Activity className="h-2.5 w-2.5 text-[#0ea5e9]" /> JENIS: {r.jenis_pajanan}
                                      </p>
                                    )}
                                    {r.durasi_pajanan && (
                                      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-tight flex items-center gap-1">
                                        <ClipboardList className="h-2.5 w-2.5 text-[#0ea5e9]" /> DURASI: {r.durasi_pajanan} TAHUN
                                      </p>
                                    )}
                                  </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Bagian / Jabatan</p>
                                    <p className="text-sm font-semibold text-slate-700">
                                      {`${r.bagian || '-'} / ${r.jabatan || '-'}`}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Periode Kerja</p>
                                    <p className="text-sm font-semibold text-slate-700">
                                      {r.tgl_masuk ? format(parseISO(r.tgl_masuk), 'MMM yyyy', {locale: localeID}) : '-'} — {r.tgl_keluar ? format(parseISO(r.tgl_keluar), 'MMM yyyy', {locale: localeID}) : 'Sekarang'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status Karyawan</p>
                                    <p className="text-sm font-semibold text-slate-700">{r.status_pekerjaan || '-'}</p>
                                  </div>
                                  {r.nama_agen_penyalur && (
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Agen Penyalur</p>
                                      <p className="text-sm font-semibold text-slate-700">{r.nama_agen_penyalur}</p>
                                    </div>
                                  )}
                                </div>

                                {/* MUTASI JABATAN (Admin Detail Modal) */}
                                {(() => {
                                  try {
                                    const info = typeof r.informal_data === 'string' ? JSON.parse(r.informal_data) : r.informal_data;
                                    const mutations = info?.mutasi_jabatan || [];
                                    if (mutations.length === 0) return null;
                                    return (
                                      <div className="mt-4 mb-6 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                        <p className="text-[10px] font-bold text-[#0ea5e9] uppercase tracking-widest mb-4 flex items-center gap-1.5">
                                          Riwayat Mutasi Bagian / Jabatan
                                        </p>
                                        <div className="space-y-4">
                                          {mutations.map((m: any, midx: number) => (
                                            <div key={midx} className="flex items-start gap-3 relative">
                                              {midx < mutations.length - 1 && <div className="absolute left-[7px] top-[18px] bottom-[-15px] w-[2px] bg-slate-200" />}
                                              <div className="h-4 w-4 rounded-full border-2 border-[#0ea5e9] bg-white z-10 mt-0.5 shadow-sm" />
                                              <div className="flex-1">
                                                <div className="flex justify-between items-center mb-0.5">
                                                  <p className="text-xs font-bold text-slate-800">{m.bagian || '-'}</p>
                                                  <span className="text-[10px] font-bold text-slate-400">
                                                    {m.tahun_mulai ? `${m.tahun_mulai}–${m.tahun_selesai || 'Sekarang'}` : (m.tahun || '-')}
                                                  </span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 font-medium">Jabatan: {m.jabatan || '-'}</p>
                                                {m.deskripsi_pekerjaan && <p className="text-[10px] text-slate-500 mt-1 italic">{m.deskripsi_pekerjaan}</p>}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  } catch(e) { return null; }
                                })()}

                                {r.deskripsi_pekerjaan && (
                                  <div className="mb-4">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Deskripsi Pekerjaan</p>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                      <p className="text-xs text-slate-600 leading-relaxed italic">{r.deskripsi_pekerjaan}</p>
                                    </div>
                                  </div>
                                )}

                                {(() => {
                                  if (!r.informal_data) return null;
                                  let info: any = {};
                                  try {
                                    info = typeof r.informal_data === 'string' ? JSON.parse(r.informal_data) : r.informal_data;
                                  } catch(e) {}
                                  
                                  return (
                                    <>
                                      {/* APD Untuk Semua Status Karyawan */}
                                      {(info.apd_disediakan || info.jenis_apd_sendiri) && (
                                        <div className="mb-4 space-y-3">
                                          {info.apd_disediakan && (
                                            <div>
                                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                <HardHat className="h-3.5 w-3.5" /> APD Disediakan Perusahaan
                                              </p>
                                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <p className="text-xs font-semibold text-slate-700">{info.apd_disediakan}</p>
                                              </div>
                                            </div>
                                          )}
                                          {info.jenis_apd_sendiri && (
                                            <div>
                                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                <HardHat className="h-3.5 w-3.5" /> APD Mandiri (Bawa Sendiri)
                                              </p>
                                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <p className="text-xs font-semibold text-slate-700">{info.jenis_apd_sendiri}</p>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}

                                {r.file_bukti_path && (
                                  <div className="pt-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => downloadRiwayatDoc(r.id)}
                                      className="h-9 w-full bg-blue-50 text-[#0ea5e9] hover:bg-blue-100 border border-blue-100 rounded-xl font-bold transition-all" >

                                      <Download className="h-4 w-4 mr-2" /> Unduh Paklaring / Bukti Kerja
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          {(!data.riwayat_pekerja || data.riwayat_pekerja.length === 0) && (
                            <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                              <Briefcase className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                              <p className="text-sm font-bold text-slate-400">Belum ada riwayat pekerjaan terdaftar.</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* MODAL RIGHT: Riwayat Kesehatan per Pekerjaan */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <HeartPulse className="h-5 w-5 text-[#0ea5e9]" />
                          <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Riwayat Kesehatan (Per Pekerjaan)</h4>
                        </div>

                        <div className="space-y-4">
                          {data.riwayat_pekerja?.map((r: any, rIdx: number) => {
                            const medisPerJob: any[] = r.detail_medis || [];
                            const isActive = !r.tgl_keluar;
                            
                            return (
                              <div key={rIdx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-[#0ea5e9]/30 transition-all">
                                {/* Corner accent - exact twin of left side */}
                                {!r.tgl_keluar && <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-[100px] -mr-12 -mt-12 group-hover:bg-emerald-100/50 transition-colors" />}

                                <div className="relative z-10">
                                  {/* Header: Exact copy of left side job card header */}
                                  <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h5 className="text-base font-extrabold text-slate-900 leading-tight">{r.nama_perusahaan}</h5>
                                        {isActive ? (
                                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[10px] font-extrabold rounded-md uppercase tracking-wider">AKTIF</span>
                                        ) : (
                                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-extrabold rounded-md uppercase tracking-wider">SELESAI</span>
                                        )}
                                      </div>
                                      <p className="text-[#0ea5e9] text-xs font-bold uppercase tracking-tight">{r.deskripsi_usaha || 'Bidang Industri'}</p>
                                    </div>
                                  </div>

                                  {/* List of medical records for this specific job */}
                                  <div className="space-y-6">
                                    {medisPerJob.length > 0 ? medisPerJob.map((m: any, mIdx: number) => (
                                      <div key={mIdx} className={`${mIdx > 0 ? 'pt-6 border-t border-slate-100' : ''}`}>
                                        <div className="flex justify-between items-start mb-3">
                                          <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pemeriksaan</p>
                                            <p className="text-[13px] font-extrabold text-slate-800">
                                              {m.tgl_pemeriksaan ? format(parseISO(m.tgl_pemeriksaan), 'dd MMMM yyyy', {locale: localeID}) : '-'}
                                            </p>
                                          </div>
                                          <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded uppercase tracking-wider ${
                                            normalizeStatus(m.status_kesehatan) === 'tidak_sehat' ? 'bg-red-50 text-red-600' : 
                                            normalizeStatus(m.status_kesehatan) === 'sehat_dengan_catatan' ? 'bg-amber-50 text-amber-600' : 
                                            'bg-emerald-50 text-emerald-600'
                                          }`}>
                                            {getStatusLabel(m.status_kesehatan) || 'SEHAT'}
                                          </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-3">
                                          <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Jenis</p>
                                            <p className="text-xs font-semibold text-slate-700">{m.jenis_pemeriksa || 'MCU'}</p>
                                          </div>
                                          <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Dokter / Rumah Sakit</p>
                                            <p className="text-xs font-semibold text-slate-700 truncate">{m.dokter_pemeriksa || m.tempat_pemeriksa || '-'}</p>
                                          </div>
                                          {m.tipe_lokasi && (
                                            <div>
                                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fasilitas Kesehatan</p>
                                              <p className="text-xs font-semibold text-slate-700">{m.tipe_lokasi}</p>
                                            </div>
                                          )}
                                          {m.penanggung_jawab && (
                                            <div>
                                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Opsi Pembiayaan</p>
                                              <p className="text-xs font-semibold text-slate-700">{m.penanggung_jawab}</p>
                                            </div>
                                          )}
                                          {m.alamat_pemeriksaan && (
                                            <div className="col-span-2">
                                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Alamat Tempat Pemeriksaan</p>
                                              <p className="text-xs font-semibold text-slate-700">{m.alamat_pemeriksaan}</p>
                                            </div>
                                          )}
                                          {m.pendamping && (
                                            <div className="col-span-2">
                                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pendamping / Penjamin</p>
                                              <p className="text-xs font-semibold text-slate-700">{m.pendamping}</p>
                                            </div>
                                          )}
                                        </div>

                                        <div className="space-y-3">
                                          <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Hasil Pemeriksaan</p>
                                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                              <p className="text-xs text-slate-600 leading-relaxed italic">{m.hasil_diagnosis || '-'}</p>
                                            </div>
                                          </div>
                                          {m.rekomendasi && (
                                            <div>
                                              <p className="text-[10px] font-bold text-[#0ea5e9] uppercase tracking-widest mb-1">Rekomendasi Dokter</p>
                                              <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
                                                <p className="text-xs text-slate-700 font-medium leading-relaxed">{m.rekomendasi}</p>
                                              </div>
                                            </div>
                                          )}
                                        </div>

                                        {(m.file_bukti_path || m.file_hasil_path) && (
                                          <Button
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => downloadMedisDoc(m.id)}
                                            className="mt-3 h-7 w-full bg-blue-50 text-[#0ea5e9] hover:bg-blue-100 border border-blue-100 rounded-lg font-bold text-[9px] transition-all uppercase" >

                                            <Download className="h-3 w-3 mr-1.5" /> Unduh Laporan Medis
                                          </Button>
                                        )}
                                      </div>
                                    )) : (
                                      <div className="py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                        <Activity className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                                        <p className="text-[11px] font-bold text-slate-400">Tidak ada rekam medis<br />tercatat untuk periode ini.</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {/* Independent medical records (orphans) */}
                          {(() => {
                            const orphanMedis = data.detail_medis?.filter((m: any) => !m.riwayat_pekerja_id) || [];
                            if (orphanMedis.length === 0) return null;
                            return (
                              <div className="bg-white border border-amber-100 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50/40 rounded-bl-[100px] -mr-12 -mt-12" />
                                <div className="relative z-10">
                                  <h5 className="text-base font-extrabold text-slate-900 mb-1">Pemeriksaan Mandiri</h5>
                                  <p className="text-amber-500 text-[10px] font-bold uppercase tracking-widest mb-4">Luar Riwayat Kerja</p>
                                  
  
                                  <div className="space-y-4">
                                    {orphanMedis.map((m: any, mIdx: number) => (
                                      <div key={mIdx} className="p-3 bg-amber-50/20 rounded-xl border border-amber-100">
                                        <div className="flex justify-between items-start mb-2">
                                          <p className="text-xs font-bold text-slate-800">
                                            {m.tgl_pemeriksaan ? format(parseISO(m.tgl_pemeriksaan), 'dd MMM yyyy', {locale: localeID}) : '-'}
                                          </p>
                                            <span className={`text-[9px] font-bold uppercase tracking-wider ${
                                              normalizeStatus(m.status_kesehatan) === 'tidak_sehat' ? 'text-rose-600' : 
                                              normalizeStatus(m.status_kesehatan) === 'sehat_dengan_catatan' ? 'text-amber-600' : 
                                              'text-emerald-600'
                                            }`}>
                                              {getStatusLabel(m.status_kesehatan) || 'SEHAT'}
                                            </span>
                                        </div>
                                        <div className="mt-2 space-y-2">
                                          <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Hasil Pemeriksaan</p>
                                            <p className="text-[11px] text-slate-600 italic leading-relaxed">{m.hasil_diagnosis || '-'}</p>
                                          </div>
                                          {m.rekomendasi && (
                                            <div>
                                              <p className="text-[9px] font-bold text-[#0ea5e9] uppercase tracking-widest mb-1">Rekomendasi Dokter</p>
                                              <p className="text-[11px] text-slate-700 font-medium leading-relaxed">{m.rekomendasi}</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="p-4 bg-white border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 sm:justify-between">
                    <div className="flex items-center gap-6 px-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Kesehatan</span>
                        <span className={`text-sm font-extrabold ${getStatusColor(data?.status_kesehatan || '')}`}>{getStatusLabel(data?.status_kesehatan || '')}</span>
                      </div>
                      <div className="flex flex-col border-l border-slate-200 pl-6">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progress Advokasi</span>
                        <span className="text-sm font-extrabold text-slate-800">{completedStepsCount} dari 6 Langkah</span>
                      </div>
                    </div>
                    <Button variant="ghost" className="rounded-xl font-bold text-slate-500 hover:text-slate-800" onClick={() => setIsRekamJejakOpen(false)}>
                      Tutup Panel
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* MASTER-DETAIL GRID: Riwayat Pekerjaan & Riwayat Kesehatan */}
            <div className="space-y-8">
              
              {/* Left Side: Master-Detail (8 Columns) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                  {/* Riwayat Pekerjaan (Master) */}
              <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold text-[#1e293b] flex items-center">
                    <Briefcase className="h-4 w-4 text-[#0ea5e9] mr-2" /> Riwayat Pekerjaan
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 -mr-1">
                  <div className="space-y-3">
                    {data.riwayat_pekerja?.map((r: any, idx: number) => {
                       const isActive = !r.tgl_keluar;
                       let wText = `${r.tgl_masuk ? format(parseISO(r.tgl_masuk), 'MMM yy', {locale: localeID}) : '-'} - ${r.tgl_keluar ? format(parseISO(r.tgl_keluar), 'MMM yy', {locale: localeID}) : 'Now'}`;
                       const isSelected = selectedJobId === idx;
                       const medisCount = r.detail_medis?.length || 0;

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
                             <div className="flex flex-col gap-0.5 mb-1">
                               <p className="text-[11px] text-slate-400 font-medium truncate">
                                 {`${r.bagian || r.jabatan || 'Produksi'}`} • {wText}
                               </p>
                               {r.deskripsi_usaha && (
                                   <p className="text-[10px] text-amber-600 font-bold truncate flex items-center gap-1 mt-0.5">
                                     <ShieldAlert className="h-2.5 w-2.5" /> Pajanan: {r.deskripsi_usaha}
                                   </p>
                                 )}
                                 {(r.jenis_pajanan || r.durasi_pajanan) && (
                                   <div className="flex gap-2 mt-1">
                                     {r.jenis_pajanan && (
                                       <p className="text-[9px] text-slate-500 font-bold truncate flex items-center gap-1">
                                         <Activity className="h-2 w-2" /> {r.jenis_pajanan}
                                       </p>
                                     )}
                                     {r.durasi_pajanan && (
                                       <p className="text-[9px] text-slate-500 font-bold truncate flex items-center gap-1">
                                         <ClipboardList className="h-2 w-2" /> {r.durasi_pajanan} Thn
                                       </p>
                                     )}
                                   </div>
                                 )}

                                 {/* MUTASI JABATAN (Main Page Left Card) */}
                                 {(() => {
                                   try {
                                     const info = typeof r.informal_data === 'string' ? JSON.parse(r.informal_data) : r.informal_data;
                                     const mutations = info?.mutasi_jabatan || [];
                                     if (mutations.length === 0) return null;
                                     return (
                                       <div className="mt-2.5 pt-2 border-t border-slate-100/50">
                                         <p className="text-[8px] font-black text-[#0ea5e9] uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                           <RefreshCw className="h-2 w-2" /> Riwayat Mutasi
                                         </p>
                                         <div className="space-y-1">
                                           {mutations.map((m: any, midx: number) => (
                                             <div key={midx} className="flex items-center justify-between gap-2">
                                               <div className="text-[9px] font-bold text-slate-600 truncate flex-1 flex items-center gap-1.5">
                                                 <div className="w-1 h-1 rounded-full bg-blue-400" />
                                                 {m.bagian || '-'}
                                               </div>
                                               <span className="text-[8px] font-bold text-slate-400">{m.tahun_mulai ? `${m.tahun_mulai}–${m.tahun_selesai || 'Skg'}` : (m.tahun || '-')}</span>
                                             </div>
                                           ))}
                                         </div>
                                       </div>
                                     );
                                   } catch(e) { return null; }
                                 })()}
                             </div>
                             {/* Badge jumlah pemeriksaan */}
                             {medisCount > 0 && (
                               <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-[#0ea5e9] text-[9px] font-bold rounded-full">
                                 <Activity className="h-2 w-2" /> {medisCount} Pemeriksaan
                               </span>
                             )}
                           </div>
                           <div className="ml-4 flex flex-col items-end gap-2 shrink-0">
                             {isActive ? (
                               <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded uppercase">Aktif</span>
                             ) : (
                               <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded uppercase">Selesai</span>
                             )}
                             {r.file_bukti_path && (
                               <Button 
                                 variant="ghost" 
                                 size="sm"
                                 onClick={(e) => { e.stopPropagation(); downloadRiwayatDoc(r.id); }}
                                 className="h-6 text-[9px] font-bold text-[#0ea5e9] hover:bg-blue-50 border border-blue-100 rounded px-2" >

                                 <FileCheck className="h-2 w-2 mr-1" /> Paklaring
                               </Button>
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
                    <div className="space-y-6">
                      {filteredHealthRecords.map((m: any, idx: number) => (
                        <div key={idx} className={`${idx > 0 ? 'pt-6 border-t border-slate-100' : ''} group`}>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pemeriksaan</p>
                              <p className="text-[13px] font-extrabold text-[#1e293b]">
                                {m.tgl_pemeriksaan ? format(parseISO(m.tgl_pemeriksaan), 'dd MMMM yyyy', {locale: localeID}) : '-'}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-[9px] font-extrabold rounded-md uppercase tracking-wider ${
                              normalizeStatus(m.status_kesehatan) === 'tidak_sehat' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 
                              normalizeStatus(m.status_kesehatan) === 'sehat_dengan_catatan' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                              'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            }`}>
                              {getStatusLabel(m.status_kesehatan) || 'SEHAT'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Jenis</p>
                              <p className="text-xs font-bold text-slate-700">{m.jenis_pemeriksa || 'MCU'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Dokter / Rumah Sakit</p>
                              <p className="text-xs font-bold text-slate-700 truncate">{m.dokter_pemeriksa || m.tempat_pemeriksa || '-'}</p>
                            </div>
                            {m.tipe_lokasi && (
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fasilitas Kesehatan</p>
                                <p className="text-xs font-bold text-slate-700">{m.tipe_lokasi}</p>
                              </div>
                            )}
                            {m.penanggung_jawab && (
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Opsi Pembiayaan</p>
                                <p className="text-xs font-bold text-slate-700">{m.penanggung_jawab}</p>
                              </div>
                            )}
                            {m.alamat_pemeriksaan && (
                              <div className="col-span-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Alamat Tempat Pemeriksaan</p>
                                <p className="text-xs font-bold text-slate-700">{m.alamat_pemeriksaan}</p>
                              </div>
                            )}
                            {m.pendamping && (
                              <div className="col-span-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pendamping / Penjamin</p>
                                <p className="text-xs font-bold text-slate-700">{m.pendamping}</p>
                              </div>
                            )}
                          </div>

                          <div className="space-y-4">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Hasil Pemeriksaan</p>
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 group-hover:border-[#0ea5e9]/20 transition-colors">
                                <p className="text-xs text-slate-600 leading-relaxed italic">{m.hasil_diagnosis || '-'}</p>
                              </div>
                            </div>
                            {m.rekomendasi && (
                              <div>
                                <p className="text-[10px] font-bold text-[#0ea5e9] uppercase tracking-widest mb-1">Rekomendasi Dokter</p>
                                <div className="bg-blue-50/30 p-3 rounded-xl border border-blue-100 group-hover:border-[#0ea5e9]/40 transition-colors">
                                  <p className="text-xs text-slate-700 font-medium leading-relaxed">{m.rekomendasi}</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {m.file_hasil_path && (
                            <Button
                              variant="ghost" 
                              size="sm"
                              onClick={() => downloadMedisDoc(m.id)}
                              className="mt-4 h-9 w-full bg-blue-50 text-[#0ea5e9] hover:bg-[#0ea5e9] hover:text-white border border-blue-100 rounded-xl font-bold text-[10px] transition-all uppercase tracking-wide" >

                              <Download className="h-3.5 w-3.5 mr-2" /> Unduh Laporan Medis
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center py-16 bg-slate-50/30 rounded-2xl border border-dashed border-slate-200">
                      <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-slate-100">
                        <Activity className="h-8 w-8 text-slate-200" />
                      </div>
                      <p className="text-sm font-bold text-slate-500 text-center px-6">
                        Pilih riwayat pekerjaan di sebelah kiri untuk melihat rekam medis terkait.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
              </>
            )}
          </div>

          {/* RIGHT COLUMN (Advocacy) */}
          {!isProfilePetugas && (
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

                          <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                             <div className="flex justify-between items-center mb-2">
                               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dokumen / Bukti Pendukung</span>
                               {!!getFilePath(step.key) && !!getUploadDate(step.key) && (
                                 <span className="text-[9px] font-medium text-slate-400 italic">
                                   Diunggah: {formatDate(getUploadDate(step.key) as string)}
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
                                  <div className="flex gap-2">
                                    <button onClick={() => downloadFile(step.key)} className="h-10 flex-1 bg-white border border-slate-200 rounded-md flex items-center justify-center text-[10px] font-bold text-slate-600 hover:text-[#0ea5e9] hover:border-[#0ea5e9] transition-colors cursor-pointer">
                                       <FileText className="h-3.5 w-3.5 mr-1.5" /> Lihat Terunggah
                                    </button>
                                    {isStaffOrAbove && (
                                      <button 
                                        onClick={() => handleDeleteAdvokasiFile(step.key)} 
                                        disabled={deleteLoading === step.key}
                                        className="h-10 px-3 bg-white border border-slate-200 rounded-md flex items-center justify-center text-[10px] font-bold text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
                                        title="Hapus Dokumen"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                               ) : isStaffOrAbove ? (
                                  <div className="h-10 w-full border border-slate-200 border-dashed rounded-md flex items-center justify-center px-3 text-[10px] font-medium text-slate-400 italic">
                                     Belum ada dokumen terunggah
                                  </div>
                               ) : null}
                             </div>
                          </div>
                        </div>
                      </div>
                    );
                 })}
               </div>
            </div>
          </div>
          )}
        </div>


        {/* FULL WIDTH SECTION BELOW THE GRID */}
        {/* Riwayat Pajanan Section (Full Width) */}
        {!isProfilePetugas && (
        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden mt-8 mb-12">
          <div className="p-6 border-b border-slate-100 bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1e293b]">Riwayat Pajanan & APD</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Profil Risiko Lingkungan & Alat Pelindung Diri</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                Total {data.riwayat_pekerja?.length || 0} Pengalaman Terdata
              </span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-white border-b-2 border-slate-100">
                  <th className="px-10 py-6 text-[11px] font-extrabold text-slate-800 uppercase tracking-widest w-[35%]">Identitas Pekerjaan</th>
                  <th className="px-8 py-6 text-[11px] font-extrabold text-slate-800 uppercase tracking-widest w-[20%] text-center">Profil Pajanan</th>
                  <th className="px-8 py-6 text-[11px] font-extrabold text-slate-800 uppercase tracking-widest w-[30%]">Alat Pelindung Diri (APD)</th>
                  <th className="px-10 py-6 text-[11px] font-extrabold text-slate-800 uppercase tracking-widest w-[15%] text-right">Durasi Kerja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.riwayat_pekerja?.some((r: any) => r.jenis_pajanan || r.durasi_pajanan || r.informal_data) ? (
                  data.riwayat_pekerja.map((r: any, idx: number) => {
                    const info = typeof r.informal_data === 'string' ? JSON.parse(r.informal_data || '{}') : (r.informal_data || {});
                    const mutations = info?.mutasi_jabatan || [];
                    const apdDisediakan = info?.apd_disediakan || info?.apd_list || '';
                    const apdMandiri = info?.jenis_apd_sendiri || '';
                    
                    if (!r.jenis_pajanan && !r.durasi_pajanan && !apdDisediakan && !apdMandiri) return null;

                    return (
                      <tr key={idx}>
                        {/* Column 1: Company & Refined Mutation Timeline */}
                        <td className="px-10 py-10 align-top">
                          <div className="flex flex-col">
                            <p className="font-extrabold text-[#1e293b] text-[17px] tracking-tight">{r.nama_perusahaan}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg uppercase tracking-wider">
                                {r.bagian || r.jabatan || 'Pekerja'}
                              </span>
                              {r.status_pekerjaan && (
                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg uppercase tracking-wider">
                                  {r.status_pekerjaan}
                                </span>
                              )}
                            </div>

                            {/* Info Pekerjaan Tambahan */}
                            {(r.deskripsi_pekerjaan || r.nama_agen_penyalur || r.tanggal_selesai_kontrak) && (
                              <div className="mt-4 space-y-3">
                                {r.deskripsi_pekerjaan && (
                                  <div className="text-[11px] text-slate-600">
                                    <span className="font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Deskripsi Pekerjaan:</span>
                                    <span className="leading-relaxed">{r.deskripsi_pekerjaan}</span>
                                  </div>
                                )}
                                {r.nama_agen_penyalur && (
                                  <div className="text-[11px] text-slate-600">
                                    <span className="font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Agen Penyalur:</span>
                                    <span>{r.nama_agen_penyalur}</span>
                                    {r.alamat_agen_penyalur && <span className="block text-slate-500 mt-0.5">{r.alamat_agen_penyalur}</span>}
                                  </div>
                                )}
                                {r.tanggal_selesai_kontrak && (
                                  <div className="text-[11px] text-slate-600">
                                    <span className="font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Selesai Kontrak:</span>
                                    <span>{format(parseISO(r.tanggal_selesai_kontrak), 'dd MMM yyyy', { locale: localeID })}</span>
                                  </div>
                                )}
                                {info?.bpjs_bpu && (
                                  <div className="text-[11px] text-slate-600">
                                    <span className="font-bold uppercase tracking-wider text-slate-400 block mb-0.5">BPJS Ketenagakerjaan:</span>
                                    <span>{info.bpjs_bpu === 'PU' ? 'Penerima Upah (PU)' : info.bpjs_bpu === 'BPU' ? 'Bukan Penerima Upah (BPU)' : info.bpjs_bpu}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* K3 Info */}
                            {(info?.training_k3 || info?.ada_p2k3) && (
                              <div className="mt-5 p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                  <ShieldAlert className="h-3 w-3" /> Info Keselamatan (K3)
                                </p>
                                <div className="space-y-2">
                                  {info.training_k3 && (
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-[10px] font-semibold text-slate-500">Pelatihan K3: <span className="font-bold text-slate-700">{info.training_k3 === 'Pernah' ? 'Pernah Mengikuti' : 'Belum Pernah'}</span></span>
                                      {info.training_k3 === 'Pernah' && info.jenis_pelatihan_k3 && (
                                        <span className="text-[10px] text-slate-500">- Jenis: {info.jenis_pelatihan_k3}</span>
                                      )}
                                      {info.training_k3 === 'Pernah' && info.terakhir_pelatihan_k3 && (
                                        <span className="text-[10px] text-slate-500">- Terakhir: {info.terakhir_pelatihan_k3}</span>
                                      )}
                                    </div>
                                  )}
                                  {info.ada_p2k3 && (
                                    <div className="flex flex-col gap-0.5 mt-1">
                                      <span className="text-[10px] font-semibold text-slate-500">P2K3 di Perusahaan: <span className="font-bold text-slate-700">{info.ada_p2k3}</span></span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Timeline Mutasi */}
                            {mutations.length > 0 && (
                              <div className="mt-6 ml-2 border-l-[2px] border-slate-100 space-y-6">
                                {mutations.map((m: any, midx: number) => (
                                  <div key={midx} className="relative pl-8">
                                    <div className="absolute left-[-6px] top-1 h-3 w-3 rounded-full bg-[#0ea5e9] border-2 border-white" />
                                    <div className="flex justify-between items-start gap-6">
                                      <div>
                                        <p className="text-[11px] font-black text-slate-700 leading-none uppercase">{m.bagian || '-'}</p>
                                        <p className="text-[10px] text-slate-600 mt-1.5 font-bold">{m.jabatan || '-'}</p>
                                        {m.deskripsi_pekerjaan && <p className="text-[10px] text-slate-500 mt-1 italic">{m.deskripsi_pekerjaan}</p>}
                                      </div>
                                      <span className="text-[11px] font-extrabold text-slate-500 tracking-tighter shrink-0">{m.tahun_mulai ? `${m.tahun_mulai}–${m.tahun_selesai || 'Sekarang'}` : (m.tahun || '-')}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Column 2: Exposure Profiles */}
                        <td className="px-8 py-10 align-middle">
                          <div className="flex flex-wrap justify-center gap-3">
                            {r.jenis_pajanan ? r.jenis_pajanan.split(',').map((p: string, pIdx: number) => (
                              <div key={pIdx} className="flex items-center gap-2 px-4 py-2 bg-amber-50/50 text-amber-700 rounded-2xl border border-amber-100">
                                <span className="text-[11px] font-black uppercase tracking-tight">{p.trim()}</span>
                              </div>
                            )) : (
                              <span className="text-slate-500 text-[11px] font-bold italic">Tidak Ada Pajanan</span>
                            )}
                          </div>
                        </td>

                        {/* Column 3: PPE (APD) Analysis */}
                        <td className="px-8 py-10 align-middle">
                          <div className="space-y-6">
                            {apdDisediakan && (
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-black text-[#0ea5e9] uppercase tracking-[0.2em]">STANDAR PERUSAHAAN</span>
                                </div>
                                <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-100/50">
                                  <p className="text-[12px] font-bold text-slate-700 leading-relaxed italic">
                                    &quot;{apdDisediakan}&quot;
                                  </p>
                                  {info?.akses_apd && (
                                    <div className="mt-3 pt-3 border-t border-blue-100 flex items-center gap-2">
                                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Akses APD:</span>
                                      <span className="text-[11px] font-semibold text-slate-700">{info.akses_apd}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            {apdMandiri && (
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-black text-rose-500 uppercase tracking-[0.2em]">PROTEKSI MANDIRI</span>
                                </div>
                                <div className="p-4 bg-rose-50/40 rounded-2xl border border-rose-100/50">
                                  <p className="text-[12px] font-bold text-slate-700 leading-relaxed italic">
                                    &quot;{apdMandiri}&quot;
                                  </p>
                                </div>
                              </div>
                            )}
                            {!apdDisediakan && !apdMandiri && (
                              <div className="flex items-center gap-2 text-slate-300">
                                <FileText className="h-4 w-4 opacity-50" />
                                <span className="text-[11px] font-bold italic">Dokumentasi APD tidak ditemukan</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Column 4: Tenure Duration */}
                        <td className="px-10 py-10 align-middle text-right">
                          <div className="inline-flex flex-col items-end">
                            <div className="flex flex-col items-end min-w-[110px] pr-4">
                              <span className="text-[36px] font-black leading-none text-[#0ea5e9]">{r.durasi_pajanan || 0}</span>
                              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-1">TAHUN</span>
                            </div>
                            <div className="flex items-center gap-2 mt-4 text-slate-600 font-bold">
                              <span className="text-[10px] font-black tracking-widest uppercase">MULAI {r.tgl_masuk?.substring(0,4) || '-'}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-10 py-32 text-center bg-slate-50/30">
                      <Zap className="h-16 w-16 text-slate-100 mx-auto mb-5" />
                      <h4 className="text-lg font-black text-slate-500 uppercase tracking-[0.4em]">BELUM ADA DATA PAJANAN</h4>
                      <p className="text-sm text-slate-400 mt-2 font-medium">Lengkapi riwayat pekerjaan untuk memunculkan profil pajanan</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-center gap-12">
             <div className="flex items-center gap-3">
               <div className="h-2 w-2 rounded-full bg-amber-500 shadow-sm" />
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Risiko Lingkungan</span>
             </div>
             <div className="flex items-center gap-3">
               <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-sm" />
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Alat Pelindung Diri</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-[#0ea5e9] shadow-sm" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Akumulasi Masa Kerja</span>
              </div>
           </div>
        </div>
        )}
      </div>

      {!isProfilePetugas && (
      <button 
        onClick={handleExportPdf}
        className="fixed bottom-8 right-8 z-50 bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded-full w-14 h-14 shadow-lg shadow-blue-500/30 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        title="Cetak Laporan Advokasi"
      >
        <Printer className="h-6 w-6" />
      </button>
      )}

      {/* Edit Riwayat Pajanan Dialog */}
      <Dialog open={isEditRiwayatOpen} onOpenChange={setIsEditRiwayatOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
          <DialogHeader className="p-6 bg-white border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2.5 rounded-xl">
                <ShieldAlert className="h-5 w-5 text-[#0ea5e9]" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-[#1e293b]">Edit Pajanan & APD</DialogTitle>
                <p className="text-xs text-slate-500 font-medium">{editingRiwayat?.nama_perusahaan}</p>
              </div>
            </div>
          </DialogHeader>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jenis Pajanan</label>
                <select 
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-100 outline-none"
                  value={riwayatForm.jenis_pajanan}
                  onChange={(e) => setRiwayatForm({...riwayatForm, jenis_pajanan: e.target.value})}
                >
                  <option value="">Pilih Pajanan</option>
                  <option value="Faktor Fisika">Faktor Fisika</option>
                  <option value="Faktor Kimia">Faktor Kimia</option>
                  <option value="Faktor Biologi">Faktor Biologi</option>
                  <option value="Faktor Ergonomi">Faktor Ergonomi</option>
                  <option value="Faktor Psikososial">Faktor Psikososial</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Durasi (Tahun)</label>
                <input 
                  type="number"
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-100 outline-none"
                  placeholder="Cth: 5"
                  value={riwayatForm.durasi_pajanan}
                  onChange={(e) => setRiwayatForm({...riwayatForm, durasi_pajanan: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <HardHat className="h-3 w-3" /> APD Disediakan Perusahaan
                </label>
                <input 
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-100 outline-none"
                  placeholder="Cth: Masker N95, Earplug"
                  value={riwayatForm.apd_disediakan}
                  onChange={(e) => setRiwayatForm({...riwayatForm, apd_disediakan: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Zap className="h-3 w-3" /> APD Milik Sendiri / Mandiri
                </label>
                <input 
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-100 outline-none"
                  placeholder="Cth: Kacamata Safety, Sarung Tangan"
                  value={riwayatForm.jenis_apd_sendiri}
                  onChange={(e) => setRiwayatForm({...riwayatForm, jenis_apd_sendiri: e.target.value})}
                />
              </div>
            </div>

            {/* MUTASI JABATAN SECTION */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-[#0ea5e9] uppercase tracking-widest flex items-center gap-1.5">
                  <RefreshCw className="h-3 w-3" /> Riwayat Mutasi Pekerjaan
                </label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={addMutasi}
                  className="h-7 px-2 text-[10px] font-bold text-[#0ea5e9] hover:bg-blue-50"
                >
                  <Plus className="h-3 w-3 mr-1" /> Tambah Mutasi
                </Button>
              </div>

              <div className="space-y-3">
                {riwayatForm.mutasi_jabatan.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic text-center py-2 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    Belum ada histori mutasi tercatat.
                  </p>
                ) : (
                  riwayatForm.mutasi_jabatan.map((m, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-end bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <div className="col-span-3 space-y-1">
                        <label className="text-[8px] font-bold text-slate-400 uppercase">Bagian</label>
                        <input 
                          className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold outline-none focus:ring-1 focus:ring-blue-200"
                          value={m.bagian}
                          onChange={(e) => updateMutasi(idx, 'bagian', e.target.value)}
                        />
                      </div>
                      <div className="col-span-3 space-y-1">
                        <label className="text-[8px] font-bold text-slate-400 uppercase">Jabatan</label>
                        <input 
                          className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold outline-none focus:ring-1 focus:ring-blue-200"
                          value={m.jabatan}
                          onChange={(e) => updateMutasi(idx, 'jabatan', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="text-[8px] font-bold text-slate-400 uppercase">Thn Mulai</label>
                        <input 
                          className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold outline-none focus:ring-1 focus:ring-blue-200"
                          placeholder="2019"
                          value={m.tahun_mulai}
                          onChange={(e) => updateMutasi(idx, 'tahun_mulai', e.target.value)}
                        />
                      </div>
                      <div className="col-span-3 space-y-1">
                        <label className="text-[8px] font-bold text-slate-400 uppercase">Thn Selesai</label>
                        <input 
                          className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold outline-none focus:ring-1 focus:ring-blue-200"
                          placeholder="2021 / Skg"
                          value={m.tahun_selesai}
                          onChange={(e) => updateMutasi(idx, 'tahun_selesai', e.target.value)}
                        />
                      </div>
                      <div className="col-span-1 pb-0.5">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeMutasi(idx)}
                          className="h-8 w-8 text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 gap-3">
            <Button variant="ghost" onClick={() => setIsEditRiwayatOpen(false)} className="rounded-xl font-bold text-slate-500">Batal</Button>
            <Button 
              onClick={handleUpdateRiwayat} 
              disabled={savingRiwayat}
              className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded-xl font-bold px-8 shadow-lg shadow-blue-500/20"
            >
              {savingRiwayat ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Document Confirmation Dialog */}
      <AlertDialog open={!!fileToDelete} onOpenChange={(open) => !open && setFileToDelete(null)}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
          <AlertDialogHeader>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 mb-2">
              <Trash2 className="h-7 w-7 text-rose-500" />
            </div>
            <AlertDialogTitle className="text-xl font-black text-slate-900 text-center">Hapus Dokumen?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 text-center text-sm px-2">
              Apakah Anda yakin ingin menghapus dokumen ini? Status advokasi tahap ini akan kembali menjadi Belum Dimulai.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-3 mt-4">
            <AlertDialogCancel className="rounded-xl border-slate-200 text-slate-500 font-bold hover:bg-slate-50 px-6">
              Batalkan
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteAdvokasiFile}
              className="rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-lg shadow-rose-200 border-none px-6"
            >
              Ya, Hapus Dokumen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
      {/* MODAL TENTUKAN PAK */}
      {isFaktorModalOpen && data && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">
                Klasifikasi Penyakit Akibat Kerja
              </h3>
              <p className="text-sm text-slate-500 mt-1.5 font-medium flex items-center gap-2 flex-wrap">
                Menentukan faktor untuk pekerja: 
                <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{data.nama_lengkap}</span>
                <span>dari</span>
                <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  {data.riwayat_pekerja?.find((r: any) => !r.tgl_keluar)?.nama_perusahaan || data.riwayat_pekerja?.[0]?.nama_perusahaan || 'Perusahaan Tidak Diketahui'}
                </span>
              </p>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              {[
                { 
                  title: 'Kategori I (Penyebab)', 
                  options: ['Faktor Kimia', 'Faktor Fisika', 'Faktor Biologi'],
                  activeClass: 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200 scale-[1.02]',
                  inactiveClass: 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                },
                { 
                  title: 'Kategori II (Target Organ)', 
                  options: ['Pernafasan', 'Kulit', 'Otot & Kerangka', 'Mental & Perilaku'],
                  activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200 scale-[1.02]',
                  inactiveClass: 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50'
                },
                { 
                  title: 'Kategori III (Kanker)', 
                  options: ['Kanker Akibat Kerja'],
                  activeClass: 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-200 scale-[1.02]',
                  inactiveClass: 'bg-white text-slate-600 border-slate-200 hover:border-rose-300 hover:bg-rose-50'
                },
                { 
                  title: 'Kategori IV (Penyakit Spesifik Lainnya)', 
                  options: ['Nystagmus pada penambang'],
                  activeClass: 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-200 scale-[1.02]',
                  inactiveClass: 'bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:bg-amber-50'
                }
              ].map((group, idx) => (
                <div key={idx} className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{group.title}</h4>
                  <div className="flex flex-wrap gap-2.5">
                    {group.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setSelectedFaktor(opt)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                          selectedFaktor === opt ? group.activeClass : group.inactiveClass
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                {selectedFaktor ? (
                  <p className="text-sm text-slate-500">Terpilih: <span className="font-bold text-slate-800">{selectedFaktor}</span></p>
                ) : (
                  <p className="text-sm text-amber-600 font-medium italic">Pilih salah satu faktor di atas</p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsFaktorModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-500 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveFaktor}
                  disabled={savingFaktor || !selectedFaktor}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm hover:shadow shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingFaktor ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
