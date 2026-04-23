<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Pekerja;
use App\Models\DetailMedis;

echo "Total Pekerja: " . Pekerja::count() . "\n";
echo "Total Detail Medis: " . DetailMedis::count() . "\n";

$start = microtime(true);
$pekerjas = Pekerja::withSummary()->latest()->paginate(15);
$end = microtime(true);
echo "Time to fetch 15 workers with summary: " . ($end - $start) . "s\n";

$pekerja = Pekerja::first();
if ($pekerja) {
    echo "Pekerja sample: " . $pekerja->nama_lengkap . "\n";
    echo "Detail Medis count for this worker: " . $pekerja->detailMedis()->count() . "\n";
}
