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
            $table->string('status_pekerjaan')->after('pekerja_id')->nullable();
            $table->string('jabatan')->after('bagian')->nullable();
            $table->string('nama_agen_penyalur')->nullable();
            $table->date('tanggal_selesai_kontrak')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('riwayat_pekerja', function (Blueprint $table) {
            $table->dropColumn(['status_pekerjaan', 'jabatan', 'nama_agen_penyalur', 'tanggal_selesai_kontrak']);
        });
    }
};
