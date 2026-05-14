import React from 'react';
import { X, Loader2, AlertTriangle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProvinceData {
  province_name: string;
  risk_level: string;
  total_reports?: number;
  cities?: { name: string; reports: number }[];
}

interface MapSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  data: ProvinceData | null;
}

export const MapSidebar: React.FC<MapSidebarProps> = ({ isOpen, onClose, isLoading, data }) => {
  return (
    <div
      className={cn(
        "absolute left-0 top-0 z-40 h-full w-full max-w-sm transform bg-white shadow-2xl transition-transform duration-300 ease-in-out sm:w-96",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-800">Detail Wilayah</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Tutup Sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex h-40 flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-sm font-medium text-slate-500">Mengambil data dari server...</p>
            </div>
          ) : data ? (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  Provinsi
                </p>
                <h3 className="mt-1 text-2xl font-black text-slate-900">
                  {data.province_name}
                </h3>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <span className="font-bold text-slate-700">Tingkat Risiko</span>
                </div>
                <div className="text-lg font-bold text-slate-900">
                  {data.risk_level}
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-blue-50/50 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="font-bold text-slate-700">Total Laporan Masuk</span>
                </div>
                <div className="text-3xl font-black text-blue-700">
                  {data.total_reports !== undefined ? data.total_reports.toLocaleString('id-ID') : '-'}
                </div>
              </div>

              {data.cities && data.cities.length > 0 && (
                <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-700">Kabupaten/Kota Pelapor</span>
                    <span className="text-xs font-medium text-slate-500">Jumlah Laporan</span>
                  </div>
                  <ul className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {data.cities.map((city, idx) => (
                      <li key={idx} className="flex justify-between items-center px-4 py-3 hover:bg-slate-50 transition-colors">
                        <span className="text-sm font-medium text-slate-700">{city.name}</span>
                        <span className="text-sm font-bold text-blue-600 bg-blue-100/50 px-2.5 py-1 rounded-full">
                          {city.reports.toLocaleString('id-ID')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center text-center">
              <p className="text-sm font-medium text-slate-500">
                Pilih area provinsi pada peta untuk melihat detail.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
