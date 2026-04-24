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
            $table->string('foto')->nullable()->after('role');
            $table->string('phone')->nullable()->after('foto');
            $table->string('jabatan')->nullable()->after('phone');
            $table->string('lokasi')->nullable()->after('jabatan');
            $table->text('bio')->nullable()->after('lokasi');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['foto', 'phone', 'jabatan', 'lokasi', 'bio']);
        });
    }
};
