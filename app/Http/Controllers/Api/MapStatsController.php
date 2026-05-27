<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MapStatsController extends Controller
{
    /**
     * Get aggregate statistics for the interactive map.
     * Menggunakan kolom provinsi_pekerja, kabupaten_pekerja, dan kecamatan
     * dari tabel pekerja untuk data pemetaan real-time yang akurat.
     */
    public function getStats(Request $request)
    {
        // Ambil data dari kolom lokasi pekerja (prioritas utama)
        // Jika pekerja belum memiliki kolom lokasi baru, fallback ke data perusahaan
        $stats = DB::table('pekerja')
            ->leftJoin('perusahaan', 'pekerja.perusahaan_id', '=', 'perusahaan.id')
            ->select(
                // Prioritaskan kolom lokasi pekerja, fallback ke perusahaan jika null
                DB::raw("COALESCE(pekerja.provinsi_pekerja, perusahaan.provinsi) as provinsi"),
                DB::raw("COALESCE(pekerja.kabupaten_pekerja, perusahaan.kabupaten) as kabupaten"),
                'pekerja.kecamatan',
                'pekerja.faktor_pak'
            )
            ->whereNotNull(DB::raw("COALESCE(pekerja.provinsi_pekerja, perusahaan.provinsi)"))
            ->whereNull('pekerja.deleted_at')
            ->get();

        $formatted = [];

        foreach ($stats as $row) {
            $provinsi  = $row->provinsi;
            $kabupaten = $row->kabupaten ?? 'Tidak Diketahui';
            $kecamatan = $row->kecamatan ?? null;
            $faktor    = $row->faktor_pak;

            if (!isset($formatted[$provinsi])) {
                $formatted[$provinsi] = [
                    'provinceName'    => $provinsi,
                    'totalReports'    => 0,
                    'regencies'       => [],
                    'hazardBreakdown' => [
                        'fisik' => 0, 'kimia' => 0, 'biologi' => 0,
                        'ergonomi' => 0, 'psikososial' => 0,
                    ],
                    '_regencies' => []
                ];
            }

            $formatted[$provinsi]['totalReports']++;

            if (!isset($formatted[$provinsi]['_regencies'][$kabupaten])) {
                $formatted[$provinsi]['_regencies'][$kabupaten] = [
                    'count'           => 0,
                    'hazardBreakdown' => [
                        'fisik' => 0, 'kimia' => 0, 'biologi' => 0,
                        'ergonomi' => 0, 'psikososial' => 0,
                    ],
                    '_districts' => []
                ];
            }
            $formatted[$provinsi]['_regencies'][$kabupaten]['count']++;

            // Kelompokkan kecamatan secara real jika ada datanya
            if ($kecamatan) {
                if (!isset($formatted[$provinsi]['_regencies'][$kabupaten]['_districts'][$kecamatan])) {
                    $formatted[$provinsi]['_regencies'][$kabupaten]['_districts'][$kecamatan] = [
                        'count'           => 0,
                        'hazardBreakdown' => [
                            'fisik' => 0, 'kimia' => 0, 'biologi' => 0,
                            'ergonomi' => 0, 'psikososial' => 0,
                        ],
                    ];
                }
                $formatted[$provinsi]['_regencies'][$kabupaten]['_districts'][$kecamatan]['count']++;
            }

            // Deteksi faktor risiko
            if ($faktor) {
                $faktorLower = strtolower($faktor);
                $type = null;
                if (str_contains($faktorLower, 'fisika') || str_contains($faktorLower, 'fisik')) $type = 'fisik';
                elseif (str_contains($faktorLower, 'kimia')) $type = 'kimia';
                elseif (str_contains($faktorLower, 'biologi')) $type = 'biologi';
                elseif (str_contains($faktorLower, 'ergonomi') || str_contains($faktorLower, 'otot') || str_contains($faktorLower, 'sikap kerja')) $type = 'ergonomi';
                elseif (str_contains($faktorLower, 'psikososial') || str_contains($faktorLower, 'mental')) $type = 'psikososial';

                if ($type) {
                    $formatted[$provinsi]['hazardBreakdown'][$type]++;
                    $formatted[$provinsi]['_regencies'][$kabupaten]['hazardBreakdown'][$type]++;
                    if ($kecamatan) {
                        $formatted[$provinsi]['_regencies'][$kabupaten]['_districts'][$kecamatan]['hazardBreakdown'][$type]++;
                    }
                }
            }
        }

        // Format struktur akhir: regencies + districts
        foreach ($formatted as $provinsi => &$data) {
            foreach ($data['_regencies'] as $kabupaten => $regData) {
                $districts = [];

                if (!empty($regData['_districts'])) {
                    // Gunakan data kecamatan NYATA dari database
                    foreach ($regData['_districts'] as $kecamatanName => $dData) {
                        $districts[] = [
                            'name'            => $kecamatanName,
                            'reports'         => $dData['count'],
                            'hazardBreakdown' => $dData['hazardBreakdown'],
                        ];
                    }
                    // Urutkan dari terbanyak ke terkecil
                    usort($districts, fn($a, $b) => $b['reports'] - $a['reports']);
                }

                $data['regencies'][] = [
                    'name'            => $kabupaten,
                    'reports'         => $regData['count'],
                    'hazardBreakdown' => $regData['hazardBreakdown'],
                    'districts'       => $districts,
                ];
            }
            // Urutkan kabupaten dari terbanyak
            usort($data['regencies'], fn($a, $b) => $b['reports'] - $a['reports']);
            unset($data['_regencies']);
        }

        return response()->json([
            'status' => 'success',
            'data'   => $formatted
        ]);
    }
}
