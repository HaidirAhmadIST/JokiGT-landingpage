<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DetailMedis;
use App\Models\Pekerja;
use App\Models\Perusahaan;
use App\Models\RiwayatPekerja;
use App\Models\StatusAdvokasi;
use App\Models\User;
use Illuminate\Http\Request;

class BackupController extends Controller
{
    /**
     * Download entire database as JSON.
     * Only Super Admin can access this.
     */
    public function download(Request $request)
    {
        // Security check
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json([
                'status' => 'error',
                'message' => 'Hanya Super Admin yang diizinkan mengunduh backup database.'
            ], 403);
        }

        // Fetch all important tables
        // Using withTrashed() to ensure we backup soft-deleted items too
        $data = [
            'users' => User::withTrashed()->get(),
            'perusahaan' => Perusahaan::withTrashed()->get(),
            'pekerja' => Pekerja::withTrashed()->with(['detailMedis', 'riwayatPekerjaan', 'statusAdvokasi'])->get(),
            'detail_medis' => DetailMedis::withTrashed()->get(),
            'riwayat_pekerjaan' => RiwayatPekerja::withTrashed()->get(),
            'status_advokasi' => StatusAdvokasi::withTrashed()->get(),
            'metadata' => [
                'timestamp' => now()->toIso8601String(),
                'version' => '1.0',
                'total_pekerja' => Pekerja::withTrashed()->count(),
                'total_perusahaan' => Perusahaan::withTrashed()->count()
            ]
        ];

        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        $filename = 'backup_rekam_jejak_pak_' . date('Y_m_d_His') . '.json';

        return response($json, 200, [
            'Content-Type' => 'application/json',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }
}
