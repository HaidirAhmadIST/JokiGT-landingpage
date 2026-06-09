<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Kode Verifikasi OTP Anda</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #334155; line-height: 1.6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); }
        .header { background-color: #0ea5e9; padding: 30px 20px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
        .content { padding: 40px 30px; text-align: center; }
        .otp-box { background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 20px; margin: 30px 0; font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #0f172a; }
        .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        p { margin-bottom: 15px; font-size: 16px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Sistem Rekam Jejak PAK</h1>
        </div>
        <div class="content">
            <p>Halo,</p>
            <p>Gunakan kode verifikasi berikut untuk masuk ke akun Anda. Kode ini hanya berlaku selama 5 menit.</p>
            <div class="otp-box">{{ $otp }}</div>
            <p><strong>Peringatan:</strong> Jangan berikan kode ini kepada siapapun, termasuk pihak admin.</p>
        </div>
        <div class="footer">
            <p>&copy; {{ date('Y') }} Sistem Rekam Jejak PAK. Hak Cipta Dilindungi.</p>
        </div>
    </div>
</body>
</html>
