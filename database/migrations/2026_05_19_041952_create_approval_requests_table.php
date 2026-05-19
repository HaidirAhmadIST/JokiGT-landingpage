<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('approval_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('requester_id')->constrained('users')->onDelete('cascade');
            $table->string('action'); // 'CREATE', 'UPDATE', 'DELETE'
            $table->string('model_type'); // 'Pekerja', 'StatusAdvokasi', 'DetailMedis', etc.
            $table->unsignedBigInteger('model_id')->nullable();
            $table->json('payload')->nullable(); // holds update/create fields
            $table->text('reason'); // requester's explanation
            $table->string('status')->default('PENDING'); // 'PENDING', 'APPROVED', 'REJECTED'
            $table->foreignId('responder_id')->nullable()->constrained('users')->onDelete('set null');
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approval_requests');
    }
};
