<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Multimedia Library Architecture (Avalon / Omeka S / IIIF Presentation 3.0 AV inspired)
     */
    public function up(): void
    {
        // 1. Media Resources (Audiobooks, Recorded Lectures, Educational Videos, Podcasts, Demos)
        if (!Schema::hasTable('media_resources')) {
            Schema::create('media_resources', function (Blueprint $table) {
                $table->string('id', 60)->primary(); // e.g. MED-AUD-001, MED-VID-001
                $table->string('title', 500);
                $table->string('subtitle', 500)->nullable();
                $table->string('media_type', 30); // audio, video, multimedia_package
                $table->string('resource_type', 60); // audiobook, lecture_recording, practical_demo, lab_tutorial, documentary, podcast, conference, language_lab
                $table->string('creator', 255); // Lecturer, Author, Presenter
                $table->string('creator_title', 200)->nullable(); // e.g. Chief Lecturer & HOD
                $table->string('department_id', 60)->nullable();
                $table->string('department_name', 200)->nullable();
                $table->string('course_code', 60)->nullable();
                $table->string('target_level', 50)->default('ND I'); // ND I, ND II, HND I, HND II, Post-Graduate, General
                $table->string('semester', 50)->default('First Semester');
                $table->integer('duration_seconds')->default(0);
                $table->string('duration_formatted', 50)->default('00:00');
                $table->text('description')->nullable();
                $table->text('subject_keywords')->nullable(); // JSON or comma separated
                $table->string('language', 60)->default('English');
                $table->string('publication_date', 50)->nullable();
                $table->string('publisher', 255)->default('Federal Co-operative College Press & Digital Media Center');
                $table->string('call_number', 100)->default('FCC.MED');
                $table->string('shelf_location', 150)->default('Digital Media Repository / Streaming');
                $table->string('access_level', 60)->default('open_access'); // open_access, student_matric_only, faculty_only, restricted
                $table->string('license_type', 150)->default('CC-BY-NC-SA 4.0 Institutional');
                $table->string('copyright_owner', 255)->default('Federal Co-operative College, Ibadan');
                $table->text('cover_image')->nullable(); // poster / thumbnail / album art
                $table->text('media_url')->nullable(); // Local relative path or direct stream URL
                $table->text('hls_manifest_url')->nullable(); // .m3u8 adaptive bitrate stream
                $table->boolean('download_allowed')->default(false);
                $table->text('download_url')->nullable();
                $table->string('mime_type', 100)->nullable();
                $table->string('file_size_formatted', 60)->nullable();
                $table->bigInteger('file_size_bytes')->default(0);
                $table->string('video_resolution', 40)->nullable(); // 1080p, 720p, 480p, etc.
                $table->string('audio_bitrate', 40)->nullable(); // 128kbps, 256kbps
                $table->string('companion_book_id', 60)->nullable(); // Foreign reference to books table
                $table->text('companion_pdf_url')->nullable(); // Accompanying lecture notes/slides
                $table->string('companion_pdf_title', 255)->nullable();
                $table->string('status', 40)->default('published'); // draft, review, published, archived
                $table->bigInteger('view_count')->default(0);
                $table->bigInteger('play_count')->default(0);
                $table->decimal('rating', 3, 1)->default(4.9);
                $table->string('uploaded_by', 255)->default('FCC Media Librarian');
                $table->text('technical_metadata')->nullable(); // JSON extracted by FFprobe/MediaInfo
                $table->timestamps();
            });
        }

        // 2. Media Chapters & Timestamps (Avalon & IIIF Presentation 3.0 AV canvas cue points)
        if (!Schema::hasTable('media_chapters')) {
            Schema::create('media_chapters', function (Blueprint $table) {
                $table->id();
                $table->string('media_resource_id', 60)->index();
                $table->integer('chapter_index')->default(1);
                $table->string('title', 300);
                $table->integer('start_seconds')->default(0);
                $table->integer('end_seconds')->nullable();
                $table->string('timestamp_formatted', 40)->default('00:00');
                $table->text('description')->nullable();
                $table->text('thumbnail_url')->nullable();
                $table->timestamps();

                $table->foreign('media_resource_id')->references('id')->on('media_resources')->onDelete('cascade');
            });
        }

        // 3. Media Transcripts & Subtitles (Accessibility, VTT, and semantic search)
        if (!Schema::hasTable('media_transcripts')) {
            Schema::create('media_transcripts', function (Blueprint $table) {
                $table->id();
                $table->string('media_resource_id', 60)->index();
                $table->string('language', 30)->default('en');
                $table->string('format', 30)->default('cues_json'); // vtt, srt, cues_json, text
                $table->longText('content')->nullable(); // Raw VTT/text
                $table->longText('timed_cues')->nullable(); // JSON: [{start: 0, end: 12, text: "..."}]
                $table->timestamps();

                $table->foreign('media_resource_id')->references('id')->on('media_resources')->onDelete('cascade');
            });
        }

        // 4. Student Playback Progress & Resume Point Tracker
        if (!Schema::hasTable('media_progress')) {
            Schema::create('media_progress', function (Blueprint $table) {
                $table->id();
                $table->string('user_identifier', 120)->index(); // student matric or user ID
                $table->string('media_resource_id', 60)->index();
                $table->integer('last_position_seconds')->default(0);
                $table->integer('total_duration_seconds')->default(0);
                $table->integer('completion_percentage')->default(0);
                $table->boolean('completed')->default(false);
                $table->timestamp('last_accessed_at')->nullable();
                $table->timestamps();

                $table->unique(['user_identifier', 'media_resource_id']);
                $table->foreign('media_resource_id')->references('id')->on('media_resources')->onDelete('cascade');
            });
        }

        // 5. Curated Multimedia Collections
        if (!Schema::hasTable('media_collections')) {
            Schema::create('media_collections', function (Blueprint $table) {
                $table->string('id', 60)->primary();
                $table->string('title', 300);
                $table->string('slug', 300)->unique();
                $table->text('description')->nullable();
                $table->string('department_id', 60)->nullable();
                $table->string('department_name', 200)->nullable();
                $table->text('banner_image')->nullable();
                $table->string('curator_name', 200)->default('Central Media Directorate');
                $table->boolean('featured')->default(false);
                $table->integer('sort_order')->default(0);
                $table->timestamps();
            });
        }

        // 6. Media Collection Items Pivot
        if (!Schema::hasTable('media_collection_items')) {
            Schema::create('media_collection_items', function (Blueprint $table) {
                $table->id();
                $table->string('collection_id', 60)->index();
                $table->string('media_resource_id', 60)->index();
                $table->integer('sort_order')->default(0);
                $table->timestamps();

                $table->foreign('collection_id')->references('id')->on('media_collections')->onDelete('cascade');
                $table->foreign('media_resource_id')->references('id')->on('media_resources')->onDelete('cascade');
                $table->unique(['collection_id', 'media_resource_id']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('media_collection_items');
        Schema::dropIfExists('media_collections');
        Schema::dropIfExists('media_progress');
        Schema::dropIfExists('media_transcripts');
        Schema::dropIfExists('media_chapters');
        Schema::dropIfExists('media_resources');
    }
};

