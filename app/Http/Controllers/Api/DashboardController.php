<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pekerja;
use App\Models\Perusahaan;
use App\Models\StatusAdvokasi;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /**
     * Get statistics for the dashboard.
     */
    public function stats(): JsonResponse
    {
        try {
            $totalPekerja = Pekerja::count();
            $totalPerusahaan = Perusahaan::count();

            // Kasus Aktif: Ada jenis kasus dan belum selesai (rehabilitasi_bpjskes = false)
            $kasusAktif = StatusAdvokasi::whereNotNull('jenis_kasus')
                ->where('rehabilitasi_bpjskes', false)
                ->count();

            // Advokasi Selesai: Sudah sampai tahap akhir
            $advokasiSelesai = StatusAdvokasi::where('rehabilitasi_bpjskes', true)->count();

            // Klaim Disetujui: Step kompensasi_bpjstk bernilai true
            $klaimDisetujui = StatusAdvokasi::where('kompensasi_bpjstk', true)->count();

            // Statistik Kesehatan (Fit, Note, Unfit)
            // Mapping from DB 'status_kesehatan' to UI labels
            $kesehatan = [
                'fit' => Pekerja::where('status_kesehatan', 'sehat')->count(),
                'note' => Pekerja::where('status_kesehatan', 'sakit_ringan')->count(),
                'unfit' => Pekerja::where('status_kesehatan', 'sakit_berat')->count(),
            ];

            return response()->json([
                'status' => 'success',
                'data' => [
                    'total_pekerja' => $totalPekerja,
                    'total_perusahaan' => $totalPerusahaan,
                    'kasus_aktif' => $kasusAktif,
                    'advokasi_selesai' => $advokasiSelesai,
                    'klaim_disetujui' => $klaimDisetujui,
                    'kesehatan' => $kesehatan,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil statistik: ' . $e->getMessage()
            ], 500);
        }
    }
}
