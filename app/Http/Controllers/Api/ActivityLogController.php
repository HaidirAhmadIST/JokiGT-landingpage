<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    /**
     * Return paginated activity logs.
     * Optional filter: ?category=sistem|admin
     */
    public function index(Request $request): JsonResponse
    {
        $query = ActivityLog::with('user')
            ->latest()
            ->limit(50); // Cap at 50 for panel display

        if ($request->has('category') && $request->category) {
            $query->where('category', $request->category);
        }

        $logs = $query->get()->map(function ($log) {
            return [
                'id'          => $log->id,
                'action'      => $log->action,
                'description' => $log->description,
                'category'    => $log->category,
                'user_name'   => $log->user_name,
                'metadata'    => $log->metadata,
                'created_at'  => $log->created_at,
                'time_ago'    => $log->created_at->diffForHumans(),
            ];
        });

        return response()->json([
            'status' => 'success',
            'data'   => $logs,
        ]);
    }
}
