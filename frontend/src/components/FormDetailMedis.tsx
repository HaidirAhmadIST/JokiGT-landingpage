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
  hasil_diagnosis: string;
  rekomendasi: string;
  file_hasil: File | null;
  pendamping: string;
}

export interface DataMedis {
  golongan_darah: string;
  rhesus: string;
  riwayat_penyakit: string;
  alergi: string;
  keluhan_kesehatan: string[];
  keluhan_parah_waktu: string;
  keluhan_membaik_libur: string;
  riwayat_merokok: string;
  riwayat_pemeriksaan: RiwayatPemeriksaanItem[];
}

interface FormDetailMedisProps {
  data: DataMedis;
  onChange: (field: keyof DataMedis, value: any) => void;
}

const KELUHAN_OPTIONS = [
  "Batuk kering kronis",
  "Sesak napas saat beraktivitas",
  "Nyeri dada",
  "Mengi",
  "Lainnya"
];

export default function FormDetailMedis({ data, onChange }: FormDetailMedisProps) {
  
  // Safe defaults if data is not fully initialized
  const riwayat = data.riwayat_pemeriksaan || [];
  const keluhanArray = data.keluhan_kesehatan || [];

  const handleKeluhanChange = (keluhan: string, checked: boolean) => {
    if (checked) {
      onChange('keluhan_kesehatan', [...keluhanArray, keluhan]);
    } else {
      onChange('keluhan_kesehatan', keluhanArray.filter(k => k !== keluhan));
    }
  };

  const addPemeriksaan = () => {
    onChange('riwayat_pemeriksaan', [
      ...riwayat,
      {
        tanggal_pemeriksaan: '',
        tempat_pemeriksaan: '',
        jenis_pemeriksaan: '',
        dokter: '',
        hasil_diagnosis: '',
        rekomendasi: '',
        file_hasil: null,
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
          {/* Golongan Darah & Rhesus — sejajar compact */}
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
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
            <div className="flex-1 space-y-2">
              <Label className="text-gray-700 font-medium">
                Rhesus <span className="text-red-500 ml-1">*</span>
              </Label>
              <Select
                value={data.rhesus || ''}
                onValueChange={v => onChange('rhesus', v)}
              >
                <SelectTrigger className="bg-white border-gray-300 h-11 focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                  <SelectValue placeholder="Pilih Rhesus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="+">Positif (+)</SelectItem>
                  <SelectItem value="-">Negatif (-)</SelectItem>
                  <SelectItem value="Tidak Tahu">Tidak Tahu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Riwayat Merokok — full width */}
          <div className="space-y-2">
            <Label className="text-gray-700 font-medium">
              Riwayat Merokok <span className="text-red-500 ml-1">*</span>
            </Label>
            <Select
              value={data.riwayat_merokok || ''}
              onValueChange={v => onChange('riwayat_merokok', v)}
            >
              <SelectTrigger className="bg-white border-gray-300 h-11 focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                <SelectValue placeholder="Pilih Status Merokok" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Aktif">Perokok Aktif</SelectItem>
                <SelectItem value="Pernah & Berhenti">Pernah & Sudah Berhenti</SelectItem>
                <SelectItem value="Tidak Pernah">Tidak Pernah</SelectItem>
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

          {/* ---- DIVIDER: Gejala PAK ---- */}
          <div className="space-y-5 border-t border-gray-100 pt-5">
            <h4 className="text-sm font-bold text-gray-900 border-l-4 border-red-500 pl-3 uppercase tracking-wide">
              Inspeksi Gejala Terkait Pekerjaan
            </h4>

            {/* Keluhan Checkbox — full width */}
            <div className="space-y-3">
              <Label className="text-gray-700 font-medium">
                Keluhan kesehatan dalam 6 bulan terakhir <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="flex flex-col gap-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                {KELUHAN_OPTIONS.map((keluhan, idx) => (
                  <div key={idx} className="flex items-center space-x-3">
                    <Checkbox
                      id={`keluhan-${idx}`}
                      checked={keluhanArray.includes(keluhan)}
                      onCheckedChange={(checked) => handleKeluhanChange(keluhan, !!checked)}
                      className="border-gray-400 data-[state=checked]:bg-blue-600"
                    />
                    <label
                      htmlFor={`keluhan-${idx}`}
                      className="text-sm font-medium cursor-pointer text-gray-700"
                    >
                      {keluhan}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Kapan paling parah — full width vertikal */}
            <div className="space-y-3">
              <Label className="text-gray-700 font-medium">
                Kapan keluhan terasa paling parah? <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="flex flex-col gap-2">
                {["Saat bekerja di lokasi", "Malam hari setelah bekerja", "Setiap saat"].map((option, idx) => (
                  <label key={idx} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-blue-50/60 transition-colors">
                    <input
                      type="radio"
                      name="keluhan_parah_waktu"
                      value={option}
                      checked={data.keluhan_parah_waktu === option}
                      onChange={(e) => onChange('keluhan_parah_waktu', e.target.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Membaik saat libur — full width vertikal */}
            <div className="space-y-3">
              <Label className="text-gray-700 font-medium">
                Apakah keluhan membaik jika Anda libur bekerja? <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="flex flex-col gap-2">
                {["Ya, membaik", "Tidak ada perubahan", "Semakin memburuk"].map((option, idx) => (
                  <label key={idx} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-blue-50/60 transition-colors">
                    <input
                      type="radio"
                      name="keluhan_membaik_libur"
                      value={option}
                      checked={data.keluhan_membaik_libur === option}
                      onChange={(e) => onChange('keluhan_membaik_libur', e.target.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
