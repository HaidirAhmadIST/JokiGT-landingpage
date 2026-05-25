import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldAlert, Zap, Clock, Info } from 'lucide-react';
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

interface HazardDetail {
  description: string;
  duration: string;
}

interface HazardIdentificationProps {
  // data: Record<string, HazardDetail>;
  // onChange: (data: Record<string, HazardDetail>) => void;
  // Integration with existing state pattern if needed, or standalone
  value: string; // Comma separated categories for current implementation compatibility
  onChange: (value: string) => void;
  onDetailsChange?: (details: Record<string, HazardDetail>) => void;
  initialDetails?: Record<string, HazardDetail>;
}

export const HazardIdentification: React.FC<HazardIdentificationProps> = ({ 
  value, 
  onChange,
  onDetailsChange,
  initialDetails = {}
}) => {
  const selectedIds = useMemo(() => value ? value.split(',').map(v => v.trim()) : [], [value]);
  const [details, setDetails] = useState<Record<string, HazardDetail>>(initialDetails);

  const toggleCategory = (id: string) => {
    let newSelected;
    if (selectedIds.includes(id)) {
      newSelected = selectedIds.filter(item => item !== id);
      // Optional: Cleanup details when deselected
      const newDetails = { ...details };
      delete newDetails[id];
      setDetails(newDetails);
      onDetailsChange?.(newDetails);
    } else {
      newSelected = [...selectedIds, id];
    }
    onChange(newSelected.join(', '));
  };

  const handleDetailChange = (id: string, field: keyof HazardDetail, val: string) => {
    const newDetails = {
      ...details,
      [id]: {
        ...(details[id] || { description: '', duration: '' }),
        [field]: val
      }
    };
    setDetails(newDetails);
    onDetailsChange?.(newDetails);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Fase 1: Pemilihan Kategori Induk */}
      <div className="space-y-4">
        <Label className="text-sm font-bold text-slate-700">
          Langkah 1: Pilih Jenis Bahaya yang Anda Temui di Tempat Kerja
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {HAZARD_CATEGORIES.map((cat) => {
            const isSelected = selectedIds.includes(cat.id);
            return (
              <div
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={cn(
                  "relative group flex items-center p-4 rounded-2xl border-2 transition-all cursor-pointer h-20",
                  isSelected 
                    ? "bg-blue-50 border-blue-500 shadow-md shadow-blue-100" 
                    : "bg-white border-slate-100 hover:border-blue-200 hover:bg-slate-50"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-xl mr-3 transition-transform group-hover:scale-110",
                  isSelected ? "bg-blue-500 shadow-lg shadow-blue-200" : "bg-slate-100"
                )}>
                  {cat.icon}
                </div>
                <span className={cn(
                  "text-xs font-bold leading-tight",
                  isSelected ? "text-blue-700" : "text-slate-600"
                )}>
                  {cat.title}
                </span>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fase 2 & 3: Input Spesifik Dinamis & Durasi */}
      {selectedIds.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-slate-100 animate-in slide-in-from-top-4 duration-500">
          <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
            Langkah 2: Jelaskan Secara Detail & Masukkan Durasi
          </Label>
          
          <div className="space-y-6">
            {HAZARD_CATEGORIES.filter(cat => selectedIds.includes(cat.id)).map((cat) => (
              <Card key={cat.id} className="p-5 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">{cat.icon}</span>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                    {cat.title}
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3 space-y-2">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase">Detail Bahaya</Label>
                    <Input
                      placeholder="Jelaskan apa yang Anda alami..."
                      className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white"
                      value={details[cat.id]?.description || ''}
                      onChange={(e) => handleDetailChange(cat.id, 'description', e.target.value)}
                    />
                    <div className="flex gap-1.5 items-start px-1">
                      <Info className="h-3 w-3 text-blue-500 mt-0.5 shrink-0" />
                      <p className="text-[10px] text-slate-500 leading-relaxed italic">
                        {cat.helperText}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase">Durasi (Tahun)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0"
                        className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white pr-10 font-bold"
                        value={details[cat.id]?.duration || ''}
                        onChange={(e) => handleDetailChange(cat.id, 'duration', e.target.value)}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">THN</div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {selectedIds.length === 0 && (
        <div className="p-10 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-center">
          <ShieldAlert className="h-12 w-12 text-slate-200 mb-3" />
          <p className="text-sm text-slate-400 font-medium">
            Belum ada kategori bahaya yang dipilih.<br/>Silakan pilih salah satu kategori di atas.
          </p>
        </div>
      )}
    </div>
  );
};
