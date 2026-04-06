<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Creates the activity_logs table for audit trail tracking.
     */
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();

            // Who performed the action
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('user_name')->nullable(); // Denormalized for display even if user deleted

            // What was done
            $table->string('action'); // e.g. 'soft_delete', 'restore', 'create', 'update'
            $table->string('description'); // Human-readable: "Admin Budi soft deleted PT. Maju Jaya"

            // Which record was affected
            $table->string('loggable_type')->nullable(); // Polymorphic: 'App\Models\Perusahaan'
            $table->unsignedBigInteger('loggable_id')->nullable(); // The record's ID

            // Extra metadata (JSON)
            $table->json('metadata')->nullable(); // { "nama_perusahaan": "PT. Maju Jaya" }

            // Category for tab filtering
            $table->enum('category', ['sistem', 'admin'])->default('admin');

            $table->timestamps();

            $table->index(['loggable_type', 'loggable_id']);
            $table->index('category');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
