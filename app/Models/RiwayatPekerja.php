<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RiwayatPekerja extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'riwayat_pekerja';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'pekerja_id',
        'status_pekerjaan',
        'nama_perusahaan',
        'alamat_perusahaan',
        'nama_agen_penyalur',
        'alamat_agen_penyalur',
        'deskripsi_usaha',
        'bagian',
        'jabatan',
        'deskripsi_pekerjaan',
        'tgl_masuk',
        'tgl_keluar',
        'tanggal_selesai_kontrak',
        'file_bukti_path',
        'informal_data',
        'jenis_pajanan',
        'durasi_pajanan',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tgl_masuk' => 'date',
            'tgl_keluar' => 'date',
            'tanggal_selesai_kontrak' => 'date',
            'informal_data' => 'array',
        ];
    }

    // =========================================================================
    // Relationships
    // =========================================================================

    /**
     * Get the pekerja that owns this employment record.
     */
    public function pekerja(): BelongsTo
    {
        return $this->belongsTo(Pekerja::class);
    }

    /**
     * Get all medical check records linked to this employment period.
     */
    public function detailMedis(): HasMany
    {
        return $this->hasMany(DetailMedis::class)->orderBy('tgl_pemeriksaan', 'asc');
    }
}
