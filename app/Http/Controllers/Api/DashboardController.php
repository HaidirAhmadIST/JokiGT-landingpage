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
        // Gunakan cache singkat (30 detik) agar tidak membebani DB saat banyak admin login bersamaan
        return cache()->remember('admin_dashboard_stats', 30, function () {
            $startOfThisMonth = now()->startOfMonth();

            // 1. Pekerja Stats
            $totalPekerja = Pekerja::count();
            $newPekerja = Pekerja::where('created_at', '>=', $startOfThisMonth)->count();

            // 2. Kasus Aktif (Advokasi yang belum rehabilitasi)
            $kasusAktif = StatusAdvokasi::whereNotNull('jenis_kasus')
                ->where('rehabilitasi_bpjskes', false)
                ->count();
            $newKasus = StatusAdvokasi::whereNotNull('jenis_kasus')
                ->where('rehabilitasi_bpjskes', false)
                ->where('created_at', '>=', $startOfThisMonth)
                ->count();

            // 3. Advokasi Selesai
            $advokasiSelesai = StatusAdvokasi::where('rehabilitasi_bpjskes', true)->count();
            $newSelesai = StatusAdvokasi::where('created_at', '>=', $startOfThisMonth)
                ->where('rehabilitasi_bpjskes', true)
                ->count();

            // 4. Klaim Disetujui
            $klaimDisetujui = StatusAdvokasi::where('kompensasi_bpjstk', true)->count();
            $newKlaim = StatusAdvokasi::where('created_at', '>=', $startOfThisMonth)
                ->where('kompensasi_bpjstk', true)
                ->count();

            // 5. Total Perusahaan
            $totalPerusahaan = Perusahaan::count();
            $newPerusahaan = Perusahaan::where('created_at', '>=', $startOfThisMonth)->count();

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
                    'total_pekerja_new' => $newPekerja,
                    'kasus_aktif' => $kasusAktif,
                    'kasus_aktif_new' => $newKasus,
                    'advokasi_selesai' => $advokasiSelesai,
                    'advokasi_selesai_new' => $newSelesai,
                    'klaim_disetujui' => $klaimDisetujui,
                    'klaim_disetujui_new' => $newKlaim,
                    'total_perusahaan' => $totalPerusahaan,
                    'total_perusahaan_new' => $newPerusahaan,
                    'kesehatan' => $kesehatan,
                ]
            ]);
        });
    }
}
