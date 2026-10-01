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
        // 1. Departments Table
        Schema::create('departments', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('hod_name')->nullable();
            $table->string('hod_email')->nullable();
            $table->string('hod_pin')->default('1234');
            $table->integer('student_count')->default(0);
            $table->integer('faculty_count')->default(0);
            $table->timestamps();
        });

        // 2. Department Uploads (HOD Staging Pipeline)
        Schema::create('department_uploads', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('title');
            $table->string('author');
            $table->string('department_id');
            $table->string('department_name');
            $table->string('uploaded_by_hod_id')->nullable();
            $table->string('hod_name')->nullable();
            $table->string('course_code')->nullable();
            $table->string('target_level')->default('HND II');
            $table->string('semester')->default('First Semester');
            $table->string('resource_type')->default('Lecture Handout'); // Lecture Handout, Past Questions, Capstone, Physical Book Request
            $table->string('file_name')->nullable();
            $table->longText('file_data_url')->nullable();
            $table->string('access_scope')->default('Restricted to Department Students Only'); // Restricted, Public Institution-Wide
            $table->string('status')->default('pending'); // pending, approved, rejected
            $table->text('review_notes')->nullable();
            $table->string('reviewed_by')->nullable();
            $table->string('assigned_call_number')->nullable();
            $table->string('assigned_shelf')->nullable();
            $table->string('book_id')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('department_uploads');
        Schema::dropIfExists('departments');
    }
};
