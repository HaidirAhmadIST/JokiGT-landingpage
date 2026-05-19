'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import api from '@/lib/axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Eye, EyeOff, ArrowLeft, Lock, User } from 'lucide-react';
import { toast } from 'sonner';

export default function SuperadminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/login', formData);
      if (response.data.status === 'success') {
        const { token, user } = response.data.data;
        
        // Enforce Superadmin-only role check
        if (user.role !== 'admin') {
          toast.error('Akses Ditolak: Akun Anda tidak terdaftar sebagai Superadmin.');
          setLoading(false);
          return;
        }

        // Store auth info
        Cookies.set('auth_token', token, { expires: 7, path: '/' });
        localStorage.setItem('user', JSON.stringify(user));

        toast.success('Login Superadmin berhasil. Selamat datang kembali!');
        
        // Redirect directly to the admin dashboard
        window.location.href = '/dashboard-admin';
        return;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal login. Periksa kembali No. Telp/Email dan password Anda.');
      setLoading(false);
    }
  };

  // Safe cleanup for Radix UI portal overlay remains if redirected
  useEffect(() => {
    document.body.style.pointerEvents = '';
    document.documentElement.style.pointerEvents = '';
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Decorative Premium Glow Backgrounds */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-cyan-900/25 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-sky-900/25 blur-[150px] pointer-events-none" />
      
      <div className="w-full max-w-md mb-6 animate-in slide-in-from-left-4 duration-500 z-10">
        <Link href="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-all font-black text-[10px] uppercase tracking-[0.2em] group">
          <div className="p-1.5 rounded-full bg-slate-900 border border-slate-800 group-hover:border-cyan-500/30 transition-all">
            <ArrowLeft className="h-3 w-3 text-slate-400 group-hover:text-cyan-400" /> 
          </div>
          Halaman Login Umum
        </Link>
      </div>

      <Card className="w-full max-w-md shadow-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 z-10">
        <CardHeader className="space-y-1 text-center pb-6 border-b border-slate-800/80">
          <div className="flex justify-center mb-4">
            <div className="bg-cyan-500/10 p-3 rounded-full border border-cyan-500/20">
              <ShieldCheck className="h-10 w-10 text-cyan-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-black tracking-tight text-white">Superadmin Portal</CardTitle>
          <CardDescription className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
            Sistem Rekam Jejak PAK — Area Terbatas
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 pt-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-xs font-bold text-slate-300 tracking-wide uppercase">Email / No. Telepon</Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <User className="h-4 w-4" />
                </span>
                <Input 
                  id="identifier" 
                  type="text" 
                  placeholder="superadmin@email.com" 
                  required 
                  value={formData.identifier}
                  onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                  className="pl-10 rounded-xl border-slate-800 bg-slate-950/60 text-slate-100 placeholder:text-slate-600 focus-visible:ring-cyan-500 focus-visible:border-cyan-500 h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold text-slate-300 tracking-wide uppercase">Kata Sandi</Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <Input 
                  id="password" 
                  type={showPassword ? 'text' : 'password'} 
                  required 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="pl-10 pr-10 rounded-xl border-slate-800 bg-slate-950/60 text-slate-100 placeholder:text-slate-600 focus-visible:ring-cyan-500 focus-visible:border-cyan-500 h-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button 
              className="w-full font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl py-6 mt-4 shadow-lg shadow-cyan-950/50 hover:shadow-cyan-500/20 transition-all duration-300 text-sm tracking-wide" 
              type="submit" 
              disabled={loading}
            >
              {loading ? 'Mengautentikasi...' : 'Masuk Dashboard Utama'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex-col bg-slate-950/40 border-t border-slate-850 py-4 text-center">
          <p className="text-xs text-slate-500 font-semibold tracking-wide">
            Hanya akun dengan hak akses tingkat tinggi yang diizinkan masuk.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
