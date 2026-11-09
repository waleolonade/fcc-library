-- ========================================================================
-- FEDERAL CO-OPERATIVE COLLEGE, IBADAN - SMART LIBRARY SYSTEM
-- LIVE BROADCAST & MULTI-SOCIAL SIMULCAST SQL SCHEMA
-- Target Database: gsashtub_brainfeels_library (cPanel MySQL)
-- ========================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Live Broadcast Sessions Table
CREATE TABLE IF NOT EXISTS `live_broadcasts` (
  `id` VARCHAR(80) NOT NULL,
  `title` VARCHAR(500) NOT NULL,
  `department_code` VARCHAR(30) NOT NULL DEFAULT 'CEM',
  `department_name` VARCHAR(200) NOT NULL DEFAULT 'Co-operative Economics & Management',
  `course_code` VARCHAR(60) DEFAULT NULL,
  `course_title` VARCHAR(255) DEFAULT NULL,
  `lecturer_name` VARCHAR(255) NOT NULL,
  `lecturer_role` VARCHAR(50) NOT NULL DEFAULT 'hod',
  `status` VARCHAR(40) NOT NULL DEFAULT 'live',
  `is_live` TINYINT(1) NOT NULL DEFAULT 1,
  `stream_mode` VARCHAR(40) NOT NULL DEFAULT 'system_camera',
  `resolution` VARCHAR(40) NOT NULL DEFAULT '1080p Full HD',
  `viewers_count` INT NOT NULL DEFAULT 1,
  `simulcast_destinations` TEXT DEFAULT NULL,
  `announcement` TEXT DEFAULT NULL,
  `companion_pdf_url` VARCHAR(500) DEFAULT NULL,
  `recording_media_id` VARCHAR(80) DEFAULT NULL,
  `started_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ended_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_lb_status` (`status`, `is_live`),
  INDEX `idx_lb_dept` (`department_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Real-time Student & Lecturer Live Chat / Q&A Messages
CREATE TABLE IF NOT EXISTS `live_broadcast_chats` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `broadcast_id` VARCHAR(80) NOT NULL,
  `user_name` VARCHAR(255) NOT NULL,
  `user_role` VARCHAR(50) NOT NULL DEFAULT 'student',
  `user_matric` VARCHAR(100) DEFAULT NULL,
  `message` TEXT NOT NULL,
  `is_question` TINYINT(1) NOT NULL DEFAULT 0,
  `hand_raised` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_lbc_broadcast` (`broadcast_id`),
  INDEX `idx_lbc_question` (`is_question`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Social Media Simulcast Destination Ingest Profiles
CREATE TABLE IF NOT EXISTS `live_social_destinations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `department_code` VARCHAR(30) NOT NULL DEFAULT 'GLOBAL',
  `platform` VARCHAR(50) NOT NULL,
  `platform_name` VARCHAR(100) NOT NULL,
  `server_url` TEXT DEFAULT NULL,
  `stream_key` TEXT DEFAULT NULL,
  `enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `status` VARCHAR(40) NOT NULL DEFAULT 'configured',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_lsd_dept` (`department_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Real-time WebRTC Live Broadcast Signaling Table
CREATE TABLE IF NOT EXISTS `live_broadcast_signals` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `broadcast_id` VARCHAR(80) NOT NULL,
  `sender_id` VARCHAR(120) NOT NULL,
  `recipient_id` VARCHAR(120) NOT NULL,
  `signal_type` VARCHAR(50) NOT NULL,
  `payload` LONGTEXT NOT NULL,
  `consumed` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_lbs_broadcast` (`broadcast_id`),
  INDEX `idx_lbs_recipient` (`recipient_id`),
  INDEX `idx_lbs_consumed` (`consumed`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

