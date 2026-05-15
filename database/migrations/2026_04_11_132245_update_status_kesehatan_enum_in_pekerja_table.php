<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Map existing data to new values
        DB::statement("UPDATE pekerja SET status_kesehatan = 'fit' WHERE status_kesehatan = 'sehat'");
        DB::statement("UPDATE pekerja SET status_kesehatan = 'fit_with_note' WHERE status_kesehatan = 'sakit_ringan'");
        DB::statement("UPDATE pekerja SET status_kesehatan = 'unfit' WHERE status_kesehatan IN ('sakit_berat', 'dalam_perawatan')");

        // Change column to simple string with default (compatible with both MySQL & PostgreSQL)
        Schema::table('pekerja', function (Blueprint $table) {
            $table->string('status_kesehatan', 50)->default('fit')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("UPDATE pekerja SET status_kesehatan = 'sehat' WHERE status_kesehatan = 'fit'");
        DB::statement("UPDATE pekerja SET status_kesehatan = 'sakit_ringan' WHERE status_kesehatan = 'fit_with_note'");
        DB::statement("UPDATE pekerja SET status_kesehatan = 'sakit_berat' WHERE status_kesehatan = 'unfit'");

        Schema::table('pekerja', function (Blueprint $table) {
            $table->string('status_kesehatan', 50)->default('sehat')->change();
        });
    }
};
