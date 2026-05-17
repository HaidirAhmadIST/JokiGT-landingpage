<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\ActivityLog;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class OtpController extends Controller
{
    public function __construct(private readonly WhatsAppService $whatsAppService) {}

    /**
     * Generate and send OTP to user's WhatsApp number.
     */
    public function sendOtp(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'whatsapp' => 'required|string|min:9|max:20',
        ], [
            'whatsapp.required' => 'Nomor WhatsApp wajib diisi.',
            'whatsapp.min' => 'Nomor WhatsApp minimal 9 digit.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors()
            ], 422);
        }

        // Format whatsapp: ensure it uses numeric digits, remove + or spaces
        $whatsapp = preg_replace('/[^0-9]/', '', $request->input('whatsapp'));

        // Standardize leading "08" to "628" for Indonesian numbers (Fonnte API usually requires international format)
        if (str_starts_with($whatsapp, '08')) {
            $whatsapp = '628' . substr($whatsapp, 2);
        }

        // Generate a secure 6-digit random code
        $otp = (string) mt_rand(100000, 999999);

        // Store OTP in Cache for 5 minutes (300 seconds)
        Cache::put('otp_' . $whatsapp, $otp, 300);

        // Send OTP via WhatsApp Service
        $sent = $this->whatsAppService->sendOtp($whatsapp, $otp);

        if ($sent) {
            return response()->json([
                'status' => 'success',
                'message' => 'Kode verifikasi berhasil dikirim ke WhatsApp Anda.',
                'data' => [
                    'whatsapp' => $whatsapp,
                    'debug_otp' => env('APP_DEBUG') ? $otp : null, // Show OTP in response ONLY when debugging is active
                ]
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'Gagal mengirim kode verifikasi. Coba lagi beberapa saat.'
        ], 500);
    }

    /**
     * Verify OTP code and authenticate/register user.
     */
    public function verifyOtp(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'whatsapp' => 'required|string',
            'otp' => 'required|string|size:6',
        ], [
            'whatsapp.required' => 'Nomor WhatsApp wajib disertakan.',
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

        $whatsapp = $request->input('whatsapp');
        $otp = $request->input('otp');

        // Fetch cached OTP
        $cachedOtp = Cache::get('otp_' . $whatsapp);

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
        Cache::forget('otp_' . $whatsapp);

        // Find or create User by WhatsApp number
        $user = User::where('whatsapp', $whatsapp)->first();

        if (!$user) {
            // Create a new viewer user
            $suffix = substr($whatsapp, -4);
            $user = User::create([
                'nama' => 'Pekerja WA ' . $suffix,
                'whatsapp' => $whatsapp,
                'role' => 'viewer',
                'password' => Hash::make(Str::random(16)), // Dummy random password
            ]);

            ActivityLog::record(
                'Daftar Akun OTP',
                "Pekerja baru {$user->nama} terdaftar otomatis via WhatsApp OTP.",
                'sistem',
                $user,
                ['whatsapp' => $whatsapp],
                $user
            );
        } else {
            ActivityLog::record(
                'Login OTP',
                "Pengguna {$user->nama} login sukses via WhatsApp OTP.",
                'sistem',
                $user,
                ['whatsapp' => $whatsapp],
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
