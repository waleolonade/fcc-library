-- =========================================================================
-- DATABASE: brainfeels_library
-- MySQL 8.0+ Compatible Full Dump
-- Federal Co-operative College, Ibadan â€” Smart Library System
-- Generated: 2026-10-01
-- Import via: phpMyAdmin â†’ brainfeels_library â†’ Import â†’ select this file
-- =========================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";
SET NAMES utf8mb4;

-- =========================================================================
-- CREATE DATABASE (run if db doesn't exist yet)
-- =========================================================================
CREATE DATABASE IF NOT EXISTS `brainfeels_library`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `brainfeels_library`;

-- =========================================================================
-- SECTION 1: DROP TABLES IN SAFE ORDER
-- =========================================================================
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `institutional_communications`;
DROP TABLE IF EXISTS `department_uploads`;
DROP TABLE IF EXISTS `departments`;
DROP TABLE IF EXISTS `library_apis`;
DROP TABLE IF EXISTS `personal_access_tokens`;
DROP TABLE IF EXISTS `barcodes`;
DROP TABLE IF EXISTS `copies`;
DROP TABLE IF EXISTS `digital_resources`;
DROP TABLE IF EXISTS `reading_list_items`;
DROP TABLE IF EXISTS `favorites`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `fines`;
DROP TABLE IF EXISTS `library_settings`;
DROP TABLE IF EXISTS `locations`;
DROP TABLE IF EXISTS `shelves`;
DROP TABLE IF EXISTS `resource_subjects`;
DROP TABLE IF EXISTS `resource_authors`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `subjects`;
DROP TABLE IF EXISTS `publishers`;
DROP TABLE IF EXISTS `authors`;
DROP TABLE IF EXISTS `user_roles`;
DROP TABLE IF EXISTS `role_permissions`;
DROP TABLE IF EXISTS `permissions`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `sessions`;
DROP TABLE IF EXISTS `password_reset_tokens`;
DROP TABLE IF EXISTS `failed_jobs`;
DROP TABLE IF EXISTS `job_batches`;
DROP TABLE IF EXISTS `jobs`;
DROP TABLE IF EXISTS `cache_locks`;
DROP TABLE IF EXISTS `cache`;
DROP TABLE IF EXISTS `migrations`;
DROP TABLE IF EXISTS `announcements`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `reading_lists`;
DROP TABLE IF EXISTS `continue_reading`;
DROP TABLE IF EXISTS `room_bookings`;
DROP TABLE IF EXISTS `study_rooms`;
DROP TABLE IF EXISTS `reservations`;
DROP TABLE IF EXISTS `acquisitions`;
DROP TABLE IF EXISTS `serials`;
DROP TABLE IF EXISTS `partner_libraries`;
DROP TABLE IF EXISTS `courses`;
DROP TABLE IF EXISTS `loans`;
DROP TABLE IF EXISTS `theses`;
DROP TABLE IF EXISTS `books`;
DROP TABLE IF EXISTS `patron_policies`;
DROP TABLE IF EXISTS `patrons`;
DROP TABLE IF EXISTS `branches`;
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================================
-- SECTION 2: CREATE ALL TABLES
-- =========================================================================

-- -------------------------------------------------------------------------
-- users
-- -------------------------------------------------------------------------
CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `email_verified_at` TIMESTAMP NULL DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `remember_token` VARCHAR(100) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- password_reset_tokens
-- -------------------------------------------------------------------------
CREATE TABLE `password_reset_tokens` (
  `email` VARCHAR(255) NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- sessions
-- -------------------------------------------------------------------------
CREATE TABLE `sessions` (
  `id` VARCHAR(255) NOT NULL,
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `ip_address` VARCHAR(45) NULL DEFAULT NULL,
  `user_agent` TEXT NULL,
  `payload` LONGTEXT NOT NULL,
  `last_activity` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- cache
-- -------------------------------------------------------------------------
CREATE TABLE `cache` (
  `key` VARCHAR(255) NOT NULL,
  `value` MEDIUMTEXT NOT NULL,
  `expiration` INT NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cache_locks` (
  `key` VARCHAR(255) NOT NULL,
  `owner` VARCHAR(255) NOT NULL,
  `expiration` INT NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- jobs / queue
-- -------------------------------------------------------------------------
CREATE TABLE `jobs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `queue` VARCHAR(255) NOT NULL,
  `payload` LONGTEXT NOT NULL,
  `attempts` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `reserved_at` INT UNSIGNED NULL DEFAULT NULL,
  `available_at` INT UNSIGNED NOT NULL,
  `created_at` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `job_batches` (
  `id` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `total_jobs` INT NOT NULL,
  `pending_jobs` INT NOT NULL,
  `failed_jobs` INT NOT NULL,
  `failed_job_ids` LONGTEXT NOT NULL,
  `options` MEDIUMTEXT NULL DEFAULT NULL,
  `cancelled_at` INT NULL DEFAULT NULL,
  `created_at` INT NOT NULL,
  `finished_at` INT NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `failed_jobs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(255) NOT NULL,
  `connection` TEXT NOT NULL,
  `queue` TEXT NOT NULL,
  `payload` LONGTEXT NOT NULL,
  `exception` LONGTEXT NOT NULL,
  `failed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- migrations
-- -------------------------------------------------------------------------
CREATE TABLE `migrations` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `migration` VARCHAR(255) NOT NULL,
  `batch` INT NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- personal_access_tokens (Sanctum)
-- -------------------------------------------------------------------------
CREATE TABLE `personal_access_tokens` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tokenable_type` VARCHAR(255) NOT NULL,
  `tokenable_id` BIGINT UNSIGNED NOT NULL,
  `name` TEXT NOT NULL,
  `token` VARCHAR(64) NOT NULL,
  `abilities` TEXT NULL DEFAULT NULL,
  `last_used_at` TIMESTAMP NULL DEFAULT NULL,
  `expires_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`, `tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- roles
-- -------------------------------------------------------------------------
CREATE TABLE `roles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `display_name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- permissions
-- -------------------------------------------------------------------------
CREATE TABLE `permissions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(100) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `module` VARCHAR(50) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- role_permissions pivot
-- -------------------------------------------------------------------------
CREATE TABLE `role_permissions` (
  `role_id` BIGINT UNSIGNED NOT NULL,
  `permission_id` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`role_id`, `permission_id`),
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- user_roles pivot
-- -------------------------------------------------------------------------
CREATE TABLE `user_roles` (
  `user_id` BIGINT UNSIGNED NOT NULL,
  `role_id` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`user_id`, `role_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- authors
-- -------------------------------------------------------------------------
CREATE TABLE `authors` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `orcid` VARCHAR(50) NULL DEFAULT NULL,
  `affiliation` VARCHAR(255) NULL DEFAULT NULL,
  `nationality` VARCHAR(100) NULL DEFAULT NULL,
  `biography` TEXT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `authors_name_index` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- publishers
-- -------------------------------------------------------------------------
CREATE TABLE `publishers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `country` VARCHAR(100) NULL DEFAULT NULL,
  `city` VARCHAR(100) NULL DEFAULT NULL,
  `website` VARCHAR(255) NULL DEFAULT NULL,
  `contact_email` VARCHAR(150) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `publishers_name_index` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- subjects
-- -------------------------------------------------------------------------
CREATE TABLE `subjects` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(50) NULL DEFAULT NULL,
  `name` VARCHAR(255) NOT NULL,
  `classification_system` VARCHAR(100) NOT NULL DEFAULT 'Library of Congress',
  `parent_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `subjects_name_index` (`name`),
  KEY `subjects_code_index` (`code`),
  FOREIGN KEY (`parent_id`) REFERENCES `subjects`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- categories
-- -------------------------------------------------------------------------
CREATE TABLE `categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_name_unique` (`name`),
  UNIQUE KEY `categories_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -------------------------------------------------------------------------
-- branches
-- -------------------------------------------------------------------------
CREATE TABLE `branches` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `short_code` VARCHAR(50) NULL DEFAULT NULL,
  `location` VARCHAR(255) NULL DEFAULT NULL,
  `campus` VARCHAR(100) NULL DEFAULT NULL,
  `seats` INT NULL DEFAULT NULL,
  `current_occupancy` INT NULL DEFAULT NULL,
  `holdings_count` INT NULL DEFAULT NULL,
  `head_librarian` VARCHAR(255) NULL DEFAULT NULL,
  `phone` VARCHAR(50) NULL DEFAULT NULL,
  `email` VARCHAR(100) NULL DEFAULT NULL,
  `opening_hours` VARCHAR(150) NULL DEFAULT NULL,
  `status` VARCHAR(50) NULL DEFAULT 'Online',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- locations
-- -------------------------------------------------------------------------
CREATE TABLE `locations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `branch_id` VARCHAR(50) NULL DEFAULT NULL,
  `building` VARCHAR(150) NOT NULL,
  `floor` VARCHAR(50) NOT NULL,
  `room` VARCHAR(100) NULL DEFAULT NULL,
  `area_name` VARCHAR(150) NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- shelves
-- -------------------------------------------------------------------------
CREATE TABLE `shelves` (
  `id` VARCHAR(50) NOT NULL,
  `branch_id` VARCHAR(50) NULL DEFAULT NULL,
  `shelf_code` VARCHAR(100) NOT NULL,
  `floor` INT NOT NULL DEFAULT 1,
  `aisle` VARCHAR(50) NULL DEFAULT NULL,
  `call_number_start` VARCHAR(100) NULL DEFAULT NULL,
  `call_number_end` VARCHAR(100) NULL DEFAULT NULL,
  `qr_code` VARCHAR(150) NULL DEFAULT NULL,
  `capacity` INT NOT NULL DEFAULT 100,
  `current_count` INT NOT NULL DEFAULT 0,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `shelves_shelf_code_index` (`shelf_code`),
  KEY `shelves_branch_id_index` (`branch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- patron_policies
-- -------------------------------------------------------------------------
CREATE TABLE `patron_policies` (
  `role` VARCHAR(50) NOT NULL,
  `max_borrow_limit` INT NOT NULL,
  `loan_duration_days` INT NOT NULL,
  `daily_fine_rate` DECIMAL(10,2) NOT NULL,
  `reserve_limit` INT NOT NULL,
  `digital_access_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `study_room_quota_hours` INT NOT NULL DEFAULT 4,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- patrons
-- -------------------------------------------------------------------------
CREATE TABLE `patrons` (
  `id` VARCHAR(50) NOT NULL,
  `matric` VARCHAR(100) NOT NULL,
  `library_id` VARCHAR(100) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'student',
  `category` VARCHAR(100) NULL DEFAULT NULL,
  `department` VARCHAR(150) NULL DEFAULT NULL,
  `faculty` VARCHAR(150) NULL DEFAULT NULL,
  `level` VARCHAR(50) NULL DEFAULT NULL,
  `programme` VARCHAR(100) NULL DEFAULT NULL,
  `email` VARCHAR(150) NULL DEFAULT NULL,
  `phone` VARCHAR(50) NULL DEFAULT NULL,
  `pin` VARCHAR(10) NOT NULL DEFAULT '1234',
  `pin_created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Active',
  `borrow_quota` INT NOT NULL DEFAULT 5,
  `active_loans_count` INT NOT NULL DEFAULT 0,
  `overdue_count` INT NOT NULL DEFAULT 0,
  `outstanding_fines` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `clearance_status` VARCHAR(100) NOT NULL DEFAULT 'Active Student',
  `registered_branch` VARCHAR(255) NULL DEFAULT NULL,
  `valid_until` DATE NULL DEFAULT NULL,
  `photo_url` TEXT NULL DEFAULT NULL,
  `research_interests` TEXT NULL DEFAULT NULL,
  `orcid` VARCHAR(50) NULL DEFAULT NULL,
  `profile_completion` INT NOT NULL DEFAULT 90,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `patrons_matric_unique` (`matric`),
  UNIQUE KEY `patrons_library_id_unique` (`library_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- books
-- -------------------------------------------------------------------------
CREATE TABLE `books` (
  `id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(500) NOT NULL,
  `subtitle` VARCHAR(500) NULL DEFAULT NULL,
  `author` VARCHAR(255) NOT NULL,
  `author_credentials` VARCHAR(255) NULL DEFAULT NULL,
  `author_affiliation` VARCHAR(255) NULL DEFAULT NULL,
  `orcid` VARCHAR(50) NULL DEFAULT NULL,
  `co_authors` TEXT NULL DEFAULT NULL,
  `subject` VARCHAR(255) NULL DEFAULT NULL,
  `department` VARCHAR(150) NULL DEFAULT NULL,
  `course_code` VARCHAR(50) NULL DEFAULT NULL,
  `target_level` VARCHAR(50) NULL DEFAULT NULL,
  `branch` VARCHAR(255) NULL DEFAULT NULL,
  `shelf_location` VARCHAR(100) NULL DEFAULT NULL,
  `call_number` VARCHAR(100) NULL DEFAULT NULL,
  `isbn` VARCHAR(50) NULL DEFAULT NULL,
  `doi` VARCHAR(100) NULL DEFAULT NULL,
  `publisher` VARCHAR(255) NULL DEFAULT NULL,
  `year` INT NULL DEFAULT NULL,
  `edition` VARCHAR(100) NULL DEFAULT NULL,
  `pdf_pages` INT NOT NULL DEFAULT 0,
  `file_size` VARCHAR(50) NULL DEFAULT NULL,
  `file_name` VARCHAR(255) NULL DEFAULT NULL,
  `file_data_url` LONGTEXT NULL DEFAULT NULL,
  `external_url` TEXT NULL DEFAULT NULL,
  `is_digital` TINYINT(1) NOT NULL DEFAULT 0,
  `access_level` VARCHAR(100) NOT NULL DEFAULT 'Open Access Full-Text',
  `rights_status` VARCHAR(150) NULL DEFAULT NULL,
  `copies_total` INT NOT NULL DEFAULT 1,
  `copies_available` INT NOT NULL DEFAULT 1,
  `rating` DECIMAL(3,1) NOT NULL DEFAULT 5.0,
  `citations` INT NOT NULL DEFAULT 0,
  `abstract` TEXT NULL DEFAULT NULL,
  `keywords` TEXT NULL DEFAULT NULL,
  `chapters` TEXT NULL DEFAULT NULL,
  `references_data` TEXT NULL DEFAULT NULL,
  `reference_style` VARCHAR(50) NULL DEFAULT NULL,
  `uploaded_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `uploaded_by` VARCHAR(255) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `books_title_index` (`title`(191)),
  KEY `books_author_index` (`author`),
  KEY `books_isbn_index` (`isbn`),
  KEY `books_call_number_index` (`call_number`),
  KEY `books_subject_index` (`subject`),
  KEY `books_department_index` (`department`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- resource_authors pivot
-- -------------------------------------------------------------------------
CREATE TABLE `resource_authors` (
  `book_id` VARCHAR(50) NOT NULL,
  `author_id` BIGINT UNSIGNED NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'Primary Author',
  `order_index` INT NOT NULL DEFAULT 1,
  PRIMARY KEY (`book_id`, `author_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- resource_subjects pivot
-- -------------------------------------------------------------------------
CREATE TABLE `resource_subjects` (
  `book_id` VARCHAR(50) NOT NULL,
  `subject_id` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`book_id`, `subject_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- copies
-- -------------------------------------------------------------------------
CREATE TABLE `copies` (
  `id` VARCHAR(50) NOT NULL,
  `book_id` VARCHAR(50) NOT NULL,
  `branch_id` VARCHAR(50) NOT NULL DEFAULT 'BRANCH-MAIN',
  `shelf_id` VARCHAR(50) NULL DEFAULT NULL,
  `copy_number` INT NOT NULL DEFAULT 1,
  `barcode` VARCHAR(100) NOT NULL,
  `rfid_tag` VARCHAR(100) NULL DEFAULT NULL,
  `accession_number` VARCHAR(100) NULL DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Available',
  `condition` VARCHAR(50) NOT NULL DEFAULT 'Good',
  `acquisition_cost` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `acquisition_date` DATE NULL DEFAULT NULL,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `copies_barcode_unique` (`barcode`),
  UNIQUE KEY `copies_rfid_tag_unique` (`rfid_tag`),
  UNIQUE KEY `copies_accession_number_unique` (`accession_number`),
  KEY `copies_book_id_index` (`book_id`),
  KEY `copies_status_index` (`status`),
  KEY `copies_branch_id_index` (`branch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- barcodes
-- -------------------------------------------------------------------------
CREATE TABLE `barcodes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `barcode_value` VARCHAR(100) NOT NULL,
  `barcode_type` VARCHAR(50) NOT NULL DEFAULT 'Code 128',
  `entity_type` VARCHAR(50) NOT NULL,
  `entity_id` VARCHAR(100) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `print_count` INT NOT NULL DEFAULT 0,
  `last_scanned_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `barcodes_barcode_value_unique` (`barcode_value`),
  KEY `barcodes_entity_index` (`entity_type`, `entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -------------------------------------------------------------------------
-- courses
-- -------------------------------------------------------------------------
CREATE TABLE `courses` (
  `code` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `department` VARCHAR(150) NULL DEFAULT NULL,
  `faculty` VARCHAR(150) NULL DEFAULT NULL,
  `level` VARCHAR(50) NULL DEFAULT NULL,
  `semester` VARCHAR(50) NULL DEFAULT NULL,
  `lecturer` VARCHAR(255) NULL DEFAULT NULL,
  `enrolled_students` INT NULL DEFAULT 0,
  `required_texts` TEXT NULL DEFAULT NULL,
  `recommended_texts` TEXT NULL DEFAULT NULL,
  `past_exams` TEXT NULL DEFAULT NULL,
  `lecture_packs` TEXT NULL DEFAULT NULL,
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- loans
-- -------------------------------------------------------------------------
CREATE TABLE `loans` (
  `id` VARCHAR(50) NOT NULL,
  `matric` VARCHAR(100) NOT NULL,
  `patron_name` VARCHAR(255) NOT NULL,
  `book_id` VARCHAR(50) NOT NULL,
  `book_title` VARCHAR(500) NOT NULL,
  `author` VARCHAR(255) NULL DEFAULT NULL,
  `call_number` VARCHAR(100) NULL DEFAULT NULL,
  `branch` VARCHAR(255) NULL DEFAULT NULL,
  `borrow_date` DATE NOT NULL,
  `due_date` DATE NOT NULL,
  `return_date` DATE NULL DEFAULT NULL,
  `renewal_count` INT NOT NULL DEFAULT 0,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Active',
  `fine_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `rfid_tag` VARCHAR(100) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `loans_matric_index` (`matric`),
  KEY `loans_book_id_index` (`book_id`),
  KEY `loans_status_index` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- reservations
-- -------------------------------------------------------------------------
CREATE TABLE `reservations` (
  `id` VARCHAR(50) NOT NULL,
  `matric` VARCHAR(100) NOT NULL,
  `patron_name` VARCHAR(255) NOT NULL,
  `book_id` VARCHAR(50) NOT NULL,
  `book_title` VARCHAR(500) NOT NULL,
  `call_number` VARCHAR(100) NULL DEFAULT NULL,
  `reserved_date` DATE NOT NULL,
  `expiry_date` DATE NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Pending',
  `pickup_branch` VARCHAR(255) NULL DEFAULT NULL,
  `queue_position` INT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- theses
-- -------------------------------------------------------------------------
CREATE TABLE `theses` (
  `id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(500) NOT NULL,
  `author` VARCHAR(255) NOT NULL,
  `matric` VARCHAR(100) NOT NULL,
  `year` INT NOT NULL,
  `advisor` VARCHAR(255) NULL DEFAULT NULL,
  `department` VARCHAR(150) NULL DEFAULT NULL,
  `faculty` VARCHAR(150) NULL DEFAULT NULL,
  `degree` VARCHAR(100) NULL DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Published',
  `access` VARCHAR(100) NOT NULL DEFAULT 'Open Access Full-Text',
  `downloads` INT NOT NULL DEFAULT 0,
  `citations` INT NOT NULL DEFAULT 0,
  `doi` VARCHAR(100) NULL DEFAULT NULL,
  `file_size` VARCHAR(50) NULL DEFAULT NULL,
  `file_name` VARCHAR(255) NULL DEFAULT NULL,
  `abstract` TEXT NULL DEFAULT NULL,
  `submitted_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- acquisitions
-- -------------------------------------------------------------------------
CREATE TABLE `acquisitions` (
  `id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(500) NOT NULL,
  `author` VARCHAR(255) NOT NULL,
  `publisher` VARCHAR(255) NULL DEFAULT NULL,
  `isbn` VARCHAR(50) NULL DEFAULT NULL,
  `department` VARCHAR(150) NULL DEFAULT NULL,
  `requested_by` VARCHAR(255) NULL DEFAULT NULL,
  `requester_role` VARCHAR(100) NULL DEFAULT NULL,
  `cost_estimate_ngn` DECIMAL(12,2) NULL DEFAULT NULL,
  `copies_requested` INT NOT NULL DEFAULT 1,
  `status` VARCHAR(100) NOT NULL DEFAULT 'Pending Dean Approval',
  `date_requested` DATE NULL DEFAULT NULL,
  `priority` VARCHAR(50) NOT NULL DEFAULT 'High',
  `justification` TEXT NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- partner_libraries
-- -------------------------------------------------------------------------
CREATE TABLE `partner_libraries` (
  `id` VARCHAR(50) NOT NULL,
  `institution` VARCHAR(255) NOT NULL,
  `country` VARCHAR(100) NOT NULL DEFAULT 'Nigeria',
  `opac_url` TEXT NOT NULL,
  `z3950_host` VARCHAR(255) NULL DEFAULT NULL,
  `port` INT NULL DEFAULT NULL,
  `database_name` VARCHAR(100) NULL DEFAULT NULL,
  `active_holdings` VARCHAR(100) NOT NULL DEFAULT '0',
  `status` VARCHAR(50) NOT NULL DEFAULT 'Connected',
  `sync_mode` VARCHAR(100) NOT NULL DEFAULT 'Live Federated Search',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- serials
-- -------------------------------------------------------------------------
CREATE TABLE `serials` (
  `id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `issn` VARCHAR(50) NOT NULL,
  `publisher` VARCHAR(255) NULL DEFAULT NULL,
  `frequency` VARCHAR(50) NULL DEFAULT NULL,
  `department` VARCHAR(150) NULL DEFAULT NULL,
  `latest_volume` VARCHAR(50) NULL DEFAULT NULL,
  `latest_issue` VARCHAR(50) NULL DEFAULT NULL,
  `holding_summary` TEXT NULL DEFAULT NULL,
  `subscription_status` VARCHAR(50) NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- study_rooms
-- -------------------------------------------------------------------------
CREATE TABLE `study_rooms` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `branch` VARCHAR(255) NOT NULL,
  `capacity` INT NOT NULL DEFAULT 4,
  `type` VARCHAR(100) NULL DEFAULT NULL,
  `amenities` TEXT NULL DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Available',
  `available_today` TEXT NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- room_bookings
-- -------------------------------------------------------------------------
CREATE TABLE `room_bookings` (
  `id` VARCHAR(50) NOT NULL,
  `matric` VARCHAR(100) NOT NULL,
  `room_id` VARCHAR(50) NOT NULL,
  `room_name` VARCHAR(100) NOT NULL,
  `branch` VARCHAR(255) NULL DEFAULT NULL,
  `date` DATE NOT NULL,
  `time_slot` VARCHAR(100) NOT NULL,
  `duration_hours` INT NOT NULL DEFAULT 2,
  `purpose` VARCHAR(255) NULL DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Confirmed',
  `check_in_code` VARCHAR(50) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- reading_lists
-- -------------------------------------------------------------------------
CREATE TABLE `reading_lists` (
  `id` VARCHAR(50) NOT NULL,
  `matric` VARCHAR(100) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `is_public` TINYINT(1) NOT NULL DEFAULT 0,
  `item_count` INT NOT NULL DEFAULT 0,
  `items` TEXT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- reading_list_items
-- -------------------------------------------------------------------------
CREATE TABLE `reading_list_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `reading_list_id` VARCHAR(50) NOT NULL,
  `book_id` VARCHAR(50) NOT NULL,
  `priority` INT NOT NULL DEFAULT 1,
  `notes` TEXT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- continue_reading
-- -------------------------------------------------------------------------
CREATE TABLE `continue_reading` (
  `id` VARCHAR(100) NOT NULL,
  `matric` VARCHAR(100) NOT NULL,
  `book_id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(500) NOT NULL,
  `author` VARCHAR(255) NULL DEFAULT NULL,
  `last_page` INT NOT NULL DEFAULT 1,
  `total_pages` INT NOT NULL DEFAULT 1,
  `progress` INT NOT NULL DEFAULT 0,
  `last_opened` VARCHAR(100) NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- fines
-- -------------------------------------------------------------------------
CREATE TABLE `fines` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `loan_id` VARCHAR(50) NULL DEFAULT NULL,
  `patron_matric` VARCHAR(100) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `balance_remaining` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `reason` VARCHAR(255) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Unpaid',
  `waived_by` VARCHAR(255) NULL DEFAULT NULL,
  `waived_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fines_patron_matric_index` (`patron_matric`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- payments
-- -------------------------------------------------------------------------
CREATE TABLE `payments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `fine_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `patron_matric` VARCHAR(100) NOT NULL,
  `amount_paid` DECIMAL(10,2) NOT NULL,
  `payment_method` VARCHAR(50) NOT NULL DEFAULT 'Card',
  `transaction_reference` VARCHAR(150) NOT NULL,
  `received_by` VARCHAR(255) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payments_transaction_reference_unique` (`transaction_reference`),
  FOREIGN KEY (`fine_id`) REFERENCES `fines`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- favorites
-- -------------------------------------------------------------------------
CREATE TABLE `favorites` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_identifier` VARCHAR(100) NOT NULL,
  `book_id` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `favorites_user_book_unique` (`user_identifier`, `book_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- digital_resources
-- -------------------------------------------------------------------------
CREATE TABLE `digital_resources` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `book_id` VARCHAR(50) NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `file_size` VARCHAR(50) NULL DEFAULT NULL,
  `mime_type` VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
  `access_rights` VARCHAR(100) NOT NULL DEFAULT 'Campus Community',
  `download_count` INT NOT NULL DEFAULT 0,
  `view_count` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- library_settings
-- -------------------------------------------------------------------------
CREATE TABLE `library_settings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` TEXT NULL DEFAULT NULL,
  `setting_group` VARCHAR(50) NOT NULL DEFAULT 'general',
  `value_type` VARCHAR(50) NOT NULL DEFAULT 'string',
  `is_public` TINYINT(1) NOT NULL DEFAULT 1,
  `description` VARCHAR(255) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `library_settings_setting_key_unique` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- audit_logs
-- -------------------------------------------------------------------------
CREATE TABLE `audit_logs` (
  `id` VARCHAR(50) NOT NULL,
  `timestamp` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `actor` VARCHAR(255) NOT NULL,
  `role` VARCHAR(100) NOT NULL,
  `action` VARCHAR(255) NOT NULL,
  `resource_type` VARCHAR(100) NULL DEFAULT NULL,
  `resource_id` VARCHAR(100) NULL DEFAULT NULL,
  `details` TEXT NULL DEFAULT NULL,
  `ip_address` VARCHAR(50) NULL DEFAULT NULL,
  `hash` VARCHAR(100) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `audit_logs_actor_index` (`actor`),
  KEY `audit_logs_action_index` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- notifications & announcements
-- -------------------------------------------------------------------------
CREATE TABLE `notifications` (
  `id` VARCHAR(50) NOT NULL,
  `matric` VARCHAR(100) NULL DEFAULT NULL,
  `type` VARCHAR(50) NULL DEFAULT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `date` VARCHAR(50) NULL DEFAULT NULL,
  `read` TINYINT(1) NOT NULL DEFAULT 0,
  `action_url` TEXT NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `announcements` (
  `id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `category` VARCHAR(100) NULL DEFAULT NULL,
  `priority` VARCHAR(50) NOT NULL DEFAULT 'Normal',
  `author` VARCHAR(255) NULL DEFAULT NULL,
  `date` VARCHAR(50) NULL DEFAULT NULL,
  `valid_until` VARCHAR(50) NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- library_apis
-- -------------------------------------------------------------------------
CREATE TABLE `library_apis` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `provider` VARCHAR(255) NULL DEFAULT NULL,
  `category` VARCHAR(100) NOT NULL DEFAULT 'Academic & Books',
  `endpoint_template` TEXT NOT NULL,
  `auth_type` VARCHAR(50) NOT NULL DEFAULT 'Free Open Access',
  `api_key` VARCHAR(255) NULL DEFAULT NULL,
  `headers` TEXT NULL DEFAULT NULL,
  `response_type` VARCHAR(50) NOT NULL DEFAULT 'json',
  `description` TEXT NULL DEFAULT NULL,
  `docs_url` VARCHAR(500) NULL DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Active',
  `is_preset` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- departments
-- -------------------------------------------------------------------------
CREATE TABLE `departments` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `hod_name` VARCHAR(255) NULL DEFAULT NULL,
  `hod_email` VARCHAR(150) NULL DEFAULT NULL,
  `hod_pin` VARCHAR(10) NOT NULL DEFAULT '1234',
  `student_count` INT NOT NULL DEFAULT 0,
  `faculty_count` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `departments_code_unique` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- department_uploads
-- -------------------------------------------------------------------------
CREATE TABLE `department_uploads` (
  `id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `author` VARCHAR(255) NOT NULL,
  `department_id` VARCHAR(50) NOT NULL,
  `department_name` VARCHAR(255) NOT NULL,
  `uploaded_by_hod_id` VARCHAR(100) NULL DEFAULT NULL,
  `hod_name` VARCHAR(255) NULL DEFAULT NULL,
  `course_code` VARCHAR(50) NULL DEFAULT NULL,
  `target_level` VARCHAR(50) NOT NULL DEFAULT 'HND II',
  `semester` VARCHAR(50) NOT NULL DEFAULT 'First Semester',
  `resource_type` VARCHAR(100) NOT NULL DEFAULT 'Lecture Handout',
  `file_name` VARCHAR(255) NULL DEFAULT NULL,
  `file_data_url` LONGTEXT NULL DEFAULT NULL,
  `access_scope` VARCHAR(100) NOT NULL DEFAULT 'Restricted to Department Students Only',
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `review_notes` TEXT NULL DEFAULT NULL,
  `reviewed_by` VARCHAR(255) NULL DEFAULT NULL,
  `assigned_call_number` VARCHAR(100) NULL DEFAULT NULL,
  `assigned_shelf` VARCHAR(150) NULL DEFAULT NULL,
  `book_id` VARCHAR(50) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- institutional_communications
-- -------------------------------------------------------------------------
CREATE TABLE `institutional_communications` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `msg_id` VARCHAR(50) NOT NULL,
  `thread_id` VARCHAR(50) NOT NULL,
  `sender_id` VARCHAR(100) NOT NULL,
  `sender_name` VARCHAR(200) NOT NULL,
  `sender_role` VARCHAR(50) NOT NULL,
  `sender_dept` VARCHAR(150) NULL DEFAULT NULL,
  `recipient_id` VARCHAR(100) NOT NULL,
  `recipient_name` VARCHAR(200) NOT NULL,
  `recipient_role` VARCHAR(50) NOT NULL,
  `recipient_dept` VARCHAR(150) NULL DEFAULT NULL,
  `category` VARCHAR(80) NOT NULL DEFAULT 'general_inquiry',
  `subject` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `priority` VARCHAR(30) NOT NULL DEFAULT 'normal',
  `status` VARCHAR(30) NOT NULL DEFAULT 'unread',
  `action_type` VARCHAR(80) NULL DEFAULT NULL,
  `action_data` JSON NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ic_msg_id_unique` (`msg_id`),
  KEY `ic_thread_id_index` (`thread_id`),
  KEY `ic_sender_recipient_index` (`sender_role`, `recipient_role`),
  KEY `ic_status_index` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =========================================================================
-- SECTION 3: SEED DATA
-- =========================================================================

-- -------------------------------------------------------------------------
-- users
-- -------------------------------------------------------------------------
INSERT INTO `users` (`id`, `name`, `email`, `password`, `created_at`, `updated_at`) VALUES
(1, 'Library Administrator', 'admin@fccibadan.edu.ng', '$2y$12$tY5GhH3XkGBXBMg1fqSJsOsPcpRxpfFrFkKq4IY8JZ7Bs9n5TJpRi', '2026-09-18 16:07:00', '2026-09-18 16:07:00');

-- -------------------------------------------------------------------------
-- migrations
-- -------------------------------------------------------------------------
INSERT INTO `migrations` (`migration`, `batch`) VALUES
('0001_01_01_000000_create_users_table', 1),
('0001_01_01_000001_create_cache_table', 1),
('0001_01_01_000002_create_jobs_table', 1),
('2026_09_30_000001_create_library_apis_table', 1),
('2026_09_30_072239_create_personal_access_tokens_table', 1),
('2026_09_30_114028_create_departments_and_uploads_tables', 1),
('2026_09_30_135913_create_opac_normalized_enterprise_tables', 1),
('2026_09_30_160000_create_institutional_communications_table', 1);

-- -------------------------------------------------------------------------
-- roles
-- -------------------------------------------------------------------------
INSERT INTO `roles` (`name`, `display_name`, `description`) VALUES
('admin',             'Library Administrator',       'Full administrative access to entire institution library system'),
('chief_librarian',   'Chief College Librarian',     'Executive catalog, collection and policy oversight'),
('cataloguer',        'Cataloguing Librarian',       'MARC 21, Dewey/LCC metadata and accessioning'),
('circulation_clerk', 'Circulation Desk Staff',      'Desk checkout, checkin, renewals and fine collection'),
('hod',              'Head of Department (HOD)',     'Departmental curriculum texts and syllabi management'),
('faculty',          'Academic Faculty Member',      'Lecturer with extended borrow limits and course reserve access'),
('student',          'Student Scholar',              'Standard patron with borrowing, reserve and e-reader access'),
('guest',            'Public / Guest Scholar',       'Discovery catalog search and public open-access browsing');

-- -------------------------------------------------------------------------
-- permissions
-- -------------------------------------------------------------------------
INSERT INTO `permissions` (`slug`, `name`, `module`, `description`) VALUES
('catalogue.view',      'View Catalogue',             'catalogue',    'Browse and view full bibliographic records'),
('catalogue.create',    'Create Resources',           'catalogue',    'Catalog and upload new books, serials and theses'),
('catalogue.edit',      'Edit Resources',             'catalogue',    'Modify bibliographic records, call numbers and subject tags'),
('catalogue.delete',    'Delete/Archive Resources',   'catalogue',    'Decommission or weed resources from active stacks'),
('users.view',          'View Patrons & Staff',       'users',        'Inspect patron profiles, loan records and clearance status'),
('users.create',        'Register Patrons',           'users',        'Register new students, faculty and staff members'),
('users.edit',          'Edit Patron Profiles',       'users',        'Modify patron contact info, level and borrow quotas'),
('loans.create',        'Issue Loans (Checkout)',      'loans',        'Scan barcodes and issue books to authenticated patrons'),
('loans.return',        'Process Returns (Checkin)',   'loans',        'Receive returned copies, inspect condition and restack'),
('loans.renew',         'Renew Loans',                'loans',        'Extend book loan period for eligible patrons'),
('reservations.manage', 'Manage Reservations',        'reservations', 'Approve hold requests and manage reservation shelf'),
('fines.manage',        'Manage & Waive Fines',       'fines',        'Collect overdue fines, process waivers and record receipts'),
('reports.view',        'View Reports & BI',          'reports',      'Access accreditation audit reports and circulation metrics'),
('reports.export',      'Export Data (CSV/MRC)',       'reports',      'Export MARC21 records, inventory sheets and analytics'),
('settings.manage',     'Manage Library Settings',    'settings',     'Configure institution profile, loan limits and fine policies');

-- -------------------------------------------------------------------------
-- branches
-- -------------------------------------------------------------------------
INSERT INTO `branches` (`id`, `name`, `short_code`, `location`, `campus`, `seats`, `current_occupancy`, `holdings_count`, `head_librarian`, `phone`, `email`, `opening_hours`, `status`) VALUES
('BRANCH-MAIN', 'Main Central Library',                          'MAIN', 'Main Academic Quad â€¢ 3 Floors',             'Main Campus, Eleyele',  450, 184, 14850, 'Dr. Mrs. A. Balogun',        '+234 803 456 7890', 'mainlib@fccibadan.edu.ng', '8:00 AM â€“ 8:00 PM', 'Online'),
('BRANCH-ICT',  'ICT & Informatics Digital Library',            'ICT',  'ICT Complex â€¢ Wing B, Ground Floor',         'Main Campus, Eleyele',  160,  78,  4200, 'Engr. D. K. Lawal',          '+234 802 112 3344', 'ictlib@fccibadan.edu.ng',  '8:00 AM â€“ 9:00 PM', 'Online'),
('BRANCH-BUS',  'Business & Management Library',                 'BUS',  'School of Business Building â€¢ Floor 2',      'Main Campus, Eleyele',  120,  45,  3800, 'Mrs. O. M. Adeleke',         '+234 805 776 5432', 'bizlib@fccibadan.edu.ng',  '8:30 AM â€“ 6:00 PM', 'Online'),
('BRANCH-ACC',  'Accounting & Finance Library',                  'ACC',  'ICAN Accredited Finance Center â€¢ Floor 1',   'Annex Campus',           90,  32,  2900, 'Mr. P. A. Ogundipe (FCA)',   '+234 809 332 1100', 'acclib@fccibadan.edu.ng',  '8:30 AM â€“ 6:00 PM', 'Online'),
('BRANCH-DEPT', 'Departmental & Co-operative Extension Library', 'DEPT', 'CEM Faculty Hall â€¢ Room 104',                'Main Campus, Eleyele',   75,  28,  1850, 'Dr. Mrs. F. A. Babalola',   '+234 807 554 2211', 'cemlib@fccibadan.edu.ng',  '9:00 AM â€“ 5:00 PM', 'Online'),
('BR-MAIN',  'Main Campus Library (Prof. Hezekiah Complex)',  NULL, 'Central Campus Quadrangle',         NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('BR-ENG',   'Faculty of Engineering Library',                NULL, 'Engineering Block B, Level 1',      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('BR-SCI',   'Faculty of Science & Computing Library',        NULL, 'Science Complex, East Wing',        NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('BR-MED',   'Medical & Health Sciences Library',             NULL, 'Health Tech Pavilion',              NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('BR-LAW',   'Law & Administrative Library',                  NULL, 'Management Sciences Complex',       NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('BR-DIGI',  'E-Library & Virtual Innovation Commons',        NULL, 'ICT Directorate Centre',            NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('BR-RES',   'Postgraduate & Research Depository',            NULL, 'Senate Building Annex',             NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- -------------------------------------------------------------------------
-- shelves
-- -------------------------------------------------------------------------
INSERT INTO `shelves` (`id`, `branch_id`, `shelf_code`, `floor`, `aisle`, `call_number_start`, `call_number_end`, `qr_code`, `capacity`, `current_count`, `status`) VALUES
('SHELF-FL1-A1', 'BRANCH-MAIN', 'FL1-A1-CEM', 1, 'Aisle 1', 'HD2951', 'HD3500', 'QR-SHELF-FL1-A1', 120,  84, 'Active'),
('SHELF-FL1-A2', 'BRANCH-MAIN', 'FL1-A2-ACC', 1, 'Aisle 2', 'HF5601', 'HF5689', 'QR-SHELF-FL1-A2', 120,  96, 'Active'),
('SHELF-FL2-B1', 'BRANCH-MAIN', 'FL2-B1-CS',  2, 'Aisle 1', 'QA76',   'QA76.9', 'QR-SHELF-FL2-B1', 150, 110, 'Active'),
('SHELF-FL2-B2', 'BRANCH-MAIN', 'FL2-B2-AGR', 2, 'Aisle 2', 'S560',   'S590',   'QR-SHELF-FL2-B2', 100,  65, 'Active'),
('SHELF-FL3-C1', 'BRANCH-MAIN', 'FL3-C1-REF', 3, 'Aisle 1', 'Z1000',  'Z8000',  'QR-SHELF-FL3-C1',  80,  72, 'Active');

-- -------------------------------------------------------------------------
-- authors
-- -------------------------------------------------------------------------
INSERT INTO `authors` (`name`, `orcid`, `affiliation`, `nationality`, `biography`) VALUES
('Prof. Adeyemi O. Oladipo', '0000-0002-1825-0097', 'Federal Co-operative College, Ibadan', 'Nigerian',       'Professor of Cooperative Microfinance and Rural Agrarian Economies.'),
('Dr. Mrs. F. A. Babalola',  '0000-0003-4512-8819', 'Head of Department, CEM',              'Nigerian',       'Pioneer researcher in apex cooperative societies governance in West Africa.'),
('Andrew S. Tanenbaum',       '0000-0001-9214-7741', 'Vrije Universiteit Amsterdam',         'Dutch-American', 'Author of seminal textbooks on Computer Networks and Operating Systems.'),
('E. Raymond',                '0000-0002-7634-1182', 'Open Source Initiative',               'American',       'Renowned author on software engineering paradigms and bazaar methodology.');

-- -------------------------------------------------------------------------
-- publishers
-- -------------------------------------------------------------------------
INSERT INTO `publishers` (`name`, `country`, `city`, `website`, `contact_email`) VALUES
('Federal Co-operative College Academic Press', 'Nigeria',        'Ibadan',     'https://press.fccibadan.edu.ng', 'press@fccibadan.edu.ng'),
('Pearson Education',                           'United Kingdom', 'London',     'https://pearson.com',            'highered@pearson.com'),
('O\'Reilly Media',                             'United States',  'Sebastopol', 'https://oreilly.com',            'order@oreilly.com'),
('University Press Plc',                        'Nigeria',        'Ibadan',     'https://universitypressplc.com', 'info@universitypressplc.com');

-- -------------------------------------------------------------------------
-- patron_policies
-- -------------------------------------------------------------------------
INSERT INTO `patron_policies` (`role`, `max_borrow_limit`, `loan_duration_days`, `daily_fine_rate`, `reserve_limit`, `digital_access_enabled`, `study_room_quota_hours`) VALUES
('student',    5,  14, 100.00, 3,  1, 4),
('lecturer',   12, 60, 100.00, 10, 1, 4),
('researcher', 15, 90, 100.00, 10, 1, 4),
('guest',      2,  7,  200.00, 1,  1, 4);



COMMIT;
SET FOREIGN_KEY_CHECKS = 1;
