<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('library_apis', function (Blueprint $table) {
            $table->string('id', 50)->primary();
            $table->string('name', 255);
            $table->string('provider', 255)->nullable();
            $table->string('category', 100)->default('Academic & Books');
            $table->text('endpoint_template');
            $table->string('auth_type', 50)->default('Free Open Access');
            $table->string('api_key', 255)->nullable();
            $table->text('headers')->nullable(); // JSON
            $table->string('response_type', 50)->default('json');
            $table->text('description')->nullable();
            $table->string('docs_url', 500)->nullable();
            $table->string('status', 50)->default('Active'); // Active, Inactive
            $table->boolean('is_preset')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('library_apis');
    }
};
