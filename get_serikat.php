<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$pekerjas = \App\Models\Pekerja::whereHas('perusahaan', function($q) {
    $q->where('nama_perusahaan', 'PT Astra Honda Motor');
})->get();

echo "DAFTAR SERIKAT PEKERJA PT ASTRA HONDA MOTOR:\n";
echo "=============================================\n";
foreach ($pekerjas as $p) {
    echo $p->nama_lengkap . " => Serikat: " . ($p->nama_serikat ?? 'Tidak terdaftar') . "\n";
}
