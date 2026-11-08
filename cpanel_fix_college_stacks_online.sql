-- =========================================================================
-- FCC SMART LIBRARY & DIGITAL REPOSITORY PLATFORM
-- PRODUCTION CPANEL DATABASE FIX & COLLEGE STACKS ONLINE SYNC SCRIPT
-- Target Database: gsashtub_brainfeels_library
-- Server: as124.truehost.cloud (cPanel phpMyAdmin)
-- Generated: 2026-11-05
-- =========================================================================

SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET time_zone = '+00:00';
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -------------------------------------------------------------------------
-- STEP 1: CONFIGURE DIRECT PUBLISHING MODE IN LIBRARY SETTINGS
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

INSERT INTO `library_settings` (`setting_key`, `setting_value`, `setting_group`, `value_type`, `is_public`, `description`)
VALUES ('hod_upload_approval_mode', 'direct', 'hod_publishing', 'string', 1, 'HOD Upload Direct Publishing Mode')
ON DUPLICATE KEY UPDATE `setting_value` = 'direct', `updated_at` = current_timestamp();

INSERT INTO `library_settings` (`setting_key`, `setting_value`, `setting_group`, `value_type`, `is_public`, `description`)
VALUES ('opac_books_per_page', '12', 'opac', 'integer', 1, 'Default number of books displayed per page on OPAC College Stacks')
ON DUPLICATE KEY UPDATE `setting_value` = IF(`setting_value` IS NULL OR `setting_value` = '', '12', `setting_value`), `updated_at` = current_timestamp();

-- -------------------------------------------------------------------------
-- STEP 2: ENSURE CRITICAL COLUMNS EXIST IN `books` AND `department_uploads`
-- -------------------------------------------------------------------------
SET @dbname = DATABASE();

-- 2A. `books`.`file_path`
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'books' AND COLUMN_NAME = 'file_path');
SET @query = IF(@col_exists = 0, 'ALTER TABLE `books` ADD COLUMN `file_path` varchar(500) DEFAULT NULL AFTER `file_name`', 'SELECT 1');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2B. `books`.`file_data_url`
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'books' AND COLUMN_NAME = 'file_data_url');
SET @query = IF(@col_exists = 0, 'ALTER TABLE `books` ADD COLUMN `file_data_url` longtext DEFAULT NULL AFTER `file_path`', 'SELECT 1');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2C. `books`.`cover_data_url`
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'books' AND COLUMN_NAME = 'cover_data_url');
SET @query = IF(@col_exists = 0, 'ALTER TABLE `books` ADD COLUMN `cover_data_url` longtext DEFAULT NULL AFTER `cover_image`', 'SELECT 1');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2D. `books`.`status`
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'books' AND COLUMN_NAME = 'status');
SET @query = IF(@col_exists = 0, 'ALTER TABLE `books` ADD COLUMN `status` varchar(50) DEFAULT "approved" AFTER `rights_status`', 'SELECT 1');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2E. `books`.`category`
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'books' AND COLUMN_NAME = 'category');
SET @query = IF(@col_exists = 0, 'ALTER TABLE `books` ADD COLUMN `category` varchar(100) DEFAULT "Book" AFTER `edition`', 'SELECT 1');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2F. `department_uploads`.`file_path`
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'department_uploads' AND COLUMN_NAME = 'file_path');
SET @query = IF(@col_exists = 0, 'ALTER TABLE `department_uploads` ADD COLUMN `file_path` varchar(500) DEFAULT NULL AFTER `file_name`', 'SELECT 1');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2F. `department_uploads`.`file_data_url`
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'department_uploads' AND COLUMN_NAME = 'file_data_url');
SET @query = IF(@col_exists = 0, 'ALTER TABLE `department_uploads` ADD COLUMN `file_data_url` longtext DEFAULT NULL AFTER `file_path`', 'SELECT 1');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2G. `department_uploads`.`book_id`
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'department_uploads' AND COLUMN_NAME = 'book_id');
SET @query = IF(@col_exists = 0, 'ALTER TABLE `department_uploads` ADD COLUMN `book_id` varchar(50) DEFAULT NULL AFTER `assigned_shelf`', 'SELECT 1');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- -------------------------------------------------------------------------
-- STEP 3: APPROVE AND ASSIGN BOOK IDS TO ALL ACTIVE DEPARTMENT UPLOADS
-- -------------------------------------------------------------------------
UPDATE `department_uploads`
SET `status` = 'approved'
WHERE `status` IS NULL OR `status` = '' OR `status` = 'pending';

UPDATE `department_uploads`
SET `book_id` = CONCAT('FCC-HOD-', LPAD(FLOOR(RAND() * 9000 + 1000), 4, '0'))
WHERE (`book_id` IS NULL OR `book_id` = '') 
  AND (`status` NOT IN ('deleted', 'withdrawn', 'purged', 'rejected', 'declined'));

-- -------------------------------------------------------------------------
-- STEP 4: ENSURE ALL EXISTING BOOKS ARE SET TO 'APPROVED' (VISIBLE)
-- AND CLASSIFY PROPERLY INTO BOOKS VS JOURNALS
-- -------------------------------------------------------------------------
UPDATE `books`
SET `status` = 'approved'
WHERE `status` IS NULL OR `status` = '' OR `status` = 'pending';

UPDATE `books` 
SET `category` = 'Journal' 
WHERE `id` LIKE 'FCC-JRN-%' OR `call_number` LIKE 'JRN-%' OR LOWER(`rights_status`) LIKE '%journal%';

UPDATE `books` 
SET `category` = 'Student Project' 
WHERE `id` LIKE 'FCC-PRJ-%' OR `id` LIKE 'TH-%' OR `call_number` LIKE 'ETD-%' OR LOWER(`rights_status`) LIKE '%project%';

UPDATE `books` 
SET `category` = 'Book' 
WHERE `category` IS NULL OR `category` = '' OR (`category` != 'Journal' AND `category` != 'Student Project');

-- -------------------------------------------------------------------------
-- STEP 5: PROMOTE ALL ACTIVE DEPARTMENT UPLOADS INTO THE `books` TABLE
-- (Instant synchronization: makes every HOD uploaded book live in College Stacks)
-- -------------------------------------------------------------------------
INSERT INTO `books` (
    `id`, `title`, `subtitle`, `author`, `author_credentials`, `author_affiliation`,
    `subject`, `department`, `course_code`, `target_level`, `branch`,
    `shelf_location`, `call_number`, `publisher`, `year`, `edition`, `category`,
    `pdf_pages`, `file_size`, `file_name`, `file_path`, `file_data_url`,
    `cover_image`, `is_digital`, `access_level`, `rights_status`, `status`,
    `copies_total`, `copies_available`, `rating`, `citations`, `abstract`,
    `uploaded_at`, `uploaded_by`
)
SELECT 
    du.book_id,
    du.title,
    IF(du.course_code IS NOT NULL AND du.course_code != '', CONCAT('Course: ', du.course_code, ' (', IFNULL(du.target_level, 'HND II'), ')'), 'Departmental Academic Curriculum'),
    IFNULL(du.author, IFNULL(du.hod_name, 'Department Faculty')),
    'Faculty Contributor / HOD',
    CONCAT('Federal Co-operative College, Ibadan (', IFNULL(du.department_name, 'Academic Department'), ')'),
    IFNULL(du.department_name, 'Academic Studies'),
    IFNULL(du.department_name, 'Academic Department'),
    IFNULL(du.course_code, 'GEN 101'),
    IFNULL(du.target_level, 'HND II'),
    'Main Campus Library (Prof. Hezekiah Complex)',
    IFNULL(du.assigned_shelf, 'Digital E-Library'),
    IFNULL(du.assigned_call_number, 'QA76.9 .FCC 2026'),
    CONCAT('FCC Department of ', IFNULL(du.department_name, 'Academic Studies'), ' Press'),
    YEAR(IFNULL(du.created_at, NOW())),
    '1st Official Edition',
    IF(du.resource_type LIKE '%Journal%' OR du.resource_type LIKE '%Article%' OR du.resource_type LIKE '%Periodical%' OR du.book_id LIKE 'FCC-JRN-%', 'Journal', IF(du.resource_type LIKE '%Project%' OR du.resource_type LIKE '%Thesis%' OR du.book_id LIKE 'FCC-PRJ-%', 'Student Project', 'Book')),
    120,
    '4.5 MB',
    du.file_name,
    IFNULL(du.file_path, du.file_name),
    IFNULL(du.file_data_url, ''),
    IFNULL(du.cover_image, '/assets/fcc-logo.png'),
    1,
    IFNULL(du.access_scope, 'Public Institution-Wide'),
    'Approved Academic Book',
    'approved',
    10,
    10,
    5.0,
    0,
    CONCAT('Official academic resource uploaded by ', IFNULL(du.hod_name, 'HOD'), ' for ', IFNULL(du.department_name, 'Department'), '.'),
    IFNULL(du.created_at, NOW()),
    IFNULL(du.hod_name, 'Department HOD')
FROM `department_uploads` du
LEFT JOIN `books` b ON (b.id = du.book_id OR b.id = du.id)
WHERE (du.status IS NULL OR du.status NOT IN ('deleted', 'withdrawn', 'purged', 'rejected', 'declined'))
  AND du.book_id IS NOT NULL AND du.book_id != ''
  AND b.id IS NULL;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================================
-- VERIFICATION CHECK: Check counts of books and uploads
-- =========================================================================
SELECT COUNT(*) AS total_books_in_catalog FROM `books` WHERE `status` = 'approved';
SELECT COUNT(*) AS total_approved_department_uploads FROM `department_uploads` WHERE `status` = 'approved';

