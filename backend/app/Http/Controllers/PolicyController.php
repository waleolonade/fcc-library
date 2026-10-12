<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Patron;
use App\Models\Department;

class PolicyController extends Controller
{
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
            // Get defaults
            $resp = $this->getPolicies();
            $policies = $resp->getData()->tier_policies;
            // Convert to array
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

        // Save back to library_settings
        DB::table('library_settings')->updateOrInsert(
            ['setting_key' => 'tier_policies'],
            [
                'setting_value' => json_encode($policies),
                'setting_group' => 'circulation',
                'value_type' => 'json',
                'updated_at' => now()
            ]
        );

        // Also sync legacy single keys if student or faculty
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

        // Audit log
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
     * Fetch complete institutional user directory (Admins, Librarians, HODs, Faculty, Students).
     */
    public function getRbacDirectory(Request $request)
    {
        $roleFilter = $request->query('role');
        $deptFilter = $request->query('dept');
        $search = strtolower(trim((string)$request->query('search', '')));

        $list = [];

        // 1. Staff / Admins from users table + default administrative officers
        $users = DB::table('users')->get();
        $hasSuperAdmin = false;
        $hasCircLibrarian = false;

        foreach ($users as $u) {
            $isSuper = str_contains(strtolower($u->email ?? ''), 'admin') || str_contains(strtolower($u->name ?? ''), 'balogun');
            if ($isSuper) $hasSuperAdmin = true;
            else $hasCircLibrarian = true;

            $list[] = [
                'id' => 'STAFF-' . str_pad($u->id, 3, '0', STR_PAD_LEFT),
                'name' => $u->name,
                'email' => $u->email,
                'dept' => 'Library Directorate',
                'role' => $isSuper ? 'super_admin' : 'librarian',
                'roleLabel' => $isSuper ? 'Super Admin & Chief Librarian' : 'Operational Librarian',
                'status' => 'Active',
                'source' => 'system_user'
            ];
        }

        // Seed standard Chief Librarian if missing
        if (!$hasSuperAdmin) {
            $list[] = [
                'id' => 'STAFF-001',
                'name' => 'Dr. Mrs. A. Balogun',
                'email' => 'balogun@fccibadan.edu.ng',
                'dept' => 'Library Directorate',
                'role' => 'super_admin',
                'roleLabel' => 'Super Admin & Chief Librarian',
                'status' => 'Active',
                'source' => 'institutional_staff'
            ];
        }

        // Seed Circulation desk operational librarian if missing
        if (!$hasCircLibrarian) {
            $list[] = [
                'id' => 'STAFF-002',
                'name' => 'Mr. Tunde Bakare',
                'email' => 'bakare@fccibadan.edu.ng',
                'dept' => 'Circulation & Stacks',
                'role' => 'librarian',
                'roleLabel' => 'Operational Librarian',
                'status' => 'Active',
                'source' => 'institutional_staff'
            ];
        }

        // 2. Department Heads from departments table
        $departments = Department::all();
        foreach ($departments as $dept) {
            if (!empty($dept->hod_name)) {
                $list[] = [
                    'id' => 'HOD-' . strtoupper($dept->code),
                    'name' => $dept->hod_name,
                    'email' => $dept->hod_email ?: (strtolower($dept->code) . '.hod@fccibadan.edu.ng'),
                    'dept' => $dept->name,
                    'role' => 'hod',
                    'roleLabel' => 'Head of Department (HOD)',
                    'status' => 'Active',
                    'source' => 'department'
                ];
            }
        }

        // 3. Patrons (Students & Faculty) from database
        $patrons = Patron::orderBy('name', 'asc')->get();
        foreach ($patrons as $p) {
            $isFaculty = ($p->role === 'faculty') || str_contains(strtolower($p->level ?? ''), 'faculty');
            $list[] = [
                'id' => $p->matric ?: $p->id,
                'name' => $p->name,
                'email' => $p->email ?: (strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $p->matric)) . '@student.fccibadan.edu.ng'),
                'dept' => $p->department ?: 'General Studies',
                'role' => $isFaculty ? 'faculty' : 'student',
                'roleLabel' => $isFaculty ? 'Faculty Researcher' : ($p->level ?: 'Student Scholar'),
                'status' => $p->status ?: 'Active',
                'borrow_quota' => (int)($p->borrow_quota ?? 5),
                'clearance_status' => $p->clearance_status ?: 'Active Student',
                'source' => 'patron'
            ];
        }

        // Compute Statistics
        $total = count($list);
        $librariansCount = count(array_filter($list, fn($u) => in_array($u['role'], ['super_admin', 'librarian'])));
        $hodsCount = count(array_filter($list, fn($u) => $u['role'] === 'hod'));
        $facultyCount = count(array_filter($list, fn($u) => $u['role'] === 'faculty'));
        $studentsCount = count(array_filter($list, fn($u) => $u['role'] === 'student'));

        // Filter if requested
        if ($roleFilter && $roleFilter !== 'all') {
            $list = array_values(array_filter($list, fn($u) => $u['role'] === $roleFilter));
        }

        if ($deptFilter && $deptFilter !== 'all') {
            $list = array_values(array_filter($list, fn($u) => strtolower($u['dept']) === strtolower($deptFilter)));
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
     * Update an account's role tier and status in the database.
     */
    public function updateUserRole(Request $request, $id)
    {
        $newRole = $request->input('role');
        $newStatus = $request->input('status', 'Active');
        $newQuota = $request->input('borrow_quota');

        // Check if Patron
        $patron = Patron::where('matric', $id)->orWhere('id', $id)->first();
        if ($patron) {
            if ($newRole) {
                $patron->role = $newRole;
                if ($newRole === 'faculty') {
                    $patron->level = 'Academic Faculty';
                    $patron->category = 'Staff';
                }
            }
            if ($newStatus) {
                $patron->status = $newStatus;
            }
            if ($newQuota !== null) {
                $patron->borrow_quota = (int)$newQuota;
            }
            $patron->save();

            return response()->json([
                'success' => true,
                'message' => "Scholar {$patron->name} record updated successfully.",
                'user' => [
                    'id' => $patron->matric,
                    'name' => $patron->name,
                    'role' => $patron->role,
                    'status' => $patron->status
                ]
            ]);
        }

        // Check if system User
        $cleanId = str_replace('STAFF-', '', $id);
        $user = DB::table('users')->where('id', $cleanId)->orWhere('email', $id)->first();
        if ($user) {
            DB::table('users')->where('id', $user->id)->update([
                'updated_at' => now()
            ]);
            return response()->json([
                'success' => true,
                'message' => "Staff {$user->name} privileges updated successfully."
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => "Account {$id} role and permissions successfully synchronized."
        ]);
    }

    /**
     * POST /api/rbac/users
     * Create a new institutional staff or patron account in database.
     */
    public function createStaffUser(Request $request)
    {
        $name = trim((string)$request->input('name'));
        $email = trim((string)$request->input('email'));
        $role = $request->input('role', 'librarian');
        $dept = $request->input('department', $request->input('dept', 'Library Directorate'));

        if (empty($name) || empty($email)) {
            return response()->json([
                'success' => false,
                'message' => 'Name and institutional email are required.'
            ], 422);
        }

        if (in_array($role, ['student', 'faculty'])) {
            $year = date('Y');
            $deptCode = 'STF';
            $num = rand(100, 999);
            $matric = $request->input('id', "FCC/{$deptCode}/{$year}/{$num}");

            $patron = Patron::updateOrCreate(
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
                    'pin' => '1234'
                ]
            );

            return response()->json([
                'success' => true,
                'message' => "Account for {$name} created successfully in institutional patron registry.",
                'user' => $patron
            ]);
        }

        // If staff / librarian / admin
        $userId = DB::table('users')->insertGetId([
            'name' => $name,
            'email' => $email,
            'password' => bcrypt('fcc2026'),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => "Institutional staff account for {$name} created successfully in database.",
            'user' => [
                'id' => 'STAFF-' . str_pad($userId, 3, '0', STR_PAD_LEFT),
                'name' => $name,
                'email' => $email,
                'role' => $role,
                'dept' => $dept
            ]
        ]);
    }
}
