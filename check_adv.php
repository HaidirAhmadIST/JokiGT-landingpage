<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$app->boot();
$results = App\Models\StatusAdvokasi::with('pekerja.user')->whereNotNull('jenis_kasus')->get();
foreach($results as $r) {
    $nama = $r->pekerja ? $r->pekerja->nama_lengkap : '?';
    $email = ($r->pekerja && $r->pekerja->user) ? $r->pekerja->user->email : '?';
    echo $nama.' | '.$email.' | '.$r->jenis_kasus.PHP_EOL;
}
echo 'Total: '.$results->count().PHP_EOL;
