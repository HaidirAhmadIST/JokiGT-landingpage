<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ActivityLog extends Model
{
    use HasFactory;

    protected $table = 'activity_logs';

    protected $fillable = [
        'user_id',
        'user_name',
        'action',
        'description',
        'loggable_type',
        'loggable_id',
        'metadata',
        'category',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    // =========================================================================
    // Relationships
    // =========================================================================

    /**
     * The admin user who performed this action.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Polymorphic relation – the affected record (Perusahaan, Pekerja, etc.)
     */
    public function loggable(): MorphTo
    {
        return $this->morphTo();
    }

    // =========================================================================
    // Helper: log a generic action
    // =========================================================================

    /**
     * Static helper to quickly record an activity.
     *
     * @param string $action      e.g. 'soft_delete', 'restore', 'create'
     * @param string $description e.g. 'Admin Budi soft deleted PT. Maju Jaya'
     * @param string $category    'sistem' | 'admin'
     * @param Model|null $loggable The eloquent model being acted upon
     * @param array $metadata     Extra JSON data
     * @param Model|null $user    The user model performing the action (optional)
     */
    public static function record(
        string $action,
        string $description,
        string $category = 'admin',
        ?Model $loggable = null,
        array $metadata = [],
        ?Model $user = null
    ): self {
        $user = $user ?? auth()->user();

        return self::create([
            'user_id'       => $user?->id,
            'user_name'     => $user?->nama ?? 'System',
            'action'        => $action,
            'description'   => $description,
            'category'      => $category,
            'loggable_type' => $loggable ? get_class($loggable) : null,
            'loggable_id'   => $loggable?->id,
            'metadata'      => $metadata,
        ]);
    }
}
