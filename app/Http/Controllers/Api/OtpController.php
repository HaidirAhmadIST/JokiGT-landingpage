<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\ActivityLog;
use App\Mail\OtpMail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class OtpController extends Controller
{
    // No external service needed for email

    /**
     * Generate and send OTP to user's Email address.
     */
    public function sendOtp(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ], [
            'email.required' => 'Alamat Email wajib diisi.',
            'email.email' => 'Format Email tidak valid.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors()
            ], 422);
        }

        $email = strtolower(trim($request->input('email')));

        // Generate a secure 6-digit random code using Cryptographically Secure PRNG
        $otp = (string) random_int(100000, 999999);

        // Store OTP in Cache for 5 minutes (300 seconds)
        Cache::put('otp_' . $email, $otp, 300);

        try {
            // Send OTP via Email
            Mail::to($email)->send(new OtpMail($otp));

            return response()->json([
                'status' => 'success',
                'message' => 'Kode verifikasi berhasil dikirim ke Email Anda.',
                'data' => [
                    'email' => $email,
                    'debug_otp' => env('APP_DEBUG') ? $otp : null,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send OTP email: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengirim kode verifikasi. Coba lagi beberapa saat.'
            ], 500);
        }
    }

    /**
     * Verify OTP code and authenticate/register user.
     */
    public function verifyOtp(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'otp' => 'required|string|size:6',
        ], [
            'email.required' => 'Alamat Email wajib disertakan.',
            'email.email' => 'Format Email tidak valid.',
            'otp.required' => 'Kode verifikasi wajib diisi.',
            'otp.size' => 'Kode verifikasi harus tepat 6 digit.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors()
            ], 422);
        }

        $otp = $request->input('otp');
        $email = strtolower(trim($request->input('email')));

        // Fetch cached OTP
        $cachedOtp = Cache::get('otp_' . $email);

        if (empty($cachedOtp)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Kode verifikasi kedaluwarsa. Silakan kirim ulang kode baru.'
            ], 422);
        }

        if ($cachedOtp !== $otp) {
            return response()->json([
                'status' => 'error',
                'message' => 'Kode verifikasi salah. Periksa kembali kode yang Anda masukkan.'
            ], 422);
        }

        // OTP is correct! Clear from cache immediately for security
        Cache::forget('otp_' . $email);

        // Find or create User by Email
        $user = User::where('email', $email)->first();

        if (!$user) {
            // Create a new viewer user
            $parts = explode('@', $email);
            $user = User::create([
                'nama' => 'Pekerja ' . $parts[0],
                'email' => $email,
                'role' => 'viewer',
                'password' => Hash::make(Str::random(16)), // Dummy random password
            ]);

            ActivityLog::record(
                'Daftar Akun OTP',
                "Pekerja baru {$user->nama} terdaftar otomatis via Email OTP.",
                'sistem',
                $user,
                ['email' => $email],
                $user
            );
        } else {
            ActivityLog::record(
                'Login OTP',
                "Pengguna {$user->nama} login sukses via Email OTP.",
                'sistem',
                $user,
                ['email' => $email],
                $user
            );
        }

        // Generate Sanctum token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Verifikasi berhasil. Anda masuk ke sistem.',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'nama' => $user->nama,
                    'whatsapp' => $user->whatsapp,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
                'token' => $token,
            ]
        ]);
    }
}
