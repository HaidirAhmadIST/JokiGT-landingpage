import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import type { DashboardStats } from '@/types';

/**
 * useDashboardStats
 *
 * Custom hook untuk mengambil dan me-refresh statistik utama pada halaman
 * Dashboard Admin. Data di-fetch saat mount dan di-refresh otomatis setiap
 * 30 detik agar tampilan tetap real-time.
 *
 * @returns {{ stats: DashboardStats | null, loading: boolean, refresh: () => void }}
 *
 * @example
 * ```tsx
 * const { stats, loading } = useDashboardStats();
 * ```
 */
export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/dashboard/stats');
      if (res.data.status === 'success') {
        setStats(res.data.data);
      }
    } catch (e) {
      console.error('[useDashboardStats] Fetch failed:', e);
      toast.error('Gagal mengambil statistik dashboard. Periksa koneksi database.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Auto-refresh setiap 30 detik untuk tampilan real-time
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return { stats, loading, refresh: fetchStats };
}
