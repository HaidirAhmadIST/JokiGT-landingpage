'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Bell, Globe, User, ShieldAlert, ArrowRight, ArrowLeft, Plus, UploadCloud, Save, CheckCircle, Check, X, Activity, Info, Briefcase, HeartPulse, ClipboardList, Zap, Trash2, RefreshCw, Eye, EyeOff, Lock, Mail, ChevronDown, ChevronUp, History } from 'lucide-react';
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
import { cn, formatHealthStatus } from '@/lib/utils';
import FormDetailMedis, { type DataMedis } from '@/components/FormDetailMedis';
import { PROVINCES } from '@/lib/provinces';
import { HazardIdentification } from '@/components/registration/HazardIdentification';

const STORAGE_KEY = 'REKAM_JEJAK_FORM_DATA';

export default function PendaftaranPekerjaPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [perusahaanList, setPerusahaanList] = useState<any[]>([]);
  const [duplicateWarning, setDuplicateWarning] = useState<{ nik?: string; whatsapp?: string }>({});
  // WhatsApp locked to the logged-in user's account
  const [lockedWhatsapp, setLockedWhatsapp] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [wasRestored, setWasRestored] = useState(false);


  // Form States 

  const [dokumenRekomendasi, setDokumenRekomendasi] = useState<File | null>(null);
  const [dokumenBukti, setDokumenBukti] = useState<File | null>(null);

  // Riwayat Pekerjaan Sebelumnya array
  const emptyRiwayatItem = () => ({
    nama_perusahaan: '',
    bagian: '',
    jabatan: '',
    status_pekerjaan: '',
    nama_agen_penyalur: '',
    alamat_agen_penyalur: '',
    tanggal_selesai_kontrak: '',
    tgl_masuk: '',
    tgl_keluar: '',
    alamat_perusahaan: '',
    deskripsi_pekerjaan: '',
    jenis_pajanan: '',
    durasi_pajanan: '',
    pajanan_details: {} as Record<string, any>,
    file_bukti: [] as File[],
    collapsed: false,
    riwayat_pemeriksaan: [] as any[],
    informal_data: {
      tugas_spesifik: '',
      lama_bekerja: '',
      satuan_waktu: 'Bulan',
      bpjs_bpu: '',
      apd_disediakan: '',
      jenis_apd_sendiri: '',
      lokasi_proyek: [''],
      mutasi_jabatan: [] as { bagian: string; jabatan: string; tahun_mulai: string; tahun_selesai: string }[],
    }
  });

  // Helper: default blank medis item
  const emptyMedisItem = () => ({
    tanggal_pemeriksaan: '',
    tempat_pemeriksaan: '',
    tipe_lokasi: 'Umum',
    penanggung_jawab: '',
    alamat_pemeriksaan: '',
    jenis_pemeriksaan: [] as string[],
    jenis_pemeriksaan_lainnya: '',
    dokter: '',
    status_kesehatan: 'sehat',
    hasil_diagnosis: '',
    rekomendasi: '',
    pendamping: '',
  });
  const [riwayatLalu, setRiwayatLalu] = useState<any[]>([]);

  // APD State
  const apdOptions = [
    'Masker / Respirator',
    'Earplug / Earmuff',
    'Kacamata Safety',
    'Sarung Tangan',
    'Baju Pelindung',
    'Lainnya',
  ];
  // Pajanan Options
  const pajananOptions = [
    { label: 'Faktor Fisika', desc: 'Bising, Getaran, Panas, Radiasi, Cahaya' },
    { label: 'Faktor Kimia', desc: 'Debu Silika, Uap Benzena, Gas, Cairan Kimia' },
    { label: 'Faktor Biologi', desc: 'Virus, Bakteri, Jamur, Limbah Medis' },
    { label: 'Faktor Ergonomi', desc: 'Posisi Janggal, Gerakan Repetitif, Beban Berat' },
    { label: 'Faktor Psikososial', desc: 'Stres Kerja, Beban Kerja Berlebih, Jam Kerja Panjang' },
  ];

  const [apdData, setApdData] = useState(
    apdOptions.map(name => ({ name, checked: false, deskripsi: '' }))
  );
  const toggleApd = (idx: number, checked: boolean) => {
    const newA = [...apdData]; newA[idx].checked = checked; setApdData(newA);
  };
  const setApdDeskripsi = (idx: number, val: string) => {
    const newA = [...apdData]; newA[idx].deskripsi = val; setApdData(newA);
  };

  // Pekerjaan Saat Ini state
  const [pekerjaanSaatIni, setPekerjaanSaatIni] = useState({
    nama_perusahaan: '',
    deskripsi_usaha: '',
    bagian: '',
    jabatan: '',
    tgl_masuk: '',
    status_karyawan: '',
    deskripsi_pekerjaan: '',
    status_pekerjaan: '',
    nama_agen_penyalur: '',
    alamat_agen_penyalur: '',
    tanggal_selesai_kontrak: '',
    jenis_pajanan: '',
    durasi_pajanan: '',
    pajanan_details: {} as Record<string, any>,
    nama_perusahaan_baru: '',
    alamat_perusahaan: '',
    // Informal Data
    tugas_spesifik: '',
    lama_bekerja: '',
    satuan_waktu: 'Bulan',
    bpjs_bpu: '',
    apd_disediakan: '',
    jenis_apd_sendiri: '',
    lokasi_proyek: [] as string[],
    riwayat_pemeriksaan: [] as any[],
    mutasi_jabatan: [] as { bagian: string; jabatan: string; tahun: string }[],
    file_bukti: [] as File[],
    deskripsi_pajanan: '',
    training_k3: '',
    ada_p2k3: '',
  });

  const [baseData, setBaseData] = useState({
    nik: '',
    nama_lengkap: '',
    email: '',
    perusahaan_id: '',
    status_kesehatan: 'sehat',
    catatan_admin: '',
    tanggal_lahir: '',
    jenis_kelamin: '',
    whatsapp: '',
    domisili: '',
    kabupaten: '',
    kecamatan: '',
    is_anggota: null as boolean | null,
  });

  const [detailMedisData, setDetailMedisData] = useState<DataMedis>({
    keluhan_utama: '',
    diagnosa_dokter: '',
    golongan_darah: '',
    riwayat_penyakit: '',
    alergi: '',
    riwayat_operasi: '',
    obat_rutin: '',
    riwayat_pemeriksaan: []
  });

  const [isConsentChecked, setIsConsentChecked] = useState(false);
  const handleDetailMedisChange = (field: keyof DataMedis, value: any) => {
    setDetailMedisData(prev => ({ ...prev, [field]: value }));
  };

  // Status Advokasi State
  const advokasiQuestions = [
    'Apakah terbukti riwayat pekerjaan menyebabkan pajanan?',
    'Apakah sudah dievaluasi dokter okupasi?',
    'Apakah perusahaan sudah lapor?',
    'Surat Penetapan Sah PAK?',
    'Kompensasi JKK BPJSTK?',
    'Program Rehabilitasi BPJSKes?'
  ];

  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      Cookies.remove('auth_token', { path: '/' });
      localStorage.removeItem('user');
      window.location.reload();
    }
  };
  const [advokasiData, setAdvokasiData] = useState(
    advokasiQuestions.map(q => ({ question: q, status: 'Tidak', file: [] as File[] }))
  );

  const [isRestored, setIsRestored] = useState(false);
  const [skipRiwayat, setSkipRiwayat] = useState(false);

  // WhatsApp OTP Verification States for Registration Page
  const [isWaVerified, setIsWaVerified] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const sendRegOtpCode = async () => {
    if (!baseData.whatsapp) {
      toast.error("Nomor WhatsApp wajib diisi!");
      return;
    }
    setSendingOtp(true);
    try {
      const formattedWa = baseData.whatsapp.trim().replace(/[^0-9]/g, '');
      const res = await api.post('/auth/whatsapp/send-otp', { whatsapp: formattedWa });
      if (res.data.status === 'success') {
        toast.success(res.data.message);
        setOtpSent(true);
        if (res.data.data?.debug_otp) {
          console.log("Local Dev OTP Code:", res.data.data.debug_otp);
          toast.info(`[DEV MODE] OTP Code: ${res.data.data.debug_otp} (Lihat console log)`, { duration: 10000 });
        }
      } else {
        toast.error(res.data.message || "Gagal mengirim OTP.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal mengirim OTP. Pastikan nomor WhatsApp Anda aktif.");
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyRegOtpCode = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast.error("Kode verifikasi harus tepat 6 digit!");
      return;
    }
    setVerifyingOtp(true);
    try {
      const formattedWa = baseData.whatsapp.trim().replace(/[^0-9]/g, '');
      const res = await api.post('/auth/whatsapp/verify-otp', { whatsapp: formattedWa, otp: otpCode });
      if (res.data.status === 'success') {
        toast.success("Nomor WhatsApp berhasil diverifikasi!");
        setIsWaVerified(true);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Kode verifikasi salah atau kedaluwarsa.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser?.whatsapp) {
          setLockedWhatsapp(parsedUser.whatsapp);
          setBaseData(prev => ({ ...prev, whatsapp: parsedUser.whatsapp }));
        }
      }
    } catch {}
  }, []);

  // Persistence: Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.step) setStep(parsed.step);
        if (parsed.baseData) setBaseData(prev => ({ ...prev, ...parsed.baseData }));
        if (parsed.pekerjaanSaatIni) setPekerjaanSaatIni(prev => ({ ...prev, ...parsed.pekerjaanSaatIni }));
        if (parsed.detailMedisData) setDetailMedisData(prev => ({ ...prev, ...parsed.detailMedisData }));

        // Normalize status_kesehatan values
        const normalizeStatus = (s: string) => {
          if (!s) return 'sehat';
          const map: Record<string, string> = {
            'Sehat': 'sehat', 'sehat': 'sehat',
            'Sehat Dengan Catatan': 'sehat_dengan_catatan', 'sehat_dengan_catatan': 'sehat_dengan_catatan',
            'Sehat dengan Catatan': 'sehat_dengan_catatan',
            'Tidak Sehat': 'tidak_sehat', 'tidak_sehat': 'tidak_sehat',
          };
          return map[s] ?? 'sehat';
        };

        if (parsed.riwayatLalu && Array.isArray(parsed.riwayatLalu)) {
          setRiwayatLalu(parsed.riwayatLalu.map((r: any) => ({
            ...r,
            file_bukti: [],
            riwayat_pemeriksaan: (r.riwayat_pemeriksaan || []).map((m: any) => ({
              ...m,
              file_hasil: [],
              status_kesehatan: normalizeStatus(m?.status_kesehatan)
            }))
          })));
        }
        
        if (parsed.apdData && Array.isArray(parsed.apdData)) {
          const isValidApd = parsed.apdData.every((item: any) => item && typeof item === 'object' && 'name' in item);
          if (isValidApd) {
            setApdData(parsed.apdData);
          } else {
            console.warn("Stale or invalid apdData format in localStorage, keeping default apdData.");
          }
        }
        
        if (parsed.advokasiData && Array.isArray(parsed.advokasiData)) {
          setAdvokasiData(parsed.advokasiData.map((d: any) => ({
            ...d,
            file: null,
            status: d?.status || 'Tidak',
          })));
        }

        const hasData = parsed.baseData?.nama_lengkap || parsed.baseData?.nik || parsed.pekerjaanSaatIni?.nama_perusahaan;
        if (hasData) {
          setWasRestored(true);
          toast.info("Data pendaftaran dipulihkan dari sesi sebelumnya.", {
            description: "⚠️ Demi keamanan, silakan unggah kembali dokumen Hasil Medis sebelum mengirim.",
            duration: 15000,
          });
        }
      } catch (err) {
        console.error("Failed to restore form data", err);
      }
    }
    setIsRestored(true);
  }, []);

  // Persistence: Save to localStorage
  useEffect(() => {
    if (!isRestored) return; // Tunggu sampai data lama dimuat sebelum mulai menyimpan perubahan

    const dataToSave = {
      step,
      baseData,
      pekerjaanSaatIni,
      detailMedisData,
      riwayatLalu,
      apdData,
      advokasiData: advokasiData.map(d => ({ question: d.question, status: d.status }))
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [step, baseData, pekerjaanSaatIni, detailMedisData, riwayatLalu, apdData, advokasiData, isRestored]);

  useEffect(() => {
    const fetchPerusahaan = async () => {
      try {
        const response = await api.get('/perusahaan');
        setPerusahaanList(response.data.data.data);
      } catch (error) {
        console.error("Failed fetching perusahaan");
      }
    };
    fetchPerusahaan();
  }, []);

  const handleLanjut = () => {
    if (step === 1) {
      if (!baseData.nama_lengkap) {
        toast.error("Nama Lengkap wajib diisi!");
        scrollToField('nama_lengkap', 1);
        return;
      }
      if (!baseData.nik) {
        toast.error("Nomor Kartu Pegawai wajib diisi!");
        scrollToField('nik', 1);
        return;
      }
      if (baseData.is_anggota === null) {
        toast.error("Silakan tentukan status keanggotaan organisasi Anda!");
        scrollToField('is-anggota-selector', 1);
        return;
      }
      if (baseData.is_anggota === false) {
        if (!baseData.whatsapp) {
          toast.error("Nomor WhatsApp wajib diisi!");
          scrollToField('whatsapp', 1);
          return;
        }
        if (!isWaVerified) {
          toast.error("Nomor WhatsApp Anda belum diverifikasi! Silakan verifikasi OTP terlebih dahulu.");
          scrollToField('otp-verification-section', 1);
          return;
        }
      } else {
        if (!baseData.email) {
          toast.error("Alamat Email wajib diisi untuk Anggota!");
          scrollToField('email', 1);
          return;
        }
      }
    }
    setStep(step + 1);
  };
  const handleKembali = () => setStep(step - 1);

  const scrollToField = (fieldId: string, targetStep: number) => {
    if (step !== targetStep) setStep(targetStep);
    // Wait for state transition if step changed
    setTimeout(() => {
      const element = document.getElementById(fieldId);
      if (element) {
        element.focus();
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, step === targetStep ? 0 : 300);
  };

  const checkDuplicate = async (field: 'nik' | 'whatsapp', value: string) => {
    if (!value || value.length < 5) return;
    try {
      const res = await api.get(`/pekerja?search=${encodeURIComponent(value)}`);
      const match = res.data.data.data.find((p: any) =>
        field === 'nik' ? p.nik === value : p.user?.whatsapp === value
      );

      if (match) {
        const label = field === 'nik' ? 'Nomor Kartu Pegawai' : 'Nomor Telepon';
        setDuplicateWarning(prev => ({ ...prev, [field]: `${label} ini sudah terdaftar. Melanjutkan akan memperbarui data pekerja yang ada.` }));
        toast.info(`${label} ini sudah terdaftar.`, {
          description: "Anda tetap bisa melanjutkan untuk memperbarui datanya.",
          duration: 5000
        });
      } else {
        setDuplicateWarning(prev => {
          const newW = { ...prev };
          delete (newW as any)[field];
          return newW;
        });
      }
    } catch (e) {
      console.error("Failed to check duplicate", e);
    }
  };

  const handleSubmit = async () => {
    // Explicit Validation Check with detailed feedback and scroll-to-focus
    if (!baseData.nama_lengkap) {
      toast.error("Nama Lengkap wajib diisi!");
      scrollToField('nama_lengkap', 1);
      return;
    }
    if (!baseData.nik) {
      toast.error("Nomor Kartu Pegawai wajib diisi!");
      scrollToField('nik', 1);
      return;
    }
    if (!baseData.whatsapp && !baseData.email) {
      toast.error("Wajib mengisi setidaknya satu: Nomor Telepon atau Email!");
      scrollToField('whatsapp', 1);
      return;
    }

    if (!detailMedisData.keluhan_utama) {
      toast.error("Keluhan Utama wajib diisi!");
      scrollToField('keluhan_utama', 3);
      return;
    }
    if (!pekerjaanSaatIni.nama_perusahaan) {
      toast.error("Nama Perusahaan saat ini wajib diisi!");
      setStep(1);
      return;
    }
    if (pekerjaanSaatIni.nama_perusahaan === 'Lainnya' && !pekerjaanSaatIni.nama_perusahaan_baru) {
      toast.error("Mohon isi nama perusahaan baru Anda!");
      setStep(1);
      return;
    }
    setLoading(true);
    try {
      let finalPerusahaanId = baseData.perusahaan_id;

      // Sinkronisasi otomatis: Jika ID kosong tapi nama perusahaan ada, cari ID-nya di list
      if (!finalPerusahaanId && pekerjaanSaatIni.nama_perusahaan && pekerjaanSaatIni.nama_perusahaan !== 'Lainnya') {
        const p = perusahaanList.find(item => item.nama_perusahaan === pekerjaanSaatIni.nama_perusahaan);
        if (p) finalPerusahaanId = p.id.toString();
      }

      // Penanganan Perusahaan Baru: Jika memilih 'Lainnya', buat perusahaan baru dulu
      if (pekerjaanSaatIni.nama_perusahaan === 'Lainnya' && pekerjaanSaatIni.nama_perusahaan_baru) {
        try {
          toast.loading("Mendaftarkan perusahaan baru...", { id: 'create-perusahaan' });
          const resP = await api.post('/perusahaan', {
            nama_perusahaan: pekerjaanSaatIni.nama_perusahaan_baru,
            status_pendamping: 'Dalam Pantauan'
          });
          finalPerusahaanId = resP.data.data.id.toString();
          toast.success("Perusahaan baru berhasil terdaftar.", { id: 'create-perusahaan' });
        } catch (errP: any) {
          if (errP.response?.status === 422 && errP.response?.data?.errors?.nama_perusahaan) {
            try {
              toast.loading("Mengecek ketersediaan data perusahaan...", { id: 'create-perusahaan' });
              const searchRes = await api.get(`/perusahaan?search=${encodeURIComponent(pekerjaanSaatIni.nama_perusahaan_baru)}`);
              const existing = searchRes.data.data.data.find((p: any) =>
                p.nama_perusahaan.trim().toLowerCase() === pekerjaanSaatIni.nama_perusahaan_baru.trim().toLowerCase()
              );

              if (existing) {
                finalPerusahaanId = existing.id.toString();
                toast.success("Perusahaan sudah terdaftar. Menghubungkan otomatis...", { id: 'create-perusahaan' });
              } else {
                throw new Error("Gagal menemukan perusahaan yang ada.");
              }
            } catch (searchErr) {
              toast.error("Gagal memproses data perusahaan.", { id: 'create-perusahaan' });
              setLoading(false);
              return;
            }
          } else {
            console.error("API Error details:", errP.response?.data);
            const errorMsg = errP.response?.data?.message || 
                            (errP.response?.data?.errors ? Object.values(errP.response.data.errors).flat()[0] : null) || 
                            errP.message;
            toast.error(`Gagal mendaftarkan perusahaan baru: ${errorMsg}`, { id: 'create-perusahaan' });
            setLoading(false);
            return;
          }
        }
      }

      // Build riwayat array combining current job and previous jobs
      const allRiwayat: any[] = [];

      if (pekerjaanSaatIni.nama_perusahaan || pekerjaanSaatIni.nama_perusahaan_baru) {
        allRiwayat.push({
          ...pekerjaanSaatIni,
          nama_perusahaan: pekerjaanSaatIni.nama_perusahaan_baru || pekerjaanSaatIni.nama_perusahaan,
          tgl_keluar: null, // Current job
          // Masukkan data APD ke dalam informal_data agar tersimpan di DB
          informal_data: {
            tugas_spesifik: pekerjaanSaatIni.tugas_spesifik,
            lama_bekerja: pekerjaanSaatIni.lama_bekerja,
            satuan_waktu: pekerjaanSaatIni.satuan_waktu,
            bpjs_bpu: pekerjaanSaatIni.bpjs_bpu,
            apd_disediakan: pekerjaanSaatIni.apd_disediakan,
            jenis_apd_sendiri: pekerjaanSaatIni.jenis_apd_sendiri,
            lokasi_proyek: pekerjaanSaatIni.lokasi_proyek,
            mutasi_jabatan: pekerjaanSaatIni.mutasi_jabatan,
            deskripsi_pajanan: pekerjaanSaatIni.deskripsi_pajanan,
            pajanan_details: pekerjaanSaatIni.pajanan_details,
            training_k3: pekerjaanSaatIni.training_k3,
            ada_p2k3: pekerjaanSaatIni.ada_p2k3,
          },
          riwayat_pemeriksaan: (pekerjaanSaatIni.riwayat_pemeriksaan || []).filter(
            (m: any) => m.tanggal_pemeriksaan
          ).map((m: any) => ({
            tanggal_pemeriksaan: m.tanggal_pemeriksaan,
            tempat_pemeriksaan: m.tempat_pemeriksaan,
            alamat_pemeriksaan: m.alamat_pemeriksaan,
            jenis_pemeriksaan: m.jenis_pemeriksaan,
            jenis_pemeriksaan_lainnya: m.jenis_pemeriksaan_lainnya,
            dokter: m.dokter,
            status_kesehatan: m.status_kesehatan,
            hasil_diagnosis: m.hasil_diagnosis || '',
            rekomendasi: m.rekomendasi,
            pendamping: m.pendamping,
          })),
          riwayat_pemeriksaan_raw: pekerjaanSaatIni.riwayat_pemeriksaan || []
        });
      }

      // Attach riwayat_pemeriksaan ke dalam setiap riwayat pekerjaan sebelumnya
      const prevRiwayat = riwayatLalu
        .filter(r => r.nama_perusahaan.trim() !== '')
        .map(r => ({
          ...r,
          // Extract APD from informal_data if it exists
          informal_data: {
            ...r.informal_data,
            apd_disediakan: r.informal_data?.apd_disediakan || '',
            jenis_apd_sendiri: r.informal_data?.jenis_apd_sendiri || '',
            pajanan_details: r.pajanan_details || {},
          },
          riwayat_pemeriksaan: (r.riwayat_pemeriksaan || []).filter(
            (m: any) => m.tanggal_pemeriksaan
          ).map((m: any) => ({
            tanggal_pemeriksaan: m.tanggal_pemeriksaan,
            tempat_pemeriksaan: m.tempat_pemeriksaan,
            alamat_pemeriksaan: m.alamat_pemeriksaan,
            jenis_pemeriksaan: m.jenis_pemeriksaan,
            dokter: m.dokter,
            status_kesehatan: m.status_kesehatan,
            hasil_diagnosis: m.hasil_diagnosis || '',
            rekomendasi: m.rekomendasi,
            pendamping: m.pendamping,
          })),
          riwayat_pemeriksaan_raw: r.riwayat_pemeriksaan || []
        }));

      // Pemeriksaan Mandiri (tidak terikat pekerjaan tertentu)
      const validMedisRecords = detailMedisData.riwayat_pemeriksaan
        .filter((m: any) => m.tanggal_pemeriksaan);

      const finalMedis = validMedisRecords.map((m: any) => ({
        tanggal_pemeriksaan: m.tanggal_pemeriksaan,
        tempat_pemeriksaan: m.tempat_pemeriksaan,
        alamat_pemeriksaan: m.alamat_pemeriksaan,
        jenis_pemeriksaan: m.jenis_pemeriksaan,
        jenis_pemeriksaan_lainnya: m.jenis_pemeriksaan_lainnya,
        dokter: m.dokter,
        status_kesehatan: m.status_kesehatan,
        hasil_diagnosis: m.hasil_diagnosis || '',
        rekomendasi: m.rekomendasi,
        pendamping: m.pendamping,
      }));

      // Mapped Riwayat Medis (Baseline)
      const hasRiwayatMedis = detailMedisData.golongan_darah || detailMedisData.riwayat_penyakit || detailMedisData.alergi || detailMedisData.obat_rutin || detailMedisData.riwayat_operasi || detailMedisData.keluhan_utama || detailMedisData.diagnosa_dokter;
      const finalRiwayatMedis = hasRiwayatMedis ? {
        keluhan_utama: detailMedisData.keluhan_utama || '',
        diagnosa_dokter: detailMedisData.diagnosa_dokter || '',
        golongan_darah: detailMedisData.golongan_darah,
        riwayat_penyakit: detailMedisData.riwayat_penyakit ? detailMedisData.riwayat_penyakit.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        alergi: detailMedisData.alergi ? detailMedisData.alergi.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        riwayat_operasi: detailMedisData.riwayat_operasi ? detailMedisData.riwayat_operasi.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        obat_rutin: detailMedisData.obat_rutin
      } : null;

      const performSubmit = async (pId: string | null, riwayatData: any[]) => {
        // Gabungkan domisili, kabupaten, dan kecamatan menjadi satu string
        const alamatLengkap = [
          baseData.kecamatan ? `Kecamatan ${baseData.kecamatan}` : null,
          baseData.kabupaten ? `Kabupaten/Kota ${baseData.kabupaten}` : null,
          baseData.domisili ? `Provinsi ${baseData.domisili}` : null
        ].filter(Boolean).join(', ');

        const payload: any = {
          ...baseData,
          domisili: alamatLengkap,
          perusahaan_id: pId,
          riwayat: riwayatData,
          medis: finalMedis
        };

        if (finalRiwayatMedis) {
          payload.riwayat_medis = finalRiwayatMedis;
        }

        const response = await api.post('/pekerja', payload);
        
        // Only update token if we are a guest or not an admin/staff
        // This prevents admin sessions from being hijacked by the newly created worker user
        if (response.data.token) {
          const storedUser = localStorage.getItem('user');
          let shouldSetToken = true;
          if (storedUser) {
            const user = JSON.parse(storedUser);
            if (user.role === 'admin' || user.role === 'petugas') {
              shouldSetToken = false;
            }
          }
          
          if (shouldSetToken) {
            Cookies.set('auth_token', response.data.token, { path: '/' });
            // Ensure axios instance uses the new token immediately
            api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
          }
        }

        const pekerjaId = response.data.data.id;
        const savedRiwayat = response.data.data.riwayat_pekerja || [];
        const savedMedis = response.data.data.detail_medis || [];

        // 1. Profile Photo (Single)
        const uploadPromises: Promise<any>[] = [];
        





        // 4. Advocacy Files
        const advSteps = [
          'riwayat_pajanan', 'persetujuan_dokter', 'perusahaan_lapor',
          'penetapan_pak', 'kompensasi_bpjstk', 'rehabilitasi_bpjskes'
        ];
        for (let i = 0; i < advokasiData.length; i++) {
          const item = advokasiData[i];
          if (item.status === 'Ya' || (item.file && item.file.length > 0)) {
            const advForm = new FormData();
            advForm.append('step_key', advSteps[i]);
            
            if (item.status === 'Ya') {
              advForm.append(advSteps[i], '1');
            }

            const aFiles = (item.file || []).filter((f: any) => f instanceof File);
            if (aFiles.length > 0) {
              aFiles.forEach((f: File) => advForm.append('file[]', f));
            }

            uploadPromises.push(api.post(`/pekerja/${pekerjaId}/advokasi`, advForm));
          }
        }

        // Execute all uploads concurrently
        if (uploadPromises.length > 0) {
          await Promise.all(uploadPromises);
        }

        return response;
      };

      try {
        const response = await performSubmit(finalPerusahaanId, [...allRiwayat, ...prevRiwayat]);
        const pekerjaId = response.data.data.id;
        
        toast.success('Data pekerja berhasil disimpan!');
        
        // Cek apakah user sudah login
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          
          if (user.role === 'admin' || user.role === 'petugas') {
            // Admin/Petugas goes to main dashboard (clean-sync)
            router.push('/dashboard-admin');
          } else {
            // Regular worker (viewer) goes to their user dashboard
            localStorage.setItem('user', JSON.stringify({ ...user, pekerja_id: pekerjaId }));
            router.push('/dashboard-user');
          }
        } else {
          // AUTO-LOGIN: Set user session and redirect to dashboard
          const userData = {
            id: response.data.data.user_id,
            whatsapp: baseData.whatsapp,
            nama_lengkap: baseData.nama_lengkap,
            role: 'viewer',
            pekerja_id: response.data.data.id
          };
          
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.removeItem(STORAGE_KEY);
          
          toast.success('Pendaftaran Berhasil! Menuju dashboard Anda...');
          router.push('/dashboard-user');
        }
      } catch (error: any) {

        if (error.response?.status === 422) {
          const errors = error.response.data.errors || {};
          const firstField = Object.keys(errors)[0];

          // Map backend field names to UI IDs and Steps
          const fieldMap: any = {
            'nik': { id: 'nik', s: 1 },
            'nama_lengkap': { id: 'nama_lengkap', s: 1 },
            'whatsapp': { id: 'whatsapp', s: 1 },
            'email': { id: 'email', s: 1 },
            'domisili': { id: 'domisili', s: 1 },
            'perusahaan_id': { id: 'perusahaan_id', s: 1 },
            'status_pekerjaan': { id: 'status_pekerjaan', s: 1 }
          };

          if (fieldMap[firstField]) {
            toast.error(errors[firstField][0]);
            scrollToField(fieldMap[firstField].id, fieldMap[firstField].s);
            return; // Stop here, we've handled it
          }
        }

        throw error; // Re-throw to the outer catch
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mendaftar. Pastikan form valid.');
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-16" suppressHydrationWarning>
      {/* Navbar Custom */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-[#0ea5e9] p-2 rounded-lg">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 leading-tight">Rekam Jejak Pekerja</h1>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wider">ADVOKASI PAK</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-slate-500">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 hidden sm:flex items-center gap-2"
            onClick={() => router.push('/')}
          >
            Kembali ke Beranda
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 px-3"
            onClick={() => setIsResetDialogOpen(true)}
          >
            Hapus Sesi / Reset
          </Button>

          {lockedWhatsapp && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-bold border-slate-200 text-slate-600 hover:bg-slate-50"
              onClick={handleLogout}
            >
              Logout ({lockedWhatsapp})
            </Button>
          )}

          <Bell className="h-5 w-5 cursor-pointer hover:text-slate-800" />
          <Globe className="h-5 w-5 cursor-pointer hover:text-slate-800" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto mt-10 px-4">
        {/* Stepper */}
        <div className="flex items-center justify-center mb-10 overflow-x-auto pb-4">
          <div className="flex items-center min-w-max">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${step >= 1 ? 'bg-[#0ea5e9] text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
              <span className={`text-xs font-semibold mt-2 text-center ${step >= 1 ? 'text-[#0ea5e9]' : 'text-slate-400'}`}>PROFIL <br />PEKERJA</span>
            </div>
            <div className={`w-8 h-[2px] mx-1 -mt-6 ${step >= 2 ? 'bg-[#0ea5e9]' : 'bg-slate-200'}`} />

            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${step >= 2 ? 'bg-[#0ea5e9] text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
              <span className={`text-xs font-semibold mt-2 text-center ${step >= 2 ? 'text-[#0ea5e9]' : 'text-slate-400'}`}>PEMETAAN <br />BAHAYA</span>
            </div>
            <div className={`w-8 h-[2px] mx-1 -mt-6 ${step >= 3 ? 'bg-[#0ea5e9]' : 'bg-slate-200'}`} />

            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${step >= 3 ? 'bg-[#0ea5e9] text-white' : 'bg-slate-200 text-slate-500'}`}>3</div>
              <span className={`text-xs font-semibold mt-2 text-center ${step >= 3 ? 'text-[#0ea5e9]' : 'text-slate-400'}`}>RIWAYAT <br />KESEHATAN</span>
            </div>
          </div>
        </div>

        {/* Card Content wrapper */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 sm:p-12 relative overflow-hidden">
          
          {wasRestored && (
            <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="bg-amber-100 p-2 rounded-lg h-fit">
                <Info className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-900">Sesi Formulir Dipulihkan</p>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  Data teks Anda telah kami muat kembali dari sesi sebelumnya. 
                  <span className="block mt-1 font-semibold text-amber-800 underline decoration-amber-300">
                    PENTING: Anda harus mengunggah ulang file bukti/foto (jika ada) karena file tidak dapat disimpan secara otomatis di browser.
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* STEP 1: PROFIL */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-slate-900">Profil Pekerja</h2>
                <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">
                  Silakan lengkapi informasi identitas Anda untuk memulai pendaftaran rekam jejak kesehatan.
                </p>
              </div>

              <div className="space-y-8">
                {/* Section 1 */}
                <div>
                  <h3 className="flex items-center text-sm font-bold text-[#0ea5e9] mb-4 uppercase tracking-wider">
                    <User className="h-4 w-4 mr-2" /> Identitas Utama
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nama_lengkap">Nama Lengkap</Label>
                      <Input id="nama_lengkap" placeholder="Masukkan nama lengkap" className="h-11" value={baseData.nama_lengkap} onChange={e => setBaseData({ ...baseData, nama_lengkap: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nik">Nomor Kartu Pegawai</Label>
                      <Input
                        id="nik"
                        placeholder="Masukkan Nomor Kartu Pegawai"
                        className={`h-11 ${duplicateWarning.nik ? 'border-amber-400 bg-amber-50/30' : ''}`}
                        value={baseData.nik}
                        onChange={e => setBaseData({ ...baseData, nik: e.target.value })}
                        onBlur={(e) => checkDuplicate('nik', e.target.value)}
                      />
                      {duplicateWarning.nik && <p className="text-[10px] text-amber-600 font-medium">{duplicateWarning.nik}</p>}
                    </div>
                  </div>
                </div>

                {/* Section 2 */}
                <div>
                  <h3 className="flex items-center text-sm font-bold text-[#0ea5e9] mb-4 uppercase tracking-wider">
                    <User className="h-4 w-4 mr-2" /> Data Pribadi
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Tanggal Lahir</Label>
                      <Input type="date" className="h-11 block w-full text-slate-500" value={baseData.tanggal_lahir} onChange={e => setBaseData({ ...baseData, tanggal_lahir: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Jenis Kelamin</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setBaseData({ ...baseData, jenis_kelamin: 'L' })}
                          className={`flex items-center justify-center gap-2 h-11 border rounded-lg transition-colors ${baseData.jenis_kelamin === 'L' ? 'border-[#0ea5e9] bg-blue-50 text-[#0ea5e9] font-medium' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                          Laki-laki
                        </button>
                        <button
                          onClick={() => setBaseData({ ...baseData, jenis_kelamin: 'P' })}
                          className={`flex items-center justify-center gap-2 h-11 border rounded-lg transition-colors ${baseData.jenis_kelamin === 'P' ? 'border-[#0ea5e9] bg-blue-50 text-[#0ea5e9] font-medium' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                          Perempuan
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Section 3 */}
                <div>
                  <h3 className="flex items-center text-sm font-bold text-[#0ea5e9] mb-4 uppercase tracking-wider">
                    <ShieldAlert className="h-4 w-4 mr-2" /> Kontak & Alamat
                  </h3>
                  <div className="space-y-4">
                    {/* Opsi Keanggotaan Organisasi */}
                    <div id="is-anggota-selector" className="space-y-2.5">
                      <Label className="text-slate-700 font-bold">Apakah Anda Anggota Organisasi? <span className="text-red-500">*</span></Label>
                      <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-50 rounded-xl border border-slate-200/60">
                        <button 
                          type="button"
                          onClick={() => {
                            setBaseData(prev => ({ ...prev, is_anggota: true }));
                            setIsWaVerified(false);
                            setOtpSent(false);
                          }}
                          className={`py-2.5 px-3 text-xs font-bold rounded-lg transition-all ${
                            baseData.is_anggota === true 
                              ? "bg-[#0ea5e9] text-white shadow-sm border border-[#0ea5e9]/50" 
                              : "text-slate-500 hover:text-slate-800 bg-white border border-slate-200"
                          }`}
                        >
                          Ya, Anggota
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            setBaseData(prev => ({ ...prev, is_anggota: false }));
                            setIsWaVerified(false);
                            setOtpSent(false);
                          }}
                          className={`py-2.5 px-3 text-xs font-bold rounded-lg transition-all ${
                            baseData.is_anggota === false 
                              ? "bg-[#0ea5e9] text-white shadow-sm border border-[#0ea5e9]/50" 
                              : "text-slate-500 hover:text-slate-800 bg-white border border-slate-200"
                          }`}
                        >
                          Bukan Anggota
                        </button>
                      </div>
                    </div>

                    {/* Jika Opsi Keanggotaan Terpilih */}
                    {baseData.is_anggota !== null && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        {/* WA Input */}
                        <div className="space-y-2">
                          <Label htmlFor="whatsapp" className="flex items-center gap-1.5 font-semibold">
                            Nomor WhatsApp Aktif <span className="text-red-500">*</span>
                          </Label>
                          <div className="flex">
                            <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 text-slate-500 sm:text-sm font-bold">
                              +62
                            </span>
                            <Input 
                              id="whatsapp" 
                              placeholder="8123456xxx" 
                              className={cn("rounded-l-none h-11", duplicateWarning.whatsapp ? 'border-amber-400 bg-amber-50/30' : '', lockedWhatsapp ? "bg-slate-50 cursor-not-allowed" : "")}
                              readOnly={!!lockedWhatsapp || isWaVerified}
                              value={baseData.whatsapp} 
                              onChange={e => setBaseData({ ...baseData, whatsapp: e.target.value.replace(/\D/g, '') })} 
                              onBlur={(e) => checkDuplicate('whatsapp', e.target.value)}
                            />
                          </div>
                          {duplicateWarning.whatsapp && <p className="text-[10px] text-amber-600 font-medium">{duplicateWarning.whatsapp}</p>}
                        </div>

                        {/* Jika BUKAN Anggota -> Wajib Verifikasi WA OTP */}
                        {baseData.is_anggota === false && (
                          <div id="otp-verification-section" className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200/60 mt-2">
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                              Silakan kirim dan verifikasi nomor WhatsApp Anda untuk melanjutkan pengisian formulir.
                            </p>
                            {!isWaVerified ? (
                              <div className="space-y-3.5">
                                {!otpSent ? (
                                  <Button 
                                    type="button"
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-lg transition-all" 
                                    onClick={sendRegOtpCode}
                                    disabled={sendingOtp || !baseData.whatsapp}
                                  >
                                    {sendingOtp ? 'Mengirim Kode...' : 'Kirim Kode Verifikasi WhatsApp'}
                                  </Button>
                                ) : (
                                  <div className="space-y-3 animate-in zoom-in-95 duration-200">
                                    <div className="space-y-2">
                                      <Label htmlFor="reg_otp" className="text-xs font-bold text-slate-600">Masukkan Kode Verifikasi 6-Digit</Label>
                                      <Input 
                                        id="reg_otp" 
                                        type="text"
                                        maxLength={6} 
                                        className="text-center text-xl font-black tracking-[0.3em] h-11"
                                        placeholder="******" 
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                      />
                                      <p className="text-[10px] text-slate-400 mt-1">Kode OTP telah dikirimkan ke nomor +62{baseData.whatsapp}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <Button 
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                          setOtpSent(false);
                                          setOtpCode('');
                                        }}
                                        className="rounded-lg font-bold"
                                      >
                                        Ubah Nomor
                                      </Button>
                                      <Button 
                                        type="button"
                                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg" 
                                        onClick={verifyRegOtpCode}
                                        disabled={verifyingOtp}
                                      >
                                        {verifyingOtp ? 'Memverifikasi...' : 'Verifikasi OTP'}
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 p-3.5 rounded-lg text-xs font-bold animate-in fade-in duration-300">
                                <span className="w-5 h-5 flex items-center justify-center bg-emerald-500 text-white rounded-full text-[10px] font-black">✓</span>
                                Nomor WhatsApp Berhasil Diverifikasi!
                              </div>
                            )}
                          </div>
                        )}

                        {/* Jika ANGGOTA -> Tampilkan Email & Password */}
                        {baseData.is_anggota === true && (
                          <div className="space-y-4 pt-1 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="space-y-2">
                              <Label htmlFor="email" className="flex items-center gap-1.5 font-semibold">
                                Alamat Email <span className="text-red-500">*</span>
                              </Label>
                              <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                  id="email"
                                  type="email"
                                  placeholder="contoh@email.com"
                                  className="h-11 pl-10"
                                  value={baseData.email}
                                  onChange={e => setBaseData({ ...baseData, email: e.target.value })}
                                />
                              </div>
                            </div>

                          </div>
                        )}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Provinsi Domisili</Label>
                      <Select 
                        value={baseData.domisili} 
                        onValueChange={v => setBaseData({ ...baseData, domisili: v || '' })}
                      >
                        <SelectTrigger className="h-11 bg-white">
                          <SelectValue placeholder="Pilih Provinsi" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {PROVINCES.map((prov) => (
                            <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-slate-400 font-medium ml-1">Pilih provinsi tempat Anda tinggal saat ini (untuk pemetaan).</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Kabupaten/Kota</Label>
                        <Input
                          placeholder="Contoh: Kota Bandung"
                          className="h-11"
                          value={baseData.kabupaten || ''}
                          onChange={e => setBaseData({ ...baseData, kabupaten: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Kecamatan</Label>
                        <Input
                          placeholder="Contoh: Coblong"
                          className="h-11"
                          value={baseData.kecamatan || ''}
                          onChange={e => setBaseData({ ...baseData, kecamatan: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Pekerjaan Saat Ini */}
                <div className="pt-6 border-t border-slate-100">
                  <h3 className="flex items-center text-sm font-bold text-blue-600 mb-4 uppercase tracking-wider">
                    <Briefcase className="h-4 w-4 mr-2" /> Pekerjaan Saat Ini
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-1 sm:col-span-2">
                      <Label>Nama Perusahaan Tempat Bekerja Sekarang</Label>
                      <Select 
                        value={pekerjaanSaatIni.nama_perusahaan} 
                        onValueChange={(v) => setPekerjaanSaatIni({ ...pekerjaanSaatIni, nama_perusahaan: v || '' })}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Cari atau Pilih Perusahaan" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {perusahaanList.map((p) => (
                            <SelectItem key={p.id} value={p.nama_perusahaan}>{p.nama_perusahaan}</SelectItem>
                          ))}
                          <SelectItem value="Lainnya" className="font-bold text-blue-600">+ Perusahaan Tidak Terdaftar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {pekerjaanSaatIni.nama_perusahaan === 'Lainnya' && (
                      <>
                        <div className="space-y-2 col-span-1 sm:col-span-2 animate-in fade-in slide-in-from-top-2">
                          <Label className="text-blue-600 font-bold">Nama Perusahaan Baru</Label>
                          <Input 
                            placeholder="Masukkan nama perusahaan lengkap" 
                            className="h-11 border-blue-200 focus-visible:ring-blue-400"
                            value={pekerjaanSaatIni.nama_perusahaan_baru}
                            onChange={(e) => setPekerjaanSaatIni({ ...pekerjaanSaatIni, nama_perusahaan_baru: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2 col-span-1 sm:col-span-2 animate-in fade-in slide-in-from-top-2">
                          <Label className="text-blue-600 font-bold">Alamat Perusahaan Baru</Label>
                          <Input 
                            placeholder="Masukkan alamat lengkap perusahaan" 
                            className="h-11 border-blue-200 focus-visible:ring-blue-400"
                            value={pekerjaanSaatIni.alamat_perusahaan}
                            onChange={(e) => setPekerjaanSaatIni({ ...pekerjaanSaatIni, alamat_perusahaan: e.target.value })}
                          />
                        </div>
                      </>
                    )}

                    <div className="space-y-2">
                      <Label>Jabatan / Posisi Sekarang</Label>
                      <Input 
                        placeholder="Contoh: Operator Produksi" 
                        className="h-11"
                        value={pekerjaanSaatIni.jabatan}
                        onChange={(e) => setPekerjaanSaatIni({ ...pekerjaanSaatIni, jabatan: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Bagian / Departemen</Label>
                      <Input 
                        placeholder="Contoh: Produksi / Logistik" 
                        className="h-11"
                        value={pekerjaanSaatIni.bagian}
                        onChange={(e) => setPekerjaanSaatIni({ ...pekerjaanSaatIni, bagian: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Lama Bekerja (Tahun)</Label>
                      <Input 
                        type="number"
                        placeholder="0" 
                        className="h-11"
                        value={pekerjaanSaatIni.lama_bekerja}
                        onChange={(e) => setPekerjaanSaatIni({ ...pekerjaanSaatIni, lama_bekerja: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Status Pekerjaan</Label>
                      <Select 
                        value={pekerjaanSaatIni.status_pekerjaan} 
                        onValueChange={(v) => setPekerjaanSaatIni({ ...pekerjaanSaatIni, status_pekerjaan: v || '' })}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Pilih Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PKWTT">PKWTT (Tetap)</SelectItem>
                          <SelectItem value="PKWT">PKWT (Kontrak)</SelectItem>
                          <SelectItem value="Outsourcing">Outsourcing</SelectItem>
                          <SelectItem value="Harian">Harian Lepas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {pekerjaanSaatIni.status_pekerjaan === 'Outsourcing' && (
                      <>
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                          <Label className="text-blue-600 font-bold">Nama Pihak Ketiga / Agensi</Label>
                          <Input 
                            placeholder="Contoh: PT ISS Indonesia" 
                            className="h-11 border-blue-200 focus-visible:ring-blue-400"
                            value={pekerjaanSaatIni.nama_agen_penyalur}
                            onChange={(e) => setPekerjaanSaatIni({ ...pekerjaanSaatIni, nama_agen_penyalur: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                          <Label className="text-blue-600 font-bold">Alamat Pihak Ketiga / Agensi</Label>
                          <Input 
                            placeholder="Alamat lengkap kantor agensi" 
                            className="h-11 border-blue-200 focus-visible:ring-blue-400"
                            value={pekerjaanSaatIni.alamat_agen_penyalur}
                            onChange={(e) => setPekerjaanSaatIni({ ...pekerjaanSaatIni, alamat_agen_penyalur: e.target.value })}
                          />
                        </div>
                      </>
                    )}

                    <div className="space-y-2">
                      <Label>BPJS Ketenagakerjaan</Label>
                      <Select 
                        value={pekerjaanSaatIni.bpjs_bpu} 
                        onValueChange={(v) => setPekerjaanSaatIni({ ...pekerjaanSaatIni, bpjs_bpu: v || '' })}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Pilih Jenis BPJS" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PU">PU (Penerima Upah)</SelectItem>
                          <SelectItem value="BPU">BPU (Mandiri)</SelectItem>
                          <SelectItem value="Tidak Ada">Tidak Ada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Section 5: Riwayat Pekerjaan Sebelumnya */}
                <div className="pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="flex items-center text-sm font-bold text-[#0ea5e9] uppercase tracking-wider">
                      <History className="h-4 w-4 mr-2" /> Riwayat Pekerjaan Sebelumnya
                    </h3>
                    {!skipRiwayat && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-[#0ea5e9] hover:text-[#0284c7] hover:bg-blue-50 font-bold" 
                        onClick={() => setRiwayatLalu([...riwayatLalu, emptyRiwayatItem()])}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Tambah Riwayat
                      </Button>
                    )}
                  </div>

                  {/* Checkbox Skip Riwayat */}
                  <div className={`flex items-center gap-3 mb-6 p-4 rounded-xl border transition-all ${skipRiwayat ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100'}`}>
                    <Checkbox 
                      id="skip-riwayat" 
                      checked={skipRiwayat} 
                      onCheckedChange={(checked) => {
                        setSkipRiwayat(!!checked);
                        if (checked) setRiwayatLalu([]);
                      }} 
                    />
                    <div className="grid gap-0.5">
                      <Label htmlFor="skip-riwayat" className="text-sm font-bold text-slate-700 cursor-pointer">
                        Saya belum pernah bekerja di perusahaan lain sebelumnya
                      </Label>
                      <p className="text-[10px] text-slate-500">Centang jika ini adalah pekerjaan pertama Anda atau Anda belum pernah pindah perusahaan.</p>
                    </div>
                  </div>

                  {!skipRiwayat && (
                    <>
                      {riwayatLalu.length === 0 ? (
                        <div className="p-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-center flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setRiwayatLalu([emptyRiwayatItem()])}>
                          <Plus className="h-8 w-8 text-slate-300 mb-2" />
                          <p className="text-sm text-slate-400 font-medium">
                            Belum ada riwayat pekerjaan ditambahkan. Klik tombol di atas atau bagian ini untuk menambah.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {riwayatLalu.map((item, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                          {/* Header Card Pekerjaan */}
                          <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-200">
                            <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                              <span className="bg-[#0ea5e9] text-white w-5 h-5 flex items-center justify-center rounded-full text-xs">{idx + 1}</span>
                              {item.nama_perusahaan || `Pengalaman #${idx + 1}`}
                            </h4>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-500 hover:bg-blue-50 h-8 w-8"
                                onClick={() => {
                                  const newR = [...riwayatLalu];
                                  newR[idx].collapsed = !newR[idx].collapsed;
                                  setRiwayatLalu(newR);
                                }}>
                                {item.collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500 hover:bg-red-50 h-8 w-8"
                                onClick={() => setRiwayatLalu(riwayatLalu.filter((_, i) => i !== idx))}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Body: Data Pekerjaan */}
                          {!item.collapsed && (
                            <div className="p-5 animate-in fade-in duration-300">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2 sm:col-span-1">
                                  <Label>Nama Perusahaan Sebelumnya</Label>
                                  <Input 
                                    placeholder="Contoh: PT Logam Terpadu" 
                                    value={item.nama_perusahaan} 
                                    onChange={(e) => {
                                      const newR = [...riwayatLalu]; newR[idx].nama_perusahaan = e.target.value; setRiwayatLalu(newR);
                                    }} 
                                  />
                                </div>
                                <div className="space-y-2 col-span-2 sm:col-span-1">
                                  <Label>Alamat Perusahaan</Label>
                                  <Input 
                                    placeholder="Contoh: Jl. Industri No. 123, Jakarta" 
                                    value={item.alamat_perusahaan || ''} 
                                    onChange={(e) => {
                                      const newR = [...riwayatLalu]; newR[idx].alamat_perusahaan = e.target.value; setRiwayatLalu(newR);
                                    }} 
                                  />
                                </div>
                                <div className="space-y-2 col-span-2 sm:col-span-1">
                                  <Label>Status Pekerjaan</Label>
                                  <Select value={item.status_pekerjaan} onValueChange={(v: any) => {
                                    const newR = [...riwayatLalu]; 
                                    newR[idx].status_pekerjaan = v;
                                    if (v === 'Outsourcing') newR[idx].tgl_keluar = '';
                                    setRiwayatLalu(newR);
                                  }}>
                                    <SelectTrigger className="h-11 w-full"><SelectValue placeholder="Pilih Status" /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="PKWTT">1. PKWTT (Pekerja Tetap)</SelectItem>
                                      <SelectItem value="PKWT">2. PKWT (Pekerja Kontrak)</SelectItem>
                                      <SelectItem value="Outsourcing">3. Pekerja Outsourcing/Alih Daya</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {item.status_pekerjaan === 'Outsourcing' && (
                                  <>
                                    <div className="space-y-2 col-span-2 sm:col-span-1 animate-in fade-in">
                                      <Label className="text-blue-600 font-bold">Nama Pihak Ketiga / Agensi</Label>
                                      <Input 
                                        placeholder="Nama agensi penyalur" 
                                        value={item.nama_agen_penyalur} 
                                        onChange={(e) => {
                                          const newR = [...riwayatLalu]; newR[idx].nama_agen_penyalur = e.target.value; setRiwayatLalu(newR);
                                        }} 
                                      />
                                    </div>
                                    <div className="space-y-2 col-span-2 sm:col-span-1 animate-in fade-in">
                                      <Label className="text-blue-600 font-bold">Alamat Pihak Ketiga / Agensi</Label>
                                      <Input 
                                        placeholder="Alamat lengkap kantor agensi" 
                                        value={item.alamat_agen_penyalur || ''} 
                                        onChange={(e) => {
                                          const newR = [...riwayatLalu]; newR[idx].alamat_agen_penyalur = e.target.value; setRiwayatLalu(newR);
                                        }} 
                                      />
                                    </div>
                                  </>
                                )}

                                <div className="space-y-2 col-span-2 sm:col-span-1">
                                  <Label>Bagian / Departemen</Label>
                                  <Input 
                                    placeholder="Contoh: Produksi / Logistik" 
                                    value={item.bagian} 
                                    onChange={(e) => {
                                      const newR = [...riwayatLalu]; newR[idx].bagian = e.target.value; setRiwayatLalu(newR);
                                    }} 
                                  />
                                </div>
                                <div className="space-y-2 col-span-2 sm:col-span-1">
                                  <Label>Jabatan / Posisi</Label>
                                  <Input 
                                    placeholder="Contoh: Operator Produksi" 
                                    value={item.jabatan} 
                                    onChange={(e) => {
                                      const newR = [...riwayatLalu]; newR[idx].jabatan = e.target.value; setRiwayatLalu(newR);
                                    }} 
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Tanggal Masuk</Label>
                                  <Input type="date" value={item.tgl_masuk} onChange={(e) => {
                                    const newR = [...riwayatLalu]; newR[idx].tgl_masuk = e.target.value; setRiwayatLalu(newR);
                                  }} />
                                </div>
                                {item.status_pekerjaan !== 'PKWTT' && (
                                  <div className="space-y-2">
                                    <Label>Tanggal Keluar</Label>
                                    <Input type="date" value={item.tgl_keluar} onChange={(e) => {
                                      const newR = [...riwayatLalu]; newR[idx].tgl_keluar = e.target.value; setRiwayatLalu(newR);
                                    }} />
                                  </div>
                                )}

                                <div className="space-y-2 col-span-1 sm:col-span-2">
                                  <Label>Deskripsikan pekerjaan anda</Label>
                                  <Textarea 
                                    placeholder="Contoh: Mengoperasikan mesin cetak, melakukan pengecekan kualitas produk secara rutin..." 
                                    className="min-h-[80px] bg-white resize-none"
                                    value={item.deskripsi_pekerjaan} 
                                    onChange={(e) => {
                                      const newR = [...riwayatLalu]; 
                                      newR[idx].deskripsi_pekerjaan = e.target.value; 
                                      setRiwayatLalu(newR);
                                    }} 
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

                <div className="pt-8 border-t border-slate-100 mt-10">
                  <Button className="w-full h-12 text-base bg-[#0ea5e9] hover:bg-[#0284c7]" onClick={handleLanjut}>
                    Lanjutkan ke Pemetaan Bahaya <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PEMETAAN BAHAYA */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-slate-900">Pemetaan Bahaya</h2>
                <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">
                  Lengkapi informasi riwayat pajanan bahaya di tempat kerja Anda untuk deteksi dini Penyakit Akibat Kerja.
                </p>
              </div>

              <div className="space-y-8">
                <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-orange-500" /> Identifikasi Pajanan Bahaya
                    </h3>
                  </div>
                  <div className="p-8 space-y-6">
                    <HazardIdentification
                      value={pekerjaanSaatIni.jenis_pajanan}
                      onChange={(val) => setPekerjaanSaatIni({ ...pekerjaanSaatIni, jenis_pajanan: val })}
                      initialDetails={pekerjaanSaatIni.pajanan_details}
                      onDetailsChange={(details) => setPekerjaanSaatIni({ ...pekerjaanSaatIni, pajanan_details: details })}
                    />

                    <div className="pt-6 border-t border-slate-100 space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label className="text-sm font-bold text-slate-700">Pernah Ikut Pelatihan K3?</Label>
                          <Select 
                            value={pekerjaanSaatIni.training_k3 || ''} 
                            onValueChange={v => setPekerjaanSaatIni({ ...pekerjaanSaatIni, training_k3: v || '' })}
                          >
                            <SelectTrigger className="h-12 bg-white border-slate-200">
                              <SelectValue placeholder="Pilih Jawaban" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pernah">Ya, Pernah</SelectItem>
                              <SelectItem value="Belum Pernah">Belum Pernah</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-[10px] text-slate-400 italic">Pelatihan mengenai keselamatan and kesehatan di lingkungan kerja.</p>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-bold text-slate-700">Ada P2K3 di Perusahaan?</Label>
                          <Select 
                            value={pekerjaanSaatIni.ada_p2k3 || ''} 
                            onValueChange={v => setPekerjaanSaatIni({ ...pekerjaanSaatIni, ada_p2k3: v || '' })}
                          >
                            <SelectTrigger className="h-12 bg-white border-slate-200">
                              <SelectValue placeholder="Pilih Jawaban" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Ada">Ya, Ada</SelectItem>
                              <SelectItem value="Tidak Ada">Tidak Ada / Tidak Tahu</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-[10px] text-slate-400 italic">Panitia Pembina Keselamatan dan Kesehatan Kerja (P2K3).</p>
                        </div>
                      </div>

                      <div className="max-w-xs space-y-3 pt-6 border-t border-slate-100">
                        <Label className="text-sm font-bold text-slate-700">Total Durasi Pajanan (Tahun)</Label>
                        <div className="relative">
                          <Input 
                            placeholder="Contoh: 5" 
                            type="number" 
                            className="h-12 bg-white border-slate-200 focus:border-blue-400 font-bold text-lg px-4" 
                            value={pekerjaanSaatIni.durasi_pajanan} 
                            onChange={e => setPekerjaanSaatIni({ ...pekerjaanSaatIni, durasi_pajanan: e.target.value })} 
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">Tahun</div>
                        </div>
                        <p className="text-[10px] text-slate-400 italic">Masukkan estimasi total lamanya terpapar bahaya tersebut di lingkungan kerja.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-8 border-t border-slate-100">
                  <Button variant="outline" className="h-12 px-8" onClick={() => setStep(1)}>
                    <ArrowLeft className="mr-2 h-5 w-5" /> Kembali
                  </Button>
                  <Button className="flex-1 h-12 text-base bg-[#0ea5e9] hover:bg-[#0284c7]" onClick={handleLanjut}>
                    Lanjutkan ke Riwayat Kesehatan <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: RIWAYAT KESEHATAN */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <FormDetailMedis
                data={detailMedisData}
                onChange={handleDetailMedisChange}
              />

              <div className="mt-8 p-5 border-2 border-blue-100 bg-blue-50/50 rounded-2xl flex items-start space-x-4 transition-all hover:bg-blue-50">
                <Checkbox 
                  id="consent_checkbox" 
                  checked={isConsentChecked}
                  onCheckedChange={(checked) => setIsConsentChecked(!!checked)}
                  className="mt-1 border-blue-300 data-checked:bg-blue-600 data-checked:border-blue-600"
                />
                <div className="grid gap-2 leading-none">
                  <Label 
                    htmlFor="consent_checkbox" 
                    className="text-base font-bold text-blue-900 cursor-pointer select-none"
                  >
                    Pernyataan Persetujuan & Kebenaran Data
                  </Label>
                  <p className="text-sm text-blue-800/70 leading-relaxed">
                    Saya dengan ini menyatakan bahwa seluruh data yang saya masukkan adalah benar dan akurat. Saya <strong>menyetujui (Agree)</strong> data riwayat kesehatan ini digunakan oleh pihak perusahaan dan instansi terkait untuk keperluan evaluasi kesehatan kerja dan upaya advokasi Penyakit Akibat Kerja (PAK).
                  </p>
                </div>
              </div>

              <div className="pt-8 flex gap-4">
                <Button variant="outline" className="w-1/3 h-12 text-slate-600 bg-slate-50 border-slate-200" onClick={handleKembali}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                </Button>
                <Button className="w-2/3 h-12 text-base bg-[#0ea5e9] hover:bg-[#0284c7]" onClick={handleSubmit} disabled={loading || !isConsentChecked}>
                   <Save className="mr-2 h-4 w-4" /> {loading ? (Object.keys(duplicateWarning).length > 0 ? 'Memperbarui...' : 'Menyimpan...') : 'Selesai & Simpan'}
                </Button>
              </div>
            </div>
          )}

          {/* Internal Form Footer */}
          <div className="mt-12 flex justify-between items-center border-t border-slate-100 pt-6">
            <div className="flex gap-2">
              <ShieldAlert className="h-8 w-8 text-slate-200" />
              <div>
                <p className="text-[10px] font-bold text-slate-700">Butuh Bantuan?</p>
                <p className="text-[10px] text-slate-500">Hubungi admin via WhatsApp jika ada masalah dalam pengisian formulir.</p>
              </div>
            </div>
            <div className="flex gap-2 text-right">
              <div>
                <p className="text-[10px] font-bold text-slate-700">Privasi Data</p>
                <p className="text-[10px] text-slate-500">Data Anda dilindungi oleh enkripsi modern dan hanya digunakan untuk advokasi.</p>
              </div>
              <ShieldAlert className="h-8 w-8 text-slate-200" />
            </div>
          </div>
        </div>

        {/* Outer Footer */}
        <p className="text-center text-[10px] text-slate-400 mt-8 mb-8 uppercase tracking-widest">
          © {new Date().getFullYear()} ADVOKASI PENYAKIT AKIBAT KERJA (PAK) — HAK CIPTA DILINDUNGI
        </p>
      </main>
      {/* Reset Confirmation Dialog */}
      <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
          <AlertDialogHeader className="flex flex-col items-center justify-center text-center !text-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 border border-rose-100 shadow-sm mx-auto">
              <RefreshCw className="h-8 w-8 text-rose-600" />
            </div>
            <div className="space-y-2 w-full">
              <AlertDialogTitle className="text-2xl font-extrabold text-slate-900 tracking-tight text-center w-full">Reset Pendaftaran?</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-500 text-sm leading-relaxed max-w-[300px] mx-auto px-4 text-center">
                Tindakan ini akan menghapus <span className="text-rose-600 font-bold underline underline-offset-4 decoration-rose-200">seluruh progres</span> pendaftaran Anda secara permanen.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-3 mt-4">
            <AlertDialogCancel className="rounded-xl border-slate-200 text-slate-500 font-bold hover:bg-slate-50 px-6">
              Lanjutkan Mengisi
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                localStorage.removeItem(STORAGE_KEY);
                window.location.reload();
              }}
              className="rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-lg shadow-rose-200 border-none px-6"
            >
              Ya, Reset Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
