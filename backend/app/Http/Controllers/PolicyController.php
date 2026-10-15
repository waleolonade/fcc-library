<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\Patron;
use App\Models\Department;
use App\Models\AuditLog;

class PolicyController extends Controller
{
    /**
     * Get direct PDO connection to MySQL gsashtub_brainfeels_library database (phpMyAdmin).
     */
    private function getMysqlPdo(): ?\PDO
    {
        try {
            return \App\Services\DatabaseService::getPdo();
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * GET /api/policies
     * Retrieve institutional tier borrowing policies and fine calculation rules.
     */
    public function getPolicies()
    {
        $settingsRaw = DB::table('library_settings')->get();
        $settings = [];
        foreach ($settingsRaw as $s) {
            $settings[$s->setting_key] = $s->setting_value;
        }

        // 1. Tier Borrowing Policies
        $tierPolicies = null;
        if (!empty($settings['tier_policies'])) {
            $decoded = json_decode($settings['tier_policies'], true);
            if (is_array($decoded) && count($decoded) > 0) {
                $tierPolicies = $decoded;
            }
        }

        if (!$tierPolicies) {
            $tierPolicies = [
                [
                    'tier' => 'Students (ND / HND)',
                    'role' => 'student',
                    'maxBooks' => (int)($settings['max_borrow_limit_student'] ?? 5),
                    'loanDays' => (int)($settings['loan_duration_days'] ?? 14),
                    'gracePeriodDays' => 3,
                    'dailyFine' => (float)($settings['daily_fine_rate'] ?? 50.0),
                    'canReserve' => true,
                    'canAccessTheses' => true
                ],
                [
                    'tier' => 'Academic Faculty',
                    'role' => 'faculty',
                    'maxBooks' => (int)($settings['max_borrow_limit_faculty'] ?? 10),
                    'loanDays' => 30,
                    'gracePeriodDays' => 7,
                    'dailyFine' => 20.0,
                    'canReserve' => true,
                    'canAccessTheses' => true
                ],
                [
                    'tier' => 'Department Heads (HOD)',
                    'role' => 'hod',
                    'maxBooks' => 10,
                    'loanDays' => 60,
                    'gracePeriodDays' => 14,
                    'dailyFine' => 0.0,
                    'canReserve' => true,
                    'canAccessTheses' => true
                ],
                [
                    'tier' => 'Operational Staff & Librarians',
                    'role' => 'librarian',
                    'maxBooks' => 15,
                    'loanDays' => 90,
                    'gracePeriodDays' => 30,
                    'dailyFine' => 0.0,
                    'canReserve' => true,
                    'canAccessTheses' => true
                ]
            ];
        }

        // 2. Fine Calculation Rules
        $fineRules = null;
        if (!empty($settings['fine_rules'])) {
            $decodedFine = json_decode($settings['fine_rules'], true);
            if (is_array($decodedFine)) {
                $fineRules = $decodedFine;
            }
        }

        if (!$fineRules) {
            $fineRules = [
                'dailyPenaltyFee' => (float)($settings['daily_fine_rate'] ?? 50.0),
                'lostBookMultiplier' => 1.25,
                'maxWaiverLibrarian' => 10000.0,
                'maxWaiverDeskStaff' => 500.0
            ];
        }

        // 3. System Roles
        $roles = DB::table('roles')->get();

        return response()->json([
            'success' => true,
            'tier_policies' => $tierPolicies,
            'fine_rules' => $fineRules,
            'settings' => $settings,
            'roles' => $roles
        ]);
    }

    /**
     * POST /api/policies/tier
     * Update tier-based loan durations and borrow limits in SQLite database.
     */
    public function updateTierPolicy(Request $request)
    {
        $role = $request->input('role');
        $updatedPolicy = $request->input('policy', $request->all());

        // Load existing policies
        $existingJson = DB::table('library_settings')->where('setting_key', 'tier_policies')->value('setting_value');
        $policies = $existingJson ? json_decode($existingJson, true) : null;

        if (!$policies || !is_array($policies)) {
            $resp = $this->getPolicies();
            $policies = $resp->getData()->tier_policies;
            $policies = json_decode(json_encode($policies), true);
        }

        $found = false;
        foreach ($policies as &$p) {
            if (isset($p['role']) && $p['role'] === $role) {
                $p['maxBooks'] = (int)($updatedPolicy['maxBooks'] ?? $p['maxBooks']);
                $p['loanDays'] = (int)($updatedPolicy['loanDays'] ?? $p['loanDays']);
                $p['gracePeriodDays'] = (int)($updatedPolicy['gracePeriodDays'] ?? $p['gracePeriodDays']);
                $p['dailyFine'] = (float)($updatedPolicy['dailyFine'] ?? $p['dailyFine']);
                $p['canReserve'] = (bool)($updatedPolicy['canReserve'] ?? $p['canReserve']);
                $p['canAccessTheses'] = (bool)($updatedPolicy['canAccessTheses'] ?? $p['canAccessTheses']);
                if (!empty($updatedPolicy['tier'])) {
                    $p['tier'] = $updatedPolicy['tier'];
                }
                $found = true;
                break;
            }
        }

        if (!$found && !empty($updatedPolicy['role'])) {
            $policies[] = $updatedPolicy;
        }

        DB::table('library_settings')->updateOrInsert(
            ['setting_key' => 'tier_policies'],
            [
                'setting_value' => json_encode($policies),
                'setting_group' => 'circulation',
                'value_type' => 'json',
                'updated_at' => now()
            ]
        );

        if ($role === 'student' && isset($updatedPolicy['maxBooks'])) {
            DB::table('library_settings')->updateOrInsert(
                ['setting_key' => 'max_borrow_limit_student'],
                ['setting_value' => (string)$updatedPolicy['maxBooks'], 'updated_at' => now()]
            );
        }
        if ($role === 'student' && isset($updatedPolicy['loanDays'])) {
            DB::table('library_settings')->updateOrInsert(
                ['setting_key' => 'loan_duration_days'],
                ['setting_value' => (string)$updatedPolicy['loanDays'], 'updated_at' => now()]
            );
        }
        if ($role === 'faculty' && isset($updatedPolicy['maxBooks'])) {
            DB::table('library_settings')->updateOrInsert(
                ['setting_key' => 'max_borrow_limit_faculty'],
                ['setting_value' => (string)$updatedPolicy['maxBooks'], 'updated_at' => now()]
            );
        }

        $actor = $request->input('_actor', 'Chief Librarian');
        DB::table('audit_logs')->insert([
            'id' => 'LOG-' . Str::upper(Str::random(8)),
            'timestamp' => now(),
            'actor' => $actor,
            'role' => 'Administrator',
            'action' => 'Tier Policy Updated',
            'resource_type' => 'CirculationPolicy',
            'resource_id' => strtoupper($role ?? 'GLOBAL'),
            'details' => "Updated borrowing and circulation rules for role tier: {$role}.",
            'ip_address' => $request->ip() ?? '127.0.0.1'
        ]);

        return response()->json([
            'success' => true,
            'message' => "Borrowing policy for '{$role}' successfully saved to database.",
            'tier_policies' => $policies
        ]);
    }

    /**
     * POST /api/policies/fines
     * Update fine calculation rules and waiver permissions.
     */
    public function updateFineRules(Request $request)
    {
        $rules = [
            'dailyPenaltyFee' => (float)$request->input('dailyPenaltyFee', 50.0),
            'lostBookMultiplier' => (float)$request->input('lostBookMultiplier', 1.25),
            'maxWaiverLibrarian' => (float)$request->input('maxWaiverLibrarian', 10000.0),
            'maxWaiverDeskStaff' => (float)$request->input('maxWaiverDeskStaff', 500.0)
        ];

        DB::table('library_settings')->updateOrInsert(
            ['setting_key' => 'fine_rules'],
            [
                'setting_value' => json_encode($rules),
                'setting_group' => 'circulation',
                'value_type' => 'json',
                'updated_at' => now()
            ]
        );

        DB::table('library_settings')->updateOrInsert(
            ['setting_key' => 'daily_fine_rate'],
            [
                'setting_value' => number_format($rules['dailyPenaltyFee'], 2, '.', ''),
                'updated_at' => now()
            ]
        );

        $actor = $request->input('_actor', 'Chief Librarian');
        DB::table('audit_logs')->insert([
            'id' => 'LOG-' . Str::upper(Str::random(8)),
            'timestamp' => now(),
            'actor' => $actor,
            'role' => 'Administrator',
            'action' => 'Fine Rules Updated',
            'resource_type' => 'CirculationPolicy',
            'resource_id' => 'FINES_CONFIG',
            'details' => "Updated fine rules: ₦{$rules['dailyPenaltyFee']}/day penalty, {$rules['lostBookMultiplier']}x lost multiplier.",
            'ip_address' => $request->ip() ?? '127.0.0.1'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Fine calculation rules and waiver limits saved to database.',
            'fine_rules' => $rules
        ]);
    }

    /**
     * GET /api/rbac/directory
     * Fetch complete institutional user directory with active user_roles and permissions.
     */
    public function getRbacDirectory(Request $request)
    {
        $roleFilter = $request->query('role');
        $deptFilter = $request->query('dept');
        $search = strtolower(trim((string)$request->query('search', '')));

        $list = [];
        $pdo = $this->getMysqlPdo();

        // 1. Fetch system users joined with user_roles and roles
        if ($pdo) {
            try {
                $stmt = $pdo->query("
                    SELECT u.id, u.name, u.email, u.username, u.role as table_role, u.phone, u.designation, u.status,
                           r.id as role_id, r.name as role_name, r.display_name as role_display
                    FROM users u
                    LEFT JOIN user_roles ur ON u.id = ur.user_id
                    LEFT JOIN roles r ON ur.role_id = r.id
                    ORDER BY u.id ASC
                ");
                $rows = $stmt->fetchAll();

                $processedUserIds = [];
                foreach ($rows as $row) {
                    $uId = $row['id'];
                    $effectiveRole = strtolower($row['role_name'] ?: ($row['table_role'] ?: 'student'));

                    if (!isset($processedUserIds[$uId])) {
                        $processedUserIds[$uId] = [
                            'id' => $row['username'] ?: ('USER-' . str_pad($uId, 3, '0', STR_PAD_LEFT)),
                            'numeric_id' => $uId,
                            'name' => $row['name'],
                            'email' => $row['email'],
                            'username' => $row['username'],
                            'phone' => $row['phone'] ?? '+234 800 000 0000',
                            'dept' => $row['designation'] ?: 'Library Directorate',
                            'role' => $effectiveRole,
                            'roleLabel' => $row['role_display'] ?: ucwords(str_replace('_', ' ', $effectiveRole)),
                            'roles' => [$effectiveRole],
                            'role_ids' => $row['role_id'] ? [$row['role_id']] : [],
                            'status' => ucfirst($row['status'] ?: 'Active'),
                            'source' => 'system_user'
                        ];
                    } else {
                        if (!in_array($effectiveRole, $processedUserIds[$uId]['roles'])) {
                            $processedUserIds[$uId]['roles'][] = $effectiveRole;
                        }
                        if ($row['role_id'] && !in_array($row['role_id'], $processedUserIds[$uId]['role_ids'])) {
                            $processedUserIds[$uId]['role_ids'][] = $row['role_id'];
                        }
                    }
                }
                $list = array_values($processedUserIds);
            } catch (\Throwable $e) {}
        }

        // Fallback to SQLite users if MySQL empty
        if (empty($list)) {
            $sqliteUsers = DB::table('users')->get();
            foreach ($sqliteUsers as $u) {
                $role = strtolower($u->role ?? 'student');
                $list[] = [
                    'id' => $u->username ?: ('USER-' . str_pad($u->id, 3, '0', STR_PAD_LEFT)),
                    'numeric_id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'username' => $u->username ?? null,
                    'dept' => $u->designation ?: 'Library Directorate',
                    'role' => $role,
                    'roleLabel' => ucwords(str_replace('_', ' ', $role)),
                    'roles' => [$role],
                    'status' => ucfirst($u->status ?? 'Active'),
                    'source' => 'sqlite_user'
                ];
            }
        }

        // Compute Statistics
        $total = count($list);
        $librariansCount = count(array_filter($list, fn($u) => in_array($u['role'], ['admin', 'super_admin', 'chief_librarian', 'librarian', 'cataloguer', 'circulation_clerk'])));
        $hodsCount = count(array_filter($list, fn($u) => $u['role'] === 'hod'));
        $facultyCount = count(array_filter($list, fn($u) => $u['role'] === 'faculty'));
        $studentsCount = count(array_filter($list, fn($u) => $u['role'] === 'student'));

        // Filter if requested
        if ($roleFilter && $roleFilter !== 'all') {
            $list = array_values(array_filter($list, function ($u) use ($roleFilter) {
                if ($roleFilter === 'librarian') {
                    return in_array($u['role'], ['admin', 'super_admin', 'chief_librarian', 'librarian', 'cataloguer', 'circulation_clerk']);
                }
                return $u['role'] === $roleFilter || (isset($u['roles']) && in_array($roleFilter, $u['roles']));
            }));
        }

        if ($deptFilter && $deptFilter !== 'all') {
            $list = array_values(array_filter($list, fn($u) => str_contains(strtolower($u['dept']), strtolower($deptFilter))));
        }

        if (!empty($search)) {
            $list = array_values(array_filter($list, function ($u) use ($search) {
                return str_contains(strtolower($u['name'] ?? ''), $search)
                    || str_contains(strtolower($u['email'] ?? ''), $search)
                    || str_contains(strtolower($u['id'] ?? ''), $search)
                    || str_contains(strtolower($u['dept'] ?? ''), $search);
            }));
        }

        return response()->json([
            'success' => true,
            'count' => count($list),
            'users' => $list,
            'stats' => [
                'total' => $total,
                'librarians' => $librariansCount,
                'hods' => $hodsCount,
                'faculty' => $facultyCount,
                'students' => $studentsCount
            ]
        ]);
    }

    /**
     * PUT /api/rbac/users/{id}/role
     * Update an account's role tier and maintain user_roles table in database.
     */
    public function updateUserRole(Request $request, $id)
    {
        $newRole = strtolower(trim((string)$request->input('role', '')));
        $newStatus = trim((string)$request->input('status', 'Active'));
        $newQuota = $request->input('borrow_quota');

        if (empty($newRole)) {
            return response()->json(['success' => false, 'message' => 'Role is required.'], 422);
        }

        $roleNameToId = [
            'admin' => 1,
            'super_admin' => 1,
            'chief_librarian' => 2,
            'librarian' => 2,
            'cataloguer' => 3,
            'circulation_clerk' => 4,
            'staff' => 4,
            'hod' => 5,
            'faculty' => 6,
            'student' => 7,
            'guest' => 8
        ];
        $targetRoleId = $roleNameToId[$newRole] ?? 7;

        $cleanId = str_replace(['STAFF-', 'USER-'], '', $id);
        $pdo = $this->getMysqlPdo();

        if ($pdo) {
            try {
                $stmt = $pdo->prepare("SELECT id, name, email FROM users WHERE id = :id OR username = :username OR email = :email LIMIT 1");
                $stmt->execute([':id' => $cleanId, ':username' => $id, ':email' => $id]);
                $user = $stmt->fetch();

                if ($user) {
                    $uId = $user['id'];

                    // 1. Update role in users table
                    $up = $pdo->prepare("UPDATE users SET role = :role, status = :status, updated_at = NOW() WHERE id = :id");
                    $up->execute([':role' => $newRole, ':status' => strtolower($newStatus), ':id' => $uId]);

                    // 2. Maintain user_roles pivot table
                    $pdo->prepare("DELETE FROM user_roles WHERE user_id = ?")->execute([$uId]);
                    $pdo->prepare("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)")->execute([$uId, $targetRoleId]);

                    if (in_array($newRole, ['admin', 'super_admin'])) {
                        $pdo->prepare("INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, 2)")->execute([$uId]);
                    }
                }
            } catch (\Throwable $e) {}
        }

        // Also sync SQLite users table
        try {
            DB::table('users')->where('id', $cleanId)->orWhere('username', $id)->orWhere('email', $id)->update([
                'role' => $newRole,
                'status' => strtolower($newStatus),
                'updated_at' => now()
            ]);
        } catch (\Throwable $e) {}

        // Check if Patron exists and update patron role
        $patron = Patron::where('matric', $id)->orWhere('id', $id)->orWhere('email', $id)->first();
        if ($patron) {
            $patron->role = $newRole;
            if ($newRole === 'faculty') {
                $patron->level = 'Academic Faculty';
                $patron->category = 'Staff';
                $patron->borrow_quota = 10;
            } elseif ($newRole === 'student') {
                $patron->level = 'ND I';
                $patron->category = 'Undergraduate';
                $patron->borrow_quota = 5;
            }
            if ($newQuota !== null) {
                $patron->borrow_quota = (int)$newQuota;
            }
            $patron->status = $newStatus;
            $patron->save();
        }

        return response()->json([
            'success' => true,
            'message' => "User '{$id}' role successfully updated to '{$newRole}' in user_roles and users tables.",
            'role' => $newRole,
            'role_id' => $targetRoleId
        ]);
    }

    /**
     * POST /api/rbac/users
     * Create a new institutional staff or patron account in database and maintain user_roles.
     */
    public function createStaffUser(Request $request)
    {
        $name = trim((string)$request->input('name'));
        $email = trim((string)$request->input('email'));
        $role = strtolower(trim((string)$request->input('role', 'librarian')));
        $dept = trim((string)$request->input('department', $request->input('dept', 'Library Directorate')));
        $phone = trim((string)$request->input('phone', '+234 800 000 0000'));
        $pin = trim((string)$request->input('password', $request->input('pin', '1234')));

        if (empty($name) || empty($email)) {
            return response()->json([
                'success' => false,
                'message' => 'Name and institutional email are required.'
            ], 422);
        }

        $roleNameToId = [
            'admin' => 1,
            'super_admin' => 1,
            'chief_librarian' => 2,
            'librarian' => 2,
            'cataloguer' => 3,
            'circulation_clerk' => 4,
            'staff' => 4,
            'hod' => 5,
            'faculty' => 6,
            'student' => 7,
            'guest' => 8
        ];
        $roleId = $roleNameToId[$role] ?? 4;
        $hash = Hash::make($pin);
        $username = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', explode('@', $email)[0]));

        $pdo = $this->getMysqlPdo();

        if ($pdo) {
            try {
                $stmt = $pdo->prepare("
                    INSERT INTO users (name, email, username, password, plain_secret, role, phone, designation, status, created_at, updated_at)
                    VALUES (:name, :email, :username, :password, :pin, :role, :phone, :desig, 'active', NOW(), NOW())
                    ON DUPLICATE KEY UPDATE
                        name = VALUES(name),
                        username = VALUES(username),
                        password = VALUES(password),
                        plain_secret = VALUES(plain_secret),
                        role = VALUES(role),
                        phone = VALUES(phone),
                        designation = VALUES(designation),
                        status = 'active',
                        updated_at = NOW()
                ");
                $stmt->execute([
                    ':name' => $name,
                    ':email' => $email,
                    ':username' => $username,
                    ':password' => $hash,
                    ':pin' => $pin,
                    ':role' => $role,
                    ':phone' => $phone,
                    ':desig' => "{$role} ({$dept})"
                ]);

                $uStmt = $pdo->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
                $uStmt->execute([$email]);
                $userId = $uStmt->fetchColumn();

                if ($userId) {
                    $pdo->prepare("DELETE FROM user_roles WHERE user_id = ?")->execute([$userId]);
                    $pdo->prepare("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)")->execute([$userId, $roleId]);
                    if (in_array($role, ['admin', 'super_admin'])) {
                        $pdo->prepare("INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, 2)")->execute([$userId]);
                    }
                }
            } catch (\Throwable $e) {}
        }

        // Sync SQLite
        try {
            DB::table('users')->updateOrInsert(
                ['email' => $email],
                [
                    'name' => $name,
                    'username' => $username,
                    'password' => $hash,
                    'plain_secret' => $pin,
                    'role' => $role,
                    'phone' => $phone,
                    'designation' => "{$role} ({$dept})",
                    'status' => 'active',
                    'updated_at' => now()
                ]
            );

            $sqliteUser = DB::table('users')->where('email', $email)->first();
            if ($sqliteUser) {
                try {
                    DB::table('user_roles')->where('user_id', $sqliteUser->id)->delete();
                    DB::table('user_roles')->insert([
                        'user_id' => $sqliteUser->id,
                        'role_id' => $roleId
                    ]);
                } catch (\Throwable $e2) {}
            }
        } catch (\Throwable $e) {}

        // If patron role (student or faculty), also register in patrons table
        if (in_array($role, ['student', 'faculty'])) {
            $year = date('Y');
            $deptCode = strtoupper(substr(preg_replace('/[^a-zA-Z]/', '', $dept), 0, 3)) ?: 'GEN';
            $num = rand(100, 999);
            $matric = $request->input('id', "FCC/{$deptCode}/{$year}/{$num}");

            Patron::updateOrCreate(
                ['matric' => $matric],
                [
                    'id' => 'PAT-' . rand(10000, 99999),
                    'library_id' => 'LIB-' . rand(10000, 99999),
                    'name' => $name,
                    'email' => $email,
                    'role' => $role,
                    'category' => $role === 'faculty' ? 'Faculty Staff' : 'Undergraduate',
                    'department' => $dept,
                    'level' => $role === 'faculty' ? 'Academic Faculty' : 'ND I',
                    'borrow_quota' => $role === 'faculty' ? 10 : 5,
                    'status' => 'Active',
                    'pin' => $pin
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => "User account for {$name} created successfully and assigned role in user_roles table.",
            'user' => [
                'id' => $username,
                'name' => $name,
                'email' => $email,
                'role' => $role,
                'role_id' => $roleId,
                'dept' => $dept
            ]
        ], 201);
    }

    /**
     * GET /api/rbac/roles
     * List all official roles and their assigned permissions.
     */
    public function getRoles()
    {
        $pdo = $this->getMysqlPdo();
        $roles = [];

        if ($pdo) {
            try {
                $rolesRaw = $pdo->query("SELECT * FROM roles ORDER BY id ASC")->fetchAll();
                $rpStmt = $pdo->prepare("
                    SELECT p.* 
                    FROM permissions p 
                    JOIN role_permissions rp ON p.id = rp.permission_id 
                    WHERE rp.role_id = ?
                ");

                foreach ($rolesRaw as $r) {
                    $rpStmt->execute([$r['id']]);
                    $perms = $rpStmt->fetchAll();
                    $r['permissions'] = $perms;
                    $r['permissions_count'] = count($perms);
                    $roles[] = $r;
                }
            } catch (\Throwable $e) {}
        }

        if (empty($roles)) {
            $roles = DB::table('roles')->get();
        }

        return response()->json([
            'success' => true,
            'roles' => $roles
        ]);
    }

    /**
     * GET /api/rbac/permissions
     * List all system permissions.
     */
    public function getPermissions()
    {
        $pdo = $this->getMysqlPdo();
        $perms = [];

        if ($pdo) {
            try {
                $perms = $pdo->query("SELECT * FROM permissions ORDER BY id ASC")->fetchAll();
            } catch (\Throwable $e) {}
        }

        if (empty($perms)) {
            $perms = DB::table('permissions')->get();
        }

        return response()->json([
            'success' => true,
            'permissions' => $perms
        ]);
    }

    /**
     * POST /api/rbac/roles/{id}/permissions
     * PUT  /api/rbac/roles/{id}/permissions
     * Assign or update permissions for a specific role in role_permissions table.
     */
    public function updateRolePermissions(Request $request, $id)
    {
        $permissions = $request->input('permissions', []);
        if (!is_array($permissions)) {
            $permissions = [];
        }

        $cleanRoleId = is_numeric($id) ? (int)$id : null;
        $pdo = $this->getMysqlPdo();

        if ($pdo) {
            try {
                if (!$cleanRoleId) {
                    $rStmt = $pdo->prepare("SELECT id FROM roles WHERE name = ? OR display_name = ? LIMIT 1");
                    $rStmt->execute([$id, $id]);
                    $cleanRoleId = $rStmt->fetchColumn();
                }

                if ($cleanRoleId) {
                    // Remove existing role_permissions for this role
                    $pdo->prepare("DELETE FROM role_permissions WHERE role_id = ?")->execute([$cleanRoleId]);

                    $ins = $pdo->prepare("INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)");
                    foreach ($permissions as $p) {
                        $pId = is_numeric($p) ? (int)$p : null;
                        if (!$pId) {
                            $lookup = $pdo->prepare("SELECT id FROM permissions WHERE slug = ? OR name = ? LIMIT 1");
                            $lookup->execute([$p, $p]);
                            $pId = $lookup->fetchColumn();
                        }
                        if ($pId) {
                            $ins->execute([$cleanRoleId, $pId]);
                        }
                    }
                }
            } catch (\Throwable $e) {}
        }

        // Also sync SQLite role_permissions if table exists
        try {
            if (!$cleanRoleId) {
                $cleanRoleId = DB::table('roles')->where('name', $id)->orWhere('display_name', $id)->value('id');
            }
            if ($cleanRoleId) {
                DB::table('role_permissions')->where('role_id', $cleanRoleId)->delete();
                foreach ($permissions as $p) {
                    $pId = is_numeric($p) ? (int)$p : null;
                    if (!$pId) {
                        $pId = DB::table('permissions')->where('slug', $p)->orWhere('name', $p)->value('id');
                    }
                    if ($pId) {
                        DB::table('role_permissions')->insert([
                            'role_id' => $cleanRoleId,
                            'permission_id' => $pId
                        ]);
                    }
                }
            }
        } catch (\Throwable $e) {}

        return response()->json([
            'success' => true,
            'message' => "Permissions for role '{$id}' successfully updated in role_permissions table.",
            'role_id' => $cleanRoleId,
            'assigned_count' => count($permissions)
        ]);
    }
}

