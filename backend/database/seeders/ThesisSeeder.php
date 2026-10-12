<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Thesis;

class ThesisSeeder extends Seeder
{
    public function run(): void
    {
        // Real dissertations only - no mock/demo records.
        // Dissertations and theses are populated exclusively through authenticated HOD submissions and admin approvals.
        $theses = [];

        foreach ($theses as $th) {
            Thesis::updateOrCreate(
                ['id' => $th['id']],
                $th
            );
        }
    }
}
