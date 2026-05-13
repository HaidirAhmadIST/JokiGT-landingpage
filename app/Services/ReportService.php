<?php
 
namespace App\Services;
 
use App\Models\StatusAdvokasi;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;
 
class ReportService
{
    /**
     * Get aggregate statistics for the reports page.
     *
     * @return array
     */
    public function getSummaryStats(): array
    {
        $currentMonth = Carbon::now()->startOfMonth();
 
        $calcTrend = function ($current, $previous) {
            if ($previous == 0) return $current > 0 ? 100 : 0;
            return round((($current - $previous) / $previous) * 100, 1);
        };
 
        // 1. Total Kasus
        $totalKasus = StatusAdvokasi::whereNotNull('jenis_kasus')->count();
        $totalKasusPrev = StatusAdvokasi::whereNotNull('jenis_kasus')
            ->where('created_at', '<', $currentMonth)
            ->count();
        
        // 2. Advokasi dalam Proses
        $advokasiProses = StatusAdvokasi::whereNotNull('jenis_kasus')
            ->where('rehabilitasi_bpjskes', false)
            ->count();
        $advokasiProsesPrev = StatusAdvokasi::whereNotNull('jenis_kasus')
            ->where('rehabilitasi_bpjskes', false)
            ->where('created_at', '<', $currentMonth)
            ->count();

        // 3. Tingkat Keberhasilan (Jumlah Kasus Selesai / Total Kasus) * 100
        $kasusSelesai = StatusAdvokasi::whereNotNull('jenis_kasus')
            ->where('rehabilitasi_bpjskes', true)
            ->count();
            
        $tingkatKeberhasilan = $totalKasus > 0 
            ? round(($kasusSelesai / $totalKasus) * 100, 1) 
            : 0;

        $uniqueCaseTypes = StatusAdvokasi::whereNotNull('jenis_kasus')->distinct('jenis_kasus')->count('jenis_kasus');
 
        return [
            'total_kasus' => [
                'value' => number_format($totalKasus),
                'new' => $totalKasus - $totalKasusPrev,
            ],
            'kepatuhan' => [
                'value' => number_format($advokasiProses),
                'new' => $advokasiProses - $advokasiProsesPrev,
            ],
            'kasus_selesai' => [
                'value' => number_format($kasusSelesai),
                'trend' => 0,
            ],
            'sukses_advokasi' => [
                'value' => number_format($tingkatKeberhasilan, 1, '.', ''),
                'trend' => 0,
            ]
        ];
    }
 
 
    /**
     * Get chart data for the last 6 months.
     *
     * @return array
     */
    public function getChartData(): array
    {
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
        return $chartData;
    }
 
    /**
     * Get distribution of case types (Jenis PAK/Kasus).
     *
     * @return Collection
     */
    public function getSectorData(): Collection
    {
        $totalCases = StatusAdvokasi::whereNotNull('jenis_kasus')->count();
        $colors = ['bg-[#0ea5e9]', 'bg-[#10b981]', 'bg-[#f59e0b]', 'bg-[#ef4444]', 'bg-[#8b5cf6]'];
        
        return StatusAdvokasi::whereNotNull('jenis_kasus')
            ->select('jenis_kasus as name', DB::raw('COUNT(*) as total'))
            ->groupBy('jenis_kasus')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(function ($item, $index) use ($totalCases, $colors) {
                return [
                    'name' => strtoupper($item->name),
                    'value' => $totalCases > 0 ? round(($item->total / $totalCases) * 100) : 0,
                    'color' => $colors[$index % count($colors)]
                ];
            });
    }
 
    /**
     * Get recent successfully completed cases.
     *
     * @return Collection
     */
    public function getRecentSuccesses(): Collection
    {
        return StatusAdvokasi::where('rehabilitasi_bpjskes', true)
            ->with(['pekerja' => fn($q) => $q->with('perusahaan')])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn($adv) => [
                'worker' => $adv->pekerja->nama_lengkap ?? '-',
                'company' => $adv->pekerja->perusahaan->nama_perusahaan ?? 'Personal',
                'case' => strtoupper($adv->jenis_kasus),
                'date' => $adv->updated_at->format('d M Y')
            ]);
    }
 
    /**
     * Search advocacy cases by NIK or Name.
     *
     * @param string|null $query
     * @return Collection
     */
    public function searchCases(?string $query): Collection
    {
        return StatusAdvokasi::whereNotNull('jenis_kasus')
            ->whereHas('pekerja', function($q) use ($query) {
                if ($query) {
                    $search = strtolower($query);
                    $q->whereRaw('LOWER(nama_lengkap) LIKE ?', ["%{$search}%"])
                      ->orWhereRaw('LOWER(nik) LIKE ?', ["%{$search}%"]);
                }
            })
            ->with(['pekerja' => function($q) {
                $q->with('perusahaan');
            }])
            ->latest()
            ->limit(10)
            ->get()
            ->map(function($adv) {
                $status = 'PROSES';
                $color = 'bg-blue-50 text-blue-600 border-blue-200';
                
                if ($adv->rehabilitasi_bpjskes) {
                    $status = 'SELESAI';
                    $color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                }
 
                return [
                    'company' => $adv->pekerja->perusahaan->nama_perusahaan ?? 'Personal',
                    'worker' => $adv->pekerja->nama_lengkap ?? '-',
                    'case' => strtoupper($adv->jenis_kasus),
                    'status' => $status,
                    'statusColor' => $color,
                    'pekerja_id' => $adv->pekerja_id
                ];
            });
    }
}
