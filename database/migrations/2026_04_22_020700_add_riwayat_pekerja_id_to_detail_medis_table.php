<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Tambah kolom riwayat_pekerja_id (nullable agar data lama tidak rusak)
        Schema::table('detail_medis', function (Blueprint $table) {
            $table->unsignedBigInteger('riwayat_pekerja_id')->nullable()->after('pekerja_id');
            $table->foreign('riwayat_pekerja_id')
                  ->references('id')
                  ->on('riwayat_pekerja')
                  ->onDelete('set null');
            $table->index('riwayat_pekerja_id');
        });

        // 2. Auto-migrasi data lama: cocokkan detail_medis ke riwayat_pekerja
        //    berdasarkan pekerja_id yang sama dan rentang tanggal kerja.
        $medisRecords = DB::table('detail_medis')
            ->whereNull('deleted_at')
            ->whereNull('riwayat_pekerja_id')
            ->whereNotNull('tgl_pemeriksaan')
            ->get(['id', 'pekerja_id', 'tgl_pemeriksaan']);

        foreach ($medisRecords as $medis) {
            // Cari riwayat_pekerja yang periodenya mencakup tanggal pemeriksaan
            $riwayat = DB::table('riwayat_pekerja')
                ->where('pekerja_id', $medis->pekerja_id)
                ->where('tgl_masuk', '<=', $medis->tgl_pemeriksaan)
                ->where(function ($q) use ($medis) {
                    $q->whereNull('tgl_keluar')
                      ->orWhere('tgl_keluar', '>=', $medis->tgl_pemeriksaan);
                })
                ->orderBy('tgl_masuk', 'desc') // Ambil yang paling dekat jika ada tumpang tindih
                ->first(['id']);

            if ($riwayat) {
                DB::table('detail_medis')
                    ->where('id', $medis->id)
                    ->update(['riwayat_pekerja_id' => $riwayat->id]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('detail_medis', function (Blueprint $table) {
            $table->dropForeign(['riwayat_pekerja_id']);
            $table->dropIndex(['riwayat_pekerja_id']);
            $table->dropColumn('riwayat_pekerja_id');
        });
    }
};
