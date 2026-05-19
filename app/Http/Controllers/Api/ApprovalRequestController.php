<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApprovalRequest;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ApprovalRequestController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $query = ApprovalRequest::with(['requester', 'responder'])->latest();
        
        // If they are not Superadmin (admin role), only return their own requests
        if ($user->role !== 'admin') {
            $query->where('requester_id', $user->id);
        }
        
        return response()->json([
            'status' => 'success',
            'data' => $query->get(),
        ]);
    }

    /**
     * Store a newly created request in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'action' => 'required|string|in:CREATE,UPDATE,DELETE',
            'model_type' => 'required|string',
            'model_id' => 'nullable|integer',
            'payload' => 'nullable|array',
            'reason' => 'required|string|min:5',
        ]);

        $user = $request->user();

        // Standard admins (petugas) can submit approval requests.
        $approvalRequest = ApprovalRequest::create([
            'requester_id' => $user->id,
            'action' => strtoupper($validated['action']),
            'model_type' => $validated['model_type'],
            'model_id' => $validated['model_id'],
            'payload' => $validated['payload'] ?? null,
            'reason' => $validated['reason'],
            'status' => 'PENDING',
        ]);

        ActivityLog::record(
            'create_approval_request',
            "Mengirim permintaan persetujuan tindakan {$validated['action']} untuk model {$validated['model_type']}",
            'admin',
            $approvalRequest,
            [],
            $user
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Permintaan persetujuan telah berhasil dikirim ke Superadmin.',
            'data' => $approvalRequest,
        ], 201);
    }

    /**
     * Respond to a request (Approve/Reject).
     */
    public function respond(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:APPROVED,REJECTED',
            'rejection_reason' => 'nullable|string|required_if:status,REJECTED',
        ]);

        $user = $request->user();
        $approvalRequest = ApprovalRequest::findOrFail($id);

        if ($approvalRequest->status !== 'PENDING') {
            return response()->json([
                'status' => 'error',
                'message' => 'Permintaan ini sudah diproses sebelumnya.',
            ], 422);
        }

        $status = strtoupper($validated['status']);
        $approvalRequest->status = $status;
        $approvalRequest->responder_id = $user->id;

        if ($status === 'REJECTED') {
            $approvalRequest->rejection_reason = $validated['rejection_reason'];
            $approvalRequest->save();

            ActivityLog::record(
                'reject_approval_request',
                "Menolak permintaan persetujuan tindakan {$approvalRequest->action} untuk model {$approvalRequest->model_type}",
                'admin',
                $approvalRequest,
                [],
                $user
            );

            return response()->json([
                'status' => 'success',
                'message' => 'Permintaan persetujuan telah ditolak.',
                'data' => $approvalRequest,
            ]);
        }

        // APPROVED: Execute the actual model action
        try {
            $approvalRequest->executeAction();
            $approvalRequest->save();

            ActivityLog::record(
                'approve_approval_request',
                "Menyetujui dan mengeksekusi permintaan tindakan {$approvalRequest->action} untuk model {$approvalRequest->model_type}",
                'admin',
                $approvalRequest,
                [],
                $user
            );

            return response()->json([
                'status' => 'success',
                'message' => 'Permintaan persetujuan disetujui dan tindakan berhasil dieksekusi.',
                'data' => $approvalRequest,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to execute approved action: " . $e->getMessage(), [
                'request_id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengeksekusi tindakan: ' . $e->getMessage(),
            ], 500);
        }
    }
}
