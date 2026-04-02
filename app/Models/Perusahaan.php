<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Perusahaan extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'perusahaan';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'nama_perusahaan',
        'sektor_industri',
        'status_pendamping',
        'alamat',
        'nama_pic',
        'kontak_pic',
    ];

    // =========================================================================
    // Relationships
    // =========================================================================

    /**
     * Get all pekerja registered under this company.
     */
    public function pekerja(): HasMany
    {
        return $this->hasMany(Pekerja::class);
    }

    // =========================================================================
    // Scopes
    // =========================================================================

    /**
     * Scope to filter by active companion status.
     */
    public function scopeAktif($query)
    {
        return $query->where('status_pendamping', 'aktif');
    }
}
