<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Pekerja extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The table associated with the model.
     */
    protected $table = 'pekerja';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'perusahaan_id',
        'nik',
        'nama_lengkap',
        'status_kesehatan',
        'catatan_admin',
        'tanggal_lahir',
        'jenis_kelamin',
        'whatsapp',
        'domisili',
        'pas_foto',
    ];

    // =========================================================================
    // Relations
    // =========================================================================

    /**
     * Get the user account for this pekerja.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the company this pekerja belongs to.
     */
    public function perusahaan(): BelongsTo
    {
        return $this->belongsTo(Perusahaan::class);
    }

    /**
     * Get all employment history records.
     */
    public function riwayatPekerja(): HasMany
    {
        return $this->hasMany(RiwayatPekerja::class);
    }

    /**
     * Get all medical detail records.
     */
    public function detailMedis(): HasMany
    {
        return $this->hasMany(DetailMedis::class);
    }

    /**
     * Get the advocacy status record.
     */
    public function statusAdvokasi(): HasOne
    {
        return $this->hasOne(StatusAdvokasi::class);
    }

    // =========================================================================
    // Scopes
    // =========================================================================

    /**
     * Scope to load all common relationships (prevents N+1).
     */
    public function scopeWithFullProfile($query)
    {
        return $query->with([
            'user',
            'perusahaan',
            'riwayatPekerja',
            'detailMedis',
            'statusAdvokasi',
        ]);
    }

    /**
     * Scope to load only essential relationships for list/summary views.
     */
    public function scopeWithSummary($query)
    {
        return $query->with([
            'user',
            'perusahaan',
            'statusAdvokasi',
        ]);
    }
}
