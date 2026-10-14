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
        // 1. Table for saving and curating OpenAlex scholarly works in institutional database
        Schema::create('openalex_works', function (Blueprint $table) {
            $table->string('id', 50)->primary(); // e.g. W2741809807
            $table->string('openalex_id', 255)->index(); // e.g. https://openalex.org/W2741809807
            $table->string('doi', 255)->nullable()->index();
            $table->text('title');
            $table->text('display_name')->nullable();
            $table->integer('publication_year')->nullable()->index();
            $table->string('publication_date', 50)->nullable();
            $table->string('type', 50)->nullable()->index(); // article, book, dissertation, etc.
            $table->string('type_crossref', 50)->nullable();
            $table->json('authors')->nullable();
            $table->string('primary_source', 255)->nullable(); // Journal/Source name
            $table->string('host_venue', 255)->nullable();
            $table->string('publisher', 255)->nullable();
            $table->longText('abstract')->nullable();
            $table->boolean('is_oa')->default(false)->index();
            $table->string('oa_status', 50)->nullable(); // gold, green, bronze, hybrid, closed
            $table->text('oa_url')->nullable();
            $table->text('pdf_url')->nullable();
            $table->integer('cited_by_count')->default(0)->index();
            $table->json('topics')->nullable();
            $table->json('concepts')->nullable();
            $table->string('language', 10)->nullable();
            $table->json('biblio')->nullable();
            $table->text('openalex_url')->nullable();
            $table->string('saved_by', 100)->nullable()->index();
            $table->text('notes')->nullable();
            $table->boolean('is_saved')->default(true)->index();
            $table->longText('cached_raw')->nullable();
            $table->timestamps();
        });

        // 2. High-performance cache table for OpenAlex API responses
        Schema::create('openalex_queries_cache', function (Blueprint $table) {
            $table->string('query_hash', 64)->primary();
            $table->string('endpoint', 50)->index(); // works, authors, sources, institutions, topics
            $table->json('request_params')->nullable();
            $table->json('response_meta')->nullable();
            $table->longText('response_results')->nullable();
            $table->json('response_group_by')->nullable();
            $table->integer('hits_count')->default(0);
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('openalex_works');
        Schema::dropIfExists('openalex_queries_cache');
    }
};
