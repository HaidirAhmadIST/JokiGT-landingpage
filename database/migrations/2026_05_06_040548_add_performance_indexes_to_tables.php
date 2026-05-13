<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: add_performance_indexes_to_tables
 *
 * Menambahkan index database pada kolom-kolom yang sering digunakan
 * untuk pencarian, filter, dan pengurutan. Index ini akan mempercepat
 * query secara signifikan terutama saat jumlah data sudah besar (ribuan baris).
 *
 * Kolom yang di-index:
 * - pekerja.nama_lengkap  → digunakan di pencarian nama dan alphabet filter
 * - pekerja.nik           → digunakan di pencarian NIK dan pendaftaran
 * - pekerja.status_kesehatan → digunakan di filter status kesehatan
 * - status_advokasi.created_at → digunakan di kalkulasi statistik bulanan
 * - status_advokasi.rehabilitasi_bpjskes → digunakan di filter kasus selesai
 * - status_advokasi.kompensasi_bpjstk → digunakan di filter klaim disetujui
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── Tabel: pekerja ────────────────────────────────────────────────────
        Schema::table('pekerja', function (Blueprint $table) {
            // Index untuk pencarian teks nama (LIKE query dari search bar)
            if (!$this->indexExists('pekerja', 'idx_pekerja_nama')) {
                $table->index('nama_lengkap', 'idx_pekerja_nama');
            }

            // Index untuk pencarian NIK (digunakan di login, pendaftaran, pencarian)
            if (!$this->indexExists('pekerja', 'idx_pekerja_nik')) {
                $table->index('nik', 'idx_pekerja_nik');
            }

            // Index untuk filter status kesehatan di dashboard
            if (!$this->indexExists('pekerja', 'idx_pekerja_status_kesehatan')) {
                $table->index('status_kesehatan', 'idx_pekerja_status_kesehatan');
            }
        });

        // ── Tabel: status_advokasi ────────────────────────────────────────────
        Schema::table('status_advokasi', function (Blueprint $table) {
            // Index untuk kalkulasi statistik bulanan (WHERE created_at >= ?)
            if (!$this->indexExists('status_advokasi', 'idx_advokasi_created_at')) {
                $table->index('created_at', 'idx_advokasi_created_at');
            }

            // Index untuk filter kasus selesai (WHERE rehabilitasi_bpjskes = true)
            if (!$this->indexExists('status_advokasi', 'idx_advokasi_rehabilitasi')) {
                $table->index('rehabilitasi_bpjskes', 'idx_advokasi_rehabilitasi');
            }

            // Index untuk filter klaim disetujui (WHERE kompensasi_bpjstk = true)
            if (!$this->indexExists('status_advokasi', 'idx_advokasi_kompensasi')) {
                $table->index('kompensasi_bpjstk', 'idx_advokasi_kompensasi');
            }
        });
    }

    public function down(): void
    {
        Schema::table('pekerja', function (Blueprint $table) {
            $table->dropIndex('idx_pekerja_nama');
            $table->dropIndex('idx_pekerja_nik');
            $table->dropIndex('idx_pekerja_status_kesehatan');
        });

        Schema::table('status_advokasi', function (Blueprint $table) {
            $table->dropIndex('idx_advokasi_created_at');
            $table->dropIndex('idx_advokasi_rehabilitasi');
            $table->dropIndex('idx_advokasi_kompensasi');
        });
    }

    /**
     * Mengecek apakah index sudah ada untuk menghindari error duplikat.
     */
    private function indexExists(string $table, string $indexName): bool
    {
        return collect(\Illuminate\Support\Facades\DB::select(
            "SELECT indexname FROM pg_indexes WHERE tablename = ? AND indexname = ?",
            [$table, $indexName]
        ))->isNotEmpty();
    }
};
