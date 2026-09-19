'use client';
import { format, parseISO } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { Zap, ShieldAlert, FileText } from 'lucide-react';

interface PajananTableProps {
  riwayatPekerja: any[];
}

export default function PajananTable({ riwayatPekerja }: PajananTableProps) {
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

  const renderExposureCell = (r: any) => {
    const rawDetails = (() => {
      const fromInformal = (r.informal_data as any)?.pajanan_details;
      const direct = (r as any).pajanan_details;
      const src = fromInformal ?? direct ?? {};
      return typeof src === 'string' ? JSON.parse(src || '{}') : src;
    })();

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
      return <span className="text-slate-500 text-[11px] font-bold italic">Tidak Ada Pajanan</span>;
    }

    if (!hasDetailData) {
      return (
        <div className="flex flex-wrap gap-2">
          {categoryIds.map((id: string, pIdx: number) => {
            const cat = CATEGORY_LABELS[id];
            return (
              <div key={pIdx} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
                {cat && <span>{cat.icon}</span>}
                <span className="text-[11px] font-black uppercase tracking-tight">
                  {cat ? cat.label : id}
                </span>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className="space-y-3 w-full">
        {categoryIds.map((id: string) => {
          const cat = CATEGORY_LABELS[id] ?? { label: id, icon: '⚠️', color: 'amber' };
          const colorClass = colorMap[cat.color] ?? colorMap.amber;
          const badgeClass = badgeMap[cat.color] ?? badgeMap.amber;

          const detail = rawDetails[id];
          const rows: Array<{ description: string; duration: string }> = Array.isArray(detail)
            ? detail
            : detail ? [{ description: detail.description ?? '', duration: detail.duration ?? '' }] : [];
          const validRows = rows.filter(row => row.description || row.duration);

          return (
            <div key={id} className={`rounded-xl border p-3 ${colorClass}`}>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-sm">{cat.icon}</span>
                <span className="text-[10px] font-black uppercase tracking-widest">{cat.label}</span>
              </div>
              {validRows.length > 0 ? (
                <div className="space-y-1.5">
                  {validRows.map((row, rowIdx) => (
                    <div key={rowIdx} className="flex items-start gap-2 bg-white/60 rounded-lg px-2.5 py-2">
                      <span className="text-[9px] font-black text-slate-400 mt-0.5 shrink-0 w-4">{rowIdx + 1}.</span>
                      <div className="flex-1 min-w-0">
                        {row.description && (
                          <p className="text-[11px] font-semibold text-slate-700 leading-snug">{row.description}</p>
                        )}
                      </div>
                      {row.duration && (
                        <span className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-lg ${badgeClass}`}>
                          {row.duration} Thn
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] italic opacity-60">Detail belum diisi</p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden mt-8 mb-12">
      <div className="p-6 border-b border-slate-100 bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1e293b]">Riwayat Pajanan & APD</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Profil Risiko Lingkungan & Alat Pelindung Diri</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
            Total {riwayatPekerja?.length || 0} Pengalaman Terdata
          </span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-white border-b-2 border-slate-100">
              <th className="px-10 py-6 text-[11px] font-extrabold text-slate-800 uppercase tracking-widest w-[35%]">Identitas Pekerjaan</th>
              <th className="px-8 py-6 text-[11px] font-extrabold text-slate-800 uppercase tracking-widest w-[20%] text-center">Profil Pajanan</th>
              <th className="px-8 py-6 text-[11px] font-extrabold text-slate-800 uppercase tracking-widest w-[30%]">Alat Pelindung Diri (APD)</th>
              <th className="px-10 py-6 text-[11px] font-extrabold text-slate-800 uppercase tracking-widest w-[15%] text-right">Durasi Kerja</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {riwayatPekerja?.some((r: any) => r.jenis_pajanan || r.durasi_pajanan || r.informal_data) ? (
              riwayatPekerja.map((r: any, idx: number) => {
                const info = typeof r.informal_data === 'string' ? JSON.parse(r.informal_data || '{}') : (r.informal_data || {});
                const mutations = info?.mutasi_jabatan || [];
                const apdDisediakan = info?.apd_disediakan || info?.apd_list || '';
                const apdMandiri = info?.jenis_apd_sendiri || '';
                
                if (!r.jenis_pajanan && !r.durasi_pajanan && !apdDisediakan && !apdMandiri) return null;

                return (
                  <tr key={idx}>
                    {/* Column 1: Company & Mutation Timeline */}
                    <td className="px-10 py-10 align-top">
                      <div className="flex flex-col">
                        <p className="font-extrabold text-[#1e293b] text-[17px] tracking-tight">{r.nama_perusahaan}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg uppercase tracking-wider">
                            {r.bagian || r.jabatan || 'Pekerja'}
                          </span>
                          {r.status_pekerjaan && (
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg uppercase tracking-wider">
                              {r.status_pekerjaan}
                            </span>
                          )}
                        </div>

                        {(r.deskripsi_pekerjaan || r.nama_agen_penyalur || r.tanggal_selesai_kontrak) && (
                          <div className="mt-4 space-y-3">
                            {r.deskripsi_pekerjaan && (
                              <div className="text-[11px] text-slate-600">
                                <span className="font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Deskripsi Pekerjaan:</span>
                                <span className="leading-relaxed">{r.deskripsi_pekerjaan}</span>
                              </div>
                            )}
                            {r.nama_agen_penyalur && (
                              <div className="text-[11px] text-slate-600">
                                <span className="font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Agen Penyalur:</span>
                                <span>{r.nama_agen_penyalur}</span>
                                {r.alamat_agen_penyalur && <span className="block text-slate-500 mt-0.5">{r.alamat_agen_penyalur}</span>}
                              </div>
                            )}
                            {r.tanggal_selesai_kontrak && (
                              <div className="text-[11px] text-slate-600">
                                <span className="font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Selesai Kontrak:</span>
                                <span>{format(parseISO(r.tanggal_selesai_kontrak), 'dd MMM yyyy', { locale: localeID })}</span>
                              </div>
                            )}
                            {info?.bpjs_bpu && (
                              <div className="text-[11px] text-slate-600">
                                <span className="font-bold uppercase tracking-wider text-slate-400 block mb-0.5">BPJS Ketenagakerjaan:</span>
                                <span>{info.bpjs_bpu === 'PU' ? 'Penerima Upah (PU)' : info.bpjs_bpu === 'BPU' ? 'Bukan Penerima Upah (BPU)' : info.bpjs_bpu}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {(info?.training_k3 || info?.ada_p2k3) && (
                          <div className="mt-5 p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                              <ShieldAlert className="h-3 w-3" /> Info Keselamatan (K3)
                            </p>
                            <div className="space-y-2">
                              {info.training_k3 && (
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[10px] font-semibold text-slate-500">Pelatihan K3: <span className="font-bold text-slate-700">{info.training_k3 === 'Pernah' ? 'Pernah Mengikuti' : 'Belum Pernah'}</span></span>
                                  {info.training_k3 === 'Pernah' && info.jenis_pelatihan_k3 && (
                                    <span className="text-[10px] text-slate-500">- Jenis: {info.jenis_pelatihan_k3}</span>
                                  )}
                                  {info.training_k3 === 'Pernah' && info.terakhir_pelatihan_k3 && (
                                    <span className="text-[10px] text-slate-500">- Terakhir: {info.terakhir_pelatihan_k3}</span>
                                  )}
                                </div>
                              )}
                              {info.ada_p2k3 && (
                                <div className="flex flex-col gap-0.5 mt-1">
                                  <span className="text-[10px] font-semibold text-slate-500">P2K3 di Perusahaan: <span className="font-bold text-slate-700">{info.ada_p2k3}</span></span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Timeline Mutasi */}
                        {mutations.length > 0 && (
                          <div className="mt-6 ml-2 border-l-[2px] border-slate-100 space-y-6">
                            {mutations.map((m: any, midx: number) => (
                              <div key={midx} className="relative pl-8">
                                <div className="absolute left-[-6px] top-1 h-3 w-3 rounded-full bg-[#0ea5e9] border-2 border-white" />
                                <div className="flex justify-between items-start gap-6">
                                  <div>
                                    <p className="text-[11px] font-black text-slate-700 leading-none uppercase">{m.bagian || '-'}</p>
                                    <p className="text-[10px] text-slate-600 mt-1.5 font-bold">{m.jabatan || '-'}</p>
                                    {m.deskripsi_pekerjaan && <p className="text-[10px] text-slate-500 mt-1 italic">{m.deskripsi_pekerjaan}</p>}
                                  </div>
                                  <span className="text-[11px] font-extrabold text-slate-500 tracking-tighter shrink-0">{m.tahun_mulai ? `${m.tahun_mulai}–${m.tahun_selesai || 'Sekarang'}` : (m.tahun || '-')}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Column 2: Exposure Profiles */}
                    <td className="px-8 py-10 align-top">
                      {renderExposureCell(r)}
                    </td>

                    {/* Column 3: PPE (APD) Analysis */}
                    <td className="px-8 py-10 align-middle">
                      <div className="space-y-6">
                        {apdDisediakan && (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-[#0ea5e9] uppercase tracking-[0.2em]">STANDAR PERUSAHAAN</span>
                            </div>
                            <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-100/50">
                              <p className="text-[12px] font-bold text-slate-700 leading-relaxed italic">
                                &quot;{apdDisediakan}&quot;
                              </p>
                              {info?.akses_apd && (
                                <div className="mt-3 pt-3 border-t border-blue-100 flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Akses APD:</span>
                                  <span className="text-[11px] font-semibold text-slate-700">{info.akses_apd}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {apdMandiri && (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-rose-500 uppercase tracking-[0.2em]">PROTEKSI MANDIRI</span>
                            </div>
                            <div className="p-4 bg-rose-50/40 rounded-2xl border border-rose-100/50">
                              <p className="text-[12px] font-bold text-slate-700 leading-relaxed italic">
                                &quot;{apdMandiri}&quot;
                              </p>
                            </div>
                          </div>
                        )}
                        {!apdDisediakan && !apdMandiri && (
                          <div className="flex items-center gap-2 text-slate-300">
                            <FileText className="h-4 w-4 opacity-50" />
                            <span className="text-[11px] font-bold italic">Dokumentasi APD tidak ditemukan</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Column 4: Tenure Duration */}
                    <td className="px-10 py-10 align-middle text-right">
                      <div className="inline-flex flex-col items-end">
                        <div className="flex flex-col items-end min-w-[110px] pr-4">
                        {(() => {
                          if (!r.tgl_masuk) return (
                            <>
                              <span className="text-[36px] font-black leading-none text-[#0ea5e9]">-</span>
                              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-1">TAHUN</span>
                            </>
                          );
                          const start = new Date(r.tgl_masuk);
                          const end = r.tgl_keluar ? new Date(r.tgl_keluar) : new Date();
                          let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                          if (months <= 0) return (
                            <>
                              <span className="text-[36px] font-black leading-none text-[#0ea5e9]">{'< 1'}</span>
                              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-1">BULAN</span>
                            </>
                          );
                          const years = Math.floor(months / 12);
                          const remMonths = months % 12;
                          if (years > 0 && remMonths > 0) return (
                            <>
                              <span className="text-[28px] font-black leading-none text-[#0ea5e9]">{years}<span className="text-xl">th</span> {remMonths}<span className="text-xl">bln</span></span>
                              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-1">DURASI KERJA</span>
                            </>
                          );
                          if (years > 0) return (
                            <>
                              <span className="text-[36px] font-black leading-none text-[#0ea5e9]">{years}</span>
                              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-1">TAHUN</span>
                            </>
                          );
                          return (
                            <>
                              <span className="text-[36px] font-black leading-none text-[#0ea5e9]">{months}</span>
                              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-1">BULAN</span>
                            </>
                          );
                        })()}
                        </div>
                        <div className="flex items-center gap-2 mt-4 text-slate-600 font-bold">
                          <span className="text-[10px] font-black tracking-widest uppercase">MULAI {r.tgl_masuk?.substring(0,4) || '-'}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="px-10 py-32 text-center bg-slate-50/30">
                  <Zap className="h-16 w-16 text-slate-100 mx-auto mb-5" />
                  <h4 className="text-lg font-black text-slate-500 uppercase tracking-[0.4em]">BELUM ADA DATA PAJANAN</h4>
                  <p className="text-sm text-slate-400 mt-2 font-medium">Lengkapi riwayat pekerjaan untuk memunculkan profil pajanan</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-center gap-12">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-amber-500 shadow-sm" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Risiko Lingkungan</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-sm" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Alat Pelindung Diri</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-[#0ea5e9] shadow-sm" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Akumulasi Masa Kerja</span>
        </div>
      </div>
    </div>
  );
}
