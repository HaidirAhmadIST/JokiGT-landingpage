<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pekerja;
use App\Models\Perusahaan;
use App\Models\StatusAdvokasi;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /**
     * Get main dashboard statistics
     */
    public function stats(): JsonResponse
    {
        $totalPekerja = Pekerja::count();
        $totalPerusahaan = Perusahaan::count();

        // Kasus aktif: jenis_kasus is not null and advokasi is NOT finished (or progress < 100)
        // Adjust the logic based on how 'kasus_aktif' is defined in the system.
        // Assuming any entry in status_advokasi is active unless kompensasi or rehabilitasi is done
        $kasusAktif = StatusAdvokasi::whereNotNull('jenis_kasus')
                        ->where('rehabilitasi_bpjskes', false)
                        ->where('kompensasi_bpjstk', false) // or depending on flow
                        ->count();

        // Advokasi Selesai: progress = 100% or both final checkboxes checked
        $advokasiSelesai = StatusAdvokasi::whereNotNull('jenis_kasus')
                            ->where(function ($q) {
                                $q->where('rehabilitasi_bpjskes', true)
                                  ->orWhere('kompensasi_bpjstk', true);
                            })->count();

        // Klaim Disetujui: kompensasi_bpjstk is true
        $klaimDisetujui = StatusAdvokasi::where('kompensasi_bpjstk', true)->count();

        // Kesehatan Stats (fit, note, unfit)
        $fit = Pekerja::where('status_kesehatan', 'sehat')->count();
        $unfit = Pekerja::where('status_kesehatan', 'tidak_sehat')->count();
        $note = Pekerja::where('status_kesehatan', 'dengan_catatan')->count(); // Adjust if different enum
        
        // Fallback for note if the wording is different
        if ($note == 0) {
            $note = Pekerja::where('status_kesehatan', 'sehat_dengan_catatan')->count();
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'total_pekerja' => $totalPekerja,
                'total_perusahaan' => $totalPerusahaan,
                'kasus_aktif' => $kasusAktif,
                'advokasi_selesai' => $advokasiSelesai,
                'klaim_disetujui' => $klaimDisetujui,
                'kesehatan' => [
                    'fit' => $fit,
                    'note' => $note,
                    'unfit' => $unfit,
                ]
            ]
        ]);
    }
}
