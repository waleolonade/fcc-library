<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('live_broadcast_signals')) {
            Schema::create('live_broadcast_signals', function (Blueprint $table) {
                $table->id();
                $table->string('broadcast_id', 80)->index();
                $table->string('sender_id', 120)->index(); // student matric/token or 'host'
                $table->string('recipient_id', 120)->index(); // 'host' or student matric/token
                $table->string('signal_type', 50); // 'join', 'offer', 'answer', 'ice_candidate', 'leave'
                $table->longText('payload'); // SDP or ICE candidate JSON
                $table->boolean('consumed')->default(false)->index();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('live_broadcast_signals');
    }
};

