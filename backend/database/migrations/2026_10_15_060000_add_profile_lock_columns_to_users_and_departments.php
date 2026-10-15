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
        // 1. Add 30-day security lock columns to users table
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (!Schema::hasColumn('users', 'profile_last_modified_at')) {
                    $table->timestamp('profile_last_modified_at')->nullable()->after('updated_at');
                }
                if (!Schema::hasColumn('users', 'profile_locked_until')) {
                    $table->timestamp('profile_locked_until')->nullable()->after('profile_last_modified_at');
                }
            });
        }

        // 2. Add 30-day security lock columns to departments table (for HOD security management)
        if (Schema::hasTable('departments')) {
            Schema::table('departments', function (Blueprint $table) {
                if (!Schema::hasColumn('departments', 'profile_last_modified_at')) {
                    $table->timestamp('profile_last_modified_at')->nullable()->after('updated_at');
                }
                if (!Schema::hasColumn('departments', 'profile_locked_until')) {
                    $table->timestamp('profile_locked_until')->nullable()->after('profile_last_modified_at');
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
                if (Schema::hasColumn('users', 'profile_locked_until')) {
                    $table->dropColumn('profile_locked_until');
                }
                if (Schema::hasColumn('users', 'profile_last_modified_at')) {
                    $table->dropColumn('profile_last_modified_at');
                }
            });
        }

        if (Schema::hasTable('departments')) {
            Schema::table('departments', function (Blueprint $table) {
                if (Schema::hasColumn('departments', 'profile_locked_until')) {
                    $table->dropColumn('profile_locked_until');
                }
                if (Schema::hasColumn('departments', 'profile_last_modified_at')) {
                    $table->dropColumn('profile_last_modified_at');
                }
            });
        }
    }
};
