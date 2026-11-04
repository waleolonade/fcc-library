<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DatabaseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class HodStaffPortalController extends Controller
{
    /**
     * Default Pages & Granular Features/Functions definitions available for HODs to assign to staff
     */
    public static function getDefaultCatalog(): array
    {
        return [
            'pages' => [
                'overview'      => ['label' => 'Department Overview & Holdings', 'category' => 'Core Portal'],
                'courses'       => ['label' => 'Curriculum & Syllabi Registry', 'category' => 'Academic'],
                'upload'        => ['label' => 'Book & Academic Journal Upload Studio', 'category' => 'Publishing'],
                'submissions'   => ['label' => 'Ingestion Pipeline & Review Queue', 'category' => 'Publishing'],
                'dissertations' => ['label' => 'HND Dissertations & Student Projects', 'category' => 'Research'],
                'reserves'      => ['label' => 'Course Reserves Desk', 'category' => 'Circulation'],
                'scholars'      => ['label' => 'Registered Students & Clearance', 'category' => 'Registry'],
                'communication' => ['label' => 'Tri-Party Dispatch & Messaging', 'category' => 'Communications'],
            ],
            'features' => [
                'fn_upload_books'          => ['label' => 'Upload E-Books & Lecture Handouts', 'page' => 'upload'],
                'fn_upload_journals'       => ['label' => 'Bulk Upload Academic Journals & Auto-Scan ISSN/DOI', 'page' => 'upload'],
                'fn_watermark_control'     => ['label' => 'Configure Digital Watermark Protection', 'page' => 'upload'],
                'fn_edit_submissions'      => ['label' => 'Edit & Update Ingestion Pipeline Metadata', 'page' => 'submissions'],
                'fn_delete_submissions'    => ['label' => 'Withdraw / Delete Department Submissions', 'page' => 'submissions'],
                'fn_manage_courses'        => ['label' => 'Create, Edit & Delete Curriculum Courses & Syllabi', 'page' => 'courses'],
                'fn_approve_dissertations' => ['label' => 'Approve / Request Revision on Student Dissertations', 'page' => 'dissertations'],
                'fn_upload_dissertations'  => ['label' => 'Upload Capstone Dissertations to Repository', 'page' => 'dissertations'],
                'fn_manage_reserves'       => ['label' => 'Add, Edit & Remove Course Reserve Textbooks', 'page' => 'reserves'],
                'fn_manage_students'       => ['label' => 'Add, Bulk Import & Edit Department Students', 'page' => 'scholars'],
                'fn_approve_clearance'     => ['label' => 'Approve Convocation Library Clearance for Students', 'page' => 'scholars'],
                'fn_send_dispatch'         => ['label' => 'Send Departmental Broadcasts & Tri-Party Dispatches', 'page' => 'communication'],
                'fn_ai_gora_tools'         => ['label' => 'Run Gora Off-Chain Watermark Verification & InneAI Analysis', 'page' => 'overview'],
            ]
        ];
    }

    /**
     * Ensure hod_department_staff table exists in SQLite and MySQL
     */
    public static function ensureTablesExist(): void
    {
        try {
            DB::statement("
                CREATE TABLE IF NOT EXISTS hod_department_staff (
                    id VARCHAR(64) PRIMARY KEY,
                    staff_code VARCHAR(64) NOT NULL,
                    username VARCHAR(100) NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NULL,
                    phone VARCHAR(64) NULL,
                    designation VARCHAR(150) DEFAULT 'Senior Lecturer',
                    department_code VARCHAR(32) NOT NULL,
                    department_name VARCHAR(255) NULL,
                    assigned_courses TEXT NULL,
                    page_title VARCHAR(255) NULL,
                    welcome_banner TEXT NULL,
                    allowed_pages TEXT NULL,
                    allowed_features TEXT NULL,
                    password_plain VARCHAR(120) NULL,
                    password_hash VARCHAR(255) NULL,
                    status VARCHAR(32) DEFAULT 'active',
                    created_by_hod VARCHAR(255) NULL,
                    last_login_at VARCHAR(64) NULL,
                    created_at VARCHAR(64) NULL,
                    updated_at VARCHAR(64) NULL
                )
            ");
        } catch (\Throwable $e) {}

        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS hod_department_staff (
                        id VARCHAR(64) PRIMARY KEY,
                        staff_code VARCHAR(64) NOT NULL,
                        username VARCHAR(100) NOT NULL,
                        name VARCHAR(255) NOT NULL,
                        email VARCHAR(255) NULL,
                        phone VARCHAR(64) NULL,
                        designation VARCHAR(150) DEFAULT 'Senior Lecturer',
                        department_code VARCHAR(32) NOT NULL,
                        department_name VARCHAR(255) NULL,
                        assigned_courses TEXT NULL,
                        page_title VARCHAR(255) NULL,
                        welcome_banner TEXT NULL,
                        allowed_pages LONGTEXT NULL,
                        allowed_features LONGTEXT NULL,
                        password_plain VARCHAR(120) NULL,
                        password_hash VARCHAR(255) NULL,
                        status VARCHAR(32) DEFAULT 'active',
                        created_by_hod VARCHAR(255) NULL,
                        last_login_at VARCHAR(64) NULL,
                        created_at VARCHAR(64) NULL,
                        updated_at VARCHAR(64) NULL
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                ");
            }
        } catch (\Throwable $e) {}
    }

    /**
     * Seed default departmental staff workspaces for a department if none exist yet
     */
    private function ensureDepartmentSeeded(string $deptCode, string $deptName = ''): void
    {
        self::ensureTablesExist();
        $code = strtoupper(trim($deptCode ?: 'CEM'));
        $name = trim($deptName ?: "{$code} Department");

        try {
            $count = DB::table('hod_department_staff')
                ->whereRaw('UPPER(department_code) = ?', [$code])
                ->count();
            if ($count > 0) {
                return;
            }
        } catch (\Throwable $e) {
            return;
        }

        $now = now('Africa/Lagos')->toIso8601String();
        $lowerCode = strtolower($code);

        $presets = [
            [
                'id' => "STF-{$code}-001",
                'staff_code' => "STF/{$code}/001",
                'username' => "{$lowerCode}_coordinator",
                'name' => "Dr. Tunde Olatunji ({$code})",
                'email' => "{$lowerCode}.coordinator@fccibadan.edu.ng",
                'phone' => '+234 803 412 8890',
                'designation' => 'Senior Lecturer & Course Coordinator',
                'department_code' => $code,
                'department_name' => $name,
                'assigned_courses' => json_encode(["{$code} 411", "{$code} 312", "{$code} 214"]),
                'page_title' => "{$code} Curriculum & Academic Journal Publishing Workspace",
                'welcome_banner' => "Authorized by the Head of Department ({$name}) to manage course syllabi, upload lecture handouts & academic journals, and oversee course reserves.",
                'allowed_pages' => json_encode([
                    'overview' => true,
                    'courses' => true,
                    'upload' => true,
                    'submissions' => true,
                    'dissertations' => false,
                    'reserves' => true,
                    'scholars' => false,
                    'communication' => true,
                ]),
                'allowed_features' => json_encode([
                    'fn_upload_books' => true,
                    'fn_upload_journals' => true,
                    'fn_watermark_control' => true,
                    'fn_edit_submissions' => true,
                    'fn_delete_submissions' => false,
                    'fn_manage_courses' => true,
                    'fn_approve_dissertations' => false,
                    'fn_upload_dissertations' => false,
                    'fn_manage_reserves' => true,
                    'fn_manage_students' => false,
                    'fn_approve_clearance' => false,
                    'fn_send_dispatch' => true,
                    'fn_ai_gora_tools' => true,
                ]),
                'password_plain' => "{$lowerCode}staff123",
                'password_hash' => Hash::make("{$lowerCode}staff123"),
                'status' => 'active',
                'created_by_hod' => "HOD ({$code})",
                'last_login_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => "STF-{$code}-002",
                'staff_code' => "STF/{$code}/002",
                'username' => "{$lowerCode}_supervisor",
                'name' => "Engr. Mrs. Folake Adeyemi ({$code})",
                'email' => "{$lowerCode}.projects@fccibadan.edu.ng",
                'phone' => '+234 806 551 2309',
                'designation' => 'HND Project Supervisor & Clearance Officer',
                'department_code' => $code,
                'department_name' => $name,
                'assigned_courses' => json_encode(["{$code} 499", "{$code} 422"]),
                'page_title' => "{$code} Dissertation Review & Student Clearance Desk",
                'welcome_banner' => "Delegated HOD Workspace for reviewing HND II capstone dissertations, uploading approved student projects, and clearing graduating scholars.",
                'allowed_pages' => json_encode([
                    'overview' => true,
                    'courses' => false,
                    'upload' => true,
                    'submissions' => true,
                    'dissertations' => true,
                    'reserves' => false,
                    'scholars' => true,
                    'communication' => true,
                ]),
                'allowed_features' => json_encode([
                    'fn_upload_books' => false,
                    'fn_upload_journals' => true,
                    'fn_watermark_control' => true,
                    'fn_edit_submissions' => false,
                    'fn_delete_submissions' => false,
                    'fn_manage_courses' => false,
                    'fn_approve_dissertations' => true,
                    'fn_upload_dissertations' => true,
                    'fn_manage_reserves' => false,
                    'fn_manage_students' => true,
                    'fn_approve_clearance' => true,
                    'fn_send_dispatch' => true,
                    'fn_ai_gora_tools' => true,
                ]),
                'password_plain' => "{$lowerCode}staff123",
                'password_hash' => Hash::make("{$lowerCode}staff123"),
                'status' => 'active',
                'created_by_hod' => "HOD ({$code})",
                'last_login_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        ];

        foreach ($presets as $row) {
            try {
                DB::table('hod_department_staff')->updateOrInsert(['id' => $row['id']], $row);
            } catch (\Throwable $e) {}
            $this->syncStaffRowToMysql($row);
        }
    }

    private function syncStaffRowToMysql(array $row): void
    {
        try {
            $pdo = DatabaseService::getPdo();
            if (!$pdo) return;
            $stmt = $pdo->prepare("
                INSERT INTO hod_department_staff (
                    id, staff_code, username, name, email, phone, designation,
                    department_code, department_name, assigned_courses, page_title,
                    welcome_banner, allowed_pages, allowed_features, password_plain,
                    password_hash, status, created_by_hod, last_login_at, created_at, updated_at
                ) VALUES (
                    :id, :staff_code, :username, :name, :email, :phone, :designation,
                    :department_code, :department_name, :assigned_courses, :page_title,
                    :welcome_banner, :allowed_pages, :allowed_features, :password_plain,
                    :password_hash, :status, :created_by_hod, :last_login_at, :created_at, :updated_at
                )
                ON DUPLICATE KEY UPDATE
                    staff_code = VALUES(staff_code),
                    username = VALUES(username),
                    name = VALUES(name),
                    email = VALUES(email),
                    phone = VALUES(phone),
                    designation = VALUES(designation),
                    department_code = VALUES(department_code),
                    department_name = VALUES(department_name),
                    assigned_courses = VALUES(assigned_courses),
                    page_title = VALUES(page_title),
                    welcome_banner = VALUES(welcome_banner),
                    allowed_pages = VALUES(allowed_pages),
                    allowed_features = VALUES(allowed_features),
                    password_plain = VALUES(password_plain),
                    password_hash = VALUES(password_hash),
                    status = VALUES(status),
                    updated_at = VALUES(updated_at)
            ");
            $stmt->execute($row);
        } catch (\Throwable $e) {}
    }

    private function formatStaffRecord($row, bool $includePassword = true): array
    {
        $arr = (array) $row;
        $arr['assigned_courses'] = is_string($arr['assigned_courses'] ?? null)
            ? (json_decode($arr['assigned_courses'], true) ?: [])
            : ($arr['assigned_courses'] ?? []);
        $arr['allowed_pages'] = is_string($arr['allowed_pages'] ?? null)
            ? (json_decode($arr['allowed_pages'], true) ?: [])
            : ($arr['allowed_pages'] ?? []);
        $arr['allowed_features'] = is_string($arr['allowed_features'] ?? null)
            ? (json_decode($arr['allowed_features'], true) ?: [])
            : ($arr['allowed_features'] ?? []);
        unset($arr['password_hash']);
        if (!$includePassword) {
            unset($arr['password_plain']);
        } else if (empty($arr['password_plain'])) {
            $code = strtolower($arr['department_code'] ?? 'cem');
            $arr['password_plain'] = "{$code}staff123";
        }
        return $arr;
    }

    /**
     * GET /api/hod/staff
     */
    public function index(Request $request)
    {
        $deptCode = strtoupper(trim((string) $request->query('department_code', 'CEM')));
        $deptName = trim((string) $request->query('department_name', ''));
        $this->ensureDepartmentSeeded($deptCode, $deptName);

        $rows = DB::table('hod_department_staff')
            ->whereRaw('UPPER(department_code) = ?', [$deptCode])
            ->orderBy('created_at', 'desc')
            ->get();

        $staffList = [];
        foreach ($rows as $r) {
            $staffList[] = $this->formatStaffRecord($r);
        }

        return response()->json([
            'status' => 'success',
            'success' => true,
            'department_code' => $deptCode,
            'catalog' => self::getDefaultCatalog(),
            'staff' => $staffList
        ]);
    }

    /**
     * POST /api/hod/staff
     * Create a new staff member and custom workspace page under the HOD
     */
    public function store(Request $request)
    {
        self::ensureTablesExist();

        $payload = $request->isJson() ? $request->json()->all() : $request->all();
        if (empty($payload)) {
            $raw = file_get_contents('php://input');
            if ($raw) {
                $decoded = json_decode($raw, true);
                if (is_array($decoded)) $payload = $decoded;
            }
        }

        $staffCode = trim((string) ($payload['staff_code'] ?? $request->input('staff_code', '')));
        $deptCode = strtoupper(trim((string) ($payload['department_code'] ?? $request->input('department_code', ''))));
        if (empty($deptCode) && !empty($staffCode)) {
            if (preg_match('/STF\/([A-Za-z0-9_-]+)\//i', $staffCode, $m)) {
                $deptCode = strtoupper($m[1]);
            }
        }
        if (empty($deptCode)) {
            $deptCode = 'CEM';
        }

        $deptName = trim((string) ($payload['department_name'] ?? $request->input('department_name', "{$deptCode} Department")));
        $name = trim((string) ($payload['name'] ?? $request->input('name', 'Departmental Staff')));
        $designation = trim((string) ($payload['designation'] ?? $request->input('designation', 'Lecturer')));
        $email = trim((string) ($payload['email'] ?? $request->input('email', '')));
        $phone = trim((string) ($payload['phone'] ?? $request->input('phone', '')));
        $passwordPlain = trim((string) ($payload['password'] ?? $request->input('password', strtolower($deptCode) . 'staff123')));

        $existingCount = DB::table('hod_department_staff')
            ->whereRaw('UPPER(department_code) = ?', [$deptCode])
            ->count();
        $seq = str_pad((string) ($existingCount + 1), 3, '0', STR_PAD_LEFT);

        $id = 'STF-' . $deptCode . '-' . strtoupper(Str::random(4));
        if (empty($staffCode)) {
            $staffCode = "STF/{$deptCode}/{$seq}";
        }
        $username = trim((string) ($payload['username'] ?? $request->input('username', strtolower($deptCode) . '_staff_' . strtolower(Str::random(4)))));
        $pageTitle = trim((string) ($payload['page_title'] ?? $request->input('page_title', "{$name} — {$designation} Workspace")));
        $welcomeBanner = trim((string) ($payload['welcome_banner'] ?? $request->input('welcome_banner', "Delegated Departmental Workspace created by the Head of Department ({$deptName}).")));

        $coursesInput = $payload['assigned_courses'] ?? $request->input('assigned_courses', []);
        if (is_string($coursesInput)) {
            $coursesInput = array_values(array_filter(array_map('trim', explode(',', $coursesInput))));
        }

        $allowedPages = $payload['allowed_pages'] ?? $request->input('allowed_pages', null);
        if (!is_array($allowedPages) || empty($allowedPages)) {
            $allowedPages = [
                'overview' => true,
                'courses' => true,
                'upload' => true,
                'submissions' => true,
                'dissertations' => false,
                'reserves' => true,
                'scholars' => false,
                'communication' => true,
            ];
        }

        $allowedFeatures = $payload['allowed_features'] ?? $request->input('allowed_features', null);
        if (!is_array($allowedFeatures) || empty($allowedFeatures)) {
            $allowedFeatures = [
                'fn_upload_books' => true,
                'fn_upload_journals' => true,
                'fn_watermark_control' => true,
                'fn_edit_submissions' => true,
                'fn_delete_submissions' => false,
                'fn_manage_courses' => true,
                'fn_approve_dissertations' => false,
                'fn_upload_dissertations' => false,
                'fn_manage_reserves' => true,
                'fn_manage_students' => false,
                'fn_approve_clearance' => false,
                'fn_send_dispatch' => true,
                'fn_ai_gora_tools' => true,
            ];
        }

        $now = now('Africa/Lagos')->toIso8601String();
        $row = [
            'id' => $id,
            'staff_code' => $staffCode,
            'username' => $username,
            'name' => $name,
            'email' => $email ?: "{$username}@fccibadan.edu.ng",
            'phone' => $phone,
            'designation' => $designation,
            'department_code' => $deptCode,
            'department_name' => $deptName,
            'assigned_courses' => json_encode($coursesInput),
            'page_title' => $pageTitle,
            'welcome_banner' => $welcomeBanner,
            'allowed_pages' => json_encode($allowedPages),
            'allowed_features' => json_encode($allowedFeatures),
            'password_plain' => $passwordPlain,
            'password_hash' => Hash::make($passwordPlain),
            'status' => $payload['status'] ?? $request->input('status', 'active'),
            'created_by_hod' => $payload['created_by_hod'] ?? $request->input('created_by_hod', "HOD ({$deptCode})"),
            'last_login_at' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ];

        try {
            DB::table('hod_department_staff')->updateOrInsert(['id' => $id], $row);
            $this->syncStaffRowToMysql($row);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'error',
                'success' => false,
                'message' => 'Database error while saving staff: ' . $e->getMessage()
            ], 500);
        }

        // Create an actionable notification for the HOD and staff member
        try {
            DB::table('notifications')->insert([
                'id' => 'NOTIF-STF-' . strtoupper(Str::random(8)),
                'matric' => "HOD/{$deptCode}/001",
                'type' => 'hod_staff_workspace',
                'title' => "Staff Workspace Created: {$name} ({$designation})",
                'message' => "Custom staff page '{$pageTitle}' has been provisioned under {$deptName} with Staff ID {$staffCode}. Click to open the Staff Workspace.",
                'date' => $now,
                'read' => 0,
                'action_url' => "#/hod/staff-workspace?staffId={$id}"
            ]);
        } catch (\Throwable $e) {}

        return response()->json([
            'status' => 'success',
            'success' => true,
            'message' => "Staff workspace page for {$name} created successfully!",
            'staff' => $this->formatStaffRecord($row),
            'plain_password' => $passwordPlain
        ], 201);
    }

    /**
     * PUT/POST /api/hod/staff/{id}
     * Update staff profile, custom page settings, allowed_pages, or allowed_features
     */
    public function update(Request $request, $id)
    {
        self::ensureTablesExist();
        $existing = DB::table('hod_department_staff')->where('id', $id)->first();
        if (!$existing) {
            return response()->json(['success' => false, 'message' => 'Staff record not found.'], 404);
        }

        $curr = (array) $existing;
        $now = now('Africa/Lagos')->toIso8601String();

        $payload = $request->isJson() ? $request->json()->all() : $request->all();
        if (empty($payload)) {
            $raw = file_get_contents('php://input');
            if ($raw) {
                $decoded = json_decode($raw, true);
                if (is_array($decoded)) $payload = $decoded;
            }
        }

        $coursesInput = isset($payload['assigned_courses'])
            ? $payload['assigned_courses']
            : ($request->has('assigned_courses') ? $request->input('assigned_courses') : (json_decode($curr['assigned_courses'] ?? '[]', true) ?: []));
        if (is_string($coursesInput)) {
            $coursesInput = array_values(array_filter(array_map('trim', explode(',', $coursesInput))));
        }

        $allowedPages = isset($payload['allowed_pages'])
            ? $payload['allowed_pages']
            : ($request->has('allowed_pages') ? $request->input('allowed_pages') : (json_decode($curr['allowed_pages'] ?? '{}', true) ?: []));

        $allowedFeatures = isset($payload['allowed_features'])
            ? $payload['allowed_features']
            : ($request->has('allowed_features') ? $request->input('allowed_features') : (json_decode($curr['allowed_features'] ?? '{}', true) ?: []));

        $newPass = trim((string) ($payload['password'] ?? $request->input('password', '')));
        $passwordPlain = $newPass !== '' ? $newPass : ($curr['password_plain'] ?? 'staff123');
        $passwordHash = $newPass !== '' ? Hash::make($newPass) : ($curr['password_hash'] ?? Hash::make($passwordPlain));

        $updatedRow = [
            'id' => $curr['id'],
            'staff_code' => trim((string) ($payload['staff_code'] ?? $request->input('staff_code', $curr['staff_code']))),
            'username' => trim((string) ($payload['username'] ?? $request->input('username', $curr['username']))),
            'name' => trim((string) ($payload['name'] ?? $request->input('name', $curr['name']))),
            'email' => trim((string) ($payload['email'] ?? $request->input('email', $curr['email']))),
            'phone' => trim((string) ($payload['phone'] ?? $request->input('phone', $curr['phone']))),
            'designation' => trim((string) ($payload['designation'] ?? $request->input('designation', $curr['designation']))),
            'department_code' => strtoupper(trim((string) ($payload['department_code'] ?? $request->input('department_code', $curr['department_code'])))),
            'department_name' => trim((string) ($payload['department_name'] ?? $request->input('department_name', $curr['department_name']))),
            'assigned_courses' => json_encode($coursesInput),
            'page_title' => trim((string) ($payload['page_title'] ?? $request->input('page_title', $curr['page_title']))),
            'welcome_banner' => trim((string) ($payload['welcome_banner'] ?? $request->input('welcome_banner', $curr['welcome_banner']))),
            'allowed_pages' => json_encode($allowedPages),
            'allowed_features' => json_encode($allowedFeatures),
            'password_plain' => $passwordPlain,
            'password_hash' => $passwordHash,
            'status' => $payload['status'] ?? $request->input('status', $curr['status'] ?? 'active'),
            'created_by_hod' => $curr['created_by_hod'] ?? 'HOD',
            'last_login_at' => $curr['last_login_at'],
            'created_at' => $curr['created_at'] ?? $now,
            'updated_at' => $now,
        ];

        DB::table('hod_department_staff')->where('id', $id)->update($updatedRow);
        $this->syncStaffRowToMysql($updatedRow);

        return response()->json([
            'status' => 'success',
            'success' => true,
            'message' => "Updated workspace and permissions for {$updatedRow['name']}.",
            'staff' => $this->formatStaffRecord($updatedRow),
            'plain_password' => $passwordPlain
        ]);
    }

    /**
     * POST /api/hod/staff/bulk-permissions
     * Bulk update pages or features across multiple or all departmental staff under the HOD
     */
    public function bulkUpdatePermissions(Request $request)
    {
        self::ensureTablesExist();
        $deptCode = strtoupper(trim((string) $request->input('department_code', 'CEM')));
        $staffIds = $request->input('staff_ids', []); // empty = all in department
        $targetScope = $request->input('scope', 'all'); // 'pages' | 'features' | 'all' | 'single_key'
        $key = $request->input('key');
        $enabled = (bool) $request->input('enabled', true);
        $presetPages = $request->input('allowed_pages');
        $presetFeatures = $request->input('allowed_features');

        $query = DB::table('hod_department_staff')->whereRaw('UPPER(department_code) = ?', [$deptCode]);
        if (is_array($staffIds) && count($staffIds) > 0) {
            $query->whereIn('id', $staffIds);
        }
        $rows = $query->get();

        $catalog = self::getDefaultCatalog();
        $now = now('Africa/Lagos')->toIso8601String();
        $updatedList = [];

        foreach ($rows as $r) {
            $curr = (array) $r;
            $pages = json_decode($curr['allowed_pages'] ?? '{}', true) ?: [];
            $features = json_decode($curr['allowed_features'] ?? '{}', true) ?: [];

            if (is_array($presetPages)) {
                $pages = $presetPages;
            } elseif ($targetScope === 'pages' || $targetScope === 'all') {
                foreach (array_keys($catalog['pages']) as $pk) {
                    $pages[$pk] = $pk === 'overview' ? true : $enabled;
                }
            } elseif ($targetScope === 'page_key' && $key) {
                $pages[$key] = $enabled;
            }

            if (is_array($presetFeatures)) {
                $features = $presetFeatures;
            } elseif ($targetScope === 'features' || $targetScope === 'all') {
                foreach (array_keys($catalog['features']) as $fk) {
                    $features[$fk] = $enabled;
                }
            } elseif ($targetScope === 'feature_key' && $key) {
                $features[$key] = $enabled;
            }

            $curr['allowed_pages'] = json_encode($pages);
            $curr['allowed_features'] = json_encode($features);
            $curr['updated_at'] = $now;

            DB::table('hod_department_staff')->where('id', $curr['id'])->update([
                'allowed_pages' => $curr['allowed_pages'],
                'allowed_features' => $curr['allowed_features'],
                'updated_at' => $now
            ]);
            $this->syncStaffRowToMysql($curr);
            $updatedList[] = $this->formatStaffRecord($curr);
        }

        return response()->json([
            'status' => 'success',
            'success' => true,
            'message' => 'Bulk staff permissions updated across ' . count($updatedList) . ' staff workspace(s).',
            'staff' => $updatedList,
            'count' => count($updatedList)
        ]);
    }

    /**
     * DELETE /api/hod/staff/{id}
     */
    public function destroy($id)
    {
        self::ensureTablesExist();
        DB::table('hod_department_staff')->where('id', $id)->delete();
        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $stmt = $pdo->prepare("DELETE FROM hod_department_staff WHERE id = :id");
                $stmt->execute([':id' => $id]);
            }
        } catch (\Throwable $e) {}

        return response()->json([
            'status' => 'success',
            'success' => true,
            'message' => 'Departmental staff workspace removed.'
        ]);
    }

    /**
     * POST /api/hod/staff/login
     * Direct authentication for Departmental Staff created by an HOD
     */
    public function login(Request $request)
    {
        self::ensureTablesExist();
        $identifier = strtolower(trim((string) $request->input('identifier', $request->input('username', ''))));
        $password = trim((string) $request->input('password', ''));

        if (!$identifier || !$password) {
            return response()->json(['success' => false, 'message' => 'Staff ID/Email and Password are required.'], 422);
        }

        $staff = DB::table('hod_department_staff')
            ->whereRaw('LOWER(username) = ?', [$identifier])
            ->orWhereRaw('LOWER(staff_code) = ?', [$identifier])
            ->orWhereRaw('LOWER(email) = ?', [$identifier])
            ->orWhereRaw('LOWER(id) = ?', [$identifier])
            ->first();

        if (!$staff) {
            return response()->json(['success' => false, 'message' => 'Unrecognized Departmental Staff ID or Email.'], 401);
        }

        $row = (array) $staff;
        if (($row['status'] ?? 'active') !== 'active') {
            return response()->json(['success' => false, 'message' => 'This staff workspace is currently suspended by the Head of Department.'], 403);
        }

        $validPass = ($row['password_plain'] ?? '') === $password
            || (!empty($row['password_hash']) && Hash::check($password, $row['password_hash']));

        if (!$validPass) {
            return response()->json(['success' => false, 'message' => 'Invalid password for this Departmental Staff account.'], 401);
        }

        $now = now('Africa/Lagos')->toIso8601String();
        DB::table('hod_department_staff')->where('id', $row['id'])->update(['last_login_at' => $now]);

        $formatted = $this->formatStaffRecord($row);
        return response()->json([
            'success' => true,
            'staff' => $formatted,
            'token' => 'FCC-HOD-STAFF-' . strtoupper(Str::random(24))
        ]);
    }
}

