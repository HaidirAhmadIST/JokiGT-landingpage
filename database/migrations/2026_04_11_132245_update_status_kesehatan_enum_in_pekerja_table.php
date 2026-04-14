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
        // First, change the column to string to allow any values during update
        Schema::table('pekerja', function (Blueprint $table) {
            $table->string('status_kesehatan')->change();
        });

        // Map existing data to new values
        DB::statement("UPDATE pekerja SET status_kesehatan = 'fit' WHERE status_kesehatan = 'sehat'");
        DB::statement("UPDATE pekerja SET status_kesehatan = 'fit_with_note' WHERE status_kesehatan = 'sakit_ringan'");
        DB::statement("UPDATE pekerja SET status_kesehatan = 'unfit' WHERE status_kesehatan IN ('sakit_berat', 'dalam_perawatan')");

        // Then change the column definition to the new enum
        Schema::table('pekerja', function (Blueprint $table) {
            $table->enum('status_kesehatan', ['fit', 'fit_with_note', 'unfit'])->default('fit')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pekerja', function (Blueprint $table) {
            $table->string('status_kesehatan')->change();
        });
        
        DB::statement("UPDATE pekerja SET status_kesehatan = 'sehat' WHERE status_kesehatan = 'fit'");
        DB::statement("UPDATE pekerja SET status_kesehatan = 'sakit_ringan' WHERE status_kesehatan = 'fit_with_note'");
        DB::statement("UPDATE pekerja SET status_kesehatan = 'sakit_berat' WHERE status_kesehatan = 'unfit'");

        Schema::table('pekerja', function (Blueprint $table) {
            $table->enum('status_kesehatan', ['sehat', 'sakit_ringan', 'sakit_berat', 'dalam_perawatan'])->default('sehat')->change();
        });
    }
};
