<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePerusahaanRequest;
use App\Models\Perusahaan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PerusahaanController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Perusahaan::query()->withCount('pekerja'); // Automatically count related pekerja

        if ($request->has('search')) {
            $query->where('nama_perusahaan', 'like', "%{$request->search}%");
        }

        if ($request->has('status')) {
            $query->where('status_pendamping', $request->status);
        }

        $perusahaan = $query->latest()->paginate(15);

        return response()->json([
            'status' => 'success',
            'data' => $perusahaan
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePerusahaanRequest $request): JsonResponse
    {
        $perusahaan = Perusahaan::create($request->validated());

        return response()->json([
            'status' => 'success',
            'message' => 'Perusahaan berhasil ditambahkan.',
            'data' => $perusahaan
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
            'data' => $perusahaan
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

        return response()->json([
            'status' => 'success',
            'message' => 'Data perusahaan berhasil diperbarui.',
            'data' => $perusahaan
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $perusahaan = Perusahaan::find($id);

        if (!$perusahaan) {
            return response()->json(['status' => 'error', 'message' => 'Perusahaan tidak ditemukan.'], 404);
        }

        // Check if there are related pekerja before deleting
        if ($perusahaan->pekerja()->exists()) {
            return response()->json([
                'status' => 'error', 
                'message' => 'Tidak dapat menghapus perusahaan yang masih memiliki pekerja aktif.'
            ], 422);
        }

        $perusahaan->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Perusahaan berhasil dihapus.'
        ]);
    }
}
