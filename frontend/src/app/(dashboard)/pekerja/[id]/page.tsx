'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, Printer, Pin, Mail, Phone, MapPin, 
  Briefcase, ShieldAlert, CheckCircle2, Circle, Edit3, 
  Download, Image as ImageIcon, Activity, FileText, FileCheck
} from 'lucide-react';
import { format, differenceInYears, parseISO } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

export default function PekerjaDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const [isEditingCatatan, setIsEditingCatatan] = useState(false);
  const [catatanInput, setCatatanInput] = useState('');
  const [savingCatatan, setSavingCatatan] = useState(false);
  const isAdmin = user ? (user.role === 'admin') : false;

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
    // Fetch user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [id]);

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

  const updateStatusKesehatan = async (newStatus: string) => {
    try {
      setStatusLoading(true);
      await api.put(`/pekerja/${id}`, { status_kesehatan: newStatus });
      toast.success('Status kesehatan berhasil diperbarui');
      setData((prev: any) => ({ ...prev, status_kesehatan: newStatus }));
    } catch (e: any) {
      toast.error('Gagal memperbarui status kesehatan');
    } finally {
      setStatusLoading(false);
    }
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

  const currentStepIdx = advSteps.findIndex(step => !isStepCompleted(step.key));
  const activeStepIndex = currentStepIdx === -1 ? advSteps.length : currentStepIdx;

  const terkiniMedis = data.detail_medis?.[0]; // Assuming first is most recent

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

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-20 font-sans text-slate-800">
      
      {/* Top Navigation Bar Helper */}
      <div className="flex items-center gap-4 mb-6 pt-4 px-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-slate-200 bg-white shadow-sm border border-slate-200">
          <ArrowLeft className="h-4 w-4 text-slate-600" />
        </Button>
        <span className="text-sm font-medium text-slate-500">Kembali ke Daftar Pekerja</span>
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
              <div className="flex gap-2 mt-3 text-[10px] font-bold">
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md tracking-wider uppercase">{currentJob?.bagian || 'PRODUKSI'}</span>
                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-md tracking-wider uppercase">{currentJob?.status_pekerjaan || 'TETAP'}</span>
              </div>
            </div>
          </div>

          {/* Right: Stats */}
          <div className="flex flex-wrap lg:flex-nowrap gap-4 w-full lg:w-auto h-full">
              <div className={`bg-slate-50/50 border border-slate-100 rounded-xl p-4 flex-1 min-w-[170px] relative ${isAdmin ? 'group/status' : ''}`}>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Status Kesehatan</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xl font-bold capitalize ${
                    data.status_kesehatan === 'sehat' ? 'text-emerald-600' : 
                    data.status_kesehatan === 'sakit_ringan' ? 'text-amber-600' : 'text-rose-600'
                  }`}>
                    {data.status_kesehatan === 'sehat' ? 'Fit' : 
                     data.status_kesehatan === 'sakit_ringan' ? 'Fit with Note' : 
                     data.status_kesehatan === 'sakit_berat' ? 'Unfit' : data.status_kesehatan}
                  </span>
                  
                  {/* Status Switcher Popover Logic (Only for admin) */}
                  {isAdmin && (
                    <select 
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      value={data.status_kesehatan}
                      onChange={(e) => updateStatusKesehatan(e.target.value)}
                      disabled={statusLoading}
                    >
                      <option value="sehat">Fit</option>
                      <option value="sakit_ringan">Fit with Note</option>
                      <option value="sakit_berat">Unfit</option>
                      <option value="dalam_perawatan">Dalam Perawatan</option>
                    </select>
                  )}
                </div>
                
                {/* Suggestion Indicator (Only for admin) */}
                {isAdmin && data.status_saran && data.status_saran !== data.status_kesehatan && (
                  <div className="mt-2 flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                    <span className="text-[9px] font-extrabold text-amber-600 uppercase tracking-tighter">
                      Saran: {data.status_saran === 'sehat' ? 'Fit' : data.status_saran === 'sakit_ringan' ? 'Note' : 'Unfit'}
                    </span>
                  </div>
                )}
                
                {/* Tooltip hint (Only for admin) */}
                {isAdmin && (
                  <div className="absolute -top-1 px-2 py-0.5 bg-slate-800 text-white text-[8px] font-bold rounded opacity-0 group-hover/status:opacity-100 transition-opacity pointer-events-none">
                    KLIK UNTUK MENGUBAH
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
                 <span className="text-xl font-bold text-slate-800">{isAdvocacyActive ? '1 Kasus' : 'Tidak Ada'}</span>
                 {isAdvocacyActive && (
                   <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[9px] font-extrabold tracking-wide rounded-full">
                     PROSES
                   </span>
                 )}
               </div>
             </div>
          </div>
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN (Wider) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Admin Note Card */}
            <div className="bg-[#fffdf5] border border-orange-100/60 shadow-sm rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-300"></div>
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-sm font-bold text-orange-800 flex items-center">
                  <Pin className="h-4 w-4 mr-2" /> Catatan Internal Admin
                </h3>
                {isAdmin && !isEditingCatatan && (
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

            {/* Contact Info Card */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
              <h3 className="text-sm font-bold text-[#1e293b] flex items-center mb-6">
                <MapPin className="h-4 w-4 text-[#0ea5e9] mr-2" /> Informasi Kontak
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email Address</p>
                    <p className="text-sm font-semibold text-slate-700 flex items-center"><Mail className="h-3 w-3 mr-1.5 text-slate-400" /> {data.user?.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Telepon / WhatsApp</p>
                    <p className="text-sm font-semibold text-slate-700 flex items-center"><Phone className="h-3 w-3 mr-1.5 text-slate-400" /> {data.whatsapp || '-'}</p>
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

            {/* Match Riwayat Pekerjaan */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-[#1e293b] flex items-center">
                  <Briefcase className="h-4 w-4 text-[#0ea5e9] mr-2" /> Riwayat Pekerjaan
                </h3>
                <button className="text-[11px] font-bold text-[#0ea5e9] tracking-wider uppercase hover:underline">LIHAT SEMUA</button>
              </div>

              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                      <th className="pb-3 px-2 font-bold">Perusahaan</th>
                      <th className="pb-3 px-2 font-bold">Jabatan</th>
                      <th className="pb-3 px-2 font-bold whitespace-nowrap">Masa Kerja</th>
                      <th className="pb-3 px-2 font-bold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50/80">
                    {data.riwayat_pekerja?.map((r: any, idx: number) => {
                       const isActive = !r.tgl_keluar;
                       let wText = `${r.tgl_masuk ? format(parseISO(r.tgl_masuk), 'MMM yyyy', {locale: localeID}) : '-'} - ${r.tgl_keluar ? format(parseISO(r.tgl_keluar), 'MMM yyyy', {locale: localeID}) : 'Sekarang'}`;
                       
                       return (
                         <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                           <td className="py-4 px-2">
                             <p className="text-[13px] font-bold text-slate-800">{r.nama_perusahaan}</p>
                             <p className="text-[11px] text-slate-400 mt-0.5">{r.deskripsi_usaha || 'Industri'}</p>
                           </td>
                           <td className="py-4 px-2">
                             <p className="text-[13px] font-medium text-slate-700">{r.bagian || r.jabatan || '-'}</p>
                           </td>
                           <td className="py-4 px-2">
                             <p className="text-[12px] text-slate-500 whitespace-nowrap">{wText}</p>
                           </td>
                           <td className="py-4 px-2 text-right">
                             {isActive ? (
                               <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[9px] font-extrabold tracking-wide rounded-md">AKTIF</span>
                             ) : (
                               <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[9px] font-extrabold tracking-wide rounded-md">SELESAI</span>
                             )}
                           </td>
                         </tr>
                       );
                    })}
                    {(!data.riwayat_pekerja || data.riwayat_pekerja.length === 0) && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">Belum ada riwayat pekerjaan.</td>
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
                          onClick={() => toggleAdvokasi(step.key, !isCompleted)}
                          className="mt-0.5 z-20 flex-shrink-0 mr-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0ea5e9] rounded-full transition-transform transform active:scale-90"
                          title="Klik utuk mengubah status"
                        >
                          {isCompleted ? (
                             <CheckCircle2 className="h-6 w-6 text-emerald-500 bg-white" />
                          ) : hasFile ? (
                             <div className="h-6 w-6 rounded-full border-[3px] border-amber-400 bg-amber-50 flex items-center justify-center">
                               <FileCheck className="h-3 w-3 text-amber-500" />
                             </div>
                          ) : isCurrent ? (
                             <div className="h-6 w-6 rounded-full border-[3px] border-[#0ea5e9] bg-white flex items-center justify-center">
                               <div className="h-2 w-2 rounded-full bg-[#0ea5e9]" />
                             </div>
                          ) : (
                             <Circle className="h-6 w-6 text-slate-200 fill-white" />
                          )}
                        </button>

                        <div className="flex-1 pb-1">
                          <p className={`text-[13px] font-bold ${isCompleted ? 'text-slate-800' : hasFile ? 'text-amber-600' : isCurrent ? 'text-[#0ea5e9]' : 'text-slate-400'}`}>
                            {step.label}
                          </p>
                          <p className={`text-[10px] mt-1 ${hasFile && !isCompleted ? 'text-amber-500 font-semibold' : 'text-slate-400'}`}>
                            {isCompleted ? 'Selesai' : hasFile ? 'Dokumen Terunggah' : isCurrent ? 'Sedang Berjalan' : 'Belum Dimulai'}
                          </p>

                          {/* File Upload for Each Step */}
                          <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Dokumen / Bukti Pendukung</span>
                             <div className="flex flex-col sm:flex-row gap-3">
                               <div className="relative flex-1">
                                 <input 
                                    type="file" 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => handleFileUpload(step.key, e)}
                                    disabled={uploadLoading === step.key}
                                 />
                                 <div className={`h-9 w-full bg-white border ${uploadLoading === step.key ? 'border-[#0ea5e9] bg-blue-50' : 'border-slate-200 border-dashed'} rounded-md flex items-center justify-center text-[10px] font-semibold text-[#0ea5e9] hover:bg-blue-50 transition-colors`}>
                                    {uploadLoading === step.key ? 'Mengunggah...' : '+ Pilih File Bukti (Max 5MB)'}
                                 </div>
                               </div>
                               {getFilePath(step.key) && (
                                  <button onClick={() => downloadFile(step.key)} className="h-9 px-3 bg-white border border-slate-200 rounded-md flex items-center justify-center text-[10px] font-semibold text-slate-600 hover:text-[#0ea5e9] hover:border-[#0ea5e9] transition-colors cursor-pointer">
                                     <FileText className="h-3 w-3 mr-1.5" /> Lihat Terunggah
                                  </button>
                               )}
                             </div>
                          </div>
                        </div>
                      </div>
                    )
                 })}
               </div>
            </div>

            {/* Info Medis Terkini */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
               <h3 className="text-sm font-bold text-[#1e293b] flex items-center mb-6">
                 <Activity className="h-4 w-4 text-[#0ea5e9] mr-2" /> Info Medis Terkini
               </h3>

               {terkiniMedis ? (
                 <>
                   <div className="grid grid-cols-2 gap-y-4 gap-x-2 mb-6">
                     <div>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tempat</p>
                       <p className="text-[13px] font-semibold text-slate-800 leading-tight">{terkiniMedis.tempat_pemeriksa || 'RS Siloam Karawaci'}</p>
                     </div>
                     <div>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tanggal</p>
                       <p className="text-[13px] font-semibold text-slate-800 leading-tight">
                        {terkiniMedis.tgl_pemeriksaan 
                          ? format(parseISO(terkiniMedis.tgl_pemeriksaan), 'dd MMM yyyy', {locale: localeID}) 
                          : '-'}
                       </p>
                     </div>
                     <div>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Jenis</p>
                       <p className="text-[13px] font-semibold text-slate-800 leading-tight">{terkiniMedis.jenis_pemeriksa || 'MCU Tahunan'}</p>
                     </div>
                     <div>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Dokter</p>
                       <p className="text-[13px] font-semibold text-slate-800 leading-tight">{terkiniMedis.dokter_pemeriksa || '-'}</p>
                     </div>
                   </div>

                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Ringkasan Diagnosis</p>
                   <div className="bg-slate-50 border border-slate-100/50 rounded-xl p-4 mb-6">
                     <p className="text-slate-600 text-xs leading-relaxed italic">
                       "{terkiniMedis.hasil_diagnosis || 'Kondisi pekerja dinyatakan cukup sehat namun membutuhkan observasi terkait keluhan pada pendengaran.'}"
                     </p>
                   </div>
                 </>
               ) : (
                 <div className="text-center p-6 text-slate-400 bg-slate-50 rounded-xl mb-6 border border-dashed border-slate-200">
                   <p className="text-xs">Belum ada rekam medis terdaftar.</p>
                 </div>
               )}

               <Button variant="outline" className="w-full border-[#0ea5e9] text-[#0ea5e9] hover:bg-blue-50 hover:text-[#0284c7] font-bold text-xs h-11 tracking-wider">
                 UNDUH LAPORAN LENGKAP
               </Button>
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
