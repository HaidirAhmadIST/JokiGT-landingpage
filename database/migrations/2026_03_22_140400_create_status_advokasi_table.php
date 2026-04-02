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
        Schema::create('status_advokasi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pekerja_id')->constrained('pekerja')->onDelete('cascade');
            $table->boolean('riwayat_pajanan')->default(false);
            $table->string('bukti_pajanan_path')->nullable(); // Stored in private disk
            $table->boolean('persetujuan_dokter')->default(false);
            $table->boolean('perusahaan_lapor')->default(false);
            $table->boolean('penetapan_pak')->default(false);
            $table->boolean('kompensasi_bpjstk')->default(false);
            $table->boolean('rehabilitasi_bpjskes')->default(false);
            $table->timestamps();

            $table->index('pekerja_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('status_advokasi');
    }
};
