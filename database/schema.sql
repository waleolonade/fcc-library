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
