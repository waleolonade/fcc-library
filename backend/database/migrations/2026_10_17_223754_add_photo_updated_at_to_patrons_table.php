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
        if (!Schema::hasColumn('patrons', 'photo_updated_at')) {
            Schema::table('patrons', function (Blueprint $table) {
                $table->string('photo_updated_at', 50)->nullable()->after('photo_url');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('patrons', 'photo_updated_at')) {
            Schema::table('patrons', function (Blueprint $table) {
                $table->dropColumn('photo_updated_at');
            });
        }
    }
};
