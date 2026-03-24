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
            $table->date('tanggal_lahir')->nullable();
            $table->enum('jenis_kelamin', ['L', 'P'])->nullable();
            $table->string('whatsapp')->nullable();
            $table->text('domisili')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pekerja', function (Blueprint $table) {
            $table->dropColumn(['tanggal_lahir', 'jenis_kelamin', 'whatsapp', 'domisili']);
        });
    }
};
