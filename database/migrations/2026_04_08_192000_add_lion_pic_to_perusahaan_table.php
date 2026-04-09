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
        Schema::table('perusahaan', function (Blueprint $col) {
            $col->string('nama_pic_lion', 255)->nullable()->after('kontak_pic');
            $col->string('nara_hubung_lion', 255)->nullable()->after('nama_pic_lion');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('perusahaan', function (Blueprint $col) {
            $col->dropColumn(['nama_pic_lion', 'nara_hubung_lion']);
        });
    }
};
