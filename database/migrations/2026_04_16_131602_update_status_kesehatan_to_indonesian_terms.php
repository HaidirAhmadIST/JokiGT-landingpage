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
        // Update pekerja table
        Schema::table('pekerja', function (Blueprint $table) {
            $table->string('status_kesehatan')->change();
        });
        
        DB::statement("UPDATE pekerja SET status_kesehatan = 'sehat' WHERE status_kesehatan = 'fit'");
        DB::statement("UPDATE pekerja SET status_kesehatan = 'sehat_dengan_catatan' WHERE status_kesehatan = 'fit_with_note'");
        DB::statement("UPDATE pekerja SET status_kesehatan = 'tidak_sehat' WHERE status_kesehatan = 'unfit'");
        
        Schema::table('pekerja', function (Blueprint $table) {
            $table->enum('status_kesehatan', ['sehat', 'sehat_dengan_catatan', 'tidak_sehat'])->default('sehat')->change();
        });

        // Update detail_medis table
        Schema::table('detail_medis', function (Blueprint $table) {
            $table->string('status_kesehatan')->change();
        });

        DB::statement("UPDATE detail_medis SET status_kesehatan = 'sehat' WHERE status_kesehatan = 'fit'");
        DB::statement("UPDATE detail_medis SET status_kesehatan = 'sehat_dengan_catatan' WHERE status_kesehatan = 'fit_with_note'");
        DB::statement("UPDATE detail_medis SET status_kesehatan = 'tidak_sehat' WHERE status_kesehatan = 'unfit'");

        Schema::table('detail_medis', function (Blueprint $table) {
            $table->enum('status_kesehatan', ['sehat', 'sehat_dengan_catatan', 'tidak_sehat'])->default('sehat')->change();
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
        
        DB::statement("UPDATE pekerja SET status_kesehatan = 'fit' WHERE status_kesehatan = 'sehat'");
        DB::statement("UPDATE pekerja SET status_kesehatan = 'fit_with_note' WHERE status_kesehatan = 'sehat_dengan_catatan'");
        DB::statement("UPDATE pekerja SET status_kesehatan = 'unfit' WHERE status_kesehatan = 'tidak_sehat'");
        
        Schema::table('pekerja', function (Blueprint $table) {
            $table->enum('status_kesehatan', ['fit', 'fit_with_note', 'unfit'])->default('fit')->change();
        });

        Schema::table('detail_medis', function (Blueprint $table) {
            $table->string('status_kesehatan')->change();
        });

        DB::statement("UPDATE detail_medis SET status_kesehatan = 'fit' WHERE status_kesehatan = 'sehat'");
        DB::statement("UPDATE detail_medis SET status_kesehatan = 'fit_with_note' WHERE status_kesehatan = 'sehat_dengan_catatan'");
        DB::statement("UPDATE detail_medis SET status_kesehatan = 'unfit' WHERE status_kesehatan = 'tidak_sehat'");

        Schema::table('detail_medis', function (Blueprint $table) {
            $table->enum('status_kesehatan', ['fit', 'fit_with_note', 'unfit'])->default('fit')->change();
        });
    }
};
