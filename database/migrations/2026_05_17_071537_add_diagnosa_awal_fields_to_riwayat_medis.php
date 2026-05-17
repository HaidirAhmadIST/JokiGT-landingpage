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
        Schema::table('riwayat_medis', function (Blueprint $table) {
            $table->text('keluhan_utama')->nullable()->after('pekerja_id');
            $table->text('diagnosa_dokter')->nullable()->after('keluhan_utama');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('riwayat_medis', function (Blueprint $table) {
            $table->dropColumn(['keluhan_utama', 'diagnosa_dokter']);
        });
    }
};
