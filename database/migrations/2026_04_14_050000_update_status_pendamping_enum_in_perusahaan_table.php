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
        // 1. Change to string first so it can accept any value
        Schema::table('perusahaan', function (Blueprint $table) {
            $table->string('status_pendamping')->change();
        });

        // 2. Update existing data to match new labels
        DB::table('perusahaan')->where('status_pendamping', 'aktif')->update(['status_pendamping' => 'Berkasus']);
        DB::table('perusahaan')->where('status_pendamping', 'pending')->update(['status_pendamping' => 'Dalam Pantauan']);
        DB::table('perusahaan')->where('status_pendamping', 'tidak_aktif')->update(['status_pendamping' => 'Selesai']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Revert data
        DB::table('perusahaan')->where('status_pendamping', 'Berkasus')->update(['status_pendamping' => 'aktif']);
        DB::table('perusahaan')->where('status_pendamping', 'Dalam Pantauan')->update(['status_pendamping' => 'pending']);
        DB::table('perusahaan')->where('status_pendamping', 'Selesai')->update(['status_pendamping' => 'tidak_aktif']);

        // 2. Revert to string with default
        Schema::table('perusahaan', function (Blueprint $table) {
            $table->string('status_pendamping', 50)->default('pending')->change();
        });
    }
};
