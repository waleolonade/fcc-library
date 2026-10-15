========================================================================
FCC SMART LIBRARY & DIGITAL REPOSITORY - CPANEL DEPLOYMENT PACKAGE
Database: gsashtub_brainfeels_library
User:     gsashtub_brainfeels_library
Password: brainfeels_library
========================================================================

CONTENTS OF THIS ZIP:
1. dist/
   -> Upload all files and folders inside dist/ directly into your cPanel public_html/ (or domain web root).
   -> Contains compiled React frontend with:
      - Register New Academic Department with automatic HOD user creation and user_roles wiring.
      - Public OPAC Institutional Catalog Holdings with real-time cover images.
      - Admin Login connected directly to MySQL gsashtub_brainfeels_library.users.
      - Live API integration with 37 system endpoints.

2. backend/
   -> Upload the contents of backend/ into your cPanel backend directory:
      - backend/app/Models/ (Role, Permission, User, Department, Category, Subject, Location, Shelf, DigitalResource, HelpdeskTicket, InterlibraryRequest, ReadingList, ReadingListItem, Notification, Serial)
      - backend/app/Services/ (DatabaseService.php with dual environment auto-detection)
      - backend/app/Http/Controllers/ (DepartmentUploadController, PolicyController, PatronController, AuthController, CatalogController, LibraryApiController, LibrarySystemController, ThesisController)
      - backend/config/database.php
      - backend/routes/api.php
      - backend/database/database.sqlite
      - backend/.env

3. update_cpanel_users_and_covers.sql
   -> Open phpMyAdmin on cPanel -> Select database `gsashtub_brainfeels_library`
   -> Click 'Import' tab -> Select `update_cpanel_users_and_covers.sql` -> Click 'Go'
   -> It automatically creates and populates all 60 production tables:
      - `users` (10 users with bcrypt hashed passwords + active role assignments)
      - `roles` (admin, chief_librarian, cataloguer, circulation_clerk, hod, faculty, student, guest)
      - `permissions` & `role_permissions` (52 permission mappings)
      - `user_roles` (mapped pivot table for all users)
      - `departments` (all 7 academic departments: CEM, CSC, BNF, AGR, BAM, PAD, MKT)
      - `library_apis` (all 37 system API registry entries)
      - `subjects` (12 academic subjects)
      - `categories` (9 classification categories)
      - `simple_lib_books` & `simple_lib_authors` (6 authors, 8 books)
      - `digital_resources` (5 digital assets)
      - `course_reserves` (6 course reserves)
      - `locations` (6 library physical zones)
      - `fines` & `payments`
      - `helpdesk_tickets` & `interlibrary_requests`
      - `notifications` & `reading_lists`
      - `shelves`, `courses`, `theses`, `serials`, `announcements`, `audit_logs`

4. database/init-db.php
   -> You can also initialize or update the database directly from the terminal with:
      php database/init-db.php
      or via npm:
      npm run init-db
   -> Or trigger it via HTTP POST at: /api/database/init

========================================================================
CREDENTIALS:
- Admin Email: admin@fccibadan.edu.ng (or admin@fccibadan.com.ng / librarian@fccibadanlibrary.com.ng)
- Password: admin123
- HOD Default PIN: 1234
========================================================================
