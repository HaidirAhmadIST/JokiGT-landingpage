<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Perusahaan;
use App\Models\Serikat;
use App\Services\PekerjaService;
use Faker\Factory as Faker;

class ComprehensiveDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(PekerjaService $pekerjaService): void
    {
        $faker = Faker::create('id_ID');

        // Daftar 10 Perusahaan besar di Indonesia (Realistic Dummy)
        $companyData = [
            'PT Astra Honda Motor' => ['provinsi' => 'DKI Jakarta', 'kabupaten' => 'Jakarta Utara'],
            'PT Unilever Indonesia Tbk' => ['provinsi' => 'Jawa Barat', 'kabupaten' => 'Bekasi'],
            'PT Indofood CBP Sukses Makmur Tbk' => ['provinsi' => 'DKI Jakarta', 'kabupaten' => 'Jakarta Pusat'],
            'PT Telkom Indonesia (Persero) Tbk' => ['provinsi' => 'Jawa Barat', 'kabupaten' => 'Bandung'],
            'PT Bank Mandiri (Persero) Tbk' => ['provinsi' => 'DKI Jakarta', 'kabupaten' => 'Jakarta Selatan'],
            'PT Gudang Garam Tbk' => ['provinsi' => 'Jawa Timur', 'kabupaten' => 'Kediri'],
            'PT Kalbe Farma Tbk' => ['provinsi' => 'DKI Jakarta', 'kabupaten' => 'Jakarta Timur'],
            'PT United Tractors Tbk' => ['provinsi' => 'DKI Jakarta', 'kabupaten' => 'Jakarta Timur'],
            'PT PLN (Persero)' => ['provinsi' => 'DKI Jakarta', 'kabupaten' => 'Jakarta Selatan'],
            'PT Garuda Indonesia (Persero) Tbk' => ['provinsi' => 'Banten', 'kabupaten' => 'Tangerang']
        ];

        // Daftar nama serikat
        $serikatNames = [
            'FSPMI', 'SPN', 'KSPSI', 'KSPI', 'FSP FARKES', 'FPE', 'SBSI'
        ];

        $statusKesehatanOptions = ['sehat', 'sehat_dengan_catatan', 'tidak_sehat'];
        $bagianOptions = ['Produksi', 'Gudang', 'Maintenance', 'Distribusi', 'Logistik', 'QC', 'Operasional'];
        $jabatanOptions = ['Operator', 'Staf', 'Teknisi', 'Supervisor', 'Admin', 'Foreman'];
        
        $pajananList = [
            'Faktor Fisika',
            'Faktor Kimia',
            'Faktor Biologi',
            'Faktor Ergonomi',
            'Faktor Psikososial'
        ];

        foreach ($companyData as $companyName => $location) {
            $perusahaan = Perusahaan::updateOrCreate(
                ['nama_perusahaan' => $companyName],
                [
                    'status_pendamping' => 'Dalam Pantauan',
                    'provinsi' => $location['provinsi'],
                    'kabupaten' => $location['kabupaten']
                ]
            );

            // Generate 5 Pekerja untuk tiap Perusahaan
            for ($i = 0; $i < 5; $i++) {
                // 1 dari 5 pekerja (pekerja pertama) adalah pengurus serikat
                $isPengurus = ($i === 0);
                
                $gender = $faker->randomElement(['L', 'P']);
                $namaLengkap = $gender === 'L' ? $faker->firstNameMale . ' ' . $faker->lastName : $faker->firstNameFemale . ' ' . $faker->lastName;
                
                $domisili = $faker->state . ', ' . $faker->city . ', ' . $faker->streetAddress;
                $serikatName = $faker->randomElement($serikatNames);

                $statusSehat = $faker->randomElement($statusKesehatanOptions);
                $keluhanUtama = $statusSehat === 'tidak_sehat' ? $faker->sentence(8) : null;
                $diagnosisMedis = $statusSehat === 'sehat' ? 'Normal' : $faker->sentence(5);

                $data = [
                    'nama_lengkap' => $namaLengkap,
                    'nik' => $faker->nik,
                    'is_anggota' => true,
                    'is_pengurus_serikat' => $isPengurus,
                    'serikat' => $serikatName,
                    'nama_serikat' => $serikatName,
                    'email' => $faker->unique()->safeEmail,
                    'whatsapp' => '08' . $faker->randomNumber(8, true) . $faker->randomNumber(2, true),
                    'jenis_kelamin' => $gender,
                    'tanggal_lahir' => $faker->date('Y-m-d', '1995-01-01'),
                    'domisili' => $domisili,
                    'perusahaan_id' => $perusahaan->id,
                    'status_kesehatan' => $statusSehat,
                    'riwayat_medis' => [
                        'keluhan_utama' => $keluhanUtama,
                        'golongan_darah' => $faker->randomElement(['A', 'B', 'AB', 'O']),
                    ],
                    'medis' => [
                        [
                            'tanggal_pemeriksaan' => $faker->date('Y-m-d', 'now'),
                            'tempat_pemeriksaan' => 'Klinik ' . $faker->company,
                            'status_kesehatan' => $statusSehat,
                            'hasil_diagnosis' => $diagnosisMedis,
                            'rekomendasi' => $statusSehat === 'tidak_sehat' ? 'Perlu istirahat / pemeriksaan lanjutan' : 'Jaga kesehatan',
                        ]
                    ],
                    'riwayat' => [
                        [
                            'nama_perusahaan' => $companyName,
                            'bagian' => $faker->randomElement($bagianOptions),
                            'jabatan' => $faker->randomElement($jabatanOptions),
                            'tgl_masuk' => $faker->date('Y-m-d', '2022-01-01'),
                            'status_pekerjaan' => $faker->randomElement(['Tetap', 'Kontrak', 'Outsourcing']),
                            'informal_data' => [
                                'deskripsi_pajanan' => 'Pekerjaan berulang, target harian.',
                                'apd_disediakan' => 'Standar APD ' . $companyName,
                            ],
                            'jenis_pajanan' => $faker->randomElement($pajananList) . ', ' . $faker->randomElement($pajananList),
                        ]
                    ]
                ];

                // Create via service
                try {
                    $user = $pekerjaService->createOrUpdateUser($data);
                    $pekerja = $pekerjaService->createOrUpdatePekerja($user, $data);
                    
                    $embeddedMedis = [];
                    if (isset($data['riwayat']) && is_array($data['riwayat'])) {
                        $embeddedMedis = $pekerjaService->syncRiwayatPekerja($pekerja, $data['riwayat']);
                    }

                    $medisMandiri = isset($data['medis']) && is_array($data['medis']) ? $data['medis'] : [];
                    $pekerjaService->syncDetailMedis($pekerja, $medisMandiri, $embeddedMedis);

                    if (isset($data['riwayat_medis']) && is_array($data['riwayat_medis'])) {
                        $pekerja->riwayatMedis()->updateOrCreate(
                            ['pekerja_id' => $pekerja->id],
                            $data['riwayat_medis']
                        );
                    }
                } catch (\Exception $e) {
                    \Log::error('Error generating data in ComprehensiveDataSeeder: ' . $e->getMessage());
                }
            }
        }
    }
}
