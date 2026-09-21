-- ============================================================================
-- INSTITUTIONAL SMART LIBRARY & DIGITAL REPOSITORY PLATFORM
-- PostgreSQL Production Migration Schema (v4.8-LSP Enterprise)
-- Target: Federal Co-operative College, Ibadan (FCC Ibadan) & Higher Ed ILMS
-- Standards: MARC 21, Dublin Core, OAI-PMH, KBART Phase III, Z39.50
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. INSTITUTIONAL TOPOLOGY & BRANCHES
-- ----------------------------------------------------------------------------
CREATE TABLE institutions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50) NOT NULL,
    motto TEXT,
    established_year INT,
    campus_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE branches (
    id SERIAL PRIMARY KEY,
    institution_id INT REFERENCES institutions(id) ON DELETE CASCADE,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    total_floors INT DEFAULT 1,
    seating_capacity INT DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    institution_id INT REFERENCES institutions(id) ON DELETE CASCADE,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    faculty VARCHAR(150) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 2. RBAC ROLES, PERMISSIONS & PATRONS
-- ----------------------------------------------------------------------------
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    module VARCHAR(50) NOT NULL,
    description TEXT
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE role_permissions (
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE patrons (
    id BIGSERIAL PRIMARY KEY,
    institution_id INT REFERENCES institutions(id),
    matric_or_staff_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone_number VARCHAR(30),
    pin_hash VARCHAR(255) NOT NULL, -- Bcrypt hash of student 4-digit PIN
    password_hash VARCHAR(255),     -- For administrative staff MFA accounts
    department_id INT REFERENCES departments(id),
    patron_type VARCHAR(30) DEFAULT 'student', -- student, lecturer, researcher, librarian, admin
    rfid_card_uid VARCHAR(100) UNIQUE,
    borrow_quota INT DEFAULT 5,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE patron_roles (
    patron_id BIGINT REFERENCES patrons(id) ON DELETE CASCADE,
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (patron_id, role_id)
);

-- ----------------------------------------------------------------------------
-- 3. BIBLIOGRAPHIC RECORDS (MARC 21 & DUBLIN CORE)
-- ----------------------------------------------------------------------------
CREATE TABLE bibliographic_records (
    id BIGSERIAL PRIMARY KEY,
    institution_id INT REFERENCES institutions(id),
    isbn VARCHAR(25) UNIQUE,
    issn VARCHAR(25),
    doi VARCHAR(150),
    title TEXT NOT NULL,
    subtitle TEXT,
    author TEXT NOT NULL,
    contributors TEXT,
    edition VARCHAR(50),
    publisher VARCHAR(150),
    publication_year INT,
    call_number VARCHAR(100) NOT NULL,
    subject VARCHAR(150),
    department_code VARCHAR(10),
    language VARCHAR(10) DEFAULT 'eng',
    pages INT,
    abstract TEXT,
    table_of_contents JSONB,
    is_digital BOOLEAN DEFAULT FALSE,
    digital_file_url TEXT,
    rating NUMERIC(2,1) DEFAULT 5.0,
    citation_count INT DEFAULT 0,
    marc21_xml XML,
    marc21_raw TEXT,
    dublin_core_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_biblio_call_number ON bibliographic_records(call_number);
CREATE INDEX idx_biblio_isbn ON bibliographic_records(isbn);
CREATE INDEX idx_biblio_title_search ON bibliographic_records USING GIN (to_tsvector('english', title || ' ' || author || ' ' || COALESCE(abstract, '')));

-- ----------------------------------------------------------------------------
-- 4. PHYSICAL HOLDINGS & ITEM COPIES (RFID & BARCODES)
-- ----------------------------------------------------------------------------
CREATE TABLE item_copies (
    id BIGSERIAL PRIMARY KEY,
    biblio_id BIGINT REFERENCES bibliographic_records(id) ON DELETE CASCADE,
    branch_id INT REFERENCES branches(id),
    barcode VARCHAR(60) UNIQUE NOT NULL,
    rfid_tag_uid VARCHAR(100) UNIQUE,
    copy_number INT DEFAULT 1,
    floor_number INT DEFAULT 1,
    aisle VARCHAR(20),
    shelf_location VARCHAR(100) NOT NULL,
    status VARCHAR(30) DEFAULT 'available', -- available, on_loan, reserved, lost, repair, reference_only
    condition VARCHAR(30) DEFAULT 'good',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_item_copies_barcode ON item_copies(barcode);
CREATE INDEX idx_item_copies_rfid ON item_copies(rfid_tag_uid);

-- ----------------------------------------------------------------------------
-- 5. CIRCULATION TRANSACTIONS & LOANS
-- ----------------------------------------------------------------------------
CREATE TABLE loans (
    id BIGSERIAL PRIMARY KEY,
    loan_reference VARCHAR(50) UNIQUE NOT NULL,
    item_copy_id BIGINT REFERENCES item_copies(id),
    patron_id BIGINT REFERENCES patrons(id),
    issued_by_patron_id BIGINT REFERENCES patrons(id),
    checkout_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    return_date DATE,
    renewals_count INT DEFAULT 0,
    fine_amount NUMERIC(10,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active', -- active, returned, overdue, lost
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_loans_patron ON loans(patron_id);
CREATE INDEX idx_loans_status ON loans(status);

-- ----------------------------------------------------------------------------
-- 6. RESERVATIONS & HOLDS
-- ----------------------------------------------------------------------------
CREATE TABLE reservations (
    id BIGSERIAL PRIMARY KEY,
    biblio_id BIGINT REFERENCES bibliographic_records(id),
    patron_id BIGINT REFERENCES patrons(id),
    reservation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP WITH TIME ZONE,
    queue_position INT DEFAULT 1,
    status VARCHAR(30) DEFAULT 'pending', -- pending, ready_for_pickup, fulfilled, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 7. FINANCIAL LEDGER & FINES
-- ----------------------------------------------------------------------------
CREATE TABLE fines (
    id BIGSERIAL PRIMARY KEY,
    loan_id BIGINT REFERENCES loans(id),
    patron_id BIGINT REFERENCES patrons(id),
    amount NUMERIC(10,2) NOT NULL,
    reason VARCHAR(100) DEFAULT 'overdue', -- overdue, damage, replacement_fee
    status VARCHAR(30) DEFAULT 'unpaid', -- unpaid, paid, waived
    payment_method VARCHAR(50),          -- paystack, flutterwave, cash, pos
    payment_reference VARCHAR(100),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 8. INSTITUTIONAL REPOSITORY & SCHOLARLY THESES
-- ----------------------------------------------------------------------------
CREATE TABLE repository_theses (
    id BIGSERIAL PRIMARY KEY,
    thesis_identifier VARCHAR(50) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    author_name VARCHAR(150) NOT NULL,
    matric_number VARCHAR(50),
    advisor_name VARCHAR(150) NOT NULL,
    department_id INT REFERENCES departments(id),
    degree_type VARCHAR(50) NOT NULL, -- HND Dissertation, Postgraduate Diploma, ND Project, Faculty Monograph
    publication_year INT NOT NULL,
    abstract TEXT NOT NULL,
    file_url TEXT,
    doi VARCHAR(100),
    oai_pmh_identifier VARCHAR(150) UNIQUE,
    access_level VARCHAR(30) DEFAULT 'open_access', -- open_access, campus_intranet_only, embargoed
    review_status VARCHAR(30) DEFAULT 'under_review', -- under_review, supervisor_approved, published, rejected
    download_count INT DEFAULT 0,
    citation_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 9. STUDY ROOMS & CARREL RESERVATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE study_rooms (
    id SERIAL PRIMARY KEY,
    branch_id INT REFERENCES branches(id),
    room_code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    room_type VARCHAR(50) NOT NULL, -- Individual Carrel, Group Room, Seminar Suite
    capacity INT DEFAULT 1,
    floor_number INT DEFAULT 1,
    amenities JSONB,
    status VARCHAR(30) DEFAULT 'available'
);

CREATE TABLE study_room_bookings (
    id BIGSERIAL PRIMARY KEY,
    room_id INT REFERENCES study_rooms(id),
    patron_id BIGINT REFERENCES patrons(id),
    booking_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    status VARCHAR(30) DEFAULT 'confirmed', -- confirmed, checked_in, cancelled, no_show
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 10. ACQUISITIONS & VENDORS
-- ----------------------------------------------------------------------------
CREATE TABLE vendors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    contact_email VARCHAR(150),
    phone VARCHAR(30),
    address TEXT,
    rating NUMERIC(2,1) DEFAULT 5.0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE purchase_orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    vendor_id INT REFERENCES vendors(id),
    department_id INT REFERENCES departments(id),
    title TEXT NOT NULL,
    total_budget NUMERIC(12,2) NOT NULL,
    status VARCHAR(30) DEFAULT 'under_review', -- under_review, approved, ordered, delivered, cataloged, cancelled
    requested_by VARCHAR(150) NOT NULL,
    authorized_by VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 11. SERIALS & ELECTRONIC KNOWLEDGE BASE (KBART)
-- ----------------------------------------------------------------------------
CREATE TABLE serials (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    issn VARCHAR(30) UNIQUE NOT NULL,
    eissn VARCHAR(30),
    frequency VARCHAR(50) NOT NULL,
    publisher VARCHAR(150),
    latest_volume VARCHAR(100),
    subscription_status VARCHAR(30) DEFAULT 'active',
    missing_issues_count INT DEFAULT 0
);

-- ----------------------------------------------------------------------------
-- 12. IMMUTABLE AUDIT LOGS
-- ----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_patron_id BIGINT REFERENCES patrons(id),
    actor_role VARCHAR(50) NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- CIRC_CHECKOUT, CIRC_RETURN, MARC_INGEST, OVERRIDE, FINE_WAIVED
    entity_type VARCHAR(50),
    entity_id VARCHAR(100),
    details TEXT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_action ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(created_at);
