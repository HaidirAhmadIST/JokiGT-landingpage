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
        Schema::create('pekerja', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('perusahaan_id')->constrained('perusahaan')->onDelete('cascade');
            $table->string('nik')->unique();
            $table->string('nama_lengkap');
            $table->string('status_kesehatan')->default('sehat');
            $table->text('catatan_admin')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexes for frequently queried columns
            $table->index('user_id');
            $table->index('perusahaan_id');
            $table->index('status_kesehatan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pekerja');
    }
};
