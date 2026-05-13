<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePekerjaRequest;
use App\Models\Pekerja;
use App\Models\User;
use App\Models\ActivityLog;
use App\Policies\PekerjaPolicy;
use App\Services\PekerjaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class PekerjaController extends Controller
{
    use AuthorizesRequests;

    /**
     * Injeksi PekerjaService via constructor untuk memisahkan
     * logika bisnis dari lapisan HTTP Controller.
     */
    public function __construct(private readonly PekerjaService $pekerjaService) {}

    public function index(Request $request): JsonResponse
    {
        try {
            // Support identifying user even on public routes
            $user = $request->user() ?: auth('sanctum')->user();

            // If guest (not logged in), ONLY allow searching or filtering by company (for dashboard compatibility)
            if (!$user) {
                if (!$request->has('search') && !$request->has('perusahaan_id')) {
                    return response()->json([
                        'status' => 'success',
                        'data'   => ['data' => [], 'total' => 0]
                    ]);
                }
            }


            // Viewer can only see their own pekerja record
            if ($user?->role === 'viewer') {
                $pekerja = Pekerja::withSummary()
                    ->where('user_id', $user->id)
                    ->first();
                return response()->json([
                    'status' => 'success',
                    'data'   => $pekerja ? ['data' => [$pekerja], 'total' => 1] : ['data' => [], 'total' => 0]
                ]);
            }

            $query = Pekerja::withSummary();

            // Filter by company
            if ($request->has('perusahaan_id')) {
                $query->where('perusahaan_id', $request->input('perusahaan_id'));
                $query->with(['riwayatPekerja', 'statusAdvokasi']);
            }

            // Search filter
            if ($request->has('search')) {
                $search = strtolower($request->search);
                $query->where(function($q) use ($search) {
                    $q->whereRaw('LOWER(nama_lengkap) LIKE ?', ["%{$search}%"])
                      ->orWhereRaw('LOWER(nik) LIKE ?', ["%{$search}%"]);
                });
            }

            // Alphabet filter
            if ($request->filled('letter') && $request->input('letter') !== 'all') {
                $query->where('nama_lengkap', 'ilike', $request->input('letter') . '%');
            }

            // Health status filter
            if ($request->has('status')) {
                $query->where('status_kesehatan', $request->query('status'));
            }

            $perPage = $request->input('per_page', $request->has('perusahaan_id') ? 10 : 15);
            $sortBy = $request->input('sort_by');
            $sortDir = $request->input('sort_dir', 'asc');

            if ($sortBy) {
                $query = $query->orderBy($sortBy, $sortDir);
            } elseif ($request->has('perusahaan_id')) {
                $query = $query->orderBy('nama_lengkap', 'asc');
            } else {
                $query = $query->latest();
            }

            $pekerja = $query->paginate($perPage);

            return response()->json([
                'status' => 'success',
                'data' => $pekerja
            ]);
        } catch (\Exception $e) {
            Log::error('Error in PekerjaController@index: ' . $e->getMessage(), [
                'request' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'status' => 'error',
                'message' => 'Internal Server Error'
            ], 500);
        }
    }

    /**
     * Store a newly created Pekerja and related nested records.
     *
     * Logika bisnis (user, riwayat, medis) didelegasikan ke PekerjaService.
     * Controller ini hanya menangani HTTP request/response dan transaksi DB.
     */
    public function store(StorePekerjaRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Cek keamanan: NIK tidak boleh diklaim oleh user lain
            $existingPekerja = Pekerja::where('nik', $request->nik)->first();
            if ($existingPekerja
                && $existingPekerja->user_id
                && $request->user()?->role === 'viewer'
            ) {
                $newUser = User::where('email', $request->email)->first();
                if ($newUser && $existingPekerja->user_id !== $newUser->id) {
                    return response()->json([
                        'status'  => 'error',
                        'message' => 'NIK ini sudah terdaftar dengan akun lain. Hubungi admin jika ini kesalahan.',
                    ], 403);
                }
            }

            $validated = $request->validated();

            // 1. Buat atau perbarui User
            $user = $this->pekerjaService->createOrUpdateUser($validated);

            // 2. Buat atau perbarui Pekerja + inisialisasi StatusAdvokasi
            $pekerja = $this->pekerjaService->createOrUpdatePekerja($user, $validated);

            // 3. Sinkronisasi Riwayat Pekerjaan
            $embeddedMedis = [];
            if (isset($validated['riwayat']) && is_array($validated['riwayat'])) {
                $embeddedMedis = $this->pekerjaService->syncRiwayatPekerja($pekerja, $validated['riwayat']);
            }

            // 4. Sinkronisasi Detail Medis (mandiri + embedded)
            $medisMandiri = isset($validated['medis']) && is_array($validated['medis']) ? $validated['medis'] : [];
            $this->pekerjaService->syncDetailMedis($pekerja, $medisMandiri, $embeddedMedis);

            // 5. Sinkronisasi Riwayat Medis Baseline
            if (isset($validated['riwayat_medis']) && is_array($validated['riwayat_medis'])) {
                $pekerja->riwayatMedis()->updateOrCreate(
                    ['pekerja_id' => $pekerja->id],
                    $validated['riwayat_medis']
                );
            }

            // Catat log aktivitas
            ActivityLog::record(
                'tambah_pekerja',
                "Menambahkan data pekerja baru: {$pekerja->nama_lengkap}",
                'admin',
                $pekerja,
                ['nik' => $pekerja->nik]
            );

            DB::commit();

            // Buat token agar pekerja bisa langsung unggah dokumen setelah daftar
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'status'  => 'success',
                'message' => 'Data pekerja berhasil disimpan.',
                'data'    => Pekerja::withFullProfile()->find($pekerja->id),
                'token'   => $token,
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('PekerjaController@store failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal menyimpan data pekerja. Terjadi kesalahan server.',
                'error'   => env('APP_DEBUG') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Display the specified Pekerja detail with all relationships loaded.
     *
     * Dilindungi oleh PekerjaPolicy::view() untuk mencegah IDOR:
     * - Admin & Petugas → bisa melihat semua data pekerja.
     * - Viewer (Pekerja) → hanya bisa melihat data dirinya sendiri.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $pekerja = Pekerja::withFullProfile()->find($id);

        if (!$pekerja) {
            return response()->json(['status' => 'error', 'message' => 'Pekerja tidak ditemukan.'], 404);
        }

        // Cegah IDOR: pastikan user hanya bisa mengakses data miliknya
        // (kecuali admin/petugas yang punya akses penuh)
        if ($request->user() && $request->user()->isViewer()) {
            $this->authorize('view', $pekerja);
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

        // Allow Admin, Petugas, or the Owner (the worker themselves)
        $user = auth()->user();
        $isOwner = $user && ($user->id === $pekerja->user_id);

        if (!$user->isAdmin() && !$user->isPetugas() && !$isOwner) {
            return response()->json(['status' => 'error', 'message' => 'Anda tidak memiliki izin untuk mengubah data ini.'], 403);
        }

        $pekerja->update($request->only([
            'nama_lengkap', 'nik', 'perusahaan_id', 'status_kesehatan',
            'catatan_admin', 'tanggal_lahir', 'jenis_kelamin', 'whatsapp', 'domisili',
        ]));

        ActivityLog::record(
            'update_pekerja',
            "Memperbarui data profil pekerja: {$pekerja->nama_lengkap}",
            'admin',
            $pekerja
        );

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

        $ids = array_column($request->updates, 'id');
        $pekerjas = Pekerja::whereIn('id', $ids)->get()->keyBy('id');
        
        $updated = 0;
        
        DB::transaction(function () use ($request, $pekerjas, &$updated) {
            foreach ($request->updates as $item) {
                if ($pekerja = $pekerjas->get($item['id'])) {
                    $fields = [];
                    if (isset($item['jenis_kelamin'])) $fields['jenis_kelamin'] = $item['jenis_kelamin'];
                    if (isset($item['tanggal_lahir'])) $fields['tanggal_lahir'] = $item['tanggal_lahir'];
                    if (!empty($fields)) {
                        $pekerja->update($fields);
                        $updated++;
                    }
                }
            }
        });

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
            $action = 'force_delete_pekerja';
        } else {
            $pekerja->delete();
            $msg = 'Data pekerja berhasil dihapus secara lunak (soft delete).';
            $action = 'delete_pekerja';
        }

        ActivityLog::record(
            $action,
            "Menghapus data pekerja: {$pekerja->nama_lengkap}",
            'admin',
            $pekerja
        );

        return response()->json([
            'status' => 'success',
            'message' => $msg
        ]);
    }

    /**
     * Upload and update Pekerja's photo.
     *
     * Dilindungi oleh PekerjaPolicy::updateFoto() untuk mencegah IDOR:
     * - Admin → bisa mengganti foto siapapun.
     * - Viewer (Pekerja) → hanya bisa mengganti foto dirinya sendiri.
     * - Petugas → tidak diizinkan mengganti foto pribadi pekerja.
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

        // Cegah IDOR via PekerjaPolicy::updateFoto()
        // Jika tidak punya izin, Laravel otomatis melempar AuthorizationException (403)
        $this->authorize('updateFoto', $pekerja);

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

            ActivityLog::record(
                'upload_foto_pekerja',
                "Mengunggah pas foto baru untuk pekerja: {$pekerja->nama_lengkap}",
                'admin',
                $pekerja
            );

            return response()->json([
                'status' => 'success',
                'message' => 'Pas foto berhasil diunggah.',
                'data' => Pekerja::withSummary()->find($pekerja->id)
            ]);
        }

        return response()->json(['status' => 'error', 'message' => 'File tidak ditemukan.'], 400);
    }
}
