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
        // First convert any existing "Selesai" to "Dalam Pantauan" just in case
        DB::table('perusahaan')->where('status_pendamping', 'Selesai')->update(['status_pendamping' => 'Dalam Pantauan']);
        DB::table('perusahaan')->where('status_pendamping', 'aktif')->update(['status_pendamping' => 'Berkasus']);
        
        DB::statement('ALTER TABLE perusahaan DROP CONSTRAINT IF EXISTS perusahaan_status_pendamping_check');
        DB::statement("ALTER TABLE perusahaan ADD CONSTRAINT perusahaan_status_pendamping_check CHECK (status_pendamping IN ('Berkasus', 'Dalam Pantauan'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE perusahaan DROP CONSTRAINT IF EXISTS perusahaan_status_pendamping_check');
        DB::statement("ALTER TABLE perusahaan ADD CONSTRAINT perusahaan_status_pendamping_check CHECK (status_pendamping IN ('Berkasus', 'Dalam Pantauan', 'Selesai'))");
    }
};
