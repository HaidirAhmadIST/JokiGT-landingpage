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
            $table->json('informal_data')->nullable()->after('tanggal_selesai_kontrak');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('riwayat_pekerja', function (Blueprint $table) {
            $table->dropColumn('informal_data');
        });
    }
};
