'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Bell, Globe, User, ShieldAlert, ArrowRight, ArrowLeft, Plus, UploadCloud, Save, CheckCircle, X, Activity, Info } from 'lucide-react';
import FormPekerjaInformal from '@/components/FormPekerjaInformal';
import FormDetailMedis, { type DataMedis } from '@/components/FormDetailMedis';

const STORAGE_KEY = 'REKAM_JEJAK_FORM_DATA';

export default function PendaftaranPekerjaPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [perusahaanList, setPerusahaanList] = useState<any[]>([]);
  const [duplicateWarning, setDuplicateWarning] = useState<{ nik?: string; email?: string }>({});

  // Form States 
  const [pasFoto, setPasFoto] = useState<File | null>(null);
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
    deskripsi_pekerjaan: '',
    file_bukti: [] as File[],
    riwayat_pemeriksaan: [] as any[],
  });

  // Helper: default blank medis item
  const emptyMedisItem = () => ({
    tanggal_pemeriksaan: '',
    tempat_pemeriksaan: '',
    jenis_pemeriksaan: '',
    dokter: '',
    status_kesehatan: 'sehat',
    hasil_diagnosis: '',
    rekomendasi: '',
    file_hasil: [] as File[],
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
    nama_perusahaan_baru: '',
    // Informal Data
    tugas_spesifik: '',
    lama_bekerja: '',
    satuan_waktu: 'Bulan',
    bpjs_bpu: '',
    apd_disediakan: '',
    jenis_apd_sendiri: '',
    lokasi_proyek: [] as string[]
  });

  const [baseData, setBaseData] = useState({
    nik: '',
    nama_lengkap: '',
    email: '',
    password: 'password123',
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
    riwayat_merokok: 'Tidak Pernah',
    riwayat_pemeriksaan: []
  });

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
  const [advokasiData, setAdvokasiData] = useState(
    advokasiQuestions.map(q => ({ question: q, status: 'Tidak', file: [] as File[] }))
  );

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

        // Normalize status_kesehatan values (fix old cached data with wrong format)
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
            riwayat_pemeriksaan: (r.riwayat_pemeriksaan || []).map((m: any) => ({
              ...m,
              status_kesehatan: normalizeStatus(m.status_kesehatan)
            }))
          })));
        }
        if (parsed.apdData) setApdData(parsed.apdData);
        if (parsed.advokasiData) {
          // File tidak bisa disimpan di localStorage, jadi reset file DAN status ke default
          // agar user tidak mengira bukti masih terunggah
          setAdvokasiData(parsed.advokasiData.map((d: any) => ({
            ...d,
            file: null,
            status: 'Tidak', // reset ke Tidak karena file-nya hilang
          })));
        }

        toast.info("Data pendaftaran dipulihkan dari sesi sebelumnya.", {
          description: "Silakan unggah kembali dokumen/foto jika ada.",
          duration: 10000,
        });
      } catch (err) {
        console.error("Failed to restore form data", err);
      }
    }
  }, []);

  // Persistence: Save to localStorage
  useEffect(() => {
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
  }, [step, baseData, pekerjaanSaatIni, detailMedisData, riwayatLalu, apdData, advokasiData]);

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

  const checkDuplicate = async (field: 'nik' | 'email', value: string) => {
    if (!value || value.length < 5) return;
    try {
      const res = await api.get(`/pekerja?search=${encodeURIComponent(value)}`);
      const match = res.data.data.data.find((p: any) =>
        field === 'nik' ? p.nik === value : p.user?.email.toLowerCase() === value.toLowerCase()
      );

      if (match) {
        setDuplicateWarning(prev => ({ ...prev, [field]: `Data ${field.toUpperCase()} sudah terdaftar. Melanjutkan akan memperbarui data pekerja yang ada.` }));
        toast.info(`Pekerja dengan ${field.toUpperCase()} ini sudah terdaftar.`, {
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
    const optionalCompanyStatuses = ['Borongan', 'Harian Lepas', 'Outsourcing'];
    const isCompanyOptional = optionalCompanyStatuses.includes(pekerjaanSaatIni.status_pekerjaan);
    const isInformal = pekerjaanSaatIni.status_pekerjaan === 'Borongan' || pekerjaanSaatIni.status_pekerjaan === 'Harian Lepas';

    // Explicit Validation Check with detailed feedback and scroll-to-focus
    if (!baseData.nama_lengkap) {
      toast.error("Nama Lengkap wajib diisi!");
      scrollToField('nama_lengkap', 1);
      return;
    }
    if (!baseData.nik) {
      toast.error("NIK wajib diisi!");
      scrollToField('nik', 1);
      return;
    }
    if (!baseData.email) {
      toast.error("Email wajib diisi!");
      scrollToField('email', 1);
      return;
    }
    if (!isCompanyOptional && !baseData.perusahaan_id) {
      toast.error("Pilih perusahaan Anda!");
      scrollToField('perusahaan_id', 1);
      return;
    }

    // Check Step 2 fields if not informal
    if (!isInformal) {
      if (!pekerjaanSaatIni.bagian) {
        toast.error("Bagian pekerjaan wajib diisi!");
        scrollToField('bagian', 2);
        return;
      }
      if (!pekerjaanSaatIni.jabatan) {
        toast.error("Jabatan wajib diisi!");
        scrollToField('jabatan', 2);
        return;
      }
      if (!pekerjaanSaatIni.tgl_masuk) {
        toast.error("Tanggal masuk wajib diisi!");
        scrollToField('tgl_masuk', 2);
        return;
      }
    }
    setLoading(true);
    try {
      const optionalCompanyStatuses = ['Borongan', 'Harian Lepas', 'Outsourcing'];
      const isCompanyOptional = optionalCompanyStatuses.includes(pekerjaanSaatIni.status_pekerjaan);

      let finalPerusahaanId = isCompanyOptional ? null : baseData.perusahaan_id;
      let currentPerusahaanName = '';

      // Handle New Perusahaan Creation
      if (finalPerusahaanId === 'NEW') {
        if (!pekerjaanSaatIni.nama_perusahaan_baru) {
          toast.error("Mohon masukkan nama perusahaan baru!");
          setLoading(false);
          return;
        }
        try {
          const res = await api.post('/perusahaan', {
            nama_perusahaan: pekerjaanSaatIni.nama_perusahaan_baru,
            status_pendamping: 'Dalam Pantauan',
            sektor_industri: pekerjaanSaatIni.deskripsi_usaha
          });
          finalPerusahaanId = res.data.data.id.toString();
          currentPerusahaanName = res.data.data.nama_perusahaan;
        } catch (err: any) {
          if (err.response?.status === 422 && err.response?.data?.errors?.nama_perusahaan) {
            // Gracefully handle duplicate name by searching for the existing one
            try {
              toast.loading("Perusahaan sudah ada, mengambil data...", { id: 'fetch-perusahaan' });
              const searchRes = await api.get(`/perusahaan?search=${encodeURIComponent(pekerjaanSaatIni.nama_perusahaan_baru)}`);
              const existing = searchRes.data.data.data.find((p: any) =>
                p.nama_perusahaan.trim().toLowerCase() === pekerjaanSaatIni.nama_perusahaan_baru.trim().toLowerCase()
              );

              if (existing) {
                finalPerusahaanId = existing.id.toString();
                currentPerusahaanName = existing.nama_perusahaan;
                toast.success("Data perusahaan ditemukan.", { id: 'fetch-perusahaan' });
              } else {
                throw err;
              }
            } catch (searchErr) {
              toast.error(err.response?.data?.message || "Gagal memproses data perusahaan.");
              setLoading(false);
              return;
            }
          } else {
            toast.error(err.response?.data?.message || "Gagal menambahkan perusahaan baru.");
            setLoading(false);
            return;
          }
        }
      } else {
        currentPerusahaanName = perusahaanList.find(p => p.id.toString() === finalPerusahaanId)?.nama_perusahaan || '';
      }

      // Build riwayat array combining current job and previous jobs
      const allRiwayat = [];
      const workerName = currentPerusahaanName || (isCompanyOptional ? "Pekerja Informal / Mandiri" : "");

      if (workerName || pekerjaanSaatIni.status_pekerjaan) {
        allRiwayat.push({
          nama_perusahaan: workerName || "-",
          deskripsi_usaha: pekerjaanSaatIni.deskripsi_usaha,
          bagian: pekerjaanSaatIni.bagian,
          jabatan: pekerjaanSaatIni.jabatan,
          status_pekerjaan: pekerjaanSaatIni.status_pekerjaan,
          nama_agen_penyalur: pekerjaanSaatIni.nama_agen_penyalur,
          tanggal_selesai_kontrak: pekerjaanSaatIni.tanggal_selesai_kontrak,
          deskripsi_pekerjaan: pekerjaanSaatIni.deskripsi_pekerjaan,
          tgl_masuk: pekerjaanSaatIni.tgl_masuk,
          tgl_keluar: null,
          informal_data: (pekerjaanSaatIni.status_pekerjaan === 'Borongan' || pekerjaanSaatIni.status_pekerjaan === 'Harian Lepas') ? {
            tugas_spesifik: pekerjaanSaatIni.tugas_spesifik,
            lama_bekerja: pekerjaanSaatIni.lama_bekerja,
            satuan_waktu: pekerjaanSaatIni.satuan_waktu,
            bpjs_bpu: pekerjaanSaatIni.bpjs_bpu,
            apd_disediakan: pekerjaanSaatIni.apd_disediakan,
            jenis_apd_sendiri: pekerjaanSaatIni.jenis_apd_sendiri,
            lokasi_proyek: pekerjaanSaatIni.lokasi_proyek
          } : null
        });
      }

      // Attach riwayat_pemeriksaan ke dalam setiap riwayat pekerjaan sebelumnya
      const prevRiwayat = riwayatLalu
        .filter(r => r.nama_perusahaan.trim() !== '')
        .map(r => ({
          ...r,
          riwayat_pemeriksaan: (r.riwayat_pemeriksaan || []).filter(
            (m: any) => m.tanggal_pemeriksaan && m.hasil_diagnosis
          ).map((m: any) => ({
            tanggal_pemeriksaan: m.tanggal_pemeriksaan,
            tempat_pemeriksaan: m.tempat_pemeriksaan,
            jenis_pemeriksaan: m.jenis_pemeriksaan,
            dokter: m.dokter,
            status_kesehatan: m.status_kesehatan,
            hasil_diagnosis: m.hasil_diagnosis,
            rekomendasi: m.rekomendasi,
            pendamping: m.pendamping,
          }))
        }));

      // Pemeriksaan Mandiri (tidak terikat pekerjaan tertentu)
      const validMedisRecords = detailMedisData.riwayat_pemeriksaan
        .filter((m: any) => m.tanggal_pemeriksaan && m.hasil_diagnosis);

      const finalMedis = validMedisRecords.map((m: any) => ({
        tanggal_pemeriksaan: m.tanggal_pemeriksaan,
        tempat_pemeriksaan: m.tempat_pemeriksaan,
        jenis_pemeriksaan: m.jenis_pemeriksaan,
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

        const pekerjaId = response.data.data.id;
        const savedRiwayat = response.data.data.riwayat_pekerja || [];
        const savedMedis = response.data.data.detail_medis || [];

        // 1. Profile Photo (Single)
        if (pasFoto) {
          const profileForm = new FormData();
          profileForm.append('pas_foto', pasFoto);
          await api.post(`/pekerja/${pekerjaId}/foto`, profileForm);
        }

        // 2. Employment History Files
        for (let i = 0; i < riwayatData.length; i++) {
          if (riwayatData[i].file_bukti && riwayatData[i].file_bukti.length > 0 && savedRiwayat[i]) {
            const riwayatForm = new FormData();
            riwayatData[i].file_bukti.forEach((f: File) => riwayatForm.append('file_bukti[]', f));
            await api.post(`/files/riwayat/${savedRiwayat[i].id}`, riwayatForm);
          }

          // Embedded medical records in work history
          const embeddedMedis = riwayatData[i]?.riwayat_pemeriksaan_raw || [];
          const savedEmbeddedMedis = savedRiwayat[i]?.detail_medis || [];
          for (let j = 0; j < embeddedMedis.length; j++) {
            if (embeddedMedis[j].file_hasil && embeddedMedis[j].file_hasil.length > 0 && savedEmbeddedMedis[j]) {
              const medisForm = new FormData();
              embeddedMedis[j].file_hasil.forEach((f: File) => medisForm.append('file_hasil[]', f));
              await api.post(`/files/medis/${savedEmbeddedMedis[j].id}`, medisForm);
            }
          }
        }

        // 3. Independent Medical Records
        // Independent medis are appended AFTER embedded ones in the backend usually
        const medisStartIndex = savedMedis.length - finalMedis.length;
        for (let i = 0; i < finalMedis.length; i++) {
          const mData = validMedisRecords[i]; // Accessing the original with file objects
          const sMedis = savedMedis[medisStartIndex + i];
          if (mData && mData.file_hasil && mData.file_hasil.length > 0 && sMedis) {
            const mForm = new FormData();
            mData.file_hasil.forEach((f: File) => mForm.append('file_hasil[]', f));
            await api.post(`/files/medis/${sMedis.id}`, mForm);
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

            if (item.file && item.file.length > 0) {
              item.file.forEach((f: File) => advForm.append('file[]', f));
            }

            await api.post(`/pekerja/${pekerjaId}/advokasi`, advForm);
          }
        }
      };

      try {
        await performSubmit(finalPerusahaanId, [...allRiwayat, ...prevRiwayat], validMedisRecords);
        localStorage.removeItem(STORAGE_KEY);
        toast.success('Pekerja berhasil didaftarkan!');
        router.push('/pekerja');
      } catch (error: any) {
        if (error.response?.status === 422) {
          const errors = error.response.data.errors || {};
          const firstField = Object.keys(errors)[0];

          // Map backend field names to UI IDs and Steps
          const fieldMap: any = {
            'nik': { id: 'nik', s: 1 },
            'nama_lengkap': { id: 'nama_lengkap', s: 1 },
            'email': { id: 'email', s: 1 },
            'perusahaan_id': { id: 'perusahaan_id', s: 1 },
            'whatsapp': { id: 'whatsapp', s: 1 },
            'domisili': { id: 'domisili', s: 1 },
            'status_pekerjaan': { id: 'status_pekerjaan', s: 2 }
          };

          if (fieldMap[firstField]) {
            toast.error(errors[firstField][0]);
            scrollToField(fieldMap[firstField].id, fieldMap[firstField].s);
            return; // Stop here, we've handled it
          }
        }

        // Handle "taken" error for new company gracefully
        if (error.response?.status === 422 && error.response?.data?.errors?.nama_perusahaan) {
          try {
            toast.loading("Mengecek ketersediaan data perusahaan...", { id: 'check-perusahaan' });
            const searchRes = await api.get(`/perusahaan?search=${encodeURIComponent(pekerjaanSaatIni.nama_perusahaan_baru)}`);
            const existing = searchRes.data.data.data.find((p: any) =>
              p.nama_perusahaan.trim().toLowerCase() === pekerjaanSaatIni.nama_perusahaan_baru.trim().toLowerCase()
            );

            if (existing) {
              toast.success("Perusahaan sudah terdaftar. Menghubungkan otomatis...", { id: 'check-perusahaan' });
              const updatedRiwayat = [...allRiwayat.map(r =>
                r.nama_perusahaan === currentPerusahaanName ? { ...r, nama_perusahaan: existing.nama_perusahaan } : r
              ), ...prevRiwayat];

              await performSubmit(existing.id.toString(), updatedRiwayat, validMedisRecords);
              localStorage.removeItem(STORAGE_KEY);
              toast.success('Pekerja berhasil didaftarkan!');
              router.push('/pekerja');
              return;
            }
          } catch (searchErr) {
            toast.error("Gagal memproses data perusahaan.", { id: 'check-perusahaan' });
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-16">
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
            className="text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 px-3"
            onClick={() => {
              if (confirm("Anda yakin ingin menghapus seluruh progres pendaftaran ini? Data yang sudah diisi akan hilang.")) {
                localStorage.removeItem(STORAGE_KEY);
                window.location.reload();
              }
            }}
          >
            Hapus Sesi / Reset
          </Button>
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
              <span className={`text-xs font-semibold mt-2 text-center ${step >= 2 ? 'text-[#0ea5e9]' : 'text-slate-400'}`}>RIWAYAT <br />PEKERJAAN</span>
            </div>
            <div className={`w-12 h-[2px] mx-2 -mt-6 ${step >= 3 ? 'bg-[#0ea5e9]' : 'bg-slate-200'}`} />

            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${step >= 3 ? 'bg-[#0ea5e9] text-white' : 'bg-slate-200 text-slate-500'}`}>3</div>
              <span className={`text-xs font-semibold mt-2 text-center ${step >= 3 ? 'text-[#0ea5e9]' : 'text-slate-400'}`}>DETAIL <br />KESEHATAN</span>
            </div>
            <div className={`w-12 h-[2px] mx-2 -mt-6 ${step >= 4 ? 'bg-[#0ea5e9]' : 'bg-slate-200'}`} />

            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${step >= 4 ? 'bg-[#0ea5e9] text-white' : 'bg-slate-200 text-slate-500'}`}>4</div>
              <span className={`text-xs font-semibold mt-2 text-center ${step >= 4 ? 'text-[#0ea5e9]' : 'text-slate-400'}`}>RIWAYAT<br />ADVOKASI</span>
            </div>
          </div>
        </div>

        {/* Card Content wrapper */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 sm:p-12 relative overflow-hidden">

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
                      <Label htmlFor="nama_lengkap">Nama Lengkap (Sesuai KTP)</Label>
                      <Input id="nama_lengkap" placeholder="Masukkan nama lengkap" className="h-11" value={baseData.nama_lengkap} onChange={e => setBaseData({ ...baseData, nama_lengkap: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nik">Nomor Induk Kependudukan / NIK</Label>
                      <Input
                        id="nik"
                        placeholder="Masukkan NIK 16 Digit"
                        maxLength={16}
                        className={`h-11 ${duplicateWarning.nik ? 'border-amber-400 bg-amber-50/30' : ''}`}
                        value={baseData.nik}
                        onChange={e => setBaseData({ ...baseData, nik: e.target.value.replace(/\D/g, '') })}
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
                      <Label htmlFor="whatsapp">Nomor WhatsApp</Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 text-slate-500 sm:text-sm">
                          +62
                        </span>
                        <Input id="whatsapp" placeholder="8123456xxx" className="rounded-l-none h-11" value={baseData.whatsapp} onChange={e => setBaseData({ ...baseData, whatsapp: e.target.value.replace(/\D/g, '') })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Alamat Email (Wajib untuk Login)</Label>
                      <Input
                        id="email"
                        placeholder="nama@email.com"
                        type="email"
                        className={`h-11 ${duplicateWarning.email ? 'border-amber-400 bg-amber-50/30' : ''}`}
                        value={baseData.email}
                        onChange={e => setBaseData({ ...baseData, email: e.target.value })}
                        onBlur={(e) => checkDuplicate('email', e.target.value)}
                      />
                      {duplicateWarning.email && <p className="text-[10px] text-amber-600 font-medium">{duplicateWarning.email}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Alamat Domisili</Label>
                      <Textarea placeholder="Contoh: Jl. Merdeka No. 123, Kelurahan, Kecamatan" className="resize-none h-24" value={baseData.domisili} onChange={e => setBaseData({ ...baseData, domisili: e.target.value })} />
                    </div>
                  </div>
                </div>

                {/* Upload Section */}
                <div>
                  <Label>Upload Pas Foto</Label>
                  <label className="mt-2 border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-[#0ea5e9] transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
                            toast.error("Format file tidak didukung. Gunakan JPG, PNG, atau WEBP.");
                            return;
                          }
                          setPasFoto(file);
                        }
                      }}
                    />
                    {pasFoto ? (
                      <div className="flex flex-col items-center text-center">
                        <CheckCircle className="h-8 w-8 text-emerald-500 mb-2" />
                        <span className="text-sm font-bold text-slate-700">{pasFoto.name}</span>
                        <span className="text-xs text-slate-400 mt-1">{(pasFoto.size / 1024 / 1024).toFixed(2)} MB</span>
                        <Button variant="ghost" size="sm" className="mt-4 h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50" onClick={(e) => { e.preventDefault(); setPasFoto(null); }}>
                          <X className="h-3 w-3 mr-1" /> Hapus File
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Plus className="h-6 w-6 mb-2 text-slate-400" />
                        <span className="text-sm font-medium">Tambah Pas Foto</span>
                      </>
                    )}
                  </label>
                </div>

                {/* Pekerjaan Saat Ini */}
                <div className="p-6 bg-white border border-slate-100 shadow-sm rounded-xl">
                  <h3 className="flex items-center text-sm font-bold text-[#0ea5e9] mb-6 uppercase tracking-wider">
                    <ShieldAlert className="h-4 w-4 mr-2" /> Pekerjaan Saat Ini
                  </h3>
                  <div className="space-y-5">
                    {!['Borongan', 'Harian Lepas', 'Outsourcing'].includes(pekerjaanSaatIni.status_pekerjaan) && (
                      <div className="space-y-2">
                        <Label htmlFor="perusahaan_id">Pilih Perusahaan Saat Ini</Label>
                        <Select value={baseData.perusahaan_id} onValueChange={(v: any) => setBaseData({ ...baseData, perusahaan_id: v })}>
                          <SelectTrigger id="perusahaan_id" className="h-11 w-full">
                            <SelectValue placeholder="Pilih Perusahaan">
                              {baseData.perusahaan_id === 'NEW'
                                ? "+ Tambah Perusahaan Baru"
                                : baseData.perusahaan_id ? perusahaanList.find(p => p.id.toString() === baseData.perusahaan_id)?.nama_perusahaan : "Pilih Perusahaan"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {perusahaanList.map((p) => (
                              <SelectItem key={p.id} value={p.id.toString()}>{p.nama_perusahaan}</SelectItem>
                            ))}
                            <SelectItem value="NEW" className="font-bold text-[#0ea5e9] bg-blue-50/50 mt-1 border-t border-slate-100">+ Tambah Perusahaan Baru</SelectItem>
                          </SelectContent>
                        </Select>

                        {baseData.perusahaan_id === 'NEW' && (
                          <div className="mt-3 p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-2">
                              <Label className="text-[#0ea5e9]">Nama Perusahaan Baru</Label>
                              <Input
                                placeholder="Masukkan nama perusahaan lengkap..."
                                className="h-11 bg-white border-blue-200 focus-visible:ring-blue-400"
                                value={pekerjaanSaatIni.nama_perusahaan_baru}
                                onChange={e => setPekerjaanSaatIni({ ...pekerjaanSaatIni, nama_perusahaan_baru: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[#0ea5e9]">Deskripsi Jenis Usaha</Label>
                              <Input
                                placeholder="Contoh: Industri Pengolahan Makanan"
                                className="h-11 bg-white border-blue-200 focus-visible:ring-blue-400"
                                value={pekerjaanSaatIni.deskripsi_usaha}
                                onChange={e => setPekerjaanSaatIni({ ...pekerjaanSaatIni, deskripsi_usaha: e.target.value })}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="status_pekerjaan">Status Pekerjaan</Label>
                      <Select value={pekerjaanSaatIni.status_pekerjaan} onValueChange={(v: any) => setPekerjaanSaatIni({ ...pekerjaanSaatIni, status_pekerjaan: v })}>
                        <SelectTrigger id="status_pekerjaan" className="h-11 w-full"><SelectValue placeholder="Pilih Status" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PKWTT">1. PKWTT (Pekerja Tetap)</SelectItem>
                          <SelectItem value="PKWT">2. PKWT (Pekerja Kontrak)</SelectItem>
                          <SelectItem value="Borongan">3. Pekerja Borongan</SelectItem>
                          <SelectItem value="Harian Lepas">4. Pekerja Harian Lepas</SelectItem>
                          <SelectItem value="Outsourcing">5. Pekerja Outsourcing/Alih Daya</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {pekerjaanSaatIni.status_pekerjaan === 'Outsourcing' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 bg-orange-50/50 p-4 rounded-lg border border-orange-100">
                        <div className="space-y-2">
                          <Label className="text-orange-700">Nama Agen Penyalur</Label>
                          <Input placeholder="Contoh: PT Sumber Daya Manusia" className="h-11 bg-white border-orange-200 focus-visible:ring-orange-400" value={pekerjaanSaatIni.nama_agen_penyalur} onChange={e => setPekerjaanSaatIni({ ...pekerjaanSaatIni, nama_agen_penyalur: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-orange-700">Tanggal Selesai Kontrak</Label>
                          <Input type="date" className="h-11 bg-white text-slate-500 border-orange-200 focus-visible:ring-orange-400" value={pekerjaanSaatIni.tanggal_selesai_kontrak} onChange={e => setPekerjaanSaatIni({ ...pekerjaanSaatIni, tanggal_selesai_kontrak: e.target.value })} />
                        </div>
                      </div>
                    )}
                    <FormPekerjaInformal
                      isInformal={pekerjaanSaatIni.status_pekerjaan === 'Borongan' || pekerjaanSaatIni.status_pekerjaan === 'Harian Lepas'}
                      data={{
                        tugas_spesifik: pekerjaanSaatIni.tugas_spesifik,
                        lama_bekerja: pekerjaanSaatIni.lama_bekerja,
                        satuan_waktu: pekerjaanSaatIni.satuan_waktu,
                        bpjs_bpu: pekerjaanSaatIni.bpjs_bpu,
                        apd_disediakan: pekerjaanSaatIni.apd_disediakan,
                        jenis_apd_sendiri: pekerjaanSaatIni.jenis_apd_sendiri,
                        lokasi_proyek: pekerjaanSaatIni.lokasi_proyek,
                      }}
                      onChange={(field, value) => setPekerjaanSaatIni({ ...pekerjaanSaatIni, [field]: value })}
                    />
                    {pekerjaanSaatIni.status_pekerjaan !== 'Borongan' && pekerjaanSaatIni.status_pekerjaan !== 'Harian Lepas' && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <Label htmlFor="bagian">Bagian</Label>
                            <Input id="bagian" placeholder="Contoh: Produksi / Logistik" className="h-11" value={pekerjaanSaatIni.bagian} onChange={e => setPekerjaanSaatIni({ ...pekerjaanSaatIni, bagian: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="jabatan">Jabatan / Posisi</Label>
                            <Input id="jabatan" placeholder="Contoh: Operator Produksi" className="h-11" value={pekerjaanSaatIni.jabatan} onChange={e => setPekerjaanSaatIni({ ...pekerjaanSaatIni, jabatan: e.target.value })} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tgl_masuk">Mulai Bekerja</Label>
                          <Input id="tgl_masuk" type="date" className="h-11 text-slate-500" value={pekerjaanSaatIni.tgl_masuk} onChange={e => setPekerjaanSaatIni({ ...pekerjaanSaatIni, tgl_masuk: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Deskripsi Pekerjaan</Label>
                          <Textarea placeholder="Jelaskan secara ringkas tugas dan tanggung jawab utama Anda..." className="resize-none h-24" value={pekerjaanSaatIni.deskripsi_pekerjaan} onChange={e => setPekerjaanSaatIni({ ...pekerjaanSaatIni, deskripsi_pekerjaan: e.target.value })} />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="pt-4">
                  <Button className="w-full h-12 text-base bg-[#0ea5e9] hover:bg-[#0284c7]" onClick={handleLanjut}>
                    Lanjut ke Langkah 2 <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: RIWAYAT */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-slate-900">Riwayat Pekerjaan & Kesehatan</h2>
                <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">
                  Lengkapi informasi pengalaman kerja dan riwayat pajanan bahaya di tempat kerja Anda.
                </p>
              </div>

              <div className="space-y-8">
                {/* Riwayat Sebelumnya */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800">Riwayat Pekerjaan Sebelumnya</h3>
                    <Button variant="ghost" size="sm" className="text-[#0ea5e9] hover:text-[#0284c7] hover:bg-blue-50" onClick={() => setRiwayatLalu([...riwayatLalu, emptyRiwayatItem()])}>
                      <Plus className="h-4 w-4 mr-1" /> Tambah Riwayat
                    </Button>
                  </div>

                  {riwayatLalu.length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setRiwayatLalu([emptyRiwayatItem()])}>
                      <Plus className="h-8 w-8 text-slate-300 mb-2" />
                      <p className="text-sm text-slate-500 max-w-[250px]">
                        Belum ada Riwayat Pekerjaan Ditambahkan.
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        (Tekan <strong>Tambah Riwayat</strong> jika ada pengalaman kerja sebelumnya)
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
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500 hover:bg-red-50 h-8 w-8"
                              onClick={() => setRiwayatLalu(riwayatLalu.filter((_, i) => i !== idx))}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Body: Data Pekerjaan */}
                          <div className="p-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2 col-span-2 sm:col-span-1">
                                <Label>Nama Perusahaan Sebelumnya</Label>
                                <Input placeholder="Cth: PT Logam Terpadu" value={item.nama_perusahaan} onChange={(e) => {
                                  const newR = [...riwayatLalu]; newR[idx].nama_perusahaan = e.target.value; setRiwayatLalu(newR);
                                }} />
                              </div>
                              <div className="space-y-2 col-span-2 sm:col-span-1">
                                <Label>Status Pekerjaan</Label>
                                <Select value={item.status_pekerjaan} onValueChange={(v: any) => {
                                  const newR = [...riwayatLalu]; newR[idx].status_pekerjaan = v; setRiwayatLalu(newR);
                                }}>
                                  <SelectTrigger className="h-11 w-full"><SelectValue placeholder="Pilih Status" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="PKWTT">1. PKWTT (Pekerja Tetap)</SelectItem>
                                    <SelectItem value="PKWT">2. PKWT (Pekerja Kontrak)</SelectItem>
                                    <SelectItem value="Borongan">3. Pekerja Borongan</SelectItem>
                                    <SelectItem value="Harian Lepas">4. Pekerja Harian Lepas</SelectItem>
                                    <SelectItem value="Outsourcing">5. Pekerja Outsourcing/Alih Daya</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {item.status_pekerjaan === 'Outsourcing' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 col-span-2 bg-orange-50/50 p-4 rounded-lg border border-orange-100 mt-2">
                                  <div className="space-y-2">
                                    <Label className="text-orange-700">Nama Agen Penyalur</Label>
                                    <Input placeholder="Contoh: PT Sumber Daya Manusia" className="h-11 bg-white border-orange-200 focus-visible:ring-orange-400" value={item.nama_agen_penyalur} onChange={(e) => {
                                      const newR = [...riwayatLalu]; newR[idx].nama_agen_penyalur = e.target.value; setRiwayatLalu(newR);
                                    }} />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-orange-700">Tanggal Selesai Kontrak</Label>
                                    <Input type="date" className="h-11 bg-white text-slate-500 border-orange-200 focus-visible:ring-orange-400" value={item.tanggal_selesai_kontrak} onChange={(e) => {
                                      const newR = [...riwayatLalu]; newR[idx].tanggal_selesai_kontrak = e.target.value; setRiwayatLalu(newR);
                                    }} />
                                  </div>
                                </div>
                              )}

                              <div className="space-y-2 col-span-2 sm:col-span-1">
                                <Label>Bagian / Departemen</Label>
                                <Input placeholder="Contoh: Produksi / Logistik" value={item.bagian} onChange={(e) => {
                                  const newR = [...riwayatLalu]; newR[idx].bagian = e.target.value; setRiwayatLalu(newR);
                                }} />
                              </div>
                              <div className="space-y-2 col-span-2 sm:col-span-1">
                                <Label>Jabatan / Posisi</Label>
                                <Input placeholder="Contoh: Operator Produksi" value={item.jabatan} onChange={(e) => {
                                  const newR = [...riwayatLalu]; newR[idx].jabatan = e.target.value; setRiwayatLalu(newR);
                                }} />
                              </div>
                              <div className="space-y-2">
                                <Label>Tanggal Masuk</Label>
                                <Input type="date" value={item.tgl_masuk} onChange={(e) => {
                                  const newR = [...riwayatLalu]; newR[idx].tgl_masuk = e.target.value; setRiwayatLalu(newR);
                                }} />
                              </div>
                              <div className="space-y-2">
                                <Label>Tanggal Keluar</Label>
                                <Input type="date" value={item.tgl_keluar} onChange={(e) => {
                                  const newR = [...riwayatLalu]; newR[idx].tgl_keluar = e.target.value; setRiwayatLalu(newR);
                                }} />
                              </div>

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

                              <div className="space-y-2 col-span-1 sm:col-span-2 mt-1">
                                <Label>Upload Paklaring / Dokumen Verifikasi <span className="text-slate-400 font-normal italic ml-1">(Opsional)</span></Label>
                                <div className="mt-1 flex items-center gap-3">
                                  <div className="relative group">
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
                                    <Button variant="outline" size="sm" className="h-8 text-[11px] border-dashed border-slate-300">
                                      <UploadCloud className="h-3 w-3 mr-2" /> 
                                      {item.file_bukti?.length > 0 ? `Update Berkas (${item.file_bukti.length})` : 'Pilih Berkas Bukti (Multiple)'}
                                    </Button>
                                  </div>
                                  {item.file_bukti?.length > 0 && (
                                    <span className="text-[10px] text-slate-500 italic truncate max-w-[150px]">
                                      {item.file_bukti.map((f: any) => f.name).join(', ')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Sub-seksi: Riwayat Kesehatan saat di perusahaan ini */}
                            <div className="mt-5 pt-5 border-t border-slate-100">
                              <h5 className="text-sm font-bold text-blue-700 flex items-center gap-2 mb-4">
                                <Activity className="h-4 w-4" />
                                Riwayat Kesehatan saat di {item.nama_perusahaan || 'perusahaan ini'}
                              </h5>
                              {(() => {
                                const src = item.riwayat_pemeriksaan?.[0];
                                const med = {
                                  tanggal_pemeriksaan: src?.tanggal_pemeriksaan ?? '',
                                  tempat_pemeriksaan:  src?.tempat_pemeriksaan  ?? '',
                                  jenis_pemeriksaan:   src?.jenis_pemeriksaan   ?? '',
                                  dokter:              src?.dokter              ?? '',
                                  status_kesehatan:    src?.status_kesehatan    ?? 'sehat',
                                  hasil_diagnosis:     src?.hasil_diagnosis     ?? '',
                                  rekomendasi:         src?.rekomendasi         ?? '',
                                  file_hasil:          src?.file_hasil          ?? [] as File[],
                                  pendamping:          src?.pendamping          ?? '',
                                };
                                const updateMed = (field: string, value: any) => {
                                  const newR = [...riwayatLalu];
                                  const cur = newR[idx].riwayat_pemeriksaan?.[0];
                                  newR[idx].riwayat_pemeriksaan = [{
                                    tanggal_pemeriksaan: cur?.tanggal_pemeriksaan ?? '',
                                    tempat_pemeriksaan:  cur?.tempat_pemeriksaan  ?? '',
                                    jenis_pemeriksaan:   cur?.jenis_pemeriksaan   ?? '',
                                    dokter:              cur?.dokter              ?? '',
                                    status_kesehatan:    cur?.status_kesehatan    ?? 'sehat',
                                    hasil_diagnosis:     cur?.hasil_diagnosis     ?? '',
                                    rekomendasi:         cur?.rekomendasi         ?? '',
                                    file_hasil:          cur?.file_hasil          ?? [],
                                    pendamping:          cur?.pendamping          ?? '',
                                    [field]: value,
                                  }];
                                  setRiwayatLalu(newR);
                                };
                                return (
                                  <div className="bg-blue-50/40 border border-blue-100 rounded-lg p-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div className="space-y-1">
                                        <Label className="text-xs text-slate-600">Tanggal Pemeriksaan</Label>
                                        <Input type="date" className="h-9 bg-white text-slate-600 text-sm" value={med.tanggal_pemeriksaan} onChange={e => updateMed('tanggal_pemeriksaan', e.target.value)} />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs text-slate-600">Tempat Pemeriksaan</Label>
                                        <Input placeholder="Klinik/RS..." className="h-9 bg-white text-sm" value={med.tempat_pemeriksaan} onChange={e => updateMed('tempat_pemeriksaan', e.target.value)} />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs text-slate-600">Jenis Pemeriksaan</Label>
                                        <Select value={med.jenis_pemeriksaan} onValueChange={v => updateMed('jenis_pemeriksaan', v)}>
                                          <SelectTrigger className="h-9 w-full bg-white text-sm"><SelectValue placeholder="Pilih Jenis" /></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="MCU Berkala">MCU Berkala</SelectItem>
                                            <SelectItem value="Rontgen Thorax">Rontgen Thorax</SelectItem>
                                            <SelectItem value="Spirometri">Spirometri</SelectItem>
                                            <SelectItem value="Audiometri">Audiometri</SelectItem>
                                            <SelectItem value="Tes Darah/Lab">Tes Darah / Lab</SelectItem>
                                            <SelectItem value="Lainnya">Lainnya</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs text-slate-600">Status Kesehatan</Label>
                                        <Select value={med.status_kesehatan || 'sehat'} onValueChange={v => updateMed('status_kesehatan', v)}>
                                          <SelectTrigger className="h-9 w-full bg-white text-sm"><SelectValue placeholder="Pilih Status" /></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="sehat">Sehat</SelectItem>
                                            <SelectItem value="sehat_dengan_catatan">Sehat Dengan Catatan</SelectItem>
                                            <SelectItem value="tidak_sehat">Tidak Sehat</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs text-slate-600">Dokter yang Memeriksa</Label>
                                        <Input placeholder="Nama dokter..." className="h-9 bg-white text-sm" value={med.dokter} onChange={e => updateMed('dokter', e.target.value)} />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs text-slate-600">Pendamping Lapangan</Label>
                                        <Select value={med.pendamping} onValueChange={v => updateMed('pendamping', v)}>
                                          <SelectTrigger className="h-9 w-full bg-white text-sm"><SelectValue placeholder="Pilih Pendamping" /></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Klinik Internal">Klinik Internal Perusahaan</SelectItem>
                                            <SelectItem value="Faskes BPJSKes">Faskes Pertama (BPJS)</SelectItem>
                                            <SelectItem value="Dokter Okupasi">Dokter Spesialis Okupasi</SelectItem>
                                            <SelectItem value="Mandiri">Berangkat Mandiri</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-1 col-span-1 sm:col-span-2">
                                        <Label className="text-xs text-slate-600">Hasil Diagnosis</Label>
                                        <Textarea placeholder="Ringkasan hasil diagnosis..." className="min-h-[70px] bg-white resize-none text-sm" value={med.hasil_diagnosis} onChange={e => updateMed('hasil_diagnosis', e.target.value)} />
                                      </div>
                                      <div className="space-y-1 col-span-1 sm:col-span-2">
                                        <Label className="text-xs text-slate-600">Rekomendasi Dokter <span className="text-slate-400 font-normal">(Opsional)</span></Label>
                                        <Textarea placeholder="Saran dari dokter..." className="min-h-[60px] bg-white resize-none text-sm" value={med.rekomendasi} onChange={e => updateMed('rekomendasi', e.target.value)} />
                                      </div>
                                      <div className="space-y-1 col-span-1 sm:col-span-2">
                                        <Label className="text-xs text-slate-600">Unggah Hasil Pemeriksaan (Multiple) <span className="text-slate-400 font-normal">(Opsional)</span></Label>
                                        <label className="flex items-center gap-3 bg-white border border-slate-200 hover:border-[#0ea5e9] rounded-lg px-3 py-2 cursor-pointer transition-colors h-9">
                                          <UploadCloud className="w-3.5 h-3.5 text-[#0ea5e9]" />
                                          <span className="text-xs text-slate-500 flex-1 truncate">
                                            {med.file_hasil?.length > 0 
                                              ? `${med.file_hasil.length} file dipilih: ${med.file_hasil.map((f: any) => f.name).join(', ')}` 
                                              : 'Pilih file PDF/JPG'}
                                          </span>
                                          <input 
                                            type="file" 
                                            multiple
                                            accept=".pdf,.jpg,.jpeg,.png" 
                                            className="hidden" 
                                            onChange={e => { 
                                              const files = e.target.files ? Array.from(e.target.files) : [];
                                              updateMed('file_hasil', files); 
                                            }} 
                                          />
                                        </label>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pemeriksaan Mandiri (tidak terikat pekerjaan tertentu) */}
                <div className="p-6 bg-white border border-slate-100 shadow-sm rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <span className="inline-block w-1.5 h-4 bg-emerald-500 rounded-full" />
                        Pemeriksaan Mandiri
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 ml-3.5">Pemeriksaan tidak terikat perusahaan tertentu (sebelum/setelah bekerja, atau pribadi)</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      onClick={() => handleDetailMedisChange('riwayat_pemeriksaan', [
                        ...detailMedisData.riwayat_pemeriksaan,
                        { tanggal_pemeriksaan: '', tempat_pemeriksaan: '', jenis_pemeriksaan: '', dokter: '', status_kesehatan: 'sehat', hasil_diagnosis: '', rekomendasi: '', file_hasil: null, pendamping: '' }
                      ])}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Tambah
                    </Button>
                  </div>

                  {detailMedisData.riwayat_pemeriksaan.length === 0 ? (
                    <div
                      className="border border-dashed border-emerald-200 rounded-xl p-6 text-center bg-emerald-50/30 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50 transition-colors"
                      onClick={() => handleDetailMedisChange('riwayat_pemeriksaan', [
                        { tanggal_pemeriksaan: '', tempat_pemeriksaan: '', jenis_pemeriksaan: '', dokter: '', status_kesehatan: 'sehat', hasil_diagnosis: '', rekomendasi: '', file_hasil: null, pendamping: '' }
                      ])}
                    >
                      <Plus className="h-7 w-7 text-emerald-300 mb-2" />
                      <p className="text-sm text-emerald-600 font-medium">Belum ada pemeriksaan mandiri.</p>
                      <p className="text-xs text-slate-400 mt-1">Klik untuk menambah (opsional).</p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {detailMedisData.riwayat_pemeriksaan.map((item: any, index: number) => {
                        const updateItem = (field: string, value: any) => {
                          const newArr = [...detailMedisData.riwayat_pemeriksaan];
                          newArr[index] = { ...newArr[index], [field]: value };
                          handleDetailMedisChange('riwayat_pemeriksaan', newArr);
                        };
                        return (
                          <div key={index} className="bg-emerald-50/40 border border-emerald-100 rounded-lg p-5 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-between mb-4 pb-2 border-b border-emerald-100">
                              <h4 className="font-semibold text-slate-700 flex items-center gap-2 text-sm">
                                <span className="bg-emerald-100 text-emerald-700 w-5 h-5 flex items-center justify-center rounded-full text-xs">{index + 1}</span>
                                Pemeriksaan Mandiri
                              </h4>
                              <Button type="button" variant="ghost" size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2 text-xs"
                                onClick={() => handleDetailMedisChange('riwayat_pemeriksaan', detailMedisData.riwayat_pemeriksaan.filter((_: any, i: number) => i !== index))}>
                                <X className="h-3.5 w-3.5 mr-1" /> Hapus
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-slate-700">Tanggal Pemeriksaan</Label>
                                <Input type="date" className="h-11 bg-white" value={item.tanggal_pemeriksaan} onChange={e => updateItem('tanggal_pemeriksaan', e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-slate-700">Tempat Pemeriksaan</Label>
                                <Input placeholder="Klinik/Puskesmas/Rumah Sakit" className="h-11 bg-white" value={item.tempat_pemeriksaan} onChange={e => updateItem('tempat_pemeriksaan', e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-slate-700">Jenis Pemeriksaan</Label>
                                <Select value={item.jenis_pemeriksaan} onValueChange={v => updateItem('jenis_pemeriksaan', v)}>
                                  <SelectTrigger className="h-11 w-full bg-white"><SelectValue placeholder="Pilih Jenis" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="MCU Berkala">MCU Berkala</SelectItem>
                                    <SelectItem value="Rontgen Thorax">Rontgen Thorax</SelectItem>
                                    <SelectItem value="Spirometri">Spirometri</SelectItem>
                                    <SelectItem value="Audiometri">Audiometri</SelectItem>
                                    <SelectItem value="Tes Darah/Lab">Tes Darah Lengkap / Lab</SelectItem>
                                    <SelectItem value="Lainnya">Lainnya</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-slate-700">Dokter yang Memeriksa</Label>
                                <Input placeholder="Nama Dokter..." className="h-11 bg-white" value={item.dokter} onChange={e => updateItem('dokter', e.target.value)} />
                              </div>
                              <div className="space-y-2 col-span-1 sm:col-span-2">
                                <Label className="text-slate-700">Hasil Diagnosis</Label>
                                <Textarea placeholder="Ringkasan hasil diagnosis..." className="min-h-[80px] bg-white resize-none" value={item.hasil_diagnosis} onChange={e => updateItem('hasil_diagnosis', e.target.value)} />
                              </div>
                              <div className="space-y-2 col-span-1 sm:col-span-2">
                                <Label className="text-slate-700">Rekomendasi Dokter <span className="text-slate-400 font-normal">(Opsional)</span></Label>
                                <Textarea placeholder="Saran dari dokter (opsional)" className="min-h-[70px] bg-white resize-none" value={item.rekomendasi} onChange={e => updateItem('rekomendasi', e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-slate-700">Status Kesehatan</Label>
                                <Select value={item.status_kesehatan || 'sehat'} onValueChange={v => updateItem('status_kesehatan', v)}>
                                  <SelectTrigger className="h-11 w-full bg-white"><SelectValue placeholder="Pilih Status" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="sehat">Sehat</SelectItem>
                                    <SelectItem value="sehat_dengan_catatan">Sehat dengan Catatan</SelectItem>
                                    <SelectItem value="tidak_sehat">Tidak Sehat</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-slate-700">Unggah Hasil Pemeriksaan</Label>
                                <label className="flex items-center gap-3 bg-white border border-slate-200 hover:border-[#0ea5e9] rounded-lg px-3 py-2 cursor-pointer transition-colors h-11">
                                  <UploadCloud className="w-4 h-4 text-[#0ea5e9]" />
                                  <span className="text-sm text-slate-500 flex-1 truncate">{item.file_hasil ? item.file_hasil.name : 'Pilih file PDF/JPG'}</span>
                                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => { if (e.target.files?.[0]) updateItem('file_hasil', e.target.files[0]); }} />
                                </label>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-slate-700">Pendamping Lapangan</Label>
                                <Select value={item.pendamping} onValueChange={v => updateItem('pendamping', v)}>
                                  <SelectTrigger className="h-11 w-full bg-white"><SelectValue placeholder="Pilih Pendamping" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Klinik Internal">Klinik Internal Perusahaan</SelectItem>
                                    <SelectItem value="Faskes BPJSKes">Faskes Pertama (BPJS)</SelectItem>
                                    <SelectItem value="Dokter Okupasi">Dokter Spesialis Okupasi</SelectItem>
                                    <SelectItem value="Mandiri">Berangkat Mandiri</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="p-6 bg-red-50/30 border border-red-100 rounded-xl">
                  <h3 className="flex items-center text-sm font-bold text-red-500 mb-2 uppercase tracking-wider">
                    <ShieldAlert className="h-4 w-4 mr-2" /> Riwayat Pajanan (Exposure)
                  </h3>
                  <p className="text-xs text-slate-500 mb-6">Informasi ini penting untuk mendeteksi Penyakit Akibat Kerja (PAK).</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                    <div className="space-y-2">
                      <Label className="text-slate-700">Jenis Pajanan</Label>
                      <Select value={pekerjaanSaatIni.jenis_pajanan} onValueChange={(v: any) => setPekerjaanSaatIni({ ...pekerjaanSaatIni, jenis_pajanan: v })}>
                        <SelectTrigger className="h-11 w-full bg-white"><SelectValue placeholder="Pilih Jenis Pajanan" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Kimia">Kimia</SelectItem>
                          <SelectItem value="Fisik">Fisik (Bising/Getaran)</SelectItem>
                          <SelectItem value="Biologi">Biologi</SelectItem>
                          <SelectItem value="Psikososial">Psikososial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700">Durasi Pajanan (Tahun)</Label>
                      <Input placeholder="Contoh: 3" type="number" className="h-11 bg-white" value={pekerjaanSaatIni.durasi_pajanan} onChange={e => setPekerjaanSaatIni({ ...pekerjaanSaatIni, durasi_pajanan: e.target.value })} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-slate-700">Alat Pelindung Diri (APD) yang Digunakan</Label>
                    <div className="bg-white p-4 rounded-lg border border-slate-100 space-y-4">
                      {apdData.map((apd, idx) => (
                        <div key={idx} className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`apd${idx + 1}`}
                              checked={apd.checked}
                              onCheckedChange={(val) => toggleApd(idx, !!val)}
                            />
                            <label
                              htmlFor={`apd${idx + 1}`}
                              className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {apd.name}
                            </label>
                          </div>
                          <Input
                            placeholder={apd.name === 'Lainnya' ? 'Sebutkan lainnya...' : `Apa Jenis Penggunaan ${apd.name}...`}
                            className="h-8 text-xs ml-6"
                            value={apd.deskripsi}
                            onChange={e => setApdDeskripsi(idx, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>


                <div className="pt-4 flex gap-4">
                  <Button variant="outline" className="w-1/3 h-12 text-slate-600 bg-slate-50 border-slate-200" onClick={handleKembali}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                  </Button>
                  <Button className="w-2/3 h-12 text-base bg-[#0ea5e9] hover:bg-[#0284c7]" onClick={handleLanjut}>
                    Lanjut ke Langkah 3 <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

              </div>
            </div>
          )}

          {/* STEP 3: MEDIS */}
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
                <Button className="w-2/3 h-12 text-base bg-[#0ea5e9] hover:bg-[#0284c7]" onClick={handleLanjut}>
                  Lanjut ke Langkah 4 <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: RIWAYAT ADVOKASI */}
          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-slate-900">Riwayat Advokasi</h2>
                <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">
                  Lengkapi status advokasi untuk mendukung pemrosesan klaim jaminan sosial.
                </p>
              </div>

              <div className="space-y-8">
                {/* Status Advokasi */}
                <div className="p-6 bg-white border border-slate-100 shadow-sm rounded-xl">
                  <h3 className="flex items-center text-sm font-bold text-[#0ea5e9] mb-6 uppercase tracking-wider">
                    <ShieldAlert className="h-4 w-4 mr-2" /> Status Advokasi
                  </h3>

                  <div className="space-y-6 divide-y divide-slate-100">
                    {advokasiData.map((item, idx) => (
                      <div key={idx} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${idx > 0 ? 'pt-6' : ''}`}>
                        <div>
                          <Label className="text-base text-slate-700">{item.question}</Label>
                          <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-4">
                            <label className="text-sm text-[#0ea5e9] flex items-center cursor-pointer max-w-fit">
                              <input
                                type="file"
                                multiple
                                accept=".pdf,.png,.jpg"
                                className="hidden"
                                onChange={(e) => {
                                  const files = e.target.files ? Array.from(e.target.files) : [];
                                  if (files.length > 0) {
                                    const newA = [...advokasiData];
                                    newA[idx].file = files;
                                    newA[idx].status = 'Ya';
                                    setAdvokasiData(newA);
                                  }
                                }}
                              />
                              {item.file?.length > 0 ? (
                                <span className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs font-semibold">
                                  <CheckCircle className="h-3 w-3 mr-1" /> {item.file.length} file dipilih
                                  <Button variant="ghost" size="sm" className="h-4 p-0 ml-3 text-red-500 hover:text-red-700 hover:bg-transparent" onClick={(e) => { e.preventDefault(); const newA = [...advokasiData]; newA[idx].file = []; newA[idx].status = 'Tidak'; setAdvokasiData(newA); }}>[Hapus]</Button>
                                </span>
                              ) : (
                                <span className="flex items-center hover:underline">
                                  <UploadCloud className="h-3 w-3 mr-1" /> Unggah Bukti (Multiple)
                                </span>
                              )}
                            </label>

                          </div>
                        </div>
                        <div className="flex gap-4 items-center">
                          <label className="flex items-center space-x-2 text-sm cursor-pointer" onClick={(e) => { e.preventDefault(); if (!item.file) { toast.error('Harap unggah bukti dokumen terlebih dahulu sebelum memilih "Ya".'); return; } const newA = [...advokasiData]; newA[idx].status = 'Ya'; setAdvokasiData(newA); }}>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${item.status === 'Ya' ? 'border-[#0ea5e9] bg-[#0ea5e9]' : 'border-slate-300 bg-white'}`}>
                              {item.status === 'Ya' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                            </div>
                            <span>Ya</span>
                          </label>
                          <label className="flex items-center space-x-2 text-sm cursor-pointer" onClick={(e) => { e.preventDefault(); const newA = [...advokasiData]; newA[idx].status = 'Tidak'; setAdvokasiData(newA); }}>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${item.status === 'Tidak' ? 'border-[#0ea5e9] bg-[#0ea5e9]' : 'border-slate-300 bg-white'}`}>
                              {item.status === 'Tidak' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                            </div>
                            <span>Tidak</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <Button variant="outline" className="w-1/3 h-12 text-slate-600 bg-slate-50 border-slate-200" onClick={handleKembali}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                  </Button>
                  <Button className="w-2/3 h-12 text-base bg-[#0ea5e9] hover:bg-[#0284c7]" onClick={handleSubmit} disabled={loading}>
                    <Save className="mr-2 h-4 w-4" /> {loading ? (Object.keys(duplicateWarning).length > 0 ? 'Memperbarui...' : 'Menyimpan...') : 'Selesai & Simpan'}
                  </Button>
                </div>
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
    </div>
  );
}
