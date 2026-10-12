<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('course_reserves')) {
            Schema::create('course_reserves', function (Blueprint $table) {
                $table->id();
                $table->string('department_code', 50)->index();
                $table->string('department_name', 255)->nullable();
                $table->string('title', 255);
                $table->string('author', 255)->nullable();
                $table->string('reserved_for', 50)->nullable(); // e.g. CEM 411
                $table->string('shelf', 100)->default('Reserve Desk Bay 1');
                $table->string('duration', 100)->default('2 Hours In-Library Reading Only');
                $table->integer('copies')->default(3);
                $table->string('status', 50)->default('active');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('course_reserves');
    }
};
