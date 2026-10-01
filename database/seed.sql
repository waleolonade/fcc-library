-- =========================================================================
-- DATABASE SEED DATA: Federal Co-operative College Smart Library
-- Standard SQL Seed Dataset for Production & Development Deployment
-- =========================================================================

-- 1. Seed Roles
INSERT INTO roles (id, name, display_name, description) VALUES
(1, 'admin', 'Library Administrator', 'Full administrative authority across all modules and campus branches'),
(2, 'chief_librarian', 'Chief College Librarian', 'Executive oversight of collection development, cataloguing and staff'),
(3, 'cataloguer', 'Cataloguing Librarian', 'Authority to catalog, assign MARC 21, Dewey/LCC and accession barcodes'),
(4, 'circulation_clerk', 'Circulation Desk Officer', 'Authority to check out, check in, renew and collect patron fines'),
(5, 'hod', 'Head of Department (HOD)', 'Authority to upload departmental course texts, syllabi and exam compendiums'),
(6, 'faculty', 'Academic Staff / Faculty', 'Lecturer access with extended borrow limits and course reserve curations'),
(7, 'student', 'Student Scholar', 'Standard patron with digital reader, physical checkout and self-service access'),
(8, 'guest', 'Public Researcher', 'Public discovery search and open-access reading permissions');

-- 2. Seed Granular Permissions (Module 47)
INSERT INTO permissions (id, slug, name, module, description) VALUES
(1, 'catalogue.view', 'View Catalogue', 'catalogue', 'Search and browse bibliographic holdings'),
(2, 'catalogue.create', 'Create Resource', 'catalogue', 'Add new book, monograph, or thesis record'),
(3, 'catalogue.edit', 'Edit Resource', 'catalogue', 'Update bibliographic metadata, call number, and stacks location'),
(4, 'catalogue.delete', 'Archive Resource', 'catalogue', 'Weed or archive deactivated resources'),
(5, 'users.view', 'View Patrons', 'users', 'Access student and faculty patron directory'),
(6, 'users.create', 'Create Patron', 'users', 'Register new student or faculty library account'),
(7, 'users.edit', 'Edit Patron', 'users', 'Modify patron limits, status, or contact details'),
(8, 'loans.create', 'Issue Loans', 'loans', 'Scan item barcode and checkout physical copies'),
(9, 'loans.return', 'Process Returns', 'loans', 'Process returned book into re-shelving bin'),
(10, 'loans.renew', 'Renew Loans', 'loans', 'Grant 14-day circulation extensions'),
(11, 'reservations.manage', 'Manage Reservations', 'reservations', 'Process hold requests and reservation shelf queues'),
(12, 'fines.manage', 'Manage Fines', 'fines', 'Collect fines, issue payment receipts, and authorize waivers'),
(13, 'reports.view', 'View Reports', 'reports', 'Access NBTE compliance audit reports and BI statistics'),
(14, 'reports.export', 'Export Reports', 'reports', 'Download CSV, Excel, and MARC21 records'),
(15, 'settings.manage', 'Configure System', 'settings', 'Configure institutional policies, loan durations, and fine rates');

-- 3. Seed Library Settings (Module 49)
INSERT INTO library_settings (setting_key, setting_value, setting_group, value_type, is_public, description) VALUES
('institution_name', 'Federal Co-operative College, Eleyele, Ibadan', 'general', 'string', 1, 'Official legal name of the institution'),
('institution_short_name', 'FCC Ibadan', 'general', 'string', 1, 'Institutional acronym'),
('library_name', 'Chief Olubadan Memorial Central Library & Knowledge Center', 'general', 'string', 1, 'Central library moniker'),
('contact_email', 'library@fccibadan.edu.ng', 'general', 'string', 1, 'Central library email desk'),
('contact_phone', '+234 803 456 7890', 'general', 'string', 1, 'Library helpline'),
('address', 'Eleyele Road, P.M.B. 5033, Dugbe, Ibadan, Oyo State, Nigeria', 'general', 'string', 1, 'Physical postal location'),
('opening_hours_weekday', '8:00 AM – 8:00 PM (Monday – Friday)', 'general', 'string', 1, 'Stack hours on weekdays'),
('opening_hours_weekend', '9:00 AM – 4:00 PM (Saturdays)', 'general', 'string', 1, 'Stack hours on weekends'),
('max_borrow_limit_student', '5', 'circulation', 'integer', 1, 'Maximum physical books a student can hold'),
('max_borrow_limit_faculty', '10', 'circulation', 'integer', 1, 'Maximum physical books a faculty member can hold'),
('loan_duration_days', '14', 'circulation', 'integer', 1, 'Standard physical loan period'),
('renewal_limit', '2', 'circulation', 'integer', 1, 'Number of allowable consecutive renewals'),
('daily_fine_rate', '50.00', 'circulation', 'decimal', 1, 'Daily late penalty in Naira'),
('currency_symbol', '₦', 'circulation', 'string', 1, 'Currency symbol displayed on fines and receipts'),
('currency_code', 'NGN', 'circulation', 'string', 1, 'ISO currency code'),
('reservation_hold_days', '3', 'circulation', 'integer', 1, 'Days an item remains on hold before returning to open stacks'),
('classification_system', 'Library of Congress (LCC)', 'classification', 'string', 1, 'Primary cataloguing classification scheme'),
('barcode_symbology', 'Code 128', 'opac', 'string', 1, 'Standard physical barcode label symbology'),
('enable_self_service_kiosk', 'true', 'opac', 'boolean', 1, 'Whether patron touch kiosk is enabled'),
('enable_digital_repository', 'true', 'opac', 'boolean', 1, 'Public open access to student theses and monographs');

-- 4. Seed Multi-Campus Library Branches (Module 48)
INSERT INTO branches (id, name, short_code, location, campus, seats, current_occupancy, holdings_count, head_librarian, phone, email, opening_hours, status) VALUES
('BRANCH-MAIN', 'Main Central Library', 'MAIN', 'Main Academic Quad • 3 Floors', 'Main Campus, Eleyele', 450, 184, 14850, 'Dr. Mrs. A. Balogun', '+234 803 456 7890', 'mainlib@fccibadan.edu.ng', '8:00 AM – 8:00 PM', 'Online'),
('BRANCH-ICT', 'ICT & Informatics Digital Library', 'ICT', 'ICT Complex • Wing B, Ground Floor', 'Main Campus, Eleyele', 160, 78, 4200, 'Engr. D. K. Lawal', '+234 802 112 3344', 'ictlib@fccibadan.edu.ng', '8:00 AM – 9:00 PM', 'Online'),
('BRANCH-BUS', 'Business & Management Library', 'BUS', 'School of Business Building • Floor 2', 'Main Campus, Eleyele', 120, 45, 3800, 'Mrs. O. M. Adeleke', '+234 805 776 5432', 'bizlib@fccibadan.edu.ng', '8:30 AM – 6:00 PM', 'Online'),
('BRANCH-ACC', 'Accounting & Finance Library', 'ACC', 'ICAN Accredited Finance Center • Floor 1', 'Annex Campus', 90, 32, 2900, 'Mr. P. A. Ogundipe (FCA)', '+234 809 332 1100', 'acclib@fccibadan.edu.ng', '8:30 AM – 6:00 PM', 'Online'),
('BRANCH-DEPT', 'Departmental & Co-operative Extension Library', 'DEPT', 'CEM Faculty Hall • Room 104', 'Main Campus, Eleyele', 75, 28, 1850, 'Dr. Mrs. F. A. Babalola', '+234 807 554 2211', 'cemlib@fccibadan.edu.ng', '9:00 AM – 5:00 PM', 'Online');

-- 5. Seed Shelves with QR Coordinates (Module 32)
INSERT INTO shelves (id, branch_id, shelf_code, floor, aisle, call_number_start, call_number_end, qr_code, capacity, current_count, status) VALUES
('SHELF-FL1-A1', 'BRANCH-MAIN', 'FL1-A1-CEM', 1, 'Aisle 1', 'HD2951', 'HD3500', 'QR-SHELF-FL1-A1', 120, 84, 'Active'),
('SHELF-FL1-A2', 'BRANCH-MAIN', 'FL1-A2-ACC', 1, 'Aisle 2', 'HF5601', 'HF5689', 'QR-SHELF-FL1-A2', 120, 96, 'Active'),
('SHELF-FL2-B1', 'BRANCH-MAIN', 'FL2-B1-CS', 2, 'Aisle 1', 'QA76', 'QA76.9', 'QR-SHELF-FL2-B1', 150, 110, 'Active'),
('SHELF-FL2-B2', 'BRANCH-MAIN', 'FL2-B2-AGR', 2, 'Aisle 2', 'S560', 'S590', 'QR-SHELF-FL2-B2', 100, 65, 'Active'),
('SHELF-FL3-C1', 'BRANCH-MAIN', 'FL3-C1-REF', 3, 'Aisle 1', 'Z1000', 'Z8000', 'QR-SHELF-FL3-C1', 80, 72, 'Active');

-- 6. Seed Core Bibliographic Holdings
INSERT INTO books (id, title, subtitle, author, publisher, year, isbn, subject, department, call_number, shelf_location, format, is_digital, pdf_pages, copies_total, copies_available, abstract) VALUES
('FCC-B001', 'Principles of Modern Co-operative Economics & Management', 'An Empirical West African Analysis', 'Dr. K. O. Okonjo & Prof. Adeyemi', 'FCC Academic Press', 2026, '978-978-8120-44-1', 'Co-operative Economics', 'Co-operative Economics & Management', 'HD2963 .O38 2026', 'Floor 1 • Aisle 1 • Shelf 04', 'Book', 1, 384, 5, 4, 'Comprehensive theoretical and practical exploration of credit unions, apex cooperatives, and agricultural finance.'),
('FCC-B002', 'Computer Networks: Principles and Protocols', '5th Edition Higher Education Textbook', 'Andrew S. Tanenbaum & David J. Wetherall', 'Pearson Education', 2024, '978-0132126953', 'Computer Science', 'Computer Science', 'TK5105.5 .T36 2024', 'Floor 2 • Aisle 1 • Shelf 12B', 'Book', 1, 960, 4, 3, 'Foundational networking textbook covering physical, data link, routing, transport and application layers.'),
('FCC-PDF-3779', 'Cooperative Banking & Financial Inclusion in Nigeria', 'Monograph and Policy Framework', 'Prof. O. A. Adebayo', 'University Press Plc', 2025, '978-978-940-112-9', 'Banking & Finance', 'Banking & Finance', 'HG2039 .N6 A34 2025', 'Floor 1 • Aisle 2 • Shelf 08', 'E-Book', 1, 412, 6, 6, 'A treatise on mobile banking adoption, microfinance credit limits, and rural apex unions.');

-- 7. Seed Physical Copies & Barcodes
INSERT INTO copies (id, book_id, branch_id, shelf_id, copy_number, barcode, rfid_tag, accession_number, status, item_condition, acquisition_cost, acquisition_date) VALUES
('FCC-B001-C1', 'FCC-B001', 'BRANCH-MAIN', 'SHELF-FL1-A1', 1, 'BC-FCCB001-C1', 'RFID-BC-FCCB001-C1', 'ACC-2026-FCCB001-C1', 'Checked Out', 'Good', 15000.00, '2026-01-15'),
('FCC-B001-C2', 'FCC-B001', 'BRANCH-MAIN', 'SHELF-FL1-A1', 2, 'BC-FCCB001-C2', 'RFID-BC-FCCB001-C2', 'ACC-2026-FCCB001-C2', 'Available', 'Good', 15000.00, '2026-01-15'),
('FCC-B001-C3', 'FCC-B001', 'BRANCH-MAIN', 'SHELF-FL1-A1', 3, 'BC-FCCB001-C3', 'RFID-BC-FCCB001-C3', 'ACC-2026-FCCB001-C3', 'Available', 'Good', 15000.00, '2026-01-15'),
('FCC-B002-C1', 'FCC-B002', 'BRANCH-MAIN', 'SHELF-FL2-B1', 1, 'BC-FCCB002-C1', 'RFID-BC-FCCB002-C1', 'ACC-2026-FCCB002-C1', 'Available', 'Good', 28000.00, '2026-02-10'),
('FCC-B002-C2', 'FCC-B002', 'BRANCH-MAIN', 'SHELF-FL2-B1', 2, 'BC-FCCB002-C2', 'RFID-BC-FCCB002-C2', 'ACC-2026-FCCB002-C2', 'Available', 'Good', 28000.00, '2026-02-10');

-- 8. Seed Master Barcodes
INSERT INTO barcodes (barcode_value, barcode_type, entity_type, entity_id, is_active, print_count) VALUES
('BC-FCCB001-C1', 'Code 128', 'copy', 'FCC-B001-C1', 1, 2),
('BC-FCCB001-C2', 'Code 128', 'copy', 'FCC-B001-C2', 1, 1),
('BC-FCCB001-C3', 'Code 128', 'copy', 'FCC-B001-C3', 1, 1),
('BC-FCCB002-C1', 'Code 128', 'copy', 'FCC-B002-C1', 1, 1),
('BC-FCCB002-C2', 'Code 128', 'copy', 'FCC-B002-C2', 1, 1),
('FCC-BC-09281', 'Code 128', 'copy', 'FCC-B001-C1', 1, 3);
