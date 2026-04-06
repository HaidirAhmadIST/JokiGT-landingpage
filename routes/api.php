<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PekerjaController;
use App\Http\Controllers\Api\PerusahaanController;
use App\Http\Controllers\Api\AdvokasiController;
use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\DashboardController;
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

    // Dashboard
    Route::get('dashboard/stats', [DashboardController::class, 'stats']);

    // Perusahaan CRUD + Soft Delete/Restore
    Route::apiResource('perusahaan', PerusahaanController::class);
    Route::patch('perusahaan/{id}/restore', [PerusahaanController::class, 'restore']);

    // Activity Logs (for dual-tab panel)
    Route::get('activity-logs', [ActivityLogController::class, 'index']);

    // Pekerja CRUD
    Route::apiResource('pekerja', PekerjaController::class);
    Route::post('pekerja-bulk-update', [PekerjaController::class, 'bulkUpdate']);
    Route::post('pekerja/{pekerja}/foto', [PekerjaController::class, 'uploadFoto']);

    // Advokasi
    Route::get('advokasi/stats', [AdvokasiController::class, 'stats']);
    Route::get('advokasi', [AdvokasiController::class, 'index']);
    Route::post('pekerja/{pekerja_id}/advokasi', [AdvokasiController::class, 'update']);

    // Secure File Downloads (RBAC handled in controller)
    Route::get('pekerja/{pekerja_id}/files/medis', [FileController::class, 'downloadMedis']);
    Route::get('pekerja/{pekerja_id}/files/advokasi/{step_key}', [FileController::class, 'downloadAdvokasiProof']);
});
