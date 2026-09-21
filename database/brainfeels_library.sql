-- =========================================================================
-- DATABASE: brainfeels_library
-- Complete SQL Dump & Initializer for Federal Co-operative College Smart Library
-- Compatible with MySQL, PostgreSQL, SQLite, MariaDB
-- Generated At: 2026-09-18T16:08:01.706Z
-- =========================================================================

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


-- =========================================================================
-- SEED DATA & RECORD INSERTIONS
-- =========================================================================

-- Table: branches (7 rows)
INSERT OR REPLACE INTO branches (id, name, short_code, location, campus, seats, current_occupancy, holdings_count, head_librarian, phone, email, opening_hours, status, created_at) VALUES ('BR-MAIN', 'Main Campus Library (Prof. Hezekiah Complex)', NULL, 'Central Campus Quadrangle', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-18 16:07:47');
INSERT OR REPLACE INTO branches (id, name, short_code, location, campus, seats, current_occupancy, holdings_count, head_librarian, phone, email, opening_hours, status, created_at) VALUES ('BR-ENG', 'Faculty of Engineering Library', NULL, 'Engineering Block B, Level 1', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-18 16:07:47');
INSERT OR REPLACE INTO branches (id, name, short_code, location, campus, seats, current_occupancy, holdings_count, head_librarian, phone, email, opening_hours, status, created_at) VALUES ('BR-SCI', 'Faculty of Science & Computing Library', NULL, 'Science Complex, East Wing', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-18 16:07:47');
INSERT OR REPLACE INTO branches (id, name, short_code, location, campus, seats, current_occupancy, holdings_count, head_librarian, phone, email, opening_hours, status, created_at) VALUES ('BR-MED', 'Medical & Health Sciences Library', NULL, 'Health Tech Pavilion', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-18 16:07:47');
INSERT OR REPLACE INTO branches (id, name, short_code, location, campus, seats, current_occupancy, holdings_count, head_librarian, phone, email, opening_hours, status, created_at) VALUES ('BR-LAW', 'Law & Administrative Library', NULL, 'Management Sciences Complex', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-18 16:07:47');
INSERT OR REPLACE INTO branches (id, name, short_code, location, campus, seats, current_occupancy, holdings_count, head_librarian, phone, email, opening_hours, status, created_at) VALUES ('BR-DIGI', 'E-Library & Virtual Innovation Commons', NULL, 'ICT Directorate Centre', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-18 16:07:47');
INSERT OR REPLACE INTO branches (id, name, short_code, location, campus, seats, current_occupancy, holdings_count, head_librarian, phone, email, opening_hours, status, created_at) VALUES ('BR-RES', 'Postgraduate & Research Depository', NULL, 'Senate Building Annex', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-18 16:07:47');

-- Table: patron_policies (4 rows)
INSERT OR REPLACE INTO patron_policies (role, max_borrow_limit, loan_duration_days, daily_fine_rate, reserve_limit, digital_access_enabled, study_room_quota_hours, updated_at) VALUES ('student', 5, 14, 100, 3, 1, 4, '2026-09-18 16:07:47');
INSERT OR REPLACE INTO patron_policies (role, max_borrow_limit, loan_duration_days, daily_fine_rate, reserve_limit, digital_access_enabled, study_room_quota_hours, updated_at) VALUES ('lecturer', 12, 60, 100, 10, 1, 4, '2026-09-18 16:07:47');
INSERT OR REPLACE INTO patron_policies (role, max_borrow_limit, loan_duration_days, daily_fine_rate, reserve_limit, digital_access_enabled, study_room_quota_hours, updated_at) VALUES ('researcher', 15, 90, 100, 10, 1, 4, '2026-09-18 16:07:47');
INSERT OR REPLACE INTO patron_policies (role, max_borrow_limit, loan_duration_days, daily_fine_rate, reserve_limit, digital_access_enabled, study_room_quota_hours, updated_at) VALUES ('guest', 2, 7, 200, 1, 1, 4, '2026-09-18 16:07:47');

-- Table: patrons (4 rows)
INSERT OR REPLACE INTO patrons (id, matric, library_id, name, role, category, department, faculty, level, programme, email, phone, pin, pin_created_at, status, borrow_quota, active_loans_count, overdue_count, outstanding_fines, clearance_status, registered_branch, valid_until, photo_url, research_interests, orcid, profile_completion, created_at) VALUES ('PAT-001', 'FCC/CEM/2024/042', 'LIB-FCC-42091', 'Wale Olonade', 'student', 'Undergraduate Scholar', 'Co-operative Economics & Management', 'Faculty of Management Sciences', 'HND II (Final Year)', 'Higher National Diploma', 'w.olonade@student.fccibadan.edu.ng', '+234 803 491 8821', '1234', '2026-09-01T10:00:00Z', 'Active', 5, 1, 0, 0, 'Pending Library Signature', 'Main Campus Library', '2027-11-30', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80', '["Cooperative Fintech","Smallholder Agronomy","Micro-Credit Syndicates"]', '0009-0004-8192-4410', 92, '2026-09-18 16:07:47');
INSERT OR REPLACE INTO patrons (id, matric, library_id, name, role, category, department, faculty, level, programme, email, phone, pin, pin_created_at, status, borrow_quota, active_loans_count, overdue_count, outstanding_fines, clearance_status, registered_branch, valid_until, photo_url, research_interests, orcid, profile_completion, created_at) VALUES ('PAT-002', 'FCC/CEM/2024/011', 'LIB-FCC-42092', 'Ibrahim Adekunle', 'student', 'Undergraduate Scholar', 'Co-operative Economics & Management', 'Faculty of Management Sciences', 'HND II (Final Year)', 'Higher National Diploma', 'i.adekunle@student.fccibadan.edu.ng', '+234 812 345 6789', '5678', '2026-09-01T10:00:00Z', 'Active', 5, 1, 1, 300, 'Fines Pending Clearance', 'Main Campus Library', '2027-11-30', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80', '["Agricultural Credit","Rural Cooperatives"]', '0009-0002-1192-3321', 85, '2026-09-18 16:07:47');
INSERT OR REPLACE INTO patrons (id, matric, library_id, name, role, category, department, faculty, level, programme, email, phone, pin, pin_created_at, status, borrow_quota, active_loans_count, overdue_count, outstanding_fines, clearance_status, registered_branch, valid_until, photo_url, research_interests, orcid, profile_completion, created_at) VALUES ('PAT-003', 'FCC/CSC/2024/108', 'LIB-FCC-42093', 'Chukwudi Okafor', 'student', 'Undergraduate Scholar', 'Computer Science', 'Faculty of Science & Computing', 'ND II', 'National Diploma', 'c.okafor@student.fccibadan.edu.ng', '+234 809 888 1234', '4321', '2026-09-02T11:00:00Z', 'Active', 5, 1, 0, 0, 'Active Student', 'E-Library & Virtual Commons', '2027-08-31', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80', '["Distributed Systems","Database Optimization","AI Search"]', '0009-0008-3341-9012', 95, '2026-09-18 16:07:47');
INSERT OR REPLACE INTO patrons (id, matric, library_id, name, role, category, department, faculty, level, programme, email, phone, pin, pin_created_at, status, borrow_quota, active_loans_count, overdue_count, outstanding_fines, clearance_status, registered_branch, valid_until, photo_url, research_interests, orcid, profile_completion, created_at) VALUES ('PAT-004', 'FCC/BNF/2024/077', 'LIB-FCC-42094', 'Amina Bello', 'student', 'Undergraduate Scholar', 'Banking & Finance', 'Faculty of Management Sciences', 'HND I', 'Higher National Diploma', 'a.bello@student.fccibadan.edu.ng', '+234 806 777 9900', '2468', '2026-09-03T09:30:00Z', 'Active', 5, 0, 0, 0, 'Active Student', 'Main Campus Library', '2028-06-30', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80', '["Microfinance Risk","Fintech Innovations"]', '0009-0001-4455-7788', 88, '2026-09-18 16:07:47');

-- Table: books (8 rows)
INSERT OR REPLACE INTO books (id, title, subtitle, author, author_credentials, author_affiliation, orcid, co_authors, subject, department, course_code, target_level, branch, shelf_location, call_number, isbn, doi, publisher, year, edition, pdf_pages, file_size, file_name, file_data_url, external_url, is_digital, access_level, rights_status, copies_total, copies_available, rating, citations, abstract, keywords, chapters, references_data, reference_style, uploaded_at, uploaded_by) VALUES ('FCC-B001', 'Principles and Practice of Co-operative Economics', 'Empirical Models, Statutory Reserves & Apex Syndicate Accounting', 'Prof. A. O. Adebayo', 'Ph.D., FSNA, Professor of Cooperative Econometrics', 'Federal Co-operative College, Ibadan', '', 'Dr. B. A. Olowookere, Chief M. K. Balogun', 'Co-operative Economics', 'Co-operative Economics & Management', 'CEM 411', 'HND II', 'Main Campus Library (Prof. Hezekiah Complex)', 'Floor 2 • Aisle 4 • Shelf 12B', 'HD2963 .A34 2024', '978-978-49021-1-4', '10.1016/j.coop.2024.01.002', 'FCC Ibadan Academic Press', 2024, '4th Revised Edition', 384, '6.4 MB', 'principles-of-cooperative-economics.pdf', '', '', 1, 'Open Access Full-Text', '', 12, 7, 4.9, 84, 'Comprehensive analysis of modern agrarian credit unions, apex cooperatives, and fiscal regulatory mechanisms in West Africa with empirical data from Nigerian apexes.', '[]', '[{"title":"Chapter 1: Foundational Frameworks of Raiffeisen & Schulze Credit Unions","page":1},{"title":"Chapter 2: Financial Ratios & Liquidity Stress in Cooperatives","page":48},{"title":"Chapter 3: Risk Hedging & Apex Syndicate Accounting","page":112},{"title":"Chapter 4: Modern Statutory Reserves & Audit Protocols","page":230},{"title":"Chapter 5: Digital Value Chains & Fair-Trade Settlement","page":310}]', '[]', 'APA 7th', '2026-09-18T16:07:47.720Z', 'Cataloging Authority');
INSERT OR REPLACE INTO books (id, title, subtitle, author, author_credentials, author_affiliation, orcid, co_authors, subject, department, course_code, target_level, branch, shelf_location, call_number, isbn, doi, publisher, year, edition, pdf_pages, file_size, file_name, file_data_url, external_url, is_digital, access_level, rights_status, copies_total, copies_available, rating, citations, abstract, keywords, chapters, references_data, reference_style, uploaded_at, uploaded_by) VALUES ('FCC-B002', 'Distributed Database Systems & High-Throughput SQL', 'Consensus Protocols, Multi-Master Replication & Cloud Vector Indices', 'Dr. K. E. Okonjo & M. Stone', 'Ph.D., Lead Systems Architect & ACM Fellow', 'Federal Co-operative College & MIT Distributed Lab', '', 'Prof. S. N. Varma', 'Computer Science', 'Computer Science', 'CSC 301', 'ND II / HND I', 'Faculty of Science & Computing Library', 'Floor 1 • Aisle 2 • Shelf 05A', 'QA76.9.D3 O38 2025', '978-0-13-449416-6', '10.1145/3318464.3389700', 'Prentice Hall International', 2025, '3rd Edition', 512, '8.8 MB', 'distributed-database-systems.pdf', '', '', 1, 'Open Access Full-Text', '', 8, 2, 4.8, 192, 'Covers consensus protocols, Raft, multi-region replication, transaction isolation levels, and ACID compliance under network partitions with practical Postgres/Cassandra case studies.', '[]', '[{"title":"Chapter 1: Transaction Processing & Serializability Theory","page":1},{"title":"Chapter 2: The Raft Consensus Algorithm & Quorum Replications","page":65},{"title":"Chapter 3: Distributed Query Optimization & Indexing","page":140},{"title":"Chapter 4: PostgreSQL Multi-Master Architectures & CDC Pipelines","page":245},{"title":"Chapter 5: Vector Indexing (HNSW) for AI Retrieval","page":380}]', '[]', 'APA 7th', '2026-09-18T16:07:47.731Z', 'Cataloging Authority');
INSERT OR REPLACE INTO books (id, title, subtitle, author, author_credentials, author_affiliation, orcid, co_authors, subject, department, course_code, target_level, branch, shelf_location, call_number, isbn, doi, publisher, year, edition, pdf_pages, file_size, file_name, file_data_url, external_url, is_digital, access_level, rights_status, copies_total, copies_available, rating, citations, abstract, keywords, chapters, references_data, reference_style, uploaded_at, uploaded_by) VALUES ('FCC-B003', 'Macro-prudential Banking Reforms & Risk Hedging', 'Non-Performing Loan Resolution, Basel III Capital Adequacy & Microfinance', 'Chief (Mrs.) Folake Sanusi', 'M.Sc., FCIB, Fellow of the Chartered Institute of Bankers', 'Federal Co-operative College, Ibadan', '', 'H. L. Babatunde', 'Banking & Finance', 'Banking & Finance', 'BNF 302', 'HND I', 'Law & Administrative Library', 'Floor 2 • Aisle 1 • Shelf 08C', 'HG1601 .S26 2023', '978-978-8120-44-1', '10.1080/09603107.2023.119', 'University of Ibadan Press', 2023, '2nd Edition', 290, '4.2 MB', 'macro-prudential-banking-reforms.pdf', '', '', 0, 'Open Access Full-Text', '', 15, 11, 4.6, 45, 'Examination of non-performing loan management, Basel III framework implementations, and sub-Saharan microfinance resilience amid inflationary pressures.', '[]', '[{"title":"Chapter 1: Evolution of Nigerian Banking Regulatory Directives","page":1},{"title":"Chapter 2: Basel III Capital Adequacy & Liquidity Coverage Ratios","page":50},{"title":"Chapter 3: Stress-Testing Credit Portfolios in Developing Markets","page":120},{"title":"Chapter 4: Derivatives & FX Forward Hedging for Agribusinesses","page":200}]', '[]', 'APA 7th', '2026-09-18T16:07:47.736Z', 'Cataloging Authority');
INSERT OR REPLACE INTO books (id, title, subtitle, author, author_credentials, author_affiliation, orcid, co_authors, subject, department, course_code, target_level, branch, shelf_location, call_number, isbn, doi, publisher, year, edition, pdf_pages, file_size, file_name, file_data_url, external_url, is_digital, access_level, rights_status, copies_total, copies_available, rating, citations, abstract, keywords, chapters, references_data, reference_style, uploaded_at, uploaded_by) VALUES ('FCC-B004', 'Cocoa Agronomy & Smallholder Value-Chain Mechanics', 'Soil Biochemistry, Pest Mitigation & Cooperative Export Logistics', 'Engr. T. J. Adeleke', 'Ph.D., Agricultural Extension Specialist', 'Federal Co-operative College, Ibadan', '', 'Dr. O. Alabi', 'Agricultural Extension', 'Agricultural Extension & Management', 'AGE 201', 'ND II', 'Main Campus Library (Prof. Hezekiah Complex)', 'Floor 3 • Aisle 6 • Shelf 19A', 'SB267 .A43 2024', '978-978-3012-88-0', '10.1007/s10460-024-0982-1', 'Agronomic Research Publications', 2024, '1st Edition', 440, '7.9 MB', 'cocoa-agronomy-value-chain.pdf', '', '', 1, 'Open Access Full-Text', '', 6, 1, 4.7, 63, 'Soil biochemistry, fungal blight mitigation, post-harvest solar drying paradigms, and cooperative export consortium tactics for premium West African cocoa beans.', '[]', '[{"title":"Chapter 1: Soil Pedology and Micro-nutrient Regimes for Theobroma Cacao","page":1},{"title":"Chapter 2: Integrated Pest Management & Biological Control Agents","page":85},{"title":"Chapter 3: Fermentation Science and Flavor Precursor Synthesis","page":190},{"title":"Chapter 4: Fair-Trade Certification and Cooperative Export Logistics","page":310}]', '[]', 'APA 7th', '2026-09-18T16:07:47.745Z', 'Cataloging Authority');
INSERT OR REPLACE INTO books (id, title, subtitle, author, author_credentials, author_affiliation, orcid, co_authors, subject, department, course_code, target_level, branch, shelf_location, call_number, isbn, doi, publisher, year, edition, pdf_pages, file_size, file_name, file_data_url, external_url, is_digital, access_level, rights_status, copies_total, copies_available, rating, citations, abstract, keywords, chapters, references_data, reference_style, uploaded_at, uploaded_by) VALUES ('FCC-B005', 'Artificial Intelligence in Academic Information Retrieval', 'Vector Search, RAG Pipelines, MARC21 Crosswalks & Transformer Indices', 'Dr. O. J. Fatoyinbo & Prof. S. N. Varma', 'Ph.D., Lead AI Researcher & IEEE Senior Member', 'Federal Co-operative College & Indian Institute of Technology', '', 'Dr. K. E. Okonjo', 'Computer Science', 'Computer Science', 'CSC 301', 'ND II / HND I', 'E-Library & Virtual Commons', 'Floor 1 • Aisle 3 • Shelf 02B', 'Z666.5 .F38 2026', '978-1-5090-4822-9', '10.1109/TKDE.2026.1049281', 'IEEE Computer Society Press', 2026, '1st Edition', 360, '5.5 MB', 'ai-in-academic-information-retrieval.pdf', '', '', 1, 'Open Access Full-Text', '', 10, 6, 4.9, 112, 'Dense vector retrieval, retrieval-augmented generation (RAG) for academic citations, semantic MARC/Dublin Core cross-walking, and transformer-based discovery indices.', '[]', '[{"title":"Chapter 1: Lexical BM25 vs Semantic Vector Embedding Paradigms","page":1},{"title":"Chapter 2: RAG Pipelines & Scholarly Citation Grounding","page":60},{"title":"Chapter 3: LLM Guardrails & Hallucination Prevention in Libraries","page":140},{"title":"Chapter 4: Automated Cataloging & Metadata Extraction Protocols","page":230}]', '[]', 'APA 7th', '2026-09-18T16:07:47.752Z', 'Cataloging Authority');
INSERT OR REPLACE INTO books (id, title, subtitle, author, author_credentials, author_affiliation, orcid, co_authors, subject, department, course_code, target_level, branch, shelf_location, call_number, isbn, doi, publisher, year, edition, pdf_pages, file_size, file_name, file_data_url, external_url, is_digital, access_level, rights_status, copies_total, copies_available, rating, citations, abstract, keywords, chapters, references_data, reference_style, uploaded_at, uploaded_by) VALUES ('FCC-B006', 'Cooperative Law, Governance & Statutory Auditing in Nigeria', 'A Complete Commentary on the Nigerian Co-operative Societies Act', 'Barrister B. A. Olowookere', 'LL.M, BL, Senior Lecturer in Commercial Law', 'Federal Co-operative College, Ibadan', '', 'Hon. Justice T. M. Alabi', 'Co-operative Economics', 'Co-operative Economics & Management', 'CEM 411', 'HND II', 'Law & Administrative Library', 'Floor 2 • Aisle 5 • Shelf 14C', 'KTL982 .O46 2023', '978-978-900-112-9', '10.2139/ssrn.4298102', 'Malthouse Law Books', 2023, '5th Edition', 310, '4.8 MB', 'cooperative-law-governance-nigeria.pdf', '', '', 1, 'Open Access Full-Text', '', 14, 9, 4.7, 38, 'Comprehensive treatise on the Nigerian Co-operative Societies Act, dispute resolution arbitration, bye-law drafting, and director fiduciary duties.', '[]', '[{"title":"Chapter 1: Legal Personality and Registration Formalities","page":1},{"title":"Chapter 2: Bye-Law Drafting, Amendments and Enforceability","page":45},{"title":"Chapter 3: Director Fiduciary Obligations and Surcharges","page":120},{"title":"Chapter 4: Winding-Up and Liquidation Protocols","page":210}]', '[]', 'APA 7th', '2026-09-18T16:07:47.761Z', 'Cataloging Authority');
INSERT OR REPLACE INTO books (id, title, subtitle, author, author_credentials, author_affiliation, orcid, co_authors, subject, department, course_code, target_level, branch, shelf_location, call_number, isbn, doi, publisher, year, edition, pdf_pages, file_size, file_name, file_data_url, external_url, is_digital, access_level, rights_status, copies_total, copies_available, rating, citations, abstract, keywords, chapters, references_data, reference_style, uploaded_at, uploaded_by) VALUES ('FCC-B007', 'Advanced Computer Networks & Cloud Infrastructure', 'Software-Defined Networking, BGP Routing & Edge Security Protocols', 'Prof. S. N. Varma & Dr. A. Bello', 'Ph.D., Senior Network Architect', 'Federal Co-operative College & Cisco Networking Academy', '', 'Engr. Dr. T. J. Adeleke', 'Computer Science', 'Computer Engineering', 'CPE 311', 'HND I', 'Faculty of Engineering Library', 'Floor 1 • Aisle 4 • Shelf 10A', 'TK5105.5 .V37 2025', '978-0-13-892100-2', '10.1109/MCOM.2025.889102', 'Pearson Higher Education', 2025, '2nd Edition', 480, '7.2 MB', 'advanced-computer-networks.pdf', '', '', 1, 'Open Access Full-Text', '', 9, 5, 4.8, 145, 'In-depth treatment of SDN controllers, OpenFlow, zero-trust network architectures, multi-tenant BGP peering, and edge computing for distributed data pipelines.', '[]', '[{"title":"Chapter 1: Physical & Data Link Layer Carrier Technologies","page":1},{"title":"Chapter 2: BGP Routing, Anycast & AS Topology Modeling","page":80},{"title":"Chapter 3: Software-Defined Networking & OpenFlow Planes","page":180},{"title":"Chapter 4: Zero-Trust Network Access (ZTNA) & Cryptographic Handshakes","page":310}]', '[]', 'APA 7th', '2026-09-18T16:07:47.769Z', 'Cataloging Authority');
INSERT OR REPLACE INTO books (id, title, subtitle, author, author_credentials, author_affiliation, orcid, co_authors, subject, department, course_code, target_level, branch, shelf_location, call_number, isbn, doi, publisher, year, edition, pdf_pages, file_size, file_name, file_data_url, external_url, is_digital, access_level, rights_status, copies_total, copies_available, rating, citations, abstract, keywords, chapters, references_data, reference_style, uploaded_at, uploaded_by) VALUES ('FCC-B008', 'Microcontroller System Design & Embedded C Programming', 'ARM Cortex-M Hardware Timers, DMA Buffering & Real-Time Kernels', 'Engr. Dr. K. O. Adeleke', 'Ph.D., COREN Registered Engineer', 'Faculty of Engineering, FCC Ibadan', '', 'Engr. T. J. Adeleke', 'Computer Engineering', 'Computer Engineering', 'EEE 305', 'ND II', 'Faculty of Engineering Library', 'Floor 2 • Aisle 2 • Shelf 04B', 'TJ223.M53 A34 2024', '978-978-5501-99-8', '10.1007/978-3-030-98102-1', 'FCC Engineering Academic Press', 2024, '1st Edition', 390, '6.1 MB', 'microcontroller-system-design.pdf', '', '', 1, 'Open Access Full-Text', '', 10, 4, 4.8, 72, 'Practical embedded system engineering using 32-bit ARM microcontrollers, FreeRTOS scheduling, ADC direct memory access, and IoT telemetry over LoRaWAN.', '[]', '[{"title":"Chapter 1: ARM Cortex-M Memory Map & Core Registers","page":1},{"title":"Chapter 2: GPIO, Hardware Timers & PWM Waveform Generation","page":55},{"title":"Chapter 3: Interrupt Service Routines & Direct Memory Access (DMA)","page":130},{"title":"Chapter 4: FreeRTOS Real-Time Kernel Tasks & Semaphores","page":220}]', '[]', 'APA 7th', '2026-09-18T16:07:47.783Z', 'Cataloging Authority');

-- Table: courses (6 rows)
INSERT OR REPLACE INTO courses (code, title, department, faculty, level, semester, lecturer, enrolled_students, required_texts, recommended_texts, past_exams, lecture_packs) VALUES ('CSC 301', 'Database Systems & Distributed Architectures', 'Computer Science', 'Faculty of Science & Computing', 'ND II / HND I', NULL, 'Dr. K. E. Okonjo', NULL, '[]', '[]', '[]', '[]');
INSERT OR REPLACE INTO courses (code, title, department, faculty, level, semester, lecturer, enrolled_students, required_texts, recommended_texts, past_exams, lecture_packs) VALUES ('EEE 305', 'Digital Electronics & Embedded Microcontrollers', 'Computer Engineering', 'Faculty of Engineering', 'ND II', NULL, 'Engr. Dr. T. J. Adeleke', NULL, '[]', '[]', '[]', '[]');
INSERT OR REPLACE INTO courses (code, title, department, faculty, level, semester, lecturer, enrolled_students, required_texts, recommended_texts, past_exams, lecture_packs) VALUES ('CPE 311', 'Computer Architecture & Organization', 'Computer Engineering', 'Faculty of Engineering', 'HND I', NULL, 'Prof. S. N. Varma', NULL, '[]', '[]', '[]', '[]');
INSERT OR REPLACE INTO courses (code, title, department, faculty, level, semester, lecturer, enrolled_students, required_texts, recommended_texts, past_exams, lecture_packs) VALUES ('CEM 411', 'Advanced Co-operative Management & Digital E-Commerce', 'Co-operative Economics & Management', 'Faculty of Management Sciences', 'HND II', NULL, 'Prof. A. O. Adebayo', NULL, '[]', '[]', '[]', '[]');
INSERT OR REPLACE INTO courses (code, title, department, faculty, level, semester, lecturer, enrolled_students, required_texts, recommended_texts, past_exams, lecture_packs) VALUES ('BNF 302', 'Agricultural Credit & Micro-Finance Banking', 'Banking & Finance', 'Faculty of Management Sciences', 'HND I', NULL, 'Chief (Mrs.) Folake Sanusi', NULL, '[]', '[]', '[]', '[]');
INSERT OR REPLACE INTO courses (code, title, department, faculty, level, semester, lecturer, enrolled_students, required_texts, recommended_texts, past_exams, lecture_packs) VALUES ('AGE 201', 'Principles of Agricultural Extension & Rural Sociology', 'Agricultural Extension & Management', 'Faculty of Agricultural Sciences', 'ND II', NULL, 'Engr. T. J. Adeleke', NULL, '[]', '[]', '[]', '[]');

-- Table: loans (4 rows)
INSERT OR REPLACE INTO loans (id, matric, patron_name, book_id, book_title, author, call_number, branch, borrow_date, due_date, return_date, renewal_count, status, fine_amount, rfid_tag) VALUES ('LN-9821', 'FCC/CEM/2024/042', 'Wale Olonade', 'FCC-B001', 'Principles and Practice of Co-operative Economics', 'Prof. A. O. Adebayo', 'HD2963 .A34 2024', 'Main Campus Library (Prof. Hezekiah Complex)', '2026-09-10', '2026-09-24', NULL, 0, 'Active', 0, 'FCC-CP-00102');
INSERT OR REPLACE INTO loans (id, matric, patron_name, book_id, book_title, author, call_number, branch, borrow_date, due_date, return_date, renewal_count, status, fine_amount, rfid_tag) VALUES ('LN-9822', 'FCC/CEM/2024/042', 'Wale Olonade', 'FCC-B006', 'Cooperative Law, Governance & Statutory Auditing in Nigeria', 'Barrister B. A. Olowookere', 'KTL982 .O46 2023', 'Law & Administrative Library', '2026-09-08', '2026-09-22', NULL, 0, 'Active', 0, 'FCC-CP-00601');
INSERT OR REPLACE INTO loans (id, matric, patron_name, book_id, book_title, author, call_number, branch, borrow_date, due_date, return_date, renewal_count, status, fine_amount, rfid_tag) VALUES ('LN-9823', 'FCC/CSC/2024/108', 'Chukwudi Okafor', 'FCC-B002', 'Distributed Database Systems & High-Throughput SQL', 'Dr. K. E. Okonjo & M. Stone', 'QA76.9.D3 O38 2025', 'Faculty of Science & Computing Library', '2026-09-12', '2026-09-26', NULL, 0, 'Active', 0, 'FCC-CP-00201');
INSERT OR REPLACE INTO loans (id, matric, patron_name, book_id, book_title, author, call_number, branch, borrow_date, due_date, return_date, renewal_count, status, fine_amount, rfid_tag) VALUES ('LN-9820', 'FCC/CEM/2024/011', 'Ibrahim Adekunle', 'FCC-B004', 'Cocoa Agronomy & Smallholder Value-Chain Mechanics', 'Engr. T. J. Adeleke', 'SB267 .A43 2024', 'Main Campus Library (Prof. Hezekiah Complex)', '2026-08-20', '2026-09-03', NULL, 0, 'Overdue', 300, 'FCC-CP-00401');

-- Table: reservations (2 rows)
INSERT OR REPLACE INTO reservations (id, matric, patron_name, book_id, book_title, call_number, reserved_date, expiry_date, status, pickup_branch, queue_position) VALUES ('RES-2026-01', 'FCC/CEM/2024/042', 'Scholar', 'FCC-B004', 'Cocoa Agronomy & Smallholder Value-Chain Mechanics', '', '2026-09-14', '2026-09-22', 'Available', 'Main Campus Library • Circulation Desk Bay 2', 1);
INSERT OR REPLACE INTO reservations (id, matric, patron_name, book_id, book_title, call_number, reserved_date, expiry_date, status, pickup_branch, queue_position) VALUES ('RES-2026-02', 'FCC/CEM/2024/042', 'Scholar', 'FCC-B002', 'Distributed Database Systems & High-Throughput SQL', '', '2026-09-16', '2026-09-30', 'Waiting', 'Faculty of Science & Computing Library', 2);

-- Table: theses (4 rows)
INSERT OR REPLACE INTO theses (id, title, author, matric, year, advisor, department, faculty, degree, status, access, downloads, citations, doi, file_size, file_name, abstract, submitted_at) VALUES ('TH-2025-019', 'Impact of Micro-Credit Cooperatives on Cocoa Smallholders in Ondo & Oyo States', 'Adebayo, Samuel T.', 'FCC/CEM/2023/019', 2025, 'Prof. O. Alabi', 'Co-operative Economics & Management', 'Faculty of Management Sciences', 'Higher National Diploma Dissertation', 'Published', 'Open Access Full-Text', 342, 14, '10.5281/zenodo.10842911', '5.1 MB', 'adebayo_samuel_2025_dissertation.pdf', 'Empirical field survey of 420 smallholder farming families across Idanre and Iddo Local Government Areas. Findings demonstrate a 34% income stabilization effect attributable to prompt seasonal micro-credit disbursement from cooperative apex unions.', '2026-09-18T16:07:47.878Z');
INSERT OR REPLACE INTO theses (id, title, author, matric, year, advisor, department, faculty, degree, status, access, downloads, citations, doi, file_size, file_name, abstract, submitted_at) VALUES ('TH-2024-088', 'Design of a Decentralized Crop Storage Verification Protocol Using Hedera Hashgraph', 'Nnamdi, Grace C.', 'FCC/CSC/2023/088', 2024, 'Dr. K. Okonjo', 'Computer Science', 'Faculty of Science & Computing', 'Postgraduate Diploma Project', 'Published', 'Campus Intranet Only', 189, 8, '10.5281/zenodo.9482012', '4.6 MB', 'nnamdi_grace_2024_project.pdf', 'Architects a zero-knowledge cryptographic warehouse receipt verification model for post-harvest grain silos, reducing collateral verification latency from 7 days to sub-second blockchain settlement.', '2026-09-18T16:07:47.884Z');
INSERT OR REPLACE INTO theses (id, title, author, matric, year, advisor, department, faculty, degree, status, access, downloads, citations, doi, file_size, file_name, abstract, submitted_at) VALUES ('TH-2024-104', 'Comparative Liquidity Stress Testing of Cooperative Apexes Post-CBN Monetary Edicts', 'Jimoh, Ridwan A.', 'FCC/BNF/2023/104', 2024, 'Chief (Mrs.) Folake Sanusi', 'Banking & Finance', 'Faculty of Management Sciences', 'Higher National Diploma Dissertation', 'Published', 'Open Access Full-Text', 412, 21, '10.5281/zenodo.9984120', '6.2 MB', 'jimoh_ridwan_2024_thesis.pdf', 'Quantitative stress modeling examining reserve ratios and cash asset drawdowns across five major cooperative federations during cash restriction cycles.', '2026-09-18T16:07:47.891Z');
INSERT OR REPLACE INTO theses (id, title, author, matric, year, advisor, department, faculty, degree, status, access, downloads, citations, doi, file_size, file_name, abstract, submitted_at) VALUES ('TH-2026-042', 'Algorithmic Risk Syndication & Apex Liquidity Buffering in Nigerian Agri-Cooperatives', 'Wale Olonade', 'FCC/CEM/2024/042', 2026, 'Prof. A. O. Adebayo', 'Co-operative Economics & Management', 'Faculty of Management Sciences', 'Higher National Diploma Dissertation', 'Under Review', 'Pending Departmental Defense & Library Ingestion', 12, 0, '10.5281/zenodo.fcc.2026.042', '4.8 MB', 'olonade_wale_2026_defense_draft.pdf', 'Proposes an automated mathematical framework for cooperative apex liquidity pooling during harvest contraction windows, incorporating real-time stress models across 15 agricultural unions in Western Nigeria.', '2026-09-18T16:07:47.896Z');

-- Table: study_rooms (4 rows)
INSERT OR REPLACE INTO study_rooms (id, name, branch, capacity, type, amenities, status, available_today) VALUES ('RM-A101', 'Quiet Research Carrel Alpha', 'Floor 1 • Main Library', 1, 'Individual Research Pod', '["High-speed Wi-Fi","Dedicated Power Outlet","Ergonomic Mesh Chair","Adjustable LED Task Lamp","Sound-dampening Acoustic Paneling"]', 'available', '08:00 - 10:00, 10:00 - 12:00, 12:00 - 14:00, 14:00 - 16:00, 16:00 - 18:00, 18:00 - 20:00');
INSERT OR REPLACE INTO study_rooms (id, name, branch, capacity, type, amenities, status, available_today) VALUES ('RM-B204', 'Cooperative Synergy Group Suite', 'Floor 2 • West Wing', 6, 'Collaborative Study Room', '["55-inch Ultra HD Presentation Screen","Magnetic Ceramic Whiteboard","Conference Table","Air Conditioning","USB-C Fast Charging Hub","High-speed Wi-Fi"]', 'available', '09:00 - 11:00, 11:00 - 13:00, 13:00 - 15:00, 15:00 - 17:00, 17:00 - 19:00');
INSERT OR REPLACE INTO study_rooms (id, name, branch, capacity, type, amenities, status, available_today) VALUES ('RM-C302', 'Postgraduate & Defense Seminar Suite', 'Floor 3 • Senate Wing', 14, 'Conference & Defense Room', '["4K Laser Projector","Wireless Ceiling Mic Array","Surround Audio","Lectern with Touch Control","Air Conditioning","HD Video Conferencing Cam"]', 'booked', '14:00 - 16:00, 16:00 - 18:00');
INSERT OR REPLACE INTO study_rooms (id, name, branch, capacity, type, amenities, status, available_today) VALUES ('RM-D105', 'E-Library Multimedia Innovation Pod', 'Ground Floor • E-Library Hub', 2, 'Digital Media Station', '["Dual 27-inch 4K Color-Accurate Monitors","Studio Condenser Mic","High-Performance Workstation","Noise-Cancelling Headphones","Gigabit LAN"]', 'available', '08:00 - 10:00, 10:00 - 12:00, 12:00 - 14:00, 14:00 - 16:00, 16:00 - 18:00');

-- Table: room_bookings (1 rows)
INSERT OR REPLACE INTO room_bookings (id, matric, room_id, room_name, branch, date, time_slot, duration_hours, purpose, status, check_in_code, created_at) VALUES ('BKG-9901', 'FCC/CEM/2024/042', 'RM-A101', 'Quiet Research Carrel Alpha', 'Main Campus Library', '2026-09-18', '14:00 - 16:00', 2, 'Academic Study', 'Confirmed', 'CHK-782', '2026-09-18 16:07:47');

-- Table: partner_libraries (6 rows)
INSERT OR REPLACE INTO partner_libraries (id, institution, country, opac_url, z3950_host, port, database_name, active_holdings, status, sync_mode) VALUES ('LIB-UI-01', 'Kenneth Dike Library — University of Ibadan', 'Nigeria', 'https://opac.ui.edu.ng/discovery', 'opac.edu.ng', 210, 'OPAC', '1,450,000+ Volumes', 'Active Interlink', 'Live Federated Search');
INSERT OR REPLACE INTO partner_libraries (id, institution, country, opac_url, z3950_host, port, database_name, active_holdings, status, sync_mode) VALUES ('LIB-OAU-02', 'Hezekiah Oluwasanmi Library — OAU Ile-Ife', 'Nigeria', 'https://library.oauife.edu.ng/opac', 'opac.edu.ng', 210, 'OPAC', '850,000+ Volumes', 'Active Interlink', 'Live Federated Search');
INSERT OR REPLACE INTO partner_libraries (id, institution, country, opac_url, z3950_host, port, database_name, active_holdings, status, sync_mode) VALUES ('LIB-NAT-03', 'National Library of Nigeria (NLN)', 'Nigeria', 'https://opac.nln.gov.ng', 'opac.edu.ng', 210, 'OPAC', '5,000,000+ Records', 'Active Interlink', 'Live Federated Search');
INSERT OR REPLACE INTO partner_libraries (id, institution, country, opac_url, z3950_host, port, database_name, active_holdings, status, sync_mode) VALUES ('LIB-OPEN-04', 'OpenLibrary & Internet Archive', 'Nigeria', 'https://openlibrary.org/search', 'opac.edu.ng', 210, 'OPAC', '20,000,000+ eBooks', 'Active Interlink', 'Live Federated Search');
INSERT OR REPLACE INTO partner_libraries (id, institution, country, opac_url, z3950_host, port, database_name, active_holdings, status, sync_mode) VALUES ('LIB-LOC-05', 'Library of Congress (LOC) Online Catalog', 'Nigeria', 'https://catalog.loc.gov', 'opac.edu.ng', 210, 'OPAC', '170,000,000+ Items', 'Active Interlink', 'Live Federated Search');
INSERT OR REPLACE INTO partner_libraries (id, institution, country, opac_url, z3950_host, port, database_name, active_holdings, status, sync_mode) VALUES ('LIB-DOAB-06', 'DOAB — Directory of Open Access Books', 'Nigeria', 'https://www.doabooks.org/doab?func=search', 'opac.edu.ng', 210, 'OPAC', '85,000+ Academic Monographs', 'Active Interlink', 'Live Federated Search');

-- Table: acquisitions (3 rows)
INSERT OR REPLACE INTO acquisitions (id, title, author, publisher, isbn, department, requested_by, requester_role, cost_estimate_ngn, copies_requested, status, date_requested, priority, justification) VALUES ('PO-2026-081', 'Modern Agro-Business Management (5 copies)', 'Academic Author', 'University Press Plc, Ibadan', '978-978-030-992-1', 'General', 'Head of Dept - AGR', 'Faculty', 175000, 1, 'Approved', '2026-09-14', 'High', 'Course curriculum requirement');
INSERT OR REPLACE INTO acquisitions (id, title, author, publisher, isbn, department, requested_by, requester_role, cost_estimate_ngn, copies_requested, status, date_requested, priority, justification) VALUES ('PO-2026-082', 'Cloud Native Microservices & Kubernetes (4 copies)', 'Academic Author', 'CSS Bookshops Ltd, Lagos', '978-0-13-549102-3', 'General', 'Dr. K. Okonjo - CSC', 'Faculty', 220000, 1, 'Under Review', '2026-09-16', 'High', 'Course curriculum requirement');
INSERT OR REPLACE INTO acquisitions (id, title, author, publisher, isbn, department, requested_by, requester_role, cost_estimate_ngn, copies_requested, status, date_requested, priority, justification) VALUES ('PO-2026-083', 'Nigerian Commercial Banking Compendium (10 copies)', 'Academic Author', 'Spectrum Books, Ring Road Ibadan', '978-978-8120-00-5', 'General', 'Mrs. Folake Sanusi - BNF', 'Faculty', 350000, 1, 'Delivered & Cataloged', '2026-09-02', 'High', 'Course curriculum requirement');

-- Table: serials (3 rows)
INSERT OR REPLACE INTO serials (id, title, issn, publisher, frequency, department, latest_volume, latest_issue, holding_summary, subscription_status) VALUES ('SER-01', 'Journal of Co-operative and Rural Development Studies', '1597-2844', 'Academic Press', 'Quarterly', 'General', 'Vol. 28 No. 3 (Sept 2026)', 'Issue 1', 'All holdings intact', 'Active Subscription');
INSERT OR REPLACE INTO serials (id, title, issn, publisher, frequency, department, latest_volume, latest_issue, holding_summary, subscription_status) VALUES ('SER-02', 'West African Agronomic Review', '0794-5590', 'Academic Press', 'Bi-annual', 'General', 'Vol. 19 No. 1 (June 2026)', 'Issue 1', 'All holdings intact', 'Active Subscription');
INSERT OR REPLACE INTO serials (id, title, issn, publisher, frequency, department, latest_volume, latest_issue, holding_summary, subscription_status) VALUES ('SER-03', 'African Journal of Information Systems & Computing', '1936-7287', 'Academic Press', 'Monthly', 'General', 'Vol. 14 No. 8 (August 2026)', 'Issue 1', 'All holdings intact', 'Active Subscription');

-- Table: reading_lists (2 rows)
INSERT OR REPLACE INTO reading_lists (id, matric, title, description, is_public, item_count, items, created_at, updated_at) VALUES ('RL-001', 'FCC/CEM/2024/042', 'My Final Year Project (Fintech Cooperatives)', 'Core academic references on apex liquidity models and cooperative member equity accumulation.', 1, 3, '[{"bookId":"FCC-B001","notes":"Focus on Chapter 3 for apex syndicate formulas."},{"bookId":"FCC-B006","notes":"Review statutory audit requirements in Nigeria."},{"bookId":"FCC-B003","notes":"Compare Basel III ratios with Raiffeisen reserves."}]', '2026-09-18 16:07:48', '2026-09-18 16:07:48');
INSERT OR REPLACE INTO reading_lists (id, matric, title, description, is_public, item_count, items, created_at, updated_at) VALUES ('RL-002', 'FCC/CEM/2024/042', 'Machine Learning & AI in Commerce', 'Exploration of vector retrieval algorithms and database architectures.', 0, 2, '[{"bookId":"FCC-B005","notes":"Important RAG pipeline concepts for AI librarian."},{"bookId":"FCC-B002","notes":"PostgreSQL distributed query optimization."}]', '2026-09-18 16:07:48', '2026-09-18 16:07:48');

-- Table: continue_reading (3 rows)
INSERT OR REPLACE INTO continue_reading (id, matric, book_id, title, author, last_page, total_pages, progress, last_opened, updated_at) VALUES ('FCC/CEM/2024/042-FCC-B001', 'FCC/CEM/2024/042', 'FCC-B001', 'Principles and Practice of Co-operative Economics', 'Prof. A. O. Adebayo', 261, 384, 68, 'Today, 10:14 AM', '2026-09-18 16:07:48');
INSERT OR REPLACE INTO continue_reading (id, matric, book_id, title, author, last_page, total_pages, progress, last_opened, updated_at) VALUES ('FCC/CEM/2024/042-FCC-B005', 'FCC/CEM/2024/042', 'FCC-B005', 'Artificial Intelligence in Academic Information Retrieval', 'Dr. O. J. Fatoyinbo', 151, 360, 42, 'Yesterday, 04:30 PM', '2026-09-18 16:07:48');
INSERT OR REPLACE INTO continue_reading (id, matric, book_id, title, author, last_page, total_pages, progress, last_opened, updated_at) VALUES ('FCC/CEM/2024/042-FCC-B007', 'FCC/CEM/2024/042', 'FCC-B007', 'Advanced Computer Networks & Cloud Infrastructure', 'Prof. S. N. Varma', 120, 480, 25, '2 days ago', '2026-09-18 16:07:48');

-- Table: audit_logs (3 rows)
INSERT OR REPLACE INTO audit_logs (id, timestamp, actor, role, action, resource_type, resource_id, details, ip_address, hash) VALUES ('LOG-5501', '2026-09-18 11:42:15', 'Dr. Mrs. A. Balogun', 'SUPER_ADMIN', 'PIN_RESET', 'CATALOG', 'LOG-5501', 'Generated new secure library PIN for student Wale Olonade (FCC/CEM/2024/042)', '127.0.0.1', 'sha256-verified');
INSERT OR REPLACE INTO audit_logs (id, timestamp, actor, role, action, resource_type, resource_id, details, ip_address, hash) VALUES ('LOG-5502', '2026-09-18 10:15:30', 'Mr. T. Alabi (Cataloguer)', 'CATALOGUER', 'MARC_INGEST', 'CATALOG', 'LOG-5502', 'Added MARC21 bibliographic record for Artificial Intelligence in Academic Retrieval (Z666.5 .F38)', '127.0.0.1', 'sha256-verified');
INSERT OR REPLACE INTO audit_logs (id, timestamp, actor, role, action, resource_type, resource_id, details, ip_address, hash) VALUES ('LOG-5503', '2026-09-18 09:04:00', 'System Scheduler', 'DAEMON', 'HEALTH_CHECK', 'CATALOG', 'LOG-5503', 'Automated daily integrity audit verified 100% of PDF asset hashes.', '127.0.0.1', 'sha256-verified');

-- Table: announcements (3 rows)
INSERT OR REPLACE INTO announcements (id, title, content, category, priority, author, date, valid_until) VALUES ('ANN-01', 'Second Semester Examination Period — 24/7 Virtual Library Access', 'In support of the upcoming ND/HND examinations, the Main Campus Library and E-Learning Hub will operate extended 24-hour reading hours starting Monday. Biometric cards required for entry after 09:00 PM.', 'High Priority', 'High Priority', 'Library Directorate', '16 Sept 2026', '2027-09-18');
INSERT OR REPLACE INTO announcements (id, title, content, category, priority, author, date, valid_until) VALUES ('ANN-02', 'New E-Book Subscriptions Added: ScienceDirect & IEEE Computer Society', 'The Library Directorate has acquired institutional multi-user licenses for 14,000+ new peer-reviewed computer engineering and agricultural economics volumes.', 'Resource Update', 'Resource Update', 'Library Directorate', '12 Sept 2026', '2027-09-18');
INSERT OR REPLACE INTO announcements (id, title, content, category, priority, author, date, valid_until) VALUES ('ANN-03', 'Student PIN Verification & PVC ID Card Revalidation Notice', 'Students experiencing login issues should visit their faculty librarian for immediate PIN reset. Please note library services require NO direct monetary payments.', 'Administrative', 'Administrative', 'Library Directorate', '08 Sept 2026', '2027-09-18');

