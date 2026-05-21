<?php

namespace Database\Seeders;

use App\Models\Pekerja;
use App\Models\Perusahaan;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ScenarioRBACSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Buat Perusahaan A
        $perusahaanA = Perusahaan::create([
            'nama_perusahaan' => 'PT Makmur Jaya (Perusahaan A)',
            'sektor_industri' => 'Manufaktur',
            'status_pendamping' => 'Berkasus',
            'alamat' => 'Kawasan Industri A',
            'serikat' => 'Serikat A', // Default serikat untuk perusahaan ini
        ]);

        // 2. Buat Pengurus Serikat (Petugas) di Perusahaan A dan berafiliasi ke Serikat A
        $petugas = User::create([
            'nama' => 'Budi Petugas',
            'email' => 'petugas@serikata.com',
            'whatsapp' => '081111111111',
            'password' => Hash::make('password123'),
            'role' => 'petugas',
            'perusahaan_id' => $perusahaanA->id,
            'serikat' => 'Serikat A'
        ]);

        // 3. Buat Pekerja Biasa 1 (Serikat A, Perusahaan A)
        $userPekerja1 = User::create([
            'nama' => 'Pekerja Satu (Serikat A)',
            'email' => 'pekerja1@test.com',
            'whatsapp' => '082222222222',
            'password' => Hash::make('password123'),
            'role' => 'viewer',
        ]);
        
        Pekerja::create([
            'user_id' => $userPekerja1->id,
            'perusahaan_id' => $perusahaanA->id,
            'nik' => '1234567890123456',
            'nama_lengkap' => 'Pekerja Satu',
            'whatsapp' => '082222222222',
            'nama_serikat' => 'Serikat A' // Disini kita assign nama_serikat untuk pekerja 1
        ]);

        // 4. Buat Pekerja Biasa 2 (Serikat B, Perusahaan A)
        $userPekerja2 = User::create([
            'nama' => 'Pekerja Dua (Serikat B)',
            'email' => 'pekerja2@test.com',
            'whatsapp' => '083333333333',
            'password' => Hash::make('password123'),
            'role' => 'viewer',
        ]);
        
        Pekerja::create([
            'user_id' => $userPekerja2->id,
            'perusahaan_id' => $perusahaanA->id,
            'nik' => '6543210987654321',
            'nama_lengkap' => 'Pekerja Dua',
            'whatsapp' => '083333333333',
            'nama_serikat' => 'Serikat B' // Beda serikat tapi satu perusahaan
        ]);

        // Catatan ke console
        $this->command->info('✅ Skenario RBAC berhasil dibuat!');
        $this->command->info('=====================================');
        $this->command->info('Login Petugas:');
        $this->command->info('Email: petugas@serikata.com');
        $this->command->info('Password: password123');
        $this->command->info('=====================================');
    }
}
