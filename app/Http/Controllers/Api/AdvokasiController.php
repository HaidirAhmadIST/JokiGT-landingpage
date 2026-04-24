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

    public function index(): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => $this->advokasiService->getAllCases()
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
            $status = $this->advokasiService->updateTracker($pekerja_id, $request->all(), $request->file('file'));
            return response()->json(['status' => 'success', 'data' => $status]);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}
