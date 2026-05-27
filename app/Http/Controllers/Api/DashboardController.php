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
     * Menggunakan data asli dari kolom faktor_pak pada tabel pekerja.
     * 
     * @return JsonResponse
     */
    public function trendKlasifikasi(\Illuminate\Http\Request $request): JsonResponse
    {
        try {
            $timeRange = $request->query('time_range', 'all');
            $sector = $request->query('sector', 'all');

            // Kita hitung dari 6 bulan terakhir sampai bulan ini
            $trend = [];
            $months = [];
            for ($i = 5; $i >= 0; $i--) {
                $months[] = now()->subMonths($i);
            }

            // Fetch dynamic Category IV diseases
            $penyakitKategori4 = \App\Models\PenyakitSpesifik::where('kategori', 'kategori_4')
                                    ->pluck('nama_penyakit')
                                    ->toArray();

            // Semua label yang valid di chart
            $semuaKategori = array_merge([
                'Faktor Kimia', 'Faktor Fisika', 'Faktor Biologi', 
                'Pernafasan', 'Kulit', 'Otot & Kerangka', 'Mental & Perilaku', 
                'Kanker Akibat Kerja'
            ], $penyakitKategori4);

            foreach ($months as $month) {
                $bulanName = $month->translatedFormat('M'); // Jan, Feb, dst
                
                $item = ['bulan' => $bulanName];
                
                // Inisialisasi semua kategori dengan 0
                foreach ($semuaKategori as $kat) {
                    $item[$kat] = 0;
                }

                // Hitung dari DB
                $query = \App\Models\Pekerja::whereNotNull('faktor_pak')
                    ->whereYear('created_at', $month->year)
                    ->whereMonth('created_at', $month->month);
                
                // Apply Sector Filter
                if ($sector && $sector !== 'all') {
                    $query->whereHas('perusahaan', function($q) use ($sector) {
                        $q->where('sektor_industri', $sector);
                    });
                }

                $counts = $query->select('faktor_pak', \Illuminate\Support\Facades\DB::raw('COUNT(*) as total'))
                    ->groupBy('faktor_pak')
                    ->get();

                foreach ($counts as $count) {
                    // Cek jika faktor_pak valid dan ada di chart
                    if (in_array($count->faktor_pak, $semuaKategori)) {
                        $item[$count->faktor_pak] = $count->total;
                    }
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

            // Kategori Map
            $penyebab = ['Faktor Kimia', 'Faktor Fisika', 'Faktor Biologi'];
            $targetOrgan = ['Pernafasan', 'Kulit', 'Otot & Kerangka', 'Mental & Perilaku'];
            
            $penyakitKategori4 = \App\Models\PenyakitSpesifik::where('kategori', 'kategori_4')
                                    ->pluck('nama_penyakit')
                                    ->toArray();

            $formattedData = $pekerjaList->map(function ($pekerja) use ($penyebab, $targetOrgan, $penyakitKategori4) {
                $advokasi = $pekerja->statusAdvokasi;
                
                // Fallback jika advokasi kosong
                $statusKasus = $advokasi ? $advokasi->tahap : 'Belum Ada Kasus';
                if ($advokasi && $advokasi->rehabilitasi_bpjskes) {
                    $statusKasus = 'Selesai';
                }

                $kategoriSpesifik = $pekerja->faktor_pak ?? 'Belum Ditentukan';
                $kategoriName = 'Belum Ditentukan';

                if (in_array($pekerja->faktor_pak, $penyebab)) {
                    $kategoriName = 'Penyebab';
                } elseif (in_array($pekerja->faktor_pak, $targetOrgan)) {
                    $kategoriName = 'Target Organ';
                } elseif ($pekerja->faktor_pak === 'Kanker Akibat Kerja') {
                    $kategoriName = 'Kanker';
                } elseif (in_array($pekerja->faktor_pak, $penyakitKategori4)) {
                    $kategoriName = 'Penyakit Spesifik Lainnya';
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
