-- =========================================================================
-- DATABASE SCHEMA: brainfeels_library
-- Enterprise Relational Schema for Federal Co-operative College Smart Library
-- =========================================================================

-- 1. Branches & Multi-Campus Libraries
CREATE TABLE IF NOT EXISTS branches (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_code VARCHAR(50),
    location VARCHAR(255),
    campus VARCHAR(100),
    seats INT DEFAULT 100,
    current_occupancy INT DEFAULT 0,
    holdings_count INT DEFAULT 0,
    head_librarian VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(100),
    opening_hours VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Online',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Patrons (Students, Faculty, Staff)
CREATE TABLE IF NOT EXISTS patrons (
    id VARCHAR(50) PRIMARY KEY,
    matric VARCHAR(100) UNIQUE NOT NULL,
    library_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- student, faculty, staff, visitor
    category VARCHAR(100),
    department VARCHAR(150),
    faculty VARCHAR(150),
    level VARCHAR(50),
    programme VARCHAR(100),
    email VARCHAR(150),
    phone VARCHAR(50),
    pin VARCHAR(10) NOT NULL DEFAULT '1234',
    pin_created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Active',
    borrow_quota INT DEFAULT 5,
    active_loans_count INT DEFAULT 0,
    overdue_count INT DEFAULT 0,
    outstanding_fines DECIMAL(10, 2) DEFAULT 0.00,
    clearance_status VARCHAR(100) DEFAULT 'Active Student',
    registered_branch VARCHAR(255),
    valid_until DATE,
    photo_url TEXT,
    research_interests TEXT, -- JSON Array or comma separated
    orcid VARCHAR(50),
    profile_completion INT DEFAULT 90,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Patron Policies
CREATE TABLE IF NOT EXISTS patron_policies (
    role VARCHAR(50) PRIMARY KEY,
    max_borrow_limit INT NOT NULL,
    loan_duration_days INT NOT NULL,
    daily_fine_rate DECIMAL(10, 2) NOT NULL,
    reserve_limit INT NOT NULL,
    digital_access_enabled BOOLEAN DEFAULT TRUE,
    study_room_quota_hours INT DEFAULT 4,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Catalog Books & Digital Monograph Documents
CREATE TABLE IF NOT EXISTS books (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    subtitle VARCHAR(500),
    author VARCHAR(255) NOT NULL,
    author_credentials VARCHAR(255),
    author_affiliation VARCHAR(255),
    orcid VARCHAR(50),
    co_authors TEXT,
    subject VARCHAR(255),
    department VARCHAR(150),
    course_code VARCHAR(50),
    target_level VARCHAR(50),
    branch VARCHAR(255),
    shelf_location VARCHAR(100),
    call_number VARCHAR(100),
    isbn VARCHAR(50),
    doi VARCHAR(100),
    publisher VARCHAR(255),
    year INT,
    edition VARCHAR(100),
    pdf_pages INT DEFAULT 0,
    file_size VARCHAR(50),
    file_name VARCHAR(255),
    file_data_url TEXT,
    external_url TEXT,
    is_digital BOOLEAN DEFAULT FALSE,
    access_level VARCHAR(100) DEFAULT 'Open Access Full-Text',
    rights_status VARCHAR(150),
    copies_total INT DEFAULT 1,
    copies_available INT DEFAULT 1,
    rating DECIMAL(3, 1) DEFAULT 5.0,
    citations INT DEFAULT 0,
    abstract TEXT,
    keywords TEXT, -- JSON array
    chapters TEXT, -- JSON array of { title, page, endPage }
    references_data TEXT, -- JSON array of references
    reference_style VARCHAR(50),
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    uploaded_by VARCHAR(255)
);

-- 5. Academic Courses & Reserves
CREATE TABLE IF NOT EXISTS courses (
    code VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    department VARCHAR(150),
    faculty VARCHAR(150),
    level VARCHAR(50),
    semester VARCHAR(50),
    lecturer VARCHAR(255),
    enrolled_students INT DEFAULT 0,
    required_texts TEXT, -- JSON Array of book IDs or objects
    recommended_texts TEXT, -- JSON Array
    past_exams TEXT, -- JSON Array of past question papers
    lecture_packs TEXT -- JSON Array
);

-- 6. Loans (Physical Book Borrowings)
CREATE TABLE IF NOT EXISTS loans (
    id VARCHAR(50) PRIMARY KEY,
    matric VARCHAR(100) NOT NULL,
    patron_name VARCHAR(255) NOT NULL,
    book_id VARCHAR(50) NOT NULL,
    book_title VARCHAR(500) NOT NULL,
    author VARCHAR(255),
    call_number VARCHAR(100),
    branch VARCHAR(255),
    borrow_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE,
    renewal_count INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Active', -- Active, Overdue, Returned
    fine_amount DECIMAL(10, 2) DEFAULT 0.00,
    rfid_tag VARCHAR(100),
    FOREIGN KEY (matric) REFERENCES patrons(matric),
    FOREIGN KEY (book_id) REFERENCES books(id)
);

-- 7. Book Reservations
CREATE TABLE IF NOT EXISTS reservations (
    id VARCHAR(50) PRIMARY KEY,
    matric VARCHAR(100) NOT NULL,
    patron_name VARCHAR(255) NOT NULL,
    book_id VARCHAR(50) NOT NULL,
    book_title VARCHAR(500) NOT NULL,
    call_number VARCHAR(100),
    reserved_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, Ready For Pickup, Fulfilled, Expired
    pickup_branch VARCHAR(255),
    queue_position INT DEFAULT 1,
    FOREIGN KEY (matric) REFERENCES patrons(matric),
    FOREIGN KEY (book_id) REFERENCES books(id)
);

-- 8. Student Reading Lists
CREATE TABLE IF NOT EXISTS reading_lists (
    id VARCHAR(50) PRIMARY KEY,
    matric VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    item_count INT DEFAULT 0,
    items TEXT, -- JSON array of items
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (matric) REFERENCES patrons(matric)
);

-- 9. Continue Reading (E-Book Bookmarks)
CREATE TABLE IF NOT EXISTS continue_reading (
    id VARCHAR(50) PRIMARY KEY,
    matric VARCHAR(100) NOT NULL,
    book_id VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    author VARCHAR(255),
    last_page INT DEFAULT 1,
    total_pages INT DEFAULT 1,
    progress INT DEFAULT 0,
    last_opened VARCHAR(100),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (matric) REFERENCES patrons(matric),
    FOREIGN KEY (book_id) REFERENCES books(id)
);

-- 10. Institutional Theses & Dissertations
CREATE TABLE IF NOT EXISTS theses (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    author VARCHAR(255) NOT NULL,
    matric VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    advisor VARCHAR(255),
    department VARCHAR(150),
    faculty VARCHAR(150),
    degree VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Published', -- Draft, Submitted, Under Review, Approved, Published, Rejected
    access VARCHAR(100) DEFAULT 'Open Access Full-Text',
    downloads INT DEFAULT 0,
    citations INT DEFAULT 0,
    doi VARCHAR(100),
    file_size VARCHAR(50),
    file_name VARCHAR(255),
    abstract TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 11. Study Rooms & Pods
CREATE TABLE IF NOT EXISTS study_rooms (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    branch VARCHAR(255) NOT NULL,
    capacity INT DEFAULT 4,
    type VARCHAR(100),
    amenities TEXT, -- JSON array
    status VARCHAR(50) DEFAULT 'Available',
    available_today VARCHAR(100)
);

-- 12. Room Bookings
CREATE TABLE IF NOT EXISTS room_bookings (
    id VARCHAR(50) PRIMARY KEY,
    matric VARCHAR(100) NOT NULL,
    room_id VARCHAR(50) NOT NULL,
    room_name VARCHAR(100) NOT NULL,
    branch VARCHAR(255),
    date DATE NOT NULL,
    time_slot VARCHAR(100) NOT NULL,
    duration_hours INT DEFAULT 2,
    purpose VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Confirmed',
    check_in_code VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (matric) REFERENCES patrons(matric),
    FOREIGN KEY (room_id) REFERENCES study_rooms(id)
);

-- 13. Acquisitions & Procurement
CREATE TABLE IF NOT EXISTS acquisitions (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    author VARCHAR(255) NOT NULL,
    publisher VARCHAR(255),
    isbn VARCHAR(50),
    department VARCHAR(150),
    requested_by VARCHAR(255),
    requester_role VARCHAR(100),
    cost_estimate_ngn DECIMAL(12, 2),
    copies_requested INT DEFAULT 1,
    status VARCHAR(100) DEFAULT 'Pending Dean Approval',
    date_requested DATE,
    priority VARCHAR(50) DEFAULT 'High',
    justification TEXT
);

-- 14. Partner Consortia Libraries
CREATE TABLE IF NOT EXISTS partner_libraries (
    id VARCHAR(50) PRIMARY KEY,
    institution VARCHAR(255) NOT NULL,
    country VARCHAR(100) DEFAULT 'Nigeria',
    opac_url TEXT NOT NULL,
    z3950_host VARCHAR(255),
    port INT,
    database_name VARCHAR(100),
    active_holdings INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Connected',
    sync_mode VARCHAR(100) DEFAULT 'Live Federated Search'
);

-- 15. Serials & Periodicals (ISSN)
CREATE TABLE IF NOT EXISTS serials (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    issn VARCHAR(50) NOT NULL,
    publisher VARCHAR(255),
    frequency VARCHAR(50),
    department VARCHAR(150),
    latest_volume VARCHAR(50),
    latest_issue VARCHAR(50),
    holding_summary TEXT,
    subscription_status VARCHAR(50) DEFAULT 'Active'
);

-- 16. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    actor VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(100),
    details TEXT,
    ip_address VARCHAR(50),
    hash VARCHAR(100)
);

-- 17. Notifications & Announcements
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    matric VARCHAR(100),
    type VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    date VARCHAR(50),
    read BOOLEAN DEFAULT FALSE,
    action_url TEXT
);

CREATE TABLE IF NOT EXISTS announcements (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    priority VARCHAR(50) DEFAULT 'Normal',
    author VARCHAR(255),
    date VARCHAR(50),
    valid_until VARCHAR(50)
);
