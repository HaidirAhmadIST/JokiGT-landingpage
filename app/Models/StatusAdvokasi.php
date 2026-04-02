<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StatusAdvokasi extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'status_advokasi';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'pekerja_id',
        'jenis_kasus',
        'tahap',
        'status_detail',
        'tanggal_pelaporan',
        'catatan',
        'riwayat_pajanan',
        'bukti_pajanan_path',
        'persetujuan_dokter',
        'perusahaan_lapor',
        'penetapan_pak',
        'kompensasi_bpjstk',
        'rehabilitasi_bpjskes',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'riwayat_pajanan' => 'boolean',
            'persetujuan_dokter' => 'boolean',
            'perusahaan_lapor' => 'boolean',
            'penetapan_pak' => 'boolean',
            'kompensasi_bpjstk' => 'boolean',
            'rehabilitasi_bpjskes' => 'boolean',
            'tanggal_pelaporan' => 'date',
        ];
    }

    // =========================================================================
    // Relationships
    // =========================================================================

    /**
     * Get the pekerja that owns this advocacy status.
     */
    public function pekerja(): BelongsTo
    {
        return $this->belongsTo(Pekerja::class);
    }

    // =========================================================================
    // Computed Attributes
    // =========================================================================

    /**
     * Calculate advocacy completion percentage.
     */
    public function getProgressPercentageAttribute(): int
    {
        $steps = [
            $this->riwayat_pajanan,
            $this->persetujuan_dokter,
            $this->perusahaan_lapor,
            $this->penetapan_pak,
            $this->kompensasi_bpjstk,
            $this->rehabilitasi_bpjskes,
        ];

        $completed = collect($steps)->filter()->count();

        return (int) round(($completed / count($steps)) * 100);
    }
}
