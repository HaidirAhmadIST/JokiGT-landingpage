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

use App\Services\ReportService;

class ReportController extends Controller
{
    private ReportService $reportService;

    public function __construct(ReportService $reportService)
    {
        $this->reportService = $reportService;
    }

    /**
     * Get aggregate statistics for the reports page.
     */
    public function summary(): JsonResponse
    {
        try {
            return response()->json([
                'status' => 'success',
                'data' => [
                    'summary' => $this->reportService->getSummaryStats(),
                    'chart_data' => $this->reportService->getChartData(),
                    'sector_data' => $this->reportService->getSectorData(),
                    'recent_successes' => $this->reportService->getRecentSuccesses(),
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
        try {
            $query = $request->query('query');
            $results = $this->reportService->searchCases($query);

            return response()->json([
                'status' => 'success',
                'data' => $results
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal melakukan pencarian: ' . $e->getMessage()
            ], 500);
        }
    }
}
