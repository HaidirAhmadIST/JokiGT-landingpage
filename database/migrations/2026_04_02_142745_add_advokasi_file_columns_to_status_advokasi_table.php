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
        Schema::table('status_advokasi', function (Blueprint $table) {
            $table->string('bukti_persetujuan_dokter_path')->nullable();
            $table->string('bukti_perusahaan_lapor_path')->nullable();
            $table->string('bukti_penetapan_pak_path')->nullable();
            $table->string('bukti_kompensasi_bpjstk_path')->nullable();
            $table->string('bukti_rehabilitasi_bpjskes_path')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('status_advokasi', function (Blueprint $table) {
            $table->dropColumn([
                'bukti_persetujuan_dokter_path',
                'bukti_perusahaan_lapor_path',
                'bukti_penetapan_pak_path',
                'bukti_kompensasi_bpjstk_path',
                'bukti_rehabilitasi_bpjskes_path',
            ]);
        });
    }
};
