'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { 
  LayoutDashboard, 
  ClipboardList, 
  FileShield, 
  Settings, 
  Search, 
  Bell, 
  Upload, 
  Download, 
  Edit3, 
  Activity,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  Plus,
  ExternalLink,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function UserDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [pekerja, setPekerja] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get current user and their worker profile
      const userRes = await api.get('/me');
      setUser(userRes.data.data);
      
      const pekerjaRes = await api.get(`/pekerja?search=${userRes.data.data.email}`);
      // Find the exact match by email
      const match = pekerjaRes.data.data.data.find((p: any) => p.user?.email === userRes.data.data.email);
      if (match) {
        // Load full profile
        const fullRes = await api.get(`/pekerja/${match.id}`);
        setPekerja(fullRes.data.data);
      }
    } catch (error) {
      console.error('Gagal mengambil data:', error);
      toast.error('Gagal memuat data dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (type: 'medis' | 'riwayat', id: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const formData = new FormData();
    if (type === 'medis') {
      Array.from(files).forEach(f => formData.append('file_hasil[]', f));
    } else {
      Array.from(files).forEach(f => formData.append('file_bukti[]', f));
    }

    setUploading(true);
    try {
      const endpoint = type === 'medis' ? `/detail-medis/${id}/file` : `/riwayat-pekerja/${id}/file`;
      await api.post(endpoint, formData);
      toast.success('File berhasil diunggah!');
      fetchData(); // Refresh data
    } catch (error) {
      toast.error('Gagal mengunggah file.');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    // Cookies.remove('auth_token') handled by interceptor or manually
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-[#0ea5e9] rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      
      {/* SIDEBAR - Mockup Style */}
      <aside className="w-72 bg-white border-r border-slate-100 flex flex-col shrink-0">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-[#0ea5e9] rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <h1 className="font-extrabold text-slate-800 tracking-tight text-lg">Rekam Jejak Pekerja</h1>
          </div>

          <nav className="space-y-2">
            <NavItem icon={LayoutDashboard} label="Dashboard" active />
            <NavItem icon={ClipboardList} label="Riwayat Medis" />
            <NavItem icon={FileShield} label="Dokumen Hukum" />
            <NavItem icon={Settings} label="Pengaturan" />
          </nav>
        </div>
        
        <div className="mt-auto p-8 border-t border-slate-50">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 text-slate-400 hover:text-rose-500 transition-colors font-bold text-sm w-full"
          >
            <LogOut className="w-5 h-5" />
            Keluar
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <header className="h-20 bg-white border-b border-slate-50 flex items-center justify-between px-10 shrink-0">
          <div className="relative w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#0ea5e9] transition-colors" />
            <input 
              type="text" 
              placeholder="Cari data..." 
              className="w-full h-11 pl-12 pr-4 bg-slate-50 border-transparent rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all border border-slate-100"
            />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-10 w-10 rounded-2xl overflow-hidden border-2 border-white shadow-md">
              <img 
                src={pekerja?.pas_foto ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/storage/profil/${pekerja.pas_foto}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.nama}`} 
                className="w-full h-full object-cover" 
                alt="Profile"
              />
            </div>
          </div>
        </header>

        {/* DASHBOARD BODY */}
        <div className="flex-1 overflow-y-auto p-10 space-y-8">
          
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard Pekerja</h2>
            <p className="text-slate-400 text-sm font-medium">Selamat datang kembali, <span className="text-slate-900 font-bold">{user?.nama}</span></p>
          </div>

          <div className="grid grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: Profile & Tracking */}
            <div className="col-span-8 space-y-8">
              
              {/* Profile Card */}
              <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex items-center gap-8 group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                <div className="w-24 h-32 rounded-2xl overflow-hidden bg-slate-100 shadow-inner shrink-0">
                   <img 
                    src={pekerja?.pas_foto ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/storage/profil/${pekerja.pas_foto}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.nama}`} 
                    className="w-full h-full object-cover object-top" 
                    alt="Pekerja"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 leading-tight">{pekerja?.nama_lengkap || user?.nama}</h3>
                      <p className="text-slate-400 text-sm font-bold tracking-wider mt-1 uppercase flex items-center gap-2">
                        NIK: <span className="text-slate-600">{pekerja?.nik || '-'}</span>
                      </p>
                    </div>
                    <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black tracking-widest flex items-center gap-2 border border-emerald-100 shadow-sm">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                      AKTIF
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <Button 
                      onClick={() => router.push('/profile')}
                      className="bg-[#0ea5e9] hover:bg-[#0284c7] rounded-xl px-6 h-11 text-xs font-bold shadow-lg shadow-blue-100"
                    >
                      <Edit3 className="w-4 h-4 mr-2" /> Edit Profil
                    </Button>
                    <Button variant="outline" className="rounded-xl px-6 h-11 text-xs font-bold border-slate-200 text-slate-600 hover:bg-slate-50">
                      Update Status Kesehatan
                    </Button>
                  </div>
                </div>
              </div>

              {/* Visual Status Tracking */}
              <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Visual Status Tracking</h3>
                  <button className="text-slate-300 hover:text-slate-500 transition-colors"><MoreVertical className="w-5 h-5" /></button>
                </div>

                <div className="relative flex justify-between items-start px-4">
                  {/* Progress Line Background */}
                  <div className="absolute top-6 left-12 right-12 h-0.5 bg-slate-100 z-0"></div>
                  
                  <StatusStep 
                    icon={CheckCircle2} 
                    label="Verifikasi" 
                    status="Selesai" 
                    active={true} 
                    completed={true} 
                  />
                  <StatusStep 
                    icon={Activity} 
                    label="Cek Medis" 
                    status="Dalam Proses" 
                    active={true} 
                    completed={false} 
                  />
                  <StatusStep 
                    icon={Building2} 
                    label="Pemerintah/UPTD" 
                    status="Menunggu" 
                    active={false} 
                    completed={false} 
                  />
                  <StatusStep 
                    icon={ShieldCheck} 
                    label="Klaim Asuransi" 
                    status="Belum Dimulai" 
                    active={false} 
                    completed={false} 
                  />
                </div>
              </div>

              {/* Bottom Row - Medical Summary */}
              <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Activity className="w-32 h-32" />
                </div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Ringkasan Medis</h3>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Diagnosis Terbaru:</p>
                  <h4 className="text-xl font-black text-slate-800 leading-tight">
                    {pekerja?.status_kesehatan === 'sehat' ? 'Kondisi Sehat / Fit' : 'Gejala Awal PAK (Penyakit Akibat Kerja)'}
                  </h4>
                  
                  <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <p className="text-xs text-slate-500 font-medium">Terakhir diperbarui: <span className="text-slate-800 font-bold">12 Okt 2023</span></p>
                    </div>
                    <button className="text-[#0ea5e9] text-xs font-black hover:underline flex items-center gap-1">
                      Lihat Detail <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Documents */}
            <div className="col-span-4 space-y-8">
              
              {/* Supporting Documents */}
              <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Dokumen Pendukung</h3>
                  </div>
                  <label className="cursor-pointer group">
                    <input 
                      type="file" 
                      className="hidden" 
                      multiple 
                      onChange={(e) => {
                        // Assuming first medical record or generic upload
                        if (pekerja?.detail_medis?.[0]) {
                          handleFileUpload('medis', pekerja.detail_medis[0].id, e.target.files);
                        } else {
                          toast.error('Belum ada data rekam medis untuk dilampirkan.');
                        }
                      }} 
                    />
                    <div className="w-8 h-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center group-hover:bg-blue-50 group-hover:text-[#0ea5e9] transition-all">
                      <Plus className="w-5 h-5" />
                    </div>
                  </label>
                </div>

                <div className="space-y-4 flex-1">
                  {pekerja?.detail_medis?.filter((m: any) => m.file_hasil_path).map((m: any, idx: number) => (
                    <DocumentItem 
                      key={idx}
                      name={m.hasil_diagnosis || `Hasil Lab_${idx+1}.pdf`} 
                      type="pdf" 
                      onDownload={() => window.open(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/api/medis/${m.id}/file`, '_blank')}
                    />
                  ))}
                  
                  {/* Mock files if none exist to match mockup */}
                  {(!pekerja?.detail_medis || pekerja.detail_medis.length === 0) && (
                    <>
                      <DocumentItem name="Hasil Lab_01.pdf" type="pdf" />
                      <DocumentItem name="Surat Rujukan.docx" type="doc" />
                    </>
                  )}
                </div>

                <div className="mt-8 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-[#0ea5e9] shrink-0" />
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                      Unggah dokumen baru untuk mempercepat proses verifikasi status kesehatan Anda.
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

// Helper Components
function NavItem({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 font-bold text-sm ${
      active 
        ? 'bg-[#0ea5e9] text-white shadow-lg shadow-blue-200 translate-x-2' 
        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
    }`}>
      <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400'}`} />
      {label}
    </button>
  );
}

function StatusStep({ icon: Icon, label, status, active, completed }: { icon: any, label: string, status: string, active: boolean, completed: boolean }) {
  return (
    <div className="flex flex-col items-center text-center relative z-10">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-md ${
        completed ? 'bg-emerald-500 text-white' : 
        active ? 'bg-white text-[#0ea5e9] border-2 border-blue-100' : 
        'bg-slate-50 text-slate-300 border border-slate-100'
      }`}>
        <Icon className="w-5 h-5" />
      </div>
      <h4 className="mt-4 text-xs font-black text-slate-900 tracking-tight">{label}</h4>
      <p className={`text-[10px] font-bold mt-1 ${
        completed ? 'text-emerald-500' : 
        active ? 'text-[#0ea5e9]' : 
        'text-slate-400'
      }`}>{status}</p>
    </div>
  );
}

function DocumentItem({ name, type, onDownload }: { name: string, type: 'pdf' | 'doc', onDownload?: () => void }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group hover:bg-white hover:border-blue-100 hover:shadow-lg hover:shadow-slate-100 transition-all duration-300">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          type === 'pdf' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'
        }`}>
          <FileText className="w-5 h-5" />
        </div>
        <p className="text-sm font-bold text-slate-700 truncate max-w-[140px]">{name}</p>
      </div>
      <button 
        onClick={onDownload}
        className="p-2 text-slate-300 hover:text-[#0ea5e9] hover:bg-blue-50 rounded-lg transition-all"
      >
        <Download className="w-4 h-4" />
      </button>
    </div>
  );
}

function Building2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </svg>
  )
}

function ShieldCheck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function Info(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  )
}
