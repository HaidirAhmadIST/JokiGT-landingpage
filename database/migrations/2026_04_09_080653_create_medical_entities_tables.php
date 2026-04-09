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
        // Drop existing detail_medis
        Schema::dropIfExists('detail_medis');

        // Tabel 1: riwayat_medis (Baseline Data - One-to-One)
        Schema::create('riwayat_medis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pekerja_id')->unique()->constrained('pekerja')->onDelete('cascade');
            
            $table->enum('golongan_darah', ['A', 'B', 'AB', 'O'])->nullable();
            $table->enum('rhesus', ['+', '-'])->nullable();
            
            $table->json('riwayat_penyakit')->nullable();
            $table->json('alergi')->nullable();
            $table->json('riwayat_operasi')->nullable();
            
            $table->text('obat_rutin')->nullable();
            $table->timestamps();
        });

        // Tabel 2: detail_medis (Transactional Data - One-to-Many)
        Schema::create('detail_medis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pekerja_id')->constrained('pekerja')->onDelete('cascade');
            
            $table->date('tanggal_pemeriksaan');
            $table->string('tempat_pemeriksaan');
            
            $table->enum('jenis_pemeriksaan', [
                'Rawat Jalan', 
                'Rawat Inap', 
                'MCU', 
                'IGD', 
                'Lainnya'
            ]);
            
            $table->string('nama_dokter');
            $table->text('hasil_diagnosis');
            
            $table->string('dokumen_rekomendasi_path')->nullable();
            $table->string('dokumen_bukti_path')->nullable();
            
            $table->timestamps();
            
            $table->index('tanggal_pemeriksaan');
            $table->index('pekerja_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('detail_medis');
        Schema::dropIfExists('riwayat_medis');
        
        // Optionally recreate the old detail_medis here if needed, 
        // but for simplicity we'll just drop them in down()
    }
};
