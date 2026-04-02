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
            $table->string('jenis_kasus')->nullable()->after('pekerja_id');
            $table->string('tahap')->nullable()->after('jenis_kasus');
            $table->string('status_detail')->nullable()->after('tahap');
            $table->date('tanggal_pelaporan')->nullable()->after('status_detail');
            $table->text('catatan')->nullable()->after('tanggal_pelaporan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('status_advokasi', function (Blueprint $table) {
            $table->dropColumn(['jenis_kasus', 'tahap', 'status_detail', 'tanggal_pelaporan', 'catatan']);
        });
    }
};
