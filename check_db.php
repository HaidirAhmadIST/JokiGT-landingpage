<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$h = App\Models\User::where('nama', 'Hasna Susanti')->first();
$p = App\Models\Pekerja::where('nama_lengkap', 'Prasetyo Palastri')->first();

echo 'Hasna Serikat: ' . $h->serikat . PHP_EOL;
echo 'Prasetyo Serikat: ' . $p->nama_serikat . PHP_EOL;
echo 'Prasetyo Perusahaan ID: ' . $p->perusahaan_id . PHP_EOL;
echo 'Hasna Perusahaan ID: ' . $h->perusahaan_id . PHP_EOL;
echo 'Hasna Pekerja Perusahaan ID: ' . $h->pekerja->perusahaan_id . PHP_EOL;
