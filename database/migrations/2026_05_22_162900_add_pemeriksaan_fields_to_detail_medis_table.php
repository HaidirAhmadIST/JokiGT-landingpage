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
            if (!Schema::hasColumn('detail_medis', 'tipe_lokasi')) {
                $table->string('tipe_lokasi')->nullable()->after('tempat_pemeriksa');
            }
            if (!Schema::hasColumn('detail_medis', 'penanggung_jawab')) {
                $table->string('penanggung_jawab')->nullable()->after('tipe_lokasi');
            }
            if (!Schema::hasColumn('detail_medis', 'alamat_pemeriksaan')) {
                $table->text('alamat_pemeriksaan')->nullable()->after('penanggung_jawab');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('detail_medis', function (Blueprint $table) {
            $table->dropColumn(['tipe_lokasi', 'penanggung_jawab', 'alamat_pemeriksaan']);
        });
    }
};
