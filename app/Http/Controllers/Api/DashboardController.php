<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pekerja;
use App\Models\Perusahaan;
use App\Models\StatusAdvokasi;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

/**
 * DashboardController
 *
 * Menyediakan statistik agregat untuk halaman Dashboard Admin.
 * Data di-cache selama 30 detik untuk mencegah beban database berlebih
 * saat banyak admin membuka halaman secara bersamaan.
 */
class DashboardController extends Controller
{
    /**
     * Mengambil statistik utama dashboard admin.
     *
     * Menghitung total pekerja, kasus aktif, advokasi selesai, klaim disetujui,
     * total perusahaan, dan breakdown status kesehatan pekerja.
     *
     * @return JsonResponse
     */
    public function stats(): JsonResponse
    {
        try {
            // Cache 30 detik agar tidak memukul DB setiap request
            $data = cache()->remember('admin_dashboard_stats', 30, function () {
                $startOfThisMonth = now()->startOfMonth();

                // ── Pekerja ─────────────────────────────────────────────────────
                $totalPekerja = Pekerja::count();
                $newPekerja   = Pekerja::where('created_at', '>=', $startOfThisMonth)->count();

                // ── Kasus Aktif (Advokasi yang belum selesai rehabilitasi) ───────
                $kasusAktif = StatusAdvokasi::whereNotNull('jenis_kasus')
                    ->where('rehabilitasi_bpjskes', false)
                    ->count();
                $newKasus   = StatusAdvokasi::whereNotNull('jenis_kasus')
                    ->where('rehabilitasi_bpjskes', false)
                    ->where('created_at', '>=', $startOfThisMonth)
                    ->count();

                // ── Advokasi Selesai ─────────────────────────────────────────────
                $advokasiSelesai = StatusAdvokasi::where('rehabilitasi_bpjskes', true)->count();
                $newSelesai      = StatusAdvokasi::where('created_at', '>=', $startOfThisMonth)
                    ->where('rehabilitasi_bpjskes', true)
                    ->count();

                // ── Klaim Disetujui ──────────────────────────────────────────────
                $klaimDisetujui = StatusAdvokasi::where('kompensasi_bpjstk', true)->count();
                $newKlaim       = StatusAdvokasi::where('created_at', '>=', $startOfThisMonth)
                    ->where('kompensasi_bpjstk', true)
                    ->count();

                // ── Perusahaan ───────────────────────────────────────────────────
                $totalPerusahaan = Perusahaan::count();
                $newPerusahaan   = Perusahaan::where('created_at', '>=', $startOfThisMonth)->count();

                // ── Status Kesehatan ─────────────────────────────────────────────
                $kesehatan = [
                    'fit'   => Pekerja::where('status_kesehatan', 'sehat')->count(),
                    'note'  => Pekerja::where('status_kesehatan', 'sehat_dengan_catatan')->count(),
                    'unfit' => Pekerja::where('status_kesehatan', 'tidak_sehat')->count(),
                ];

                return [
                    'total_pekerja'       => $totalPekerja,
                    'total_pekerja_new'   => $newPekerja,
                    'kasus_aktif'         => $kasusAktif,
                    'kasus_aktif_new'     => $newKasus,
                    'advokasi_selesai'    => $advokasiSelesai,
                    'advokasi_selesai_new'=> $newSelesai,
                    'klaim_disetujui'     => $klaimDisetujui,
                    'klaim_disetujui_new' => $newKlaim,
                    'total_perusahaan'    => $totalPerusahaan,
                    'total_perusahaan_new'=> $newPerusahaan,
                    'kesehatan'           => $kesehatan,
                ];
            });

            return response()->json([
                'status' => 'success',
                'data'   => $data,
            ]);

        } catch (\Exception $e) {
            Log::error('DashboardController@stats failed: ' . $e->getMessage());

            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal mengambil statistik dashboard.',
                'error'   => env('APP_DEBUG') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
