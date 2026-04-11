<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pekerja;
use App\Models\StatusAdvokasi;
use App\Models\DetailMedis;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FileController extends Controller
{
    /**
     * Download or view medical documentation (Detail Medis) by specific ID
     */
    public function downloadMedisById(Request $request, string $id)
    {
        // Only admin and petugas can access medical files
        if (!$request->user()->isAdmin() && !$request->user()->isPetugas()) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized. Only Admin or Petugas can access medical records.'], 403);
        }

        $medis = DetailMedis::find($id);

        if (!$medis || !$medis->file_hasil_path) {
            return response()->json(['status' => 'error', 'message' => 'Dokumen medis tidak ditemukan.'], 404);
        }

        $path = $medis->file_hasil_path;

        if (!Storage::disk('private')->exists($path)) {
            return response()->json(['status' => 'error', 'message' => 'File fisik tidak ditemukan di server.'], 404);
        }

        return response()->download(Storage::disk('private')->path($path));
    }

    /**
     * Legacy: Download or view first medical documentation for a worker
     */
    public function downloadMedis(Request $request, string $pekerja_id)
    {
        // Only admin and petugas can access medical files
        if (!$request->user()->isAdmin() && !$request->user()->isPetugas()) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized. Only Admin or Petugas can access medical records.'], 403);
        }

        $pekerja = Pekerja::with('detailMedis')->find($pekerja_id);

        if (!$pekerja || $pekerja->detailMedis->isEmpty() || !$pekerja->detailMedis->first()->file_hasil_path) {
            return response()->json(['status' => 'error', 'message' => 'Dokumen medis tidak ditemukan.'], 404);
        }

        $path = $pekerja->detailMedis->first()->file_hasil_path;

        if (!Storage::disk('private')->exists($path)) {
            return response()->json(['status' => 'error', 'message' => 'File fisik tidak ditemukan di server.'], 404);
        }

        return response()->download(Storage::disk('private')->path($path));
    }

    /**
     * Download or view advocacy evidence (Status Advokasi)
     */
    public function downloadAdvokasiProof(Request $request, string $pekerja_id, string $step_key)
    {
        // Workers can view their own, but others must be admin/petugas
        $isOwner = $request->user()->pekerja && $request->user()->pekerja->id == $pekerja_id;
        
        if (!$isOwner && !$request->user()->isAdmin() && !$request->user()->isPetugas()) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized access to evidence document.'], 403);
        }

        $validColumns = [
            'riwayat_pajanan' => 'bukti_pajanan_path', 
            'persetujuan_dokter' => 'bukti_persetujuan_dokter_path', 
            'perusahaan_lapor' => 'bukti_perusahaan_lapor_path',
            'penetapan_pak' => 'bukti_penetapan_pak_path',
            'kompensasi_bpjstk' => 'bukti_kompensasi_bpjstk_path',
            'rehabilitasi_bpjskes' => 'bukti_rehabilitasi_bpjskes_path'
        ];

        if (!array_key_exists($step_key, $validColumns)) {
             return response()->json(['status' => 'error', 'message' => 'Invalid document type.'], 400);
        }

        $columnName = $validColumns[$step_key];

        $status = StatusAdvokasi::where('pekerja_id', $pekerja_id)->first();

        if (!$status || !$status->{$columnName}) {
            return response()->json(['status' => 'error', 'message' => 'Dokumen tidak ditemukan.'], 404);
        }

        if (!Storage::disk('private')->exists($status->{$columnName})) {
            return response()->json(['status' => 'error', 'message' => 'File fisik tidak ditemukan di server.'], 404);
        }

        return response()->download(Storage::disk('private')->path($status->{$columnName}));
    }
}
