-- =========================================================================
-- DATABASE: brainfeels_library
-- MySQL 8.0+ Compatible Full Dump
-- Federal Co-operative College, Ibadan — Smart Library System
-- Generated: 2026-10-01
-- Import via: phpMyAdmin → brainfeels_library → Import → select this file
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
('BRANCH-MAIN', 'Main Central Library',                          'MAIN', 'Main Academic Quad • 3 Floors',             'Main Campus, Eleyele',  450, 184, 14850, 'Dr. Mrs. A. Balogun',        '+234 803 456 7890', 'mainlib@fccibadan.edu.ng', '8:00 AM – 8:00 PM', 'Online'),
('BRANCH-ICT',  'ICT & Informatics Digital Library',            'ICT',  'ICT Complex • Wing B, Ground Floor',         'Main Campus, Eleyele',  160,  78,  4200, 'Engr. D. K. Lawal',          '+234 802 112 3344', 'ictlib@fccibadan.edu.ng',  '8:00 AM – 9:00 PM', 'Online'),
('BRANCH-BUS',  'Business & Management Library',                 'BUS',  'School of Business Building • Floor 2',      'Main Campus, Eleyele',  120,  45,  3800, 'Mrs. O. M. Adeleke',         '+234 805 776 5432', 'bizlib@fccibadan.edu.ng',  '8:30 AM – 6:00 PM', 'Online'),
('BRANCH-ACC',  'Accounting & Finance Library',                  'ACC',  'ICAN Accredited Finance Center • Floor 1',   'Annex Campus',           90,  32,  2900, 'Mr. P. A. Ogundipe (FCA)',   '+234 809 332 1100', 'acclib@fccibadan.edu.ng',  '8:30 AM – 6:00 PM', 'Online'),
('BRANCH-DEPT', 'Departmental & Co-operative Extension Library', 'DEPT', 'CEM Faculty Hall • Room 104',                'Main Campus, Eleyele',   75,  28,  1850, 'Dr. Mrs. F. A. Babalola',   '+234 807 554 2211', 'cemlib@fccibadan.edu.ng',  '9:00 AM – 5:00 PM', 'Online'),
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


-- -------------------------------------------------------------------------
-- patrons
-- -------------------------------------------------------------------------
INSERT INTO `patrons` (`id`, `matric`, `library_id`, `name`, `role`, `category`, `department`, `faculty`, `level`, `programme`, `email`, `phone`, `pin`, `pin_created_at`, `status`, `borrow_quota`, `active_loans_count`, `overdue_count`, `outstanding_fines`, `clearance_status`, `registered_branch`, `valid_until`, `photo_url`, `research_interests`, `orcid`, `profile_completion`, `created_at`) VALUES
('PAT-001', 'FCC/CEM/2024/042', 'LIB-FCC-42091', 'Wale Olonade',     'student', 'Undergraduate Scholar', 'Co-operative Economics & Management', 'Faculty of Management Sciences',  'HND II (Final Year)', 'Higher National Diploma', 'w.olonade@student.fccibadan.edu.ng',  '+234 803 491 8821', '1234', '2026-09-01 10:00:00', 'Active', 5, 1, 0,   0.00, 'Pending Library Signature', 'Main Campus Library', '2027-11-30', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80', '["Cooperative Fintech","Smallholder Agronomy","Micro-Credit Syndicates"]', '0009-0004-8192-4410', 92, '2026-09-18 16:07:47'),
('PAT-002', 'FCC/CEM/2024/011', 'LIB-FCC-42092', 'Ibrahim Adekunle', 'student', 'Undergraduate Scholar', 'Co-operative Economics & Management', 'Faculty of Management Sciences',  'HND II (Final Year)', 'Higher National Diploma', 'i.adekunle@student.fccibadan.edu.ng', '+234 812 345 6789', '5678', '2026-09-01 10:00:00', 'Active', 5, 1, 1, 300.00, 'Fines Pending Clearance',   'Main Campus Library', '2027-11-30', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80', '["Agricultural Credit","Rural Cooperatives"]',                            '0009-0002-1192-3321', 85, '2026-09-18 16:07:47'),
('PAT-003', 'FCC/CSC/2024/108', 'LIB-FCC-42093', 'Chukwudi Okafor',  'student', 'Undergraduate Scholar', 'Computer Science',                    'Faculty of Science & Computing', 'ND II',               'National Diploma',          'c.okafor@student.fccibadan.edu.ng',   '+234 809 888 1234', '4321', '2026-09-02 11:00:00', 'Active', 5, 1, 0,   0.00, 'Active Student',             'E-Library & Virtual Commons', '2027-08-31', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80', '["Distributed Systems","Database Optimization","AI Search"]',             '0009-0008-3341-9012', 95, '2026-09-18 16:07:47'),
('PAT-004', 'FCC/BNF/2024/077', 'LIB-FCC-42094', 'Amina Bello',      'student', 'Undergraduate Scholar', 'Banking & Finance',                   'Faculty of Management Sciences',  'HND I',               'Higher National Diploma', 'a.bello@student.fccibadan.edu.ng',    '+234 806 777 9900', '2468', '2026-09-03 09:30:00', 'Active', 5, 0, 0,   0.00, 'Active Student',             'Main Campus Library',         '2028-06-30', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80', '["Microfinance Risk","Fintech Innovations"]',                              '0009-0001-4455-7788', 88, '2026-09-18 16:07:47');

-- -------------------------------------------------------------------------
-- books
-- -------------------------------------------------------------------------
INSERT INTO `books` (`id`, `title`, `subtitle`, `author`, `author_credentials`, `author_affiliation`, `orcid`, `co_authors`, `subject`, `department`, `course_code`, `target_level`, `branch`, `shelf_location`, `call_number`, `isbn`, `doi`, `publisher`, `year`, `edition`, `pdf_pages`, `file_size`, `file_name`, `file_data_url`, `external_url`, `is_digital`, `access_level`, `rights_status`, `copies_total`, `copies_available`, `rating`, `citations`, `abstract`, `keywords`, `chapters`, `references_data`, `reference_style`, `uploaded_at`, `uploaded_by`) VALUES
('FCC-B001', 'Principles and Practice of Co-operative Economics', 'Empirical Models, Statutory Reserves & Apex Syndicate Accounting', 'Prof. A. O. Adebayo', 'Ph.D., FSNA, Professor of Cooperative Econometrics', 'Federal Co-operative College, Ibadan', '', 'Dr. B. A. Olowookere, Chief M. K. Balogun', 'Co-operative Economics', 'Co-operative Economics & Management', 'CEM 411', 'HND II', 'Main Campus Library (Prof. Hezekiah Complex)', 'Floor 2 • Aisle 4 • Shelf 12B', 'HD2963 .A34 2024', '978-978-49021-1-4', '10.1016/j.coop.2024.01.002', 'FCC Ibadan Academic Press', 2024, '4th Revised Edition', 384, '6.4 MB', 'principles-of-cooperative-economics.pdf', '', '', 1, 'Open Access Full-Text', '', 12, 7, 4.9, 84, 'Comprehensive analysis of modern agrarian credit unions, apex cooperatives, and fiscal regulatory mechanisms in West Africa with empirical data from Nigerian apexes.', '[]', '[{"title":"Chapter 1: Foundational Frameworks of Raiffeisen & Schulze Credit Unions","page":1},{"title":"Chapter 2: Financial Ratios & Liquidity Stress in Cooperatives","page":48},{"title":"Chapter 3: Risk Hedging & Apex Syndicate Accounting","page":112},{"title":"Chapter 4: Modern Statutory Reserves & Audit Protocols","page":230},{"title":"Chapter 5: Digital Value Chains & Fair-Trade Settlement","page":310}]', '[]', 'APA 7th', '2026-09-18 16:07:47', 'Cataloging Authority'),
('FCC-B002', 'Distributed Database Systems & High-Throughput SQL', 'Consensus Protocols, Multi-Master Replication & Cloud Vector Indices', 'Dr. K. E. Okonjo & M. Stone', 'Ph.D., Lead Systems Architect & ACM Fellow', 'Federal Co-operative College & MIT Distributed Lab', '', 'Prof. S. N. Varma', 'Computer Science', 'Computer Science', 'CSC 301', 'ND II / HND I', 'Faculty of Science & Computing Library', 'Floor 1 • Aisle 2 • Shelf 05A', 'QA76.9.D3 O38 2025', '978-0-13-449416-6', '10.1145/3318464.3389700', 'Prentice Hall International', 2025, '3rd Edition', 512, '8.8 MB', 'distributed-database-systems.pdf', '', '', 1, 'Open Access Full-Text', '', 8, 2, 4.8, 192, 'Covers consensus protocols, Raft, multi-region replication, transaction isolation levels, and ACID compliance under network partitions with practical Postgres/Cassandra case studies.', '[]', '[{"title":"Chapter 1: Transaction Processing & Serializability Theory","page":1},{"title":"Chapter 2: The Raft Consensus Algorithm & Quorum Replications","page":65},{"title":"Chapter 3: Distributed Query Optimization & Indexing","page":140},{"title":"Chapter 4: PostgreSQL Multi-Master Architectures & CDC Pipelines","page":245},{"title":"Chapter 5: Vector Indexing (HNSW) for AI Retrieval","page":380}]', '[]', 'APA 7th', '2026-09-18 16:07:47', 'Cataloging Authority'),
('FCC-B003', 'Macro-prudential Banking Reforms & Risk Hedging', 'Non-Performing Loan Resolution, Basel III Capital Adequacy & Microfinance', 'Chief (Mrs.) Folake Sanusi', 'M.Sc., FCIB, Fellow of the Chartered Institute of Bankers', 'Federal Co-operative College, Ibadan', '', 'H. L. Babatunde', 'Banking & Finance', 'Banking & Finance', 'BNF 302', 'HND I', 'Law & Administrative Library', 'Floor 2 • Aisle 1 • Shelf 08C', 'HG1601 .S26 2023', '978-978-8120-44-1', '10.1080/09603107.2023.119', 'University of Ibadan Press', 2023, '2nd Edition', 290, '4.2 MB', 'macro-prudential-banking-reforms.pdf', '', '', 0, 'Open Access Full-Text', '', 15, 11, 4.6, 45, 'Examination of non-performing loan management, Basel III framework implementations, and sub-Saharan microfinance resilience amid inflationary pressures.', '[]', '[{"title":"Chapter 1: Evolution of Nigerian Banking Regulatory Directives","page":1},{"title":"Chapter 2: Basel III Capital Adequacy & Liquidity Coverage Ratios","page":50},{"title":"Chapter 3: Stress-Testing Credit Portfolios in Developing Markets","page":120},{"title":"Chapter 4: Derivatives & FX Forward Hedging for Agribusinesses","page":200}]', '[]', 'APA 7th', '2026-09-18 16:07:47', 'Cataloging Authority'),
('FCC-B004', 'Cocoa Agronomy & Smallholder Value-Chain Mechanics', 'Soil Biochemistry, Pest Mitigation & Cooperative Export Logistics', 'Engr. T. J. Adeleke', 'Ph.D., Agricultural Extension Specialist', 'Federal Co-operative College, Ibadan', '', 'Dr. O. Alabi', 'Agricultural Extension', 'Agricultural Extension & Management', 'AGE 201', 'ND II', 'Main Campus Library (Prof. Hezekiah Complex)', 'Floor 3 • Aisle 6 • Shelf 19A', 'SB267 .A43 2024', '978-978-3012-88-0', '10.1007/s10460-024-0982-1', 'Agronomic Research Publications', 2024, '1st Edition', 440, '7.9 MB', 'cocoa-agronomy-value-chain.pdf', '', '', 1, 'Open Access Full-Text', '', 6, 1, 4.7, 63, 'Soil biochemistry, fungal blight mitigation, post-harvest solar drying paradigms, and cooperative export consortium tactics for premium West African cocoa beans.', '[]', '[{"title":"Chapter 1: Soil Pedology and Micro-nutrient Regimes for Theobroma Cacao","page":1},{"title":"Chapter 2: Integrated Pest Management & Biological Control Agents","page":85},{"title":"Chapter 3: Fermentation Science and Flavor Precursor Synthesis","page":190},{"title":"Chapter 4: Fair-Trade Certification and Cooperative Export Logistics","page":310}]', '[]', 'APA 7th', '2026-09-18 16:07:47', 'Cataloging Authority'),
('FCC-B005', 'Artificial Intelligence in Academic Information Retrieval', 'Vector Search, RAG Pipelines, MARC21 Crosswalks & Transformer Indices', 'Dr. O. J. Fatoyinbo & Prof. S. N. Varma', 'Ph.D., Lead AI Researcher & IEEE Senior Member', 'Federal Co-operative College & Indian Institute of Technology', '', 'Dr. K. E. Okonjo', 'Computer Science', 'Computer Science', 'CSC 301', 'ND II / HND I', 'E-Library & Virtual Commons', 'Floor 1 • Aisle 3 • Shelf 02B', 'Z666.5 .F38 2026', '978-1-5090-4822-9', '10.1109/TKDE.2026.1049281', 'IEEE Computer Society Press', 2026, '1st Edition', 360, '5.5 MB', 'ai-in-academic-information-retrieval.pdf', '', '', 1, 'Open Access Full-Text', '', 10, 6, 4.9, 112, 'Dense vector retrieval, retrieval-augmented generation (RAG) for academic citations, semantic MARC/Dublin Core cross-walking, and transformer-based discovery indices.', '[]', '[{"title":"Chapter 1: Lexical BM25 vs Semantic Vector Embedding Paradigms","page":1},{"title":"Chapter 2: RAG Pipelines & Scholarly Citation Grounding","page":60},{"title":"Chapter 3: LLM Guardrails & Hallucination Prevention in Libraries","page":140},{"title":"Chapter 4: Automated Cataloging & Metadata Extraction Protocols","page":230}]', '[]', 'APA 7th', '2026-09-18 16:07:47', 'Cataloging Authority'),
('FCC-B006', 'Cooperative Law, Governance & Statutory Auditing in Nigeria', 'A Complete Commentary on the Nigerian Co-operative Societies Act', 'Barrister B. A. Olowookere', 'LL.M, BL, Senior Lecturer in Commercial Law', 'Federal Co-operative College, Ibadan', '', 'Hon. Justice T. M. Alabi', 'Co-operative Economics', 'Co-operative Economics & Management', 'CEM 411', 'HND II', 'Law & Administrative Library', 'Floor 2 • Aisle 5 • Shelf 14C', 'KTL982 .O46 2023', '978-978-900-112-9', '10.2139/ssrn.4298102', 'Malthouse Law Books', 2023, '5th Edition', 310, '4.8 MB', 'cooperative-law-governance-nigeria.pdf', '', '', 1, 'Open Access Full-Text', '', 14, 9, 4.7, 38, 'Comprehensive treatise on the Nigerian Co-operative Societies Act, dispute resolution arbitration, bye-law drafting, and director fiduciary duties.', '[]', '[{"title":"Chapter 1: Legal Personality and Registration Formalities","page":1},{"title":"Chapter 2: Bye-Law Drafting, Amendments and Enforceability","page":45},{"title":"Chapter 3: Director Fiduciary Obligations and Surcharges","page":120},{"title":"Chapter 4: Winding-Up and Liquidation Protocols","page":210}]', '[]', 'APA 7th', '2026-09-18 16:07:47', 'Cataloging Authority'),
('FCC-B007', 'Advanced Computer Networks & Cloud Infrastructure', 'Software-Defined Networking, BGP Routing & Edge Security Protocols', 'Prof. S. N. Varma & Dr. A. Bello', 'Ph.D., Senior Network Architect', 'Federal Co-operative College & Cisco Networking Academy', '', 'Engr. Dr. T. J. Adeleke', 'Computer Science', 'Computer Engineering', 'CPE 311', 'HND I', 'Faculty of Engineering Library', 'Floor 1 • Aisle 4 • Shelf 10A', 'TK5105.5 .V37 2025', '978-0-13-892100-2', '10.1109/MCOM.2025.889102', 'Pearson Higher Education', 2025, '2nd Edition', 480, '7.2 MB', 'advanced-computer-networks.pdf', '', '', 1, 'Open Access Full-Text', '', 9, 5, 4.8, 145, 'In-depth treatment of SDN controllers, OpenFlow, zero-trust network architectures, multi-tenant BGP peering, and edge computing for distributed data pipelines.', '[]', '[{"title":"Chapter 1: Physical & Data Link Layer Carrier Technologies","page":1},{"title":"Chapter 2: BGP Routing, Anycast & AS Topology Modeling","page":80},{"title":"Chapter 3: Software-Defined Networking & OpenFlow Planes","page":180},{"title":"Chapter 4: Zero-Trust Network Access (ZTNA) & Cryptographic Handshakes","page":310}]', '[]', 'APA 7th', '2026-09-18 16:07:47', 'Cataloging Authority'),
('FCC-B008', 'Microcontroller System Design & Embedded C Programming', 'ARM Cortex-M Hardware Timers, DMA Buffering & Real-Time Kernels', 'Engr. Dr. K. O. Adeleke', 'Ph.D., COREN Registered Engineer', 'Faculty of Engineering, FCC Ibadan', '', 'Engr. T. J. Adeleke', 'Computer Engineering', 'Computer Engineering', 'EEE 305', 'ND II', 'Faculty of Engineering Library', 'Floor 2 • Aisle 2 • Shelf 04B', 'TJ223.M53 A34 2024', '978-978-5501-99-8', '10.1007/978-3-030-98102-1', 'FCC Engineering Academic Press', 2024, '1st Edition', 390, '6.1 MB', 'microcontroller-system-design.pdf', '', '', 1, 'Open Access Full-Text', '', 10, 4, 4.8, 72, 'Practical embedded system engineering using 32-bit ARM microcontrollers, FreeRTOS scheduling, ADC direct memory access, and IoT telemetry over LoRaWAN.', '[]', '[{"title":"Chapter 1: ARM Cortex-M Memory Map & Core Registers","page":1},{"title":"Chapter 2: GPIO, Hardware Timers & PWM Waveform Generation","page":55},{"title":"Chapter 3: Interrupt Service Routines & Direct Memory Access (DMA)","page":130},{"title":"Chapter 4: FreeRTOS Real-Time Kernel Tasks & Semaphores","page":220}]', '[]', 'APA 7th', '2026-09-18 16:07:47', 'Cataloging Authority');

-- -------------------------------------------------------------------------
-- copies
-- -------------------------------------------------------------------------
INSERT INTO `copies` (`id`, `book_id`, `branch_id`, `shelf_id`, `copy_number`, `barcode`, `rfid_tag`, `accession_number`, `status`, `condition`, `acquisition_cost`, `acquisition_date`) VALUES
('FCC-B001-C1','FCC-B001','BRANCH-MAIN','SHELF-FL1-A1',1,'BC-FCCB001-C1','RFID-BC-FCCB001-C1','ACC-2026-FCCB001-C1','Checked Out','Good',15000.00,'2026-08-01'),
('FCC-B001-C2','FCC-B001','BRANCH-MAIN','SHELF-FL1-A1',2,'BC-FCCB001-C2','RFID-BC-FCCB001-C2','ACC-2026-FCCB001-C2','Available',  'Good',15000.00,'2026-07-01'),
('FCC-B001-C3','FCC-B001','BRANCH-MAIN','SHELF-FL1-A1',3,'BC-FCCB001-C3','RFID-BC-FCCB001-C3','ACC-2026-FCCB001-C3','Available',  'Good',15000.00,'2026-06-01'),
('FCC-B002-C1','FCC-B002','BRANCH-MAIN','SHELF-FL2-B1',1,'BC-FCCB002-C1','RFID-BC-FCCB002-C1','ACC-2026-FCCB002-C1','Checked Out','Good',15000.00,'2026-08-01'),
('FCC-B002-C2','FCC-B002','BRANCH-MAIN','SHELF-FL2-B1',2,'BC-FCCB002-C2','RFID-BC-FCCB002-C2','ACC-2026-FCCB002-C2','Available',  'Good',15000.00,'2026-07-01'),
('FCC-B003-C1','FCC-B003','BRANCH-MAIN','SHELF-FL1-A2',1,'BC-FCCB003-C1','RFID-BC-FCCB003-C1','ACC-2026-FCCB003-C1','Available',  'Good',15000.00,'2026-08-01'),
('FCC-B003-C2','FCC-B003','BRANCH-MAIN','SHELF-FL1-A2',2,'BC-FCCB003-C2','RFID-BC-FCCB003-C2','ACC-2026-FCCB003-C2','Available',  'Good',15000.00,'2026-07-01'),
('FCC-B003-C3','FCC-B003','BRANCH-MAIN','SHELF-FL1-A2',3,'BC-FCCB003-C3','RFID-BC-FCCB003-C3','ACC-2026-FCCB003-C3','Available',  'Good',15000.00,'2026-06-01'),
('FCC-B004-C1','FCC-B004','BRANCH-MAIN','SHELF-FL2-B2',1,'BC-FCCB004-C1','RFID-BC-FCCB004-C1','ACC-2026-FCCB004-C1','Checked Out','Good',15000.00,'2026-08-01'),
('FCC-B004-C2','FCC-B004','BRANCH-MAIN','SHELF-FL2-B2',2,'BC-FCCB004-C2','RFID-BC-FCCB004-C2','ACC-2026-FCCB004-C2','Available',  'Good',15000.00,'2026-07-01'),
('FCC-B005-C1','FCC-B005','BRANCH-ICT', 'SHELF-FL1-A1',1,'BC-FCCB005-C1','RFID-BC-FCCB005-C1','ACC-2026-FCCB005-C1','Available',  'Good',15000.00,'2026-08-01'),
('FCC-B005-C2','FCC-B005','BRANCH-ICT', 'SHELF-FL1-A1',2,'BC-FCCB005-C2','RFID-BC-FCCB005-C2','ACC-2026-FCCB005-C2','Available',  'Good',15000.00,'2026-07-01'),
('FCC-B005-C3','FCC-B005','BRANCH-ICT', 'SHELF-FL1-A1',3,'BC-FCCB005-C3','RFID-BC-FCCB005-C3','ACC-2026-FCCB005-C3','Available',  'Good',15000.00,'2026-06-01'),
('FCC-B006-C1','FCC-B006','BRANCH-MAIN','SHELF-FL1-A2',1,'BC-FCCB006-C1','RFID-BC-FCCB006-C1','ACC-2026-FCCB006-C1','Checked Out','Good',15000.00,'2026-08-01'),
('FCC-B006-C2','FCC-B006','BRANCH-MAIN','SHELF-FL1-A2',2,'BC-FCCB006-C2','RFID-BC-FCCB006-C2','ACC-2026-FCCB006-C2','Available',  'Good',15000.00,'2026-07-01'),
('FCC-B006-C3','FCC-B006','BRANCH-MAIN','SHELF-FL1-A2',3,'BC-FCCB006-C3','RFID-BC-FCCB006-C3','ACC-2026-FCCB006-C3','Available',  'Good',15000.00,'2026-06-01'),
('FCC-B007-C1','FCC-B007','BRANCH-MAIN','SHELF-FL2-B1',1,'BC-FCCB007-C1','RFID-BC-FCCB007-C1','ACC-2026-FCCB007-C1','Available',  'Good',15000.00,'2026-08-01'),
('FCC-B007-C2','FCC-B007','BRANCH-MAIN','SHELF-FL2-B1',2,'BC-FCCB007-C2','RFID-BC-FCCB007-C2','ACC-2026-FCCB007-C2','Available',  'Good',15000.00,'2026-07-01'),
('FCC-B008-C1','FCC-B008','BRANCH-MAIN','SHELF-FL2-B1',1,'BC-FCCB008-C1','RFID-BC-FCCB008-C1','ACC-2026-FCCB008-C1','Available',  'Good',15000.00,'2026-08-01'),
('FCC-B008-C2','FCC-B008','BRANCH-MAIN','SHELF-FL2-B1',2,'BC-FCCB008-C2','RFID-BC-FCCB008-C2','ACC-2026-FCCB008-C2','Available',  'Good',15000.00,'2026-07-01');

-- -------------------------------------------------------------------------
-- barcodes
-- -------------------------------------------------------------------------
INSERT INTO `barcodes` (`barcode_value`, `barcode_type`, `entity_type`, `entity_id`, `is_active`, `print_count`, `last_scanned_at`) VALUES
('BC-FCCB001-C1','Code 128','copy','FCC-B001-C1',1,1,'2026-09-10 08:30:00'),
('BC-FCCB001-C2','Code 128','copy','FCC-B001-C2',1,1,'2026-09-18 10:00:00'),
('BC-FCCB001-C3','Code 128','copy','FCC-B001-C3',1,1,'2026-09-18 10:00:00'),
('BC-FCCB002-C1','Code 128','copy','FCC-B002-C1',1,1,'2026-09-12 09:00:00'),
('BC-FCCB002-C2','Code 128','copy','FCC-B002-C2',1,1,'2026-09-18 10:00:00'),
('BC-FCCB003-C1','Code 128','copy','FCC-B003-C1',1,1,'2026-09-18 10:00:00'),
('BC-FCCB003-C2','Code 128','copy','FCC-B003-C2',1,1,'2026-09-18 10:00:00'),
('BC-FCCB003-C3','Code 128','copy','FCC-B003-C3',1,1,'2026-09-18 10:00:00'),
('BC-FCCB004-C1','Code 128','copy','FCC-B004-C1',1,1,'2026-08-20 09:00:00'),
('BC-FCCB004-C2','Code 128','copy','FCC-B004-C2',1,1,'2026-09-18 10:00:00'),
('BC-FCCB005-C1','Code 128','copy','FCC-B005-C1',1,1,'2026-09-18 10:00:00'),
('BC-FCCB005-C2','Code 128','copy','FCC-B005-C2',1,1,'2026-09-18 10:00:00'),
('BC-FCCB005-C3','Code 128','copy','FCC-B005-C3',1,1,'2026-09-18 10:00:00'),
('BC-FCCB006-C1','Code 128','copy','FCC-B006-C1',1,1,'2026-09-08 08:30:00'),
('BC-FCCB006-C2','Code 128','copy','FCC-B006-C2',1,1,'2026-09-18 10:00:00'),
('BC-FCCB006-C3','Code 128','copy','FCC-B006-C3',1,1,'2026-09-18 10:00:00'),
('BC-FCCB007-C1','Code 128','copy','FCC-B007-C1',1,1,'2026-09-18 10:00:00'),
('BC-FCCB007-C2','Code 128','copy','FCC-B007-C2',1,1,'2026-09-18 10:00:00'),
('BC-FCCB008-C1','Code 128','copy','FCC-B008-C1',1,1,'2026-09-18 10:00:00'),
('BC-FCCB008-C2','Code 128','copy','FCC-B008-C2',1,1,'2026-09-18 10:00:00');

-- -------------------------------------------------------------------------
-- courses
-- -------------------------------------------------------------------------
INSERT INTO `courses` (`code`, `title`, `department`, `faculty`, `level`, `semester`, `lecturer`, `enrolled_students`) VALUES
('CSC 301','Database Systems & Distributed Architectures',          'Computer Science',                    'Faculty of Science & Computing',    'ND II / HND I', NULL, 'Dr. K. E. Okonjo',            NULL),
('EEE 305','Digital Electronics & Embedded Microcontrollers',       'Computer Engineering',                'Faculty of Engineering',             'ND II',         NULL, 'Engr. Dr. T. J. Adeleke',     NULL),
('CPE 311','Computer Architecture & Organization',                  'Computer Engineering',                'Faculty of Engineering',             'HND I',         NULL, 'Prof. S. N. Varma',           NULL),
('CEM 411','Advanced Co-operative Management & Digital E-Commerce', 'Co-operative Economics & Management', 'Faculty of Management Sciences',     'HND II',        NULL, 'Prof. A. O. Adebayo',         NULL),
('BNF 302','Agricultural Credit & Micro-Finance Banking',           'Banking & Finance',                   'Faculty of Management Sciences',     'HND I',         NULL, 'Chief (Mrs.) Folake Sanusi',  NULL),
('AGE 201','Principles of Agricultural Extension & Rural Sociology','Agricultural Extension & Management', 'Faculty of Agricultural Sciences',   'ND II',         NULL, 'Engr. T. J. Adeleke',         NULL);

-- -------------------------------------------------------------------------
-- loans
-- -------------------------------------------------------------------------
INSERT INTO `loans` (`id`, `matric`, `patron_name`, `book_id`, `book_title`, `author`, `call_number`, `branch`, `borrow_date`, `due_date`, `return_date`, `renewal_count`, `status`, `fine_amount`, `rfid_tag`) VALUES
('LN-9821','FCC/CEM/2024/042','Wale Olonade',    'FCC-B001','Principles and Practice of Co-operative Economics',         'Prof. A. O. Adebayo',         'HD2963 .A34 2024',   'Main Campus Library (Prof. Hezekiah Complex)','2026-09-10','2026-09-24',NULL,0,'Active', 0.00,  'FCC-CP-00102'),
('LN-9822','FCC/CEM/2024/042','Wale Olonade',    'FCC-B006','Cooperative Law, Governance & Statutory Auditing in Nigeria','Barrister B. A. Olowookere','KTL982 .O46 2023',   'Law & Administrative Library',               '2026-09-08','2026-09-22',NULL,0,'Active', 0.00,  'FCC-CP-00601'),
('LN-9823','FCC/CSC/2024/108','Chukwudi Okafor', 'FCC-B002','Distributed Database Systems & High-Throughput SQL',        'Dr. K. E. Okonjo & M. Stone','QA76.9.D3 O38 2025','Faculty of Science & Computing Library',     '2026-09-12','2026-09-26',NULL,0,'Active', 0.00,  'FCC-CP-00201'),
('LN-9820','FCC/CEM/2024/011','Ibrahim Adekunle','FCC-B004','Cocoa Agronomy & Smallholder Value-Chain Mechanics',        'Engr. T. J. Adeleke',         'SB267 .A43 2024',    'Main Campus Library (Prof. Hezekiah Complex)','2026-08-20','2026-09-03',NULL,0,'Overdue',300.00,'FCC-CP-00401');

-- -------------------------------------------------------------------------
-- reservations
-- -------------------------------------------------------------------------
INSERT INTO `reservations` (`id`, `matric`, `patron_name`, `book_id`, `book_title`, `call_number`, `reserved_date`, `expiry_date`, `status`, `pickup_branch`, `queue_position`) VALUES
('RES-2026-01','FCC/CEM/2024/042','Scholar','FCC-B004','Cocoa Agronomy & Smallholder Value-Chain Mechanics', '','2026-09-14','2026-09-22','Available','Main Campus Library • Circulation Desk Bay 2',1),
('RES-2026-02','FCC/CEM/2024/042','Scholar','FCC-B002','Distributed Database Systems & High-Throughput SQL','','2026-09-16','2026-09-30','Waiting',  'Faculty of Science & Computing Library',         2);

-- -------------------------------------------------------------------------
-- theses
-- -------------------------------------------------------------------------
INSERT INTO `theses` (`id`, `title`, `author`, `matric`, `year`, `advisor`, `department`, `faculty`, `degree`, `status`, `access`, `downloads`, `citations`, `doi`, `file_size`, `file_name`, `abstract`, `submitted_at`) VALUES
('TH-2025-019','Impact of Micro-Credit Cooperatives on Cocoa Smallholders in Ondo & Oyo States','Adebayo, Samuel T.','FCC/CEM/2023/019',2025,'Prof. O. Alabi','Co-operative Economics & Management','Faculty of Management Sciences','Higher National Diploma Dissertation','Published','Open Access Full-Text',342,14,'10.5281/zenodo.10842911','5.1 MB','adebayo_samuel_2025_dissertation.pdf','Empirical field survey of 420 smallholder farming families across Idanre and Iddo Local Government Areas. Findings demonstrate a 34% income stabilization effect attributable to prompt seasonal micro-credit disbursement from cooperative apex unions.','2026-09-18 16:07:47'),
('TH-2024-088','Design of a Decentralized Crop Storage Verification Protocol Using Hedera Hashgraph','Nnamdi, Grace C.','FCC/CSC/2023/088',2024,'Dr. K. Okonjo','Computer Science','Faculty of Science & Computing','Postgraduate Diploma Project','Published','Campus Intranet Only',189,8,'10.5281/zenodo.9482012','4.6 MB','nnamdi_grace_2024_project.pdf','Architects a zero-knowledge cryptographic warehouse receipt verification model for post-harvest grain silos, reducing collateral verification latency from 7 days to sub-second blockchain settlement.','2026-09-18 16:07:47'),
('TH-2024-104','Comparative Liquidity Stress Testing of Cooperative Apexes Post-CBN Monetary Edicts','Jimoh, Ridwan A.','FCC/BNF/2023/104',2024,'Chief (Mrs.) Folake Sanusi','Banking & Finance','Faculty of Management Sciences','Higher National Diploma Dissertation','Published','Open Access Full-Text',412,21,'10.5281/zenodo.9984120','6.2 MB','jimoh_ridwan_2024_thesis.pdf','Quantitative stress modeling examining reserve ratios and cash asset drawdowns across five major cooperative federations during cash restriction cycles.','2026-09-18 16:07:47'),
('TH-2026-042','Algorithmic Risk Syndication & Apex Liquidity Buffering in Nigerian Agri-Cooperatives','Wale Olonade','FCC/CEM/2024/042',2026,'Prof. A. O. Adebayo','Co-operative Economics & Management','Faculty of Management Sciences','Higher National Diploma Dissertation','Under Review','Pending Departmental Defense & Library Ingestion',12,0,'10.5281/zenodo.fcc.2026.042','4.8 MB','olonade_wale_2026_defense_draft.pdf','Proposes an automated mathematical framework for cooperative apex liquidity pooling during harvest contraction windows, incorporating real-time stress models across 15 agricultural unions in Western Nigeria.','2026-09-18 16:07:47');

-- -------------------------------------------------------------------------
-- study_rooms
-- -------------------------------------------------------------------------
INSERT INTO `study_rooms` (`id`, `name`, `branch`, `capacity`, `type`, `amenities`, `status`, `available_today`) VALUES
('RM-A101','Quiet Research Carrel Alpha',         'Floor 1 • Main Library',      1, 'Individual Research Pod',   '["High-speed Wi-Fi","Dedicated Power Outlet","Ergonomic Mesh Chair","Adjustable LED Task Lamp","Sound-dampening Acoustic Paneling"]', 'available','08:00 - 10:00, 10:00 - 12:00, 12:00 - 14:00, 14:00 - 16:00, 16:00 - 18:00, 18:00 - 20:00'),
('RM-B204','Cooperative Synergy Group Suite',     'Floor 2 • West Wing',         6, 'Collaborative Study Room', '["55-inch Ultra HD Presentation Screen","Magnetic Ceramic Whiteboard","Conference Table","Air Conditioning","USB-C Fast Charging Hub","High-speed Wi-Fi"]','available','09:00 - 11:00, 11:00 - 13:00, 13:00 - 15:00, 15:00 - 17:00, 17:00 - 19:00'),
('RM-C302','Postgraduate & Defense Seminar Suite','Floor 3 • Senate Wing',       14,'Conference & Defense Room','["4K Laser Projector","Wireless Ceiling Mic Array","Surround Audio","Lectern with Touch Control","Air Conditioning","HD Video Conferencing Cam"]','booked',   '14:00 - 16:00, 16:00 - 18:00'),
('RM-D105','E-Library Multimedia Innovation Pod', 'Ground Floor • E-Library Hub',2, 'Digital Media Station',    '["Dual 27-inch 4K Color-Accurate Monitors","Studio Condenser Mic","High-Performance Workstation","Noise-Cancelling Headphones","Gigabit LAN"]','available','08:00 - 10:00, 10:00 - 12:00, 12:00 - 14:00, 14:00 - 16:00, 16:00 - 18:00');

-- -------------------------------------------------------------------------
-- room_bookings
-- -------------------------------------------------------------------------
INSERT INTO `room_bookings` (`id`, `matric`, `room_id`, `room_name`, `branch`, `date`, `time_slot`, `duration_hours`, `purpose`, `status`, `check_in_code`) VALUES
('BKG-9901','FCC/CEM/2024/042','RM-A101','Quiet Research Carrel Alpha','Main Campus Library','2026-09-18','14:00 - 16:00',2,'Academic Study','Confirmed','CHK-782');

-- -------------------------------------------------------------------------
-- acquisitions
-- -------------------------------------------------------------------------
INSERT INTO `acquisitions` (`id`, `title`, `author`, `publisher`, `isbn`, `department`, `requested_by`, `requester_role`, `cost_estimate_ngn`, `copies_requested`, `status`, `date_requested`, `priority`, `justification`) VALUES
('PO-2026-081','Modern Agro-Business Management (5 copies)',         'Academic Author','University Press Plc, Ibadan',      '978-978-030-992-1','General','Head of Dept - AGR',      'Faculty',175000.00,1,'Approved',            '2026-09-14','High','Course curriculum requirement'),
('PO-2026-082','Cloud Native Microservices & Kubernetes (4 copies)','Academic Author','CSS Bookshops Ltd, Lagos',           '978-0-13-549102-3','General','Dr. K. Okonjo - CSC',     'Faculty',220000.00,1,'Under Review',         '2026-09-16','High','Course curriculum requirement'),
('PO-2026-083','Nigerian Commercial Banking Compendium (10 copies)','Academic Author','Spectrum Books, Ring Road Ibadan',   '978-978-8120-00-5','General','Mrs. Folake Sanusi - BNF','Faculty',350000.00,1,'Delivered & Cataloged','2026-09-02','High','Course curriculum requirement');

-- -------------------------------------------------------------------------
-- partner_libraries
-- -------------------------------------------------------------------------
INSERT INTO `partner_libraries` (`id`, `institution`, `country`, `opac_url`, `z3950_host`, `port`, `database_name`, `active_holdings`, `status`, `sync_mode`) VALUES
('LIB-UI-01',  'Kenneth Dike Library — University of Ibadan', 'Nigeria','https://opac.ui.edu.ng/discovery',               'opac.edu.ng',210,'OPAC','1,450,000+ Volumes',       'Active Interlink','Live Federated Search'),
('LIB-OAU-02', 'Hezekiah Oluwasanmi Library — OAU Ile-Ife',  'Nigeria','https://library.oauife.edu.ng/opac',             'opac.edu.ng',210,'OPAC','850,000+ Volumes',          'Active Interlink','Live Federated Search'),
('LIB-NAT-03', 'National Library of Nigeria (NLN)',           'Nigeria','https://opac.nln.gov.ng',                        'opac.edu.ng',210,'OPAC','5,000,000+ Records',        'Active Interlink','Live Federated Search'),
('LIB-OPEN-04','OpenLibrary & Internet Archive',              'Nigeria','https://openlibrary.org/search',                 'opac.edu.ng',210,'OPAC','20,000,000+ eBooks',        'Active Interlink','Live Federated Search'),
('LIB-LOC-05', 'Library of Congress (LOC) Online Catalog',   'Nigeria','https://catalog.loc.gov',                        'opac.edu.ng',210,'OPAC','170,000,000+ Items',        'Active Interlink','Live Federated Search'),
('LIB-DOAB-06','DOAB — Directory of Open Access Books',       'Nigeria','https://www.doabooks.org/doab?func=search',     'opac.edu.ng',210,'OPAC','85,000+ Academic Monographs','Active Interlink','Live Federated Search');

-- -------------------------------------------------------------------------
-- serials
-- -------------------------------------------------------------------------
INSERT INTO `serials` (`id`, `title`, `issn`, `publisher`, `frequency`, `department`, `latest_volume`, `latest_issue`, `holding_summary`, `subscription_status`) VALUES
('SER-01','Journal of Co-operative and Rural Development Studies','1597-2844','Academic Press','Quarterly','General','Vol. 28 No. 3 (Sept 2026)','Issue 1','All holdings intact','Active Subscription'),
('SER-02','West African Agronomic Review',                        '0794-5590','Academic Press','Bi-annual','General','Vol. 19 No. 1 (June 2026)','Issue 1','All holdings intact','Active Subscription'),
('SER-03','African Journal of Information Systems & Computing',   '1936-7287','Academic Press','Monthly',  'General','Vol. 14 No. 8 (August 2026)','Issue 1','All holdings intact','Active Subscription');

-- -------------------------------------------------------------------------
-- reading_lists
-- -------------------------------------------------------------------------
INSERT INTO `reading_lists` (`id`, `matric`, `title`, `description`, `is_public`, `item_count`, `items`) VALUES
('RL-001','FCC/CEM/2024/042','My Final Year Project (Fintech Cooperatives)','Core academic references on apex liquidity models and cooperative member equity accumulation.',1,3,'[{"bookId":"FCC-B001","notes":"Focus on Chapter 3 for apex syndicate formulas."},{"bookId":"FCC-B006","notes":"Review statutory audit requirements in Nigeria."},{"bookId":"FCC-B003","notes":"Compare Basel III ratios with Raiffeisen reserves."}]'),
('RL-002','FCC/CEM/2024/042','Machine Learning & AI in Commerce','Exploration of vector retrieval algorithms and database architectures.',0,2,'[{"bookId":"FCC-B005","notes":"Important RAG pipeline concepts for AI librarian."},{"bookId":"FCC-B002","notes":"PostgreSQL distributed query optimization."}]');

-- -------------------------------------------------------------------------
-- continue_reading
-- -------------------------------------------------------------------------
INSERT INTO `continue_reading` (`id`, `matric`, `book_id`, `title`, `author`, `last_page`, `total_pages`, `progress`, `last_opened`) VALUES
('FCC/CEM/2024/042-FCC-B001','FCC/CEM/2024/042','FCC-B001','Principles and Practice of Co-operative Economics',      'Prof. A. O. Adebayo',   261,384,68,'Today, 10:14 AM'),
('FCC/CEM/2024/042-FCC-B005','FCC/CEM/2024/042','FCC-B005','Artificial Intelligence in Academic Information Retrieval','Dr. O. J. Fatoyinbo',   151,360,42,'Yesterday, 04:30 PM'),
('FCC/CEM/2024/042-FCC-B007','FCC/CEM/2024/042','FCC-B007','Advanced Computer Networks & Cloud Infrastructure',       'Prof. S. N. Varma',     120,480,25,'2 days ago');

-- -------------------------------------------------------------------------
-- audit_logs
-- -------------------------------------------------------------------------
INSERT INTO `audit_logs` (`id`, `timestamp`, `actor`, `role`, `action`, `resource_type`, `resource_id`, `details`, `ip_address`, `hash`) VALUES
('LOG-5501','2026-09-18 11:42:15','Dr. Mrs. A. Balogun',      'SUPER_ADMIN','PIN_RESET',   'CATALOG','LOG-5501','Generated new secure library PIN for student Wale Olonade (FCC/CEM/2024/042)','127.0.0.1','sha256-verified'),
('LOG-5502','2026-09-18 10:15:30','Mr. T. Alabi (Cataloguer)','CATALOGUER', 'MARC_INGEST', 'CATALOG','LOG-5502','Added MARC21 bibliographic record for Artificial Intelligence in Academic Retrieval (Z666.5 .F38)','127.0.0.1','sha256-verified'),
('LOG-5503','2026-09-18 09:04:00','System Scheduler',         'DAEMON',     'HEALTH_CHECK','CATALOG','LOG-5503','Automated daily integrity audit verified 100% of PDF asset hashes.','127.0.0.1','sha256-verified');

-- -------------------------------------------------------------------------
-- announcements
-- -------------------------------------------------------------------------
INSERT INTO `announcements` (`id`, `title`, `content`, `category`, `priority`, `author`, `date`, `valid_until`) VALUES
('ANN-01','Second Semester Examination Period — 24/7 Virtual Library Access','In support of the upcoming ND/HND examinations, the Main Campus Library and E-Learning Hub will operate extended 24-hour reading hours starting Monday. Biometric cards required for entry after 09:00 PM.','High Priority','High Priority','Library Directorate','16 Sept 2026','2027-09-18'),
('ANN-02','New E-Book Subscriptions Added: ScienceDirect & IEEE Computer Society','The Library Directorate has acquired institutional multi-user licenses for 14,000+ new peer-reviewed computer engineering and agricultural economics volumes.','Resource Update','Resource Update','Library Directorate','12 Sept 2026','2027-09-18'),
('ANN-03','Student PIN Verification & PVC ID Card Revalidation Notice','Students experiencing login issues should visit their faculty librarian for immediate PIN reset. Please note library services require NO direct monetary payments.','Administrative','Administrative','Library Directorate','08 Sept 2026','2027-09-18');

-- -------------------------------------------------------------------------
-- library_settings
-- -------------------------------------------------------------------------
INSERT INTO `library_settings` (`setting_key`, `setting_value`, `setting_group`, `value_type`, `is_public`, `description`) VALUES
('institution_name',        'Federal Co-operative College, Ibadan',                       'general',      'string', 1,'Full institution legal name'),
('institution_short_name',  'FCC Ibadan',                                                 'general',      'string', 1,'Abbreviated name'),
('library_name',            'Chief Olubadan Memorial Central Library & Knowledge Center', 'general',      'string', 1,'Main Library Name'),
('contact_email',           'library@fccibadan.edu.ng',                                   'general',      'string', 1,'Official Library Desk Email'),
('contact_phone',           '+234 803 456 7890',                                          'general',      'string', 1,'Helpdesk Phone Line'),
('address',                 'Eleyele Road, P.M.B. 5033, Dugbe, Ibadan, Oyo State, Nigeria','general',    'string', 1,'Physical Street Address'),
('opening_hours_weekday',   '8:00 AM – 8:00 PM (Monday – Friday)',                       'general',      'string', 1,'Weekday stack hours'),
('opening_hours_weekend',   '9:00 AM – 4:00 PM (Saturdays)',                             'general',      'string', 1,'Weekend stack hours'),
('max_borrow_limit_student','5',                                                           'circulation',  'integer',1,'Maximum concurrent physical loans for students'),
('max_borrow_limit_faculty','10',                                                          'circulation',  'integer',1,'Maximum concurrent loans for faculty'),
('loan_duration_days',      '14',                                                          'circulation',  'integer',1,'Standard borrowing duration in days'),
('renewal_limit',           '2',                                                           'circulation',  'integer',1,'Number of times a patron can renew without returning'),
('daily_fine_rate',         '50.00',                                                       'circulation',  'decimal',1,'Daily overdue penalty in local currency'),
('currency_symbol',         '₦',                                                           'circulation',  'string', 1,'Currency symbol for fines and receipts'),
('currency_code',           'NGN',                                                         'circulation',  'string', 1,'ISO 4217 Currency Code'),
('reservation_hold_days',   '3',                                                           'circulation',  'integer',1,'Days an item is kept on hold shelf before auto-release'),
('classification_system',   'Library of Congress (LCC)',                                  'classification','string',1,'Primary bibliographic classification scheme'),
('barcode_symbology',       'Code 128',                                                    'opac',         'string', 1,'Default barcode format for physical copies'),
('enable_self_service_kiosk','true',                                                       'opac',         'boolean',1,'Enable self-checkout and return kiosk stations'),
('enable_digital_repository','true',                                                       'opac',         'boolean',1,'Public access to electronic theses and e-books');

-- -------------------------------------------------------------------------
-- library_apis
-- -------------------------------------------------------------------------
INSERT INTO `library_apis` (`id`, `name`, `provider`, `category`, `endpoint_template`, `auth_type`, `api_key`, `response_type`, `description`, `docs_url`, `status`, `is_preset`) VALUES
('API-OPENLIB',        'Open Library Book Search & Covers API',             'Internet Archive (San Francisco, CA, USA)',         'Global Monograph & Covers',            'https://openlibrary.org/search.json?q={query}&limit=12',                                                               'Free Open Access',NULL,'json','Over 30 million bibliographic records, covers, subjects, and authors maintained by the Internet Archive.',                                                 'https://openlibrary.org/developers/api',                     'Active',1),
('API-GOOGLEBOOKS',    'Google Books Global Volumes API',                    'Google LLC (Mountain View, CA, USA)',               'Worldwide Books & Previews',           'https://www.googleapis.com/books/v1/volumes?q={query}&maxResults=12',                                                  'Free Open Access',NULL,'json','World-spanning index of digitized curriculum books, ISBN metadata, descriptions, and cover art.',                                                          'https://developers.google.com/books',                        'Active',1),
('API-CROSSREF',       'Crossref Global Scholarly Works API',                'Crossref Consortium (Oxford, UK & Lynnfield, USA)', 'Scholarly Research & DOIs',            'https://api.crossref.org/works?query={query}&rows=12',                                                                 'Free Open Access',NULL,'json','Official registry of 150M+ peer-reviewed journal papers, academic dissertations, and conference proceedings.',                                            'https://api.crossref.org/',                                  'Active',1),
('API-OPENALEX',       'OpenAlex Scholarly Knowledge Graph API',             'OurResearch (Global Non-Profit)',                   'Bibliometrics & Citations',            'https://api.openalex.org/works?search={query}&per-page=12',                                                            'Free Open Access',NULL,'json','250M+ scientific research papers, authors, citations, and institutional research output.',                                                                 'https://openalex.org/',                                      'Active',1),
('API-GUTENDEX',       'Project Gutenberg Classic E-Books (Gutendex)',        'Project Gutenberg Literary Archive',                'Full-Text Classic Literature & E-Books','https://gutendex.com/books?search={query}',                                                                            'Free Open Access',NULL,'json','70,000+ public domain full-text classic textbooks and literature with direct reading downloads.',                                                           'https://gutendex.com/',                                      'Active',1),
('API-EUROPEPMC',      'Europe PMC Life Sciences & Agriculture API',          'EMBL-EBI (Hinxton, UK)',                            'Agronomy, Medicine & Life Sciences',   'https://www.ebi.ac.uk/europepmc/webservices/rest/search?query={query}&format=json&pageSize=12',                     'Free Open Access',NULL,'json','Life sciences and agricultural science articles from international institutional repositories.',                                                              'https://europepmc.org/RestfulWebService',                     'Active',1),
('API-DOAB',           'Directory of Open Access Books (DOAB)',               'OAPEN Foundation (The Hague, Netherlands)',         'Peer-Reviewed Academic Books',         'https://directory.doabooks.org/rest/search?query={query}&expand=metadata',                                             'Free Open Access',NULL,'json','Peer-reviewed, open-access academic monographs and scholarly books from world universities.',                                                               'https://directory.doabooks.org/',                            'Active',1),
('API-SEMANTICSCHOLAR','Semantic Scholar AI Scientific Literature API',       'Allen Institute for AI (Seattle, WA, USA)',         'Scientific Literature & AI Abstracts', 'https://api.semanticscholar.org/graph/v1/paper/search?query={query}&fields=title,authors,year,abstract,citationCount', 'Free Open Access',NULL,'json','Over 200M academic papers, AI-generated TLDR summaries, citation influence graphs, and author profiles.',                                                    'https://www.semanticscholar.org/product/api',                'Active',1),
('API-ARXIV',          'arXiv Open E-Print Archive (Cornell University)',      'Cornell University & arXiv.org (Ithaca, NY, USA)',  'Quantitative Science & Computer Science','https://export.arxiv.org/api/query?search_query=all:{query}&start=0&max_results=12',                               'Free Open Access',NULL,'xml', '2M+ research e-prints in computer science, mathematics, economics, statistics, and electrical engineering.',                                                   'https://info.arxiv.org/help/api/index.html',                 'Active',1),
('API-LOC',            'Library of Congress National Catalog (loc.gov)',       'Library of Congress (Washington, D.C., USA)',       'National Catalog & MARC Authority',    'https://www.loc.gov/search/?q={query}&fo=json',                                                                        'Free Open Access',NULL,'json','Official national authority classification records, LCCN data, and historical digitized collection items.',                                                   'https://libraryofcongress.github.io/data-exploration/',      'Active',1);

-- -------------------------------------------------------------------------
-- departments
-- -------------------------------------------------------------------------
INSERT INTO `departments` (`id`, `name`, `code`, `hod_name`, `hod_email`, `hod_pin`, `student_count`, `faculty_count`) VALUES
('DEP-CEM','Co-operative Economics & Management',       'CEM','Dr. Mrs. F. A. Babalola','babalola.hod@fccibadan.edu.ng','1234',480,14),
('DEP-CSC','Computer Science & Information Technology', 'CSC','Dr. K. E. Okonjo',        'okonjo.hod@fccibadan.edu.ng',  '1234',390,12),
('DEP-BNF','Banking & Finance',                         'BNF','Mrs. Folake Sanusi',       'sanusi.hod@fccibadan.edu.ng',  '1234',320,10),
('DEP-AGR','Agricultural Extension & Management',       'AGR','Dr. A. O. Olabode',        'olabode.hod@fccibadan.edu.ng', '1234',280, 9),
('DEP-BAM','Business Administration & Management',      'BAM','Dr. T. M. Adewale',        'adewale.hod@fccibadan.edu.ng', '1234',350,11);

-- -------------------------------------------------------------------------
-- department_uploads
-- -------------------------------------------------------------------------
INSERT INTO `department_uploads` (`id`, `title`, `author`, `department_id`, `department_name`, `uploaded_by_hod_id`, `hod_name`, `course_code`, `target_level`, `semester`, `resource_type`, `file_name`, `file_data_url`, `access_scope`, `status`, `review_notes`, `reviewed_by`, `assigned_call_number`, `assigned_shelf`, `book_id`) VALUES
('HOD-UP-001','CEM 411 Cooperative Econometrics Past Examination Question Compendium (2020-2025)','Department of Co-operative Economics Academic Board','DEP-CEM','Co-operative Economics & Management','STAFF-HOD-01','Dr. Mrs. F. A. Babalola','CEM 411','HND II','First Semester','Past Exam Questions','cem411-past-questions-compendium.pdf','','Restricted to Department Students Only','pending',NULL,NULL,NULL,NULL,NULL),
('HOD-UP-002','Distributed Multi-Cloud Systems & Vector Indexing Lab Handout','Dr. K. E. Okonjo & Faculty Research Unit','DEP-CSC','Computer Science & Information Technology','STAFF-HOD-02','Dr. K. E. Okonjo','CSC 301','HND I','First Semester','Lecture Handout','distributed-multi-cloud-lab-handout.pdf','','Public Institution-Wide','pending',NULL,NULL,NULL,NULL,NULL),
('HOD-UP-003','Modern Micro-Credit Lending & Syndicate Banking Guidelines','Mrs. Folake Sanusi & Dr. M. K. Balogun','DEP-BNF','Banking & Finance','STAFF-HOD-03','Mrs. Folake Sanusi','BNF 312','ND II','Second Semester','Lecture Handout','modern-microcredit-syndicate-banking.pdf','','Public Institution-Wide','approved','Verified syllabus compliance. Ingested into master catalog.','Dr. Mrs. A. Balogun (Chief College Librarian)','HG178.33 .S26 2026','Floor 2 • Aisle 3 • Shelf 08A','FCC-B004'),
('HOD-UP-004','Soil Nitrogen Dynamics & Cocoa Harvest Optimization in Agro-Ecological Zones','Agronomy Faculty Unit','DEP-AGR','Agricultural Extension & Management','STAFF-HOD-04','Dr. A. O. Olabode','AGR 211','ND I','First Semester','Research Monograph','soil-nitrogen-dynamics-cocoa.pdf','','Public Institution-Wide','rejected','Please attach formal departmental academic board approval signature on page 2 before master catalog publication.','Dr. Mrs. A. Balogun (Chief College Librarian)',NULL,NULL,NULL);

-- -------------------------------------------------------------------------
-- institutional_communications
-- -------------------------------------------------------------------------
INSERT INTO `institutional_communications` (`msg_id`, `thread_id`, `sender_id`, `sender_name`, `sender_role`, `sender_dept`, `recipient_id`, `recipient_name`, `recipient_role`, `recipient_dept`, `category`, `subject`, `message`, `priority`, `status`, `action_type`, `action_data`, `created_at`, `updated_at`) VALUES
('MSG-2026-001','TH-CEM-411','FCC/CEM/2024/042','Wale Olonade','student','Co-operative Economics & Management','HOD/CEM/001','Dr. Mrs. F. A. Babalola','hod','Co-operative Economics & Management','course_reserve','Request for CEM 411 Lecture Compendium in Digital Repository','Dear HOD Ma, Good afternoon. The HND II class would appreciate having the updated 2026 Apex Cooperative Syndication past questions and lecture compendium uploaded to the Library Digital Repository so we can access it on our student tablets.','high','resolved','course_material_request','{"course_code":"CEM 411","target_level":"HND II"}','2026-09-28 09:15:00','2026-09-28 10:30:00'),
('MSG-2026-002','TH-CEM-411','HOD/CEM/001','Dr. Mrs. F. A. Babalola (HOD CEM)','hod','Co-operative Economics & Management','FCC/CEM/2024/042','Wale Olonade','student','Co-operative Economics & Management','course_reserve','RE: CEM 411 Lecture Compendium Uploaded','Dear Wale, The Departmental Academic Board has compiled and submitted the CEM 411 Compendium to the Central Library Cataloging unit today. You will receive an automated notification once the Chief Librarian approves the staging ingestion.','normal','resolved','reply','{"course_code":"CEM 411"}','2026-09-28 11:20:00','2026-09-28 11:20:00'),
('MSG-2026-003','TH-ACQ-902','HOD/CEM/001','Dr. Mrs. F. A. Babalola (HOD CEM)','hod','Co-operative Economics & Management','ADMIN-CHIEF','Dr. Mrs. A. Balogun (Chief College Librarian)','admin','Central Library Services','acquisition_request','Book Acquisition Requisition: 15 Copies of Nigerian Cooperative Law (2026 Edition)','The CEM Department requires 15 new physical reference copies of "Nigerian Cooperative Law, Governance & Statutory Auditing" (ISBN: 978-978-8120-00-5) by Spectrum Books to support our upcoming NBTE accreditation audit in November.','urgent','in_progress','acquisition_requisition','{"copies":15,"estimated_cost":240000,"vendor":"Spectrum Books Ibadan"}','2026-09-29 08:45:00','2026-09-29 14:10:00'),
('MSG-2026-004','TH-ACQ-902','ADMIN-CHIEF','Dr. Mrs. A. Balogun (Chief College Librarian)','admin','Central Library Services','HOD/CEM/001','Dr. Mrs. F. A. Babalola (HOD CEM)','hod','Co-operative Economics & Management','acquisition_request','RE: Acquisition Approved — Purchase Order PO-2026-083 Dispatched','Requisition approved. Purchase Order PO-2026-083 has been dispatched to Spectrum Books, Ring Road. 5 copies will be reserved for Departmental Library Stacks and 10 copies for Central Library Reserve Shelf.','high','resolved','approve_requisition','{"po_number":"PO-2026-083","budget_code":"TETFUND-2026-LIB"}','2026-09-29 15:30:00','2026-09-29 15:30:00'),
('MSG-2026-005','TH-CLR-2026-08','FCC/CEM/2024/042','Wale Olonade','student','Co-operative Economics & Management','ADMIN-CIRC','Circulation Desk & Clearance Officer','admin','Circulation Unit','clearance_request','Library Graduation Clearance & Fine Audit Request','Please audit my library card record for final graduation clearance. I have submitted my hardcover project thesis "Cocoa Cooperative Agronomy" and cleared all circulation charges.','normal','unread','audit_clearance','{"matric":"FCC/CEM/2024/042","level":"HND II"}','2026-09-30 08:20:00','2026-09-30 08:20:00'),
('MSG-2026-006','TH-BROADCAST-LIB','ADMIN-CHIEF','College Library Administration','admin','Central Library Services','all','All Faculty, HODs and Students','all','All Departments','official_bulletin','Extended Stack Hours During NBTE Examination Period','The Central Library and ICT Commons will operate from 7:30 AM to 10:00 PM daily throughout the examination period. Group study rooms and self-checkout kiosks are fully operational.','high','unread','announcement','{"hours":"7:30 AM - 10:00 PM","target":"Campus Wide"}','2026-09-30 10:00:00','2026-09-30 10:00:00');

COMMIT;

-- =========================================================================
-- END OF DUMP — brainfeels_library (MySQL)
-- =========================================================================
