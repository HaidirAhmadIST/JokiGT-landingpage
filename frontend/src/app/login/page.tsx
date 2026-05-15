'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import api from '@/lib/axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ whatsapp: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/login', formData);
      if (response.data.status === 'success') {
        const { token, user } = response.data.data;
        
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
              // Store pekerja_id so layout can redirect without extra API call
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
        
        // Note: We DON'T call setLoading(false) here because we want the 
        // button to stay in "Masuk..." state while the router is navigating.
        // The page will be replaced soon anyway.
        return;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal login. Periksa nomor WhatsApp dan password.');
      setFormData({ whatsapp: '', password: '' }); // Clear inputs on error
      setLoading(false); // Only reset loading on error
    }
  };

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
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <ShieldAlert className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Sistem Rekam Jejak PAK</CardTitle>
          <CardDescription>
            Masukkan nomor WhatsApp dan password Anda untuk masuk ke sistem.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp">Nomor WhatsApp</Label>
              <Input 
                id="whatsapp" 
                type="text" 
                placeholder="Contoh: 08123456789" 
                required 
                value={formData.whatsapp}
                onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? 'text' : 'password'} 
                  required 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="pr-10"
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
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? 'Masuk...' : 'Masuk Dashboard'}
            </Button>
            <p className="text-center text-sm text-slate-500">
              Belum punya akun?{' '}
              <Link href="/pendaftaran" className="text-primary font-semibold hover:underline">
                Daftar di sini
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
