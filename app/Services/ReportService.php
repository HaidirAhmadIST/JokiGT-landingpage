<?php
 
namespace App\Services;
 
use App\Models\StatusAdvokasi;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;
 
class ReportService
{
    /**
     * Get unique industrial sectors from Perusahaan table.
     * 
     * @return array
     */
    public function getSectors(): array
    {
        return \App\Models\Perusahaan::select('sektor_industri')
            ->distinct()
            ->whereNotNull('sektor_industri')
            ->where('sektor_industri', '!=', '')
            ->pluck('sektor_industri')
            ->toArray();
    }

    /**
     * Apply time and sector filters to a query.
     */
    private function applyFilters($query, ?string $timeRange, ?string $sector, bool $isPekerjaQuery = false)
    {
        if ($sector && $sector !== 'all') {
            if ($isPekerjaQuery) {
                $query->whereHas('perusahaan', function($q) use ($sector) {
                    $q->where('sektor_industri', $sector);
                });
            } else {
                $query->whereHas('pekerja.perusahaan', function($q) use ($sector) {
                    $q->where('sektor_industri', $sector);
                });
            }
        }

        if ($timeRange && $timeRange !== 'all') {
            $now = Carbon::now();
            $column = $isPekerjaQuery ? 'created_at' : 'created_at';
            
            if ($timeRange === 'Bulan Ini') {
                $query->where($column, '>=', $now->copy()->startOfMonth());
            } elseif ($timeRange === '3 Bulan Terakhir') {
                $query->where($column, '>=', $now->copy()->subMonths(2)->startOfMonth());
            } elseif ($timeRange === 'Tahun Ini') {
                $query->where($column, '>=', $now->copy()->startOfYear());
            }
        }
        return $query;
    }

    /**
     * Get aggregate statistics for the reports page.
     *
     * @return array
     */
    public function getSummaryStats(?string $timeRange = 'all', ?string $sector = 'all'): array
    {
        $currentMonth = Carbon::now()->startOfMonth();
 
        $calcTrend = function ($current, $previous) {
            if ($previous == 0) return $current > 0 ? 100 : 0;
            return round((($current - $previous) / $previous) * 100, 1);
        };
 
        // 1. Total Kasus PAK (Berdasarkan faktor_pak yang diinput Admin)
        $qTotal = \App\Models\Pekerja::whereNotNull('faktor_pak');
        $qTotal = $this->applyFilters($qTotal, $timeRange, $sector, true);
        $totalKasus = $qTotal->count();

        $qTotalPrev = \App\Models\Pekerja::whereNotNull('faktor_pak')
            ->where('updated_at', '<', $currentMonth);
        $qTotalPrev = $this->applyFilters($qTotalPrev, $timeRange, $sector, true);
        $totalKasusPrev = $qTotalPrev->count();
        
        // 2. Advokasi dalam Proses
        $qProses = StatusAdvokasi::whereHas('pekerja', function($q) {
                $q->whereNotNull('faktor_pak');
            })->where('rehabilitasi_bpjskes', false);
        $qProses = $this->applyFilters($qProses, $timeRange, $sector, false);
        $advokasiProses = $qProses->count();

        $qProsesPrev = StatusAdvokasi::whereHas('pekerja', function($q) {
                $q->whereNotNull('faktor_pak');
            })
            ->where('rehabilitasi_bpjskes', false)
            ->where('created_at', '<', $currentMonth);
        $qProsesPrev = $this->applyFilters($qProsesPrev, $timeRange, $sector, false);
        $advokasiProsesPrev = $qProsesPrev->count();

        // 3. Tingkat Keberhasilan (Jumlah Kasus Selesai / Total Kasus) * 100
        $qSelesai = StatusAdvokasi::whereHas('pekerja', function($q) {
                $q->whereNotNull('faktor_pak');
            })->where('rehabilitasi_bpjskes', true);
        $qSelesai = $this->applyFilters($qSelesai, $timeRange, $sector, false);
        $kasusSelesai = $qSelesai->count();
            
        $tingkatKeberhasilan = $totalKasus > 0 
            ? round(($kasusSelesai / $totalKasus) * 100, 1) 
            : 0;

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
    public function getChartData(?string $timeRange = 'all', ?string $sector = 'all'): array
    {
        $chartData = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $query = \App\Models\Pekerja::whereNotNull('faktor_pak')
                ->whereYear('created_at', $month->year)
                ->whereMonth('created_at', $month->month);
                
            $query = $this->applyFilters($query, null, $sector, true); // Don't apply timeRange to chart since it shows 6 months always, just sector
            
            $count = $query->count();
            
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
    public function getSectorData(?string $timeRange = 'all', ?string $sector = 'all'): Collection
    {
        $qTotal = \App\Models\Pekerja::whereNotNull('faktor_pak');
        $qTotal = $this->applyFilters($qTotal, $timeRange, $sector, true);
        $totalCases = $qTotal->count();

        $colors = ['bg-[#0ea5e9]', 'bg-[#10b981]', 'bg-[#f59e0b]', 'bg-[#ef4444]', 'bg-[#8b5cf6]'];
        
        $query = \App\Models\Pekerja::whereNotNull('faktor_pak');
        $query = $this->applyFilters($query, $timeRange, $sector, true);
        
        return $query->select('faktor_pak as name', DB::raw('COUNT(*) as total'))
            ->groupBy('faktor_pak')
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
    public function getRecentSuccesses(?string $timeRange = 'all', ?string $sector = 'all'): Collection
    {
        $query = \App\Models\Pekerja::whereNotNull('faktor_pak')
            ->whereHas('statusAdvokasi', function($q) {
                $q->where('rehabilitasi_bpjskes', true);
            });
            
        $query = $this->applyFilters($query, $timeRange, $sector, true);
        
        return $query->with(['perusahaan', 'statusAdvokasi'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn($pekerja) => [
                'worker' => $pekerja->nama_lengkap ?? '-',
                'company' => $pekerja->perusahaan->nama_perusahaan ?? 'Personal',
                'case' => strtoupper($pekerja->faktor_pak),
                'date' => $pekerja->updated_at->format('d M Y')
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
        return \App\Models\Pekerja::whereNotNull('faktor_pak')
            ->where(function($q) use ($query) {
                if ($query) {
                    $search = strtolower($query);
                    $q->whereRaw('LOWER(nama_lengkap) LIKE ?', ["%{$search}%"])
                      ->orWhereRaw('LOWER(nik) LIKE ?', ["%{$search}%"]);
                }
            })
            ->with(['perusahaan', 'statusAdvokasi'])
            ->latest()
            ->limit(10)
            ->get()
            ->map(function($pekerja) {
                $status = 'PROSES';
                $color = 'bg-blue-50 text-blue-600 border-blue-200';
                
                $adv = $pekerja->statusAdvokasi;
                if ($adv && $adv->rehabilitasi_bpjskes) {
                    $status = 'SELESAI';
                    $color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                }
 
                return [
                    'company' => $pekerja->perusahaan->nama_perusahaan ?? 'Personal',
                    'union_name' => $pekerja->perusahaan->serikat ?? null,
                    'worker' => $pekerja->nama_lengkap ?? '-',
                    'case' => strtoupper($pekerja->faktor_pak),
                    'status' => $status,
                    'statusColor' => $color,
                    'pekerja_id' => $pekerja->id
                ];
            });
    }
}
