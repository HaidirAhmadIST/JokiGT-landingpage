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
    jenis_pajanan: '',
    durasi_pajanan: '',
    nama_perusahaan_baru: ''
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

  const [medisData, setMedisData] = useState({
    tanggal_pemeriksaan: '',
    tempat_pemeriksaan: '',
    jenis_pemeriksaan: '',
    dokter: '',
    hasil_diagnosis: '',
    golongan_darah: '',
    rhesus: '',
    riwayat_penyakit: '',
    alergi: '',
    riwayat_operasi: '',
    obat_rutin: ''
  });

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
    advokasiQuestions.map(q => ({ question: q, status: 'Tidak', file: null as File | null }))
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
        if (parsed.medisData) setMedisData(prev => ({ ...prev, ...parsed.medisData }));
        if (parsed.riwayatLalu) setRiwayatLalu(parsed.riwayatLalu);
        if (parsed.apdData) setApdData(parsed.apdData);
        if (parsed.advokasiData) {
          // Restore question status but reset files (files can't be stored in localStorage)
          setAdvokasiData(parsed.advokasiData.map((d: any) => ({ ...d, file: null })));
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
      medisData,
      riwayatLalu,
      apdData,
      advokasiData: advokasiData.map(d => ({ question: d.question, status: d.status }))
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [step, baseData, pekerjaanSaatIni, medisData, riwayatLalu, apdData, advokasiData]);

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
    if (!baseData.nik || !baseData.nama_lengkap || !baseData.email || !baseData.perusahaan_id) {
      toast.error("Mohon lengkapi NIK, Nama, Email, dan Perusahaan!");
      return;
    }
    setLoading(true);
    try {
      let finalPerusahaanId = baseData.perusahaan_id;
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
            status_pendamping: 'aktif',
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
      if (currentPerusahaanName) {
        allRiwayat.push({
          nama_perusahaan: currentPerusahaanName,
          deskripsi_usaha: pekerjaanSaatIni.deskripsi_usaha,
          bagian: pekerjaanSaatIni.bagian + (pekerjaanSaatIni.jabatan ? ` / ${pekerjaanSaatIni.jabatan}` : ''),
          tgl_masuk: pekerjaanSaatIni.tgl_masuk,
          tgl_keluar: null
        });
      }

      const prevRiwayat = riwayatLalu.filter(r => r.nama_perusahaan.trim() !== '');

      // Mapped Medis Data
      const hasMedis = medisData.tanggal_pemeriksaan && medisData.tempat_pemeriksaan && medisData.jenis_pemeriksaan && medisData.dokter && medisData.hasil_diagnosis;
      const finalMedis = hasMedis ? [{
        tgl_pemeriksaan: medisData.tanggal_pemeriksaan,
        tempat_pemeriksa: medisData.tempat_pemeriksaan,
        jenis_pemeriksa: medisData.jenis_pemeriksaan,
        dokter_pemeriksa: medisData.dokter,
        hasil_diagnosis: medisData.hasil_diagnosis,
        golongan_darah: medisData.golongan_darah,
        rhesus: medisData.rhesus,
        riwayat_penyakit: medisData.riwayat_penyakit,
        alergi: medisData.alergi,
        riwayat_operasi: medisData.riwayat_operasi,
        obat_rutin: medisData.obat_rutin,
      }] : [];

      const performSubmit = async (pId: string, riwayatData: any[]) => {
        const response = await api.post('/pekerja', {
          ...baseData,
          perusahaan_id: pId,
          riwayat: riwayatData,
          medis: finalMedis
        });

        const newPekerjaId = response.data.data.id;

        if (pasFoto) {
          const formData = new FormData();
          formData.append('pas_foto', pasFoto);
          await api.post(`/pekerja/${newPekerjaId}/foto`, formData);
        }

        // Sync status advokasi dan file unggahan
        const advokasiKeys = [
          'riwayat_pajanan',
          'persetujuan_dokter',
          'perusahaan_lapor',
          'penetapan_pak',
          'kompensasi_bpjstk',
          'rehabilitasi_bpjskes'
        ];

        for (let i = 0; i < advokasiData.length; i++) {
          const item = advokasiData[i];
          if (item.status === 'Ya' || item.file) {
            const advFormData = new FormData();

            if (item.status === 'Ya') {
              advFormData.append(advokasiKeys[i], '1'); 
            }

            if (item.file) {
              advFormData.append('step_key', advokasiKeys[i]);
              advFormData.append('file', item.file);
            }

            try {
              await api.post(`/pekerja/${newPekerjaId}/advokasi`, advFormData);
            } catch (e) {
              console.error('Gagal mengintegrasikan advokasi', advokasiKeys[i]);
            }
          }
        }
      };

      try {
        await performSubmit(finalPerusahaanId, [...allRiwayat, ...prevRiwayat]);
        localStorage.removeItem(STORAGE_KEY);
        toast.success('Pekerja berhasil didaftarkan!');
        router.push('/pekerja');
      } catch (error: any) {
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

              await performSubmit(existing.id.toString(), updatedRiwayat);
              
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
              <span className={`text-xs font-semibold mt-2 text-center ${step >= 3 ? 'text-[#0ea5e9]' : 'text-slate-400'}`}>RIWAYAT <br />KESEHATAN</span>
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
                      <Label>Nama Lengkap (Sesuai KTP)</Label>
                      <Input placeholder="Masukkan nama lengkap" className="h-11" value={baseData.nama_lengkap} onChange={e => setBaseData({ ...baseData, nama_lengkap: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Nomor Induk Kependudukan / NIK</Label>
                      <Input 
                        placeholder="Masukkan NIK 16 Digit" 
                        maxLength={16} 
                        className={`h-11 ${duplicateWarning.nik ? 'border-amber-400 bg-amber-50/30' : ''}`}
                        value={baseData.nik} 
                        onChange={e => setBaseData({ ...baseData, nik: e.target.value.replace(/\\D/g, '') })} 
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
                      <Label>Nomor WhatsApp</Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 text-slate-500 sm:text-sm">
                          +62
                        </span>
                        <Input placeholder="8123456xxx" className="rounded-l-none h-11" value={baseData.whatsapp} onChange={e => setBaseData({ ...baseData, whatsapp: e.target.value.replace(/\\D/g, '') })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Alamat Email (Wajib untuk Login)</Label>
                      <Input 
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
                    <div className="space-y-2">
                      <Label>Pilih Perusahaan Saat Ini</Label>
                      <Select value={baseData.perusahaan_id} onValueChange={(v: any) => setBaseData({ ...baseData, perusahaan_id: v })}>
                        <SelectTrigger className="h-11 w-full">
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
                        <div className="mt-3 p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-2">
                          <Label className="text-[#0ea5e9]">Nama Perusahaan Baru</Label>
                          <Input
                            placeholder="Masukkan nama perusahaan lengkap..."
                            className="h-11 bg-white border-blue-200 focus-visible:ring-blue-400"
                            value={pekerjaanSaatIni.nama_perusahaan_baru}
                            onChange={e => setPekerjaanSaatIni({ ...pekerjaanSaatIni, nama_perusahaan_baru: e.target.value })}
                          />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Deskripsi Jenis Usaha</Label>
                      <Input placeholder="Contoh: Industri Pengolahan Makanan" className="h-11" value={pekerjaanSaatIni.deskripsi_usaha} onChange={e => setPekerjaanSaatIni({ ...pekerjaanSaatIni, deskripsi_usaha: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Status Pekerjaan</Label>
                      <Select value={pekerjaanSaatIni.status_pekerjaan} onValueChange={(v: any) => setPekerjaanSaatIni({ ...pekerjaanSaatIni, status_pekerjaan: v })}>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Pilih Status" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tetap">Karyawan Tetap</SelectItem>
                          <SelectItem value="kontrak">Kontrak</SelectItem>
                          <SelectItem value="harian">Lepas Harian</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label>Bagian</Label>
                        <Input placeholder="Contoh: Produksi / Logistik" className="h-11" value={pekerjaanSaatIni.bagian} onChange={e => setPekerjaanSaatIni({ ...pekerjaanSaatIni, bagian: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Jabatan / Posisi</Label>
                        <Input placeholder="Contoh: Operator Produksi" className="h-11" value={pekerjaanSaatIni.jabatan} onChange={e => setPekerjaanSaatIni({ ...pekerjaanSaatIni, jabatan: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Mulai Bekerja</Label>
                      <Input type="date" className="h-11 text-slate-500" value={pekerjaanSaatIni.tgl_masuk} onChange={e => setPekerjaanSaatIni({ ...pekerjaanSaatIni, tgl_masuk: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Deskripsi Pekerjaan</Label>
                      <Textarea placeholder="Jelaskan secara ringkas tugas dan tanggung jawab utama Anda..." className="resize-none h-24" value={pekerjaanSaatIni.deskripsi_pekerjaan} onChange={e => setPekerjaanSaatIni({ ...pekerjaanSaatIni, deskripsi_pekerjaan: e.target.value })} />
                    </div>
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
                <h2 className="text-2xl font-bold text-slate-900">Riwayat Pekerjaan & Perusahaan</h2>
                <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">
                  Lengkapi informasi pengalaman kerja dan riwayat pajanan bahaya di tempat kerja Anda.
                </p>
              </div>

              <div className="space-y-8">
                <div className="p-6 bg-red-50/30 border border-red-100 rounded-xl">
                  <h3 className="flex items-center text-sm font-bold text-red-500 mb-2 uppercase tracking-wider">
                    <ShieldAlert className="h-4 w-4 mr-2" /> Riwayat Pajanan (Exposure)
                  </h3>
                  <p className="text-xs text-slate-500 mb-6">Informasi ini penting untuk mendeteksi Penyakit Akibat Kerja (PAK).</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                    <div className="space-y-2">
                      <Label className="text-slate-700">Jenis Pajanan</Label>
                      <Select value={pekerjaanSaatIni.jenis_pajanan} onValueChange={(v: any) => setPekerjaanSaatIni({ ...pekerjaanSaatIni, jenis_pajanan: v })}>
                        <SelectTrigger className="h-11 bg-white"><SelectValue placeholder="Pilih Jenis Pajanan" /></SelectTrigger>
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

                {/* Riwayat Sebelumnya */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800">Riwayat Pekerjaan Sebelumnya</h3>
                    <Button variant="ghost" size="sm" className="text-[#0ea5e9] hover:text-[#0284c7] hover:bg-blue-50" onClick={() => setRiwayatLalu([...riwayatLalu, { nama_perusahaan: '', bagian: '', tgl_masuk: '', tgl_keluar: '', file_bukti: null }])}>
                      <Plus className="h-4 w-4 mr-1" /> Tambah Riwayat
                    </Button>
                  </div>

                  {riwayatLalu.length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setRiwayatLalu([{ nama_perusahaan: '', bagian: '', tgl_masuk: '', tgl_keluar: '', file_bukti: null }])}>
                      <Plus className="h-8 w-8 text-slate-300 mb-2" />
                      <p className="text-sm text-slate-500 max-w-[250px]">
                        Belum ada Riwayat Pekerjaan Ditambahkan.
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        (Tekan <strong>Tambah Riwayat</strong> jika ada pengalaman kerja sebelumnya)
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {riwayatLalu.map((item, idx) => (
                        <div key={idx} className="p-5 bg-white border border-slate-200 shadow-sm rounded-xl relative">
                          <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-slate-400 hover:text-red-500 hover:bg-red-50 h-8 w-8"
                            onClick={() => setRiwayatLalu(riwayatLalu.filter((_, i) => i !== idx))}>
                            <X className="h-4 w-4" />
                          </Button>
                          <h4 className="font-bold text-slate-700 mb-4 text-sm">Pengalaman #{idx + 1}</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2 sm:col-span-1">
                              <Label>Nama Perusahaan Sebelumnya</Label>
                              <Input placeholder="Cth: PT Logam Terpadu" value={item.nama_perusahaan} onChange={(e) => {
                                const newR = [...riwayatLalu]; newR[idx].nama_perusahaan = e.target.value; setRiwayatLalu(newR);
                              }} />
                            </div>
                            <div className="space-y-2 col-span-2 sm:col-span-1">
                              <Label>Bagian/Posisi</Label>
                              <Input placeholder="Operator Las" value={item.bagian} onChange={(e) => {
                                const newR = [...riwayatLalu]; newR[idx].bagian = e.target.value; setRiwayatLalu(newR);
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

                            <div className="space-y-2 col-span-1 sm:col-span-2 mt-2">
                              <Label>Upload Paklaring / Dokumen Verifikasi Pekerjaan</Label>
                              <label className="mt-1 border border-dashed border-slate-200 bg-slate-50 rounded-lg p-3 flex flex-col sm:flex-row items-center justify-center text-slate-500 hover:border-[#0ea5e9] transition-colors cursor-pointer relative block">
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.png"
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      const newR = [...riwayatLalu];
                                      newR[idx].file_bukti = e.target.files[0];
                                      setRiwayatLalu(newR);
                                    }
                                  }}
                                />
                                {item.file_bukti ? (
                                  <div className="flex items-center space-x-2">
                                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                                    <span className="text-sm font-medium text-slate-700">{item.file_bukti.name}</span>
                                    <Button variant="ghost" size="sm" className="h-6 ml-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50" onClick={(e) => { e.preventDefault(); const newR = [...riwayatLalu]; newR[idx].file_bukti = null; setRiwayatLalu(newR); }}>
                                      Hapus
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-2">
                                    <UploadCloud className="h-4 w-4 text-[#0ea5e9]" />
                                    <span className="text-sm">Klik untuk melampirkan file dokumen <strong className="text-[#0ea5e9] hidden sm:inline">(PDF, JPG)</strong></span>
                                  </div>
                                )}
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
              <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-slate-900">Detail Medis</h2>
                <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">
                  Lengkapi rekomendasi medis Anda untuk pemrosesan jaminan sosial.
                </p>
              </div>

              <div className="space-y-8">
                {/* Riwayat Kesehatan Baseline */}
                <div className="p-6 bg-white border border-slate-100 shadow-sm rounded-xl">
                  <h3 className="flex items-center text-sm font-bold text-[#0ea5e9] mb-6 uppercase tracking-wider">
                    <Activity className="h-4 w-4 mr-2" /> RIWAYAT KESEHATAN
                  </h3>

                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label>Golongan Darah</Label>
                        <Select value={medisData.golongan_darah} onValueChange={(v) => setMedisData({ ...medisData, golongan_darah: v })}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Pilih Golongan Darah" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">A</SelectItem>
                            <SelectItem value="B">B</SelectItem>
                            <SelectItem value="AB">AB</SelectItem>
                            <SelectItem value="O">O</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Rhesus</Label>
                        <Select value={medisData.rhesus} onValueChange={(v) => setMedisData({ ...medisData, rhesus: v })}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Pilih Rhesus" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="+">+</SelectItem>
                            <SelectItem value="-">-</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Riwayat Penyakit Bawaan / Kronis</Label>
                      <Input 
                        placeholder="Contoh: Asma, Diabetes (pisahkan dengan koma jika lebih dari satu)" 
                        className="h-11"
                        value={medisData.riwayat_penyakit}
                        onChange={e => setMedisData({ ...medisData, riwayat_penyakit: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Alergi Obat / Makanan / Debu</Label>
                      <Input 
                        placeholder="Contoh: Penisilin, Udang, Debu Kayu" 
                        className="h-11"
                        value={medisData.alergi}
                        onChange={e => setMedisData({ ...medisData, alergi: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Riwayat Operasi</Label>
                      <Input 
                        placeholder="Contoh: Operasi Usus Buntu (2020)" 
                        className="h-11"
                        value={medisData.riwayat_operasi}
                        onChange={e => setMedisData({ ...medisData, riwayat_operasi: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Obat Rutin Yang Dikonsumsi</Label>
                      <Input 
                        placeholder="Contoh: Metformin" 
                        className="h-11"
                        value={medisData.obat_rutin}
                        onChange={e => setMedisData({ ...medisData, obat_rutin: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Detail Medis */}
                <div className="p-6 bg-white border border-slate-100 shadow-sm rounded-xl">
                  <h3 className="flex items-center text-sm font-bold text-[#0ea5e9] mb-6 uppercase tracking-wider">
                    <ShieldAlert className="h-4 w-4 mr-2" /> Detail Pemeriksaan Medis
                  </h3>

                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label>Tanggal Pemeriksaan</Label>
                        <Input type="date" className="h-11 text-slate-500" value={medisData.tanggal_pemeriksaan} onChange={e => setMedisData({ ...medisData, tanggal_pemeriksaan: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Tempat Pemeriksaan</Label>
                        <Input placeholder="Nama Rumah Sakit / Klinik" className="h-11" value={medisData.tempat_pemeriksaan} onChange={e => setMedisData({ ...medisData, tempat_pemeriksaan: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label>Jenis Pemeriksaan</Label>
                        <Input placeholder="Contoh: MCU Berkala, Spesialis" className="h-11" value={medisData.jenis_pemeriksaan} onChange={e => setMedisData({ ...medisData, jenis_pemeriksaan: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Dokter Yang Memeriksa</Label>
                        <Input placeholder="Nama lengkap dokter" className="h-11" value={medisData.dokter} onChange={e => setMedisData({ ...medisData, dokter: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Hasil Diagnosis</Label>
                      <Textarea placeholder="Masukkan detail hasil diagnosis lengkap..." className="resize-none h-24" value={medisData.hasil_diagnosis} onChange={e => setMedisData({ ...medisData, hasil_diagnosis: e.target.value })} />
                    </div>

                    <div className="space-y-2">
                      <Label>Unggah Dokumen Rekomendasi / Tindak Lanjut</Label>
                      <label className="mt-1 border-2 border-dashed border-slate-200 bg-slate-50 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 hover:border-[#0ea5e9] transition-colors cursor-pointer relative block">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.png"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) setDokumenRekomendasi(e.target.files[0]);
                          }}
                        />
                        {dokumenRekomendasi ? (
                          <div className="flex flex-col items-center text-center">
                            <CheckCircle className="h-6 w-6 text-emerald-500 mb-2" />
                            <span className="text-sm font-bold text-slate-700">{dokumenRekomendasi.name}</span>
                            <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50" onClick={(e) => { e.preventDefault(); setDokumenRekomendasi(null); }}>
                              <X className="h-3 w-3 mr-1" /> Hapus
                            </Button>
                          </div>
                        ) : (
                          <>
                            <UploadCloud className="h-6 w-6 mb-2 text-[#0ea5e9]" />
                            <span className="text-sm">Tarik dan lepas dokumen di sini atau <strong className="text-[#0ea5e9]">Pilih File</strong></span>
                            <span className="text-[10px] text-slate-400 mt-1">PDF, JPG, PNG Max 5MB</span>
                          </>
                        )}
                      </label>
                    </div>

                    <div className="space-y-2">
                      <Label>Unggah Dokumen Bukti Pemeriksaan</Label>
                      <label className="mt-1 border-2 border-dashed border-slate-200 bg-slate-50 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 hover:border-[#0ea5e9] transition-colors cursor-pointer relative block">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.png"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) setDokumenBukti(e.target.files[0]);
                          }}
                        />
                        {dokumenBukti ? (
                          <div className="flex flex-col items-center text-center">
                            <CheckCircle className="h-6 w-6 text-emerald-500 mb-2" />
                            <span className="text-sm font-bold text-slate-700">{dokumenBukti.name}</span>
                            <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50" onClick={(e) => { e.preventDefault(); setDokumenBukti(null); }}>
                              <X className="h-3 w-3 mr-1" /> Hapus
                            </Button>
                          </div>
                        ) : (
                          <>
                            <UploadCloud className="h-6 w-6 mb-2 text-[#0ea5e9]" />
                            <span className="text-sm">Tarik dan lepas dokumen di sini atau <strong className="text-[#0ea5e9]">Pilih File</strong></span>
                            <span className="text-[10px] text-slate-400 mt-1">PDF, JPG, PNG Max 5MB</span>
                          </>
                        )}
                      </label>
                    </div>

                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <Button variant="outline" className="w-1/3 h-12 text-slate-600 bg-slate-50 border-slate-200" onClick={handleKembali}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                  </Button>
                  <Button className="w-2/3 h-12 text-base bg-[#0ea5e9] hover:bg-[#0284c7]" onClick={handleLanjut}>
                    Lanjut ke Langkah 4 <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
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
                                accept=".pdf,.png,.jpg"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    const newA = [...advokasiData];
                                    newA[idx].file = e.target.files[0];
                                    newA[idx].status = 'Ya';
                                    setAdvokasiData(newA);
                                  }
                                }}
                              />
                              {item.file ? (
                                <span className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs font-semibold">
                                  <CheckCircle className="h-3 w-3 mr-1" /> {item.file.name}
                                  <Button variant="ghost" size="sm" className="h-4 p-0 ml-3 text-red-500 hover:text-red-700 hover:bg-transparent" onClick={(e) => { e.preventDefault(); const newA = [...advokasiData]; newA[idx].file = null; newA[idx].status = 'Tidak'; setAdvokasiData(newA); }}>[Hapus]</Button>
                                </span>
                              ) : (
                                <span className="flex items-center hover:underline">
                                  <UploadCloud className="h-3 w-3 mr-1" /> Unggah Bukti
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
