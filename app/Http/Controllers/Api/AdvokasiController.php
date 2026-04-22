<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateAdvokasiRequest;
use App\Models\StatusAdvokasi;
use App\Models\Pekerja;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Traits\HandlesPdfUploads;
use App\Services\AdvokasiService;
use Barryvdh\DomPDF\Facade\Pdf;

class AdvokasiController extends Controller
{
    private AdvokasiService $advokasiService;

    public function __construct(AdvokasiService $advokasiService)
    {
        $this->advokasiService = $advokasiService;
    }

    /**
     * Return counts of workers who have completed each advokasi step.
     */
    public function stats(): JsonResponse
    {
        $stats = $this->advokasiService->getStats();
        
        return response()->json([
            'status'  => 'success',
            'summary' => $stats['summary'],
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
            return response()->json(['status' => 'error', 'message' => 'Status advokasi tidak ditemukan.'], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $status
        ]);
    }

    public function exportPdf(string $id)
    {
        $status = $this->advokasiService->getCaseDetails($id);

        if (!$status) {
            return response()->json(['status' => 'error', 'message' => 'Status advokasi tidak ditemukan.'], 404);
        }

        $pdf = Pdf::loadView('pdf.advokasi-detail', ['advokasi' => $status]);
        
        return $pdf->stream('Laporan-Advokasi-ADV-' . str_pad($status->id, 5, '0', STR_PAD_LEFT) . '.pdf');
    }

    public function update(UpdateAdvokasiRequest $request, string $pekerja_id): JsonResponse
    {
        try {
            $files = $request->hasFile('file') ? $request->file('file') : null;
            $data = $request->all();
            
            $status = $this->advokasiService->updateTracker($pekerja_id, $data, $files);

            return response()->json([
                'status' => 'success',
                'message' => 'Status advokasi berhasil diperbarui.',
                'data' => $status->load(['pekerja.perusahaan', 'pekerja.user']),
                'progress' => $status->progress_percentage
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['status' => 'error', 'message' => 'Status advokasi tidak ditemukan.'], 404);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => 'Gagal memperbarui status advokasi: ' . $e->getMessage()], 500);
        }
    }
}
