<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Advokasi Kasus</title>
    <style>
        body { font-family: sans-serif; font-size: 11pt; line-height: 1.5; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px; }
        .header h2 { margin: 0; color: #1e3a8a; }
        .header p { margin: 5px 0 0; font-size: 10pt; color: #64748b; }
        .code-badge { background-color: #eff6ff; color: #2563eb; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-family: monospace; font-size: 10pt; display: inline-block; margin-top: 5px; border: 1px solid #bfdbfe; }
        
        .section-title { font-size: 12pt; font-weight: bold; color: #1e40af; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-top: 25px; margin-bottom: 15px; }
        
        table { w-full; border-collapse: collapse; margin-bottom: 20px; width: 100%; }
        table th, table td { border: 1px solid #cbd5e1; padding: 8px; font-size: 10pt; text-align: left; vertical-align: top; }
        table th { background-color: #f8fafc; font-weight: bold; width: 35%; color: #475569; }
        
        .label-success { color: #16a34a; font-weight: bold; }
        .label-warning { color: #ca8a04; font-weight: bold; }
        .label-danger { color: #dc2626; font-weight: bold; }
        
        .document-checklist { width: 100%; border: none; }
        .document-checklist td { border: none; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; }
        
        .footer { position: fixed; bottom: -20px; left: 0; right: 0; font-size: 8pt; color: #94a3b8; text-align: right; border-top: 1px solid #e2e8f0; padding-top: 10px; }
    </style>
</head>
<body>

    <div class="header">
        <h2>LAPORAN DETAIL KASUS ADVOKASI</h2>
        <p>Sistem Informasi Manajemen Pelayanan Penyakit Akibat Kerja</p>
        <div class="code-badge">ADV-{{ str_pad($advokasi->id, 5, '0', STR_PAD_LEFT) }}</div>
    </div>

    <!-- IDENTITAS PEKERJA -->
    <div class="section-title">A. IDENTITAS PEKERJA</div>
    <table>
        <tr>
            <th>Pekerja</th>
            <td>
                <strong>{{ $advokasi->pekerja->nama_lengkap ?? '-' }}</strong><br>
                <span style="font-size: 9pt; color:#64748b;">NIK: {{ $advokasi->pekerja->nik ?? '-' }}</span>
            </td>
        </tr>
        <tr>
            <th>Perusahaan Tempat Bekerja</th>
            <td>{{ optional(optional($advokasi->pekerja->riwayat_pekerja)->first())->nama_perusahaan ?? optional($advokasi->pekerja->perusahaan)->nama_perusahaan ?? '-' }}</td>
        </tr>
        <tr>
            <th>Jabatan / Area Kerja</th>
            <td>{{ optional(optional($advokasi->pekerja->riwayat_pekerja)->first())->jabatan ?? '-' }} / {{ optional(optional($advokasi->pekerja->riwayat_pekerja)->first())->area_kerja ?? '-' }}</td>
        </tr>
        <tr>
            <th>Status Kesehatan Terakhir</th>
            <td>
                @php
                    $riwayat = optional($advokasi->pekerja)->riwayat_pekerja;
                    $statusKes = $riwayat && $riwayat->isNotEmpty() ? $riwayat->first()->status_kesehatan : 'Sehat';
                @endphp
                <span class="{{ str_contains(strtolower($statusKes), 'sehat') && !str_contains(strtolower($statusKes), 'tidak') ? 'label-success' : 'label-danger' }}">
                    {{ strtoupper(str_replace('_', ' ', $statusKes)) }}
                </span>
            </td>
        </tr>
    </table>

    <!-- DETAIL KASUS ADVOKASI -->
    <div class="section-title">B. STATUS DAN DETAIL KASUS</div>
    <table>
        <tr>
            <th>Jenis Kasus Advokasi</th>
            <td><strong>{{ strtoupper($advokasi->jenis_kasus) }}</strong></td>
        </tr>
        <tr>
            <th>Tahapan Saat Ini</th>
            <td>{{ strtoupper($advokasi->tahap ?? '-') }}</td>
        </tr>
        <tr>
            <th>Status Detail</th>
            <td>
                <span class="label-warning">{{ strtoupper($advokasi->status_detail ?? 'DALAM PROSES') }}</span>
            </td>
        </tr>
        <tr>
            <th>Tanggal Pelaporan Kasus</th>
            <td>{{ $advokasi->tanggal_pelaporan ? \Carbon\Carbon::parse($advokasi->tanggal_pelaporan)->translatedFormat('d F Y') : '-' }}</td>
        </tr>
        <tr>
            <th>Catatan Kronologi / Deskripsi</th>
            <td style="line-height:1.6; text-align: justify;">
                {{ $advokasi->catatan ?? 'Tidak ada catatan.' }}
            </td>
        </tr>
    </table>

    <!-- RIWAYAT KELENGKAPAN DOKUMEN -->
    <div class="section-title">C. KELENGKAPAN DOKUMEN / TAHAPAN</div>
    <table class="document-checklist">
        @php
            $docs = [
                ['label' => 'Verifikasi Pajanan', 'file' => $advokasi->bukti_pajanan_path, 'date' => $advokasi->bukti_pajanan_at],
                ['label' => 'Diagnosis Dokter', 'file' => $advokasi->bukti_persetujuan_dokter_path, 'date' => $advokasi->bukti_persetujuan_dokter_at],
                ['label' => 'Laporan Perusahaan', 'file' => $advokasi->bukti_perusahaan_lapor_path, 'date' => $advokasi->bukti_perusahaan_lapor_at],
                ['label' => 'Penetapan PAK (Pengawas Wilayah)', 'file' => $advokasi->bukti_penetapan_pak_path, 'date' => $advokasi->bukti_penetapan_pak_at],
                ['label' => 'Klaim Kompensasi BPJSTK', 'file' => $advokasi->bukti_kompensasi_bpjstk_path, 'date' => $advokasi->bukti_kompensasi_bpjstk_at],
                ['label' => 'Prosedur Rehabilitasi', 'file' => $advokasi->bukti_rehabilitasi_bpjskes_path, 'date' => $advokasi->bukti_rehabilitasi_bpjskes_at],
            ];
        @endphp

        @foreach($docs as $idx => $doc)
        <tr>
            <td style="width: 30px; text-align:center;">
                {!! $doc['file'] ? '<span class="label-success">☑</span>' : '<span style="color:#cbd5e1;">☐</span>' !!}
            </td>
            <td style="width: 250px; font-weight: {!! $doc['file'] ? 'bold' : 'normal' !!}; color: {!! $doc['file'] ? '#0f172a' : '#94a3b8' !!};">
                {{ $idx + 1 }}. {{ $doc['label'] }}
            </td>
            <td style="color: #64748b; font-size: 9pt;">
                @if($doc['file'])
                    Terverifikasi: {{ \Carbon\Carbon::parse($doc['date'])->translatedFormat('d M Y') }}
                @else
                    -
                @endif
            </td>
        </tr>
        @endforeach
    </table>

    <br><br>
    <div style="text-align: right; width: 100%; margin-top: 30px;">
        <p style="margin-bottom: 60px;">Dokumen ini dicetak secara otomatis pada:<br><strong>{{ \Carbon\Carbon::now()->translatedFormat('d F Y - H:i') }}</strong></p>
        <p>___________________</p>
        <p style="font-size: 10pt; color: #64748b; margin-top: -10px;">Sistem PAK Dinas Terkait</p>
    </div>

    <div class="footer">
        Dicetak dari Sistem Aplikasi Rekam Jejak PAK - Halaman 1 of 1
    </div>
</body>
</html>
