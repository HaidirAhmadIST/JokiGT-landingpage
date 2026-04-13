'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, HardHat, Info, Shield } from 'lucide-react';

interface FormPekerjaInformalProps {
  isInformal: boolean;
  data: {
    tugas_spesifik: string;
    lama_bekerja: string;
    satuan_waktu: string;
    bpjs_bpu: string;
    apd_disediakan: string;
    jenis_apd_sendiri: string;
    lokasi_proyek: string[];
  };
  onChange: (field: string, value: any) => void;
}

export default function FormPekerjaInformal({ isInformal, data, onChange }: FormPekerjaInformalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Ensure at least 1 input exists when component is shown
  useEffect(() => {
    if (isInformal && (!data.lokasi_proyek || data.lokasi_proyek.length === 0)) {
      onChange('lokasi_proyek', ['']);
    }
  }, [isInformal, data.lokasi_proyek, onChange]);

  // Handle APD change to reset jenis_apd_sendiri if APD is always provided
  useEffect(() => {
    if (data.apd_disediakan === 'Ya, selalu') {
      onChange('jenis_apd_sendiri', '');
    }
  }, [data.apd_disediakan, onChange]);

  if (!mounted || !isInformal) return null;

  const handleLokasiChange = (index: number, value: string) => {
    const newLokasi = [...(data.lokasi_proyek || [''])];
    newLokasi[index] = value;
    onChange('lokasi_proyek', newLokasi);
  };

  const addLokasi = () => {
    const newLokasi = [...(data.lokasi_proyek || [''])];
    if (newLokasi.length < 3) {
      newLokasi.push('');
      onChange('lokasi_proyek', newLokasi);
    }
  };

  const removeLokasi = (index: number) => {
    const newLokasi = data.lokasi_proyek.filter((_, i) => i !== index);
    onChange('lokasi_proyek', newLokasi);
  };

  return (
    <div className="animate-in fade-in slide-in-from-top-4 duration-500 ease-out mt-6">
      <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white border border-gray-200 shadow-sm rounded-lg flex items-center justify-center">
              <HardHat className="w-6 h-6 text-gray-700" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">Formulir Pekerja Informal</CardTitle>
              <CardDescription className="text-sm text-gray-500 mt-1">
                Informasi khusus untuk Pekerja Borongan dan Harian Lepas
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 flex flex-col gap-6">
          {/* Tugas Spesifik */}
          <div className="space-y-2">
            <Label htmlFor="tugas_spesifik" className="text-gray-700 font-medium">
              Tugas spesifik di lapangan <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="tugas_spesifik"
              placeholder="Contoh: pemotong keramik, kuli angkut, tukang las"
              value={data.tugas_spesifik || ''}
              onChange={e => onChange('tugas_spesifik', e.target.value)}
              className="bg-white border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-colors h-11"
            />
          </div>

          {/* Lama Bekerja */}
          <div className="space-y-2">
            <Label htmlFor="lama_bekerja" className="text-gray-700 font-medium">
              Total durasi bekerja di bidang ini <span className="text-red-500 ml-1">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="lama_bekerja"
                type="number"
                min="1"
                placeholder="Misal: 10"
                value={data.lama_bekerja || ''}
                onChange={e => onChange('lama_bekerja', e.target.value)}
                className="bg-white border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-colors h-11"
              />
              <Select
                onValueChange={(val) => onChange('satuan_waktu', val)}
                value={data.satuan_waktu || 'Bulan'}
              >
                <SelectTrigger className="w-[120px] bg-white border-gray-300 h-11 focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                  <SelectValue placeholder="Satuan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bulan">Bulan</SelectItem>
                  <SelectItem value="Tahun">Tahun</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* BPJS Ketenagakerjaan BPU */}
          <div className="space-y-2">
            <Label className="text-gray-700 font-medium">Terdaftar BPJS Ketenagakerjaan (BPU)? <span className="text-red-500 ml-1">*</span></Label>
            <Select
              onValueChange={(val) => onChange('bpjs_bpu', val)}
              value={data.bpjs_bpu || ""}
            >
              <SelectTrigger className="bg-white border-gray-300 h-11 focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ya">Ya</SelectItem>
                <SelectItem value="Tidak">Tidak</SelectItem>
                <SelectItem value="Tidak Tahu">Tidak Tahu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lokasi Proyek Terakhir (Dynamic) */}
          <div className="space-y-4 p-5 rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-4">
              <div>
                <Label className="text-base font-bold text-gray-900">Lokasi Proyek Terakhir</Label>
                <p className="text-xs text-gray-500 mt-1">Sebutkan hingga 3 lokasi proyek terakhir tempat Anda bekerja</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                onClick={addLokasi}
                disabled={(data.lokasi_proyek?.length || 0) >= 3}
              >
                <Plus className="w-4 h-4 mr-1.5" /> Tambah Lokasi
              </Button>
            </div>

            <div className="space-y-3">
              {(data.lokasi_proyek || []).map((lokasi, index) => (
                <div key={index} className="flex items-start gap-3 animate-in fade-in slide-in-from-left-2">
                  <div className="flex-1">
                    <Input
                      placeholder={`Lokasi Proyek ${index + 1}`}
                      value={lokasi}
                      onChange={e => handleLokasiChange(index, e.target.value)}
                      className="bg-white border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-colors h-11"
                    />
                  </div>
                  {(data.lokasi_proyek?.length || 0) > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeLokasi(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-11 px-3"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Penggunaan APD */}
          <div className="space-y-4 p-5 rounded-xl bg-green-50 border border-green-200 shadow-sm">
            <div className="space-y-3">
              <Label className="flex items-center text-green-900 font-semibold">
                <Shield className="w-4 h-4 mr-2 text-green-600" />
                Apakah pemberi kerja menyediakan Alat Pelindung Diri (APD)? <span className="text-red-500 ml-1">*</span>
              </Label>
              <Select
                onValueChange={(val) => onChange('apd_disediakan', val)}
                value={data.apd_disediakan || ""}
              >
                <SelectTrigger className="bg-white border-green-300 h-11 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900">
                  <SelectValue placeholder="Pilih situasi penyediaan APD" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ya, selalu">Ya, selalu disediakan lengkap</SelectItem>
                  <SelectItem value="Kadang-kadang">Kadang-kadang / Tidak Lengkap</SelectItem>
                  <SelectItem value="Tidak pernah">Tidak pernah</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conditional APD Sendiri input */}
            {(data.apd_disediakan === 'Kadang-kadang' || data.apd_disediakan === 'Tidak pernah') && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 pt-4 border-t border-green-200/60">
                <div className="flex gap-2 text-sm text-green-800 mb-2 items-center bg-green-100/50 p-3 rounded-lg border border-green-200/50">
                  <Info className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>Karena APD tidak selalu disediakan, mohon isi jenis APD mandiri Anda.</span>
                </div>
                <Label htmlFor="jenis_apd_sendiri" className="text-green-900 font-medium">
                  Jenis APD yang digunakan sendiri <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="jenis_apd_sendiri"
                  placeholder="Misal: masker kain, sarung tangan karet, sepatu boot pribadi"
                  value={data.jenis_apd_sendiri || ''}
                  onChange={e => onChange('jenis_apd_sendiri', e.target.value)}
                  className="bg-white border-green-300 h-11 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-colors"
                />
              </div>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
