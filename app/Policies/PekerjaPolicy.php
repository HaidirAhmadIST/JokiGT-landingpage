<?php

namespace App\Policies;

use App\Models\Pekerja;
use App\Models\User;

/**
 * PekerjaPolicy
 *
 * Memusatkan semua aturan otorisasi untuk resource Pekerja.
 * Digunakan oleh PekerjaController agar tidak ada pengecekan
 * kepemilikan yang tersebar (mencegah IDOR).
 *
 * Aturan umum:
 * - Admin → akses penuh ke semua data pekerja, termasuk delete.
 * - Petugas → hanya data di perusahaan sendiri; beda serikat = list only.
 * - Viewer (Pekerja itu sendiri) → hanya bisa mengakses data miliknya.
 *
 * STRICT RULES:
 * - No Delete Policy: Hanya admin yang bisa menghapus.
 * - Multi-Tenancy: Petugas diisolasi berdasarkan perusahaan_id.
 * - Cross-Serikat: Petugas beda serikat di perusahaan sama bisa list, tidak bisa detail.
 */
class PekerjaPolicy
{
    /**
     * Menentukan apakah user boleh melihat detail profil pekerja tertentu.
     *
     * Mencegah IDOR pada endpoint: GET /pekerja/{id}
     *
     * Aturan ketat:
     * - Admin → bisa melihat semua data pekerja.
     * - Petugas → bisa melihat detail HANYA jika:
     *     1. Pekerja berada di perusahaan yang sama (perusahaan_id cocok), DAN
     *     2. Serikat user cocok dengan serikat perusahaan pekerja.
     *     Jika serikat berbeda tapi perusahaan sama → DITOLAK (hanya boleh lihat list).
     * - Viewer → hanya data miliknya sendiri.
     *
     * @param  User    $user    User yang sedang login.
     * @param  Pekerja $pekerja Resource Pekerja yang diminta.
     */
    public function view(User $user, Pekerja $pekerja): bool
    {
        // Admin boleh melihat semua data pekerja
        if ($user->isAdmin()) {
            return true;
        }

        // Petugas: cek isolasi perusahaan + serikat
        if ($user->isPetugas()) {
            $petugasPerusahaanId = $user->perusahaan_id ?? $user->pekerja?->perusahaan_id;

            // Pastikan petugas punya perusahaan_id
            if (!$petugasPerusahaanId) {
                return false;
            }

            // Pekerja harus di perusahaan yang sama
            if ($pekerja->perusahaan_id !== $petugasPerusahaanId) {
                return false;
            }

            // Cek kecocokan serikat: petugas hanya bisa lihat detail pekerja
            // jika serikat pekerja cocok dengan serikat petugas
            if ($pekerja->nama_serikat && $user->serikat) {
                return strtolower(trim($pekerja->nama_serikat)) === strtolower(trim($user->serikat));
            }

            // Jika data serikat tidak tersedia, tolak akses untuk keamanan
            return false;
        }

        // Viewer hanya boleh melihat data miliknya sendiri
        return $user->id === $pekerja->user_id;
    }

    /**
     * Menentukan apakah user boleh menghapus data pekerja.
     *
     * NO DELETE POLICY:
     * - HANYA admin (Super Admin) yang boleh menghapus data.
     * - Petugas dan Viewer akan mendapatkan 403 Forbidden.
     *
     * @param  User    $user    User yang sedang login.
     * @param  Pekerja $pekerja Resource Pekerja yang akan dihapus.
     */
    public function delete(User $user, Pekerja $pekerja): bool
    {
        return $user->isAdmin();
    }

    /**
     * Menentukan apakah user boleh mengunggah/mengganti foto profil pekerja.
     *
     * Mencegah IDOR pada endpoint: POST /pekerja/{id}/foto
     *
     * @param  User    $user    User yang sedang login.
     * @param  Pekerja $pekerja Resource Pekerja yang fotonya akan diganti.
     */
    public function updateFoto(User $user, Pekerja $pekerja): bool
    {
        // Hanya Admin atau pemilik rekam data (Viewer/diri sendiri) yang bisa upload foto
        // Petugas tidak diberi akses untuk mengganti foto pribadi pekerja
        if ($user->isAdmin()) {
            return true;
        }

        return $user->id === $pekerja->user_id;
    }

    /**
     * Menentukan apakah user boleh mengupdate data pekerja.
     *
     * - Admin → bisa update semua pekerja.
     * - Petugas → hanya pekerja di perusahaan sendiri + serikat sama.
     * - Viewer → hanya data miliknya sendiri.
     *
     * @param  User    $user    User yang sedang login.
     * @param  Pekerja $pekerja Resource Pekerja yang akan diupdate.
     */
    public function update(User $user, Pekerja $pekerja): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($user->isPetugas()) {
            $petugasPerusahaanId = $user->perusahaan_id ?? $user->pekerja?->perusahaan_id;

            if (!$petugasPerusahaanId) {
                return false;
            }

            // Harus di perusahaan sama DAN serikat sama
            if ($pekerja->perusahaan_id !== $petugasPerusahaanId) {
                return false;
            }

            if ($pekerja->nama_serikat && $user->serikat) {
                return strtolower(trim($pekerja->nama_serikat)) === strtolower(trim($user->serikat));
            }

            return false;
        }

        return $user->id === $pekerja->user_id;
    }
}
