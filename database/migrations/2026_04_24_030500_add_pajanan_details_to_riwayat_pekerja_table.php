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
            $table->string('jenis_pajanan')->nullable()->after('informal_data');
            $table->integer('durasi_pajanan')->nullable()->after('jenis_pajanan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('riwayat_pekerja', function (Blueprint $table) {
            $table->dropColumn(['jenis_pajanan', 'durasi_pajanan']);
        });
    }
};
