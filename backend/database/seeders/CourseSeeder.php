<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CourseSeeder extends Seeder
{
    public function run(): void
    {
        // Real courses only - no mock/demo records.
        // Academic courses are populated live from official institutional uploads and admin registrations.
        $courses = [];

        foreach ($courses as $c) {
            DB::table('courses')->updateOrInsert(
                ['code' => $c['code']],
                array_merge($c, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }
    }
}
