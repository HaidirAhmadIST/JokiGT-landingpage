import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  ClipboardList, 
  CheckCircle2, 
  BadgeCheck,
  TrendingUp,
  TrendingDown,
  Plus,
  RefreshCw,
  AlertTriangle,
  FilePlus,
} from "lucide-react";

export default function DashboardIndexPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-extrabold tracking-tight text-[#0f172a]">Dashboard Utama</h1>
        <p className="text-[#64748b] mt-1.5 text-[15px]">
          Pantau status pekerja dan kemajuan advokasi PAK secara real-time.
        </p>
      </div>

      {/* Top Value Cards */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        
        {/* Card 1 */}
        <Card className="rounded-[20px] shadow-sm border-slate-100 p-6 flex flex-col justify-between h-36 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="bg-blue-50 text-blue-500 p-2.5 rounded-xl">
              <Users className="h-5 w-5" />
            </div>
            <div className="flex items-center text-emerald-500 text-xs font-bold gap-1 bg-emerald-50 px-2 py-1 rounded-full">
              <TrendingUp className="h-3 w-3" />
              +12%
            </div>
          </div>
          <div>
            <p className="text-[#64748b] text-sm font-semibold mb-1">Total Pekerja</p>
            <h3 className="text-3xl font-extrabold text-[#0f172a]">1,284</h3>
          </div>
        </Card>

        {/* Card 2 */}
        <Card className="rounded-[20px] shadow-sm border-slate-100 p-6 flex flex-col justify-between h-36 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="bg-orange-50 text-orange-500 p-2.5 rounded-xl">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div className="flex items-center text-emerald-500 text-xs font-bold gap-1 bg-emerald-50 px-2 py-1 rounded-full">
              <TrendingUp className="h-3 w-3" />
              +5%
            </div>
          </div>
          <div>
            <p className="text-[#64748b] text-sm font-semibold mb-1">Kasus Aktif</p>
            <h3 className="text-3xl font-extrabold text-[#0f172a]">42</h3>
          </div>
        </Card>

        {/* Card 3 */}
        <Card className="rounded-[20px] shadow-sm border-slate-100 p-6 flex flex-col justify-between h-36 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="bg-emerald-50 text-emerald-500 p-2.5 rounded-xl">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="flex items-center text-red-500 text-xs font-bold gap-1 bg-red-50 px-2 py-1 rounded-full">
              <TrendingDown className="h-3 w-3" />
              -2%
            </div>
          </div>
          <div>
            <p className="text-[#64748b] text-sm font-semibold mb-1">Advokasi Selesai</p>
            <h3 className="text-3xl font-extrabold text-[#0f172a]">156</h3>
          </div>
        </Card>

        {/* Card 4 */}
        <Card className="rounded-[20px] shadow-sm border-slate-100 p-6 flex flex-col justify-between h-36 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="bg-indigo-50 text-indigo-500 p-2.5 rounded-xl">
              <BadgeCheck className="h-5 w-5" />
            </div>
            <div className="flex items-center text-emerald-500 text-xs font-bold gap-1 bg-emerald-50 px-2 py-1 rounded-full">
              <TrendingUp className="h-3 w-3" />
              +8%
            </div>
          </div>
          <div>
            <p className="text-[#64748b] text-sm font-semibold mb-1">Klaim Disetujui</p>
            <h3 className="text-3xl font-extrabold text-[#0f172a]">89</h3>
          </div>
        </Card>

      </div>
      
      {/* Middle Section (Charts & Logs) */}
      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-3">
        
         {/* Chart Area */}
         <Card className="md:col-span-2 rounded-[20px] shadow-sm border-slate-100 p-6 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-[17px] font-bold text-[#0f172a]">Tren Status Advokasi</h2>
              <p className="text-sm text-[#64748b] mt-1">Distribusi kasus berdasarkan tahap proses</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]"></div>
              <span className="text-xs font-bold text-[#64748b]">287 Total Kasus</span>
            </div>
          </div>
          
          {/* Mock Chart Space */}
          <div className="flex-1 flex flex-col justify-end min-h-[250px] relative pb-8 mt-4 border-b border-slate-100">
             {/* Chart grid lines */}
             <div className="absolute inset-0 flex flex-col justify-between pb-8">
                <div className="border-t border-slate-50 w-full h-0"></div>
                <div className="border-t border-slate-50 w-full h-0"></div>
                <div className="border-t border-slate-50 w-full h-0"></div>
                <div className="border-t border-slate-100 w-full h-0"></div>
             </div>
             
             {/* X-Axis labels */}
             <div className="absolute bottom-0 left-0 w-full flex justify-around text-[10px] font-bold text-[#94a3b8] tracking-widest">
               <span>UPTD</span>
               <span>BPJS</span>
               <span>COURT</span>
             </div>
          </div>
         </Card>

         {/* Activity Feed */}
         <Card className="rounded-[20px] shadow-sm border-slate-100 p-6 flex flex-col">
            <h2 className="text-[17px] font-bold text-[#0f172a] mb-6">Aktivitas Terkini</h2>
            
            <div className="flex-1 space-y-6">
               {/* Item 1 */}
               <div className="flex gap-4">
                  <div className="bg-emerald-50 text-emerald-500 rounded-full h-9 w-9 flex items-center justify-center shrink-0">
                     <Plus className="h-4 w-4 stroke-[3]" />
                  </div>
                  <div className="space-y-1">
                     <p className="text-[13px] font-bold text-[#1e293b]">Kasus Baru Ditambahkan</p>
                     <p className="text-[13px] text-[#64748b]">Andi Pratama - PT. Maju Jaya</p>
                     <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mt-1">2 Jam Yang Lalu</p>
                  </div>
               </div>
               
               {/* Item 2 */}
               <div className="flex gap-4">
                  <div className="bg-blue-50 text-blue-500 rounded-full h-9 w-9 flex items-center justify-center shrink-0">
                     <RefreshCw className="h-4 w-4 stroke-[3]" />
                  </div>
                  <div className="space-y-1">
                     <p className="text-[13px] font-bold text-[#1e293b]">Status Diperbarui</p>
                     <p className="text-[13px] text-[#64748b]">Siti Aminah - Berkas dikirim ke BPJS</p>
                     <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mt-1">5 Jam Yang Lalu</p>
                  </div>
               </div>

               {/* Item 3 */}
               <div className="flex gap-4">
                  <div className="bg-amber-50 text-amber-500 rounded-full h-9 w-9 flex items-center justify-center shrink-0">
                     <AlertTriangle className="h-4 w-4 stroke-[3]" />
                  </div>
                  <div className="space-y-1">
                     <p className="text-[13px] font-bold text-[#1e293b]">Peringatan Tenggat</p>
                     <p className="text-[13px] text-[#64748b]">Laporan UPTD Tahap 2 tertunda</p>
                     <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mt-1">Kemarin, 14:30</p>
                  </div>
               </div>

               {/* Item 4 */}
               <div className="flex gap-4">
                  <div className="bg-purple-50 text-purple-500 rounded-full h-9 w-9 flex items-center justify-center shrink-0">
                     <CheckCircle2 className="h-4 w-4 stroke-[3]" />
                  </div>
                  <div className="space-y-1">
                     <p className="text-[13px] font-bold text-[#1e293b]">Advokasi Selesai</p>
                     <p className="text-[13px] text-[#64748b]">Eko Prasetyo - Klaim disetujui 100%</p>
                     <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mt-1">2 Hari Yang Lalu</p>
                  </div>
               </div>
            </div>

            <div className="mt-6 pt-4 text-center">
               <button className="text-[13px] font-bold text-[#0ea5e9] hover:text-[#0284c7] transition-colors">
                 Lihat Semua Aktivitas
               </button>
            </div>
         </Card>
      </div>

      {/* Bottom Banner */}
      <Card className="rounded-[20px] shadow-sm border-slate-100 p-6 bg-white overflow-hidden relative">
         <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
               <div className="bg-white border-2 border-[#e0f2fe] text-[#0ea5e9] p-3 rounded-2xl shadow-sm shrink-0">
                  <FilePlus className="h-7 w-7" />
               </div>
               <div>
                  <h3 className="text-lg font-bold text-[#0f172a]">Butuh input data baru?</h3>
                  <p className="text-sm text-[#64748b] mt-1">Tambahkan rekam jejak pekerja atau ajukan advokasi PAK sekarang.</p>
               </div>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
               <Button variant="outline" className="h-11 px-6 font-bold text-slate-700 hover:bg-slate-50 border-slate-200">
                  Panduan Pengguna
               </Button>
               <Button className="h-11 px-6 font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white">
                  Tambah Data Baru
               </Button>
            </div>
         </div>
      </Card>

    </div>
  );
}
