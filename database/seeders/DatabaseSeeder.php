<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Super Admin
        User::updateOrCreate(
            ['email' => 'admin@pak.com'],
            [
                'nama'     => 'Admin Sistem',
                'password' => Hash::make('password123'),
                'role'     => 'admin',
            ]
        );

        // Staff
        User::updateOrCreate(
            ['email' => 'staff@pak.com'],
            [
                'nama'     => 'Staff PAK',
                'password' => Hash::make('staff123'),
                'role'     => 'petugas',
            ]
        );

        // Sample Perusahaan
        $perusahaans = [
            ['nama_perusahaan' => 'PT. Aneka Tambang', 'status_pendamping' => 'Berkasus'],
            ['nama_perusahaan' => 'PT. Bukit Asam', 'status_pendamping' => 'Berkasus'],
            ['nama_perusahaan' => 'PT. Freeport Indonesia', 'status_pendamping' => 'Berkasus'],
        ];

        foreach ($perusahaans as $p) {
            \App\Models\Perusahaan::updateOrCreate(
                ['nama_perusahaan' => $p['nama_perusahaan']],
                $p
            );
        }

        $this->call(WorkerStressTestSeeder::class);
        $this->call(TestingPendaftaranSeeder::class);
        $this->call(ComprehensiveDataSeeder::class);
    }
}
