<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
        'nama_perusahaan',
        'deskripsi_usaha',
        'bagian',
        'deskripsi_pekerjaan',
        'tgl_masuk',
        'tgl_keluar',
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
}
