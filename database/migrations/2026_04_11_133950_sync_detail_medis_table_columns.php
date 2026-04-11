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
        Schema::table('detail_medis', function (Blueprint $table) {
            // Check and rename columns if they exist with old names
            if (Schema::hasColumn('detail_medis', 'tanggal_pemeriksaan')) {
                $table->renameColumn('tanggal_pemeriksaan', 'tgl_pemeriksaan');
            }
            if (Schema::hasColumn('detail_medis', 'tempat_pemeriksaan')) {
                $table->renameColumn('tempat_pemeriksaan', 'tempat_pemeriksa');
            }
            if (Schema::hasColumn('detail_medis', 'jenis_pemeriksaan')) {
                $table->renameColumn('jenis_pemeriksaan', 'jenis_pemeriksa');
            }
            if (Schema::hasColumn('detail_medis', 'nama_dokter')) {
                $table->renameColumn('nama_dokter', 'dokter_pemeriksa');
            }
            if (Schema::hasColumn('detail_medis', 'dokumen_rekomendasi_path')) {
                $table->renameColumn('dokumen_rekomendasi_path', 'rekomendasi');
            }
            if (Schema::hasColumn('detail_medis', 'dokumen_bukti_path')) {
                $table->renameColumn('dokumen_bukti_path', 'file_hasil_path');
            }
            
            // Add softDeletes if missing
            if (!Schema::hasColumn('detail_medis', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('detail_medis', function (Blueprint $table) {
            if (Schema::hasColumn('detail_medis', 'tgl_pemeriksaan')) {
                $table->renameColumn('tgl_pemeriksaan', 'tanggal_pemeriksaan');
            }
            if (Schema::hasColumn('detail_medis', 'tempat_pemeriksa')) {
                $table->renameColumn('tempat_pemeriksa', 'tempat_pemeriksaan');
            }
            if (Schema::hasColumn('detail_medis', 'jenis_pemeriksa')) {
                $table->renameColumn('jenis_pemeriksa', 'jenis_pemeriksaan');
            }
            if (Schema::hasColumn('detail_medis', 'dokter_pemeriksa')) {
                $table->renameColumn('dokter_pemeriksa', 'nama_dokter');
            }
            if (Schema::hasColumn('detail_medis', 'rekomendasi')) {
                $table->renameColumn('rekomendasi', 'dokumen_rekomendasi_path');
            }
            if (Schema::hasColumn('detail_medis', 'file_hasil_path')) {
                $table->renameColumn('file_hasil_path', 'dokumen_bukti_path');
            }
            
            if (Schema::hasColumn('detail_medis', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
        });
    }
};
