'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import Link from 'next/link';
import api from '@/lib/axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

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
          window.location.href = '/';
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal login. Periksa email dan password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <ShieldAlert className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Sistem Rekam Jejak PAK</CardTitle>
          <CardDescription>
            Masukkan email dan password Anda untuk masuk ke sistem.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@example.com" 
                required 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                required 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? 'Masuk...' : 'Masuk Dashboard'}
            </Button>
            <p className="text-center text-sm text-slate-500 mt-4">
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
