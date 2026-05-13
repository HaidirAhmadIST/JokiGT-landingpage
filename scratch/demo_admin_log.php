<?php
require dirname(__DIR__) . '/vendor/autoload.php';
$app = require_once dirname(__DIR__) . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Perusahaan;
use App\Models\ActivityLog;
use App\Models\User;

$p = Perusahaan::first();
$oldName = $p->nama_perusahaan;
$newName = "Apple Indonesia (Updated)";

$p->nama_perusahaan = $newName;
$p->save();

ActivityLog::record(
    'update',
    "Memperbarui nama perusahaan: {$oldName} -> {$newName}",
    'admin',
    $p,
    ['old' => $oldName, 'new' => $newName],
    User::where('role', 'admin')->first()
);

echo "Success: Perusahaan diupdate dari {$oldName} ke {$newName}. Log Admin telah dicatat.\n";
