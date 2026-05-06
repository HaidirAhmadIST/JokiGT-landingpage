<!DOCTYPE html>
<html>
<head>
    <title>Riwayat Aktivitas Admin</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #444; padding-bottom: 10px; }
        .header h1 { margin: 0; color: #0ea5e9; font-size: 24px; }
        .header p { margin: 5px 0 0; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #f8fafc; color: #475569; font-weight: bold; text-align: left; padding: 10px; border: 1px solid #e2e8f0; text-transform: uppercase; font-size: 10px; }
        td { padding: 10px; border: 1px solid #e2e8f0; vertical-align: top; }
        .action-badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 9px; text-transform: uppercase; }
        .create { background-color: #ecfdf5; color: #059669; }
        .update { background-color: #eff6ff; color: #2563eb; }
        .delete { background-color: #fff1f2; color: #e11d48; }
        .footer { margin-top: 30px; text-align: right; font-size: 10px; color: #94a3b8; }
    </style>
</head>
<body>
    <div className="header">
        <h1>Riwayat Aktivitas Admin</h1>
        <p>Laporan Audit Sistem - Azure Sentinel</p>
        <p>Dicetak pada: {{ now()->format('d/m/Y H:i') }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 15%">Waktu</th>
                <th style="width: 15%">Admin</th>
                <th style="width: 10%">Aksi</th>
                <th>Deskripsi</th>
            </tr>
        </thead>
        <tbody>
            @foreach($logs as $log)
            <tr>
                <td>{{ $log->created_at->format('d/m/Y H:i') }}</td>
                <td>{{ $log->user_name }}</td>
                <td>
                    <span className="action-badge {{ $log->action === 'soft_delete' || $log->action === 'permanent_delete' ? 'delete' : $log->action }}">
                        {{ $log->action }}
                    </span>
                </td>
                <td>{{ $log->description }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div className="footer">
        Dicetak secara otomatis oleh sistem Azure Sentinel
    </div>
</body>
</html>
