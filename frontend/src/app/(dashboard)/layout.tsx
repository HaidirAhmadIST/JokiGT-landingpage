'use client';

import { useState, useEffect } from 'react';
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
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
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

  useEffect(() => {
    // Load user data from local storage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Logout failed on server', error);
    } finally {
      Cookies.remove('auth_token');
      localStorage.removeItem('user');
      router.push('/login');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] font-sans">
      
      {/* FULL-WIDTH TOP HEADER */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-20 shrink-0 shadow-sm">
        
        {/* Logo Text Area */}
        <div className="flex items-center gap-4 w-60 shrink-0">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            {/* @ts-ignore */}
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-slate-700">
                <Menu className="h-5 w-5" />
              </Button>
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
                      <p className="text-[10px] text-slate-500 font-medium">Management Mode</p>
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
        <div className="flex-1 max-w-xl mx-8 hidden sm:block">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#0ea5e9] transition-colors" />
            <input 
              type="text" 
              placeholder="Search workers..." 
              className="w-full h-10 pl-11 pr-4 rounded-lg border-none bg-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/20 focus:bg-white transition-all text-slate-700 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-x-5 shrink-0">
          <button className="relative text-slate-400 hover:text-slate-700 transition-colors">
            <Bell className="h-[22px] w-[22px]" />
          </button>
          
          <button className="text-slate-400 hover:text-slate-700 transition-colors">
            <Settings className="h-[22px] w-[22px]" />
          </button>

          <DropdownMenu>
            {/* @ts-ignore */}
            <DropdownMenuTrigger asChild>
              <button className="h-9 w-9 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm border-2 border-orange-200 outline-none hover:ring-2 hover:ring-orange-300 hover:ring-offset-1 transition-all">
                 {/* Mockup uses a small avatar, I will use a simple initials trick */}
                 {user?.nama ? user.nama.charAt(0).toUpperCase() : 'A'}
              </button>
            </DropdownMenuTrigger>
            {/* @ts-ignore */}
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.nama}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  <p className="text-xs leading-none text-muted-foreground mt-1 capitalize font-semibold text-[#0ea5e9]">
                    Role: {user?.role}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* BODY AREA */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden md:flex w-[260px] flex-col bg-white border-r border-slate-200 z-10 justify-between py-6 shrink-0">
           
           <div className="w-full">
             {/* Admin Panel Token */}
             <div className="px-6 mb-8">
               <div className="bg-blue-50/50 border border-blue-100/50 rounded-xl p-3 flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg text-[#0ea5e9]">
                    <Shield className="h-[18px] w-[18px]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-extrabold text-[#1e293b] tracking-wider">ADMIN PANEL</p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">Management Mode</p>
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
                    className={`group flex items-center px-8 py-3.5 text-sm font-semibold transition-all duration-200 border-l-4 ${
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
           </div>
           
           {/* Bottom Settings Link */}
           <div className="px-8 flex flex-col space-y-1 pb-2">
              <Link
                href="/settings"
                className="group flex items-center py-3.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                <Settings className="mr-4 shrink-0 h-[18px] w-[18px] text-slate-400 group-hover:text-slate-600" />
                Settings
              </Link>
           </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto w-full relative">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
        
      </div>
    </div>
  );
}
