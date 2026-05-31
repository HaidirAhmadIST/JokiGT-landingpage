<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PekerjaController;
use App\Http\Controllers\Api\PerusahaanController;
use App\Http\Controllers\Api\AdvokasiController;
use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\BackupController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\FileController;
use App\Http\Controllers\Api\ApprovalRequestController;
use App\Http\Controllers\Api\InboxController;
// =========================================================================
// Public Routes
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\RegistrationController;
use App\Http\Controllers\Api\RiwayatPekerjaController;
use App\Http\Controllers\Api\DetailMedisController;
use App\Http\Controllers\Api\GoogleAuthController;
use App\Http\Controllers\Api\OtpController;


// =========================================================================
// Public Routes

// Statistik Peta Landing Page (Public)
Route::get('/map-stats', [\App\Http\Controllers\Api\MapStatsController::class, 'getStats']);

// Laporan Export (Public or semi-public for simplicity, since Laporan summary is public)
Route::get('/laporan/export', [ReportController::class, 'export']);

// Autentikasi
Route::post('/login', [AuthController::class, 'login']);
Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [GoogleAuthController::class, 'handleGoogleCallback']);
Route::middleware('throttle:otp')->group(function () {
    Route::post('/auth/whatsapp/send-otp', [OtpController::class, 'sendOtp']);
    Route::post('/auth/whatsapp/verify-otp', [OtpController::class, 'verifyOtp']);
});
Route::post('/register/complete', [RegistrationController::class, 'completeRegistration']);
Route::get('/serikat', [RegistrationController::class, 'listSerikat']);
Route::post('/register', [AuthController::class, 'register']);
Route::get('perusahaan', [PerusahaanController::class, 'index']);
Route::post('perusahaan', [PerusahaanController::class, 'store']);
Route::get('pekerja', [PekerjaController::class, 'index']);
Route::post('pekerja', [PekerjaController::class, 'store']);
Route::get('dashboard/stats', [DashboardController::class, 'stats']);
Route::get('dashboard/trend-klasifikasi', [DashboardController::class, 'trendKlasifikasi']);


// =========================================================================
// Protected Routes
// =========================================================================

Route::middleware(['auth:sanctum'])->group(function () {
    // Dashboard Pekerja Klasifikasi
    Route::get('dashboard/pekerja-klasifikasi', [DashboardController::class, 'pekerjaKlasifikasi']);

    // Pekerja (Admin/Petugas Actions)
    Route::post('/pekerja/bulk-update', [PekerjaController::class, 'bulkUpdate']);
    Route::post('/pekerja/{id}/faktor-pak', [PekerjaController::class, 'updateFaktorPak']);
    Route::get('/pekerja/{id}', [PekerjaController::class, 'show']);
    Route::put('/pekerja/{id}', [PekerjaController::class, 'update']);
    Route::delete('/pekerja/{id}', [PekerjaController::class, 'destroy']);
    Route::post('/pekerja/{id}/foto', [PekerjaController::class, 'uploadFoto']);

    // Auth & Profile
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/profile/foto', [AuthController::class, 'uploadFoto']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Approval Requests & Inbox
    Route::get('/inbox', [InboxController::class, 'index']);
    Route::apiResource('approval-requests', ApprovalRequestController::class)->only(['index', 'store']);
    Route::post('approval-requests/{id}/respond', [ApprovalRequestController::class, 'respond'])->middleware('role:admin,petugas');
    // Dashboard
    // Route::get('dashboard/stats', [DashboardController::class, 'stats']); // Moved to public routes



    // Perusahaan Management
    Route::group(['middleware' => ['role:admin,petugas']], function () {
        Route::put('perusahaan/{perusahaan}', [PerusahaanController::class, 'update']);
        Route::patch('perusahaan/{id}/restore', [PerusahaanController::class, 'restore']);
        
    });
    // Pembuatan Akun Pengurus Manual (Super Admin Only)
    Route::post('admin/buat-pengurus', [\App\Http\Controllers\Api\AdminPengurusController::class, 'store'])->middleware('role:admin');
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
    Route::get('/activity-logs', [ActivityLogController::class, 'index']);
    
    // Backup Route
    Route::get('/backup/download', [BackupController::class, 'download']);

    Route::get('activity-logs/export', [ActivityLogController::class, 'export']);
    Route::get('activity-logs/archives', [ActivityLogController::class, 'listArchives']);
    Route::get('activity-logs/archives/download', [ActivityLogController::class, 'downloadArchive']);
    Route::get('reports/summary', [ReportController::class, 'summary']);
    Route::get('reports/search', [ReportController::class, 'search']);
    Route::get('reports/sectors', [ReportController::class, 'sectors']);

    // Advokasi Stats (All can view)
    Route::get('advokasi/stats', [AdvokasiController::class, 'stats']);
    Route::get('advokasi/priority', [AdvokasiController::class, 'priority']);
    Route::get('advokasi', [AdvokasiController::class, 'index']);
    Route::get('advokasi/{id}', [AdvokasiController::class, 'show']);
    Route::get('advokasi/{id}/pdf', [AdvokasiController::class, 'exportPdf']);

    // File Downloads (RBAC handled in controller or by role)
    // Advokasi download — accessible by owner or admin/petugas (ownership checked in controller)
    Route::get('pekerja/{pekerja_id}/files/advokasi/{step_key}', [FileController::class, 'downloadAdvokasiProof']);
    
    // Advokasi file deletion
    Route::delete('pekerja/{pekerja_id}/files/advokasi/{step_key}', [AdvokasiController::class, 'deleteAdvokasiProof']);

    Route::group(['middleware' => ['role:admin,petugas']], function () {
        Route::get('pekerja/{pekerja_id}/files/medis', [FileController::class, 'downloadMedis']);
        Route::get('medis/{id}/file', [FileController::class, 'downloadMedisById']);
        Route::get('riwayat/{id}/file', [FileController::class, 'downloadRiwayatById']);
    });
});
