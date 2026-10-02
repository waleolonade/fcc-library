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
        Schema::create('google_books', function (Blueprint $table) {
            $table->id();
            $table->string('volume_id', 100)->unique()->index();
            $table->string('title');
            $table->string('subtitle')->nullable();
            $table->json('authors')->nullable();
            $table->string('publisher')->nullable();
            $table->string('published_date', 50)->nullable();
            $table->longText('description')->nullable();
            $table->string('isbn_10', 20)->nullable()->index();
            $table->string('isbn_13', 20)->nullable()->index();
            $table->integer('page_count')->nullable();
            $table->json('categories')->nullable();
            $table->text('thumbnail_url')->nullable();
            $table->text('preview_link')->nullable();
            $table->text('info_link')->nullable();
            $table->text('canonical_volume_link')->nullable();
            $table->string('viewability', 50)->default('PARTIAL'); // NO_PAGES, PARTIAL, ALL_PAGES, FULL
            $table->boolean('embeddable')->default(true);
            $table->boolean('is_ebook')->default(false);
            $table->boolean('epub_available')->default(false);
            $table->boolean('pdf_available')->default(false);
            $table->text('web_reader_link')->nullable();
            $table->boolean('is_recommended')->default(false)->index();
            $table->string('recommendation_category', 100)->nullable();
            $table->text('recommendation_notes')->nullable();
            $table->string('saved_by', 100)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('google_books');
    }
};
