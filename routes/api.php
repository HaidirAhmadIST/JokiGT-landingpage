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
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\RegistrationController;
use App\Http\Controllers\Api\RiwayatPekerjaController;
use App\Http\Controllers\Api\DetailMedisController;


// =========================================================================


Route::post('/login', [AuthController::class, 'login']);
Route::post('/register/complete', [RegistrationController::class, 'completeRegistration']);
Route::post('/register', [AuthController::class, 'register']);
Route::get('perusahaan', [PerusahaanController::class, 'index']);
Route::post('perusahaan', [PerusahaanController::class, 'store']);
Route::get('pekerja', [PekerjaController::class, 'index']);
Route::post('pekerja', [PekerjaController::class, 'store']);
Route::get('dashboard/stats', [DashboardController::class, 'stats']);


// =========================================================================
// Protected Routes
// =========================================================================

Route::middleware(['auth:sanctum'])->group(function () {
    // Auth & Profile
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/profile/foto', [AuthController::class, 'uploadFoto']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Dashboard
    // Route::get('dashboard/stats', [DashboardController::class, 'stats']); // Moved to public routes



    // Perusahaan Management
    Route::group(['middleware' => ['role:admin,petugas']], function () {
        Route::put('perusahaan/{perusahaan}', [PerusahaanController::class, 'update']);
        Route::patch('perusahaan/{id}/restore', [PerusahaanController::class, 'restore']);
    });
    Route::delete('perusahaan/{perusahaan}', [PerusahaanController::class, 'destroy'])->middleware('role:admin');
    Route::get('perusahaan/{perusahaan}', [PerusahaanController::class, 'show']);

    // Pekerja Management
    Route::get('pekerja/{pekerja}', [PekerjaController::class, 'show']);
    Route::post('riwayat-pekerja/{id}/file', [FileController::class, 'uploadRiwayatFile']);
    Route::post('detail-medis/{id}/file', [FileController::class, 'uploadMedisFile']);
    Route::post('riwayat-pekerja', [RiwayatPekerjaController::class, 'store']);
    Route::put('riwayat-pekerja/{id}', [RiwayatPekerjaController::class, 'update']);
    
    // Detail Medis Management
    Route::post('detail-medis', [DetailMedisController::class, 'store']);
    Route::put('detail-medis/{id}', [DetailMedisController::class, 'update']);
    
    // Advokasi upload — accessible by owner (viewer) or admin/petugas (ownership checked in controller)
    Route::post('pekerja/{pekerja_id}/advokasi', [AdvokasiController::class, 'update']);

    Route::post('pekerja/{pekerja}/foto', [PekerjaController::class, 'uploadFoto']);
    Route::put('pekerja/{pekerja}', [PekerjaController::class, 'update']);

    Route::group(['middleware' => ['role:admin,petugas']], function () {
        Route::post('pekerja-bulk-update', [PekerjaController::class, 'bulkUpdate']);
    });
    Route::delete('pekerja/{pekerja}', [PekerjaController::class, 'destroy'])->middleware('role:admin');

    // Dashboard & Reports
    // Route::get('dashboard/stats', [DashboardController::class, 'stats']); // Moved to public routes
    Route::get('activity-logs', [ActivityLogController::class, 'index']);
    Route::get('activity-logs/export', [ActivityLogController::class, 'export']);
    Route::get('activity-logs/archives', [ActivityLogController::class, 'listArchives']);
    Route::get('activity-logs/archives/download', [ActivityLogController::class, 'downloadArchive']);
    Route::get('reports/summary', [ReportController::class, 'summary']);
    Route::get('reports/search', [ReportController::class, 'search']);

    // Advokasi Stats (All can view)
    Route::get('advokasi/stats', [AdvokasiController::class, 'stats']);
    Route::get('advokasi/priority', [AdvokasiController::class, 'priority']);
    Route::get('advokasi', [AdvokasiController::class, 'index']);
    Route::get('advokasi/{id}', [AdvokasiController::class, 'show']);
    Route::get('advokasi/{id}/pdf', [AdvokasiController::class, 'exportPdf']);

    // File Downloads (RBAC handled in controller or by role)
    // Advokasi download — accessible by owner or admin/petugas (ownership checked in controller)
    Route::get('pekerja/{pekerja_id}/files/advokasi/{step_key}', [FileController::class, 'downloadAdvokasiProof']);

    Route::group(['middleware' => ['role:admin,petugas']], function () {
        Route::get('pekerja/{pekerja_id}/files/medis', [FileController::class, 'downloadMedis']);
        Route::get('medis/{id}/file', [FileController::class, 'downloadMedisById']);
        Route::get('riwayat/{id}/file', [FileController::class, 'downloadRiwayatById']);
    });
});
