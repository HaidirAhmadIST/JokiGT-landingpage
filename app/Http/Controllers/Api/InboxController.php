<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApprovalRequest;
use App\Models\Pekerja;
use App\Services\AdvokasiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InboxController extends Controller
{
    private AdvokasiService $advokasiService;

    public function __construct(AdvokasiService $advokasiService)
    {
        $this->advokasiService = $advokasiService;
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $inbox = [];

        // 1. APPROVAL REQUESTS
        $approvalQuery = ApprovalRequest::with(['requester', 'responder'])->latest();
        
        if ($user->role === 'petugas') {
            $approvalQuery->where(function($q) use ($user) {
                $q->where('requester_id', $user->id)
                  ->orWhereHas('requester', function($sub) {
                      $sub->where('role', 'viewer');
                  });
            });
        } elseif ($user->role === 'viewer') {
            $pekerjaId = $user->pekerja()->value('id');
            if ($pekerjaId) {
                $approvalQuery->where(function($q) use ($pekerjaId) {
                    $q->where(function($sub) use ($pekerjaId) {
                        $sub->where('model_type', 'Pekerja')
                            ->where('model_id', $pekerjaId);
                    })
                    ->orWhere(function($sub) use ($pekerjaId) {
                        $sub->where('model_type', 'StatusAdvokasi')
                            ->whereIn('model_id', \App\Models\StatusAdvokasi::where('pekerja_id', $pekerjaId)->pluck('id'));
                    })
                    ->orWhere(function($sub) use ($pekerjaId) {
                        $sub->where('model_type', 'DetailMedis')
                            ->whereIn('model_id', \App\Models\DetailMedis::where('pekerja_id', $pekerjaId)->pluck('id'));
                    })
                    ->orWhere(function($sub) use ($pekerjaId) {
                        $sub->where('model_type', 'RiwayatPekerja')
                            ->whereIn('model_id', \App\Models\RiwayatPekerja::where('pekerja_id', $pekerjaId)->pluck('id'));
                    });
                });
            } else {
                $approvalQuery->where('id', -1); // return none if no pekerja ID
            }
        }
        
        $approvalRequests = $approvalQuery->get();
        foreach ($approvalRequests as $req) {
            $inbox[] = [
                'id' => 'approval_' . $req->id,
                'type' => 'APPROVAL_REQUEST',
                'status' => $req->status,
                'created_at' => $req->created_at,
                'updated_at' => $req->updated_at,
                'data' => $req
            ];
        }

        // Only Admin and Petugas see Priority Cases and New Workers
        if (in_array($user->role, ['admin', 'petugas'])) {
            // 2. PRIORITY CASES
            $priorityCases = $this->advokasiService->getPriorityCases(20); // Get up to 20 urgent cases
            foreach ($priorityCases as $case) {
                $inbox[] = [
                    'id' => 'priority_' . $case->id,
                    'type' => 'PRIORITY_CASE',
                    // Consider it "PENDING" if it's very urgent (red), otherwise "APPROVED" (as a way to categorize in the UI tabs if needed, though we can just put them in 'ALL' or 'PENDING')
                    'status' => 'PENDING', 
                    'created_at' => $case->updated_at, // Use updated_at as timestamp for sorting
                    'updated_at' => $case->updated_at,
                    'data' => $case
                ];
            }

            // 3. NEW WORKERS
            $workersQuery = Pekerja::with(['perusahaan'])->where('created_at', '>=', now()->subDays(7));
            if ($user->role === 'petugas') {
                $petugasPerusahaanId = $user->perusahaan_id ?? $user->pekerja?->perusahaan_id;
                if ($petugasPerusahaanId) {
                    $workersQuery->where('perusahaan_id', $petugasPerusahaanId);
                }
                if ($user->serikat) {
                    $workersQuery->where('nama_serikat', $user->serikat);
                }
            }
            
            $newWorkers = $workersQuery->get();
            foreach ($newWorkers as $worker) {
                $inbox[] = [
                    'id' => 'new_worker_' . $worker->id,
                    'type' => 'NEW_WORKER',
                    'status' => 'APPROVED', // Just an informational notification, doesn't need action
                    'created_at' => $worker->created_at,
                    'updated_at' => $worker->created_at,
                    'data' => $worker
                ];
            }
        }

        // Sort inbox by created_at descending
        usort($inbox, function ($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });

        return response()->json([
            'status' => 'success',
            'data' => $inbox,
        ]);
    }
}
