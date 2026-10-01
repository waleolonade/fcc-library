<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations for Enterprise Normalized OPAC relational architecture.
     */
    public function up(): void
    {
        // 1. Roles Table
        if (!Schema::hasTable('roles')) {
            Schema::create('roles', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique(); // admin, chief_librarian, cataloguer, circulation_clerk, hod, student, guest
                $table->string('display_name');
                $table->text('description')->nullable();
                $table->timestamps();
            });
        }

        // 2. Permissions Table (Granular permissions per Prompt 47)
        if (!Schema::hasTable('permissions')) {
            Schema::create('permissions', function (Blueprint $table) {
                $table->id();
                $table->string('slug')->unique(); // e.g. catalogue.create, loans.renew
                $table->string('name');
                $table->string('module'); // catalogue, users, loans, reservations, fines, reports, settings
                $table->text('description')->nullable();
                $table->timestamps();
            });
        }

        // 3. Role Permissions Pivot
        if (!Schema::hasTable('role_permissions')) {
            Schema::create('role_permissions', function (Blueprint $table) {
                $table->foreignId('role_id')->constrained('roles')->onDelete('cascade');
                $table->foreignId('permission_id')->constrained('permissions')->onDelete('cascade');
                $table->primary(['role_id', 'permission_id']);
            });
        }

        // 4. User Roles Pivot
        if (!Schema::hasTable('user_roles')) {
            Schema::create('user_roles', function (Blueprint $table) {
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->foreignId('role_id')->constrained('roles')->onDelete('cascade');
                $table->primary(['user_id', 'role_id']);
            });
        }

        // 5. Authors Table
        if (!Schema::hasTable('authors')) {
            Schema::create('authors', function (Blueprint $table) {
                $table->id();
                $table->string('name')->index();
                $table->string('orcid')->nullable();
                $table->string('affiliation')->nullable();
                $table->string('nationality')->nullable();
                $table->text('biography')->nullable();
                $table->timestamps();
            });
        }

        // 6. Publishers Table
        if (!Schema::hasTable('publishers')) {
            Schema::create('publishers', function (Blueprint $table) {
                $table->id();
                $table->string('name')->index();
                $table->string('country')->nullable();
                $table->string('city')->nullable();
                $table->string('website')->nullable();
                $table->string('contact_email')->nullable();
                $table->timestamps();
            });
        }

        // 7. Subjects Table
        if (!Schema::hasTable('subjects')) {
            Schema::create('subjects', function (Blueprint $table) {
                $table->id();
                $table->string('code')->nullable()->index(); // LCC/DDC Classification code
                $table->string('name')->index();
                $table->string('classification_system')->default('Library of Congress');
                $table->foreignId('parent_id')->nullable()->constrained('subjects')->onDelete('set null');
                $table->timestamps();
            });
        }

        // 8. Categories Table
        if (!Schema::hasTable('categories')) {
            Schema::create('categories', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique();
                $table->string('slug')->unique();
                $table->text('description')->nullable();
                $table->timestamps();
            });
        }

        // 9. Resource Authors Pivot
        if (!Schema::hasTable('resource_authors')) {
            Schema::create('resource_authors', function (Blueprint $table) {
                $table->string('book_id', 50)->index();
                $table->foreignId('author_id')->constrained('authors')->onDelete('cascade');
                $table->string('role')->default('Primary Author'); // Primary Author, Co-Author, Editor, Translator
                $table->integer('order_index')->default(1);
                $table->primary(['book_id', 'author_id']);
            });
        }

        // 10. Resource Subjects Pivot
        if (!Schema::hasTable('resource_subjects')) {
            Schema::create('resource_subjects', function (Blueprint $table) {
                $table->string('book_id', 50)->index();
                $table->foreignId('subject_id')->constrained('subjects')->onDelete('cascade');
                $table->primary(['book_id', 'subject_id']);
            });
        }

        // 11. Locations Table
        if (!Schema::hasTable('locations')) {
            Schema::create('locations', function (Blueprint $table) {
                $table->id();
                $table->string('branch_id')->nullable()->index();
                $table->string('building');
                $table->string('floor');
                $table->string('room')->nullable();
                $table->string('area_name');
                $table->timestamps();
            });
        }

        // 12. Shelves Table
        if (!Schema::hasTable('shelves')) {
            Schema::create('shelves', function (Blueprint $table) {
                $table->string('id', 50)->primary(); // e.g. SHELF-FL2-A4
                $table->string('branch_id')->nullable()->index();
                $table->string('shelf_code')->index();
                $table->integer('floor')->default(1);
                $table->string('aisle')->nullable();
                $table->string('call_number_start')->nullable();
                $table->string('call_number_end')->nullable();
                $table->string('qr_code')->nullable();
                $table->integer('capacity')->default(100);
                $table->integer('current_count')->default(0);
                $table->string('status')->default('Active');
                $table->timestamps();
            });
        }

        // 13. Copies Table (Physical items tracking with unique barcodes)
        if (!Schema::hasTable('copies')) {
            Schema::create('copies', function (Blueprint $table) {
                $table->string('id', 50)->primary(); // e.g. FCC-B001-C1
                $table->string('book_id', 50)->index();
                $table->string('branch_id')->default('Main Library')->index();
                $table->string('shelf_id')->nullable()->index();
                $table->integer('copy_number')->default(1);
                $table->string('barcode', 100)->unique();
                $table->string('rfid_tag', 100)->nullable()->unique();
                $table->string('accession_number', 100)->nullable()->unique();
                $table->string('status')->default('Available'); // Available, Checked Out, In Transit, On Hold, Lost, In Repair
                $table->string('condition')->default('Good'); // New, Good, Fair, Damaged
                $table->decimal('acquisition_cost', 10, 2)->default(0.00);
                $table->date('acquisition_date')->nullable();
                $table->softDeletes();
                $table->timestamps();
            });
        }

        // 14. Barcodes Registry
        if (!Schema::hasTable('barcodes')) {
            Schema::create('barcodes', function (Blueprint $table) {
                $table->id();
                $table->string('barcode_value', 100)->unique()->index();
                $table->string('barcode_type', 50)->default('Code 128'); // Code 128, EAN-13, QR
                $table->string('entity_type', 50); // copy, patron, shelf, accession, digital
                $table->string('entity_id', 100)->index();
                $table->boolean('is_active')->default(true);
                $table->integer('print_count')->default(0);
                $table->timestamp('last_scanned_at')->nullable();
                $table->timestamps();
            });
        }

        // 15. Fines Table
        if (!Schema::hasTable('fines')) {
            Schema::create('fines', function (Blueprint $table) {
                $table->id();
                $table->string('loan_id')->nullable()->index();
                $table->string('patron_matric')->index();
                $table->decimal('amount', 10, 2)->default(0.00);
                $table->decimal('balance_remaining', 10, 2)->default(0.00);
                $table->string('reason'); // Overdue loan, Lost book, Damaged spine
                $table->string('status')->default('Unpaid'); // Unpaid, Paid, Waived, Partial
                $table->string('waived_by')->nullable();
                $table->timestamp('waived_at')->nullable();
                $table->timestamps();
            });
        }

        // 16. Payments Table
        if (!Schema::hasTable('payments')) {
            Schema::create('payments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('fine_id')->nullable()->constrained('fines')->onDelete('set null');
                $table->string('patron_matric')->index();
                $table->decimal('amount_paid', 10, 2);
                $table->string('payment_method')->default('Card'); // Cash, Remita, Paystack, Bank Transfer, POS
                $table->string('transaction_reference')->unique();
                $table->string('received_by')->nullable();
                $table->timestamps();
            });
        }

        // 17. Favorites Table
        if (!Schema::hasTable('favorites')) {
            Schema::create('favorites', function (Blueprint $table) {
                $table->id();
                $table->string('user_identifier')->index(); // matric or user_id
                $table->string('book_id', 50)->index();
                $table->timestamp('created_at')->useCurrent();
                $table->unique(['user_identifier', 'book_id']);
            });
        }

        // 18. Reading List Items Table
        if (!Schema::hasTable('reading_list_items')) {
            Schema::create('reading_list_items', function (Blueprint $table) {
                $table->id();
                $table->string('reading_list_id')->index();
                $table->string('book_id', 50)->index();
                $table->integer('priority')->default(1);
                $table->text('notes')->nullable();
                $table->timestamp('created_at')->useCurrent();
            });
        }

        // 19. Digital Resources Table
        if (!Schema::hasTable('digital_resources')) {
            Schema::create('digital_resources', function (Blueprint $table) {
                $table->id();
                $table->string('book_id', 50)->index();
                $table->string('file_path');
                $table->string('file_size')->nullable();
                $table->string('mime_type')->default('application/pdf');
                $table->string('access_rights')->default('Campus Community');
                $table->integer('download_count')->default(0);
                $table->integer('view_count')->default(0);
                $table->timestamps();
            });
        }

        // 20. Configurable Library Settings Table (Prompt 49)
        if (!Schema::hasTable('library_settings')) {
            Schema::create('library_settings', function (Blueprint $table) {
                $table->id();
                $table->string('setting_key')->unique();
                $table->text('setting_value')->nullable();
                $table->string('setting_group')->default('general'); // general, circulation, opac, security, classification
                $table->string('value_type')->default('string'); // string, integer, boolean, json, decimal
                $table->boolean('is_public')->default(true);
                $table->string('description')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('library_settings');
        Schema::dropIfExists('digital_resources');
        Schema::dropIfExists('reading_list_items');
        Schema::dropIfExists('favorites');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('fines');
        Schema::dropIfExists('barcodes');
        Schema::dropIfExists('copies');
        Schema::dropIfExists('shelves');
        Schema::dropIfExists('locations');
        Schema::dropIfExists('resource_subjects');
        Schema::dropIfExists('resource_authors');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('subjects');
        Schema::dropIfExists('publishers');
        Schema::dropIfExists('authors');
        Schema::dropIfExists('user_roles');
        Schema::dropIfExists('role_permissions');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('roles');
    }
};
