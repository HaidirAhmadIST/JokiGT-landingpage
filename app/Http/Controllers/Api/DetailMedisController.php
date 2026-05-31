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
            'tempat_pemeriksaan'  => 'nullable|string',
            'tanggal_pemeriksaan' => 'required|date',
            'status_kesehatan'    => 'required|string|in:sehat,sehat_dengan_catatan,tidak_sehat',
            'hasil_diagnosis'     => 'nullable|string',
            'rekomendasi'         => 'nullable|string',
            'dokter_pemeriksa'    => 'nullable|string',
        ]);

        $riwayat = RiwayatPekerja::findOrFail($validated['riwayat_pekerja_id']);
        
        // Ownership check
        $user = auth()->user();
        if (!$user->isAdmin()) {
            $isOwner = $user->pekerja && $user->pekerja->id === $riwayat->pekerja_id;
            $isPetugasAndAuthorized = false;
            
            if ($user->isPetugas()) {
                $targetPekerja = \App\Models\Pekerja::find($riwayat->pekerja_id);
                $petugasPerusahaanId = $user->perusahaan_id ?? $user->pekerja?->perusahaan_id;
                $petugasSerikat = $user->serikat ?? $user->pekerja?->nama_serikat;
                
                $companyMatch = !$petugasPerusahaanId || ($targetPekerja && $targetPekerja->perusahaan_id === $petugasPerusahaanId);
                $serikatMatch = !$petugasSerikat || ($targetPekerja && $targetPekerja->nama_serikat === $petugasSerikat);
                
                if ($targetPekerja && $companyMatch && $serikatMatch) {
                    $isPetugasAndAuthorized = true;
                }
            }

            if (!$isOwner && !$isPetugasAndAuthorized) {
                return response()->json(['status' => 'error', 'message' => 'Akses ditolak.'], 403);
            }
        }

        // Map to DB columns
        $data = [
            'riwayat_pekerja_id' => $validated['riwayat_pekerja_id'],
            'pekerja_id'         => $riwayat->pekerja_id,
            'jenis_pemeriksa'    => $validated['jenis_pemeriksaan'],
            'tempat_pemeriksa'   => $validated['tempat_pemeriksaan'] ?? null,
            'tgl_pemeriksaan'    => $validated['tanggal_pemeriksaan'],
            'status_kesehatan'   => $validated['status_kesehatan'],
            'hasil_diagnosis'    => $validated['hasil_diagnosis'],
            'rekomendasi'        => $validated['rekomendasi'],
            'dokter_pemeriksa'   => $validated['dokter_pemeriksa'],
        ];

        $medis = DetailMedis::create($data);

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
        if (!$user->isAdmin()) {
            $isOwner = $user->pekerja && $user->pekerja->id === $riwayat->pekerja_id;
            $isPetugasAndAuthorized = false;
            
            if ($user->isPetugas()) {
                $targetPekerja = \App\Models\Pekerja::find($riwayat->pekerja_id);
                $petugasPerusahaanId = $user->perusahaan_id ?? $user->pekerja?->perusahaan_id;
                $petugasSerikat = $user->serikat ?? $user->pekerja?->nama_serikat;
                
                $companyMatch = !$petugasPerusahaanId || ($targetPekerja && $targetPekerja->perusahaan_id === $petugasPerusahaanId);
                $serikatMatch = !$petugasSerikat || ($targetPekerja && $targetPekerja->nama_serikat === $petugasSerikat);
                
                if ($targetPekerja && $companyMatch && $serikatMatch) {
                    $isPetugasAndAuthorized = true;
                }
            }

            if (!$isOwner && !$isPetugasAndAuthorized) {
                return response()->json(['status' => 'error', 'message' => 'Akses ditolak.'], 403);
            }
        }

        $validated = $request->validate([
            'jenis_pemeriksaan'   => 'sometimes|string',
            'tempat_pemeriksaan'  => 'sometimes|nullable|string',
            'tanggal_pemeriksaan' => 'sometimes|date',
            'status_kesehatan'    => 'sometimes|string|in:sehat,sehat_dengan_catatan,tidak_sehat',
            'hasil_diagnosis'     => 'nullable|string',
            'rekomendasi'         => 'nullable|string',
            'dokter_pemeriksa'    => 'nullable|string',
        ]);

        // Map to DB columns
        $data = [];
        if (isset($validated['jenis_pemeriksaan']))   $data['jenis_pemeriksa']  = $validated['jenis_pemeriksaan'];
        if (isset($validated['tempat_pemeriksaan']))  $data['tempat_pemeriksa'] = $validated['tempat_pemeriksaan'];
        if (isset($validated['tanggal_pemeriksaan'])) $data['tgl_pemeriksaan']   = $validated['tanggal_pemeriksaan'];
        
        $fields = ['status_kesehatan', 'hasil_diagnosis', 'rekomendasi', 'dokter_pemeriksa'];
        foreach ($fields as $f) {
            if (isset($validated[$f])) $data[$f] = $validated[$f];
        }

        $medis->update($data);

        ActivityLog::record(
            'update_medis',
            "Memperbarui catatan medis ({$medis->jenis_pemeriksaan})",
            'admin',
            $medis
        );

        return response()->json(['status' => 'success', 'data' => $medis]);
    }
}
