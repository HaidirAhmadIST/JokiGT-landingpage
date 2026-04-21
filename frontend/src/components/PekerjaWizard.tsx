'use client';

import { useState } from 'react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from "@/components/ui/card";
import { toast } from 'sonner';
import { Check, ChevronRight, User, Briefcase, HeartPulse } from 'lucide-react';

interface PekerjaWizardProps {
  onSuccess: () => void;
  onCancel: () => void;
  perusahaanList: any[];
}

export default function PekerjaWizard({ onSuccess, onCancel, perusahaanList }: PekerjaWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pasFoto, setPasFoto] = useState<File | null>(null);
  
  // Step 1: Base Data
  const [baseData, setBaseData] = useState({
    nik: '',
    nama_lengkap: '',
    email: '',
    password: '',
    perusahaan_id: '',
    status_kesehatan: 'sehat',
    catatan_admin: ''
  });

  // Step 2: Riwayat Pekerjaan (Array)
  const [riwayat, setRiwayat] = useState<any[]>([
    { nama_perusahaan: '', deskripsi_usaha: '', bagian: '', deskripsi_pekerjaan: '', tgl_masuk: '', tgl_keluar: '', file_bukti: [] as File[] }
  ]);

  // Step 3: Detail Medis (Array)
  const [medis, setMedis] = useState<any[]>([
    { tgl_pemeriksaan: '', tempat_pemeriksa: '', jenis_pemeriksa: '', dokter_pemeriksa: '', hasil_diagnosis: '', file_hasil: [] as File[] }
  ]);

  const handleNext = () => setStep(step + 1);
  const handlePrev = () => setStep(step - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Filter out empty forms from arrays
      const filteredRiwayat = riwayat.filter(r => r.nama_perusahaan.trim() !== '');
      const filteredMedis = medis.filter(m => m.tgl_pemeriksaan.trim() !== '' && m.hasil_diagnosis.trim() !== '');

      const payload = {
        ...baseData,
        riwayat: filteredRiwayat,
        medis: filteredMedis
      };

      const response = await api.post('/pekerja', payload);
      toast.success('Pekerja berhasil didaftarkan.');
      
      const newPekerjaId = response.data.data.id;

      // Handle Pas Foto (Single)
      if (pasFoto) {
        const formData = new FormData();
        formData.append('pas_foto', pasFoto);
        await api.post(`/pekerja/${newPekerjaId}/foto`, formData);
      }

      // Handle Riwayat Files (Multiple -> PDF)
      const savedRiwayat = response.data.data.riwayat_pekerja || [];
      for (let i = 0; i < filteredRiwayat.length; i++) {
        if (filteredRiwayat[i].file_bukti && filteredRiwayat[i].file_bukti.length > 0) {
          const riwayatId = savedRiwayat[i]?.id;
          if (riwayatId) {
            const formData = new FormData();
            filteredRiwayat[i].file_bukti.forEach((file: File) => {
              formData.append('file_bukti[]', file);
            });
            await api.post(`/files/riwayat/${riwayatId}`, formData);
          }
        }
      }

      // Handle Medis Files (Multiple -> PDF)
      const savedMedis = response.data.data.detail_medis || [];
      for (let i = 0; i < filteredMedis.length; i++) {
        if (filteredMedis[i].file_hasil && filteredMedis[i].file_hasil.length > 0) {
          const medisId = savedMedis[i]?.id;
          if (medisId) {
            const formData = new FormData();
            filteredMedis[i].file_hasil.forEach((file: File) => {
              formData.append('file_hasil[]', file);
            });
            await api.post(`/files/medis/${medisId}`, formData);
          }
        }
      }

      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mendaftarkan pekerja. Pastikan NIK unik (16 digit) dan email belum terdaftar.');
      // If validation error, go back to step 1
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Stepper Header */}
      <div className="flex items-center justify-between mb-8 px-4">
        {[
          { icon: User, label: 'Data Dasar', num: 1 },
          { icon: Briefcase, label: 'Riwayat Kerja', num: 2 },
          { icon: HeartPulse, label: 'Detail Medis', num: 3 },
        ].map((s, i) => (
           <div key={s.num} className={`flex flex-col items-center ${step >= s.num ? 'text-primary' : 'text-slate-400'}`}>
             <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 mb-2 ${step >= s.num ? 'border-primary bg-primary/10' : 'border-slate-300'}`}>
               {step > s.num ? <Check className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
             </div>
             <span className="text-xs font-semibold">{s.label}</span>
           </div>
        ))}
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-1 pb-4">
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h3 className="font-semibold text-lg border-b pb-2">Identitas & Akun</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>NIK (16 Digit) *</Label>
                <Input value={baseData.nik} onChange={(e) => setBaseData({...baseData, nik: e.target.value})} maxLength={16} placeholder="e.g. 3201..." />
              </div>
              <div className="space-y-2">
                <Label>Nama Lengkap *</Label>
                <Input value={baseData.nama_lengkap} onChange={(e) => setBaseData({...baseData, nama_lengkap: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={baseData.email} onChange={(e) => setBaseData({...baseData, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input type="password" value={baseData.password} onChange={(e) => setBaseData({...baseData, password: e.target.value})} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Perusahaan *</Label>
                <Select value={baseData.perusahaan_id} onValueChange={(v: any) => setBaseData({...baseData, perusahaan_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Pilih Perusahaan Pendamping" /></SelectTrigger>
                  <SelectContent>
                    {perusahaanList.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.nama_perusahaan}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Status Kesehatan Awal *</Label>
                <Select value={baseData.status_kesehatan} onValueChange={(v: any) => setBaseData({...baseData, status_kesehatan: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sehat">Sehat</SelectItem>
                    <SelectItem value="sakit_ringan">Sehat dengan Catatan</SelectItem>
                    <SelectItem value="sakit_berat">Tidak Sehat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Pas Foto KTP (Opsional, Max 2MB, JPG/PNG)</Label>
                <Input type="file" accept="image/jpeg, image/png, image/jpg" onChange={(e) => setPasFoto(e.target.files?.[0] || null)} />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-semibold text-lg">Riwayat Pekerjaan</h3>
              <Button size="sm" variant="outline" onClick={() => setRiwayat([...riwayat, { nama_perusahaan: '', deskripsi_usaha: '', bagian: '', deskripsi_pekerjaan: '', tgl_masuk: '', tgl_keluar: '', file_bukti: [] }])}>
                + Tambah Riwayat
              </Button>
            </div>
            
            {riwayat.map((item, idx) => (
              <Card key={idx} className="relative">
                {riwayat.length > 1 && (
                   <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-red-500 h-6 w-6" 
                      onClick={() => setRiwayat(riwayat.filter((_, i) => i !== idx))}>
                      <X className="h-4 w-4" />
                   </Button>
                )}
                <CardContent className="pt-6 grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>Nama Perusahaan Sebelumnya</Label>
                    <Input value={item.nama_perusahaan} onChange={(e) => {
                      const newR = [...riwayat]; newR[idx].nama_perusahaan = e.target.value; setRiwayat(newR);
                    }} placeholder="Cth: PT Logam Terpadu" />
                  </div>
                  <div className="space-y-2">
                    <Label>Bagian/Posisi</Label>
                    <Input value={item.bagian} onChange={(e) => {
                      const newR = [...riwayat]; newR[idx].bagian = e.target.value; setRiwayat(newR);
                    }} placeholder="Operator Las" />
                  </div>
                  <div className="space-y-2">
                    <Label>Deskripsi Pekerjaan (Pajanan)</Label>
                    <Input value={item.deskripsi_usaha} onChange={(e) => {
                      const newR = [...riwayat]; newR[idx].deskripsi_usaha = e.target.value; setRiwayat(newR);
                    }} placeholder="Terpapar debu silika" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tanggal Masuk</Label>
                    <Input type="date" value={item.tgl_masuk} onChange={(e) => {
                      const newR = [...riwayat]; newR[idx].tgl_masuk = e.target.value; setRiwayat(newR);
                    }} />
                  </div>
                  <div className="space-y-2">
                    <Label>Tanggal Keluar</Label>
                    <Input type="date" value={item.tgl_keluar} onChange={(e) => {
                      const newR = [...riwayat]; newR[idx].tgl_keluar = e.target.value; setRiwayat(newR);
                    }} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Deskripsikan Pekerjaan Anda</Label>
                    <Input value={item.deskripsi_pekerjaan} onChange={(e) => {
                      const newR = [...riwayat]; newR[idx].deskripsi_pekerjaan = e.target.value; setRiwayat(newR);
                    }} placeholder="Jelaskan tugas dan tanggung jawab utama Anda..." />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Unggah Bukti Paklaring / Kontrak (Multiple)</Label>
                    <div className="flex items-center gap-3">
                      <Input type="file" multiple onChange={(e) => {
                        const files = e.target.files ? Array.from(e.target.files) : [];
                        const newR = [...riwayat]; newR[idx].file_bukti = files; setRiwayat(newR);
                      }} />
                      {item.file_bukti?.length > 0 && (
                        <span className="text-[10px] text-slate-500 italic truncate max-w-[150px]">
                          {item.file_bukti.length} file dipilih
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-semibold text-lg">Pemeriksaan Medis Awal</h3>
              <Button size="sm" variant="outline" onClick={() => setMedis([...medis, { tgl_pemeriksaan: '', tempat_pemeriksa: '', jenis_pemeriksa: '', dokter_pemeriksa: '', hasil_diagnosis: '', file_hasil: [] }])}>
                + Tambah Pemeriksaan
              </Button>
            </div>
            
            {medis.map((item, idx) => (
              <Card key={idx} className="relative">
                {medis.length > 1 && (
                   <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-red-500 h-6 w-6" 
                      onClick={() => setMedis(medis.filter((_, i) => i !== idx))}>
                      <X className="h-4 w-4" />
                   </Button>
                )}
                <CardContent className="pt-6 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tanggal Pemeriksaan</Label>
                    <Input type="date" value={item.tgl_pemeriksaan} onChange={(e) => {
                      const newM = [...medis]; newM[idx].tgl_pemeriksaan = e.target.value; setMedis(newM);
                    }} />
                  </div>
                  <div className="space-y-2">
                    <Label>Klinik / RS</Label>
                    <Input value={item.tempat_pemeriksa} onChange={(e) => {
                      const newM = [...medis]; newM[idx].tempat_pemeriksa = e.target.value; setMedis(newM);
                    }} placeholder="RS Paru Cisarua" />
                  </div>
                  <div className="space-y-2">
                    <Label>Jenis Pemeriksaan</Label>
                    <Input value={item.jenis_pemeriksa} onChange={(e) => {
                      const newM = [...medis]; newM[idx].jenis_pemeriksa = e.target.value; setMedis(newM);
                    }} placeholder="Rontgen / MCU" />
                  </div>
                  <div className="space-y-2">
                    <Label>Nama Dokter</Label>
                    <Input value={item.dokter_pemeriksa} onChange={(e) => {
                      const newM = [...medis]; newM[idx].dokter_pemeriksa = e.target.value; setMedis(newM);
                    }} placeholder="Dr. Sulis" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Hasil Diagnosis</Label>
                    <Input value={item.hasil_diagnosis} onChange={(e) => {
                      const newM = [...medis]; newM[idx].hasil_diagnosis = e.target.value; setMedis(newM);
                    }} placeholder="Suspek Silikosis" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Unggah Hasil Pemeriksaan (Multiple)</Label>
                    <div className="flex items-center gap-3">
                      <Input type="file" multiple onChange={(e) => {
                        const files = e.target.files ? Array.from(e.target.files) : [];
                        const newM = [...medis]; newM[idx].file_hasil = files; setMedis(newM);
                      }} />
                      {item.file_hasil?.length > 0 && (
                        <span className="text-[10px] text-slate-500 italic truncate max-w-[150px]">
                          {item.file_hasil.length} file dipilih
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="flex justify-between border-t pt-4 mt-auto">
        <Button variant="outline" onClick={step === 1 ? onCancel : handlePrev}>
          {step === 1 ? 'Batal' : 'Kembali'}
        </Button>
        {step < 3 ? (
          <Button onClick={handleNext}>
            Lanjut <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading} className="w-40">
            {loading ? 'Menyimpan...' : 'Selesai & Daftar'}
          </Button>
        )}
      </div>
    </div>
  );
}

// X icon for imports
function X(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  );
}
