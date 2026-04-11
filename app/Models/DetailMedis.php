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
        'tgl_pemeriksaan',
        'tempat_pemeriksa',
        'jenis_pemeriksa',
        'dokter_pemeriksa',
        'hasil_diagnosis',
        'rekomendasi',
        'file_hasil_path',
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
            'tgl_pemeriksaan' => 'date',
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
