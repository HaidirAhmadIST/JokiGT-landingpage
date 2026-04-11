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
            $table->string('golongan_darah')->nullable()->after('hasil_diagnosis');
            $table->string('rhesus')->nullable()->after('golongan_darah');
            $table->text('riwayat_penyakit')->nullable()->after('rhesus');
            $table->text('alergi')->nullable()->after('riwayat_penyakit');
            $table->text('riwayat_operasi')->nullable()->after('alergi');
            $table->text('obat_rutin')->nullable()->after('riwayat_operasi');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('detail_medis', function (Blueprint $table) {
            $table->dropColumn([
                'golongan_darah', 
                'rhesus', 
                'riwayat_penyakit', 
                'alergi', 
                'riwayat_operasi', 
                'obat_rutin'
            ]);
        });
    }
};
