<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Perusahaan;

$companyData = [
    'PT Astra Honda Motor' => ['provinsi' => 'DKI Jakarta', 'kabupaten' => 'Jakarta Utara'],
    'PT Unilever Indonesia Tbk' => ['provinsi' => 'Jawa Barat', 'kabupaten' => 'Bekasi'],
    'PT Indofood CBP Sukses Makmur Tbk' => ['provinsi' => 'DKI Jakarta', 'kabupaten' => 'Jakarta Pusat'],
    'PT Telkom Indonesia (Persero) Tbk' => ['provinsi' => 'Jawa Barat', 'kabupaten' => 'Bandung'],
    'PT Bank Mandiri (Persero) Tbk' => ['provinsi' => 'DKI Jakarta', 'kabupaten' => 'Jakarta Selatan'],
    'PT Gudang Garam Tbk' => ['provinsi' => 'Jawa Timur', 'kabupaten' => 'Kediri'],
    'PT Kalbe Farma Tbk' => ['provinsi' => 'DKI Jakarta', 'kabupaten' => 'Jakarta Timur'],
    'PT United Tractors Tbk' => ['provinsi' => 'DKI Jakarta', 'kabupaten' => 'Jakarta Timur'],
    'PT PLN (Persero)' => ['provinsi' => 'DKI Jakarta', 'kabupaten' => 'Jakarta Selatan'],
    'PT Garuda Indonesia (Persero) Tbk' => ['provinsi' => 'Banten', 'kabupaten' => 'Tangerang']
];

foreach ($companyData as $companyName => $location) {
    Perusahaan::where('nama_perusahaan', $companyName)->update([
        'provinsi' => $location['provinsi'],
        'kabupaten' => $location['kabupaten']
    ]);
}
echo "Companies updated with province data.\n";
