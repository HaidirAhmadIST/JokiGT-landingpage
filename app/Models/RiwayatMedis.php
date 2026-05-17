<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RiwayatMedis extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'riwayat_medis';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'pekerja_id',
        'keluhan_utama',
        'diagnosa_dokter',
        'golongan_darah',
        'rhesus',
        'riwayat_penyakit',
        'alergi',
        'riwayat_operasi',
        'obat_rutin',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'riwayat_penyakit' => 'array',
            'alergi' => 'array',
            'riwayat_operasi' => 'array',
        ];
    }

    // =========================================================================
    // Relationships
    // =========================================================================

    /**
     * Get the pekerja that owns this profile.
     */
    public function pekerja(): BelongsTo
    {
        return $this->belongsTo(Pekerja::class);
    }
}
