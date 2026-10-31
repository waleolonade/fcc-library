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
        // 1. Add avatar to users table
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (!Schema::hasColumn('users', 'avatar')) {
                    $table->longText('avatar')->nullable()->after('designation');
                }
            });
        }

        // 2. Add hod_photo to departments table
        if (Schema::hasTable('departments')) {
            Schema::table('departments', function (Blueprint $table) {
                if (!Schema::hasColumn('departments', 'hod_photo')) {
                    $table->longText('hod_photo')->nullable()->after('hod_phone');
                }
            });
        }

        // 3. Ensure columns in MySQL database as well if connected
        try {
            $pdo = \App\Services\DatabaseService::getPdo();
            if ($pdo) {
                try {
                    $pdo->exec("ALTER TABLE users ADD COLUMN avatar LONGTEXT NULL AFTER designation");
                } catch (\Throwable $e) {}
                try {
                    $pdo->exec("ALTER TABLE departments ADD COLUMN hod_photo LONGTEXT NULL AFTER hod_phone");
                } catch (\Throwable $e) {}
            }
        } catch (\Throwable $e) {}
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (Schema::hasColumn('users', 'avatar')) {
                    $table->dropColumn('avatar');
                }
            });
        }

        if (Schema::hasTable('departments')) {
            Schema::table('departments', function (Blueprint $table) {
                if (Schema::hasColumn('departments', 'hod_photo')) {
                    $table->dropColumn('hod_photo');
                }
            });
        }
    }
};
