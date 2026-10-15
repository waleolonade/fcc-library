<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds disk-based file_path and cover_path columns to department_uploads
     * and clears the bloated base64 file_data_url and cover_image blobs
     * that caused the SQLite "database or disk is full" error.
     */
    public function up(): void
    {
        // 1. Add new disk-path columns if they don't exist
        Schema::table('department_uploads', function (Blueprint $table) {
            if (!Schema::hasColumn('department_uploads', 'file_path')) {
                $table->string('file_path')->nullable()->after('file_data_url')
                    ->comment('Relative path to uploaded file in storage/app/public/uploads/');
            }
            if (!Schema::hasColumn('department_uploads', 'cover_path')) {
                $table->string('cover_path')->nullable()->after('cover_image')
                    ->comment('Relative path to cover image in storage/app/public/covers/');
            }
            if (!Schema::hasColumn('department_uploads', 'cover_image')) {
                $table->text('cover_image')->nullable();
            }
            if (!Schema::hasColumn('department_uploads', 'abstract')) {
                $table->text('abstract')->nullable();
            }
        });

        // 2. Clear the giant base64 blobs from existing rows to shrink the DB
        //    We keep metadata (title, author, status etc.) intact; only clear binary blobs.
        DB::statement("UPDATE department_uploads SET file_data_url = NULL WHERE file_data_url IS NOT NULL AND length(file_data_url) > 1000");
        DB::statement("UPDATE department_uploads SET cover_image = NULL WHERE cover_image IS NOT NULL AND length(cover_image) > 1000");

        // 3. VACUUM to reclaim freed disk space in the SQLite file (skip on MySQL/MariaDB)
        if (DB::getDriverName() === 'sqlite') {
            DB::statement('VACUUM');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('department_uploads', function (Blueprint $table) {
            $table->dropColumn(['file_path', 'cover_path']);
        });
    }
};
