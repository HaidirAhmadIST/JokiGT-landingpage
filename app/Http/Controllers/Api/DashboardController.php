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

    /**
     * Mengambil trend klasifikasi bulanan untuk chart.
     * Mengembalikan data mock yang digabungkan dengan master penyakit kategori spesifik secara dinamis.
     * 
     * @return JsonResponse
     */
    public function trendKlasifikasi(): JsonResponse
    {
        try {
            // Simulasi bulan (Bisa diganti dengan query agregat DB sesungguhnya berdasarkan created_at/tanggal_pelaporan)
            $months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'];
            
            $baseData = [
                ['Faktor Kimia' => 15, 'Faktor Fisika' => 25, 'Faktor Biologi' => 10, 'Pernafasan' => 12, 'Kulit' => 8, 'Otot & Kerangka' => 30, 'Mental & Perilaku' => 4, 'Kanker Akibat Kerja' => 3],
                ['Faktor Kimia' => 20, 'Faktor Fisika' => 30, 'Faktor Biologi' => 15, 'Pernafasan' => 15, 'Kulit' => 10, 'Otot & Kerangka' => 35, 'Mental & Perilaku' => 5, 'Kanker Akibat Kerja' => 4],
                ['Faktor Kimia' => 25, 'Faktor Fisika' => 35, 'Faktor Biologi' => 20, 'Pernafasan' => 18, 'Kulit' => 12, 'Otot & Kerangka' => 40, 'Mental & Perilaku' => 6, 'Kanker Akibat Kerja' => 5],
                ['Faktor Kimia' => 30, 'Faktor Fisika' => 40, 'Faktor Biologi' => 25, 'Pernafasan' => 22, 'Kulit' => 15, 'Otot & Kerangka' => 45, 'Mental & Perilaku' => 8, 'Kanker Akibat Kerja' => 7],
                ['Faktor Kimia' => 35, 'Faktor Fisika' => 45, 'Faktor Biologi' => 30, 'Pernafasan' => 28, 'Kulit' => 18, 'Otot & Kerangka' => 50, 'Mental & Perilaku' => 10, 'Kanker Akibat Kerja' => 9],
                ['Faktor Kimia' => 25, 'Faktor Fisika' => 25, 'Faktor Biologi' => 15, 'Pernafasan' => 25, 'Kulit' => 27, 'Otot & Kerangka' => 50, 'Mental & Perilaku' => 7, 'Kanker Akibat Kerja' => 17],
            ];

            // Fetch dynamic Category IV diseases
            $penyakitKategori4 = \App\Models\PenyakitSpesifik::where('kategori', 'kategori_4')
                                    ->pluck('nama_penyakit')
                                    ->toArray();

            $trend = [];
            foreach ($months as $index => $bulan) {
                $item = ['bulan' => $bulan];
                // Merge base data
                $item = array_merge($item, $baseData[$index]);
                
                // Merge dynamic category 4 data. Di masa depan bisa melakukan query COUNT() dari status_advokasi.
                // Saat ini disimulasikan sebagai 0 (empty state) atau 1 agar terender.
                foreach ($penyakitKategori4 as $penyakit) {
                    $item[$penyakit] = 0; 
                }
                
                $trend[] = $item;
            }

            return response()->json([
                'status' => 'success',
                'data' => [
                    'trend' => $trend,
                    'kategori_4_keys' => $penyakitKategori4
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('DashboardController@trendKlasifikasi failed: ' . $e->getMessage());

            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal mengambil data trend klasifikasi.',
                'error'   => env('APP_DEBUG') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Mengambil daftar pekerja untuk tabel berdasarkan filter klasifikasi.
     * Menerapkan Role-Based Access Control (RBAC).
     *
     * @return JsonResponse
     */
    public function pekerjaKlasifikasi(\Illuminate\Http\Request $request): JsonResponse
    {
        try {
            $user = auth('sanctum')->user();
            $filter = $request->query('filter', 'all');

            // Super Admin dapat melihat semua, sedangkan Petugas/Tim Medis difilter perusahaannya.
            $perusahaanId = ($user && $user->isPetugas())
                ? ($user->perusahaan_id ?? $user->pekerja?->perusahaan_id)
                : null;

            $query = Pekerja::with(['perusahaan', 'statusAdvokasi']);

            if ($perusahaanId) {
                $query->where('perusahaan_id', $perusahaanId);
            }

            // Ambil semua data pekerja (atau dengan pagination jika data banyak)
            $pekerjaList = $query->orderBy('created_at', 'desc')->get();

            // Transformasi data untuk memetakan kategori (mocking simulasi kategori)
            // Karena DB saat ini belum memiliki mapping pasti ke Faktor Kimia / Organ
            $formattedData = $pekerjaList->map(function ($pekerja) {
                $advokasi = $pekerja->statusAdvokasi;
                
                // Fallback jika advokasi kosong
                $statusKasus = $advokasi ? $advokasi->tahap : 'Belum Ada Kasus';
                if ($advokasi && $advokasi->rehabilitasi_bpjskes) {
                    $statusKasus = 'Selesai';
                }

                // --- Simulasi Kategori (Mock) ---
                // Berdasarkan ID (agar stabil tiap refresh)
                $idMod = $pekerja->id % 4;
                if ($idMod === 0) {
                    $kategoriName = 'Penyebab';
                    $kategoriSpesifik = 'Faktor Kimia';
                } elseif ($idMod === 1) {
                    $kategoriName = 'Target Organ';
                    $kategoriSpesifik = 'Pernafasan';
                } elseif ($idMod === 2) {
                    $kategoriName = 'Kanker';
                    $kategoriSpesifik = 'Kanker Akibat Kerja';
                } else {
                    $kategoriName = 'Penyakit Spesifik Lainnya';
                    $kategoriSpesifik = 'Nystagmus pada penambang';
                }

                return [
                    'id' => 'PAK-' . str_pad($pekerja->id, 3, '0', STR_PAD_LEFT),
                    'real_id' => $pekerja->id,
                    'name' => $pekerja->nama_lengkap,
                    'company' => $pekerja->perusahaan ? $pekerja->perusahaan->nama_perusahaan : '-',
                    'organTarget' => $kategoriSpesifik,
                    'kategoriName' => $kategoriName, // 'Penyebab', 'Target Organ', 'Kanker', 'Penyakit Spesifik Lainnya'
                    'status' => $statusKasus,
                    'date' => $pekerja->created_at->format('Y-m-d'),
                ];
            });

            // Filter data secara dinamis berdasarkan parameter kategori chart
            if ($filter !== 'all') {
                $formattedData = $formattedData->filter(function ($item) use ($filter) {
                    return $item['kategoriName'] === $filter;
                })->values();
            }

            $roleName = 'Guest';
            if ($user) {
                if ($user->isAdmin()) {
                    $roleName = 'Super Admin';
                } elseif ($user->isPetugas()) {
                    $roleName = 'Admin Serikat';
                } else {
                    $roleName = 'Staff';
                }
            }

            return response()->json([
                'status' => 'success',
                'data' => $formattedData,
                'role' => $roleName, // Untuk frontend RBAC UI (bisa delete/view)
            ]);

        } catch (\Exception $e) {
            Log::error('DashboardController@pekerjaKlasifikasi failed: ' . $e->getMessage());

            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal mengambil data pekerja.',
                'error'   => env('APP_DEBUG') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
