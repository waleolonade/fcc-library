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
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (!Schema::hasColumn('users', 'matric')) {
                    $table->string('matric', 100)->nullable()->after('username');
                }
                if (!Schema::hasColumn('users', 'barcode')) {
                    $table->string('barcode', 100)->nullable()->after('matric');
                }
                if (!Schema::hasColumn('users', 'department')) {
                    $table->string('department', 150)->nullable()->after('designation');
                }
                if (!Schema::hasColumn('users', 'level')) {
                    $table->string('level', 50)->nullable()->after('department');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                $columns = [];
                if (Schema::hasColumn('users', 'level')) $columns[] = 'level';
                if (Schema::hasColumn('users', 'department')) $columns[] = 'department';
                if (Schema::hasColumn('users', 'barcode')) $columns[] = 'barcode';
                if (Schema::hasColumn('users', 'matric')) $columns[] = 'matric';
                if (!empty($columns)) {
                    $table->dropColumn($columns);
                }
            });
        }
    }
};
