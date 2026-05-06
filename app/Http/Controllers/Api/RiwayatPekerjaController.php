<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RiwayatPekerja;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RiwayatPekerjaController extends Controller
{
    /**
     * Store a newly created employment history.
     */
    public function store(Request $request): JsonResponse
    {
        $user = auth()->user();
        if (!$user->pekerja) {
            return response()->json(['status' => 'error', 'message' => 'Profil pekerja tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'nama_perusahaan' => 'required|string',
            'bagian' => 'nullable|string',
            'jabatan' => 'nullable|string',
            'tgl_masuk' => 'nullable|date',
            'tgl_keluar' => 'nullable|date',
            'status_pekerjaan' => 'nullable|string',
            'jenis_pajanan' => 'nullable|string',
            'durasi_pajanan' => 'nullable|integer',
            'informal_data' => 'nullable|array',
            'deskripsi_usaha' => 'nullable|string',
        ]);

        $riwayat = $user->pekerja->riwayatPekerja()->create($validated);

        \App\Models\ActivityLog::record(
            'tambah_riwayat_pekerja',
            "Menambahkan riwayat pekerjaan baru di {$riwayat->nama_perusahaan}",
            'admin',
            $riwayat
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Riwayat pekerjaan berhasil ditambahkan.',
            'data' => $riwayat
        ], 201);
    }

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

        \App\Models\ActivityLog::record(
            'update_riwayat_pekerja',
            "Memperbarui riwayat pekerjaan untuk pekerja (ID: {$riwayat->pekerja_id})",
            'admin',
            $riwayat
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Riwayat pekerjaan berhasil diperbarui.',
            'data' => $riwayat
        ]);
    }
}
