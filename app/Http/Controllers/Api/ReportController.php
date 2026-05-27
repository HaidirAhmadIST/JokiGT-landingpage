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
    public function summary(Request $request): JsonResponse
    {
        try {
            $timeRange = $request->query('time_range', 'all');
            $sector = $request->query('sector', 'all');

            return response()->json([
                'status' => 'success',
                'data' => [
                    'summary' => $this->reportService->getSummaryStats($timeRange, $sector),
                    'chart_data' => $this->reportService->getChartData($timeRange, $sector),
                    'sector_data' => $this->reportService->getSectorData($timeRange, $sector),
                    'recent_successes' => $this->reportService->getRecentSuccesses($timeRange, $sector),
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

    /**
     * Get list of unique sectors.
     */
    public function sectors(): JsonResponse
    {
        try {
            $sectors = $this->reportService->getSectors();

            return response()->json([
                'status' => 'success',
                'data' => $sectors
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil data sektor: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export all pekerja data to CSV for Excel.
     */
    public function export(Request $request)
    {
        try {
            // Eager load necessary relations
            $pekerjaList = Pekerja::withFullProfile()->get();
            
            $headers = [
                'Cache-Control'       => 'must-revalidate, post-check=0, pre-check=0',
                'Content-type'        => 'text/csv',
                'Content-Disposition' => 'attachment; filename=Laporan_Pekerja_'.date('Ymd_His').'.csv',
                'Expires'             => '0',
                'Pragma'              => 'public'
            ];

            $columns = [
                'No', 'NIK', 'Nama Lengkap', 'Jenis Kelamin', 'Tanggal Lahir', 'Domisili',
                'Nama Perusahaan', 'Bagian / Jabatan', 'Anggota Serikat', 'Nama Serikat',
                'Status Kesehatan', 'Faktor PAK', 'Jenis Kasus Advokasi', 'Status Advokasi'
            ];

            $callback = function() use ($pekerjaList, $columns) {
                $file = fopen('php://output', 'w');
                // Output BOM for Excel UTF-8 support
                fputs($file, "\xEF\xBB\xBF");
                fputcsv($file, $columns, ';'); // Use semicolon for excel compatibility in many regions

                $rowNumber = 1;
                foreach ($pekerjaList as $p) {
                    $job = $p->currentJob;
                    $advokasi = $p->statusAdvokasi;
                    
                    // Determine status advokasi
                    $statusAdvokasi = '-';
                    if ($advokasi && $advokasi->jenis_kasus) {
                        if ($advokasi->kompensasi_bpjstk) {
                            $statusAdvokasi = 'Kompensasi Selesai';
                        } elseif ($advokasi->rehabilitasi_bpjskes) {
                            $statusAdvokasi = 'Rehabilitasi Selesai';
                        } elseif ($advokasi->pelaporan_pengawasan) {
                            $statusAdvokasi = 'Pelaporan Pengawasan';
                        } elseif ($advokasi->penetapan_pak) {
                            $statusAdvokasi = 'Penetapan PAK';
                        } else {
                            $statusAdvokasi = 'Proses Awal';
                        }
                    }

                    $row = [
                        $rowNumber++,
                        $p->nik ?? '-',
                        $p->nama_lengkap ?? '-',
                        $p->jenis_kelamin === 'L' ? 'Laki-laki' : ($p->jenis_kelamin === 'P' ? 'Perempuan' : '-'),
                        $p->tanggal_lahir ? Carbon::parse($p->tanggal_lahir)->format('d/m/Y') : '-',
                        $p->domisili ?? '-',
                        $p->perusahaan->nama_perusahaan ?? '-',
                        $job ? ($job->jabatan ?? ($job->bagian ?? '-')) : '-',
                        $p->anggota_organisasi ? 'Ya' : 'Tidak',
                        $p->nama_serikat ?? '-',
                        ucwords(str_replace('_', ' ', $p->status_kesehatan ?? 'Sehat')),
                        $p->faktor_pak ?? 'Belum Ditentukan',
                        $advokasi->jenis_kasus ?? '-',
                        $statusAdvokasi
                    ];

                    fputcsv($file, $row, ';');
                }
                fclose($file);
            };

            return response()->streamDownload($callback, 'Laporan_Pekerja_'.date('Ymd_His').'.csv', $headers);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengexport laporan: ' . $e->getMessage()
            ], 500);
        }
    }
}
