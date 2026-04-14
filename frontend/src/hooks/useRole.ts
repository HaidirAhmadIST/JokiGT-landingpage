import { useState, useEffect } from 'react';

export type Role = 'admin' | 'petugas' | 'viewer';

export function useRole() {
  const [user, setUser] = useState<{ id: number; nama: string; role: Role } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user from localStorage', e);
      }
    }
    setLoading(false);
  }, []);

  return {
    user,
    role: user?.role,
    isSuperAdmin: user?.role === 'admin', // Super Admin
    isStaff: user?.role === 'petugas',    // Staff
    isUser: user?.role === 'viewer',      // Reguler User
    isStaffOrAbove: user?.role === 'admin' || user?.role === 'petugas',
    loading
  };
}
