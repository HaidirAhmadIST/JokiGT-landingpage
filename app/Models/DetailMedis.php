<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class DetailMedis extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The table associated with the model.
     */
    protected $table = 'detail_medis';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'pekerja_id',
        'tanggal_pemeriksaan',
        'tempat_pemeriksaan',
        'jenis_pemeriksaan',
        'nama_dokter',
        'hasil_diagnosis',
        'dokumen_rekomendasi_path',
        'dokumen_bukti_path',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tanggal_pemeriksaan' => 'date',
        ];
    }

    // =========================================================================
    // Relationships
    // =========================================================================

    /**
     * Get the pekerja that owns this medical record.
     */
    public function pekerja(): BelongsTo
    {
        return $this->belongsTo(Pekerja::class);
    }
}
