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

    public function stats(Request $request): JsonResponse
    {
        $includeWorkers = filter_var($request->query('include_workers', false), FILTER_VALIDATE_BOOLEAN);
        $hazard = $request->query('hazard', null);
        $stats = $this->advokasiService->getStats($includeWorkers, $hazard);
        
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

    public function priority(Request $request): JsonResponse
    {
        $limit = $request->query('limit', 5);
        return response()->json([
            'status' => 'success',
            'data' => $this->advokasiService->getPriorityCases((int)$limit)
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

    public function exportPdf(Request $request, string $id)
    {
        $status = $this->advokasiService->getCaseDetails($id);
        if (!$status) return response()->json(['error' => 'Not found'], 404);

        // Ownership check: viewer hanya bisa export data milik sendiri
        $authUser = $request->user();
        if ($authUser->role === 'viewer') {
            $pekerja = $status->pekerja;
            if (!$pekerja || (string)$pekerja->id !== (string)$authUser->pekerja()->value('id')) {
                return response()->json(['status' => 'error', 'message' => 'Akses ditolak.'], 403);
            }
        }

        $pdf = Pdf::loadView('pdf.advokasi-detail', ['advokasi' => $status]);
        return $pdf->stream('Laporan.pdf');
    }

    public function update(UpdateAdvokasiRequest $request, string $pekerja_id): JsonResponse
    {
        try {
            $authUser = $request->user();
            if ($authUser->role === 'viewer') {
                // Refresh relationship to ensure we have the newly created pekerja record
                $ownPekerja = $authUser->pekerja()->first();
                if (!$ownPekerja || (string)$ownPekerja->id !== (string)$pekerja_id) {
                    return response()->json(['status' => 'error', 'message' => 'Akses ditolak. Anda hanya dapat mengubah data milik sendiri.'], 403);
                }

                // If they are a viewer, any update to Advokasi must be routed to ApprovalRequest
                $status = \App\Models\StatusAdvokasi::where('pekerja_id', $pekerja_id)->firstOrFail();
                
                $payload = [];
                $stepKey = $request->input('step_key');
                $files = $request->file('file');

                if ($files && $stepKey) {
                    // It is a file upload
                    if (!is_array($files)) {
                        $files = [$files];
                    }
                    
                    $validColumns = [
                        'riwayat_pajanan' => 'bukti_pajanan_path', 
                        'persetujuan_dokter' => 'bukti_persetujuan_dokter_path', 
                        'perusahaan_lapor' => 'bukti_perusahaan_lapor_path',
                        'penetapan_pak' => 'bukti_penetapan_pak_path',
                        'kompensasi_bpjstk' => 'bukti_kompensasi_bpjstk_path',
                        'rehabilitasi_bpjskes' => 'bukti_rehabilitasi_bpjskes_path'
                    ];

                    $dateColumns = [
                        'riwayat_pajanan' => 'bukti_pajanan_at',
                        'persetujuan_dokter' => 'bukti_persetujuan_dokter_at',
                        'perusahaan_lapor' => 'bukti_perusahaan_lapor_at',
                        'penetapan_pak' => 'bukti_penetapan_pak_at',
                        'kompensasi_bpjstk' => 'bukti_kompensasi_bpjstk_at',
                        'rehabilitasi_bpjskes' => 'bukti_rehabilitasi_bpjskes_at'
                    ];

                    if (array_key_exists($stepKey, $validColumns)) {
                        $columnName = $validColumns[$stepKey];
                        $path = $this->advokasiService->storeProofFiles($files, $pekerja_id);
                        $fileName = count($files) > 1 ? 'Dokumen_Gabungan.pdf' : $files[0]->getClientOriginalName();
                        $actualNameColumn = str_replace('_path', '_name', $columnName);

                        $payload = [
                            'step_key' => $stepKey,
                            $columnName => $path,
                            $actualNameColumn => $fileName,
                            $stepKey => true,
                            $dateColumns[$stepKey] => now()->toDateTimeString()
                        ];
                        
                        $reason = "Mengunggah dokumen bukti untuk langkah: " . ucwords(str_replace('_', ' ', $stepKey));
                    }
                } else {
                    // Basic metadata update
                    $metaFields = ['jenis_kasus', 'tahap', 'status_detail', 'tanggal_pelaporan', 'catatan'];
                    foreach ($metaFields as $field) {
                        if ($request->has($field)) {
                            $payload[$field] = $request->input($field);
                        }
                    }
                    $reason = "Memperbarui data detail kasus advokasi";
                }

                if (empty($payload)) {
                    return response()->json(['status' => 'error', 'message' => 'Tidak ada perubahan data yang diajukan.'], 400);
                }

                // Create approval request
                $approvalRequest = \App\Models\ApprovalRequest::create([
                    'requester_id' => $authUser->id,
                    'action' => 'UPDATE',
                    'model_type' => 'StatusAdvokasi',
                    'model_id' => $status->id,
                    'payload' => $payload,
                    'reason' => $reason,
                    'status' => 'PENDING',
                ]);

                // Record Activity
                \App\Models\ActivityLog::record(
                    'create_approval_request',
                    "Mengajukan permintaan persetujuan untuk pembaruan data advokasi",
                    'sistem',
                    $approvalRequest,
                    [],
                    $authUser
                );

                return response()->json([
                    'status' => 'success',
                    'message' => 'Permintaan pembaruan data telah diajukan ke Admin. Status sedang dalam proses persetujuan.',
                    'data' => $status
                ]);
            }

            $status = $this->advokasiService->updateTracker($pekerja_id, $request->all(), $request->file('file'));
            
            // Catat log aktivitas
            \App\Models\ActivityLog::record(
                'update_advokasi',
                "Memperbarui progres advokasi untuk pekerja (ID: {$pekerja_id})",
                'admin',
                $status
            );

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

    /**
     * Delete an advocacy proof document.
     */
    public function deleteAdvokasiProof(Request $request, $pekerja_id, $step_key)
    {
        $authUser = auth()->user();

        // Check if user is staff or superadmin
        if (!$authUser || (!in_array($authUser->role, ['staff', 'superadmin']) && !$authUser->isPetugas())) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 403);
        }

        try {
            $status = $this->advokasiService->deleteProofFile($pekerja_id, $step_key);
            
            // Log activity
            \App\Models\ActivityLog::record(
                'delete_advokasi_file',
                "Menghapus dokumen advokasi pada tahap '{$step_key}' untuk pekerja (ID: {$pekerja_id})",
                'admin',
                $status
            );

            return response()->json(['status' => 'success', 'data' => $status]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Advokasi Delete File Error: ' . $e->getMessage(), [
                'pekerja_id' => $pekerja_id,
                'step_key' => $step_key,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}
