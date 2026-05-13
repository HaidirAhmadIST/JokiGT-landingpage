<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DetailMedis;
use App\Models\RiwayatPekerja;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\ActivityLog;

class DetailMedisController extends Controller
{
    /**
     * Store a newly created medical record.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'riwayat_pekerja_id'  => 'required|exists:riwayat_pekerja,id',
            'jenis_pemeriksaan'   => 'required|string',
            'tanggal_pemeriksaan' => 'required|date',
            'status_kesehatan'    => 'required|string|in:sehat,sehat_dengan_catatan,tidak_sehat',
            'hasil_diagnosis'     => 'nullable|string',
            'rekomendasi'         => 'nullable|string',
            'dokter_pemeriksa'    => 'nullable|string',
        ]);

        $riwayat = RiwayatPekerja::findOrFail($validated['riwayat_pekerja_id']);
        
        // Ownership check
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isPetugas() && $user->pekerja->id !== $riwayat->pekerja_id) {
            return response()->json(['status' => 'error', 'message' => 'Akses ditolak.'], 403);
        }

        $medis = DetailMedis::create($validated);

        ActivityLog::record(
            'tambah_medis',
            "Menambahkan catatan medis baru ({$medis->jenis_pemeriksaan})",
            'admin',
            $medis
        );

        return response()->json(['status' => 'success', 'data' => $medis], 201);
    }

    /**
     * Update the specified medical record.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $medis = DetailMedis::findOrFail($id);
        $riwayat = $medis->riwayatPekerja;

        // Ownership check
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isPetugas() && $user->pekerja->id !== $riwayat->pekerja_id) {
            return response()->json(['status' => 'error', 'message' => 'Akses ditolak.'], 403);
        }

        $validated = $request->validate([
            'jenis_pemeriksaan'   => 'sometimes|string',
            'tanggal_pemeriksaan' => 'sometimes|date',
            'status_kesehatan'    => 'sometimes|string|in:sehat,sehat_dengan_catatan,tidak_sehat',
            'hasil_diagnosis'     => 'nullable|string',
            'rekomendasi'         => 'nullable|string',
            'dokter_pemeriksa'    => 'nullable|string',
        ]);

        $medis->update($validated);

        ActivityLog::record(
            'update_medis',
            "Memperbarui catatan medis ({$medis->jenis_pemeriksaan})",
            'admin',
            $medis
        );

        return response()->json(['status' => 'success', 'data' => $medis]);
    }
}
