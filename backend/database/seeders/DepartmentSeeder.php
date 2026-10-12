<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Department;
use App\Models\DepartmentUpload;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            [
                'id' => 'DEP-CEM',
                'name' => 'Co-operative Economics & Management',
                'code' => 'CEM',
                'hod_name' => 'Dr. Mrs. F. A. Babalola',
                'hod_email' => 'babalola.hod@fccibadan.edu.ng',
                'hod_pin' => '1234',
                'student_count' => 480,
                'faculty_count' => 14
            ],
            [
                'id' => 'DEP-CSC',
                'name' => 'Computer Science & Information Technology',
                'code' => 'CSC',
                'hod_name' => 'Dr. K. E. Okonjo',
                'hod_email' => 'okonjo.hod@fccibadan.edu.ng',
                'hod_pin' => '1234',
                'student_count' => 390,
                'faculty_count' => 12
            ],
            [
                'id' => 'DEP-BNF',
                'name' => 'Banking & Finance',
                'code' => 'BNF',
                'hod_name' => 'Mrs. Folake Sanusi',
                'hod_email' => 'sanusi.hod@fccibadan.edu.ng',
                'hod_pin' => '1234',
                'student_count' => 320,
                'faculty_count' => 10
            ],
            [
                'id' => 'DEP-AGR',
                'name' => 'Agricultural Extension & Management',
                'code' => 'AGR',
                'hod_name' => 'Dr. A. O. Olabode',
                'hod_email' => 'olabode.hod@fccibadan.edu.ng',
                'hod_pin' => '1234',
                'student_count' => 280,
                'faculty_count' => 9
            ],
            [
                'id' => 'DEP-BAM',
                'name' => 'Business Administration & Management',
                'code' => 'BAM',
                'hod_name' => 'Dr. T. M. Adewale',
                'hod_email' => 'adewale.hod@fccibadan.edu.ng',
                'hod_pin' => '1234',
                'student_count' => 350,
                'faculty_count' => 11
            ],
            [
                'id' => 'DEP-PAD',
                'name' => 'Public Administration',
                'code' => 'PAD',
                'hod_name' => 'Dr. Mrs. B. O. Adeleke',
                'hod_email' => 'adeleke.hod@fccibadan.edu.ng',
                'hod_pin' => '1234',
                'student_count' => 310,
                'faculty_count' => 9
            ]
        ];

        foreach ($departments as $dept) {
            Department::updateOrCreate(['id' => $dept['id']], $dept);
        }

    }
}
