<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Drop the old check constraints on detail_medis that restrict
     * jenis_pemeriksa and status_kesehatan to enum-like values.
     */
    public function up(): void
    {
        // Drop the old enum-like check constraint on jenis_pemeriksa
        DB::statement('ALTER TABLE detail_medis DROP CONSTRAINT IF EXISTS detail_medis_jenis_pemeriksaan_check');

        // Drop the old enum-like check constraint on status_kesehatan
        DB::statement('ALTER TABLE detail_medis DROP CONSTRAINT IF EXISTS detail_medis_status_kesehatan_check');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE detail_medis ADD CONSTRAINT detail_medis_jenis_pemeriksaan_check CHECK (jenis_pemeriksa::text = ANY (ARRAY['Rawat Jalan'::text, 'Rawat Inap'::text, 'MCU'::text, 'IGD'::text, 'Lainnya'::text]))");
        DB::statement("ALTER TABLE detail_medis ADD CONSTRAINT detail_medis_status_kesehatan_check CHECK (status_kesehatan::text = ANY (ARRAY['sehat'::text, 'sehat_dengan_catatan'::text, 'tidak_sehat'::text]))");
    }
};
