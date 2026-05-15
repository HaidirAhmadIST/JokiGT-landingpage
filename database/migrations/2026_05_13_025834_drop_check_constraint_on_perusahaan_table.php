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
        // Drop the check constraint if it exists (PostgreSQL specific name based on the error message)
        if (config('database.default') === 'pgsql') {
            DB::statement('ALTER TABLE perusahaan DROP CONSTRAINT IF EXISTS perusahaan_status_pendamping_check');
            DB::statement('ALTER TABLE pekerja DROP CONSTRAINT IF EXISTS pekerja_status_kesehatan_check');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Re-adding the check constraint would require knowing the exact original definition, 
        // which might be problematic. Given the goal is to move to a flexible string column, 
        // we can leave it dropped in down() or re-add a basic one if needed.
    }
};
