<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Perusahaan;
use App\Models\Serikat;
use App\Services\PekerjaService;

class TestingPendaftaranSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(PekerjaService $pekerjaService): void
    {
        // Pastikan ada Perusahaan dan Serikat untuk referensi
        $perusahaan1 = Perusahaan::firstOrCreate(['nama_perusahaan' => 'PT Kimia Farma'], ['status_pendamping' => 'Dalam Pantauan']);
        $perusahaan2 = Perusahaan::firstOrCreate(['nama_perusahaan' => 'PT Pan Brothers Tbk'], ['status_pendamping' => 'Dalam Pantauan']);
        $perusahaan3 = Perusahaan::firstOrCreate(['nama_perusahaan' => 'PT Waskita Karya'], ['status_pendamping' => 'Dalam Pantauan']);
        $perusahaan4 = Perusahaan::firstOrCreate(['nama_perusahaan' => 'RSUD Dr. Soetomo'], ['status_pendamping' => 'Dalam Pantauan']);
        $perusahaan5 = Perusahaan::firstOrCreate(['nama_perusahaan' => 'PT Kaltim Prima Coal'], ['status_pendamping' => 'Dalam Pantauan']);

        // Data 1: Pekerja Pabrik Kimia dengan Riwayat Ganda
        $data1 = [
            'nama_lengkap' => 'Budi Santoso',
            'nik' => '3201011234560001',
            'is_anggota' => true,
            'nama_serikat' => 'FSPMI',
            'email' => 'budi.santoso@email.com',
            'whatsapp' => '081234567001',
            'jenis_kelamin' => 'L',
            'tanggal_lahir' => '1985-08-15',
            'domisili' => 'Jawa Barat, Kab. Bekasi, Cikarang Barat, Jl. Industri Raya No 10, RT 01 RW 02',
            'perusahaan_id' => $perusahaan1->id,
            'status_kesehatan' => 'tidak_sehat',
            'riwayat_medis' => [
                'keluhan_utama' => 'Sering sesak napas saat bekerja dan batuk kering di malam hari.',
                'riwayat_penyakit' => ['Asma ringan'],
                'golongan_darah' => 'O',
            ],
            'medis' => [
                [
                    'tanggal_pemeriksaan' => '2026-01-10',
                    'tempat_pemeriksaan' => 'Klinik Perusahaan PT Kimia Farma',
                    'status_kesehatan' => 'tidak_sehat',
                    'hasil_diagnosis' => 'Suspek Asma Akibat Kerja',
                    'rekomendasi' => 'Pindah ke area non-produksi.',
                ],
                [
                    'tanggal_pemeriksaan' => '2025-01-15',
                    'tempat_pemeriksaan' => 'RSUD Bekasi',
                    'status_kesehatan' => 'sehat_dengan_catatan',
                    'hasil_diagnosis' => 'Iritasi saluran pernapasan atas.',
                ]
            ],
            'riwayat' => [
                [
                    'nama_perusahaan' => 'PT Kimia Farma',
                    'bagian' => 'Produksi',
                    'jabatan' => 'Operator Reaktor',
                    'tgl_masuk' => '2020-02-01',
                    'status_pekerjaan' => 'Tetap',
                    'informal_data' => [
                        'deskripsi_pajanan' => 'Terpapar uap kimia saat membuka katup reaktor 3 kali sehari.',
                        'apd_disediakan' => 'Masker Respirator N95, Kacamata Safety, Sarung Tangan Karet',
                        'training_k3' => 'Ya, Pelatihan B3 2023',
                    ],
                    'jenis_pajanan' => 'Faktor Kimia, Faktor Fisika',
                ],
                [
                    'nama_perusahaan' => 'PT Petrokimia Gresik',
                    'bagian' => 'Gudang Bahan Baku',
                    'jabatan' => 'Staf Logistik',
                    'tgl_masuk' => '2015-01-01',
                    'tanggal_selesai_kontrak' => '2019-12-31',
                ]
            ]
        ];

        // Data 2: Pengurus Serikat Sektor Garmen
        $data2 = [
            'nama_lengkap' => 'Siti Aminah',
            'nik' => '3173051234560002',
            'is_anggota' => true,
            'is_pengurus_serikat' => true,
            'serikat' => 'SPN',
            'nama_serikat' => 'SPN',
            'email' => 'siti.aminah.spn@email.com',
            'whatsapp' => '081234567002',
            'jenis_kelamin' => 'P',
            'tanggal_lahir' => '1990-05-20',
            'domisili' => 'DKI Jakarta, Jakarta Barat, Cengkareng, Jl. Kapuk Raya, RT 05 RW 03',
            'perusahaan_id' => $perusahaan2->id,
            'status_kesehatan' => 'tidak_sehat',
            'riwayat_medis' => [
                'keluhan_utama' => 'Nyeri punggung bawah (Low Back Pain) dan mata sering berair.',
                'golongan_darah' => 'A',
            ],
            'medis' => [
                [
                    'tanggal_pemeriksaan' => '2026-02-05',
                    'tempat_pemeriksaan' => 'Puskesmas Cengkareng',
                    'status_kesehatan' => 'tidak_sehat',
                    'hasil_diagnosis' => 'Low Back Pain akut akibat postur kerja.',
                    'rekomendasi' => 'Fisioterapi rutin dan perbaikan kursi kerja ergonomis.',
                ]
            ],
            'riwayat' => [
                [
                    'nama_perusahaan' => 'PT Pan Brothers Tbk',
                    'bagian' => 'Sewing',
                    'jabatan' => 'Operator Mesin Jahit',
                    'tgl_masuk' => '2016-10-10',
                    'status_pekerjaan' => 'Tetap',
                    'informal_data' => [
                        'deskripsi_pajanan' => 'Menjahit kerah kemeja dengan target 500 pcs/hari. Posisi duduk statis.',
                        'apd_disediakan' => 'Masker kain',
                    ],
                    'jenis_pajanan' => 'Faktor Fisika, Faktor Ergonomi, Faktor Biologi',
                ]
            ]
        ];

        // Data 3: Pekerja Konstruksi Outsourcing
        $data3 = [
            'nama_lengkap' => 'Andi Pratama',
            'nik' => '3374011234560003',
            'is_anggota' => false,
            'whatsapp' => '081234567003',
            'jenis_kelamin' => 'L',
            'tanggal_lahir' => '1988-12-12',
            'domisili' => 'Jawa Tengah, Kota Semarang, Pedurungan, Jl. Majapahit No 99',
            'perusahaan_id' => $perusahaan3->id,
            'status_kesehatan' => 'tidak_sehat',
            'riwayat_medis' => [
                'keluhan_utama' => 'Mata kabur permanen pada sore hari (Photokeratitis).',
                'golongan_darah' => 'B',
            ],
            'medis' => [
                [
                    'tanggal_pemeriksaan' => '2026-03-20',
                    'tempat_pemeriksaan' => 'Klinik Mata Nusantara Semarang',
                    'status_kesehatan' => 'tidak_sehat',
                    'hasil_diagnosis' => 'Kerusakan retina ringan akibat radiasi UV berlebih.',
                ]
            ],
            'riwayat' => [
                [
                    'nama_perusahaan' => 'PT Waskita Karya',
                    'bagian' => 'Sipil',
                    'jabatan' => 'Tukang Las',
                    'status_pekerjaan' => 'Outsourcing',
                    'nama_agen_penyalur' => 'PT Sumber Daya Mandiri',
                    'tgl_masuk' => '2024-06-01',
                    'tanggal_selesai_kontrak' => '2026-12-31',
                    'informal_data' => [
                        'deskripsi_pajanan' => 'Mengelas kerangka baja di ketinggian lantai 10.',
                        'apd_disediakan' => 'Topeng Las, Sarung Tangan Kulit, Full Body Harness',
                    ],
                ]
            ]
        ];

        // Data 4: Perawat Rumah Sakit
        $data4 = [
            'nama_lengkap' => 'dr. Rina Melati',
            'nik' => '3578011234560004',
            'is_anggota' => true,
            'nama_serikat' => 'FSP FARKES',
            'email' => 'rina.perawat@email.com',
            'whatsapp' => '081234567004',
            'jenis_kelamin' => 'P',
            'tanggal_lahir' => '1992-03-30',
            'domisili' => 'Jawa Timur, Kota Surabaya, Gubeng, Jl. Dharmawangsa',
            'perusahaan_id' => $perusahaan4->id,
            'status_kesehatan' => 'sehat_dengan_catatan',
            'riwayat_medis' => [
                'keluhan_utama' => 'Sering kelelahan ekstrem dan pernah tertusuk jarum pasien.',
                'golongan_darah' => 'AB',
            ],
            'medis' => [
                [
                    'tanggal_pemeriksaan' => '2026-04-10',
                    'tempat_pemeriksaan' => 'Poli Penyakit Dalam RSUD Dr. Soetomo',
                    'status_kesehatan' => 'sehat_dengan_catatan',
                    'hasil_diagnosis' => 'Observasi serologi Hepatitis B pasca tertusuk jarum.',
                ]
            ],
            'riwayat' => [
                [
                    'nama_perusahaan' => 'RSUD Dr. Soetomo',
                    'bagian' => 'IGD',
                    'jabatan' => 'Perawat Triage',
                    'tgl_masuk' => '2018-01-15',
                    'status_pekerjaan' => 'Tetap',
                ]
            ]
        ];

        // Data 5: Operator Tambang (Pengurus Serikat) dengan 3 Riwayat Medis
        $data5 = [
            'nama_lengkap' => 'Markus Tandi',
            'nik' => '6472011234560005',
            'is_anggota' => true,
            'is_pengurus_serikat' => true,
            'serikat' => 'FPE',
            'nama_serikat' => 'FPE',
            'email' => 'markus.tambang@email.com',
            'whatsapp' => '081234567005',
            'jenis_kelamin' => 'L',
            'tanggal_lahir' => '1980-08-08',
            'domisili' => 'Kalimantan Timur, Kab. Kutai Timur, Sangatta Utara',
            'perusahaan_id' => $perusahaan5->id,
            'status_kesehatan' => 'tidak_sehat',
            'riwayat_medis' => [
                'keluhan_utama' => 'Telinga berdenging dan syaraf terjepit di tulang belakang.',
                'riwayat_penyakit' => ['Hipertensi ringan'],
                'golongan_darah' => 'O',
            ],
            'medis' => [
                [
                    'tanggal_pemeriksaan' => '2026-05-01',
                    'tempat_pemeriksaan' => 'RS Siloam Balikpapan',
                    'status_kesehatan' => 'tidak_sehat',
                    'hasil_diagnosis' => 'HNP Lumbal L4-L5 akibat Whole Body Vibration.',
                ],
                [
                    'tanggal_pemeriksaan' => '2025-05-01',
                    'tempat_pemeriksaan' => 'Klinik KPC Sangatta',
                    'status_kesehatan' => 'tidak_sehat',
                    'hasil_diagnosis' => 'Penurunan fungsi pendengaran 30 dB di telinga kiri.',
                ],
                [
                    'tanggal_pemeriksaan' => '2024-05-01',
                    'tempat_pemeriksaan' => 'Klinik KPC Sangatta',
                    'status_kesehatan' => 'sehat_dengan_catatan',
                    'hasil_diagnosis' => 'Mulai ada keluhan nyeri pinggang ringan.',
                ]
            ],
            'riwayat' => [
                [
                    'nama_perusahaan' => 'PT Kaltim Prima Coal',
                    'bagian' => 'Heavy Equipment',
                    'jabatan' => 'Operator Dump Truck',
                    'tgl_masuk' => '2005-06-10',
                    'status_pekerjaan' => 'Tetap',
                ]
            ]
        ];

        $datas = [$data1, $data2, $data3, $data4, $data5];

        foreach ($datas as $data) {
            // 1. Buat atau perbarui User
            $user = $pekerjaService->createOrUpdateUser($data);

            // 2. Buat atau perbarui Pekerja + inisialisasi StatusAdvokasi
            $pekerja = $pekerjaService->createOrUpdatePekerja($user, $data);

            // 3. Sinkronisasi Riwayat Pekerjaan
            $embeddedMedis = [];
            if (isset($data['riwayat']) && is_array($data['riwayat'])) {
                $embeddedMedis = $pekerjaService->syncRiwayatPekerja($pekerja, $data['riwayat']);
            }

            // 4. Sinkronisasi Detail Medis
            $medisMandiri = isset($data['medis']) && is_array($data['medis']) ? $data['medis'] : [];
            $pekerjaService->syncDetailMedis($pekerja, $medisMandiri, $embeddedMedis);

            // 5. Sinkronisasi Riwayat Medis Baseline
            if (isset($data['riwayat_medis']) && is_array($data['riwayat_medis'])) {
                $pekerja->riwayatMedis()->updateOrCreate(
                    ['pekerja_id' => $pekerja->id],
                    $data['riwayat_medis']
                );
            }
        }
    }
}
