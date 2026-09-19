import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, FilePlus, Settings } from 'lucide-react';
import type { Pekerja } from '@/types';

interface RiwayatPekerjaanTableProps {
  pekerja: Pekerja | null;
  openExposureAdd: () => void;
  openExposureEdit: (riwayat: any) => void;
}

export default function RiwayatPekerjaanTable({
  pekerja, openExposureAdd, openExposureEdit
}: RiwayatPekerjaanTableProps) {
  return (
    <Card id="section-pajanan" className="rounded-[24px] border-slate-100 shadow-sm p-6 bg-white overflow-hidden relative scroll-mt-32 transition-all duration-500">
      <div className="absolute top-[-20px] right-[-20px] opacity-[0.02] pointer-events-none">
         <Zap className="h-40 w-40" />
      </div>
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          <h2 className="text-xs font-black text-[#94a3b8] tracking-widest uppercase">Riwayat Pekerjaan & Pajanan</h2>
        </div>
        <Button 
          onClick={openExposureAdd}
          size="sm"
          className="h-8 px-3 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border-none font-bold text-[10px]"
        >
          <FilePlus className="h-3.5 w-3.5 mr-1.5" /> Tambah Riwayat
        </Button>
      </div>
      
      <div className="overflow-x-auto relative z-10">
        <table className="w-full text-sm text-left border-separate border-spacing-y-2">
          <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <tr>
              <th className="px-4 py-2 w-[25%]">Perusahaan / Proyek</th>
              <th className="px-4 py-2 w-[20%]">Jenis Pajanan</th>
              <th className="px-4 py-2 w-[35%]">APD yang Digunakan</th>
              <th className="px-4 py-2 w-[12%] text-center">Durasi</th>
              <th className="px-4 py-2 w-[8%] text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {(pekerja?.riwayat_pekerja && pekerja.riwayat_pekerja.length > 0) ? (
              pekerja.riwayat_pekerja.map((r: any, idx: number) => {
                return (
                  <tr key={idx} className="group">
                    <td className="px-4 py-4 bg-slate-50/50 rounded-l-2xl border-y border-l border-slate-100 group-hover:bg-blue-50/30 transition-colors align-top">
                      <p className="font-bold text-slate-800">{r.nama_perusahaan}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{r.jabatan || 'Pekerja'}</p>
                    </td>
                    <td className="px-4 py-4 bg-slate-50/50 border-y border-slate-100 group-hover:bg-blue-50/30 transition-colors align-top min-w-[200px]">
                      {(() => {
                        const rawDetails = (() => {
                          // pajanan_details is stored inside informal_data JSON
                          const fromInformal = (r.informal_data as any)?.pajanan_details;
                          const direct = (r as any).pajanan_details;
                          const src = fromInformal ?? direct ?? {};
                          return typeof src === 'string' ? JSON.parse(src || '{}') : src;
                        })();

                        const CATEGORY_LABELS: Record<string, { label: string; icon: string; color: string }> = {
                          FISIK:       { label: 'Fisik',        icon: '🔊', color: 'amber' },
                          KIMIA:       { label: 'Kimia',        icon: '🧪', color: 'orange' },
                          BIOLOGI:     { label: 'Biologis',     icon: '🦠', color: 'green' },
                          ERGONOMI:    { label: 'Ergonomi',     icon: '🧍', color: 'blue' },
                          PSIKOSOSIAL: { label: 'Psikososial',  icon: '🧠', color: 'purple' },
                        };

                        const colorMap: Record<string, string> = {
                          amber:  'bg-amber-50 border-amber-200 text-amber-800',
                          orange: 'bg-orange-50 border-orange-200 text-orange-800',
                          green:  'bg-emerald-50 border-emerald-200 text-emerald-800',
                          blue:   'bg-blue-50 border-blue-200 text-blue-800',
                          purple: 'bg-purple-50 border-purple-200 text-purple-800',
                        };

                        const badgeMap: Record<string, string> = {
                          amber:  'bg-amber-100 text-amber-700',
                          orange: 'bg-orange-100 text-orange-700',
                          green:  'bg-emerald-100 text-emerald-700',
                          blue:   'bg-blue-100 text-blue-700',
                          purple: 'bg-purple-100 text-purple-700',
                        };

                        const categoryIds = r.jenis_pajanan
                          ? r.jenis_pajanan.split(',').map((s: string) => s.trim()).filter(Boolean)
                          : [];

                        const hasDetailData = categoryIds.some((id: string) => {
                          const detail = rawDetails[id];
                          if (!detail) return false;
                          if (Array.isArray(detail)) return detail.some((row: any) => row.description || row.duration);
                          return detail.description || detail.duration;
                        });

                        if (categoryIds.length === 0) {
                          return <span className="text-slate-500 text-[11px] font-bold italic">-</span>;
                        }

                        if (!hasDetailData) {
                          return (
                            <div className="flex flex-wrap gap-1.5">
                              {categoryIds.map((id: string, pIdx: number) => {
                                const cat = CATEGORY_LABELS[id];
                                return (
                                  <div key={pIdx} className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
                                    {cat && <span className="text-[10px]">{cat.icon}</span>}
                                    <span className="text-[9px] font-black uppercase tracking-tight">{cat ? cat.label : id}</span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-2 w-full">
                            {categoryIds.map((id: string) => {
                              const cat = CATEGORY_LABELS[id] ?? { label: id, icon: '⚠️', color: 'amber' };
                              const colorClass = colorMap[cat.color] ?? colorMap.amber;
                              const badgeClass = badgeMap[cat.color] ?? badgeMap.amber;

                              const detail = rawDetails[id];
                              const rows: Array<{ description: string; duration: string }> = Array.isArray(detail)
                                ? detail
                                : detail
                                  ? [{ description: detail.description ?? '', duration: detail.duration ?? '' }]
                                  : [];

                              const validRows = rows.filter(row => row.description || row.duration);

                              return (
                                <div key={id} className={`rounded-xl border p-2 ${colorClass}`}>
                                  <div className="flex items-center gap-1.5 mb-1.5">
                                    <span className="text-[12px]">{cat.icon}</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest">{cat.label}</span>
                                  </div>
                                  {validRows.length > 0 ? (
                                    <div className="space-y-1">
                                      {validRows.map((row, rowIdx) => (
                                        <div key={rowIdx} className="flex flex-col gap-1 bg-white/60 rounded-lg px-2 py-1.5">
                                          {row.description && <p className="text-[10px] font-semibold text-slate-700 leading-snug">{row.description}</p>}
                                          {row.duration && (
                                            <span className={`self-start text-[9px] font-black px-1.5 py-0.5 rounded-md ${badgeClass}`}>
                                              {row.duration} Thn
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-[9px] italic opacity-60 px-1">Belum diisi</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-4 bg-slate-50/50 border-y border-slate-100 group-hover:bg-blue-50/30 transition-colors align-top">
                       <div className="flex flex-col gap-1.5">
                         {(() => {
                            try {
                              const info = typeof r.informal_data === 'string' ? JSON.parse(r.informal_data) : r.informal_data;
                              const provided = info?.apd_disediakan;
                              const own = info?.jenis_apd_sendiri;
                              const legacy = info?.apd_list;
                              
                              const hasProvided = provided && provided !== '-' && provided.toLowerCase() !== 'tidak ada';
                              const hasOwn = own && own !== '-' && own.toLowerCase() !== 'tidak ada';

                              if (!hasProvided && !hasOwn && !legacy) return <span className="text-slate-400 italic text-[11px]">-</span>;

                              return (
                                <div className="flex flex-col gap-2 py-1">
                                  {hasProvided && (
                                    <div className="flex flex-col">
                                      <span className="text-[8px] font-black text-blue-500 uppercase tracking-tighter mb-0.5">Disediakan Perusahaan:</span>
                                      <span className="text-[11px] text-slate-700 font-bold leading-snug">{provided}</span>
                                    </div>
                                  )}
                                  {hasOwn && (
                                    <div className="flex flex-col">
                                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Milik Mandiri:</span>
                                      <span className="text-[11px] text-slate-700 font-bold leading-snug">{own}</span>
                                    </div>
                                  )}
                                  {!hasProvided && !hasOwn && legacy && (
                                     <div className="flex flex-col">
                                       <span className="text-[8px] font-black text-blue-400 uppercase tracking-tighter mb-0.5">Riwayat APD:</span>
                                       <span className="text-[11px] text-slate-600 font-medium leading-snug">{legacy}</span>
                                     </div>
                                  )}
                                </div>
                              );
                            } catch(e) { return <span className="text-slate-400">-</span>; }
                         })()}
                       </div>
                    </td>
                     <td className="px-4 py-4 bg-slate-50/50 border-y border-slate-100 group-hover:bg-blue-50/30 transition-colors text-center whitespace-nowrap align-top">
                       <span className="inline-flex items-center px-3 py-1 bg-white text-blue-600 rounded-full border border-blue-100 text-[11px] font-black shadow-sm">
                         {(() => {
                           if (!r.tgl_masuk) return '-';
                           const start = new Date(r.tgl_masuk);
                           const end = r.tgl_keluar ? new Date(r.tgl_keluar) : new Date();
                           let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                           if (months < 0) return '-';
                           if (months === 0) return '< 1 Bulan';
                           const years = Math.floor(months / 12);
                           const remMonths = months % 12;
                           if (years > 0 && remMonths > 0) return `${years} Thn ${remMonths} Bln`;
                           if (years > 0) return `${years} Tahun`;
                           return `${months} Bulan`;
                         })()}
                       </span>
                     </td>
                    <td className="px-4 py-4 bg-slate-50/50 rounded-r-2xl border-y border-r border-slate-100 group-hover:bg-blue-50/30 transition-colors text-right align-top">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => openExposureEdit(r)}
                        className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400 italic">
                  Belum ada riwayat pekerjaan yang ditambahkan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
