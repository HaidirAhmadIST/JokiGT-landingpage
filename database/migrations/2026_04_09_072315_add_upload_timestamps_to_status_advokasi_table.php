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
            $table->timestamp('bukti_pajanan_at')->nullable();
            $table->timestamp('bukti_persetujuan_dokter_at')->nullable();
            $table->timestamp('bukti_perusahaan_lapor_at')->nullable();
            $table->timestamp('bukti_penetapan_pak_at')->nullable();
            $table->timestamp('bukti_kompensasi_bpjstk_at')->nullable();
            $table->timestamp('bukti_rehabilitasi_bpjskes_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('status_advokasi', function (Blueprint $table) {
            $table->dropColumn([
                'bukti_pajanan_at',
                'bukti_persetujuan_dokter_at',
                'bukti_perusahaan_lapor_at',
                'bukti_penetapan_pak_at',
                'bukti_kompensasi_bpjstk_at',
                'bukti_rehabilitasi_bpjskes_at',
            ]);
        });
    }
};
