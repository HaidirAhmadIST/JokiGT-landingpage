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
        Schema::table('pekerja', function (Blueprint $table) {
            $table->string('kecamatan')->nullable()->after('domisili');
            $table->string('kabupaten_pekerja')->nullable()->after('domisili');
            $table->string('provinsi_pekerja')->nullable()->after('domisili');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pekerja', function (Blueprint $table) {
            $table->dropColumn(['kecamatan', 'kabupaten_pekerja', 'provinsi_pekerja']);
        });
    }
};
