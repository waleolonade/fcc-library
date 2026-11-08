-- =========================================================================
-- Federal Co-operative College, Ibadan - Multimedia Streaming Database DDL & Seeds
-- Compatible with MySQL 5.7+ / 8.0+ / MariaDB 10.3+ on cPanel Shared Hosting
-- =========================================================================

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `media_resources` (
  `id` varchar(60) NOT NULL,
  `title` varchar(500) NOT NULL,
  `subtitle` varchar(500) DEFAULT NULL,
  `media_type` varchar(30) NOT NULL,
  `resource_type` varchar(60) NOT NULL,
  `creator` varchar(255) NOT NULL,
  `creator_title` varchar(200) DEFAULT NULL,
  `department_id` varchar(60) DEFAULT NULL,
  `department_name` varchar(200) DEFAULT NULL,
  `course_code` varchar(60) DEFAULT NULL,
  `target_level` varchar(50) NOT NULL DEFAULT 'ND I',
  `semester` varchar(50) NOT NULL DEFAULT 'First Semester',
  `duration_seconds` int(11) NOT NULL DEFAULT 0,
  `duration_formatted` varchar(50) NOT NULL DEFAULT '00:00',
  `description` text DEFAULT NULL,
  `subject_keywords` text DEFAULT NULL,
  `language` varchar(60) NOT NULL DEFAULT 'English',
  `publication_date` varchar(50) DEFAULT NULL,
  `publisher` varchar(255) NOT NULL DEFAULT 'Federal Co-operative College Press & Digital Media Center',
  `call_number` varchar(100) NOT NULL DEFAULT 'FCC.MED',
  `shelf_location` varchar(150) NOT NULL DEFAULT 'Digital Media Repository / Streaming',
  `access_level` varchar(60) NOT NULL DEFAULT 'open_access',
  `license_type` varchar(150) NOT NULL DEFAULT 'CC-BY-NC-SA 4.0 Institutional',
  `copyright_owner` varchar(255) NOT NULL DEFAULT 'Federal Co-operative College, Ibadan',
  `cover_image` text DEFAULT NULL,
  `media_url` text DEFAULT NULL,
  `hls_manifest_url` text DEFAULT NULL,
  `download_allowed` tinyint(1) NOT NULL DEFAULT 0,
  `download_url` text DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `file_size_formatted` varchar(60) DEFAULT NULL,
  `file_size_bytes` bigint(20) NOT NULL DEFAULT 0,
  `video_resolution` varchar(40) DEFAULT NULL,
  `audio_bitrate` varchar(40) DEFAULT NULL,
  `companion_book_id` varchar(60) DEFAULT NULL,
  `companion_pdf_url` text DEFAULT NULL,
  `companion_pdf_title` varchar(255) DEFAULT NULL,
  `status` varchar(40) NOT NULL DEFAULT 'published',
  `view_count` bigint(20) NOT NULL DEFAULT 0,
  `play_count` bigint(20) NOT NULL DEFAULT 0,
  `rating` decimal(3,1) NOT NULL DEFAULT 4.9,
  `uploaded_by` varchar(255) NOT NULL DEFAULT 'FCC Media Librarian',
  `technical_metadata` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `media_chapters` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `media_resource_id` varchar(60) NOT NULL,
  `chapter_index` int(11) NOT NULL DEFAULT 1,
  `title` varchar(300) NOT NULL,
  `start_seconds` int(11) NOT NULL DEFAULT 0,
  `end_seconds` int(11) DEFAULT NULL,
  `timestamp_formatted` varchar(40) NOT NULL DEFAULT '00:00',
  `description` text DEFAULT NULL,
  `thumbnail_url` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `media_chapters_media_resource_id_index` (`media_resource_id`),
  CONSTRAINT `fk_media_chapters_resource` FOREIGN KEY (`media_resource_id`) REFERENCES `media_resources` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `media_transcripts` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `media_resource_id` varchar(60) NOT NULL,
  `language` varchar(30) NOT NULL DEFAULT 'en',
  `format` varchar(30) NOT NULL DEFAULT 'cues_json',
  `content` longtext DEFAULT NULL,
  `timed_cues` longtext DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `media_transcripts_media_resource_id_index` (`media_resource_id`),
  CONSTRAINT `fk_media_transcripts_resource` FOREIGN KEY (`media_resource_id`) REFERENCES `media_resources` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `media_progress` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_identifier` varchar(120) NOT NULL,
  `media_resource_id` varchar(60) NOT NULL,
  `last_position_seconds` int(11) NOT NULL DEFAULT 0,
  `total_duration_seconds` int(11) NOT NULL DEFAULT 0,
  `completion_percentage` int(11) NOT NULL DEFAULT 0,
  `completed` tinyint(1) NOT NULL DEFAULT 0,
  `last_accessed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `media_progress_user_resource_unique` (`user_identifier`,`media_resource_id`),
  KEY `media_progress_user_identifier_index` (`user_identifier`),
  KEY `media_progress_media_resource_id_index` (`media_resource_id`),
  CONSTRAINT `fk_media_progress_resource` FOREIGN KEY (`media_resource_id`) REFERENCES `media_resources` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `media_collections` (
  `id` varchar(60) NOT NULL,
  `title` varchar(300) NOT NULL,
  `slug` varchar(300) NOT NULL,
  `description` text DEFAULT NULL,
  `department_id` varchar(60) DEFAULT NULL,
  `department_name` varchar(200) DEFAULT NULL,
  `banner_image` text DEFAULT NULL,
  `curator_name` varchar(200) NOT NULL DEFAULT 'Central Media Directorate',
  `featured` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `media_collections_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `media_collection_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `collection_id` varchar(60) NOT NULL,
  `media_resource_id` varchar(60) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `media_coll_item_unique` (`collection_id`,`media_resource_id`),
  KEY `media_coll_items_collection_id_index` (`collection_id`),
  KEY `media_coll_items_resource_id_index` (`media_resource_id`),
  CONSTRAINT `fk_media_coll_items_col` FOREIGN KEY (`collection_id`) REFERENCES `media_collections` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_media_coll_items_res` FOREIGN KEY (`media_resource_id`) REFERENCES `media_resources` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table Data: media_resources
REPLACE INTO `media_resources` (`id`, `title`, `subtitle`, `media_type`, `resource_type`, `creator`, `creator_title`, `department_id`, `department_name`, `course_code`, `target_level`, `semester`, `duration_seconds`, `duration_formatted`, `description`, `subject_keywords`, `language`, `publication_date`, `publisher`, `call_number`, `shelf_location`, `access_level`, `license_type`, `copyright_owner`, `cover_image`, `media_url`, `hls_manifest_url`, `download_allowed`, `download_url`, `mime_type`, `file_size_formatted`, `file_size_bytes`, `video_resolution`, `audio_bitrate`, `companion_book_id`, `companion_pdf_url`, `companion_pdf_title`, `status`, `view_count`, `play_count`, `rating`, `uploaded_by`, `technical_metadata`, `created_at`, `updated_at`) VALUES ('MED-VID-CEM101', 'Principles and Practices of Co-operative Societies in West Africa', 'Comprehensive Lecture Series on Rochdale Principles & ICA Guidelines', 'video', 'lecture_recording', 'Dr. O. A. Babalola', 'Chief Lecturer & Head of Department', 'CEM', 'Co-operative Economics & Management', 'CEM 111', 'ND I', 'First Semester', 3120, '52:00', 'A master lecture delivered at the Central Auditorium of Federal Co-operative College, Ibadan. This lecture explores the origin of modern cooperative societies, the historic Rochdale Pioneers of 1844, and the practical application of open membership and democratic member control in Nigerian agricultural credit unions.', '[\"Co-operative Economics\",\"Rochdale Principles\",\"Credit Unions\",\"Agricultural Co-operatives\",\"CEM 111\"]', 'English', '2026-02-14', 'Federal Co-operative College Press & Media Directorate', 'FCC.MED.VID.CEM.01', 'Digital Audio-Visual Stacks / Stream Node A', 'open_access', 'CC-BY-NC-SA 4.0 Institutional Repository', 'Federal Co-operative College, Ibadan', 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80', 'https://media.w3.org/2010/05/sintel/trailer.mp4', NULL, 1, 'https://media.w3.org/2010/05/sintel/trailer.mp4', 'video/mp4', '245.8 MB', 257740800, '1080p Full HD', '192 kbps AAC', NULL, 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'Lecture Handout: Rochdale Principles & Cooperative Acts (PDF)', 'published', 1420, 985, 4.9, 'Dr. O. A. Babalola (HOD CEM)', NULL, '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_resources` (`id`, `title`, `subtitle`, `media_type`, `resource_type`, `creator`, `creator_title`, `department_id`, `department_name`, `course_code`, `target_level`, `semester`, `duration_seconds`, `duration_formatted`, `description`, `subject_keywords`, `language`, `publication_date`, `publisher`, `call_number`, `shelf_location`, `access_level`, `license_type`, `copyright_owner`, `cover_image`, `media_url`, `hls_manifest_url`, `download_allowed`, `download_url`, `mime_type`, `file_size_formatted`, `file_size_bytes`, `video_resolution`, `audio_bitrate`, `companion_book_id`, `companion_pdf_url`, `companion_pdf_title`, `status`, `view_count`, `play_count`, `rating`, `uploaded_by`, `technical_metadata`, `created_at`, `updated_at`) VALUES ('MED-VID-CSC201', 'Database Design & Relational Modeling: Normalization from 1NF to 3NF', 'Live Laboratory Workshop with MySQL & SQLite Schema Architectures', 'video', 'practical_demo', 'Engr. K. M. Balogun', 'Senior Lecturer in Computer Software Systems', 'CS', 'Computer Science', 'COM 212', 'ND II', 'First Semester', 2700, '45:00', 'Hands-on practical laboratory demonstration in Software Lab 2. Demonstrates the formal decomposition of unnormalized institutional databases into 1st, 2nd, and 3rd Normal Forms (1NF, 2NF, 3NF). Includes live queries, foreign key constraints, and indexing for high-concurrency systems.', '[\"Database Systems\",\"Normalization\",\"1NF 2NF 3NF\",\"MySQL\",\"Relational Algebra\",\"COM 212\"]', 'English', '2026-03-01', 'Department of Computer Science Software Studio', 'FCC.MED.VID.COM.02', 'Digital Audio-Visual Stacks / Stream Node B', 'open_access', 'CC-BY 4.0 Creative Commons', 'Federal Co-operative College, Ibadan', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80', 'https://media.w3.org/2010/05/video/movie_300.mp4', NULL, 1, 'https://media.w3.org/2010/05/video/movie_300.mp4', 'video/mp4', '189.4 MB', 198598400, '1080p Full HD', '192 kbps AAC', NULL, 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'Lab Worksheets: Normalization Drills & SQL Solutions (PDF)', 'published', 2184, 1840, 5, 'Engr. K. M. Balogun (Computer Science)', NULL, '2026-11-06 21:55:40', '2026-11-08 17:28:55');
REPLACE INTO `media_resources` (`id`, `title`, `subtitle`, `media_type`, `resource_type`, `creator`, `creator_title`, `department_id`, `department_name`, `course_code`, `target_level`, `semester`, `duration_seconds`, `duration_formatted`, `description`, `subject_keywords`, `language`, `publication_date`, `publisher`, `call_number`, `shelf_location`, `access_level`, `license_type`, `copyright_owner`, `cover_image`, `media_url`, `hls_manifest_url`, `download_allowed`, `download_url`, `mime_type`, `file_size_formatted`, `file_size_bytes`, `video_resolution`, `audio_bitrate`, `companion_book_id`, `companion_pdf_url`, `companion_pdf_title`, `status`, `view_count`, `play_count`, `rating`, `uploaded_by`, `technical_metadata`, `created_at`, `updated_at`) VALUES ('MED-VID-AGR102', 'Soil Sampling, pH Testing & Precision Organic Fertilization Field Demonstration', 'Farm Practical Training at the FCC Teaching & Research Demonstration Farm', 'video', 'practical_demo', 'Dr. (Mrs) F. T. Adeyemi', 'Associate Professor of Agronomy & Crop Science', 'AGR', 'Agricultural Extension & Management', 'AGR 121', 'ND I', 'Second Semester', 1980, '33:00', 'Recorded live at the Federal Co-operative College Teaching and Research Farm in Eleyele, Ibadan. Demonstrates core field techniques including auger soil core extraction, composite sampling, colorimetric pH test kit usage, and organic compost application rates for tropical root crops and maize.', '[\"Soil Testing\",\"Agronomy\",\"Organic Fertilizer\",\"Field Practical\",\"AGR 121\"]', 'English', '2026-01-20', 'FCC Farm Research Unit & Media Center', 'FCC.MED.VID.AGR.03', 'Digital Audio-Visual Stacks / Stream Node A', 'open_access', 'CC-BY-NC 4.0', 'Federal Co-operative College, Ibadan', 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=800&auto=format&fit=crop&q=80', 'https://vjs.zencdn.net/v/oceans.mp4', NULL, 1, 'https://vjs.zencdn.net/v/oceans.mp4', 'video/mp4', '142.1 MB', 149012480, '1080p Full HD', '192 kbps AAC', NULL, 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'Field Manual: Soil Testing Standards & Fertilizer Calibrations (PDF)', 'published', 960, 740, 4.8, 'Dr. (Mrs) F. T. Adeyemi (Agric Extension)', NULL, '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_resources` (`id`, `title`, `subtitle`, `media_type`, `resource_type`, `creator`, `creator_title`, `department_id`, `department_name`, `course_code`, `target_level`, `semester`, `duration_seconds`, `duration_formatted`, `description`, `subject_keywords`, `language`, `publication_date`, `publisher`, `call_number`, `shelf_location`, `access_level`, `license_type`, `copyright_owner`, `cover_image`, `media_url`, `hls_manifest_url`, `download_allowed`, `download_url`, `mime_type`, `file_size_formatted`, `file_size_bytes`, `video_resolution`, `audio_bitrate`, `companion_book_id`, `companion_pdf_url`, `companion_pdf_title`, `status`, `view_count`, `play_count`, `rating`, `uploaded_by`, `technical_metadata`, `created_at`, `updated_at`) VALUES ('MED-AUD-BFN101', 'Monetary Policy, Central Banking and Microfinance Intermediation in Nigeria', 'Institutional Audio Edition with Chapter Commentary and Financial Glossary', 'audio', 'audiobook', 'Prof. S. K. Alabi & Dr. Y. O. Oladipo', 'Visiting Professor of Banking & Financial Economics', 'BFN', 'Banking & Finance', 'BFN 211', 'ND II', 'First Semester', 4500, '01:15:00', 'Complete institutional audio edition narrated by the authors for students and distance learners. Covers the regulatory architecture of the Central Bank of Nigeria (CBN), monetary policy transmission mechanisms, cash reserve ratio (CRR), open market operations (OMO), and the pivotal role of microfinance banks in rural financial inclusion.', '[\"Monetary Policy\",\"Central Bank of Nigeria\",\"Microfinance\",\"Banking Operations\",\"Financial Inclusion\",\"BFN 211\"]', 'English', '2026-02-01', 'Federal Co-operative College Academic Audio Press', 'FCC.MED.AUD.BFN.01', 'Digital Audio Stacks / Audiobook Node 1', 'open_access', 'CC-BY-NC-ND 4.0 Institutional', 'Federal Co-operative College, Ibadan', 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=80', 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3', NULL, 1, 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3', 'audio/mpeg', '68.7 MB', 72040000, NULL, '192 kbps MP3', NULL, 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'Audiobook Companion Notes & CBN Monetary Guidelines (PDF)', 'published', 1780, 1340, 4.9, 'FCC Banking & Finance Directorate', NULL, '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_resources` (`id`, `title`, `subtitle`, `media_type`, `resource_type`, `creator`, `creator_title`, `department_id`, `department_name`, `course_code`, `target_level`, `semester`, `duration_seconds`, `duration_formatted`, `description`, `subject_keywords`, `language`, `publication_date`, `publisher`, `call_number`, `shelf_location`, `access_level`, `license_type`, `copyright_owner`, `cover_image`, `media_url`, `hls_manifest_url`, `download_allowed`, `download_url`, `mime_type`, `file_size_formatted`, `file_size_bytes`, `video_resolution`, `audio_bitrate`, `companion_book_id`, `companion_pdf_url`, `companion_pdf_title`, `status`, `view_count`, `play_count`, `rating`, `uploaded_by`, `technical_metadata`, `created_at`, `updated_at`) VALUES ('MED-AUD-SEM201', 'Oral History of the Nigerian Co-operative Movement: 1935 to Independence', 'Archival Interviews with Veteran Cooperative Registrars & Union Pioneers', 'audio', 'podcast', 'FCC Oral History & Archives Consortium', 'Institutional Archival Research Fellow', 'CEM', 'Co-operative Economics & Management', 'CEM 221', 'HND I', 'First Semester', 3300, '55:00', 'A landmark documentary audio recording capturing primary source testimonies of early cocoa marketing unions in Ibadan, Abeokuta, and Ondo State. Essential historical context for students researching the institutional foundations of cooperative law in Western Nigeria.', '[\"Oral History\",\"Cocoa Co-operatives\",\"Western Nigeria\",\"Cooperative Law\",\"Archival Audio\"]', 'English', '2026-02-28', 'Federal Co-operative College Oral History Archives', 'FCC.MED.AUD.HIS.02', 'Digital Audio Stacks / Archival Oral Node', 'open_access', 'CC-BY-NC-ND 4.0', 'Federal Co-operative College, Ibadan', 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&auto=format&fit=crop&q=80', 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3', NULL, 1, 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3', 'audio/mpeg', '50.4 MB', 52848230, NULL, '128 kbps MP3', NULL, 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'Archival Transcript & Historical Cooperative Acts 1935 (PDF)', 'published', 840, 610, 4.9, 'FCC Archives & Heritage Unit', NULL, '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_resources` (`id`, `title`, `subtitle`, `media_type`, `resource_type`, `creator`, `creator_title`, `department_id`, `department_name`, `course_code`, `target_level`, `semester`, `duration_seconds`, `duration_formatted`, `description`, `subject_keywords`, `language`, `publication_date`, `publisher`, `call_number`, `shelf_location`, `access_level`, `license_type`, `copyright_owner`, `cover_image`, `media_url`, `hls_manifest_url`, `download_allowed`, `download_url`, `mime_type`, `file_size_formatted`, `file_size_bytes`, `video_resolution`, `audio_bitrate`, `companion_book_id`, `companion_pdf_url`, `companion_pdf_title`, `status`, `view_count`, `play_count`, `rating`, `uploaded_by`, `technical_metadata`, `created_at`, `updated_at`) VALUES ('MED-VID-DOC301', 'From Bean to Export: The Cocoa Value Chain and Smallholder Cooperatives in Nigeria', 'Institutional Documentary on Post-Harvest Processing, Quality Grading & Export Logistics', 'video', 'documentary', 'FCC Directorate of Agribusiness & Media Productions', 'Documentary Film Crew & Faculty of Agriculture', 'AGR', 'Agricultural Extension & Management', 'AGR 222', 'HND II', 'Second Semester', 2400, '40:00', 'A professionally filmed educational documentary covering the complete agricultural value chain of cocoa in South-Western Nigeria. Demonstrates modern pod breaking, fermentation box techniques, solar drying tables, moisture content meters (target 7.5%), defect grading, and direct export through cooperative federation terminals.', '[\"Cocoa Processing\",\"Agri-Business\",\"Value Chain\",\"Export Standards\",\"Commodity Trading\",\"AGR 222\"]', 'English', '2026-03-10', 'Federal Co-operative College Agribusiness Documentation Unit', 'FCC.MED.VID.DOC.04', 'Digital Audio-Visual Stacks / Stream Node C', 'open_access', 'CC-BY-NC 4.0', 'Federal Co-operative College, Ibadan', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80', 'https://media.w3.org/2010/05/bunny/trailer.mp4', NULL, 1, 'https://media.w3.org/2010/05/bunny/trailer.mp4', 'video/mp4', '210.5 MB', 220725248, '1080p Full HD', '192 kbps AAC', NULL, 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'Export Quality Specifications & Grading Chart (PDF)', 'published', 1652, 1290, 4.9, 'FCC Agribusiness Media Unit', NULL, '2026-11-06 21:55:40', '2026-11-08 17:29:39');


-- Table Data: media_chapters
REPLACE INTO `media_chapters` (`id`, `media_resource_id`, `chapter_index`, `title`, `start_seconds`, `end_seconds`, `timestamp_formatted`, `description`, `thumbnail_url`, `created_at`, `updated_at`) VALUES ('1', 'MED-VID-CEM101', 1, '1. Introduction: Historical Genesis of Cooperation', '0', 540, '00:00', 'Industrial revolution background and community self-reliance.', NULL, '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_chapters` (`id`, `media_resource_id`, `chapter_index`, `title`, `start_seconds`, `end_seconds`, `timestamp_formatted`, `description`, `thumbnail_url`, `created_at`, `updated_at`) VALUES ('2', 'MED-VID-CEM101', 2, '2. The Rochdale Equitable Pioneers Society (1844)', 540, 1320, '09:00', '7 fundamental tenets and democratic control model.', NULL, '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_chapters` (`id`, `media_resource_id`, `chapter_index`, `title`, `start_seconds`, `end_seconds`, `timestamp_formatted`, `description`, `thumbnail_url`, `created_at`, `updated_at`) VALUES ('3', 'MED-VID-CEM101', 3, '3. Dual Nature of Co-operative Enterprises', 1320, 2100, '22:00', 'Social association vs business enterprise operations.', NULL, '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_chapters` (`id`, `media_resource_id`, `chapter_index`, `title`, `start_seconds`, `end_seconds`, `timestamp_formatted`, `description`, `thumbnail_url`, `created_at`, `updated_at`) VALUES ('4', 'MED-VID-CEM101', 4, '4. Application in Contemporary Nigerian Economy', 2100, 2700, '35:00', 'Thrift & credit co-ops in Oyo, Ogun, and Lagos States.', NULL, '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_chapters` (`id`, `media_resource_id`, `chapter_index`, `title`, `start_seconds`, `end_seconds`, `timestamp_formatted`, `description`, `thumbnail_url`, `created_at`, `updated_at`) VALUES ('5', 'MED-VID-CEM101', 5, '5. Q&A and Key Takeaways for Examination', 2700, 3120, '45:00', 'Exam question breakdown and seminar topics.', NULL, '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_chapters` (`id`, `media_resource_id`, `chapter_index`, `title`, `start_seconds`, `end_seconds`, `timestamp_formatted`, `description`, `thumbnail_url`, `created_at`, `updated_at`) VALUES ('6', 'MED-VID-CSC201', 1, '1. Overview of Anomalies (Insert, Update, Delete)', '0', 480, '00:00', 'Why denormalized tables fail under production loads.', NULL, '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_chapters` (`id`, `media_resource_id`, `chapter_index`, `title`, `start_seconds`, `end_seconds`, `timestamp_formatted`, `description`, `thumbnail_url`, `created_at`, `updated_at`) VALUES ('7', 'MED-VID-CSC201', 2, '2. First Normal Form (1NF): Atomic Attributes', 480, 1020, '08:00', 'Eliminating repeating groups and multi-valued fields.', NULL, '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_chapters` (`id`, `media_resource_id`, `chapter_index`, `title`, `start_seconds`, `end_seconds`, `timestamp_formatted`, `description`, `thumbnail_url`, `created_at`, `updated_at`) VALUES ('8', 'MED-VID-CSC201', 3, '3. Second Normal Form (2NF): Full Functional Dependency', 1020, 1680, '17:00', 'Removing partial dependency on composite primary keys.', NULL, '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_chapters` (`id`, `media_resource_id`, `chapter_index`, `title`, `start_seconds`, `end_seconds`, `timestamp_formatted`, `description`, `thumbnail_url`, `created_at`, `updated_at`) VALUES ('9', 'MED-VID-CSC201', 4, '4. Third Normal Form (3NF): Transitive Dependencies', 1680, 2280, '28:00', 'Non-key attributes determining other non-key attributes.', NULL, '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_chapters` (`id`, `media_resource_id`, `chapter_index`, `title`, `start_seconds`, `end_seconds`, `timestamp_formatted`, `description`, `thumbnail_url`, `created_at`, `updated_at`) VALUES ('10', 'MED-VID-CSC201', 5, '5. Live Verification with MySQL Workbench', 2280, 2700, '38:00', 'Testing schema queries, joins, and indexing performance.', NULL, '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_chapters` (`id`, `media_resource_id`, `chapter_index`, `title`, `start_seconds`, `end_seconds`, `timestamp_formatted`, `description`, `thumbnail_url`, `created_at`, `updated_at`) VALUES ('11', 'MED-VID-AGR102', 1, '1. Safety & Field Instrument Preparation', '0', 300, '00:00', 'Soil auger, clean sample bags, and labeling protocol.', NULL, '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_chapters` (`id`, `media_resource_id`, `chapter_index`, `title`, `start_seconds`, `end_seconds`, `timestamp_formatted`, `description`, `thumbnail_url`, `created_at`, `updated_at`) VALUES ('12', 'MED-VID-AGR102', 2, '2. Zig-Zag Sampling Pattern Demonstration', 300, 720, '05:00', 'Taking 15 core samples across a 2-hectare plot.', NULL, '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_chapters` (`id`, `media_resource_id`, `chapter_index`, `title`, `start_seconds`, `end_seconds`, `timestamp_formatted`, `description`, `thumbnail_url`, `created_at`, `updated_at`) VALUES ('13', 'MED-VID-AGR102', 3, '3. Soil pH and Texture Quick Test in Field', 720, 1260, '12:00', 'Using standard distilled water and color comparator.', NULL, '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_chapters` (`id`, `media_resource_id`, `chapter_index`, `title`, `start_seconds`, `end_seconds`, `timestamp_formatted`, `description`, `thumbnail_url`, `created_at`, `updated_at`) VALUES ('14', 'MED-VID-AGR102', 4, '4. Organic Bio-Fertilizer Mixing and Dosage', 1260, 1680, '21:00', 'Application per square meter for maize and cassava.', NULL, '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_chapters` (`id`, `media_resource_id`, `chapter_index`, `title`, `start_seconds`, `end_seconds`, `timestamp_formatted`, `description`, `thumbnail_url`, `created_at`, `updated_at`) VALUES ('15', 'MED-VID-AGR102', 5, '5. Recording Observations & Student Practical Tasks', 1680, 1980, '28:00', 'Field logbook preparation and submission guidelines.', NULL, '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_chapters` (`id`, `media_resource_id`, `chapter_index`, `title`, `start_seconds`, `end_seconds`, `timestamp_formatted`, `description`, `thumbnail_url`, `created_at`, `updated_at`) VALUES ('16', 'MED-AUD-BFN101', 1, 'Chapter 1: The Evolution of Central Banking in Nigeria', '0', 900, '00:00', 'From West African Currency Board to CBN Act of 1958.', NULL, '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_chapters` (`id`, `media_resource_id`, `chapter_index`, `title`, `start_seconds`, `end_seconds`, `timestamp_formatted`, `description`, `thumbnail_url`, `created_at`, `updated_at`) VALUES ('17', 'MED-AUD-BFN101', 2, 'Chapter 2: Instruments of Monetary Policy (MPR, CRR, OMO)', 900, 1800, '15:00', 'Direct and indirect mechanisms for controlling liquidity.', NULL, '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_chapters` (`id`, `media_resource_id`, `chapter_index`, `title`, `start_seconds`, `end_seconds`, `timestamp_formatted`, `description`, `thumbnail_url`, `created_at`, `updated_at`) VALUES ('18', 'MED-AUD-BFN101', 3, 'Chapter 3: Inflation Targeting vs Exchange Rate Stability', 1800, 2700, '30:00', 'Managing foreign exchange reserves and price indices.', NULL, '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_chapters` (`id`, `media_resource_id`, `chapter_index`, `title`, `start_seconds`, `end_seconds`, `timestamp_formatted`, `description`, `thumbnail_url`, `created_at`, `updated_at`) VALUES ('19', 'MED-AUD-BFN101', 4, 'Chapter 4: Microfinance Regulatory Architecture', 2700, 3600, '45:00', 'Unit, State, and National Microfinance Banks under BOFIA.', NULL, '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_chapters` (`id`, `media_resource_id`, `chapter_index`, `title`, `start_seconds`, `end_seconds`, `timestamp_formatted`, `description`, `thumbnail_url`, `created_at`, `updated_at`) VALUES ('20', 'MED-AUD-BFN101', 5, 'Chapter 5: Digital Payments & Fintech Intermediation', 3600, 4500, '60:00', 'NIBSS instant payment, mobile money, and cooperative apex wallets.', NULL, '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_chapters` (`id`, `media_resource_id`, `chapter_index`, `title`, `start_seconds`, `end_seconds`, `timestamp_formatted`, `description`, `thumbnail_url`, `created_at`, `updated_at`) VALUES ('21', 'MED-AUD-SEM201', 1, '1. Introduction: The 1935 Cooperative Ordinance', '0', 600, '00:00', 'Strickland report and the legal birth of Nigerian cooperatives.', NULL, '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_chapters` (`id`, `media_resource_id`, `chapter_index`, `title`, `start_seconds`, `end_seconds`, `timestamp_formatted`, `description`, `thumbnail_url`, `created_at`, `updated_at`) VALUES ('22', 'MED-AUD-SEM201', 2, '2. Ibadan Co-operative Produce Marketing Union', 600, 1500, '10:00', 'Primary testimonies from veteran cocoa farmers and warehouse scribes.', NULL, '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_chapters` (`id`, `media_resource_id`, `chapter_index`, `title`, `start_seconds`, `end_seconds`, `timestamp_formatted`, `description`, `thumbnail_url`, `created_at`, `updated_at`) VALUES ('23', 'MED-AUD-SEM201', 3, '3. The Cooperative Bank of Western Nigeria (1953)', 1500, 2400, '25:00', 'How smallholder farmer savings built the Cocoa House skyscraper.', NULL, '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_chapters` (`id`, `media_resource_id`, `chapter_index`, `title`, `start_seconds`, `end_seconds`, `timestamp_formatted`, `description`, `thumbnail_url`, `created_at`, `updated_at`) VALUES ('24', 'MED-AUD-SEM201', 4, '4. Epilogue: Preserving Indigenous Economic Democracy', 2400, 3300, '40:00', 'Reflections for modern cooperative business managers.', NULL, '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_chapters` (`id`, `media_resource_id`, `chapter_index`, `title`, `start_seconds`, `end_seconds`, `timestamp_formatted`, `description`, `thumbnail_url`, `created_at`, `updated_at`) VALUES ('25', 'MED-VID-DOC301', 1, '1. Pod Harvesting & Hygiene', '0', 420, '00:00', 'Selecting ripe pods and preventing black pod fungal spread.', NULL, '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_chapters` (`id`, `media_resource_id`, `chapter_index`, `title`, `start_seconds`, `end_seconds`, `timestamp_formatted`, `description`, `thumbnail_url`, `created_at`, `updated_at`) VALUES ('26', 'MED-VID-DOC301', 2, '2. Tiered Wooden Box Fermentation (6-Day Cycle)', 420, 960, '07:00', 'Chemical transformations that create chocolate flavor precursors.', NULL, '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_chapters` (`id`, `media_resource_id`, `chapter_index`, `title`, `start_seconds`, `end_seconds`, `timestamp_formatted`, `description`, `thumbnail_url`, `created_at`, `updated_at`) VALUES ('27', 'MED-VID-DOC301', 3, '3. Raised Table Solar Drying & Moisture Control', 960, 1500, '16:00', 'Drying to 7.5% moisture and preventing mould contamination.', NULL, '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_chapters` (`id`, `media_resource_id`, `chapter_index`, `title`, `start_seconds`, `end_seconds`, `timestamp_formatted`, `description`, `thumbnail_url`, `created_at`, `updated_at`) VALUES ('28', 'MED-VID-DOC301', 4, '4. Quality Grading by Government Produce Inspectors', 1500, 1980, '25:00', 'Cut-test standards: Main crop vs Light crop grading.', NULL, '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_chapters` (`id`, `media_resource_id`, `chapter_index`, `title`, `start_seconds`, `end_seconds`, `timestamp_formatted`, `description`, `thumbnail_url`, `created_at`, `updated_at`) VALUES ('29', 'MED-VID-DOC301', 5, '5. Cooperative Warehouse Warehousing & Traceability', 1980, 2400, '33:00', 'Fairtrade certification and export container stuffing.', NULL, '2026-11-06 21:55:40', '2026-11-06 21:55:40');


-- Table Data: media_transcripts
REPLACE INTO `media_transcripts` (`id`, `media_resource_id`, `language`, `format`, `content`, `timed_cues`, `created_at`, `updated_at`) VALUES ('1', 'MED-VID-CEM101', 'en', 'cues_json', '[0s - 15s] Good morning students, welcome to CEM 111 Principles and Practices of Co-operative Societies.
[15s - 45s] Today we begin our comprehensive inquiry into the historic Rochdale Pioneers of 1844.
[45s - 90s] A co-operative is not merely a trading company; it is an autonomous association of persons united voluntarily.
[90s - 140s] Notice the seven core ICA principles: voluntary and open membership, and democratic member control.
[140s - 200s] In Nigeria, agricultural marketing co-operatives have historically bridged the gap between farm gate prices and retail markets.', '[{\"start\":0,\"end\":15,\"text\":\"Good morning students, welcome to CEM 111 Principles and Practices of Co-operative Societies.\"},{\"start\":15,\"end\":45,\"text\":\"Today we begin our comprehensive inquiry into the historic Rochdale Pioneers of 1844.\"},{\"start\":45,\"end\":90,\"text\":\"A co-operative is not merely a trading company; it is an autonomous association of persons united voluntarily.\"},{\"start\":90,\"end\":140,\"text\":\"Notice the seven core ICA principles: voluntary and open membership, and democratic member control.\"},{\"start\":140,\"end\":200,\"text\":\"In Nigeria, agricultural marketing co-operatives have historically bridged the gap between farm gate prices and retail markets.\"}]', '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_transcripts` (`id`, `media_resource_id`, `language`, `format`, `content`, `timed_cues`, `created_at`, `updated_at`) VALUES ('2', 'MED-VID-CSC201', 'en', 'cues_json', '[0s - 20s] Welcome to COM 212 Database Design Laboratory Workshop.
[20s - 50s] In this practical tutorial, we will take an unnormalized spreadsheet of library loans and decompose it.
[50s - 110s] Notice how storing multiple author names in a single cell violates 1NF atomicity.
[110s - 170s] By extracting authors into their own relation with a foreign key, we attain Second Normal Form.', '[{\"start\":0,\"end\":20,\"text\":\"Welcome to COM 212 Database Design Laboratory Workshop.\"},{\"start\":20,\"end\":50,\"text\":\"In this practical tutorial, we will take an unnormalized spreadsheet of library loans and decompose it.\"},{\"start\":50,\"end\":110,\"text\":\"Notice how storing multiple author names in a single cell violates 1NF atomicity.\"},{\"start\":110,\"end\":170,\"text\":\"By extracting authors into their own relation with a foreign key, we attain Second Normal Form.\"}]', '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_transcripts` (`id`, `media_resource_id`, `language`, `format`, `content`, `timed_cues`, `created_at`, `updated_at`) VALUES ('3', 'MED-VID-AGR102', 'en', 'cues_json', '[0s - 25s] Good day students, we are live at the FCC Experimental Farm here in Ibadan for AGR 121 practicals.
[25s - 60s] Before you apply any fertilizer, you must first know the pH and nutrient status of your soil.
[60s - 120s] Notice the zig-zag sampling method to ensure representative composite analysis.', '[{\"start\":0,\"end\":25,\"text\":\"Good day students, we are live at the FCC Experimental Farm here in Ibadan for AGR 121 practicals.\"},{\"start\":25,\"end\":60,\"text\":\"Before you apply any fertilizer, you must first know the pH and nutrient status of your soil.\"},{\"start\":60,\"end\":120,\"text\":\"Notice the zig-zag sampling method to ensure representative composite analysis.\"}]', '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_transcripts` (`id`, `media_resource_id`, `language`, `format`, `content`, `timed_cues`, `created_at`, `updated_at`) VALUES ('4', 'MED-AUD-BFN101', 'en', 'cues_json', '[0s - 25s] Welcome to the audio edition of Monetary Policy and Microfinance Intermediation in Nigeria.
[25s - 60s] Chapter One: The historic emergence of the Central Bank of Nigeria following the 1957 Loynes Commission report.
[60s - 120s] Prior to 1958, the West African Currency Board operated purely as an automatic money changer with 100% sterling reserves.', '[{\"start\":0,\"end\":25,\"text\":\"Welcome to the audio edition of Monetary Policy and Microfinance Intermediation in Nigeria.\"},{\"start\":25,\"end\":60,\"text\":\"Chapter One: The historic emergence of the Central Bank of Nigeria following the 1957 Loynes Commission report.\"},{\"start\":60,\"end\":120,\"text\":\"Prior to 1958, the West African Currency Board operated purely as an automatic money changer with 100% sterling reserves.\"}]', '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_transcripts` (`id`, `media_resource_id`, `language`, `format`, `content`, `timed_cues`, `created_at`, `updated_at`) VALUES ('5', 'MED-AUD-SEM201', 'en', 'cues_json', '[0s - 30s] This is the Federal Co-operative College Oral History Series, Tape Number 14.
[30s - 70s] Today we are documenting the firsthand memories of Pa Samuel Adelaja who joined the Gbedun Cocoa Marketing Co-op in 1948.', '[{\"start\":0,\"end\":30,\"text\":\"This is the Federal Co-operative College Oral History Series, Tape Number 14.\"},{\"start\":30,\"end\":70,\"text\":\"Today we are documenting the firsthand memories of Pa Samuel Adelaja who joined the Gbedun Cocoa Marketing Co-op in 1948.\"}]', '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_transcripts` (`id`, `media_resource_id`, `language`, `format`, `content`, `timed_cues`, `created_at`, `updated_at`) VALUES ('6', 'MED-VID-DOC301', 'en', 'cues_json', '[0s - 25s] Cocoa has remained the economic backbone of rural families across South-Western Nigeria for generations.
[25s - 60s] In this documentary, we follow the harvest from the farm gate in Idanre to the export terminal in Lagos.', '[{\"start\":0,\"end\":25,\"text\":\"Cocoa has remained the economic backbone of rural families across South-Western Nigeria for generations.\"},{\"start\":25,\"end\":60,\"text\":\"In this documentary, we follow the harvest from the farm gate in Idanre to the export terminal in Lagos.\"}]', '2026-11-06 21:55:40', '2026-11-06 21:55:40');


-- Table Data: media_collections
REPLACE INTO `media_collections` (`id`, `title`, `slug`, `description`, `department_id`, `department_name`, `banner_image`, `curator_name`, `featured`, `sort_order`, `created_at`, `updated_at`) VALUES ('COL-VID-MASTERCLASSES', 'ND I & ND II Video Masterclasses (2025/2026 Academic Session)', 'nd-video-masterclasses', 'Flagship recorded lectures and practical laboratory workshops prepared by Chief Lecturers for Federal Co-operative College diploma candidates.', NULL, 'Academic Affairs & Directorate of Studies', 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&auto=format&fit=crop&q=80', 'Academic Affairs Directorate', 1, 1, '2026-11-06 21:55:40', '2026-11-06 21:55:40');
REPLACE INTO `media_collections` (`id`, `title`, `slug`, `description`, `department_id`, `department_name`, `banner_image`, `curator_name`, `featured`, `sort_order`, `created_at`, `updated_at`) VALUES ('COL-AUD-CLASSICS', 'Audiobook & Oral History Archive', 'audiobooks-oral-history', 'Complete institutional audiobooks, oral histories of the early Western Nigeria cooperative movement, and finance audio guides.', NULL, 'Library Directorate & Heritage Unit', 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1200&auto=format&fit=crop&q=80', 'Chief Librarian & Archives Staff', 1, 2, '2026-11-06 21:55:40', '2026-11-06 21:55:40');


-- Table Data: media_collection_items
REPLACE INTO `media_collection_items` (`id`, `collection_id`, `media_resource_id`, `sort_order`, `created_at`, `updated_at`) VALUES ('1', 'COL-VID-MASTERCLASSES', 'MED-VID-CEM101', '0', NULL, NULL);
REPLACE INTO `media_collection_items` (`id`, `collection_id`, `media_resource_id`, `sort_order`, `created_at`, `updated_at`) VALUES ('2', 'COL-VID-MASTERCLASSES', 'MED-VID-CSC201', '0', NULL, NULL);
REPLACE INTO `media_collection_items` (`id`, `collection_id`, `media_resource_id`, `sort_order`, `created_at`, `updated_at`) VALUES ('3', 'COL-VID-MASTERCLASSES', 'MED-VID-AGR102', '0', NULL, NULL);
REPLACE INTO `media_collection_items` (`id`, `collection_id`, `media_resource_id`, `sort_order`, `created_at`, `updated_at`) VALUES ('4', 'COL-AUD-CLASSICS', 'MED-AUD-BFN101', '0', NULL, NULL);
REPLACE INTO `media_collection_items` (`id`, `collection_id`, `media_resource_id`, `sort_order`, `created_at`, `updated_at`) VALUES ('5', 'COL-AUD-CLASSICS', 'MED-AUD-SEM201', '0', NULL, NULL);
REPLACE INTO `media_collection_items` (`id`, `collection_id`, `media_resource_id`, `sort_order`, `created_at`, `updated_at`) VALUES ('6', 'COL-AUD-CLASSICS', 'MED-VID-DOC301', '0', NULL, NULL);


SET FOREIGN_KEY_CHECKS = 1;
