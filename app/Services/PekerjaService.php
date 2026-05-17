<?php

namespace App\Services;

use App\Models\DetailMedis;
use App\Models\Pekerja;
use App\Models\RiwayatPekerja;
use App\Models\StatusAdvokasi;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

/**
 * PekerjaService
 *
 * Mengelola semua logika bisnis yang berkaitan dengan pendaftaran dan
 * pembaruan data pekerja. Dipisahkan dari Controller agar Controller
 * tetap tipis (thin controller pattern) dan logika mudah diuji.
 *
 * Digunakan oleh: PekerjaController
 */
class PekerjaService
{
    /**
     * Membuat atau memperbarui User berdasarkan email.
     *
     * Jika email sudah ada, hanya nama dan password yang diperbarui.
     * Jika belum ada, User baru dibuat dengan role 'viewer'.
     *
     * @param  array{email: string, nama_lengkap: string, password: string} $data
     * @return User
     */
    public function createOrUpdateUser(array $data): User
    {
        $user = null;
        
        // Coba cari berdasarkan whatsapp jika ada
        if (!empty($data['whatsapp'])) {
            $user = User::where('whatsapp', $data['whatsapp'])->first();
        }
        
        // Jika tidak ketemu, coba cari berdasarkan email jika ada
        if (!$user && !empty($data['email'])) {
            $user = User::where('email', $data['email'])->first();
        }

        if ($user) {
            $user->update([
                'nama'     => $data['nama_lengkap'],
                'whatsapp' => $data['whatsapp'] ?? $user->whatsapp,
                'email'    => $data['email'] ?? $user->email,
                'password' => isset($data['password']) ? Hash::make($data['password']) : $user->password,
            ]);
        } else {
            $user = User::create([
                'nama'     => $data['nama_lengkap'],
                'whatsapp' => $data['whatsapp'] ?? null,
                'email'    => $data['email'] ?? null,
                'password' => Hash::make($data['password'] ?? \Illuminate\Support\Str::random(16)),
                'role'     => 'viewer',
            ]);
        }

        return $user;
    }

    /**
     * Membuat atau memperbarui data Pekerja berdasarkan NIK.
     *
     * Jika NIK sudah ada, data profil diperbarui dan dihubungkan ke user.
     * Jika belum ada, record Pekerja baru dibuat.
     * StatusAdvokasi kosong juga dibuat otomatis jika belum ada.
     *
     * @param  User  $user  User yang akan dihubungkan ke Pekerja ini.
     * @param  array $data  Data pekerja dari request (sudah divalidasi).
     * @return Pekerja
     */
    public function createOrUpdatePekerja(User $user, array $data): Pekerja
    {
        $pekerja = Pekerja::where('nik', $data['nik'])->first();

        $pekerjaData = [
            'user_id'         => $user->id,
            'perusahaan_id'   => $data['perusahaan_id'] ?? null,
            'nama_lengkap'    => $data['nama_lengkap'],
            'status_kesehatan'=> $data['status_kesehatan'] ?? 'sehat',
            'catatan_admin'   => $data['catatan_admin'] ?? null,
            'tanggal_lahir'   => $data['tanggal_lahir'] ?? null,
            'jenis_kelamin'   => $data['jenis_kelamin'] ?? null,
            'whatsapp'        => $data['whatsapp'] ?? null,
            'domisili'        => $data['domisili'] ?? null,
            'anggota_organisasi' => $data['anggota_organisasi'] ?? $data['is_anggota'] ?? false,
        ];

        if ($pekerja) {
            $pekerja->update($pekerjaData);
        } else {
            $pekerja = Pekerja::create(array_merge($pekerjaData, [
                'nik' => $data['nik'],
            ]));
        }

        // Pastikan StatusAdvokasi kosong selalu ada untuk setiap pekerja
        if (!$pekerja->statusAdvokasi) {
            StatusAdvokasi::create(['pekerja_id' => $pekerja->id]);
        }

        return $pekerja;
    }

    /**
     * Sinkronisasi (hapus & buat ulang) data riwayat pekerjaan.
     *
     * Menghapus semua riwayat lama lalu membuat ulang dari data baru.
     * Mengembalikan array berisi data medis yang embedded di riwayat pekerjaan.
     *
     * @param  Pekerja $pekerja
     * @param  array   $riwayatList  Array data riwayat dari request.
     * @return array   Array data medis embedded (dengan _riwayat_pekerja_id).
     */
    public function syncRiwayatPekerja(Pekerja $pekerja, array $riwayatList): array
    {
        $embeddedMedisAll = [];

        $pekerja->riwayatPekerja()->delete();

        foreach ($riwayatList as $riwayatItem) {
            // Pisahkan riwayat_pemeriksaan sebelum menyimpan ke tabel riwayat_pekerja
            $pemeriksaan = $riwayatItem['riwayat_pemeriksaan'] ?? [];
            $riwayatData = array_diff_key($riwayatItem, array_flip(['riwayat_pemeriksaan']));

            $savedRiwayat = $pekerja->riwayatPekerja()->create($riwayatData);

            // Tandai setiap record medis embedded dengan ID riwayat induknya
            foreach ($pemeriksaan as $medisItem) {
                $embeddedMedisAll[] = array_merge($medisItem, [
                    '_riwayat_pekerja_id' => $savedRiwayat->id,
                ]);
            }
        }

        return $embeddedMedisAll;
    }

    /**
     * Sinkronisasi data detail medis pekerja.
     *
     * Menggabungkan medis mandiri (dari form Step 3) dengan medis embedded
     * (dari riwayat pekerjaan), lalu menghapus semua data lama dan membuat ulang.
     *
     * @param  Pekerja $pekerja
     * @param  array   $medisMandiri  Medis dari form utama (tidak terikat pekerjaan).
     * @param  array   $medisEmbedded Medis dari riwayat pekerjaan (sudah punya _riwayat_pekerja_id).
     * @return void
     */
    public function syncDetailMedis(Pekerja $pekerja, array $medisMandiri, array $medisEmbedded): void
    {
        $allMedis = [];

        // Medis mandiri — tidak terikat ke riwayat pekerjaan manapun
        foreach ($medisMandiri as $m) {
            $allMedis[] = $this->mapMedisData($m, null);
        }

        // Medis embedded — terikat ke riwayat pekerjaan tertentu
        foreach ($medisEmbedded as $m) {
            $riwayatPekerjaId = $m['_riwayat_pekerja_id'] ?? null;
            $allMedis[] = $this->mapMedisData($m, $riwayatPekerjaId);
        }

        if (!empty($allMedis)) {
            $pekerja->detailMedis()->delete();
            $pekerja->detailMedis()->createMany($allMedis);
        }
    }

    /**
     * Memetakan input request ke format kolom database untuk tabel detail_medis.
     *
     * @param  array    $m                 Data medis dari request.
     * @param  int|null $riwayatPekerjaId  ID riwayat pekerjaan terkait (atau null).
     * @return array
     */
    private function mapMedisData(array $m, ?int $riwayatPekerjaId): array
    {
        return [
            'tgl_pemeriksaan'    => $m['tanggal_pemeriksaan'] ?? null,
            'tempat_pemeriksa'   => $m['tempat_pemeriksaan']  ?? null,
            'jenis_pemeriksa'    => isset($m['jenis_pemeriksaan']) ? (is_array($m['jenis_pemeriksaan']) ? implode(', ', $m['jenis_pemeriksaan']) : $m['jenis_pemeriksaan']) : null,
            'dokter_pemeriksa'   => $m['dokter']              ?? null,
            'status_kesehatan'   => $m['status_kesehatan']    ?? 'sehat',
            'hasil_diagnosis'    => $m['hasil_diagnosis']     ?? null,
            'rekomendasi'        => $m['rekomendasi']         ?? null,
            'pendamping'         => $m['pendamping']          ?? null,
            'riwayat_pekerja_id' => $riwayatPekerjaId,
        ];
    }
}
