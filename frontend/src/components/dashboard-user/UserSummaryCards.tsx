import React from 'react';
import { Card } from '@/components/ui/card';
import { Briefcase, Building2, User2, MapPin } from 'lucide-react';
import type { Pekerja } from '@/types';

interface UserSummaryCardsProps {
  pekerja: Pekerja | null;
}

export default function UserSummaryCards({ pekerja }: UserSummaryCardsProps) {
  const activeJob = (pekerja as any)?.current_job 
    ?? pekerja?.riwayat_pekerja?.find((r: any) => !r.tgl_keluar && !['Sudah Berhenti','Kontrak Habis','PHK','Pensiun','Mengundurkan Diri','Tidak Bekerja'].includes(r.status_pekerjaan))
    ?? null;
  const hasHistory = pekerja?.riwayat_pekerja && pekerja.riwayat_pekerja.length > 0;
  const lastJob = (pekerja as any)?.latest_job ?? pekerja?.riwayat_pekerja?.[0] ?? null;

  const isActive     = !!activeJob;
  const isFormer     = !isActive && hasHistory;

  // Status Kerja
  const statusLabel = isActive
    ? (activeJob!.status_pekerjaan || 'Aktif Bekerja')
    : isFormer
      ? 'Tidak Aktif Bekerja'
      : 'Belum Ada Data Kerja';
  const statusSub = isActive
    ? `Sejak ${activeJob!.tgl_masuk ? new Date(activeJob!.tgl_masuk).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : '-'}`
    : isFormer
      ? `Terakhir: ${lastJob?.tgl_keluar ? new Date(lastJob.tgl_keluar).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : 'Tidak diketahui'}`
      : 'Isi riwayat pekerjaan Anda';
  const statusCls  = isActive ? 'text-blue-600 bg-blue-50' : isFormer ? 'text-amber-600 bg-amber-50' : 'text-slate-400 bg-slate-100';
  const statusTextCls = isActive ? 'text-blue-700' : isFormer ? 'text-amber-700' : 'text-slate-400';

  // Perusahaan
  const perusahaanVal = isActive
    ? (activeJob!.nama_perusahaan || 'Belum diisi')
    : isFormer
      ? (lastJob?.nama_perusahaan || 'Tidak diketahui')
      : '—';
  const perusahaanSub = isActive ? 'Saat ini' : isFormer ? 'Terakhir bekerja' : 'Belum ada riwayat';
  const perusahaanIsFormer = isFormer;

  // Jabatan
  const jabatanVal = isActive
    ? (activeJob!.jabatan || 'Belum diisi')
    : isFormer
      ? (lastJob?.jabatan || 'Tidak diketahui')
      : '—';
  const jabatanSub = isActive ? 'Posisi saat ini' : isFormer ? 'Posisi terakhir' : 'Belum ada riwayat';
  const jabatanIsFormer = isFormer;

  // Domisili
  const domisiliVal = pekerja?.domisili || '—';
  const domisiliSub = pekerja?.domisili ? 'Alamat terdaftar' : 'Belum diisi';

  const cards = [
    {
      icon: Briefcase,
      label: 'Status Kerja',
      value: statusLabel,
      sub: statusSub,
      iconCls: statusCls,
      textCls: statusTextCls,
      badge: isActive ? { text: 'AKTIF', cls: 'bg-blue-100 text-blue-700 border-blue-200' }
            : isFormer ? { text: 'MANTAN', cls: 'bg-amber-100 text-amber-700 border-amber-200' }
            : { text: 'BELUM ISI', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
    },
    {
      icon: Building2,
      label: 'Perusahaan',
      value: perusahaanVal,
      sub: perusahaanSub,
      iconCls: 'text-indigo-600 bg-indigo-50',
      textCls: perusahaanIsFormer ? 'text-amber-700' : perusahaanVal === '—' ? 'text-slate-300 italic' : 'text-slate-800',
      badge: perusahaanIsFormer ? { text: 'TERAKHIR', cls: 'bg-amber-100 text-amber-700 border-amber-200' } : null,
    },
    {
      icon: User2,
      label: 'Jabatan',
      value: jabatanVal,
      sub: jabatanSub,
      iconCls: 'text-rose-600 bg-rose-50',
      textCls: jabatanIsFormer ? 'text-amber-700' : jabatanVal === '—' ? 'text-slate-300 italic' : 'text-slate-800',
      badge: jabatanIsFormer ? { text: 'TERAKHIR', cls: 'bg-amber-100 text-amber-700 border-amber-200' } : null,
    },
    {
      icon: MapPin,
      label: 'Domisili',
      value: domisiliVal,
      sub: domisiliSub,
      iconCls: 'text-emerald-600 bg-emerald-50',
      textCls: domisiliVal === '—' ? 'text-slate-300 italic' : 'text-slate-800',
      badge: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <Card key={i} className="group rounded-[20px] border-slate-100 shadow-sm p-5 hover:shadow-md transition-all duration-300 bg-white">
          <div className="flex items-start justify-between mb-3">
            <div className={'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ' + c.iconCls}>
              <c.icon className="h-5 w-5" />
            </div>
            {c.badge && (
              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border tracking-wider ${c.badge.cls}`}>
                {c.badge.text}
              </span>
            )}
          </div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{c.label}</p>
          <p className={`text-sm font-bold break-words leading-snug ${c.textCls}`}>{c.value}</p>
          <p className="text-[9px] text-slate-400 font-medium mt-1 leading-relaxed">{c.sub}</p>
        </Card>
      ))}
    </div>
  );
}
