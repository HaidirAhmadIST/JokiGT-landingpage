<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'serikat')) {
                $table->string('serikat')->nullable()->after('role');
            }
        });

        Schema::table('perusahaan', function (Blueprint $table) {
            if (!Schema::hasColumn('perusahaan', 'serikat')) {
                $table->string('serikat')->nullable()->after('sektor_industri');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('serikat');
        });
        Schema::table('perusahaan', function (Blueprint $table) {
            $table->dropColumn('serikat');
        });
    }
};
