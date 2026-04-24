'use client';

import { useState, useEffect, useRef } from 'react';
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
  AlertCircle,
  Loader2,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/lib/axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [profileForm, setProfileForm] = useState({
    nama: '',
    phone: '',
    jabatan: '',
    lokasi: '',
    bio: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setProfileForm({
        nama: userData.nama || '',
        phone: userData.phone || '',
        jabatan: userData.jabatan || '',
        lokasi: userData.lokasi || '',
        bio: userData.bio || ''
      });
    }
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleEditProfile = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.put('/profile', profileForm);
      if (res.data.status === 'success') {
        const updatedUser = { ...user, ...res.data.data };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        toast.success('Profil berhasil diperbarui!');
        setIsEditModalOpen(false);
        // Refresh page to sync with layout if needed
        window.location.reload();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui profil');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('foto', file);

    setIsUploading(true);
    try {
      const res = await api.post('/profile/foto', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.status === 'success') {
        const updatedUser = { ...user, foto: res.data.data.foto_url };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        toast.success('Foto profil berhasil diperbarui!');
        window.location.reload();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengunggah foto');
    } finally {
      setIsUploading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/change-password', passwordForm);
      if (res.data.status === 'success') {
        toast.success('Password berhasil diubah! Silakan login kembali.');
        setIsPasswordModalOpen(false);
        setTimeout(() => {
          localStorage.removeItem('user');
          window.location.href = '/login';
        }, 2000);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengubah password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRole = user?.role === 'admin' ? 'Super Admin' : (user?.role || 'Super Admin');
  const avatarUrl = user?.foto ? (user.foto.startsWith('http') ? user.foto : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/storage/${user.foto}`) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <Card className="p-8 md:p-12 rounded-3xl border-slate-100 shadow-sm bg-white flex flex-col md:flex-row gap-10">
        {/* Left Side: Avatar */}
        <div className="shrink-0 flex flex-col items-center">
          <div className="relative group">
            <div className="h-40 w-40 md:h-48 md:w-48 rounded-full bg-slate-50 border-4 border-white shadow-xl flex items-center justify-center text-6xl font-black text-[#0ea5e9] overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={user?.nama} className="w-full h-full object-cover" />
              ) : (
                user?.nama?.charAt(0).toUpperCase() || 'A'
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleUploadFoto}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute bottom-2 right-2 p-3 bg-white rounded-full shadow-lg border border-slate-100 text-slate-500 hover:text-[#0ea5e9] transition-colors disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Right Side: Info */}
        <div className="flex-1 space-y-6">
          <div className="flex justify-between items-start border-b border-slate-100 pb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-[#0f172a]">{user?.nama || 'Administrator'}</h1>
            </div>
            <Button 
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:bg-slate-50 hover:text-[#0ea5e9] rounded-xl shrink-0"
              onClick={() => setIsEditModalOpen(true)}
              title="Edit Profil"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </Button>
          </div>

          <div className="space-y-4 text-[13px] md:text-sm">
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-4">
              <span className="text-slate-400 w-48 shrink-0">Role Akses:</span>
              <span className="font-medium text-slate-700">{displayRole}</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-4">
              <span className="text-slate-400 w-48 shrink-0">Terdaftar Sejak:</span>
              <span className="font-medium text-slate-700">22 April 2024</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-4">
              <span className="text-slate-400 w-48 shrink-0">Email:</span>
              <span className="font-medium text-slate-700">{user?.email}</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-4">
              <span className="text-slate-400 w-48 shrink-0">Nomor Telepon:</span>
              <span className="font-medium text-slate-700">{user?.phone || '-'}</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-4">
              <span className="text-slate-400 w-48 shrink-0">Jabatan:</span>
              <span className="font-medium text-slate-700">{user?.jabatan || '-'}</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-4">
              <span className="text-slate-400 w-48 shrink-0">Alamat Rumah Admin:</span>
              <span className="font-medium text-slate-700">{user?.lokasi || '-'}</span>
            </div>
            </div>
        </div>
      </Card>

        {/* Bottom Cards: Security and Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 rounded-3xl border-slate-100 shadow-sm border-l-4 border-l-[#0ea5e9] flex justify-between items-center">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#0ea5e9]" /> Keamanan Akun
              </h4>
              <p className="text-xs text-slate-400 font-medium mt-1">Kelola kata sandi untuk proteksi.</p>
            </div>
            <Button 
              className="bg-[#0ea5e9] hover:bg-[#0284c7] font-bold rounded-xl shadow-lg shadow-blue-200/50 transition-all shrink-0"
              onClick={() => setIsPasswordModalOpen(true)}
            >
              Ganti Password
            </Button>
          </Card>

          <Card className="p-6 rounded-3xl border-slate-100 shadow-sm bg-emerald-50/50 border-emerald-100/50 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-800">Status Terverifikasi</h4>
              <p className="text-xs text-emerald-600/80 font-medium mt-1 leading-relaxed">
                Akun ini memiliki akses aktif dan penuh ke modul Sentinel.
              </p>
            </div>
          </Card>
        </div>
      {/* EDIT PROFILE MODAL */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Profil</DialogTitle>
            <DialogDescription>Perbarui informasi profil publik Anda.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Lengkap</Label>
              <Input 
                id="nama" 
                placeholder="masukan dengan nama lengkap"
                value={profileForm.nama} 
                onChange={(e) => setProfileForm({ ...profileForm, nama: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Nomor Telepon</Label>
              <Input 
                id="phone" 
                value={profileForm.phone} 
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jabatan">Jabatan</Label>
                <Input 
                  id="jabatan" 
                  value={profileForm.jabatan} 
                  onChange={(e) => setProfileForm({ ...profileForm, jabatan: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lokasi">Alamat Rumah Admin</Label>
                <Input 
                  id="lokasi" 
                  value={profileForm.lokasi} 
                  onChange={(e) => setProfileForm({ ...profileForm, lokasi: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>Batal</Button>
            <Button 
              onClick={handleEditProfile} 
              disabled={isSubmitting}
              className="bg-[#0ea5e9] hover:bg-[#0284c7] font-bold rounded-xl"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CHANGE PASSWORD MODAL */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-500" /> Ganti Password
            </DialogTitle>
            <DialogDescription>Pastikan gunakan password yang kuat untuk keamanan akun.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="curr">Password Saat Ini</Label>
              <div className="relative">
                <Input 
                  id="curr" 
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordForm.current_password} 
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  className="rounded-xl pr-10"
                />
                <button 
                  type="button"
                  onClick={() => setShowPasswords(s => ({ ...s, current: !s.current }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new">Password Baru</Label>
              <div className="relative">
                <Input 
                  id="new" 
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordForm.new_password} 
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  className="rounded-xl pr-10"
                />
                <button 
                  type="button"
                  onClick={() => setShowPasswords(s => ({ ...s, new: !s.new }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Konfirmasi Password Baru</Label>
              <div className="relative">
                <Input 
                  id="confirm" 
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordForm.new_password_confirmation} 
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password_confirmation: e.target.value })}
                  className="rounded-xl pr-10"
                />
                <button 
                  type="button"
                  onClick={() => setShowPasswords(s => ({ ...s, confirm: !s.confirm }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsPasswordModalOpen(false)} disabled={isSubmitting}>Batal</Button>
            <Button 
              onClick={handleChangePassword} 
              disabled={isSubmitting}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
