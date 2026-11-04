-- =========================================================================
-- FCC SMART LIBRARY & DIGITAL REPOSITORY PLATFORM
-- PRODUCTION CPANEL DATABASE MIGRATION & SYSTEM UPDATE SCRIPT
-- Target Database: gsashtub_brainfeels_library
-- Server: as124.truehost.cloud (cPanel phpMyAdmin)
-- Generated: 2026-11-04
-- =========================================================================

SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET time_zone = '+00:00';
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -------------------------------------------------------------------------
-- STEP 1: ENSURE `library_settings` TABLE EXISTS
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `library_settings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(255) NOT NULL,
  `setting_value` longtext DEFAULT NULL,
  `setting_group` varchar(100) DEFAULT 'general',
  `value_type` varchar(50) DEFAULT 'string',
  `is_public` tinyint(1) DEFAULT 1,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `library_settings_key_unique` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- STEP 2: ENSURE `audit_logs` TABLE EXISTS
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` varchar(64) NOT NULL,
  `user_id` varchar(100) DEFAULT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `resource_type` varchar(100) DEFAULT NULL,
  `resource_id` varchar(255) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(64) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- STEP 2B: ENSURE `hod_department_staff` TABLE EXISTS (STAFF UNDER HODS)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `hod_department_staff` (
  `id` varchar(64) NOT NULL,
  `staff_code` varchar(64) NOT NULL,
  `username` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(64) DEFAULT NULL,
  `designation` varchar(150) DEFAULT 'Senior Lecturer',
  `department_code` varchar(32) NOT NULL,
  `department_name` varchar(255) DEFAULT NULL,
  `assigned_courses` text DEFAULT NULL,
  `page_title` varchar(255) DEFAULT NULL,
  `welcome_banner` text DEFAULT NULL,
  `allowed_pages` longtext DEFAULT NULL,
  `allowed_features` longtext DEFAULT NULL,
  `password_plain` varchar(120) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `status` varchar(32) DEFAULT 'active',
  `created_by_hod` varchar(255) DEFAULT NULL,
  `last_login_at` varchar(64) DEFAULT NULL,
  `created_at` varchar(64) DEFAULT NULL,
  `updated_at` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_hod_dept_code` (`department_code`),
  KEY `idx_hod_staff_code` (`staff_code`),
  KEY `idx_hod_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Default Departmental Staff Workspaces if missing
INSERT INTO `hod_department_staff` (`id`, `staff_code`, `username`, `name`, `email`, `phone`, `designation`, `department_code`, `department_name`, `assigned_courses`, `page_title`, `welcome_banner`, `allowed_pages`, `allowed_features`, `password_plain`, `password_hash`, `status`, `created_by_hod`, `created_at`, `updated_at`)
VALUES
('STF-CEM-001', 'STF/CEM/001', 'cem_coordinator', 'Dr. Tunde Olatunji (CEM)', 'cem.coordinator@fccibadan.edu.ng', '+234 803 412 8890', 'Senior Lecturer & Course Coordinator', 'CEM', 'Co-operative Economics & Management', '["CEM 411", "CEM 312", "CEM 214"]', 'CEM Curriculum & Publishing Workspace', 'Authorized by Head of Department (Co-operative Economics & Management) to manage syllabi, upload course materials, and oversee reserves.', '{"overview":true,"courses":true,"upload":true,"submissions":true,"dissertations":false,"reserves":true,"scholars":false,"communication":true}', '{"fn_upload_books":true,"fn_upload_journals":true,"fn_watermark_control":true,"fn_edit_submissions":true,"fn_delete_submissions":false,"fn_manage_courses":true,"fn_approve_dissertations":false,"fn_upload_dissertations":false,"fn_manage_reserves":true,"fn_manage_students":false,"fn_approve_clearance":false,"fn_send_dispatch":true,"fn_ai_gora_tools":true}', 'cemstaff123', '$2y$10$wEeVq05P1V0iW0V1E0QYw.m2B3x1A6K3qU9yD4e5f6g7h8i9j0k1l', 'active', 'HOD CEM', NOW(), NOW()),
('STF-BF-001', 'STF/BF/001', 'bf_coordinator', 'Dr. A. B. Adeyeye (BF)', 'bf.coordinator@fccibadan.edu.ng', '+234 802 334 5567', 'Senior Lecturer & Academic Coordinator', 'BF', 'Banking and Finance', '["BFN 411", "BFN 312", "BFN 211"]', 'Banking & Finance Academic Workspace', 'Authorized by Head of Department (Banking and Finance) to manage course materials, textbooks, and reading lists.', '{"overview":true,"courses":true,"upload":true,"submissions":true,"dissertations":true,"reserves":true,"scholars":false,"communication":true}', '{"fn_upload_books":true,"fn_upload_journals":true,"fn_watermark_control":true,"fn_edit_submissions":true,"fn_delete_submissions":false,"fn_manage_courses":true,"fn_approve_dissertations":true,"fn_upload_dissertations":true,"fn_manage_reserves":true,"fn_manage_students":false,"fn_approve_clearance":false,"fn_send_dispatch":true,"fn_ai_gora_tools":true}', 'bfstaff123', '$2y$10$wEeVq05P1V0iW0V1E0QYw.m2B3x1A6K3qU9yD4e5f6g7h8i9j0k1l', 'active', 'HOD BF', NOW(), NOW()),
('STF-OAO-EHWU', 'STF/OAO/009', 'oao_lecturer9', 'OLAWALE AKEEM OLONADE', 'homecrew.ng@gmail.com', '+234 803 000 0000', 'Senior Lecturer & Course Coordinator', 'OAO', 'Academic Department', '["OAO 411", "OAO 312"]', 'Faculty Staff Academic Workspace', 'Authorized by Head of Department to manage assigned departmental academic modules.', '{"overview":true,"courses":true,"upload":true,"submissions":true,"dissertations":true,"reserves":true,"scholars":true,"communication":true}', '{"fn_upload_books":true,"fn_upload_journals":true,"fn_watermark_control":true,"fn_edit_submissions":true,"fn_delete_submissions":true,"fn_manage_courses":true,"fn_approve_dissertations":true,"fn_upload_dissertations":true,"fn_manage_reserves":true,"fn_manage_students":true,"fn_approve_clearance":true,"fn_send_dispatch":true,"fn_ai_gora_tools":true}', '1234', '$2y$12$ZH6iAUwwleb/mr7rcb95EOxdHepBgvV2MGRxUvP0qpp/kKMVMQ0pW', 'active', 'Head of Department', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  `allowed_pages` = VALUES(`allowed_pages`),
  `allowed_features` = VALUES(`allowed_features`),
  `status` = 'active',
  `updated_at` = NOW();

-- -------------------------------------------------------------------------
-- STEP 3: SEED MASTER DEVELOPER CONFIG & 14 EXTERNAL LIBRARY APIS
-- -------------------------------------------------------------------------
INSERT INTO `library_settings` (`setting_key`, `setting_value`, `setting_group`, `value_type`, `is_public`, `description`, `created_at`, `updated_at`)
VALUES
('fcc_developer_master_config', '{
  "branding": {
    "projectName": "FCC Digital Library & Integrated Information System",
    "institutionName": "Federal Co-operative College, Ibadan",
    "shortName": "FCC IBADAN",
    "libraryTitle": "Directorate of Library & Information Services",
    "slogan": "Knowledge, Co-operation, Digital Innovation & Academic Excellence",
    "logoUrl": "/assets/fcc-logo.png"
  },
  "theme": {
    "activePreset": "emerald_gold",
    "adminPrimary": "#4f46e5",
    "studentPrimary": "#059669",
    "hodPrimary": "#0d9488",
    "cardBg": "#071836",
    "accentColor": "#10b981"
  },
  "externalLibraryApis": {
    "sciencedirect": {
      "id": "sciencedirect",
      "name": "Elsevier ScienceDirect & Scopus",
      "provider": "Elsevier B.V.",
      "category": "Peer-Reviewed Science, Engineering & Medicine",
      "badge": "Live Elsevier Key",
      "color": "#ff6f00",
      "enabled": true,
      "description": "Direct searching across 18M+ peer-reviewed articles, citations, and abstracts with live Elsevier API Key.",
      "endpoint": "https://api.elsevier.com/content/search/scopus"
    },
    "agora": {
      "id": "agora",
      "name": "AGORA (Research4Life / FAO AGRIS)",
      "provider": "Food and Agriculture Organization (FAO / UN)",
      "category": "Agriculture & Life Sciences",
      "badge": "Research4Life Gateway",
      "color": "#16a34a",
      "enabled": true,
      "description": "Global literature on agriculture, veterinary, food security, and rural cooperative economics.",
      "endpoint": "https://agora.research4life.org/"
    },
    "jstor": {
      "id": "jstor",
      "name": "JSTOR Academic Repository",
      "provider": "ITHAKA / JSTOR",
      "category": "Humanities & Social Sciences",
      "badge": "Scholarly Archive",
      "color": "#991b1b",
      "enabled": true,
      "description": "Archival and primary sources, journals, and monographs across humanities and social sciences.",
      "endpoint": "https://www.jstor.org/"
    },
    "ebsco": {
      "id": "ebsco",
      "name": "EBSCOhost Discovery & Research Databases",
      "provider": "EBSCO Information Services",
      "category": "Multidisciplinary Periodicals",
      "badge": "EDS Gateway",
      "color": "#0284c7",
      "enabled": true,
      "description": "Academic Search, Business Source, and periodical indexing across thousands of publishers.",
      "endpoint": "https://search.ebscohost.com/"
    },
    "openalex": {
      "id": "openalex",
      "name": "OpenAlex Scholarly Engine",
      "provider": "OurResearch (CC0 Open Catalog)",
      "category": "Global Research Index",
      "badge": "250M+ Papers",
      "color": "#0d9488",
      "enabled": true,
      "description": "Massive open index of scholarly papers, authors, citations, institutions, and topics.",
      "endpoint": "https://api.openalex.org/works"
    },
    "google_books": {
      "id": "google_books",
      "name": "Google Books API",
      "provider": "Google LLC",
      "category": "World Book Index",
      "badge": "Global Monograph",
      "color": "#4285f4",
      "enabled": true,
      "description": "Search comprehensive previews, bibliographic metadata, and digitized pages worldwide.",
      "endpoint": "https://www.googleapis.com/books/v1/volumes"
    },
    "openlibrary": {
      "id": "openlibrary",
      "name": "Open Library Catalog",
      "provider": "Internet Archive",
      "category": "Universal Library",
      "badge": "Open Lending",
      "color": "#e11d48",
      "enabled": true,
      "description": "Open, editable library catalog for every book ever published with covers and borrowing editions.",
      "endpoint": "https://openlibrary.org/search.json"
    },
    "gutenberg": {
      "id": "gutenberg",
      "name": "Project Gutenberg (Gutendex)",
      "provider": "Project Gutenberg Literary Archive",
      "category": "Public Domain Classics",
      "badge": "70,000+ E-Books",
      "color": "#d97706",
      "enabled": true,
      "description": "Free digital library of public domain classics available in full EPUB, HTML, and text.",
      "endpoint": "https://gutendex.com/books"
    },
    "archive": {
      "id": "archive",
      "name": "Internet Archive Books & Texts",
      "provider": "Internet Archive",
      "category": "Digital Preservation",
      "badge": "Full PDF Scans",
      "color": "#475569",
      "enabled": true,
      "description": "Millions of scanned historical books, academic manuscripts, and open PDF downloads.",
      "endpoint": "https://archive.org/advancedsearch.php"
    },
    "europe_pmc": {
      "id": "europe_pmc",
      "name": "Europe PMC Open Access",
      "provider": "EMBL-EBI",
      "category": "Life Sciences & Biomedicine",
      "badge": "Full-Text OA",
      "color": "#059669",
      "enabled": true,
      "description": "Worldwide life sciences research papers, PubMed Central Europe full-text articles.",
      "endpoint": "https://www.ebi.ac.uk/europepmc/webservices/rest/search"
    },
    "crossref": {
      "id": "crossref",
      "name": "CrossRef Metadata Search",
      "provider": "Crossref",
      "category": "Official DOI Registry",
      "badge": "DOI Engine",
      "color": "#ea580c",
      "enabled": true,
      "description": "Authoritative metadata for 150M+ academic journal articles, books, and proceedings via DOI.",
      "endpoint": "https://api.crossref.org/works"
    },
    "doaj": {
      "id": "doaj",
      "name": "DOAJ (Directory of Open Access Journals)",
      "provider": "Infrastructure Services for Open Access",
      "category": "Peer-Reviewed Open Access",
      "badge": "Vetted Quality",
      "color": "#ca8a04",
      "enabled": true,
      "description": "Curated directory of peer-reviewed open access journals and articles across all disciplines.",
      "endpoint": "https://doaj.org/api/v2/search/articles"
    },
    "trove": {
      "id": "trove",
      "name": "Trove National Archives",
      "provider": "National Library of Australia",
      "category": "National Archive",
      "badge": "Historical Digits",
      "color": "#0891b2",
      "enabled": true,
      "description": "Digitized historical books, manuscripts, parliamentary papers, gazettes, and maps.",
      "endpoint": "https://api.trove.nla.gov.au/v3/result"
    },
    "core": {
      "id": "core",
      "name": "CORE Open Access Research",
      "provider": "CORE (Open University & Jisc)",
      "category": "Institutional Repositories",
      "badge": "Open Repository",
      "color": "#6366f1",
      "enabled": true,
      "description": "Aggregator of open access research papers from thousands of institutional repositories globally.",
      "endpoint": "https://api.core.ac.uk/v3/search/works"
    }
  }
}', 'Developer', 'json', 1, 'Master Developer visual theme, kill-switch status, and 14 External Library APIs configuration.', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  `setting_value` = VALUES(`setting_value`),
  `updated_at` = NOW();

-- -------------------------------------------------------------------------
-- STEP 4: REPAIR BOOK FCC-HOD-9314 & FIX INCORRECT IMPRINT TITLES
-- -------------------------------------------------------------------------
UPDATE `books` 
SET `title` = 'Basics of Finance',
    `subtitle` = 'Banking and Finance • Core Curriculum Module',
    `subject` = 'Banking and Finance',
    `department` = 'Banking and Finance',
    `is_digital` = 1,
    `copies_available` = 10,
    `copies_total` = 10
WHERE `id` = 'FCC-HOD-9314';

UPDATE `department_uploads` 
SET `title` = 'Basics of Finance',
    `department_name` = 'Banking and Finance',
    `status` = 'approved',
    `book_id` = 'FCC-HOD-9314'
WHERE `id` = 'FCC-HOD-9314' OR `book_id` = 'FCC-HOD-9314';

-- Clean any other records mistakenly titled with the publisher imprint 'Budapest, 2018.'
UPDATE `books`
SET `title` = 'Basics of Finance'
WHERE `title` LIKE 'Budapest, 2018%' AND (`file_name` LIKE '%Basics%Finance%' OR `id` = 'FCC-HOD-9314');

UPDATE `department_uploads`
SET `title` = 'Basics of Finance'
WHERE `title` LIKE 'Budapest, 2018%' AND (`file_name` LIKE '%Basics%Finance%' OR `id` = 'FCC-HOD-9314');

-- Link by filename if book_id was missing
UPDATE `department_uploads` 
SET `book_id` = 'FCC-HOD-9314',
    `title` = 'Basics of Finance',
    `status` = 'approved'
WHERE `file_name` LIKE '%Basics-of-Finance%';

-- -------------------------------------------------------------------------
-- STEP 5: BIDIRECTIONAL REPAIR OF FILE DATA URLS BETWEEN `books` & `department_uploads`
-- -------------------------------------------------------------------------
UPDATE `books` b
INNER JOIN `department_uploads` u ON (
  b.id = u.book_id 
  OR b.id = u.id 
  OR b.id = REPLACE(u.id, 'HOD-UP-', 'FCC-HOD-') 
  OR u.id = REPLACE(b.id, 'FCC-HOD-', 'HOD-UP-')
  OR (b.file_name = u.file_name AND b.file_name IS NOT NULL AND b.file_name != '')
)
SET b.file_data_url = u.file_data_url
WHERE (b.file_data_url IS NULL OR b.file_data_url = '') 
  AND (u.file_data_url IS NOT NULL AND u.file_data_url != '');

UPDATE `department_uploads` u
INNER JOIN `books` b ON (
  b.id = u.book_id 
  OR b.id = u.id 
  OR b.id = REPLACE(u.id, 'HOD-UP-', 'FCC-HOD-') 
  OR u.id = REPLACE(b.id, 'FCC-HOD-', 'HOD-UP-')
  OR (b.file_name = u.file_name AND b.file_name IS NOT NULL AND b.file_name != '')
)
SET u.file_data_url = b.file_data_url
WHERE (u.file_data_url IS NULL OR u.file_data_url = '') 
  AND (b.file_data_url IS NOT NULL AND b.file_data_url != '');

-- -------------------------------------------------------------------------
-- STEP 6: SYNC APPROVED `department_uploads` INTO `books` TABLE
-- (Uses ONLY universally present columns in both tables so it never fails)
-- -------------------------------------------------------------------------
INSERT INTO `books` (
  `id`,
  `title`,
  `author`,
  `department`,
  `course_code`,
  `target_level`,
  `file_name`,
  `file_data_url`,
  `is_digital`,
  `copies_total`,
  `copies_available`,
  `access_level`,
  `uploaded_at`,
  `uploaded_by`
)
SELECT 
  COALESCE(NULLIF(u.book_id, ''), u.id) AS id,
  u.title,
  u.author,
  u.department_name AS department,
  u.course_code,
  u.target_level,
  u.file_name,
  u.file_data_url,
  1 AS is_digital,
  10 AS copies_total,
  10 AS copies_available,
  'Open Access Full-Text' AS access_level,
  COALESCE(u.created_at, NOW()) AS uploaded_at,
  COALESCE(u.hod_name, 'HOD / Department Faculty') AS uploaded_by
FROM `department_uploads` u
WHERE u.status = 'approved'
ON DUPLICATE KEY UPDATE
  `title` = VALUES(`title`),
  `author` = VALUES(`author`),
  `department` = VALUES(`department`),
  `course_code` = COALESCE(VALUES(`course_code`), `books`.`course_code`),
  `target_level` = COALESCE(VALUES(`target_level`), `books`.`target_level`),
  `file_name` = COALESCE(VALUES(`file_name`), `books`.`file_name`),
  `file_data_url` = IF(VALUES(`file_data_url`) IS NOT NULL AND VALUES(`file_data_url`) != '', VALUES(`file_data_url`), `books`.`file_data_url`),
  `is_digital` = 1;

-- -------------------------------------------------------------------------
-- STEP 7: VERIFICATION SELECT (Run to verify database state)
-- -------------------------------------------------------------------------
SELECT 
  (SELECT COUNT(*) FROM `books`) AS total_books_in_catalog,
  (SELECT COUNT(*) FROM `department_uploads` WHERE `status` = 'approved') AS approved_hod_uploads,
  (SELECT COUNT(*) FROM `hod_department_staff`) AS total_department_staff,
  (SELECT COUNT(*) FROM `library_settings` WHERE `setting_key` = 'fcc_developer_master_config') AS developer_config_active,
  (SELECT `title` FROM `books` WHERE `id` = 'FCC-HOD-9314') AS book_9314_repaired_title,
  (SELECT LENGTH(`file_data_url`) FROM `books` WHERE `id` = 'FCC-HOD-9314') AS book_9314_pdf_data_bytes;
