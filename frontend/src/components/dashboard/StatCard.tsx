/**
 * StatCard — Komponen Kartu Statistik yang Reusable
 *
 * Digunakan di halaman Dashboard Admin untuk menampilkan satu metrik
 * (total pekerja, kasus aktif, dll.) beserta ikon, nilai, dan delta bulan ini.
 *
 * @example
 * ```tsx
 * <StatCard
 *   label="Total Pekerja"
 *   value={stats.total_pekerja}
 *   delta={stats.total_pekerja_new}
 *   icon={Users}
 *   iconBg="bg-blue-50"
 *   iconColor="text-blue-500"
 *   deltaColor="text-emerald-500"
 *   subtitle="Live monitoring"
 *   loading={loading}
 * />
 * ```
 */
import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface StatCardProps {
  /** Label judul kartu (uppercase, kecil). */
  label: string;
  /** Nilai numerik yang ditampilkan besar. */
  value: number;
  /** Perubahan positif bulan ini. Jika 0 atau negatif, tidak ditampilkan. */
  delta?: number;
  /** Ikon dari lucide-react. */
  icon: LucideIcon;
  /** Class background ikon (misal: "bg-blue-50"). */
  iconBg: string;
  /** Class warna ikon (misal: "text-blue-500"). */
  iconColor: string;
  /** Class warna delta (misal: "text-emerald-500"). */
  deltaColor?: string;
  /** Teks kecil di bawah nilai. */
  subtitle?: string;
  /** Jika true, menampilkan skeleton loading animation. */
  loading?: boolean;
}

export default function StatCard({
  label, value, delta, icon: Icon, iconBg, iconColor,
  deltaColor = 'text-emerald-500', subtitle, loading = false,
}: StatCardProps) {
  return (
    <Card className="rounded-[20px] shadow-sm border-slate-100 p-6 flex flex-col justify-between min-h-[152px] hover:shadow-md transition-all">
      <div className="flex justify-between items-start">
        <p className="text-xs font-bold text-[#94a3b8] tracking-widest uppercase">{label}</p>
        <div className={`${iconBg} ${iconColor} p-2.5 rounded-xl`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="flex items-end gap-2">
        {loading ? (
          <div className="h-9 w-20 bg-slate-200 rounded-lg animate-pulse" />
        ) : (
          <h3 className="text-4xl font-extrabold text-[#0f172a] tabular-nums transition-all duration-300">
            {value.toLocaleString('id-ID')}
          </h3>
        )}
        {!loading && delta && delta > 0 && (
          <span className={`text-xs font-bold mb-1.5 whitespace-nowrap ${deltaColor}`}>
            (+{delta})
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-xs font-medium text-[#94a3b8]">{subtitle}</p>
      )}
    </Card>
  );
}
