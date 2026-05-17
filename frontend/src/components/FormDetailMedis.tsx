'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { HeartPulse, Stethoscope } from 'lucide-react';

export interface RiwayatPemeriksaanItem {
  tanggal_pemeriksaan: string;
  tempat_pemeriksaan: string;
  tipe_lokasi: string; // 'Klinik Perusahaan' | 'Umum'
  penanggung_jawab: string; // 'Pribadi' | 'Perusahaan' | 'BPJS'
  alamat_pemeriksaan: string;
  jenis_pemeriksaan: string[];
  jenis_pemeriksaan_lainnya: string;
  dokter: string;
  status_kesehatan: string;
  hasil_diagnosis: string;
  rekomendasi: string;
  pendamping: string;
}

export interface DataMedis {
  keluhan_utama?: string;
  diagnosa_dokter?: string;
  golongan_darah: string;
  riwayat_penyakit: string;
  alergi: string;
  riwayat_operasi: string;
  obat_rutin: string;
  apd_disediakan?: string;
  jenis_apd_sendiri?: string;
  riwayat_pemeriksaan: RiwayatPemeriksaanItem[];
}

interface FormDetailMedisProps {
  data: DataMedis;
  onChange: (field: keyof DataMedis, value: any) => void;
}


export default function FormDetailMedis({ data, onChange }: FormDetailMedisProps) {
  
  // Safe defaults if data is not fully initialized
  const riwayat = data.riwayat_pemeriksaan || [];

  const addPemeriksaan = () => {
    onChange('riwayat_pemeriksaan', [
      ...riwayat,
      {
        tanggal_pemeriksaan: '',
        tempat_pemeriksaan: '',
        tipe_lokasi: 'Umum',
        penanggung_jawab: '',
        jenis_pemeriksaan: [] as string[],
        dokter: '',
        status_kesehatan: 'sehat',
        hasil_diagnosis: '',
        rekomendasi: '',
        file_hasil: [],
        pendamping: ''
      }
    ]);
  };

  const removePemeriksaan = (index: number) => {
    const newRiwayat = riwayat.filter((_, i) => i !== index);
    onChange('riwayat_pemeriksaan', newRiwayat);
  };

  const updatePemeriksaan = (index: number, field: keyof RiwayatPemeriksaanItem, value: any) => {
    const newRiwayat = [...riwayat];
    newRiwayat[index] = { ...newRiwayat[index], [field]: value };
    onChange('riwayat_pemeriksaan', newRiwayat);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 mt-6">
      
      {/* ---------------- BAGIAN 0: DIAGNOSA AWAL ---------------- */}
      <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white border border-gray-200 shadow-sm rounded-lg flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">Diagnosa Awal</CardTitle>
              <CardDescription className="text-sm text-gray-500 mt-1">
                Informasi keluhan utama yang dialami dan diagnosa medis (jika ada)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 flex flex-col gap-5">
          <div className="space-y-2">
            <Label htmlFor="keluhan_utama" className="text-gray-700 font-medium">
              Keluhan Utama / Apa yang Anda alami? <span className="text-red-500 ml-0.5">*</span>
            </Label>
            <Textarea
              id="keluhan_utama"
              placeholder="Ceritakan dengan singkat keluhan kesehatan atau gejala yang Anda alami..."
              className="bg-white border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 min-h-[100px] resize-none"
              value={data.keluhan_utama || ''}
              onChange={e => onChange('keluhan_utama', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="diagnosa_dokter" className="text-gray-700 font-medium">
              Diagnosa Dokter <span className="text-gray-400 text-xs italic font-normal">(Opsional)</span>
            </Label>
            <Textarea
              id="diagnosa_dokter"
              placeholder="Tuliskan diagnosa dari dokter jika Anda sudah pernah memeriksakan diri..."
              className="bg-white border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 min-h-[100px] resize-none"
              value={data.diagnosa_dokter || ''}
              onChange={e => onChange('diagnosa_dokter', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* ---------------- BAGIAN 1: DETAIL KESEHATAN BASELINE & GEJALA ---------------- */}
      <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white border border-gray-200 shadow-sm rounded-lg flex items-center justify-center">
              <HeartPulse className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">Riwayat Kesehatan & Gejala</CardTitle>
              <CardDescription className="text-sm text-gray-500 mt-1">
                Informasi baseline medis dan riwayat keluhan untuk penapisan PAK
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 flex flex-col gap-5">
          {/* Golongan Darah */}
          <div className="space-y-2">
            <Label className="text-gray-700 font-medium">
              Golongan Darah <span className="text-red-500 ml-1">*</span>
            </Label>
            <Select
              value={data.golongan_darah || ''}
              onValueChange={v => onChange('golongan_darah', v)}
            >
              <SelectTrigger className="bg-white border-gray-300 h-11 focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                <SelectValue placeholder="Pilih Golongan Darah" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="AB">AB</SelectItem>
                <SelectItem value="O">O</SelectItem>
                <SelectItem value="Tidak Tahu">Tidak Tahu</SelectItem>
              </SelectContent>
            </Select>
          </div>



          {/* Riwayat Penyakit — full width */}
          <div className="space-y-2">
            <Label htmlFor="riwayat_penyakit" className="text-gray-700 font-medium">
              Riwayat Penyakit Bawaan / Kronis <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="riwayat_penyakit"
              placeholder="Contoh: Asma, Hipertensi, Diabetes (Jika tidak ada, tulis 'Tidak ada')"
              className="bg-white border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 h-11"
              value={data.riwayat_penyakit || ''}
              onChange={e => onChange('riwayat_penyakit', e.target.value)}
            />
          </div>

          {/* Alergi — full width */}
          <div className="space-y-2">
            <Label htmlFor="alergi" className="text-gray-700 font-medium">
              Alergi Obat/Makanan/Debu <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="alergi"
              placeholder="Contoh: Udang, Penisilin (Jika tidak ada, tulis 'Tidak ada')"
              className="bg-white border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 h-11"
              value={data.alergi || ''}
              onChange={e => onChange('alergi', e.target.value)}
            />
          </div>

          {/* Riwayat Operasi — full width */}
          <div className="space-y-2">
            <Label htmlFor="riwayat_operasi" className="text-gray-700 font-medium">
              Riwayat Operasi <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="riwayat_operasi"
              placeholder="Contoh: Usus buntu, Patah tulang (Jika tidak ada, tulis 'Tidak ada')"
              className="bg-white border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 h-11"
              value={data.riwayat_operasi || ''}
              onChange={e => onChange('riwayat_operasi', e.target.value)}
            />
          </div>

          {/* Obat Rutin — full width */}
          <div className="space-y-2">
            <Label htmlFor="obat_rutin" className="text-gray-700 font-medium">
              Obat Rutin Yang Dikonsumsi <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="obat_rutin"
              placeholder="Contoh: Amlodipine, Inhaler (Jika tidak ada, tulis 'Tidak ada')"
              className="bg-white border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 h-11"
              value={data.obat_rutin || ''}
              onChange={e => onChange('obat_rutin', e.target.value)}
            />
          </div>
          {/* APD Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="apd_disediakan" className="text-gray-700 font-medium">
                APD yang Disediakan Perusahaan
              </Label>
              <Input
                id="apd_disediakan"
                placeholder="Contoh: Masker N95, Kacamata..."
                className="bg-white border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 h-11"
                value={data.apd_disediakan || ''}
                onChange={e => onChange('apd_disediakan', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jenis_apd_sendiri" className="text-gray-700 font-medium">
                APD yang Dibawa Mandiri
              </Label>
              <Input
                id="jenis_apd_sendiri"
                placeholder="Contoh: Masker kain sendiri..."
                className="bg-white border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 h-11"
                value={data.jenis_apd_sendiri || ''}
                onChange={e => onChange('jenis_apd_sendiri', e.target.value)}
              />
            </div>
          </div>

        </CardContent>
      </Card>

      {/* ---------------- BAGIAN 2: RIWAYAT PEMERIKSAAN / MCU ---------------- */}
      <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white border border-gray-200 shadow-sm rounded-lg flex items-center justify-center">
                <HeartPulse className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">Riwayat Pemeriksaan / MCU</CardTitle>
                <CardDescription className="text-sm text-gray-500 mt-1">
                  Tambahkan riwayat pemeriksaan kesehatan atau MCU yang pernah Anda jalani
                </CardDescription>
              </div>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addPemeriksaan}
              className="bg-white border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              Tambah Pemeriksaan
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {riwayat.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
              <p className="text-gray-400 text-sm">Belum ada riwayat pemeriksaan ditambahkan.</p>
              <Button 
                type="button" 
                variant="link" 
                onClick={addPemeriksaan}
                className="text-blue-500 font-bold mt-2"
              >
                Klik di sini untuk menambah
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {riwayat.map((m, idx) => (
                <div key={idx} className="relative p-5 border border-gray-200 rounded-xl bg-white shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="absolute top-4 right-4">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removePemeriksaan(idx)}
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 h-8 w-8 p-0"
                    >
                      ×
                    </Button>
                  </div>
                  
                  <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">
                      {idx + 1}
                    </span>
                    Pemeriksaan #{idx + 1}
                  </h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {/* Row 1: Tanggal & Tempat */}
                    <div className="space-y-2">
                      <Label className="text-gray-600">Tanggal Pemeriksaan</Label>
                      <Input 
                        type="date" 
                        value={m.tanggal_pemeriksaan || ''} 
                        onChange={e => updatePemeriksaan(idx, 'tanggal_pemeriksaan', e.target.value)}
                        className="bg-white border-gray-300 focus:ring-1 focus:ring-blue-500 h-10"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-gray-600">Tempat Pemeriksaan</Label>
                      <Input 
                        placeholder="Contoh: RS Siloam, Klinik Perusahaan" 
                        value={m.tempat_pemeriksaan || ''} 
                        onChange={e => updatePemeriksaan(idx, 'tempat_pemeriksaan', e.target.value)}
                        className="bg-white border-gray-300 focus:ring-1 focus:ring-blue-500 h-10"
                      />
                    </div>

                    {/* Row 2: Tipe Lokasi & Penanggung Jawab */}
                    <div className="space-y-2">
                      <Label className="text-gray-600">Fasilitas Kesehatan</Label>
                      <Select 
                        value={m.tipe_lokasi || 'Umum'} 
                        onValueChange={v => {
                          updatePemeriksaan(idx, 'tipe_lokasi', v);
                          if (v !== 'Klinik Perusahaan') updatePemeriksaan(idx, 'penanggung_jawab', '');
                        }}
                      >
                        <SelectTrigger className="bg-white border-gray-300 h-10">
                          <SelectValue placeholder="Pilih Tipe" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Umum">Umum (RS/Klinik/Puskesmas)</SelectItem>
                          <SelectItem value="Klinik Perusahaan">Klinik Perusahaan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-600">Opsi Pembiayaan</Label>
                      <Select 
                        value={m.penanggung_jawab || ''} 
                        onValueChange={v => updatePemeriksaan(idx, 'penanggung_jawab', v)}
                      >
                        <SelectTrigger className="bg-white border-gray-300 h-10">
                          <SelectValue placeholder="Pilih Pembiayaan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Mandiri">Mandiri</SelectItem>
                          <SelectItem value="BPJS">BPJS</SelectItem>
                          <SelectItem value="Perusahaan">Perusahaan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Row 3: Jenis Pemeriksaan (Full Width) */}
                    <div className="space-y-3 md:col-span-2 bg-gray-50/30 p-4 rounded-xl border border-gray-100 mt-2">
                      <Label className="text-gray-600 font-semibold">Jenis Pemeriksaan (Bisa pilih lebih dari satu)</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        {[
                          { id: 'MCU Berkala', label: 'Pemeriksaan Kesehatan Rutin (MCU)' },
                          { id: 'Rontgen Thorax', label: 'Rontgen Dada / Paru-paru' },
                          { id: 'Spirometri', label: 'Tes Pernapasan/Tiup Alat Paru-paru (Spirometri)' },
                          { id: 'Audiometri', label: 'Tes Pendengaran (Audiometri)' },
                          { id: 'Tes Darah/Lab', label: 'Tes Laboratorium (Darah/Urine)' },
                          { id: 'Lainnya', label: 'Lainnya (Sebutkan)' }
                        ].map((opt) => (
                          <div key={opt.id} className="flex items-start space-x-3 p-2.5 rounded-lg hover:bg-blue-50/50 transition-all border border-transparent hover:border-blue-100 group">
                            <Checkbox 
                              id={`jenis-${idx}-${opt.id}`}
                              checked={(m.jenis_pemeriksaan || []).includes(opt.id)}
                              onCheckedChange={(checked) => {
                                const current = m.jenis_pemeriksaan || [];
                                if (checked) {
                                  updatePemeriksaan(idx, 'jenis_pemeriksaan', [...current, opt.id]);
                                } else {
                                  updatePemeriksaan(idx, 'jenis_pemeriksaan', current.filter(item => item !== opt.id));
                                }
                              }}
                              className="mt-0.5 border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                            <Label 
                              htmlFor={`jenis-${idx}-${opt.id}`}
                              className="text-xs leading-snug cursor-pointer text-gray-700 font-medium group-hover:text-blue-700 transition-colors"
                            >
                              {opt.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                      
                      { (m.jenis_pemeriksaan || []).includes('Lainnya') && (
                        <Input 
                          placeholder="Sebutkan jenis pemeriksaan lainnya..." 
                          value={m.jenis_pemeriksaan_lainnya || ''} 
                          onChange={e => updatePemeriksaan(idx, 'jenis_pemeriksaan_lainnya', e.target.value)}
                          className="bg-white border-gray-300 h-10 mt-3 animate-in slide-in-from-top-1 duration-200"
                          autoFocus
                        />
                      )}
                    </div>

                    {/* Row 3: Alamat & Dokter */}
                    <div className="space-y-2">
                      <Label className="text-gray-600">Alamat Tempat Pemeriksaan</Label>
                      <Input 
                        placeholder="Alamat rumah sakit/klinik..." 
                        value={m.alamat_pemeriksaan || ''} 
                        onChange={e => updatePemeriksaan(idx, 'alamat_pemeriksaan', e.target.value)}
                        className="bg-white border-gray-300 focus:ring-1 focus:ring-blue-500 h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-600">Dokter yang Memeriksa</Label>
                      <Input 
                        placeholder="Nama dokter..." 
                        value={m.dokter || ''} 
                        onChange={e => updatePemeriksaan(idx, 'dokter', e.target.value)}
                        className="bg-white border-gray-300 focus:ring-1 focus:ring-blue-500 h-10"
                      />
                    </div>

                    {/* Row 4: Status & Pendamping */}
                    <div className="space-y-2">
                      <Label className="text-gray-600">Status Kesehatan</Label>
                      <Select 
                        value={m.status_kesehatan || 'sehat'} 
                        onValueChange={v => updatePemeriksaan(idx, 'status_kesehatan', v)}
                      >
                        <SelectTrigger className="bg-white border-gray-300 h-10">
                          <SelectValue placeholder="Pilih Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sehat">Sehat</SelectItem>
                          <SelectItem value="sehat_dengan_catatan">Sehat dengan Catatan</SelectItem>
                          <SelectItem value="tidak_sehat">Tidak Sehat</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-600">Pendamping / Penjamin</Label>
                      <Select 
                        value={m.pendamping || ''} 
                        onValueChange={v => updatePemeriksaan(idx, 'pendamping', v)}
                      >
                        <SelectTrigger className="bg-white border-gray-300 h-10">
                          <SelectValue placeholder="Pilih Pendamping" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Serikat">Serikat Pekerja / Buruh</SelectItem>
                          <SelectItem value="Dokter">Dokter / Petugas Medis</SelectItem>
                          <SelectItem value="Mandiri">Mandiri / Sendiri</SelectItem>
                          <SelectItem value="Lainnya">Lainnya (Sebutkan)</SelectItem>
                        </SelectContent>
                      </Select>
                      { (m.pendamping === 'Lainnya' || (m.pendamping && !['Serikat', 'Dokter', 'Mandiri'].includes(m.pendamping))) && (
                        <Input 
                          placeholder="Sebutkan pendamping lainnya..." 
                          value={m.pendamping === 'Lainnya' ? '' : m.pendamping} 
                          onChange={e => updatePemeriksaan(idx, 'pendamping', e.target.value)}
                          className="bg-white border-gray-300 h-10 mt-2 animate-in slide-in-from-top-1 duration-200"
                          autoFocus
                        />
                      )}
                    </div>

                    {/* Bottom: Rekomendasi (Full Width) */}
                    <div className="space-y-4 md:col-span-2 border-t border-gray-100 pt-4 mt-2">
                      <div className="space-y-2">
                        <Label className="text-gray-600">Rekomendasi / Saran Dokter</Label>
                        <Textarea 
                          placeholder="Saran tindak lanjut dari dokter..." 
                          value={m.rekomendasi || ''} 
                          onChange={e => updatePemeriksaan(idx, 'rekomendasi', e.target.value)}
                          className="bg-white border-gray-300 focus:ring-1 focus:ring-blue-500 min-h-[60px] resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
