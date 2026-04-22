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
     * Get the baseline medical history.
     */
    public function riwayatMedis(): HasOne
    {
        return $this->hasOne(RiwayatMedis::class);
    }

    /**
     * Get all medical detail records.
     */
    public function detailMedis(): HasMany
    {
        return $this->hasMany(DetailMedis::class);
    }

    /**
     * Get the latest medical detail record.
     */
    public function latestDetailMedis(): HasOne
    {
        return $this->hasOne(DetailMedis::class)->latestOfMany('tgl_pemeriksaan');
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
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = ['status_saran'];

    /**
     * Get suggested health status based on medical records and advocacy progress.
     */
    public function getStatusSaranAttribute(): string
    {
        // Use the loaded relationship if available to avoid N+1
        $medis = $this->relationLoaded('latestDetailMedis') 
            ? $this->latestDetailMedis 
            : $this->latestDetailMedis()->first();

        $adv = $this->relationLoaded('statusAdvokasi') ? $this->statusAdvokasi : $this->statusAdvokasi()->first();

        // Logic check for "Tidak Sehat" — PAK sudah ditetapkan
        if ($adv && $adv->penetapan_pak) {
            return 'tidak_sehat';
        }
        
        if ($medis) {
            $diagnosis = strtolower($medis->hasil_diagnosis ?? '');
            // Tidak Sehat: diagnosis berat atau positif PAK
            if (str_contains($diagnosis, 'berat') || str_contains($diagnosis, 'positif pak')) {
                return 'tidak_sehat';
            }
            // Sehat dengan Catatan: suspek atau gejala ringan
            if (str_contains($diagnosis, 'suspek') || str_contains($diagnosis, 'ringan') || str_contains($diagnosis, 'silikosis')) {
                return 'sehat_dengan_catatan';
            }
            // Jika ada rekam medis tapi tidak ada indikasi, kembalikan status_kesehatan aktual
            return $this->status_kesehatan ?? 'sehat';
        }

        return 'sehat';
    }

    /**
     * Scope to load all common relationships (prevents N+1).
     */
    public function scopeWithFullProfile($query)
    {
        return $query->with([
            'user',
            'perusahaan',
            'riwayatPekerja.detailMedis', // Load detail_medis nested per riwayat pekerjaan
            'detailMedis',                // Juga load semua detail_medis (termasuk yang NULL riwayat_pekerja_id)
            'riwayatMedis',
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
            'latestDetailMedis', // Efficiently load only the latest medical record
        ]);
    }
}
