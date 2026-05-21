'use client';

import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// ─── Mock Data (Klasifikasi PAK Perpres 7/2019 Trend Per Bulan) ───────────────
const monthlyTrendData = [
  {
    bulan: 'Jan',
    'Faktor Kimia': 15, 'Faktor Fisika': 25, 'Faktor Biologi': 10,
    'Pernafasan': 12, 'Kulit': 8, 'Otot & Kerangka': 30, 'Mental & Perilaku': 4,
    'Kanker Akibat Kerja': 3,
  },
  {
    bulan: 'Feb',
    'Faktor Kimia': 20, 'Faktor Fisika': 30, 'Faktor Biologi': 15,
    'Pernafasan': 15, 'Kulit': 10, 'Otot & Kerangka': 35, 'Mental & Perilaku': 5,
    'Kanker Akibat Kerja': 4,
  },
  {
    bulan: 'Mar',
    'Faktor Kimia': 25, 'Faktor Fisika': 35, 'Faktor Biologi': 20,
    'Pernafasan': 18, 'Kulit': 12, 'Otot & Kerangka': 40, 'Mental & Perilaku': 6,
    'Kanker Akibat Kerja': 5,
  },
  {
    bulan: 'Apr',
    'Faktor Kimia': 30, 'Faktor Fisika': 40, 'Faktor Biologi': 25,
    'Pernafasan': 22, 'Kulit': 15, 'Otot & Kerangka': 45, 'Mental & Perilaku': 8,
    'Kanker Akibat Kerja': 7,
  },
  {
    bulan: 'Mei',
    'Faktor Kimia': 35, 'Faktor Fisika': 45, 'Faktor Biologi': 30,
    'Pernafasan': 28, 'Kulit': 18, 'Otot & Kerangka': 50, 'Mental & Perilaku': 10,
    'Kanker Akibat Kerja': 9,
  },
  {
    bulan: 'Jun',
    'Faktor Kimia': 25, 'Faktor Fisika': 25, 'Faktor Biologi': 15,
    'Pernafasan': 25, 'Kulit': 27, 'Otot & Kerangka': 50, 'Mental & Perilaku': 7,
    'Kanker Akibat Kerja': 17,
  }
];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 min-w-[200px]">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 border-b pb-1">
          Bulan {label}
        </p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <span 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: entry.fill }}
                />
                <span className="font-medium text-slate-700">{entry.name}</span>
              </div>
              <span className="font-bold text-slate-900">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdvokasiBarChart() {
  const [filter, setFilter] = useState<string>('all');
  
  // Transform data based on filter
  const chartData = useMemo(() => {
    if (filter === 'all') {
      return monthlyTrendData.map(d => ({
        bulan: d.bulan,
        'Kategori I (Penyebab)': d['Faktor Kimia'] + d['Faktor Fisika'] + d['Faktor Biologi'],
        'Kategori II (Organ)': d['Pernafasan'] + d['Kulit'] + d['Otot & Kerangka'] + d['Mental & Perilaku'],
        'Kategori III (Kanker)': d['Kanker Akibat Kerja'],
      }));
    }
    return monthlyTrendData;
  }, [filter]);

  // Total calculation for the active header display
  const total = useMemo(() => {
    return chartData.reduce((acc, curr) => {
      let sum = 0;
      Object.keys(curr).forEach(key => {
        if (key !== 'bulan') {
          // If a specific category is selected, we only sum its subcategories
          if (filter === 'Penyebab' && !['Faktor Kimia', 'Faktor Fisika', 'Faktor Biologi'].includes(key)) return;
          if (filter === 'Target Organ' && !['Pernafasan', 'Kulit', 'Otot & Kerangka', 'Mental & Perilaku'].includes(key)) return;
          if (filter === 'Kanker' && key !== 'Kanker Akibat Kerja') return;
          
          const value = curr[key as keyof typeof curr];
          if (typeof value === 'number') {
            sum += value;
          }
        }
      });
      return acc + sum;
    }, 0);
  }, [chartData, filter]);

  return (
    <div className="flex flex-col">
      {/* ── Chart header ── */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <h2 className="text-[17px] font-bold text-[#0f172a]">Tren Klasifikasi PAK</h2>
          <p className="text-sm text-[#64748b] mt-1">
            Data Bulanan (Perpres No. 7 Tahun 2019)
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Select value={filter} onValueChange={v => setFilter(v || 'all')}>
            <SelectTrigger className="h-8 text-xs font-bold bg-white w-[250px] focus:ring-0 focus:ring-offset-0">
              <SelectValue placeholder="Pilih Filter Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-bold">Tampilkan Semua Kategori</SelectItem>
              <SelectItem value="Penyebab">Kategori I: Penyakit akibat Faktor Pekerjaan (Penyebab)</SelectItem>
              <SelectItem value="Target Organ">Kategori II: Penyakit berdasarkan Target Organ</SelectItem>
              <SelectItem value="Kanker">Kategori III: Kanker Akibat Kerja</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]" />
            <span className="text-xs font-bold text-[#64748b]">
              {total} Kasus
            </span>
          </div>
        </div>
      </div>

      {/* ── Bar Chart ── */}
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={chartData}
          margin={{ top: 22, right: 8, left: -22, bottom: 0 }}
          barCategoryGap="25%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="bulan"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#cbd5e1' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          
          {/* Semua Kategori */}
          {filter === 'all' && <Bar dataKey="Kategori I (Penyebab)" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />}
          {filter === 'all' && <Bar dataKey="Kategori II (Organ)" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={40} />}
          {filter === 'all' && <Bar dataKey="Kategori III (Kanker)" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} />}

          {/* Penyebab */}
          {filter === 'Penyebab' && <Bar dataKey="Faktor Kimia" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />}
          {filter === 'Penyebab' && <Bar dataKey="Faktor Fisika" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={40} />}
          {filter === 'Penyebab' && <Bar dataKey="Faktor Biologi" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />}
          
          {/* Target Organ */}
          {filter === 'Target Organ' && <Bar dataKey="Pernafasan" fill="#6366F1" radius={[4, 4, 0, 0]} maxBarSize={40} />}
          {filter === 'Target Organ' && <Bar dataKey="Kulit" fill="#EC4899" radius={[4, 4, 0, 0]} maxBarSize={40} />}
          {filter === 'Target Organ' && <Bar dataKey="Otot & Kerangka" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={40} />}
          {filter === 'Target Organ' && <Bar dataKey="Mental & Perilaku" fill="#14B8A6" radius={[4, 4, 0, 0]} maxBarSize={40} />}

          {/* Kanker */}
          {filter === 'Kanker' && <Bar dataKey="Kanker Akibat Kerja" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} />}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
