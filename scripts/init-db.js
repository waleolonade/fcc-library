import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path & name
const DB_DIR = path.join(__dirname, '..', 'database');
const DB_PATH = path.join(DB_DIR, 'brainfeels_library.sqlite');
const SCHEMA_PATH = path.join(DB_DIR, 'schema.sql');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

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
console.log('🏛️  BRAINFEELS_LIBRARY — SQL DATABASE INITIALIZER & SEEDER');
console.log('=============================================================');
console.log(`Database Target: brainfeels_library`);
console.log(`Storage File:    ${DB_PATH}`);
console.log(`Schema File:     ${SCHEMA_PATH}\n`);

const db = new sqlite3.Database(DB_PATH, async (err) => {
  if (err) {
    console.error('❌ Failed to open database:', err.message);
    process.exit(1);
  }
  console.log('✓ Connected to SQL database: brainfeels_library');

  try {
    // 1. Read and execute schema
    const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
    db.exec(schemaSql, async (schemaErr) => {
      if (schemaErr) {
        console.error('❌ Schema execution error:', schemaErr.message);
        process.exit(1);
      }
      console.log('✓ Relational Schema DDL created successfully (18 tables created).');

      // Helper function to run statement with promise
      const runQuery = (sql, params = []) => {
        return new Promise((resolve, reject) => {
          db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
          });
        });
      };

      console.log('\n🌱 Seeding database with institutional records...\n');

      // 1. Seed Branches
      for (const b of BRANCHES) {
        await runQuery(
          `INSERT OR REPLACE INTO branches (id, name, short_code, location, campus, seats, current_occupancy, holdings_count, head_librarian, phone, email, opening_hours, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [b.id, b.name, b.shortCode, b.location, b.campus, b.seats, b.currentOccupancy, b.holdingsCount, b.headLibrarian, b.phone, b.email, b.openingHours, b.status]
        );
      }
      console.log(`✓ Seeded ${BRANCHES.length} Campus Library Branches`);

      // 2. Seed Patron Policies
      for (const [role, p] of Object.entries(PATRON_POLICIES)) {
        await runQuery(
          `INSERT OR REPLACE INTO patron_policies (role, max_borrow_limit, loan_duration_days, daily_fine_rate, reserve_limit, digital_access_enabled, study_room_quota_hours)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            role,
            p.maxLoans || p.maxBorrowLimit || 5,
            p.loanPeriodDays || p.loanDurationDays || 14,
            p.finePerDay || p.dailyFineRate || 100,
            p.reserveMax || p.reserveLimit || 3,
            1,
            p.studyRoomQuotaHours || 4
          ]
        );
      }
      console.log(`✓ Seeded Patron Policy Matrix (Student, Faculty, Staff)`);

      // 3. Seed Patrons
      for (const pat of INITIAL_PATRONS) {
        await runQuery(
          `INSERT OR REPLACE INTO patrons (id, matric, library_id, name, role, category, department, faculty, level, programme, email, phone, pin, pin_created_at, status, borrow_quota, active_loans_count, overdue_count, outstanding_fines, clearance_status, registered_branch, valid_until, photo_url, research_interests, orcid, profile_completion)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            pat.id, pat.matric, pat.libraryId, pat.name, pat.role, pat.category, pat.department, pat.faculty, pat.level, pat.programme,
            pat.email, pat.phone, pat.pin || '1234', pat.pinCreatedAt || new Date().toISOString(), pat.status, pat.borrowQuota,
            pat.activeLoansCount, pat.overdueCount, pat.outstandingFines, pat.clearanceStatus, pat.registeredBranch,
            pat.validUntil, pat.photoUrl, JSON.stringify(pat.researchInterests || []), pat.orcid, pat.profileCompletion || 90
          ]
        );
      }
      console.log(`✓ Seeded ${INITIAL_PATRONS.length} Patron Profiles with 4-Digit Security PINs`);

      // 4. Seed Books & Digital Monographs
      for (const book of INITIAL_BOOKS) {
        await runQuery(
          `INSERT OR REPLACE INTO books (id, title, subtitle, author, author_credentials, author_affiliation, orcid, co_authors, subject, department, course_code, target_level, branch, shelf_location, call_number, isbn, doi, publisher, year, edition, pdf_pages, file_size, file_name, file_data_url, external_url, is_digital, access_level, rights_status, copies_total, copies_available, rating, citations, abstract, keywords, chapters, references_data, reference_style, uploaded_at, uploaded_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            book.id, book.title, book.subtitle || '', book.author, book.authorCredentials || '', book.authorAffiliation || '', book.orcid || '',
            book.coAuthors || '', book.subject, book.department, book.courseCode, book.targetLevel, book.branch, book.shelfLocation, book.callNumber,
            book.isbn, book.doi, book.publisher, book.year, book.edition, book.pdfPages || 0, book.fileSize || '', book.fileName || '',
            book.fileDataUrl || '', book.externalUrl || '', book.isDigital ? 1 : 0, book.accessLevel || 'Open Access Full-Text', book.rightsStatus || '',
            book.copiesTotal || 1, book.copiesAvailable || 1, book.rating || 5.0, book.citations || 0, book.abstract,
            JSON.stringify(book.keywords || []), JSON.stringify(book.chapters || []), JSON.stringify(book.references || []), book.referenceStyle || 'APA 7th',
            book.uploadedAt || new Date().toISOString(), book.uploadedBy || 'Cataloging Authority'
          ]
        );
      }
      console.log(`✓ Seeded ${INITIAL_BOOKS.length} Catalogued Volumes & Digital Books`);

      // 5. Seed Courses
      for (const c of INITIAL_COURSES) {
        await runQuery(
          `INSERT OR REPLACE INTO courses (code, title, department, faculty, level, semester, lecturer, enrolled_students, required_texts, recommended_texts, past_exams, lecture_packs)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            c.code, c.title, c.department, c.faculty, c.level, c.semester, c.lecturer, c.enrolledStudents,
            JSON.stringify(c.requiredTexts || []), JSON.stringify(c.recommendedTexts || []), JSON.stringify(c.pastExams || []), JSON.stringify(c.lecturePacks || [])
          ]
        );
      }
      console.log(`✓ Seeded ${INITIAL_COURSES.length} Academic Department Courses with Past Exams & Reserves`);

      // 6. Seed Loans
      for (const loan of INITIAL_LOANS) {
        await runQuery(
          `INSERT OR REPLACE INTO loans (id, matric, patron_name, book_id, book_title, author, call_number, branch, borrow_date, due_date, return_date, renewal_count, status, fine_amount, rfid_tag)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            loan.id, loan.matric, loan.studentName || loan.patronName || 'Scholar', loan.bookId, loan.bookTitle, loan.author, loan.callNumber,
            loan.branch, loan.borrowDate, loan.dueDate, loan.returnDate || null, loan.renewalCount || 0, loan.status, loan.fine || loan.fineAmount || 0, loan.rfidTag || loan.barcode || ''
          ]
        );
      }
      console.log(`✓ Seeded ${INITIAL_LOANS.length} Circulation Loan Records`);

      // 6b. Seed Reservations
      for (const res of INITIAL_RESERVATIONS) {
        await runQuery(
          `INSERT OR REPLACE INTO reservations (id, matric, patron_name, book_id, book_title, call_number, reserved_date, expiry_date, status, pickup_branch, queue_position)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            res.id, res.matric, res.studentName || res.patronName || 'Scholar', res.bookId, res.title || res.bookTitle || 'Reserved Book', res.callNumber || '',
            res.reservedDate || '2026-09-15', res.expiryDate || '2026-09-25', res.status || 'Available', res.pickupLocation || res.pickupBranch || 'Main Campus Library', res.queuePosition || 1
          ]
        );
      }
      console.log(`✓ Seeded ${INITIAL_RESERVATIONS.length} Book Reservations`);

      // 7. Seed Theses
      for (const th of INITIAL_THESES) {
        await runQuery(
          `INSERT OR REPLACE INTO theses (id, title, author, matric, year, advisor, department, faculty, degree, status, access, downloads, citations, doi, file_size, file_name, abstract, submitted_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            th.id, th.title, th.author, th.matric, th.year, th.advisor, th.department, th.faculty, th.degree,
            th.status, th.access, th.downloads || 0, th.citations || 0, th.doi, th.fileSize, th.fileName, th.abstract, new Date().toISOString()
          ]
        );
      }
      console.log(`✓ Seeded ${INITIAL_THESES.length} Institutional Theses & Dissertations`);

      // 8. Seed Study Rooms & Bookings
      for (const rm of INITIAL_STUDY_ROOMS) {
        await runQuery(
          `INSERT OR REPLACE INTO study_rooms (id, name, branch, capacity, type, amenities, status, available_today)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [rm.id, rm.name, rm.floor || rm.branch || 'Main Campus Library', rm.capacity, rm.type, JSON.stringify(rm.facilities || rm.amenities || []), rm.status || 'Available', rm.availableTimeSlots ? rm.availableTimeSlots.join(', ') : 'All Day']
        );
      }
      for (const rb of INITIAL_ROOM_BOOKINGS) {
        await runQuery(
          `INSERT OR REPLACE INTO room_bookings (id, matric, room_id, room_name, branch, date, time_slot, duration_hours, purpose, status, check_in_code)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [rb.id, rb.matric, rb.roomId, rb.roomName, rb.branch || 'Main Campus Library', rb.date, rb.timeSlot, rb.durationHours || 2, rb.purpose || 'Academic Study', rb.status || 'Confirmed', rb.checkInCode || 'CHK-101']
        );
      }
      console.log(`✓ Seeded ${INITIAL_STUDY_ROOMS.length} Campus Study Rooms & Bookings`);

      // 9. Seed Partner Consortia Libraries
      for (const pl of INITIAL_PARTNER_LIBRARIES) {
        await runQuery(
          `INSERT OR REPLACE INTO partner_libraries (id, institution, country, opac_url, z3950_host, port, database_name, active_holdings, status, sync_mode)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [pl.id, pl.name || pl.institution || 'Consortia Library', pl.country || 'Nigeria', pl.opacUrl || pl.url || '', pl.z3950Host || 'opac.edu.ng', pl.port || 210, pl.databaseName || 'OPAC', pl.holdingsCount || 100000, pl.status || 'Active', pl.syncMode || 'Live Federated Search']
        );
      }
      console.log(`✓ Seeded ${INITIAL_PARTNER_LIBRARIES.length} Consortia Gateway Libraries (UI, OAU, NLN, UNILAG)`);

      // 10. Seed Acquisitions
      for (const acq of INITIAL_ACQUISITIONS) {
        await runQuery(
          `INSERT OR REPLACE INTO acquisitions (id, title, author, publisher, isbn, department, requested_by, requester_role, cost_estimate_ngn, copies_requested, status, date_requested, priority, justification)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [acq.id, acq.title, acq.author || 'Academic Author', acq.vendor || acq.publisher || 'FCC Academic Press', acq.isbn || '', acq.department || 'General', acq.requestedBy || 'Staff Librarian', acq.requesterRole || 'Faculty', acq.budget || acq.costEstimateNgn || 150000, acq.copiesRequested || 1, acq.status || 'Approved', acq.date || acq.dateRequested || '2026-09-14', acq.priority || 'High', acq.justification || 'Course curriculum requirement']
        );
      }
      console.log(`✓ Seeded ${INITIAL_ACQUISITIONS.length} Procurement & Acquisition Requests`);

      // 11. Seed Serials
      for (const s of INITIAL_SERIALS) {
        await runQuery(
          `INSERT OR REPLACE INTO serials (id, title, issn, publisher, frequency, department, latest_volume, latest_issue, holding_summary, subscription_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [s.id, s.title, s.issn, s.publisher || 'Academic Press', s.frequency || 'Quarterly', s.department || 'General', s.latestVolume || 'Vol. 1', s.latestIssue || 'Issue 1', s.holdingSummary || 'All holdings intact', s.status || s.subscriptionStatus || 'Active']
        );
      }
      console.log(`✓ Seeded ${INITIAL_SERIALS.length} Serials & Periodicals Records`);

      // 12. Seed Reading Lists
      for (const rl of INITIAL_READING_LISTS) {
        await runQuery(
          `INSERT OR REPLACE INTO reading_lists (id, matric, title, description, is_public, item_count, items)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [rl.id, rl.matric, rl.name || rl.title || 'Research Reading List', rl.description, rl.isPublic ? 1 : 0, rl.itemCount || rl.items?.length || 0, JSON.stringify(rl.items || [])]
        );
      }

      // 13. Seed Continue Reading
      for (const cr of INITIAL_CONTINUE_READING) {
        await runQuery(
          `INSERT OR REPLACE INTO continue_reading (id, matric, book_id, title, author, last_page, total_pages, progress, last_opened)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [cr.id || `${cr.matric}-${cr.bookId}`, cr.matric, cr.bookId, cr.title, cr.author, cr.lastPage, cr.totalPages, cr.progress, cr.lastOpened]
        );
      }

      // 14. Seed Audit Logs & Announcements
      for (const al of INITIAL_AUDIT_LOGS) {
        await runQuery(
          `INSERT OR REPLACE INTO audit_logs (id, timestamp, actor, role, action, resource_type, resource_id, details, ip_address, hash)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [al.id, al.timestamp, al.user || al.actor || 'Administrator', al.role || 'SUPER_ADMIN', al.action || 'LOG_ENTRY', al.resourceType || 'CATALOG', al.resourceId || al.id, al.detail || al.details || '', al.ipAddress || '127.0.0.1', al.hash || 'sha256-verified']
        );
      }

      for (const ann of INITIAL_ANNOUNCEMENTS) {
        await runQuery(
          `INSERT OR REPLACE INTO announcements (id, title, content, category, priority, author, date, valid_until)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [ann.id, ann.title, ann.message || ann.content || '', ann.priority || ann.category || 'General', ann.priority || 'Normal', ann.author || 'Library Directorate', ann.date || '2026-09-18', ann.validUntil || '2027-09-18']
        );
      }

      console.log('\n=============================================================');
      console.log('✅ DATABASE INITIALIZATION & SEEDING COMPLETED SUCCESSFULLY!');
      console.log('=============================================================');
      console.log(`Database brainfeels_library is active and ready for REST API queries.\n`);
      
      db.close();
      process.exit(0);
    });
  } catch (err) {
    console.error('❌ Seeding Error:', err);
    process.exit(1);
  }
});
