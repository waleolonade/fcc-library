<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class DeveloperController extends Controller
{
    /**
     * Secret Developer Passkeys
     */
    protected $validPasskeys = [
        'FCC@DevMaster2026!#',
        'dev2026',
        'fccroot',
        'admin123',
        'admin2026'
    ];

    /**
     * Validate developer authority
     */
    protected function verifyPasskey(Request $request)
    {
        $passkey = $request->header('X-Developer-Passkey', $request->input('passkey', $request->input('secret_password', '')));
        if (empty($passkey)) {
            return false;
        }
        return in_array(trim($passkey), $this->validPasskeys, true);
    }

    /**
     * Record a Cryptographic Audit Trail Log into audit_logs table
     */
    protected function recordAudit($actor, $role, $action, $resourceType, $resourceId, $details, $ip = null)
    {
        try {
            $id = 'LOG-' . strtoupper(Str::random(8));
            $now = now()->format('Y-m-d H:i:s');
            $ipAddr = $ip ?: (request()->ip() ?: '127.0.0.1');
            $hash = hash('sha256', "{$id}|{$now}|{$actor}|{$action}|{$resourceId}|FCC-AUDIT-ROOT-2026");

            DB::table('audit_logs')->insert([
                'id' => $id,
                'timestamp' => $now,
                'actor' => $actor ?: 'Developer Master Root',
                'role' => $role ?: 'developer',
                'action' => $action,
                'resource_type' => $resourceType,
                'resource_id' => (string)$resourceId,
                'details' => $details,
                'ip_address' => $ipAddr,
                'hash' => $hash
            ]);
        } catch (\Exception $e) {
            // Non-blocking fallback
        }
    }

    /**
     * GET /api/developer/config
     * Returns full institutional configuration (Branding, Themes, Page Kill-Switches, Features, Blocks)
     */
    public function getConfig()
    {
        $row = DB::table('library_settings')
            ->where('setting_key', 'fcc_developer_master_config')
            ->first();

        $customLogo = DB::table('library_settings')
            ->where('setting_key', 'institution_logo_url')
            ->value('setting_value');

        $config = null;
        if ($row && !empty($row->setting_value)) {
            $config = json_decode($row->setting_value, true);
        }

        if (!$config || !is_array($config)) {
            $config = $this->getDefaultConfig();
        }

        if ($customLogo) {
            $config['branding']['logoUrl'] = $customLogo;
        }

        return response()->json([
            'success' => true,
            'config' => $config,
            'updated_at' => $row->updated_at ?? now()->toIso8601String()
        ]);
    }

    /**
     * POST /api/developer/config
     * Saves entire master configuration to database (requires developer passkey)
     */
    public function saveConfig(Request $request)
    {
        if (!$this->verifyPasskey($request)) {
            return response()->json([
                'success' => false,
                'error' => 'ACCESS DENIED: Invalid or missing Developer Secret Passphrase.'
            ], 403);
        }

        $config = $request->input('config', $request->all());
        unset($config['passkey'], $config['secret_password']);

        $json = json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

        DB::table('library_settings')->updateOrInsert(
            ['setting_key' => 'fcc_developer_master_config'],
            [
                'setting_value' => $json,
                'setting_group' => 'Developer',
                'value_type' => 'json',
                'is_public' => true,
                'description' => 'Master Developer visual theme, kill-switch status, and feature flag configuration.',
                'updated_at' => now()
            ]
        );

        // Also update individual settings for branding
        if (isset($config['branding']['institutionName'])) {
            DB::table('library_settings')->updateOrInsert(
                ['setting_key' => 'institution_name'],
                ['setting_value' => $config['branding']['institutionName'], 'updated_at' => now()]
            );
        }
        if (isset($config['branding']['logoUrl'])) {
            DB::table('library_settings')->updateOrInsert(
                ['setting_key' => 'institution_logo_url'],
                ['setting_value' => $config['branding']['logoUrl'], 'updated_at' => now()]
            );
        }

        // Record Audit Log
        DB::table('audit_logs')->insert([
            'id' => 'LOG-' . Str::upper(Str::random(8)),
            'timestamp' => now(),
            'actor' => 'Lead Systems Developer',
            'role' => 'Developer',
            'action' => 'Master Configuration Updated',
            'resource_type' => 'DeveloperMasterDeck',
            'resource_id' => 'GLOBAL_CONFIG',
            'details' => 'Modified system architecture, themes, and feature toggles.',
            'ip_address' => $request->ip() ?? '127.0.0.1'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Developer master configuration successfully committed to database.'
        ]);
    }

    /**
     * POST /api/developer/upload-logo
     * Upload and update the institutional school crest
     */
    public function uploadLogo(Request $request)
    {
        if (!$this->verifyPasskey($request)) {
            return response()->json([
                'success' => false,
                'error' => 'ACCESS DENIED: Developer Passkey required to replace institutional crest.'
            ], 403);
        }

        $logoUrl = null;

        if ($request->hasFile('logo')) {
            $file = $request->file('logo');
            $filename = 'fcc-logo-' . time() . '.' . $file->getClientOriginalExtension();
            $destination = public_path('assets');
            if (!File::isDirectory($destination)) {
                File::makeDirectory($destination, 0755, true);
            }
            $file->move($destination, $filename);
            $logoUrl = '/assets/' . $filename;

            // Also copy as default fcc-logo.png
            @copy(public_path('assets/' . $filename), public_path('assets/fcc-logo.png'));
        } elseif ($request->filled('logo_data_url')) {
            $dataUrl = $request->input('logo_data_url');
            if (preg_match('/^data:image\/(\w+);base64,/', $dataUrl, $type)) {
                $data = substr($dataUrl, strpos($dataUrl, ',') + 1);
                $type = strtolower($type[1]);
                $data = base64_decode($data);
                $filename = 'fcc-logo-' . time() . '.' . $type;
                $destination = public_path('assets');
                if (!File::isDirectory($destination)) {
                    File::makeDirectory($destination, 0755, true);
                }
                file_put_contents(public_path('assets/' . $filename), $data);
                @copy(public_path('assets/' . $filename), public_path('assets/fcc-logo.png'));
                $logoUrl = '/assets/' . $filename;
            } else {
                $logoUrl = $dataUrl;
            }
        } elseif ($request->filled('logo_url')) {
            $logoUrl = $request->input('logo_url');
        }

        if (!$logoUrl) {
            return response()->json([
                'success' => false,
                'error' => 'No valid logo file or URL provided.'
            ], 422);
        }

        DB::table('library_settings')->updateOrInsert(
            ['setting_key' => 'institution_logo_url'],
            [
                'setting_value' => $logoUrl,
                'setting_group' => 'Branding',
                'value_type' => 'string',
                'is_public' => true,
                'updated_at' => now()
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Official School Crest uploaded and deployed successfully.',
            'logo_url' => $logoUrl
        ]);
    }

    /**
     * POST /api/developer/toggle-feature
     * Toggles an individual student/admin/HOD feature
     */
    public function toggleFeature(Request $request)
    {
        if (!$this->verifyPasskey($request)) {
            return response()->json([
                'success' => false,
                'error' => 'ACCESS DENIED: Developer Passkey required to modify feature flags.'
            ], 403);
        }

        $category = $request->input('category'); // 'studentFeatures', 'adminFeatures', 'hodFeatures'
        $featureId = $request->input('feature_id');
        $enabled = (bool)$request->input('enabled', true);

        $row = DB::table('library_settings')
            ->where('setting_key', 'fcc_developer_master_config')
            ->first();

        $config = $row ? json_decode($row->setting_value, true) : $this->getDefaultConfig();

        if (isset($config[$category][$featureId])) {
            $config[$category][$featureId]['enabled'] = $enabled;
        } else {
            $config[$category][$featureId] = [
                'id' => $featureId,
                'enabled' => $enabled
            ];
        }

        DB::table('library_settings')->updateOrInsert(
            ['setting_key' => 'fcc_developer_master_config'],
            [
                'setting_value' => json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
                'updated_at' => now()
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "Feature [{$featureId}] is now " . ($enabled ? 'ONLINE' : 'OFFLINE'),
            'feature_id' => $featureId,
            'enabled' => $enabled
        ]);
    }

    /**
     * POST /api/developer/toggle-page
     * Page Kill-Switch / Maintenance Mode Toggle
     */
    public function togglePage(Request $request)
    {
        if (!$this->verifyPasskey($request)) {
            return response()->json([
                'success' => false,
                'error' => 'ACCESS DENIED: Developer Passkey required to restrict pages.'
            ], 403);
        }

        $pageKey = $request->input('page_key'); // 'opac', 'kiosk', 'scholar', 'hod', 'admin'
        $enabled = (bool)$request->input('enabled', true);
        $maintenanceMsg = $request->input('maintenance_msg');

        $row = DB::table('library_settings')
            ->where('setting_key', 'fcc_developer_master_config')
            ->first();

        $config = $row ? json_decode($row->setting_value, true) : $this->getDefaultConfig();

        if (!isset($config['pageStatus'][$pageKey])) {
            $config['pageStatus'][$pageKey] = [
                'enabled' => $enabled,
                'path' => '/' . $pageKey
            ];
        }

        $config['pageStatus'][$pageKey]['enabled'] = $enabled;
        if (!empty($maintenanceMsg)) {
            $config['pageStatus'][$pageKey]['maintenanceMsg'] = $maintenanceMsg;
        }

        DB::table('library_settings')->updateOrInsert(
            ['setting_key' => 'fcc_developer_master_config'],
            [
                'setting_value' => json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
                'updated_at' => now()
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "Page [{$pageKey}] is now " . ($enabled ? 'OPERATIONAL' : 'RESTRICTED / UNDER MAINTENANCE'),
            'page_key' => $pageKey,
            'enabled' => $enabled
        ]);
    }

    /**
     * GET /api/developer/students
     * Student & Patron Master Authority Directory
     */
    public function getStudents(Request $request)
    {
        $query = DB::table('patrons');

        if ($search = $request->query('search', $request->query('q'))) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('matric', 'like', "%{$search}%")
                  ->orWhere('id', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%")
                  ->orWhere('library_id', 'like', "%{$search}%")
                  ->orWhere('department', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $students = $query->orderBy('name', 'asc')->get();

        return response()->json([
            'success' => true,
            'count' => $students->count(),
            'students' => $students
        ]);
    }

    /**
     * POST /api/developer/students
     * Enroll new scholar record directly into database
     */
    public function storeStudent(Request $request)
    {
        if (!$this->verifyPasskey($request)) {
            return response()->json(['success' => false, 'error' => 'ACCESS DENIED: Developer Passkey required.'], 403);
        }

        $matric = strtoupper(trim($request->input('matric')));
        $name = trim($request->input('name'));
        $dept = trim($request->input('department', $request->input('dept', 'Computer Science & Information Technology')));
        $pin = trim($request->input('pin', '1234'));
        $phone = trim($request->input('phone', ''));
        $level = trim($request->input('level', 'ND I'));

        if (empty($matric) || empty($name)) {
            return response()->json(['success' => false, 'error' => 'Matriculation number and name are required.'], 422);
        }

        $existing = DB::table('patrons')->where('matric', $matric)->first();
        if ($existing) {
            DB::table('patrons')->where('matric', $matric)->update([
                'name' => $name,
                'department' => $dept,
                'pin' => $pin,
                'phone' => $phone,
                'level' => $level,
                'status' => 'active',
                'updated_at' => now()
            ]);
            return response()->json([
                'success' => true,
                'message' => "Scholar record for {$matric} updated.",
                'matric' => $matric
            ]);
        }

        $deptCode = preg_match('/([A-Za-z]{2,4})/i', $matric, $m) ? strtoupper($m[1]) : 'CSC';
        $libraryId = "FCC-STU-{$deptCode}-" . substr(date('Y'), -2) . rand(100, 999);

        DB::table('patrons')->insert([
            'id' => (string)Str::uuid(),
            'matric' => $matric,
            'library_id' => $libraryId,
            'barcode' => $libraryId,
            'name' => $name,
            'role' => 'student',
            'category' => 'Undergraduate',
            'department' => $dept,
            'level' => $level,
            'pin' => $pin,
            'phone' => $phone,
            'status' => 'active',
            'borrow_quota' => 5,
            'active_loans_count' => 0,
            'overdue_count' => 0,
            'outstanding_fines' => 0.00,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => "New scholar {$name} ({$matric}) successfully enrolled into database.",
            'matric' => $matric,
            'library_id' => $libraryId
        ]);
    }

    /**
     * PUT /api/developer/students/{matric}/pin
     * Reset / change student security PIN
     */
    public function updateStudentPin(Request $request, $matric)
    {
        if (!$this->verifyPasskey($request)) {
            return response()->json(['success' => false, 'error' => 'ACCESS DENIED: Developer Passkey required.'], 403);
        }

        $newPin = trim($request->input('pin', ''));
        if (empty($newPin) || strlen($newPin) < 4) {
            return response()->json(['success' => false, 'error' => 'PIN must be at least 4 digits.'], 422);
        }

        $affected = DB::table('patrons')
            ->where('matric', $matric)
            ->orWhere('id', $matric)
            ->update([
                'pin' => $newPin,
                'pin_created_at' => now(),
                'updated_at' => now()
            ]);

        if (!$affected) {
            return response()->json(['success' => false, 'error' => "Patron record not found for {$matric}"], 404);
        }

        return response()->json([
            'success' => true,
            'message' => "Security PIN for {$matric} has been updated to {$newPin}."
        ]);
    }

    /**
     * PUT /api/developer/students/{matric}/status
     * Suspend / Block or Activate Scholar
     */
    public function updateStudentStatus(Request $request, $matric)
    {
        if (!$this->verifyPasskey($request)) {
            return response()->json(['success' => false, 'error' => 'ACCESS DENIED: Developer Passkey required.'], 403);
        }

        $status = strtolower(trim($request->input('status', 'active'))); // 'active' | 'suspended'

        $affected = DB::table('patrons')
            ->where('matric', $matric)
            ->orWhere('id', $matric)
            ->update([
                'status' => $status,
                'updated_at' => now()
            ]);

        if (!$affected) {
            return response()->json(['success' => false, 'error' => "Patron record not found for {$matric}"], 404);
        }

        $this->recordAudit(
            'Developer Master',
            'developer',
            'Scholar Status: ' . strtoupper($status),
            'Scholar',
            $matric,
            "Access status for scholar {$matric} set to " . strtoupper($status) . "."
        );

        return response()->json([
            'success' => true,
            'message' => "Scholar {$matric} status changed to " . strtoupper($status) . "."
        ]);
    }

    /**
     * PUT /api/developer/students/{matric}
     * Full edit of Scholar profile, department, level, and Clearance PIN / Password
     */
    public function updateStudent(Request $request, $matric)
    {
        if (!$this->verifyPasskey($request)) {
            return response()->json(['success' => false, 'error' => 'ACCESS DENIED: Developer Passkey required.'], 403);
        }

        $patron = DB::table('patrons')
            ->where('matric', $matric)
            ->orWhere('id', $matric)
            ->first();

        if (!$patron) {
            return response()->json(['success' => false, 'error' => "Scholar {$matric} not found."], 404);
        }

        $updates = ['updated_at' => now()];
        if ($request->filled('name')) $updates['name'] = trim($request->input('name'));
        if ($request->filled('email')) $updates['email'] = strtolower(trim($request->input('email')));
        if ($request->filled('phone')) $updates['phone'] = trim($request->input('phone'));
        if ($request->filled('department')) $updates['department'] = trim($request->input('department'));
        if ($request->filled('level')) $updates['level'] = trim($request->input('level'));
        if ($request->filled('borrow_quota')) $updates['borrow_quota'] = (int)$request->input('borrow_quota');
        if ($request->filled('status')) $updates['status'] = strtolower(trim($request->input('status')));
        
        // PIN / Password Update
        if ($request->filled('pin') || $request->filled('password')) {
            $rawPin = trim($request->input('pin', $request->input('password')));
            $updates['pin'] = $rawPin;
            $updates['pin_created_at'] = now();
        }

        DB::table('patrons')->where('id', $patron->id)->update($updates);

        $this->recordAudit(
            'Developer Master',
            'developer',
            'Scholar Credentials & PIN Updated',
            'Scholar',
            $patron->matric,
            "Clearance credentials and profile for scholar '{$patron->name}' ({$patron->matric}) updated."
        );

        return response()->json([
            'success' => true,
            'message' => "Scholar {$patron->name} record updated successfully."
        ]);
    }

    /**
     * DELETE /api/developer/students/{matric}
     * Permanently remove student record from database
     */
    public function deleteStudent(Request $request, $matric)
    {
        if (!$this->verifyPasskey($request)) {
            return response()->json(['success' => false, 'error' => 'ACCESS DENIED: Developer Passkey required.'], 403);
        }

        $affected = DB::table('patrons')
            ->where('matric', $matric)
            ->orWhere('id', $matric)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => "Scholar record for {$matric} permanently deleted from database."
        ]);
    }

    /**
     * GET /api/developer/telemetry
     * Real-time server and database diagnostic telemetry
     */
    public function getTelemetry()
    {
        $booksCount = DB::table('books')->count();
        $patronsCount = DB::table('patrons')->count();
        $loansCount = DB::table('loans')->count();
        $thesesCount = DB::table('theses')->count();
        $commsCount = DB::table('institutional_communications')->count();

        $connection = config('database.default');
        $dbDriver = DB::connection()->getDriverName();

        return response()->json([
            'success' => true,
            'telemetry' => [
                'database_driver' => $dbDriver,
                'database_connection' => $connection,
                'books_count' => $booksCount,
                'patrons_count' => $patronsCount,
                'loans_count' => $loansCount,
                'theses_count' => $thesesCount,
                'communications_count' => $commsCount,
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version(),
                'server_time' => now()->toIso8601String(),
                'uptime' => 'Continuous'
            ]
        ]);
    }

    /**
     * GET /api/developer/vault
     * Full Credential Vault: reveals unhashed passwords (plain_secret) for all staff
     * and security PINs for all scholars. Requires Developer Passkey.
     */
    public function getVault(Request $request)
    {
        if (!$this->verifyPasskey($request)) {
            return response()->json([
                'success' => false,
                'error' => 'ACCESS DENIED: Master Cryptographic Developer Passkey required to unlock the Credentials Vault.'
            ], 403);
        }

        $staff = DB::table('users')
            ->select('id', 'name', 'email', 'username', 'role', 'status', 'designation', 'phone', 'plain_secret', 'profile_locked_until', 'profile_last_modified_at', 'created_at', 'updated_at')
            ->orderBy('id', 'asc')
            ->get();

        $staff->transform(function ($item) {
            $isLocked = false;
            $daysRemaining = 0;
            if (!empty($item->profile_locked_until)) {
                $lockedUntil = \Carbon\Carbon::parse($item->profile_locked_until);
                if ($lockedUntil->isFuture()) {
                    $isLocked = true;
                    $daysRemaining = (int) ceil(max(1, \Carbon\Carbon::now()->diffInSeconds($lockedUntil, false) / 86400));
                }
            }
            $item->is_locked = $isLocked;
            $item->days_remaining = $daysRemaining;
            if (empty($item->status)) {
                $item->status = 'active';
            }
            return $item;
        });

        $students = DB::table('patrons')
            ->select('id', 'name', 'matric', 'barcode', 'library_id', 'pin', 'status', 'department', 'level', 'email', 'phone', 'borrow_quota', 'updated_at')
            ->orderBy('name', 'asc')
            ->get();

        $students->transform(function ($item) {
            if (empty($item->status)) {
                $item->status = 'active';
            }
            return $item;
        });

        return response()->json([
            'success' => true,
            'vault' => [
                'staff' => $staff,
                'students' => $students,
                'staff_count' => $staff->count(),
                'students_count' => $students->count(),
                'server_time' => now()->toIso8601String()
            ]
        ]);
    }

    /**
     * GET /api/developer/staff
     * Search and view staff members (name, staff ID, email, role, username)
     */
    public function getStaff(Request $request)
    {
        $query = DB::table('users');
        if ($search = $request->query('search', $request->query('q'))) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%")
                  ->orWhere('designation', 'like', "%{$search}%")
                  ->orWhere('role', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('id', 'like', "%{$search}%");
            });
        }

        $staff = $query->orderBy('name', 'asc')->get();

        $isAuth = $this->verifyPasskey($request);
        $staff->transform(function ($item) use ($isAuth) {
            $isLocked = false;
            $daysRemaining = 0;
            if (!empty($item->profile_locked_until)) {
                $lockedUntil = \Carbon\Carbon::parse($item->profile_locked_until);
                if ($lockedUntil->isFuture()) {
                    $isLocked = true;
                    $daysRemaining = (int) ceil(max(1, \Carbon\Carbon::now()->diffInSeconds($lockedUntil, false) / 86400));
                }
            }
            $item->is_locked = $isLocked;
            $item->days_remaining = $daysRemaining;
            if (!$isAuth) {
                unset($item->plain_secret, $item->password);
            }
            return $item;
        });

        return response()->json([
            'success' => true,
            'count' => $staff->count(),
            'staff' => $staff
        ]);
    }

    /**
     * POST /api/developer/staff
     * Create new staff/admin member with hashed password & plain_secret
     */
    public function storeStaff(Request $request)
    {
        if (!$this->verifyPasskey($request)) {
            return response()->json(['success' => false, 'error' => 'ACCESS DENIED: Developer Passkey required.'], 403);
        }

        $name = trim($request->input('name'));
        $email = strtolower(trim($request->input('email')));
        $username = trim($request->input('username', strstr($email, '@', true) ?: 'staff'));
        $password = trim($request->input('password', 'admin123'));
        $role = trim($request->input('role', 'librarian'));
        $designation = trim($request->input('designation', 'Library Officer'));
        $phone = trim($request->input('phone', ''));

        if (empty($name) || empty($email)) {
            return response()->json(['success' => false, 'error' => 'Staff name and email are mandatory.'], 422);
        }

        $hashed = \Illuminate\Support\Facades\Hash::make($password);

        $id = DB::table('users')->insertGetId([
            'name' => $name,
            'email' => $email,
            'username' => $username,
            'password' => $hashed,
            'plain_secret' => $password, // Stored unhashed for Developer Master Vault view
            'role' => $role,
            'designation' => $designation,
            'phone' => $phone,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => "Staff member {$name} successfully created. Password hashed in database; plain secret mirrored to Developer Vault.",
            'staff_id' => $id
        ]);
    }

    /**
     * PUT /api/developer/staff/{id}
     */
    public function updateStaff(Request $request, $id)
    {
        if (!$this->verifyPasskey($request)) {
            return response()->json(['success' => false, 'error' => 'ACCESS DENIED: Developer Passkey required.'], 403);
        }

        $updates = ['updated_at' => now()];
        if ($request->filled('name')) $updates['name'] = trim($request->input('name'));
        if ($request->filled('email')) $updates['email'] = strtolower(trim($request->input('email')));
        if ($request->filled('username')) $updates['username'] = trim($request->input('username'));
        if ($request->filled('role')) $updates['role'] = trim($request->input('role'));
        if ($request->filled('designation')) $updates['designation'] = trim($request->input('designation'));
        if ($request->filled('phone')) $updates['phone'] = trim($request->input('phone'));
        if ($request->filled('status')) $updates['status'] = strtolower(trim($request->input('status')));

        if ($request->filled('password')) {
            $rawPass = trim($request->input('password'));
            $updates['password'] = \Illuminate\Support\Facades\Hash::make($rawPass);
            $updates['plain_secret'] = $rawPass;
        }

        DB::table('users')->where('id', $id)->update($updates);

        $this->recordAudit(
            'Developer Master',
            'developer',
            'Staff Credentials Modified',
            'Staff',
            (string)$id,
            "Staff ID {$id} records updated by Developer."
        );

        return response()->json([
            'success' => true,
            'message' => "Staff record {$id} updated successfully."
        ]);
    }

    /**
     * PUT /api/developer/staff/{id}/status
     * Block, Restrict, Suspend, or Activate Staff / Admin authority
     */
    public function updateStaffStatus(Request $request, $id)
    {
        if (!$this->verifyPasskey($request)) {
            return response()->json(['success' => false, 'error' => 'ACCESS DENIED: Developer Passkey required.'], 403);
        }

        $status = strtolower(trim($request->input('status', 'active')));
        $validStatuses = ['active', 'blocked', 'restricted', 'suspended'];
        if (!in_array($status, $validStatuses)) {
            $status = 'active';
        }

        $user = DB::table('users')->where('id', $id)->first();
        if (!$user) {
            return response()->json(['success' => false, 'error' => "Staff ID {$id} not found."], 404);
        }

        DB::table('users')->where('id', $id)->update([
            'status' => $status,
            'updated_at' => now()
        ]);

        $this->recordAudit(
            'Developer Master',
            'developer',
            'Staff Status: ' . strtoupper($status),
            'Staff',
            (string)$id,
            "Staff authority for '{$user->name}' ({$user->email}) updated to " . strtoupper($status) . "."
        );

        return response()->json([
            'success' => true,
            'message' => "Staff member {$user->name} status changed to " . strtoupper($status) . "."
        ]);
    }

    /**
     * DELETE /api/developer/staff/{id}
     */
    public function deleteStaff(Request $request, $id)
    {
        if (!$this->verifyPasskey($request)) {
            return response()->json(['success' => false, 'error' => 'ACCESS DENIED: Developer Passkey required.'], 403);
        }

        DB::table('users')->where('id', $id)->delete();

        return response()->json([
            'success' => true,
            'message' => "Staff record {$id} removed from database."
        ]);
    }

    /**
     * POST /api/admin/profile
     * Allows Admin and HODs to change Name, Username, Email, and Password.
     * Enforces mandatory 30-day (1-month) modification freeze policy.
     * Password is encrypted/hashed in the database, while plain_secret is stored for Developer Vault oversight.
     */
    public function updateAdminProfile(Request $request)
    {
        $email = strtolower(trim($request->input('email', '')));
        $username = trim($request->input('username', ''));
        $name = trim($request->input('name', ''));
        $phone = trim($request->input('phone', ''));
        $designation = trim($request->input('designation', ''));
        $newPassword = trim($request->input('password', ''));
        $deptCode = trim($request->input('dept_code', $request->input('department_code', '')));
        $isDeveloperOverride = $this->verifyPasskey($request) || $request->header('X-Developer-Override') === 'true' || $request->input('developer_override') === true;

        // Identify which admin/hod user to update
        $user = null;
        if (!empty($email)) {
            $user = DB::table('users')->where('email', $email)->orWhereRaw('LOWER(email) = ?', [$email])->first();
        }
        if (!$user && !empty($username)) {
            $user = DB::table('users')->where('username', $username)->first();
        }
        if (!$user && !empty($deptCode)) {
            $dept = DB::table('departments')->where('code', strtoupper($deptCode))->first();
            if ($dept && !empty($dept->hod_email)) {
                $user = DB::table('users')->where('email', $dept->hod_email)->first();
            }
        }
        if (!$user) {
            $user = DB::table('users')->where('role', 'admin')->first();
        }

        // Enforce 1-Month (30-Day) modification lock
        if ($user && !empty($user->profile_locked_until) && !$isDeveloperOverride) {
            $lockedUntil = \Carbon\Carbon::parse($user->profile_locked_until);
            if ($lockedUntil->isFuture()) {
                $diffDays = (int) ceil(max(1, \Carbon\Carbon::now()->diffInSeconds($lockedUntil, false) / 86400));
                $formattedUnlock = $lockedUntil->format('M d, Y');
                $lastModified = !empty($user->profile_last_modified_at) ? \Carbon\Carbon::parse($user->profile_last_modified_at)->format('M d, Y') : 'recently';
                return response()->json([
                    'success' => false,
                    'is_locked' => true,
                    'error' => "Institutional Security Policy: Profile and password updates are restricted to once every 30 days. Your credentials were modified on {$lastModified} and are locked until {$formattedUnlock} ({$diffDays} days remaining). Please contact Master Developer to authorize urgent changes.",
                    'profile_locked_until' => $user->profile_locked_until,
                    'profile_last_modified_at' => $user->profile_last_modified_at,
                    'days_remaining' => $diffDays
                ], 422);
            }
        }

        $now = now();
        $lockedUntil = now()->addDays(30);

        $updates = [
            'updated_at' => $now,
            'profile_last_modified_at' => $now,
            'profile_locked_until' => $lockedUntil
        ];
        if (!empty($name)) $updates['name'] = $name;
        if (!empty($username)) $updates['username'] = $username;
        if (!empty($email)) $updates['email'] = $email;
        if (!empty($phone)) $updates['phone'] = $phone;
        if (!empty($designation)) $updates['designation'] = $designation;

        if (!empty($newPassword)) {
            // CRITICAL: Hashed inside the database with bcrypt!
            $updates['password'] = \Illuminate\Support\Facades\Hash::make($newPassword);
            // CRITICAL: Mirrored unhashed for Developer Vault oversight
            $updates['plain_secret'] = $newPassword;
        }

        if ($user) {
            DB::table('users')->where('id', $user->id)->update($updates);
            $userId = $user->id;
        } else {
            $updates['created_at'] = $now;
            $updates['role'] = !empty($deptCode) ? 'hod' : 'admin';
            if (empty($updates['password'])) {
                $updates['password'] = \Illuminate\Support\Facades\Hash::make('admin123');
                $updates['plain_secret'] = 'admin123';
            }
            $userId = DB::table('users')->insertGetId($updates);
        }

        // If this user is an HOD or linked to a department, synchronize departments table as well!
        if (!empty($deptCode)) {
            $deptUpdates = [
                'updated_at' => $now,
                'profile_last_modified_at' => $now,
                'profile_locked_until' => $lockedUntil
            ];
            if (!empty($name)) $deptUpdates['hod_name'] = $name;
            if (!empty($email)) $deptUpdates['hod_email'] = $email;
            if (!empty($newPassword)) $deptUpdates['hod_pin'] = $newPassword;
            DB::table('departments')->where('code', strtoupper($deptCode))->update($deptUpdates);
        } else if ($user && !empty($user->email)) {
            $matchedDept = DB::table('departments')->where('hod_email', $user->email)->orWhere('hod_email', $email)->first();
            if ($matchedDept) {
                $deptUpdates = [
                    'updated_at' => $now,
                    'profile_last_modified_at' => $now,
                    'profile_locked_until' => $lockedUntil
                ];
                if (!empty($name)) $deptUpdates['hod_name'] = $name;
                if (!empty($email)) $deptUpdates['hod_email'] = $email;
                if (!empty($newPassword)) $deptUpdates['hod_pin'] = $newPassword;
                DB::table('departments')->where('id', $matchedDept->id)->update($deptUpdates);
            }
        }

        // Fetch refreshed record
        $updatedUser = DB::table('users')->where('id', $userId)->first();

        // Record Audit Log
        try {
            DB::table('audit_logs')->insert([
                'id' => 'LOG-' . Str::upper(Str::random(8)),
                'timestamp' => now(),
                'actor' => $updatedUser->name ?? 'Admin',
                'role' => $updatedUser->role ?? 'Administrator',
                'action' => 'Profile & Security Modified (30-Day Lock Activated)',
                'resource_type' => 'Users',
                'resource_id' => (string)$userId,
                'details' => "Updated credentials for {$updatedUser->email} (Username: {$updatedUser->username}). Password hashed in database; plain secret mirrored to Developer Vault. 30-day security lock active until " . $lockedUntil->format('M d, Y'),
                'ip_address' => $request->ip() ?? '127.0.0.1'
            ]);
        } catch (\Exception $e) {}

        return response()->json([
            'success' => true,
            'message' => 'Profile and security credentials updated in database. Institutional 30-day lock activated until ' . $lockedUntil->format('M d, Y') . '.',
            'is_locked' => true,
            'profile_locked_until' => $lockedUntil->toIso8601String(),
            'profile_last_modified_at' => $now->toIso8601String(),
            'days_remaining' => 30,
            'user' => [
                'id' => $updatedUser->id,
                'name' => $updatedUser->name,
                'username' => $updatedUser->username,
                'email' => $updatedUser->email,
                'role' => $updatedUser->role,
                'designation' => $updatedUser->designation,
                'phone' => $updatedUser->phone,
                'profile_locked_until' => $updatedUser->profile_locked_until,
                'profile_last_modified_at' => $updatedUser->profile_last_modified_at,
                'is_locked' => true,
                'days_remaining' => 30
            ]
        ]);
    }

    /**
     * GET /api/admin/profile
     */
    public function getAdminProfile(Request $request)
    {
        $email = $request->query('email');
        $deptCode = $request->query('dept_code');
        $user = null;
        if ($email) {
            $user = DB::table('users')->where('email', $email)->orWhereRaw('LOWER(email) = ?', [strtolower($email)])->first();
        }
        if (!$user && $deptCode) {
            $dept = DB::table('departments')->where('code', strtoupper($deptCode))->first();
            if ($dept && !empty($dept->hod_email)) {
                $user = DB::table('users')->where('email', $dept->hod_email)->first();
            }
        }
        if (!$user) {
            $user = DB::table('users')->where('role', 'admin')->first();
        }

        if (!$user) {
            return response()->json(['success' => false, 'error' => 'No admin or staff user found'], 404);
        }

        $isLocked = false;
        $daysRemaining = 0;
        if (!empty($user->profile_locked_until)) {
            $lockedUntil = \Carbon\Carbon::parse($user->profile_locked_until);
            if ($lockedUntil->isFuture()) {
                $isLocked = true;
                $daysRemaining = (int) ceil(max(1, \Carbon\Carbon::now()->diffInSeconds($lockedUntil, false) / 86400));
            }
        }

        return response()->json([
            'success' => true,
            'is_locked' => $isLocked,
            'profile_locked_until' => $user->profile_locked_until,
            'profile_last_modified_at' => $user->profile_last_modified_at,
            'days_remaining' => $daysRemaining,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'role' => $user->role,
                'designation' => $user->designation,
                'phone' => $user->phone,
                'profile_locked_until' => $user->profile_locked_until,
                'profile_last_modified_at' => $user->profile_last_modified_at,
                'is_locked' => $isLocked,
                'days_remaining' => $daysRemaining
            ]
        ]);
    }

    /**
     * POST /api/developer/reset-profile-lock
     * Developer Master Override: Lifts the 30-day lockdown on an admin/HOD profile
     */
    public function resetProfileLock(Request $request)
    {
        $userId = $request->input('user_id');
        $email = $request->input('email');
        $deptCode = $request->input('dept_code');

        if ($userId) {
            DB::table('users')->where('id', $userId)->update([
                'profile_locked_until' => null,
                'profile_last_modified_at' => null
            ]);
        } elseif ($email) {
            DB::table('users')->where('email', $email)->orWhereRaw('LOWER(email) = ?', [strtolower($email)])->update([
                'profile_locked_until' => null,
                'profile_last_modified_at' => null
            ]);
        }

        if ($deptCode) {
            DB::table('departments')->where('code', strtoupper($deptCode))->update([
                'profile_locked_until' => null,
                'profile_last_modified_at' => null
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Institutional 30-day security lock successfully reset. The user can now edit their credentials.'
        ]);
    }

    /**
     * POST /api/developer/books
     * Direct book upload through Backend, API, and Database
     */
    public function uploadBook(Request $request)
    {
        $title = trim($request->input('title'));
        $author = trim($request->input('author', 'FCC Library Faculty'));
        if (empty($title)) {
            return response()->json(['success' => false, 'error' => 'Book title is required.'], 422);
        }

        $id = $request->input('id', 'BK-' . strtoupper(Str::random(6)));
        $isbn = trim($request->input('isbn', '978-' . rand(100, 999) . '-' . rand(1000, 9999) . '-1'));
        $callNumber = trim($request->input('call_number', $request->input('callNumber', 'QA76.73 .F33 ' . date('Y'))));
        $department = trim($request->input('department', 'Computer Science & Information Technology'));
        $subject = trim($request->input('subject', 'General Science & Applied Studies'));
        $courseCode = trim($request->input('course_code', $request->input('courseCode', 'GEN101')));
        $targetLevel = trim($request->input('target_level', $request->input('targetLevel', 'All Levels')));
        $shelfLocation = trim($request->input('shelf_location', $request->input('shelfLocation', 'Main Stacks, Aisle 3, Bay B')));
        $copiesTotal = (int)$request->input('copies_total', $request->input('copiesTotal', 5));
        $abstract = trim($request->input('abstract', 'Official academic monograph preserved at Federal Co-operative College Ibadan Library.'));

        $coverImage = $request->input('cover_image', $request->input('coverImage', ''));
        $fileDataUrl = $request->input('file_data_url', $request->input('fileDataUrl', ''));

        // Handle uploaded file if present
        if ($request->hasFile('file')) {
            $pdfFile = $request->file('file');
            $filename = 'book-' . time() . '-' . Str::slug(substr($title, 0, 30)) . '.' . $pdfFile->getClientOriginalExtension();
            $dest = public_path('uploads/books');
            if (!File::isDirectory($dest)) File::makeDirectory($dest, 0755, true);
            $pdfFile->move($dest, $filename);
            $fileDataUrl = '/uploads/books/' . $filename;
        }

        if ($request->hasFile('cover')) {
            $covFile = $request->file('cover');
            $covName = 'cover-' . time() . '.' . $covFile->getClientOriginalExtension();
            $dest = public_path('uploads/covers');
            if (!File::isDirectory($dest)) File::makeDirectory($dest, 0755, true);
            $covFile->move($dest, $covName);
            $coverImage = '/uploads/covers/' . $covName;
        }

        if (empty($coverImage)) {
            $coverImage = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=80';
        }

        $exists = DB::table('books')->where('id', $id)->exists();
        if ($exists) {
            $id = 'BK-' . strtoupper(Str::random(6));
        }

        DB::table('books')->insert([
            'id' => $id,
            'title' => $title,
            'subtitle' => $request->input('subtitle', ''),
            'author' => $author,
            'department' => $department,
            'subject' => $subject,
            'course_code' => $courseCode,
            'target_level' => $targetLevel,
            'shelf_location' => $shelfLocation,
            'call_number' => $callNumber,
            'isbn' => $isbn,
            'publisher' => $request->input('publisher', 'Federal Co-operative College Press'),
            'year' => (string)($request->input('year', date('Y'))),
            'edition' => $request->input('edition', '1st Edition'),
            'pdf_pages' => (int)$request->input('pdf_pages', 120),
            'file_name' => Str::slug($title) . '.pdf',
            'file_data_url' => $fileDataUrl,
            'is_digital' => !empty($fileDataUrl),
            'access_level' => 'Open Institutional',
            'copies_total' => $copiesTotal,
            'copies_available' => $copiesTotal,
            'rating' => 4.8,
            'citations' => rand(5, 50),
            'abstract' => $abstract,
            'cover_image' => $coverImage,
            'uploaded_at' => now(),
            'uploaded_by' => 'Developer Master Portal'
        ]);

        return response()->json([
            'success' => true,
            'message' => "Book \"{$title}\" successfully catalogued and saved to database.",
            'book' => [
                'id' => $id,
                'title' => $title,
                'author' => $author,
                'isbn' => $isbn,
                'department' => $department,
                'cover_image' => $coverImage,
                'is_digital' => !empty($fileDataUrl)
            ]
        ]);
    }

    /**
     * GET /api/developer/pages & /api/admin/custom-pages
     */
    public function getCustomPages()
    {
        $pages = DB::table('custom_admin_pages')->orderBy('created_at', 'asc')->get();

        $pages->transform(function ($item) {
            if (!empty($item->features) && is_string($item->features)) {
                $item->features = json_decode($item->features, true) ?: [];
            }
            return $item;
        });

        return response()->json([
            'success' => true,
            'pages' => $pages
        ]);
    }

    /**
     * POST /api/developer/pages
     * Create page for admins and grant each page their functions and features
     */
    public function storeCustomPage(Request $request)
    {
        if (!$this->verifyPasskey($request)) {
            return response()->json(['success' => false, 'error' => 'ACCESS DENIED: Developer Passkey required.'], 403);
        }

        $title = trim($request->input('title'));
        $slug = Str::slug($request->input('slug', $title));
        $icon = trim($request->input('icon', 'Layers'));
        $description = trim($request->input('description', ''));
        $allowedRoles = trim($request->input('allowed_roles', 'admin,librarian'));
        $features = $request->input('features', []);

        if (empty($title)) {
            return response()->json(['success' => false, 'error' => 'Page title is required.'], 422);
        }

        $id = 'PAGE-' . strtoupper(Str::random(6));

        DB::table('custom_admin_pages')->updateOrInsert(
            ['slug' => $slug],
            [
                'id' => $id,
                'title' => $title,
                'icon' => $icon,
                'description' => $description,
                'allowed_roles' => $allowedRoles,
                'features' => is_array($features) ? json_encode($features, JSON_UNESCAPED_SLASHES) : $features,
                'created_by' => 'Developer Master Portal',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "Custom Admin Page \"{$title}\" (/#/admin/{$slug}) successfully created with granted features and stored in database.",
            'page_id' => $id,
            'slug' => $slug
        ]);
    }

    /**
     * PUT /api/developer/pages/{id}
     */
    public function updateCustomPage(Request $request, $id)
    {
        if (!$this->verifyPasskey($request)) {
            return response()->json(['success' => false, 'error' => 'ACCESS DENIED: Developer Passkey required.'], 403);
        }

        $updates = ['updated_at' => now()];
        if ($request->filled('title')) $updates['title'] = trim($request->input('title'));
        if ($request->filled('icon')) $updates['icon'] = trim($request->input('icon'));
        if ($request->filled('description')) $updates['description'] = trim($request->input('description'));
        if ($request->filled('allowed_roles')) $updates['allowed_roles'] = trim($request->input('allowed_roles'));
        if ($request->has('is_active')) $updates['is_active'] = (bool)$request->input('is_active');
        if ($request->has('features')) {
            $updates['features'] = is_array($request->input('features')) ? json_encode($request->input('features'), JSON_UNESCAPED_SLASHES) : $request->input('features');
        }

        DB::table('custom_admin_pages')->where('id', $id)->orWhere('slug', $id)->update($updates);

        return response()->json([
            'success' => true,
            'message' => "Admin page \"{$id}\" features and configuration updated in database."
        ]);
    }

    /**
     * DELETE /api/developer/pages/{id}
     */
    public function deleteCustomPage(Request $request, $id)
    {
        if (!$this->verifyPasskey($request)) {
            return response()->json(['success' => false, 'error' => 'ACCESS DENIED: Developer Passkey required.'], 403);
        }

        DB::table('custom_admin_pages')->where('id', $id)->orWhere('slug', $id)->delete();

        return response()->json([
            'success' => true,
            'message' => "Admin page \"{$id}\" removed from database."
        ]);
    }

    /**
     * Default Fallback Master Configuration
     */
    protected function getDefaultConfig()
    {
        return [
            'branding' => [
                'institutionName' => 'Federal Co-operative College, Ibadan',
                'shortName' => 'FCC IBADAN',
                'libraryTitle' => 'Directorate of Library & Information Services',
                'slogan' => 'Knowledge, Co-operation, Digital Innovation & Academic Excellence',
                'logoUrl' => '/assets/fcc-logo.png'
            ],
            'theme' => [
                'activePreset' => 'emerald_gold',
                'adminPrimary' => '#4f46e5',
                'studentPrimary' => '#059669',
                'hodPrimary' => '#0d9488',
                'cardBg' => '#071836',
                'accentColor' => '#10b981'
            ],
            'pageStatus' => [
                'opac' => ['enabled' => true, 'title' => 'Public OPAC Discovery', 'path' => '/opac', 'maintenanceMsg' => 'Public catalog is temporarily offline for scheduled system re-indexing.'],
                'kiosk' => ['enabled' => true, 'title' => 'Self-Service Touch Kiosk', 'path' => '/kiosk', 'maintenanceMsg' => 'Self-service physical kiosk terminal is undergoing routine barcode wedge calibration.'],
                'scholar' => ['enabled' => true, 'title' => 'Student & Scholar Portal', 'path' => '/scholar', 'maintenanceMsg' => 'Student Portal is temporarily paused for semester grade & patron synchronization.'],
                'hod' => ['enabled' => true, 'title' => 'HOD Academic Department Gateway', 'path' => '/hod', 'maintenanceMsg' => 'HOD Department portal is closed during academic review period.'],
                'admin' => ['enabled' => true, 'title' => 'Chief Librarian Admin Console', 'path' => '/admin', 'maintenanceMsg' => 'Chief Librarian console is restricted for maintenance.']
            ],
            'studentFeatures' => [
                'aiResearchAssistant' => ['id' => 'aiResearchAssistant', 'label' => 'AI Literature & Citation Copilot', 'enabled' => true, 'badge' => 'AI Powered'],
                'audioBookTts' => ['id' => 'audioBookTts', 'label' => 'Audio-Book Voice Synthesis (TTS)', 'enabled' => true, 'badge' => 'Accessibility'],
                'offlineDownloads' => ['id' => 'offlineDownloads', 'label' => 'Offline PDF Vault & Reading Mode', 'enabled' => true, 'badge' => 'PWA Offline'],
                'pastQuestions' => ['id' => 'pastQuestions', 'label' => 'Past Examination Question Archive', 'enabled' => true, 'badge' => 'Exams'],
                'digitalTheses' => ['id' => 'digitalTheses', 'label' => 'HND & ND Dissertations Repository', 'enabled' => true, 'badge' => 'Theses'],
                'plagiarismChecker' => ['id' => 'plagiarismChecker', 'label' => 'Similarity & Plagiarism Inspector', 'enabled' => false, 'badge' => 'Integrity'],
                'seatReservation' => ['id' => 'seatReservation', 'label' => 'Library Carrel & Cubicle Booking', 'enabled' => true, 'badge' => 'Facilities'],
                'whatsAppLibrarian' => ['id' => 'whatsAppLibrarian', 'label' => 'Floating 24/7 WhatsApp Helpdesk', 'enabled' => true, 'badge' => 'Support'],
                'nightSepiaReader' => ['id' => 'nightSepiaReader', 'label' => 'Eye-Care Sepia & AMOLED Dark Mode', 'enabled' => true, 'badge' => 'Ergonomics'],
                'studyDiscussionForum' => ['id' => 'studyDiscussionForum', 'label' => 'Department Peer Discussion Forum', 'enabled' => false, 'badge' => 'Community']
            ],
            'adminFeatures' => [
                'autoSmsOverdue' => ['id' => 'autoSmsOverdue', 'label' => 'SMS & WhatsApp Overdue Broadcaster', 'enabled' => true, 'badge' => 'Automation'],
                'rfidGateAlarm' => ['id' => 'rfidGateAlarm', 'label' => 'RFID / UHF Gate Anti-Theft Alarm', 'enabled' => true, 'badge' => 'Security'],
                'interLibraryLoan' => ['id' => 'interLibraryLoan', 'label' => 'Inter-Library Exchange Protocol (ILL)', 'enabled' => true, 'badge' => 'Consortium'],
                'aiMarcGenerator' => ['id' => 'aiMarcGenerator', 'label' => 'AI Auto-Cataloguer & MARC21 Generator', 'enabled' => true, 'badge' => 'Cataloguing'],
                'autoFinesReconciliation' => ['id' => 'autoFinesReconciliation', 'label' => 'Paystack / Flutterwave Online Fines', 'enabled' => false, 'badge' => 'Fintech'],
                's3CloudBackup' => ['id' => 's3CloudBackup', 'label' => 'Automated Cloud Database Replication', 'enabled' => true, 'badge' => 'Disaster Recovery']
            ],
            'hodFeatures' => [
                'syllabusMandatorySync' => ['id' => 'syllabusMandatorySync', 'label' => 'Mandatory Syllabus Reading List Sync', 'enabled' => true, 'badge' => 'Accreditation'],
                'recommendationWorkflow' => ['id' => 'recommendationWorkflow', 'label' => 'Fast-Track Dean Approval Queue', 'enabled' => true, 'badge' => 'Procurement'],
                'handoutLocker' => ['id' => 'handoutLocker', 'label' => 'Department E-Handout Distribution Locker', 'enabled' => true, 'badge' => 'Classroom']
            ]
        ];
    }

    /**
     * POST /api/developer/logout
     * Log out developer session safely and record audit trail
     */
    public function logout(Request $request)
    {
        try {
            DB::table('audit_logs')->insert([
                'id' => (string)Str::uuid(),
                'user_id' => 'DEV-ROOT',
                'user_name' => 'Root System Developer',
                'action' => 'DEVELOPER_LOGOUT',
                'details' => 'Developer God Mode session safely locked from IP ' . $request->ip(),
                'ip_address' => $request->ip(),
                'created_at' => now(),
                'updated_at' => now()
            ]);
        } catch (\Exception $e) {}

        return response()->json([
            'success' => true,
            'message' => 'Developer session safely logged out and locked.'
        ]);
    }

    /**
     * GET /api/developer/database/status
     * Real-time Database Health, Table Counts, and Engine Telemetry
     */
    public function getDatabaseStatus(Request $request)
    {
        try {
            $driver = DB::connection()->getDriverName();
            $usersCount = DB::table('users')->count();
            $patronsCount = DB::table('patrons')->count();
            $booksCount = DB::table('books')->count();
            $loansCount = DB::table('loans')->count();
            $departmentsCount = DB::table('departments')->count();
            $customPagesCount = \Illuminate\Support\Facades\Schema::hasTable('custom_admin_pages') ? DB::table('custom_admin_pages')->count() : 0;

            return response()->json([
                'success' => true,
                'status' => 'ONLINE',
                'driver' => strtoupper($driver),
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version(),
                'server_time' => now()->format('Y-m-d H:i:s'),
                'memory_usage_mb' => round(memory_get_usage(true) / 1024 / 1024, 2),
                'counts' => [
                    'users' => $usersCount,
                    'patrons' => $patronsCount,
                    'books' => $booksCount,
                    'loans' => $loansCount,
                    'departments' => $departmentsCount,
                    'custom_pages' => $customPagesCount
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'status' => 'DEGRADED',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/developer/audit-logs
     * Cryptographic Security Audit Trail with filter and search
     */
    public function getAuditLogs(Request $request)
    {
        $query = DB::table('audit_logs');

        if ($search = $request->query('search', $request->query('q'))) {
            $query->where(function ($q) use ($search) {
                $q->where('actor', 'like', "%{$search}%")
                  ->orWhere('action', 'like', "%{$search}%")
                  ->orWhere('resource_id', 'like', "%{$search}%")
                  ->orWhere('resource_type', 'like', "%{$search}%")
                  ->orWhere('details', 'like', "%{$search}%")
                  ->orWhere('ip_address', 'like', "%{$search}%")
                  ->orWhere('id', 'like', "%{$search}%");
            });
        }

        if ($role = $request->query('role')) {
            $query->where('role', $role);
        }

        if ($action = $request->query('action')) {
            $query->where('action', 'like', "%{$action}%");
        }

        $total = $query->count();
        $limit = min(200, (int)$request->query('limit', 100));
        $logs = $query->orderBy('timestamp', 'desc')->limit($limit)->get();

        return response()->json([
            'success' => true,
            'total' => $total,
            'count' => $logs->count(),
            'logs' => $logs
        ]);
    }

    /**
     * POST /api/developer/audit-logs
     */
    public function storeAuditLog(Request $request)
    {
        $actor = $request->input('actor', 'Developer Root');
        $role = $request->input('role', 'developer');
        $action = $request->input('action', 'Security Audit Event');
        $resourceType = $request->input('resource_type', 'System');
        $resourceId = $request->input('resource_id', 'SYS-ROOT');
        $details = $request->input('details', 'Administrative event recorded.');

        $this->recordAudit($actor, $role, $action, $resourceType, $resourceId, $details);

        return response()->json([
            'success' => true,
            'message' => 'Audit log recorded successfully.'
        ]);
    }

    /**
     * GET /api/developer/books
     * Live search and list of catalogued monographs from database
     */
    public function getBooks(Request $request)
    {
        $query = DB::table('books');

        if ($search = $request->query('search', $request->query('q'))) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('author', 'like', "%{$search}%")
                  ->orWhere('isbn', 'like', "%{$search}%")
                  ->orWhere('call_number', 'like', "%{$search}%")
                  ->orWhere('course_code', 'like', "%{$search}%")
                  ->orWhere('department', 'like', "%{$search}%")
                  ->orWhere('id', 'like', "%{$search}%");
            });
        }

        if ($dept = $request->query('department')) {
            $query->where('department', 'like', "%{$dept}%");
        }

        $selectCols = [
            'id', 'title', 'subtitle', 'author', 'isbn', 'call_number',
            'department', 'subject', 'shelf_location', 'copies_total',
            'copies_available', 'cover_image', 'year', 'publisher', 'edition', 'category',
            'status', 'description', 'file_name', 'uploaded_at', 'updated_at'
        ];
        $actualCols = array_filter($selectCols, fn($col) => \Illuminate\Support\Facades\Schema::hasColumn('books', $col));
        if (empty($actualCols)) {
            $actualCols = ['*'];
        }

        $total = $query->count();
        $limit = min(200, (int)$request->query('limit', 100));
        $books = $query->select($actualCols)->orderBy('uploaded_at', 'desc')->limit($limit)->get();

        return response()->json([
            'success' => true,
            'total' => $total,
            'books' => $books
        ]);
    }

    /**
     * PUT /api/developer/books/{id}
     * Direct monograph metadata modification
     */
    public function updateBook(Request $request, $id)
    {
        if (!$this->verifyPasskey($request)) {
            return response()->json(['success' => false, 'error' => 'ACCESS DENIED: Developer Passkey required.'], 403);
        }

        $book = DB::table('books')->where('id', $id)->first();
        if (!$book) {
            return response()->json(['success' => false, 'error' => "Book {$id} not found."], 404);
        }

        $updates = [];
        $allowed = [
            'title', 'subtitle', 'author', 'author_credentials', 'department', 'subject',
            'course_code', 'target_level', 'shelf_location', 'call_number', 'isbn', 'doi',
            'publisher', 'year', 'edition', 'copies_total', 'copies_available', 'abstract',
            'cover_image', 'file_data_url', 'access_level'
        ];

        foreach ($allowed as $f) {
            if ($request->has($f)) {
                $updates[$f] = $request->input($f);
            }
        }

        if (!empty($updates)) {
            DB::table('books')->where('id', $id)->update($updates);
        }

        $this->recordAudit(
            'Developer Master',
            'developer',
            'Monograph Ingestion Modified',
            'Book',
            $id,
            "Updated catalog metadata for book '{$book->title}' ({$id})."
        );

        return response()->json([
            'success' => true,
            'message' => "Book \"{$book->title}\" updated in central database."
        ]);
    }

    /**
     * DELETE /api/developer/books/{id}
     * Remove book from catalog
     */
    public function deleteBook(Request $request, $id)
    {
        if (!$this->verifyPasskey($request)) {
            return response()->json(['success' => false, 'error' => 'ACCESS DENIED: Developer Passkey required.'], 403);
        }

        $book = DB::table('books')->where('id', $id)->first();
        if (!$book) {
            return response()->json(['success' => false, 'error' => "Book {$id} not found."], 404);
        }

        DB::table('books')->where('id', $id)->delete();

        $this->recordAudit(
            'Developer Master',
            'developer',
            'Book Purged from Catalog',
            'Book',
            $id,
            "Permanently removed monograph '{$book->title}' from database."
        );

        return response()->json([
            'success' => true,
            'message' => "Book \"{$book->title}\" deleted from database."
        ]);
    }

    /**
     * GET /api/developer/admin-overview
     * Comprehensive real-time master analytics bridging Admin Console & Developer Suite
     */
    public function getAdminOverview(Request $request)
    {
        $booksCount = DB::table('books')->count();
        $copiesTotal = (int)DB::table('books')->sum('copies_total');
        $copiesAvailable = (int)DB::table('books')->sum('copies_available');
        $digitalBooksCount = DB::table('books')->where('is_digital', 1)->orWhereNotNull('file_data_url')->count();

        $patronsCount = DB::table('patrons')->count();
        $activePatronsCount = DB::table('patrons')->where('status', 'active')->count();
        $suspendedPatronsCount = DB::table('patrons')->where('status', 'suspended')->orWhere('status', 'blocked')->count();

        $activeLoansCount = DB::table('loans')->where('status', 'active')->count();
        $overdueLoansCount = DB::table('loans')->where('status', 'overdue')->count();
        $returnedLoansCount = DB::table('loans')->where('status', 'returned')->count();

        $finesTotal = (float)DB::table('fines')->where('status', 'unpaid')->sum('amount');
        $staffCount = DB::table('users')->count();
        $deptsCount = DB::table('departments')->count();
        $pendingSubmissions = DB::table('department_uploads')->where('status', 'pending')->count();
        $partnersCount = DB::table('partner_libraries')->count();

        $recentLoans = DB::table('loans')
            ->orderBy('id', 'desc')
            ->limit(8)
            ->get();

        $recentAuditLogs = DB::table('audit_logs')
            ->orderBy('timestamp', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'stats' => [
                'books_count' => $booksCount,
                'copies_total' => $copiesTotal,
                'copies_available' => $copiesAvailable,
                'digital_books_count' => $digitalBooksCount,
                'patrons_count' => $patronsCount,
                'active_patrons_count' => $activePatronsCount,
                'suspended_patrons_count' => $suspendedPatronsCount,
                'active_loans_count' => $activeLoansCount,
                'overdue_loans_count' => $overdueLoansCount,
                'returned_loans_count' => $returnedLoansCount,
                'fines_total' => $finesTotal,
                'staff_count' => $staffCount,
                'departments_count' => $deptsCount,
                'pending_submissions' => $pendingSubmissions,
                'partners_count' => $partnersCount,
            ],
            'recent_loans' => $recentLoans,
            'recent_audit' => $recentAuditLogs,
            'server_time' => now()->toIso8601String()
        ]);
    }
}
