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
            $table->string('bukti_pajanan_name')->nullable();
            $table->string('bukti_persetujuan_dokter_name')->nullable();
            $table->string('bukti_perusahaan_lapor_name')->nullable();
            $table->string('bukti_penetapan_pak_name')->nullable();
            $table->string('bukti_kompensasi_bpjstk_name')->nullable();
            $table->string('bukti_rehabilitasi_bpjskes_name')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('status_advokasi', function (Blueprint $table) {
            $table->dropColumn([
                'bukti_pajanan_name',
                'bukti_persetujuan_dokter_name',
                'bukti_perusahaan_lapor_name',
                'bukti_penetapan_pak_name',
                'bukti_kompensasi_bpjstk_name',
                'bukti_rehabilitasi_bpjskes_name',
            ]);
        });
    }
};
