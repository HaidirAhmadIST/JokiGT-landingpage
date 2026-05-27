<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Perusahaan;
use App\Services\PekerjaService;

class LocalSimulationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(PekerjaService $pekerjaService): void
    {
        // 1. Buat Perusahaan
        $perusahaan1 = Perusahaan::firstOrCreate(['nama_perusahaan' => 'PT Maju Bersama'], ['status_pendamping' => 'Dalam Pantauan']);
        $perusahaan2 = Perusahaan::firstOrCreate(['nama_perusahaan' => 'PT Sejahtera Abadi'], ['status_pendamping' => 'Dalam Pantauan']);

        $serikats = ['FSPMI', 'SP KEP', 'SPN', 'KSPI', 'FSB KAMIPARHO'];

        // 2. Buat Akun Pengurus Serikat (1 untuk tiap serikat)
        foreach ($serikats as $index => $namaSerikat) {
            $pengurusData = [
                'nama_lengkap' => 'Pengurus ' . $namaSerikat,
                'nik' => '999901111111000' . $index,
                'email' => 'admin.' . strtolower(str_replace(' ', '', $namaSerikat)) . '@email.com',
                'whatsapp' => '08100000000' . $index,
                'is_pengurus_serikat' => true,
                'is_anggota' => true,
                'serikat' => $namaSerikat,
                'nama_serikat' => $namaSerikat,
                'perusahaan_id' => $index % 2 == 0 ? $perusahaan1->id : $perusahaan2->id,
                'password' => 'password'
            ];
            $user = $pekerjaService->createOrUpdateUser($pengurusData);
            $pekerjaService->createOrUpdatePekerja($user, $pengurusData);
        }

        // 3. Buat 10 Pekerja (5 di tiap perusahaan)
        $datas = [];
        $counter = 1;

        // PT Maju Bersama (5 Pekerja)
        for ($i = 0; $i < 5; $i++) {
            $serikat = $serikats[$i % count($serikats)];
            $datas[] = [
                'nama_lengkap' => 'Pekerja Maju ' . ($i + 1),
                'nik' => '32010111111100' . sprintf('%02d', $counter),
                'is_anggota' => true,
                'nama_serikat' => $serikat,
                'email' => 'pekerja.maju' . ($i + 1) . '@email.com',
                'whatsapp' => '0812222222' . sprintf('%02d', $counter),
                'jenis_kelamin' => ($i % 2 == 0) ? 'L' : 'P',
                'tanggal_lahir' => '1990-01-0' . ($i + 1),
                'domisili' => 'Jawa Barat, Bekasi',
                'perusahaan_id' => $perusahaan1->id,
                'status_kesehatan' => 'sehat_dengan_catatan',
                'password' => 'password',
                'riwayat_medis' => [
                    'keluhan_utama' => 'Keluhan pernapasan ringan',
                    'golongan_darah' => 'O',
                ],
                'riwayat' => [
                    [
                        'nama_perusahaan' => 'PT Maju Bersama',
                        'bagian' => 'Produksi',
                        'jabatan' => 'Operator',
                        'tgl_masuk' => '2020-01-01',
                        'status_pekerjaan' => 'Tetap',
                        'jenis_pajanan' => 'Faktor Kimia, Faktor Fisika',
                        'informal_data' => [
                            'deskripsi_pajanan' => 'Terpapar debu industri',
                        ]
                    ]
                ]
            ];
            $counter++;
        }

        // PT Sejahtera Abadi (5 Pekerja)
        for ($i = 0; $i < 5; $i++) {
            $serikat = $serikats[($i + 2) % count($serikats)];
            $datas[] = [
                'nama_lengkap' => 'Pekerja Sejahtera ' . ($i + 1),
                'nik' => '32010111111100' . sprintf('%02d', $counter),
                'is_anggota' => true,
                'nama_serikat' => $serikat,
                'email' => 'pekerja.sejahtera' . ($i + 1) . '@email.com',
                'whatsapp' => '0812222222' . sprintf('%02d', $counter),
                'jenis_kelamin' => ($i % 2 == 0) ? 'L' : 'P',
                'tanggal_lahir' => '1992-05-1' . ($i + 1),
                'domisili' => 'DKI Jakarta',
                'perusahaan_id' => $perusahaan2->id,
                'status_kesehatan' => 'tidak_sehat',
                'password' => 'password',
                'riwayat_medis' => [
                    'keluhan_utama' => 'Nyeri punggung bawah (Low Back Pain)',
                    'golongan_darah' => 'A',
                ],
                'riwayat' => [
                    [
                        'nama_perusahaan' => 'PT Sejahtera Abadi',
                        'bagian' => 'Gudang',
                        'jabatan' => 'Staf Logistik',
                        'tgl_masuk' => '2021-03-15',
                        'status_pekerjaan' => 'Kontrak',
                        'jenis_pajanan' => 'Faktor Ergonomi',
                        'informal_data' => [
                            'deskripsi_pajanan' => 'Mengangkat beban berat secara terus menerus',
                        ]
                    ]
                ]
            ];
            $counter++;
        }

        // Simpan Data
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
