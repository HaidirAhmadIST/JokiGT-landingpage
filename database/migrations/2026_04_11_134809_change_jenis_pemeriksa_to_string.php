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
        Schema::table('detail_medis', function (Blueprint $table) {
            // Change enum to string to avoid "Data truncated" error if value is not in enum
            $table->string('jenis_pemeriksa')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('detail_medis', function (Blueprint $table) {
            $table->enum('jenis_pemeriksa', ['Rawat Jalan', 'Rawat Inap', 'MCU', 'IGD', 'Lainnya'])->change();
        });
    }
};
