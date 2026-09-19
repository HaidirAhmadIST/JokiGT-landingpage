import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw, Plus, XCircle, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { HazardIdentification } from '@/components/registration/HazardIdentification';

interface ExposureModalProps {
  isOpen: boolean;
  onOpenChange: (val: boolean) => void;
  exposureForm: any;
  setExposureForm: (form: any) => void;
  handleUpdateExposure: (e: React.FormEvent) => void;
  exposureLoading: boolean;
}

export default function ExposureModal({
  isOpen, onOpenChange, exposureForm, setExposureForm, handleUpdateExposure, exposureLoading
}: ExposureModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[650px] rounded-[24px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-800">Edit Riwayat & Pajanan</DialogTitle>
          <DialogDescription className="text-xs font-medium text-slate-500">
            Perbarui detail pekerjaan dan informasi pajanan Anda untuk mempermudah deteksi PAK.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpdateExposure} className="space-y-6 py-4 max-h-[85vh] overflow-y-auto px-1">
          
          {/* Section 1: Informasi Dasar Pekerjaan */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2">Informasi Pekerjaan</h3>
            <div className="space-y-2">
              <Label htmlFor="perusahaan" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Perusahaan / Proyek</Label>
              <Input 
                id="perusahaan"
                className="rounded-xl bg-slate-50 border-slate-200 h-11 font-bold focus:ring-blue-500"
                value={exposureForm.nama_perusahaan}
                onChange={(e) => setExposureForm({...exposureForm, nama_perusahaan: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alamat_perusahaan" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alamat Perusahaan</Label>
              <Input 
                id="alamat_perusahaan"
                className="rounded-xl bg-slate-50 border-slate-200 h-11 font-bold focus:ring-blue-500"
                value={exposureForm.alamat_perusahaan}
                onChange={(e) => setExposureForm({...exposureForm, alamat_perusahaan: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jabatan" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jabatan</Label>
                <Input 
                  id="jabatan"
                  placeholder="Contoh: Welder, Admin..."
                  className="rounded-xl bg-slate-50 border-slate-200 h-11 font-bold focus:ring-blue-500"
                  value={exposureForm.jabatan}
                  onChange={(e) => setExposureForm({...exposureForm, jabatan: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bagian" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bagian / Departemen</Label>
                <Input 
                  id="bagian"
                  placeholder="Contoh: Logistik"
                  className="rounded-xl bg-slate-50 border-slate-200 h-11 font-bold focus:ring-blue-500"
                  value={exposureForm.bagian}
                  onChange={(e) => setExposureForm({...exposureForm, bagian: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lama_bekerja" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lama Bekerja (Thn)</Label>
                <Input 
                  id="lama_bekerja"
                  type="number"
                  placeholder="0"
                  className="rounded-xl bg-slate-50 border-slate-200 h-11 font-bold focus:ring-blue-500"
                  value={exposureForm.lama_bekerja}
                  onChange={(e) => setExposureForm({...exposureForm, lama_bekerja: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Kerja</Label>
                <Select 
                  value={exposureForm.status_pekerjaan} 
                  onValueChange={(v) => {
                    setExposureForm({
                      ...exposureForm, 
                      status_pekerjaan: v || '',
                      tgl_keluar: v === 'Outsourcing' ? '' : exposureForm.tgl_keluar
                    })
                  }}
                >
                  <SelectTrigger className="rounded-xl bg-slate-50 border-slate-200 h-11 font-bold focus:ring-blue-500">
                    <SelectValue placeholder="Pilih..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PKWTT">1. PKWTT (Pekerja Tetap)</SelectItem>
                    <SelectItem value="PKWT">2. PKWT (Pekerja Kontrak)</SelectItem>
                    <SelectItem value="Outsourcing">3. Pekerja Outsourcing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="masuk" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tgl Masuk</Label>
                <Input 
                  id="masuk"
                  type="date"
                  className="rounded-xl bg-slate-50 border-slate-200 h-11 font-bold focus:ring-blue-500"
                  value={exposureForm.tgl_masuk}
                  onChange={(e) => setExposureForm({...exposureForm, tgl_masuk: e.target.value})}
                />
              </div>
              {exposureForm.status_pekerjaan !== 'Outsourcing' && (
                <div className="space-y-2">
                  <Label htmlFor="keluar" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tgl Keluar (Opsional)</Label>
                  <Input 
                    id="keluar"
                    type="date"
                    className="rounded-xl bg-slate-50 border-slate-200 h-11 font-bold focus:ring-blue-500"
                    value={exposureForm.tgl_keluar}
                    onChange={(e) => setExposureForm({...exposureForm, tgl_keluar: e.target.value})}
                  />
                </div>
              )}
            </div>

            {exposureForm.status_pekerjaan === 'PKWT' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label htmlFor="tgl_selesai_kontrak" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tgl Selesai Kontrak</Label>
                  <Input 
                    id="tgl_selesai_kontrak"
                    type="date"
                    className="rounded-xl bg-slate-50 border-slate-200 h-11 font-bold focus:ring-blue-500"
                    value={exposureForm.tanggal_selesai_kontrak}
                    onChange={(e) => setExposureForm({...exposureForm, tanggal_selesai_kontrak: e.target.value})}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">BPJS Ketenagakerjaan</Label>
              <Select 
                value={exposureForm.bpjs_bpu} 
                onValueChange={(v) => setExposureForm({...exposureForm, bpjs_bpu: v || ''})}
              >
                <SelectTrigger className="rounded-xl bg-slate-50 border-slate-200 h-11 font-bold focus:ring-blue-500">
                  <SelectValue placeholder="Pilih Jenis BPJS" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PU">PU (Penerima Upah)</SelectItem>
                  <SelectItem value="BPU">BPU (Mandiri)</SelectItem>
                  <SelectItem value="Tidak Ada">Tidak Ada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {exposureForm.status_pekerjaan === 'Outsourcing' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in">
                <div className="space-y-2">
                  <Label htmlFor="agen_nama" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Pihak Ketiga</Label>
                  <Input 
                    id="agen_nama"
                    placeholder="Nama agensi penyalur"
                    className="rounded-xl bg-slate-50 border-slate-200 h-11 font-bold focus:ring-blue-500"
                    value={exposureForm.nama_agen_penyalur}
                    onChange={(e) => setExposureForm({...exposureForm, nama_agen_penyalur: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agen_alamat" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alamat Pihak Ketiga</Label>
                  <Input 
                    id="agen_alamat"
                    placeholder="Alamat kantor agensi"
                    className="rounded-xl bg-slate-50 border-slate-200 h-11 font-bold focus:ring-blue-500"
                    value={exposureForm.alamat_agen_penyalur}
                    onChange={(e) => setExposureForm({...exposureForm, alamat_agen_penyalur: e.target.value})}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="deskripsi" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deskripsi Pekerjaan / Tanggung Jawab</Label>
              <Textarea 
                id="deskripsi"
                placeholder="Jelaskan apa yang Anda kerjakan di posisi ini..."
                className="rounded-xl bg-slate-50 border-slate-200 min-h-[80px] font-bold focus:ring-blue-500 resize-none"
                value={exposureForm.deskripsi_pekerjaan}
                onChange={(e) => setExposureForm({...exposureForm, deskripsi_pekerjaan: e.target.value})}
              />
            </div>
          </div>

          {/* Section 2: Riwayat Mutasi Jabatan */}
          <div className="space-y-4 pt-4 border-t border-slate-100 mt-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <RefreshCw className="h-4 w-4 text-blue-500" /> Riwayat Mutasi Jabatan
              </Label>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold text-xs h-8"
                onClick={() => {
                  const mutasi = [...(exposureForm.mutasi_jabatan || [])];
                  mutasi.push({ bagian: '', jabatan: '', tahun_mulai: '', tahun_selesai: '', deskripsi_pekerjaan: '' });
                  setExposureForm({...exposureForm, mutasi_jabatan: mutasi});
                }}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Tambah Mutasi
              </Button>
            </div>
            
            {(!exposureForm.mutasi_jabatan || exposureForm.mutasi_jabatan.length === 0) ? (
              <div className="text-center py-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <p className="text-xs text-slate-400 font-medium">Belum ada riwayat mutasi jabatan.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {exposureForm.mutasi_jabatan.map((mut: any, mutIdx: number) => (
                  <div key={mutIdx} className="grid grid-cols-12 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60 items-end">
                    <div className="col-span-4 space-y-1">
                      <Label className="text-[9px] font-bold text-slate-500 uppercase">Bagian Baru</Label>
                      <Input 
                        placeholder="Logistik" className="h-9 bg-white text-xs"
                        value={mut.bagian} onChange={(e) => {
                          const m = [...exposureForm.mutasi_jabatan]; m[mutIdx].bagian = e.target.value;
                          setExposureForm({...exposureForm, mutasi_jabatan: m});
                        }}
                      />
                    </div>
                    <div className="col-span-3 space-y-1">
                      <Label className="text-[9px] font-bold text-slate-500 uppercase">Jabatan Baru</Label>
                      <Input 
                        placeholder="Admin" className="h-9 bg-white text-xs"
                        value={mut.jabatan} onChange={(e) => {
                          const m = [...exposureForm.mutasi_jabatan]; m[mutIdx].jabatan = e.target.value;
                          setExposureForm({...exposureForm, mutasi_jabatan: m});
                        }}
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-[9px] font-bold text-slate-500 uppercase">Thn Mulai</Label>
                      <Input 
                        placeholder="2020" className="h-9 bg-white text-xs text-center"
                        value={mut.tahun_mulai} onChange={(e) => {
                          const m = [...exposureForm.mutasi_jabatan]; m[mutIdx].tahun_mulai = e.target.value;
                          setExposureForm({...exposureForm, mutasi_jabatan: m});
                        }}
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-[9px] font-bold text-slate-500 uppercase">Thn Selesai</Label>
                      <Input 
                        placeholder="2024" className="h-9 bg-white text-xs text-center"
                        value={mut.tahun_selesai} onChange={(e) => {
                          const m = [...exposureForm.mutasi_jabatan]; m[mutIdx].tahun_selesai = e.target.value;
                          setExposureForm({...exposureForm, mutasi_jabatan: m});
                        }}
                      />
                    </div>
                    <div className="col-span-1 flex justify-center pb-0.5">
                      <Button 
                        type="button" variant="ghost" size="icon" 
                        className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50"
                        onClick={() => {
                          const m = exposureForm.mutasi_jabatan.filter((_: any, i: number) => i !== mutIdx);
                          setExposureForm({...exposureForm, mutasi_jabatan: m});
                        }}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="col-span-12 space-y-1 mt-1">
                      <Label className="text-[9px] font-bold text-slate-500 uppercase">Deskripsi</Label>
                      <Input 
                        placeholder="Deskripsi singkat" className="h-9 bg-white text-xs"
                        value={mut.deskripsi_pekerjaan || ''} onChange={(e) => {
                          const m = [...exposureForm.mutasi_jabatan]; m[mutIdx].deskripsi_pekerjaan = e.target.value;
                          setExposureForm({...exposureForm, mutasi_jabatan: m});
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Pajanan Bahaya */}
          <div className="space-y-4 pt-4 border-t border-slate-100 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <h3 className="text-sm font-bold text-slate-800">Pemetaan Pajanan Bahaya</h3>
            </div>
            
            <HazardIdentification
              value={exposureForm.jenis_pajanan}
              onChange={(val: string) => setExposureForm({ ...exposureForm, jenis_pajanan: val })}
              initialDetails={exposureForm.pajanan_details}
              onDetailsChange={(details: any) => setExposureForm({ ...exposureForm, pajanan_details: details })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="apd_dist" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">APD yang Disediakan Perusahaan</Label>
                <Input 
                  id="apd_dist"
                  placeholder="Contoh: Masker N95, Helm"
                  className="rounded-xl bg-slate-50 border-slate-200 h-11 font-bold focus:ring-blue-500"
                  value={exposureForm.apd_disediakan}
                  onChange={(e) => setExposureForm({...exposureForm, apd_disediakan: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apd_own" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">APD Bawaan Mandiri</Label>
                <Input 
                  id="apd_own"
                  placeholder="Contoh: Masker Kain sendiri"
                  className="rounded-xl bg-slate-50 border-slate-200 h-11 font-bold focus:ring-blue-500"
                  value={exposureForm.jenis_apd_sendiri}
                  onChange={(e) => setExposureForm({...exposureForm, jenis_apd_sendiri: e.target.value})}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-6 mt-4 border-t border-slate-100">
            <Button type="submit" disabled={exposureLoading} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-lg shadow-blue-100 transition-all">
              {exposureLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Simpan Data Riwayat & Pajanan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
