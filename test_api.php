<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

// Step 1: Login untuk mendapat token
$loginRequest = Illuminate\Http\Request::create('/api/login', 'POST', [
    'email' => 'admin@pak.com',
    'password' => 'admin123',
]);
$loginRequest->headers->set('Accept', 'application/json');
$loginResponse = $kernel->handle($loginRequest);
$loginData = json_decode($loginResponse->getContent(), true);

echo "=== LOGIN ===\n";
echo "Status: " . $loginResponse->getStatusCode() . "\n";
echo "Response: " . $loginResponse->getContent() . "\n\n";

if (!isset($loginData['data']['token'])) {
    echo "LOGIN GAGAL! Tidak ada token.\n";
    exit;
}

$token = $loginData['data']['token'];
echo "Token: " . $token . "\n\n";

// Step 2: Coba tambah perusahaan
$addRequest = Illuminate\Http\Request::create('/api/perusahaan', 'POST', [
    'nama_perusahaan' => 'PT Test Coba',
    'status_pendamping' => 'Berkasus',
    'sektor_industri' => 'Manufaktur',
]);
$addRequest->headers->set('Accept', 'application/json');
$addRequest->headers->set('Authorization', 'Bearer ' . $token);

$addResponse = $kernel->handle($addRequest);

echo "=== TAMBAH PERUSAHAAN ===\n";
echo "Status: " . $addResponse->getStatusCode() . "\n";
echo "Response: " . $addResponse->getContent() . "\n";
