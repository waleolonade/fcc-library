<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\MediaResource;
use App\Services\DatabaseService;
use Carbon\Carbon;

class LiveBroadcastController extends Controller
{
    /**
     * Ensure live broadcast tables exist in both Laravel's default DB (SQLite/MySQL)
     * and the authoritative MySQL database (gsashtub_brainfeels_library).
     */
    private function ensureDatabaseTables(): void
    {
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
            }
        } catch (\Throwable $e) {}
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
            'lecture_title' => "{$defaultCourseCode}: {$defaultCourseTitle} — Live Interactive Lecture",
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

        // Check for an active live broadcast for this department in DB
        $activeBroadcast = null;
        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->prepare("
                    SELECT * FROM live_broadcasts
                    WHERE is_live = 1 AND status = 'live' AND department_code = :d
                    ORDER BY started_at DESC LIMIT 1
                ");
                $st->execute([':d' => $deptCode]);
                $row = $st->fetch(\PDO::FETCH_ASSOC);
                if ($row) {
                    $activeBroadcast = (object) $row;
                }
            }
        } catch (\Throwable $e) {}

        if (!$activeBroadcast) {
            try {
                $activeBroadcast = DB::table('live_broadcasts')
                    ->where('is_live', true)
                    ->where('status', 'live')
                    ->where('department_code', $deptCode)
                    ->orderBy('started_at', 'desc')
                    ->first();
            } catch (\Throwable $e) {}
        }

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

        // If a broadcast is currently live for this department or broadcast_id is passed, update it in live_broadcasts
        $broadcastId = $request->input('broadcast_id');
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
            $q = DB::table('live_broadcasts')->where('is_live', true)->where('status', 'live');
            if ($broadcastId) {
                $q->where('id', $broadcastId);
            } else {
                $q->where('department_code', $deptCode);
            }
            $q->update($liveUpdate);
        } catch (\Throwable $e) {}

        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                if ($broadcastId) {
                    $st = $pdo->prepare("
                        UPDATE live_broadcasts
                        SET title = :title, department_name = :dn, course_code = :cc, course_title = :ct,
                            lecturer_name = :ln, stream_mode = :sm, resolution = :res,
                            announcement = :ann, companion_pdf_url = :pdf, updated_at = NOW()
                        WHERE id = :id
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
                } else {
                    $st = $pdo->prepare("
                        UPDATE live_broadcasts
                        SET title = :title, department_name = :dn, course_code = :cc, course_title = :ct,
                            lecturer_name = :ln, stream_mode = :sm, resolution = :res,
                            announcement = :ann, companion_pdf_url = :pdf, updated_at = NOW()
                        WHERE is_live = 1 AND status = 'live' AND department_code = :dc
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
                        ':dc' => $deptCode,
                    ]);
                }
            }
        } catch (\Throwable $e) {}

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
        $pdfUrl = '/storage/media/handouts/' . $filename;

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
                DB::table('live_broadcasts')->where('id', $broadcastId)->update([
                    'companion_pdf_url' => $pdfUrl,
                    'updated_at' => now(),
                ]);
            } catch (\Throwable $e) {}

            try {
                $pdo = DatabaseService::getPdo();
                if ($pdo) {
                    $st = $pdo->prepare("UPDATE live_broadcasts SET companion_pdf_url = :u, updated_at = NOW() WHERE id = :id");
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
     * GET /api/live-broadcast/active
     * Fetch active live lecture streams for students and campus audience
     */
    public function getActiveStreams(Request $request)
    {
        $this->ensureDatabaseTables();

        $gov = $this->getGovernance();
        if (empty($gov['live_broadcast_master_enabled'])) {
            return response()->json([
                'success' => true,
                'active' => false,
                'broadcast' => null,
                'streams' => [],
                'governance_message' => 'Live Broadcasting is currently placed on scheduled maintenance by Library Systems Engineering.'
            ]);
        }

        $streams = collect();
        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->query("SELECT * FROM live_broadcasts WHERE is_live = 1 AND status = 'live' ORDER BY started_at DESC");
                if ($st) {
                    $rows = $st->fetchAll(\PDO::FETCH_ASSOC);
                    if (!empty($rows)) {
                        $streams = collect($rows)->map(fn($r) => (object) $r);
                    }
                }
            }
        } catch (\Throwable $e) {}

        if ($streams->isEmpty()) {
            try {
                $streams = DB::table('live_broadcasts')
                    ->where('is_live', true)
                    ->where('status', 'live')
                    ->orderBy('started_at', 'desc')
                    ->get();
            } catch (\Throwable $e) {}
        }

        // Refresh accurate viewer count on each active stream
        $streams = $streams->map(function ($s) {
            $s->viewers_count = $this->computeActiveViewersCount($s->id, (int) ($s->viewers_count ?? 0));
            return $s;
        });

        return response()->json([
            'success' => true,
            'active' => $streams->isNotEmpty(),
            'count' => $streams->count(),
            'broadcast' => $streams->first(),
            'streams' => $streams->values(),
        ]);
    }

    /**
     * POST /api/live-broadcast/start
     * Initiate live lecture broadcast from HOD Dashboard or Staff Workspace
     */
    public function start(Request $request)
    {
        $this->ensureDatabaseTables();

        $request->validate([
            'title' => 'required|string|max:500',
            'department_code' => 'required|string|max:30',
            'lecturer_name' => 'required|string|max:255',
        ]);

        $gov = $this->getGovernance();

        // 1. Master developer kill-switch check
        if (empty($gov['live_broadcast_master_enabled'])) {
            return response()->json([
                'success' => false,
                'code' => 'DEVELOPER_MASTER_LOCKED',
                'error' => 'Live broadcasting is currently disabled campus-wide in the Developer Governance Console.'
            ], 403);
        }

        // 2. Departmental permission check
        $deptCode = strtolower(trim((string) $request->input('department_code', 'cem')));
        $deptUpper = strtoupper($deptCode);
        $deptKey = 'live_broadcast_dept_' . $deptCode;
        if (isset($gov[$deptKey]) && empty($gov[$deptKey])) {
            return response()->json([
                'success' => false,
                'code' => 'DEPT_LIVE_LOCKED',
                'error' => "Live streaming for the Department of {$request->input('department_name')} is currently locked. Please contact the Library Developer through the Developer Authority Portal to activate live broadcasting."
            ], 403);
        }

        // Close any previous dangling live sessions for this same department before starting a fresh one
        try {
            DB::table('live_broadcasts')
                ->where('department_code', $deptUpper)
                ->where('is_live', true)
                ->update(['is_live' => false, 'status' => 'ended', 'ended_at' => now(), 'updated_at' => now()]);
        } catch (\Throwable $e) {}

        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $closeSt = $pdo->prepare("UPDATE live_broadcasts SET is_live = 0, status = 'ended', ended_at = NOW(), updated_at = NOW() WHERE department_code = :dc AND is_live = 1");
                $closeSt->execute([':dc' => $deptUpper]);
            }
        } catch (\Throwable $e) {}

        $broadcastId = 'LIVE-' . $deptUpper . '-' . date('Ymd-His') . '-' . strtoupper(Str::random(4));
        $nowStr = now()->toDateTimeString();

        $simulcastJson = is_array($request->input('simulcast_destinations'))
            ? json_encode($request->input('simulcast_destinations'))
            : (string) $request->input('simulcast_destinations', '[]');

        $data = [
            'id' => $broadcastId,
            'title' => trim((string) $request->input('title')),
            'department_code' => $deptUpper,
            'department_name' => $request->input('department_name', 'Co-operative Economics & Management'),
            'course_code' => $request->input('course_code'),
            'course_title' => $request->input('course_title'),
            'lecturer_name' => trim((string) $request->input('lecturer_name')),
            'lecturer_role' => $request->input('lecturer_role', 'hod'),
            'status' => 'live',
            'is_live' => true,
            'stream_mode' => $request->input('stream_mode', 'system_camera'),
            'resolution' => $request->input('resolution', '1080p Full HD'),
            'viewers_count' => 0,
            'simulcast_destinations' => $simulcastJson,
            'announcement' => $request->input('announcement'),
            'companion_pdf_url' => $request->input('companion_pdf_url'),
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

        // Initialize empty active viewer map in DB
        $this->setSettingValue('fcc_live_viewers_' . $broadcastId, json_encode([]), 'LiveBroadcast', "Active viewers for {$broadcastId}");

        // Broadcast initial system welcome message
        $welcomeMsg = "🔴 Live Lecture Broadcast started by {$data['lecturer_name']} ({$data['department_name']} — {$data['course_code']}). All connecting students are verified via database.";
        $this->insertChatMessageToDb([
            'broadcast_id' => $broadcastId,
            'user_name' => 'FCC Library Broadcast Core',
            'user_role' => 'system',
            'user_matric' => 'SYS-CORE',
            'message' => $welcomeMsg,
            'is_question' => false,
            'hand_raised' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Live broadcast session created and persisted in database',
            'broadcast' => $data,
        ]);
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
            DB::table('live_broadcasts')->where('id', $id)->update($updates);
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
                    WHERE id = :id
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
     * POST /api/live-broadcast/{id}/end
     * Stop active broadcast and archive recorded video to Central Library Catalogue
     */
    public function end(Request $request, $id)
    {
        $this->ensureDatabaseTables();

        $broadcast = null;
        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->prepare("SELECT * FROM live_broadcasts WHERE id = :id LIMIT 1");
                $st->execute([':id' => $id]);
                $row = $st->fetch(\PDO::FETCH_ASSOC);
                if ($row) $broadcast = (object) $row;
            }
        } catch (\Throwable $e) {}

        if (!$broadcast) {
            $broadcast = DB::table('live_broadcasts')->where('id', $id)->first();
        }

        if (!$broadcast) {
            return response()->json(['error' => 'Broadcast session not found'], 404);
        }

        try {
            DB::table('live_broadcasts')->where('id', $id)->update([
                'is_live' => false,
                'status' => 'ended',
                'ended_at' => now(),
                'updated_at' => now()
            ]);
        } catch (\Throwable $e) {}

        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->prepare("UPDATE live_broadcasts SET is_live = 0, status = 'ended', ended_at = NOW(), updated_at = NOW() WHERE id = :id");
                $st->execute([':id' => $id]);
            }
        } catch (\Throwable $e) {}

        $archivedMediaId = null;
        $mediaUrl = null;

        // Auto-archive recorded lecture if file is submitted or live stream buffer exists
        $liveBufferPath = storage_path('app/public/live/' . $id . '/stream.webm');
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
                'title' => $broadcast->title . ' (Recorded Live Lecture)',
                'subtitle' => 'Live Broadcast Session from ' . date('F j, Y'),
                'media_type' => 'video',
                'resource_type' => 'lecture_recording',
                'creator' => $broadcast->lecturer_name,
                'creator_title' => $broadcast->lecturer_role === 'hod' ? 'Head of Department' : 'Lecturer',
                'department_id' => $broadcast->department_code,
                'department_name' => $broadcast->department_name,
                'course_code' => $broadcast->course_code,
                'target_level' => $request->input('target_level', 'ND I'),
                'duration_seconds' => intval($request->input('duration_seconds', 1800)),
                'duration_formatted' => $request->input('duration_formatted', '30:00'),
                'description' => "Live interactive lecture recording broadcast from the FCC Institutional Multimedia Studio. Archived automatically for student review and examination revision.",
                'subject_keywords' => json_encode(['Live Lecture', $broadcast->department_name, $broadcast->course_code]),
                'media_url' => $mediaUrl,
                'video_resolution' => $broadcast->resolution ?: '1080p Full HD',
                'access_level' => 'open_access',
                'status' => 'published',
                'uploaded_by' => $broadcast->lecturer_name,
                'created_at' => now(),
                'updated_at' => now()
            ];

            try {
                DB::table('media_resources')->insert($mediaRecord);
            } catch (\Throwable $e) {}

            try {
                DB::table('live_broadcasts')->where('id', $id)->update([
                    'recording_media_id' => $archivedMediaId
                ]);
            } catch (\Throwable $e) {}

            try {
                $pdo = DatabaseService::getPdo();
                if ($pdo) {
                    $st = $pdo->prepare("UPDATE live_broadcasts SET recording_media_id = :mid WHERE id = :id");
                    $st->execute([':mid' => $archivedMediaId, ':id' => $id]);
                }
            } catch (\Throwable $e) {}
        }

        return response()->json([
            'success' => true,
            'message' => 'Broadcast terminated and archived in database',
            'archived_media_id' => $archivedMediaId,
            'media_url' => $mediaUrl,
        ]);
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

        $request->validate([
            'user_name' => 'required|string|max:255',
            'message' => 'required|string|max:1000',
        ]);

        $chatId = $this->insertChatMessageToDb([
            'broadcast_id' => $id,
            'user_name' => $request->input('user_name'),
            'user_role' => $request->input('user_role', 'student'),
            'user_matric' => $request->input('user_matric', 'STUDENT'),
            'message' => trim((string) $request->input('message')),
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

        return response()->json([
            'success' => true,
            'viewers_count' => $viewersCount,
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

        $request->validate([
            'sender_id' => 'required|string|max:120',
            'recipient_id' => 'required|string|max:120',
            'signal_type' => 'required|string|max:50',
            'payload' => 'required',
        ]);

        $payload = is_string($request->input('payload'))
            ? $request->input('payload')
            : json_encode($request->input('payload'));

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
}
