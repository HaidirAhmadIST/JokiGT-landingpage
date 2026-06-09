<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Perusahaan;
use App\Services\PekerjaService;
use Carbon\Carbon;

class DummyPendaftaranSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(PekerjaService $pekerjaService): void
    {
        $serikats = ['FSPMI', 'SP KEP', 'SPN', 'KSPI'];
        $perusahaans = [];

        // Buat 4 Perusahaan Berbeda
        for ($i = 0; $i < 4; $i++) {
            $perusahaans[] = Perusahaan::firstOrCreate(
                ['nama_perusahaan' => 'PT Dummy Perusahaan ' . ($i + 1)],
                [
                    'status_pendamping' => 'Dalam Pantauan',
                    'sektor_industri' => 'Manufaktur',
                    'alamat' => 'Kawasan Industri Cikarang Blok ' . chr(65 + $i)
                ]
            );
        }

        // 1. Buat 4 Akun Pengurus Serikat
        foreach ($serikats as $index => $namaSerikat) {
            $pengurusData = [
                'nama_lengkap' => 'Pengurus ' . $namaSerikat,
                'nik' => '999901111111000' . $index,
                'email' => 'admin.' . strtolower(str_replace(' ', '', $namaSerikat)) . '@dummy.com',
                'whatsapp' => '08100000000' . $index,
                'is_pengurus_serikat' => true,
                'is_anggota' => true,
                'serikat' => $namaSerikat,
                'nama_serikat' => $namaSerikat,
                'perusahaan_id' => $perusahaans[$index]->id,
                'password' => 'password123'
            ];
            $user = $pekerjaService->createOrUpdateUser($pengurusData);
            $pekerjaService->createOrUpdatePekerja($user, $pengurusData);
        }

        // 2. Buat 10 Anggota (Pekerja) untuk setiap Pengurus (Total 40 Akun)
        $datas = [];
        $counter = 1;

        foreach ($serikats as $index => $namaSerikat) {
            $perusahaan = $perusahaans[$index];

            for ($i = 0; $i < 10; $i++) {
                $datas[] = [
                    // Step 1: Base Data
                    'nama_lengkap' => 'Anggota ' . $namaSerikat . ' ' . ($i + 1),
                    'nik' => '32010111111100' . sprintf('%02d', $counter),
                    'is_anggota' => true,
                    'nama_serikat' => $namaSerikat,
                    'email' => 'anggota.' . strtolower(str_replace(' ', '', $namaSerikat)) . $i . '@dummy.com',
                    'whatsapp' => '0812222222' . sprintf('%02d', $counter),
                    'jenis_kelamin' => ($i % 2 == 0) ? 'L' : 'P',
                    'tanggal_lahir' => Carbon::now()->subYears(20 + $i)->format('Y-m-d'),
                    'domisili' => 'Jawa Barat, Bekasi',
                    'kabupaten' => 'Bekasi',
                    'kecamatan' => 'Cikarang',
                    'perusahaan_id' => $perusahaan->id,
                    'status_kesehatan' => ($i % 3 == 0) ? 'tidak_sehat' : 'sehat_dengan_catatan',
                    'password' => 'password123',
                    
                    // Step 2 & 3: Pekerjaan Saat Ini & Riwayat
                    'riwayat' => [
                        [
                            'nama_perusahaan' => $perusahaan->nama_perusahaan,
                            'bagian' => 'Produksi',
                            'jabatan' => 'Operator',
                            'tgl_masuk' => Carbon::now()->subYears(2)->format('Y-m-d'),
                            'status_pekerjaan' => 'Tetap',
                            'jenis_pajanan' => 'Faktor Kimia',
                            'informal_data' => [
                                'tugas_spesifik' => 'Mengoperasikan mesin produksi kimia',
                                'lama_bekerja' => '2',
                                'satuan_waktu' => 'Tahun',
                                'bpjs_bpu' => 'Ya',
                                'apd_disediakan' => 'Ya, namun tidak lengkap',
                                'deskripsi_pajanan' => 'Terpapar debu kimia setiap hari',
                            ]
                        ]
                    ],

                    // Step 4: Detail Medis / Riwayat Pemeriksaan
                    'riwayat_medis' => [
                        'keluhan_utama' => 'Sesak napas dan batuk ringan',
                        'golongan_darah' => ($i % 2 == 0) ? 'O' : 'A',
                        'riwayat_penyakit' => ['Asma ringan'],
                        'alergi' => ['Debu'],
                        'diagnosa_dokter' => 'Suspek ISPA akibat debu kimia'
                    ]
                ];
                $counter++;
            }
        }

        // Simpan Data Anggota
        foreach ($datas as $data) {
            $user = $pekerjaService->createOrUpdateUser($data);
            $pekerja = $pekerjaService->createOrUpdatePekerja($user, $data);
            
            if (isset($data['riwayat']) && is_array($data['riwayat'])) {
                $pekerjaService->syncRiwayatPekerja($pekerja, $data['riwayat']);
            }
            
            if (isset($data['riwayat_medis']) && is_array($data['riwayat_medis'])) {
                $pekerja->riwayatMedis()->updateOrCreate(
                    ['pekerja_id' => $pekerja->id],
                    $data['riwayat_medis']
                );
            }
        }
    }
}
