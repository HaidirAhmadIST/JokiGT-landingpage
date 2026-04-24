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
            if (!Schema::hasColumn('status_advokasi', 'bukti_pajanan_name')) {
                $table->string('bukti_pajanan_name')->nullable();
            }
            if (!Schema::hasColumn('status_advokasi', 'bukti_persetujuan_dokter_name')) {
                $table->string('bukti_persetujuan_dokter_name')->nullable();
            }
            if (!Schema::hasColumn('status_advokasi', 'bukti_perusahaan_lapor_name')) {
                $table->string('bukti_perusahaan_lapor_name')->nullable();
            }
            if (!Schema::hasColumn('status_advokasi', 'bukti_penetapan_pak_name')) {
                $table->string('bukti_penetapan_pak_name')->nullable();
            }
            if (!Schema::hasColumn('status_advokasi', 'bukti_kompensasi_bpjstk_name')) {
                $table->string('bukti_kompensasi_bpjstk_name')->nullable();
            }
            if (!Schema::hasColumn('status_advokasi', 'bukti_rehabilitasi_bpjskes_name')) {
                $table->string('bukti_rehabilitasi_bpjskes_name')->nullable();
            }
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
