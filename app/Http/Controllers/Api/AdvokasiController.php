<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateAdvokasiRequest;
use App\Models\StatusAdvokasi;
use App\Models\Pekerja;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdvokasiController extends Controller
{
    /**
     * Display a listing of advocacy cases.
     */
    public function index(): JsonResponse
    {
        // Get all workers who have an advocacy case started (non-null jenis_kasus)
        // or just all workers with their status
        $cases = StatusAdvokasi::with(['pekerja.perusahaan', 'pekerja.user'])
            ->whereNotNull('jenis_kasus')
            ->latest()
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $cases
        ]);
    }

    /**
     * Update the advocacy status and handle evidence uploads.
     */
    public function update(UpdateAdvokasiRequest $request, string $pekerja_id): JsonResponse
    {
        $status = StatusAdvokasi::where('pekerja_id', $pekerja_id)->first();

        if (!$status) {
            return response()->json(['status' => 'error', 'message' => 'Status advokasi tidak ditemukan untuk pekerja ini.'], 404);
        }

        // Handle file upload securely into the 'private' disk
        if ($request->hasFile('bukti_pajanan')) {
            // Delete old file if exists
            if ($status->bukti_pajanan_path) {
                Storage::disk('private')->delete($status->bukti_pajanan_path);
            }

            $path = $request->file('bukti_pajanan')->store('bukti_pajanan', 'private');
            $status->bukti_pajanan_path = $path;
        }

        // Update fields including new metadata
        $fields = [
            'jenis_kasus', 'tahap', 'status_detail', 'tanggal_pelaporan', 'catatan',
            'riwayat_pajanan', 'persetujuan_dokter', 'perusahaan_lapor',
            'penetapan_pak', 'kompensasi_bpjstk', 'rehabilitasi_bpjskes'
        ];

        // 1. Update String Metadata
        $metaFields = ['jenis_kasus', 'tahap', 'status_detail', 'tanggal_pelaporan', 'catatan'];
        foreach ($metaFields as $field) {
            if ($request->has($field)) {
                $status->{$field} = $request->input($field);
            }
        }

        // 2. Update Boolean Progress Steps
        $boolFields = [
            'riwayat_pajanan', 'persetujuan_dokter', 'perusahaan_lapor',
            'penetapan_pak', 'kompensasi_bpjstk', 'rehabilitasi_bpjskes'
        ];

        foreach ($boolFields as $field) {
            if ($request->has($field)) {
                $status->{$field} = filter_var($request->input($field), FILTER_VALIDATE_BOOLEAN);
            }
        }

        $status->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Status advokasi berhasil diperbarui.',
            'data' => $status->load(['pekerja.perusahaan', 'pekerja.user']),
            'progress' => $status->progress_percentage
        ]);
    }
}
