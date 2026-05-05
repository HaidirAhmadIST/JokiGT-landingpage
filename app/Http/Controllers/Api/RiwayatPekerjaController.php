<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RiwayatPekerja;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RiwayatPekerjaController extends Controller
{
    /**
     * Update the specified employment history.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $riwayat = RiwayatPekerja::find($id);

        if (!$riwayat) {
            return response()->json(['status' => 'error', 'message' => 'Riwayat pekerjaan tidak ditemukan.'], 404);
        }

        $user = auth()->user();
        $isOwner = $user->pekerja && $user->pekerja->id == $riwayat->pekerja_id;

        if (!$user->isAdmin() && !$user->isPetugas() && !$isOwner) {
            return response()->json(['status' => 'error', 'message' => 'Anda tidak memiliki izin untuk mengubah data ini.'], 403);
        }

        $validated = $request->validate([
            'nama_perusahaan' => 'sometimes|string',
            'bagian' => 'sometimes|nullable|string',
            'jabatan' => 'sometimes|nullable|string',
            'tgl_masuk' => 'sometimes|nullable|date',
            'tgl_keluar' => 'sometimes|nullable|date',
            'status_pekerjaan' => 'sometimes|nullable|string',
            'jenis_pajanan' => 'sometimes|nullable|string',
            'durasi_pajanan' => 'sometimes|nullable|integer',
            'informal_data' => 'sometimes|nullable|array',
            'deskripsi_usaha' => 'sometimes|nullable|string',
            'deskripsi_pekerjaan' => 'sometimes|nullable|string',
        ]);

        $riwayat->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Riwayat pekerjaan berhasil diperbarui.',
            'data' => $riwayat
        ]);
    }
}
