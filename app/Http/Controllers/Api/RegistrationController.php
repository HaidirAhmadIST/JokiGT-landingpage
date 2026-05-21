<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Perusahaan;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class RegistrationController extends Controller
{
    /**
     * Complete the registration by setting a password.
     */
    public function completeRegistration(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'whatsapp' => 'required|string|exists:users,whatsapp',
            'password' => 'required|string|min:8|confirmed',
        ], [], [
            'whatsapp' => 'Nomor Telepon',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::where('whatsapp', $request->whatsapp)->first();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Pengguna tidak ditemukan.'
            ], 404);
        }

        // Update the password
        $user->password = Hash::make($request->password);
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Password berhasil disetel. Silakan login untuk masuk ke dashboard.',
        ], 200);
    }

    /**
     * Return a unique list of all registered unions (serikat) from users and perusahaan.
     */
    public function listSerikat(): JsonResponse
    {
        $serikatUsers = \App\Models\User::whereNotNull('serikat')
            ->where('serikat', '!=', '')
            ->distinct()
            ->pluck('serikat')
            ->toArray();

        $serikatPerusahaan = \App\Models\Perusahaan::whereNotNull('serikat')
            ->where('serikat', '!=', '')
            ->distinct()
            ->pluck('serikat')
            ->toArray();

        $allSerikat = array_values(array_unique(array_merge($serikatUsers, $serikatPerusahaan)));
        sort($allSerikat);

        return response()->json(['status' => 'success', 'data' => $allSerikat]);
    }
}
