<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pekerja;
use App\Models\StatusAdvokasi;
use App\Models\Perusahaan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Get aggregate statistics for the reports page.
     */
    public function summary(): JsonResponse
    {
        try {
            // 1. Summary Cards Logic
            $currentMonth = Carbon::now()->startOfMonth();
            $lastMonth = Carbon::now()->subMonth()->startOfMonth();

            // Total Kasus
            $totalKasus = StatusAdvokasi::whereNotNull('jenis_kasus')->count();
            $totalKasusPrev = StatusAdvokasi::whereNotNull('jenis_kasus')
                ->where('created_at', '<', $currentMonth)
                ->count();
            
            $kasusTrend = $totalKasusPrev > 0 
                ? round((($totalKasus - $totalKasusPrev) / $totalKasusPrev) * 100, 1) 
                : 0;

            // Kepatuhan (Pekerja with at least one medical record)
            $totalPekerja = Pekerja::count();
            $pekerjaPatuh = Pekerja::has('detailMedis')->count();
            $kepatuhanRate = $totalPekerja > 0 ? round(($pekerjaPatuh / $totalPekerja) * 100, 1) : 0;
            
            // Success Rate
            $suksesAdvokasi = StatusAdvokasi::where('rehabilitasi_bpjskes', true)->count();
            $successRate = $totalKasus > 0 ? round(($suksesAdvokasi / $totalKasus) * 100, 1) : 0;

            // 2. Chart Data (Last 6 Months)
            $chartData = [];
            for ($i = 5; $i >= 0; $i--) {
                $month = Carbon::now()->subMonths($i);
                $count = StatusAdvokasi::whereNotNull('jenis_kasus')
                    ->whereYear('created_at', $month->year)
                    ->whereMonth('created_at', $month->month)
                    ->count();
                
                $chartData[] = [
                    'month' => strtoupper($month->translatedFormat('M')),
                    'kasus' => $count
                ];
            }

            // 3. Sector Compliance
            $sectorData = DB::table('perusahaan')
                ->join('pekerja', 'perusahaan.id', '=', 'pekerja.perusahaan_id')
                ->leftJoin('detail_medis', 'pekerja.id', '=', 'detail_medis.pekerja_id')
                ->select(
                    'perusahaan.sektor_industri as name',
                    DB::raw('COUNT(DISTINCT pekerja.id) as total_pekerja'),
                    DB::raw('COUNT(DISTINCT detail_medis.pekerja_id) as patuh_pekerja')
                )
                ->where('perusahaan.deleted_at', null)
                ->groupBy('perusahaan.sektor_industri')
                ->limit(5)
                ->get()
                ->map(function ($item) {
                    return [
                        'name' => $item->name ?: 'Tidak Diketahui',
                        'value' => $item->total_pekerja > 0 ? round(($item->patuh_pekerja / $item->total_pekerja) * 100) : 0,
                        'color' => 'bg-[#0ea5e9]'
                    ];
                });

            // 4. Recent Success Stories
            $recentSuccesses = StatusAdvokasi::where('rehabilitasi_bpjskes', true)
                ->with(['pekerja' => fn($q) => $q->with('perusahaan')])
                ->latest()
                ->limit(5)
                ->get()
                ->map(fn($adv) => [
                    'worker' => $adv->pekerja->nama_lengkap,
                    'company' => $adv->pekerja->perusahaan->nama_perusahaan ?? 'Personal',
                    'case' => $adv->jenis_kasus,
                    'date' => $adv->updated_at->format('d M Y')
                ]);

            return response()->json([
                'status' => 'success',
                'data' => [
                    'summary' => [
                        'total_kasus' => [
                            'value' => number_format($totalKasus),
                            'trend' => $kasusTrend,
                        ],
                        'kepatuhan' => [
                            'value' => $kepatuhanRate . '%',
                            'trend' => -1.2,
                        ],
                        'sukses_advokasi' => [
                            'value' => $successRate . '%',
                            'trend' => 2.4,
                        ]
                    ],
                    'chart_data' => $chartData,
                    'sector_data' => $sectorData,
                    'recent_successes' => $recentSuccesses,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memuat laporan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Search advocacy cases by NIK or Name.
     */
    public function search(Request $request): JsonResponse
    {
        $query = $request->query('query');

        $results = StatusAdvokasi::whereNotNull('jenis_kasus')
            ->whereHas('pekerja', function($q) use ($query) {
                if ($query) {
                    $q->where('nama_lengkap', 'like', "%{$query}%")
                      ->orWhere('nik', 'like', "%{$query}%");
                }
            })
            ->with(['pekerja' => function($q) {
                $q->with('perusahaan');
            }])
            ->latest()
            ->limit(10)
            ->get()
            ->map(function($adv) {
                // Determine display status
                $status = 'PROSES';
                $color = 'bg-blue-50 text-blue-600 border-blue-200';
                
                if ($adv->rehabilitasi_bpjskes) {
                    $status = 'SELESAI';
                    $color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                }

                return [
                    'company' => $adv->pekerja->perusahaan->nama_perusahaan ?? 'Personal',
                    'worker' => $adv->pekerja->nama_lengkap,
                    'case' => $adv->jenis_kasus,
                    'status' => $status,
                    'statusColor' => $color,
                    'pekerja_id' => $adv->pekerja_id
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => $results
        ]);
    }
}
