'use client';

import { useState, useMemo, useEffect } from 'react';
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
import api from '@/lib/axios';

// ─── Mock Data ────────────────────────────────────────────────────────────────

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
export default function AdvokasiBarChart({ onFilterChange }: { onFilterChange?: (filter: string) => void }) {
  const [filter, setFilter] = useState<string>('all');
  const [trendData, setTrendData] = useState<any[]>([]);
  const [kat4Keys, setKat4Keys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/dashboard/trend-klasifikasi?t=${new Date().getTime()}`)
      .then(res => {
        const data = res.data;
        if (data.status === 'success') {
          setTrendData(data.data.trend);
          setKat4Keys(data.data.kategori_4_keys || []);
        } else {
          console.error("API returned status:", data.status);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, []);

  // Transform data based on filter
  const chartData = useMemo(() => {
    if (filter === 'all') {
      return trendData.map(d => {
        let spesifikSum = 0;
        kat4Keys.forEach(key => spesifikSum += (d[key] || 0));
        
        return {
          bulan: d.bulan,
          'Kategori I (Penyebab)': d['Faktor Kimia'] + d['Faktor Fisika'] + d['Faktor Biologi'],
          'Kategori II (Organ)': d['Pernafasan'] + d['Kulit'] + d['Otot & Kerangka'] + d['Mental & Perilaku'],
          'Kategori III (Kanker)': d['Kanker Akibat Kerja'],
          'Kategori IV (Spesifik)': spesifikSum,
        };
      });
    }
    return trendData;
  }, [filter, trendData, kat4Keys]);

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
          if (filter === 'Penyakit Spesifik Lainnya' && !kat4Keys.includes(key)) return;
          
          const value = (curr as any)[key];
          if (typeof value === 'number') {
            sum += value;
          }
        }
      });
      return acc + sum;
    }, 0);
  }, [chartData, filter, kat4Keys]);

  const colors = ['#10B981', '#0EA5E9', '#F43F5E', '#8B5CF6', '#F59E0B'];

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
          <Select value={filter} onValueChange={v => {
            const val = v || 'all';
            setFilter(val);
            if (onFilterChange) onFilterChange(val);
          }}>
            <SelectTrigger className="h-8 text-xs font-bold bg-white w-[250px] focus:ring-0 focus:ring-offset-0">
              <SelectValue placeholder="Pilih Filter Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-bold">Tampilkan Semua Kategori</SelectItem>
              <SelectItem value="Penyebab">Kategori I: Penyakit akibat Faktor Pekerjaan (Penyebab)</SelectItem>
              <SelectItem value="Target Organ">Kategori II: Penyakit berdasarkan Target Organ</SelectItem>
              <SelectItem value="Kanker">Kategori III: Kanker Akibat Kerja</SelectItem>
              <SelectItem value="Penyakit Spesifik Lainnya">Kategori IV: Penyakit Spesifik Lainnya</SelectItem>
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

      {/* ── Bar Chart or Empty State ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center w-full h-[320px] bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
           <p className="text-sm font-bold text-slate-500">Memuat Data...</p>
        </div>
      ) : total === 0 && filter === 'Penyakit Spesifik Lainnya' ? (
        <div className="flex flex-col items-center justify-center w-full h-[320px] bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
          <div className="bg-white p-4 rounded-full shadow-sm mb-3">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
            </svg>
          </div>
          <h3 className="text-[15px] font-bold text-slate-700">Data Belum Tersedia</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-[250px] text-center">
            Belum ada rekam jejak untuk Penyakit Spesifik Lainnya pada periode ini.
          </p>
        </div>
      ) : (
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
            {filter === 'all' && <Bar dataKey="Kategori IV (Spesifik)" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />}

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

            {/* Spesifik Lainnya (Dinamis dari Database) */}
            {filter === 'Penyakit Spesifik Lainnya' && kat4Keys.map((key, index) => (
              <Bar 
                key={key} 
                dataKey={key} 
                fill={colors[index % colors.length]} 
                radius={[4, 4, 0, 0]} 
                maxBarSize={40} 
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
