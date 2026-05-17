<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class GoogleAuthController extends Controller
{
    /**
     * Redirect the user to the Google OAuth Page.
     */
    public function redirectToGoogle()
    {
        $clientId = env('GOOGLE_CLIENT_ID');
        $redirectUri = env('GOOGLE_REDIRECT_URI', 'http://localhost:8000/api/auth/google/callback');
        
        if (empty($clientId)) {
            Log::error("Google Sign-In failed to redirect: GOOGLE_CLIENT_ID is not configured in .env");
            return response()->json([
                'status' => 'error',
                'message' => 'Layanan Google Sign-in belum dikonfigurasi di server.'
            ], 500);
        }

        $query = http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => 'openid profile email',
            'state' => Str::random(40),
        ]);

        return redirect('https://accounts.google.com/o/oauth2/v2/auth?' . $query);
    }

    /**
     * Handle the callback returned by Google.
     */
    public function handleGoogleCallback(Request $request)
    {
        $code = $request->input('code');
        $error = $request->input('error');
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');

        if ($error || empty($code)) {
            Log::warning("Google OAuth sign-in aborted or failed by user. Error: {$error}");
            return redirect($frontendUrl . '/login?error=' . urlencode($error ?: 'aborted'));
        }

        try {
            $clientId = env('GOOGLE_CLIENT_ID');
            $clientSecret = env('GOOGLE_CLIENT_SECRET');
            $redirectUri = env('GOOGLE_REDIRECT_URI', 'http://localhost:8000/api/auth/google/callback');

            // Exchange Authorization Code for Access & ID Tokens
            $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'code' => $code,
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
                'redirect_uri' => $redirectUri,
                'grant_type' => 'authorization_code',
            ]);

            if ($response->failed()) {
                Log::error("Failed to exchange code for Google token. Response: " . $response->body());
                return redirect($frontendUrl . '/login?error=token_exchange_failed');
            }

            $accessToken = $response->json('access_token');

            // Fetch user profile from Google using the Access Token
            $profileResponse = Http::withToken($accessToken)->get('https://www.googleapis.com/oauth2/v3/userinfo');

            if ($profileResponse->failed()) {
                Log::error("Failed to fetch user profile from Google. Response: " . $profileResponse->body());
                return redirect($frontendUrl . '/login?error=profile_fetch_failed');
            }

            $googleUser = $profileResponse->json();
            $email = $googleUser['email'] ?? null;
            $name = $googleUser['name'] ?? 'Pekerja Google';

            if (empty($email)) {
                Log::error("Google user profile did not return an email address.");
                return redirect($frontendUrl . '/login?error=email_not_provided');
            }

            // Find or create User
            $user = User::where('email', $email)->first();

            if (!$user) {
                // Register a new worker account automatically
                $user = User::create([
                    'nama' => $name,
                    'email' => $email,
                    'role' => 'viewer',
                    'password' => Hash::make(Str::random(16)), // Dummy random password
                ]);

                ActivityLog::record(
                    'Daftar Akun Google',
                    "Pengguna baru {$user->nama} terdaftar otomatis via Google SSO.",
                    'sistem',
                    $user,
                    ['email' => $email],
                    $user
                );
            } else {
                ActivityLog::record(
                    'Login Google',
                    "Pengguna {$user->nama} berhasil login via Google SSO.",
                    'sistem',
                    $user,
                    ['email' => $email],
                    $user
                );
            }

            // Generate Sanctum access token
            $token = $user->createToken('auth_token')->plainTextToken;

            // Redirect back to frontend callback handler
            $userData = [
                'id' => $user->id,
                'nama' => $user->nama,
                'email' => $user->email,
                'whatsapp' => $user->whatsapp,
                'role' => $user->role,
            ];

            return redirect($frontendUrl . '/auth/callback?token=' . $token . '&user=' . urlencode(json_encode($userData)));

        } catch (\Exception $e) {
            Log::error("Exception thrown during Google callback processing: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return redirect($frontendUrl . '/login?error=server_error');
        }
    }
}
