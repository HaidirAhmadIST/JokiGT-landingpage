<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$h = App\Models\User::where('nama', 'Hasna Susanti')->first();
$n = App\Models\Pekerja::where('nama_lengkap', 'Nadia Waluyo')->first();
$p = App\Models\Pekerja::where('nama_lengkap', 'Prasetyo Palastri')->first();
$policy = new App\Policies\PekerjaPolicy();

echo 'Nadia Serikat: ' . $n->nama_serikat . PHP_EOL;
echo 'View Access Nadia: ' . ($policy->view($h, $n) ? 'TRUE' : 'FALSE') . PHP_EOL;

echo 'Prasetyo Serikat: ' . $p->nama_serikat . PHP_EOL;
echo 'View Access Prasetyo: ' . ($policy->view($h, $p) ? 'TRUE' : 'FALSE') . PHP_EOL;
