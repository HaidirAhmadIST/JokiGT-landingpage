<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * MigratePekerjaFromPakSeeder
 *
 * Seeder ini memigrasikan data dari tabel legacy `pekerja_pak`
 * ke dalam struktur tabel utama aplikasi:
 *   - perusahaan  → cari atau buat record perusahaan
 *   - users       → buat akun user baru (role: viewer) per pekerja
 *   - pekerja     → buat data profil pekerja utama
 *   - riwayat_pekerja → isi dengan data tempat kerja & pajanan
 *   - status_advokasi → inisialisasi record advokasi kosong
 *
 * Jalankan dengan: php artisan db:seed --class=MigratePekerjaFromPakSeeder
 */
class MigratePekerjaFromPakSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Memulai migrasi data dari pekerja_pak...');

        // Ambil semua data dari tabel legacy
        $rows = DB::table('pekerja_pak')->get();

        if ($rows->isEmpty()) {
            $this->command->warn('Tabel pekerja_pak kosong. Tidak ada data yang dimigrasikan.');
            return;
        }

        $this->command->info("Ditemukan {$rows->count()} baris data untuk dimigrasikan.");

        $berhasil  = 0;
        $dilewati  = 0;
        $gagal     = 0;

        foreach ($rows as $row) {
            try {
                DB::transaction(function () use ($row, &$berhasil, &$dilewati) {

                    // ─── 1. Cari atau buat perusahaan ───────────────────────
                    $namaPerusahaan = $row->tempat_kerja ?? 'Tidak Diketahui';
                    $perusahaan = DB::table('perusahaan')
                        ->where('nama_perusahaan', $namaPerusahaan)
                        ->first();

                    if (!$perusahaan) {
                        $perusahaanId = DB::table('perusahaan')->insertGetId([
                            'nama_perusahaan'  => $namaPerusahaan,
                            'sektor_industri'  => 'Manufaktur',
                            'status_pendamping' => 'aktif',
                            'created_at'       => now(),
                            'updated_at'       => now(),
                        ]);
                    } else {
                        $perusahaanId = $perusahaan->id;
                    }

                    // ─── 2. Cek NIK unik — generate NIK dari nama ──────────
                    // Format NIK sementara: PAK + tahun masuk + 4 digit random
                    $tahunMasuk = $row->bekerja_sejak
                        ? date('Y', strtotime($row->bekerja_sejak))
                        : date('Y');
                    $nik = 'PAK' . $tahunMasuk . strtoupper(substr(md5($row->nama . $row->id), 0, 6));

                    // Lewati jika NIK sudah ada (pekerja sudah dimigrasikan)
                    $existingPekerja = DB::table('pekerja')->where('nik', $nik)->first();
                    if ($existingPekerja) {
                        $dilewati++;
                        return;
                    }

                    // ─── 3. Buat User baru ───────────────────────────────────
                    // Email: nama_tanpa_spasi@datapak.internal
                    $emailBase = Str::slug($row->nama, '.') . '@datapak.internal';
                    // Pastikan email unik
                    $email = $emailBase;
                    $emailSuffix = 1;
                    while (DB::table('users')->where('email', $email)->exists()) {
                        $email = Str::slug($row->nama, '.') . $emailSuffix . '@datapak.internal';
                        $emailSuffix++;
                    }

                    $userId = DB::table('users')->insertGetId([
                        'nama'       => $row->nama,
                        'email'      => $email,
                        'password'   => Hash::make('DataPak2026!'),  // Password default, perlu diganti
                        'role'       => 'viewer',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    // ─── 4. Buat record Pekerja ──────────────────────────────
                    // Map jenis_kelamin: 'Laki-laki' → 'L', 'Perempuan' → 'P'
                    $jenisKelamin = null;
                    if ($row->jenis_kelamin === 'Laki-laki') $jenisKelamin = 'L';
                    elseif ($row->jenis_kelamin === 'Perempuan') $jenisKelamin = 'P';

                    $pekerjaId = DB::table('pekerja')->insertGetId([
                        'user_id'         => $userId,
                        'perusahaan_id'   => $perusahaanId,
                        'nik'             => $nik,
                        'nama_lengkap'    => $row->nama,
                        'jenis_kelamin'   => $jenisKelamin,
                        'status_kesehatan' => 'Dalam Pengawasan', // Default untuk kasus PAK
                        'catatan_admin'   => $row->diagnosis_terakhir
                            ? 'Diagnosis: ' . $row->diagnosis_terakhir
                            : null,
                        'created_at'      => now(),
                        'updated_at'      => now(),
                    ]);

                    // ─── 5. Buat Riwayat Pekerjaan ───────────────────────────
                    DB::table('riwayat_pekerja')->insert([
                        'pekerja_id'      => $pekerjaId,
                        'nama_perusahaan' => $namaPerusahaan,
                        'bagian'          => null,
                        'jabatan'         => null,
                        'deskripsi_usaha' => $row->kota_kab
                            ? 'Kota/Kab: ' . $row->kota_kab
                            : null,
                        'status_pekerjaan' => $row->status_pekerjaan ?? 'Tidak Diketahui',
                        'tgl_masuk'       => $row->bekerja_sejak,
                        'tgl_keluar'      => $row->bekerja_sampai,
                        'jenis_pajanan'   => $row->dugaan_pajanan,
                        'created_at'      => now(),
                        'updated_at'      => now(),
                    ]);

                    // ─── 6. Inisialisasi Status Advokasi ─────────────────────
                    // penetapan_pak = boolean (true jika sudah ditetapkan PAK)
                    // riwayat_pajanan = true karena semua pekerja ini terpapar ASBES
                    $isPak = !empty($row->status_penetapan_pak);
                    DB::table('status_advokasi')->insert([
                        'pekerja_id'          => $pekerjaId,
                        'riwayat_pajanan'     => true,   // Semua terpapar ASBES
                        'persetujuan_dokter'  => false,
                        'perusahaan_lapor'    => false,
                        'penetapan_pak'       => $isPak, // true jika status_penetapan_pak = 'PAK'
                        'kompensasi_bpjstk'   => false,
                        'rehabilitasi_bpjskes' => false,
                        'created_at'          => now(),
                        'updated_at'          => now(),
                    ]);

                    $berhasil++;
                });

            } catch (\Throwable $e) {
                $gagal++;
                $this->command->error("Gagal migrasi [{$row->nama}]: " . $e->getMessage());
            }
        }

        $this->command->newLine();
        $this->command->table(
            ['Status', 'Jumlah'],
            [
                ['✅ Berhasil dimigrasikan', $berhasil],
                ['⏭  Dilewati (sudah ada)', $dilewati],
                ['❌ Gagal', $gagal],
            ]
        );

        $this->command->info('');
        $this->command->info('📌 Password default semua akun: DataPak2026!');
        $this->command->info('   Informasikan kepada pekerja agar segera mengubah password.');
    }
}
