<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Response;

class ActivityLogController extends Controller
{
    /**
     * Display a listing of the activity logs.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ActivityLog::query();

        // Standardized Filtering
        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        if ($request->filled('action') && $request->action !== 'all') {
            $query->where('action', $request->action);
        }

        if ($request->filled('search')) {
            $search = strtolower($request->search);
            $query->where(function($q) use ($search) {
                $q->whereRaw('LOWER(description) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(user_name) LIKE ?', ["%{$search}%"]);
            });
        }

        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $logs = $query->latest()->paginate($request->input('per_page', 20));

        // Transform results for frontend
        $logs->getCollection()->transform(function ($log) {
            return [
                'id'          => $log->id,
                'action'      => $log->action,
                'description' => $log->description,
                'category'    => $log->category,
                'user_name'   => $log->user_name,
                'metadata'    => $log->metadata,
                'created_at'  => $log->created_at->format('Y-m-d H:i'),
                'time_ago'    => $log->created_at->diffForHumans(),
            ];
        });

        return response()->json([
            'status' => 'success',
            'data'   => $logs,
        ]);
    }

    /**
     * Export activity logs to PDF or CSV.
     */
    public function export(Request $request)
    {
        $query = ActivityLog::query();

        // Apply same filters as index
        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }
        if ($request->filled('action') && $request->action !== 'all') {
            $query->where('action', $request->action);
        }
        if ($request->filled('search')) {
            $search = strtolower($request->search);
            $query->where(function($q) use ($search) {
                $q->whereRaw('LOWER(description) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(user_name) LIKE ?', ["%{$search}%"]);
            });
        }
        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $logs = $query->latest()->get();
        $format = $request->input('format', 'csv');

        if ($format === 'pdf') {
            $pdf = Pdf::loadView('exports.activity-logs-pdf', compact('logs'));
            return $pdf->download('activity-logs-' . now()->format('Ymd') . '.pdf');
        }

        // Default to CSV (also works for Excel)
        $filename = "activity-logs-" . now()->format('Ymd') . ".csv";
        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=$filename",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $callback = function() use($logs) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['ID', 'Waktu', 'Admin', 'Aksi', 'Deskripsi', 'Kategori']);

            foreach ($logs as $log) {
                fputcsv($file, [
                    $log->id,
                    $log->created_at->format('Y-m-d H:i:s'),
                    $log->user_name,
                    $log->action,
                    $log->description,
                    $log->category
                ]);
            }
            fclose($file);
        };

        return Response::stream($callback, 200, $headers);
    }
}
