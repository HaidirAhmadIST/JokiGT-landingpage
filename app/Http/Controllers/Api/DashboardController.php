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
            $requestUser = auth('sanctum')->user();
            $perusahaanFilter = ($requestUser && $requestUser->isPetugas())
                ? ($requestUser->perusahaan_id ?? $requestUser->pekerja?->perusahaan_id)
                : null;
            $cacheKey = $perusahaanFilter
                ? 'stats_perusahaan_' . $perusahaanFilter
                : 'admin_dashboard_stats';

            $data = cache()->remember($cacheKey, 30, function () use ($perusahaanFilter) {
                $startOfThisMonth = now()->startOfMonth();

                // ── Pekerja ─────────────────────────────────────────────────────
                $pekerjaBaseQuery = Pekerja::query();
                if ($perusahaanFilter) {
                    $pekerjaBaseQuery->where('perusahaan_id', $perusahaanFilter);
                }
                $totalPekerja = (clone $pekerjaBaseQuery)->count();
                $newPekerja   = (clone $pekerjaBaseQuery)->where('created_at', '>=', $startOfThisMonth)->count();

                // ── Base Query for Advokasi (Filtered by Company) ────────────────
                $advokasiBaseQuery = StatusAdvokasi::query();
                if ($perusahaanFilter) {
                    $advokasiBaseQuery->whereHas('pekerja', fn($q) => $q->where('perusahaan_id', $perusahaanFilter));
                }

                // ── Kasus Aktif (Advokasi yang belum selesai rehabilitasi) ───────
                $kasusAktif = (clone $advokasiBaseQuery)->whereNotNull('jenis_kasus')
                    ->where('rehabilitasi_bpjskes', false)
                    ->count();
                $newKasus   = (clone $advokasiBaseQuery)->whereNotNull('jenis_kasus')
                    ->where('rehabilitasi_bpjskes', false)
                    ->where('created_at', '>=', $startOfThisMonth)
                    ->count();

                // ── Advokasi Selesai ─────────────────────────────────────────────
                $advokasiSelesai = (clone $advokasiBaseQuery)->where('rehabilitasi_bpjskes', true)->count();
                $newSelesai      = (clone $advokasiBaseQuery)->where('created_at', '>=', $startOfThisMonth)
                    ->where('rehabilitasi_bpjskes', true)
                    ->count();

                // ── Klaim Disetujui ──────────────────────────────────────────────
                $klaimDisetujui = (clone $advokasiBaseQuery)->where('kompensasi_bpjstk', true)->count();
                $newKlaim       = (clone $advokasiBaseQuery)->where('created_at', '>=', $startOfThisMonth)
                    ->where('kompensasi_bpjstk', true)
                    ->count();

                // ── Perusahaan ───────────────────────────────────────────────────
                $perusahaanBaseQuery = Perusahaan::query();
                if ($perusahaanFilter) {
                    $perusahaanBaseQuery->where('id', $perusahaanFilter);
                }
                $totalPerusahaan = (clone $perusahaanBaseQuery)->count();
                $newPerusahaan   = (clone $perusahaanBaseQuery)->where('created_at', '>=', $startOfThisMonth)->count();

                // ── Status Kesehatan (Optimized to 1 Query) ─────────────────────
                $kesehatanBaseQuery = Pekerja::query();
                if ($perusahaanFilter) {
                    $kesehatanBaseQuery->where('perusahaan_id', $perusahaanFilter);
                }
                $kesehatanStats = $kesehatanBaseQuery->selectRaw("
                    COUNT(CASE WHEN status_kesehatan = 'sehat' THEN 1 END) as fit,
                    COUNT(CASE WHEN status_kesehatan = 'sehat_dengan_catatan' THEN 1 END) as note,
                    COUNT(CASE WHEN status_kesehatan = 'tidak_sehat' THEN 1 END) as unfit
                ")->first();

                $kesehatan = [
                    'fit'   => (int) $kesehatanStats->fit,
                    'note'  => (int) $kesehatanStats->note,
                    'unfit' => (int) $kesehatanStats->unfit,
                ];

                // ── Sebaran Wilayah Kasus (PAK/dll) ──────────────────────────────
                // Optimasi: Tidak menggunakan LOWER() di SQL untuk menghindari Full Table Scan jika ada Index.
                // MySQL default collation (utf8mb4_unicode_ci) sudah case-insensitive untuk GROUP BY.
                $sebaranQuery = \Illuminate\Support\Facades\DB::table('status_advokasi')
                    ->join('pekerja', 'status_advokasi.pekerja_id', '=', 'pekerja.id')
                    ->whereNotNull('status_advokasi.jenis_kasus');

                if ($perusahaanFilter) {
                    $sebaranQuery->where('pekerja.perusahaan_id', $perusahaanFilter);
                }

                $sebaranWilayah = $sebaranQuery->select('pekerja.domisili', \Illuminate\Support\Facades\DB::raw('COUNT(*) as total'))
                    ->groupBy('pekerja.domisili')
                    ->get()
                    ->filter(function($item) {
                        return !empty($item->domisili);
                    })
                    ->mapWithKeys(function ($item) {
                        // Normalisasi ke huruf kecil di level PHP (Aman & Ringan)
                        $provinsi = strtolower(trim($item->domisili));
                        return [$provinsi => (int) $item->total];
                    })->toArray();

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
                    'sebaran_wilayah'     => $sebaranWilayah,
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
