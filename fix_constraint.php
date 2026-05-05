<?php
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

try {
    DB::statement("ALTER TABLE perusahaan DROP CONSTRAINT IF EXISTS perusahaan_status_pendamping_check");
    echo "Constraint lama berhasil dihapus.\n";

    DB::statement("ALTER TABLE perusahaan ADD CONSTRAINT perusahaan_status_pendamping_check CHECK (status_pendamping IN ('Berkasus', 'Selesai', 'Dalam Pantauan'))");
    echo "Constraint baru berhasil ditambahkan.\n";

    echo "\nDONE! Sekarang perusahaan bisa ditambahkan dengan status: Berkasus, Selesai, Dalam Pantauan\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
