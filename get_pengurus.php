<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Hash;

$pengurus = \App\Models\User::where('role', 'petugas')
    ->where('email', '!=', 'staff@pak.com') // Exclude the main staff account
    ->with('pekerja.perusahaan')
    ->get();

echo "DAFTAR AKUN PENGURUS SERIKAT:\n";
echo "========================================================\n";

foreach ($pengurus as $u) {
    if ($u->pekerja && $u->pekerja->perusahaan) {
        // Reset password to a known one
        $u->password = Hash::make('Serikat123!');
        $u->save();

        echo $u->pekerja->perusahaan->nama_perusahaan . "\n";
        echo "Nama: " . $u->nama . "\n";
        echo "Email: " . $u->email . "\n";
        echo "Password: Serikat123!\n";
        echo "--------------------------------------------------------\n";
    }
}
