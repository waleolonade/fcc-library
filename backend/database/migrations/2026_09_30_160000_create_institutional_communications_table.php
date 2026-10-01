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
        Schema::create('institutional_communications', function (Blueprint $table) {
            $table->id();
            $table->string('msg_id', 50)->unique();
            $table->string('thread_id', 50)->index();
            $table->string('sender_id', 100);
            $table->string('sender_name', 200);
            $table->string('sender_role', 50); // student, hod, admin
            $table->string('sender_dept', 150)->nullable();
            
            $table->string('recipient_id', 100); // admin, hod, specific_user, all
            $table->string('recipient_name', 200);
            $table->string('recipient_role', 50); // student, hod, admin, all
            $table->string('recipient_dept', 150)->nullable();

            $table->string('category', 80)->default('general_inquiry'); 
            // general_inquiry, acquisition_request, thesis_review, course_reserve, fine_appeal, clearance_request, official_bulletin
            $table->string('subject', 255);
            $table->text('message');
            $table->string('priority', 30)->default('normal'); // normal, high, urgent
            $table->string('status', 30)->default('unread'); // unread, read, in_progress, resolved

            $table->string('action_type', 80)->nullable();
            $table->json('action_data')->nullable();
            
            $table->timestamps();

            $table->index(['sender_role', 'recipient_role']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('institutional_communications');
    }
};
