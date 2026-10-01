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
            ]
        ];

        foreach ($departments as $dept) {
            Department::updateOrCreate(['id' => $dept['id']], $dept);
        }

        $uploads = [
            [
                'id' => 'HOD-UP-001',
                'title' => 'CEM 411 Cooperative Econometrics Past Examination Question Compendium (2020-2025)',
                'author' => 'Department of Co-operative Economics Academic Board',
                'department_id' => 'DEP-CEM',
                'department_name' => 'Co-operative Economics & Management',
                'uploaded_by_hod_id' => 'STAFF-HOD-01',
                'hod_name' => 'Dr. Mrs. F. A. Babalola',
                'course_code' => 'CEM 411',
                'target_level' => 'HND II',
                'semester' => 'First Semester',
                'resource_type' => 'Past Exam Questions',
                'file_name' => 'cem411-past-questions-compendium.pdf',
                'file_data_url' => '',
                'access_scope' => 'Restricted to Department Students Only',
                'status' => 'pending',
                'review_notes' => null,
                'reviewed_by' => null,
                'assigned_call_number' => null,
                'assigned_shelf' => null,
                'book_id' => null
            ],
            [
                'id' => 'HOD-UP-002',
                'title' => 'Distributed Multi-Cloud Systems & Vector Indexing Lab Handout',
                'author' => 'Dr. K. E. Okonjo & Faculty Research Unit',
                'department_id' => 'DEP-CSC',
                'department_name' => 'Computer Science & Information Technology',
                'uploaded_by_hod_id' => 'STAFF-HOD-02',
                'hod_name' => 'Dr. K. E. Okonjo',
                'course_code' => 'CSC 301',
                'target_level' => 'HND I',
                'semester' => 'First Semester',
                'resource_type' => 'Lecture Handout',
                'file_name' => 'distributed-multi-cloud-lab-handout.pdf',
                'file_data_url' => '',
                'access_scope' => 'Public Institution-Wide',
                'status' => 'pending',
                'review_notes' => null,
                'reviewed_by' => null,
                'assigned_call_number' => null,
                'assigned_shelf' => null,
                'book_id' => null
            ],
            [
                'id' => 'HOD-UP-003',
                'title' => 'Modern Micro-Credit Lending & Syndicate Banking Guidelines',
                'author' => 'Mrs. Folake Sanusi & Dr. M. K. Balogun',
                'department_id' => 'DEP-BNF',
                'department_name' => 'Banking & Finance',
                'uploaded_by_hod_id' => 'STAFF-HOD-03',
                'hod_name' => 'Mrs. Folake Sanusi',
                'course_code' => 'BNF 312',
                'target_level' => 'ND II',
                'semester' => 'Second Semester',
                'resource_type' => 'Lecture Handout',
                'file_name' => 'modern-microcredit-syndicate-banking.pdf',
                'file_data_url' => '',
                'access_scope' => 'Public Institution-Wide',
                'status' => 'approved',
                'review_notes' => 'Verified syllabus compliance. Ingested into master catalog.',
                'reviewed_by' => 'Dr. Mrs. A. Balogun (Chief College Librarian)',
                'assigned_call_number' => 'HG178.33 .S26 2026',
                'assigned_shelf' => 'Floor 2 • Aisle 3 • Shelf 08A',
                'book_id' => 'FCC-B004'
            ],
            [
                'id' => 'HOD-UP-004',
                'title' => 'Soil Nitrogen Dynamics & Cocoa Harvest Optimization in Agro-Ecological Zones',
                'author' => 'Agronomy Faculty Unit',
                'department_id' => 'DEP-AGR',
                'department_name' => 'Agricultural Extension & Management',
                'uploaded_by_hod_id' => 'STAFF-HOD-04',
                'hod_name' => 'Dr. A. O. Olabode',
                'course_code' => 'AGR 211',
                'target_level' => 'ND I',
                'semester' => 'First Semester',
                'resource_type' => 'Research Monograph',
                'file_name' => 'soil-nitrogen-dynamics-cocoa.pdf',
                'file_data_url' => '',
                'access_scope' => 'Public Institution-Wide',
                'status' => 'rejected',
                'review_notes' => 'Please attach formal departmental academic board approval signature on page 2 before master catalog publication.',
                'reviewed_by' => 'Dr. Mrs. A. Balogun (Chief College Librarian)',
                'assigned_call_number' => null,
                'assigned_shelf' => null,
                'book_id' => null
            ]
        ];

        foreach ($uploads as $up) {
            DepartmentUpload::updateOrCreate(['id' => $up['id']], $up);
        }
    }
}
