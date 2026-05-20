import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import type { PekerjaFull, RiwayatPekerja, User } from '@/types';

// ─── Tipe Form Internal ───────────────────────────────────────────────────────

export interface UploadForm {
  step_key: string;
  file: File | null;
}

export interface ProfileForm {
  nik: string;
  nama_lengkap: string;
  jenis_kelamin: string;
  tanggal_lahir: string;
  whatsapp: string;
  no_hp: string;
  domisili: string;
  kabupaten: string;
  kecamatan: string;
  jalan: string;
  rt: string;
  rw: string;
  anggota_organisasi: boolean;
  nama_serikat: string;
}

export interface AdvForm {
  jenis_kasus: string;
  catatan: string;
}

export interface ExposureForm {
  id: number | null;
  nama_perusahaan: string;
  jabatan: string;
  status_pekerjaan: string;
  tgl_masuk: string;
  tgl_keluar: string;
  jenis_pajanan: string;
  durasi_pajanan: string;
  apd_disediakan: string;
  jenis_apd_sendiri: string;
  deskripsi_pekerjaan: string;
}

export interface MedisForm {
  id: number | null;
  riwayat_pekerja_id: number | null;
  jenis_pemeriksaan: string;
  tanggal_pemeriksaan: string;
  status_kesehatan: string;
  hasil_diagnosis: string;
  rekomendasi: string;
  dokter_pemeriksa: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useUserDashboard
 *
 * Custom hook yang mengelola semua state dan logika bisnis untuk halaman
 * Dashboard User (Pekerja). Memisahkan logika dari komponen UI agar
 * `dashboard-user/page.tsx` hanya berisi JSX.
 *
 * Mencakup:
 * - Fetch data profil & pekerja dari API
 * - Handler upload dokumen advokasi
 * - Handler update profil (foto, whatsapp, domisili)
 * - Handler update data advokasi
 * - Handler update data pajanan (exposure)
 * - Logout
 *
 * @returns Semua state dan handler yang dibutuhkan komponen UI
 *
 * @example
 * ```tsx
 * const { user, pekerja, loading, ...handlers } = useUserDashboard();
 * ```
 */
export function useUserDashboard() {
  const router = useRouter();

  // ── Data State ─────────────────────────────────────────────────────────────
  const [user, setUser] = useState<User | null>(null);
  const [pekerja, setPekerja] = useState<PekerjaFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [incompleteData, setIncompleteData] = useState<RiwayatPekerja[]>([]);
  const [selectedRiwayatId, setSelectedRiwayatId] = useState<number | null>(null);

  // ── Modal State ────────────────────────────────────────────────────────────
  const [uploadModal, setUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState<UploadForm>({ step_key: '', file: null });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    nik: '', nama_lengkap: '', jenis_kelamin: '', tanggal_lahir: '',
    whatsapp: '', no_hp: '', domisili: '', kabupaten: '', kecamatan: '',
    jalan: '', rt: '', rw: '', anggota_organisasi: false, nama_serikat: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);

  const [isAdvModalOpen, setIsAdvModalOpen] = useState(false);
  const [advForm, setAdvForm] = useState<AdvForm>({ jenis_kasus: '', catatan: '' });
  const [advLoading, setAdvLoading] = useState(false);

  const [exposureLoading, setExposureLoading] = useState(false);
  const [isExposureModalOpen, setIsExposureModalOpen] = useState(false);
  const [exposureForm, setExposureForm] = useState<ExposureForm>({
    id: null, nama_perusahaan: '', jabatan: '', status_pekerjaan: '',
    tgl_masuk: '', tgl_keluar: '', jenis_pajanan: '', durasi_pajanan: '',
    apd_disediakan: '', jenis_apd_sendiri: '',
    deskripsi_pekerjaan: '',
  });

  const [isMedisModalOpen, setIsMedisModalOpen] = useState(false);
  const [medisForm, setMedisForm] = useState<MedisForm>({
    id: null, riwayat_pekerja_id: null, jenis_pemeriksaan: '',
    tanggal_pemeriksaan: '', status_kesehatan: 'sehat',
    hasil_diagnosis: '', rekomendasi: '', dokter_pemeriksa: ''
  });
  const [medisLoading, setMedisLoading] = useState(false);

  // ── Inbox / Persetujuan State ──────────────────────────────────────────────
  const [requests, setRequests] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('ALL');

  // ── Data Fetching ──────────────────────────────────────────────────────────

  /**
   * Mengambil semua data pekerja dan profil dari API.
   * Mendukung dua cara lookup: via pekerja.id di profil user, atau via email.
   */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Backend (AuthController@me) telah diupdate untuk me-load full relasi pekerja
      const userRes = await api.get('/me');
      const u: User = userRes.data.data;
      setUser(u);

      if (u.pekerja) {
        const pData = u.pekerja;
        setPekerja(pData);
        
        // Pilih otomatis riwayat pertama jika belum ada yang dipilih
        if (pData.riwayat_pekerja?.length && !selectedRiwayatId) {
          setSelectedRiwayatId(pData.riwayat_pekerja[0].id);
        }
        
        // Tandai riwayat pekerjaan yang data pajanannya masih kosong
        const incomplete = (pData.riwayat_pekerja || []).filter(
          (r) => !r.jenis_pajanan || !r.durasi_pajanan
        );
        setIncompleteData(incomplete);
      }
    } catch (err: unknown) {
      const error = err as any;
      if (error.response?.status === 401) {
        toast.error('Sesi Anda telah berakhir, silakan login kembali.');
        Cookies.remove('auth_token', { path: '/' });
        localStorage.removeItem('user');
        router.push('/login');
      } else {
        toast.error('Gagal memuat data dashboard.');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedRiwayatId, router]);

  useEffect(() => { fetchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRequests = useCallback(async () => {
    try {
      const res = await api.get('/approval-requests');
      if (res.data.status === 'success') {
        const rawData = res.data.data;
        const sorted = rawData.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setRequests(sorted);

        // Count new updates since last opened
        const lastOpened = localStorage.getItem(`lastInboxOpened_viewer_${user?.id}`);
        const lastOpenedTime = lastOpened ? new Date(lastOpened).getTime() : 0;
        
        // For customer, any update (completed/in progress) is a notification
        const unread = sorted.filter((r: any) => 
          new Date(r.updated_at).getTime() > lastOpenedTime
        );
        setPendingCount(unread.length);
      }
    } catch (err) {
      console.warn("Failed to fetch customer requests", err);
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'viewer') {
      fetchRequests();
      const interval = setInterval(fetchRequests, 15000);
      return () => clearInterval(interval);
    }
  }, [user, fetchRequests]);

  useEffect(() => {
    if (isInboxOpen && user) {
      localStorage.setItem(`lastInboxOpened_viewer_${user.id}`, new Date().toISOString());
      setPendingCount(0);
    }
  }, [isInboxOpen, user]);

  // Auto-select request matching query param or default to first
  useEffect(() => {
    if (requests.length > 0 && !selectedId) {
      const matches = requests.filter(r => activeTab === 'ALL' || r.status === activeTab);
      if (matches.length > 0) {
        setSelectedId(matches[0].id);
      }
    }
  }, [requests, activeTab, selectedId]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  /** Membuka file dokumen advokasi dari server dalam tab baru. */
  const handleViewFile = useCallback(async (url: string) => {
    try {
      const res = await api.get(url, { responseType: 'blob' });
      const contentType = res.headers['content-type'] || 'application/pdf';
      const blob = new Blob([res.data], { type: contentType });
      window.open(window.URL.createObjectURL(blob), '_blank');
    } catch {
      toast.error('Gagal membuka dokumen.');
    }
  }, []);

  /** Mengunggah dokumen bukti untuk satu tahap advokasi. */
  const handleUpload = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.step_key || !uploadForm.file) {
      toast.error('Pilih jenis dokumen dan file terlebih dahulu.');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('step_key', uploadForm.step_key);
      fd.append('file[]', uploadForm.file);
      const res = await api.post(`/pekerja/${pekerja!.id}/advokasi`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Dokumen berhasil diunggah untuk persetujuan.');
        setUploadModal(false);
        setUploadForm({ step_key: '', file: null });
        fetchData();
        fetchRequests();
      }
    } catch (err: unknown) {
      const error = err as any;
      toast.error(error.response?.data?.message || 'Gagal mengunggah dokumen.');
    } finally {
      setUploading(false);
    }
  }, [uploadForm, pekerja, fetchData, fetchRequests]);

  /** Logout: hapus token dan redirect ke halaman login. */
  const logout = useCallback(async () => {
    try { await api.post('/logout'); } catch { /* silent */ }
    Cookies.remove('auth_token', { path: '/' });
    localStorage.removeItem('user');
    router.push('/');
  }, [router]);

  /** Memperbarui data profil (whatsapp, domisili, dan opsional foto). */
  const handleUpdateProfile = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const alamatLengkap = [
        profileForm.jalan ? profileForm.jalan : null,
        profileForm.rt ? `RT ${profileForm.rt}` : null,
        profileForm.rw ? `RW ${profileForm.rw}` : null,
        profileForm.kecamatan ? `Kecamatan ${profileForm.kecamatan}` : null,
        profileForm.kabupaten ? `Kabupaten/Kota ${profileForm.kabupaten}` : null,
        profileForm.domisili ? `Provinsi ${profileForm.domisili}` : null
      ].filter(Boolean).join(', ');

      await api.put(`/pekerja/${pekerja!.id}`, {
        nik: profileForm.nik,
        nama_lengkap: profileForm.nama_lengkap,
        jenis_kelamin: profileForm.jenis_kelamin,
        tanggal_lahir: profileForm.tanggal_lahir,
        whatsapp: profileForm.whatsapp,
        no_hp: profileForm.no_hp,
        domisili: alamatLengkap,
        anggota_organisasi: profileForm.anggota_organisasi,
        nama_serikat: profileForm.anggota_organisasi ? profileForm.nama_serikat : null,
      });

      toast.success('Profil berhasil diperbarui!');
      setIsProfileModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const error = err as any;
      toast.error(error.response?.data?.message || 'Gagal memperbarui profil.');
    } finally {
      setProfileLoading(false);
    }
  }, [profileForm, pekerja, fetchData]);

  /** Memperbarui atau membuat kasus advokasi baru. */
  const handleUpdateAdvokasi = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setAdvLoading(true);
    try {
      const res = await api.post(`/pekerja/${pekerja!.id}/advokasi`, advForm);
      toast.success(res.data.message || 'Detail advokasi diperbarui!');
      setIsAdvModalOpen(false);
      fetchData();
      fetchRequests();
    } catch (err: unknown) {
      const error = err as any;
      toast.error(error.response?.data?.message || 'Gagal memperbarui advokasi.');
    } finally {
      setAdvLoading(false);
    }
  }, [advForm, pekerja, fetchData, fetchRequests]);

  /** Memperbarui data pajanan (jenis, durasi, APD) untuk satu riwayat pekerjaan. */
  const handleUpdateExposure = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setExposureLoading(true);
    try {
      const data = {
        nama_perusahaan: exposureForm.nama_perusahaan,
        jabatan: exposureForm.jabatan,
        status_pekerjaan: exposureForm.status_pekerjaan,
        tgl_masuk: exposureForm.tgl_masuk,
        tgl_keluar: exposureForm.tgl_keluar,
        jenis_pajanan: exposureForm.jenis_pajanan,
        durasi_pajanan: exposureForm.durasi_pajanan ? parseInt(exposureForm.durasi_pajanan) : null,
        deskripsi_pekerjaan: exposureForm.deskripsi_pekerjaan,
        informal_data: {
          apd_disediakan: exposureForm.apd_disediakan,
          jenis_apd_sendiri: exposureForm.jenis_apd_sendiri,
        },
      };

      if (exposureForm.id) {
        await api.put(`/riwayat-pekerja/${exposureForm.id}`, data);
      } else {
        await api.post('/riwayat-pekerja', data);
      }
      toast.success('Data pajanan berhasil diperbarui!');
      setIsExposureModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const error = err as any;
      toast.error(error.response?.data?.message || 'Gagal memperbarui data pajanan.');
    } finally {
      setExposureLoading(false);
    }
  }, [exposureForm, fetchData]);

  /** Memperbarui atau menambah catatan medis baru. */
  const handleUpdateMedis = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medisForm.riwayat_pekerja_id) {
      toast.error('Pilih riwayat pekerjaan terlebih dahulu.');
      return;
    }
    setMedisLoading(true);
    try {
      if (medisForm.id) {
        await api.put(`/detail-medis/${medisForm.id}`, medisForm);
      } else {
        await api.post('/detail-medis', medisForm);
      }
      toast.success('Catatan medis berhasil disimpan!');
      setIsMedisModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const error = err as any;
      toast.error(error.response?.data?.message || 'Gagal menyimpan catatan medis.');
    } finally {
      setMedisLoading(false);
    }
  }, [medisForm, fetchData]);

  // ── Openers (shorthand untuk set form & open modal) ──────────────────────

  const openProfileEdit = useCallback(() => {
    const fullDomisili = pekerja?.domisili || '';
    
    // Default values
    let jalan = '';
    let rt = '';
    let rw = '';
    let kecamatan = '';
    let kabupaten = '';
    let domisili = ''; // province
    
    if (fullDomisili) {
      const parts = fullDomisili.split(',').map(s => s.trim());
      parts.forEach(part => {
        if (part.startsWith('RT ')) {
          rt = part.replace('RT ', '');
        } else if (part.startsWith('RW ')) {
          rw = part.replace('RW ', '');
        } else if (part.startsWith('Kecamatan ')) {
          kecamatan = part.replace('Kecamatan ', '');
        } else if (part.startsWith('Kabupaten/Kota ')) {
          kabupaten = part.replace('Kabupaten/Kota ', '');
        } else if (part.startsWith('Provinsi ')) {
          domisili = part.replace('Provinsi ', '');
        } else {
          if (jalan) {
            jalan = jalan + ', ' + part;
          } else {
            jalan = part;
          }
        }
      });
    }

    setProfileForm({
      nik: pekerja?.nik || '',
      nama_lengkap: pekerja?.nama_lengkap || '',
      jenis_kelamin: pekerja?.jenis_kelamin || '',
      tanggal_lahir: pekerja?.tanggal_lahir || '',
      whatsapp: pekerja?.whatsapp || '',
      no_hp: pekerja?.no_hp || '',
      domisili: domisili,
      kabupaten: kabupaten,
      kecamatan: kecamatan,
      jalan: jalan,
      rt: rt,
      rw: rw,
      anggota_organisasi: !!pekerja?.anggota_organisasi,
      nama_serikat: pekerja?.nama_serikat || '',
    });
    setIsProfileModalOpen(true);
  }, [pekerja]);

  const openAdvEdit = useCallback(() => setIsAdvModalOpen(true), []);

  const openExposureAdd = useCallback(() => {
    setExposureForm({
      id: null, nama_perusahaan: '', jabatan: '', status_pekerjaan: 'Sudah Berhenti',
      tgl_masuk: '', tgl_keluar: '', jenis_pajanan: '', durasi_pajanan: '',
      apd_disediakan: '', jenis_apd_sendiri: '', deskripsi_pekerjaan: '',
    });
    setIsExposureModalOpen(true);
  }, []);

  const openExposureEdit = useCallback((r: RiwayatPekerja) => {
    let info: Record<string, string> = {};
    try {
      info = typeof r.informal_data === 'string'
        ? JSON.parse(r.informal_data)
        : (r.informal_data as Record<string, string> || {});
    } catch { /* data mungkin bukan JSON valid */ }

    setExposureForm({
      id: r.id,
      nama_perusahaan: r.nama_perusahaan,
      jabatan: r.jabatan || '',
      status_pekerjaan: r.status_pekerjaan || '',
      tgl_masuk: r.tgl_masuk || '',
      tgl_keluar: r.tgl_keluar || '',
      jenis_pajanan: r.jenis_pajanan || '',
      durasi_pajanan: r.durasi_pajanan?.toString() || '',
      apd_disediakan: info.apd_disediakan || '',
      jenis_apd_sendiri: info.jenis_apd_sendiri || '',
      deskripsi_pekerjaan: r.deskripsi_pekerjaan || '',
    });
    setIsExposureModalOpen(true);
  }, []);

  const openMedisAdd = useCallback(() => {
    setMedisForm({
      id: null, riwayat_pekerja_id: selectedRiwayatId, jenis_pemeriksaan: '',
      tanggal_pemeriksaan: new Date().toISOString().split('T')[0],
      status_kesehatan: 'sehat', hasil_diagnosis: '', rekomendasi: '',
      dokter_pemeriksa: ''
    });
    setIsMedisModalOpen(true);
  }, [selectedRiwayatId]);

  const openMedisEdit = useCallback((m: Record<string, any>) => {
    setMedisForm({
      id: m.id,
      riwayat_pekerja_id: m.riwayat_pekerja_id,
      jenis_pemeriksaan: m.jenis_pemeriksaan || m.jenis_pemeriksa || '',
      tanggal_pemeriksaan: (m.tanggal_pemeriksaan || m.tgl_pemeriksaan || '').split('T')[0],
      status_kesehatan: m.status_kesehatan || 'sehat',
      hasil_diagnosis: m.hasil_diagnosis || '',
      rekomendasi: m.rekomendasi || '',
      dokter_pemeriksa: m.dokter_pemeriksa || m.dokter || ''
    });
    setIsMedisModalOpen(true);
  }, []);

  // ── Return ─────────────────────────────────────────────────────────────────
  return {
    // Data
    user, pekerja, loading, incompleteData, selectedRiwayatId, setSelectedRiwayatId,
    // Upload
    uploadModal, setUploadModal, uploading, uploadForm, setUploadForm, handleUpload,
    // Profile
    isProfileModalOpen, setIsProfileModalOpen, profileForm, setProfileForm,
    profileLoading, handleUpdateProfile, openProfileEdit,
    // Advokasi
    isAdvModalOpen, setIsAdvModalOpen, advForm, setAdvForm, advLoading,
    handleUpdateAdvokasi, openAdvEdit,
    // Exposure
    isExposureModalOpen, setIsExposureModalOpen, exposureForm, setExposureForm,
    exposureLoading, handleUpdateExposure, openExposureAdd, openExposureEdit,
    // Medis
    isMedisModalOpen, setIsMedisModalOpen, medisForm, setMedisForm,
    medisLoading, handleUpdateMedis, openMedisAdd, openMedisEdit,
    // Inbox / Persetujuan
    requests, pendingCount, isInboxOpen, setIsInboxOpen, selectedId, setSelectedId, activeTab, setActiveTab, fetchRequests,
    // Utils
    logout, handleViewFile, fetchData,
  };
}
