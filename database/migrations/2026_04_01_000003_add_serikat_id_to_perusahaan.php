<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('perusahaan', function (Blueprint $table) {
            $table->foreignId('serikat_id')
                ->nullable()
                ->constrained('serikat')
                ->onDelete('set null');
            $table->index('serikat_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('perusahaan', function (Blueprint $table) {
            $table->dropForeign(['serikat_id']);
            $table->dropColumn('serikat_id');
        });
    }
};
?>
