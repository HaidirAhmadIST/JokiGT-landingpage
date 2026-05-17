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
        Schema::table('riwayat_pekerja', function (Blueprint $table) {
            $table->string('alamat_perusahaan')->nullable()->after('nama_perusahaan');
            $table->string('alamat_agen_penyalur')->nullable()->after('nama_agen_penyalur');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('riwayat_pekerja', function (Blueprint $table) {
            $table->dropColumn(['alamat_perusahaan', 'alamat_agen_penyalur']);
        });
    }
};
