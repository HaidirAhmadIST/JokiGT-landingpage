'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
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


import { FileText } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Pekerja', href: '/pekerja', icon: Users },
  { name: 'Perusahaan', href: '/perusahaan', icon: Building2 },
  { name: 'Advokasi', href: '/advokasi', icon: ShieldCheck },
  { name: 'Laporan', href: '/laporan', icon: FileText },
  { name: 'Aktivitas', href: '/aktivitas', icon: History },
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

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initUser = async () => {
      // 1. Try to load from local storage first for speed
      let storedUser = localStorage.getItem('user');
      let userData = null;

      if (storedUser) {
        userData = JSON.parse(storedUser);
      } else {
        // 2. If not in local storage, try to fetch from server if token exists
        const token = Cookies.get('auth_token');
        if (token) {
          try {
            const res = await api.get('/me');
            userData = res.data.data;
            if (userData) {
              // Populate pekerja_id if missing (for viewer role)
              if (userData.role === 'viewer' && userData.pekerja?.id) {
                userData.pekerja_id = userData.pekerja.id;
              }
              localStorage.setItem('user', JSON.stringify(userData));
            }
          } catch (err) {
            console.error('Failed to fetch user in layout', err);
          }
        }
      }

      if (userData) {
        setUser(userData);

        // Viewer can only see their own dashboard
        if (userData.role === 'viewer') {
          router.push('/dashboard-user');
        }
      } else {
        // If no user found, redirect to login instead of staying stuck
        router.push('/login');
      }
      
      setMounted(true);
    };

    initUser();
  }, [router]);

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
      router.push('/login');
    }
  };

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
      
      {/* FULL-WIDTH TOP HEADER */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-20 shrink-0 shadow-sm print:hidden">
        
        {/* Logo Text Area */}
        <div className="flex items-center gap-4 w-48 shrink-0">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger 
              className="md:hidden -ml-2 text-slate-700 h-9 w-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Open Menu"
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
               {/* Mobile Sidebar Content */}
               <div className="p-6">
                 <h2 className="font-extrabold text-xl text-slate-800 tracking-tight">Azure Sentinel</h2>
               </div>
               
               <div className="px-4 mb-6">
                 <div className="bg-blue-50/50 border border-blue-100/50 rounded-xl p-3 flex items-center gap-3">
                    <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-800 tracking-wider">ADMIN PANEL</p>
                      <p className="text-[10px] text-slate-500 font-medium">Mode Manajemen</p>
                    </div>
                 </div>
               </div>

               <nav className="flex-1 space-y-1 mt-2">
                {navigation.map((item) => {
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
          <h1 className="font-extrabold text-xl text-[#0f172a] tracking-tight hidden md:block">Azure Sentinel</h1>
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
                        router.push(`/pekerja/${pekerja.id}`);
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
          <DropdownMenu>
            <DropdownMenuTrigger 
              className="h-9 w-9 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-sm border border-orange-100 outline-none hover:ring-2 hover:ring-orange-200 hover:ring-offset-1 transition-all shadow-sm cursor-pointer overflow-hidden"
              suppressHydrationWarning
            >
               {mounted && user?.foto ? (
                 <img 
                   src={user.foto.startsWith('http') ? user.foto : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/storage/${user.foto}`} 
                   alt={user.nama} 
                   className="w-full h-full object-cover"
                 />
               ) : (
                 <span>{mounted && user?.nama ? user.nama.charAt(0).toUpperCase() : 'A'}</span>
               )}
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
                          {user?.role === 'admin' ? 'Super Admin' : (user?.role || 'Super Admin')}
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
        
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden md:flex w-[260px] flex-col bg-white border-r border-slate-200 z-10 justify-between py-6 shrink-0 print:hidden">
           
           <div className="w-full">
             {/* Admin Panel Token */}
             <div className="px-4 mb-6">
               <div className="bg-blue-50/50 border border-blue-100/50 rounded-xl p-3 flex items-center gap-2.5">
                  <div className="bg-blue-100 p-1.5 rounded-lg text-[#0ea5e9] shrink-0">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold text-[#1e293b] tracking-wider truncate">ADMIN PANEL</p>
                    <p className="text-[9px] text-slate-500 font-medium mt-0.5">Mode Manajemen</p>
                  </div>
               </div>
             </div>

             {/* Navigation Links */}
             <nav className="flex flex-col space-y-1">
              {navigation.map((item) => {
                // Determine actual active state even for nested routes (like detail page)
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
                    {item.name}
                  </Link>
                );
              })}
             </nav>
           </div>
           
           {/* Bottom Settings Link */}
           <div className="px-5 flex flex-col space-y-1 pb-2">
              <Link
                href="/settings"
                className="group flex items-center py-3 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                <Settings className="mr-3 shrink-0 h-[18px] w-[18px] text-slate-400 group-hover:text-slate-600" />
                Pengaturan
              </Link>
           </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto w-full relative print:overflow-visible">
          <div className="p-4 sm:p-6 lg:p-8 print:p-0">
            {children}
          </div>
        </main>
        
      </div>
    </div>
  );
}
