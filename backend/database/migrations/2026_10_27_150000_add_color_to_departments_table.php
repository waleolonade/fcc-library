<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add color to departments table in default connection
        if (Schema::hasTable('departments')) {
            Schema::table('departments', function (Blueprint $table) {
                if (!Schema::hasColumn('departments', 'color')) {
                    $table->string('color', 50)->nullable()->default('blue')->after('established');
                }
            });
        }

        // 2. Ensure column exists in MySQL database if connected
        try {
            $pdo = \App\Services\DatabaseService::getPdo();
            if ($pdo) {
                try {
                    $pdo->exec("ALTER TABLE departments ADD COLUMN color VARCHAR(50) NULL AFTER established");
                } catch (\Throwable $e) {}
            }
        } catch (\Throwable $e) {}

        // 3. Assign distinct colors to existing departments
        $map = [
            'CSC' => 'blue',
            'CEM' => 'emerald',
            'BF'  => 'amber',
            'BNF' => 'amber',
            'BAM' => 'rose',
            'LIS' => 'indigo',
            'PA'  => 'teal',
            'PAD' => 'teal',
            'ACC' => 'sky',
            'AI'  => 'violet',
            'SWD' => 'cyan',
            'NCC' => 'fuchsia',
            'MC'  => 'sunset',
            'OTM' => 'yellow',
            'HMT' => 'orange',
            'AGT' => 'bronze',
            'AER' => 'lime',
            'AM'  => 'jade',
            'APT' => 'copper',
            'HRE' => 'magenta'
        ];

        foreach ($map as $code => $color) {
            DB::table('departments')->where('code', $code)->update(['color' => $color]);
            try {
                $pdo = \App\Services\DatabaseService::getPdo();
                if ($pdo) {
                    $stmt = $pdo->prepare("UPDATE departments SET color = :color WHERE code = :code");
                    $stmt->execute([':color' => $color, ':code' => $code]);
                }
            } catch (\Throwable $e) {}
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('departments') && Schema::hasColumn('departments', 'color')) {
            Schema::table('departments', function (Blueprint $table) {
                $table->dropColumn('color');
            });
        }
    }
};
