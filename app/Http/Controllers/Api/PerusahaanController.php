<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePerusahaanRequest;
use App\Models\ActivityLog;
use App\Models\Perusahaan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PerusahaanController extends Controller
{
    /**
     * Display a listing of the resource.
     * Pass ?show_deleted=true to fetch only soft-deleted records.
     */
    public function index(Request $request): JsonResponse
    {
        // When show_deleted=true, fetch only trashed (soft-deleted) records
        if ($request->boolean('show_deleted')) {
            $query = Perusahaan::onlyTrashed()->withCount('pekerja');
        } else {
            $query = Perusahaan::query()->withCount('pekerja');
        }

        // Petugas HANYA bisa melihat perusahaannya sendiri
        $user = auth('sanctum')->user();
        if ($user && $user->isPetugas()) {
            $perusahaanId = $user->perusahaan_id ?? $user->pekerja?->perusahaan_id;
            if ($perusahaanId) {
                $query->where('id', $perusahaanId);
            } else {
                $query->where('id', '<', 0);
            }
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->whereRaw('LOWER(nama_perusahaan) LIKE LOWER(?)', ["%{$search}%"]);
        }

        if ($request->has('status') && $request->status) {
            $query->where('status_pendamping', $request->status);
        }

        $sortBy = $request->input('sort_by', 'created_at');
        $sortDir = $request->input('sort_dir', 'desc');

        $perusahaan = $query->orderBy($sortBy, $sortDir)->paginate(15);

        return response()->json([
            'status' => 'success',
            'data'   => $perusahaan,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePerusahaanRequest $request): JsonResponse
    {
        $validated = $request->validated();
        // Auto-assign serikat jika user adalah petugas
        $user = auth('sanctum')->user();
        if ($user && $user->isPetugas() && $user->serikat) {
            $validated['serikat'] = $user->serikat;
        }
        $perusahaan = Perusahaan::create($validated);

        ActivityLog::record(
            action: 'create',
            description: (auth()->user()?->nama ?? 'Admin') . " menambahkan perusahaan {$perusahaan->nama_perusahaan}",
            category: 'admin',
            loggable: $perusahaan,
            metadata: ['nama_perusahaan' => $perusahaan->nama_perusahaan]
        );

        return response()->json([
            'status'  => 'success',
            'message' => 'Perusahaan berhasil ditambahkan.',
            'data'    => $perusahaan,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $perusahaan = Perusahaan::withCount('pekerja')->find($id);

        if ($perusahaan) {
            // Compute summary metrics without loading all pekerja records
            $pekerjaQuery = $perusahaan->pekerja();
            
            // Count active workers (have riwayat with no tgl_keluar)
            $aktifCount = \App\Models\Pekerja::where('perusahaan_id', $id)
                ->whereHas('riwayatPekerja', function ($q) {
                    $q->whereNull('tgl_keluar');
                })->count();
            
            // Count open advocacy cases
            $advokasiCount = \App\Models\Pekerja::where('perusahaan_id', $id)
                ->whereHas('statusAdvokasi', function ($q) {
                    $q->where(function ($sq) {
                        $sq->where('riwayat_pajanan', true)
                           ->orWhere('persetujuan_dokter', true)
                           ->orWhere('perusahaan_lapor', true)
                           ->orWhere('penetapan_pak', true)
                           ->orWhere('kompensasi_bpjstk', true)
                           ->orWhere('rehabilitasi_bpjskes', true);
                    })->where(function ($sq) {
                        $sq->where('riwayat_pajanan', false)
                           ->orWhere('persetujuan_dokter', false)
                           ->orWhere('perusahaan_lapor', false)
                           ->orWhere('penetapan_pak', false)
                           ->orWhere('kompensasi_bpjstk', false)
                           ->orWhere('rehabilitasi_bpjskes', false);
                    });
                })->count();

            $perusahaan->aktif_count = $aktifCount;
            $perusahaan->mantan_count = $perusahaan->pekerja_count - $aktifCount;
            $perusahaan->advokasi_count = $advokasiCount;
        }

        if (!$perusahaan) {
            return response()->json(['status' => 'error', 'message' => 'Perusahaan tidak ditemukan.'], 404);
        }

        return response()->json([
            'status' => 'success',
            'data'   => $perusahaan,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(StorePerusahaanRequest $request, string $id): JsonResponse
    {
        $perusahaan = Perusahaan::find($id);

        if (!$perusahaan) {
            return response()->json(['status' => 'error', 'message' => 'Perusahaan tidak ditemukan.'], 404);
        }

        $perusahaan->update($request->validated());

        ActivityLog::record(
            action: 'update',
            description: (auth()->user()?->nama ?? 'Admin') . " memperbarui data {$perusahaan->nama_perusahaan}",
            category: 'admin',
            loggable: $perusahaan,
            metadata: ['nama_perusahaan' => $perusahaan->nama_perusahaan]
        );

        return response()->json([
            'status'  => 'success',
            'message' => 'Data perusahaan berhasil diperbarui.',
            'data'    => $perusahaan,
        ]);
    }

    /**
     * Remove the specified Perusahaan.
     * Super Admin performs a permanent delete, others use soft delete.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $perusahaan = Perusahaan::withTrashed()->find($id);

        if (!$perusahaan) {
            return response()->json(['status' => 'error', 'message' => 'Perusahaan tidak ditemukan.'], 404);
        }

        // Check if there are related pekerja before deleting
        if ($perusahaan->pekerja()->exists()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Tidak dapat menghapus perusahaan yang masih memiliki pekerja aktif.',
            ], 422);
        }

        $namaPerusahaan = $perusahaan->nama_perusahaan;

        if ($request->user()->role === 'admin') {
            $perusahaan->forceDelete();
            $action = 'permanent_delete';
            $msg = "Perusahaan {$namaPerusahaan} berhasil dihapus secara permanen.";
        } else {
            $perusahaan->delete();
            $action = 'soft_delete';
            $msg = "Perusahaan {$namaPerusahaan} berhasil dihapus (dapat dipulihkan).";
        }

        ActivityLog::record(
            action: $action,
            description: ($request->user()?->nama ?? 'Admin') . " menghapus ({$action}) {$namaPerusahaan}",
            category: 'admin',
            loggable: $perusahaan,
            metadata: ['nama_perusahaan' => $namaPerusahaan]
        );

        return response()->json([
            'status'  => 'success',
            'message' => $msg,
        ]);
    }

    /**
     * Restore: clear deleted_at, log the action.
     */
    public function restore(string $id): JsonResponse
    {
        $perusahaan = Perusahaan::onlyTrashed()->find($id);

        if (!$perusahaan) {
            return response()->json(['status' => 'error', 'message' => 'Data terhapus tidak ditemukan.'], 404);
        }

        $perusahaan->restore(); // Sets deleted_at = null

        ActivityLog::record(
            action: 'restore',
            description: (auth()->user()?->nama ?? 'Admin') . " memulihkan perusahaan {$perusahaan->nama_perusahaan}",
            category: 'admin',
            loggable: $perusahaan,
            metadata: ['nama_perusahaan' => $perusahaan->nama_perusahaan]
        );

        return response()->json([
            'status'  => 'success',
            'message' => "Perusahaan {$perusahaan->nama_perusahaan} berhasil dipulihkan.",
            'data'    => $perusahaan,
        ]);
    }
}
