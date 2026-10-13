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
        if (!Schema::hasColumn('patrons', 'barcode')) {
            Schema::table('patrons', function (Blueprint $table) {
                $table->string('barcode', 100)->nullable()->unique()->after('library_id');
            });
        }

        // Backfill barcodes for all existing patrons without one
        $patrons = DB::table('patrons')->get();
        foreach ($patrons as $index => $patron) {
            if (empty($patron->barcode)) {
                $matric = $patron->matric ?? '';
                $digits = preg_replace('/[^0-9]/', '', $matric);
                if (!empty($digits)) {
                    $suffix = str_pad(substr($digits, -5), 5, '0', STR_PAD_LEFT);
                } else {
                    $suffix = sprintf('%05d', $index + 101);
                }
                $barcode = "FCC-STU-{$suffix}";

                // Ensure uniqueness
                $counter = 1;
                $uniqueBarcode = $barcode;
                while (DB::table('patrons')->where('barcode', $uniqueBarcode)->where('id', '!=', $patron->id)->exists()) {
                    $uniqueBarcode = "{$barcode}-{$counter}";
                    $counter++;
                }

                DB::table('patrons')->where('id', $patron->id)->update([
                    'barcode' => $uniqueBarcode
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('patrons', 'barcode')) {
            Schema::table('patrons', function (Blueprint $table) {
                $table->dropColumn('barcode');
            });
        }
    }
};
