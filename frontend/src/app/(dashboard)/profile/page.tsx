'use client';

import { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Shield, 
  Clock, 
  Calendar, 
  MapPin, 
  Phone,
  Camera,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Profile Section */}
      <div className="relative">
        <div className="h-48 w-full bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] rounded-3xl shadow-lg" />
        <div className="absolute -bottom-16 left-8 flex items-end gap-6">
          <div className="relative group">
            <div className="h-32 w-32 rounded-full bg-white border-4 border-white shadow-xl flex items-center justify-center text-4xl font-black text-[#0ea5e9] overflow-hidden">
              {user?.nama?.charAt(0).toUpperCase() || 'A'}
            </div>
            <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md border border-slate-100 text-slate-500 hover:text-[#0ea5e9] transition-colors">
              <Camera className="h-5 w-5" />
            </button>
          </div>
          <div className="pb-4">
            <h1 className="text-3xl font-extrabold text-[#0f172a]">{user?.nama || 'Administrator'}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2.5 py-0.5 bg-blue-50 text-[#0ea5e9] text-[10px] font-bold rounded-full uppercase tracking-wider">
                {user?.role || 'Super Admin'}
              </span >
              <span className="text-slate-400 text-xs font-medium">•</span>
              <span className="text-slate-500 text-sm font-medium">{user?.email}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-12">
        {/* Left Column: Info Cards */}
        <div className="space-y-6">
          <Card className="p-6 rounded-2xl border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
              <AlertCircle className="h-4 w-4 text-[#0ea5e9] mr-2" /> Detail Akun
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-1.5 bg-slate-50 rounded-lg text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</p>
                  <p className="text-sm font-semibold text-slate-700">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-1.5 bg-slate-50 rounded-lg text-slate-400">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role Akses</p>
                  <p className="text-sm font-semibold text-slate-700 capitalize">{user?.role}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-1.5 bg-slate-50 rounded-lg text-slate-400">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Terdaftar Sejak</p>
                  <p className="text-sm font-semibold text-slate-700">22 April 2024</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-2xl border-slate-100 shadow-sm bg-blue-50/30 border-blue-100/50">
             <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <p className="text-xs font-bold text-slate-700">Status Akun Terverifikasi</p>
             </div>
             <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
               Akun Anda memiliki akses penuh ke seluruh modul sistem Azure Sentinel.
             </p>
          </Card>
        </div>

        {/* Right Column: Editable Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-8 rounded-2xl border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold text-slate-900">Informasi Profil</h3>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl border-slate-200 font-bold"
                onClick={() => toast.info('Fitur edit sedang dikembangkan.')}
              >
                Edit Profil
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Nama Lengkap</label>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm font-semibold text-slate-700">
                    {user?.nama}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Nomor Telepon</label>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm font-semibold text-slate-700">
                    <Phone className="h-4 w-4 text-slate-300" />
                    +62 812-3456-7890
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Jabatan</label>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm font-semibold text-slate-700">
                    Koordinator Advokasi Lapangan
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Lokasi Tugas</label>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm font-semibold text-slate-700">
                    <MapPin className="h-4 w-4 text-slate-300" />
                    Kantor Pusat Jakarta
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Bio / Deskripsi</label>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm font-medium text-slate-600 italic leading-relaxed">
                  "Berdedikasi untuk memberikan pendampingan terbaik bagi seluruh pekerja yang terdampak Penyakit Akibat Kerja (PAK)."
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8 rounded-2xl border-slate-100 shadow-sm border-l-4 border-l-[#0ea5e9]">
             <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Keamanan Akun</h4>
                  <p className="text-xs text-slate-400 font-medium">Kelola kata sandi dan proteksi akun Anda.</p>
                </div>
                <Button className="bg-[#0ea5e9] hover:bg-[#0284c7] font-bold rounded-xl" onClick={() => toast.info('Fitur ganti password sedang dikembangkan.')}>
                  Ganti Password
                </Button>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
