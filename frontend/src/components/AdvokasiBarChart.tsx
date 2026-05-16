'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { Loader2, Users, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkerEntry {
  id: number;
  nama: string;
  nik: string;
  perusahaan: string;
  jenis_kasus: string;
  status_detail: string;
  progress: number;
}

interface StepStat {
  key: string;
  label: string;
  jumlah: number;
  pekerja: WorkerEntry[];
}

// ─── Ordered step config: color + short X-axis label ─────────────────────────

const stepConfig: Record<string, {
  bar: string;
  light: string;
  text: string;
  border: string;
  shortLabel: string;  // shown on X-axis (compact)
}> = {
  riwayat_pajanan: {
    bar: '#f59e0b',        // amber
    light: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-200',
    shortLabel: 'Riwayat\nPajanan',
  },
  persetujuan_dokter: {
    bar: '#06b6d4',        // cyan
    light: 'bg-cyan-50',
    text: 'text-cyan-600',
    border: 'border-cyan-200',
    shortLabel: 'Eval.\nDokter',
  },
  perusahaan_lapor: {
    bar: '#3b82f6',        // blue
    light: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200',
    shortLabel: 'Laporan\nPerusahaan',
  },
  penetapan_pak: {
    bar: '#8b5cf6',        // violet
    light: 'bg-violet-50',
    text: 'text-violet-600',
    border: 'border-violet-200',
    shortLabel: 'Penetapan\nPAK',
  },
  kompensasi_bpjstk: {
    bar: '#10b981',        // emerald
    light: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-200',
    shortLabel: 'Klaim\nJKK BPJS',
  },
  rehabilitasi_bpjskes: {
    bar: '#f43f5e',        // rose
    light: 'bg-rose-50',
    text: 'text-rose-600',
    border: 'border-rose-200',
    shortLabel: 'Rehabilitasi\nMedik',
  },
};

const caseTypeLabels: Record<string, string> = {
  PAK: 'PAK (Penyakit Kerja)',
  K3: 'K3 (Kecelakaan)',
  PHK: 'PHK (Kasus)',
};

// ─── X-axis tick with line breaks ─────────────────────────────────────────────

function CustomXAxisTick({ x, y, payload }: { x: number; y: number; payload: { value: string } }) {
  const cfg = stepConfig[payload.value];
  const lines = cfg?.shortLabel?.split('\n') ?? [payload.value];
  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line: string, i: number) => (
        <text
          key={i}
          x={0}
          y={0}
          dy={14 + i * 14}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize={10}
          fontWeight={700}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (active && payload && payload.length) {
    const d = payload[0].payload as StepStat;
    const cfg = stepConfig[d.key];
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 min-w-[170px]">
        <p className={`text-[10px] font-bold uppercase tracking-wider ${cfg?.text} mb-1`}>
          {d.label}
        </p>
        <p className="text-2xl font-extrabold text-[#0f172a]">{d.jumlah}</p>
        <p className="text-[11px] text-slate-400 font-medium">pekerja selesai</p>
      </div>
    );
  }
  return null;
}

// ─── Worker Drill-down Row ────────────────────────────────────────────────────

function WorkerRow({ w }: { w: WorkerEntry }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/60 last:border-b-0 group">
      <div className="h-8 w-8 rounded-full bg-white text-slate-600 flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
        {w.nama.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-[#1e293b] truncate">{w.nama}</p>
        <p className="text-[11px] text-[#94a3b8] truncate">{w.perusahaan}</p>
      </div>
      <div className="flex flex-col items-end shrink-0 gap-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase">
          {caseTypeLabels[w.jenis_kasus] ?? w.jenis_kasus ?? '—'}
        </span>
        <div className="w-16 h-1.5 bg-white/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0ea5e9] rounded-full transition-all"
            style={{ width: `${w.progress}%` }}
          />
        </div>
      </div>
      {w.id && (
        <Link
          href={`/pekerja/${w.id}`}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ExternalLink className="h-3.5 w-3.5 text-[#0ea5e9]" />
        </Link>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdvokasiBarChart() {
  const [stats, setStats] = useState<StepStat[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [hazardFilter, setHazardFilter] = useState<string>('all');

  const fetchStats = useCallback(async (withWorkers = false, currentHazard = 'all') => {
    if (!withWorkers) setLoading(true);
    try {
      const params: any = { include_workers: withWorkers };
      if (currentHazard !== 'all') {
        params.hazard = currentHazard;
      }
      const res = await api.get('/advokasi/stats', { params });
      if (res.data.status === 'success') {
        setStats(res.data.data);
        setTotal(res.data.total);
      }
    } catch (error) {
      console.error('Failed to fetch advocacy stats', error);
      toast.error('Gagal mengambil data advokasi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(false, hazardFilter); // Initial load without workers
  }, [fetchStats, hazardFilter]);

  const toggleStep = async (key: string) => {
    if (expandedKey === key) {
      setExpandedKey(null);
      return;
    }

    // If we don't have worker data for this step, fetch it
    const step = stats.find(s => s.key === key);
    if (step && step.jumlah > 0 && (!step.pekerja || step.pekerja.length === 0)) {
      toast.loading('Memuat daftar pekerja...', { id: 'fetch-workers' });
      await fetchStats(true, hazardFilter);
      toast.dismiss('fetch-workers');
    }
    
    setExpandedKey(key);
  };

  const expandedStep = stats.find((s) => s.key === expandedKey);

  return (
    <div className="flex flex-col">

      {/* ── Chart header ── */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <h2 className="text-[17px] font-bold text-[#0f172a]">Tren Status Advokasi</h2>
          <p className="text-sm text-[#64748b] mt-1">
            Jumlah pekerja yang telah menyelesaikan setiap tahap proses
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Select value={hazardFilter} onValueChange={setHazardFilter}>
            <SelectTrigger className="h-8 text-xs font-bold bg-white w-[140px] focus:ring-0 focus:ring-offset-0">
              <SelectValue placeholder="Pilih Hazard" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Hazard</SelectItem>
              <SelectItem value="Faktor Fisika">Faktor Fisika</SelectItem>
              <SelectItem value="Faktor Kimia">Faktor Kimia</SelectItem>
              <SelectItem value="Faktor Biologi">Faktor Biologi</SelectItem>
              <SelectItem value="Faktor Ergonomi">Faktor Ergonomi</SelectItem>
              <SelectItem value="Faktor Psikososial">Faktor Psikososial</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]" />
            <span className="text-xs font-bold text-[#64748b]">
              {loading ? '—' : `${total} Pekerja Aktif`}
            </span>
          </div>
        </div>
      </div>

      {/* ── Bar Chart ── */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[220px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-7 w-7 text-[#0ea5e9] animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Memuat data advokasi...</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={stats}
            margin={{ top: 22, right: 8, left: -22, bottom: 36 }}
            barCategoryGap="28%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="key"
              tick={<CustomXAxisTick {...({} as any)} />}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#cbd5e1' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Bar
              dataKey="jumlah"
              radius={[8, 8, 0, 0]}
              maxBarSize={54}
              onClick={(data) => toggleStep(data.key)}
              style={{ cursor: 'pointer' }}
            >
              <LabelList
                dataKey="jumlah"
                position="top"
                style={{ fontSize: 12, fontWeight: 800, fill: '#475569' }}
              />
              {stats.map((entry) => (
                <Cell
                  key={entry.key}
                  fill={stepConfig[entry.key]?.bar ?? '#0ea5e9'}
                  opacity={expandedKey && expandedKey !== entry.key ? 0.3 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* ── Step legend chips (clickable) ── */}
      {!loading && (
        <div className="flex flex-wrap gap-2 mt-1 mb-3">
          {stats.map((s) => {
            const cfg = stepConfig[s.key];
            const isActive = expandedKey === s.key;
            return (
              <button
                key={s.key}
                onClick={() => toggleStep(s.key)}
                className={`
                  flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold
                  border transition-all duration-200
                  ${isActive
                    ? `${cfg.light} ${cfg.text} ${cfg.border} shadow-sm`
                    : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-200 hover:text-slate-600'
                  }
                `}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cfg?.bar }}
                />
                {s.label}
                <span
                  className={`
                    inline-flex items-center justify-center min-w-[18px] h-[18px]
                    rounded-full text-[9px] font-extrabold px-1
                    ${isActive ? 'bg-white/70' : 'bg-slate-100'}
                  `}
                >
                  {s.jumlah}
                </span>
                {isActive
                  ? <ChevronUp className="h-3 w-3" />
                  : <ChevronDown className="h-3 w-3" />
                }
              </button>
            );
          })}
        </div>
      )}

      {/* ── Drill-down: Worker list per step ── */}
      {expandedKey && expandedStep && (() => {
        const cfg = stepConfig[expandedKey];
        return (
          <div className={`rounded-[14px] border ${cfg.border} ${cfg.light} p-4`}>
            {/* Panel header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className={`h-4 w-4 ${cfg.text}`} />
                <span className={`text-[12px] font-bold ${cfg.text} uppercase tracking-wider`}>
                  {expandedStep.label} — {expandedStep.jumlah} Pekerja Selesai
                </span>
              </div>
              <Link
                href="/advokasi"
                className={`text-[11px] font-bold ${cfg.text} hover:underline flex items-center gap-1`}
              >
                Lihat di Advokasi <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            {/* Worker rows */}
            {expandedStep.pekerja.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-3 text-center">
                Belum ada pekerja yang menyelesaikan tahap ini.
              </p>
            ) : (
              <div className="max-h-[180px] overflow-y-auto pr-1">
                {expandedStep.pekerja.map((w, i) => (
                  <WorkerRow key={w.id ?? i} w={w} />
                ))}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
