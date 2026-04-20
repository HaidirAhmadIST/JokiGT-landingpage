<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Make all core detail_medis columns properly nullable
     * so partial/incomplete records can be saved without errors.
     */
    public function up(): void
    {
        Schema::table('detail_medis', function (Blueprint $table) {
            $table->date('tgl_pemeriksaan')->nullable()->change();
            $table->string('tempat_pemeriksa')->nullable()->change();
            $table->string('jenis_pemeriksa')->nullable()->change();
            $table->string('dokter_pemeriksa')->nullable()->change();
            $table->text('hasil_diagnosis')->nullable()->change();
            $table->text('rekomendasi')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Cannot reliably revert nullability without knowing original constraints
    }
};
