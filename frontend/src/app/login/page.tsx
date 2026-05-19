'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import api from '@/lib/axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, Eye, EyeOff, ArrowLeft, MessageSquare, Chrome } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  // Hybrid Auth States
  const [isOrganisasi, setIsOrganisasi] = useState<boolean | null>(null);
  const [waNumber, setWaNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Check URL query parameters for Google callback errors
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const error = params.get('error');
      if (error) {
        if (error === 'aborted') {
          toast.warning("Proses masuk Google dibatalkan.");
        } else {
          toast.error(`Gagal masuk via Google: ${decodeURIComponent(error)}`);
        }
        // Clear query parameters
        router.replace('/login');
      }
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/login', formData);
      if (response.data.status === 'success') {
        const { token, user } = response.data.data;
        
        if (user.role === 'admin') {
          toast.error('Akun Superadmin tidak diizinkan masuk dari sini. Silakan gunakan link khusus Superadmin.');
          setLoading(false);
          return;
        }

        // Store auth info
        Cookies.set('auth_token', token, { expires: 7, path: '/' });
        localStorage.setItem('user', JSON.stringify(user));

        toast.success(response.data.message);
        
        if (user.role === 'viewer') {
          // Check if this viewer already has a pekerja record
          try {
            const meRes = await api.get('/me');
            const pekerja = meRes.data.data?.pekerja;
            if (pekerja?.id) {
              localStorage.setItem('user', JSON.stringify({ ...user, pekerja_id: pekerja.id }));
              window.location.href = '/dashboard-user';
            } else {
              window.location.href = '/pendaftaran';
            }
          } catch {
            window.location.href = '/pendaftaran';
          }
        } else {
          window.location.href = '/dashboard-admin';
        }
        
        return;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal login. Periksa kembali No. Telp/Email dan password.');
      setFormData({ identifier: '', password: '' });
      setLoading(false); // Only reset loading on error
    }
  };

  const handleGoogleLogin = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    const apiHost = apiBase.replace(/\/api$/, '');
    window.location.href = `${apiHost}/api/auth/google/redirect`;
  };

  const sendOtpCode = async () => {
    if (!waNumber) {
      toast.error("Nomor WhatsApp wajib diisi!");
      return;
    }
    setSendingOtp(true);
    try {
      const formattedWa = waNumber.trim().replace(/[^0-9]/g, '');
      const res = await api.post('/auth/whatsapp/send-otp', { whatsapp: formattedWa });
      if (res.data.status === 'success') {
        toast.success(res.data.message);
        setOtpSent(true);
        // If debug OTP exists in response, show a helpful alert for local dev testing
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

  const verifyOtpCode = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast.error("Kode verifikasi harus tepat 6 digit!");
      return;
    }
    setVerifyingOtp(true);
    try {
      const formattedWa = waNumber.trim().replace(/[^0-9]/g, '');
      const res = await api.post('/auth/whatsapp/verify-otp', { whatsapp: formattedWa, otp: otpCode });
      if (res.data.status === 'success') {
        const { token, user } = res.data.data;
        
        if (user.role === 'admin') {
          toast.error('Akun Superadmin tidak diizinkan masuk dari sini. Silakan gunakan link khusus Superadmin.');
          setVerifyingOtp(false);
          return;
        }

        // Store auth info
        Cookies.set('auth_token', token, { expires: 7, path: '/' });
        localStorage.setItem('user', JSON.stringify(user));
        toast.success(res.data.message);

        // Check if this viewer already has a pekerja record
        try {
          const meRes = await api.get('/me');
          const pekerja = meRes.data.data?.pekerja;
          if (pekerja?.id) {
            localStorage.setItem('user', JSON.stringify({ ...user, pekerja_id: pekerja.id }));
            window.location.href = '/dashboard-user';
          } else {
            window.location.href = '/pendaftaran';
          }
        } catch {
          window.location.href = '/pendaftaran';
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Kode verifikasi salah atau kedaluwarsa.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Safe cleanup for leftover Radix UI portals/pointer-events after redirection
  useEffect(() => {
    document.body.style.pointerEvents = '';
    document.documentElement.style.pointerEvents = '';
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    
    // Hide any leftover backdrops from Shadcn Dialog/Sheet
    const backdrops = document.querySelectorAll('.fixed.inset-0.bg-black\\/80');
    backdrops.forEach(el => {
      if (el instanceof HTMLElement) {
        el.style.display = 'none';
      }
    });
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md mb-6 animate-in slide-in-from-left-4 duration-500">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-primary transition-all font-black text-[10px] uppercase tracking-[0.2em] group">
          <div className="p-1.5 rounded-full bg-white shadow-sm border border-slate-200 group-hover:border-primary/30 transition-all">
            <ArrowLeft className="h-3 w-3" /> 
          </div>
          Kembali ke Landing Page
        </Link>
      </div>

      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <CardHeader className="space-y-1 text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <ShieldAlert className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Sistem Rekam Jejak PAK</CardTitle>
          <CardDescription>
            Selamat datang! Silakan tentukan opsi masuk di bawah ini.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* TABS SELECTOR */}
          <div className="space-y-2.5">
            <Label className="text-slate-500 font-bold text-xs uppercase tracking-wider block text-center">Apakah Anda Anggota Organisasi?</Label>
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-xl border border-slate-200/60">
              <button 
                type="button"
                onClick={() => {
                  setIsOrganisasi(true);
                  setOtpSent(false);
                }}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                  isOrganisasi === true 
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/50" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Ya, Anggota
              </button>
              <button 
                type="button"
                onClick={() => setIsOrganisasi(false)}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                  isOrganisasi === false 
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/50" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Bukan Anggota
              </button>
            </div>
          </div>

          {/* VIEW: GOOGLE OAUTH */}
          {isOrganisasi === true && (
            <div className="pt-2 text-center space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="p-4 bg-blue-50/50 border border-blue-100/60 rounded-xl">
                <p className="text-xs text-blue-600 font-medium leading-relaxed">
                  Anggota organisasi masuk instan dan aman menggunakan email Gmail yang terdaftar.
                </p>
              </div>
              <Button 
                type="button"
                className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold flex items-center justify-center gap-3 shadow-sm rounded-xl py-5 transition-all duration-200 hover:border-slate-400"
                onClick={handleGoogleLogin}
              >
                <img src="https://www.svgrepo.com/show/355037/google.svg" className="w-5 h-5" alt="Google Logo" />
                Masuk dengan Google
              </Button>
            </div>
          )}

          {/* VIEW: WHATSAPP OTP */}
          {isOrganisasi === false && (
            <div className="space-y-4 pt-1 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="p-4 bg-emerald-50/50 border border-emerald-100/60 rounded-xl">
                <p className="text-xs text-emerald-600 font-medium leading-relaxed">
                  Pekerja non-anggota masuk menggunakan nomor WhatsApp aktif untuk verifikasi kode OTP sekali pakai.
                </p>
              </div>

              {!otpSent ? (
                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="whatsapp" className="text-slate-600 font-semibold">Nomor WhatsApp Aktif</Label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold border-r pr-2 border-slate-200">+62</span>
                      <Input 
                        id="whatsapp" 
                        type="tel"
                        placeholder="8123456xxxx" 
                        value={waNumber}
                        onChange={(e) => setWaNumber(e.target.value.replace(/[^0-9]/g, ''))}
                        className="pl-16 rounded-xl border-slate-300 bg-white"
                      />
                    </div>
                  </div>
                  <Button 
                    type="button"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl py-5 gap-2" 
                    onClick={sendOtpCode}
                    disabled={sendingOtp}
                  >
                    <MessageSquare className="h-4 w-4" />
                    {sendingOtp ? 'Mengirim Kode...' : 'Kirim Kode Verifikasi'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-slate-600 font-semibold text-center block">Masukkan Kode Verifikasi 6-Digit</Label>
                    <Input 
                      id="otp" 
                      type="text"
                      maxLength={6} 
                      className="text-center text-2xl font-black tracking-[0.4em] rounded-xl border-slate-300 bg-white h-12"
                      placeholder="******" 
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    />
                    <p className="text-[10px] text-slate-400 text-center mt-1">Kode OTP telah dikirimkan ke nomor +62{waNumber}</p>
                  </div>
                  <Button 
                    type="button"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl py-5" 
                    onClick={verifyOtpCode}
                    disabled={verifyingOtp}
                  >
                    {verifyingOtp ? 'Memverifikasi...' : 'Verifikasi & Masuk Dashboard'}
                  </Button>
                  <button 
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode('');
                    }} 
                    className="text-xs text-primary font-bold hover:underline block text-center w-full mt-2"
                  >
                    Ubah Nomor WhatsApp
                  </button>
                </div>
              )}
            </div>
          )}

          {/* VIEW: FALLBACK REGULAR LOGIN */}
          {isOrganisasi === null && (
            <form onSubmit={handleLogin} className="space-y-4 pt-2 animate-in fade-in duration-300">
              <div className="space-y-2">
                <Label htmlFor="identifier">No. Telp / Email</Label>
                <Input 
                  id="identifier" 
                  type="text" 
                  placeholder="Contoh: 0812... atau admin@email.com" 
                  required 
                  value={formData.identifier}
                  onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                  className="rounded-xl border-slate-300 bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? 'text' : 'password'} 
                    required 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="pr-10 rounded-xl border-slate-300 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button className="w-full font-bold rounded-xl py-5 mt-2" type="submit" disabled={loading}>
                {loading ? 'Masuk...' : 'Masuk Dashboard'}
              </Button>
            </form>
          )}

          {/* Fallback back button if selected an option */}
          {isOrganisasi !== null && (
            <button 
              type="button"
              onClick={() => setIsOrganisasi(null)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1.5 w-full pt-2 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Login Sandi
            </button>
          )}
        </CardContent>

        <CardFooter className="flex-col gap-4 bg-slate-50 border-t border-slate-100 py-5">
          <p className="text-center text-xs text-slate-500">
            Belum punya akun?{' '}
            <Link href="/pendaftaran" className="text-primary font-bold hover:underline">
              Daftar di sini
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
