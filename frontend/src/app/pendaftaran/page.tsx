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
import { Bell, Globe, User, ShieldAlert, ArrowRight, ArrowLeft, Plus, UploadCloud, Save, CheckCircle, X, Activity, Info, Briefcase, HeartPulse, ClipboardList, Zap, Trash2, RefreshCw, Eye, EyeOff, Lock, Mail, ChevronDown, ChevronUp } from 'lucide-react';
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
    'Bising',
    'Getaran',
    'Debu Silika',
    'Uap Benzena',
    'Panas',
    'Bahan Kimia',
    'Radiasi',
    'Ergonomi',
    'Biologi',
    'Psikososial',
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
    tanggal_selesai_kontrak: '',
    jenis_pajanan: '',
    durasi_pajanan: '',
    pajanan_details: {} as Record<string, any>,
    nama_perusahaan_baru: '',
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
    file_bukti: [] as File[]
  });

  const [baseData, setBaseData] = useState({
    nik: '',
    nama_lengkap: '',
    email: '',
    password: '',
    perusahaan_id: '',
    status_kesehatan: 'sehat',
    catatan_admin: '',
    tanggal_lahir: '',
    jenis_kelamin: '',
    whatsapp: '',
    domisili: '',
  });

  const [detailMedisData, setDetailMedisData] = useState<DataMedis>({
    golongan_darah: '',
    riwayat_penyakit: '',
    alergi: '',
    riwayat_operasi: '',
    obat_rutin: '',
    riwayat_pemeriksaan: []
  });

  const [showPassword, setShowPassword] = useState(false);

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

        if (parsed.riwayatLalu) {
          setRiwayatLalu(parsed.riwayatLalu.map((r: any) => ({
            ...r,
            file_bukti: [],
            riwayat_pemeriksaan: (r.riwayat_pemeriksaan || []).map((m: any) => ({
              ...m,
              file_hasil: [],
              status_kesehatan: normalizeStatus(m.status_kesehatan)
            }))
          })));
        }
        if (parsed.apdData) setApdData(parsed.apdData);
        if (parsed.advokasiData) {
          setAdvokasiData(parsed.advokasiData.map((d: any) => ({
            ...d,
            file: null,
            status: d.status || 'Tidak',
          })));
        }

        const hasData = parsed.baseData?.nama_lengkap || parsed.baseData?.nik || parsed.pekerjaanSaatIni?.nama_perusahaan;
        if (hasData) {
          setWasRestored(true);
          toast.info("Data pendaftaran dipulihkan dari sesi sebelumnya.", {
            description: "⚠️ Demi keamanan, silakan unggah kembali dokumen (Paklaring atau Hasil Medis) sebelum mengirim.",
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

  const handleLanjut = () => setStep(step + 1);
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
    if (!baseData.whatsapp) {
      toast.error("Nomor Telepon wajib diisi!");
      scrollToField('whatsapp', 1);
      return;
    }
    if (!baseData.password || baseData.password.length < 8) {
      toast.error("Password minimal 8 karakter!");
      scrollToField('password', 1);
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
            pajanan_details: pekerjaanSaatIni.pajanan_details,
          },
          riwayat_pemeriksaan: (pekerjaanSaatIni.riwayat_pemeriksaan || []).filter(
            (m: any) => m.tanggal_pemeriksaan && m.hasil_diagnosis
          ).map((m: any) => ({
            tanggal_pemeriksaan: m.tanggal_pemeriksaan,
            tempat_pemeriksaan: m.tempat_pemeriksaan,
            alamat_pemeriksaan: m.alamat_pemeriksaan,
            jenis_pemeriksaan: m.jenis_pemeriksaan,
            jenis_pemeriksaan_lainnya: m.jenis_pemeriksaan_lainnya,
            dokter: m.dokter,
            status_kesehatan: m.status_kesehatan,
            hasil_diagnosis: m.hasil_diagnosis,
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
            (m: any) => m.tanggal_pemeriksaan && m.hasil_diagnosis
          ).map((m: any) => ({
            tanggal_pemeriksaan: m.tanggal_pemeriksaan,
            tempat_pemeriksaan: m.tempat_pemeriksaan,
            alamat_pemeriksaan: m.alamat_pemeriksaan,
            jenis_pemeriksaan: m.jenis_pemeriksaan,
            dokter: m.dokter,
            status_kesehatan: m.status_kesehatan,
            hasil_diagnosis: m.hasil_diagnosis,
            rekomendasi: m.rekomendasi,
            pendamping: m.pendamping,
          })),
          riwayat_pemeriksaan_raw: r.riwayat_pemeriksaan || []
        }));

      // Pemeriksaan Mandiri (tidak terikat pekerjaan tertentu)
      const validMedisRecords = detailMedisData.riwayat_pemeriksaan
        .filter((m: any) => m.tanggal_pemeriksaan && m.hasil_diagnosis);

      const finalMedis = validMedisRecords.map((m: any) => ({
        tanggal_pemeriksaan: m.tanggal_pemeriksaan,
        tempat_pemeriksaan: m.tempat_pemeriksaan,
        alamat_pemeriksaan: m.alamat_pemeriksaan,
        jenis_pemeriksaan: m.jenis_pemeriksaan,
        jenis_pemeriksaan_lainnya: m.jenis_pemeriksaan_lainnya,
        dokter: m.dokter,
        status_kesehatan: m.status_kesehatan,
        hasil_diagnosis: m.hasil_diagnosis,
        rekomendasi: m.rekomendasi,
        pendamping: m.pendamping,
      }));

      // Mapped Riwayat Medis (Baseline)
      const hasRiwayatMedis = detailMedisData.golongan_darah || detailMedisData.riwayat_penyakit || detailMedisData.alergi || detailMedisData.obat_rutin || detailMedisData.riwayat_operasi;
      const finalRiwayatMedis = hasRiwayatMedis ? {
        golongan_darah: detailMedisData.golongan_darah,
        riwayat_penyakit: detailMedisData.riwayat_penyakit ? detailMedisData.riwayat_penyakit.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        alergi: detailMedisData.alergi ? detailMedisData.alergi.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        riwayat_operasi: detailMedisData.riwayat_operasi ? detailMedisData.riwayat_operasi.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        obat_rutin: detailMedisData.obat_rutin
      } : null;

      const performSubmit = async (pId: string | null, riwayatData: any[]) => {
        const payload: any = {
          ...baseData,
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
        


        // 2. Employment History Files
        for (let i = 0; i < riwayatData.length; i++) {
          const files = (riwayatData[i].file_bukti || []).filter((f: any) => f instanceof File);
          if (files.length > 0 && savedRiwayat[i]) {
            const riwayatForm = new FormData();
            files.forEach((f: File) => riwayatForm.append('file_bukti[]', f));
            uploadPromises.push(api.post(`/riwayat-pekerja/${savedRiwayat[i].id}/file`, riwayatForm));
          }

        }


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
            'perusahaan_id': { id: 'perusahaan_id', s: 1 },
            'domisili': { id: 'domisili', s: 1 },
            'status_pekerjaan': { id: 'status_pekerjaan', s: 2 }
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

    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-16" suppressHydrationWarning={true}>

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
        <div className="flex items-center justify-center mb-10">
          <div className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${step >= 1 ? 'bg-[#0ea5e9] text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
              <span className={`text-xs font-semibold mt-2 text-center ${step >= 1 ? 'text-[#0ea5e9]' : 'text-slate-400'}`}>PROFIL <br />PEKERJA</span>
            </div>
            <div className={`w-12 h-[2px] mx-2 -mt-6 ${step >= 2 ? 'bg-[#0ea5e9]' : 'bg-slate-200'}`} />

            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${step >= 2 ? 'bg-[#0ea5e9] text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
              <span className={`text-xs font-semibold mt-2 text-center ${step >= 2 ? 'text-[#0ea5e9]' : 'text-slate-400'}`}>PEMETAAN <br />BAHAYA</span>
            </div>
            <div className={`w-12 h-[2px] mx-2 -mt-6 ${step >= 3 ? 'bg-[#0ea5e9]' : 'bg-slate-200'}`} />

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
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">Nomor Telepon (Gunakan untuk Login)</Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 text-slate-500 sm:text-sm">
                          +62
                        </span>
                        <Input 
                          id="whatsapp" 
                          placeholder="8123456xxx" 
                          className={cn("rounded-l-none h-11", duplicateWarning.whatsapp ? 'border-amber-400 bg-amber-50/30' : '', lockedWhatsapp ? "bg-slate-50 cursor-not-allowed" : "")}
                          readOnly={!!lockedWhatsapp}
                          value={baseData.whatsapp} 
                          onChange={e => setBaseData({ ...baseData, whatsapp: e.target.value.replace(/\D/g, '') })} 
                          onBlur={(e) => checkDuplicate('whatsapp', e.target.value)}
                        />
                      </div>
                      {duplicateWarning.whatsapp && <p className="text-[10px] text-amber-600 font-medium">{duplicateWarning.whatsapp}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Alamat Email (Opsional)</Label>
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

                    <div className="space-y-2">
                      <Label htmlFor="password">Password (Minimal 8 Karakter)</Label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Buat password untuk masuk"
                          className="h-11 pl-10 pr-10"
                          value={baseData.password}
                          onChange={e => setBaseData({ ...baseData, password: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium ml-1">Gunakan password ini untuk masuk ke dashboard nanti.</p>
                    </div>
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
                  </div>
                </div>

                {/* Section 4: Riwayat Pekerjaan (FULL VERSION) */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="flex items-center text-sm font-bold text-[#0ea5e9] uppercase tracking-wider">
                      <Briefcase className="h-4 w-4 mr-2" /> Riwayat Pekerjaan
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-[#0ea5e9] hover:text-[#0284c7] hover:bg-blue-50 font-bold" 
                      onClick={() => setRiwayatLalu([...riwayatLalu, emptyRiwayatItem()])}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Tambah Riwayat
                    </Button>
                  </div>

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
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 col-span-2 bg-orange-50/50 p-4 rounded-lg border border-orange-100 mt-2">
                                    <div className="space-y-2 col-span-2">
                                      <Label className="text-orange-700">Nama Perusahaan Penyalur / Agency</Label>
                                      <Input placeholder="Contoh: PT Sumber Daya Manusia" className="h-11 bg-white border-orange-200 focus-visible:ring-orange-400" value={item.nama_agen_penyalur || ''} onChange={(e) => {
                                        const newR = [...riwayatLalu]; newR[idx].nama_agen_penyalur = e.target.value; setRiwayatLalu(newR);
                                      }} />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                      <Label className="text-orange-700">Alamat Perusahaan Penyalur / Agency</Label>
                                      <Input placeholder="Masukkan alamat lengkap kantor agency" className="h-11 bg-white border-orange-200 focus-visible:ring-orange-400" value={item.informal_data?.alamat_perusahaan || ''} onChange={(e) => {
                                        const newR = [...riwayatLalu]; 
                                        newR[idx].informal_data = { ...(newR[idx].informal_data || {}), alamat_perusahaan: e.target.value };
                                        setRiwayatLalu(newR);
                                      }} />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-orange-700">Tanggal Masuk</Label>
                                      <Input type="date" className="h-11 bg-white text-slate-500 border-orange-200 focus-visible:ring-orange-400" value={item.tgl_masuk || ''} onChange={(e) => {
                                        const newR = [...riwayatLalu]; newR[idx].tgl_masuk = e.target.value; setRiwayatLalu(newR);
                                      }} />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-orange-700">Tanggal Selesai Kontrak</Label>
                                      <Input type="date" className="h-11 bg-white text-slate-500 border-orange-200 focus-visible:ring-orange-400" value={item.tanggal_selesai_kontrak || ''} onChange={(e) => {
                                        const newR = [...riwayatLalu]; newR[idx].tanggal_selesai_kontrak = e.target.value; setRiwayatLalu(newR);
                                      }} />
                                    </div>
                                  </div>
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

                                {/* MUTASI JABATAN */}
                                <div className="col-span-2 space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-200/50 mt-2">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                                      <RefreshCw className="h-3 w-3" /> Riwayat Mutasi / Perpindahan Bagian (Opsional)
                                    </Label>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-7 text-[10px] text-blue-500 hover:bg-blue-50"
                                      onClick={() => {
                                        const newR = [...riwayatLalu];
                                        newR[idx].informal_data = {
                                          ...(newR[idx].informal_data || {}),
                                          mutasi_jabatan: [...(newR[idx].informal_data?.mutasi_jabatan || []), { bagian: '', jabatan: '', tahun_mulai: '', tahun_selesai: '' }]
                                        };
                                        setRiwayatLalu(newR);
                                      }}
                                    >
                                      <Plus className="h-3 w-3 mr-1" /> Tambah Mutasi
                                    </Button>
                                  </div>
                                  
                                  {(item.informal_data?.mutasi_jabatan || []).map((m: any, midx: number) => (
                                    <div key={midx} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end animate-in fade-in slide-in-from-top-1">
                                      <div className="sm:col-span-1">
                                         <Label className="text-[9px] text-slate-400">Bagian</Label>
                                         <Input placeholder="Produksi" className="h-9 text-sm" value={m.bagian || ''} onChange={e => {
                                           const newR = [...riwayatLalu]; 
                                           newR[idx].informal_data.mutasi_jabatan[midx].bagian = e.target.value;
                                           setRiwayatLalu(newR);
                                         }} />
                                      </div>
                                      <div className="sm:col-span-1">
                                         <Label className="text-[9px] text-slate-400">Jabatan</Label>
                                         <Input placeholder="Staff" className="h-9 text-sm" value={m.jabatan || ''} onChange={e => {
                                           const newR = [...riwayatLalu]; 
                                           newR[idx].informal_data.mutasi_jabatan[midx].jabatan = e.target.value;
                                           setRiwayatLalu(newR);
                                         }} />
                                      </div>
                                      <div className="sm:col-span-1">
                                         <Label className="text-[9px] text-slate-400">Tahun Mulai</Label>
                                         <Input placeholder="2010" className="h-9 text-sm" value={m.tahun_mulai || ''} onChange={e => {
                                           const newR = [...riwayatLalu]; 
                                           newR[idx].informal_data.mutasi_jabatan[midx].tahun_mulai = e.target.value;
                                           setRiwayatLalu(newR);
                                         }} />
                                      </div>
                                      <div className="sm:col-span-1">
                                         <Label className="text-[9px] text-slate-400">Tahun Selesai</Label>
                                         <Input placeholder="2015" className="h-9 text-sm" value={m.tahun_selesai || ''} onChange={e => {
                                           const newR = [...riwayatLalu]; 
                                           newR[idx].informal_data.mutasi_jabatan[midx].tahun_selesai = e.target.value;
                                           setRiwayatLalu(newR);
                                         }} />
                                      </div>
                                      <div className="flex justify-center">
                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-red-500" onClick={() => {
                                          const newR = [...riwayatLalu];
                                          newR[idx].informal_data.mutasi_jabatan = item.informal_data.mutasi_jabatan.filter((_: any, i: number) => i !== midx);
                                          setRiwayatLalu(newR);
                                        }}>
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {item.status_pekerjaan !== 'Outsourcing' && (
                                  <div className="space-y-2">
                                    <Label>Tanggal Masuk</Label>
                                    <Input type="date" value={item.tgl_masuk} onChange={(e) => {
                                      const newR = [...riwayatLalu]; newR[idx].tgl_masuk = e.target.value; setRiwayatLalu(newR);
                                    }} />
                                  </div>
                                )}
                                {item.status_pekerjaan !== 'Outsourcing' && item.status_pekerjaan !== 'PKWTT' && (
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





                                  {item.status_pekerjaan !== 'Outsourcing' && (
                                    <div className="pt-4 border-t border-slate-50 space-y-3">
                                      <Label className="text-slate-800 font-bold text-sm">Upload Paklaring / Dokumen Verifikasi <span className="text-slate-400 font-normal italic ml-1">(Opsional)</span></Label>
                                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        <div className="relative group w-full sm:w-auto">
                                          <input 
                                            type="file" 
                                            multiple
                                            onChange={(e) => {
                                              const files = e.target.files ? Array.from(e.target.files) : [];
                                              const newR = [...riwayatLalu];
                                              newR[idx].file_bukti = files;
                                              setRiwayatLalu(newR);
                                            }}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                          />
                                          <Button variant="outline" size="sm" className="w-full sm:w-[250px] h-14 flex items-center justify-center border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 transition-all gap-3">
                                            <div className="bg-blue-100 p-2 rounded-full">
                                              <UploadCloud className="h-4 w-4 text-blue-600" /> 
                                            </div>
                                            <div className="flex flex-col items-start">
                                              <span className="text-[11px] font-bold text-slate-700">
                                                {item.file_bukti?.length > 0 ? 'Update Berkas Bukti' : 'Pilih Berkas Bukti'}
                                              </span>
                                              <span className="text-[9px] text-slate-500 font-normal">Format: PDF, JPG (Multiple)</span>
                                            </div>
                                          </Button>
                                        </div>
                                        {item.file_bukti?.length > 0 && (
                                          <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-2 rounded-lg">
                                            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                            <p className="text-[10px] text-blue-700 font-bold truncate max-w-[300px]">
                                              {item.file_bukti.length} file dipilih: {item.file_bukti.map((f: any) => f.name).join(', ')}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                <div className="pt-4">
                  <Button className="w-full h-12 text-base bg-[#0ea5e9] hover:bg-[#0284c7]" onClick={handleLanjut}>
                    Lanjut ke Langkah 2 <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PEMETAAN BAHAYA */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-slate-900">Pemetaan Bahaya & Resiko Kerja</h2>
                <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">
                  Lengkapi informasi riwayat pajanan bahaya di tempat kerja Anda untuk deteksi dini Penyakit Akibat Kerja.
                </p>
              </div>

              <div className="space-y-8">
                <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      Identifikasi Pajanan Bahaya
                    </h3>
                  </div>
                  <div className="p-8">
                    <HazardIdentification
                      value={pekerjaanSaatIni.jenis_pajanan}
                      onChange={(val) => setPekerjaanSaatIni({ ...pekerjaanSaatIni, jenis_pajanan: val })}
                      initialDetails={pekerjaanSaatIni.pajanan_details}
                      onDetailsChange={(details) => setPekerjaanSaatIni({ ...pekerjaanSaatIni, pajanan_details: details })}
                    />
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100 mt-10">
                  <div className="flex gap-4">
                    <Button variant="outline" className="w-1/3 h-12 text-slate-600 bg-slate-50 border-slate-200" onClick={handleKembali}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                    </Button>
                    <Button className="w-2/3 h-12 text-base bg-[#0ea5e9] hover:bg-[#0284c7]" onClick={handleLanjut}>
                      Lanjut ke Langkah 3 <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <FormDetailMedis
                data={detailMedisData}
                onChange={handleDetailMedisChange}
              />

              <div className="pt-8 flex gap-4">
                <Button variant="outline" className="w-1/3 h-12 text-slate-600 bg-slate-50 border-slate-200" onClick={handleKembali}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                </Button>
                <Button className="w-2/3 h-12 text-base bg-[#0ea5e9] hover:bg-[#0284c7]" onClick={handleSubmit} disabled={loading}>
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
