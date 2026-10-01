-- =========================================================================
-- DATABASE SCHEMA: brainfeels_library (Federal Co-operative College)
-- Enterprise Normalized Relational Schema for Production OPAC System
-- Standard: ANSI SQL / MySQL 8.0+ / SQLite 3 Compatible
-- =========================================================================

-- 1. Roles & Granular Access Control
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL, -- admin, chief_librarian, cataloguer, circulation_clerk, hod, faculty, student, guest
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Granular Permissions (Module 47)
CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL, -- catalogue.view, catalogue.create, loans.renew, etc.
    name VARCHAR(150) NOT NULL,
    module VARCHAR(50) NOT NULL, -- catalogue, users, loans, reservations, fines, reports, settings
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Role Permissions Pivot
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- 4. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(191) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    matric_number VARCHAR(100) UNIQUE,
    staff_id VARCHAR(100) UNIQUE,
    user_type VARCHAR(50) NOT NULL DEFAULT 'student', -- student, staff, librarian, admin
    phone VARCHAR(50),
    department VARCHAR(150),
    faculty VARCHAR(150),
    status VARCHAR(50) DEFAULT 'active', -- active, suspended, pending, expired
    mfa_secret VARCHAR(255) NULL,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    remember_token VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_matric (matric_number)
);

-- 5. User Roles Pivot
CREATE TABLE IF NOT EXISTS user_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- 6. Multi-Campus Library Branches (Module 48)
CREATE TABLE IF NOT EXISTS branches (
    id VARCHAR(50) PRIMARY KEY, -- BRANCH-MAIN, BRANCH-ICT, BRANCH-BUS, etc.
    name VARCHAR(255) NOT NULL,
    short_code VARCHAR(50) UNIQUE NOT NULL,
    location VARCHAR(255) NOT NULL,
    campus VARCHAR(100) NOT NULL,
    seats INT DEFAULT 100,
    current_occupancy INT DEFAULT 0,
    holdings_count INT DEFAULT 0,
    head_librarian VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(100),
    opening_hours VARCHAR(150),
    status VARCHAR(50) DEFAULT 'Online',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 7. Physical Locations & Stacks
CREATE TABLE IF NOT EXISTS locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id VARCHAR(50) NOT NULL,
    building VARCHAR(150) NOT NULL,
    floor VARCHAR(50) NOT NULL,
    room VARCHAR(100),
    area_name VARCHAR(150) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

-- 8. Shelves with QR Coordinates (Module 32)
CREATE TABLE IF NOT EXISTS shelves (
    id VARCHAR(50) PRIMARY KEY, -- e.g. SHELF-FL1-A1
    branch_id VARCHAR(50) NOT NULL,
    shelf_code VARCHAR(100) NOT NULL,
    floor INT DEFAULT 1,
    aisle VARCHAR(50),
    call_number_start VARCHAR(100),
    call_number_end VARCHAR(100),
    qr_code VARCHAR(150) UNIQUE,
    capacity INT DEFAULT 100,
    current_count INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    INDEX idx_shelf_code (shelf_code)
);

-- 9. Authors Registry
CREATE TABLE IF NOT EXISTS authors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    orcid VARCHAR(50) NULL,
    affiliation VARCHAR(255) NULL,
    nationality VARCHAR(100) NULL,
    biography TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_author_name (name)
);

-- 10. Publishers Registry
CREATE TABLE IF NOT EXISTS publishers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100),
    city VARCHAR(100),
    website VARCHAR(255),
    contact_email VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_publisher_name (name)
);

-- 11. Subjects & Controlled Vocabulary
CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NULL,
    name VARCHAR(255) NOT NULL,
    classification_system VARCHAR(100) DEFAULT 'Library of Congress',
    parent_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES subjects(id) ON DELETE SET NULL,
    INDEX idx_subject_name (name),
    INDEX idx_subject_code (code)
);

-- 12. Categories
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Bibliographic Resources / Books Table
CREATE TABLE IF NOT EXISTS books (
    id VARCHAR(50) PRIMARY KEY, -- FCC-B001, FCC-PDF-3779
    title VARCHAR(500) NOT NULL,
    subtitle VARCHAR(500),
    author VARCHAR(255) NOT NULL,
    co_authors TEXT,
    publisher_id INT NULL,
    publisher VARCHAR(255),
    year INT,
    edition VARCHAR(100),
    isbn VARCHAR(50) INDEX,
    issn VARCHAR(50),
    doi VARCHAR(100) INDEX,
    subject VARCHAR(255) INDEX,
    department VARCHAR(150) INDEX,
    course_code VARCHAR(50) INDEX,
    target_level VARCHAR(50),
    branch VARCHAR(255) DEFAULT 'Main Library',
    shelf_location VARCHAR(100),
    call_number VARCHAR(100) INDEX,
    format VARCHAR(50) DEFAULT 'Book', -- Book, E-Book, Thesis, Journal, Monograph
    is_digital BOOLEAN DEFAULT FALSE,
    pdf_pages INT DEFAULT 0,
    file_size VARCHAR(50),
    file_name VARCHAR(255),
    external_url TEXT,
    abstract TEXT,
    keywords TEXT,
    copies_total INT DEFAULT 1,
    copies_available INT DEFAULT 1,
    citations INT DEFAULT 0,
    rating DECIMAL(3, 1) DEFAULT 5.0,
    qr_code VARCHAR(255),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by VARCHAR(255),
    deleted_at TIMESTAMP NULL,
    INDEX idx_books_title (title),
    INDEX idx_books_author (author)
);

-- 14. Resource Authors Pivot (Many-to-Many)
CREATE TABLE IF NOT EXISTS resource_authors (
    book_id VARCHAR(50) NOT NULL,
    author_id INT NOT NULL,
    role VARCHAR(50) DEFAULT 'Primary Author',
    order_index INT DEFAULT 1,
    PRIMARY KEY (book_id, author_id),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE
);

-- 15. Resource Subjects Pivot (Many-to-Many)
CREATE TABLE IF NOT EXISTS resource_subjects (
    book_id VARCHAR(50) NOT NULL,
    subject_id INT NOT NULL,
    PRIMARY KEY (book_id, subject_id),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- 16. Editions
CREATE TABLE IF NOT EXISTS editions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id VARCHAR(50) NOT NULL,
    edition_number VARCHAR(50) NOT NULL,
    publication_year INT,
    isbn10 VARCHAR(20),
    isbn13 VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- 17. Physical Copies (Individual Item Barcode Tracking) (Module 31 & 35)
CREATE TABLE IF NOT EXISTS copies (
    id VARCHAR(50) PRIMARY KEY, -- e.g. FCC-B001-C1
    book_id VARCHAR(50) NOT NULL,
    branch_id VARCHAR(50) DEFAULT 'BRANCH-MAIN',
    shelf_id VARCHAR(50) NULL,
    copy_number INT DEFAULT 1,
    barcode VARCHAR(100) UNIQUE NOT NULL,
    rfid_tag VARCHAR(100) UNIQUE NULL,
    accession_number VARCHAR(100) UNIQUE NULL,
    status VARCHAR(50) DEFAULT 'Available', -- Available, Checked Out, In Transit, On Hold, Lost, In Repair
    item_condition VARCHAR(50) DEFAULT 'Good', -- New, Good, Fair, Damaged
    acquisition_cost DECIMAL(10, 2) DEFAULT 0.00,
    acquisition_date DATE NULL,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    INDEX idx_copy_barcode (barcode),
    INDEX idx_copy_status (status)
);

-- 18. Master Barcode Registry (Code 128 / EAN-13 / QR)
CREATE TABLE IF NOT EXISTS barcodes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    barcode_value VARCHAR(100) UNIQUE NOT NULL,
    barcode_type VARCHAR(50) DEFAULT 'Code 128',
    entity_type VARCHAR(50) NOT NULL, -- copy, patron, shelf, accession, digital
    entity_id VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    print_count INT DEFAULT 0,
    last_scanned_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_barcode_val (barcode_value),
    INDEX idx_barcode_entity (entity_type, entity_id)
);

-- 19. Patrons Table
CREATE TABLE IF NOT EXISTS patrons (
    id VARCHAR(50) PRIMARY KEY,
    matric VARCHAR(100) UNIQUE NOT NULL,
    library_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'student',
    category VARCHAR(100),
    department VARCHAR(150),
    faculty VARCHAR(150),
    level VARCHAR(50),
    programme VARCHAR(100),
    email VARCHAR(150),
    phone VARCHAR(50),
    pin VARCHAR(10) DEFAULT '1234',
    status VARCHAR(50) DEFAULT 'Active',
    borrow_quota INT DEFAULT 5,
    outstanding_fines DECIMAL(10, 2) DEFAULT 0.00,
    barcode VARCHAR(100) UNIQUE,
    qr_code VARCHAR(150) UNIQUE,
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_patron_matric (matric),
    INDEX idx_patron_libid (library_id)
);

-- 20. Loans & Circulation
CREATE TABLE IF NOT EXISTS loans (
    id VARCHAR(50) PRIMARY KEY, -- LOAN-1001
    patron_matric VARCHAR(100) NOT NULL,
    patron_name VARCHAR(255) NOT NULL,
    book_id VARCHAR(50) NOT NULL,
    book_title VARCHAR(500) NOT NULL,
    copy_id VARCHAR(50) NULL,
    barcode VARCHAR(100) NULL,
    borrow_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE NULL,
    renewals_count INT DEFAULT 0,
    fine DECIMAL(10, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Active', -- Active, Returned, Overdue, Lost
    checked_out_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    INDEX idx_loan_patron (patron_matric),
    INDEX idx_loan_status (status)
);

-- 21. Returns Registry
CREATE TABLE IF NOT EXISTS loan_returns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    loan_id VARCHAR(50) NOT NULL,
    copy_id VARCHAR(50),
    returned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    received_by VARCHAR(255),
    item_condition VARCHAR(50) DEFAULT 'Good',
    fine_assessed DECIMAL(10, 2) DEFAULT 0.00,
    bin_location VARCHAR(100) DEFAULT 'Re-shelving Bin A',
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
);

-- 22. Reservations / Holds
CREATE TABLE IF NOT EXISTS reservations (
    id VARCHAR(50) PRIMARY KEY, -- RES-001
    patron_matric VARCHAR(100) NOT NULL,
    book_id VARCHAR(50) NOT NULL,
    request_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, Ready For Pickup, Fulfilled, Expired, Cancelled
    pickup_branch VARCHAR(100) DEFAULT 'Main Library',
    notification_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- 23. Fines Table
CREATE TABLE IF NOT EXISTS fines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    loan_id VARCHAR(50) NULL,
    patron_matric VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    balance_remaining DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    reason VARCHAR(255) NOT NULL, -- Overdue loan, Lost book, Spine damage
    status VARCHAR(50) DEFAULT 'Unpaid', -- Unpaid, Paid, Waived, Partial
    waived_by VARCHAR(255) NULL,
    waived_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fine_patron (patron_matric)
);

-- 24. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fine_id INT NULL,
    patron_matric VARCHAR(100) NOT NULL,
    amount_paid DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'Card', -- Cash, POS, Remita, Paystack, Bank Transfer
    transaction_reference VARCHAR(150) UNIQUE NOT NULL,
    received_by VARCHAR(255),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fine_id) REFERENCES fines(id) ON DELETE SET NULL
);

-- 25. Favorites / Saved Books
CREATE TABLE IF NOT EXISTS favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_identifier VARCHAR(100) NOT NULL, -- matric or email
    book_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_fav (user_identifier, book_id),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- 26. Reading Lists & Curated Syllabi
CREATE TABLE IF NOT EXISTS reading_lists (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    creator_matric VARCHAR(100),
    department VARCHAR(150),
    course_code VARCHAR(50),
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reading_list_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reading_list_id VARCHAR(50) NOT NULL,
    book_id VARCHAR(50) NOT NULL,
    priority INT DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reading_list_id) REFERENCES reading_lists(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- 27. Digital Resources
CREATE TABLE IF NOT EXISTS digital_resources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id VARCHAR(50) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size VARCHAR(50),
    mime_type VARCHAR(100) DEFAULT 'application/pdf',
    access_rights VARCHAR(100) DEFAULT 'Campus Community',
    download_count INT DEFAULT 0,
    view_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- 28. Configurable Library Settings (Module 49)
CREATE TABLE IF NOT EXISTS library_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NULL,
    setting_group VARCHAR(50) DEFAULT 'general', -- general, circulation, opac, security, classification
    value_type VARCHAR(50) DEFAULT 'string',
    is_public BOOLEAN DEFAULT TRUE,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_settings_key (setting_key)
);

-- 29. Audit Logs (Module 38)
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actor VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(100),
    details TEXT,
    ip_address VARCHAR(50),
    hash VARCHAR(100),
    INDEX idx_audit_actor (actor),
    INDEX idx_audit_action (action)
);

-- 30. Notifications & Announcements
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    matric VARCHAR(100),
    type VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    date VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS announcements (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    priority VARCHAR(50) DEFAULT 'Normal',
    author VARCHAR(255),
    date VARCHAR(50),
    valid_until VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
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
('opening_hours_weekday', '8:00 AM â€“ 8:00 PM (Monday â€“ Friday)', 'general', 'string', 1, 'Stack hours on weekdays'),
('opening_hours_weekend', '9:00 AM â€“ 4:00 PM (Saturdays)', 'general', 'string', 1, 'Stack hours on weekends'),
('max_borrow_limit_student', '5', 'circulation', 'integer', 1, 'Maximum physical books a student can hold'),
('max_borrow_limit_faculty', '10', 'circulation', 'integer', 1, 'Maximum physical books a faculty member can hold'),
('loan_duration_days', '14', 'circulation', 'integer', 1, 'Standard physical loan period'),
('renewal_limit', '2', 'circulation', 'integer', 1, 'Number of allowable consecutive renewals'),
('daily_fine_rate', '50.00', 'circulation', 'decimal', 1, 'Daily late penalty in Naira'),
('currency_symbol', 'â‚¦', 'circulation', 'string', 1, 'Currency symbol displayed on fines and receipts'),
('currency_code', 'NGN', 'circulation', 'string', 1, 'ISO currency code'),
('reservation_hold_days', '3', 'circulation', 'integer', 1, 'Days an item remains on hold before returning to open stacks'),
('classification_system', 'Library of Congress (LCC)', 'classification', 'string', 1, 'Primary cataloguing classification scheme'),
('barcode_symbology', 'Code 128', 'opac', 'string', 1, 'Standard physical barcode label symbology'),
('enable_self_service_kiosk', 'true', 'opac', 'boolean', 1, 'Whether patron touch kiosk is enabled'),
('enable_digital_repository', 'true', 'opac', 'boolean', 1, 'Public open access to student theses and monographs');

-- 4. Seed Multi-Campus Library Branches (Module 48)
INSERT INTO branches (id, name, short_code, location, campus, seats, current_occupancy, holdings_count, head_librarian, phone, email, opening_hours, status) VALUES
('BRANCH-MAIN', 'Main Central Library', 'MAIN', 'Main Academic Quad â€¢ 3 Floors', 'Main Campus, Eleyele', 450, 184, 14850, 'Dr. Mrs. A. Balogun', '+234 803 456 7890', 'mainlib@fccibadan.edu.ng', '8:00 AM â€“ 8:00 PM', 'Online'),
('BRANCH-ICT', 'ICT & Informatics Digital Library', 'ICT', 'ICT Complex â€¢ Wing B, Ground Floor', 'Main Campus, Eleyele', 160, 78, 4200, 'Engr. D. K. Lawal', '+234 802 112 3344', 'ictlib@fccibadan.edu.ng', '8:00 AM â€“ 9:00 PM', 'Online'),
('BRANCH-BUS', 'Business & Management Library', 'BUS', 'School of Business Building â€¢ Floor 2', 'Main Campus, Eleyele', 120, 45, 3800, 'Mrs. O. M. Adeleke', '+234 805 776 5432', 'bizlib@fccibadan.edu.ng', '8:30 AM â€“ 6:00 PM', 'Online'),
('BRANCH-ACC', 'Accounting & Finance Library', 'ACC', 'ICAN Accredited Finance Center â€¢ Floor 1', 'Annex Campus', 90, 32, 2900, 'Mr. P. A. Ogundipe (FCA)', '+234 809 332 1100', 'acclib@fccibadan.edu.ng', '8:30 AM â€“ 6:00 PM', 'Online'),
('BRANCH-DEPT', 'Departmental & Co-operative Extension Library', 'DEPT', 'CEM Faculty Hall â€¢ Room 104', 'Main Campus, Eleyele', 75, 28, 1850, 'Dr. Mrs. F. A. Babalola', '+234 807 554 2211', 'cemlib@fccibadan.edu.ng', '9:00 AM â€“ 5:00 PM', 'Online');

-- 5. Seed Shelves with QR Coordinates (Module 32)
INSERT INTO shelves (id, branch_id, shelf_code, floor, aisle, call_number_start, call_number_end, qr_code, capacity, current_count, status) VALUES
('SHELF-FL1-A1', 'BRANCH-MAIN', 'FL1-A1-CEM', 1, 'Aisle 1', 'HD2951', 'HD3500', 'QR-SHELF-FL1-A1', 120, 84, 'Active'),
('SHELF-FL1-A2', 'BRANCH-MAIN', 'FL1-A2-ACC', 1, 'Aisle 2', 'HF5601', 'HF5689', 'QR-SHELF-FL1-A2', 120, 96, 'Active'),
('SHELF-FL2-B1', 'BRANCH-MAIN', 'FL2-B1-CS', 2, 'Aisle 1', 'QA76', 'QA76.9', 'QR-SHELF-FL2-B1', 150, 110, 'Active'),
('SHELF-FL2-B2', 'BRANCH-MAIN', 'FL2-B2-AGR', 2, 'Aisle 2', 'S560', 'S590', 'QR-SHELF-FL2-B2', 100, 65, 'Active'),
('SHELF-FL3-C1', 'BRANCH-MAIN', 'FL3-C1-REF', 3, 'Aisle 1', 'Z1000', 'Z8000', 'QR-SHELF-FL3-C1', 80, 72, 'Active');

-- 6. Seed Core Bibliographic Holdings
INSERT INTO books (id, title, subtitle, author, publisher, year, isbn, subject, department, call_number, shelf_location, format, is_digital, pdf_pages, copies_total, copies_available, abstract) VALUES
('FCC-B001', 'Principles of Modern Co-operative Economics & Management', 'An Empirical West African Analysis', 'Dr. K. O. Okonjo & Prof. Adeyemi', 'FCC Academic Press', 2026, '978-978-8120-44-1', 'Co-operative Economics', 'Co-operative Economics & Management', 'HD2963 .O38 2026', 'Floor 1 â€¢ Aisle 1 â€¢ Shelf 04', 'Book', 1, 384, 5, 4, 'Comprehensive theoretical and practical exploration of credit unions, apex cooperatives, and agricultural finance.'),
('FCC-B002', 'Computer Networks: Principles and Protocols', '5th Edition Higher Education Textbook', 'Andrew S. Tanenbaum & David J. Wetherall', 'Pearson Education', 2024, '978-0132126953', 'Computer Science', 'Computer Science', 'TK5105.5 .T36 2024', 'Floor 2 â€¢ Aisle 1 â€¢ Shelf 12B', 'Book', 1, 960, 4, 3, 'Foundational networking textbook covering physical, data link, routing, transport and application layers.'),
('FCC-PDF-3779', 'Cooperative Banking & Financial Inclusion in Nigeria', 'Monograph and Policy Framework', 'Prof. O. A. Adebayo', 'University Press Plc', 2025, '978-978-940-112-9', 'Banking & Finance', 'Banking & Finance', 'HG2039 .N6 A34 2025', 'Floor 1 â€¢ Aisle 2 â€¢ Shelf 08', 'E-Book', 1, 412, 6, 6, 'A treatise on mobile banking adoption, microfinance credit limits, and rural apex unions.');

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
