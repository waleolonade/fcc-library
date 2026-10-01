<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EnterpriseOpacSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Granular Permissions (Prompt 47)
        $permissions = [
            ['slug' => 'catalogue.view', 'name' => 'View Catalogue', 'module' => 'catalogue', 'description' => 'Browse and view full bibliographic records'],
            ['slug' => 'catalogue.create', 'name' => 'Create Resources', 'module' => 'catalogue', 'description' => 'Catalog and upload new books, serials and theses'],
            ['slug' => 'catalogue.edit', 'name' => 'Edit Resources', 'module' => 'catalogue', 'description' => 'Modify bibliographic records, call numbers and subject tags'],
            ['slug' => 'catalogue.delete', 'name' => 'Delete/Archive Resources', 'module' => 'catalogue', 'description' => 'Decommission or weed resources from active stacks'],
            ['slug' => 'users.view', 'name' => 'View Patrons & Staff', 'module' => 'users', 'description' => 'Inspect patron profiles, loan records and clearance status'],
            ['slug' => 'users.create', 'name' => 'Register Patrons', 'module' => 'users', 'description' => 'Register new students, faculty and staff members'],
            ['slug' => 'users.edit', 'name' => 'Edit Patron Profiles', 'module' => 'users', 'description' => 'Modify patron contact info, level and borrow quotas'],
            ['slug' => 'loans.create', 'name' => 'Issue Loans (Checkout)', 'module' => 'loans', 'description' => 'Scan barcodes and issue books to authenticated patrons'],
            ['slug' => 'loans.return', 'name' => 'Process Returns (Checkin)', 'module' => 'loans', 'description' => 'Receive returned copies, inspect condition and restack'],
            ['slug' => 'loans.renew', 'name' => 'Renew Loans', 'module' => 'loans', 'description' => 'Extend book loan period for eligible patrons'],
            ['slug' => 'reservations.manage', 'name' => 'Manage Reservations', 'module' => 'reservations', 'description' => 'Approve hold requests and manage reservation shelf'],
            ['slug' => 'fines.manage', 'name' => 'Manage & Waive Fines', 'module' => 'fines', 'description' => 'Collect overdue fines, process waivers and record receipts'],
            ['slug' => 'reports.view', 'name' => 'View Reports & BI', 'module' => 'reports', 'description' => 'Access accreditation audit reports and circulation metrics'],
            ['slug' => 'reports.export', 'name' => 'Export Data (CSV/MRC)', 'module' => 'reports', 'description' => 'Export MARC21 records, inventory sheets and analytics'],
            ['slug' => 'settings.manage', 'name' => 'Manage Library Settings', 'module' => 'settings', 'description' => 'Configure institution profile, loan limits and fine policies'],
        ];

        foreach ($permissions as $p) {
            DB::table('permissions')->updateOrInsert(['slug' => $p['slug']], $p);
        }

        // 2. Seed Roles
        $roles = [
            ['name' => 'admin', 'display_name' => 'Library Administrator', 'description' => 'Full administrative access to entire institution library system'],
            ['name' => 'chief_librarian', 'display_name' => 'Chief College Librarian', 'description' => 'Executive catalog, collection and policy oversight'],
            ['name' => 'cataloguer', 'display_name' => 'Cataloguing Librarian', 'description' => 'MARC 21, Dewey/LCC metadata and accessioning'],
            ['name' => 'circulation_clerk', 'display_name' => 'Circulation Desk Staff', 'description' => 'Desk checkout, checkin, renewals and fine collection'],
            ['name' => 'hod', 'display_name' => 'Head of Department (HOD)', 'description' => 'Departmental curriculum texts and syllabi management'],
            ['name' => 'faculty', 'display_name' => 'Academic Faculty Member', 'description' => 'Lecturer with extended borrow limits and course reserve access'],
            ['name' => 'student', 'display_name' => 'Student Scholar', 'description' => 'Standard patron with borrowing, reserve and e-reader access'],
            ['name' => 'guest', 'display_name' => 'Public / Guest Scholar', 'description' => 'Discovery catalog search and public open-access browsing']
        ];

        foreach ($roles as $r) {
            DB::table('roles')->updateOrInsert(['name' => $r['name']], $r);
        }

        // 3. Seed Configurable Library Settings (Prompt 49)
        $settings = [
            ['setting_key' => 'institution_name', 'setting_value' => 'Federal Co-operative College, Ibadan', 'setting_group' => 'general', 'description' => 'Full institution legal name'],
            ['setting_key' => 'institution_short_name', 'setting_value' => 'FCC Ibadan', 'setting_group' => 'general', 'description' => 'Abbreviated name'],
            ['setting_key' => 'library_name', 'setting_value' => 'Chief Olubadan Memorial Central Library & Knowledge Center', 'setting_group' => 'general', 'description' => 'Main Library Name'],
            ['setting_key' => 'contact_email', 'setting_value' => 'library@fccibadan.edu.ng', 'setting_group' => 'general', 'description' => 'Official Library Desk Email'],
            ['setting_key' => 'contact_phone', 'setting_value' => '+234 803 456 7890', 'setting_group' => 'general', 'description' => 'Helpdesk Phone Line'],
            ['setting_key' => 'address', 'setting_value' => 'Eleyele Road, P.M.B. 5033, Dugbe, Ibadan, Oyo State, Nigeria', 'setting_group' => 'general', 'description' => 'Physical Street Address'],
            ['setting_key' => 'opening_hours_weekday', 'setting_value' => '8:00 AM – 8:00 PM (Monday – Friday)', 'setting_group' => 'general', 'description' => 'Weekday stack hours'],
            ['setting_key' => 'opening_hours_weekend', 'setting_value' => '9:00 AM – 4:00 PM (Saturdays)', 'setting_group' => 'general', 'description' => 'Weekend stack hours'],
            ['setting_key' => 'max_borrow_limit_student', 'setting_value' => '5', 'setting_group' => 'circulation', 'description' => 'Maximum concurrent physical loans for students'],
            ['setting_key' => 'max_borrow_limit_faculty', 'setting_value' => '10', 'setting_group' => 'circulation', 'description' => 'Maximum concurrent loans for faculty'],
            ['setting_key' => 'loan_duration_days', 'setting_value' => '14', 'setting_group' => 'circulation', 'description' => 'Standard borrowing duration in days'],
            ['setting_key' => 'renewal_limit', 'setting_value' => '2', 'setting_group' => 'circulation', 'description' => 'Number of times a patron can renew without returning'],
            ['setting_key' => 'daily_fine_rate', 'setting_value' => '50.00', 'setting_group' => 'circulation', 'description' => 'Daily overdue penalty in local currency'],
            ['setting_key' => 'currency_symbol', 'setting_value' => '₦', 'setting_group' => 'circulation', 'description' => 'Currency symbol for fines and receipts'],
            ['setting_key' => 'currency_code', 'setting_value' => 'NGN', 'setting_group' => 'circulation', 'description' => 'ISO 4217 Currency Code'],
            ['setting_key' => 'reservation_hold_days', 'setting_value' => '3', 'setting_group' => 'circulation', 'description' => 'Days an item is kept on hold shelf before auto-release'],
            ['setting_key' => 'classification_system', 'setting_value' => 'Library of Congress (LCC)', 'setting_group' => 'classification', 'description' => 'Primary bibliographic classification scheme'],
            ['setting_key' => 'barcode_symbology', 'setting_value' => 'Code 128', 'setting_group' => 'opac', 'description' => 'Default barcode format for physical copies'],
            ['setting_key' => 'enable_self_service_kiosk', 'setting_value' => 'true', 'setting_group' => 'opac', 'description' => 'Enable self-checkout and return kiosk stations'],
            ['setting_key' => 'enable_digital_repository', 'setting_value' => 'true', 'setting_group' => 'opac', 'description' => 'Public access to electronic theses and e-books'],
        ];

        foreach ($settings as $s) {
            DB::table('library_settings')->updateOrInsert(['setting_key' => $s['setting_key']], $s);
        }

        // 4. Seed Multi-Campus Libraries & Branches (Prompt 48)
        $branches = [
            [
                'id' => 'BRANCH-MAIN',
                'name' => 'Main Central Library',
                'short_code' => 'MAIN',
                'location' => 'Main Academic Quad • 3 Floors',
                'campus' => 'Main Campus, Eleyele',
                'seats' => 450,
                'current_occupancy' => 184,
                'holdings_count' => 14850,
                'head_librarian' => 'Dr. Mrs. A. Balogun',
                'phone' => '+234 803 456 7890',
                'email' => 'mainlib@fccibadan.edu.ng',
                'opening_hours' => '8:00 AM – 8:00 PM',
                'status' => 'Online'
            ],
            [
                'id' => 'BRANCH-ICT',
                'name' => 'ICT & Informatics Digital Library',
                'short_code' => 'ICT',
                'location' => 'ICT Complex • Wing B, Ground Floor',
                'campus' => 'Main Campus, Eleyele',
                'seats' => 160,
                'current_occupancy' => 78,
                'holdings_count' => 4200,
                'head_librarian' => 'Engr. D. K. Lawal',
                'phone' => '+234 802 112 3344',
                'email' => 'ictlib@fccibadan.edu.ng',
                'opening_hours' => '8:00 AM – 9:00 PM',
                'status' => 'Online'
            ],
            [
                'id' => 'BRANCH-BUS',
                'name' => 'Business & Management Library',
                'short_code' => 'BUS',
                'location' => 'School of Business Building • Floor 2',
                'campus' => 'Main Campus, Eleyele',
                'seats' => 120,
                'current_occupancy' => 45,
                'holdings_count' => 3800,
                'head_librarian' => 'Mrs. O. M. Adeleke',
                'phone' => '+234 805 776 5432',
                'email' => 'bizlib@fccibadan.edu.ng',
                'opening_hours' => '8:30 AM – 6:00 PM',
                'status' => 'Online'
            ],
            [
                'id' => 'BRANCH-ACC',
                'name' => 'Accounting & Finance Library',
                'short_code' => 'ACC',
                'location' => 'ICAN Accredited Finance Center • Floor 1',
                'campus' => 'Annex Campus',
                'seats' => 90,
                'current_occupancy' => 32,
                'holdings_count' => 2900,
                'head_librarian' => 'Mr. P. A. Ogundipe (FCA)',
                'phone' => '+234 809 332 1100',
                'email' => 'acclib@fccibadan.edu.ng',
                'opening_hours' => '8:30 AM – 6:00 PM',
                'status' => 'Online'
            ],
            [
                'id' => 'BRANCH-DEPT',
                'name' => 'Departmental & Co-operative Extension Library',
                'short_code' => 'DEPT',
                'location' => 'CEM Faculty Hall • Room 104',
                'campus' => 'Main Campus, Eleyele',
                'seats' => 75,
                'current_occupancy' => 28,
                'holdings_count' => 1850,
                'head_librarian' => 'Dr. Mrs. F. A. Babalola',
                'phone' => '+234 807 554 2211',
                'email' => 'cemlib@fccibadan.edu.ng',
                'opening_hours' => '9:00 AM – 5:00 PM',
                'status' => 'Online'
            ]
        ];

        foreach ($branches as $b) {
            DB::table('branches')->updateOrInsert(['id' => $b['id']], $b);
        }

        // 5. Seed Shelves with Shelf Codes & QR Coordinates
        $shelves = [
            ['id' => 'SHELF-FL1-A1', 'branch_id' => 'BRANCH-MAIN', 'shelf_code' => 'FL1-A1-CEM', 'floor' => 1, 'aisle' => 'Aisle 1', 'call_number_start' => 'HD2951', 'call_number_end' => 'HD3500', 'capacity' => 120, 'current_count' => 84, 'status' => 'Active', 'qr_code' => 'QR-SHELF-FL1-A1'],
            ['id' => 'SHELF-FL1-A2', 'branch_id' => 'BRANCH-MAIN', 'shelf_code' => 'FL1-A2-ACC', 'floor' => 1, 'aisle' => 'Aisle 2', 'call_number_start' => 'HF5601', 'call_number_end' => 'HF5689', 'capacity' => 120, 'current_count' => 96, 'status' => 'Active', 'qr_code' => 'QR-SHELF-FL1-A2'],
            ['id' => 'SHELF-FL2-B1', 'branch_id' => 'BRANCH-MAIN', 'shelf_code' => 'FL2-B1-CS', 'floor' => 2, 'aisle' => 'Aisle 1', 'call_number_start' => 'QA76', 'call_number_end' => 'QA76.9', 'capacity' => 150, 'current_count' => 110, 'status' => 'Active', 'qr_code' => 'QR-SHELF-FL2-B1'],
            ['id' => 'SHELF-FL2-B2', 'branch_id' => 'BRANCH-MAIN', 'shelf_code' => 'FL2-B2-AGR', 'floor' => 2, 'aisle' => 'Aisle 2', 'call_number_start' => 'S560', 'call_number_end' => 'S590', 'capacity' => 100, 'current_count' => 65, 'status' => 'Active', 'qr_code' => 'QR-SHELF-FL2-B2'],
            ['id' => 'SHELF-FL3-C1', 'branch_id' => 'BRANCH-MAIN', 'shelf_code' => 'FL3-C1-REF', 'floor' => 3, 'aisle' => 'Aisle 1', 'call_number_start' => 'Z1000', 'call_number_end' => 'Z8000', 'capacity' => 80, 'current_count' => 72, 'status' => 'Active', 'qr_code' => 'QR-SHELF-FL3-C1'],
        ];

        foreach ($shelves as $sh) {
            DB::table('shelves')->updateOrInsert(['id' => $sh['id']], $sh);
        }

        // 6. Seed Authors & Publishers
        $authors = [
            ['name' => 'Prof. Adeyemi O. Oladipo', 'orcid' => '0000-0002-1825-0097', 'affiliation' => 'Federal Co-operative College, Ibadan', 'nationality' => 'Nigerian', 'biography' => 'Professor of Cooperative Microfinance and Rural Agrarian Economies.'],
            ['name' => 'Dr. Mrs. F. A. Babalola', 'orcid' => '0000-0003-4512-8819', 'affiliation' => 'Head of Department, CEM', 'nationality' => 'Nigerian', 'biography' => 'Pioneer researcher in apex cooperative societies governance in West Africa.'],
            ['name' => 'Andrew S. Tanenbaum', 'orcid' => '0000-0001-9214-7741', 'affiliation' => 'Vrije Universiteit Amsterdam', 'nationality' => 'Dutch-American', 'biography' => 'Author of seminal textbooks on Computer Networks and Operating Systems.'],
            ['name' => 'E. Raymond', 'orcid' => '0000-0002-7634-1182', 'affiliation' => 'Open Source Initiative', 'nationality' => 'American', 'biography' => 'Renowned author on software engineering paradigms and bazaar methodology.'],
        ];

        foreach ($authors as $a) {
            DB::table('authors')->updateOrInsert(['name' => $a['name']], $a);
        }

        $publishers = [
            ['name' => 'Federal Co-operative College Academic Press', 'country' => 'Nigeria', 'city' => 'Ibadan', 'website' => 'https://press.fccibadan.edu.ng', 'contact_email' => 'press@fccibadan.edu.ng'],
            ['name' => 'Pearson Education', 'country' => 'United Kingdom', 'city' => 'London', 'website' => 'https://pearson.com', 'contact_email' => 'highered@pearson.com'],
            ['name' => 'O\'Reilly Media', 'country' => 'United States', 'city' => 'Sebastopol', 'website' => 'https://oreilly.com', 'contact_email' => 'order@oreilly.com'],
            ['name' => 'University Press Plc', 'country' => 'Nigeria', 'city' => 'Ibadan', 'website' => 'https://universitypressplc.com', 'contact_email' => 'info@universitypressplc.com'],
        ];

        foreach ($publishers as $pub) {
            DB::table('publishers')->updateOrInsert(['name' => $pub['name']], $pub);
        }

        // 7. Seed Physical Copies & Barcodes for All Books in Stacks
        $books = DB::table('books')->get();
        foreach ($books as $index => $book) {
            $totalCopies = max(2, (int)($book->copies_total ?? 3));
            $cleanBookId = preg_replace('/[^0-9A-Za-z]/', '', $book->id);
            for ($c = 1; $c <= $totalCopies; $c++) {
                $copyId = "{$book->id}-C{$c}";
                $barcodeNum = "BC-{$cleanBookId}-C{$c}";
                $accessionNum = "ACC-2026-{$cleanBookId}-C{$c}";
                $isLoaned = ($c === 1 && ($book->copies_available ?? 0) < ($book->copies_total ?? 1));

                DB::table('copies')->updateOrInsert(
                    ['id' => $copyId],
                    [
                        'book_id' => $book->id,
                        'branch_id' => $book->branch ?? 'Main Central Library',
                        'shelf_id' => 'SHELF-FL1-A1',
                        'copy_number' => $c,
                        'barcode' => $barcodeNum,
                        'rfid_tag' => "RFID-{$barcodeNum}",
                        'accession_number' => $accessionNum,
                        'status' => $isLoaned ? 'Checked Out' : 'Available',
                        'condition' => 'Good',
                        'acquisition_cost' => 15000.00,
                        'acquisition_date' => date('Y-m-d', strtotime("-{$c} months")),
                    ]
                );

                // Register in barcodes lookup table
                DB::table('barcodes')->updateOrInsert(
                    ['barcode_value' => $barcodeNum],
                    [
                        'barcode_type' => 'Code 128',
                        'entity_type' => 'copy',
                        'entity_id' => $copyId,
                        'is_active' => true,
                        'print_count' => 1,
                        'last_scanned_at' => now(),
                    ]
                );
            }
        }
    }
}
