'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Activity, HardHat, Gavel, Coins, Stethoscope, FileText, Scale, HeartPulse, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { useRole } from '@/hooks/useRole';

interface SheetEditKasusProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
    id?: number;
    pekerja_id: number;
    jenis_kasus?: string;
    tahap?: string;
    status_detail?: string;
    tanggal_pelaporan?: string;
    catatan?: string;
    riwayat_pajanan?: boolean | number;
    persetujuan_dokter?: boolean | number;
    perusahaan_lapor?: boolean | number;
    penetapan_pak?: boolean | number;
    kompensasi_bpjstk?: boolean | number;
    rehabilitasi_bpjskes?: boolean | number;
  };
  onSuccess: () => void;
}

interface AdminAdvokasiFormData {
  jenis_kasus: string;
  tahap: string;
  status_detail: string;
  tanggal_pelaporan: string;
  catatan: string;
  riwayat_pajanan: boolean;
  persetujuan_dokter: boolean;
  perusahaan_lapor: boolean;
  penetapan_pak: boolean;
  kompensasi_bpjstk: boolean;
  rehabilitasi_bpjskes: boolean;
}

export default function SheetEditKasus({ open, onOpenChange, data, onSuccess }: SheetEditKasusProps) {
  const { user, isSuperAdmin } = useRole();
  const [changeReason, setChangeReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<AdminAdvokasiFormData>({
    jenis_kasus: '',
    tahap: '',
    status_detail: '',
    tanggal_pelaporan: '',
    catatan: '',
    riwayat_pajanan: false,
    persetujuan_dokter: false,
    perusahaan_lapor: false,
    penetapan_pak: false,
    kompensasi_bpjstk: false,
    rehabilitasi_bpjskes: false,
  });

  useEffect(() => {
    if (data) {
      setFormData({
        jenis_kasus: data.jenis_kasus?.toUpperCase() || '',
        tahap: data.tahap || '',
        status_detail: data.status_detail || '',
        tanggal_pelaporan: data.tanggal_pelaporan ? data.tanggal_pelaporan.split('T')[0] : '',
        catatan: data.catatan || '',
        riwayat_pajanan: !!data.riwayat_pajanan,
        persetujuan_dokter: !!data.persetujuan_dokter,
        perusahaan_lapor: !!data.perusahaan_lapor,
        penetapan_pak: !!data.penetapan_pak,
        kompensasi_bpjstk: !!data.kompensasi_bpjstk,
        rehabilitasi_bpjskes: !!data.rehabilitasi_bpjskes,
      });
    }
  }, [data, open]);

  const milestones = [
    { key: 'riwayat_pajanan', label: 'Bukti Pajanan', icon: Search },
    { key: 'persetujuan_dokter', label: 'Evaluasi Medis', icon: Stethoscope },
    { key: 'perusahaan_lapor', label: 'Laporan Perusahaan', icon: FileText },
    { key: 'penetapan_pak', label: 'Penetapan PAK', icon: Scale },
    { key: 'kompensasi_bpjstk', label: 'Santunan JKK', icon: Coins },
    { key: 'rehabilitasi_bpjskes', label: 'Rehabilitasi', icon: HeartPulse },
  ];

  const caseTypes = [
    { id: 'PAK', label: 'PAK (Penyakit Kerja)', icon: Activity, desc: 'Penyakit akibat lingkungan kerja', color: 'text-rose-500', bg: 'bg-rose-50' },
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.jenis_kasus) {
      toast.error('Mohon pilih jenis kasus.');
      return;
    }

    if (!isSuperAdmin) {
      if (!changeReason.trim()) {
        toast.error('Alasan mengubah data wajib diisi sebagai Admin Staff.');
        return;
      }
      setIsSubmitting(true);
      try {
        await api.post('/approval-requests', {
          action: 'UPDATE',
          model_type: 'StatusAdvokasi',
          model_id: data.id,
          payload: formData,
          reason: changeReason
        });
        
        toast.success('Permintaan perubahan detail kasus telah dikirim ke Superadmin untuk persetujuan.');
        setChangeReason('');
        onSuccess();
        onOpenChange(false);
      } catch (err: unknown) {
        let errorMessage = 'Gagal mengajukan permohonan perubahan.';
        if (axios.isAxiosError(err)) {
          errorMessage = err.response?.data?.message || errorMessage;
        }
        toast.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const resp = await api.post(`/pekerja/${data.pekerja_id}/advokasi`, formData);
      if (resp.data.status === 'success') {
        toast.success('Perubahan berhasil disimpan.');
        onSuccess();
        onOpenChange(false);
      }
    } catch (err: unknown) {
      let errorMessage = 'Gagal menyimpan perubahan.';
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl p-0 overflow-hidden flex flex-col bg-white border-l shadow-2xl">
        <SheetHeader className="px-8 py-6 border-b border-slate-100 bg-white z-10">
          <SheetTitle className="text-xl font-bold text-slate-900">Edit Detail Kasus</SheetTitle>
          <SheetDescription className="mt-1 text-slate-500">
            Perbarui informasi utama dan status progres kasus advokasi ini.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          <form id="edit-advokasi-form" className="space-y-8 pb-4">
            
            {/* Section 01: Milestone Checklist — NEW */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-[#10b981] text-white text-[10px] font-bold">✓</span>
                <h3 className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest">CHECKLIST MILESTONE</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {milestones.map((m, i) => {
                  const Icon = m.icon;
                  // @ts-expect-error key access on object
                  const checked = formData[m.key];
                  return (
                    <div 
                      key={m.key} 
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                        checked ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-100 hover:border-slate-200"
                      )}
                      onClick={() => setFormData({ ...formData, [m.key]: !checked })}
                    >
                      <Checkbox 
                        id={m.key} 
                        checked={checked}
                        onCheckedChange={(v) => setFormData({ ...formData, [m.key]: !!v })}
                        className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                      />
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("text-[9px] font-black px-1 rounded-sm border", checked ? "bg-emerald-100 text-emerald-600 border-emerald-200" : "bg-slate-50 text-slate-400 border-slate-100")}>
                            0{i + 1}
                          </span>
                          <Label htmlFor={m.key} className="text-xs font-bold text-slate-700 cursor-pointer truncate">{m.label}</Label>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Icon className={cn("h-3 w-3", checked ? "text-emerald-500" : "text-slate-400")} />
                          <span className={cn("text-[10px] font-medium", checked ? "text-emerald-600" : "text-slate-400")}>
                            {checked ? 'Selesai' : 'Belum'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 02: Kasus */}
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-[#0ea5e9] text-white text-[10px] font-bold">01</span>
                <h3 className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest">JENIS KASUS</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {caseTypes.map((type) => {
                  const Icon = type.icon;
                  const isActive = formData.jenis_kasus === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, jenis_kasus: type.id })}
                      className={cn(
                        "flex flex-col items-start p-4 rounded-[16px] border-2 text-left transition-all duration-200",
                        isActive
                          ? "border-[#0ea5e9] bg-[#f0f9ff] ring-1 ring-[#0ea5e9]/20 shadow-sm"
                          : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <div className={cn("p-2 rounded-lg mb-3", type.bg, type.color)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className={cn("text-sm font-bold block", isActive ? "text-[#0369a1]" : "text-slate-700")}>
                        {type.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 02: Progres */}
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-[#0ea5e9] text-white text-[10px] font-bold">02</span>
                <h3 className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest">STATUS PROGRES</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-600">TAHAP SAAT INI</Label>
                  <Select 
                    value={formData.tahap} 
                    onValueChange={(v) => setFormData({ ...formData, tahap: v || '' })}
                  >
                    <SelectTrigger className="h-11 bg-slate-50/50 border-slate-200 focus:ring-[#0ea5e9]">
                      <SelectValue placeholder="Pilih Tahap" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UPTD">UPTD</SelectItem>
                      <SelectItem value="BPJS">BPJS (MEDIATOR)</SelectItem>
                      <SelectItem value="Pengadilan">PENGADILAN (COURT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-600">STATUS DETAIL</Label>
                  <Select 
                    value={formData.status_detail} 
                    onValueChange={(v) => setFormData({ ...formData, status_detail: v || '' })}
                  >
                    <SelectTrigger className="h-11 bg-slate-50/50 border-slate-200 focus:ring-[#0ea5e9]">
                      <SelectValue placeholder="Pilih Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Verifikasi Dokumen">Verifikasi Dokumen</SelectItem>
                      <SelectItem value="DALAM PROSES">Dalam Proses</SelectItem>
                      <SelectItem value="Pemeriksaan Berkas">Pemeriksaan Berkas</SelectItem>
                      <SelectItem value="Mediasi 1">Mediasi 1</SelectItem>
                      <SelectItem value="Mediasi 2">Mediasi 2</SelectItem>
                      <SelectItem value="Menunggu Putusan">Menunggu Putusan</SelectItem>
                      <SelectItem value="SELESAI">Selesai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Section 03: Dokumentasi */}
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-[#0ea5e9] text-white text-[10px] font-bold">03</span>
                <h3 className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest">CATATAN & TANGGAL</h3>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-600">TANGGAL PELAPORAN</Label>
                <Input 
                  type="date" 
                  className="h-11 bg-slate-50/50 border-slate-200 focus-visible:ring-[#0ea5e9]"
                  value={formData.tanggal_pelaporan} 
                  onChange={(e) => setFormData({ ...formData, tanggal_pelaporan: e.target.value })} 
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-600">CATATAN UPDATE KASUS</Label>
                <Textarea 
                  placeholder="Berikan ringkasan progres atau catatan penting..." 
                  className="min-h-[120px] resize-none bg-slate-50/50 border-slate-200 focus-visible:ring-[#0ea5e9]"
                  value={formData.catatan} 
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })} 
                />
              </div>
            </div>

            {/* Section 04: Approval Request (Only for Admin Staff) */}
            {!isSuperAdmin && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-amber-500 text-white text-[10px] font-bold">!</span>
                  <h3 className="text-xs font-bold text-amber-600 uppercase tracking-widest">Pengajuan Persetujuan</h3>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-600 uppercase">Alasan Mengubah Data (Wajib)</Label>
                  <Textarea 
                    placeholder="Berikan penjelasan mengapa Anda ingin mengubah detail kasus ini kepada Superadmin..." 
                    className="min-h-[80px] bg-amber-50/20 border-amber-200 focus-visible:ring-amber-500 rounded-xl"
                    value={changeReason} 
                    onChange={(e) => setChangeReason(e.target.value)} 
                  />
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                    Sebagai Admin Staff, Anda memerlukan persetujuan dari Superadmin untuk memodifikasi detail kasus advokasi ini.
                  </p>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="border-t border-slate-100 p-6 bg-slate-50/50 flex flex-col gap-3">
          <Button 
            type="submit" 
            onClick={handleSave} 
            disabled={isSubmitting} 
            className="w-full h-12 text-sm font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="w-full h-12 text-sm font-bold bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
          >
            Batal
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
