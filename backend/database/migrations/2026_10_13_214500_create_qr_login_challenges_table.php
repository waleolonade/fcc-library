<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('qr_login_challenges')) {
            Schema::create('qr_login_challenges', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->string('expected_user_id');
                $table->string('scan_token_hash');
                $table->string('poll_token_hash');
                $table->string('status')->default('waiting');
                $table->bigInteger('expires_at');
                $table->bigInteger('created_at');
                $table->string('phone_user_id')->nullable();
                $table->string('otp_hash')->nullable();
                $table->bigInteger('otp_expires_at')->nullable();
                $table->integer('otp_attempts')->default(0);
                $table->bigInteger('approved_at')->nullable();
                $table->bigInteger('consumed_at')->nullable();

                $table->index('expires_at');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('qr_login_challenges');
    }
};
