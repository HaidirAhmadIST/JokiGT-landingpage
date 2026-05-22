<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PenyakitSpesifikSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\PenyakitSpesifik::firstOrCreate([
            'nama_penyakit' => 'Nystagmus pada penambang',
            'kategori' => 'kategori_4',
        ], [
            'deskripsi' => 'Penyakit yang terbukti secara ilmiah memiliki hubungan langsung dengan paparan pekerjaan pada penambang.'
        ]);
    }
}
