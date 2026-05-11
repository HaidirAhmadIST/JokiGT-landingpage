<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Authenticate user and return Sanctum token.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Email atau password salah.'
            ], 401);
        }

        // Revoke all existing tokens for security
        $user->tokens()->delete();

        // Create new token
        $token = $user->createToken('auth_token')->plainTextToken;

        // Record Activity
        ActivityLog::record(
            'Login',
            "Pengguna {$user->nama} berhasil login ke dalam sistem.",
            'sistem',
            $user,
            ['ip' => $request->ip(), 'agent' => $request->userAgent()],
            $user
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Login berhasil.',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'nama' => $user->nama,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
                'token' => $token,
            ]
        ]);
    }

    /**
     * Get the authenticated user's profile.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if ($user->role === 'viewer') {
            $user->load(['pekerja' => function ($query) {
                $query->with(['perusahaan', 'riwayatPekerja.detailMedis', 'detailMedis', 'riwayatMedis', 'statusAdvokasi']);
            }]);
        } else {
            $user->load('pekerja');
        }

        return response()->json([
            'status' => 'success',
            'data' => $user
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'nama'    => 'sometimes|required|string|max:255',
            'phone'   => 'nullable|string|max:20',
            'jabatan' => 'nullable|string|max:255',
            'lokasi'  => 'nullable|string|max:255',
            'bio'     => 'nullable|string',
        ]);

        $user->update($validated);

        return response()->json([
            'status'  => 'success',
            'message' => 'Profil berhasil diperbarui.',
            'data'    => $user
        ]);
    }

    public function uploadFoto(Request $request): JsonResponse
    {
        $request->validate([
            'foto' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $user = $request->user();

        if ($request->hasFile('foto')) {
            $file = $request->file('foto');
            $filename = time() . '_' . $user->id . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('profile-photos', $filename, 'public');
            
            $user->update(['foto' => $path]);

            return response()->json([
                'status'  => 'success',
                'message' => 'Foto profil berhasil diunggah.',
                'data'    => [
                    'foto_url' => asset('storage/' . $path)
                ]
            ]);
        }

        return response()->json(['status' => 'error', 'message' => 'Gagal mengunggah foto.'], 400);
    }

    /**
     * Change the authenticated user's password.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password'      => 'required|string',
            'new_password'          => 'required|string|min:8|confirmed',
        ], [
            'current_password.required' => 'Password saat ini wajib diisi.',
            'new_password.required'     => 'Password baru wajib diisi.',
            'new_password.min'          => 'Password baru minimal 8 karakter.',
            'new_password.confirmed'    => 'Konfirmasi password tidak cocok.',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Password saat ini tidak sesuai.',
            ], 422);
        }

        $user->update(['password' => Hash::make($request->new_password)]);

        // Optional: Revoke tokens? The user might want to stay logged in.
        // But the previous implementation revoked tokens. I'll keep it.
        $user->tokens()->delete();

        // Record Activity
        ActivityLog::record(
            'Ganti Password',
            "Pengguna {$user->nama} memperbarui kata sandi akun.",
            'sistem',
            $user,
            [],
            $user
        );

        return response()->json([
            'status'  => 'success',
            'message' => 'Password berhasil diubah. Silakan login kembali.',
        ]);
    }

    /**
     * Revoke the user's current token.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Record Activity before deleting token
        ActivityLog::record(
            'Logout',
            "Pengguna {$user->nama} keluar dari sistem.",
            'sistem',
            $user,
            [],
            $user
        );

        $user->currentAccessToken()->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Logout berhasil.'
        ]);
    }
}
