<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations for Reservations, Reviews and Authors.
     */
    public function up(): void
    {
        // 1. Reservations Table
        if (!Schema::hasTable('reservations')) {
            Schema::create('reservations', function (Blueprint $table) {
                $table->id();
                $table->string('user_identifier')->nullable()->index(); // matric or user_id
                $table->string('user_name')->nullable();
                $table->string('book_id', 50)->index();
                $table->string('book_title')->nullable();
                $table->date('reserved_from');
                $table->date('reserved_to');
                $table->string('status')->default('Pending'); // Pending, Confirmed, Fulfilled, Cancelled
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        // 2. Reviews Table
        if (!Schema::hasTable('reviews')) {
            Schema::create('reviews', function (Blueprint $table) {
                $table->id();
                $table->string('user_identifier')->index(); // matric or user_id
                $table->string('user_name')->nullable();
                $table->string('book_id', 50)->index();
                $table->text('comment');
                $table->integer('rating')->default(5); // 1 to 5
                $table->boolean('is_verified')->default(true);
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reviews');
        Schema::dropIfExists('reservations');
    }
};
