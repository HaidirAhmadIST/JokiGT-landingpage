'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '@/lib/axios';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  ShieldCheck, 
  Menu,
  Shield,
  LogOut,
  Bell,
  Search,
  Settings,
  Loader2,
  User as UserIcon,
  History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { FileText, Mail, MailOpen, Inbox, CheckCircle, XCircle, Clock, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const ALL_NAVIGATION = [
  { name: 'Dashboard', href: '/dashboard-admin', icon: LayoutDashboard, roles: ['admin', 'petugas'] },
  { name: 'Pekerja', href: '/pekerja', icon: Users, roles: ['admin', 'petugas'] },
  { name: 'Perusahaan', href: '/perusahaan', icon: Building2, roles: ['admin', 'petugas'] },
  { name: 'Advokasi', href: '/advokasi', icon: ShieldCheck, roles: ['admin', 'petugas'] },
  { name: 'Laporan', href: '/laporan', icon: FileText, roles: ['admin'] },
  { name: 'Aktivitas', href: '/aktivitas', icon: History, roles: ['admin'] },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  // Approval Inbox and Notification states
  const [requests, setRequests] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const hasAutoOpened = useRef(false);

  // Profile reminder state
  const [showProfileReminder, setShowProfileReminder] = useState(false);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/inbox');
      if (res.data.status === 'success') {
        let sorted = res.data.data || [];
        setRequests(sorted);
        
        // Count for notification badge
        if (user?.role === 'admin') {
          const pending = sorted.filter((r: any) => r.status === 'PENDING' && r.type === 'APPROVAL_REQUEST');
          setPendingCount(pending.length);
        } else if (user?.role === 'petugas') {
          const lastOpened = localStorage.getItem(`lastInboxOpened_${user.id}`);
          const lastOpenedTime = lastOpened ? new Date(lastOpened).getTime() : 0;
          
          const newResolved = sorted.filter((r: any) => 
            r.status !== 'PENDING' && 
            new Date(r.updated_at).getTime() > lastOpenedTime
          );
          setPendingCount(newResolved.length);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch requests", err);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'petugas') {
      fetchRequests();
      
      const interval = setInterval(fetchRequests, 15000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleApprove = async (id: string | number) => {
    // extract actual id if string
    const actualId = typeof id === 'string' ? id.split('_').pop() : id;
    setSubmittingResponse(true);
    try {
      const res = await api.post(`/approval-requests/${actualId}/respond`, {
        status: 'APPROVED'
      });
      if (res.data.status === 'success') {
        toast.success('Permintaan disetujui dan tindakan berhasil dijalankan.');
        fetchRequests();
        router.refresh();
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyetujui permintaan.');
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Alasan penolakan wajib diisi.');
      return;
    }
    if (!selectedId) return;
    const actualId = selectedId.split('_').pop();

    setSubmittingResponse(true);
    try {
      const res = await api.post(`/approval-requests/${actualId}/respond`, {
        status: 'REJECTED',
        rejection_reason: rejectionReason
      });
      if (res.data.status === 'success') {
        toast.success('Permintaan berhasil ditolak.');
        setIsRejectOpen(false);
        setRejectionReason('');
        fetchRequests();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menolak permintaan.');
    } finally {
      setSubmittingResponse(false);
    }
  };

  const selectedRequest = requests.find(req => req.id === selectedId);

  // Auto-select request matching query param if provided
  useEffect(() => {
    if (typeof window !== 'undefined' && requests.length > 0) {
      if (!hasAutoOpened.current) {
        hasAutoOpened.current = true;
        const params = new URLSearchParams(window.location.search);
        const urlId = params.get('inbox_id');
        if (urlId) {
          setSelectedId('approval_' + urlId);
          setActiveTab('ALL');
          setIsInboxOpen(true);
        }
      }
      
      if (!selectedId) {
        // Default select first item matching activeTab if no selection
        const matches = requests.filter(r => activeTab === 'ALL' || r.status === activeTab);
        if (matches.length > 0) {
          setSelectedId(matches[0].id);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests]);

  // Clear notification badge count when inbox is opened
  useEffect(() => {
    if (isInboxOpen && user) {
      localStorage.setItem(`lastInboxOpened_${user.id}`, new Date().toISOString());
      if (user.role === 'petugas') {
        setPendingCount(0);
      }
    }
  }, [isInboxOpen, user]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-100">
            Tambah
          </span>
        );
      case 'UPDATE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-100">
            Ubah
          </span>
        );
      case 'DELETE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-100">
            Hapus
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase bg-amber-50 text-amber-600 border border-amber-100">
            Pending
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-100">
            Disetujui
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase bg-rose-50 text-rose-600 border border-rose-100">
            Ditolak
          </span>
        );
      default:
        return null;
    }
  };

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initUser = async () => {
      console.log('[Layout] Initializing user...');
      try {
        const token = Cookies.get('auth_token');
        let userData = null;

        // 1. Ambil dari localStorage untuk UI instan
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            if (parsed && isMounted) {
              console.log('[Layout] Found user in localStorage:', parsed.role);
              userData = parsed;
              setUser(parsed);
            }
          } catch (e) {
            console.warn('[Layout] Failed to parse stored user', e);
          }
        }

        // 2. Verifikasi ke server jika ada token
        if (token) {
          console.log('[Layout] Verifying token with server...');
          try {
            const res = await api.get('/me') as any;
            const freshData = res.data.data;
            
            if (freshData && isMounted) {
              console.log('[Layout] Token verified. Role:', freshData.role);
              if (freshData.role === 'viewer' && freshData.pekerja?.id) {
                freshData.pekerja_id = freshData.pekerja.id;
              }
              userData = freshData;
              setUser(freshData);
              localStorage.setItem('user', JSON.stringify(freshData));

              // Check if petugas has incomplete profile
              if (freshData.role === 'petugas' && !freshData.phone && !freshData.whatsapp) {
                setShowProfileReminder(true);
              }
            }
          } catch (err: any) {
            console.warn('[Layout] Auth verification failed:', err.message);
            if (err.response?.status === 401) {
              console.warn('[Layout] Session invalid (401). Clearing state.');
              localStorage.removeItem('user');
              Cookies.remove('auth_token', { path: '/' });
              userData = null;
              if (isMounted) setUser(null);
            }
            // Jika Timeout atau 500, kita biarkan userData terisi dari localStorage agar tidak tiba-tiba keluar
          }
        }

        // 3. Evaluasi akhir
        if (!userData && isMounted) {
          console.log('[Layout] No user found. Redirecting...');
          if (pathname !== '/login' && pathname !== '/pendaftaran') {
            router.replace('/login'); // Gunakan replace agar tidak menumpuk history
          }
        } else if (userData && isMounted) {
          if (userData.role === 'viewer' && !pathname.startsWith('/dashboard-user')) {
            console.log('[Layout] Redirecting viewer to user dashboard...');
            router.replace('/dashboard-user');
          }
        }
      } catch (criticalError) {
        console.error('[Layout] Critical auth error:', criticalError);
      } finally {
        if (isMounted) {
          console.log('[Layout] Initialization complete. Mounting component.');
          setMounted(true);
        }
      }
    };

    initUser();
    return () => { isMounted = false; };
  }, [router, pathname]);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close search on route change
  useEffect(() => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  }, [pathname]);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }

    setSearchLoading(true);
    setSearchOpen(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get('/pekerja', { params: { search: value.trim() } });
        const items = res.data.data?.data || res.data.data || [];
        setSearchResults(items.slice(0, 8)); // Max 8 results
      } catch (e) {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, []);

  const handleLogout = async () => {
    try {
      // Catch error silently so Next.js doesn't show an error overlay if token is already expired (401)
      await api.post('/logout').catch(() => {});
    } catch (error) {
      console.error('Logout failed on server', error);
    } finally {
      Cookies.remove('auth_token', { path: '/' });
      localStorage.removeItem('user');
      router.push('/');
    }
  };

  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        const newWidth = mouseMoveEvent.clientX;
        if (newWidth > 180 && newWidth < 450) {
          setSidebarWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  if (!mounted || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 text-[#0284c7] animate-spin" />
          <p className="text-slate-400 font-medium animate-pulse">Menyiapkan dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] font-sans">
      
      {/* PROFILE REMINDER MODAL */}
      <Dialog open={showProfileReminder} onOpenChange={setShowProfileReminder}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl bg-white border-none shadow-2xl p-0 overflow-hidden">
          <div className="px-6 py-6 border-b border-slate-100 flex items-start gap-4 bg-amber-50/50">
            <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-800">Lengkapi Informasi Kontak</DialogTitle>
              <DialogDescription className="text-sm font-medium text-slate-500 mt-1">
                Data profil Anda (WhatsApp/Telepon) belum lengkap. Mohon lengkapi agar mempermudah koordinasi.
              </DialogDescription>
            </div>
          </div>
          <div className="p-6 flex justify-end gap-3 bg-white">
            <Button variant="ghost" onClick={() => setShowProfileReminder(false)} className="text-slate-500 hover:text-slate-700">
              Nanti Saja
            </Button>
            <Button onClick={() => {
              setShowProfileReminder(false);
              router.push('/profile');
            }} className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded-xl">
              Lengkapi Sekarang
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* FULL-WIDTH TOP HEADER */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-20 shrink-0 shadow-sm print:hidden">
        
        {/* Logo Text Area */}
        <div className="flex items-center gap-4 w-64 shrink-0">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger 
              className="md:hidden -ml-2 text-slate-700 h-9 w-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Open Menu"
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
               {/* Mobile Sidebar Content */}
               <div className="p-6 flex items-center justify-center gap-3">
                 <Image src="/logo.png" alt="Rekam Jejak PAK Logo" width={32} height={32} className="h-8 w-8 object-contain drop-shadow-sm" />
                 <h2 className="font-extrabold text-xl text-slate-800 tracking-tight whitespace-nowrap">Rekam Jejak PAK</h2>
               </div>
               
               <div className="px-4 mb-6">
                 <div className="bg-blue-50/50 border border-blue-100/50 rounded-xl p-3 flex items-center gap-3">
                    <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-800 tracking-wider">
                        {user?.role === 'petugas' ? 'STAF SERIKAT' : 'ADMIN PANEL'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {user?.role === 'petugas' && user?.serikat ? user.serikat : 'Mode Manajemen'}
                      </p>
                    </div>
                 </div>
               </div>

               <nav className="flex-1 space-y-1 mt-2">
                {ALL_NAVIGATION.filter(item => !user?.role || item.roles.includes(user.role)).map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`group flex items-center px-6 py-3.5 text-sm font-semibold transition-all duration-200 border-l-[3px] ${
                        isActive 
                          ? 'bg-[#E0F2FE] text-[#0284c7] border-[#0ea5e9]' 
                          : 'text-slate-500 hover:bg-slate-50 border-transparent hover:text-slate-800'
                      }`}
                    >
                      <item.icon className={`mr-4 shrink-0 h-[18px] w-[18px] ${isActive ? 'text-[#0ea5e9]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
          <div className="hidden md:flex items-center gap-3">
            <Image src="/logo.png" alt="Rekam Jejak PAK Logo" width={32} height={32} className="h-8 w-8 object-contain drop-shadow-sm" />
            <h1 className="font-extrabold text-xl text-[#0f172a] tracking-tight whitespace-nowrap">Rekam Jejak PAK</h1>
          </div>
        </div>

        {/* Center Search Bar */}
        <div className="flex-1 max-w-xl mx-8 hidden sm:block relative" ref={searchRef}>
          <div className="relative group">
            {searchLoading ? (
              <Loader2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0ea5e9] animate-spin" />
            ) : (
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#0ea5e9] transition-colors" />
            )}
            <input 
              type="text" 
              placeholder="Cari pekerja berdasarkan nama atau NIK..." 
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => { if (searchQuery.trim().length >= 2) setSearchOpen(true); }}
              onKeyDown={(e) => { if (e.key === 'Escape') setSearchOpen(false); }}
              className="w-full h-10 pl-11 pr-4 rounded-lg border-none bg-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/20 focus:bg-white transition-all text-slate-700 placeholder:text-slate-400"
              suppressHydrationWarning
            />
          </div>

          {/* Search Results Dropdown */}
          {searchOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {searchLoading ? (
                <div className="p-6 text-center">
                  <Loader2 className="h-5 w-5 text-[#0ea5e9] animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-medium">Mencari pekerja...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="max-h-[360px] overflow-y-auto">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {searchResults.length} Hasil ditemukan
                    </p>
                  </div>
                  {searchResults.map((pekerja: any) => (
                    <button
                      key={pekerja.id}
                      onClick={() => {
                        router.push(`/pekerja/detail?id=${pekerja.id}`);
                        setSearchOpen(false);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-b-0 group/item"
                    >
                      <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                        {pekerja.nama_lengkap?.charAt(0)?.toUpperCase() || <UserIcon className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate group-hover/item:text-[#0ea5e9] transition-colors">
                          {pekerja.nama_lengkap}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          NIK: {pekerja.nik}
                          {pekerja.perusahaan?.nama_perusahaan && (
                            <span className="ml-2 text-slate-300">•</span>
                          )}
                          {pekerja.perusahaan?.nama_perusahaan && (
                            <span className="ml-2">{pekerja.perusahaan.nama_perusahaan}</span>
                          )}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-300 font-medium shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity">
                        Lihat →
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <Search className="h-6 w-6 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-500">Tidak ada hasil</p>
                  <p className="text-[11px] text-slate-400 mt-1">Coba kata kunci lain untuk nama atau NIK</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-x-5 shrink-0">
          {/* Email/Inbox Icon for Admin & Staff */}
          {(user?.role === 'admin' || user?.role === 'petugas') && (
            <button
              onClick={() => setIsInboxOpen(true)}
              className="relative h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 transition-all outline-none border-none cursor-pointer"
            >
              <Mail className="h-[18px] w-[18px]" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white animate-bounce">
                  {pendingCount}
                </span>
              )}
            </button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger 
              className="h-9 w-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm border border-slate-200 outline-none hover:ring-2 hover:ring-slate-200 hover:ring-offset-1 transition-all shadow-sm cursor-pointer overflow-hidden"
              suppressHydrationWarning
            >
              <UserIcon className="h-5 w-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  {mounted && (
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none text-slate-900">{user?.nama || 'Administrator'}</p>
                      <p className="text-xs leading-none text-slate-400">{user?.email || 'admin@sentinel.id'}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <p className="text-[10px] leading-none uppercase font-bold text-slate-500 tracking-wider">
                          {user?.role === 'admin' ? 'Super Admin' : user?.role === 'petugas' ? `Staff Serikat${user?.serikat ? ' · ' + user.serikat : ''}` : (user?.role || 'Super Admin')}
                        </p>
                      </div>
                    </div>
                  )}
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profil Saya</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Keluar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* BODY AREA */}
      <div className="flex flex-1 overflow-hidden print:overflow-visible">
        
        {/* DESKTOP SIDEBAR (Resizable) */}
        <aside 
          ref={sidebarRef}
          style={{ width: `${sidebarWidth}px` }}
          className="hidden md:flex flex-col bg-white border-r border-slate-200 z-10 justify-between py-6 shrink-0 print:hidden relative"
        >
           {/* Resizer Handle */}
           <div 
             onMouseDown={startResizing}
             className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-[#0ea5e9]/30 active:bg-[#0ea5e9] transition-colors z-20 group"
           >
              <div className="absolute top-1/2 right-0 -translate-y-1/2 w-0.5 h-8 bg-slate-200 group-hover:bg-[#0ea5e9] rounded-full mx-0.5" />
           </div>

           <div className="w-full overflow-hidden">
             {/* Admin Panel Token */}
             <div className="px-4 mb-6">
               <div className="bg-blue-50/50 border border-blue-100/50 rounded-xl p-3 flex items-center gap-2.5">
                  <div className="bg-blue-100 p-1.5 rounded-lg text-[#0ea5e9] shrink-0">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div className={`min-w-0 transition-opacity duration-200 ${sidebarWidth < 160 ? 'opacity-0' : 'opacity-100'}`}>
                    <p className="text-[10px] font-extrabold text-[#1e293b] tracking-wider truncate">
                      {user?.role === 'petugas' ? 'STAF SERIKAT' : 'ADMIN PANEL'}
                    </p>
                    <p className="text-[9px] text-slate-500 font-medium mt-0.5 truncate">
                      {user?.role === 'petugas' && user?.serikat ? user.serikat : 'Mode Manajemen'}
                    </p>
                  </div>
               </div>
             </div>

             {/* Navigation Links */}
             <nav className="flex flex-col space-y-1">
              {ALL_NAVIGATION.filter(item => !user?.role || item.roles.includes(user.role)).map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-5 py-3 text-sm font-semibold transition-all duration-200 border-l-4 ${
                      isActive 
                        ? 'bg-[#E0F2FE] text-[#0284c7] border-[#0ea5e9]' 
                        : 'text-slate-500 hover:bg-slate-50 border-transparent hover:text-slate-800'
                    }`}
                  >
                    <item.icon className={`mr-3 shrink-0 h-[18px] w-[18px] ${isActive ? 'text-[#0ea5e9]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    <span className={`truncate transition-opacity duration-200 ${sidebarWidth < 120 ? 'opacity-0' : 'opacity-100'}`}>
                      {item.name}
                    </span>
                  </Link>
                );
              })}
             </nav>
           </div>
           
           {/* Bottom Settings Link */}
           <div className="px-5 flex flex-col space-y-1 pb-2 overflow-hidden">
              <Link
                href="/settings"
                className="group flex items-center py-3 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                <Settings className="mr-3 shrink-0 h-[18px] w-[18px] text-slate-400 group-hover:text-slate-600" />
                <span className={`truncate transition-opacity duration-200 ${sidebarWidth < 120 ? 'opacity-0' : 'opacity-100'}`}>
                  Pengaturan
                </span>
              </Link>
           </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto w-full relative print:overflow-visible">
          <div className="p-4 sm:p-6 lg:p-8 print:p-0">
            {children}
          </div>
        </main>

        {/* FLOATING ACTION KOTAK MASUK (EMAIL BOX OVERLAY) */}
        <Dialog open={isInboxOpen} onOpenChange={setIsInboxOpen}>
          <DialogContent className="sm:max-w-4xl sm:w-[90vw] sm:h-[80vh] bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden p-0 flex flex-col backdrop-blur-md">
            
            {/* Native Window Titlebar */}
            <div className="px-6 py-4 pr-12 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-[#0ea5e9]/10 text-[#0ea5e9] flex items-center justify-center">
                  <Inbox className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Kotak Masuk</h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Pantau permohonan, kasus prioritas, dan pembaruan data.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-bold text-center whitespace-nowrap",
                  user?.role === 'admin' ? "bg-rose-100 text-rose-700" : "bg-sky-100 text-sky-700"
                )}>
                  {user?.role === 'admin' ? `${pendingCount} Tertunda` : `${pendingCount} Pembaruan`}
                </span>
              </div>
            </div>

            {/* Content Area - Double Pane */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
              
              {/* Left Pane - List of Messages */}
              <div className="w-full md:w-96 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col shrink-0 bg-white h-1/2 md:h-auto">
                {/* Search / Filter tabs */}
                <div className="grid grid-cols-4 p-2 bg-slate-50 border-b border-slate-100 shrink-0">
                  {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab);
                        const matches = requests.filter(r => tab === 'ALL' || r.status === tab);
                        if (matches.length > 0) {
                          setSelectedId(matches[0].id);
                        } else {
                          setSelectedId(null);
                        }
                      }}
                      className={cn(
                        "py-1.5 text-[10px] sm:text-xs font-black rounded-lg transition-all cursor-pointer truncate",
                        activeTab === tab
                          ? "bg-white text-slate-800 shadow-sm border border-slate-200/50"
                          : "text-slate-400 hover:text-slate-700"
                      )}
                    >
                      {tab === 'PENDING' ? 'Pending' : tab === 'APPROVED' ? 'Setuju' : tab === 'REJECTED' ? 'Tolak' : 'Semua'}
                    </button>
                  ))}
                </div>

                {/* Inbox Scroll Area */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                  {requests.filter(r => activeTab === 'ALL' || r.status === activeTab).length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <MailOpen className="h-10 w-10 mx-auto mb-3 text-slate-200" />
                      <p className="text-sm font-bold uppercase tracking-wider">Inbox Kosong</p>
                      <p className="text-xs text-slate-400 mt-1">Tidak ada permohonan.</p>
                    </div>
                  ) : (
                    requests
                      .filter(r => activeTab === 'ALL' || r.status === activeTab)
                      .map((req: any) => {
                        const isApproval = req.type === 'APPROVAL_REQUEST';
                        const isPriority = req.type === 'PRIORITY_CASE';
                        const isNewWorker = req.type === 'NEW_WORKER';
                        const d = req.data;

                        return (
                        <button
                          key={req.id}
                          onClick={() => setSelectedId(req.id)}
                          className={cn(
                            "w-full p-4 flex flex-col gap-2 hover:bg-slate-50 transition-all text-left border-l-4 border-b border-slate-50 last:border-b-0 cursor-pointer",
                            selectedId === req.id 
                              ? "bg-sky-50/40 border-l-[#0ea5e9]" 
                              : "border-l-transparent"
                          )}
                        >
                          <div className="flex justify-between items-center">
                            <span className={cn(
                              "text-[10px] font-extrabold uppercase tracking-wide",
                              isApproval ? "text-[#0284c7]" : isPriority ? "text-rose-600" : "text-emerald-600"
                            )}>
                              {isApproval ? `REQ-${d.id.toString().padStart(4, '0')}` : isPriority ? `PRIO-${d.id}` : `NEW-${d.nik || d.id}`}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                              {new Date(req.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>

                          <p className="text-sm font-extrabold text-slate-800 line-clamp-1">
                            {isApproval ? `${d.requester?.nama || 'Admin Staff'} meminta ${d.action === 'DELETE' ? 'Penghapusan' : d.action === 'UPDATE' ? 'Perubahan' : 'Penambahan'}` : 
                             isPriority ? `Prioritas: ${d.pekerja?.nama_lengkap || 'Kasus PAK'}` :
                             `Pekerja Baru: ${d.nama_lengkap}`}
                          </p>

                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {isApproval ? d.reason :
                             isPriority ? `Sisa waktu advokasi menipis. Batas waktu: ${d.deadline_date}` :
                             `Didaftarkan di ${d.perusahaan?.nama_perusahaan || 'Perusahaan tidak diketahui'}`}
                          </p>

                          {isApproval && (
                            <div className="flex justify-between items-center pt-1 mt-1 shrink-0">
                              {getActionBadge(d.action)}
                              {getStatusBadge(req.status)}
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Pane - Message Details */}
              <div className="flex-1 flex flex-col bg-slate-50/30 overflow-hidden">
                {selectedRequest ? (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {(() => {
                      const req = selectedRequest;
                      const type = req.type;
                      const d = req.data;
                      
                      if (type === 'APPROVAL_REQUEST') {
                        return (
                          <>
                            <div className="p-6 border-b border-slate-100 flex justify-between items-start shrink-0 bg-white">
                              <div className="flex gap-3">
                                <div className="h-10 w-10 rounded-lg bg-sky-100 text-[#0284c7] flex items-center justify-center shrink-0">
                                  <UserIcon className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-extrabold text-slate-800">
                                      {d.requester?.nama || 'Admin Staff'}
                                    </h4>
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase tracking-wider">
                                      {d.requester?.role === 'viewer' ? 'Pekerja' : d.requester?.role === 'petugas' ? 'Admin Serikat' : d.requester?.role === 'admin' ? 'SuperAdmin' : (d.requester?.role || 'Sistem')}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                    {d.requester?.email} • {new Date(req.created_at).toLocaleDateString('id-ID')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <span className="text-[10px] font-black text-slate-400">
                                  ID: REQ-{d.id.toString().padStart(4, '0')}
                                </span>
                                <div className="flex gap-2">
                                  {getActionBadge(d.action)}
                                  {getStatusBadge(req.status)}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex-1 p-6 overflow-y-auto space-y-6">
                              <div className="space-y-2">
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ALASAN TINDAKAN</h4>
                                <div className="bg-[#f0f9ff]/60 border border-sky-100 rounded-xl p-4">
                                  <p className="text-xs text-slate-700 leading-relaxed font-semibold italic">"{d.reason}"</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">JENIS MODEL</h4>
                                  <p className="text-xs font-extrabold text-slate-800">{d.model_type}</p>
                                </div>
                                <div>
                                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">TARGET RECORD ID</h4>
                                  <p className="text-xs font-extrabold text-slate-800">#{d.model_id || 'BARU'}</p>
                                </div>
                              </div>
                              {d.payload && Object.keys(d.payload).length > 0 && (
                                <div className="space-y-2">
                                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">DETAIL PERUBAHAN DATA</h4>
                                  <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm bg-white">
                                    <table className="w-full text-left border-collapse">
                                      <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100">
                                          <th className="px-4 py-2.5 text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Keterangan Input</th>
                                          <th className="px-4 py-2.5 text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Isi Data</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-50 text-[11px] font-semibold text-slate-700">
                                        {Object.entries(d.payload).map(([key, val]) => (
                                          <tr key={key} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-2.5 font-bold text-[#0284c7]">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                                            <td className="px-4 py-2.5 font-medium whitespace-pre-wrap break-words max-w-[200px] md:max-w-md">
                                              {typeof val === 'boolean' 
                                                ? (val ? 'Ya' : 'Tidak') 
                                                : val === null || val === '' 
                                                ? '-' 
                                                : Array.isArray(val) ? val.join(', ') : (val as any).toString()}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {req.status === 'PENDING' && (
                              <div className="p-6 border-t border-slate-100 bg-white shrink-0">
                                {user?.role === 'admin' ? (
                                  <div className="flex justify-end gap-3">
                                    <Button variant="outline" onClick={() => setIsRejectOpen(true)} disabled={submittingResponse} className="h-11 px-6 font-bold text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 rounded-xl">Tolak Permintaan</Button>
                                    <Button onClick={() => handleApprove(req.id)} disabled={submittingResponse} className="h-11 px-6 font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-sm rounded-xl">Setujui & Eksekusi</Button>
                                  </div>
                                ) : (
                                  <p className="text-xs font-bold text-amber-600 text-center">Menunggu persetujuan Admin.</p>
                                )}
                              </div>
                            )}
                          </>
                        );
                      }
                      
                      if (type === 'PRIORITY_CASE') {
                        return (
                          <>
                            <div className="p-8 text-center flex flex-col items-center justify-center flex-1 space-y-4">
                              <div className="h-16 w-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center animate-pulse">
                                <ShieldAlert className="h-8 w-8" />
                              </div>
                              <h2 className="text-lg font-black text-slate-800">Kasus PAK Prioritas</h2>
                              <p className="text-sm text-slate-500 max-w-sm">
                                Kasus advokasi pekerja <b>{d.pekerja?.nama_lengkap}</b> mendekati batas waktu klaim JKK (3 tahun sejak keluar). <br/><br/>
                                Deadline: {d.deadline_date}<br/>
                                Sisa Waktu: {d.days_remaining} hari
                              </p>
                              <Button onClick={() => { setIsInboxOpen(false); router.push(`/advokasi/detail?id=${d.id}`); }} className="mt-4 bg-rose-600 hover:bg-rose-700 rounded-xl h-11 px-8 font-bold text-white shadow-sm">Lihat Detail Kasus</Button>
                            </div>
                          </>
                        );
                      }

                      if (type === 'NEW_WORKER') {
                        return (
                          <>
                            <div className="p-8 text-center flex flex-col items-center justify-center flex-1 space-y-4">
                              <div className="h-16 w-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
                                <UserIcon className="h-8 w-8" />
                              </div>
                              <h2 className="text-lg font-black text-slate-800">Pekerja Baru Ditambahkan</h2>
                              <p className="text-sm text-slate-500 max-w-sm">
                                <b>{d.nama_lengkap}</b> baru saja didaftarkan sebagai pekerja di <b>{d.perusahaan?.nama_perusahaan || 'sistem'}</b>.
                              </p>
                              <Button onClick={() => { setIsInboxOpen(false); router.push(`/pekerja/detail?id=${d.id}`); }} className="mt-4 bg-emerald-600 hover:bg-emerald-700 rounded-xl h-11 px-8 font-bold text-white shadow-sm">Lihat Profil Pekerja</Button>
                            </div>
                          </>
                        );
                      }
                      
                      return null;
                    })()}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <MailOpen className="h-10 w-10 text-slate-200 mb-2" />
                    <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Tidak Ada Pesan Terpilih</p>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                      Pilih salah satu item permohonan persetujuan dari daftar kotak masuk di sebelah kiri untuk melihat detail.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* REJECTION REASON DIALOG */}
        <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
          <DialogContent className="sm:max-w-md bg-white rounded-2xl border border-slate-100 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900">Alasan Penolakan Permintaan</DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Berikan alasan penolakan secara tertulis agar Admin Staff pemohon mengetahui kendala pada data tersebut.
              </DialogDescription>
            </DialogHeader>
            <div className="py-3">
              <Textarea 
                placeholder="Tuliskan alasan penolakan..." 
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px] resize-none bg-slate-50 border border-slate-200 focus-visible:ring-rose-500 rounded-xl"
              />
            </div>
            <DialogFooter className="flex gap-2">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsRejectOpen(false)}
                className="rounded-xl font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Batal
              </Button>
              <Button 
                type="button" 
                onClick={handleRejectSubmit} 
                disabled={submittingResponse}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold cursor-pointer"
              >
                Kirim Penolakan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
      </div>
    </div>
  );
}
