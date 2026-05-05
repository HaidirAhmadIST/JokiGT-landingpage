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
        'bukti_persetujuan_dokter_path',
        'perusahaan_lapor',
        'bukti_perusahaan_lapor_path',
        'penetapan_pak',
        'bukti_penetapan_pak_path',
        'kompensasi_bpjstk',
        'bukti_kompensasi_bpjstk_path',
        'rehabilitasi_bpjskes',
        'bukti_rehabilitasi_bpjskes_path',
        'bukti_pajanan_at',
        'bukti_persetujuan_dokter_at',
        'bukti_perusahaan_lapor_at',
        'bukti_penetapan_pak_at',
        'bukti_kompensasi_bpjstk_at',
        'bukti_rehabilitasi_bpjskes_at',
        'bukti_pajanan_name',
        'bukti_persetujuan_dokter_name',
        'bukti_perusahaan_lapor_name',
        'bukti_penetapan_pak_name',
        'bukti_kompensasi_bpjstk_name',
        'bukti_rehabilitasi_bpjskes_name',
        'is_admin_note',
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
            'is_admin_note' => 'boolean',
            'tanggal_pelaporan' => 'date',
            'bukti_pajanan_at' => 'datetime',
            'bukti_persetujuan_dokter_at' => 'datetime',
            'bukti_perusahaan_lapor_at' => 'datetime',
            'bukti_penetapan_pak_at' => 'datetime',
            'bukti_kompensasi_bpjstk_at' => 'datetime',
            'bukti_rehabilitasi_bpjskes_at' => 'datetime',
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
     * Ensure jenis_kasus is always uppercase.
     */
    public function setJenisKasusAttribute($value)
    {
        $this->attributes['jenis_kasus'] = $value ? strtoupper($value) : null;
    }

    public function getJenisKasusAttribute($value)
    {
        return $value ? strtoupper($value) : null;
    }

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
