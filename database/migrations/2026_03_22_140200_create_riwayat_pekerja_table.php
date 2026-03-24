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
        Schema::create('riwayat_pekerja', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pekerja_id')->constrained('pekerja')->onDelete('cascade');
            $table->string('nama_perusahaan');
            $table->string('deskripsi_usaha')->nullable();
            $table->string('bagian')->nullable();
            $table->text('deskripsi_pekerjaan')->nullable();
            $table->date('tgl_masuk')->nullable();
            $table->date('tgl_keluar')->nullable();
            $table->timestamps();

            $table->index('pekerja_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('riwayat_pekerja');
    }
};
