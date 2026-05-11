'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { HeartPulse } from 'lucide-react';

export interface RiwayatPemeriksaanItem {
  tanggal_pemeriksaan: string;
  tempat_pemeriksaan: string;
  jenis_pemeriksaan: string;
  dokter: string;
  status_kesehatan: string;
  hasil_diagnosis: string;
  rekomendasi: string;
  file_hasil: File[];
  pendamping: string;
}

export interface DataMedis {
  golongan_darah: string;
  riwayat_penyakit: string;
  alergi: string;
  riwayat_operasi: string;
  obat_rutin: string;
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
        jenis_pemeriksaan: '',
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
      
      {/* ---------------- BAGIAN 1: DETAIL KESEHATAN BASELINE & GEJALA ---------------- */}
      <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white border border-gray-200 shadow-sm rounded-lg flex items-center justify-center">
              <HeartPulse className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">Detail Kesehatan & Gejala</CardTitle>
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

        </CardContent>
      </Card>

    </div>
  );
}
