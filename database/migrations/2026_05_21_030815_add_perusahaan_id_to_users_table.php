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
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('perusahaan_id')->nullable()->after('role');
            
            // Opsional: Foreign key jika mau lebih strict di database level
            // $table->foreign('perusahaan_id')->references('id')->on('perusahaan')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('perusahaan_id');
        });
    }
};
