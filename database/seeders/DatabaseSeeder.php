<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Super Admin
        \App\Models\User::updateOrCreate(
            ['email' => 'admin@pak.com'],
            [
                'nama'     => 'Admin Sistem',
                'password' => \Illuminate\Support\Facades\Hash::make('admin123'),
                'role'     => 'admin',
            ]
        );

        // Staff
        \App\Models\User::updateOrCreate(
            ['email' => 'staff@pak.com'],
            [
                'nama'     => 'Staff PAK',
                'password' => \Illuminate\Support\Facades\Hash::make('staff123'),
                'role'     => 'petugas',
            ]
        );

        // Sample Perusahaan
        $perusahaans = [
            ['nama_perusahaan' => 'PT. Aneka Tambang', 'status_pendamping' => 'aktif'],
            ['nama_perusahaan' => 'PT. Bukit Asam', 'status_pendamping' => 'aktif'],
            ['nama_perusahaan' => 'PT. Freeport Indonesia', 'status_pendamping' => 'aktif'],
        ];

        foreach ($perusahaans as $p) {
            \App\Models\Perusahaan::updateOrCreate(
                ['nama_perusahaan' => $p['nama_perusahaan']],
                $p
            );
        }
    }
}
