<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add columns to users table
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'username')) {
                $table->string('username')->nullable()->index();
            }
            if (!Schema::hasColumn('users', 'role')) {
                $table->string('role')->default('admin');
            }
            if (!Schema::hasColumn('users', 'plain_secret')) {
                $table->string('plain_secret')->nullable();
            }
            if (!Schema::hasColumn('users', 'phone')) {
                $table->string('phone')->nullable();
            }
            if (!Schema::hasColumn('users', 'designation')) {
                $table->string('designation')->nullable();
            }
        });

        // 2. Ensure official admin user exists with hashed password & plain_secret
        $adminEmail = 'admin@fccibadanlibrary.com.ng';
        $hashed = Hash::make('admin123');

        DB::table('users')->updateOrInsert(
            ['email' => $adminEmail],
            [
                'name' => 'Alhaji Balogun O. (College Chief Librarian)',
                'username' => 'chief_librarian',
                'password' => $hashed,
                'plain_secret' => 'admin123',
                'role' => 'admin',
                'designation' => 'College Librarian & Director of Library Services',
                'phone' => '+2348033334455',
                'updated_at' => now(),
                'created_at' => now()
            ]
        );

        // Also ensure librarian@fccibadanlibrary.com.ng exists
        DB::table('users')->updateOrInsert(
            ['email' => 'librarian@fccibadanlibrary.com.ng'],
            [
                'name' => 'Mrs. Adegoke S. (Deputy College Librarian)',
                'username' => 'deputy_librarian',
                'password' => Hash::make('admin123'),
                'plain_secret' => 'admin123',
                'role' => 'librarian',
                'designation' => 'Deputy Director of Library Services',
                'phone' => '+2348022223344',
                'updated_at' => now(),
                'created_at' => now()
            ]
        );

        // 3. Create custom_admin_pages table
        if (!Schema::hasTable('custom_admin_pages')) {
            Schema::create('custom_admin_pages', function (Blueprint $table) {
                $table->string('id', 50)->primary();
                $table->string('title');
                $table->string('slug')->unique();
                $table->string('icon')->default('Layers');
                $table->text('description')->nullable();
                $table->string('allowed_roles')->default('admin,librarian');
                $table->text('features')->nullable();
                $table->string('created_by')->default('Lead Systems Developer');
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });

            // Seed initial custom admin pages
            DB::table('custom_admin_pages')->insert([
                [
                    'id' => 'PAGE-ARCHIVE-01',
                    'title' => 'Special Archives & Rare Cooperative Manuscripts',
                    'slug' => 'archive-vault',
                    'icon' => 'Archive',
                    'description' => 'Dedicated portal for preservation of 19th-century Western Nigerian cooperative union charters.',
                    'allowed_roles' => 'admin,librarian',
                    'features' => json_encode(['digital_scan' => true, 'watermark' => true, 'high_res_zoom' => true]),
                    'created_by' => 'Lead Systems Developer',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now()
                ],
                [
                    'id' => 'PAGE-SERIALS-02',
                    'title' => 'Serials & Periodic Subscriptions Desk',
                    'slug' => 'serials-desk',
                    'icon' => 'Newspaper',
                    'description' => 'Tracking national newspapers, academic gazettes, and quarterly journal issues.',
                    'allowed_roles' => 'admin,librarian',
                    'features' => json_encode(['binding_tracking' => true, 'vendor_invoices' => true]),
                    'created_by' => 'Lead Systems Developer',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now()
                ]
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('custom_admin_pages');
    }
};
