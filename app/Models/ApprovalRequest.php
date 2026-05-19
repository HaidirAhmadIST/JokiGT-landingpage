<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Schema;

class ApprovalRequest extends Model
{
    use HasFactory;

    protected $table = 'approval_requests';

    protected $fillable = [
        'requester_id',
        'action',
        'model_type',
        'model_id',
        'payload',
        'reason',
        'status',
        'responder_id',
        'rejection_reason',
    ];

    protected $casts = [
        'payload' => 'array',
    ];

    /**
     * Get the user who requested this approval.
     */
    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    /**
     * Get the superadmin who responded to this request.
     */
    public function responder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responder_id');
    }

    /**
     * Execute the pending action once approved.
     */
    public function executeAction(): bool
    {
        $fqcn = "App\\Models\\" . $this->model_type;
        if (!class_exists($fqcn)) {
            throw new \Exception("Model class {$fqcn} does not exist.");
        }

        if (strtoupper($this->action) === 'DELETE') {
            $instance = $fqcn::find($this->model_id);
            if ($instance) {
                return (bool) $instance->delete();
            }
            return false;
        }

        if (strtoupper($this->action) === 'UPDATE') {
            $instance = $fqcn::findOrFail($this->model_id);
            // If updating StatusAdvokasi, let's process through its service or update directly
            if ($this->model_type === 'StatusAdvokasi') {
                $service = app(\App\Services\AdvokasiService::class);
                // Call updateTracker with the workers ID and payload fields
                $service->updateTracker($instance->pekerja_id, $this->payload);
                return true;
            }

            // Normal model updates
            return $instance->update($this->payload);
        }

        if (strtoupper($this->action) === 'CREATE') {
            $fqcn::create($this->payload);
            return true;
        }

        return false;
    }
}
