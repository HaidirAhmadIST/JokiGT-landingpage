'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '@/lib/axios';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthCallbackPage() {
  const router = useRouter();
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const token = searchParams.get('token');
      const userStr = searchParams.get('user');

      if (!token || !userStr) {
        toast.error("Otorisasi Google tidak lengkap atau tidak valid.");
        router.replace('/login');
        return;
      }

      try {
        const user = JSON.parse(decodeURIComponent(userStr));

        // 1. Store Sanctum Token in Cookies
        Cookies.set('auth_token', token, { expires: 7, path: '/' });

        // 2. Store User Profile in LocalStorage
        localStorage.setItem('user', JSON.stringify(user));

        toast.success(`Selamat datang kembali, ${user.nama}!`);

        // 3. Smart Routing: Check if viewer profile has a worker record
        const checkWorkerProfile = async () => {
          try {
            if (user.role === 'admin' || user.role === 'petugas') {
              window.location.href = '/dashboard-admin';
              return;
            }

            // Fetch current authenticated user details
            const meRes = await api.get('/me');
            const pekerja = meRes.data.data?.pekerja;

            if (pekerja?.id) {
              // Store pekerja_id in localStorage to prevent layout re-fetching
              localStorage.setItem('user', JSON.stringify({
                ...user,
                pekerja_id: pekerja.id
              }));
              // Redirect straight to user dashboard
              window.location.href = '/dashboard-user';
            } else {
              // Not registered yet — redirect to registration wizard
              window.location.href = '/pendaftaran';
            }
          } catch (err) {
            console.error("Error checking worker profile:", err);
            // Default fallback
            window.location.href = '/pendaftaran';
          }
        };

        checkWorkerProfile();

      } catch (err) {
        console.error("Failed to parse Google OAuth details:", err);
        toast.error("Format data login Google tidak valid.");
        router.replace('/login');
      }
    }
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="flex justify-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Menyelesaikan Autentikasi...</h2>
        <p className="text-sm text-slate-400">Mohon tunggu sebentar selagi kami memproses detail login Google Anda.</p>
      </div>
    </div>
  );
}
