-- =========================================================================
-- FCC Smart Library & Digital Repository Platform
-- Master Database Migration & Sync for cPanel phpMyAdmin
-- Database: gsashtub_brainfeels_library
-- User: gsashtub_brainfeels_library
-- Generated: 2026-10-15 15:53:58
-- =========================================================================

SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET time_zone = '+00:00';
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS `gsashtub_brainfeels_library` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `gsashtub_brainfeels_library`;

-- ---------------------------------------------------------
-- Table structure for `roles`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `roles` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `roles` (8 records)
INSERT INTO `roles` (`id`, `name`, `display_name`, `description`, `created_at`, `updated_at`) VALUES
  ('1', 'admin', 'Library Administrator', 'Full administrative access to entire institution library system', '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('2', 'chief_librarian', 'Chief College Librarian', 'Executive catalog, collection and policy oversight', '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('3', 'cataloguer', 'Cataloguing Librarian', 'MARC 21, Dewey/LCC metadata and accessioning', '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('4', 'circulation_clerk', 'Circulation Desk Staff', 'Desk checkout, checkin, renewals and fine collection', '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('5', 'hod', 'Head of Department (HOD)', 'Departmental curriculum texts and syllabi management', '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('6', 'faculty', 'Academic Faculty Member', 'Lecturer with extended borrow limits and course reserve access', '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('7', 'student', 'Student Scholar', 'Standard patron with borrowing, reserve and e-reader access', '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('8', 'guest', 'Public / Guest Scholar', 'Discovery catalog search and public open-access browsing', '2026-10-15 14:55:14', '2026-10-15 14:55:14')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `display_name` = VALUES(`display_name`), `description` = VALUES(`description`), `created_at` = VALUES(`created_at`), `updated_at` = VALUES(`updated_at`);

-- ---------------------------------------------------------
-- Table structure for `permissions`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(100) NOT NULL,
  `name` varchar(150) NOT NULL,
  `module` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_slug_unique` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `permissions` (15 records)
INSERT INTO `permissions` (`id`, `slug`, `name`, `module`, `description`, `created_at`, `updated_at`) VALUES
  ('1', 'catalogue.view', 'View Catalogue', 'catalogue', 'Browse and view full bibliographic records', '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('2', 'catalogue.create', 'Create Resources', 'catalogue', 'Catalog and upload new books, serials and theses', '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('3', 'catalogue.edit', 'Edit Resources', 'catalogue', 'Modify bibliographic records, call numbers and subject tags', '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('4', 'catalogue.delete', 'Delete/Archive Resources', 'catalogue', 'Decommission or weed resources from active stacks', '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('5', 'users.view', 'View Patrons & Staff', 'users', 'Inspect patron profiles, loan records and clearance status', '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('6', 'users.create', 'Register Patrons', 'users', 'Register new students, faculty and staff members', '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('7', 'users.edit', 'Edit Patron Profiles', 'users', 'Modify patron contact info, level and borrow quotas', '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('8', 'loans.create', 'Issue Loans (Checkout)', 'loans', 'Scan barcodes and issue books to authenticated patrons', '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('9', 'loans.return', 'Process Returns (Checkin)', 'loans', 'Receive returned copies, inspect condition and restack', '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('10', 'loans.renew', 'Renew Loans', 'loans', 'Extend book loan period for eligible patrons', '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('11', 'reservations.manage', 'Manage Reservations', 'reservations', 'Approve hold requests and manage reservation shelf', '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('12', 'fines.manage', 'Manage & Waive Fines', 'fines', 'Collect overdue fines, process waivers and record receipts', '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('13', 'reports.view', 'View Reports & BI', 'reports', 'Access accreditation audit reports and circulation metrics', '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('14', 'reports.export', 'Export Data (CSV/MRC)', 'reports', 'Export MARC21 records, inventory sheets and analytics', '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('15', 'settings.manage', 'Manage Library Settings', 'settings', 'Configure institution profile, loan limits and fine policies', '2026-10-15 14:55:14', '2026-10-15 14:55:14')
ON DUPLICATE KEY UPDATE `slug` = VALUES(`slug`), `name` = VALUES(`name`), `module` = VALUES(`module`), `description` = VALUES(`description`), `created_at` = VALUES(`created_at`), `updated_at` = VALUES(`updated_at`);

-- ---------------------------------------------------------
-- Table structure for `role_permissions`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `role_id` bigint(20) unsigned NOT NULL,
  `permission_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `role_permissions` (52 records)
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
  ('1', '1'),
  ('1', '2'),
  ('1', '3'),
  ('1', '4'),
  ('1', '5'),
  ('1', '6'),
  ('1', '7'),
  ('1', '8'),
  ('1', '9'),
  ('1', '10'),
  ('1', '11'),
  ('1', '12'),
  ('1', '13'),
  ('1', '14'),
  ('1', '15'),
  ('2', '1'),
  ('2', '2'),
  ('2', '3'),
  ('2', '4'),
  ('2', '5'),
  ('2', '6'),
  ('2', '7'),
  ('2', '8'),
  ('2', '9'),
  ('2', '10'),
  ('2', '11'),
  ('2', '12'),
  ('2', '13'),
  ('2', '14'),
  ('2', '15'),
  ('3', '1'),
  ('3', '2'),
  ('3', '3'),
  ('3', '13'),
  ('3', '14'),
  ('4', '1'),
  ('4', '5'),
  ('4', '8'),
  ('4', '9'),
  ('4', '10'),
  ('4', '11'),
  ('4', '12'),
  ('5', '1'),
  ('5', '2'),
  ('5', '5'),
  ('5', '10'),
  ('5', '13'),
  ('6', '1'),
  ('6', '10'),
  ('7', '1'),
  ('7', '10'),
  ('8', '1')
ON DUPLICATE KEY UPDATE `role_id` = VALUES(`role_id`), `permission_id` = VALUES(`permission_id`);

-- ---------------------------------------------------------
-- Table structure for `users`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(191) NOT NULL,
  `username` varchar(191) DEFAULT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'student',
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `plain_secret` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `designation` varchar(255) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'active',
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `users` (33 records)
INSERT INTO `users` (`id`, `name`, `email`, `username`, `role`, `email_verified_at`, `password`, `plain_secret`, `phone`, `designation`, `status`, `remember_token`, `created_at`, `updated_at`) VALUES
  ('1', 'Library Administrator', 'admin@fccibadan.edu.ng', 'admin', 'admin', NULL, '$2y$10$lmt2gKP7x5/Rfktf4NifuOHfGwKC87RNQAmmYC5eQJ/erlrRu3uUu', 'admin123', '+234 802 000 5566', 'Senior Systems Administrator', 'active', NULL, '2026-09-18 18:07:00', '2026-10-15 14:56:48'),
  ('2', 'Alhaji Balogun O. (College Chief Librarian)', 'admin@fccibadanlibrary.com.ng', 'chief_librarian', 'admin', NULL, '$2y$10$lmt2gKP7x5/Rfktf4NifuOHfGwKC87RNQAmmYC5eQJ/erlrRu3uUu', 'admin123', '+234 803 000 1122', 'College Librarian & Director of Library Services', 'active', NULL, '2026-10-15 14:56:48', '2026-10-15 14:56:48'),
  ('3', 'Mrs. Adegoke S. (Deputy College Librarian)', 'librarian@fccibadanlibrary.com.ng', 'deputy_librarian', 'chief_librarian', NULL, '$2y$10$lmt2gKP7x5/Rfktf4NifuOHfGwKC87RNQAmmYC5eQJ/erlrRu3uUu', 'admin123', '+234 803 000 3344', 'Deputy Director of Library Services', 'active', NULL, '2026-10-15 14:56:48', '2026-10-15 14:56:48'),
  ('10', 'Dr. Mrs. F. A. Babalola', 'babalola.hod@fccibadan.edu.ng', 'hod_cem', 'hod', NULL, '$2y$10$4FpH96hmoEyc7LNPYCRfDOVozJxn.085FEKWq4Isgz09nT9hUNADK', '1234', '+234 803 234 5678', 'Head of Department, Co-operative Economics & Management', 'active', NULL, '2026-10-15 14:56:48', '2026-10-15 14:56:48'),
  ('11', 'Dr. K. E. Okonjo', 'okonjo.hod@fccibadan.edu.ng', 'hod_csc', 'hod', NULL, '$2y$10$eSyvD9HvhI5lUh9l8MLAouxs3LGLonY4fdhn42UYLOUlruxo0DLou', '1234', '+234 802 876 5432', 'Head of Department, Computer Science & Information Technology', 'active', NULL, '2026-10-15 14:56:48', '2026-10-15 14:56:48'),
  ('12', 'Mrs. Folake Sanusi', 'sanusi.hod@fccibadan.edu.ng', 'hod_bnf', 'hod', NULL, '$2y$10$lBuwjjNYqPtEYUTcjrw8wu5WKqf4CGryQlVN6UInw8khytbZhKu4m', '1234', '+234 805 112 3344', 'Head of Department, Banking & Finance', 'active', NULL, '2026-10-15 14:56:48', '2026-10-15 14:56:48'),
  ('13', 'Dr. A. O. Olabode', 'olabode.hod@fccibadan.edu.ng', 'hod_agr', 'hod', NULL, '$2y$10$lC/TJmrUlEGPu3UpKqfrhO4ylY0cMQCXnNI5I/eIGzNnQw74Gjvl.', '1234', '+234 803 998 7766', 'Head of Department, Agricultural Extension & Management', 'active', NULL, '2026-10-15 14:56:49', '2026-10-15 14:56:49'),
  ('14', 'Dr. T. M. Adewale', 'adewale.hod@fccibadan.edu.ng', 'hod_bam', 'hod', NULL, '$2y$10$QYldF3E3t/CGHeZbMcRDbuT/xsqH2iqqnE/HUuyYNRVTAWMbdiL.G', '1234', '+234 806 554 3322', 'Head of Department, Business Administration & Management', 'active', NULL, '2026-10-15 14:56:49', '2026-10-15 14:56:49'),
  ('15', 'Dr. S. A. Gbadamosi', 'gbadamosi.hod@fccibadan.edu.ng', 'hod_pad', 'hod', NULL, '$2y$10$/OvRMvcOGCXD1jiqC6favOhtAvqBJotjet/Qd9oDTPQYloX3oBDPa', '1234', '+234 803 771 9900', 'Head of Department, Public Administration', 'active', NULL, '2026-10-15 14:56:49', '2026-10-15 14:56:49'),
  ('16', 'Dr. Mrs. Folashade Adeleke', 'mkt.hod@fccibadan.edu.ng', 'hod_mkt', 'hod', NULL, '$2y$10$eUqA3/o.mY53lyOTETHtVendW566LREelY2O2zhOGGZHBQnFky2gW', '5566', '+234 803 555 7788', 'Head of Department, Marketing & Consumer Studies', 'active', NULL, '2026-10-15 14:56:49', '2026-10-15 14:56:49'),
  ('17', 'Wale Olonade', 'wale.olonade@fccibadan.edu.ng', 'fcccem2024042', 'student', NULL, '$2y$12$2ncecJZQi/XTyRIJjVnjo.piLQrf4UcmzmKSm.p2Vn6thRF5ZHuiO', '1234', '+234 803 111 2233', 'Co-operative Economics & Management (HND II)', 'active', NULL, '2026-10-15 14:48:48', '2026-10-15 14:49:58'),
  ('18', 'Ibrahim Adekunle', 'adekunle.ibrahim@fccibadan.edu.ng', 'fcccem2024011', 'student', NULL, '$2y$12$QvdPfsonbEUHiuOq2e8dpOqTeLSYZ9ls.HVMxyVePzj5pDv0PzGp.', '1234', '+234 802 334 5566', 'Co-operative Economics & Management (HND II)', 'active', NULL, '2026-10-15 14:48:49', '2026-10-15 14:49:59'),
  ('19', 'Adebisi Taiwo Mary', 'taiwo.adebisi@fccibadan.edu.ng', 'fcccem2026101', 'student', NULL, '$2y$12$wPWbLTGE/vzxxgoCHTR7u.HmurfBUZ8qTnHaYNu61L5jzFB/638MG', '1234', '+234 805 443 2211', 'Co-operative Economics & Management (ND I)', 'active', NULL, '2026-10-15 14:48:50', '2026-10-15 14:49:59'),
  ('20', 'Kareem Kehinde Joseph', 'kehinde.kareem@fccibadan.edu.ng', 'fcccem2026102', 'student', NULL, '$2y$12$oCFq3sagXq2a7THz9lwBReKJKNBGmKsOGnAsjclL3aD09EftDHKFC', '1234', '+234 807 665 4433', 'Co-operative Economics & Management (ND I)', 'active', NULL, '2026-10-15 14:48:50', '2026-10-15 14:49:59'),
  ('21', 'OLAWALE AKEEM OLONADE', 'olonade.akeem@fccibadan.edu.ng', 'fcccsc2026409', 'student', NULL, '$2y$12$W2VnpfN15uCrNJ.6ycK7uOw5SYJdPbIvdogd7ks8CXoLtCufV6vty', '1234', '+234 806 778 9900', 'Computer Science & Information Technology (HND II)', 'active', NULL, '2026-10-15 14:48:51', '2026-10-15 14:50:00'),
  ('22', 'Fasasi Rasheed Alade', 'fasasi.rasheed@fccibadan.edu.ng', 'fcccsc2026888', 'student', NULL, '$2y$12$pzc.hvhqd7zf6eMR5Si0WOO9iNC49NP7g.HqCMPkBPiMlNZ1cvgwC', '1234', '+234 808 990 1122', 'Computer Science & Information Technology (ND II)', 'active', NULL, '2026-10-15 14:48:51', '2026-10-15 14:50:00'),
  ('23', 'Chukwudi Okafor', 'okafor.chukwudi@fccibadan.edu.ng', 'fcccsc2024108', 'student', NULL, '$2y$12$7bvhwNErWYq.TuLe4JXN9.yqrdkeLgVbKQqr6Uq1J9X2Vgq4THtTq', '1234', '+234 803 445 6677', 'Computer Science & Information Technology (HND I)', 'active', NULL, '2026-10-15 14:48:52', '2026-10-15 14:50:01'),
  ('24', 'Alabi Deborah Funke', 'alabi.deborah@fccibadan.edu.ng', 'fcccsc2026115', 'student', NULL, '$2y$12$MrVw6peINUn08xxv1lMzCuIQ1GDTn9usMXVwp7oG1hFHq8KPiRN3m', '1234', '+234 805 667 8899', 'Computer Science & Information Technology (ND I)', 'active', NULL, '2026-10-15 14:48:52', '2026-10-15 14:50:01'),
  ('25', 'Amina Bello', 'amina.bello@fccibadan.edu.ng', 'fccbnf2024077', 'student', NULL, '$2y$12$lTAwJr0VYquVBb43MlRpjuOw8To1x/pl.qqeV8UoUQnjF7OsWI1im', '1234', '+234 809 112 2334', 'Banking & Finance (HND II)', 'active', NULL, '2026-10-15 14:48:53', '2026-10-15 14:50:01'),
  ('26', 'Oladipo Samuel Kunle', 'kunle.oladipo@fccibadan.edu.ng', 'fccbnf2026023', 'student', NULL, '$2y$12$EGHoST14cg.9IuG8SCgIE.8PlyWQCI5StsdcCT9nc9JKKlrDf4N1m', '1234', '+234 802 556 7788', 'Banking & Finance (ND II)', 'active', NULL, '2026-10-15 14:48:53', '2026-10-15 14:50:02'),
  ('27', 'Bello Zainab Morayo', 'zainab.bello@fccibadan.edu.ng', 'fccbnf2026054', 'student', NULL, '$2y$12$rFtB40HRv078RppmyXpISeGzD.a3OQGu3AKBTYJfP76zE/bQ9qZxC', '1234', '+234 803 778 8899', 'Banking & Finance (ND I)', 'active', NULL, '2026-10-15 14:48:54', '2026-10-15 14:50:02'),
  ('28', 'Adeleke Sunday Peter', 'sunday.adeleke@fccibadan.edu.ng', 'fccagr2026012', 'student', NULL, '$2y$12$ErC/xLcwT5WlBdTunmuKIe9uuxmVfP9gLQZ51e9PAYVvcnQIDvseS', '1234', '+234 803 221 4455', 'Agricultural Extension & Management (ND II)', 'active', NULL, '2026-10-15 14:48:54', '2026-10-15 14:50:02'),
  ('29', 'Ojo Mercy Titilayo', 'mercy.ojo@fccibadan.edu.ng', 'fccagr2026045', 'student', NULL, '$2y$12$zQF/7xD2Rto1GTGYHaFzs.ImXj01cqWSbCO53oQ9aAyJHYQ8Pissm', '1234', '+234 805 332 5566', 'Agricultural Extension & Management (ND I)', 'active', NULL, '2026-10-15 14:48:55', '2026-10-15 14:50:03'),
  ('30', 'Balogun Idris Kayode', 'idris.balogun@fccibadan.edu.ng', 'fccagr2026089', 'student', NULL, '$2y$12$pI8Bt9kFU8KhcK86By5bH.3x/7nbZExa9LfLzG2g5tf0wm/Fa5VqK', '1234', '+234 807 443 6677', 'Agricultural Extension & Management (HND I)', 'active', NULL, '2026-10-15 14:48:55', '2026-10-15 14:50:03'),
  ('31', 'Lawal Oluwaseun David', 'seun.lawal@fccibadan.edu.ng', 'fccbam2026018', 'student', NULL, '$2y$12$MTzZH7E4ZAdytKlDBZy25.8XQ1GMBlegnHpZOK4b0TULNouynMhV2', '1234', '+234 802 889 0011', 'Business Administration & Management (HND II)', 'active', NULL, '2026-10-15 14:48:55', '2026-10-15 14:50:04'),
  ('32', 'Ajayi Victoria Folake', 'victoria.ajayi@fccibadan.edu.ng', 'fccbam2026067', 'student', NULL, '$2y$12$XCSudXufh/xdRoYV4YC14.qrNJe/AsPWhksue/RzDZisMZYuwaILe', '1234', '+234 806 990 2233', 'Business Administration & Management (ND II)', 'active', NULL, '2026-10-15 14:48:56', '2026-10-15 14:50:04'),
  ('33', 'Yusuf Ibrahim Opeyemi', 'ibrahim.yusuf@fccibadan.edu.ng', 'fccbam2026112', 'student', NULL, '$2y$12$URnNQH.26KkY3Oz6qmMvse22hRtKK6kdr9Z6Tp4UggT7OtBiH3kvi', '1234', '+234 808 112 3344', 'Business Administration & Management (ND I)', 'active', NULL, '2026-10-15 14:48:56', '2026-10-15 14:50:04'),
  ('34', 'Adeleke Rashidat Folashade', 'rashidat.adeleke@fccibadan.edu.ng', 'fccpad2026009', 'student', NULL, '$2y$12$Snqr3SXVywtb8NpS.bWSTOVgOqlh.a1nZO3inp8q5X13q/NjcNFP6', '1234', '+234 803 556 7788', 'Public Administration (HND II)', 'active', NULL, '2026-10-15 14:48:57', '2026-10-15 14:50:05'),
  ('35', 'Okonjo Chioma Grace', 'chioma.okonjo@fccibadan.edu.ng', 'fccpad2026033', 'student', NULL, '$2y$12$XUsTz/FE/VGz6AeNuV7qp.drP6l8LjLNP2HAG8A7FsUHuz4ZZhAuq', '1234', '+234 805 778 9900', 'Public Administration (ND II)', 'active', NULL, '2026-10-15 14:48:57', '2026-10-15 14:50:05'),
  ('36', 'Gbadamosi Lateef Ayomide', 'lateef.gbadamosi@fccibadan.edu.ng', 'fccpad2026071', 'student', NULL, '$2y$12$8i22Hp7BRJMsu5nZewj/FeD5FkAJIrmJF8eAyZnqdQ7Fam26s1hBa', '1234', '+234 807 889 0011', 'Public Administration (ND I)', 'active', NULL, '2026-10-15 14:48:57', '2026-10-15 14:50:06'),
  ('37', 'Sanusi Babatunde Ahmed', 'babatunde.sanusi@fccibadan.edu.ng', 'fccmkt2026015', 'student', NULL, '$2y$12$.rFoLo/Rea3xUeBEicao5.XGsR1oGRxvH1F0NfppOTOYEkaWHXG9q', '1234', '+234 802 334 4455', 'Marketing & Consumer Studies (HND I)', 'active', NULL, '2026-10-15 14:48:58', '2026-10-15 14:50:06'),
  ('38', 'Adegoke Blessing Funmilayo', 'blessing.adegoke@fccibadan.edu.ng', 'fccmkt2026044', 'student', NULL, '$2y$12$.jdZBqnxEiCFIRz8A2G/0OnhL4LXg/2B6Ryb9iruL9FcT8c5FLl22', '1234', '+234 806 445 5566', 'Marketing & Consumer Studies (ND II)', 'active', NULL, '2026-10-15 14:48:58', '2026-10-15 14:50:06'),
  ('39', 'Popoola Victor Damilola', 'victor.popoola@fccibadan.edu.ng', 'fccmkt2026082', 'student', NULL, '$2y$12$TULLr3.RuzV4bqPJ5MfRYOYQXWQRivvHrnub87c3QF7OjC89oxF5K', '1234', '+234 808 556 6677', 'Marketing & Consumer Studies (ND I)', 'active', NULL, '2026-10-15 14:48:59', '2026-10-15 14:50:07')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `email` = VALUES(`email`), `username` = VALUES(`username`), `role` = VALUES(`role`), `email_verified_at` = VALUES(`email_verified_at`), `password` = VALUES(`password`), `plain_secret` = VALUES(`plain_secret`), `phone` = VALUES(`phone`), `designation` = VALUES(`designation`), `status` = VALUES(`status`), `remember_token` = VALUES(`remember_token`), `created_at` = VALUES(`created_at`), `updated_at` = VALUES(`updated_at`);

-- ---------------------------------------------------------
-- Table structure for `user_roles`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_roles` (
  `user_id` bigint(20) unsigned NOT NULL,
  `role_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `user_roles` (33 records)
INSERT INTO `user_roles` (`user_id`, `role_id`) VALUES
  ('1', '1'),
  ('2', '2'),
  ('3', '2'),
  ('10', '5'),
  ('11', '5'),
  ('12', '5'),
  ('13', '5'),
  ('14', '5'),
  ('15', '5'),
  ('16', '5'),
  ('17', '7'),
  ('18', '7'),
  ('19', '7'),
  ('20', '7'),
  ('21', '7'),
  ('22', '7'),
  ('23', '7'),
  ('24', '7'),
  ('25', '7'),
  ('26', '7'),
  ('27', '7'),
  ('28', '7'),
  ('29', '7'),
  ('30', '7'),
  ('31', '7'),
  ('32', '7'),
  ('33', '7'),
  ('34', '7'),
  ('35', '7'),
  ('36', '7'),
  ('37', '7'),
  ('38', '7'),
  ('39', '7')
ON DUPLICATE KEY UPDATE `user_id` = VALUES(`user_id`), `role_id` = VALUES(`role_id`);

-- ---------------------------------------------------------
-- Table structure for `departments`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `departments` (
  `id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `faculty` varchar(255) DEFAULT NULL,
  `code` varchar(50) NOT NULL,
  `hod_name` varchar(255) DEFAULT NULL,
  `hod_email` varchar(150) DEFAULT NULL,
  `hod_phone` varchar(50) DEFAULT NULL,
  `hod_pin` varchar(10) NOT NULL DEFAULT '1234',
  `student_count` int(11) NOT NULL DEFAULT 0,
  `faculty_count` int(11) NOT NULL DEFAULT 0,
  `description` text DEFAULT NULL,
  `established` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `departments_code_unique` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `departments` (7 records)
INSERT INTO `departments` (`id`, `name`, `faculty`, `code`, `hod_name`, `hod_email`, `hod_phone`, `hod_pin`, `student_count`, `faculty_count`, `description`, `established`, `created_at`, `updated_at`) VALUES
  ('DEP-AGR', 'Agricultural Extension & Management', 'School of Agriculture & Natural Resources', 'AGR', 'Dr. A. O. Olabode', 'olabode.hod@fccibadan.edu.ng', '+234 803 998 7766', '1234', '3', '9', 'Practical and research-driven training in agricultural value chain optimization, crop protection, livestock agronomy, and agro-allied cooperatives.', '1982', '2026-10-15 14:55:15', '2026-10-15 14:50:07'),
  ('DEP-BAM', 'Business Administration & Management', 'School of Cooperative & Management Studies', 'BAM', 'Dr. T. M. Adewale', 'adewale.hod@fccibadan.edu.ng', '+234 806 554 3322', '1234', '3', '11', 'Comprehensive management sciences focusing on strategic business leadership, human resources, organizational dynamics, and corporate ethics.', '1985', '2026-10-15 14:55:15', '2026-10-15 14:50:07'),
  ('DEP-BNF', 'Banking & Finance', 'School of Financial & Economic Sciences', 'BNF', 'Mrs. Folake Sanusi', 'sanusi.hod@fccibadan.edu.ng', '+234 805 112 3344', '1234', '3', '10', 'Accredited ND and HND curricula in financial institutions management, credit risk assessment, portfolio management, and monetary economics.', '1988', '2026-10-15 14:55:15', '2026-10-15 14:50:07'),
  ('DEP-CEM', 'Co-operative Economics & Management', 'School of Cooperative & Management Studies', 'CEM', 'Dr. Mrs. F. A. Babalola', 'babalola.hod@fccibadan.edu.ng', '+234 803 234 5678', '1234', '4', '14', 'Flagship departmental programmes covering cooperative economics, micro-finance syndication, cooperative law, and agrarian enterprise management.', '1976', '2026-10-15 14:55:15', '2026-10-15 14:50:07'),
  ('DEP-CSC', 'Computer Science & Information Technology', 'School of Applied Sciences & Computing', 'CSC', 'Dr. K. E. Okonjo', 'okonjo.hod@fccibadan.edu.ng', '+234 802 876 5432', '1234', '4', '12', 'Cutting-edge computing curriculum spanning software engineering, cyber-security, cloud infrastructure, vector databases, and machine learning systems.', '1994', '2026-10-15 14:55:15', '2026-10-15 14:50:07'),
  ('DEP-MKT', 'Marketing & Consumer Studies', 'School of Business & Financial Management', 'MKT', 'Dr. Mrs. Folashade Adeleke', 'mkt.hod@fccibadan.edu.ng', '+234 803 555 7788', '5566', '3', '12', 'Comprehensive ND and HND curricula in Marketing, Brand Management, and Digital Commerce.', '2005', '2026-10-15 14:56:48', '2026-10-15 14:50:07'),
  ('DEP-PAD', 'Public Administration', 'School of Public Administration', 'PAD', 'Dr. S. A. Gbadamosi', 'gbadamosi.hod@fccibadan.edu.ng', '+234 803 771 9900', '1234', '3', '10', 'Training future leaders in civil service ethics, public policy analysis, governmental administration, and public sector governance.', '2001', '2026-10-15 14:56:48', '2026-10-15 14:50:07')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `faculty` = VALUES(`faculty`), `code` = VALUES(`code`), `hod_name` = VALUES(`hod_name`), `hod_email` = VALUES(`hod_email`), `hod_phone` = VALUES(`hod_phone`), `hod_pin` = VALUES(`hod_pin`), `student_count` = VALUES(`student_count`), `faculty_count` = VALUES(`faculty_count`), `description` = VALUES(`description`), `established` = VALUES(`established`), `created_at` = VALUES(`created_at`), `updated_at` = VALUES(`updated_at`);

-- ---------------------------------------------------------
-- Table structure for `department_uploads`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `department_uploads` (
  `id` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `author` varchar(255) NOT NULL,
  `department_id` varchar(50) NOT NULL,
  `department_name` varchar(255) NOT NULL,
  `uploaded_by_hod_id` varchar(100) DEFAULT NULL,
  `hod_name` varchar(255) DEFAULT NULL,
  `course_code` varchar(50) DEFAULT NULL,
  `target_level` varchar(50) NOT NULL DEFAULT 'HND II',
  `semester` varchar(50) NOT NULL DEFAULT 'First Semester',
  `resource_type` varchar(100) NOT NULL DEFAULT 'Lecture Handout',
  `file_name` varchar(255) DEFAULT NULL,
  `file_data_url` longtext DEFAULT NULL,
  `access_scope` varchar(100) NOT NULL DEFAULT 'Restricted to Department Students Only',
  `status` varchar(50) NOT NULL DEFAULT 'pending',
  `review_notes` text DEFAULT NULL,
  `reviewed_by` varchar(255) DEFAULT NULL,
  `assigned_call_number` varchar(100) DEFAULT NULL,
  `assigned_shelf` varchar(150) DEFAULT NULL,
  `book_id` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `department_uploads` (4 records)
INSERT INTO `department_uploads` (`id`, `title`, `author`, `department_id`, `department_name`, `uploaded_by_hod_id`, `hod_name`, `course_code`, `target_level`, `semester`, `resource_type`, `file_name`, `file_data_url`, `access_scope`, `status`, `review_notes`, `reviewed_by`, `assigned_call_number`, `assigned_shelf`, `book_id`, `created_at`, `updated_at`) VALUES
  ('HOD-UP-001', 'CEM 411 Cooperative Econometrics Past Examination Question Compendium (2020-2025)', 'Department of Co-operative Economics Academic Board', 'DEP-CEM', 'Co-operative Economics & Management', 'STAFF-HOD-01', 'Dr. Mrs. F. A. Babalola', 'CEM 411', 'HND II', 'First Semester', 'Past Exam Questions', 'cem411-past-questions-compendium.pdf', '', 'Restricted to Department Students Only', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('HOD-UP-002', 'Distributed Multi-Cloud Systems & Vector Indexing Lab Handout', 'Dr. K. E. Okonjo & Faculty Research Unit', 'DEP-CSC', 'Computer Science & Information Technology', 'STAFF-HOD-02', 'Dr. K. E. Okonjo', 'CSC 301', 'HND I', 'First Semester', 'Lecture Handout', 'distributed-multi-cloud-lab-handout.pdf', '', 'Public Institution-Wide', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('HOD-UP-003', 'Modern Micro-Credit Lending & Syndicate Banking Guidelines', 'Mrs. Folake Sanusi & Dr. M. K. Balogun', 'DEP-BNF', 'Banking & Finance', 'STAFF-HOD-03', 'Mrs. Folake Sanusi', 'BNF 312', 'ND II', 'Second Semester', 'Lecture Handout', 'modern-microcredit-syndicate-banking.pdf', '', 'Public Institution-Wide', 'approved', 'Verified syllabus compliance. Ingested into master catalog.', 'Dr. Mrs. A. Balogun (Chief College Librarian)', 'HG178.33 .S26 2026', 'Floor 2 • Aisle 3 • Shelf 08A', 'FCC-B004', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('HOD-UP-004', 'Soil Nitrogen Dynamics & Cocoa Harvest Optimization in Agro-Ecological Zones', 'Agronomy Faculty Unit', 'DEP-AGR', 'Agricultural Extension & Management', 'STAFF-HOD-04', 'Dr. A. O. Olabode', 'AGR 211', 'ND I', 'First Semester', 'Research Monograph', 'soil-nitrogen-dynamics-cocoa.pdf', '', 'Public Institution-Wide', 'rejected', 'Please attach formal departmental academic board approval signature on page 2 before master catalog publication.', 'Dr. Mrs. A. Balogun (Chief College Librarian)', NULL, NULL, NULL, '2026-10-15 14:55:15', '2026-10-15 14:55:15')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `author` = VALUES(`author`), `department_id` = VALUES(`department_id`), `department_name` = VALUES(`department_name`), `uploaded_by_hod_id` = VALUES(`uploaded_by_hod_id`), `hod_name` = VALUES(`hod_name`), `course_code` = VALUES(`course_code`), `target_level` = VALUES(`target_level`), `semester` = VALUES(`semester`), `resource_type` = VALUES(`resource_type`), `file_name` = VALUES(`file_name`), `file_data_url` = VALUES(`file_data_url`), `access_scope` = VALUES(`access_scope`), `status` = VALUES(`status`), `review_notes` = VALUES(`review_notes`), `reviewed_by` = VALUES(`reviewed_by`), `assigned_call_number` = VALUES(`assigned_call_number`), `assigned_shelf` = VALUES(`assigned_shelf`), `book_id` = VALUES(`book_id`), `created_at` = VALUES(`created_at`), `updated_at` = VALUES(`updated_at`);

-- ---------------------------------------------------------
-- Table structure for `subjects`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `subjects` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(50) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `classification_system` varchar(100) NOT NULL DEFAULT 'Library of Congress',
  `parent_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `subjects_name_index` (`name`),
  KEY `subjects_code_index` (`code`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `subjects_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `subjects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `subjects` (12 records)
INSERT INTO `subjects` (`id`, `code`, `name`, `classification_system`, `parent_id`, `created_at`, `updated_at`) VALUES
  ('1', 'HD2951-HD3575', 'Co-operative Societies & Economics', 'Library of Congress', NULL, '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('2', 'QA76-QA76.9', 'Computer Science & Software Systems', 'Library of Congress', NULL, '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('3', 'HG1501-HG3550', 'Banking, Finance & Micro-Credit', 'Library of Congress', NULL, '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('4', 'S494.5-S600', 'Agricultural Agronomy & Management', 'Library of Congress', NULL, '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('5', 'HF5546-HF5549', 'Business Administration & Management', 'Library of Congress', NULL, '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('6', 'JF1338-JF2112', 'Public Administration & Civil Service', 'Library of Congress', NULL, '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('7', 'HF5410-HF5417', 'Marketing & Consumer Behaviour', 'Library of Congress', NULL, '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('8', 'Z665-Z718', 'Library & Information Science', 'Library of Congress', NULL, '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('9', 'TK5105.5', 'Cloud Networking & Distributed Computing', 'Library of Congress', '2', '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('10', 'SB267', 'Cocoa Agronomy & Agro-Forestry', 'Library of Congress', '4', '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('11', 'HG178.3', 'Micro-Finance & Syndicate Credit', 'Library of Congress', '3', '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('12', 'KTA1000', 'Nigerian Co-operative Law & Statutes', 'Moys / LCC', '1', '2026-10-15 15:20:02', '2026-10-15 15:20:02')
ON DUPLICATE KEY UPDATE `code` = VALUES(`code`), `name` = VALUES(`name`), `classification_system` = VALUES(`classification_system`), `parent_id` = VALUES(`parent_id`), `created_at` = VALUES(`created_at`), `updated_at` = VALUES(`updated_at`);

-- ---------------------------------------------------------
-- Table structure for `categories`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `slug` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_name_unique` (`name`),
  UNIQUE KEY `categories_slug_unique` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `categories` (9 records)
INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `created_at`) VALUES
  ('1', 'Textbooks & Curricula', 'textbooks', 'Accredited ND and HND core textbooks for collegiate degree programmes.', '2026-10-15 15:20:01'),
  ('2', 'Monographs & Research', 'monographs', 'Peer-reviewed scholarly treatises and institutional research works.', '2026-10-15 15:20:01'),
  ('3', 'E-Books & Open Access', 'e-books', 'Full-text electronic monographs available across campus network.', '2026-10-15 15:20:01'),
  ('4', 'Reference & Handbooks', 'reference', 'Encyclopedias, statistical abstracts, gazettes, and legal compendia.', '2026-10-15 15:20:01'),
  ('5', 'Dissertations & Theses', 'theses', 'Final year HND dissertations and faculty capstone monographs.', '2026-10-15 15:20:01'),
  ('6', 'Serials & Periodicals', 'serials', 'Quarterly academic journals, cooperative bulletins, and financial digests.', '2026-10-15 15:20:01'),
  ('7', 'Examination Past Questions', 'past-questions', 'Official archived semester examination question papers (2018-2025).', '2026-10-15 15:20:01'),
  ('8', 'Technical Reports & Manuals', 'manuals', 'Laboratory equipment guides, agro-processing standards, and computing handouts.', '2026-10-15 15:20:01'),
  ('9', 'Government & Regulatory Gazettes', 'gazettes', 'Federal laws, NBTE accreditation syllabi, and CBN monetary directives.', '2026-10-15 15:20:01')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `slug` = VALUES(`slug`), `description` = VALUES(`description`), `created_at` = VALUES(`created_at`);

-- ---------------------------------------------------------
-- Table structure for `authors`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `authors` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `orcid` varchar(50) DEFAULT NULL,
  `affiliation` varchar(255) DEFAULT NULL,
  `nationality` varchar(100) DEFAULT NULL,
  `biography` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `authors_name_index` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `authors` (4 records)
INSERT INTO `authors` (`id`, `name`, `orcid`, `affiliation`, `nationality`, `biography`, `created_at`, `updated_at`) VALUES
  ('1', 'Prof. Adeyemi O. Oladipo', '0000-0002-1825-0097', 'Federal Co-operative College, Ibadan', 'Nigerian', 'Professor of Cooperative Microfinance and Rural Agrarian Economies.', '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('2', 'Dr. Mrs. F. A. Babalola', '0000-0003-4512-8819', 'Head of Department, CEM', 'Nigerian', 'Pioneer researcher in apex cooperative societies governance in West Africa.', '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('3', 'Andrew S. Tanenbaum', '0000-0001-9214-7741', 'Vrije Universiteit Amsterdam', 'Dutch-American', 'Author of seminal textbooks on Computer Networks and Operating Systems.', '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('4', 'E. Raymond', '0000-0002-7634-1182', 'Open Source Initiative', 'American', 'Renowned author on software engineering paradigms and bazaar methodology.', '2026-10-15 14:55:14', '2026-10-15 14:55:14')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `orcid` = VALUES(`orcid`), `affiliation` = VALUES(`affiliation`), `nationality` = VALUES(`nationality`), `biography` = VALUES(`biography`), `created_at` = VALUES(`created_at`), `updated_at` = VALUES(`updated_at`);

-- ---------------------------------------------------------
-- Table structure for `publishers`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `publishers` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `country` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `contact_email` varchar(150) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `publishers_name_index` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `publishers` (4 records)
INSERT INTO `publishers` (`id`, `name`, `country`, `city`, `website`, `contact_email`, `created_at`, `updated_at`) VALUES
  ('1', 'Federal Co-operative College Academic Press', 'Nigeria', 'Ibadan', 'https://press.fccibadan.edu.ng', 'press@fccibadan.edu.ng', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('2', 'Pearson Education', 'United Kingdom', 'London', 'https://pearson.com', 'highered@pearson.com', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('3', 'O\'Reilly Media', 'United States', 'Sebastopol', 'https://oreilly.com', 'order@oreilly.com', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('4', 'University Press Plc', 'Nigeria', 'Ibadan', 'https://universitypressplc.com', 'info@universitypressplc.com', '2026-10-15 14:55:15', '2026-10-15 14:55:15')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `country` = VALUES(`country`), `city` = VALUES(`city`), `website` = VALUES(`website`), `contact_email` = VALUES(`contact_email`), `created_at` = VALUES(`created_at`), `updated_at` = VALUES(`updated_at`);

-- ---------------------------------------------------------
-- Table structure for `branches`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `branches` (
  `id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `short_code` varchar(50) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `campus` varchar(100) DEFAULT NULL,
  `seats` int(11) DEFAULT NULL,
  `current_occupancy` int(11) DEFAULT NULL,
  `holdings_count` int(11) DEFAULT NULL,
  `head_librarian` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `opening_hours` varchar(150) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Online',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `branches` (12 records)
INSERT INTO `branches` (`id`, `name`, `short_code`, `location`, `campus`, `seats`, `current_occupancy`, `holdings_count`, `head_librarian`, `phone`, `email`, `opening_hours`, `status`, `created_at`, `updated_at`) VALUES
  ('BR-DIGI', 'E-Library & Virtual Innovation Commons', NULL, 'ICT Directorate Centre', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('BR-ENG', 'Faculty of Engineering Library', NULL, 'Engineering Block B, Level 1', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('BR-LAW', 'Law & Administrative Library', NULL, 'Management Sciences Complex', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('BR-MAIN', 'Main Campus Library (Prof. Hezekiah Complex)', NULL, 'Central Campus Quadrangle', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('BR-MED', 'Medical & Health Sciences Library', NULL, 'Health Tech Pavilion', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('BR-RES', 'Postgraduate & Research Depository', NULL, 'Senate Building Annex', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('BR-SCI', 'Faculty of Science & Computing Library', NULL, 'Science Complex, East Wing', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('BRANCH-ACC', 'Accounting & Finance Library', 'ACC', 'ICAN Accredited Finance Center â€¢ Floor 1', 'Annex Campus', '90', '32', '2900', 'Mr. P. A. Ogundipe (FCA)', '+234 809 332 1100', 'acclib@fccibadan.edu.ng', '8:30 AM â€“ 6:00 PM', 'Online', '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('BRANCH-BUS', 'Business & Management Library', 'BUS', 'School of Business Building â€¢ Floor 2', 'Main Campus, Eleyele', '120', '45', '3800', 'Mrs. O. M. Adeleke', '+234 805 776 5432', 'bizlib@fccibadan.edu.ng', '8:30 AM â€“ 6:00 PM', 'Online', '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('BRANCH-DEPT', 'Departmental & Co-operative Extension Library', 'DEPT', 'CEM Faculty Hall â€¢ Room 104', 'Main Campus, Eleyele', '75', '28', '1850', 'Dr. Mrs. F. A. Babalola', '+234 807 554 2211', 'cemlib@fccibadan.edu.ng', '9:00 AM â€“ 5:00 PM', 'Online', '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('BRANCH-ICT', 'ICT & Informatics Digital Library', 'ICT', 'ICT Complex â€¢ Wing B, Ground Floor', 'Main Campus, Eleyele', '160', '78', '4200', 'Engr. D. K. Lawal', '+234 802 112 3344', 'ictlib@fccibadan.edu.ng', '8:00 AM â€“ 9:00 PM', 'Online', '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('BRANCH-MAIN', 'Main Central Library', 'MAIN', 'Main Academic Quad â€¢ 3 Floors', 'Main Campus, Eleyele', '450', '184', '14850', 'Dr. Mrs. A. Balogun', '+234 803 456 7890', 'mainlib@fccibadan.edu.ng', '8:00 AM â€“ 8:00 PM', 'Online', '2026-10-15 14:55:14', '2026-10-15 14:55:14')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `short_code` = VALUES(`short_code`), `location` = VALUES(`location`), `campus` = VALUES(`campus`), `seats` = VALUES(`seats`), `current_occupancy` = VALUES(`current_occupancy`), `holdings_count` = VALUES(`holdings_count`), `head_librarian` = VALUES(`head_librarian`), `phone` = VALUES(`phone`), `email` = VALUES(`email`), `opening_hours` = VALUES(`opening_hours`), `status` = VALUES(`status`), `created_at` = VALUES(`created_at`), `updated_at` = VALUES(`updated_at`);

-- ---------------------------------------------------------
-- Table structure for `locations`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `locations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `branch_id` varchar(50) DEFAULT NULL,
  `building` varchar(150) NOT NULL,
  `floor` varchar(50) NOT NULL,
  `room` varchar(100) DEFAULT NULL,
  `area_name` varchar(150) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `locations` (6 records)
INSERT INTO `locations` (`id`, `branch_id`, `building`, `floor`, `room`, `area_name`, `created_at`, `updated_at`) VALUES
  ('1', 'BRANCH-MAIN', 'Chief Olubadan Memorial Complex', 'Floor 1', 'General Circulation Desk', 'Reserve Stacks & Circulation Counter', '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('2', 'BRANCH-MAIN', 'Chief Olubadan Memorial Complex', 'Floor 2', 'Academic Quad Stacks', 'Management & Social Sciences (HB - HD)', '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('3', 'BRANCH-MAIN', 'Chief Olubadan Memorial Complex', 'Floor 3', 'Research Depository', 'Dissertations & Bound Serials Wing', '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('4', 'BRANCH-ICT', 'ICT Complex', 'Ground Floor', 'Digital Commons', 'E-Learning Terminal Stacks & Server Bay', '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('5', 'BRANCH-BUS', 'School of Business Building', 'Floor 2', 'Room 204', 'Curriculum Reading Stacks', '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('6', 'BRANCH-ACC', 'ICAN Accredited Finance Center', 'Floor 1', 'Accounting Lab', 'Financial Journals & Tax Statutes', '2026-10-15 15:20:02', '2026-10-15 15:20:02')
ON DUPLICATE KEY UPDATE `branch_id` = VALUES(`branch_id`), `building` = VALUES(`building`), `floor` = VALUES(`floor`), `room` = VALUES(`room`), `area_name` = VALUES(`area_name`), `created_at` = VALUES(`created_at`), `updated_at` = VALUES(`updated_at`);

-- ---------------------------------------------------------
-- Table structure for `shelves`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `shelves` (
  `id` varchar(50) NOT NULL,
  `branch_id` varchar(50) DEFAULT NULL,
  `shelf_code` varchar(100) NOT NULL,
  `floor` int(11) NOT NULL DEFAULT 1,
  `aisle` varchar(50) DEFAULT NULL,
  `call_number_start` varchar(100) DEFAULT NULL,
  `call_number_end` varchar(100) DEFAULT NULL,
  `qr_code` varchar(150) DEFAULT NULL,
  `capacity` int(11) NOT NULL DEFAULT 100,
  `current_count` int(11) NOT NULL DEFAULT 0,
  `status` varchar(50) NOT NULL DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `shelves_shelf_code_index` (`shelf_code`),
  KEY `shelves_branch_id_index` (`branch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `shelves` (5 records)
INSERT INTO `shelves` (`id`, `branch_id`, `shelf_code`, `floor`, `aisle`, `call_number_start`, `call_number_end`, `qr_code`, `capacity`, `current_count`, `status`, `created_at`, `updated_at`) VALUES
  ('SHELF-FL1-A1', 'BRANCH-MAIN', 'FL1-A1-CEM', '1', 'Aisle 1', 'HD2951', 'HD3500', 'QR-SHELF-FL1-A1', '120', '84', 'Active', '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('SHELF-FL1-A2', 'BRANCH-MAIN', 'FL1-A2-ACC', '1', 'Aisle 2', 'HF5601', 'HF5689', 'QR-SHELF-FL1-A2', '120', '96', 'Active', '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('SHELF-FL2-B1', 'BRANCH-MAIN', 'FL2-B1-CS', '2', 'Aisle 1', 'QA76', 'QA76.9', 'QR-SHELF-FL2-B1', '150', '110', 'Active', '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('SHELF-FL2-B2', 'BRANCH-MAIN', 'FL2-B2-AGR', '2', 'Aisle 2', 'S560', 'S590', 'QR-SHELF-FL2-B2', '100', '65', 'Active', '2026-10-15 14:55:14', '2026-10-15 14:55:14'),
  ('SHELF-FL3-C1', 'BRANCH-MAIN', 'FL3-C1-REF', '3', 'Aisle 1', 'Z1000', 'Z8000', 'QR-SHELF-FL3-C1', '80', '72', 'Active', '2026-10-15 14:55:14', '2026-10-15 14:55:14')
ON DUPLICATE KEY UPDATE `branch_id` = VALUES(`branch_id`), `shelf_code` = VALUES(`shelf_code`), `floor` = VALUES(`floor`), `aisle` = VALUES(`aisle`), `call_number_start` = VALUES(`call_number_start`), `call_number_end` = VALUES(`call_number_end`), `qr_code` = VALUES(`qr_code`), `capacity` = VALUES(`capacity`), `current_count` = VALUES(`current_count`), `status` = VALUES(`status`), `created_at` = VALUES(`created_at`), `updated_at` = VALUES(`updated_at`);

-- ---------------------------------------------------------
-- Table structure for `books`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `books` (
  `id` varchar(50) NOT NULL,
  `title` varchar(500) NOT NULL,
  `subtitle` varchar(500) DEFAULT NULL,
  `author` varchar(255) NOT NULL,
  `author_credentials` varchar(255) DEFAULT NULL,
  `author_affiliation` varchar(255) DEFAULT NULL,
  `orcid` varchar(50) DEFAULT NULL,
  `co_authors` text DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `department` varchar(150) DEFAULT NULL,
  `course_code` varchar(50) DEFAULT NULL,
  `target_level` varchar(50) DEFAULT NULL,
  `branch` varchar(255) DEFAULT NULL,
  `shelf_location` varchar(100) DEFAULT NULL,
  `call_number` varchar(100) DEFAULT NULL,
  `isbn` varchar(50) DEFAULT NULL,
  `doi` varchar(100) DEFAULT NULL,
  `publisher` varchar(255) DEFAULT NULL,
  `year` int(11) DEFAULT NULL,
  `edition` varchar(100) DEFAULT NULL,
  `pdf_pages` int(11) NOT NULL DEFAULT 0,
  `file_size` varchar(50) DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_data_url` longtext DEFAULT NULL,
  `external_url` text DEFAULT NULL,
  `is_digital` tinyint(1) NOT NULL DEFAULT 0,
  `access_level` varchar(100) NOT NULL DEFAULT 'Open Access Full-Text',
  `rights_status` varchar(150) DEFAULT NULL,
  `copies_total` int(11) NOT NULL DEFAULT 1,
  `copies_available` int(11) NOT NULL DEFAULT 1,
  `rating` decimal(3,1) NOT NULL DEFAULT 5.0,
  `citations` int(11) NOT NULL DEFAULT 0,
  `abstract` text DEFAULT NULL,
  `keywords` text DEFAULT NULL,
  `chapters` text DEFAULT NULL,
  `references_data` text DEFAULT NULL,
  `reference_style` varchar(50) DEFAULT NULL,
  `uploaded_at` datetime DEFAULT current_timestamp(),
  `uploaded_by` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `books_title_index` (`title`(191)),
  KEY `books_author_index` (`author`),
  KEY `books_isbn_index` (`isbn`),
  KEY `books_call_number_index` (`call_number`),
  KEY `books_subject_index` (`subject`),
  KEY `books_department_index` (`department`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `books` (7 records)
INSERT INTO `books` (`id`, `title`, `subtitle`, `author`, `author_credentials`, `author_affiliation`, `orcid`, `co_authors`, `subject`, `department`, `course_code`, `target_level`, `branch`, `shelf_location`, `call_number`, `isbn`, `doi`, `publisher`, `year`, `edition`, `pdf_pages`, `file_size`, `file_name`, `file_data_url`, `external_url`, `is_digital`, `access_level`, `rights_status`, `copies_total`, `copies_available`, `rating`, `citations`, `abstract`, `keywords`, `chapters`, `references_data`, `reference_style`, `uploaded_at`, `uploaded_by`) VALUES
  ('FCC-B001', 'Principles and Practice of Co-operative Economics', 'Empirical Models, Statutory Reserves & Apex Syndicate Accounting', 'Prof. A. O. Adebayo', 'Ph.D., FSNA, Professor of Cooperative Econometrics', 'Federal Co-operative College, Ibadan', '', 'Dr. B. A. Olowookere, Chief M. K. Balogun', 'Co-operative Economics', 'Co-operative Economics & Management', 'CEM 411', 'HND II', 'Main Campus Library (Prof. Hezekiah Complex)', 'Floor 2 • Aisle 4 • Shelf 12B', 'HD2963 .A34 2024', '978-978-49021-1-4', '10.1016/j.coop.2024.01.002', 'FCC Ibadan Academic Press', '2024', '4th Revised Edition', '384', '6.4 MB', 'principles-of-cooperative-economics.pdf', '', '', '1', 'Open Access Full-Text', '', '12', '7', '4.9', '84', 'Comprehensive analysis of modern agrarian credit unions, apex cooperatives, and fiscal regulatory mechanisms in West Africa with empirical data from Nigerian apexes.', '[]', '[{\"title\":\"Chapter 1: Foundational Frameworks of Raiffeisen & Schulze Credit Unions\",\"page\":1},{\"title\":\"Chapter 2: Financial Ratios & Liquidity Stress in Cooperatives\",\"page\":48},{\"title\":\"Chapter 3: Risk Hedging & Apex Syndicate Accounting\",\"page\":112},{\"title\":\"Chapter 4: Modern Statutory Reserves & Audit Protocols\",\"page\":230},{\"title\":\"Chapter 5: Digital Value Chains & Fair-Trade Settlement\",\"page\":310}]', '[]', 'APA 7th', '2026-09-18 16:07:47', 'Cataloging Authority'),
  ('FCC-B003', 'Macro-prudential Banking Reforms & Risk Hedging', 'Non-Performing Loan Resolution, Basel III Capital Adequacy & Microfinance', 'Chief (Mrs.) Folake Sanusi', 'M.Sc., FCIB, Fellow of the Chartered Institute of Bankers', 'Federal Co-operative College, Ibadan', '', 'H. L. Babatunde', 'Banking & Finance', 'Banking & Finance', 'BNF 302', 'HND I', 'Law & Administrative Library', 'Floor 2 • Aisle 1 • Shelf 08C', 'HG1601 .S26 2023', '978-978-8120-44-1', '10.1080/09603107.2023.119', 'University of Ibadan Press', '2023', '2nd Edition', '290', '4.2 MB', 'macro-prudential-banking-reforms.pdf', '', '', '0', 'Open Access Full-Text', '', '15', '11', '4.6', '45', 'Examination of non-performing loan management, Basel III framework implementations, and sub-Saharan microfinance resilience amid inflationary pressures.', '[]', '[{\"title\":\"Chapter 1: Evolution of Nigerian Banking Regulatory Directives\",\"page\":1},{\"title\":\"Chapter 2: Basel III Capital Adequacy & Liquidity Coverage Ratios\",\"page\":50},{\"title\":\"Chapter 3: Stress-Testing Credit Portfolios in Developing Markets\",\"page\":120},{\"title\":\"Chapter 4: Derivatives & FX Forward Hedging for Agribusinesses\",\"page\":200}]', '[]', 'APA 7th', '2026-09-18 16:07:47', 'Cataloging Authority'),
  ('FCC-B004', 'Cocoa Agronomy & Smallholder Value-Chain Mechanics', 'Soil Biochemistry, Pest Mitigation & Cooperative Export Logistics', 'Engr. T. J. Adeleke', 'Ph.D., Agricultural Extension Specialist', 'Federal Co-operative College, Ibadan', '', 'Dr. O. Alabi', 'Agricultural Extension', 'Agricultural Extension & Management', 'AGE 201', 'ND II', 'Main Campus Library (Prof. Hezekiah Complex)', 'Floor 3 • Aisle 6 • Shelf 19A', 'SB267 .A43 2024', '978-978-3012-88-0', '10.1007/s10460-024-0982-1', 'Agronomic Research Publications', '2024', '1st Edition', '440', '7.9 MB', 'cocoa-agronomy-value-chain.pdf', '', '', '1', 'Open Access Full-Text', '', '6', '1', '4.7', '63', 'Soil biochemistry, fungal blight mitigation, post-harvest solar drying paradigms, and cooperative export consortium tactics for premium West African cocoa beans.', '[]', '[{\"title\":\"Chapter 1: Soil Pedology and Micro-nutrient Regimes for Theobroma Cacao\",\"page\":1},{\"title\":\"Chapter 2: Integrated Pest Management & Biological Control Agents\",\"page\":85},{\"title\":\"Chapter 3: Fermentation Science and Flavor Precursor Synthesis\",\"page\":190},{\"title\":\"Chapter 4: Fair-Trade Certification and Cooperative Export Logistics\",\"page\":310}]', '[]', 'APA 7th', '2026-09-18 16:07:47', 'Cataloging Authority'),
  ('FCC-B005', 'Artificial Intelligence in Academic Information Retrieval', 'Vector Search, RAG Pipelines, MARC21 Crosswalks & Transformer Indices', 'Dr. O. J. Fatoyinbo & Prof. S. N. Varma', 'Ph.D., Lead AI Researcher & IEEE Senior Member', 'Federal Co-operative College & Indian Institute of Technology', '', 'Dr. K. E. Okonjo', 'Computer Science', 'Computer Science', 'CSC 301', 'ND II / HND I', 'E-Library & Virtual Commons', 'Floor 1 • Aisle 3 • Shelf 02B', 'Z666.5 .F38 2026', '978-1-5090-4822-9', '10.1109/TKDE.2026.1049281', 'IEEE Computer Society Press', '2026', '1st Edition', '360', '5.5 MB', 'ai-in-academic-information-retrieval.pdf', '', '', '1', 'Open Access Full-Text', '', '10', '6', '4.9', '112', 'Dense vector retrieval, retrieval-augmented generation (RAG) for academic citations, semantic MARC/Dublin Core cross-walking, and transformer-based discovery indices.', '[]', '[{\"title\":\"Chapter 1: Lexical BM25 vs Semantic Vector Embedding Paradigms\",\"page\":1},{\"title\":\"Chapter 2: RAG Pipelines & Scholarly Citation Grounding\",\"page\":60},{\"title\":\"Chapter 3: LLM Guardrails & Hallucination Prevention in Libraries\",\"page\":140},{\"title\":\"Chapter 4: Automated Cataloging & Metadata Extraction Protocols\",\"page\":230}]', '[]', 'APA 7th', '2026-09-18 16:07:47', 'Cataloging Authority'),
  ('FCC-B006', 'Cooperative Law, Governance & Statutory Auditing in Nigeria', 'A Complete Commentary on the Nigerian Co-operative Societies Act', 'Barrister B. A. Olowookere', 'LL.M, BL, Senior Lecturer in Commercial Law', 'Federal Co-operative College, Ibadan', '', 'Hon. Justice T. M. Alabi', 'Co-operative Economics', 'Co-operative Economics & Management', 'CEM 411', 'HND II', 'Law & Administrative Library', 'Floor 2 • Aisle 5 • Shelf 14C', 'KTL982 .O46 2023', '978-978-900-112-9', '10.2139/ssrn.4298102', 'Malthouse Law Books', '2023', '5th Edition', '310', '4.8 MB', 'cooperative-law-governance-nigeria.pdf', '', '', '1', 'Open Access Full-Text', '', '14', '9', '4.7', '38', 'Comprehensive treatise on the Nigerian Co-operative Societies Act, dispute resolution arbitration, bye-law drafting, and director fiduciary duties.', '[]', '[{\"title\":\"Chapter 1: Legal Personality and Registration Formalities\",\"page\":1},{\"title\":\"Chapter 2: Bye-Law Drafting, Amendments and Enforceability\",\"page\":45},{\"title\":\"Chapter 3: Director Fiduciary Obligations and Surcharges\",\"page\":120},{\"title\":\"Chapter 4: Winding-Up and Liquidation Protocols\",\"page\":210}]', '[]', 'APA 7th', '2026-09-18 16:07:47', 'Cataloging Authority'),
  ('FCC-B007', 'Advanced Computer Networks & Cloud Infrastructure', 'Software-Defined Networking, BGP Routing & Edge Security Protocols', 'Prof. S. N. Varma & Dr. A. Bello', 'Ph.D., Senior Network Architect', 'Federal Co-operative College & Cisco Networking Academy', '', 'Engr. Dr. T. J. Adeleke', 'Computer Science', 'Computer Engineering', 'CPE 311', 'HND I', 'Faculty of Engineering Library', 'Floor 1 • Aisle 4 • Shelf 10A', 'TK5105.5 .V37 2025', '978-0-13-892100-2', '10.1109/MCOM.2025.889102', 'Pearson Higher Education', '2025', '2nd Edition', '480', '7.2 MB', 'advanced-computer-networks.pdf', '', '', '1', 'Open Access Full-Text', '', '9', '5', '4.8', '145', 'In-depth treatment of SDN controllers, OpenFlow, zero-trust network architectures, multi-tenant BGP peering, and edge computing for distributed data pipelines.', '[]', '[{\"title\":\"Chapter 1: Physical & Data Link Layer Carrier Technologies\",\"page\":1},{\"title\":\"Chapter 2: BGP Routing, Anycast & AS Topology Modeling\",\"page\":80},{\"title\":\"Chapter 3: Software-Defined Networking & OpenFlow Planes\",\"page\":180},{\"title\":\"Chapter 4: Zero-Trust Network Access (ZTNA) & Cryptographic Handshakes\",\"page\":310}]', '[]', 'APA 7th', '2026-09-18 16:07:47', 'Cataloging Authority'),
  ('FCC-B008', 'Microcontroller System Design & Embedded C Programming', 'ARM Cortex-M Hardware Timers, DMA Buffering & Real-Time Kernels', 'Engr. Dr. K. O. Adeleke', 'Ph.D., COREN Registered Engineer', 'Faculty of Engineering, FCC Ibadan', '', 'Engr. T. J. Adeleke', 'Computer Engineering', 'Computer Engineering', 'EEE 305', 'ND II', 'Faculty of Engineering Library', 'Floor 2 • Aisle 2 • Shelf 04B', 'TJ223.M53 A34 2024', '978-978-5501-99-8', '10.1007/978-3-030-98102-1', 'FCC Engineering Academic Press', '2024', '1st Edition', '390', '6.1 MB', 'microcontroller-system-design.pdf', '', '', '1', 'Open Access Full-Text', '', '10', '4', '4.8', '72', 'Practical embedded system engineering using 32-bit ARM microcontrollers, FreeRTOS scheduling, ADC direct memory access, and IoT telemetry over LoRaWAN.', '[]', '[{\"title\":\"Chapter 1: ARM Cortex-M Memory Map & Core Registers\",\"page\":1},{\"title\":\"Chapter 2: GPIO, Hardware Timers & PWM Waveform Generation\",\"page\":55},{\"title\":\"Chapter 3: Interrupt Service Routines & Direct Memory Access (DMA)\",\"page\":130},{\"title\":\"Chapter 4: FreeRTOS Real-Time Kernel Tasks & Semaphores\",\"page\":220}]', '[]', 'APA 7th', '2026-09-18 16:07:47', 'Cataloging Authority')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `subtitle` = VALUES(`subtitle`), `author` = VALUES(`author`), `author_credentials` = VALUES(`author_credentials`), `author_affiliation` = VALUES(`author_affiliation`), `orcid` = VALUES(`orcid`), `co_authors` = VALUES(`co_authors`), `subject` = VALUES(`subject`), `department` = VALUES(`department`), `course_code` = VALUES(`course_code`), `target_level` = VALUES(`target_level`), `branch` = VALUES(`branch`), `shelf_location` = VALUES(`shelf_location`), `call_number` = VALUES(`call_number`), `isbn` = VALUES(`isbn`), `doi` = VALUES(`doi`), `publisher` = VALUES(`publisher`), `year` = VALUES(`year`), `edition` = VALUES(`edition`), `pdf_pages` = VALUES(`pdf_pages`), `file_size` = VALUES(`file_size`), `file_name` = VALUES(`file_name`), `file_data_url` = VALUES(`file_data_url`), `external_url` = VALUES(`external_url`), `is_digital` = VALUES(`is_digital`), `access_level` = VALUES(`access_level`), `rights_status` = VALUES(`rights_status`), `copies_total` = VALUES(`copies_total`), `copies_available` = VALUES(`copies_available`), `rating` = VALUES(`rating`), `citations` = VALUES(`citations`), `abstract` = VALUES(`abstract`), `keywords` = VALUES(`keywords`), `chapters` = VALUES(`chapters`), `references_data` = VALUES(`references_data`), `reference_style` = VALUES(`reference_style`), `uploaded_at` = VALUES(`uploaded_at`), `uploaded_by` = VALUES(`uploaded_by`);

-- ---------------------------------------------------------
-- Table structure for `copies`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `copies` (
  `id` varchar(50) NOT NULL,
  `book_id` varchar(50) NOT NULL,
  `branch_id` varchar(50) NOT NULL DEFAULT 'BRANCH-MAIN',
  `shelf_id` varchar(50) DEFAULT NULL,
  `copy_number` int(11) NOT NULL DEFAULT 1,
  `barcode` varchar(100) NOT NULL,
  `rfid_tag` varchar(100) DEFAULT NULL,
  `accession_number` varchar(100) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Available',
  `condition` varchar(50) NOT NULL DEFAULT 'Good',
  `acquisition_cost` decimal(10,2) NOT NULL DEFAULT 0.00,
  `acquisition_date` date DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `copies_barcode_unique` (`barcode`),
  UNIQUE KEY `copies_rfid_tag_unique` (`rfid_tag`),
  UNIQUE KEY `copies_accession_number_unique` (`accession_number`),
  KEY `copies_book_id_index` (`book_id`),
  KEY `copies_status_index` (`status`),
  KEY `copies_branch_id_index` (`branch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `copies` (18 records)
INSERT INTO `copies` (`id`, `book_id`, `branch_id`, `shelf_id`, `copy_number`, `barcode`, `rfid_tag`, `accession_number`, `status`, `condition`, `acquisition_cost`, `acquisition_date`, `deleted_at`, `created_at`, `updated_at`) VALUES
  ('FCC-B001-C1', 'FCC-B001', 'BRANCH-MAIN', 'SHELF-FL1-A1', '1', 'BC-FCCB001-C1', 'RFID-BC-FCCB001-C1', 'ACC-2026-FCCB001-C1', 'Checked Out', 'Good', '15000.00', '2026-08-01', NULL, '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('FCC-B001-C2', 'FCC-B001', 'BRANCH-MAIN', 'SHELF-FL1-A1', '2', 'BC-FCCB001-C2', 'RFID-BC-FCCB001-C2', 'ACC-2026-FCCB001-C2', 'Available', 'Good', '15000.00', '2026-07-01', NULL, '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('FCC-B001-C3', 'FCC-B001', 'BRANCH-MAIN', 'SHELF-FL1-A1', '3', 'BC-FCCB001-C3', 'RFID-BC-FCCB001-C3', 'ACC-2026-FCCB001-C3', 'Available', 'Good', '15000.00', '2026-06-01', NULL, '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('FCC-B003-C1', 'FCC-B003', 'BRANCH-MAIN', 'SHELF-FL1-A2', '1', 'BC-FCCB003-C1', 'RFID-BC-FCCB003-C1', 'ACC-2026-FCCB003-C1', 'Available', 'Good', '15000.00', '2026-08-01', NULL, '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('FCC-B003-C2', 'FCC-B003', 'BRANCH-MAIN', 'SHELF-FL1-A2', '2', 'BC-FCCB003-C2', 'RFID-BC-FCCB003-C2', 'ACC-2026-FCCB003-C2', 'Available', 'Good', '15000.00', '2026-07-01', NULL, '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('FCC-B003-C3', 'FCC-B003', 'BRANCH-MAIN', 'SHELF-FL1-A2', '3', 'BC-FCCB003-C3', 'RFID-BC-FCCB003-C3', 'ACC-2026-FCCB003-C3', 'Available', 'Good', '15000.00', '2026-06-01', NULL, '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('FCC-B004-C1', 'FCC-B004', 'BRANCH-MAIN', 'SHELF-FL2-B2', '1', 'BC-FCCB004-C1', 'RFID-BC-FCCB004-C1', 'ACC-2026-FCCB004-C1', 'Checked Out', 'Good', '15000.00', '2026-08-01', NULL, '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('FCC-B004-C2', 'FCC-B004', 'BRANCH-MAIN', 'SHELF-FL2-B2', '2', 'BC-FCCB004-C2', 'RFID-BC-FCCB004-C2', 'ACC-2026-FCCB004-C2', 'Available', 'Good', '15000.00', '2026-07-01', NULL, '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('FCC-B005-C1', 'FCC-B005', 'BRANCH-ICT', 'SHELF-FL1-A1', '1', 'BC-FCCB005-C1', 'RFID-BC-FCCB005-C1', 'ACC-2026-FCCB005-C1', 'Available', 'Good', '15000.00', '2026-08-01', NULL, '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('FCC-B005-C2', 'FCC-B005', 'BRANCH-ICT', 'SHELF-FL1-A1', '2', 'BC-FCCB005-C2', 'RFID-BC-FCCB005-C2', 'ACC-2026-FCCB005-C2', 'Available', 'Good', '15000.00', '2026-07-01', NULL, '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('FCC-B005-C3', 'FCC-B005', 'BRANCH-ICT', 'SHELF-FL1-A1', '3', 'BC-FCCB005-C3', 'RFID-BC-FCCB005-C3', 'ACC-2026-FCCB005-C3', 'Available', 'Good', '15000.00', '2026-06-01', NULL, '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('FCC-B006-C1', 'FCC-B006', 'BRANCH-MAIN', 'SHELF-FL1-A2', '1', 'BC-FCCB006-C1', 'RFID-BC-FCCB006-C1', 'ACC-2026-FCCB006-C1', 'Checked Out', 'Good', '15000.00', '2026-08-01', NULL, '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('FCC-B006-C2', 'FCC-B006', 'BRANCH-MAIN', 'SHELF-FL1-A2', '2', 'BC-FCCB006-C2', 'RFID-BC-FCCB006-C2', 'ACC-2026-FCCB006-C2', 'Available', 'Good', '15000.00', '2026-07-01', NULL, '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('FCC-B006-C3', 'FCC-B006', 'BRANCH-MAIN', 'SHELF-FL1-A2', '3', 'BC-FCCB006-C3', 'RFID-BC-FCCB006-C3', 'ACC-2026-FCCB006-C3', 'Available', 'Good', '15000.00', '2026-06-01', NULL, '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('FCC-B007-C1', 'FCC-B007', 'BRANCH-MAIN', 'SHELF-FL2-B1', '1', 'BC-FCCB007-C1', 'RFID-BC-FCCB007-C1', 'ACC-2026-FCCB007-C1', 'Available', 'Good', '15000.00', '2026-08-01', NULL, '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('FCC-B007-C2', 'FCC-B007', 'BRANCH-MAIN', 'SHELF-FL2-B1', '2', 'BC-FCCB007-C2', 'RFID-BC-FCCB007-C2', 'ACC-2026-FCCB007-C2', 'Available', 'Good', '15000.00', '2026-07-01', NULL, '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('FCC-B008-C1', 'FCC-B008', 'BRANCH-MAIN', 'SHELF-FL2-B1', '1', 'BC-FCCB008-C1', 'RFID-BC-FCCB008-C1', 'ACC-2026-FCCB008-C1', 'Available', 'Good', '15000.00', '2026-08-01', NULL, '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('FCC-B008-C2', 'FCC-B008', 'BRANCH-MAIN', 'SHELF-FL2-B1', '2', 'BC-FCCB008-C2', 'RFID-BC-FCCB008-C2', 'ACC-2026-FCCB008-C2', 'Available', 'Good', '15000.00', '2026-07-01', NULL, '2026-10-15 14:55:15', '2026-10-15 14:55:15')
ON DUPLICATE KEY UPDATE `book_id` = VALUES(`book_id`), `branch_id` = VALUES(`branch_id`), `shelf_id` = VALUES(`shelf_id`), `copy_number` = VALUES(`copy_number`), `barcode` = VALUES(`barcode`), `rfid_tag` = VALUES(`rfid_tag`), `accession_number` = VALUES(`accession_number`), `status` = VALUES(`status`), `condition` = VALUES(`condition`), `acquisition_cost` = VALUES(`acquisition_cost`), `acquisition_date` = VALUES(`acquisition_date`), `deleted_at` = VALUES(`deleted_at`), `created_at` = VALUES(`created_at`), `updated_at` = VALUES(`updated_at`);

-- ---------------------------------------------------------
-- Table structure for `barcodes`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `barcodes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `barcode_value` varchar(100) NOT NULL,
  `barcode_type` varchar(50) NOT NULL DEFAULT 'Code 128',
  `entity_type` varchar(50) NOT NULL,
  `entity_id` varchar(100) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `print_count` int(11) NOT NULL DEFAULT 0,
  `last_scanned_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `barcodes_barcode_value_unique` (`barcode_value`),
  KEY `barcodes_entity_index` (`entity_type`,`entity_id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `barcodes` (18 records)
INSERT INTO `barcodes` (`id`, `barcode_value`, `barcode_type`, `entity_type`, `entity_id`, `is_active`, `print_count`, `last_scanned_at`, `created_at`, `updated_at`) VALUES
  ('1', 'BC-FCCB001-C1', 'Code 128', 'copy', 'FCC-B001-C1', '1', '1', '2026-09-10 10:30:00', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('2', 'BC-FCCB001-C2', 'Code 128', 'copy', 'FCC-B001-C2', '1', '1', '2026-09-18 12:00:00', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('3', 'BC-FCCB001-C3', 'Code 128', 'copy', 'FCC-B001-C3', '1', '1', '2026-09-18 12:00:00', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('4', 'BC-FCCB003-C1', 'Code 128', 'copy', 'FCC-B003-C1', '1', '1', '2026-09-18 12:00:00', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('5', 'BC-FCCB003-C2', 'Code 128', 'copy', 'FCC-B003-C2', '1', '1', '2026-09-18 12:00:00', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('6', 'BC-FCCB003-C3', 'Code 128', 'copy', 'FCC-B003-C3', '1', '1', '2026-09-18 12:00:00', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('7', 'BC-FCCB004-C1', 'Code 128', 'copy', 'FCC-B004-C1', '1', '1', '2026-08-20 11:00:00', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('8', 'BC-FCCB004-C2', 'Code 128', 'copy', 'FCC-B004-C2', '1', '1', '2026-09-18 12:00:00', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('9', 'BC-FCCB005-C1', 'Code 128', 'copy', 'FCC-B005-C1', '1', '1', '2026-09-18 12:00:00', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('10', 'BC-FCCB005-C2', 'Code 128', 'copy', 'FCC-B005-C2', '1', '1', '2026-09-18 12:00:00', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('11', 'BC-FCCB005-C3', 'Code 128', 'copy', 'FCC-B005-C3', '1', '1', '2026-09-18 12:00:00', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('12', 'BC-FCCB006-C1', 'Code 128', 'copy', 'FCC-B006-C1', '1', '1', '2026-09-08 10:30:00', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('13', 'BC-FCCB006-C2', 'Code 128', 'copy', 'FCC-B006-C2', '1', '1', '2026-09-18 12:00:00', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('14', 'BC-FCCB006-C3', 'Code 128', 'copy', 'FCC-B006-C3', '1', '1', '2026-09-18 12:00:00', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('15', 'BC-FCCB007-C1', 'Code 128', 'copy', 'FCC-B007-C1', '1', '1', '2026-09-18 12:00:00', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('16', 'BC-FCCB007-C2', 'Code 128', 'copy', 'FCC-B007-C2', '1', '1', '2026-09-18 12:00:00', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('17', 'BC-FCCB008-C1', 'Code 128', 'copy', 'FCC-B008-C1', '1', '1', '2026-09-18 12:00:00', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('18', 'BC-FCCB008-C2', 'Code 128', 'copy', 'FCC-B008-C2', '1', '1', '2026-09-18 12:00:00', '2026-10-15 14:55:15', '2026-10-15 14:55:15')
ON DUPLICATE KEY UPDATE `barcode_value` = VALUES(`barcode_value`), `barcode_type` = VALUES(`barcode_type`), `entity_type` = VALUES(`entity_type`), `entity_id` = VALUES(`entity_id`), `is_active` = VALUES(`is_active`), `print_count` = VALUES(`print_count`), `last_scanned_at` = VALUES(`last_scanned_at`), `created_at` = VALUES(`created_at`), `updated_at` = VALUES(`updated_at`);

-- ---------------------------------------------------------
-- Table structure for `simple_lib_authors`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `simple_lib_authors` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `nationality` varchar(255) DEFAULT NULL,
  `rating` double NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `simple_lib_authors_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `simple_lib_authors` (6 records)
INSERT INTO `simple_lib_authors` (`id`, `name`, `nationality`, `rating`, `created_at`, `updated_at`) VALUES
  ('1', 'Chinua Achebe', 'Nigerian', '4.9', '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('2', 'Wole Soyinka', 'Nigerian', '4.8', '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('3', 'Prof. A. O. Adebayo', 'Nigerian', '4.9', '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('4', 'Dr. O. J. Fatoyinbo', 'Nigerian', '4.7', '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('5', 'Stuart Russell', 'British', '4.9', '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('6', 'Andrew S. Tanenbaum', 'American', '4.8', '2026-10-15 15:20:02', '2026-10-15 15:20:02')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `nationality` = VALUES(`nationality`), `rating` = VALUES(`rating`), `created_at` = VALUES(`created_at`), `updated_at` = VALUES(`updated_at`);

-- ---------------------------------------------------------
-- Table structure for `simple_lib_books`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `simple_lib_books` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `author` varchar(255) DEFAULT NULL,
  `genre` varchar(255) DEFAULT NULL,
  `rating` double NOT NULL DEFAULT 1,
  `cover_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `simple_lib_books_title_unique` (`title`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `simple_lib_books` (8 records)
INSERT INTO `simple_lib_books` (`id`, `title`, `author`, `genre`, `rating`, `cover_url`, `created_at`, `updated_at`) VALUES
  ('1', 'Things Fall Apart', 'Chinua Achebe', 'African Literature', '4.9', 'https://covers.openlibrary.org/b/id/8231996-L.jpg', '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('2', 'The Lion and the Jewel', 'Wole Soyinka', 'African Drama', '4.8', 'https://covers.openlibrary.org/b/id/7984916-L.jpg', '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('3', 'Principles and Practice of Co-operative Economics', 'Prof. A. O. Adebayo', 'Cooperative Studies', '4.9', 'https://covers.openlibrary.org/b/id/11153224-L.jpg', '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('4', 'Artificial Intelligence in Academic Information Retrieval', 'Dr. O. J. Fatoyinbo', 'Information Technology', '4.7', 'https://covers.openlibrary.org/b/id/8572111-L.jpg', '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('5', 'Artificial Intelligence: A Modern Approach (4th Edition)', 'Stuart Russell', 'Computer Science', '4.9', 'https://covers.openlibrary.org/b/id/12843860-L.jpg', '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('6', 'Computer Networks (6th Edition)', 'Andrew S. Tanenbaum', 'Networking', '4.8', 'https://covers.openlibrary.org/b/id/9255566-L.jpg', '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('7', 'Modern Banking & Agricultural Microcredit', 'Mrs. Folake Sanusi', 'Finance', '4.6', 'https://covers.openlibrary.org/b/id/8225608-L.jpg', '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('8', 'Tropical Soil Agronomy & Cocoa Yield Enhancement', 'Dr. A. O. Olabode', 'Agriculture', '4.7', 'https://covers.openlibrary.org/b/id/10521270-L.jpg', '2026-10-15 15:20:02', '2026-10-15 15:20:02')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `author` = VALUES(`author`), `genre` = VALUES(`genre`), `rating` = VALUES(`rating`), `cover_url` = VALUES(`cover_url`), `created_at` = VALUES(`created_at`), `updated_at` = VALUES(`updated_at`);

-- ---------------------------------------------------------
-- Table structure for `resource_authors`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `resource_authors` (
  `book_id` varchar(50) NOT NULL,
  `author_id` bigint(20) unsigned NOT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'Primary Author',
  `order_index` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`book_id`,`author_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `resource_authors` (4 records)
INSERT INTO `resource_authors` (`book_id`, `author_id`, `role`, `order_index`) VALUES
  ('1', '1', 'Author', '1'),
  ('2', '2', 'Author', '1'),
  ('3', '3', 'Author', '1'),
  ('4', '4', 'Author', '1')
ON DUPLICATE KEY UPDATE `book_id` = VALUES(`book_id`), `author_id` = VALUES(`author_id`), `role` = VALUES(`role`), `order_index` = VALUES(`order_index`);

-- ---------------------------------------------------------
-- Table structure for `resource_subjects`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `resource_subjects` (
  `book_id` varchar(50) NOT NULL,
  `subject_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`book_id`,`subject_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `resource_subjects` (5 records)
INSERT INTO `resource_subjects` (`book_id`, `subject_id`) VALUES
  ('1', '1'),
  ('1', '2'),
  ('2', '2'),
  ('3', '3'),
  ('4', '4')
ON DUPLICATE KEY UPDATE `book_id` = VALUES(`book_id`), `subject_id` = VALUES(`subject_id`);

-- ---------------------------------------------------------
-- Table structure for `courses`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `courses` (
  `code` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `department` varchar(150) DEFAULT NULL,
  `faculty` varchar(150) DEFAULT NULL,
  `level` varchar(50) DEFAULT NULL,
  `semester` varchar(50) DEFAULT NULL,
  `lecturer` varchar(255) DEFAULT NULL,
  `enrolled_students` int(11) DEFAULT 0,
  `required_texts` text DEFAULT NULL,
  `recommended_texts` text DEFAULT NULL,
  `past_exams` text DEFAULT NULL,
  `lecture_packs` text DEFAULT NULL,
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `courses` (6 records)
INSERT INTO `courses` (`code`, `title`, `department`, `faculty`, `level`, `semester`, `lecturer`, `enrolled_students`, `required_texts`, `recommended_texts`, `past_exams`, `lecture_packs`) VALUES
  ('AGE 201', 'Principles of Agricultural Extension & Rural Sociology', 'Agricultural Extension & Management', 'Faculty of Agricultural Sciences', 'ND II', NULL, 'Engr. T. J. Adeleke', NULL, NULL, NULL, NULL, NULL),
  ('BNF 302', 'Agricultural Credit & Micro-Finance Banking', 'Banking & Finance', 'Faculty of Management Sciences', 'HND I', NULL, 'Chief (Mrs.) Folake Sanusi', NULL, NULL, NULL, NULL, NULL),
  ('CEM 411', 'Advanced Co-operative Management & Digital E-Commerce', 'Co-operative Economics & Management', 'Faculty of Management Sciences', 'HND II', NULL, 'Prof. A. O. Adebayo', NULL, NULL, NULL, NULL, NULL),
  ('CPE 311', 'Computer Architecture & Organization', 'Computer Engineering', 'Faculty of Engineering', 'HND I', NULL, 'Prof. S. N. Varma', NULL, NULL, NULL, NULL, NULL),
  ('CSC 301', 'Database Systems & Distributed Architectures', 'Computer Science', 'Faculty of Science & Computing', 'ND II / HND I', NULL, 'Dr. K. E. Okonjo', NULL, NULL, NULL, NULL, NULL),
  ('EEE 305', 'Digital Electronics & Embedded Microcontrollers', 'Computer Engineering', 'Faculty of Engineering', 'ND II', NULL, 'Engr. Dr. T. J. Adeleke', NULL, NULL, NULL, NULL, NULL)
ON DUPLICATE KEY UPDATE `code` = VALUES(`code`), `title` = VALUES(`title`), `department` = VALUES(`department`), `faculty` = VALUES(`faculty`), `level` = VALUES(`level`), `semester` = VALUES(`semester`), `lecturer` = VALUES(`lecturer`), `enrolled_students` = VALUES(`enrolled_students`), `required_texts` = VALUES(`required_texts`), `recommended_texts` = VALUES(`recommended_texts`), `past_exams` = VALUES(`past_exams`), `lecture_packs` = VALUES(`lecture_packs`);

-- ---------------------------------------------------------
-- Table structure for `course_reserves`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `course_reserves` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `department_code` varchar(50) NOT NULL,
  `department_name` varchar(255) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `author` varchar(255) DEFAULT NULL,
  `reserved_for` varchar(50) DEFAULT NULL,
  `shelf` varchar(100) NOT NULL DEFAULT 'Reserve Desk Bay 1',
  `duration` varchar(100) NOT NULL DEFAULT '2 Hours In-Library Reading Only',
  `copies` int(11) NOT NULL DEFAULT 3,
  `status` varchar(50) NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `course_reserves_department_code_index` (`department_code`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `course_reserves` (6 records)
INSERT INTO `course_reserves` (`id`, `department_code`, `department_name`, `title`, `author`, `reserved_for`, `shelf`, `duration`, `copies`, `status`, `created_at`, `updated_at`) VALUES
  ('1', 'CEM', 'Co-operative Economics & Management', 'Principles and Practice of Co-operative Economics (2026 Edition)', 'Prof. A. O. Adebayo', 'CEM 411 - Co-op Econometrics', 'Reserve Desk • Shelf R1', '2 Hours In-Library', '5', 'Active', '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('2', 'CSC', 'Computer Science & Information Technology', 'Artificial Intelligence: A Modern Approach', 'Stuart Russell & Peter Norvig', 'CSC 301 - Core Artificial Intelligence', 'Reserve Desk • Shelf R2', '3 Hours In-Library', '4', 'Active', '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('3', 'BNF', 'Banking & Finance', 'Modern Banking & Agricultural Microcredit', 'Mrs. Folake Sanusi', 'BNF 312 - Financial Institutions', 'Reserve Desk • Shelf R3', '2 Hours In-Library', '6', 'Active', '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('4', 'AGR', 'Agricultural Extension & Management', 'Tropical Soil Agronomy & Cocoa Yield Enhancement', 'Dr. A. O. Olabode', 'AGR 211 - Soil Dynamics', 'Reserve Desk • Shelf R4', 'Overnight Loan', '4', 'Active', '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('5', 'BAM', 'Business Administration & Management', 'Strategic Management & Organizational Leadership', 'Dr. T. M. Adewale', 'BAM 320 - Corporate Governance', 'Reserve Desk • Shelf R5', '2 Hours In-Library', '5', 'Active', '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('6', 'PAD', 'Public Administration', 'Public Policy Analysis & Bureaucracy in Nigeria', 'Dr. S. A. Gbadamosi', 'PAD 201 - Public Bureaucracy', 'Reserve Desk • Shelf R6', '2 Hours In-Library', '5', 'Active', '2026-10-15 15:20:02', '2026-10-15 15:20:02')
ON DUPLICATE KEY UPDATE `department_code` = VALUES(`department_code`), `department_name` = VALUES(`department_name`), `title` = VALUES(`title`), `author` = VALUES(`author`), `reserved_for` = VALUES(`reserved_for`), `shelf` = VALUES(`shelf`), `duration` = VALUES(`duration`), `copies` = VALUES(`copies`), `status` = VALUES(`status`), `created_at` = VALUES(`created_at`), `updated_at` = VALUES(`updated_at`);

-- ---------------------------------------------------------
-- Table structure for `patrons`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `patrons` (
  `id` varchar(50) NOT NULL,
  `matric` varchar(100) NOT NULL,
  `library_id` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'student',
  `category` varchar(100) DEFAULT NULL,
  `department` varchar(150) DEFAULT NULL,
  `faculty` varchar(150) DEFAULT NULL,
  `level` varchar(50) DEFAULT NULL,
  `programme` varchar(100) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `pin` varchar(10) NOT NULL DEFAULT '1234',
  `pin_created_at` timestamp NULL DEFAULT current_timestamp(),
  `status` varchar(50) NOT NULL DEFAULT 'Active',
  `borrow_quota` int(11) NOT NULL DEFAULT 5,
  `active_loans_count` int(11) NOT NULL DEFAULT 0,
  `overdue_count` int(11) NOT NULL DEFAULT 0,
  `outstanding_fines` decimal(10,2) NOT NULL DEFAULT 0.00,
  `clearance_status` varchar(100) NOT NULL DEFAULT 'Active Student',
  `registered_branch` varchar(255) DEFAULT NULL,
  `valid_until` date DEFAULT NULL,
  `photo_url` text DEFAULT NULL,
  `research_interests` text DEFAULT NULL,
  `orcid` varchar(50) DEFAULT NULL,
  `profile_completion` int(11) NOT NULL DEFAULT 90,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `patrons_matric_unique` (`matric`),
  UNIQUE KEY `patrons_library_id_unique` (`library_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `patrons` (23 records)
INSERT INTO `patrons` (`id`, `matric`, `library_id`, `name`, `role`, `category`, `department`, `faculty`, `level`, `programme`, `email`, `phone`, `pin`, `pin_created_at`, `status`, `borrow_quota`, `active_loans_count`, `overdue_count`, `outstanding_fines`, `clearance_status`, `registered_branch`, `valid_until`, `photo_url`, `research_interests`, `orcid`, `profile_completion`, `created_at`) VALUES
  ('PAT-001', 'FCC/CEM/2024/042', 'FCC-STU-CEM-24042', 'Wale Olonade', 'student', 'Undergraduate Scholar', 'Co-operative Economics & Management', 'School of Cooperative & Management Studies', 'HND II', 'Higher National Diploma', 'wale.olonade@fccibadan.edu.ng', '+234 803 111 2233', '1234', '2026-09-01 12:00:00', 'Active', '5', '1', '0', '0.00', 'Pending Library Signature', 'Main Campus Library', '2027-11-30', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80', '[\"Cooperative Fintech\",\"Smallholder Agronomy\",\"Micro-Credit Syndicates\"]', '0009-0004-8192-4410', '92', '2026-09-18 18:07:47'),
  ('PAT-002', 'FCC/CEM/2024/011', 'FCC-STU-CEM-24011', 'Ibrahim Adekunle', 'student', 'Undergraduate Scholar', 'Co-operative Economics & Management', 'School of Cooperative & Management Studies', 'HND II', 'Higher National Diploma', 'adekunle.ibrahim@fccibadan.edu.ng', '+234 802 334 5566', '1234', '2026-09-01 12:00:00', 'Active', '5', '1', '1', '300.00', 'Fines Pending Clearance', 'Main Campus Library', '2027-11-30', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80', '[\"Agricultural Credit\",\"Rural Cooperatives\"]', '0009-0002-1192-3321', '85', '2026-09-18 18:07:47'),
  ('PAT-003', 'FCC/CSC/2024/108', 'FCC-STU-CSC-24108', 'Chukwudi Okafor', 'student', 'Undergraduate Scholar', 'Computer Science & Information Technology', 'School of Applied Sciences & Computing', 'HND I', 'National Diploma', 'okafor.chukwudi@fccibadan.edu.ng', '+234 803 445 6677', '1234', '2026-09-02 13:00:00', 'Active', '5', '1', '0', '0.00', 'Active Student', 'E-Library & Virtual Commons', '2027-08-31', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80', '[\"Distributed Systems\",\"Database Optimization\",\"AI Search\"]', '0009-0008-3341-9012', '95', '2026-09-18 18:07:47'),
  ('PAT-004', 'FCC/BNF/2024/077', 'FCC-STU-BNF-24077', 'Amina Bello', 'student', 'Undergraduate Scholar', 'Banking & Finance', 'School of Financial & Economic Sciences', 'HND II', 'Higher National Diploma', 'amina.bello@fccibadan.edu.ng', '+234 809 112 2334', '1234', '2026-09-03 11:30:00', 'Active', '5', '0', '0', '0.00', 'Active Student', 'Main Campus Library', '2028-06-30', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80', '[\"Microfinance Risk\",\"Fintech Innovations\"]', '0009-0001-4455-7788', '88', '2026-09-18 18:07:47'),
  ('PAT-AGR-001', 'FCC/AGR/2026/012', 'FCC-STU-AGR-26012', 'Adeleke Sunday Peter', 'student', 'Undergraduate', 'Agricultural Extension & Management', 'School of Agriculture & Natural Resources', 'ND II', 'National Diploma', 'sunday.adeleke@fccibadan.edu.ng', '+234 803 221 4455', '1234', '2026-10-15 14:50:02', 'Active', '5', '0', '0', '0.00', 'Active Student', 'Main Campus Library', '2026-12-31', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', NULL, NULL, '95', '2026-10-15 14:50:02'),
  ('PAT-AGR-002', 'FCC/AGR/2026/045', 'FCC-STU-AGR-26045', 'Ojo Mercy Titilayo', 'student', 'Undergraduate', 'Agricultural Extension & Management', 'School of Agriculture & Natural Resources', 'ND I', 'National Diploma', 'mercy.ojo@fccibadan.edu.ng', '+234 805 332 5566', '1234', '2026-10-15 14:50:02', 'Active', '5', '0', '0', '0.00', 'Active Student', 'Main Campus Library', '2026-12-31', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', NULL, NULL, '95', '2026-10-15 14:50:02'),
  ('PAT-AGR-003', 'FCC/AGR/2026/089', 'FCC-STU-AGR-26089', 'Balogun Idris Kayode', 'student', 'Undergraduate', 'Agricultural Extension & Management', 'School of Agriculture & Natural Resources', 'HND I', 'Higher National Diploma', 'idris.balogun@fccibadan.edu.ng', '+234 807 443 6677', '1234', '2026-10-15 14:50:03', 'Active', '5', '0', '0', '0.00', 'Active Student', 'Main Campus Library', '2026-12-31', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', NULL, NULL, '95', '2026-10-15 14:50:03'),
  ('PAT-BAM-001', 'FCC/BAM/2026/018', 'FCC-STU-BAM-26018', 'Lawal Oluwaseun David', 'student', 'Undergraduate', 'Business Administration & Management', 'School of Cooperative & Management Studies', 'HND II', 'Higher National Diploma', 'seun.lawal@fccibadan.edu.ng', '+234 802 889 0011', '1234', '2026-10-15 14:50:03', 'Active', '5', '0', '0', '0.00', 'Active Student', 'Main Campus Library', '2026-12-31', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', NULL, NULL, '95', '2026-10-15 14:50:03'),
  ('PAT-BAM-002', 'FCC/BAM/2026/067', 'FCC-STU-BAM-26067', 'Ajayi Victoria Folake', 'student', 'Undergraduate', 'Business Administration & Management', 'School of Cooperative & Management Studies', 'ND II', 'National Diploma', 'victoria.ajayi@fccibadan.edu.ng', '+234 806 990 2233', '1234', '2026-10-15 14:50:04', 'Active', '5', '0', '0', '0.00', 'Active Student', 'Main Campus Library', '2026-12-31', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', NULL, NULL, '95', '2026-10-15 14:50:04'),
  ('PAT-BAM-003', 'FCC/BAM/2026/112', 'FCC-STU-BAM-26112', 'Yusuf Ibrahim Opeyemi', 'student', 'Undergraduate', 'Business Administration & Management', 'School of Cooperative & Management Studies', 'ND I', 'National Diploma', 'ibrahim.yusuf@fccibadan.edu.ng', '+234 808 112 3344', '1234', '2026-10-15 14:50:04', 'Active', '5', '0', '0', '0.00', 'Active Student', 'Main Campus Library', '2026-12-31', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', NULL, NULL, '95', '2026-10-15 14:50:04'),
  ('PAT-BNF-002', 'FCC/BNF/2026/023', 'FCC-STU-BNF-26023', 'Oladipo Samuel Kunle', 'student', 'Undergraduate', 'Banking & Finance', 'School of Financial & Economic Sciences', 'ND II', 'National Diploma', 'kunle.oladipo@fccibadan.edu.ng', '+234 802 556 7788', '1234', '2026-10-15 14:50:01', 'Active', '5', '0', '0', '0.00', 'Active Student', 'Main Campus Library', '2026-12-31', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', NULL, NULL, '95', '2026-10-15 14:50:01'),
  ('PAT-BNF-003', 'FCC/BNF/2026/054', 'FCC-STU-BNF-26054', 'Bello Zainab Morayo', 'student', 'Undergraduate', 'Banking & Finance', 'School of Financial & Economic Sciences', 'ND I', 'National Diploma', 'zainab.bello@fccibadan.edu.ng', '+234 803 778 8899', '1234', '2026-10-15 14:50:02', 'Active', '5', '0', '0', '0.00', 'Active Student', 'Main Campus Library', '2026-12-31', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', NULL, NULL, '95', '2026-10-15 14:50:02'),
  ('PAT-CEM-003', 'FCC/CEM/2026/101', 'FCC-STU-CEM-26101', 'Adebisi Taiwo Mary', 'student', 'Undergraduate', 'Co-operative Economics & Management', 'School of Cooperative & Management Studies', 'ND I', 'National Diploma', 'taiwo.adebisi@fccibadan.edu.ng', '+234 805 443 2211', '1234', '2026-10-15 14:49:59', 'Active', '5', '0', '0', '0.00', 'Active Student', 'Main Campus Library', '2026-12-31', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', NULL, NULL, '95', '2026-10-15 14:49:59'),
  ('PAT-CEM-004', 'FCC/CEM/2026/102', 'FCC-STU-CEM-26102', 'Kareem Kehinde Joseph', 'student', 'Undergraduate', 'Co-operative Economics & Management', 'School of Cooperative & Management Studies', 'ND I', 'National Diploma', 'kehinde.kareem@fccibadan.edu.ng', '+234 807 665 4433', '1234', '2026-10-15 14:49:59', 'Active', '5', '0', '0', '0.00', 'Active Student', 'Main Campus Library', '2026-12-31', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', NULL, NULL, '95', '2026-10-15 14:49:59'),
  ('PAT-CSC-001', 'FCC/CSC/2026/409', 'FCC-STU-CSC-26409', 'OLAWALE AKEEM OLONADE', 'student', 'Undergraduate', 'Computer Science & Information Technology', 'School of Applied Sciences & Computing', 'HND II', 'Higher National Diploma', 'olonade.akeem@fccibadan.edu.ng', '+234 806 778 9900', '1234', '2026-10-15 14:49:59', 'Active', '5', '0', '0', '0.00', 'Active Student', 'Main Campus Library', '2026-12-31', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', NULL, NULL, '95', '2026-10-15 14:49:59'),
  ('PAT-CSC-002', 'FCC/CSC/2026/888', 'FCC-STU-CSC-26888', 'Fasasi Rasheed Alade', 'student', 'Undergraduate', 'Computer Science & Information Technology', 'School of Applied Sciences & Computing', 'ND II', 'National Diploma', 'fasasi.rasheed@fccibadan.edu.ng', '+234 808 990 1122', '1234', '2026-10-15 14:50:00', 'Active', '5', '0', '0', '0.00', 'Active Student', 'Main Campus Library', '2026-12-31', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', NULL, NULL, '95', '2026-10-15 14:50:00'),
  ('PAT-CSC-004', 'FCC/CSC/2026/115', 'FCC-STU-CSC-26115', 'Alabi Deborah Funke', 'student', 'Undergraduate', 'Computer Science & Information Technology', 'School of Applied Sciences & Computing', 'ND I', 'National Diploma', 'alabi.deborah@fccibadan.edu.ng', '+234 805 667 8899', '1234', '2026-10-15 14:50:01', 'Active', '5', '0', '0', '0.00', 'Active Student', 'Main Campus Library', '2026-12-31', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', NULL, NULL, '95', '2026-10-15 14:50:01'),
  ('PAT-MKT-001', 'FCC/MKT/2026/015', 'FCC-STU-MKT-26015', 'Sanusi Babatunde Ahmed', 'student', 'Undergraduate', 'Marketing & Consumer Studies', 'School of Business & Financial Management', 'HND I', 'Higher National Diploma', 'babatunde.sanusi@fccibadan.edu.ng', '+234 802 334 4455', '1234', '2026-10-15 14:50:06', 'Active', '5', '0', '0', '0.00', 'Active Student', 'Main Campus Library', '2026-12-31', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', NULL, NULL, '95', '2026-10-15 14:50:06'),
  ('PAT-MKT-002', 'FCC/MKT/2026/044', 'FCC-STU-MKT-26044', 'Adegoke Blessing Funmilayo', 'student', 'Undergraduate', 'Marketing & Consumer Studies', 'School of Business & Financial Management', 'ND II', 'National Diploma', 'blessing.adegoke@fccibadan.edu.ng', '+234 806 445 5566', '1234', '2026-10-15 14:50:06', 'Active', '5', '0', '0', '0.00', 'Active Student', 'Main Campus Library', '2026-12-31', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', NULL, NULL, '95', '2026-10-15 14:50:06'),
  ('PAT-MKT-003', 'FCC/MKT/2026/082', 'FCC-STU-MKT-26082', 'Popoola Victor Damilola', 'student', 'Undergraduate', 'Marketing & Consumer Studies', 'School of Business & Financial Management', 'ND I', 'National Diploma', 'victor.popoola@fccibadan.edu.ng', '+234 808 556 6677', '1234', '2026-10-15 14:50:06', 'Active', '5', '0', '0', '0.00', 'Active Student', 'Main Campus Library', '2026-12-31', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', NULL, NULL, '95', '2026-10-15 14:50:06'),
  ('PAT-PAD-001', 'FCC/PAD/2026/009', 'FCC-STU-PAD-26009', 'Adeleke Rashidat Folashade', 'student', 'Undergraduate', 'Public Administration', 'School of Public Administration', 'HND II', 'Higher National Diploma', 'rashidat.adeleke@fccibadan.edu.ng', '+234 803 556 7788', '1234', '2026-10-15 14:50:04', 'Active', '5', '0', '0', '0.00', 'Active Student', 'Main Campus Library', '2026-12-31', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', NULL, NULL, '95', '2026-10-15 14:50:04'),
  ('PAT-PAD-002', 'FCC/PAD/2026/033', 'FCC-STU-PAD-26033', 'Okonjo Chioma Grace', 'student', 'Undergraduate', 'Public Administration', 'School of Public Administration', 'ND II', 'National Diploma', 'chioma.okonjo@fccibadan.edu.ng', '+234 805 778 9900', '1234', '2026-10-15 14:50:05', 'Active', '5', '0', '0', '0.00', 'Active Student', 'Main Campus Library', '2026-12-31', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', NULL, NULL, '95', '2026-10-15 14:50:05'),
  ('PAT-PAD-003', 'FCC/PAD/2026/071', 'FCC-STU-PAD-26071', 'Gbadamosi Lateef Ayomide', 'student', 'Undergraduate', 'Public Administration', 'School of Public Administration', 'ND I', 'National Diploma', 'lateef.gbadamosi@fccibadan.edu.ng', '+234 807 889 0011', '1234', '2026-10-15 14:50:05', 'Active', '5', '0', '0', '0.00', 'Active Student', 'Main Campus Library', '2026-12-31', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', NULL, NULL, '95', '2026-10-15 14:50:05')
ON DUPLICATE KEY UPDATE `matric` = VALUES(`matric`), `library_id` = VALUES(`library_id`), `name` = VALUES(`name`), `role` = VALUES(`role`), `category` = VALUES(`category`), `department` = VALUES(`department`), `faculty` = VALUES(`faculty`), `level` = VALUES(`level`), `programme` = VALUES(`programme`), `email` = VALUES(`email`), `phone` = VALUES(`phone`), `pin` = VALUES(`pin`), `pin_created_at` = VALUES(`pin_created_at`), `status` = VALUES(`status`), `borrow_quota` = VALUES(`borrow_quota`), `active_loans_count` = VALUES(`active_loans_count`), `overdue_count` = VALUES(`overdue_count`), `outstanding_fines` = VALUES(`outstanding_fines`), `clearance_status` = VALUES(`clearance_status`), `registered_branch` = VALUES(`registered_branch`), `valid_until` = VALUES(`valid_until`), `photo_url` = VALUES(`photo_url`), `research_interests` = VALUES(`research_interests`), `orcid` = VALUES(`orcid`), `profile_completion` = VALUES(`profile_completion`), `created_at` = VALUES(`created_at`);

-- ---------------------------------------------------------
-- Table structure for `patron_policies`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `patron_policies` (
  `role` varchar(50) NOT NULL,
  `max_borrow_limit` int(11) NOT NULL,
  `loan_duration_days` int(11) NOT NULL,
  `daily_fine_rate` decimal(10,2) NOT NULL,
  `reserve_limit` int(11) NOT NULL,
  `digital_access_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `study_room_quota_hours` int(11) NOT NULL DEFAULT 4,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `patron_policies` (4 records)
INSERT INTO `patron_policies` (`role`, `max_borrow_limit`, `loan_duration_days`, `daily_fine_rate`, `reserve_limit`, `digital_access_enabled`, `study_room_quota_hours`, `updated_at`) VALUES
  ('guest', '2', '7', '200.00', '1', '1', '4', '2026-10-15 14:55:15'),
  ('lecturer', '12', '60', '100.00', '10', '1', '4', '2026-10-15 14:55:15'),
  ('researcher', '15', '90', '100.00', '10', '1', '4', '2026-10-15 14:55:15'),
  ('student', '5', '14', '100.00', '3', '1', '4', '2026-10-15 14:55:15')
ON DUPLICATE KEY UPDATE `role` = VALUES(`role`), `max_borrow_limit` = VALUES(`max_borrow_limit`), `loan_duration_days` = VALUES(`loan_duration_days`), `daily_fine_rate` = VALUES(`daily_fine_rate`), `reserve_limit` = VALUES(`reserve_limit`), `digital_access_enabled` = VALUES(`digital_access_enabled`), `study_room_quota_hours` = VALUES(`study_room_quota_hours`), `updated_at` = VALUES(`updated_at`);

-- ---------------------------------------------------------
-- Table structure for `loans`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `loans` (
  `id` varchar(50) NOT NULL,
  `matric` varchar(100) NOT NULL,
  `patron_name` varchar(255) NOT NULL,
  `book_id` varchar(50) NOT NULL,
  `book_title` varchar(500) NOT NULL,
  `author` varchar(255) DEFAULT NULL,
  `call_number` varchar(100) DEFAULT NULL,
  `branch` varchar(255) DEFAULT NULL,
  `borrow_date` date NOT NULL,
  `due_date` date NOT NULL,
  `return_date` date DEFAULT NULL,
  `renewal_count` int(11) NOT NULL DEFAULT 0,
  `status` varchar(50) NOT NULL DEFAULT 'Active',
  `fine_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `rfid_tag` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `loans_matric_index` (`matric`),
  KEY `loans_book_id_index` (`book_id`),
  KEY `loans_status_index` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `loans` (3 records)
INSERT INTO `loans` (`id`, `matric`, `patron_name`, `book_id`, `book_title`, `author`, `call_number`, `branch`, `borrow_date`, `due_date`, `return_date`, `renewal_count`, `status`, `fine_amount`, `rfid_tag`) VALUES
  ('LN-9820', 'FCC/CEM/2024/011', 'Ibrahim Adekunle', 'FCC-B004', 'Cocoa Agronomy & Smallholder Value-Chain Mechanics', 'Engr. T. J. Adeleke', 'SB267 .A43 2024', 'Main Campus Library (Prof. Hezekiah Complex)', '2026-08-20', '2026-09-03', NULL, '0', 'Overdue', '300.00', 'FCC-CP-00401'),
  ('LN-9821', 'FCC/CEM/2024/042', 'Wale Olonade', 'FCC-B001', 'Principles and Practice of Co-operative Economics', 'Prof. A. O. Adebayo', 'HD2963 .A34 2024', 'Main Campus Library (Prof. Hezekiah Complex)', '2026-09-10', '2026-09-24', NULL, '0', 'Active', '0.00', 'FCC-CP-00102'),
  ('LN-9822', 'FCC/CEM/2024/042', 'Wale Olonade', 'FCC-B006', 'Cooperative Law, Governance & Statutory Auditing in Nigeria', 'Barrister B. A. Olowookere', 'KTL982 .O46 2023', 'Law & Administrative Library', '2026-09-08', '2026-09-22', NULL, '0', 'Active', '0.00', 'FCC-CP-00601')
ON DUPLICATE KEY UPDATE `matric` = VALUES(`matric`), `patron_name` = VALUES(`patron_name`), `book_id` = VALUES(`book_id`), `book_title` = VALUES(`book_title`), `author` = VALUES(`author`), `call_number` = VALUES(`call_number`), `branch` = VALUES(`branch`), `borrow_date` = VALUES(`borrow_date`), `due_date` = VALUES(`due_date`), `return_date` = VALUES(`return_date`), `renewal_count` = VALUES(`renewal_count`), `status` = VALUES(`status`), `fine_amount` = VALUES(`fine_amount`), `rfid_tag` = VALUES(`rfid_tag`);

-- ---------------------------------------------------------
-- Table structure for `reservations`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reservations` (
  `id` varchar(50) NOT NULL,
  `matric` varchar(100) NOT NULL,
  `patron_name` varchar(255) NOT NULL,
  `book_id` varchar(50) NOT NULL,
  `book_title` varchar(500) NOT NULL,
  `call_number` varchar(100) DEFAULT NULL,
  `reserved_date` date NOT NULL,
  `expiry_date` date NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Pending',
  `pickup_branch` varchar(255) DEFAULT NULL,
  `queue_position` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `reservations` (1 records)
INSERT INTO `reservations` (`id`, `matric`, `patron_name`, `book_id`, `book_title`, `call_number`, `reserved_date`, `expiry_date`, `status`, `pickup_branch`, `queue_position`) VALUES
  ('RES-2026-01', 'FCC/CEM/2024/042', 'Scholar', 'FCC-B004', 'Cocoa Agronomy & Smallholder Value-Chain Mechanics', '', '2026-09-14', '2026-09-22', 'Available', 'Main Campus Library • Circulation Desk Bay 2', '1')
ON DUPLICATE KEY UPDATE `matric` = VALUES(`matric`), `patron_name` = VALUES(`patron_name`), `book_id` = VALUES(`book_id`), `book_title` = VALUES(`book_title`), `call_number` = VALUES(`call_number`), `reserved_date` = VALUES(`reserved_date`), `expiry_date` = VALUES(`expiry_date`), `status` = VALUES(`status`), `pickup_branch` = VALUES(`pickup_branch`), `queue_position` = VALUES(`queue_position`);

-- ---------------------------------------------------------
-- Table structure for `fines`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `fines` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `loan_id` varchar(50) DEFAULT NULL,
  `patron_matric` varchar(100) NOT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `balance_remaining` decimal(10,2) NOT NULL DEFAULT 0.00,
  `reason` varchar(255) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Unpaid',
  `waived_by` varchar(255) DEFAULT NULL,
  `waived_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fines_patron_matric_index` (`patron_matric`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `fines` (3 records)
INSERT INTO `fines` (`id`, `loan_id`, `patron_matric`, `amount`, `balance_remaining`, `reason`, `status`, `waived_by`, `waived_at`, `created_at`, `updated_at`) VALUES
  ('1', 'LN-2026-001', 'FCC/CEM/2024/042', '150.00', '0.00', 'Overdue Return: 3 Days Demurrage (HD2951 .A34)', 'Paid', NULL, NULL, '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('2', 'LN-2026-004', 'FCC/CSC/2024/115', '100.00', '0.00', 'Overdue Return: 2 Days Demurrage (QA76.9 .F38)', 'Paid', NULL, NULL, '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('3', NULL, 'FCC/BNF/2024/088', '250.00', '250.00', 'Late Return of Reserved Overnight Compendium', 'Unpaid', NULL, NULL, '2026-10-15 15:20:02', '2026-10-15 15:20:02')
ON DUPLICATE KEY UPDATE `loan_id` = VALUES(`loan_id`), `patron_matric` = VALUES(`patron_matric`), `amount` = VALUES(`amount`), `balance_remaining` = VALUES(`balance_remaining`), `reason` = VALUES(`reason`), `status` = VALUES(`status`), `waived_by` = VALUES(`waived_by`), `waived_at` = VALUES(`waived_at`), `created_at` = VALUES(`created_at`), `updated_at` = VALUES(`updated_at`);

-- ---------------------------------------------------------
-- Table structure for `payments`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `fine_id` bigint(20) unsigned DEFAULT NULL,
  `patron_matric` varchar(100) NOT NULL,
  `amount_paid` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) NOT NULL DEFAULT 'Card',
  `transaction_reference` varchar(150) NOT NULL,
  `received_by` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `payments_transaction_reference_unique` (`transaction_reference`),
  KEY `fine_id` (`fine_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`fine_id`) REFERENCES `fines` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `payments` (2 records)
INSERT INTO `payments` (`id`, `fine_id`, `patron_matric`, `amount_paid`, `payment_method`, `transaction_reference`, `received_by`, `created_at`, `updated_at`) VALUES
  ('1', '1', 'FCC/CEM/2024/042', '150.00', 'POS', 'POS-2026-0928-8821', 'Circulation Clerk (Mrs. M. K. Bello)', '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('2', '2', 'FCC/CSC/2024/115', '100.00', 'Remita', 'REM-2026-1002-4419', 'Automated Remita Gateway', '2026-10-15 15:20:02', '2026-10-15 15:20:02')
ON DUPLICATE KEY UPDATE `fine_id` = VALUES(`fine_id`), `patron_matric` = VALUES(`patron_matric`), `amount_paid` = VALUES(`amount_paid`), `payment_method` = VALUES(`payment_method`), `transaction_reference` = VALUES(`transaction_reference`), `received_by` = VALUES(`received_by`), `created_at` = VALUES(`created_at`), `updated_at` = VALUES(`updated_at`);

-- ---------------------------------------------------------
-- Table structure for `digital_resources`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `digital_resources` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `book_id` varchar(50) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` varchar(50) DEFAULT NULL,
  `mime_type` varchar(100) NOT NULL DEFAULT 'application/pdf',
  `access_rights` varchar(100) NOT NULL DEFAULT 'Campus Community',
  `download_count` int(11) NOT NULL DEFAULT 0,
  `view_count` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `digital_resources` (5 records)
INSERT INTO `digital_resources` (`id`, `book_id`, `file_path`, `file_size`, `mime_type`, `access_rights`, `download_count`, `view_count`, `created_at`, `updated_at`) VALUES
  ('1', 'FCC-B001', '/storage/curriculum/coop_econ_principles_adebayo.pdf', '8.4 MB', 'application/pdf', 'Public Campus Wide', '342', '1250', '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('2', 'FCC-B002', '/storage/curriculum/ai_academic_retrieval_fatoyinbo.pdf', '6.1 MB', 'application/pdf', 'Public Campus Wide', '418', '1890', '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('3', 'FCC-B003', '/storage/curriculum/modern_banking_sanusi.pdf', '5.2 MB', 'application/pdf', 'Public Campus Wide', '210', '890', '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('4', 'FCC-B004', '/storage/curriculum/tropical_agronomy_olabode.pdf', '12.0 MB', 'application/pdf', 'Public Campus Wide', '185', '740', '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('5', 'FCC-B005', '/storage/curriculum/strategic_mgmt_adewale.pdf', '7.8 MB', 'application/pdf', 'Public Campus Wide', '260', '1120', '2026-10-15 15:20:02', '2026-10-15 15:20:02')
ON DUPLICATE KEY UPDATE `book_id` = VALUES(`book_id`), `file_path` = VALUES(`file_path`), `file_size` = VALUES(`file_size`), `mime_type` = VALUES(`mime_type`), `access_rights` = VALUES(`access_rights`), `download_count` = VALUES(`download_count`), `view_count` = VALUES(`view_count`), `created_at` = VALUES(`created_at`), `updated_at` = VALUES(`updated_at`);

-- ---------------------------------------------------------
-- Table structure for `theses`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `theses` (
  `id` varchar(50) NOT NULL,
  `title` varchar(500) NOT NULL,
  `author` varchar(255) NOT NULL,
  `matric` varchar(100) NOT NULL,
  `year` int(11) NOT NULL,
  `advisor` varchar(255) DEFAULT NULL,
  `department` varchar(150) DEFAULT NULL,
  `faculty` varchar(150) DEFAULT NULL,
  `degree` varchar(100) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Published',
  `access` varchar(100) NOT NULL DEFAULT 'Open Access Full-Text',
  `downloads` int(11) NOT NULL DEFAULT 0,
  `citations` int(11) NOT NULL DEFAULT 0,
  `doi` varchar(100) DEFAULT NULL,
  `file_size` varchar(50) DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `abstract` text DEFAULT NULL,
  `submitted_at` datetime DEFAULT current_timestamp(),
  `department_code` varchar(255) DEFAULT NULL,
  `revision_note` text DEFAULT NULL,
  `reviewed_by` varchar(255) DEFAULT NULL,
  `reviewed_at` varchar(255) DEFAULT NULL,
  `file_data_url` longtext DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `theses` (4 records)
INSERT INTO `theses` (`id`, `title`, `author`, `matric`, `year`, `advisor`, `department`, `faculty`, `degree`, `status`, `access`, `downloads`, `citations`, `doi`, `file_size`, `file_name`, `abstract`, `submitted_at`, `department_code`, `revision_note`, `reviewed_by`, `reviewed_at`, `file_data_url`) VALUES
  ('TH-2024-088', 'Design of a Decentralized Crop Storage Verification Protocol Using Hedera Hashgraph', 'Nnamdi, Grace C.', 'FCC/CSC/2023/088', '2024', 'Dr. K. Okonjo', 'Computer Science', 'Faculty of Science & Computing', 'Postgraduate Diploma Project', 'Published', 'Campus Intranet Only', '189', '8', '10.5281/zenodo.9482012', '4.6 MB', 'nnamdi_grace_2024_project.pdf', 'Architects a zero-knowledge cryptographic warehouse receipt verification model for post-harvest grain silos, reducing collateral verification latency from 7 days to sub-second blockchain settlement.', '2026-09-18 16:07:47', NULL, NULL, NULL, NULL, NULL),
  ('TH-2024-104', 'Comparative Liquidity Stress Testing of Cooperative Apexes Post-CBN Monetary Edicts', 'Jimoh, Ridwan A.', 'FCC/BNF/2023/104', '2024', 'Chief (Mrs.) Folake Sanusi', 'Banking & Finance', 'Faculty of Management Sciences', 'Higher National Diploma Dissertation', 'Published', 'Open Access Full-Text', '412', '21', '10.5281/zenodo.9984120', '6.2 MB', 'jimoh_ridwan_2024_thesis.pdf', 'Quantitative stress modeling examining reserve ratios and cash asset drawdowns across five major cooperative federations during cash restriction cycles.', '2026-09-18 16:07:47', NULL, NULL, NULL, NULL, NULL),
  ('TH-2025-019', 'Impact of Micro-Credit Cooperatives on Cocoa Smallholders in Ondo & Oyo States', 'Adebayo, Samuel T.', 'FCC/CEM/2023/019', '2025', 'Prof. O. Alabi', 'Co-operative Economics & Management', 'Faculty of Management Sciences', 'Higher National Diploma Dissertation', 'Published', 'Open Access Full-Text', '342', '14', '10.5281/zenodo.10842911', '5.1 MB', 'adebayo_samuel_2025_dissertation.pdf', 'Empirical field survey of 420 smallholder farming families across Idanre and Iddo Local Government Areas. Findings demonstrate a 34% income stabilization effect attributable to prompt seasonal micro-credit disbursement from cooperative apex unions.', '2026-09-18 16:07:47', NULL, NULL, NULL, NULL, NULL),
  ('TH-2026-042', 'Algorithmic Risk Syndication & Apex Liquidity Buffering in Nigerian Agri-Cooperatives', 'Wale Olonade', 'FCC/CEM/2024/042', '2026', 'Prof. A. O. Adebayo', 'Co-operative Economics & Management', 'Faculty of Management Sciences', 'Higher National Diploma Dissertation', 'Under Review', 'Pending Departmental Defense & Library Ingestion', '12', '0', '10.5281/zenodo.fcc.2026.042', '4.8 MB', 'olonade_wale_2026_defense_draft.pdf', 'Proposes an automated mathematical framework for cooperative apex liquidity pooling during harvest contraction windows, incorporating real-time stress models across 15 agricultural unions in Western Nigeria.', '2026-09-18 16:07:47', NULL, NULL, NULL, NULL, NULL)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `author` = VALUES(`author`), `matric` = VALUES(`matric`), `year` = VALUES(`year`), `advisor` = VALUES(`advisor`), `department` = VALUES(`department`), `faculty` = VALUES(`faculty`), `degree` = VALUES(`degree`), `status` = VALUES(`status`), `access` = VALUES(`access`), `downloads` = VALUES(`downloads`), `citations` = VALUES(`citations`), `doi` = VALUES(`doi`), `file_size` = VALUES(`file_size`), `file_name` = VALUES(`file_name`), `abstract` = VALUES(`abstract`), `submitted_at` = VALUES(`submitted_at`), `department_code` = VALUES(`department_code`), `revision_note` = VALUES(`revision_note`), `reviewed_by` = VALUES(`reviewed_by`), `reviewed_at` = VALUES(`reviewed_at`), `file_data_url` = VALUES(`file_data_url`);

-- ---------------------------------------------------------
-- Table structure for `serials`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `serials` (
  `id` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `issn` varchar(50) NOT NULL,
  `publisher` varchar(255) DEFAULT NULL,
  `frequency` varchar(50) DEFAULT NULL,
  `department` varchar(150) DEFAULT NULL,
  `latest_volume` varchar(50) DEFAULT NULL,
  `latest_issue` varchar(50) DEFAULT NULL,
  `holding_summary` text DEFAULT NULL,
  `subscription_status` varchar(50) NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `serials` (3 records)
INSERT INTO `serials` (`id`, `title`, `issn`, `publisher`, `frequency`, `department`, `latest_volume`, `latest_issue`, `holding_summary`, `subscription_status`) VALUES
  ('SER-01', 'Journal of Co-operative and Rural Development Studies', '1597-2844', 'Academic Press', 'Quarterly', 'General', 'Vol. 28 No. 3 (Sept 2026)', 'Issue 1', 'All holdings intact', 'Active Subscription'),
  ('SER-02', 'West African Agronomic Review', '0794-5590', 'Academic Press', 'Bi-annual', 'General', 'Vol. 19 No. 1 (June 2026)', 'Issue 1', 'All holdings intact', 'Active Subscription'),
  ('SER-03', 'African Journal of Information Systems & Computing', '1936-7287', 'Academic Press', 'Monthly', 'General', 'Vol. 14 No. 8 (August 2026)', 'Issue 1', 'All holdings intact', 'Active Subscription')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `issn` = VALUES(`issn`), `publisher` = VALUES(`publisher`), `frequency` = VALUES(`frequency`), `department` = VALUES(`department`), `latest_volume` = VALUES(`latest_volume`), `latest_issue` = VALUES(`latest_issue`), `holding_summary` = VALUES(`holding_summary`), `subscription_status` = VALUES(`subscription_status`);

-- ---------------------------------------------------------
-- Table structure for `google_books`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `google_books` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `volume_id` varchar(100) NOT NULL,
  `title` varchar(255) NOT NULL,
  `subtitle` varchar(255) DEFAULT NULL,
  `authors` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`authors`)),
  `publisher` varchar(255) DEFAULT NULL,
  `published_date` varchar(50) DEFAULT NULL,
  `description` longtext DEFAULT NULL,
  `isbn_10` varchar(20) DEFAULT NULL,
  `isbn_13` varchar(20) DEFAULT NULL,
  `page_count` int(11) DEFAULT NULL,
  `categories` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`categories`)),
  `thumbnail_url` text DEFAULT NULL,
  `preview_link` text DEFAULT NULL,
  `info_link` text DEFAULT NULL,
  `canonical_volume_link` text DEFAULT NULL,
  `viewability` varchar(50) NOT NULL DEFAULT 'PARTIAL',
  `embeddable` tinyint(1) NOT NULL DEFAULT 1,
  `is_ebook` tinyint(1) NOT NULL DEFAULT 0,
  `epub_available` tinyint(1) NOT NULL DEFAULT 0,
  `pdf_available` tinyint(1) NOT NULL DEFAULT 0,
  `web_reader_link` text DEFAULT NULL,
  `is_recommended` tinyint(1) NOT NULL DEFAULT 0,
  `recommendation_category` varchar(100) DEFAULT NULL,
  `recommendation_notes` text DEFAULT NULL,
  `saved_by` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `google_books_volume_id_unique` (`volume_id`),
  KEY `google_books_isbn_10_index` (`isbn_10`),
  KEY `google_books_isbn_13_index` (`isbn_13`),
  KEY `google_books_is_recommended_index` (`is_recommended`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `google_books` (2 records)
INSERT INTO `google_books` (`id`, `volume_id`, `title`, `subtitle`, `authors`, `publisher`, `published_date`, `description`, `isbn_10`, `isbn_13`, `page_count`, `categories`, `thumbnail_url`, `preview_link`, `info_link`, `canonical_volume_link`, `viewability`, `embeddable`, `is_ebook`, `epub_available`, `pdf_available`, `web_reader_link`, `is_recommended`, `recommendation_category`, `recommendation_notes`, `saved_by`, `created_at`, `updated_at`) VALUES
  ('1', 'yDF2DAAAQBAJ', 'Cooperative Enterprises in Europe', 'National Histories and the Future of the Cooperative Movement', '[\"P. A. David\", \"M. Fontana\"]', 'Palgrave Macmillan', '2023', 'Comprehensive historical and empirical analysis of cooperative business institutions.', '1137533894', '9781137533890', '312', '[\"Business & Economics\"]', 'https://books.google.com/books/content?id=yDF2DAAAQBAJ&printsec=frontcover&img=1&zoom=1', 'https://books.google.com/books?id=yDF2DAAAQBAJ', 'https://books.google.com/books?id=yDF2DAAAQBAJ', 'https://books.google.com/books/about/Cooperative_Enterprises_in_Europe.html?id=yDF2DAAAQBAJ', 'PARTIAL', '1', '1', '1', '1', 'https://play.google.com/books/reader?id=yDF2DAAAQBAJ', '1', 'Cooperative Management', 'Highly recommended for HND II research dissertations.', 'admin@fccibadan.edu.ng', '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('2', 'f280CwAAQBAJ', 'Designing Data-Intensive Applications', 'The Big Ideas Behind Reliable, Scalable, and Maintainable Systems', '[\"Martin Kleppmann\"]', 'O\'Reilly Media', '2017', 'Data is at the center of many challenges in system design today.', '1449373321', '9781449373320', '616', '[\"Computers\", \"Database Management\"]', 'https://books.google.com/books/content?id=f280CwAAQBAJ&printsec=frontcover&img=1&zoom=1', 'https://books.google.com/books?id=f280CwAAQBAJ', 'https://books.google.com/books?id=f280CwAAQBAJ', 'https://books.google.com/books/about/Designing_Data_Intensive_Applications.html?id=f280CwAAQBAJ', 'PARTIAL', '1', '1', '1', '1', 'https://play.google.com/books/reader?id=f280CwAAQBAJ', '1', 'Computer Science Systems', 'Mandatory reference text for HND Computer Science systems architecture.', 'admin@fccibadan.edu.ng', '2026-10-15 15:20:02', '2026-10-15 15:20:02')
ON DUPLICATE KEY UPDATE `volume_id` = VALUES(`volume_id`), `title` = VALUES(`title`), `subtitle` = VALUES(`subtitle`), `authors` = VALUES(`authors`), `publisher` = VALUES(`publisher`), `published_date` = VALUES(`published_date`), `description` = VALUES(`description`), `isbn_10` = VALUES(`isbn_10`), `isbn_13` = VALUES(`isbn_13`), `page_count` = VALUES(`page_count`), `categories` = VALUES(`categories`), `thumbnail_url` = VALUES(`thumbnail_url`), `preview_link` = VALUES(`preview_link`), `info_link` = VALUES(`info_link`), `canonical_volume_link` = VALUES(`canonical_volume_link`), `viewability` = VALUES(`viewability`), `embeddable` = VALUES(`embeddable`), `is_ebook` = VALUES(`is_ebook`), `epub_available` = VALUES(`epub_available`), `pdf_available` = VALUES(`pdf_available`), `web_reader_link` = VALUES(`web_reader_link`), `is_recommended` = VALUES(`is_recommended`), `recommendation_category` = VALUES(`recommendation_category`), `recommendation_notes` = VALUES(`recommendation_notes`), `saved_by` = VALUES(`saved_by`), `created_at` = VALUES(`created_at`), `updated_at` = VALUES(`updated_at`);

-- ---------------------------------------------------------
-- Table structure for `helpdesk_tickets`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `helpdesk_tickets` (
  `id` varchar(50) NOT NULL,
  `matric` varchar(100) NOT NULL,
  `patron_name` varchar(255) NOT NULL,
  `category` varchar(120) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `status` varchar(60) NOT NULL DEFAULT 'New',
  `librarian_reply` text DEFAULT NULL,
  `replied_by` varchar(190) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `helpdesk_tickets_matric_created_at_index` (`matric`,`created_at`),
  KEY `helpdesk_tickets_matric_index` (`matric`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `helpdesk_tickets` (3 records)
INSERT INTO `helpdesk_tickets` (`id`, `matric`, `patron_name`, `category`, `subject`, `message`, `status`, `librarian_reply`, `replied_by`, `created_at`, `updated_at`) VALUES
  ('TICK-901', 'FCC/CEM/2024/042', 'Wale Olonade', 'Library Portal PIN Reset', 'Request for Biometric Kiosk PIN Re-Sync', 'My automated kiosk PIN did not register at the library turnstile this morning. Kindly assist to re-link my account.', 'Resolved', 'Your student PIN has been re-synced to 1234. Please visit kiosk 1 to verify.', 'Alhaji Balogun O. (College Chief Librarian)', '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('TICK-902', 'FCC/CSC/2024/115', 'Kareem T. Adeola', 'Catalog Search', 'Unable to locate Tanenbaum 6th Edition on Open Shelf', 'The OPAC showed 3 available copies on Floor 2 Shelf 14A, but none was on the shelf.', 'Resolved', 'The book was in the reserve staging area for re-shelving and has now been returned to Shelf 14A.', 'Circulation Clerk (Mrs. M. K. Bello)', '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('TICK-903', 'FCC/BNF/2024/088', 'Fatima Bello', 'E-Library Access', 'ScienceDirect Off-Campus Access Token', 'I would like an institutional VPN proxy token to download peer-reviewed agribusiness journals from home.', 'Open', NULL, NULL, '2026-10-15 15:20:02', '2026-10-15 15:20:02')
ON DUPLICATE KEY UPDATE `matric` = VALUES(`matric`), `patron_name` = VALUES(`patron_name`), `category` = VALUES(`category`), `subject` = VALUES(`subject`), `message` = VALUES(`message`), `status` = VALUES(`status`), `librarian_reply` = VALUES(`librarian_reply`), `replied_by` = VALUES(`replied_by`), `created_at` = VALUES(`created_at`), `updated_at` = VALUES(`updated_at`);

-- ---------------------------------------------------------
-- Table structure for `interlibrary_requests`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `interlibrary_requests` (
  `id` varchar(50) NOT NULL,
  `matric` varchar(100) NOT NULL,
  `patron_name` varchar(255) NOT NULL,
  `partner_institution` varchar(255) NOT NULL,
  `title` varchar(500) NOT NULL,
  `author` varchar(255) NOT NULL,
  `identifier` varchar(100) DEFAULT NULL,
  `status` varchar(60) NOT NULL DEFAULT 'Submitted',
  `staff_note` text DEFAULT NULL,
  `submitted_at` date NOT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `interlibrary_requests_status_submitted_at_index` (`status`,`submitted_at`),
  KEY `interlibrary_requests_matric_index` (`matric`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `interlibrary_requests` (3 records)
INSERT INTO `interlibrary_requests` (`id`, `matric`, `patron_name`, `partner_institution`, `title`, `author`, `identifier`, `status`, `staff_note`, `submitted_at`, `updated_at`) VALUES
  ('ILL-2026-001', 'FCC/CEM/2024/042', 'Wale Olonade', 'University of Ibadan (Kenneth Dike Library)', 'Agricultural Cooperative Finance in Developing Economies (1970-2020)', 'Prof. S. O. Olayide', 'ISBN 978-978-121-008-4', 'Fulfilled', 'Hardcover volume dispatched via Inter-University Library Courier Service.', '2026-10-15', '2026-10-15 15:20:02'),
  ('ILL-2026-002', 'FCC/CSC/2024/115', 'Kareem T. Adeola', 'The Polytechnic, Ibadan Main Library', 'Vector Embeddings in Distributed Graph Computing', 'Dr. E. K. Ajayi', 'DOI 10.1145/3340531.3412011', 'In Transit', 'Requested physical dispatch from Poly Ibadan Stacks.', '2026-10-15', '2026-10-15 15:20:02'),
  ('ILL-2026-003', 'FCC/AGR/2024/059', 'Samuel O. Adeleke', 'Federal College of Animal Health & Production Tech Library', 'Soil Chemistry & Nitrogen Dynamics in West African Cocoa Plantations', 'Dr. P. B. Ogunbiyi', 'CALL AGR.55.992', 'Approved', 'Approved by Chief College Librarian. Waiting courier pickup.', '2026-10-15', '2026-10-15 15:20:02')
ON DUPLICATE KEY UPDATE `matric` = VALUES(`matric`), `patron_name` = VALUES(`patron_name`), `partner_institution` = VALUES(`partner_institution`), `title` = VALUES(`title`), `author` = VALUES(`author`), `identifier` = VALUES(`identifier`), `status` = VALUES(`status`), `staff_note` = VALUES(`staff_note`), `submitted_at` = VALUES(`submitted_at`), `updated_at` = VALUES(`updated_at`);

-- ---------------------------------------------------------
-- Table structure for `institutional_communications`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `institutional_communications` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `msg_id` varchar(50) NOT NULL,
  `thread_id` varchar(50) NOT NULL,
  `sender_id` varchar(100) NOT NULL,
  `sender_name` varchar(200) NOT NULL,
  `sender_role` varchar(50) NOT NULL,
  `sender_dept` varchar(150) DEFAULT NULL,
  `recipient_id` varchar(100) NOT NULL,
  `recipient_name` varchar(200) NOT NULL,
  `recipient_role` varchar(50) NOT NULL,
  `recipient_dept` varchar(150) DEFAULT NULL,
  `category` varchar(80) NOT NULL DEFAULT 'general_inquiry',
  `subject` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `priority` varchar(30) NOT NULL DEFAULT 'normal',
  `status` varchar(30) NOT NULL DEFAULT 'unread',
  `action_type` varchar(80) DEFAULT NULL,
  `action_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`action_data`)),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ic_msg_id_unique` (`msg_id`),
  KEY `ic_thread_id_index` (`thread_id`),
  KEY `ic_sender_recipient_index` (`sender_role`,`recipient_role`),
  KEY `ic_status_index` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `institutional_communications` (6 records)
INSERT INTO `institutional_communications` (`id`, `msg_id`, `thread_id`, `sender_id`, `sender_name`, `sender_role`, `sender_dept`, `recipient_id`, `recipient_name`, `recipient_role`, `recipient_dept`, `category`, `subject`, `message`, `priority`, `status`, `action_type`, `action_data`, `created_at`, `updated_at`) VALUES
  ('1', 'MSG-2026-001', 'TH-CEM-411', 'FCC/CEM/2024/042', 'Wale Olonade', 'student', 'Co-operative Economics & Management', 'HOD/CEM/001', 'Dr. Mrs. F. A. Babalola', 'hod', 'Co-operative Economics & Management', 'course_reserve', 'Request for CEM 411 Lecture Compendium in Digital Repository', 'Dear HOD Ma, Good afternoon. The HND II class would appreciate having the updated 2026 Apex Cooperative Syndication past questions and lecture compendium uploaded to the Library Digital Repository so we can access it on our student tablets.', 'high', 'resolved', 'course_material_request', '{\"course_code\":\"CEM 411\",\"target_level\":\"HND II\"}', '2026-09-28 11:15:00', '2026-09-28 12:30:00'),
  ('2', 'MSG-2026-002', 'TH-CEM-411', 'HOD/CEM/001', 'Dr. Mrs. F. A. Babalola (HOD CEM)', 'hod', 'Co-operative Economics & Management', 'FCC/CEM/2024/042', 'Wale Olonade', 'student', 'Co-operative Economics & Management', 'course_reserve', 'RE: CEM 411 Lecture Compendium Uploaded', 'Dear Wale, The Departmental Academic Board has compiled and submitted the CEM 411 Compendium to the Central Library Cataloging unit today. You will receive an automated notification once the Chief Librarian approves the staging ingestion.', 'normal', 'resolved', 'reply', '{\"course_code\":\"CEM 411\"}', '2026-09-28 13:20:00', '2026-09-28 13:20:00'),
  ('3', 'MSG-2026-003', 'TH-ACQ-902', 'HOD/CEM/001', 'Dr. Mrs. F. A. Babalola (HOD CEM)', 'hod', 'Co-operative Economics & Management', 'ADMIN-CHIEF', 'Dr. Mrs. A. Balogun (Chief College Librarian)', 'admin', 'Central Library Services', 'acquisition_request', 'Book Acquisition Requisition: 15 Copies of Nigerian Cooperative Law (2026 Edition)', 'The CEM Department requires 15 new physical reference copies of \"Nigerian Cooperative Law, Governance & Statutory Auditing\" (ISBN: 978-978-8120-00-5) by Spectrum Books to support our upcoming NBTE accreditation audit in November.', 'urgent', 'in_progress', 'acquisition_requisition', '{\"copies\":15,\"estimated_cost\":240000,\"vendor\":\"Spectrum Books Ibadan\"}', '2026-09-29 10:45:00', '2026-09-29 16:10:00'),
  ('4', 'MSG-2026-004', 'TH-ACQ-902', 'ADMIN-CHIEF', 'Dr. Mrs. A. Balogun (Chief College Librarian)', 'admin', 'Central Library Services', 'HOD/CEM/001', 'Dr. Mrs. F. A. Babalola (HOD CEM)', 'hod', 'Co-operative Economics & Management', 'acquisition_request', 'RE: Acquisition Approved — Purchase Order PO-2026-083 Dispatched', 'Requisition approved. Purchase Order PO-2026-083 has been dispatched to Spectrum Books, Ring Road. 5 copies will be reserved for Departmental Library Stacks and 10 copies for Central Library Reserve Shelf.', 'high', 'resolved', 'approve_requisition', '{\"po_number\":\"PO-2026-083\",\"budget_code\":\"TETFUND-2026-LIB\"}', '2026-09-29 17:30:00', '2026-09-29 17:30:00'),
  ('5', 'MSG-2026-005', 'TH-CLR-2026-08', 'FCC/CEM/2024/042', 'Wale Olonade', 'student', 'Co-operative Economics & Management', 'ADMIN-CIRC', 'Circulation Desk & Clearance Officer', 'admin', 'Circulation Unit', 'clearance_request', 'Library Graduation Clearance & Fine Audit Request', 'Please audit my library card record for final graduation clearance. I have submitted my hardcover project thesis \"Cocoa Cooperative Agronomy\" and cleared all circulation charges.', 'normal', 'unread', 'audit_clearance', '{\"matric\":\"FCC/CEM/2024/042\",\"level\":\"HND II\"}', '2026-09-30 10:20:00', '2026-09-30 10:20:00'),
  ('6', 'MSG-2026-006', 'TH-BROADCAST-LIB', 'ADMIN-CHIEF', 'College Library Administration', 'admin', 'Central Library Services', 'all', 'All Faculty, HODs and Students', 'all', 'All Departments', 'official_bulletin', 'Extended Stack Hours During NBTE Examination Period', 'The Central Library and ICT Commons will operate from 7:30 AM to 10:00 PM daily throughout the examination period. Group study rooms and self-checkout kiosks are fully operational.', 'high', 'unread', 'announcement', '{\"hours\":\"7:30 AM - 10:00 PM\",\"target\":\"Campus Wide\"}', '2026-09-30 12:00:00', '2026-09-30 12:00:00')
ON DUPLICATE KEY UPDATE `msg_id` = VALUES(`msg_id`), `thread_id` = VALUES(`thread_id`), `sender_id` = VALUES(`sender_id`), `sender_name` = VALUES(`sender_name`), `sender_role` = VALUES(`sender_role`), `sender_dept` = VALUES(`sender_dept`), `recipient_id` = VALUES(`recipient_id`), `recipient_name` = VALUES(`recipient_name`), `recipient_role` = VALUES(`recipient_role`), `recipient_dept` = VALUES(`recipient_dept`), `category` = VALUES(`category`), `subject` = VALUES(`subject`), `message` = VALUES(`message`), `priority` = VALUES(`priority`), `status` = VALUES(`status`), `action_type` = VALUES(`action_type`), `action_data` = VALUES(`action_data`), `created_at` = VALUES(`created_at`), `updated_at` = VALUES(`updated_at`);

-- ---------------------------------------------------------
-- Table structure for `announcements`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `priority` varchar(50) NOT NULL DEFAULT 'Normal',
  `author` varchar(255) DEFAULT NULL,
  `date` varchar(50) DEFAULT NULL,
  `valid_until` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `announcements` (3 records)
INSERT INTO `announcements` (`id`, `title`, `content`, `category`, `priority`, `author`, `date`, `valid_until`) VALUES
  ('ANN-01', 'Second Semester Examination Period — 24/7 Virtual Library Access', 'In support of the upcoming ND/HND examinations, the Main Campus Library and E-Learning Hub will operate extended 24-hour reading hours starting Monday. Biometric cards required for entry after 09:00 PM.', 'High Priority', 'High Priority', 'Library Directorate', '16 Sept 2026', '2027-09-18'),
  ('ANN-02', 'New E-Book Subscriptions Added: ScienceDirect & IEEE Computer Society', 'The Library Directorate has acquired institutional multi-user licenses for 14,000+ new peer-reviewed computer engineering and agricultural economics volumes.', 'Resource Update', 'Resource Update', 'Library Directorate', '12 Sept 2026', '2027-09-18'),
  ('ANN-03', 'Student PIN Verification & PVC ID Card Revalidation Notice', 'Students experiencing login issues should visit their faculty librarian for immediate PIN reset. Please note library services require NO direct monetary payments.', 'Administrative', 'Administrative', 'Library Directorate', '08 Sept 2026', '2027-09-18')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `content` = VALUES(`content`), `category` = VALUES(`category`), `priority` = VALUES(`priority`), `author` = VALUES(`author`), `date` = VALUES(`date`), `valid_until` = VALUES(`valid_until`);

-- ---------------------------------------------------------
-- Table structure for `audit_logs`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` varchar(50) NOT NULL,
  `timestamp` timestamp NULL DEFAULT current_timestamp(),
  `actor` varchar(255) NOT NULL,
  `role` varchar(100) NOT NULL,
  `action` varchar(255) NOT NULL,
  `resource_type` varchar(100) DEFAULT NULL,
  `resource_id` varchar(100) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `hash` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `audit_logs_actor_index` (`actor`),
  KEY `audit_logs_action_index` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `audit_logs` (3 records)
INSERT INTO `audit_logs` (`id`, `timestamp`, `actor`, `role`, `action`, `resource_type`, `resource_id`, `details`, `ip_address`, `hash`) VALUES
  ('LOG-5501', '2026-09-18 13:42:15', 'Dr. Mrs. A. Balogun', 'SUPER_ADMIN', 'PIN_RESET', 'CATALOG', 'LOG-5501', 'Generated new secure library PIN for student Wale Olonade (FCC/CEM/2024/042)', '127.0.0.1', 'sha256-verified'),
  ('LOG-5502', '2026-09-18 12:15:30', 'Mr. T. Alabi (Cataloguer)', 'CATALOGUER', 'MARC_INGEST', 'CATALOG', 'LOG-5502', 'Added MARC21 bibliographic record for Artificial Intelligence in Academic Retrieval (Z666.5 .F38)', '127.0.0.1', 'sha256-verified'),
  ('LOG-5503', '2026-09-18 11:04:00', 'System Scheduler', 'DAEMON', 'HEALTH_CHECK', 'CATALOG', 'LOG-5503', 'Automated daily integrity audit verified 100% of PDF asset hashes.', '127.0.0.1', 'sha256-verified')
ON DUPLICATE KEY UPDATE `timestamp` = VALUES(`timestamp`), `actor` = VALUES(`actor`), `role` = VALUES(`role`), `action` = VALUES(`action`), `resource_type` = VALUES(`resource_type`), `resource_id` = VALUES(`resource_id`), `details` = VALUES(`details`), `ip_address` = VALUES(`ip_address`), `hash` = VALUES(`hash`);

-- ---------------------------------------------------------
-- Table structure for `library_apis`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `library_apis` (
  `id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `provider` varchar(255) DEFAULT NULL,
  `category` varchar(100) NOT NULL DEFAULT 'Academic & Books',
  `endpoint_template` text NOT NULL,
  `auth_type` varchar(50) NOT NULL DEFAULT 'Free Open Access',
  `api_key` varchar(255) DEFAULT NULL,
  `headers` text DEFAULT NULL,
  `response_type` varchar(50) NOT NULL DEFAULT 'json',
  `description` text DEFAULT NULL,
  `docs_url` varchar(500) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Active',
  `is_preset` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `library_apis` (37 records)
INSERT INTO `library_apis` (`id`, `name`, `provider`, `category`, `endpoint_template`, `auth_type`, `api_key`, `headers`, `response_type`, `description`, `docs_url`, `status`, `is_preset`, `created_at`, `updated_at`) VALUES
  ('API-ACQUISITIONS', 'Library Acquisitions & Requisition Orders API', 'FCC Collection Development Unit', 'Stacks Procurement & Budgeting', '/api/acquisitions', 'Admin / HOD', NULL, NULL, 'json', 'Departmental book requisition tracking, TETFUND procurement budget reconciliation, and purchase order workflow.', '#/admin/acquisitions', 'Active', '1', '2026-10-15 15:17:47', '2026-10-15 15:17:47'),
  ('API-AI-DESK', 'AI Virtual Reference Desk & Citation Assistant API', 'FCC Gemini & Deep Research Unit', 'AI Reference & Information Retrieval', '/api/ai-chat', 'Patron Access', NULL, NULL, 'json', 'Natural language reference query solver, APA/MLA bibliographic citation generator, and literature review helper.', '#/student/ai-desk', 'Active', '1', '2026-10-15 15:17:47', '2026-10-15 15:17:47'),
  ('API-ARXIV', 'arXiv Open E-Print Archive (Cornell University)', 'Cornell University & arXiv.org (Ithaca, NY, USA)', 'Quantitative Science & Computer Science', 'https://export.arxiv.org/api/query?search_query=all:{query}&start=0&max_results=12', 'Free Open Access', NULL, NULL, 'xml', '2M+ research e-prints in computer science, mathematics, economics, statistics, and electrical engineering.', 'https://info.arxiv.org/help/api/index.html', 'Active', '1', '2026-10-15 14:55:15', '2026-10-15 15:17:47'),
  ('API-AUTHORS', 'Authority Name Control & Biography Directory API', 'FCC Cataloging & Metadata Unit', 'Authority Control & Bibliometrics', '/api/authors?q={query}', 'Open Academic Access', NULL, NULL, 'json', 'Standardized author authority headings, academic affiliations, institutional profiles, and published bibliography lists.', '#/student/authors', 'Active', '1', '2026-10-15 15:17:47', '2026-10-15 15:17:47'),
  ('API-CATALOG', 'Master Stacks Catalog & Holdings API', 'FCC Central Library Directorate', 'Central Physical Stacks & OPAC', '/api/catalog?q={query}&department={dept}', 'Open / Patron Access', NULL, NULL, 'json', 'Live master collection catalog returning physical holdings, shelf locations, call numbers, and digital reader availability.', '#/opac', 'Active', '1', '2026-10-15 15:17:47', '2026-10-15 15:17:47'),
  ('API-CIRCULATION-LOANS', 'Circulation Desk & Book Borrowing API', 'FCC Circulation & Stacks Management', 'Circulation & Barcode Checkout', '/api/loans?patron_id={id}&status={status}', 'Library Staff', NULL, NULL, 'json', 'Active book checkouts, due dates, renewal extensions, book return check-in processing, and circulation history.', '#/admin/circulation', 'Active', '1', '2026-10-15 15:17:47', '2026-10-15 15:17:47'),
  ('API-COMMUNICATIONS', 'Institutional Tri-Party Dispatch API', 'FCC Library Communications Hub', 'Inter-Role Notifications & Inquiries', '/api/communications?user_id={id}', 'Student / HOD / Admin', NULL, NULL, 'json', 'Inter-departmental messaging connecting Heads of Department, Chief Librarians, and Students for acquisition and clearance workflows.', '#/hod/communication', 'Active', '1', '2026-10-15 15:17:47', '2026-10-15 15:17:47'),
  ('API-CORE', 'CORE Global Research Repositories API', 'The Open University & Jisc (UK)', 'Global Institutional Repositories', 'https://api.core.ac.uk/v3/search/works?q={query}&limit=12', 'Free Open Access', NULL, NULL, 'json', 'World largest collection of open access research papers aggregated from thousands of university repositories.', 'https://core.ac.uk/services/api', 'Active', '1', '2026-10-15 15:17:47', '2026-10-15 15:17:47'),
  ('API-COURSE-RESERVES', 'Examination Course Reserves Desk API', 'FCC Circulation & Academic Reserve Desk', 'High-Demand Reserve Holdings', '/api/course-reserves?department={department}', 'Patron / Staff Access', NULL, NULL, 'json', 'Restricted-loan textbooks placed on physical 2-hour consultation and overnight reserve by Department Heads.', '#/hod/reserves', 'Active', '1', '2026-10-15 15:17:47', '2026-10-15 15:17:47'),
  ('API-COURSES', 'Curriculum Modules & Reserve Syllabus API', 'FCC Academic Affairs & Faculty Board', 'Academic Curriculum & Syllabi', '/api/courses?department={department}', 'Open / Patron Access', NULL, NULL, 'json', 'Accredited academic course catalog with syllabus outlines, prescribed reading lists, and assigned departmental lecturers.', '#/hod/courses', 'Active', '1', '2026-10-15 15:17:47', '2026-10-15 15:17:47'),
  ('API-CROSSREF', 'Crossref Global Scholarly Works API', 'Crossref Consortium (Oxford, UK & Lynnfield, USA)', 'Scholarly Research & DOIs', 'https://api.crossref.org/works?query={query}&rows=12', 'Free Open Access', NULL, NULL, 'json', 'Official registry of 150M+ peer-reviewed journal papers, academic dissertations, and conference proceedings.', 'https://api.crossref.org/', 'Active', '1', '2026-10-15 14:55:15', '2026-10-15 15:17:47'),
  ('API-DEPARTMENTS', 'Academic Departments & HOD Directory API', 'FCC Registry & Academic Directorate', 'Institutional Structure & Faculties', '/api/departments', 'Institutional Directory', NULL, NULL, 'json', 'Directory of accredited academic departments, faculty allocations, student counts, and active Head of Department profiles.', '#/admin/hod-submissions', 'Active', '1', '2026-10-15 15:17:47', '2026-10-15 15:17:47'),
  ('API-DEPT-UPLOADS', 'Departmental Digital Materials Staging API', 'FCC HOD Academic Staging Directorate', 'Faculty Submissions & E-Texts', '/api/department-uploads?department_id={id}', 'HOD Staff Credentials', NULL, NULL, 'json', 'Lecture handouts, seminar monographs, past exam question compendia, and digital textbooks uploaded by HODs.', '#/hod/upload', 'Active', '1', '2026-10-15 15:17:47', '2026-10-15 15:17:47'),
  ('API-DOAB', 'Directory of Open Access Books (DOAB)', 'OAPEN Foundation (The Hague, Netherlands)', 'Peer-Reviewed Academic Books', 'https://directory.doabooks.org/rest/search?query={query}&expand=metadata', 'Free Open Access', NULL, NULL, 'json', 'Peer-reviewed, open-access academic monographs and scholarly books from world universities.', 'https://directory.doabooks.org/', 'Active', '1', '2026-10-15 14:55:15', '2026-10-15 15:17:47'),
  ('API-DOAJ', 'Directory of Open Access Journals (DOAJ) API', 'Infrastructure Services for Open Access (IS4OA)', 'Open Access Peer-Reviewed Journals', 'https://doaj.org/api/v2/search/articles/{query}?pageSize=12', 'Free Open Access', NULL, NULL, 'json', 'Comprehensive index of diverse, high quality, open access, peer-reviewed journals across the world.', 'https://doaj.org/api/v2/docs', 'Active', '1', '2026-10-15 15:17:47', '2026-10-15 15:17:47'),
  ('API-EUROPEPMC', 'Europe PMC Life Sciences & Agriculture API', 'EMBL-EBI (Hinxton, UK)', 'Agronomy, Medicine & Life Sciences', 'https://www.ebi.ac.uk/europepmc/webservices/rest/search?query={query}&format=json&pageSize=12', 'Free Open Access', NULL, NULL, 'json', 'Life sciences and agricultural science articles from international institutional repositories.', 'https://europepmc.org/RestfulWebService', 'Active', '1', '2026-10-15 14:55:15', '2026-10-15 15:17:47'),
  ('API-FINES', 'Library Demurrage & Fine Settlement API', 'FCC Library Bursary & Compliance Unit', 'Fines, Penalties & Revenue', '/api/fines?patron_id={id}', 'Library Staff / Bursary', NULL, NULL, 'json', 'Automated overdue calculation, lost material charges, fine waiver auditing, and payment receipt processing.', '#/admin/fines', 'Active', '1', '2026-10-15 15:17:47', '2026-10-15 15:17:47'),
  ('API-GOOGLEBOOKS', 'Google Books Global Volumes API', 'Google LLC (Mountain View, CA, USA)', 'Worldwide Books & Previews', 'https://www.googleapis.com/books/v1/volumes?q={query}&maxResults=12', 'Free Open Access', NULL, NULL, 'json', 'World-spanning index of digitized curriculum books, ISBN metadata, descriptions, and cover art.', 'https://developers.google.com/books', 'Active', '1', '2026-10-15 14:55:15', '2026-10-15 15:17:47'),
  ('API-GUTENDEX', 'Project Gutenberg Classic E-Books (Gutendex)', 'Project Gutenberg Literary Archive', 'Full-Text Classic Literature & E-Books', 'https://gutendex.com/books?search={query}', 'Free Open Access', NULL, NULL, 'json', '70,000+ public domain full-text classic textbooks and literature with direct reading downloads.', 'https://gutendex.com/', 'Active', '1', '2026-10-15 14:55:15', '2026-10-15 15:17:47'),
  ('API-INTERNETARCHIVE', 'Internet Archive Official Metadata & Collections API', 'Internet Archive (San Francisco, CA, USA)', 'Digital Libraries & Audiobooks', 'https://archive.org/advancedsearch.php?q={query}&output=json&rows=12', 'Free Open Access', NULL, NULL, 'json', 'Digital library offering free universal access to books, movies, music, and millions of digitized library records.', 'https://archive.org/help/aboutsearch.htm', 'Active', '1', '2026-10-15 15:17:47', '2026-10-15 15:17:47'),
  ('API-LMS', 'LMS Academic Library Management API', 'Federal Cooperative College & Global LMS Network', 'Core Academic Books & Holdings', '/api/lms/books?q={query}&per_page=12', 'Internal Free Open Access', NULL, NULL, 'json', 'Real-time Library Management System API with full-text search, live copy stacks, hold reservation queue, and peer review metrics.', '/api/lms/books', 'Active', '1', '2026-10-15 15:17:47', '2026-10-15 15:17:47'),
  ('API-LMS-BOOKS', 'LMS Core Books & Search Gateway (Thetechguy44)', 'FCC Smart Library Core LMS Engine', 'Institutional Catalog & Holdings', '/api/books?search={query}&department={dept}', 'Session / Bearer Token', NULL, NULL, 'json', 'Primary book catalog retrieval endpoint featuring full-text search, departmental filtering, and real-time shelf status.', '#/admin/api-docs', 'Active', '1', '2026-10-15 15:17:47', '2026-10-15 15:17:47'),
  ('API-LOC', 'Library of Congress National Catalog (loc.gov)', 'Library of Congress (Washington, D.C., USA)', 'National Catalog & MARC Authority', 'https://www.loc.gov/search/?q={query}&fo=json', 'Free Open Access', NULL, NULL, 'json', 'Official national authority classification records, LCCN data, and historical digitized collection items.', 'https://libraryofcongress.github.io/data-exploration/', 'Active', '1', '2026-10-15 14:55:15', '2026-10-15 15:17:47'),
  ('API-OPENALEX', 'OpenAlex Scholarly Knowledge Graph API', 'OurResearch (Global Non-Profit)', 'Bibliometrics & Citations', 'https://api.openalex.org/works?search={query}&per-page=12', 'Free Open Access', NULL, NULL, 'json', '250M+ scientific research papers, authors, citations, and institutional research output.', 'https://openalex.org/', 'Active', '1', '2026-10-15 14:55:15', '2026-10-15 15:17:47'),
  ('API-OPENLIB', 'Open Library Book Search & Covers API', 'Internet Archive (San Francisco, CA, USA)', 'Global Monograph & Covers', 'https://openlibrary.org/search.json?q={query}&limit=12', 'Free Open Access', NULL, NULL, 'json', 'Over 30 million bibliographic records, covers, subjects, and authors maintained by the Internet Archive.', 'https://openlibrary.org/developers/api', 'Active', '1', '2026-10-15 14:55:15', '2026-10-15 15:17:47'),
  ('API-OVERLAY', 'Federated Multi-Source Discovery Overlay Engine API', 'FCC Unified Search Gateway', 'Federated Search & Deep Indexing', '/api/overlay/search?q={query}&sources={sources}', 'Open Academic Access', NULL, NULL, 'json', 'High-speed parallel query multiplexer querying Google Books, Open Library, Gutendex, Crossref, and arXiv in a single request.', '#/opac/federated', 'Active', '1', '2026-10-15 15:17:47', '2026-10-15 15:17:47'),
  ('API-PARTNER-LIBRARIES', 'Academic Consortia & Inter-Library Loan Network API', 'National Virtual Library & Inter-University Consortium', 'Consortial Sharing & Remote Stacks', '/api/partner-libraries', 'Institutional Consortia', NULL, NULL, 'json', 'Real-time catalog gateway to affiliated Nigerian university libraries (UI, OAU, FUTA, UNILAG) and international repositories.', '#/opac/partners', 'Active', '1', '2026-10-15 15:17:47', '2026-10-15 15:17:47'),
  ('API-PATRONS', 'Student & Faculty Patrons Identity & Clearance API', 'FCC Library Membership & Circulation Services', 'Patron Management & Convocation Clearance', '/api/patrons?department={dept}&role={role}', 'Library Staff / Admin', NULL, NULL, 'json', 'Patron accounts registry, matriculation lookup, barcode credentials, loan quotas, and convocation clearance verification.', '#/hod/scholars', 'Active', '1', '2026-10-15 15:17:47', '2026-10-15 15:17:47'),
  ('API-PUBMED', 'PubMed Central BioC & E-Utilities API', 'National Center for Biotechnology Information (NCBI / NLM)', 'Health Sciences & Agricultural Biology', 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pmc&term={query}&retmode=json&retmax=12', 'Free Open Access', NULL, NULL, 'json', 'Biomedical and life sciences journal literature archive at the U.S. National Institutes of Health.', 'https://www.ncbi.nlm.nih.gov/books/NBK25501/', 'Active', '1', '2026-10-15 15:17:47', '2026-10-15 15:17:47'),
  ('API-RECOMMENDATIONS', 'Algorithmic Personalized Book Recommender API', 'FCC Machine Learning Recommendation Engine', 'Predictive Analytics & Discovery', '/api/recommendations?matric={matric}', 'Authenticated Student', NULL, NULL, 'json', 'Dynamic book recommendations generated from course registration, borrowing history, and departmental syllabus alignment.', '#/student/recommendations', 'Active', '1', '2026-10-15 15:17:47', '2026-10-15 15:17:47'),
  ('API-RESERVATIONS', 'Patron Hold Requests & Booking Slots API', 'FCC Stacks Reservation Service', 'Advance Reservations & Holds', '/api/book-reservations?patron_id={id}', 'Patron Access', NULL, NULL, 'json', 'Reservation hold queuing, available copy notification dispatch, and pickup shelf staging management.', '#/student/reservations', 'Active', '1', '2026-10-15 15:17:47', '2026-10-15 15:17:47'),
  ('API-REVIEWS', 'Patron Peer Reviews & Star Ratings API', 'FCC Student Reader Community', 'Community Ratings & Peer Reviews', '/api/books/{bookId}/reviews', 'Authenticated Patron', NULL, NULL, 'json', 'Student peer reviews, 5-star academic ratings, curriculum recommendations, and reading difficulty ratings.', '#/student/catalog', 'Active', '1', '2026-10-15 15:17:47', '2026-10-15 15:17:47'),
  ('API-SEMANTICSCHOLAR', 'Semantic Scholar AI Scientific Literature API', 'Allen Institute for AI (Seattle, WA, USA)', 'Scientific Literature & AI Abstracts', 'https://api.semanticscholar.org/graph/v1/paper/search?query={query}&fields=title,authors,year,abstract,citationCount', 'Free Open Access', NULL, NULL, 'json', 'Over 200M academic papers, AI-generated TLDR summaries, citation influence graphs, and author profiles.', 'https://www.semanticscholar.org/product/api', 'Active', '1', '2026-10-15 14:55:15', '2026-10-15 15:17:47'),
  ('API-SIMPLELIB', 'SimpleLib RESTful Books & Genre HATEOAS API (BassemGhoniem)', 'BassemGhoniem SimpleLib Architecture', 'RESTful HATEOAS Resource Architecture', '/api/simplelib/books?q={query}', 'Bearer / Open Access', NULL, NULL, 'json', 'Standards-compliant REST API implementing HATEOAS links, resource pagination, genre taxonomy, and granular HTTP methods.', '#/admin/simplelib', 'Active', '1', '2026-10-15 15:17:47', '2026-10-15 15:17:47'),
  ('API-THESES', 'Institutional Dissertations & Capstone Repository API', 'FCC Post-Graduate & HND Research Unit', 'Research Theses & Scholarly Works', '/api/theses?department={dept}&status={status}', 'Open Academic Access', NULL, NULL, 'json', 'Institutional repository of final-year student theses, research dissertations, abstracts, supervisor endorsements, and PDF files.', '#/hod/dissertations', 'Active', '1', '2026-10-15 15:17:47', '2026-10-15 15:17:47'),
  ('API-THETECHGUY44', 'Thetechguy44 Library Management System API', 'Thetechguy44 (Dev Gana)', 'Core Academic Books & Holdings', '/api/books?search={query}', 'Internal Free Open Access', NULL, NULL, 'json', 'Real-time Library Management System API authored by Thetechguy44 with full-text search, live copy stacks, hold reservation queue, and peer review metrics.', 'https://github.com/Thetechguy44/library-management-system-api', 'Active', '1', '2026-10-15 15:17:47', '2026-10-15 15:17:47'),
  ('API-TROVE', 'National Library of Australia Trove API', 'National Library of Australia (Canberra, Australia)', 'National Heritage & Federated Collections', 'https://api.trove.nla.gov.au/v3/result?q={query}&encoding=json', 'Free Open Access', NULL, NULL, 'json', 'Federated discovery across Australian libraries, cultural institutions, archives, and research papers.', 'https://trove.nla.gov.au/about/create-something/using-api', 'Active', '1', '2026-10-15 15:17:47', '2026-10-15 15:17:47')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `provider` = VALUES(`provider`), `category` = VALUES(`category`), `endpoint_template` = VALUES(`endpoint_template`), `auth_type` = VALUES(`auth_type`), `api_key` = VALUES(`api_key`), `headers` = VALUES(`headers`), `response_type` = VALUES(`response_type`), `description` = VALUES(`description`), `docs_url` = VALUES(`docs_url`), `status` = VALUES(`status`), `is_preset` = VALUES(`is_preset`), `created_at` = VALUES(`created_at`), `updated_at` = VALUES(`updated_at`);

-- ---------------------------------------------------------
-- Table structure for `library_settings`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `library_settings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `setting_group` varchar(50) NOT NULL DEFAULT 'general',
  `value_type` varchar(50) NOT NULL DEFAULT 'string',
  `is_public` tinyint(1) NOT NULL DEFAULT 1,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `library_settings_setting_key_unique` (`setting_key`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `library_settings` (20 records)
INSERT INTO `library_settings` (`id`, `setting_key`, `setting_value`, `setting_group`, `value_type`, `is_public`, `description`, `created_at`, `updated_at`) VALUES
  ('1', 'institution_name', 'Federal Co-operative College, Ibadan', 'general', 'string', '1', 'Full institution legal name', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('2', 'institution_short_name', 'FCC Ibadan', 'general', 'string', '1', 'Abbreviated name', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('3', 'library_name', 'Chief Olubadan Memorial Central Library & Knowledge Center', 'general', 'string', '1', 'Main Library Name', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('4', 'contact_email', 'library@fccibadan.edu.ng', 'general', 'string', '1', 'Official Library Desk Email', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('5', 'contact_phone', '+234 803 456 7890', 'general', 'string', '1', 'Helpdesk Phone Line', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('6', 'address', 'Eleyele Road, P.M.B. 5033, Dugbe, Ibadan, Oyo State, Nigeria', 'general', 'string', '1', 'Physical Street Address', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('7', 'opening_hours_weekday', '8:00 AM – 8:00 PM (Monday – Friday)', 'general', 'string', '1', 'Weekday stack hours', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('8', 'opening_hours_weekend', '9:00 AM – 4:00 PM (Saturdays)', 'general', 'string', '1', 'Weekend stack hours', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('9', 'max_borrow_limit_student', '5', 'circulation', 'integer', '1', 'Maximum concurrent physical loans for students', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('10', 'max_borrow_limit_faculty', '10', 'circulation', 'integer', '1', 'Maximum concurrent loans for faculty', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('11', 'loan_duration_days', '14', 'circulation', 'integer', '1', 'Standard borrowing duration in days', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('12', 'renewal_limit', '2', 'circulation', 'integer', '1', 'Number of times a patron can renew without returning', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('13', 'daily_fine_rate', '50.00', 'circulation', 'decimal', '1', 'Daily overdue penalty in local currency', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('14', 'currency_symbol', '₦', 'circulation', 'string', '1', 'Currency symbol for fines and receipts', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('15', 'currency_code', 'NGN', 'circulation', 'string', '1', 'ISO 4217 Currency Code', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('16', 'reservation_hold_days', '3', 'circulation', 'integer', '1', 'Days an item is kept on hold shelf before auto-release', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('17', 'classification_system', 'Library of Congress (LCC)', 'classification', 'string', '1', 'Primary bibliographic classification scheme', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('18', 'barcode_symbology', 'Code 128', 'opac', 'string', '1', 'Default barcode format for physical copies', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('19', 'enable_self_service_kiosk', 'true', 'opac', 'boolean', '1', 'Enable self-checkout and return kiosk stations', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('20', 'enable_digital_repository', 'true', 'opac', 'boolean', '1', 'Public access to electronic theses and e-books', '2026-10-15 14:55:15', '2026-10-15 14:55:15')
ON DUPLICATE KEY UPDATE `setting_key` = VALUES(`setting_key`), `setting_value` = VALUES(`setting_value`), `setting_group` = VALUES(`setting_group`), `value_type` = VALUES(`value_type`), `is_public` = VALUES(`is_public`), `description` = VALUES(`description`), `created_at` = VALUES(`created_at`), `updated_at` = VALUES(`updated_at`);

-- ---------------------------------------------------------
-- Table structure for `study_rooms`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `study_rooms` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `branch` varchar(255) NOT NULL,
  `capacity` int(11) NOT NULL DEFAULT 4,
  `type` varchar(100) DEFAULT NULL,
  `amenities` text DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Available',
  `available_today` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `study_rooms` (4 records)
INSERT INTO `study_rooms` (`id`, `name`, `branch`, `capacity`, `type`, `amenities`, `status`, `available_today`) VALUES
  ('RM-A101', 'Quiet Research Carrel Alpha', 'Floor 1 • Main Library', '1', 'Individual Research Pod', '[\"High-speed Wi-Fi\",\"Dedicated Power Outlet\",\"Ergonomic Mesh Chair\",\"Adjustable LED Task Lamp\",\"Sound-dampening Acoustic Paneling\"]', 'available', '08:00 - 10:00, 10:00 - 12:00, 12:00 - 14:00, 14:00 - 16:00, 16:00 - 18:00, 18:00 - 20:00'),
  ('RM-B204', 'Cooperative Synergy Group Suite', 'Floor 2 • West Wing', '6', 'Collaborative Study Room', '[\"55-inch Ultra HD Presentation Screen\",\"Magnetic Ceramic Whiteboard\",\"Conference Table\",\"Air Conditioning\",\"USB-C Fast Charging Hub\",\"High-speed Wi-Fi\"]', 'available', '09:00 - 11:00, 11:00 - 13:00, 13:00 - 15:00, 15:00 - 17:00, 17:00 - 19:00'),
  ('RM-C302', 'Postgraduate & Defense Seminar Suite', 'Floor 3 • Senate Wing', '14', 'Conference & Defense Room', '[\"4K Laser Projector\",\"Wireless Ceiling Mic Array\",\"Surround Audio\",\"Lectern with Touch Control\",\"Air Conditioning\",\"HD Video Conferencing Cam\"]', 'booked', '14:00 - 16:00, 16:00 - 18:00'),
  ('RM-D105', 'E-Library Multimedia Innovation Pod', 'Ground Floor • E-Library Hub', '2', 'Digital Media Station', '[\"Dual 27-inch 4K Color-Accurate Monitors\",\"Studio Condenser Mic\",\"High-Performance Workstation\",\"Noise-Cancelling Headphones\",\"Gigabit LAN\"]', 'available', '08:00 - 10:00, 10:00 - 12:00, 12:00 - 14:00, 14:00 - 16:00, 16:00 - 18:00')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `branch` = VALUES(`branch`), `capacity` = VALUES(`capacity`), `type` = VALUES(`type`), `amenities` = VALUES(`amenities`), `status` = VALUES(`status`), `available_today` = VALUES(`available_today`);

-- ---------------------------------------------------------
-- Table structure for `room_bookings`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `room_bookings` (
  `id` varchar(50) NOT NULL,
  `matric` varchar(100) NOT NULL,
  `room_id` varchar(50) NOT NULL,
  `room_name` varchar(100) NOT NULL,
  `branch` varchar(255) DEFAULT NULL,
  `date` date NOT NULL,
  `time_slot` varchar(100) NOT NULL,
  `duration_hours` int(11) NOT NULL DEFAULT 2,
  `purpose` varchar(255) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Confirmed',
  `check_in_code` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `room_bookings` (1 records)
INSERT INTO `room_bookings` (`id`, `matric`, `room_id`, `room_name`, `branch`, `date`, `time_slot`, `duration_hours`, `purpose`, `status`, `check_in_code`, `created_at`) VALUES
  ('BKG-9901', 'FCC/CEM/2024/042', 'RM-A101', 'Quiet Research Carrel Alpha', 'Main Campus Library', '2026-09-18', '14:00 - 16:00', '2', 'Academic Study', 'Confirmed', 'CHK-782', '2026-10-15 14:55:15')
ON DUPLICATE KEY UPDATE `matric` = VALUES(`matric`), `room_id` = VALUES(`room_id`), `room_name` = VALUES(`room_name`), `branch` = VALUES(`branch`), `date` = VALUES(`date`), `time_slot` = VALUES(`time_slot`), `duration_hours` = VALUES(`duration_hours`), `purpose` = VALUES(`purpose`), `status` = VALUES(`status`), `check_in_code` = VALUES(`check_in_code`), `created_at` = VALUES(`created_at`);

-- ---------------------------------------------------------
-- Table structure for `acquisitions`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `acquisitions` (
  `id` varchar(50) NOT NULL,
  `title` varchar(500) NOT NULL,
  `author` varchar(255) NOT NULL,
  `publisher` varchar(255) DEFAULT NULL,
  `isbn` varchar(50) DEFAULT NULL,
  `department` varchar(150) DEFAULT NULL,
  `requested_by` varchar(255) DEFAULT NULL,
  `requester_role` varchar(100) DEFAULT NULL,
  `cost_estimate_ngn` decimal(12,2) DEFAULT NULL,
  `copies_requested` int(11) NOT NULL DEFAULT 1,
  `status` varchar(100) NOT NULL DEFAULT 'Pending Dean Approval',
  `date_requested` date DEFAULT NULL,
  `priority` varchar(50) NOT NULL DEFAULT 'High',
  `justification` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `acquisitions` (3 records)
INSERT INTO `acquisitions` (`id`, `title`, `author`, `publisher`, `isbn`, `department`, `requested_by`, `requester_role`, `cost_estimate_ngn`, `copies_requested`, `status`, `date_requested`, `priority`, `justification`) VALUES
  ('PO-2026-081', 'Modern Agro-Business Management (5 copies)', 'Academic Author', 'University Press Plc, Ibadan', '978-978-030-992-1', 'General', 'Head of Dept - AGR', 'Faculty', '175000.00', '1', 'Approved', '2026-09-14', 'High', 'Course curriculum requirement'),
  ('PO-2026-082', 'Cloud Native Microservices & Kubernetes (4 copies)', 'Academic Author', 'CSS Bookshops Ltd, Lagos', '978-0-13-549102-3', 'General', 'Dr. K. Okonjo - CSC', 'Faculty', '220000.00', '1', 'Under Review', '2026-09-16', 'High', 'Course curriculum requirement'),
  ('PO-2026-083', 'Nigerian Commercial Banking Compendium (10 copies)', 'Academic Author', 'Spectrum Books, Ring Road Ibadan', '978-978-8120-00-5', 'General', 'Mrs. Folake Sanusi - BNF', 'Faculty', '350000.00', '1', 'Delivered & Cataloged', '2026-09-02', 'High', 'Course curriculum requirement')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `author` = VALUES(`author`), `publisher` = VALUES(`publisher`), `isbn` = VALUES(`isbn`), `department` = VALUES(`department`), `requested_by` = VALUES(`requested_by`), `requester_role` = VALUES(`requester_role`), `cost_estimate_ngn` = VALUES(`cost_estimate_ngn`), `copies_requested` = VALUES(`copies_requested`), `status` = VALUES(`status`), `date_requested` = VALUES(`date_requested`), `priority` = VALUES(`priority`), `justification` = VALUES(`justification`);

-- ---------------------------------------------------------
-- Table structure for `partner_libraries`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `partner_libraries` (
  `id` varchar(50) NOT NULL,
  `institution` varchar(255) NOT NULL,
  `country` varchar(100) NOT NULL DEFAULT 'Nigeria',
  `opac_url` text NOT NULL,
  `z3950_host` varchar(255) DEFAULT NULL,
  `port` int(11) DEFAULT NULL,
  `database_name` varchar(100) DEFAULT NULL,
  `active_holdings` varchar(100) NOT NULL DEFAULT '0',
  `status` varchar(50) NOT NULL DEFAULT 'Connected',
  `sync_mode` varchar(100) NOT NULL DEFAULT 'Live Federated Search',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `partner_libraries` (6 records)
INSERT INTO `partner_libraries` (`id`, `institution`, `country`, `opac_url`, `z3950_host`, `port`, `database_name`, `active_holdings`, `status`, `sync_mode`) VALUES
  ('LIB-DOAB-06', 'DOAB — Directory of Open Access Books', 'Nigeria', 'https://www.doabooks.org/doab?func=search', 'opac.edu.ng', '210', 'OPAC', '85,000+ Academic Monographs', 'Active Interlink', 'Live Federated Search'),
  ('LIB-LOC-05', 'Library of Congress (LOC) Online Catalog', 'Nigeria', 'https://catalog.loc.gov', 'opac.edu.ng', '210', 'OPAC', '170,000,000+ Items', 'Active Interlink', 'Live Federated Search'),
  ('LIB-NAT-03', 'National Library of Nigeria (NLN)', 'Nigeria', 'https://opac.nln.gov.ng', 'opac.edu.ng', '210', 'OPAC', '5,000,000+ Records', 'Active Interlink', 'Live Federated Search'),
  ('LIB-OAU-02', 'Hezekiah Oluwasanmi Library — OAU Ile-Ife', 'Nigeria', 'https://library.oauife.edu.ng/opac', 'opac.edu.ng', '210', 'OPAC', '850,000+ Volumes', 'Active Interlink', 'Live Federated Search'),
  ('LIB-OPEN-04', 'OpenLibrary & Internet Archive', 'Nigeria', 'https://openlibrary.org/search', 'opac.edu.ng', '210', 'OPAC', '20,000,000+ eBooks', 'Active Interlink', 'Live Federated Search'),
  ('LIB-UI-01', 'Kenneth Dike Library — University of Ibadan', 'Nigeria', 'https://opac.ui.edu.ng/discovery', 'opac.edu.ng', '210', 'OPAC', '1,450,000+ Volumes', 'Active Interlink', 'Live Federated Search')
ON DUPLICATE KEY UPDATE `institution` = VALUES(`institution`), `country` = VALUES(`country`), `opac_url` = VALUES(`opac_url`), `z3950_host` = VALUES(`z3950_host`), `port` = VALUES(`port`), `database_name` = VALUES(`database_name`), `active_holdings` = VALUES(`active_holdings`), `status` = VALUES(`status`), `sync_mode` = VALUES(`sync_mode`);

-- ---------------------------------------------------------
-- Table structure for `reviews`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reviews` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_identifier` varchar(255) NOT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `book_id` varchar(50) NOT NULL,
  `comment` text NOT NULL,
  `rating` int(11) NOT NULL DEFAULT 5,
  `is_verified` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `reviews_user_identifier_index` (`user_identifier`),
  KEY `reviews_book_id_index` (`book_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `reviews` (3 records)
INSERT INTO `reviews` (`id`, `user_identifier`, `user_name`, `book_id`, `comment`, `rating`, `is_verified`, `created_at`, `updated_at`) VALUES
  ('1', 'FCC/CEM/2024/042', 'Wale Olonade', 'FCC-B001', 'Indispensable guide for understanding cooperative legal frameworks in West Africa. Well-organized and clear exposition.', '5', '1', '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('2', 'FCC/CSC/2024/115', 'Kareem T. Adeola', 'FCC-B002', 'Comprehensive textbook covering both traditional inverted index models and modern vector similarity architectures.', '5', '1', '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('3', 'FCC/BNF/2024/088', 'Fatima Bello', 'FCC-B003', 'Excellent empirical examples on Nigerian agricultural lending syndicates.', '4', '1', '2026-10-15 15:20:02', '2026-10-15 15:20:02')
ON DUPLICATE KEY UPDATE `user_identifier` = VALUES(`user_identifier`), `user_name` = VALUES(`user_name`), `book_id` = VALUES(`book_id`), `comment` = VALUES(`comment`), `rating` = VALUES(`rating`), `is_verified` = VALUES(`is_verified`), `created_at` = VALUES(`created_at`), `updated_at` = VALUES(`updated_at`);

-- ---------------------------------------------------------
-- Table structure for `reading_lists`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reading_lists` (
  `id` varchar(50) NOT NULL,
  `matric` varchar(100) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT 0,
  `item_count` int(11) NOT NULL DEFAULT 0,
  `items` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `reading_lists` (4 records)
INSERT INTO `reading_lists` (`id`, `matric`, `title`, `description`, `is_public`, `item_count`, `items`, `created_at`, `updated_at`) VALUES
  ('RL-001', 'FCC/CEM/2024/042', 'My Final Year Project (Fintech Cooperatives)', 'Core academic references on apex liquidity models and cooperative member equity accumulation.', '1', '3', '[{\"bookId\":\"FCC-B001\",\"notes\":\"Focus on Chapter 3 for apex syndicate formulas.\"},{\"bookId\":\"FCC-B006\",\"notes\":\"Review statutory audit requirements in Nigeria.\"},{\"bookId\":\"FCC-B003\",\"notes\":\"Compare Basel III ratios with Raiffeisen reserves.\"}]', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('RL-002', 'FCC/CEM/2024/042', 'Machine Learning & AI in Commerce', 'Exploration of vector retrieval algorithms and database architectures.', '0', '2', '[{\"bookId\":\"FCC-B005\",\"notes\":\"Important RAG pipeline concepts for AI librarian.\"}]', '2026-10-15 14:55:15', '2026-10-15 14:55:15'),
  ('RL-2026-001', 'FCC/CEM/2024/042', 'Cooperative Econometrics & Apex Syndication', 'Essential textbooks and reference treatises for HND II CEM coursework.', '1', '3', '[\"FCC-B001\",\"FCC-B003\",\"FCC-B005\"]', '2026-10-15 15:20:02', '2026-10-15 15:20:02'),
  ('RL-2026-002', 'FCC/CSC/2024/115', 'Full-Stack Machine Learning & Distributed Systems', 'Recommended curricula texts for Computing & Software Engineering.', '1', '2', '[\"FCC-B002\",\"FCC-B006\"]', '2026-10-15 15:20:02', '2026-10-15 15:20:02')
ON DUPLICATE KEY UPDATE `matric` = VALUES(`matric`), `title` = VALUES(`title`), `description` = VALUES(`description`), `is_public` = VALUES(`is_public`), `item_count` = VALUES(`item_count`), `items` = VALUES(`items`), `created_at` = VALUES(`created_at`), `updated_at` = VALUES(`updated_at`);

-- ---------------------------------------------------------
-- Table structure for `reading_list_items`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reading_list_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `reading_list_id` varchar(50) NOT NULL,
  `book_id` varchar(50) NOT NULL,
  `priority` int(11) NOT NULL DEFAULT 1,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `reading_list_items` (3 records)
INSERT INTO `reading_list_items` (`id`, `reading_list_id`, `book_id`, `priority`, `notes`, `created_at`) VALUES
  ('1', 'RL-2026-001', 'FCC-B001', '1', 'Chapters 3, 5, and 8 cover mandatory midterm exam topics.', '2026-10-15 15:20:02'),
  ('2', 'RL-2026-001', 'FCC-B003', '2', 'Case studies on microfinance syndicate structures.', '2026-10-15 15:20:02'),
  ('3', 'RL-2026-002', 'FCC-B002', '1', 'Information retrieval algorithms and indexing models.', '2026-10-15 15:20:02')
ON DUPLICATE KEY UPDATE `reading_list_id` = VALUES(`reading_list_id`), `book_id` = VALUES(`book_id`), `priority` = VALUES(`priority`), `notes` = VALUES(`notes`), `created_at` = VALUES(`created_at`);

-- ---------------------------------------------------------
-- Table structure for `favorites`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `favorites` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_identifier` varchar(100) NOT NULL,
  `book_id` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `favorites_user_book_unique` (`user_identifier`,`book_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `favorites` (3 records)
INSERT INTO `favorites` (`id`, `user_identifier`, `book_id`, `created_at`) VALUES
  ('1', 'FCC/2023/CSC/042', '1', '2026-10-15 15:26:57'),
  ('2', 'FCC/2023/CSC/042', '2', '2026-10-15 15:26:57'),
  ('3', 'admin', '1', '2026-10-15 15:26:57')
ON DUPLICATE KEY UPDATE `user_identifier` = VALUES(`user_identifier`), `book_id` = VALUES(`book_id`), `created_at` = VALUES(`created_at`);

-- ---------------------------------------------------------
-- Table structure for `continue_reading`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `continue_reading` (
  `id` varchar(100) NOT NULL,
  `matric` varchar(100) NOT NULL,
  `book_id` varchar(50) NOT NULL,
  `title` varchar(500) NOT NULL,
  `author` varchar(255) DEFAULT NULL,
  `last_page` int(11) NOT NULL DEFAULT 1,
  `total_pages` int(11) NOT NULL DEFAULT 1,
  `progress` int(11) NOT NULL DEFAULT 0,
  `last_opened` varchar(100) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `continue_reading` (3 records)
INSERT INTO `continue_reading` (`id`, `matric`, `book_id`, `title`, `author`, `last_page`, `total_pages`, `progress`, `last_opened`, `updated_at`) VALUES
  ('FCC/CEM/2024/042-FCC-B001', 'FCC/CEM/2024/042', 'FCC-B001', 'Principles and Practice of Co-operative Economics', 'Prof. A. O. Adebayo', '261', '384', '68', 'Today, 10:14 AM', '2026-10-15 14:55:15'),
  ('FCC/CEM/2024/042-FCC-B005', 'FCC/CEM/2024/042', 'FCC-B005', 'Artificial Intelligence in Academic Information Retrieval', 'Dr. O. J. Fatoyinbo', '151', '360', '42', 'Yesterday, 04:30 PM', '2026-10-15 14:55:15'),
  ('FCC/CEM/2024/042-FCC-B007', 'FCC/CEM/2024/042', 'FCC-B007', 'Advanced Computer Networks & Cloud Infrastructure', 'Prof. S. N. Varma', '120', '480', '25', '2 days ago', '2026-10-15 14:55:15')
ON DUPLICATE KEY UPDATE `matric` = VALUES(`matric`), `book_id` = VALUES(`book_id`), `title` = VALUES(`title`), `author` = VALUES(`author`), `last_page` = VALUES(`last_page`), `total_pages` = VALUES(`total_pages`), `progress` = VALUES(`progress`), `last_opened` = VALUES(`last_opened`), `updated_at` = VALUES(`updated_at`);

-- ---------------------------------------------------------
-- Table structure for `notifications`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` varchar(50) NOT NULL,
  `matric` varchar(100) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `date` varchar(50) DEFAULT NULL,
  `read` tinyint(1) NOT NULL DEFAULT 0,
  `action_url` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `notifications` (4 records)
INSERT INTO `notifications` (`id`, `matric`, `type`, `title`, `message`, `date`, `read`, `action_url`) VALUES
  ('NOTIF-001', 'FCC/CEM/2024/042', 'clearance', 'Convocation Library Clearance Audit', 'Your library borrower record has been verified. 0 overdue books and 0 outstanding fines recorded.', 'Today, 09:30 AM', '1', '/#/student/clearance'),
  ('NOTIF-002', 'FCC/CEM/2024/042', 'due_date', 'Loan Renewal Confirmation: FCC-B001', 'Your loan for \"Principles and Practice of Co-operative Economics\" has been extended by 14 days.', 'Yesterday, 02:15 PM', '1', '/#/student/loans'),
  ('NOTIF-003', 'all', 'announcement', 'Extended 24/7 Virtual Library Stacks', 'All enrolled ND and HND students can access full digital curriculum monographs 24/7.', '3 days ago', '0', '/#/opac'),
  ('NOTIF-004', 'FCC/CSC/2024/115', 'hold_ready', 'Reserved Book Ready on Hold Shelf', 'Your requested book \"Designing Data-Intensive Applications\" is ready for pickup at Circulation Desk.', '4 days ago', '0', '/#/student/reservations')
ON DUPLICATE KEY UPDATE `matric` = VALUES(`matric`), `type` = VALUES(`type`), `title` = VALUES(`title`), `message` = VALUES(`message`), `date` = VALUES(`date`), `read` = VALUES(`read`), `action_url` = VALUES(`action_url`);

-- ---------------------------------------------------------
-- Table structure for `notification_states`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notification_states` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `matric` varchar(100) NOT NULL,
  `notification_key` varchar(160) NOT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `dismissed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `notification_states_student_key_unique` (`matric`,`notification_key`),
  KEY `notification_states_student_dismissed_index` (`matric`,`dismissed_at`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `notification_states` (2 records)
INSERT INTO `notification_states` (`id`, `matric`, `notification_key`, `read_at`, `dismissed_at`, `created_at`, `updated_at`) VALUES
  ('1', 'FCC/2023/CSC/042', 'welcome_notification', '2026-10-15 15:26:57', NULL, '2026-10-15 15:26:57', '2026-10-15 15:26:57'),
  ('2', 'FCC/2023/CSC/042', 'exam_prep_collection', NULL, NULL, '2026-10-15 15:26:57', '2026-10-15 15:26:57')
ON DUPLICATE KEY UPDATE `matric` = VALUES(`matric`), `notification_key` = VALUES(`notification_key`), `read_at` = VALUES(`read_at`), `dismissed_at` = VALUES(`dismissed_at`), `created_at` = VALUES(`created_at`), `updated_at` = VALUES(`updated_at`);

-- ---------------------------------------------------------
-- Table structure for `cache`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Table structure for `cache_locks`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Table structure for `failed_jobs`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `failed_jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Table structure for `jobs`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) unsigned NOT NULL DEFAULT 0,
  `reserved_at` int(10) unsigned DEFAULT NULL,
  `available_at` int(10) unsigned NOT NULL,
  `created_at` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Table structure for `job_batches`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Table structure for `password_reset_tokens`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Table structure for `personal_access_tokens`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `personal_access_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) unsigned NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Table structure for `sessions`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Table structure for `migrations`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `migrations` (8 records)
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
  ('1', '0001_01_01_000000_create_users_table', '1'),
  ('2', '0001_01_01_000001_create_cache_table', '1'),
  ('3', '0001_01_01_000002_create_jobs_table', '1'),
  ('4', '2026_09_30_000001_create_library_apis_table', '1'),
  ('5', '2026_09_30_072239_create_personal_access_tokens_table', '1'),
  ('6', '2026_09_30_114028_create_departments_and_uploads_tables', '1'),
  ('7', '2026_09_30_135913_create_opac_normalized_enterprise_tables', '1'),
  ('8', '2026_09_30_160000_create_institutional_communications_table', '1')
ON DUPLICATE KEY UPDATE `migration` = VALUES(`migration`), `batch` = VALUES(`batch`);

SET FOREIGN_KEY_CHECKS = 1;
