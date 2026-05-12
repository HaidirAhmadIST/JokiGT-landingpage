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
    }
}
