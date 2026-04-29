<?php
$results = App\Models\StatusAdvokasi::with('pekerja.user')->whereNotNull('jenis_kasus')->get();
foreach($results as $r) {
    $nama = $r->pekerja ? $r->pekerja->nama_lengkap : '?';
    $email = ($r->pekerja && $r->pekerja->user) ? $r->pekerja->user->email : '?';
    echo $nama.' | '.$email.' | '.$r->jenis_kasus.PHP_EOL;
}
echo 'Total: '.$results->count().PHP_EOL;
