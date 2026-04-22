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

            // Advokasi dalam Proses
            $advokasiProses = StatusAdvokasi::whereNotNull('jenis_kasus')
                ->where('rehabilitasi_bpjskes', false)
                ->count();
            $kepatuhanRate = $advokasiProses;
            
            // Counts for Jenis PAK and Total
            $suksesAdvokasi = StatusAdvokasi::whereNotNull('jenis_kasus')->distinct('jenis_kasus')->count('jenis_kasus');
            $successRate = $suksesAdvokasi; // Will be displayed as a whole number now

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

            // 3. Jenis PAK Distribution (Formerly Sector Compliance)
            $totalCases = StatusAdvokasi::whereNotNull('jenis_kasus')->count();
            $colors = ['bg-[#0ea5e9]', 'bg-[#10b981]', 'bg-[#f59e0b]', 'bg-[#ef4444]', 'bg-[#8b5cf6]'];
            
            $sectorData = StatusAdvokasi::whereNotNull('jenis_kasus')
                ->select('jenis_kasus as name', DB::raw('COUNT(*) as total'))
                ->groupBy('jenis_kasus')
                ->orderByDesc('total')
                ->limit(5)
                ->get()
                ->map(function ($item, $index) use ($totalCases, $colors) {
                    $name = strtoupper($item->name);
                    
                    return [
                        'name' => $name,
                        'value' => $totalCases > 0 ? round(($item->total / $totalCases) * 100) : 0,
                        'color' => $colors[$index % count($colors)]
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
                    'case' => strtoupper($adv->jenis_kasus),
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
                            'value' => number_format($kepatuhanRate),
                            'trend' => 0,
                        ],
                        'sukses_advokasi' => [
                            'value' => number_format($successRate),
                            'trend' => 0,
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
                    'case' => strtoupper($adv->jenis_kasus),
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
