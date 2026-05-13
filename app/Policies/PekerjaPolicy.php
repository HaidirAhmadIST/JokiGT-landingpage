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
 * - Admin & Petugas → akses penuh ke semua data pekerja.
 * - Viewer (Pekerja itu sendiri) → hanya bisa mengakses data miliknya.
 */
class PekerjaPolicy
{
    /**
     * Menentukan apakah user boleh melihat detail profil pekerja tertentu.
     *
     * Mencegah IDOR pada endpoint: GET /pekerja/{id}
     *
     * @param  User    $user    User yang sedang login.
     * @param  Pekerja $pekerja Resource Pekerja yang diminta.
     */
    public function view(User $user, Pekerja $pekerja): bool
    {
        // Admin dan Petugas boleh melihat semua data pekerja
        if ($user->isAdmin() || $user->isPetugas()) {
            return true;
        }

        // Viewer hanya boleh melihat data miliknya sendiri
        // Dibandingkan via user_id agar konsisten meski id berbeda
        return $user->id === $pekerja->user_id;
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
}
