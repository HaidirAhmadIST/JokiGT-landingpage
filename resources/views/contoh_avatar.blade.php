<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Daftar Pekerja</title>
    <style>
        /* CSS untuk Avatar Pas Foto */
        .avatar-pekerja {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            object-fit: cover;
            object-position: top; /* Fokus ke area wajah/atas */
            border: 2px solid #e2e8f0; /* opsional: untuk memberikan bingkai tipis */
        }
        
        /* Styling tambahan untuk layout contoh */
        .pekerja-card {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 10px;
            border-bottom: 1px solid #eee;
        }
        .pekerja-info h4 {
            margin: 0 0 5px 0;
            font-size: 16px;
        }
        .pekerja-info p {
            margin: 0;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>

    <h2>Daftar Pekerja</h2>

    <div class="pekerja-list">
        <!-- Contoh looping data pekerja dari Blade -->
        {{-- @foreach($pekerjaList as $pekerja) --}}
        <div class="pekerja-card">
            
            {{-- 
                Logika Render Foto:
                Jika $pekerja->pas_foto ada, gunakan asset storage.
                Jika null, gunakan gambar default.
            --}}
            <img 
                src="{{ $pekerja->pas_foto ? asset('storage/profil/' . $pekerja->pas_foto) : asset('images/default-avatar.png') }}" 
                alt="Pas Foto {{ $pekerja->nama_lengkap }}"
                class="avatar-pekerja"
            >
            
            <div class="pekerja-info">
                <h4>{{ $pekerja->nama_lengkap }}</h4>
                <p>NIK: {{ $pekerja->nik }}</p>
            </div>
        </div>
        {{-- @endforeach --}}
    </div>

</body>
</html>
