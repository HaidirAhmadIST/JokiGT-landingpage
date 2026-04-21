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
use Illuminate\Support\Facades\Storage;

class PekerjaController extends Controller
{
    /**
     * Display a listing of the workers (Pekerja).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Pekerja::withSummary();

        // Filter by company (used by company detail modal)
        if ($request->has('perusahaan_id')) {
            $query->where('perusahaan_id', $request->query('perusahaan_id'));
            // Load extra relations needed for company detail view
            $query->with(['riwayatPekerja', 'statusAdvokasi']);
        }

        // Optional search filter
        if ($request->has('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('nama_lengkap', 'like', "%{$search}%")
                  ->orWhere('nik', 'like', "%{$search}%");
            });
        }

        // Optional status kesehatan filter
        if ($request->has('status')) {
            $query->where('status_kesehatan', $request->query('status'));
        }

        $perPage = $request->input('per_page', $request->has('perusahaan_id') ? 10 : 15);
        $pekerja = $query->latest()->paginate($perPage);

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

            // 1. Find or create User
            $user = User::where('email', $request->email)->first();
            
            if ($user) {
                $user->update([
                    'nama' => $request->nama_lengkap,
                    'password' => Hash::make($request->password),
                ]);
            } else {
                $user = User::create([
                    'nama' => $request->nama_lengkap,
                    'email' => $request->email,
                    'password' => Hash::make($request->password),
                    'role' => 'viewer',
                ]);
            }

            // 2. Find or create Pekerja (Mainly by NIK)
            $pekerja = Pekerja::where('nik', $request->nik)->first();

            if ($pekerja) {
                // Ensure the worker is tied to this user
                $pekerja->update([
                    'user_id' => $user->id,
                    'perusahaan_id' => $request->perusahaan_id,
                    'nama_lengkap' => $request->nama_lengkap,
                    'status_kesehatan' => $request->status_kesehatan,
                    'catatan_admin' => $request->catatan_admin,
                    'tanggal_lahir' => $request->tanggal_lahir,
                    'jenis_kelamin' => $request->jenis_kelamin,
                    'whatsapp' => $request->whatsapp,
                    'domisili' => $request->domisili,
                ]);
            } else {
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
            }

            // 3. Ensure Status Advokasi exists
            if (!$pekerja->statusAdvokasi) {
                StatusAdvokasi::create([
                    'pekerja_id' => $pekerja->id
                ]);
            }

            // 4. Update Nested Riwayat Pekerja
            // For upsert, we clear existing riwayat and replace with new ones from the form 
            // to maintain consistency with the wizard's current state.
            if ($request->has('riwayat') && is_array($request->riwayat)) {
                $pekerja->riwayatPekerja()->delete();
                $pekerja->riwayatPekerja()->createMany($request->riwayat);
            }

            // 5. Update Nested Detail Medis
            // We consolidate medical records from both the independent "medis" array 
            // and the embedded "riwayat_pemeriksaan" found in each employment history entry.
            $allMedis = [];

            if ($request->has('medis') && is_array($request->medis)) {
                $allMedis = array_merge($allMedis, $request->medis);
            }

            if ($request->has('riwayat') && is_array($request->riwayat)) {
                foreach ($request->riwayat as $r) {
                    if (isset($r['riwayat_pemeriksaan']) && is_array($r['riwayat_pemeriksaan'])) {
                        $allMedis = array_merge($allMedis, $r['riwayat_pemeriksaan']);
                    }
                }
            }

            if (!empty($allMedis)) {
                $pekerja->detailMedis()->delete();
                $mappedMedis = array_map(function ($m) {
                    return [
                        'tgl_pemeriksaan'    => $m['tanggal_pemeriksaan'] ?? null,
                        'tempat_pemeriksa'   => $m['tempat_pemeriksaan']  ?? null,
                        'jenis_pemeriksa'    => $m['jenis_pemeriksaan']   ?? null,
                        'dokter_pemeriksa'   => $m['dokter']              ?? null,
                        'status_kesehatan'   => $m['status_kesehatan']    ?? 'sehat',
                        'hasil_diagnosis'    => $m['hasil_diagnosis']     ?? null,
                        'rekomendasi'        => $m['rekomendasi']         ?? null,
                        'pendamping'         => $m['pendamping']          ?? null,
                    ];
                }, $allMedis);
                $pekerja->detailMedis()->createMany($mappedMedis);
            }

            // 6. Create Riwayat Medis Baseline Data
            if ($request->has('riwayat_medis') && is_array($request->riwayat_medis)) {
                $pekerja->riwayatMedis()->create($request->riwayat_medis);
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Data pekerja berhasil disimpan.',
                'data' => Pekerja::withFullProfile()->find($pekerja->id)
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to store/upsert Pekerja: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menyimpan data pekerja. Terjadi kesalahan server.',
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
        if (!auth()->user()->isAdmin()) {
            return response()->json(['status' => 'error', 'message' => 'Hanya admin yang dapat mengubah data pekerja.'], 403);
        }

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
     * Remove the specified Pekerja.
     * Super Admin performs a permanent delete, others use soft delete (if allowed by route).
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $pekerja = Pekerja::withTrashed()->find($id);

        if (!$pekerja) {
            return response()->json(['status' => 'error', 'message' => 'Pekerja tidak ditemukan.'], 404);
        }

        if ($request->user()->role === 'admin') {
            $pekerja->forceDelete();
            $msg = 'Data pekerja berhasil dihapus secara permanen.';
        } else {
            $pekerja->delete();
            $msg = 'Data pekerja berhasil dihapus secara lunak (soft delete).';
        }

        return response()->json([
            'status' => 'success',
            'message' => $msg
        ]);
    }

    /**
     * Upload and update Pekerja's photo.
     */
    public function uploadFoto(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'pas_foto' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $pekerja = Pekerja::find($id);

        if (!$pekerja) {
            return response()->json(['status' => 'error', 'message' => 'Pekerja tidak ditemukan.'], 404);
        }

        if ($request->hasFile('pas_foto')) {
            $file = $request->file('pas_foto');
            $extension = $file->getClientOriginalExtension();
            $filename = $pekerja->id . '_' . time() . '.' . $extension;

            // Delete old photo if exists
            if ($pekerja->pas_foto) {
                Storage::disk('public')->delete('profil/' . $pekerja->pas_foto);
            }

            // Store new photo
            $file->storeAs('profil', $filename, 'public');

            $pekerja->update(['pas_foto' => $filename]);

            return response()->json([
                'status' => 'success',
                'message' => 'Pas foto berhasil diunggah.',
                'data' => Pekerja::withSummary()->find($pekerja->id)
            ]);
        }

        return response()->json(['status' => 'error', 'message' => 'File tidak ditemukan.'], 400);
    }
}
