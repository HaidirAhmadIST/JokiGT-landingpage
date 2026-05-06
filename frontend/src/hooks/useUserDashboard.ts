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
  whatsapp: string;
  domisili: string;
  pas_foto: File | null;
}

export interface AdvForm {
  jenis_kasus: string;
  catatan: string;
}

export interface ExposureForm {
  id: number | null;
  nama_perusahaan: string;
  jenis_pajanan: string;
  durasi_pajanan: string;
  apd_disediakan: string;
  jenis_apd_sendiri: string;
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
  const [profileForm, setProfileForm] = useState<ProfileForm>({ whatsapp: '', domisili: '', pas_foto: null });
  const [profileLoading, setProfileLoading] = useState(false);

  const [isAdvModalOpen, setIsAdvModalOpen] = useState(false);
  const [advForm, setAdvForm] = useState<AdvForm>({ jenis_kasus: '', catatan: '' });
  const [advLoading, setAdvLoading] = useState(false);

  const [isExposureModalOpen, setIsExposureModalOpen] = useState(false);
  const [exposureForm, setExposureForm] = useState<ExposureForm>({
    id: null, nama_perusahaan: '', jenis_pajanan: '', durasi_pajanan: '',
    apd_disediakan: '', jenis_apd_sendiri: '',
  });
  const [exposureLoading, setExposureLoading] = useState(false);

  // ── Data Fetching ──────────────────────────────────────────────────────────

  /**
   * Mengambil semua data pekerja dan profil dari API.
   * Mendukung dua cara lookup: via pekerja.id di profil user, atau via email.
   */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const userRes = await api.get('/me');
      const u: User = userRes.data.data;
      setUser(u);

      const pid = (u as any)?.pekerja?.id;

      const loadPekerjaData = (pData: PekerjaFull) => {
        setPekerja(pData);
        // Pilih otomatis riwayat pertama jika belum ada yang dipilih
        if (pData?.riwayat_pekerja?.length && !selectedRiwayatId) {
          setSelectedRiwayatId(pData.riwayat_pekerja[0].id);
        }
        // Tandai riwayat pekerjaan yang data pajanannya masih kosong
        const incomplete = (pData?.riwayat_pekerja || []).filter(
          (r) => !r.jenis_pajanan || !r.durasi_pajanan
        );
        setIncompleteData(incomplete);
      };

      if (pid) {
        const res = await api.get(`/pekerja/${pid}`);
        loadPekerjaData(res.data.data);
      } else {
        // Fallback: cari pekerja berdasarkan email (untuk akun lama)
        const s = await api.get('/pekerja', { params: { search: u.email } });
        const items: PekerjaFull[] = s.data.data?.data || s.data.data || [];
        const match = items.find((p) => (p as any).user?.email === u.email);
        if (match) {
          const res = await api.get(`/pekerja/${match.id}`);
          loadPekerjaData(res.data.data);
        }
      }
    } catch (err: any) {
      if (err.response?.status !== 401) {
        toast.error('Gagal memuat data dashboard.');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedRiwayatId]);

  useEffect(() => { fetchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      fd.append('file', uploadForm.file);
      const res = await api.post(`/pekerja/${pekerja!.id}/advokasi`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.status === 'success') {
        const uploadedStep = uploadForm.step_key;
        toast.success('Dokumen berhasil diunggah!', {
          action: {
            label: 'Lihat Dokumen',
            onClick: () => handleViewFile(`/pekerja/${pekerja!.id}/files/advokasi/${uploadedStep}`),
          },
        });
        setUploadModal(false);
        setUploadForm({ step_key: '', file: null });
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengunggah dokumen.');
    } finally {
      setUploading(false);
    }
  }, [uploadForm, pekerja, fetchData, handleViewFile]);

  /** Logout: hapus token dan redirect ke halaman login. */
  const logout = useCallback(async () => {
    try { await api.post('/logout'); } catch { /* silent */ }
    Cookies.remove('auth_token', { path: '/' });
    localStorage.removeItem('user');
    router.push('/login');
  }, [router]);

  /** Memperbarui data profil (whatsapp, domisili, dan opsional foto). */
  const handleUpdateProfile = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await api.put(`/pekerja/${pekerja!.id}`, {
        whatsapp: profileForm.whatsapp,
        domisili: profileForm.domisili,
      });
      if (profileForm.pas_foto) {
        const fd = new FormData();
        fd.append('pas_foto', profileForm.pas_foto);
        await api.post(`/pekerja/${pekerja!.id}/foto`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      toast.success('Profil berhasil diperbarui!');
      setIsProfileModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui profil.');
    } finally {
      setProfileLoading(false);
    }
  }, [profileForm, pekerja, fetchData]);

  /** Memperbarui atau membuat kasus advokasi baru. */
  const handleUpdateAdvokasi = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setAdvLoading(true);
    try {
      await api.post(`/pekerja/${pekerja!.id}/advokasi`, advForm);
      toast.success('Detail advokasi diperbarui!');
      setIsAdvModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui advokasi.');
    } finally {
      setAdvLoading(false);
    }
  }, [advForm, pekerja, fetchData]);

  /** Memperbarui data pajanan (jenis, durasi, APD) untuk satu riwayat pekerjaan. */
  const handleUpdateExposure = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exposureForm.id) return;
    setExposureLoading(true);
    try {
      await api.put(`/riwayat-pekerja/${exposureForm.id}`, {
        jenis_pajanan: exposureForm.jenis_pajanan,
        durasi_pajanan: exposureForm.durasi_pajanan ? parseInt(exposureForm.durasi_pajanan) : null,
        informal_data: {
          apd_disediakan: exposureForm.apd_disediakan,
          jenis_apd_sendiri: exposureForm.jenis_apd_sendiri,
        },
      });
      toast.success('Data pajanan berhasil diperbarui!');
      setIsExposureModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui data pajanan.');
    } finally {
      setExposureLoading(false);
    }
  }, [exposureForm, fetchData]);

  // ── Openers (shorthand untuk set form & open modal) ──────────────────────

  const openProfileEdit = useCallback(() => {
    setProfileForm({ whatsapp: pekerja?.whatsapp || '', domisili: pekerja?.domisili || '', pas_foto: null });
    setIsProfileModalOpen(true);
  }, [pekerja]);

  const openAdvEdit = useCallback(() => setIsAdvModalOpen(true), []);

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
      jenis_pajanan: r.jenis_pajanan || '',
      durasi_pajanan: r.durasi_pajanan?.toString() || '',
      apd_disediakan: info.apd_disediakan || '',
      jenis_apd_sendiri: info.jenis_apd_sendiri || '',
    });
    setIsExposureModalOpen(true);
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
    exposureLoading, handleUpdateExposure, openExposureEdit,
    // Utils
    logout, handleViewFile, fetchData,
  };
}
