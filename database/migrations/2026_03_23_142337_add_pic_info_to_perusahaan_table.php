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
        Schema::table('perusahaan', function (Blueprint $table) {
            $table->text('alamat')->nullable();
            $table->string('nama_pic')->nullable();
            $table->string('kontak_pic')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('perusahaan', function (Blueprint $table) {
            $table->dropColumn(['alamat', 'nama_pic', 'kontak_pic']);
        });
    }
};
