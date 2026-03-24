<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePekerjaRequest;
use App\Models\DetailMedis;
use App\Models\Pekerja;
use App\Models\RiwayatPekerja;
use App\Models\StatusAdvokasi;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class PekerjaController extends Controller
{
    /**
     * Display a listing of the workers (Pekerja).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Pekerja::withSummary();

        // Optional search filter
        if ($request->has('search')) {
            $search = $request->query('search');
            $query->where('nama_lengkap', 'like', "%{$search}%")
                  ->orWhere('nik', 'like', "%{$search}%");
        }

        // Optional status kesehatan filter
        if ($request->has('status')) {
            $query->where('status_kesehatan', $request->query('status'));
        }

        $pekerja = $query->latest()->paginate(15);

        return response()->json([
            'status' => 'success',
            'data' => $pekerja
        ]);
    }

    /**
     * Store a newly created Pekerja and related nested records.
     * Uses DB Transaction to ensure data integrity across multiple tables.
     */
    public function store(StorePekerjaRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            // 1. Create Base User Account for the worker
            $user = User::create([
                'nama' => $request->nama_lengkap,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'viewer', // Workers are viewers by default
            ]);

            // 2. Create Pekerja Record
            $pekerja = Pekerja::create([
                'user_id' => $user->id,
                'perusahaan_id' => $request->perusahaan_id,
                'nik' => $request->nik,
                'nama_lengkap' => $request->nama_lengkap,
                'status_kesehatan' => $request->status_kesehatan,
                'catatan_admin' => $request->catatan_admin,
                'tanggal_lahir' => $request->tanggal_lahir,
                'jenis_kelamin' => $request->jenis_kelamin,
                'whatsapp' => $request->whatsapp,
                'domisili' => $request->domisili,
            ]);

            // 3. Create Default Status Advokasi (all false initially)
            StatusAdvokasi::create([
                'pekerja_id' => $pekerja->id
            ]);

            // 4. Create Nested Riwayat Pekerja if provided (Step 2 of Form)
            if ($request->has('riwayat') && is_array($request->riwayat)) {
                $pekerja->riwayatPekerja()->createMany($request->riwayat);
            }

            // 5. Create Nested Detail Medis if provided (Step 3 of Form)
            if ($request->has('medis') && is_array($request->medis)) {
                $pekerja->detailMedis()->createMany($request->medis);
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Pekerja berhasil didaftarkan.',
                'data' => Pekerja::withFullProfile()->find($pekerja->id)
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to store Pekerja: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mendaftar pekerja. Terjadi kesalahan server.',
                'error' => env('APP_DEBUG') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Display the specified Pekerja detail with all relationships loaded.
     */
    public function show(string $id): JsonResponse
    {
        $pekerja = Pekerja::withFullProfile()->find($id);

        if (!$pekerja) {
            return response()->json(['status' => 'error', 'message' => 'Pekerja tidak ditemukan.'], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $pekerja
        ]);
    }

    /**
     * Update the specified Pekerja.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $pekerja = Pekerja::find($id);

        if (!$pekerja) {
            return response()->json(['status' => 'error', 'message' => 'Pekerja tidak ditemukan.'], 404);
        }

        $pekerja->update($request->only([
            'nama_lengkap', 'nik', 'perusahaan_id', 'status_kesehatan',
            'catatan_admin', 'tanggal_lahir', 'jenis_kelamin', 'whatsapp', 'domisili',
        ]));

        return response()->json([
            'status' => 'success',
            'message' => 'Data pekerja berhasil diperbarui.',
            'data' => Pekerja::withFullProfile()->find($pekerja->id)
        ]);
    }

    /**
     * Bulk update multiple Pekerja records (for filling missing data).
     */
    public function bulkUpdate(Request $request): JsonResponse
    {
        $request->validate([
            'updates' => 'required|array',
            'updates.*.id' => 'required|exists:pekerja,id',
            'updates.*.jenis_kelamin' => 'nullable|in:L,P',
            'updates.*.tanggal_lahir' => 'nullable|date',
        ]);

        $updated = 0;
        foreach ($request->updates as $item) {
            $pekerja = Pekerja::find($item['id']);
            if ($pekerja) {
                $fields = [];
                if (isset($item['jenis_kelamin'])) $fields['jenis_kelamin'] = $item['jenis_kelamin'];
                if (isset($item['tanggal_lahir'])) $fields['tanggal_lahir'] = $item['tanggal_lahir'];
                if (!empty($fields)) {
                    $pekerja->update($fields);
                    $updated++;
                }
            }
        }

        return response()->json([
            'status' => 'success',
            'message' => "{$updated} data pekerja berhasil diperbarui.",
        ]);
    }

    /**
     * Remove the specified Pekerja (Soft Delete).
     */
    public function destroy(string $id): JsonResponse
    {
        $pekerja = Pekerja::find($id);

        if (!$pekerja) {
            return response()->json(['status' => 'error', 'message' => 'Pekerja tidak ditemukan.'], 404);
        }

        $pekerja->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Data pekerja berhasil dihapus (soft delete).'
        ]);
    }
}
