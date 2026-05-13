<?php

namespace Database\Seeders;

use App\Models\Pekerja;
use App\Models\RiwayatPekerja;
use App\Models\DetailMedis;
use App\Models\User;
use App\Models\StatusAdvokasi;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class WorkerStressTestSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create User
        $user = User::create([
            'nama' => 'Slamet Riyadi',
            'email' => 'slamet.riyadi@example.com',
            'password' => Hash::make('password123'),
            'role' => 'viewer',
        ]);

        // 2. Create Pekerja
        $pekerja = Pekerja::create([
            'user_id' => $user->id,
            'nik' => '3271011102929999',
            'nama_lengkap' => 'Slamet Riyadi',
            'status_kesehatan' => 'sehat_dengan_catatan',
            'tanggal_lahir' => '1985-05-20',
            'jenis_kelamin' => 'L',
            'whatsapp' => '089988776655',
            'domisili' => 'Jawa Tengah',
        ]);

        StatusAdvokasi::create(['pekerja_id' => $pekerja->id]);

        $jobs = [
            [
                'nama' => 'PT Semen Indonesia',
                'bagian' => 'Produksi',
                'jabatan' => 'Operator Kiln',
                'masuk' => '2010-01-01',
                'keluar' => '2014-12-31',
                'pajanan' => 'Debu Silika, Panas',
                'mutasi' => [
                    ['bagian' => 'Packer', 'jabatan' => 'Operator', 'tahun' => '2010-2012'],
                    ['bagian' => 'Kiln Operation', 'jabatan' => 'Senior Operator', 'tahun' => '2013-2014'],
                ],
                'medis' => [
                    ['tgl' => '2011-05-10', 'hasil' => 'Fungsi Paru Normal', 'jenis' => 'Spirometri'],
                    ['tgl' => '2013-06-15', 'hasil' => 'Batuk Ringan, paparan debu', 'jenis' => 'MCU Berkala'],
                ]
            ],
            [
                'nama' => 'PT Pertamina (Persero)',
                'bagian' => 'Refining',
                'jabatan' => 'Technician',
                'masuk' => '2015-02-01',
                'keluar' => '2019-10-20',
                'pajanan' => 'Uap Benzena, Bising',
                'mutasi' => [
                    ['bagian' => 'Maintenance', 'jabatan' => 'Junior Tech', 'tahun' => '2015-2016'],
                    ['bagian' => 'Refinery Unit IV', 'jabatan' => 'Lead Technician', 'tahun' => '2017-2019'],
                ],
                'medis' => [
                    ['tgl' => '2016-11-20', 'hasil' => 'Audiometri normal', 'jenis' => 'Audiometri'],
                    ['tgl' => '2018-12-10', 'hasil' => 'Nilai Benzene dalam urin ambang batas', 'jenis' => 'Tes Darah/Lab'],
                ]
            ],
            [
                'nama' => 'PT Astra International',
                'bagian' => 'Assembly Line',
                'jabatan' => 'Team Leader',
                'masuk' => '2020-01-01',
                'keluar' => '2023-05-15',
                'pajanan' => 'Ergonomi, Getaran',
                'mutasi' => [
                    ['bagian' => 'Welding', 'jabatan' => 'Operator', 'tahun' => '2020-2021'],
                    ['bagian' => 'Painting', 'jabatan' => 'Foreman', 'tahun' => '2021-2022'],
                    ['bagian' => 'Final Inspection', 'jabatan' => 'Team Leader', 'tahun' => '2023'],
                ],
                'medis' => [
                    ['tgl' => '2021-03-05', 'hasil' => 'Nyeri punggung bawah (LBP)', 'jenis' => 'MCU Berkala'],
                    ['tgl' => '2022-04-12', 'hasil' => 'Rontgen thorax bersih', 'jenis' => 'Rontgen Thorax'],
                ]
            ],
            [
                'nama' => 'Apple Indonesia (HQ)',
                'bagian' => 'Operations',
                'jabatan' => 'Site Manager',
                'masuk' => '2023-06-01',
                'keluar' => null,
                'pajanan' => 'Psikososial, Stres Kerja',
                'mutasi' => [
                    ['bagian' => 'Logistik', 'jabatan' => 'Supervisor', 'tahun' => '2023-2024'],
                    ['bagian' => 'Operations Head', 'jabatan' => 'Site Manager', 'tahun' => '2024-Sekarang'],
                ],
                'medis' => [
                    ['tgl' => '2024-01-15', 'hasil' => 'Hipertensi grade 1', 'jenis' => 'MCU Berkala'],
                ]
            ]
        ];

        foreach ($jobs as $j) {
            $riwayat = RiwayatPekerja::create([
                'pekerja_id' => $pekerja->id,
                'nama_perusahaan' => $j['nama'],
                'bagian' => $j['bagian'],
                'jabatan' => $j['jabatan'],
                'tgl_masuk' => $j['masuk'],
                'tgl_keluar' => $j['keluar'],
                'status_pekerjaan' => 'PKWTT',
                'jenis_pajanan' => $j['pajanan'],
                'durasi_pajanan' => 5,
                'informal_data' => [
                    'mutasi_jabatan' => $j['mutasi'],
                    'apd_disediakan' => 'Masker N95, Earplug, Safety Shoes',
                ]
            ]);

            foreach ($j['medis'] as $m) {
                DetailMedis::create([
                    'pekerja_id' => $pekerja->id,
                    'riwayat_pekerja_id' => $riwayat->id,
                    'tgl_pemeriksaan' => $m['tgl'],
                    'hasil_diagnosis' => $m['hasil'],
                    'jenis_pemeriksa' => $m['jenis'],
                    'tempat_pemeriksa' => 'Klinik Utama Sehat',
                    'dokter_pemeriksa' => 'dr. Bambang, Sp.Ok',
                    'status_kesehatan' => 'sehat_dengan_catatan',
                ]);
            }
        }
    }
}
