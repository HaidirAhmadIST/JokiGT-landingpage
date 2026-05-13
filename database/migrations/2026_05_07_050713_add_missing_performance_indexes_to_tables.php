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
            $table->index('created_at', 'idx_pekerja_created_at');
        });

        Schema::table('perusahaan', function (Blueprint $table) {
            $table->index('created_at', 'idx_perusahaan_created_at');
        });

        Schema::table('status_advokasi', function (Blueprint $table) {
            $table->index('jenis_kasus', 'idx_advokasi_jenis_kasus');
        });

        Schema::table('activity_logs', function (Blueprint $table) {
            $table->index('category', 'idx_logs_category');
            $table->index('action', 'idx_logs_action');
            $table->index('created_at', 'idx_logs_created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pekerja', function (Blueprint $table) {
            $table->dropIndex('idx_pekerja_created_at');
        });

        Schema::table('perusahaan', function (Blueprint $table) {
            $table->dropIndex('idx_perusahaan_created_at');
        });

        Schema::table('status_advokasi', function (Blueprint $table) {
            $table->dropIndex('idx_advokasi_jenis_kasus');
        });

        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropIndex('idx_logs_category');
            $table->dropIndex('idx_logs_action');
            $table->dropIndex('idx_logs_created_at');
        });
    }
};
