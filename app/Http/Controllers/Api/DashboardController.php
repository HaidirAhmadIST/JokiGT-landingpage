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
            $now = now();
            $startOfThisMonth = $now->copy()->startOfMonth();

            $calcTrend = function ($current, $previous) {
                if ($previous == 0) return $current > 0 ? 100 : 0;
                return round((($current - $previous) / $previous) * 100, 1);
            };

            // 1. Total Pekerja
            $totalPekerja = Pekerja::count();
            $totalPekerjaLastMonth = Pekerja::where('created_at', '<', $startOfThisMonth)->count();

            // 2. Kasus Aktif
            $kasusAktif = StatusAdvokasi::whereNotNull('jenis_kasus')
                ->where('rehabilitasi_bpjskes', false)
                ->count();
            $kasusAktifLastMonth = StatusAdvokasi::whereNotNull('jenis_kasus')
                ->where('rehabilitasi_bpjskes', false)
                ->where('created_at', '<', $startOfThisMonth)
                ->count();

            // 3. Advokasi Selesai
            $advokasiSelesai = StatusAdvokasi::where('rehabilitasi_bpjskes', true)->count();
            $advokasiSelesaiLastMonth = StatusAdvokasi::where('rehabilitasi_bpjskes', true)
                ->where('created_at', '<', $startOfThisMonth)
                ->count();

            // 4. Klaim Disetujui
            $klaimDisetujui = StatusAdvokasi::where('kompensasi_bpjstk', true)->count();
            $klaimDisetujuiLastMonth = StatusAdvokasi::where('kompensasi_bpjstk', true)
                ->where('created_at', '<', $startOfThisMonth)
                ->count();

            // 5. Total Perusahaan
            $totalPerusahaan = Perusahaan::count();
            $totalPerusahaanLastMonth = Perusahaan::where('created_at', '<', $startOfThisMonth)->count();

            // 6. Statistik Kesehatan
            $kesehatan = [
                'fit' => Pekerja::where('status_kesehatan', 'sehat')->count(),
                'note' => Pekerja::where('status_kesehatan', 'sehat_dengan_catatan')->count(),
                'unfit' => Pekerja::where('status_kesehatan', 'tidak_sehat')->count(),
            ];

            return response()->json([
                'status' => 'success',
                'data' => [
                    'total_pekerja' => $totalPekerja,
                    'total_pekerja_new' => $totalPekerja - $totalPekerjaLastMonth,
                    'kasus_aktif' => $kasusAktif,
                    'kasus_aktif_new' => $kasusAktif - $kasusAktifLastMonth,
                    'advokasi_selesai' => $advokasiSelesai,
                    'advokasi_selesai_new' => $advokasiSelesai - $advokasiSelesaiLastMonth,
                    'klaim_disetujui' => $klaimDisetujui,
                    'klaim_disetujui_new' => $klaimDisetujui - $klaimDisetujuiLastMonth,
                    'total_perusahaan' => $totalPerusahaan,
                    'total_perusahaan_new' => $totalPerusahaan - $totalPerusahaanLastMonth,
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
