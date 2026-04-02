<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pekerja;
use App\Models\StatusAdvokasi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FileController extends Controller
{
    /**
     * Download or view medical documentation (Detail Medis)
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

        return Storage::disk('private')->download($path);
    }

    /**
     * Download or view advocacy evidence (Status Advokasi)
     */
    public function downloadBuktiPajanan(Request $request, string $pekerja_id)
    {
        // Workers can view their own, but others must be admin/petugas
        $isOwner = $request->user()->pekerja && $request->user()->pekerja->id == $pekerja_id;
        
        if (!$isOwner && !$request->user()->isAdmin() && !$request->user()->isPetugas()) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized access to evidence document.'], 403);
        }

        $status = StatusAdvokasi::where('pekerja_id', $pekerja_id)->first();

        if (!$status || !$status->bukti_pajanan_path) {
            return response()->json(['status' => 'error', 'message' => 'Dokumen bukti pajanan tidak ditemukan.'], 404);
        }

        if (!Storage::disk('private')->exists($status->bukti_pajanan_path)) {
            return response()->json(['status' => 'error', 'message' => 'File fisik tidak ditemukan di server.'], 404);
        }

        return Storage::disk('private')->download($status->bukti_pajanan_path);
    }
}
