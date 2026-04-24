'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Lock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

function RegisterPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [formData, setFormData] = useState({
    email: emailParam,
    password: '',
    password_confirmation: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.password_confirmation) {
      toast.error('Konfirmasi password tidak cocok.');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password minimal 8 karakter.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/register/complete', formData);
      setSuccess(true);
      localStorage.removeItem('REKAM_JEJAK_FORM_DATA');
      toast.success('Akun Anda telah aktif!');
      
      // Auto redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyetel password.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-100/50">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900">Registrasi Berhasil!</h2>
          <p className="text-slate-500 mt-2">Password Anda telah berhasil disetel. Menuju halaman login dalam 3 detik...</p>
        </div>
        <Button 
          onClick={() => router.push('/login')}
          className="bg-[#0ea5e9] hover:bg-[#0284c7] rounded-xl px-8 h-12 font-bold"
        >
          Masuk Sekarang
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl mb-4">
          <ShieldCheck className="w-8 h-8 text-[#0ea5e9]" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Satu Langkah Lagi</h1>
        <p className="text-slate-500 mt-2">Silakan buat password untuk mengaktifkan akun Anda.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Anda</Label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              id="email" 
              type="email" 
              readOnly 
              value={formData.email}
              className="pl-11 h-12 bg-slate-50 border-slate-200 rounded-xl font-medium text-slate-600 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password Baru</Label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              id="password" 
              type="password" 
              placeholder="Minimal 8 karakter"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="pl-11 h-12 rounded-xl border-slate-200 focus-visible:ring-[#0ea5e9]"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password_confirmation" className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Konfirmasi Password</Label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              id="password_confirmation" 
              type="password" 
              placeholder="Ulangi password"
              required
              value={formData.password_confirmation}
              onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
              className="pl-11 h-12 rounded-xl border-slate-200 focus-visible:ring-[#0ea5e9]"
            />
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full h-12 bg-[#0ea5e9] hover:bg-[#0284c7] rounded-xl font-bold text-white shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
        >
          {loading ? 'Memproses...' : (
            <>
              Aktifkan Akun <ArrowRight className="ml-2 w-4 h-4" />
            </>
          )}
        </Button>
      </form>
      
      <p className="text-center text-slate-400 text-sm mt-8">
        © 2024 ADVOKASI PAK. Semua Hak Dilindungi.
      </p>
    </div>
  );
}

export default function RegisterPasswordPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <Suspense fallback={<div className="text-slate-500 font-medium">Memuat...</div>}>
        <RegisterPasswordContent />
      </Suspense>
    </div>
  );
}
