import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import institutional seed data
import {
  INSTITUTION,
  BRANCHES,
  INITIAL_PATRONS,
  PATRON_POLICIES,
  INITIAL_BOOKS,
  INITIAL_COURSES,
  INITIAL_LOANS,
  INITIAL_READING_LISTS,
  INITIAL_CONTINUE_READING,
  INITIAL_RESERVATIONS,
  INITIAL_THESES,
  INITIAL_STUDY_ROOMS,
  INITIAL_ROOM_BOOKINGS,
  INITIAL_ACQUISITIONS,
  INITIAL_PARTNER_LIBRARIES,
  INITIAL_SERIALS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ANNOUNCEMENTS
} from '../src/data/institutionalSeedData.js';

console.log('\n=============================================================');
console.log('🏛️  BRAINFEELS_LIBRARY — MYSQL / PHPMYADMIN SETUP & SEEDER');
console.log('=============================================================');

async function setupMySQL() {
  const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  };

  console.log(`Connecting to MySQL Server at ${dbConfig.host}:${dbConfig.port} (User: ${dbConfig.user})...`);
  
  const rootConn = await mysql.createConnection(dbConfig);
  console.log('✓ Connected to MySQL!');

  // 1. Create Database
  await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`brainfeels_library\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  console.log('✓ Database `brainfeels_library` created / verified in MySQL (Visible in phpMyAdmin).');
  await rootConn.end();

  // 2. Connect directly to brainfeels_library
  const conn = await mysql.createConnection({
    ...dbConfig,
    database: 'brainfeels_library'
  });

  // 3. MySQL Schema DDL
  const schemaSql = `
    SET FOREIGN_KEY_CHECKS = 0;

    DROP TABLE IF EXISTS branches;
    CREATE TABLE branches (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    DROP TABLE IF EXISTS patron_policies;
    CREATE TABLE patron_policies (
      role VARCHAR(50) PRIMARY KEY,
      max_borrow_limit INT NOT NULL,
      loan_duration_days INT NOT NULL,
      daily_fine_rate DECIMAL(10, 2) NOT NULL,
      reserve_limit INT NOT NULL,
      digital_access_enabled TINYINT(1) DEFAULT 1,
      study_room_quota_hours INT DEFAULT 4,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    DROP TABLE IF EXISTS patrons;
    CREATE TABLE patrons (
      id VARCHAR(50) PRIMARY KEY,
      matric VARCHAR(100) UNIQUE NOT NULL,
      library_id VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
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
      research_interests LONGTEXT,
      orcid VARCHAR(50),
      profile_completion INT DEFAULT 90,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    DROP TABLE IF EXISTS books;
    CREATE TABLE books (
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
      file_data_url LONGTEXT,
      external_url TEXT,
      is_digital TINYINT(1) DEFAULT 0,
      access_level VARCHAR(100) DEFAULT 'Open Access Full-Text',
      rights_status VARCHAR(150),
      copies_total INT DEFAULT 1,
      copies_available INT DEFAULT 1,
      rating DECIMAL(3, 1) DEFAULT 5.0,
      citations INT DEFAULT 0,
      abstract LONGTEXT,
      keywords LONGTEXT,
      chapters LONGTEXT,
      references_data LONGTEXT,
      reference_style VARCHAR(50),
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      uploaded_by VARCHAR(255)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    DROP TABLE IF EXISTS courses;
    CREATE TABLE courses (
      code VARCHAR(50) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      department VARCHAR(150),
      faculty VARCHAR(150),
      level VARCHAR(50),
      semester VARCHAR(50),
      lecturer VARCHAR(255),
      enrolled_students INT DEFAULT 0,
      required_texts LONGTEXT,
      recommended_texts LONGTEXT,
      past_exams LONGTEXT,
      lecture_packs LONGTEXT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    DROP TABLE IF EXISTS loans;
    CREATE TABLE loans (
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
      status VARCHAR(50) DEFAULT 'Active',
      fine_amount DECIMAL(10, 2) DEFAULT 0.00,
      rfid_tag VARCHAR(100)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    DROP TABLE IF EXISTS reservations;
    CREATE TABLE reservations (
      id VARCHAR(50) PRIMARY KEY,
      matric VARCHAR(100) NOT NULL,
      patron_name VARCHAR(255) NOT NULL,
      book_id VARCHAR(50) NOT NULL,
      book_title VARCHAR(500) NOT NULL,
      call_number VARCHAR(100),
      reserved_date DATE NOT NULL,
      expiry_date DATE NOT NULL,
      status VARCHAR(50) DEFAULT 'Pending',
      pickup_branch VARCHAR(255),
      queue_position INT DEFAULT 1
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    DROP TABLE IF EXISTS reading_lists;
    CREATE TABLE reading_lists (
      id VARCHAR(50) PRIMARY KEY,
      matric VARCHAR(100) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      is_public TINYINT(1) DEFAULT 0,
      item_count INT DEFAULT 0,
      items LONGTEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    DROP TABLE IF EXISTS continue_reading;
    CREATE TABLE continue_reading (
      id VARCHAR(100) PRIMARY KEY,
      matric VARCHAR(100) NOT NULL,
      book_id VARCHAR(50) NOT NULL,
      title VARCHAR(500) NOT NULL,
      author VARCHAR(255),
      last_page INT DEFAULT 1,
      total_pages INT DEFAULT 1,
      progress INT DEFAULT 0,
      last_opened VARCHAR(100),
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    DROP TABLE IF EXISTS theses;
    CREATE TABLE theses (
      id VARCHAR(50) PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      author VARCHAR(255) NOT NULL,
      matric VARCHAR(100) NOT NULL,
      year INT NOT NULL,
      advisor VARCHAR(255),
      department VARCHAR(150),
      faculty VARCHAR(150),
      degree VARCHAR(100),
      status VARCHAR(50) DEFAULT 'Published',
      access VARCHAR(100) DEFAULT 'Open Access Full-Text',
      downloads INT DEFAULT 0,
      citations INT DEFAULT 0,
      doi VARCHAR(100),
      file_size VARCHAR(50),
      file_name VARCHAR(255),
      abstract LONGTEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    DROP TABLE IF EXISTS study_rooms;
    CREATE TABLE study_rooms (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      branch VARCHAR(255) NOT NULL,
      capacity INT DEFAULT 4,
      type VARCHAR(100),
      amenities LONGTEXT,
      status VARCHAR(50) DEFAULT 'Available',
      available_today VARCHAR(100)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    DROP TABLE IF EXISTS room_bookings;
    CREATE TABLE room_bookings (
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    DROP TABLE IF EXISTS acquisitions;
    CREATE TABLE acquisitions (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    DROP TABLE IF EXISTS partner_libraries;
    CREATE TABLE partner_libraries (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    DROP TABLE IF EXISTS serials;
    CREATE TABLE serials (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    DROP TABLE IF EXISTS audit_logs;
    CREATE TABLE audit_logs (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    DROP TABLE IF EXISTS notifications;
    CREATE TABLE notifications (
      id VARCHAR(50) PRIMARY KEY,
      matric VARCHAR(100),
      type VARCHAR(50),
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      date VARCHAR(50),
      \`read\` TINYINT(1) DEFAULT 0,
      action_url TEXT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    DROP TABLE IF EXISTS announcements;
    CREATE TABLE announcements (
      id VARCHAR(50) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      category VARCHAR(100),
      priority VARCHAR(50) DEFAULT 'Normal',
      author VARCHAR(255),
      date VARCHAR(50),
      valid_until VARCHAR(50)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    SET FOREIGN_KEY_CHECKS = 1;
  `;

  await conn.query(schemaSql);
  console.log('✓ All 18 MySQL Relational Tables created successfully.');

  // Helper for batch inserts
  const insertMany = async (sql, values) => {
    if (!values || values.length === 0) return;
    await conn.query(sql, [values]);
  };

  console.log('\n🌱 Seeding MySQL database `brainfeels_library` with institutional records...\n');

  // 1. Branches
  const branchValues = BRANCHES.map(b => [
    b.id, b.name, b.shortCode, b.location, b.campus, b.seats, b.currentOccupancy, b.holdingsCount, b.headLibrarian, b.phone, b.email, b.openingHours, b.status
  ]);
  await insertMany(`INSERT INTO branches (id, name, short_code, location, campus, seats, current_occupancy, holdings_count, head_librarian, phone, email, opening_hours, status) VALUES ?`, branchValues);
  console.log(`✓ Seeded ${BRANCHES.length} Campus Library Branches`);

  // 2. Patron Policies
  const policyValues = Object.entries(PATRON_POLICIES).map(([role, p]) => [
    role, p.maxLoans || 5, p.loanPeriodDays || 14, p.finePerDay || 100, p.reserveMax || 3, 1, p.studyRoomQuotaHours || 4
  ]);
  await insertMany(`INSERT INTO patron_policies (role, max_borrow_limit, loan_duration_days, daily_fine_rate, reserve_limit, digital_access_enabled, study_room_quota_hours) VALUES ?`, policyValues);
  console.log(`✓ Seeded Patron Policy Matrix`);

  // 3. Patrons
  const patronValues = INITIAL_PATRONS.map(pat => [
    pat.id, pat.matric, pat.libraryId, pat.name, pat.role, pat.category, pat.department, pat.faculty, pat.level, pat.programme,
    pat.email, pat.phone, pat.pin || '1234', new Date(), pat.status, pat.borrowQuota,
    pat.activeLoansCount, pat.overdueCount, pat.outstandingFines, pat.clearanceStatus, pat.registeredBranch,
    pat.validUntil, pat.photoUrl, JSON.stringify(pat.researchInterests || []), pat.orcid, pat.profileCompletion || 90
  ]);
  await insertMany(`INSERT INTO patrons (id, matric, library_id, name, role, category, department, faculty, level, programme, email, phone, pin, pin_created_at, status, borrow_quota, active_loans_count, overdue_count, outstanding_fines, clearance_status, registered_branch, valid_until, photo_url, research_interests, orcid, profile_completion) VALUES ?`, patronValues);
  console.log(`✓ Seeded ${INITIAL_PATRONS.length} Patron Profiles with 4-Digit Security PINs`);

  // 4. Books
  const bookValues = INITIAL_BOOKS.map(b => [
    b.id, b.title, b.subtitle || '', b.author, b.authorCredentials || '', b.authorAffiliation || '', b.orcid || '',
    b.coAuthors || '', b.subject, b.department, b.courseCode, b.targetLevel, b.branch, b.shelfLocation, b.callNumber,
    b.isbn, b.doi, b.publisher, b.year, b.edition, b.pdfPages || 0, b.fileSize || '', b.fileName || '',
    b.fileDataUrl || '', b.externalUrl || '', b.isDigital ? 1 : 0, b.accessLevel || 'Open Access Full-Text', b.rightsStatus || '',
    b.copiesTotal || 1, b.copiesAvailable || 1, b.rating || 5.0, b.citations || 0, b.abstract,
    JSON.stringify(b.keywords || []), JSON.stringify(b.chapters || []), JSON.stringify(b.references || []), b.referenceStyle || 'APA 7th',
    new Date(), b.uploadedBy || 'Cataloging Authority'
  ]);
  await insertMany(`INSERT INTO books (id, title, subtitle, author, author_credentials, author_affiliation, orcid, co_authors, subject, department, course_code, target_level, branch, shelf_location, call_number, isbn, doi, publisher, year, edition, pdf_pages, file_size, file_name, file_data_url, external_url, is_digital, access_level, rights_status, copies_total, copies_available, rating, citations, abstract, keywords, chapters, references_data, reference_style, uploaded_at, uploaded_by) VALUES ?`, bookValues);
  console.log(`✓ Seeded ${INITIAL_BOOKS.length} Catalogued Volumes & Digital Books`);

  // 5. Courses
  const courseValues = INITIAL_COURSES.map(c => [
    c.code, c.title, c.department, c.faculty, c.level, c.semester, c.lecturer, c.enrolledStudents,
    JSON.stringify(c.requiredTexts || []), JSON.stringify(c.recommendedTexts || []), JSON.stringify(c.pastExams || []), JSON.stringify(c.lecturePacks || [])
  ]);
  await insertMany(`INSERT INTO courses (code, title, department, faculty, level, semester, lecturer, enrolled_students, required_texts, recommended_texts, past_exams, lecture_packs) VALUES ?`, courseValues);
  console.log(`✓ Seeded ${INITIAL_COURSES.length} Academic Department Courses`);

  // 6. Loans
  const loanValues = INITIAL_LOANS.map(l => [
    l.id, l.matric, l.studentName || l.patronName || 'Scholar', l.bookId, l.bookTitle, l.author, l.callNumber,
    l.branch, l.borrowDate, l.dueDate, l.returnDate || null, l.renewalCount || 0, l.status, l.fine || l.fineAmount || 0, l.rfidTag || l.barcode || ''
  ]);
  await insertMany(`INSERT INTO loans (id, matric, patron_name, book_id, book_title, author, call_number, branch, borrow_date, due_date, return_date, renewal_count, status, fine_amount, rfid_tag) VALUES ?`, loanValues);
  console.log(`✓ Seeded ${INITIAL_LOANS.length} Circulation Loan Records`);

  // 7. Reservations
  const resValues = INITIAL_RESERVATIONS.map(r => [
    r.id, r.matric, r.studentName || r.patronName || 'Scholar', r.bookId, r.title || r.bookTitle || 'Reserved Book', r.callNumber || '',
    r.reservedDate || '2026-09-15', r.expiryDate || '2026-09-25', r.status || 'Available', r.pickupLocation || r.pickupBranch || 'Main Campus Library', r.queuePosition || 1
  ]);
  await insertMany(`INSERT INTO reservations (id, matric, patron_name, book_id, book_title, call_number, reserved_date, expiry_date, status, pickup_branch, queue_position) VALUES ?`, resValues);
  console.log(`✓ Seeded ${INITIAL_RESERVATIONS.length} Book Reservations`);

  // 8. Theses
  const thesisValues = INITIAL_THESES.map(th => [
    th.id, th.title, th.author, th.matric, th.year, th.advisor, th.department, th.faculty, th.degree,
    th.status, th.access, th.downloads || 0, th.citations || 0, th.doi, th.fileSize, th.fileName, th.abstract, new Date()
  ]);
  await insertMany(`INSERT INTO theses (id, title, author, matric, year, advisor, department, faculty, degree, status, access, downloads, citations, doi, file_size, file_name, abstract, submitted_at) VALUES ?`, thesisValues);
  console.log(`✓ Seeded ${INITIAL_THESES.length} Institutional Theses`);

  // 9. Study Rooms & Bookings
  const roomValues = INITIAL_STUDY_ROOMS.map(rm => [
    rm.id, rm.name, rm.floor || rm.branch || 'Main Campus Library', rm.capacity, rm.type, JSON.stringify(rm.facilities || rm.amenities || []), rm.status || 'Available', rm.availableTimeSlots ? rm.availableTimeSlots.join(', ') : 'All Day'
  ]);
  await insertMany(`INSERT INTO study_rooms (id, name, branch, capacity, type, amenities, status, available_today) VALUES ?`, roomValues);

  const bkgValues = INITIAL_ROOM_BOOKINGS.map(rb => [
    rb.id, rb.matric, rb.roomId, rb.roomName, rb.branch || 'Main Campus Library', rb.date, rb.timeSlot, rb.durationHours || 2, rb.purpose || 'Academic Study', rb.status || 'Confirmed', rb.checkInCode || 'CHK-101'
  ]);
  await insertMany(`INSERT INTO room_bookings (id, matric, room_id, room_name, branch, date, time_slot, duration_hours, purpose, status, check_in_code) VALUES ?`, bkgValues);
  console.log(`✓ Seeded Study Rooms & Bookings`);

  // 10. Partner Libraries
  const partnerValues = INITIAL_PARTNER_LIBRARIES.map(pl => [
    pl.id, pl.name || pl.institution || 'Consortia Library', pl.country || 'Nigeria', pl.opacUrl || pl.url || '', pl.z3950Host || 'opac.edu.ng', pl.port || 210, pl.databaseName || 'OPAC', pl.holdingsCount || 100000, pl.status || 'Active', pl.syncMode || 'Live Federated Search'
  ]);
  await insertMany(`INSERT INTO partner_libraries (id, institution, country, opac_url, z3950_host, port, database_name, active_holdings, status, sync_mode) VALUES ?`, partnerValues);
  console.log(`✓ Seeded ${INITIAL_PARTNER_LIBRARIES.length} Consortia Gateway Libraries (UI, OAU, NLN, UNILAG)`);

  // 11. Acquisitions
  const acqValues = INITIAL_ACQUISITIONS.map(acq => [
    acq.id, acq.title, acq.author || 'Academic Author', acq.vendor || acq.publisher || 'FCC Academic Press', acq.isbn || '', acq.department || 'General', acq.requestedBy || 'Staff Librarian', acq.requesterRole || 'Faculty', acq.budget || acq.costEstimateNgn || 150000, acq.copiesRequested || 1, acq.status || 'Approved', acq.date || acq.dateRequested || '2026-09-14', acq.priority || 'High', acq.justification || 'Course curriculum requirement'
  ]);
  await insertMany(`INSERT INTO acquisitions (id, title, author, publisher, isbn, department, requested_by, requester_role, cost_estimate_ngn, copies_requested, status, date_requested, priority, justification) VALUES ?`, acqValues);
  console.log(`✓ Seeded ${INITIAL_ACQUISITIONS.length} Procurement Requests`);

  // 12. Serials
  const serialValues = INITIAL_SERIALS.map(s => [
    s.id, s.title, s.issn, s.publisher || 'Academic Press', s.frequency || 'Quarterly', s.department || 'General', s.latestVolume || 'Vol. 1', s.latestIssue || 'Issue 1', s.holdingSummary || 'All holdings intact', s.status || s.subscriptionStatus || 'Active'
  ]);
  await insertMany(`INSERT INTO serials (id, title, issn, publisher, frequency, department, latest_volume, latest_issue, holding_summary, subscription_status) VALUES ?`, serialValues);
  console.log(`✓ Seeded ${INITIAL_SERIALS.length} Serials & Periodicals`);

  // 13. Reading Lists
  const listValues = INITIAL_READING_LISTS.map(rl => [
    rl.id, rl.matric, rl.name || rl.title || 'Research Reading List', rl.description, rl.isPublic ? 1 : 0, rl.itemCount || rl.items?.length || 0, JSON.stringify(rl.items || [])
  ]);
  await insertMany(`INSERT INTO reading_lists (id, matric, title, description, is_public, item_count, items) VALUES ?`, listValues);

  // 14. Continue Reading
  const crValues = INITIAL_CONTINUE_READING.map(cr => [
    cr.id || `${cr.matric}-${cr.bookId}`, cr.matric, cr.bookId, cr.title, cr.author, cr.lastPage, cr.totalPages, cr.progress, cr.lastOpened
  ]);
  await insertMany(`INSERT INTO continue_reading (id, matric, book_id, title, author, last_page, total_pages, progress, last_opened) VALUES ?`, crValues);

  // 15. Audit Logs & Announcements
  const auditValues = INITIAL_AUDIT_LOGS.map(al => [
    al.id, new Date(al.timestamp || Date.now()), al.user || al.actor || 'Administrator', al.role || 'SUPER_ADMIN', al.action || 'LOG_ENTRY', al.resourceType || 'CATALOG', al.resourceId || al.id, al.detail || al.details || '', al.ipAddress || '127.0.0.1', al.hash || 'sha256-verified'
  ]);
  await insertMany(`INSERT INTO audit_logs (id, timestamp, actor, role, action, resource_type, resource_id, details, ip_address, hash) VALUES ?`, auditValues);

  const annValues = INITIAL_ANNOUNCEMENTS.map(ann => [
    ann.id, ann.title, ann.message || ann.content || '', ann.priority || ann.category || 'General', ann.priority || 'Normal', ann.author || 'Library Directorate', ann.date || '2026-09-18', ann.validUntil || '2027-09-18'
  ]);
  await insertMany(`INSERT INTO announcements (id, title, content, category, priority, author, date, valid_until) VALUES ?`, annValues);

  console.log('\n=============================================================');
  console.log('✅ MYSQL DATABASE `brainfeels_library` SETUP COMPLETE!');
  console.log('=============================================================');
  console.log('👉 Go to http://localhost/phpmyadmin/ and refresh your browser.');
  console.log('👉 You will see `brainfeels_library` with all 18 populated tables!\n');

  await conn.end();
  process.exit(0);
}

setupMySQL().catch(err => {
  console.error('❌ MySQL Setup Error:', err);
  process.exit(1);
});
