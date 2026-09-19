import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldAlert, Info, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mapping dari bahasa awam ke standar K3 (Backend Key)
export const HAZARD_CATEGORIES = [
  {
    id: 'FISIK',
    title: 'Bahaya Lingkungan Fisik',
    icon: '🔊',
    helperText: 'Contoh: Suara mesin yang sangat bising, suhu ruangan sangat panas, getaran alat berat.',
  },
  {
    id: 'KIMIA',
    title: 'Paparan Bahan Kimia',
    icon: '🧪',
    helperText: 'Contoh: Menghirup asap las, terkena cairan pembersih karat atau karbol pekat, debu asbes, debu kayu/semen, atau menghirup uap cat/tiner.',
  },
  {
    id: 'BIOLOGI',
    title: 'Bahaya Biologis & Infeksi',
    icon: '🦠',
    helperText: 'Contoh: Bekerja dekat limbah medis, area berjamur, paparan virus/bakteri.',
  },
  {
    id: 'ERGONOMI',
    title: 'Sikap Kerja & Beban Fisik',
    icon: '🧍',
    helperText: 'Contoh: Posisi duduk atau berdiri yang tidak nyaman, sering mengangkat beban berat, gerakan berulang dalam jangka waktu panjang.',
  },
  {
    id: 'PSIKOSOSIAL',
    title: 'Stres & Beban Mental',
    icon: '🧠',
    helperText: 'Contoh: Jam kerja berlebih, target tidak rasional, pengawasan berlebihan (micromanagement), atau minimnya dukungan dari manajemen.',
  },
];

/** Satu entri baris detail bahaya */
export interface HazardRow {
  description: string;
  duration: string;
}

/** Detail per kategori: array of rows (unlimited) */
export type HazardDetails = Record<string, HazardRow[]>;

// ---- Backward compat: legacy single-row detail shape ----
interface LegacyHazardDetail {
  description: string;
  duration: string;
}

interface HazardIdentificationProps {
  value: string; // comma-separated category IDs
  onChange: (value: string) => void;
  onDetailsChange?: (details: HazardDetails) => void;
  initialDetails?: Record<string, LegacyHazardDetail | HazardRow[]>;
}

/** Normalise stored value to HazardRow[] */
function normaliseRows(raw: LegacyHazardDetail | HazardRow[] | undefined): HazardRow[] {
  if (!raw) return [{ description: '', duration: '' }];
  if (Array.isArray(raw)) return raw.length ? raw : [{ description: '', duration: '' }];
  // legacy single object
  return [{ description: (raw as LegacyHazardDetail).description ?? '', duration: (raw as LegacyHazardDetail).duration ?? '' }];
}

const emptyRow = (): HazardRow => ({ description: '', duration: '' });

export const HazardIdentification: React.FC<HazardIdentificationProps> = ({
  value,
  onChange,
  onDetailsChange,
  initialDetails = {},
}) => {
  const selectedIds = useMemo(() => (value ? value.split(',').map((v) => v.trim()) : []), [value]);

  // Normalise initialDetails to multi-row format
  const [details, setDetails] = useState<HazardDetails>(() => {
    const normalised: HazardDetails = {};
    for (const [key, val] of Object.entries(initialDetails)) {
      normalised[key] = normaliseRows(val as any);
    }
    return normalised;
  });

  // ---- Category toggle ----
  const toggleCategory = (id: string) => {
    let newSelected: string[];
    if (selectedIds.includes(id)) {
      newSelected = selectedIds.filter((item) => item !== id);
      const newDetails = { ...details };
      delete newDetails[id];
      setDetails(newDetails);
      onDetailsChange?.(newDetails);
    } else {
      newSelected = [...selectedIds, id];
      // Initialise with one empty row
      if (!details[id]) {
        const newDetails = { ...details, [id]: [emptyRow()] };
        setDetails(newDetails);
        onDetailsChange?.(newDetails);
      }
    }
    onChange(newSelected.join(', '));
  };

  // ---- Row helpers ----
  const getRows = (id: string): HazardRow[] => details[id] ?? [emptyRow()];

  const updateRow = (id: string, rowIdx: number, field: keyof HazardRow, val: string) => {
    const rows = getRows(id).map((r, i) => (i === rowIdx ? { ...r, [field]: val } : r));
    const newDetails = { ...details, [id]: rows };
    setDetails(newDetails);
    onDetailsChange?.(newDetails);
  };

  const addRow = (id: string) => {
    const rows = [...getRows(id), emptyRow()];
    const newDetails = { ...details, [id]: rows };
    setDetails(newDetails);
    onDetailsChange?.(newDetails);
  };

  const removeRow = (id: string, rowIdx: number) => {
    const rows = getRows(id).filter((_, i) => i !== rowIdx);
    // Keep at least one row
    const newDetails = { ...details, [id]: rows.length ? rows : [emptyRow()] };
    setDetails(newDetails);
    onDetailsChange?.(newDetails);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Fase 1: Pemilihan Kategori */}
      <div className="space-y-4">
        <Label className="text-sm font-bold text-slate-700">
          Langkah 1: Pilih Kategori Bahaya (Bisa Lebih dari Satu)
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {HAZARD_CATEGORIES.map((cat) => {
            const isSelected = selectedIds.includes(cat.id);
            return (
              <div
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={cn(
                  'relative group flex items-center p-4 rounded-2xl border-2 transition-all cursor-pointer h-20',
                  isSelected
                    ? 'bg-blue-50 border-blue-500 shadow-md shadow-blue-100'
                    : 'bg-white border-slate-100 hover:border-blue-200 hover:bg-slate-50'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center text-xl mr-3 transition-transform group-hover:scale-110',
                    isSelected ? 'bg-blue-500 shadow-lg shadow-blue-200' : 'bg-slate-100'
                  )}
                >
                  {cat.icon}
                </div>
                <span className={cn('text-xs font-bold leading-tight', isSelected ? 'text-blue-700' : 'text-slate-600')}>
                  {cat.title}
                </span>
                {isSelected && <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fase 2: Detail + Durasi (multi-row) */}
      {selectedIds.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-slate-100 animate-in slide-in-from-top-4 duration-500">
          <Label className="text-sm font-bold text-slate-700">
            Langkah 2: Jelaskan Secara Detail &amp; Masukkan Durasi
          </Label>

          <div className="space-y-6">
            {HAZARD_CATEGORIES.filter((cat) => selectedIds.includes(cat.id)).map((cat) => {
              const rows = getRows(cat.id);
              return (
                <Card key={cat.id} className="p-5 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  {/* Header kategori */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{cat.icon}</span>
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{cat.title}</h4>
                    </div>
                    {/* Tombol Tambah Baris */}
                    <button
                      type="button"
                      onClick={() => addRow(cat.id)}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg px-3 py-1.5 transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Tambah Baris
                    </button>
                  </div>

                  {/* Helper text */}
                  <div className="flex gap-1.5 items-start px-1 mb-4">
                    <Info className="h-3 w-3 text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-slate-500 leading-relaxed italic">{cat.helperText}</p>
                  </div>

                  {/* Header kolom */}
                  <div className="grid grid-cols-12 gap-2 mb-2 px-1">
                    <div className="col-span-8 sm:col-span-7">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Detail Bahaya</span>
                    </div>
                    <div className="col-span-3 sm:col-span-4 text-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Durasi (Thn)</span>
                    </div>
                    <div className="col-span-1" />
                  </div>

                  {/* Rows */}
                  <div className="space-y-2">
                    {rows.map((row, rowIdx) => (
                      <div key={rowIdx} className="grid grid-cols-12 gap-2 items-center group/row">
                        {/* Detail Bahaya */}
                        <div className="col-span-8 sm:col-span-7">
                          <Input
                            placeholder="Jelaskan apa yang Anda alami..."
                            className="h-10 text-xs bg-slate-50/50 border-slate-200 focus:bg-white px-2"
                            value={row.description}
                            onChange={(e) => updateRow(cat.id, rowIdx, 'description', e.target.value)}
                          />
                        </div>

                        {/* Durasi */}
                        <div className="col-span-3 sm:col-span-4">
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              className="h-10 text-xs bg-slate-50/50 border-slate-200 focus:bg-white pr-7 text-center font-bold"
                              value={row.duration}
                              onChange={(e) => updateRow(cat.id, rowIdx, 'duration', e.target.value)}
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">
                              THN
                            </div>
                          </div>
                        </div>

                        {/* Hapus baris */}
                        <div className="col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeRow(cat.id, rowIdx)}
                            disabled={rows.length === 1}
                            className={cn(
                              'h-8 w-8 flex items-center justify-center rounded-lg border transition-all',
                              rows.length === 1
                                ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                                : 'border-red-100 text-red-400 hover:bg-red-50 hover:text-red-600 hover:border-red-300'
                            )}
                            title={rows.length === 1 ? 'Minimal 1 baris' : 'Hapus baris ini'}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>


                </Card>
              );
            })}
          </div>
        </div>
      )}

      {selectedIds.length === 0 && (
        <div className="p-10 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-center">
          <ShieldAlert className="h-12 w-12 text-slate-200 mb-3" />
          <p className="text-sm text-slate-400 font-medium">
            Belum ada kategori bahaya yang dipilih.<br />Silakan pilih salah satu kategori di atas.
          </p>
        </div>
      )}
    </div>
  );
};
