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
        Schema::create('detail_medis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pekerja_id')->constrained('pekerja')->onDelete('cascade');
            $table->date('tgl_pemeriksaan')->nullable();
            $table->string('tempat_pemeriksa')->nullable();
            $table->string('jenis_pemeriksa')->nullable();
            $table->string('dokter_pemeriksa')->nullable();
            $table->text('hasil_diagnosis')->nullable();
            $table->text('rekomendasi')->nullable();
            $table->string('file_hasil_path')->nullable(); // Stored in private disk
            $table->timestamps();
            $table->softDeletes();

            $table->index('pekerja_id');
            $table->index('tgl_pemeriksaan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('detail_medis');
    }
};
