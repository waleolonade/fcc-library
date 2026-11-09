<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\MediaResource;
use App\Services\DatabaseService;
use App\Services\StudentUserService;
use Carbon\Carbon;

class LiveBroadcastController extends Controller
{
    private static bool $tablesVerified = false;

    /**
     * Ensure live broadcast tables exist in both Laravel's default DB (SQLite/MySQL)
     * and the authoritative MySQL database (gsashtub_brainfeels_library).
     */
    private function ensureDatabaseTables(): void
    {
        if (self::$tablesVerified) {
            return;
        }
        $pdoCheck = DatabaseService::getPdo();
        $flagFile = storage_path('app/live_tables_v5_' . ($pdoCheck ? 'mysql' : 'sqlite') . '.ready');
        if (file_exists($flagFile) && (time() - filemtime($flagFile) < 3600)) {
            self::$tablesVerified = true;
            return;
        }

        // 1. Ensure SQLite / Laravel default DB tables & columns exist
        try {
            DB::statement("
                CREATE TABLE IF NOT EXISTS live_broadcasts (
                    id VARCHAR(80) PRIMARY KEY,
                    title VARCHAR(500) NOT NULL,
                    department_code VARCHAR(30) DEFAULT 'CEM',
                    department_name VARCHAR(200) DEFAULT 'Co-operative Economics & Management',
                    course_code VARCHAR(60) NULL,
                    course_title VARCHAR(255) NULL,
                    lecturer_name VARCHAR(255) NOT NULL,
                    lecturer_role VARCHAR(50) DEFAULT 'hod',
                    status VARCHAR(40) DEFAULT 'live',
                    is_live TINYINT(1) DEFAULT 1,
                    stream_mode VARCHAR(40) DEFAULT 'system_camera',
                    resolution VARCHAR(40) DEFAULT '1080p Full HD',
                    viewers_count INT DEFAULT 0,
                    simulcast_destinations TEXT NULL,
                    announcement TEXT NULL,
                    companion_pdf_url VARCHAR(500) NULL,
                    recording_media_id VARCHAR(80) NULL,
                    started_at TIMESTAMP NULL,
                    ended_at TIMESTAMP NULL,
                    created_at TIMESTAMP NULL,
                    updated_at TIMESTAMP NULL
                )
            ");
            try { DB::statement("ALTER TABLE live_broadcasts ADD COLUMN course_title VARCHAR(255) NULL"); } catch (\Throwable $e) {}
            try { DB::statement("ALTER TABLE live_broadcasts ADD COLUMN announcement TEXT NULL"); } catch (\Throwable $e) {}
            try { DB::statement("ALTER TABLE live_broadcasts ADD COLUMN companion_pdf_url VARCHAR(500) NULL"); } catch (\Throwable $e) {}
            try { DB::statement("ALTER TABLE live_broadcasts ADD COLUMN recording_media_id VARCHAR(80) NULL"); } catch (\Throwable $e) {}

            DB::statement("
                CREATE TABLE IF NOT EXISTS live_broadcast_chats (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    broadcast_id VARCHAR(80) NOT NULL,
                    user_name VARCHAR(255) NOT NULL,
                    user_role VARCHAR(50) DEFAULT 'student',
                    user_matric VARCHAR(100) NULL,
                    message TEXT NOT NULL,
                    is_question TINYINT(1) DEFAULT 0,
                    hand_raised TINYINT(1) DEFAULT 0,
                    created_at TIMESTAMP NULL,
                    updated_at TIMESTAMP NULL
                )
            ");

            DB::statement("
                CREATE TABLE IF NOT EXISTS live_social_destinations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    department_code VARCHAR(30) DEFAULT 'GLOBAL',
                    platform VARCHAR(50) NOT NULL,
                    platform_name VARCHAR(100) NOT NULL,
                    server_url TEXT NULL,
                    stream_key TEXT NULL,
                    enabled TINYINT(1) DEFAULT 0,
                    status VARCHAR(40) DEFAULT 'configured',
                    created_at TIMESTAMP NULL,
                    updated_at TIMESTAMP NULL
                )
            ");

            DB::statement("
                CREATE TABLE IF NOT EXISTS live_broadcast_signals (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    broadcast_id VARCHAR(80) NOT NULL,
                    sender_id VARCHAR(120) NOT NULL,
                    recipient_id VARCHAR(120) NOT NULL,
                    signal_type VARCHAR(50) NOT NULL,
                    payload LONGTEXT NOT NULL,
                    consumed TINYINT(1) DEFAULT 0,
                    created_at TIMESTAMP NULL,
                    updated_at TIMESTAMP NULL
                )
            ");

            DB::statement("
                CREATE TABLE IF NOT EXISTS live_classroom_roster (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    department_code VARCHAR(30) NOT NULL,
                    department_name VARCHAR(200) NULL,
                    matric_no VARCHAR(100) NOT NULL,
                    username VARCHAR(120) NULL,
                    student_name VARCHAR(255) NOT NULL,
                    password_pin VARCHAR(255) DEFAULT '1234',
                    level VARCHAR(50) DEFAULT 'ND I',
                    status VARCHAR(30) DEFAULT 'approved',
                    added_by VARCHAR(255) DEFAULT 'lecturer',
                    created_at TIMESTAMP NULL,
                    updated_at TIMESTAMP NULL
                )
            ");

            DB::statement("
                CREATE TABLE IF NOT EXISTS live_classroom_attendance (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    broadcast_id VARCHAR(80) NOT NULL,
                    department_code VARCHAR(30) NOT NULL,
                    course_code VARCHAR(60) NULL,
                    matric_no VARCHAR(100) NOT NULL,
                    username VARCHAR(120) NULL,
                    student_name VARCHAR(255) NOT NULL,
                    level VARCHAR(50) DEFAULT 'ND I',
                    first_joined_at TIMESTAMP NULL,
                    last_seen_at TIMESTAMP NULL,
                    first_10m_marked TINYINT(1) DEFAULT 0,
                    first_10m_marked_at TIMESTAMP NULL,
                    last_min_marked TINYINT(1) DEFAULT 0,
                    last_min_marked_at TIMESTAMP NULL,
                    attendance_status VARCHAR(40) DEFAULT 'IN_PROGRESS',
                    created_at TIMESTAMP NULL,
                    updated_at TIMESTAMP NULL
                )
            ");
        } catch (\Throwable $e) {}

        // 2. Ensure MySQL tables exist if MySQL is connected
        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS live_broadcasts (
                        id VARCHAR(80) PRIMARY KEY,
                        title VARCHAR(500) NOT NULL,
                        department_code VARCHAR(30) DEFAULT 'CEM',
                        department_name VARCHAR(200) DEFAULT 'Co-operative Economics & Management',
                        course_code VARCHAR(60) NULL,
                        course_title VARCHAR(255) NULL,
                        lecturer_name VARCHAR(255) NOT NULL,
                        lecturer_role VARCHAR(50) DEFAULT 'hod',
                        status VARCHAR(40) DEFAULT 'live',
                        is_live TINYINT(1) DEFAULT 1,
                        stream_mode VARCHAR(40) DEFAULT 'system_camera',
                        resolution VARCHAR(40) DEFAULT '1080p Full HD',
                        viewers_count INT DEFAULT 0,
                        simulcast_destinations TEXT NULL,
                        announcement TEXT NULL,
                        companion_pdf_url VARCHAR(500) NULL,
                        recording_media_id VARCHAR(80) NULL,
                        started_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                        ended_at TIMESTAMP NULL,
                        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                ");

                $mysqlCols = [
                    'course_title' => 'VARCHAR(255) NULL',
                    'announcement' => 'TEXT NULL',
                    'companion_pdf_url' => 'VARCHAR(500) NULL',
                    'recording_media_id' => 'VARCHAR(80) NULL',
                ];
                foreach ($mysqlCols as $col => $def) {
                    try {
                        $pdo->exec("ALTER TABLE live_broadcasts ADD COLUMN {$col} {$def}");
                    } catch (\Throwable $e) {}
                }

                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS live_broadcast_chats (
                        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                        broadcast_id VARCHAR(80) NOT NULL,
                        user_name VARCHAR(255) NOT NULL,
                        user_role VARCHAR(50) DEFAULT 'student',
                        user_matric VARCHAR(100) NULL,
                        message TEXT NOT NULL,
                        is_question TINYINT(1) DEFAULT 0,
                        hand_raised TINYINT(1) DEFAULT 0,
                        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        INDEX idx_broadcast_id (broadcast_id)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                ");

                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS live_social_destinations (
                        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                        department_code VARCHAR(30) DEFAULT 'GLOBAL',
                        platform VARCHAR(50) NOT NULL,
                        platform_name VARCHAR(100) NOT NULL,
                        server_url TEXT NULL,
                        stream_key TEXT NULL,
                        enabled TINYINT(1) DEFAULT 0,
                        status VARCHAR(40) DEFAULT 'configured',
                        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        UNIQUE KEY uniq_dept_platform (department_code, platform)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                ");

                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS live_broadcast_signals (
                        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                        broadcast_id VARCHAR(80) NOT NULL,
                        sender_id VARCHAR(120) NOT NULL,
                        recipient_id VARCHAR(120) NOT NULL,
                        signal_type VARCHAR(50) NOT NULL,
                        payload LONGTEXT NOT NULL,
                        consumed TINYINT(1) DEFAULT 0,
                        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        INDEX idx_sig_broadcast (broadcast_id),
                        INDEX idx_sig_recipient (recipient_id),
                        INDEX idx_sig_consumed (consumed)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                ");

                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS live_classroom_roster (
                        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                        department_code VARCHAR(30) NOT NULL,
                        department_name VARCHAR(200) NULL,
                        matric_no VARCHAR(100) NOT NULL,
                        username VARCHAR(120) NULL,
                        student_name VARCHAR(255) NOT NULL,
                        password_pin VARCHAR(255) DEFAULT '1234',
                        level VARCHAR(50) DEFAULT 'ND I',
                        status VARCHAR(30) DEFAULT 'approved',
                        added_by VARCHAR(255) DEFAULT 'lecturer',
                        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        UNIQUE KEY uniq_dept_matric (department_code, matric_no),
                        INDEX idx_roster_dept (department_code),
                        INDEX idx_roster_status (status)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                ");

                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS live_classroom_attendance (
                        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                        broadcast_id VARCHAR(80) NOT NULL,
                        department_code VARCHAR(30) NOT NULL,
                        course_code VARCHAR(60) NULL,
                        matric_no VARCHAR(100) NOT NULL,
                        username VARCHAR(120) NULL,
                        student_name VARCHAR(255) NOT NULL,
                        level VARCHAR(50) DEFAULT 'ND I',
                        first_joined_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                        last_seen_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                        first_10m_marked TINYINT(1) DEFAULT 0,
                        first_10m_marked_at TIMESTAMP NULL,
                        last_min_marked TINYINT(1) DEFAULT 0,
                        last_min_marked_at TIMESTAMP NULL,
                        attendance_status VARCHAR(40) DEFAULT 'IN_PROGRESS',
                        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        UNIQUE KEY uniq_bcast_matric (broadcast_id, matric_no),
                        INDEX idx_att_broadcast (broadcast_id),
                        INDEX idx_att_dept (department_code)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                ");
            }
        } catch (\Throwable $e) {}

        @file_put_contents($flagFile, (string) time());
        self::$tablesVerified = true;
    }

    /**
     * Helper to read a setting from MySQL first, falling back to Laravel DB
     */
    private function getSettingValue(string $key): ?string
    {
        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->prepare("SELECT setting_value FROM library_settings WHERE setting_key = :k LIMIT 1");
                $st->execute([':k' => $key]);
                $val = $st->fetchColumn();
                if ($val !== false && $val !== null) {
                    return (string) $val;
                }
            }
        } catch (\Throwable $e) {}

        try {
            $val = DB::table('library_settings')->where('setting_key', $key)->value('setting_value');
            return $val !== null ? (string) $val : null;
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Helper to save a setting into both MySQL and Laravel DB
     */
    private function setSettingValue(string $key, string $value, string $group = 'LiveBroadcast', string $desc = ''): void
    {
        try {
            DB::table('library_settings')->updateOrInsert(
                ['setting_key' => $key],
                [
                    'setting_value' => $value,
                    'setting_group' => $group,
                    'is_public' => true,
                    'description' => $desc ?: $key,
                    'updated_at' => now(),
                ]
            );
        } catch (\Throwable $e) {}

        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->prepare("
                    INSERT INTO library_settings (setting_key, setting_value, setting_group, is_public, description, created_at, updated_at)
                    VALUES (:k, :v, :g, 1, :d, NOW(), NOW())
                    ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()
                ");
                $st->execute([
                    ':k' => $key,
                    ':v' => $value,
                    ':g' => $group,
                    ':d' => $desc ?: $key,
                ]);
            }
        } catch (\Throwable $e) {}
    }

    /**
     * Helper to read developer media governance
     */
    private function getGovernance(): array
    {
        $defaults = [
            'multimedia_master_enabled' => true,
            'live_broadcast_master_enabled' => true,
            'live_broadcast_social_simulcast' => true,
            'live_broadcast_student_access' => true,
            'live_broadcast_chat_enabled' => true,
            'live_broadcast_auto_archive' => true,
            'live_broadcast_dept_cem' => true,
            'live_broadcast_dept_cs' => true,
            'live_broadcast_dept_com' => true,
            'live_broadcast_dept_bfn' => true,
            'live_broadcast_dept_agr' => true,
            'live_broadcast_dept_acc' => true,
            'live_broadcast_dept_pad' => true,
            'live_broadcast_dept_otm' => true,
            'live_broadcast_dept_bam' => true,
            'live_broadcast_dept_slt' => true,
            'live_broadcast_dept_sta' => true,
            'live_broadcast_dept_mkt' => true,
        ];

        $raw = $this->getSettingValue('fcc_multimedia_governance');
        if ($raw) {
            $saved = json_decode($raw, true);
            if (is_array($saved)) {
                return array_merge($defaults, $saved);
            }
        }

        return $defaults;
    }

    /**
     * Resolve authentic departments and courses from the database
     */
    private function fetchDepartmentsFromDb(): array
    {
        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->query("SELECT * FROM departments ORDER BY name ASC");
                if ($st) {
                    $rows = $st->fetchAll(\PDO::FETCH_ASSOC);
                    if (!empty($rows)) {
                        return $rows;
                    }
                }
            }
        } catch (\Throwable $e) {}

        try {
            return DB::table('departments')->orderBy('name', 'asc')->get()->map(fn($r) => (array) $r)->toArray();
        } catch (\Throwable $e) {
            return [];
        }
    }

    private function fetchCoursesFromDb(): array
    {
        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->query("SELECT * FROM courses WHERE code NOT LIKE '%MOCK%' AND code NOT LIKE '%DEMO%' ORDER BY code ASC");
                if ($st) {
                    $rows = $st->fetchAll(\PDO::FETCH_ASSOC);
                    if (!empty($rows)) {
                        return $rows;
                    }
                }
            }
        } catch (\Throwable $e) {}

        try {
            return DB::table('courses')
                ->where('code', 'not like', '%MOCK%')
                ->where('code', 'not like', '%DEMO%')
                ->orderBy('code', 'asc')
                ->get()
                ->map(fn($r) => (array) $r)
                ->toArray();
        } catch (\Throwable $e) {
            return [];
        }
    }

    /**
     * Ensure social destinations exist in DB for a department and return them
     */
    private function ensureAndFetchSocialDestinations(string $deptCode): array
    {
        $this->ensureDatabaseTables();
        $cleanDept = strtoupper(trim($deptCode ?: 'GLOBAL'));

        $defaultPlatforms = [
            ['platform' => 'youtube', 'platform_name' => 'YouTube Live (RTMP)', 'server_url' => 'rtmp://a.rtmp.youtube.com/live2', 'stream_key' => '', 'enabled' => true],
            ['platform' => 'facebook', 'platform_name' => 'Facebook Live Video', 'server_url' => 'rtmps://live-api-s.facebook.com:443/rtmp/', 'stream_key' => '', 'enabled' => true],
            ['platform' => 'linkedin', 'platform_name' => 'LinkedIn Live Stream', 'server_url' => 'rtmps://live-api.linkedin.com:443/rtmp/', 'stream_key' => '', 'enabled' => false],
            ['platform' => 'twitter', 'platform_name' => 'X / Twitter Live Producer', 'server_url' => 'rtmp://va.pscp.tv:80/x', 'stream_key' => '', 'enabled' => false],
            ['platform' => 'twitch', 'platform_name' => 'Twitch Academic Broadcast', 'server_url' => 'rtmp://live.twitch.tv/app/', 'stream_key' => '', 'enabled' => false],
            ['platform' => 'custom_rtmp', 'platform_name' => 'Custom Institutional RTMP / HLS', 'server_url' => 'rtmp://stream.fccibadanlibrary.com.ng/live', 'stream_key' => '', 'enabled' => true],
        ];

        $destinations = [];
        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->prepare("SELECT * FROM live_social_destinations WHERE department_code = :d ORDER BY id ASC");
                $st->execute([':d' => $cleanDept]);
                $destinations = $st->fetchAll(\PDO::FETCH_ASSOC);

                if (empty($destinations)) {
                    $ins = $pdo->prepare("
                        INSERT IGNORE INTO live_social_destinations
                        (department_code, platform, platform_name, server_url, stream_key, enabled, status, created_at, updated_at)
                        VALUES (:d, :p, :pn, :su, :sk, :en, 'configured', NOW(), NOW())
                    ");
                    foreach ($defaultPlatforms as $dp) {
                        $ins->execute([
                            ':d' => $cleanDept,
                            ':p' => $dp['platform'],
                            ':pn' => $dp['platform_name'],
                            ':su' => $dp['server_url'],
                            ':sk' => $dp['stream_key'],
                            ':en' => $dp['enabled'] ? 1 : 0,
                        ]);
                    }
                    $st->execute([':d' => $cleanDept]);
                    $destinations = $st->fetchAll(\PDO::FETCH_ASSOC);
                }
            }
        } catch (\Throwable $e) {}

        // Also mirror/sync with Laravel DB table
        try {
            $localCount = DB::table('live_social_destinations')->where('department_code', $cleanDept)->count();
            if ($localCount === 0) {
                $seedSource = !empty($destinations) ? $destinations : $defaultPlatforms;
                foreach ($seedSource as $dp) {
                    DB::table('live_social_destinations')->insert([
                        'department_code' => $cleanDept,
                        'platform' => $dp['platform'],
                        'platform_name' => $dp['platform_name'],
                        'server_url' => $dp['server_url'] ?? '',
                        'stream_key' => $dp['stream_key'] ?? '',
                        'enabled' => !empty($dp['enabled']),
                        'status' => $dp['status'] ?? 'configured',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
            if (empty($destinations)) {
                $destinations = DB::table('live_social_destinations')
                    ->where('department_code', $cleanDept)
                    ->orderBy('id', 'asc')
                    ->get()
                    ->map(fn($r) => (array) $r)
                    ->toArray();
            }
        } catch (\Throwable $e) {}

        return array_map(function ($d) {
            $d['enabled'] = (bool) ($d['enabled'] ?? false);
            $d['stream_key'] = (string) ($d['stream_key'] ?? '');
            $d['server_url'] = (string) ($d['server_url'] ?? '');
            return $d;
        }, $destinations);
    }

    /**
     * GET /api/live-broadcast/studio-context
     * Returns full database-driven context for LiveBroadcastStudio.jsx:
     * - Resolved department & HOD/Lecturer profile from DB
     * - All departments & curriculum courses from DB
     * - Persisted hardware & lecture configuration from library_settings
     * - Social simulcast destinations from live_social_destinations
     * - Active live broadcast (if currently live) + elapsed seconds + chat messages
     * - Past broadcast history from live_broadcasts + media_resources
     * - Developer governance flags
     */
    public function getStudioContext(Request $request)
    {
        $this->ensureDatabaseTables();

        $reqDeptCode = strtoupper(trim((string) $request->input('department_code', '')));
        $reqDeptName = trim((string) $request->input('department_name', ''));
        $reqLecturer = trim((string) $request->input('lecturer_name', ''));

        $allDepts = $this->fetchDepartmentsFromDb();
        $allCourses = $this->fetchCoursesFromDb();

        // Match department from database
        $matchedDept = null;
        foreach ($allDepts as $d) {
            $dCode = strtoupper(trim((string) ($d['code'] ?? '')));
            $dName = trim((string) ($d['name'] ?? ''));
            $dHod = trim((string) ($d['hod_name'] ?? ''));
            if ($reqDeptCode !== '' && ($dCode === $reqDeptCode || "DEP-{$dCode}" === $reqDeptCode)) {
                $matchedDept = $d;
                break;
            }
            if ($reqDeptName !== '' && strcasecmp($dName, $reqDeptName) === 0) {
                $matchedDept = $d;
                break;
            }
            if ($reqLecturer !== '' && $dHod !== '' && stripos($dHod, $reqLecturer) !== false) {
                $matchedDept = $d;
                break;
            }
        }

        if (!$matchedDept && $reqDeptCode === '' && $reqDeptName === '' && $reqLecturer === '' && !empty($allDepts)) {
            $matchedDept = $allDepts[0];
        }

        $deptCode = strtoupper(trim((string) ($matchedDept['code'] ?? ($reqDeptCode ?: 'CEM'))));
        $deptName = trim((string) ($matchedDept['name'] ?? ($reqDeptName ?: 'Co-operative Economics & Management')));
        $hodName = trim((string) ($matchedDept['hod_name'] ?? ($reqLecturer ?: 'Head of Department')));
        if ($reqLecturer !== '' && !$matchedDept) {
            $hodName = $reqLecturer;
        }

        // Filter courses for this department first, then keep all college courses accessible
        $deptCourses = array_values(array_filter($allCourses, function ($c) use ($deptCode, $deptName) {
            $cCode = strtoupper(trim((string) ($c['code'] ?? '')));
            $cDept = trim((string) ($c['department'] ?? ''));
            return str_starts_with($cCode, $deptCode)
                || ($deptName !== '' && stripos($cDept, $deptName) !== false)
                || ($deptCode !== '' && stripos($cDept, $deptCode) !== false);
        }));

        $firstCourse = !empty($deptCourses) ? $deptCourses[0] : (!empty($allCourses) ? $allCourses[0] : null);
        $defaultCourseCode = $firstCourse['code'] ?? "{$deptCode} 111";
        $defaultCourseTitle = $firstCourse['title'] ?? "Introduction to {$deptName}";
        $defaultLevel = $firstCourse['level'] ?? 'ND I';

        // Load saved studio configuration from library_settings
        $configKey = 'fcc_live_studio_config_' . strtolower($deptCode);
        $rawConfig = $this->getSettingValue($configKey);
        $savedConfig = $rawConfig ? json_decode($rawConfig, true) : null;

        // Clean up any stale placeholder strings if previously saved
        $defaultStudioConfig = [
            'department_code' => $deptCode,
            'department_name' => $deptName,
            'course_code' => $defaultCourseCode,
            'course_title' => $defaultCourseTitle,
            'target_level' => $defaultLevel,
            'lecturer_name' => $hodName,
            'lecture_title' => "{$defaultCourseCode}: {$defaultCourseTitle} - Live Interactive Lecture",
            'announcement' => "Welcome scholars to the {$deptCode} Live Interactive Classroom. Post your questions in the live chat or raise your hand.",
            'companion_pdf_url' => '',
            'companion_pdf_name' => '',
            'stream_mode' => 'system_camera',
            'resolution' => '1080p Full HD',
            'video_device_id' => '',
            'video_device_label' => '',
            'audio_device_id' => '',
            'audio_device_label' => '',
            'is_audio_muted' => false,
            'updated_at' => now()->toIso8601String(),
        ];

        if (is_array($savedConfig)) {
            $studioConfig = array_merge($defaultStudioConfig, $savedConfig);
            // Ensure department code/name stay aligned with the resolved DB department
            $studioConfig['department_code'] = $deptCode;
            $studioConfig['department_name'] = $deptName;
            if (empty($studioConfig['lecturer_name'])) {
                $studioConfig['lecturer_name'] = $hodName;
            }
        } else {
            $studioConfig = $defaultStudioConfig;
            $this->setSettingValue(
                $configKey,
                json_encode($studioConfig, JSON_UNESCAPED_SLASHES),
                'LiveBroadcast',
                "Live Broadcast Studio Configuration for {$deptCode}"
            );
        }

        // Load social simulcast destinations from DB
        $destinations = $this->ensureAndFetchSocialDestinations($deptCode);

        // Check for an active live broadcast for this department (or any active broadcast on the studio server)
        $activeBroadcast = null;
        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                // Clean up any known stale ghost broadcast
                $pdo->exec("UPDATE live_broadcasts SET is_live = 0, status = 'ended', ended_at = COALESCE(ended_at, NOW()) WHERE id = 'LIVE-OAO-20261109-100116-GFDM' AND is_live = 1");

                $st = $pdo->prepare("
                    SELECT * FROM live_broadcasts
                    WHERE is_live = 1 AND status = 'live' AND department_code = :d
                    ORDER BY started_at DESC LIMIT 1
                ");
                $st->execute([':d' => $deptCode]);
                $row = $st->fetch(\PDO::FETCH_ASSOC);
                if (!$row && $reqDeptCode === '') {
                    $stAny = $pdo->query("SELECT * FROM live_broadcasts WHERE is_live = 1 AND status = 'live' ORDER BY started_at DESC LIMIT 1");
                    if ($stAny) {
                        $row = $stAny->fetch(\PDO::FETCH_ASSOC);
                    }
                }
                if ($row) {
                    $activeBroadcast = (object) $row;
                }
            } else {
                DB::table('live_broadcasts')->where('id', 'LIVE-OAO-20261109-100116-GFDM')->where('is_live', true)->update(['is_live' => false, 'status' => 'ended']);
                $activeBroadcast = DB::table('live_broadcasts')
                    ->where('is_live', true)
                    ->where('status', 'live')
                    ->where('department_code', $deptCode)
                    ->orderBy('started_at', 'desc')
                    ->first();
                if (!$activeBroadcast && $reqDeptCode === '') {
                    $activeBroadcast = DB::table('live_broadcasts')
                        ->where('is_live', true)
                        ->where('status', 'live')
                        ->orderBy('started_at', 'desc')
                        ->first();
                }
            }
        } catch (\Throwable $e) {}

        $activeMessages = [];
        $elapsedSeconds = 0;
        if ($activeBroadcast) {
            try {
                $startedAt = Carbon::parse($activeBroadcast->started_at);
                $elapsedSeconds = max(0, (int) Carbon::now()->diffInSeconds($startedAt));
            } catch (\Throwable $e) {
                $elapsedSeconds = 0;
            }

            $activeMessages = $this->fetchChatMessagesFromDb($activeBroadcast->id);
            $activeBroadcast->viewers_count = $this->computeActiveViewersCount($activeBroadcast->id, (int) ($activeBroadcast->viewers_count ?? 0));
        }

        // Load recent broadcast history for this department (or all if developer/admin)
        $history = [];
        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $hSt = $pdo->prepare("
                    SELECT * FROM live_broadcasts
                    WHERE department_code = :d
                    ORDER BY created_at DESC LIMIT 15
                ");
                $hSt->execute([':d' => $deptCode]);
                $history = $hSt->fetchAll(\PDO::FETCH_ASSOC);
            }
        } catch (\Throwable $e) {}

        if (empty($history)) {
            try {
                $history = DB::table('live_broadcasts')
                    ->where('department_code', $deptCode)
                    ->orderBy('created_at', 'desc')
                    ->take(15)
                    ->get()
                    ->map(fn($r) => (array) $r)
                    ->toArray();
            } catch (\Throwable $e) {}
        }

        // Enrich history with media_url if archived in media_resources
        foreach ($history as &$hItem) {
            $hItem['media_url'] = null;
            if (!empty($hItem['recording_media_id'])) {
                try {
                    $mediaRow = DB::table('media_resources')->where('id', $hItem['recording_media_id'])->first();
                    if ($mediaRow) {
                        $hItem['media_url'] = $mediaRow->media_url;
                        $hItem['duration_formatted'] = $mediaRow->duration_formatted;
                    }
                } catch (\Throwable $e) {}
            }
        }

        return response()->json([
            'success' => true,
            'department' => [
                'code' => $deptCode,
                'name' => $deptName,
                'hod_name' => $hodName,
                'faculty' => $matchedDept['faculty'] ?? 'School of Academic Studies',
            ],
            'departments' => array_map(fn($d) => [
                'id' => $d['id'] ?? ('DEP-' . ($d['code'] ?? '')),
                'code' => $d['code'] ?? '',
                'name' => $d['name'] ?? '',
                'hod_name' => $d['hod_name'] ?? '',
            ], $allDepts),
            'department_courses' => array_map(fn($c) => [
                'code' => $c['code'] ?? '',
                'title' => $c['title'] ?? '',
                'level' => $c['level'] ?? 'ND I',
                'semester' => $c['semester'] ?? 'First Semester',
                'department' => $c['department'] ?? $deptName,
                'lecturer' => $c['lecturer'] ?? $hodName,
            ], $deptCourses),
            'all_courses' => array_map(fn($c) => [
                'code' => $c['code'] ?? '',
                'title' => $c['title'] ?? '',
                'level' => $c['level'] ?? 'ND I',
                'semester' => $c['semester'] ?? 'First Semester',
                'department' => $c['department'] ?? '',
                'lecturer' => $c['lecturer'] ?? '',
            ], $allCourses),
            'studio_config' => $studioConfig,
            'destinations' => $destinations,
            'active_broadcast' => $activeBroadcast,
            'elapsed_seconds' => $elapsedSeconds,
            'chat_messages' => $activeMessages,
            'broadcast_history' => $history,
            'classroom_roster' => $this->fetchDepartmentRosterFromDb($deptCode, $deptName),
            'attendance' => $activeBroadcast ? $this->buildAttendancePayload($activeBroadcast->id) : null,
            'attendance_register' => $activeBroadcast ? $this->buildAttendancePayload($activeBroadcast->id) : null,
            'concurrent_campus_streams' => $this->fetchAllActiveCampusStreams(),
            'governance' => $this->getGovernance(),
        ]);
    }

    /**
     * POST /api/live-broadcast/studio-config
     * Persist all studio hardware settings & lecture metadata to database.
     * Also updates any currently active live broadcast in real time.
     */
    public function saveStudioConfig(Request $request)
    {
        $this->ensureDatabaseTables();

        $deptCode = strtoupper(trim((string) $request->input('department_code', 'CEM')));
        $configKey = 'fcc_live_studio_config_' . strtolower($deptCode);

        $rawExisting = $this->getSettingValue($configKey);
        $existing = $rawExisting ? (json_decode($rawExisting, true) ?: []) : [];

        $fields = [
            'department_code',
            'department_name',
            'course_code',
            'course_title',
            'target_level',
            'lecturer_name',
            'lecture_title',
            'announcement',
            'companion_pdf_url',
            'companion_pdf_name',
            'stream_mode',
            'resolution',
            'video_device_id',
            'video_device_label',
            'audio_device_id',
            'audio_device_label',
            'is_audio_muted',
        ];

        foreach ($fields as $f) {
            if ($request->has($f)) {
                $existing[$f] = $f === 'is_audio_muted'
                    ? $request->boolean($f)
                    : $request->input($f);
            }
        }
        $existing['department_code'] = $deptCode;
        $existing['updated_at'] = now()->toIso8601String();

        $this->setSettingValue(
            $configKey,
            json_encode($existing, JSON_UNESCAPED_SLASHES),
            'LiveBroadcast',
            "Live Broadcast Studio Configuration for {$deptCode}"
        );

        // Only update live_broadcasts if the studio explicitly reports an active live session
        $broadcastId = trim((string) $request->input('broadcast_id', ''));
        $isActivelyLive = $request->boolean('is_live', false);
        if ($isActivelyLive && $broadcastId !== '') {
            $liveUpdate = [
                'title' => $existing['lecture_title'] ?? 'Live Lecture',
                'department_code' => $deptCode,
                'department_name' => $existing['department_name'] ?? 'Academic Department',
                'course_code' => $existing['course_code'] ?? '',
                'course_title' => $existing['course_title'] ?? '',
                'lecturer_name' => $existing['lecturer_name'] ?? 'Lecturer',
                'stream_mode' => $existing['stream_mode'] ?? 'system_camera',
                'resolution' => $existing['resolution'] ?? '1080p Full HD',
                'announcement' => $existing['announcement'] ?? '',
                'companion_pdf_url' => $existing['companion_pdf_url'] ?? '',
                'updated_at' => now(),
            ];

            try {
                DB::table('live_broadcasts')
                    ->where('id', $broadcastId)
                    ->where('is_live', true)
                    ->where('status', 'live')
                    ->update($liveUpdate);
            } catch (\Throwable $e) {}

            try {
                $pdo = DatabaseService::getPdo();
                if ($pdo) {
                    $st = $pdo->prepare("
                        UPDATE live_broadcasts
                        SET title = :title, department_name = :dn, course_code = :cc, course_title = :ct,
                            lecturer_name = :ln, stream_mode = :sm, resolution = :res,
                            announcement = :ann, companion_pdf_url = :pdf, updated_at = NOW()
                        WHERE id = :id AND is_live = 1 AND status = 'live'
                    ");
                    $st->execute([
                        ':title' => $liveUpdate['title'],
                        ':dn' => $liveUpdate['department_name'],
                        ':cc' => $liveUpdate['course_code'],
                        ':ct' => $liveUpdate['course_title'],
                        ':ln' => $liveUpdate['lecturer_name'],
                        ':sm' => $liveUpdate['stream_mode'],
                        ':res' => $liveUpdate['resolution'],
                        ':ann' => $liveUpdate['announcement'],
                        ':pdf' => $liveUpdate['companion_pdf_url'],
                        ':id' => $broadcastId,
                    ]);
                }
            } catch (\Throwable $e) {}
        }

        return response()->json([
            'success' => true,
            'message' => 'Studio configuration saved to database',
            'studio_config' => $existing,
        ]);
    }

    /**
     * POST /api/live-broadcast/companion-pdf
     * Upload a companion PDF handout for the live lecture and persist its URL in DB
     */
    public function uploadCompanionPdf(Request $request)
    {
        if (!$request->hasFile('pdf_file')) {
            return response()->json(['success' => false, 'error' => 'No PDF handout file provided'], 400);
        }

        $file = $request->file('pdf_file');
        $deptCode = strtoupper(trim((string) $request->input('department_code', 'CEM')));
        $broadcastId = $request->input('broadcast_id');

        $originalName = $file->getClientOriginalName();
        $ext = $file->getClientOriginalExtension() ?: 'pdf';
        $filename = 'FCC-LIVE-HANDOUT-' . $deptCode . '-' . time() . '.' . $ext;

        $file->storeAs('public/media/handouts', $filename);
        $pdfUrl = '/api/live-broadcast/handout/' . $filename;

        // Save to studio config in DB
        $configKey = 'fcc_live_studio_config_' . strtolower($deptCode);
        $rawExisting = $this->getSettingValue($configKey);
        $existing = $rawExisting ? (json_decode($rawExisting, true) ?: []) : [];
        $existing['companion_pdf_url'] = $pdfUrl;
        $existing['companion_pdf_name'] = $originalName;
        $existing['updated_at'] = now()->toIso8601String();

        $this->setSettingValue(
            $configKey,
            json_encode($existing, JSON_UNESCAPED_SLASHES),
            'LiveBroadcast',
            "Live Broadcast Studio Configuration for {$deptCode}"
        );

        // Update active broadcast if live
        if ($broadcastId) {
            try {
                DB::table('live_broadcasts')->where('id', $broadcastId)->where('is_live', true)->update([
                    'companion_pdf_url' => $pdfUrl,
                    'updated_at' => now(),
                ]);
            } catch (\Throwable $e) {}

            try {
                $pdo = DatabaseService::getPdo();
                if ($pdo) {
                    $st = $pdo->prepare("UPDATE live_broadcasts SET companion_pdf_url = :u, updated_at = NOW() WHERE id = :id AND is_live = 1");
                    $st->execute([':u' => $pdfUrl, ':id' => $broadcastId]);
                }
            } catch (\Throwable $e) {}
        }

        return response()->json([
            'success' => true,
            'message' => 'Companion lecture handout uploaded and linked in database',
            'companion_pdf_url' => $pdfUrl,
            'companion_pdf_name' => $originalName,
        ]);
    }

    /**
     * GET /api/live-broadcast/handout/{filename}
     * Serve companion PDF handout directly over the API proxy
     */
    public function getCompanionHandout(Request $request, $filename)
    {
        $safeName = basename((string) $filename);
        $path = storage_path('app/public/media/handouts/' . $safeName);
        if (!file_exists($path)) {
            return response()->json(['error' => 'Handout PDF not found'], 404);
        }
        return response()->file($path, [
            'Content-Type' => 'application/pdf',
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }

    /**
     * Fetch all concurrently active departmental live broadcast streams across campus
     */
    private function fetchAllActiveCampusStreams(string $filterDeptCode = ''): array
    {
        $streams = collect();
        $mysqlQueried = false;

        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $mysqlQueried = true;
                $pdo->exec("UPDATE live_broadcasts SET is_live = 0, status = 'ended', ended_at = COALESCE(ended_at, NOW()) WHERE id = 'LIVE-OAO-20261109-100116-GFDM' AND is_live = 1");

                $st = $pdo->query("SELECT * FROM live_broadcasts WHERE is_live = 1 AND status = 'live' ORDER BY started_at DESC");
                if ($st) {
                    $rows = $st->fetchAll(\PDO::FETCH_ASSOC);
                    if (!empty($rows)) {
                        $streams = collect($rows)->map(fn($r) => (object) $r);
                    } else {
                        try {
                            DB::table('live_broadcasts')->where('is_live', true)->update([
                                'is_live' => false,
                                'status' => 'ended',
                                'ended_at' => now()
                            ]);
                        } catch (\Throwable $e) {}
                    }
                }
            }
        } catch (\Throwable $e) {}

        if (!$mysqlQueried) {
            try {
                DB::table('live_broadcasts')
                    ->where('id', 'LIVE-OAO-20261109-100116-GFDM')
                    ->where('is_live', true)
                    ->update(['is_live' => false, 'status' => 'ended']);

                $streams = DB::table('live_broadcasts')
                    ->where('is_live', true)
                    ->where('status', 'live')
                    ->orderBy('started_at', 'desc')
                    ->get();
            } catch (\Throwable $e) {}
        }

        $cleanFilter = strtoupper(trim($filterDeptCode));

        $enriched = $streams->filter(function ($s) use ($cleanFilter) {
            $isLive = (int) ($s->is_live ?? 0) === 1 && strtolower((string) ($s->status ?? '')) === 'live';
            if (!$isLive) return false;
            if ($cleanFilter !== '' && $cleanFilter !== 'ALL') {
                return $this->departmentsMatch($cleanFilter, $cleanFilter, (string) ($s->department_code ?? ''), (string) ($s->id ?? ''));
            }
            return true;
        })->map(function ($s) {
            $s->viewers_count = $this->computeActiveViewersCount($s->id, (int) ($s->viewers_count ?? 0));
            $framePath = storage_path('app/public/live/' . $s->id . '/frame.jpg');
            $s->has_live_frame = file_exists($framePath);
            $streamPath = storage_path('app/public/live/' . $s->id . '/stream.webm');
            $s->has_stream_buffer = file_exists($streamPath) && filesize($streamPath) > 512;
            $s->classroom_url = '#/live-classroom/' . $s->id;
            $s->department_channel_url = '#/live-classroom/' . strtoupper((string) ($s->department_code ?? 'LIVE'));

            $elapsed = 0;
            try {
                if (!empty($s->started_at)) {
                    $elapsed = max(0, (int) Carbon::now()->diffInSeconds(Carbon::parse($s->started_at)));
                }
            } catch (\Throwable $e) {}
            $s->elapsed_seconds = $elapsed;
            $s->first_10m_window_open = ($elapsed <= 600) || ($this->getSettingValue('fcc_live_att_f10_open_' . $s->id) === '1');
            $s->last_minute_window_open = ($this->getSettingValue('fcc_live_att_lastmin_open_' . $s->id) === '1');

            $deptCodeLower = strtolower(trim((string) ($s->department_code ?? 'cem')));
            $rawCfg = $this->getSettingValue('fcc_live_studio_config_' . $deptCodeLower);
            $cfg = $rawCfg ? (json_decode($rawCfg, true) ?: []) : [];
            $s->target_level = $cfg['target_level'] ?? 'All Levels';
            if (empty($s->companion_pdf_url) && !empty($cfg['companion_pdf_url'])) {
                $s->companion_pdf_url = $cfg['companion_pdf_url'];
            }
            return $s;
        })->values()->all();

        return $enriched;
    }

    /**
     * GET /api/live-broadcast/active
     * Fetch active live lecture streams across all departments (or filtered by department)
     */
    public function getActiveStreams(Request $request)
    {
        $this->ensureDatabaseTables();

        $gov = $this->getGovernance();
        if (empty($gov['live_broadcast_master_enabled'])) {
            return response()->json([
                'success' => true,
                'active' => false,
                'count' => 0,
                'broadcast' => null,
                'streams' => [],
                'departments_live' => [],
                'governance_message' => 'Live Broadcasting is currently placed on scheduled maintenance by Library Systems Engineering.'
            ])->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        }

        $filterDept = trim((string) $request->input('department_code', $request->input('department', '')));
        $streams = $this->fetchAllActiveCampusStreams($filterDept);

        $departmentsLive = array_values(array_unique(array_map(
            fn($s) => strtoupper((string) ($s->department_code ?? '')),
            $streams
        )));

        return response()->json([
            'success' => true,
            'active' => !empty($streams),
            'count' => count($streams),
            'departments_live' => $departmentsLive,
            'broadcast' => $streams[0] ?? null,
            'streams' => $streams,
            'server_time' => round(microtime(true) * 1000),
        ])->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    }

    /**
     * GET /api/live-broadcast/session/{id?}
     * Fetch a specific live broadcast session by ID or Department Code (plus all concurrent campus streams)
     */
    public function getBroadcastSession(Request $request, $id = null)
    {
        $this->ensureDatabaseTables();

        $allActiveStreams = $this->fetchAllActiveCampusStreams();
        $broadcast = null;
        $targetId = trim((string) ($id ?: $request->input('id', '')));
        $cleanTargetUpper = strtoupper(preg_replace('/^DEPT-/i', '', $targetId));
        $specificIdRequested = ($targetId !== '' && strtolower($targetId) !== 'active');

        // If targetId is a Department Code (e.g. "CSC", "CEM", "BFN", "OAO"), match that department's active stream!
        if ($specificIdRequested && !str_starts_with(strtoupper($targetId), 'LIVE-')) {
            foreach ($allActiveStreams as $activeStream) {
                if (strtoupper((string) ($activeStream->department_code ?? '')) === $cleanTargetUpper) {
                    $broadcast = $activeStream;
                    break;
                }
            }
        }

        if (!$broadcast) {
            try {
                $pdo = DatabaseService::getPdo();
                if ($pdo) {
                    if ($specificIdRequested) {
                        $st = $pdo->prepare("SELECT * FROM live_broadcasts WHERE id = :id LIMIT 1");
                        $st->execute([':id' => $targetId]);
                        $row = $st->fetch(\PDO::FETCH_ASSOC);
                        if ($row) {
                            $broadcast = (object) $row;
                        }
                    } elseif (!empty($allActiveStreams)) {
                        $broadcast = $allActiveStreams[0];
                    }
                }
            } catch (\Throwable $e) {}
        }

        if (!$broadcast) {
            try {
                if ($specificIdRequested) {
                    $broadcast = DB::table('live_broadcasts')->where('id', $targetId)->first();
                } elseif (!empty($allActiveStreams)) {
                    $broadcast = $allActiveStreams[0];
                }
            } catch (\Throwable $e) {}
        }

        if (!$broadcast) {
            return response()->json([
                'success' => false,
                'active' => false,
                'ended' => true,
                'broadcast' => null,
                'active_streams' => $allActiveStreams,
                'message' => 'No active live lecture broadcast for this channel at this moment.'
            ])->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        }

        $isCurrentlyLive = ((int) ($broadcast->is_live ?? 0) === 1) && (strtolower((string) ($broadcast->status ?? '')) === 'live');
        if (!$isCurrentlyLive) {
            return response()->json([
                'success' => true,
                'active' => false,
                'ended' => true,
                'broadcast' => null,
                'active_streams' => $allActiveStreams,
                'ended_broadcast' => [
                    'id' => $broadcast->id,
                    'title' => $broadcast->title ?? 'Live Lecture',
                    'course_code' => $broadcast->course_code ?? '',
                    'lecturer_name' => $broadcast->lecturer_name ?? '',
                    'department_code' => $broadcast->department_code ?? '',
                    'department_name' => $broadcast->department_name ?? '',
                    'ended_at' => $broadcast->ended_at ?? $broadcast->updated_at,
                    'recording_media_id' => $broadcast->recording_media_id ?? null,
                ],
                'message' => 'This departmental live lecture broadcast has ended and been archived.'
            ])->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        }

        $broadcast->viewers_count = $this->computeActiveViewersCount($broadcast->id, (int) ($broadcast->viewers_count ?? 0));
        $framePath = storage_path('app/public/live/' . $broadcast->id . '/frame.jpg');
        $broadcast->has_live_frame = file_exists($framePath);
        $broadcast->frame_updated_at = file_exists($framePath) ? filemtime($framePath) : null;
        $streamPath = storage_path('app/public/live/' . $broadcast->id . '/stream.webm');
        $broadcast->has_stream_buffer = file_exists($streamPath) && filesize($streamPath) > 512;
        $broadcast->classroom_url = '#/live-classroom/' . $broadcast->id;

        $deptCode = strtolower(trim((string) ($broadcast->department_code ?? 'cem')));
        $rawCfg = $this->getSettingValue('fcc_live_studio_config_' . $deptCode);
        $cfg = $rawCfg ? (json_decode($rawCfg, true) ?: []) : [];
        if (empty($broadcast->companion_pdf_url) && !empty($cfg['companion_pdf_url'])) {
            $broadcast->companion_pdf_url = $cfg['companion_pdf_url'];
        }
        $broadcast->companion_pdf_name = $cfg['companion_pdf_name'] ?? '';
        $broadcast->target_level = $cfg['target_level'] ?? 'All Levels';

        return response()->json([
            'success' => true,
            'active' => true,
            'ended' => false,
            'broadcast' => $broadcast,
            'active_streams' => $allActiveStreams,
            'messages' => $this->fetchChatMessagesFromDb($broadcast->id),
        ])->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    }

    /**
     * Normalize department aliases so e.g. CS / CSC / COM / Computer Science / Computing and Informatics match
     * while blocking students from unrelated departments (e.g. ACC or CEM trying to join CSC).
     */
    private function getDepartmentAliasGroup(string $rawCodeOrName): array
    {
        $u = strtoupper(trim($rawCodeOrName));
        $u = preg_replace('/^DEP-/', '', $u);

        $groups = [
            ['CSC', 'CS', 'COM', 'SWD', 'AI', 'NCC', 'COMPUTER SCIENCE', 'COMPUTING AND INFORMATICS', 'COMPUTER'],
            ['CEM', 'COOPERATIVE ECONOMICS AND MANAGEMENT', 'CO-OPERATIVE ECONOMICS & MANAGEMENT', 'COOPERATIVE ECONOMICS', 'CO-OPERATIVE'],
            ['BFN', 'BF', 'BANKING AND FINANCE', 'BANKING & FINANCE', 'BANKING AND FINANC'],
            ['ACC', 'ACCOUNTANCY', 'ACCOUNTING'],
            ['AT', 'AGT', 'AGR', 'AGRICULTURAL TECHNOLOGY', 'AGRICULTURE TECHNOLOGY', 'AGRICULTURE'],
            ['OTM', 'OFFICE TECHNOLOGY MANAGEMENT', 'OFFICE TECHNOLOGY & MANAGEMENT'],
            ['PA', 'PAD', 'PUBLIC ADMINISTRATION'],
            ['BAM', 'BUSINESS ADMINISTRATION AND MANAGEMENT', 'BUSINESS ADMINISTRATION & MANAGEMENT', 'BUSINESS ADMIN'],
            ['MKT', 'MARKETING'],
            ['MAC', 'MC', 'MASS COMMUNICATION'],
            ['LIS', 'LIBRARY AND INFORMATION SCIENCE'],
            ['HRE', 'HR', 'HOME AND RURAL ECONOMICS'],
            ['APT', 'ANIMAL PRODUCTION TECHNOLOGY'],
            ['AER', 'AGRICULTURAL EXTENSION AND RURAL DEVELOPMENT'],
            ['HMT', 'HOSPITALITY MANAGEMENT TECHNOLOGY'],
            ['AM', 'AGRIBUSINESS MANAGEMENT'],
            ['GNS', 'GENERAL STUDIES'],
            ['SLT', 'SCIENCE LABORATORY TECHNOLOGY'],
            ['STA', 'STATISTICS'],
            ['OAO', 'OLAWALE AKEEM OLONADE'],
        ];

        foreach ($groups as $grp) {
            foreach ($grp as $token) {
                if ($u === $token || (strlen($token) > 4 && stripos($u, $token) !== false)) {
                    return $grp;
                }
            }
        }

        return $u !== '' ? [$u] : [];
    }

    private function departmentsMatch(string $targetDeptCode, string $targetDeptName, string $studentDept, string $studentMatric = ''): bool
    {
        $targetCodeUpper = strtoupper(trim($targetDeptCode));
        if ($targetCodeUpper === '' || $targetCodeUpper === 'GLOBAL' || $targetCodeUpper === 'ALL') {
            return true;
        }

        $targetAliases = array_unique(array_merge(
            $this->getDepartmentAliasGroup($targetDeptCode),
            $this->getDepartmentAliasGroup($targetDeptName)
        ));

        $studentAliases = $this->getDepartmentAliasGroup($studentDept);
        if (!empty(array_intersect($targetAliases, $studentAliases))) {
            return true;
        }

        // Also check if student's matric number contains the department code prefix (e.g., FCC/CSC/24/001 or CSC/2026/001)
        $matricUpper = strtoupper(trim($studentMatric));
        foreach ($targetAliases as $alias) {
            if (strlen($alias) >= 2 && strlen($alias) <= 5) {
                if (
                    preg_match('/(^|[\/\-_ ])' . preg_quote($alias, '/') . '([\/\-_ 0-9]|$)/', $matricUpper)
                ) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Resolve authentic department code & name from database for a broadcast start request
     */
    private function resolveBroadcastDepartmentFromDb(string $reqCode, string $reqName, string $courseCode = '', string $lecturerName = ''): array
    {
        $allDepts = $this->fetchDepartmentsFromDb();
        $cleanCode = strtoupper(preg_replace('/^DEP-/i', '', trim($reqCode)));
        $cleanName = trim($reqName);

        // If course code has a department prefix (e.g. "CSC 211", "BFN 111", "ACC 101") and reqCode was empty
        if ($cleanCode === '' && preg_match('/^([A-Z]{2,5})\s*\d/i', trim($courseCode), $m)) {
            $cleanCode = strtoupper($m[1]);
        }

        $aliases = $this->getDepartmentAliasGroup($cleanCode ?: $cleanName);

        foreach ($allDepts as $d) {
            $dCode = strtoupper(trim((string) ($d['code'] ?? '')));
            $dName = trim((string) ($d['name'] ?? ''));
            if ($cleanCode !== '' && $dCode === $cleanCode) {
                return [
                    'code' => $dCode,
                    'name' => $dName ?: ($cleanName ?: $dCode),
                    'hod_name' => $d['hod_name'] ?? $lecturerName,
                ];
            }
        }

        foreach ($allDepts as $d) {
            $dCode = strtoupper(trim((string) ($d['code'] ?? '')));
            $dName = trim((string) ($d['name'] ?? ''));
            if (in_array($dCode, $aliases, true) || ($cleanName !== '' && strcasecmp($dName, $cleanName) === 0)) {
                return [
                    'code' => $cleanCode ?: $dCode,
                    'name' => $dName ?: $cleanName,
                    'hod_name' => $d['hod_name'] ?? $lecturerName,
                ];
            }
        }

        return [
            'code' => $cleanCode ?: 'CEM',
            'name' => $cleanName ?: 'Co-operative Economics & Management',
            'hod_name' => $lecturerName ?: 'Head of Department',
        ];
    }

    /**
     * POST /api/live-broadcast/verify-student
     * Verify student access for a departmental live classroom:
     * 1. Enforces that ONLY students of the organizing department (or added/approved by that department's lecturer in live_classroom_roster) can join.
     * 2. Supports joining by entering Matric No. (once added by the lecturer) OR Lecturer-created Username + Password/PIN.
     * 3. Automatically marks First 10-Minute Attendance (and Last-Minute Attendance if in final minute window).
     */
    public function verifyStudentAccess(Request $request)
    {
        $this->ensureDatabaseTables();

        $identifier = trim((string) $request->input('identifier', $request->input('matric', $request->input('username', ''))));
        $studentNameInput = trim((string) $request->input('name', ''));
        $pinInput = trim((string) $request->input('pin', $request->input('password', '')));
        $broadcastId = trim((string) $request->input('broadcast_id', ''));
        $reqDeptCode = strtoupper(trim((string) $request->input('department_code', '')));
        $reqDeptName = trim((string) $request->input('department_name', $request->input('department', '')));

        if ($identifier === '') {
            return response()->json([
                'success' => false,
                'error' => 'Please enter your Matriculation Number (or Lecturer-assigned Username) to join the live classroom.'
            ], 422);
        }

        // Resolve the active broadcast and its organizing department
        $broadcast = null;
        if ($broadcastId !== '') {
            $broadcast = $this->findBroadcastById($broadcastId);
        }
        if (!$broadcast) {
            try {
                $pdo = DatabaseService::getPdo();
                if ($pdo) {
                    $st = $pdo->query("SELECT * FROM live_broadcasts WHERE is_live = 1 AND status = 'live' ORDER BY started_at DESC LIMIT 1");
                    if ($st) {
                        $row = $st->fetch(\PDO::FETCH_ASSOC);
                        if ($row) $broadcast = (object) $row;
                    }
                }
                if (!$broadcast) {
                    $broadcast = DB::table('live_broadcasts')->where('is_live', true)->where('status', 'live')->orderBy('started_at', 'desc')->first();
                }
            } catch (\Throwable $e) {}
        }

        $targetDeptCode = $reqDeptCode;
        $targetDeptName = $reqDeptName;
        if ($broadcast) {
            $broadcastId = (string) $broadcast->id;
            $targetDeptCode = strtoupper(trim((string) ($broadcast->department_code ?? $targetDeptCode)));
            $targetDeptName = trim((string) ($broadcast->department_name ?? $targetDeptName));
        }
        if ($targetDeptCode === '' && preg_match('/^LIVE-([A-Z0-9]+)-/i', $broadcastId, $m)) {
            $targetDeptCode = strtoupper($m[1]);
        }

        $deptAliases = array_values(array_filter(
            $this->getDepartmentAliasGroup($targetDeptCode ?: $targetDeptName),
            fn($a) => strlen($a) <= 12
        ));
        if ($targetDeptCode !== '' && !in_array($targetDeptCode, $deptAliases, true)) {
            $deptAliases[] = $targetDeptCode;
        }

        // 1. Check Lecturer's Departmental Classroom Roster (`live_classroom_roster`) FIRST
        $rosterMatch = $this->findStudentInDepartmentRoster($identifier, $deptAliases);
        if ($rosterMatch) {
            $rosterStatus = strtolower(trim((string) ($rosterMatch['status'] ?? 'approved')));
            if ($rosterStatus === 'pending') {
                return response()->json([
                    'success' => false,
                    'code' => 'MATRIC_PENDING_LECTURER_APPROVAL',
                    'error' => "Your Matric No. ({$rosterMatch['matric_no']}) has been submitted to the {$targetDeptName} ({$targetDeptCode}) Lecturer. Please wait for the Lecturer to approve/add you in the Live Studio, then click Join again."
                ], 403);
            }

            // If student supplied a password/PIN and lecturer set a specific password_pin, verify it
            $storedPin = trim((string) ($rosterMatch['password_pin'] ?? ''));
            if ($pinInput !== '' && $storedPin !== '' && $storedPin !== '1234' && $storedPin !== $pinInput) {
                return response()->json([
                    'success' => false,
                    'code' => 'INVALID_CLASSROOM_PASSWORD',
                    'error' => 'The classroom password/PIN entered does not match the password assigned by your Lecturer. Leave password blank to join with your approved Matric No., or enter the exact password.'
                ], 401);
            }

            $verifiedStudent = [
                'id' => 'ROSTER-' . ($rosterMatch['id'] ?? time()),
                'name' => $rosterMatch['student_name'] ?: ($studentNameInput ?: 'Classroom Student'),
                'username' => $rosterMatch['username'] ?: $rosterMatch['matric_no'],
                'matric' => $rosterMatch['matric_no'],
                'barcode' => $rosterMatch['matric_no'],
                'email' => '',
                'phone' => '',
                'department' => $rosterMatch['department_name'] ?: ($targetDeptName ?: $targetDeptCode),
                'department_code' => $rosterMatch['department_code'] ?: $targetDeptCode,
                'level' => $rosterMatch['level'] ?? 'ND I',
                'role' => 'student',
                'verified_via' => 'lecturer_classroom_roster',
                'verified_at' => now()->toIso8601String(),
            ];

            $attendance = $broadcastId !== ''
                ? $this->recordStudentAttendance($broadcastId, $verifiedStudent, $broadcast)
                : null;

            return response()->json([
                'success' => true,
                'message' => "Verified on {$targetDeptCode} Lecturer Classroom Roster.",
                'student' => $verifiedStudent,
                'attendance' => $attendance,
            ]);
        }

        // 2. Look up in HOD-registered `users` / `patrons` tables
        $userRecord = null;
        try {
            $userRecord = StudentUserService::findForAuth($identifier);
        } catch (\Throwable $e) {}

        if (!$userRecord) {
            try {
                $pdo = DatabaseService::getPdo();
                if ($pdo) {
                    $st = $pdo->prepare("
                        SELECT * FROM patrons
                        WHERE LOWER(TRIM(COALESCE(matric_no, ''))) = LOWER(:id)
                           OR LOWER(TRIM(COALESCE(barcode, ''))) = LOWER(:id)
                           OR LOWER(TRIM(COALESCE(email, ''))) = LOWER(:id)
                           OR LOWER(TRIM(COALESCE(phone, ''))) = LOWER(:id)
                        LIMIT 1
                    ");
                    $st->execute([':id' => $identifier]);
                    $patronRow = $st->fetch(\PDO::FETCH_ASSOC);
                    if ($patronRow) {
                        $userRecord = [
                            'id' => $patronRow['id'] ?? ('STU-' . time()),
                            'name' => $patronRow['name'] ?? 'Registered Student',
                            'email' => $patronRow['email'] ?? '',
                            'matric' => $patronRow['matric_no'] ?? $identifier,
                            'barcode' => $patronRow['barcode'] ?? $identifier,
                            'department' => $patronRow['department'] ?? 'Academic Department',
                            'level' => $patronRow['level'] ?? 'ND I',
                            'role' => 'student',
                            'status' => $patronRow['status'] ?? 'Active',
                            'raw_pin' => $patronRow['pin'] ?? null,
                            'password_hash' => $patronRow['pin'] ?? null,
                        ];
                    }
                }
            } catch (\Throwable $e) {}
        }

        if (!$userRecord) {
            try {
                $pRow = DB::table('patrons')
                    ->whereRaw('LOWER(TRIM(COALESCE(matric_no, ""))) = ?', [strtolower($identifier)])
                    ->orWhereRaw('LOWER(TRIM(COALESCE(barcode, ""))) = ?', [strtolower($identifier)])
                    ->orWhereRaw('LOWER(TRIM(COALESCE(email, ""))) = ?', [strtolower($identifier)])
                    ->first();
                if ($pRow) {
                    $userRecord = [
                        'id' => $pRow->id ?? ('STU-' . time()),
                        'name' => $pRow->name ?? 'Registered Student',
                        'email' => $pRow->email ?? '',
                        'matric' => $pRow->matric_no ?? $identifier,
                        'barcode' => $pRow->barcode ?? $identifier,
                        'department' => $pRow->department ?? 'Academic Department',
                        'level' => $pRow->level ?? 'ND I',
                        'role' => 'student',
                        'status' => $pRow->status ?? 'Active',
                        'raw_pin' => $pRow->pin ?? null,
                        'password_hash' => $pRow->pin ?? null,
                    ];
                }
            } catch (\Throwable $e) {}
        }

        if (!$userRecord) {
            // Check if the Matric No. belongs to a different department's code (e.g. FCC/CEM/ND1/001 trying to join a CSC class)
            if ($targetDeptCode !== '' && preg_match('/(?:^|[\/\-_])(CSC|COM|CEM|OAO|BFN|BF|ACC|AT|AGT|OTM|PA|PAD|BAM|BUS|MKT|MAC|LIS|SLT|STA|EED|GNS)(?:[\/\-_\s0-9]|$)/i', $identifier, $deptMatch)) {
                $detectedDept = strtoupper($deptMatch[1]);
                if (!$this->departmentsMatch($targetDeptCode, $targetDeptName, $detectedDept, $identifier)) {
                    return response()->json([
                        'success' => false,
                        'code' => 'DEPARTMENT_ACCESS_RESTRICTED',
                        'target_department_code' => $targetDeptCode,
                        'target_department_name' => $targetDeptName,
                        'student_department' => $detectedDept,
                        'error' => "Departmental Access Restricted: This live lecture ({$broadcastId}) is organized by the Department of " . ($targetDeptName ?: $targetDeptCode) . " ({$targetDeptCode}). Matric No. \"{$identifier}\" belongs to {$detectedDept}. Only students of {$targetDeptCode} or students added by the {$targetDeptCode} Lecturer can join this classroom."
                    ], 403);
                }
            }

            return response()->json([
                'success' => false,
                'code' => 'STUDENT_NOT_REGISTERED',
                'error' => 'Matric No. "' . $identifier . '" has not been added to the ' . ($targetDeptName ?: $targetDeptCode ?: 'departmental') . ' classroom yet. Click "Submit Matric No. to Lecturer" below so the Lecturer can add you to the class.'
            ], 404);
        }

        // 3. STRICT DEPARTMENTAL ACCESS RESTRICTION CHECK
        // If this live lecture is organized by a specific department (e.g., CSC - Computer Science),
        // ONLY students belonging to that department (or added to the lecturer's roster above) are permitted to join!
        $studentDept = trim((string) ($userRecord['department'] ?? $userRecord['department_name'] ?? $userRecord['department_code'] ?? ''));
        $studentMatric = trim((string) ($userRecord['matric'] ?? $userRecord['barcode'] ?? $identifier));
        if ($targetDeptCode !== '' && !$this->departmentsMatch($targetDeptCode, $targetDeptName, $studentDept, $studentMatric)) {
            return response()->json([
                'success' => false,
                'code' => 'DEPARTMENT_ACCESS_RESTRICTED',
                'target_department_code' => $targetDeptCode,
                'target_department_name' => $targetDeptName,
                'student_department' => $studentDept ?: 'Another Department',
                'error' => "Departmental Access Restricted: This live lecture ({$broadcastId}) is organized by the Department of " . ($targetDeptName ?: $targetDeptCode) . " ({$targetDeptCode}). Your record belongs to \"" . ($studentDept ?: 'another department') . "\". Only students of " . ($targetDeptName ?: $targetDeptCode) . " or students added by the Lecturer can join this classroom."
            ], 403);
        }

        // Verify PIN if provided by the student and a PIN exists on record
        if ($pinInput !== '') {
            $pinValid = false;
            try {
                $pinValid = StudentUserService::verifyPassword($pinInput, $userRecord);
            } catch (\Throwable $e) {}

            if (!$pinValid && !empty($userRecord['raw_pin']) && trim((string) $userRecord['raw_pin']) === $pinInput) {
                $pinValid = true;
            }
            if (!$pinValid && empty($userRecord['raw_pin']) && empty($userRecord['password_hash'])) {
                $pinValid = true;
            }

            if (!$pinValid) {
                return response()->json([
                    'success' => false,
                    'code' => 'INVALID_STUDENT_PIN',
                    'error' => 'The Security PIN / Password entered does not match this student record. You can join directly using your Matriculation Number alone.'
                ], 401);
            }
        }

        // Check suspension status
        $status = strtolower(trim((string) ($userRecord['status'] ?? 'active')));
        if (in_array($status, ['suspended', 'blocked', 'revoked'], true)) {
            return response()->json([
                'success' => false,
                'code' => 'STUDENT_SUSPENDED',
                'error' => 'Your student library profile is currently suspended. Please contact your Head of Department (HOD) or Central Library Admin.'
            ], 403);
        }

        $verifiedStudent = [
            'id' => $userRecord['id'] ?? ('STU-' . time()),
            'name' => $userRecord['name'] ?? ($studentNameInput ?: 'Registered Student'),
            'username' => $userRecord['username'] ?? $studentMatric,
            'matric' => $studentMatric,
            'barcode' => $userRecord['barcode'] ?? $studentMatric,
            'email' => $userRecord['email'] ?? '',
            'phone' => $userRecord['phone'] ?? '',
            'department' => $studentDept ?: ($targetDeptName ?: 'Co-operative Economics & Management'),
            'department_code' => $targetDeptCode ?: 'CEM',
            'level' => $userRecord['level'] ?? 'ND I',
            'role' => 'student',
            'verified_via' => 'hod_registered_record',
            'verified_at' => now()->toIso8601String(),
        ];

        $attendance = $broadcastId !== ''
            ? $this->recordStudentAttendance($broadcastId, $verifiedStudent, $broadcast)
            : null;

        return response()->json([
            'success' => true,
            'message' => 'Department student verified and attendance logged.',
            'student' => $verifiedStudent,
            'attendance' => $attendance,
        ]);
    }

    /**
     * POST /api/live-broadcast/start
     * Initiate live lecture broadcast from HOD Dashboard or Staff Workspace
     * Generates department-based link code: LIVE-{DEPT_CODE}-{YYYYMMDD}-{HHMMSS}-{RAND}
     */
    public function start(Request $request)
    {
        $this->ensureDatabaseTables();

        $gov = $this->getGovernance();

        // 1. Master developer kill-switch check
        if (empty($gov['live_broadcast_master_enabled'])) {
            return response()->json([
                'success' => false,
                'code' => 'DEVELOPER_MASTER_LOCKED',
                'error' => 'Live broadcasting is currently disabled campus-wide in the Developer Governance Console.'
            ], 403);
        }

        // 2. Resolve authentic Organizing Department from DB so link code is strictly based on the department
        $resolvedDept = $this->resolveBroadcastDepartmentFromDb(
            (string) $request->input('department_code', ''),
            (string) $request->input('department_name', ''),
            (string) $request->input('course_code', ''),
            (string) $request->input('lecturer_name', '')
        );

        $deptUpper = strtoupper($resolvedDept['code']);
        $deptCode = strtolower($deptUpper);
        $deptName = $resolvedDept['name'];
        $courseCode = trim((string) ($request->input('course_code') ?: ($deptUpper . ' 111')));
        $courseTitle = trim((string) ($request->input('course_title') ?: $courseCode));
        $lecturerName = trim((string) ($request->input('lecturer_name') ?: $resolvedDept['hod_name'] ?: 'Head of Department'));
        $title = trim((string) ($request->input('title') ?: ($courseCode . ': ' . $courseTitle . ' — Live Interactive Lecture')));

        $deptKey = 'live_broadcast_dept_' . $deptCode;
        if (isset($gov[$deptKey]) && empty($gov[$deptKey])) {
            return response()->json([
                'success' => false,
                'code' => 'DEPT_LIVE_LOCKED',
                'error' => "Live streaming for the Department of {$deptName} is currently locked. Please contact the Library Developer through the Developer Authority Portal to activate live broadcasting."
            ], 403);
        }

        // Close any previous dangling live sessions for THIS specific department only (allowing other departments to remain live concurrently)
        try {
            DB::table('live_broadcasts')
                ->where('department_code', $deptUpper)
                ->where(function ($q) {
                    $q->where('is_live', true)->orWhere('status', 'live');
                })
                ->update(['is_live' => false, 'status' => 'ended', 'ended_at' => now(), 'updated_at' => now()]);
        } catch (\Throwable $e) {}

        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $stCleanup = $pdo->prepare("UPDATE live_broadcasts SET is_live = 0, status = 'ended', ended_at = NOW(), updated_at = NOW() WHERE department_code = :dc AND (is_live = 1 OR status = 'live')");
                $stCleanup->execute([':dc' => $deptUpper]);
            }
        } catch (\Throwable $e) {}

        $broadcastId = 'LIVE-' . $deptUpper . '-' . date('Ymd-His') . '-' . strtoupper(Str::random(4));
        $nowStr = now()->toDateTimeString();

        $simulcastJson = is_array($request->input('simulcast_destinations'))
            ? json_encode($request->input('simulcast_destinations'))
            : (string) $request->input('simulcast_destinations', '[]');

        $data = [
            'id' => $broadcastId,
            'title' => $title,
            'department_code' => $deptUpper,
            'department_name' => $deptName,
            'course_code' => $courseCode,
            'course_title' => $courseTitle,
            'lecturer_name' => $lecturerName,
            'lecturer_role' => $request->input('lecturer_role', 'hod'),
            'status' => 'live',
            'is_live' => true,
            'stream_mode' => $request->input('stream_mode', 'system_camera'),
            'resolution' => $request->input('resolution', '1080p Full HD'),
            'viewers_count' => 0,
            'simulcast_destinations' => $simulcastJson,
            'announcement' => $request->input('announcement', ''),
            'companion_pdf_url' => $request->input('companion_pdf_url', ''),
            'started_at' => $nowStr,
            'created_at' => $nowStr,
            'updated_at' => $nowStr,
        ];

        // 1. Insert into Laravel DB
        try {
            DB::table('live_broadcasts')->insert($data);
        } catch (\Throwable $e) {}

        // 2. Insert into MySQL DB
        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->prepare("
                    INSERT INTO live_broadcasts
                    (id, title, department_code, department_name, course_code, course_title, lecturer_name, lecturer_role, status, is_live, stream_mode, resolution, viewers_count, simulcast_destinations, announcement, companion_pdf_url, started_at, created_at, updated_at)
                    VALUES (:id, :title, :dc, :dn, :cc, :ct, :ln, :lr, 'live', 1, :sm, :res, 0, :sim, :ann, :pdf, NOW(), NOW(), NOW())
                ");
                $st->execute([
                    ':id' => $data['id'],
                    ':title' => $data['title'],
                    ':dc' => $data['department_code'],
                    ':dn' => $data['department_name'],
                    ':cc' => $data['course_code'],
                    ':ct' => $data['course_title'],
                    ':ln' => $data['lecturer_name'],
                    ':lr' => $data['lecturer_role'],
                    ':sm' => $data['stream_mode'],
                    ':res' => $data['resolution'],
                    ':sim' => $data['simulcast_destinations'],
                    ':ann' => $data['announcement'],
                    ':pdf' => $data['companion_pdf_url'],
                ]);
            }
        } catch (\Throwable $e) {}

        // Also persist current studio config so reload keeps exact metadata
        $this->saveStudioConfig($request);

        // Initialize empty active viewer map & host heartbeat in DB
        $this->setSettingValue('fcc_live_viewers_' . $broadcastId, json_encode([]), 'LiveBroadcast', "Active viewers for {$broadcastId}");
        $this->setSettingValue('fcc_live_host_hb_' . $broadcastId, (string) time(), 'LiveBroadcast', "Host heartbeat for {$broadcastId}");

        // Broadcast initial system welcome message
        $welcomeMsg = "🔴 Live Lecture Broadcast started by {$data['lecturer_name']} ({$data['department_name']} - {$data['course_code']}). All connecting students are verified via database.";
        $this->insertChatMessageToDb([
            'broadcast_id' => $broadcastId,
            'user_name' => 'FCC Library Broadcast Core',
            'user_role' => 'system',
            'user_matric' => 'SYS-CORE',
            'message' => $welcomeMsg,
            'is_question' => false,
            'hand_raised' => false,
        ]);

        // Emit instant cross-device realtime sync event
        try {
            \App\Http\Controllers\Api\RealtimeSyncController::recordEvent([
                'action' => 'LIVE_BROADCAST_STARTED',
                'entity' => 'live_broadcast',
                'id' => $broadcastId,
                'title' => $data['title'],
                'data' => $data,
                'source' => 'live_broadcast_studio',
            ]);
        } catch (\Throwable $e) {}

        $concurrentStreams = $this->fetchAllActiveCampusStreams();

        return response()->json([
            'success' => true,
            'message' => 'Live broadcast session created and persisted in database',
            'broadcast' => $data,
            'concurrent_campus_streams' => $concurrentStreams,
        ])->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    }

    /**
     * POST /api/live-broadcast/{id}/host-heartbeat
     * Keep active broadcast session alive while studio is transmitting
     */
    public function hostHeartbeat(Request $request, $id)
    {
        $this->setSettingValue('fcc_live_host_hb_' . $id, (string) time(), 'LiveBroadcast', "Host heartbeat for {$id}");

        $isLive = false;
        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $pdo->prepare("UPDATE live_broadcasts SET updated_at = NOW() WHERE id = :id AND is_live = 1")->execute([':id' => $id]);
                $st = $pdo->prepare("SELECT is_live FROM live_broadcasts WHERE id = :id LIMIT 1");
                $st->execute([':id' => $id]);
                $row = $st->fetch(\PDO::FETCH_ASSOC);
                if ($row) {
                    $isLive = (int) ($row['is_live'] ?? 0) === 1;
                }
            } else {
                DB::table('live_broadcasts')->where('id', $id)->where('is_live', true)->update(['updated_at' => now()]);
                $row = DB::table('live_broadcasts')->where('id', $id)->first();
                if ($row) {
                    $isLive = (bool) ($row->is_live ?? false);
                }
            }
        } catch (\Throwable $e) {}

        return response()->json([
            'success' => true,
            'id' => $id,
            'is_live' => $isLive,
            'viewers_count' => $this->computeActiveViewersCount($id, 0),
            'timestamp' => time(),
        ])->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    }

    /**
     * PUT /api/live-broadcast/{id}
     * Update an active broadcast's metadata in real time
     */
    public function updateBroadcast(Request $request, $id)
    {
        $this->ensureDatabaseTables();

        $updates = [];
        foreach (['title', 'course_code', 'course_title', 'lecturer_name', 'stream_mode', 'resolution', 'announcement', 'companion_pdf_url'] as $field) {
            if ($request->has($field)) {
                $updates[$field] = $request->input($field);
            }
        }
        $updates['updated_at'] = now();

        try {
            DB::table('live_broadcasts')->where('id', $id)->where('is_live', true)->update($updates);
        } catch (\Throwable $e) {}

        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->prepare("
                    UPDATE live_broadcasts
                    SET title = COALESCE(:title, title),
                        course_code = COALESCE(:cc, course_code),
                        course_title = COALESCE(:ct, course_title),
                        lecturer_name = COALESCE(:ln, lecturer_name),
                        stream_mode = COALESCE(:sm, stream_mode),
                        resolution = COALESCE(:res, resolution),
                        announcement = COALESCE(:ann, announcement),
                        companion_pdf_url = COALESCE(:pdf, companion_pdf_url),
                        updated_at = NOW()
                    WHERE id = :id AND is_live = 1
                ");
                $st->execute([
                    ':title' => $request->input('title'),
                    ':cc' => $request->input('course_code'),
                    ':ct' => $request->input('course_title'),
                    ':ln' => $request->input('lecturer_name'),
                    ':sm' => $request->input('stream_mode'),
                    ':res' => $request->input('resolution'),
                    ':ann' => $request->input('announcement'),
                    ':pdf' => $request->input('companion_pdf_url'),
                    ':id' => $id,
                ]);
            }
        } catch (\Throwable $e) {}

        return response()->json([
            'success' => true,
            'message' => 'Active live broadcast updated in database',
        ]);
    }

    /**
     * POST /api/live-broadcast/{id?}/end
     * Stop active broadcast for the specified session/department (allowing other departments' concurrent broadcasts to remain live),
     * emit instant cross-device termination event, and archive recorded video to Central Library Catalogue
     */
    public function end(Request $request, $id = null)
    {
        $this->ensureDatabaseTables();

        $targetId = trim((string) ($id ?: $request->input('broadcast_id', $request->input('id', ''))));
        $targetDept = strtoupper(trim((string) $request->input('department_code', '')));
        $endAllCampus = $request->boolean('end_all_campus', false);
        $broadcast = null;

        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                if ($targetId !== '' && !in_array(strtolower($targetId), ['active', 'all'], true)) {
                    $st = $pdo->prepare("SELECT * FROM live_broadcasts WHERE id = :id LIMIT 1");
                    $st->execute([':id' => $targetId]);
                    $row = $st->fetch(\PDO::FETCH_ASSOC);
                    if ($row) $broadcast = (object) $row;
                }
                if (!$broadcast && $targetDept !== '') {
                    $stDept = $pdo->prepare("SELECT * FROM live_broadcasts WHERE department_code = :dc AND (is_live = 1 OR status = 'live') ORDER BY started_at DESC LIMIT 1");
                    $stDept->execute([':dc' => $targetDept]);
                    $row = $stDept->fetch(\PDO::FETCH_ASSOC);
                    if ($row) $broadcast = (object) $row;
                }
                if (!$broadcast) {
                    $stAny = $pdo->query("SELECT * FROM live_broadcasts WHERE is_live = 1 OR status = 'live' ORDER BY started_at DESC LIMIT 1");
                    if ($stAny) {
                        $row = $stAny->fetch(\PDO::FETCH_ASSOC);
                        if ($row) $broadcast = (object) $row;
                    }
                }
            }
        } catch (\Throwable $e) {}

        if (!$broadcast) {
            try {
                if ($targetId !== '' && !in_array(strtolower($targetId), ['active', 'all'], true)) {
                    $broadcast = DB::table('live_broadcasts')->where('id', $targetId)->first();
                }
                if (!$broadcast && $targetDept !== '') {
                    $broadcast = DB::table('live_broadcasts')
                        ->where('department_code', $targetDept)
                        ->where(function ($q) {
                            $q->where('is_live', true)->orWhere('status', 'live');
                        })
                        ->orderBy('started_at', 'desc')
                        ->first();
                }
                if (!$broadcast) {
                    $broadcast = DB::table('live_broadcasts')
                        ->where('is_live', true)
                        ->orderBy('started_at', 'desc')
                        ->first();
                }
            } catch (\Throwable $e) {}
        }

        $resolvedId = $broadcast->id ?? ($targetId !== '' && !in_array(strtolower($targetId), ['active', 'all'], true) ? $targetId : ($endAllCampus ? 'ALL' : ''));
        $resolvedDept = strtoupper((string) ($broadcast->department_code ?? $targetDept));

        // 0. Automatically mark Last-Minute Attendance for all students present in the final minute of the class
        if ($resolvedId && $resolvedId !== 'ALL') {
            $this->finalizeLastMinuteAttendanceOnEnd($resolvedId);
        }

        // 1. Terminate targeted session(s) in Laravel DB (preserving other departments' concurrent broadcasts)
        try {
            $query = DB::table('live_broadcasts');
            if ($endAllCampus || $resolvedId === 'ALL') {
                $query->where(function ($q) {
                    $q->where('is_live', true)->orWhere('status', 'live');
                });
            } elseif ($resolvedId !== '') {
                $query->where('id', $resolvedId);
            } elseif ($resolvedDept !== '') {
                $query->where('department_code', $resolvedDept)
                    ->where(function ($q) {
                        $q->where('is_live', true)->orWhere('status', 'live');
                    });
            } else {
                $query->whereRaw('1 = 0');
            }
            $query->update([
                'is_live' => false,
                'status' => 'ended',
                'ended_at' => now(),
                'updated_at' => now()
            ]);
        } catch (\Throwable $e) {}

        // 2. Terminate targeted session(s) in MySQL (preserving other departments' concurrent broadcasts)
        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                if ($endAllCampus || $resolvedId === 'ALL') {
                    $pdo->exec("
                        UPDATE live_broadcasts
                        SET is_live = 0,
                            status = 'ended',
                            ended_at = COALESCE(ended_at, NOW()),
                            updated_at = NOW()
                        WHERE is_live = 1 OR status = 'live'
                    ");
                } elseif ($resolvedId !== '') {
                    $st = $pdo->prepare("
                        UPDATE live_broadcasts
                        SET is_live = 0,
                            status = 'ended',
                            ended_at = COALESCE(ended_at, NOW()),
                            updated_at = NOW()
                        WHERE id = :id
                    ");
                    $st->execute([':id' => $resolvedId]);
                } elseif ($resolvedDept !== '') {
                    $st = $pdo->prepare("
                        UPDATE live_broadcasts
                        SET is_live = 0,
                            status = 'ended',
                            ended_at = COALESCE(ended_at, NOW()),
                            updated_at = NOW()
                        WHERE department_code = :dc AND (is_live = 1 OR status = 'live')
                    ");
                    $st->execute([':dc' => $resolvedDept]);
                }
            }
        } catch (\Throwable $e) {}

        // 3. Clear active viewer map and remove live snapshot frame so no stale frame remains
        if ($resolvedId && $resolvedId !== 'ALL') {
            $this->setSettingValue('fcc_live_viewers_' . $resolvedId, json_encode([]), 'LiveBroadcast', "Ended viewers for {$resolvedId}");
            $framePath = storage_path('app/public/live/' . $resolvedId . '/frame.jpg');
            if (file_exists($framePath)) {
                @unlink($framePath);
            }
        }

        // 4. Emit instant cross-device realtime sync termination signal for this specific broadcast
        try {
            \App\Http\Controllers\Api\RealtimeSyncController::recordEvent([
                'action' => 'LIVE_BROADCAST_ENDED',
                'entity' => 'live_broadcast',
                'id' => $resolvedId ?: 'ALL',
                'title' => $broadcast->title ?? 'Live Lecture Ended',
                'data' => [
                    'id' => $resolvedId ?: 'ALL',
                    'department_code' => $resolvedDept,
                    'active' => false,
                    'is_live' => false,
                    'status' => 'ended',
                    'ended_at' => now()->toIso8601String(),
                ],
                'source' => 'live_broadcast_studio',
            ]);
        } catch (\Throwable $e) {}

        $archivedMediaId = null;
        $mediaUrl = null;

        // 5. Auto-archive recorded lecture if broadcast record exists and file or stream buffer is present
        if ($broadcast && !empty($broadcast->id)) {
            $bId = $broadcast->id;
            $liveBufferPath = storage_path('app/public/live/' . $bId . '/stream.webm');
            if ($request->hasFile('recording_file')) {
                $file = $request->file('recording_file');
                $ext = $file->getClientOriginalExtension() ?: 'webm';
                $filename = 'FCC-LIVE-ARCHIVE-' . time() . '-' . uniqid() . '.' . $ext;
                $file->storeAs('public/media', $filename);
                $mediaUrl = '/storage/media/' . $filename;
            } elseif (file_exists($liveBufferPath) && filesize($liveBufferPath) > 1024) {
                $filename = 'FCC-LIVE-ARCHIVE-' . time() . '-' . uniqid() . '.webm';
                $destDir = storage_path('app/public/media');
                if (!file_exists($destDir)) mkdir($destDir, 0777, true);
                @copy($liveBufferPath, $destDir . '/' . $filename);
                $mediaUrl = '/storage/media/' . $filename;
            }

            if ($mediaUrl) {
                $archivedMediaId = 'MED-VID-LIVE-' . strtoupper(Str::random(6));
                $mediaRecord = [
                    'id' => $archivedMediaId,
                    'title' => ($broadcast->title ?: 'Live Lecture') . ' (Recorded Live Lecture)',
                    'subtitle' => 'Live Broadcast Session from ' . date('F j, Y'),
                    'media_type' => 'video',
                    'resource_type' => 'lecture_recording',
                    'creator' => $broadcast->lecturer_name ?: 'Lecturer',
                    'creator_title' => ($broadcast->lecturer_role ?? 'hod') === 'hod' ? 'Head of Department' : 'Lecturer',
                    'department_id' => $broadcast->department_code ?: 'CEM',
                    'department_name' => $broadcast->department_name ?: 'Academic Department',
                    'course_code' => $broadcast->course_code ?: '',
                    'target_level' => $request->input('target_level', 'ND I'),
                    'duration_seconds' => intval($request->input('duration_seconds', 1800)),
                    'duration_formatted' => $request->input('duration_formatted', '30:00'),
                    'description' => "Live interactive lecture recording broadcast from the FCC Institutional Multimedia Studio. Archived automatically for student review and examination revision.",
                    'subject_keywords' => json_encode(['Live Lecture', $broadcast->department_name ?? '', $broadcast->course_code ?? '']),
                    'media_url' => $mediaUrl,
                    'video_resolution' => $broadcast->resolution ?: '1080p Full HD',
                    'access_level' => 'open_access',
                    'status' => 'published',
                    'uploaded_by' => $broadcast->lecturer_name ?: 'Lecturer',
                    'created_at' => now(),
                    'updated_at' => now()
                ];

                try {
                    DB::table('media_resources')->insert($mediaRecord);
                } catch (\Throwable $e) {}

                try {
                    $pdo = DatabaseService::getPdo();
                    if ($pdo) {
                        $st = $pdo->prepare("
                            INSERT IGNORE INTO media_resources
                            (id, title, subtitle, media_type, resource_type, creator, creator_title, department_id, department_name, course_code, target_level, duration_seconds, duration_formatted, description, subject_keywords, media_url, video_resolution, access_level, status, uploaded_by, created_at, updated_at)
                            VALUES (:id, :title, :sub, :mt, :rt, :cr, :crt, :did, :dn, :cc, :tl, :ds, :df, :desc, :sk, :mu, :vr, :al, :st, :ub, NOW(), NOW())
                        ");
                        $st->execute([
                            ':id' => $mediaRecord['id'],
                            ':title' => $mediaRecord['title'],
                            ':sub' => $mediaRecord['subtitle'],
                            ':mt' => $mediaRecord['media_type'],
                            ':rt' => $mediaRecord['resource_type'],
                            ':cr' => $mediaRecord['creator'],
                            ':crt' => $mediaRecord['creator_title'],
                            ':did' => $mediaRecord['department_id'],
                            ':dn' => $mediaRecord['department_name'],
                            ':cc' => $mediaRecord['course_code'],
                            ':tl' => $mediaRecord['target_level'],
                            ':ds' => $mediaRecord['duration_seconds'],
                            ':df' => $mediaRecord['duration_formatted'],
                            ':desc' => $mediaRecord['description'],
                            ':sk' => $mediaRecord['subject_keywords'],
                            ':mu' => $mediaRecord['media_url'],
                            ':vr' => $mediaRecord['video_resolution'],
                            ':al' => $mediaRecord['access_level'],
                            ':st' => $mediaRecord['status'],
                            ':ub' => $mediaRecord['uploaded_by'],
                        ]);
                    }
                } catch (\Throwable $e) {}

                try {
                    DB::table('live_broadcasts')->where('id', $bId)->update([
                        'recording_media_id' => $archivedMediaId
                    ]);
                } catch (\Throwable $e) {}

                try {
                    $pdo = DatabaseService::getPdo();
                    if ($pdo) {
                        $st = $pdo->prepare("UPDATE live_broadcasts SET recording_media_id = :mid WHERE id = :id");
                        $st->execute([':mid' => $archivedMediaId, ':id' => $bId]);
                    }
                } catch (\Throwable $e) {}
            }
        }

        $remainingStreams = $this->fetchAllActiveCampusStreams();

        return response()->json([
            'success' => true,
            'active' => false,
            'ended_id' => $resolvedId,
            'department_code' => $resolvedDept,
            'remaining_streams' => $remainingStreams,
            'remaining_count' => count($remainingStreams),
            'message' => 'Departmental broadcast terminated and archived in database',
            'archived_media_id' => $archivedMediaId,
            'media_url' => $mediaUrl,
        ])->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    }

    /**
     * DELETE /api/live-broadcast/{id}
     * Remove a past broadcast history record from the database
     */
    public function deleteBroadcast(Request $request, $id)
    {
        $this->ensureDatabaseTables();

        try {
            DB::table('live_broadcast_chats')->where('broadcast_id', $id)->delete();
            DB::table('live_broadcast_signals')->where('broadcast_id', $id)->delete();
            DB::table('live_broadcasts')->where('id', $id)->delete();
        } catch (\Throwable $e) {}

        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $pdo->prepare("DELETE FROM live_broadcast_chats WHERE broadcast_id = :id")->execute([':id' => $id]);
                $pdo->prepare("DELETE FROM live_broadcast_signals WHERE broadcast_id = :id")->execute([':id' => $id]);
                $pdo->prepare("DELETE FROM live_broadcasts WHERE id = :id")->execute([':id' => $id]);
            }
        } catch (\Throwable $e) {}

        return response()->json([
            'success' => true,
            'message' => 'Broadcast session deleted from database',
        ]);
    }

    /**
     * Internal helper to fetch chat messages from MySQL / Laravel DB
     */
    private function fetchChatMessagesFromDb(string $broadcastId): array
    {
        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->prepare("SELECT * FROM live_broadcast_chats WHERE broadcast_id = :id ORDER BY id ASC LIMIT 250");
                $st->execute([':id' => $broadcastId]);
                $rows = $st->fetchAll(\PDO::FETCH_ASSOC);
                if (!empty($rows)) {
                    return array_map(function ($r) {
                        $r['is_question'] = (bool) ($r['is_question'] ?? false);
                        $r['hand_raised'] = (bool) ($r['hand_raised'] ?? false);
                        return $r;
                    }, $rows);
                }
            }
        } catch (\Throwable $e) {}

        try {
            return DB::table('live_broadcast_chats')
                ->where('broadcast_id', $broadcastId)
                ->orderBy('id', 'asc')
                ->take(250)
                ->get()
                ->map(function ($r) {
                    $arr = (array) $r;
                    $arr['is_question'] = (bool) ($arr['is_question'] ?? false);
                    $arr['hand_raised'] = (bool) ($arr['hand_raised'] ?? false);
                    return $arr;
                })
                ->toArray();
        } catch (\Throwable $e) {
            return [];
        }
    }

    /**
     * Internal helper to insert a chat message into both MySQL and Laravel DB
     */
    private function insertChatMessageToDb(array $payload): int
    {
        $chatId = 0;
        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->prepare("
                    INSERT INTO live_broadcast_chats
                    (broadcast_id, user_name, user_role, user_matric, message, is_question, hand_raised, created_at, updated_at)
                    VALUES (:bid, :un, :ur, :um, :msg, :iq, :hr, NOW(), NOW())
                ");
                $st->execute([
                    ':bid' => $payload['broadcast_id'],
                    ':un' => $payload['user_name'],
                    ':ur' => $payload['user_role'] ?? 'student',
                    ':um' => $payload['user_matric'] ?? 'STUDENT',
                    ':msg' => $payload['message'],
                    ':iq' => !empty($payload['is_question']) ? 1 : 0,
                    ':hr' => !empty($payload['hand_raised']) ? 1 : 0,
                ]);
                $chatId = (int) $pdo->lastInsertId();
            }
        } catch (\Throwable $e) {}

        try {
            $localId = DB::table('live_broadcast_chats')->insertGetId([
                'broadcast_id' => $payload['broadcast_id'],
                'user_name' => $payload['user_name'],
                'user_role' => $payload['user_role'] ?? 'student',
                'user_matric' => $payload['user_matric'] ?? 'STUDENT',
                'message' => $payload['message'],
                'is_question' => !empty($payload['is_question']),
                'hand_raised' => !empty($payload['hand_raised']),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            if (!$chatId) $chatId = (int) $localId;
        } catch (\Throwable $e) {}

        return $chatId;
    }

    /**
     * GET /api/live-broadcast/{id}/chat
     * Live chat polling & messages
     */
    public function getChatMessages(Request $request, $id)
    {
        $this->ensureDatabaseTables();

        $messages = $this->fetchChatMessagesFromDb($id);
        $viewersCount = $this->computeActiveViewersCount($id, 0);

        return response()->json([
            'success' => true,
            'messages' => $messages,
            'viewers_count' => $viewersCount,
        ]);
    }

    /**
     * POST /api/live-broadcast/{id}/chat
     * Send student chat message or raised hand question
     */
    public function sendChatMessage(Request $request, $id)
    {
        $this->ensureDatabaseTables();

        $userName = trim((string) $request->input('user_name', 'Student'));
        $message = trim((string) $request->input('message', ''));
        if ($message === '') {
            return response()->json([
                'success' => false,
                'error' => 'Message cannot be empty.',
                'messages' => $this->fetchChatMessagesFromDb($id),
            ], 422);
        }

        $chatId = $this->insertChatMessageToDb([
            'broadcast_id' => $id,
            'user_name' => $userName !== '' ? substr($userName, 0, 255) : 'Student',
            'user_role' => $request->input('user_role', 'student'),
            'user_matric' => $request->input('user_matric', 'STUDENT'),
            'message' => substr($message, 0, 1000),
            'is_question' => $request->boolean('is_question'),
            'hand_raised' => $request->boolean('hand_raised'),
        ]);

        return response()->json([
            'success' => true,
            'chat_id' => $chatId,
            'messages' => $this->fetchChatMessagesFromDb($id),
        ]);
    }

    /**
     * DELETE /api/live-broadcast/{id}/chat
     * Clear chat messages or lower all raised hands for an active broadcast
     */
    public function clearChat(Request $request, $id)
    {
        $this->ensureDatabaseTables();
        $mode = $request->input('mode', 'all'); // 'all' | 'hands'

        if ($mode === 'hands') {
            try {
                DB::table('live_broadcast_chats')->where('broadcast_id', $id)->update(['hand_raised' => false]);
            } catch (\Throwable $e) {}
            try {
                $pdo = DatabaseService::getPdo();
                if ($pdo) {
                    $pdo->prepare("UPDATE live_broadcast_chats SET hand_raised = 0 WHERE broadcast_id = :id")->execute([':id' => $id]);
                }
            } catch (\Throwable $e) {}
        } else {
            try {
                DB::table('live_broadcast_chats')->where('broadcast_id', $id)->delete();
            } catch (\Throwable $e) {}
            try {
                $pdo = DatabaseService::getPdo();
                if ($pdo) {
                    $pdo->prepare("DELETE FROM live_broadcast_chats WHERE broadcast_id = :id")->execute([':id' => $id]);
                }
            } catch (\Throwable $e) {}
        }

        return response()->json([
            'success' => true,
            'messages' => $this->fetchChatMessagesFromDb($id),
        ]);
    }

    /**
     * Compute accurate active viewer count by pruning viewers inactive for > 40 seconds
     */
    private function computeActiveViewersCount(string $broadcastId, int $fallback = 0): int
    {
        $key = 'fcc_live_viewers_' . $broadcastId;
        $raw = $this->getSettingValue($key);
        if (!$raw) {
            return $fallback;
        }

        $map = json_decode($raw, true);
        if (!is_array($map)) {
            return $fallback;
        }

        $nowTs = time();
        $active = [];
        foreach ($map as $vId => $lastSeen) {
            if (($nowTs - (int) $lastSeen) <= 40) {
                $active[$vId] = (int) $lastSeen;
            }
        }

        $count = count($active);
        if ($count !== count($map)) {
            $this->setSettingValue($key, json_encode($active), 'LiveBroadcast', "Active viewers for {$broadcastId}");
        }

        try {
            DB::table('live_broadcasts')->where('id', $broadcastId)->update(['viewers_count' => $count]);
        } catch (\Throwable $e) {}

        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $pdo->prepare("UPDATE live_broadcasts SET viewers_count = :c WHERE id = :id")->execute([':c' => $count, ':id' => $broadcastId]);
            }
        } catch (\Throwable $e) {}

        return $count;
    }

    /**
     * POST /api/live-broadcast/{id}/heartbeat
     * Student viewer heartbeat to keep active viewer count accurate in the database
     */
    public function heartbeat(Request $request, $id)
    {
        $this->ensureDatabaseTables();

        $viewerId = trim((string) $request->input('viewer_id', ''));
        if ($viewerId === '') {
            $viewerId = 'IP-' . ($request->ip() ?: 'LOCAL') . '-' . substr(md5((string) $request->userAgent()), 0, 8);
        }

        $key = 'fcc_live_viewers_' . $id;
        $raw = $this->getSettingValue($key);
        $map = $raw ? (json_decode($raw, true) ?: []) : [];

        $nowTs = time();
        if ($request->boolean('leave')) {
            unset($map[$viewerId]);
        } else {
            $map[$viewerId] = $nowTs;
        }

        // Prune stale viewers (> 40s)
        $active = [];
        foreach ($map as $vId => $lastSeen) {
            if (($nowTs - (int) $lastSeen) <= 40) {
                $active[$vId] = (int) $lastSeen;
            }
        }

        $this->setSettingValue($key, json_encode($active), 'LiveBroadcast', "Active viewers for {$id}");
        $viewersCount = count($active);

        try {
            DB::table('live_broadcasts')->where('id', $id)->update(['viewers_count' => $viewersCount]);
        } catch (\Throwable $e) {}

        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $pdo->prepare("UPDATE live_broadcasts SET viewers_count = :c WHERE id = :id")->execute([':c' => $viewersCount, ':id' => $id]);
            }
        } catch (\Throwable $e) {}

        $attendance = null;
        $studentMatric = trim((string) $request->input('matric', ''));
        if (!$request->boolean('leave') && $studentMatric !== '' && $studentMatric !== 'STUDENT') {
            $attendance = $this->recordStudentAttendance($id, [
                'matric' => $studentMatric,
                'username' => $request->input('username', $studentMatric),
                'name' => $request->input('name', 'Student'),
                'department_code' => $request->input('department_code', ''),
                'level' => $request->input('level', 'ND I'),
            ]);
        }

        return response()->json([
            'success' => true,
            'viewers_count' => $viewersCount,
            'attendance' => $attendance,
        ]);
    }

    /**
     * GET /api/live-broadcast/social-destinations
     * Get configured social destinations (YouTube, Facebook, LinkedIn, X, Twitch, Custom) from DB
     */
    public function getSocialDestinations(Request $request)
    {
        $dept = strtoupper(trim((string) $request->input('department_code', 'GLOBAL')));
        $destinations = $this->ensureAndFetchSocialDestinations($dept);

        return response()->json([
            'success' => true,
            'destinations' => $destinations,
        ]);
    }

    /**
     * POST /api/live-broadcast/social-destinations
     * Update social media stream keys, ingest URLs, and enabled state in DB
     */
    public function saveSocialDestinations(Request $request)
    {
        $this->ensureDatabaseTables();

        $dests = $request->input('destinations', []);
        $dept = strtoupper(trim((string) $request->input('department_code', 'GLOBAL')));

        foreach ($dests as $d) {
            if (!isset($d['platform'])) continue;

            $platform = trim((string) $d['platform']);
            $platformName = $d['platform_name'] ?? ucfirst($platform);
            $serverUrl = $d['server_url'] ?? '';
            $streamKey = $d['stream_key'] ?? '';
            $enabled = !empty($d['enabled']);
            $status = !empty($streamKey) ? 'ready' : 'configured';

            try {
                DB::table('live_social_destinations')->updateOrInsert(
                    ['department_code' => $dept, 'platform' => $platform],
                    [
                        'platform_name' => $platformName,
                        'server_url' => $serverUrl,
                        'stream_key' => $streamKey,
                        'enabled' => $enabled,
                        'status' => $status,
                        'updated_at' => now(),
                    ]
                );
            } catch (\Throwable $e) {}

            try {
                $pdo = DatabaseService::getPdo();
                if ($pdo) {
                    $st = $pdo->prepare("
                        INSERT INTO live_social_destinations
                        (department_code, platform, platform_name, server_url, stream_key, enabled, status, created_at, updated_at)
                        VALUES (:d, :p, :pn, :su, :sk, :en, :st, NOW(), NOW())
                        ON DUPLICATE KEY UPDATE
                        platform_name = VALUES(platform_name),
                        server_url = VALUES(server_url),
                        stream_key = VALUES(stream_key),
                        enabled = VALUES(enabled),
                        status = VALUES(status),
                        updated_at = NOW()
                    ");
                    $st->execute([
                        ':d' => $dept,
                        ':p' => $platform,
                        ':pn' => $platformName,
                        ':su' => $serverUrl,
                        ':sk' => $streamKey,
                        ':en' => $enabled ? 1 : 0,
                        ':st' => $status,
                    ]);
                }
            } catch (\Throwable $e) {}
        }

        $updated = $this->ensureAndFetchSocialDestinations($dept);

        // Also update active broadcast's simulcast_destinations if live
        $enabledOnly = array_values(array_filter($updated, fn($item) => !empty($item['enabled'])));
        try {
            DB::table('live_broadcasts')
                ->where('department_code', $dept)
                ->where('is_live', true)
                ->update(['simulcast_destinations' => json_encode($enabledOnly), 'updated_at' => now()]);
        } catch (\Throwable $e) {}

        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->prepare("UPDATE live_broadcasts SET simulcast_destinations = :sim, updated_at = NOW() WHERE department_code = :d AND is_live = 1");
                $st->execute([':sim' => json_encode($enabledOnly), ':d' => $dept]);
            }
        } catch (\Throwable $e) {}

        return response()->json([
            'success' => true,
            'message' => 'Social media simulcast destinations saved to database',
            'destinations' => $updated,
        ]);
    }

    /**
     * POST /api/live-broadcast/social-destinations/toggle
     * Toggle a single social destination platform on/off directly in DB
     */
    public function toggleSocialDestination(Request $request)
    {
        $this->ensureDatabaseTables();

        $dept = strtoupper(trim((string) $request->input('department_code', 'GLOBAL')));
        $platform = trim((string) $request->input('platform', ''));

        if ($platform === '') {
            return response()->json(['success' => false, 'error' => 'Platform is required'], 400);
        }

        $current = $this->ensureAndFetchSocialDestinations($dept);
        foreach ($current as &$item) {
            if ($item['platform'] === $platform) {
                $item['enabled'] = $request->has('enabled') ? $request->boolean('enabled') : !$item['enabled'];
            }
        }

        $request->merge([
            'department_code' => $dept,
            'destinations' => $current,
        ]);

        return $this->saveSocialDestinations($request);
    }

    /**
     * POST /api/live-broadcast/{id}/signal
     * WebRTC signaling message exchange (offer, answer, ice_candidate, join)
     */
    public function sendSignal(Request $request, $id)
    {
        $this->ensureDatabaseTables();

        $senderId = trim((string) $request->input('sender_id', ''));
        $recipientId = trim((string) $request->input('recipient_id', ''));
        $signalType = trim((string) $request->input('signal_type', ''));
        $rawPayload = $request->input('payload');

        if ($senderId === '' || $recipientId === '' || $signalType === '' || $rawPayload === null) {
            return response()->json([
                'success' => false,
                'error' => 'Missing required WebRTC signal fields',
            ], 422);
        }

        $payload = is_string($rawPayload)
            ? $rawPayload
            : json_encode($rawPayload);

        // If viewer is joining, also register them in active viewers immediately
        if ($request->input('signal_type') === 'join' && $request->input('sender_id') !== 'host') {
            $hbReq = new Request(['viewer_id' => $request->input('sender_id')]);
            $this->heartbeat($hbReq, $id);
        }

        $signalId = 0;
        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->prepare("
                    INSERT INTO live_broadcast_signals
                    (broadcast_id, sender_id, recipient_id, signal_type, payload, consumed, created_at, updated_at)
                    VALUES (:bid, :sid, :rid, :st, :pl, 0, NOW(), NOW())
                ");
                $st->execute([
                    ':bid' => $id,
                    ':sid' => $request->input('sender_id'),
                    ':rid' => $request->input('recipient_id'),
                    ':st' => $request->input('signal_type'),
                    ':pl' => $payload,
                ]);
                $signalId = (int) $pdo->lastInsertId();
                $pdo->exec("DELETE FROM live_broadcast_signals WHERE created_at < (NOW() - INTERVAL 10 MINUTE)");
            }
        } catch (\Throwable $e) {}

        try {
            $localId = DB::table('live_broadcast_signals')->insertGetId([
                'broadcast_id' => $id,
                'sender_id' => $request->input('sender_id'),
                'recipient_id' => $request->input('recipient_id'),
                'signal_type' => $request->input('signal_type'),
                'payload' => $payload,
                'consumed' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            if (!$signalId) $signalId = (int) $localId;

            DB::table('live_broadcast_signals')
                ->where('created_at', '<', now()->subMinutes(10))
                ->delete();
        } catch (\Throwable $e) {}

        return response()->json([
            'success' => true,
            'signal_id' => $signalId,
        ]);
    }

    /**
     * GET /api/live-broadcast/{id}/signal
     * Fetch pending WebRTC signals for recipient
     */
    public function getSignals(Request $request, $id)
    {
        $this->ensureDatabaseTables();

        $recipientId = $request->input('recipient_id');
        $sinceId = intval($request->input('since_id', 0));

        if (!$recipientId) {
            return response()->json(['success' => false, 'error' => 'Missing recipient_id'], 400);
        }

        $signals = [];
        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                if ($sinceId > 0) {
                    $st = $pdo->prepare("
                        SELECT * FROM live_broadcast_signals
                        WHERE broadcast_id = :bid AND recipient_id = :rid AND id > :sid
                        ORDER BY id ASC LIMIT 50
                    ");
                    $st->execute([':bid' => $id, ':rid' => $recipientId, ':sid' => $sinceId]);
                    $signals = $st->fetchAll(\PDO::FETCH_ASSOC);
                } else {
                    $st = $pdo->prepare("
                        SELECT * FROM live_broadcast_signals
                        WHERE broadcast_id = :bid AND recipient_id = :rid AND consumed = 0
                        ORDER BY id ASC LIMIT 50
                    ");
                    $st->execute([':bid' => $id, ':rid' => $recipientId]);
                    $signals = $st->fetchAll(\PDO::FETCH_ASSOC);
                    if (!empty($signals)) {
                        $ids = array_column($signals, 'id');
                        $inPlaceholders = implode(',', array_fill(0, count($ids), '?'));
                        $up = $pdo->prepare("UPDATE live_broadcast_signals SET consumed = 1 WHERE id IN ({$inPlaceholders})");
                        $up->execute($ids);
                    }
                }
            }
        } catch (\Throwable $e) {}

        if (empty($signals)) {
            try {
                $query = DB::table('live_broadcast_signals')
                    ->where('broadcast_id', $id)
                    ->where('recipient_id', $recipientId);

                if ($sinceId > 0) {
                    $query->where('id', '>', $sinceId);
                } else {
                    $query->where('consumed', false);
                }

                $rows = $query->orderBy('id', 'asc')->take(50)->get();
                if ($rows->isNotEmpty() && $sinceId === 0) {
                    $ids = $rows->pluck('id')->all();
                    DB::table('live_broadcast_signals')->whereIn('id', $ids)->update(['consumed' => true]);
                }
                $signals = $rows->map(fn($r) => (array) $r)->toArray();
            } catch (\Throwable $e) {}
        }

        return response()->json([
            'success' => true,
            'signals' => $signals,
        ]);
    }

    /**
     * POST /api/live-broadcast/{id}/chunk
     * Append live recorded video segment for live HTTP playback
     */
    public function uploadChunk(Request $request, $id)
    {
        if (!$request->hasFile('chunk')) {
            return response()->json(['success' => false, 'error' => 'No video chunk file provided'], 400);
        }

        $chunk = $request->file('chunk');
        $dir = storage_path('app/public/live/' . $id);
        if (!file_exists($dir)) {
            mkdir($dir, 0777, true);
        }

        $filePath = $dir . '/stream.webm';
        $chunkIndex = intval($request->input('chunk_index', 0));

        // If first chunk, initialize; otherwise append
        if ($chunkIndex === 0) {
            file_put_contents($filePath, file_get_contents($chunk->getRealPath()));
        } else {
            file_put_contents($filePath, file_get_contents($chunk->getRealPath()), FILE_APPEND);
        }

        try {
            DB::table('live_broadcasts')->where('id', $id)->update(['updated_at' => now()]);
        } catch (\Throwable $e) {}

        return response()->json([
            'success' => true,
            'chunk_index' => $chunkIndex,
            'bytes_written' => file_exists($filePath) ? filesize($filePath) : 0,
            'stream_url' => '/storage/live/' . $id . '/stream.webm',
        ]);
    }

    /**
     * GET /api/live-broadcast/{id}/stream
     * Stream live WebM audio/video with RFC 7233 partial content support
     */
    public function getLiveStream(Request $request, $id)
    {
        $filePath = storage_path('app/public/live/' . $id . '/stream.webm');
        if (!file_exists($filePath)) {
            return response()->json(['error' => 'Live stream buffer not ready yet'], 404);
        }

        $fileSize = filesize($filePath);
        $headers = [
            'Content-Type' => 'video/webm',
            'Accept-Ranges' => 'bytes',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
        ];

        $range = $request->header('Range');
        if ($range) {
            list($param, $range) = explode('=', $range);
            if (strtolower(trim($param)) === 'bytes') {
                list($from, $to) = explode('-', $range);
                $from = intval($from);
                $to = empty($to) ? ($fileSize - 1) : intval($to);
                $length = $to - $from + 1;

                $headers['Content-Range'] = sprintf('bytes %d-%d/%d', $from, $to, $fileSize);
                $headers['Content-Length'] = $length;

                return response()->stream(function () use ($filePath, $from, $length) {
                    $stream = fopen($filePath, 'rb');
                    fseek($stream, $from);
                    $bytesSent = 0;
                    $buffer = 64 * 1024;
                    while (!feof($stream) && $bytesSent < $length) {
                        $chunkSize = min($buffer, $length - $bytesSent);
                        echo fread($stream, $chunkSize);
                        flush();
                        $bytesSent += $chunkSize;
                    }
                    fclose($stream);
                }, 206, $headers);
            }
        }

        $headers['Content-Length'] = $fileSize;
        return response()->file($filePath, $headers);
    }

    /**
     * POST /api/live-broadcast/{id}/frame
     * Upload a real-time presentation/camera snapshot frame (JPEG/WebP or base64 data URI)
     * so students on any network can always view the live presentation even if WebRTC UDP is blocked.
     */
    public function uploadPresentationFrame(Request $request, $id)
    {
        $dir = storage_path('app/public/live/' . $id);
        if (!file_exists($dir)) {
            mkdir($dir, 0777, true);
        }

        $framePath = $dir . '/frame.jpg';
        $bytesWritten = 0;

        if ($request->hasFile('frame')) {
            $file = $request->file('frame');
            $bytesWritten = (int) file_put_contents($framePath, file_get_contents($file->getRealPath()));
        } elseif ($request->filled('frame_data')) {
            $dataUri = (string) $request->input('frame_data');
            if (str_contains($dataUri, ',')) {
                $parts = explode(',', $dataUri, 2);
                $decoded = base64_decode($parts[1], true);
                if ($decoded !== false && strlen($decoded) > 100) {
                    $bytesWritten = (int) file_put_contents($framePath, $decoded);
                }
            }
        }

        try {
            DB::table('live_broadcasts')->where('id', $id)->update(['updated_at' => now()]);
        } catch (\Throwable $e) {}

        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $pdo->prepare("UPDATE live_broadcasts SET updated_at = NOW() WHERE id = :id")->execute([':id' => $id]);
            }
        } catch (\Throwable $e) {}

        return response()->json([
            'success' => $bytesWritten > 0,
            'bytes_written' => $bytesWritten,
            'frame_url' => '/api/live-broadcast/' . $id . '/frame?t=' . time(),
        ]);
    }

    /**
     * GET /api/live-broadcast/{id}/frame
     * Serve the latest presentation/camera snapshot frame with zero caching
     */
    public function getPresentationFrame(Request $request, $id)
    {
        $framePath = storage_path('app/public/live/' . $id . '/frame.jpg');
        if (!file_exists($framePath) || filesize($framePath) < 100) {
            return response()->json(['error' => 'No live presentation frame available yet'], 404);
        }

        return response()->file($framePath, [
            'Content-Type' => 'image/jpeg',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }

    // =========================================================================
    // DEPARTMENTAL CLASSROOM STUDENT ROSTER & MATRIC SUBMISSION ENGINE
    // =========================================================================

    private function findBroadcastById(string $id): ?object
    {
        if ($id === '') return null;
        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->prepare("SELECT * FROM live_broadcasts WHERE id = :id LIMIT 1");
                $st->execute([':id' => $id]);
                $row = $st->fetch(\PDO::FETCH_ASSOC);
                if ($row) return (object) $row;
            }
        } catch (\Throwable $e) {}

        try {
            $row = DB::table('live_broadcasts')->where('id', $id)->first();
            if ($row) return $row;
        } catch (\Throwable $e) {}

        return null;
    }

    private function findStudentInDepartmentRoster(string $identifier, array $deptAliases): ?array
    {
        $idClean = strtolower(trim($identifier));
        if ($idClean === '') return null;

        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->prepare("
                    SELECT * FROM live_classroom_roster
                    WHERE LOWER(TRIM(matric_no)) = :id OR LOWER(TRIM(COALESCE(username, ''))) = :id2
                    ORDER BY status = 'approved' DESC, id DESC
                ");
                $st->execute([':id' => $idClean, ':id2' => $idClean]);
                $rows = $st->fetchAll(\PDO::FETCH_ASSOC);
                foreach ($rows as $r) {
                    $rDept = strtoupper(trim((string) ($r['department_code'] ?? '')));
                    if (empty($deptAliases) || in_array($rDept, $deptAliases, true)) {
                        return $r;
                    }
                }
            }
        } catch (\Throwable $e) {}

        try {
            $rows = DB::table('live_classroom_roster')
                ->whereRaw('LOWER(TRIM(matric_no)) = ?', [$idClean])
                ->orWhereRaw('LOWER(TRIM(COALESCE(username, ""))) = ?', [$idClean])
                ->orderBy('id', 'desc')
                ->get();
            foreach ($rows as $r) {
                $arr = (array) $r;
                $rDept = strtoupper(trim((string) ($arr['department_code'] ?? '')));
                if (empty($deptAliases) || in_array($rDept, $deptAliases, true)) {
                    return $arr;
                }
            }
        } catch (\Throwable $e) {}

        return null;
    }

    private function fetchDepartmentRosterFromDb(string $deptCode, string $deptName = ''): array
    {
        $this->ensureDatabaseTables();
        $cleanDept = strtoupper(trim($deptCode ?: 'CEM'));
        $aliases = array_values(array_filter(
            $this->getDepartmentAliasGroup($cleanDept ?: $deptName),
            fn($a) => strlen($a) <= 12
        ));
        if (!in_array($cleanDept, $aliases, true)) {
            $aliases[] = $cleanDept;
        }

        $rosterRows = [];
        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $placeholders = implode(',', array_fill(0, count($aliases), '?'));
                $st = $pdo->prepare("SELECT * FROM live_classroom_roster WHERE UPPER(department_code) IN ({$placeholders}) ORDER BY id DESC");
                $st->execute($aliases);
                $rosterRows = $st->fetchAll(\PDO::FETCH_ASSOC);
            }
        } catch (\Throwable $e) {}

        if (empty($rosterRows)) {
            try {
                $rosterRows = DB::table('live_classroom_roster')
                    ->whereIn('department_code', $aliases)
                    ->orderBy('id', 'desc')
                    ->get()
                    ->map(fn($r) => (array) $r)
                    ->toArray();
            } catch (\Throwable $e) {}
        }

        $approved = [];
        $pending = [];
        $seenMatrics = [];

        foreach ($rosterRows as $r) {
            $mKey = strtolower(trim((string) ($r['matric_no'] ?? '')));
            if ($mKey !== '') $seenMatrics[$mKey] = true;
            if (strtolower(trim((string) ($r['status'] ?? 'approved'))) === 'pending') {
                $pending[] = $r;
            } else {
                $approved[] = $r;
            }
        }

        // Also include existing HOD-registered department students from patrons table so lecturer sees all departmental students
        try {
            $pdo = DatabaseService::getPdo();
            $patronRows = [];
            if ($pdo) {
                $st = $pdo->query("SELECT id, name, matric_no, barcode, department, level, pin, status FROM patrons ORDER BY id DESC LIMIT 200");
                if ($st) $patronRows = $st->fetchAll(\PDO::FETCH_ASSOC);
            } else {
                $patronRows = DB::table('patrons')->orderBy('id', 'desc')->take(200)->get()->map(fn($r) => (array) $r)->toArray();
            }

            foreach ($patronRows as $p) {
                $pMatric = trim((string) ($p['matric_no'] ?? $p['barcode'] ?? ''));
                $pDept = trim((string) ($p['department'] ?? ''));
                $mKey = strtolower($pMatric);
                if ($pMatric === '' || isset($seenMatrics[$mKey])) continue;

                if ($this->departmentsMatch($cleanDept, $deptName, $pDept, $pMatric)) {
                    $seenMatrics[$mKey] = true;
                    $approved[] = [
                        'id' => 'PATRON-' . ($p['id'] ?? $pMatric),
                        'department_code' => $cleanDept,
                        'department_name' => $deptName ?: $pDept,
                        'matric_no' => $pMatric,
                        'username' => strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $pMatric)),
                        'student_name' => $p['name'] ?? 'Department Student',
                        'password_pin' => $p['pin'] ?? '1234',
                        'level' => $p['level'] ?? 'ND I',
                        'status' => 'approved',
                        'added_by' => 'HOD Department Directory',
                        'created_at' => null,
                    ];
                }
            }
        } catch (\Throwable $e) {}

        return [
            'department_code' => $cleanDept,
            'department_name' => $deptName,
            'approved_students' => $approved,
            'pending_submissions' => $pending,
            'approved_count' => count($approved),
            'pending_count' => count($pending),
        ];
    }

    /**
     * GET /api/live-broadcast/roster
     */
    public function getDepartmentRoster(Request $request)
    {
        $deptCode = strtoupper(trim((string) $request->input('department_code', 'CEM')));
        $deptName = trim((string) $request->input('department_name', ''));

        return response()->json([
            'success' => true,
            'roster' => $this->fetchDepartmentRosterFromDb($deptCode, $deptName),
        ])->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    }

    /**
     * POST /api/live-broadcast/roster/submit-matric
     * Student submits their Matric No. (and Full Name / Level) so the Lecturer can add them to the department's classroom.
     */
    public function submitStudentMatric(Request $request)
    {
        $this->ensureDatabaseTables();

        $matricNo = strtoupper(trim((string) $request->input('matric_no', $request->input('identifier', ''))));
        $studentName = trim((string) $request->input('student_name', $request->input('name', '')));
        $username = trim((string) $request->input('username', ''));
        $level = trim((string) $request->input('level', 'ND I'));
        $broadcastId = trim((string) $request->input('broadcast_id', ''));
        $deptCode = strtoupper(trim((string) $request->input('department_code', '')));
        $deptName = trim((string) $request->input('department_name', ''));

        if ($matricNo === '') {
            return response()->json([
                'success' => false,
                'error' => 'Please enter your Matriculation Number to submit to the Lecturer.'
            ], 422);
        }

        if ($broadcastId !== '' && $deptCode === '') {
            $b = $this->findBroadcastById($broadcastId);
            if ($b) {
                $deptCode = strtoupper(trim((string) ($b->department_code ?? '')));
                $deptName = trim((string) ($b->department_name ?? ''));
            }
        }
        if ($deptCode === '' && preg_match('/^LIVE-([A-Z0-9]+)-/i', $broadcastId, $m)) {
            $deptCode = strtoupper($m[1]);
        }
        if ($deptCode === '') {
            $deptCode = 'CEM';
        }

        if ($studentName === '') {
            $studentName = 'Student (' . $matricNo . ')';
        }
        if ($username === '') {
            $username = strtolower(preg_replace('/[^a-zA-Z0-9]/', '_', $matricNo));
        }

        // Check if already approved in this department
        $existing = $this->findStudentInDepartmentRoster($matricNo, [$deptCode]);
        if ($existing && strtolower((string) ($existing['status'] ?? '')) === 'approved') {
            return response()->json([
                'success' => true,
                'already_approved' => true,
                'message' => "Your Matric No. ({$matricNo}) is already approved by the {$deptCode} Lecturer! You can enter your Matric No. now to join the class.",
                'submission' => $existing,
            ]);
        }

        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->prepare("
                    INSERT INTO live_classroom_roster
                    (department_code, department_name, matric_no, username, student_name, password_pin, level, status, added_by, created_at, updated_at)
                    VALUES (:dc, :dn, :m, :u, :sn, '1234', :lv, 'pending', 'student_submission', NOW(), NOW())
                    ON DUPLICATE KEY UPDATE
                    student_name = VALUES(student_name),
                    username = COALESCE(NULLIF(VALUES(username), ''), username),
                    level = VALUES(level),
                    updated_at = NOW()
                ");
                $st->execute([
                    ':dc' => $deptCode,
                    ':dn' => $deptName ?: $deptCode,
                    ':m' => $matricNo,
                    ':u' => $username,
                    ':sn' => $studentName,
                    ':lv' => $level,
                ]);
            }
        } catch (\Throwable $e) {}

        try {
            DB::table('live_classroom_roster')->updateOrInsert(
                ['department_code' => $deptCode, 'matric_no' => $matricNo],
                [
                    'department_name' => $deptName ?: $deptCode,
                    'username' => $username,
                    'student_name' => $studentName,
                    'password_pin' => '1234',
                    'level' => $level,
                    'status' => 'pending',
                    'added_by' => 'student_submission',
                    'updated_at' => now(),
                ]
            );
        } catch (\Throwable $e) {}

        try {
            \App\Http\Controllers\Api\RealtimeSyncController::recordEvent([
                'action' => 'LIVE_ROSTER_SUBMISSION',
                'entity' => 'live_classroom_roster',
                'id' => $matricNo,
                'title' => "Student Matric Submitted: {$matricNo}",
                'data' => [
                    'department_code' => $deptCode,
                    'matric_no' => $matricNo,
                    'student_name' => $studentName,
                    'level' => $level,
                    'status' => 'pending',
                ],
                'source' => 'live_classroom',
            ]);
        } catch (\Throwable $e) {}

        return response()->json([
            'success' => true,
            'already_approved' => false,
            'message' => "Matric No. {$matricNo} submitted to the {$deptCode} Lecturer! Once the Lecturer clicks 'Add / Approve' in the studio, enter your Matric No. to join immediately.",
            'submission' => [
                'department_code' => $deptCode,
                'matric_no' => $matricNo,
                'username' => $username,
                'student_name' => $studentName,
                'level' => $level,
                'status' => 'pending',
            ],
        ]);
    }

    /**
     * POST /api/live-broadcast/roster/add-student
     * Lecturer creates or approves a student with Username, Matric No., and Password for the department's classroom.
     */
    public function lecturerAddStudentToRoster(Request $request)
    {
        $this->ensureDatabaseTables();

        $deptCode = strtoupper(trim((string) $request->input('department_code', 'CEM')));
        $deptName = trim((string) $request->input('department_name', $deptCode));
        $matricNo = strtoupper(trim((string) $request->input('matric_no', '')));
        $username = trim((string) $request->input('username', ''));
        $studentName = trim((string) $request->input('student_name', ''));
        $passwordPin = trim((string) $request->input('password_pin', $request->input('password', '1234')));
        $level = trim((string) $request->input('level', 'ND I'));
        $addedBy = trim((string) $request->input('added_by', 'Lecturer'));

        if ($matricNo === '') {
            return response()->json([
                'success' => false,
                'error' => 'Student Matriculation Number is required.'
            ], 422);
        }

        if ($username === '') {
            $username = strtolower(preg_replace('/[^a-zA-Z0-9]/', '_', $matricNo));
        }
        if ($studentName === '') {
            $studentName = $username;
        }
        if ($passwordPin === '') {
            $passwordPin = '1234';
        }

        // 1. Save in MySQL live_classroom_roster
        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->prepare("
                    INSERT INTO live_classroom_roster
                    (department_code, department_name, matric_no, username, student_name, password_pin, level, status, added_by, created_at, updated_at)
                    VALUES (:dc, :dn, :m, :u, :sn, :pw, :lv, 'approved', :ab, NOW(), NOW())
                    ON DUPLICATE KEY UPDATE
                    department_name = VALUES(department_name),
                    username = VALUES(username),
                    student_name = VALUES(student_name),
                    password_pin = VALUES(password_pin),
                    level = VALUES(level),
                    status = 'approved',
                    added_by = VALUES(added_by),
                    updated_at = NOW()
                ");
                $st->execute([
                    ':dc' => $deptCode,
                    ':dn' => $deptName,
                    ':m' => $matricNo,
                    ':u' => $username,
                    ':sn' => $studentName,
                    ':pw' => $passwordPin,
                    ':lv' => $level,
                    ':ab' => $addedBy,
                ]);
            }
        } catch (\Throwable $e) {}

        // 2. Save in SQLite live_classroom_roster
        try {
            DB::table('live_classroom_roster')->updateOrInsert(
                ['department_code' => $deptCode, 'matric_no' => $matricNo],
                [
                    'department_name' => $deptName,
                    'username' => $username,
                    'student_name' => $studentName,
                    'password_pin' => $passwordPin,
                    'level' => $level,
                    'status' => 'approved',
                    'added_by' => $addedBy,
                    'updated_at' => now(),
                ]
            );
        } catch (\Throwable $e) {}

        // 3. Also sync into `patrons` table so the student can log into the Student Portal as well
        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $stP = $pdo->prepare("SELECT id FROM patrons WHERE LOWER(TRIM(COALESCE(matric_no, ''))) = LOWER(:m) LIMIT 1");
                $stP->execute([':m' => $matricNo]);
                $existingPatron = $stP->fetch(\PDO::FETCH_ASSOC);
                if (!$existingPatron) {
                    $insP = $pdo->prepare("
                        INSERT INTO patrons (name, email, matric_no, barcode, department, level, role, status, pin, created_at, updated_at)
                        VALUES (:n, :e, :m, :b, :d, :lv, 'Student', 'Active', :p, NOW(), NOW())
                    ");
                    $insP->execute([
                        ':n' => $studentName,
                        ':e' => strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $username)) . '@student.fccibadan.edu.ng',
                        ':m' => $matricNo,
                        ':b' => $matricNo,
                        ':d' => $deptName ?: $deptCode,
                        ':lv' => $level,
                        ':p' => $passwordPin,
                    ]);
                }
            }
        } catch (\Throwable $e) {}

        try {
            \App\Http\Controllers\Api\RealtimeSyncController::recordEvent([
                'action' => 'LIVE_ROSTER_APPROVED',
                'entity' => 'live_classroom_roster',
                'id' => $matricNo,
                'title' => "Student Added to {$deptCode} Classroom: {$matricNo}",
                'data' => [
                    'department_code' => $deptCode,
                    'matric_no' => $matricNo,
                    'username' => $username,
                    'student_name' => $studentName,
                    'status' => 'approved',
                ],
                'source' => 'live_broadcast_studio',
            ]);
        } catch (\Throwable $e) {}

        return response()->json([
            'success' => true,
            'message' => "Student {$studentName} ({$matricNo}) added & approved for {$deptCode} Live Classroom.",
            'roster' => $this->fetchDepartmentRosterFromDb($deptCode, $deptName),
        ]);
    }

    /**
     * POST /api/live-broadcast/roster/approve-all
     * Approve all pending student Matric No. submissions for a department
     */
    public function lecturerApproveAllPendingRoster(Request $request)
    {
        $this->ensureDatabaseTables();

        $deptCode = strtoupper(trim((string) $request->input('department_code', 'CEM')));
        $deptName = trim((string) $request->input('department_name', $deptCode));

        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->prepare("UPDATE live_classroom_roster SET status = 'approved', updated_at = NOW() WHERE department_code = :d AND status = 'pending'");
                $st->execute([':d' => $deptCode]);
            }
        } catch (\Throwable $e) {}

        try {
            DB::table('live_classroom_roster')
                ->where('department_code', $deptCode)
                ->where('status', 'pending')
                ->update(['status' => 'approved', 'updated_at' => now()]);
        } catch (\Throwable $e) {}

        return response()->json([
            'success' => true,
            'message' => "All submitted student Matric Nos. approved for {$deptCode} Live Classroom.",
            'roster' => $this->fetchDepartmentRosterFromDb($deptCode, $deptName),
        ]);
    }

    /**
     * DELETE /api/live-broadcast/roster/{id}
     */
    public function deleteRosterStudent(Request $request, $id)
    {
        $this->ensureDatabaseTables();
        $deptCode = strtoupper(trim((string) $request->input('department_code', 'CEM')));
        $deptName = trim((string) $request->input('department_name', $deptCode));

        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                if (is_numeric($id)) {
                    $pdo->prepare("DELETE FROM live_classroom_roster WHERE id = :id")->execute([':id' => (int) $id]);
                } else {
                    $pdo->prepare("DELETE FROM live_classroom_roster WHERE matric_no = :m AND department_code = :d")->execute([':m' => $id, ':d' => $deptCode]);
                }
            }
        } catch (\Throwable $e) {}

        try {
            if (is_numeric($id)) {
                DB::table('live_classroom_roster')->where('id', (int) $id)->delete();
            } else {
                DB::table('live_classroom_roster')->where('matric_no', $id)->where('department_code', $deptCode)->delete();
            }
        } catch (\Throwable $e) {}

        return response()->json([
            'success' => true,
            'roster' => $this->fetchDepartmentRosterFromDb($deptCode, $deptName),
        ]);
    }

    // =========================================================================
    // TWO-PHASE CLASSROOM ATTENDANCE ENGINE (FIRST 10 MINS & LAST MINUTE)
    // =========================================================================

    /**
     * Record/update student attendance in `live_classroom_attendance`
     * - Automatically marks `first_10m_marked = 1` if within the first 10 minutes (600 seconds) of broadcast `started_at` (or if lecturer opened First 10m window).
     * - Automatically marks `last_min_marked = 1` if the Last-Minute Roll Call window is open or `forceLastMin` is true.
     */
    private function recordStudentAttendance(string $broadcastId, array $student, $broadcast = null, bool $forceLastMin = false): array
    {
        $this->ensureDatabaseTables();

        $matricNo = strtoupper(trim((string) ($student['matric'] ?? $student['matric_no'] ?? '')));
        if ($matricNo === '') {
            return [];
        }

        if (!$broadcast) {
            $broadcast = $this->findBroadcastById($broadcastId);
        }

        $deptCode = strtoupper(trim((string) ($broadcast->department_code ?? $student['department_code'] ?? 'CEM')));
        $courseCode = trim((string) ($broadcast->course_code ?? ''));
        $studentName = trim((string) ($student['name'] ?? $student['student_name'] ?? 'Student'));
        $username = trim((string) ($student['username'] ?? $matricNo));
        $level = trim((string) ($student['level'] ?? 'ND I'));

        $elapsedSeconds = 0;
        if ($broadcast && !empty($broadcast->started_at)) {
            try {
                $elapsedSeconds = max(0, (int) Carbon::now()->diffInSeconds(Carbon::parse($broadcast->started_at)));
            } catch (\Throwable $e) {
                $elapsedSeconds = 0;
            }
        }

        // Check if within First 10 Minutes (0..600s) OR lecturer manually re-opened first_10m window
        $first10mOverrideUntil = (int) ($this->getSettingValue('fcc_att_first10m_until_' . $broadcastId) ?: 0);
        $isFirst10mWindow = ($elapsedSeconds <= 600) || (time() <= $first10mOverrideUntil);

        // Check if Last Minute Roll-Call Window is active (triggered by lecturer or scheduled final minute)
        $lastMinActiveFlag = $this->getSettingValue('fcc_att_lastmin_open_' . $broadcastId) === '1';
        $scheduledDurationMins = (int) ($this->getSettingValue('fcc_att_duration_mins_' . $broadcastId) ?: 0);
        $isScheduledLastMinute = ($scheduledDurationMins > 0 && $elapsedSeconds >= (($scheduledDurationMins - 1) * 60));
        $isLastMinWindow = $forceLastMin || $lastMinActiveFlag || $isScheduledLastMinute;

        // Fetch existing attendance row if any
        $existing = null;
        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->prepare("SELECT * FROM live_classroom_attendance WHERE broadcast_id = :bid AND UPPER(TRIM(matric_no)) = :m LIMIT 1");
                $st->execute([':bid' => $broadcastId, ':m' => $matricNo]);
                $row = $st->fetch(\PDO::FETCH_ASSOC);
                if ($row) $existing = $row;
            }
        } catch (\Throwable $e) {}

        if (!$existing) {
            try {
                $row = DB::table('live_classroom_attendance')
                    ->where('broadcast_id', $broadcastId)
                    ->whereRaw('UPPER(TRIM(matric_no)) = ?', [$matricNo])
                    ->first();
                if ($row) $existing = (array) $row;
            } catch (\Throwable $e) {}
        }

        $nowStr = now()->toDateTimeString();
        $firstJoinedAt = $existing['first_joined_at'] ?? $nowStr;
        $first10mMarked = !empty($existing['first_10m_marked']) ? 1 : ($isFirst10mWindow ? 1 : 0);
        $first10mAt = $existing['first_10m_marked_at'] ?? ($first10mMarked ? $nowStr : null);

        $lastMinMarked = !empty($existing['last_min_marked']) ? 1 : ($isLastMinWindow ? 1 : 0);
        $lastMinAt = $existing['last_min_marked_at'] ?? ($lastMinMarked ? $nowStr : null);

        if ($first10mMarked && $lastMinMarked) {
            $attStatus = 'COMPLETE';
        } elseif ($first10mMarked) {
            $attStatus = 'FIRST_10M_MARKED';
        } elseif ($lastMinMarked) {
            $attStatus = 'LAST_MIN_ONLY';
        } else {
            $attStatus = 'JOINED_LATE';
        }

        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->prepare("
                    INSERT INTO live_classroom_attendance
                    (broadcast_id, department_code, course_code, matric_no, username, student_name, level, first_joined_at, last_seen_at, first_10m_marked, first_10m_marked_at, last_min_marked, last_min_marked_at, attendance_status, created_at, updated_at)
                    VALUES (:bid, :dc, :cc, :m, :u, :sn, :lv, :fja, NOW(), :f10, :f10at, :lm, :lmat, :st, NOW(), NOW())
                    ON DUPLICATE KEY UPDATE
                    last_seen_at = NOW(),
                    first_10m_marked = GREATEST(first_10m_marked, VALUES(first_10m_marked)),
                    first_10m_marked_at = COALESCE(first_10m_marked_at, VALUES(first_10m_marked_at)),
                    last_min_marked = GREATEST(last_min_marked, VALUES(last_min_marked)),
                    last_min_marked_at = COALESCE(last_min_marked_at, VALUES(last_min_marked_at)),
                    attendance_status = VALUES(attendance_status),
                    updated_at = NOW()
                ");
                $st->execute([
                    ':bid' => $broadcastId,
                    ':dc' => $deptCode,
                    ':cc' => $courseCode,
                    ':m' => $matricNo,
                    ':u' => $username,
                    ':sn' => $studentName,
                    ':lv' => $level,
                    ':fja' => $firstJoinedAt,
                    ':f10' => $first10mMarked,
                    ':f10at' => $first10mAt,
                    ':lm' => $lastMinMarked,
                    ':lmat' => $lastMinAt,
                    ':st' => $attStatus,
                ]);
            }
        } catch (\Throwable $e) {}

        try {
            DB::table('live_classroom_attendance')->updateOrInsert(
                ['broadcast_id' => $broadcastId, 'matric_no' => $matricNo],
                [
                    'department_code' => $deptCode,
                    'course_code' => $courseCode,
                    'username' => $username,
                    'student_name' => $studentName,
                    'level' => $level,
                    'first_joined_at' => $firstJoinedAt,
                    'last_seen_at' => $nowStr,
                    'first_10m_marked' => (bool) $first10mMarked,
                    'first_10m_marked_at' => $first10mAt,
                    'last_min_marked' => (bool) $lastMinMarked,
                    'last_min_marked_at' => $lastMinAt,
                    'attendance_status' => $attStatus,
                    'updated_at' => $nowStr,
                ]
            );
        } catch (\Throwable $e) {}

        return [
            'broadcast_id' => $broadcastId,
            'matric_no' => $matricNo,
            'student_name' => $studentName,
            'first_joined_at' => $firstJoinedAt,
            'last_seen_at' => $nowStr,
            'first_10m_marked' => (bool) $first10mMarked,
            'first_10m_marked_at' => $first10mAt,
            'last_min_marked' => (bool) $lastMinMarked,
            'last_min_marked_at' => $lastMinAt,
            'attendance_status' => $attStatus,
            'first_10m_window_open' => $isFirst10mWindow,
            'last_min_window_open' => $isLastMinWindow,
            'elapsed_seconds' => $elapsedSeconds,
        ];
    }

    /**
     * Automatically mark Last-Minute Attendance for all students active in the final minute when broadcast ends
     */
    private function finalizeLastMinuteAttendanceOnEnd(string $broadcastId): void
    {
        $nowStr = now()->toDateTimeString();
        $cutoffStr = Carbon::now()->subSeconds(120)->toDateTimeString();

        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->prepare("
                    UPDATE live_classroom_attendance
                    SET last_min_marked = 1,
                        last_min_marked_at = COALESCE(last_min_marked_at, NOW()),
                        attendance_status = CASE WHEN first_10m_marked = 1 THEN 'COMPLETE' ELSE 'LAST_MIN_ONLY' END,
                        updated_at = NOW()
                    WHERE broadcast_id = :bid AND (last_seen_at >= :cutoff OR last_min_marked = 1)
                ");
                $st->execute([':bid' => $broadcastId, ':cutoff' => $cutoffStr]);
            }
        } catch (\Throwable $e) {}

        try {
            $rows = DB::table('live_classroom_attendance')
                ->where('broadcast_id', $broadcastId)
                ->get();
            foreach ($rows as $r) {
                $activeInFinalMin = !empty($r->last_min_marked) || (!empty($r->last_seen_at) && $r->last_seen_at >= $cutoffStr);
                if ($activeInFinalMin) {
                    $status = !empty($r->first_10m_marked) ? 'COMPLETE' : 'LAST_MIN_ONLY';
                    DB::table('live_classroom_attendance')
                        ->where('id', $r->id)
                        ->update([
                            'last_min_marked' => true,
                            'last_min_marked_at' => $r->last_min_marked_at ?: $nowStr,
                            'attendance_status' => $status,
                            'updated_at' => $nowStr,
                        ]);
                }
            }
        } catch (\Throwable $e) {}
    }

    private function buildAttendancePayload(string $broadcastId): array
    {
        $this->ensureDatabaseTables();
        $broadcast = $this->findBroadcastById($broadcastId);

        $elapsedSeconds = 0;
        if ($broadcast && !empty($broadcast->started_at)) {
            try {
                $elapsedSeconds = max(0, (int) Carbon::now()->diffInSeconds(Carbon::parse($broadcast->started_at)));
            } catch (\Throwable $e) {
                $elapsedSeconds = 0;
            }
        }

        $first10mOverrideUntil = (int) ($this->getSettingValue('fcc_att_first10m_until_' . $broadcastId) ?: 0);
        $isFirst10mWindow = ($elapsedSeconds <= 600) || (time() <= $first10mOverrideUntil);
        $first10mRemaining = $elapsedSeconds <= 600
            ? (600 - $elapsedSeconds)
            : max(0, $first10mOverrideUntil - time());

        $lastMinActiveFlag = $this->getSettingValue('fcc_att_lastmin_open_' . $broadcastId) === '1';

        $records = [];
        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->prepare("SELECT * FROM live_classroom_attendance WHERE broadcast_id = :bid ORDER BY first_joined_at ASC");
                $st->execute([':bid' => $broadcastId]);
                $records = $st->fetchAll(\PDO::FETCH_ASSOC);
            }
        } catch (\Throwable $e) {}

        if (empty($records)) {
            try {
                $records = DB::table('live_classroom_attendance')
                    ->where('broadcast_id', $broadcastId)
                    ->orderBy('first_joined_at', 'asc')
                    ->get()
                    ->map(fn($r) => (array) $r)
                    ->toArray();
            } catch (\Throwable $e) {}
        }

        $first10mCount = 0;
        $lastMinCount = 0;
        $completeCount = 0;

        foreach ($records as &$rec) {
            $rec['first_10m_marked'] = (bool) ($rec['first_10m_marked'] ?? false);
            $rec['last_min_marked'] = (bool) ($rec['last_min_marked'] ?? false);
            if ($rec['first_10m_marked']) $first10mCount++;
            if ($rec['last_min_marked']) $lastMinCount++;
            if ($rec['first_10m_marked'] && $rec['last_min_marked']) {
                $rec['attendance_status'] = 'COMPLETE';
                $completeCount++;
            }
        }

        return [
            'broadcast_id' => $broadcastId,
            'elapsed_seconds' => $elapsedSeconds,
            'first_10m_window_open' => $isFirst10mWindow,
            'first_10m_remaining_seconds' => $first10mRemaining,
            'last_min_window_open' => $lastMinActiveFlag,
            'records' => $records,
            'summary' => [
                'total_joined' => count($records),
                'first_10m_count' => $first10mCount,
                'last_min_count' => $lastMinCount,
                'complete_count' => $completeCount,
            ],
        ];
    }

    /**
     * GET /api/live-broadcast/{id}/attendance
     */
    public function getBroadcastAttendance(Request $request, $id)
    {
        return response()->json(array_merge(
            ['success' => true],
            $this->buildAttendancePayload((string) $id)
        ))->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    }

    /**
     * POST /api/live-broadcast/{id}/attendance/window
     * Allows Lecturer in Studio to trigger Last-Minute Roll Call (marking all active students)
     * or extend First 10-Minute Attendance Window.
     */
    public function toggleAttendanceWindow(Request $request, $id)
    {
        $this->ensureDatabaseTables();
        $mode = trim((string) $request->input('mode', 'last_minute')); // 'last_minute' | 'first_10m'

        if ($mode === 'first_10m') {
            $until = time() + 600; // Open First 10-Min window for 10 more minutes
            $this->setSettingValue('fcc_att_first10m_until_' . $id, (string) $until, 'LiveBroadcast', "First 10m attendance window for {$id}");
            // Also mark all currently connected students as first_10m_marked = 1
            $cutoffStr = Carbon::now()->subSeconds(120)->toDateTimeString();
            try {
                $pdo = DatabaseService::getPdo();
                if ($pdo) {
                    $pdo->prepare("
                        UPDATE live_classroom_attendance
                        SET first_10m_marked = 1,
                            first_10m_marked_at = COALESCE(first_10m_marked_at, NOW()),
                            attendance_status = CASE WHEN last_min_marked = 1 THEN 'COMPLETE' ELSE 'FIRST_10M_MARKED' END,
                            updated_at = NOW()
                        WHERE broadcast_id = :bid AND last_seen_at >= :cutoff
                    ")->execute([':bid' => $id, ':cutoff' => $cutoffStr]);
                }
            } catch (\Throwable $e) {}

            try {
                DB::table('live_classroom_attendance')
                    ->where('broadcast_id', $id)
                    ->where('last_seen_at', '>=', $cutoffStr)
                    ->update([
                        'first_10m_marked' => true,
                        'first_10m_marked_at' => now(),
                        'updated_at' => now(),
                    ]);
            } catch (\Throwable $e) {}
        } else {
            // Activate Last-Minute Attendance Window & immediately mark all currently present students
            $open = $request->has('open') ? $request->boolean('open') : true;
            $this->setSettingValue('fcc_att_lastmin_open_' . $id, $open ? '1' : '0', 'LiveBroadcast', "Last-minute attendance roll call for {$id}");
            if ($open) {
                $this->finalizeLastMinuteAttendanceOnEnd((string) $id);
            }
        }

        return response()->json(array_merge(
            [
                'success' => true,
                'message' => $mode === 'first_10m'
                    ? 'First 10-Minute Attendance Window activated and active students marked.'
                    : 'Last-Minute Attendance Roll Call activated! All currently present students have been marked.',
            ],
            $this->buildAttendancePayload((string) $id)
        ));
    }

    /**
     * POST /api/live-broadcast/{id}/attendance/mark
     * Student check-in endpoint for First 10-Minute and Last-Minute Attendance
     */
    public function markStudentAttendanceEndpoint(Request $request, $id)
    {
        $this->ensureDatabaseTables();

        $student = [
            'matric' => $request->input('matric', $request->input('matric_no', '')),
            'username' => $request->input('username', ''),
            'name' => $request->input('name', $request->input('student_name', 'Student')),
            'department_code' => $request->input('department_code', ''),
            'level' => $request->input('level', 'ND I'),
        ];

        $att = $this->recordStudentAttendance((string) $id, $student, null, $request->boolean('last_minute'));

        return response()->json([
            'success' => true,
            'attendance' => $att,
        ]);
    }
}
