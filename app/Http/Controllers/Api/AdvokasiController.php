<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateAdvokasiRequest;
use App\Models\StatusAdvokasi;
use App\Models\Pekerja;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Services\AdvokasiService;
use Barryvdh\DomPDF\Facade\Pdf;

class AdvokasiController extends Controller
{
    private AdvokasiService $advokasiService;

    public function __construct(AdvokasiService $advokasiService)
    {
        $this->advokasiService = $advokasiService;
    }

    public function stats(): JsonResponse
    {
        $stats = $this->advokasiService->getStats();
        
        return response()->json([
            'status'  => 'success',
            'summary' => $stats['summary'],
            'total'   => $stats['summary']['total']['count'] ?? 0,
            'data'    => $stats['data'],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = $request->query('per_page', 10);
        return response()->json([
            'status' => 'success',
            'data' => $this->advokasiService->getPaginatedCases($perPage)
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $status = $this->advokasiService->getCaseDetails($id);
        if (!$status) {
            return response()->json(['status' => 'error', 'message' => 'Detail advokasi tidak ditemukan.'], 404);
        }
        return response()->json(['status' => 'success', 'data' => $status]);
    }

    public function exportPdf(string $id)
    {
        $status = $this->advokasiService->getCaseDetails($id);
        if (!$status) return response()->json(['error' => 'Not found'], 404);
        $pdf = Pdf::loadView('pdf.advokasi-detail', ['advokasi' => $status]);
        return $pdf->stream('Laporan.pdf');
    }

    public function update(UpdateAdvokasiRequest $request, string $pekerja_id): JsonResponse
    {
        try {
            // Ownership check: viewer hanya bisa update data milik sendiri
            $authUser = $request->user();
            if ($authUser->role === 'viewer') {
                // Refresh relationship to ensure we have the newly created pekerja record
                $ownPekerja = $authUser->pekerja()->first();
                if (!$ownPekerja || (string)$ownPekerja->id !== (string)$pekerja_id) {
                    return response()->json(['status' => 'error', 'message' => 'Akses ditolak. Anda hanya dapat mengubah data milik sendiri.'], 403);
                }
            }
            $status = $this->advokasiService->updateTracker($pekerja_id, $request->all(), $request->file('file'));
            return response()->json(['status' => 'success', 'data' => $status]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Advokasi Update Error: ' . $e->getMessage(), [
                'pekerja_id' => $pekerja_id,
                'request' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}
