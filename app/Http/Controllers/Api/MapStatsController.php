<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Perusahaan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MapStatsController extends Controller
{
    /**
     * Get aggregate statistics for the interactive map.
     */
    public function getStats(Request $request)
    {
        // Get counts grouped by province and kabupaten
        // We join pekerja and perusahaan.
        // We only count pekerja with status_kesehatan = tidak_sehat or sehat_dengan_catatan (as "kasus")
        // but for now, the map says "Laporan", so we can just count ALL pekerja or just those with health issues.
        // The landing page says "Sebaran Kasus PAK", so let's count all workers as base, but filter by "kasus" (tidak_sehat/sehat_dengan_catatan) if needed.
        // Actually, let's count all workers for now to ensure data shows up, but maybe filter by 'kasus' later.
        
        $stats = DB::table('pekerja')
            ->join('perusahaan', 'pekerja.perusahaan_id', '=', 'perusahaan.id')
            ->select('perusahaan.provinsi', 'perusahaan.kabupaten', DB::raw('count(pekerja.id) as total_reports'))
            // Optional: filter by health status if you only want to map "sick" workers
            // ->whereIn('pekerja.status_kesehatan', ['tidak_sehat', 'sehat_dengan_catatan'])
            ->whereNotNull('perusahaan.provinsi')
            ->groupBy('perusahaan.provinsi', 'perusahaan.kabupaten')
            ->get();

        // Format the data into the structure expected by the frontend
        // Structure expected:
        // {
        //   "DKI Jakarta": {
        //     "provinceName": "DKI Jakarta",
        //     "totalReports": 150,
        //     "regencies": [
        //       { "name": "Jakarta Selatan", "reports": 50, "districts": [ ... ] }
        //     ]
        //   }
        // }

        $formatted = [];

        foreach ($stats as $row) {
            $provinsi = $row->provinsi;
            $kabupaten = $row->kabupaten ?? 'Tidak Diketahui';
            $reports = (int) $row->total_reports;

            if (!isset($formatted[$provinsi])) {
                $formatted[$provinsi] = [
                    'provinceName' => $provinsi,
                    'totalReports' => 0,
                    'regencies' => []
                ];
            }

            $formatted[$provinsi]['totalReports'] += $reports;
            
            // Push to regencies
            // Since we don't track district (kecamatan) in DB yet, we just pass an empty districts array or a mock one.
            $formatted[$provinsi]['regencies'][] = [
                'name' => $kabupaten,
                'reports' => $reports,
                'districts' => [
                    ['name' => 'Kecamatan Pusat', 'reports' => $reports] // Mocking district for UI
                ]
            ];
        }

        return response()->json([
            'status' => 'success',
            'data' => $formatted
        ]);
    }
}
