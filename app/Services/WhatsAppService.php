<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    /**
     * Send an OTP verification message to the specified WhatsApp number.
     *
     * @param string $recipient
     * @param string $otp
     * @return bool
     */
    public function sendOtp(string $recipient, string $otp): bool
    {
        $token = env('WHATSAPP_API_TOKEN');
        $apiUrl = env('WHATSAPP_API_URL', 'https://api.fonnte.com/send');
        
        $message = "*Sistem Rekam Jejak PAK*\n\nKode verifikasi (OTP) Anda adalah: *{$otp}*.\n\nJangan membagikan kode ini kepada siapa pun. Kode berlaku selama 5 menit.";

        // Fallback to local logs if no API token is configured (convenient for local dev & testing)
        if (empty($token) || $token === 'your-fonnte-token') {
            Log::info("========================================");
            Log::info("WHATSAPP OTP SIMULATION");
            Log::info("Recipient: {$recipient}");
            Log::info("Message: {$message}");
            Log::info("OTP Code: {$otp}");
            Log::info("========================================");
            return true;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => $token,
            ])->post($apiUrl, [
                'target' => $recipient,
                'message' => $message,
            ]);

            if ($response->successful()) {
                Log::info("WhatsApp OTP sent successfully to {$recipient} via API.");
                return true;
            }

            Log::error("Failed to send WhatsApp OTP to {$recipient} via API. Response: " . $response->body());
            return false;
        } catch (\Exception $e) {
            Log::error("Exception thrown while sending WhatsApp OTP to {$recipient}: " . $e->getMessage());
            return false;
        }
    }
}
