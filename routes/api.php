<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PekerjaController;
use App\Http\Controllers\Api\PerusahaanController;
use App\Http\Controllers\Api\AdvokasiController;
use App\Http\Controllers\Api\FileController;

// =========================================================================
// Public Routes
// =========================================================================

Route::post('/login', [AuthController::class, 'login']);

// =========================================================================
// Protected Routes
// =========================================================================

Route::middleware(['auth:sanctum'])->group(function () {
    // Auth & Profile
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Perusahaan CRUD
    Route::apiResource('perusahaan', PerusahaanController::class);

    // Pekerja CRUD
    Route::apiResource('pekerja', PekerjaController::class);
    Route::post('pekerja-bulk-update', [PekerjaController::class, 'bulkUpdate']);
    Route::post('pekerja/{pekerja}/foto', [PekerjaController::class, 'uploadFoto']);

    // Advokasi
    Route::get('advokasi', [AdvokasiController::class, 'index']);
    Route::post('pekerja/{pekerja_id}/advokasi', [AdvokasiController::class, 'update']);

    // Secure File Downloads (RBAC handled in controller)
    Route::get('pekerja/{pekerja_id}/files/medis', [FileController::class, 'downloadMedis']);
    Route::get('pekerja/{pekerja_id}/files/bukti-pajanan', [FileController::class, 'downloadBuktiPajanan']);
});
