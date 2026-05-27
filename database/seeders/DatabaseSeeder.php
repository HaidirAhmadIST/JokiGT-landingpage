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

        // Data akun Staff telah dihapus atas permintaan Anda

        // Data sample perusahaan telah dihapus atas permintaan Anda

        // Hapus data palsu (comment out)
        // $this->call(WorkerStressTestSeeder::class);
        // $this->call(TestingPendaftaranSeeder::class);
        // $this->call(ComprehensiveDataSeeder::class);
    }
}
