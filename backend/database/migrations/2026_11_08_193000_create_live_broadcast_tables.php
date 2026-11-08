<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Live Broadcast Sessions
        if (!Schema::hasTable('live_broadcasts')) {
            Schema::create('live_broadcasts', function (Blueprint $table) {
                $table->string('id', 80)->primary(); // e.g. LIVE-CEM-20261108-XYZ
                $table->string('title', 500);
                $table->string('department_code', 30)->default('CEM');
                $table->string('department_name', 200)->default('Co-operative Economics & Management');
                $table->string('course_code', 60)->nullable();
                $table->string('course_title', 255)->nullable();
                $table->string('lecturer_name', 255);
                $table->string('lecturer_role', 50)->default('hod'); // hod, staff, developer
                $table->string('status', 40)->default('live'); // live, ended, paused
                $table->boolean('is_live')->default(true);
                $table->string('stream_mode', 40)->default('system_camera'); // system_camera, external_cam, screen_share, pip_mixed
                $table->string('resolution', 40)->default('1080p Full HD');
                $table->integer('viewers_count')->default(1);
                $table->text('simulcast_destinations')->nullable(); // JSON: [{platform: 'youtube', connected: true, rtmp: '...'}]
                $table->text('announcement')->nullable();
                $table->string('companion_pdf_url', 500)->nullable();
                $table->string('recording_media_id', 80)->nullable(); // Links to media_resources after broadcast
                $table->timestamp('started_at')->useCurrent();
                $table->timestamp('ended_at')->nullable();
                $table->timestamps();
            });
        }

        // 2. Real-time Student & Lecturer Live Chat / Q&A Messages
        if (!Schema::hasTable('live_broadcast_chats')) {
            Schema::create('live_broadcast_chats', function (Blueprint $table) {
                $table->id();
                $table->string('broadcast_id', 80)->index();
                $table->string('user_name', 255);
                $table->string('user_role', 50)->default('student'); // student, hod, staff, developer
                $table->string('user_matric', 100)->nullable();
                $table->text('message');
                $table->boolean('is_question')->default(false);
                $table->boolean('hand_raised')->default(false);
                $table->timestamps();
            });
        }

        // 3. Social Media Simulcast Dest Ingest Profiles
        if (!Schema::hasTable('live_social_destinations')) {
            Schema::create('live_social_destinations', function (Blueprint $table) {
                $table->id();
                $table->string('department_code', 30)->default('GLOBAL');
                $table->string('platform', 50); // youtube, facebook, linkedin, twitter, twitch, custom_rtmp
                $table->string('platform_name', 100);
                $table->text('server_url')->nullable();
                $table->text('stream_key')->nullable();
                $table->boolean('enabled')->default(false);
                $table->string('status', 40)->default('configured');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('live_social_destinations');
        Schema::dropIfExists('live_broadcast_chats');
        Schema::dropIfExists('live_broadcasts');
    }
};
