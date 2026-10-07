<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('simple_lib_books')) {
            Schema::create('simple_lib_books', function (Blueprint $table) {
                $table->id();
                $table->string('title')->unique();
                $table->string('author')->nullable();
                $table->string('genre')->nullable();
                $table->float('rating')->default(1.0);
                $table->string('cover_url')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('simple_lib_authors')) {
            Schema::create('simple_lib_authors', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique();
                $table->string('nationality')->nullable();
                $table->float('rating')->default(1.0);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('simple_lib_books');
        Schema::dropIfExists('simple_lib_authors');
    }
};
