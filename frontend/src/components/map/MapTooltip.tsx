import React, { useMemo } from 'react';
import { MapPin, TrendingUp } from 'lucide-react';

export interface KecamatanData {
  name: string;
  reports: number;
  hazardBreakdown?: {
    fisik: number;
    kimia: number;
    biologi: number;
    ergonomi: number;
    psikososial: number;
  };
}

export interface RegencyData {
  name: string;
  reports: number;
  districts: KecamatanData[];
  hazardBreakdown?: {
    fisik: number;
    kimia: number;
    biologi: number;
    ergonomi: number;
    psikososial: number;
  };
}

export interface ProvinceReportDetail {
  provinceName: string;
  totalReports: number;
  regencies: RegencyData[];
  hazardBreakdown?: {
    fisik: number;
    kimia: number;
    biologi: number;
    ergonomi: number;
    psikososial: number;
  };
}

interface TooltipProps {
  x: number;
  y: number;
  feature: {
    properties: {
      province_name: string;
    };
  } | null;
  dbStats?: any;
}

// Deterministic generator to produce clean, realistic regencies and kecamatan for Indonesian provinces
// Data updated sesuai BPS 2024
export const getDetailedProvinceData = (provinceName: string, dbStats?: any): ProvinceReportDetail => {
  const cleanName = provinceName.trim();
  
  // Jika ada data dari database untuk provinsi ini, gunakan data asli tersebut
  if (dbStats && dbStats[cleanName]) {
    return dbStats[cleanName];
  }

  // Jika tidak ada data dari database, kembalikan data kosong yang valid (0 kasus)
  return {
    provinceName: cleanName,
    totalReports: 0,
    regencies: [],
    hazardBreakdown: {
      fisik: 0,
      kimia: 0,
      biologi: 0,
      ergonomi: 0,
      psikososial: 0
    }
  };
};

const MapTooltip: React.FC<TooltipProps> = ({ x, y, feature, dbStats }) => {
  if (!feature) return null;

  const provinceName = feature.properties.province_name;
  const data = getDetailedProvinceData(provinceName, dbStats);

  // Ambil 3 kabupaten/kota dengan kasus terbanyak untuk disajikan secara informatif dan sederhana
  const topRegencies = [...data.regencies].sort((a, b) => b.reports - a.reports).slice(0, 3);
  const maxReports = Math.max(...topRegencies.map(r => r.reports), 1);

  return (
    <div
      className="absolute bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-100 p-4 z-50 pointer-events-none select-none transition-all duration-200 ease-out"
      style={{
        left: `${x + 15}px`, // Ditambah sedikit offset agar tidak tertutup kursor secara langsung
        top: `${y + 15}px`,
        width: '280px'
      }}
    >
      {/* Header Provinsi & Total Laporan */}
      <div className="flex flex-col gap-1.5 pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-slate-800 font-extrabold text-sm tracking-tight truncate">
            <MapPin className="h-4 w-4 text-sky-500 shrink-0" />
            <span>{data.provinceName}</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100 shrink-0">
            Provinsi
          </span>
        </div>
        <div className="flex items-center justify-between mt-1 bg-sky-50/50 rounded-xl px-3 py-2 border border-sky-100/30">
          <span className="text-[10px] font-bold text-sky-700 tracking-wider uppercase">Total Laporan</span>
          <span className="text-sm font-black text-sky-600 tabular-nums">
            {data.totalReports} <span className="text-[10px] font-medium text-sky-500/80">Kasus</span>
          </span>
        </div>
      </div>

      {/* Body: 3 Kabupaten/Kota Terbanyak */}
      <div className="pt-3">
        <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
          <TrendingUp className="h-3 w-3 text-sky-500" />
          <span>Sebaran Kasus Terbanyak</span>
        </div>
        
        <div className="flex flex-col gap-2.5">
          {topRegencies.map((regency, idx) => {
            const percentage = (regency.reports / maxReports) * 100;
            return (
              <div key={idx} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 truncate max-w-[190px]">
                    {regency.name}
                  </span>
                  <span className="font-black text-slate-800 shrink-0 tabular-nums bg-slate-100/60 px-1.5 py-0.5 rounded text-[10px]">
                    {regency.reports}
                  </span>
                </div>
                {/* Horizontal Progress Bar yang rapi dan halus */}
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-sky-400 to-sky-500 rounded-full transition-all duration-500" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Hint */}
      <div className="mt-3.5 pt-2.5 border-t border-slate-100 text-center">
        <span className="text-[9px] font-medium text-slate-400/90 tracking-wide flex items-center justify-center gap-1">
          <span>🖱️</span> Klik wilayah untuk detail kecamatan
        </span>
      </div>
    </div>
  );
};

export default MapTooltip;
