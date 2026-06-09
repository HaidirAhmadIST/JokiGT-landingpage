<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Progress Advokasi Kasus</title>
    <style>
        body { font-family: sans-serif; background-color: #f4f7f6; padding: 20px; color: #333; }
        .container { background-color: #ffffff; padding: 30px; border-radius: 8px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .header { text-align: center; border-bottom: 1px solid #eeeeee; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { margin: 0; color: #2c3e50; font-size: 24px; }
        .content p { line-height: 1.6; font-size: 16px; }
        .status-box { background-color: #f8f9fa; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .status-box.selesai { border-left-color: #2ecc71; background-color: #f4fdf8; }
        .status-label { font-weight: bold; color: #555; }
        .note-box { background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; font-size: 13px; color: #888888; margin-top: 30px; border-top: 1px solid #eeeeee; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Update Progress Advokasi</h1>
        </div>
        
        <div class="content">
            <p>Halo, <strong>{{ $pekerja->nama_lengkap ?? 'Bapak/Ibu' }}</strong>,</p>
            
            <p>Kami menginformasikan bahwa terdapat pembaruan pada proses advokasi Anda terkait kasus: <strong>{{ $judulKasus }}</strong>.</p>
            
            <div class="status-box {{ strtolower($statusTahapan) === 'selesai' ? 'selesai' : '' }}">
                <p style="margin: 0;">
                    <span class="status-label">Tahapan Saat Ini:</span> {{ $namaTahapan }} <br>
                    <span class="status-label">Status:</span> 
                    @if(strtolower($statusTahapan) === 'selesai')
                        <strong style="color: #2ecc71;">Telah Selesai divalidasi</strong>
                    @else
                        <strong style="color: #3498db;">Sedang Berjalan / Membutuhkan Dokumen</strong>
                    @endif
                </p>
            </div>

            @if(strtolower($statusTahapan) === 'selesai')
                <p>Kabar baik! Dokumen pada tahap <strong>{{ $namaTahapan }}</strong> telah divalidasi dan dinyatakan selesai. Proses advokasi Anda akan segera dilanjutkan ke tahap berikutnya.</p>
            @else
                <p>Silakan login ke aplikasi untuk melihat detail lebih lanjut, dan unggah dokumen atau bukti pendukung yang diperlukan jika diminta pada tahap ini.</p>
            @endif

            @if($pesanTambahan)
                <div class="note-box">
                    <p style="margin: 0;"><strong>Catatan Admin Pengurus:</strong><br>
                    <em>"{!! nl2br(e($pesanTambahan)) !!}"</em></p>
                </div>
            @endif
            
            <p>Sistem kami akan terus memantau dan memberikan notifikasi perkembangan selanjutnya.</p>
        </div>
        
        <div class="footer">
            <p>&copy; {{ date('Y') }} {{ config('app.name', 'Serikat Pekerja') }}. All rights reserved.</p>
            <p>Pesan ini dikirimkan otomatis oleh sistem. Mohon tidak membalas email ini.</p>
        </div>
    </div>
</body>
</html>
