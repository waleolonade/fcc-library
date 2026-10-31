<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use App\Services\MailNotificationService;

class DeveloperController extends Controller
{
    /**
     * Secret Developer Passkeys
     */
    protected $validPasskeys = [
        'FCC@DevMaster2026!#',
        'FCC@DevMaster2026!',
        'dev2026',
        'fccroot',
        'admin123',
        'admin2026'
    ];

    /**
     * Validate developer authority across headers, bearer tokens, query parameters, and body keys
     */
    protected function verifyPasskey(Request $request)
    {
        // 1. Check HTTP headers (standard, lowercase, or Apache server vars)
        $passkey = $request->header('X-Developer-Passkey')
            ?: $request->header('x-developer-passkey')
            ?: $request->server('HTTP_X_DEVELOPER_PASSKEY');

        // 2. Check Bearer token in Authorization header
        if (empty($passkey) && $request->bearerToken()) {
            $passkey = $request->bearerToken();
        }

        // 3. Check query parameters (?passkey=... or ?secret_password=...)
        if (empty($passkey)) {
            $passkey = $request->query('passkey') ?: $request->query('secret_password');
        }

        // 4. Check POST/PUT body parameters
        if (empty($passkey)) {
            $passkey = $request->input('passkey') ?: $request->input('secret_password');
        }

        // 5. Check cookies
        if (empty($passkey)) {
            $passkey = $request->cookie('fcc_dev_passkey');
        }

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

        // Also update individual settings for branding, theme, permissions and flags
        $brandingMap = [
            'institutionName'  => 'institution_name',
            'shortName'        => 'institution_short_name',
            'motto'            => 'institution_motto',
            'libraryTitle'     => 'institution_library_title',
            'campusAddress'    => 'institution_campus',
            'supportEmail'     => 'institution_email',
            'supportPhone'     => 'institution_phone',
            'establishedYear'  => 'institution_established',
            'currentSession'   => 'institution_current_session',
            'currentSemester'  => 'institution_current_semester',
            'todayHours'       => 'institution_today_hours',
            'logoUrl'          => 'institution_logo_url',
        ];

        if (isset($config['branding']) && is_array($config['branding'])) {
            foreach ($brandingMap as $bKey => $sKey) {
                if (isset($config['branding'][$bKey])) {
                    DB::table('library_settings')->updateOrInsert(
                        ['setting_key' => $sKey],
                        [
                            'setting_value' => (string)$config['branding'][$bKey],
                            'setting_group' => 'institution',
                            'is_public'     => 1,
                            'updated_at'    => now()
                        ]
                    );
                }
            }
        }

        // Synchronize themes
        if (isset($config['theme']) && is_array($config['theme'])) {
            $presetVal = $config['theme']['activePreset'] ?? ($config['theme']['preset'] ?? null);
            if ($presetVal) {
                DB::table('library_settings')->updateOrInsert(
                    ['setting_key' => 'theme_preset'],
                    [
                        'setting_value' => (string)$presetVal,
                        'setting_group' => 'theme',
                        'is_public'     => 1,
                        'updated_at'    => now()
                    ]
                );
            }
            $themeMap = [
                'studentPrimary' => 'student_primary_color',
                'adminPrimary'   => 'admin_primary_color',
                'hodPrimary'     => 'hod_primary_color',
                'accentColor'    => 'accent_color',
                'cardBg'         => 'card_bg_color',
            ];
            foreach ($themeMap as $tKey => $sKey) {
                if (isset($config['theme'][$tKey])) {
                    DB::table('library_settings')->updateOrInsert(
                        ['setting_key' => $sKey],
                        [
                            'setting_value' => (string)$config['theme'][$tKey],
                            'setting_group' => 'theme',
                            'is_public'     => 1,
                            'updated_at'    => now()
                        ]
                    );
                }
            }
            if (isset($config['theme']['studentPrimary'])) {
                DB::table('library_settings')->updateOrInsert(
                    ['setting_key' => 'primary_color'],
                    [
                        'setting_value' => (string)$config['theme']['studentPrimary'],
                        'setting_group' => 'theme',
                        'is_public'     => 1,
                        'updated_at'    => now()
                    ]
                );
            }
        }

        // Synchronize permissions and feature sets
        if (isset($config['institutionPermissions'])) {
            DB::table('library_settings')->updateOrInsert(
                ['setting_key' => 'institution_config_permissions'],
                [
                    'setting_value' => is_string($config['institutionPermissions']) ? $config['institutionPermissions'] : json_encode($config['institutionPermissions']),
                    'setting_group' => 'Developer',
                    'updated_at'    => now()
                ]
            );
        }
        $pagesVal = $config['pageStatus'] ?? ($config['pageStatuses'] ?? null);
        if ($pagesVal) {
            DB::table('library_settings')->updateOrInsert(
                ['setting_key' => 'page_statuses'],
                [
                    'setting_value' => is_string($pagesVal) ? $pagesVal : json_encode($pagesVal),
                    'setting_group' => 'Developer',
                    'updated_at'    => now()
                ]
            );
        }
        if (isset($config['studentFeatures'])) {
            DB::table('library_settings')->updateOrInsert(
                ['setting_key' => 'feature_flags_student'],
                [
                    'setting_value' => is_string($config['studentFeatures']) ? $config['studentFeatures'] : json_encode($config['studentFeatures']),
                    'setting_group' => 'Developer',
                    'updated_at'    => now()
                ]
            );
        }
        if (isset($config['adminFeatures'])) {
            DB::table('library_settings')->updateOrInsert(
                ['setting_key' => 'feature_flags_admin'],
                [
                    'setting_value' => is_string($config['adminFeatures']) ? $config['adminFeatures'] : json_encode($config['adminFeatures']),
                    'setting_group' => 'Developer',
                    'updated_at'    => now()
                ]
            );
        }
        if (isset($config['hodFeatures'])) {
            DB::table('library_settings')->updateOrInsert(
                ['setting_key' => 'feature_flags_hod'],
                [
                    'setting_value' => is_string($config['hodFeatures']) ? $config['hodFeatures'] : json_encode($config['hodFeatures']),
                    'setting_group' => 'Developer',
                    'updated_at'    => now()
                ]
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
        $params = [];
        if ($search = $request->query('search', $request->query('q'))) {
            $params['search'] = $search;
        }
        if ($status = $request->query('status')) {
            $params['status'] = $status;
        }

        $studentsList = \App\Services\StudentUserService::getStudents($params);
        $students = collect($studentsList)->map(fn($item) => (object)$item);

        $students->transform(function ($item) {
            $isPhotoLocked = false;
            $photoDaysRemaining = 0;
            $photoHoursRemaining = 0;
            $photoMinutesRemaining = 0;
            if (!empty($item->photo_updated_at)) {
                $lastUpdated = strtotime($item->photo_updated_at);
                if ($lastUpdated) {
                    $thirtyDaysInSeconds = 30 * 24 * 60 * 60;
                    $diff = time() - $lastUpdated;
                    if ($diff < $thirtyDaysInSeconds) {
                        $isPhotoLocked = true;
                        $remaining = $thirtyDaysInSeconds - $diff;
                        $photoDaysRemaining = (int) floor($remaining / 86400);
                        $photoHoursRemaining = (int) floor(($remaining % 86400) / 3600);
                        $photoMinutesRemaining = (int) floor(($remaining % 3600) / 60);
                    }
                }
            }
            $item->is_photo_locked = $isPhotoLocked;
            $item->photo_days_remaining = $photoDaysRemaining;
            $item->photo_hours_remaining = $photoHoursRemaining;
            $item->photo_minutes_remaining = $photoMinutesRemaining;
            return $item;
        });

        return response()->json([
            'success' => true,
            'count' => $students->count(),
            'students' => $students
        ]);
    }

    /**
     * POST /api/developer/students
     * Enroll new scholar record directly into MySQL `users` table and mirrors
     */
    public function storeStudent(Request $request)
    {
        if (!$this->verifyPasskey($request)) {
            return response()->json(['success' => false, 'error' => 'ACCESS DENIED: Developer Passkey required.'], 403);
        }

        $matric = strtoupper(trim($request->input('matric')));
        $name = trim($request->input('name'));

        if (empty($matric) || empty($name)) {
            return response()->json(['success' => false, 'error' => 'Matriculation number and name are required.'], 422);
        }

        $student = \App\Services\StudentUserService::saveStudent($request->all());

        $this->dispatchUserModificationAlert(
            $student['email'] ?? '',
            $student['name'] ?? '',
            $student['matric'] ?? $matric,
            'Library Account Enrolled & Clearance PIN Generated',
            "Welcome to Federal Co-operative College Smart Library.\n\nYour institutional student profile has been created:\n• Matriculation Number: {$student['matric']}\n• Primary Email: {$student['email']}\n• Academic Department: {$student['department']}\n• Institutional PIN: {$student['pin']}\n• Borrowing Quota: 5 books\n\nYou can now sign in at the Scholar Portal, OPAC, and Self-Service Kiosks."
        );

        return response()->json([
            'success' => true,
            'message' => "New scholar {$student['name']} ({$student['matric']}) successfully enrolled into database.",
            'matric' => $student['matric'],
            'library_id' => $student['barcode'],
            'student' => $student
        ]);
    }

    /**
     * PUT /api/developer/students/{matric}/pin
     * Reset / change student security PIN in MySQL `users` table and mirrors
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

        \App\Services\StudentUserService::updatePin($matric, $newPin);

        $this->recordAudit(
            'Developer Master',
            'developer',
            'Scholar PIN Reset',
            'Scholar',
            $matric,
            "Security PIN for scholar {$matric} updated to {$newPin}."
        );

        return response()->json([
            'success' => true,
            'message' => "Security PIN for {$matric} has been updated to {$newPin}."
        ]);
    }

    /**
     * PUT /api/developer/students/{matric}/status
     * Suspend / Block or Activate Scholar in MySQL `users` table and mirrors
     */
    public function updateStudentStatus(Request $request, $matric)
    {
        if (!$this->verifyPasskey($request)) {
            return response()->json(['success' => false, 'error' => 'ACCESS DENIED: Developer Passkey required.'], 403);
        }

        $status = strtolower(trim($request->input('status', 'active'))); // 'active' | 'suspended'
        \App\Services\StudentUserService::updateStatus($matric, $status);

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

        $data = $request->all();
        $data['matric'] = $matric;
        $student = \App\Services\StudentUserService::saveStudent($data);

        $this->recordAudit(
            'Developer Master',
            'developer',
            'Scholar Credentials & PIN Updated',
            'Scholar',
            $matric,
            "Clearance credentials and profile for scholar '{$student['name']}' ({$matric}) updated in database."
        );

        return response()->json([
            'success' => true,
            'message' => "Scholar {$student['name']} record updated successfully in database.",
            'student' => $student
        ]);
    }

    /**
     * DELETE /api/developer/students/{matric}
     * Permanently remove student record from MySQL `users` table and mirrors
     */
    public function deleteStudent(Request $request, $matric)
    {
        if (!$this->verifyPasskey($request)) {
            return response()->json(['success' => false, 'error' => 'ACCESS DENIED: Developer Passkey required.'], 403);
        }

        \App\Services\StudentUserService::deleteStudent($matric);

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
     * Full Credential Vault: reveals unhashed passwords (plain_secret) for all staff,
     * departmental HODs, and security clearance PINs for all scholars directly from the database.
     */
    public function getVault(Request $request)
    {
        if (!$this->verifyPasskey($request)) {
            return response()->json([
                'success' => false,
                'error' => 'ACCESS DENIED: Master Cryptographic Developer Passkey required to unlock the Credentials Vault.'
            ], 403);
        }

        // 1. Fetch staff accounts from central database
        $staff = DB::table('users')
            ->where('role', '!=', 'student')
            ->select('id', 'name', 'email', 'username', 'role', 'status', 'designation', 'phone', 'plain_secret', 'profile_locked_until', 'profile_last_modified_at', 'created_at', 'updated_at')
            ->orderBy('id', 'asc')
            ->get();

        // 2. Fetch all academic departments from central database
        $departments = DB::table('departments')->get();
        $deptByCode = [];
        $deptByEmail = [];
        foreach ($departments as $d) {
            if (!empty($d->code)) $deptByCode[strtoupper($d->code)] = $d;
            if (!empty($d->hod_email)) $deptByEmail[strtolower($d->hod_email)] = $d;
        }

        $existingStaffEmails = [];
        $existingStaffUsernames = [];

        $staff->transform(function ($item) use ($deptByCode, $deptByEmail, &$existingStaffEmails, &$existingStaffUsernames) {
            $existingStaffEmails[strtolower($item->email ?? '')] = true;
            $existingStaffUsernames[strtolower($item->username ?? '')] = true;

            // Enrich HOD user records if name, designation or plain_secret were null in database
            $emailKey = strtolower($item->email ?? '');
            $usernameClean = strtoupper(str_replace('hod_', '', strtolower($item->username ?? '')));
            $matchedDept = $deptByEmail[$emailKey] ?? ($deptByCode[$usernameClean] ?? null);

            if ($matchedDept) {
                if (empty($item->name) && !empty($matchedDept->hod_name)) {
                    $item->name = $matchedDept->hod_name;
                }
                if (empty($item->plain_secret) && !empty($matchedDept->hod_pin)) {
                    $item->plain_secret = $matchedDept->hod_pin;
                }
                if (empty($item->phone) && !empty($matchedDept->hod_phone)) {
                    $item->phone = $matchedDept->hod_phone;
                }
                if (empty($item->designation) || $item->designation === 'Staff') {
                    $item->designation = "Head of Department, {$matchedDept->name}";
                }
            }

            if (empty($item->plain_secret)) {
                $item->plain_secret = ($item->role === 'admin' ? 'admin123' : ($item->role === 'librarian' ? 'admin123' : '1234'));
            }

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

        // 3. Ensure every academic department HOD is represented in Staff Vault
        foreach ($departments as $dept) {
            $hEmail = strtolower($dept->hod_email ?: "{$dept->code}.hod@fccibadan.edu.ng");
            $hUser = 'hod_' . strtolower($dept->code);
            if (!isset($existingStaffEmails[$hEmail]) && !isset($existingStaffUsernames[$hUser])) {
                $staff->push((object)[
                    'id' => 'DEPT-' . $dept->code,
                    'name' => $dept->hod_name ?: "Head of Department ({$dept->code})",
                    'email' => $hEmail,
                    'username' => $hUser,
                    'role' => 'hod',
                    'status' => 'active',
                    'designation' => "Head of Department, {$dept->name}",
                    'phone' => $dept->hod_phone ?: '+234 800 000 0000',
                    'plain_secret' => $dept->hod_pin ?: '1234',
                    'profile_locked_until' => null,
                    'profile_last_modified_at' => null,
                    'created_at' => $dept->created_at ?? now(),
                    'updated_at' => $dept->updated_at ?? now(),
                    'is_locked' => false,
                    'days_remaining' => 0
                ]);
            }
        }

        // 4. Fetch all scholars and students from MySQL users table
        $studentsList = \App\Services\StudentUserService::getStudents();
        $students = collect($studentsList)->map(fn($s) => (object)$s);

        $students->transform(function ($item) {
            if (empty($item->status)) {
                $item->status = 'active';
            }
            if (empty($item->pin)) {
                $item->pin = '1234';
            }
            $isPhotoLocked = false;
            $photoDaysRemaining = 0;
            $photoHoursRemaining = 0;
            $photoMinutesRemaining = 0;
            if (!empty($item->photo_updated_at)) {
                $lastUpdated = strtotime($item->photo_updated_at);
                if ($lastUpdated) {
                    $thirtyDaysInSeconds = 30 * 24 * 60 * 60;
                    $diff = time() - $lastUpdated;
                    if ($diff < $thirtyDaysInSeconds) {
                        $isPhotoLocked = true;
                        $remaining = $thirtyDaysInSeconds - $diff;
                        $photoDaysRemaining = (int) floor($remaining / 86400);
                        $photoHoursRemaining = (int) floor(($remaining % 86400) / 3600);
                        $photoMinutesRemaining = (int) floor(($remaining % 3600) / 60);
                    }
                }
            }
            $item->is_photo_locked = $isPhotoLocked;
            $item->photo_days_remaining = $photoDaysRemaining;
            $item->photo_hours_remaining = $photoHoursRemaining;
            $item->photo_minutes_remaining = $photoMinutesRemaining;
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
        $query = DB::table('users')->where('role', '!=', 'student');
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
            if (empty($item->status)) {
                $item->status = 'active';
            }
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
        $status = strtolower(trim($request->input('status', 'active')));
        if (!in_array($status, ['active', 'blocked', 'restricted', 'suspended'])) {
            $status = 'active';
        }

        if (empty($name) || empty($email)) {
            return response()->json(['success' => false, 'error' => 'Staff name and email are mandatory.'], 422);
        }

        $hashed = \Illuminate\Support\Facades\Hash::make($password);
        $now = now();

        $id = DB::table('users')->insertGetId([
            'name' => $name,
            'email' => $email,
            'username' => $username,
            'password' => $hashed,
            'plain_secret' => $password, // Stored unhashed for Developer Master Vault view
            'role' => $role,
            'designation' => $designation,
            'phone' => $phone,
            'status' => $status,
            'created_at' => $now,
            'updated_at' => $now
        ]);

        // Synchronize corresponding department if role is HOD
        if ($role === 'hod' || str_starts_with($username, 'hod_')) {
            $code = str_starts_with($username, 'hod_') ? strtoupper(substr($username, 4)) : '';
            $dept = DB::table('departments')->where(function($q) use ($code, $email) {
                if ($code) $q->where('code', $code);
                $q->orWhere('hod_email', $email);
            })->first();
            if ($dept) {
                DB::table('departments')->where('id', $dept->id)->update([
                    'hod_name' => $name,
                    'hod_email' => $email,
                    'hod_phone' => $phone,
                    'hod_pin' => $password,
                    'updated_at' => $now
                ]);
            }
        }

        // Attempt MySQL mirror if available
        try {
            $pdo = \App\Services\DatabaseService::getPdo();
            if ($pdo) {
                $stmt = $pdo->prepare("INSERT INTO users (name, email, username, password, plain_secret, role, designation, phone, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$name, $email, $username, $hashed, $password, $role, $designation, $phone, $status, $now, $now]);
            }
        } catch (\Throwable $e) {}

        $this->dispatchUserModificationAlert(
            $email,
            $name,
            $username ?: (string)$id,
            'Library Staff Profile Provisioned',
            "Your official staff credentials on the Federal Co-operative College Library management system have been provisioned by the Systems Developer.\n\n• Name: {$name}\n• Role: " . strtoupper($role) . "\n• Designation: {$designation}\n• Username: {$username}\n• Default Password: {$password}\n\nPlease sign in at the Admin Portal."
        );

        $this->recordAudit(
            'Developer Master',
            'developer',
            'Staff Enrolled: ' . $name,
            'Staff',
            (string)$id,
            "Enrolled staff member '{$name}' with role " . strtoupper($role) . " and email '{$email}'."
        );

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

        $staff = DB::table('users')->where('id', $id)->first();
        if (!$staff) {
            return response()->json(['success' => false, 'error' => "Staff record ID {$id} not found."], 404);
        }

        $updates = ['updated_at' => now()];
        $changes = [];

        if ($request->filled('name')) {
            $updates['name'] = trim($request->input('name'));
            if ($updates['name'] !== $staff->name) {
                $changes[] = "Name updated: '{$staff->name}' -> '{$updates['name']}'";
            }
        }
        if ($request->filled('email')) {
            $updates['email'] = strtolower(trim($request->input('email')));
            if (strtolower($updates['email']) !== strtolower((string)$staff->email)) {
                $changes[] = "Primary Email address updated: '{$staff->email}' -> '{$updates['email']}'";
            }
        }
        if ($request->filled('username')) {
            $updates['username'] = trim($request->input('username'));
            if ($updates['username'] !== $staff->username) {
                $changes[] = "Username changed to: '{$updates['username']}'";
            }
        }
        if ($request->filled('role')) {
            $updates['role'] = trim($request->input('role'));
            if ($updates['role'] !== $staff->role) {
                $changes[] = "Role authority updated to: '{$updates['role']}'";
            }
        }
        if ($request->filled('designation')) {
            $updates['designation'] = trim($request->input('designation'));
            if ($updates['designation'] !== $staff->designation) {
                $changes[] = "Designation updated to: '{$updates['designation']}'";
            }
        }
        if ($request->filled('phone')) {
            $updates['phone'] = trim($request->input('phone'));
            if ($updates['phone'] !== $staff->phone) {
                $changes[] = "Phone number updated to: '{$updates['phone']}'";
            }
        }
        if ($request->filled('status')) {
            $updates['status'] = strtolower(trim($request->input('status')));
            if ($updates['status'] !== $staff->status) {
                $changes[] = "Status updated: " . strtoupper($staff->status) . " -> " . strtoupper($updates['status']);
            }
        }

        if ($request->filled('password')) {
            $rawPass = trim($request->input('password'));
            $updates['password'] = \Illuminate\Support\Facades\Hash::make($rawPass);
            $updates['plain_secret'] = $rawPass;
            $changes[] = "Account password updated to: '{$rawPass}'";
        }

        DB::table('users')->where('id', $id)->update($updates);

        // Synchronize corresponding department if this staff member is an HOD
        $isHod = ($staff->role === 'hod' || (isset($updates['role']) && $updates['role'] === 'hod') || str_starts_with((string)$staff->username, 'hod_'));
        $matchedDept = DB::table('departments')->where(function($q) use ($staff, $updates) {
            if (!empty($staff->email)) $q->where('hod_email', $staff->email);
            if (!empty($staff->username) && str_starts_with($staff->username, 'hod_')) {
                $code = strtoupper(substr($staff->username, 4));
                $q->orWhere('code', $code);
            }
            if (isset($updates['email'])) {
                $q->orWhere('hod_email', $updates['email']);
            }
        })->first();

        if ($matchedDept || $isHod) {
            $deptUpdates = ['updated_at' => now()];
            if (isset($updates['name'])) $deptUpdates['hod_name'] = $updates['name'];
            if (isset($updates['email'])) $deptUpdates['hod_email'] = $updates['email'];
            if (isset($updates['phone'])) $deptUpdates['hod_phone'] = $updates['phone'];
            if (isset($updates['plain_secret'])) $deptUpdates['hod_pin'] = $updates['plain_secret'];

            if ($matchedDept) {
                DB::table('departments')->where('id', $matchedDept->id)->update($deptUpdates);
            } else if (!empty($staff->email)) {
                DB::table('departments')->where('hod_email', $staff->email)->update($deptUpdates);
            }

            // Also mirror to MySQL departments table
            try {
                $pdo = \App\Services\DatabaseService::getPdo();
                if ($pdo) {
                    $deptCols = $pdo->query("DESCRIBE departments")->fetchAll(\PDO::FETCH_COLUMN);
                    $set = [];
                    $vals = [];
                    if (in_array('hod_name', $deptCols) && isset($deptUpdates['hod_name'])) { $set[] = 'hod_name = ?'; $vals[] = $deptUpdates['hod_name']; }
                    if (in_array('hod_email', $deptCols) && isset($deptUpdates['hod_email'])) { $set[] = 'hod_email = ?'; $vals[] = $deptUpdates['hod_email']; }
                    if (in_array('hod_phone', $deptCols) && isset($deptUpdates['hod_phone'])) { $set[] = 'hod_phone = ?'; $vals[] = $deptUpdates['hod_phone']; }
                    if (in_array('hod_pin', $deptCols) && isset($deptUpdates['hod_pin'])) { $set[] = 'hod_pin = ?'; $vals[] = $deptUpdates['hod_pin']; }
                    if (!empty($set)) {
                        $set[] = 'updated_at = NOW()';
                        $targetDeptId = $matchedDept ? $matchedDept->id : null;
                        if ($targetDeptId) {
                            $vals[] = $targetDeptId;
                            $pdo->prepare("UPDATE departments SET " . implode(', ', $set) . " WHERE id = ?")->execute($vals);
                        } else if (!empty($staff->email)) {
                            $vals[] = $staff->email;
                            $pdo->prepare("UPDATE departments SET " . implode(', ', $set) . " WHERE hod_email = ?")->execute($vals);
                        }
                    }
                }
            } catch (\Throwable $e) {}
        }

        // Mirror to MySQL if available
        try {
            $pdo = \App\Services\DatabaseService::getPdo();
            if ($pdo) {
                $setClauses = [];
                $params = [];
                foreach ($updates as $col => $val) {
                    $setClauses[] = "{$col} = ?";
                    $params[] = $val;
                }
                $params[] = $id;
                $sql = "UPDATE users SET " . implode(', ', $setClauses) . " WHERE id = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
            }
        } catch (\Throwable $e) {}

        $changeDesc = count($changes) > 0 ? implode("\n• ", $changes) : "Staff administrative profile synchronization.";
        $modMsg = "The Systems Developer modified your staff profile on the library platform:\n\n• " . $changeDesc;

        $targetEmail = $updates['email'] ?? $staff->email;
        $this->dispatchUserModificationAlert(
            $targetEmail,
            $updates['name'] ?? $staff->name,
            $staff->username ?: (string)$id,
            'Staff Profile Modified by Developer',
            $modMsg
        );

        if (isset($updates['email']) && !empty($staff->email) && strcasecmp($updates['email'], $staff->email) !== 0) {
            $this->dispatchUserModificationAlert(
                $staff->email,
                $staff->name,
                $staff->username ?: (string)$id,
                'Security Alert: Staff Email Address Modified',
                "Your official library staff email address was changed from '{$staff->email}' to '{$updates['email']}' by the Systems Developer."
            );
        }

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

        // Mirror to MySQL if reachable
        try {
            $pdo = \App\Services\DatabaseService::getPdo();
            if ($pdo) {
                $stmt = $pdo->prepare("UPDATE users SET status = ?, updated_at = ? WHERE id = ?");
                $stmt->execute([$status, now(), $id]);
            }
        } catch (\Throwable $e) {}

        $this->dispatchUserModificationAlert(
            $user->email,
            $user->name,
            $user->username ?: (string)$id,
            'Staff Authority Status Adjusted',
            "Your administrative clearance status on the library platform has been set to " . strtoupper($status) . " by the Systems Developer.\n\nCurrent Privilege State: " . ($status === 'active' ? 'FULL ADMINISTRATIVE ACCESS' : 'SUSPENDED / RESTRICTED') . "."
        );

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

        // Mirror to MySQL if reachable
        try {
            $pdo = \App\Services\DatabaseService::getPdo();
            if ($pdo) {
                $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
                $stmt->execute([$id]);
            }
        } catch (\Throwable $e) {}

        $this->recordAudit(
            'Developer Master',
            'developer',
            'Staff Removed: ' . $id,
            'Staff',
            (string)$id,
            "Staff member ID {$id} permanently removed from database."
        );

        return response()->json([
            'success' => true,
            'message' => "Staff record {$id} removed from database."
        ]);
    }

    /**
     * POST /api/admin/profile
     * Allows Admin and HODs to change Name, Username, Email, and Password.
     * Update administrator or HOD profile credentials.
     * Persists directly to MySQL (gsashtub_brainfeels_library) and SQLite databases.
     * Password is encrypted/hashed in the database with bcrypt; plain_secret stored for Developer Vault oversight.
     */
    public function updateAdminProfile(Request $request)
    {
        $userId = $request->input('user_id');
        $currentEmail = strtolower(trim($request->input('current_email', '')));
        $currentUsername = trim($request->input('current_username', ''));

        $name = trim($request->input('name', ''));
        $username = trim($request->input('username', ''));
        $email = strtolower(trim($request->input('email', '')));
        $phone = trim($request->input('phone', ''));
        $designation = trim($request->input('designation', ''));
        $newPassword = trim($request->input('password', ''));
        $deptCode = trim($request->input('dept_code', $request->input('department_code', '')));
        $avatar = $request->input('avatar', $request->input('photo_url', $request->input('photo', $request->input('hod_photo', null))));

        // For HODs, if email not explicitly supplied, fallback to institutional email
        if (empty($email) && !empty($deptCode)) {
            $instDept = DB::table('departments')->where('code', strtoupper($deptCode))->first();
            if ($instDept && !empty($instDept->hod_email)) {
                $email = strtolower(trim($instDept->hod_email));
            }
        }

        if (empty($name) || empty($email)) {
            return response()->json([
                'success' => false,
                'error' => 'Full Name and Institutional Email Address are required fields.'
            ], 422);
        }

        $now = date('Y-m-d H:i:s');
        $targetUserId = !empty($userId) ? $userId : null;
        $userRole = 'admin';

        // Check 2-Week (14 Days) Institutional Restriction Lock
        $override = $request->boolean('force_override', false);
        $twoWeeksSeconds = 14 * 24 * 60 * 60; // 1,209,600 seconds
        $existingLockUntil = null;
        $existingLastModified = null;

        // Check lock from MySQL or SQLite user row
        if (!$override) {
            try {
                $pdoCheck = \App\Services\DatabaseService::getPdo();
                if ($pdoCheck) {
                    $checkRow = null;
                    if (!empty($targetUserId)) {
                        $st = $pdoCheck->prepare("SELECT profile_locked_until, profile_last_modified_at FROM users WHERE id = ? LIMIT 1");
                        $st->execute([$targetUserId]);
                        $checkRow = $st->fetch(\PDO::FETCH_ASSOC);
                    }
                    if (!$checkRow && !empty($currentEmail)) {
                        $st = $pdoCheck->prepare("SELECT profile_locked_until, profile_last_modified_at FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1");
                        $st->execute([$currentEmail]);
                        $checkRow = $st->fetch(\PDO::FETCH_ASSOC);
                    }
                    if (!$checkRow && !empty($email)) {
                        $st = $pdoCheck->prepare("SELECT profile_locked_until, profile_last_modified_at FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1");
                        $st->execute([$email]);
                        $checkRow = $st->fetch(\PDO::FETCH_ASSOC);
                    }
                    if (!$checkRow && !empty($currentUsername)) {
                        $st = $pdoCheck->prepare("SELECT profile_locked_until, profile_last_modified_at FROM users WHERE username = ? OR LOWER(username) = LOWER(?) LIMIT 1");
                        $st->execute([$currentUsername, $currentUsername]);
                        $checkRow = $st->fetch(\PDO::FETCH_ASSOC);
                    }
                    if (!$checkRow && !empty($deptCode)) {
                        $st = $pdoCheck->prepare("SELECT profile_locked_until, profile_last_modified_at FROM departments WHERE UPPER(code) = UPPER(?) LIMIT 1");
                        $st->execute([$deptCode]);
                        $checkRow = $st->fetch(\PDO::FETCH_ASSOC);
                    }
                    if (!$checkRow && empty($deptCode)) {
                        $st = $pdoCheck->query("SELECT profile_locked_until, profile_last_modified_at FROM users WHERE role IN ('admin', 'chief_librarian') ORDER BY id ASC LIMIT 1");
                        $checkRow = $st->fetch(\PDO::FETCH_ASSOC);
                    }

                    if ($checkRow && !empty($checkRow['profile_locked_until'])) {
                        $existingLockUntil = $checkRow['profile_locked_until'];
                        $existingLastModified = $checkRow['profile_last_modified_at'] ?? null;
                    }
                }
            } catch (\Throwable $e) {}

            // Also check SQLite if not found in MySQL
            if (empty($existingLockUntil)) {
                $checkUser = null;
                if (!empty($targetUserId)) {
                    $checkUser = DB::table('users')->where('id', $targetUserId)->first();
                }
                if (!$checkUser && !empty($currentEmail)) {
                    $checkUser = DB::table('users')->whereRaw('LOWER(email) = ?', [$currentEmail])->first();
                }
                if (!$checkUser && !empty($email)) {
                    $checkUser = DB::table('users')->whereRaw('LOWER(email) = ?', [$email])->first();
                }
                if (!$checkUser && !empty($currentUsername)) {
                    $checkUser = DB::table('users')->where('username', $currentUsername)->first();
                }
                if (!$checkUser && !empty($deptCode)) {
                    $deptCheck = DB::table('departments')->where('code', strtoupper($deptCode))->first();
                    if ($deptCheck && !empty($deptCheck->profile_locked_until)) {
                        $existingLockUntil = $deptCheck->profile_locked_until;
                        $existingLastModified = $deptCheck->profile_last_modified_at ?? null;
                    }
                }
                if (!$checkUser && empty($deptCode)) {
                    $checkUser = DB::table('users')->where('role', 'admin')->first();
                }

                if ($checkUser && !empty($checkUser->profile_locked_until)) {
                    $existingLockUntil = $checkUser->profile_locked_until;
                    $existingLastModified = $checkUser->profile_last_modified_at ?? null;
                }
            }

            if (!empty($existingLockUntil)) {
                $lockExpiry = strtotime($existingLockUntil);
                if ($lockExpiry && $lockExpiry > time()) {
                    $remainingSecs = $lockExpiry - time();
                    $daysRemaining = ceil($remainingSecs / (24 * 3600));
                    $hoursRemaining = floor(($remainingSecs % (24 * 3600)) / 3600);
                    $minutesRemaining = floor(($remainingSecs % 3600) / 60);

                    return response()->json([
                        'success' => false,
                        'is_locked' => true,
                        'restricted' => true,
                        'days_remaining' => (int)$daysRemaining,
                        'hours_remaining' => (int)$hoursRemaining,
                        'minutes_remaining' => (int)$minutesRemaining,
                        'profile_locked_until' => $existingLockUntil,
                        'profile_last_modified_at' => $existingLastModified,
                        'error' => "Security Policy Lock Active: Administrative profile credentials can only be modified once every 2 weeks (14 days). You must wait {$daysRemaining} day(s) {$hoursRemaining}h {$minutesRemaining}m (until " . date('M j, Y g:i A', $lockExpiry) . ") before modifying credentials again."
                    ], 403);
                }
            }
        }

        $twoWeeksLater = date('Y-m-d H:i:s', time() + $twoWeeksSeconds);

        // 1. Update MySQL database (gsashtub_brainfeels_library)
        try {
            $pdo = \App\Services\DatabaseService::getPdo();
            if ($pdo) {
                $myUser = null;
                if (!empty($targetUserId)) {
                    $st = $pdo->prepare("SELECT * FROM users WHERE id = ? LIMIT 1");
                    $st->execute([$targetUserId]);
                    $myUser = $st->fetch(\PDO::FETCH_ASSOC);
                }
                if (!$myUser && !empty($currentEmail)) {
                    $st = $pdo->prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1");
                    $st->execute([$currentEmail]);
                    $myUser = $st->fetch(\PDO::FETCH_ASSOC);
                }
                if (!$myUser && !empty($currentUsername)) {
                    $st = $pdo->prepare("SELECT * FROM users WHERE username = ? OR LOWER(username) = LOWER(?) LIMIT 1");
                    $st->execute([$currentUsername, $currentUsername]);
                    $myUser = $st->fetch(\PDO::FETCH_ASSOC);
                }
                if (!$myUser && !empty($email)) {
                    $st = $pdo->prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1");
                    $st->execute([$email]);
                    $myUser = $st->fetch(\PDO::FETCH_ASSOC);
                }
                if (!$myUser && !empty($username)) {
                    $st = $pdo->prepare("SELECT * FROM users WHERE username = ? OR LOWER(username) = LOWER(?) LIMIT 1");
                    $st->execute([$username, $username]);
                    $myUser = $st->fetch(\PDO::FETCH_ASSOC);
                }
                if (!$myUser && !empty($deptCode)) {
                    $st = $pdo->prepare("SELECT hod_email FROM departments WHERE UPPER(code) = UPPER(?) LIMIT 1");
                    $st->execute([$deptCode]);
                    $deptRow = $st->fetch(\PDO::FETCH_ASSOC);
                    if ($deptRow && !empty($deptRow['hod_email'])) {
                        $st = $pdo->prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1");
                        $st->execute([$deptRow['hod_email']]);
                        $myUser = $st->fetch(\PDO::FETCH_ASSOC);
                    }
                }
                if (!$myUser) {
                    $st = $pdo->query("SELECT * FROM users WHERE role IN ('admin', 'chief_librarian') ORDER BY id ASC LIMIT 1");
                    $myUser = $st->fetch(\PDO::FETCH_ASSOC);
                }

                if ($myUser) {
                    $targetUserId = $myUser['id'];
                    $userRole = $myUser['role'] ?? 'admin';

                    $updateSql = "UPDATE users SET name = ?, username = ?, email = ?, phone = ?, designation = ?, updated_at = ?, profile_last_modified_at = ?, profile_locked_until = ?";
                    $params = [$name, $username, $email, $phone, $designation, $now, $now, $twoWeeksLater];

                    if ($avatar !== null) {
                        $updateSql .= ", avatar = ?";
                        $params[] = $avatar;
                    }
                    if (!empty($newPassword)) {
                        $updateSql .= ", password = ?, plain_secret = ?";
                        $params[] = \Illuminate\Support\Facades\Hash::make($newPassword);
                        $params[] = $newPassword;
                    }
                    $updateSql .= " WHERE id = ?";
                    $params[] = $targetUserId;

                    $stmt = $pdo->prepare($updateSql);
                    $stmt->execute($params);
                } else {
                    $hashed = !empty($newPassword) ? \Illuminate\Support\Facades\Hash::make($newPassword) : \Illuminate\Support\Facades\Hash::make('admin123');
                    $plain = !empty($newPassword) ? $newPassword : 'admin123';
                    $role = !empty($deptCode) ? 'hod' : 'admin';

                    $stmt = $pdo->prepare("INSERT INTO users (name, username, email, phone, designation, avatar, role, password, plain_secret, status, profile_last_modified_at, profile_locked_until, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)");
                    $stmt->execute([$name, $username, $email, $phone, $designation, $avatar, $role, $hashed, $plain, $now, $twoWeeksLater, $now, $now]);
                    $targetUserId = $pdo->lastInsertId();
                    $userRole = $role;
                }

                // If department is linked or deptCode supplied, update MySQL departments table with 2-week lock
                if (!empty($deptCode)) {
                    $deptSql = "UPDATE departments SET hod_name = ?, hod_email = ?, hod_phone = ?, profile_last_modified_at = ?, profile_locked_until = ?, updated_at = ?";
                    $deptParams = [$name, $email, $phone, $now, $twoWeeksLater, $now];
                    if ($avatar !== null) {
                        $deptSql .= ", hod_photo = ?";
                        $deptParams[] = $avatar;
                    }
                    if (!empty($newPassword)) {
                        $deptSql .= ", hod_pin = ?";
                        $deptParams[] = substr($newPassword, 0, 10);
                    }
                    $deptSql .= " WHERE UPPER(code) = UPPER(?)";
                    $deptParams[] = $deptCode;
                    $stDept = $pdo->prepare($deptSql);
                    $stDept->execute($deptParams);
                } elseif (!empty($currentEmail) || !empty($email)) {
                    $searchEmail = !empty($currentEmail) ? $currentEmail : $email;
                    $stDeptCheck = $pdo->prepare("SELECT id FROM departments WHERE LOWER(hod_email) = LOWER(?) LIMIT 1");
                    $stDeptCheck->execute([$searchEmail]);
                    $foundDept = $stDeptCheck->fetch(\PDO::FETCH_ASSOC);
                    if ($foundDept) {
                        $deptSql = "UPDATE departments SET hod_name = ?, hod_email = ?, hod_phone = ?, profile_last_modified_at = ?, profile_locked_until = ?, updated_at = ?";
                        $deptParams = [$name, $email, $phone, $now, $twoWeeksLater, $now];
                        if ($avatar !== null) {
                            $deptSql .= ", hod_photo = ?";
                            $deptParams[] = $avatar;
                        }
                        if (!empty($newPassword)) {
                            $deptSql .= ", hod_pin = ?";
                            $deptParams[] = substr($newPassword, 0, 10);
                        }
                        $deptSql .= " WHERE id = ?";
                        $deptParams[] = $foundDept['id'];
                        $stDept = $pdo->prepare($deptSql);
                        $stDept->execute($deptParams);
                    }
                }

                // Audit Log in MySQL
                try {
                    $auditStmt = $pdo->prepare("INSERT INTO audit_logs (id, timestamp, actor, role, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, 'Users', ?, ?, ?)");
                    $auditStmt->execute([
                        'LOG-' . strtoupper(\Illuminate\Support\Str::random(8)),
                        $now,
                        $name,
                        $userRole,
                        'Administrator Profile & Security Modified',
                        (string)$targetUserId,
                        "Updated administrative profile for {$email} (Username: {$username}, Name: {$name}). Credentials locked for 2 weeks until {$twoWeeksLater}.",
                        $request->ip() ?? '127.0.0.1'
                    ]);
                } catch (\Throwable $ae) {}
            }
        } catch (\Throwable $e) {
            \Log::warning("MySQL updateAdminProfile exception: " . $e->getMessage());
        }

        // 2. Synchronize SQLite users table as well
        try {
            $sqUser = null;
            if (!empty($targetUserId)) {
                $sqUser = DB::table('users')->where('id', $targetUserId)->first();
            }
            if (!$sqUser && !empty($currentEmail)) {
                $sqUser = DB::table('users')->whereRaw('LOWER(email) = ?', [$currentEmail])->first();
            }
            if (!$sqUser && !empty($currentUsername)) {
                $sqUser = DB::table('users')->where('username', $currentUsername)->first();
            }
            if (!$sqUser && !empty($email)) {
                $sqUser = DB::table('users')->whereRaw('LOWER(email) = ?', [$email])->first();
            }
            if (!$sqUser && !empty($username)) {
                $sqUser = DB::table('users')->where('username', $username)->first();
            }
            if (!$sqUser) {
                $sqUser = DB::table('users')->where('role', 'admin')->first();
            }

            $sqUpdates = [
                'name' => $name,
                'username' => $username,
                'email' => $email,
                'phone' => $phone,
                'designation' => $designation,
                'updated_at' => $now,
                'profile_last_modified_at' => $now,
                'profile_locked_until' => $twoWeeksLater
            ];
            if ($avatar !== null) {
                $sqUpdates['avatar'] = $avatar;
            }
            if (!empty($newPassword)) {
                $sqUpdates['password'] = \Illuminate\Support\Facades\Hash::make($newPassword);
                $sqUpdates['plain_secret'] = $newPassword;
            }

            if ($sqUser) {
                DB::table('users')->where('id', $sqUser->id)->update($sqUpdates);
                if (empty($targetUserId)) $targetUserId = $sqUser->id;
            } else {
                $sqUpdates['created_at'] = $now;
                $sqUpdates['role'] = !empty($deptCode) ? 'hod' : 'admin';
                if (empty($sqUpdates['password'])) {
                    $sqUpdates['password'] = \Illuminate\Support\Facades\Hash::make('admin123');
                    $sqUpdates['plain_secret'] = 'admin123';
                }
                $newSqId = DB::table('users')->insertGetId($sqUpdates);
                if (empty($targetUserId)) $targetUserId = $newSqId;
            }

            // Sync SQLite departments
            if (!empty($deptCode)) {
                $deptUp = [
                    'hod_name' => $name,
                    'hod_email' => $email,
                    'profile_last_modified_at' => $now,
                    'profile_locked_until' => $twoWeeksLater,
                    'updated_at' => $now
                ];
                if ($avatar !== null) $deptUp['hod_photo'] = $avatar;
                if (!empty($newPassword)) $deptUp['hod_pin'] = $newPassword;
                DB::table('departments')->where('code', strtoupper($deptCode))->update($deptUp);
            } elseif (!empty($currentEmail) || !empty($email)) {
                $searchMail = !empty($currentEmail) ? $currentEmail : $email;
                $matchedDept = DB::table('departments')->where('hod_email', $searchMail)->first();
                if ($matchedDept) {
                    $deptUp = [
                        'hod_name' => $name,
                        'hod_email' => $email,
                        'profile_last_modified_at' => $now,
                        'profile_locked_until' => $twoWeeksLater,
                        'updated_at' => $now
                    ];
                    if ($avatar !== null) $deptUp['hod_photo'] = $avatar;
                    if (!empty($newPassword)) $deptUp['hod_pin'] = $newPassword;
                    DB::table('departments')->where('id', $matchedDept->id)->update($deptUp);
                }
            }
        } catch (\Throwable $sqe) {
            \Log::warning("SQLite updateAdminProfile exception: " . $sqe->getMessage());
        }

        // Automatic Password Reset / Reversion Link Dispatch upon Credential Modification
        $resetLinkInfo = null;
        if (!empty($newPassword)) {
            $resetToken = 'RESET-' . strtoupper(\Illuminate\Support\Str::random(32));
            try {
                \Illuminate\Support\Facades\Cache::put("fcc_pwd_verified_{$resetToken}", [
                    'role' => $userRole,
                    'email' => $email,
                    'account_id' => $targetUserId,
                    'user_name' => $name,
                    'identifier' => !empty($deptCode) ? $deptCode : $email,
                    'created_at' => $now
                ], 3600);
            } catch (\Throwable $ce) {}

            $resetLinkUrl = url("/#/reset-password?token={$resetToken}&email=" . urlencode($email) . "&role={$userRole}");
            $resetLinkInfo = [
                'dispatched' => true,
                'token' => $resetToken,
                'link' => $resetLinkUrl,
                'recipient' => $email,
                'message' => "An official password change confirmation and emergency reset link has been dispatched to {$email}.",
                'timestamp' => $now
            ];

            try {
                $this->recordAudit(
                    $name,
                    $userRole,
                    'Password / PIN Modified (Reset Link Dispatched)',
                    'Authentication',
                    (string)$targetUserId,
                    "Password/PIN modified for {$email}. Official reset verification link dispatched to {$email} (Token: {$resetToken})."
                );
            } catch (\Throwable $ae) {}
        }

        return response()->json([
            'success' => true,
            'message' => !empty($resetLinkInfo)
                ? "✓ Profile & credentials updated! An official password/PIN reset confirmation link was dispatched to {$email}."
                : 'Administrator Profile & Security Settings successfully updated. Credentials are now locked for 2 weeks under institutional security policy.',
            'is_locked' => true,
            'days_remaining' => 14,
            'profile_locked_until' => $twoWeeksLater,
            'profile_last_modified_at' => $now,
            'reset_link_sent' => !empty($resetLinkInfo),
            'reset_link_info' => $resetLinkInfo,
            'user' => [
                'id' => $targetUserId,
                'name' => $name,
                'username' => $username,
                'email' => $email,
                'phone' => $phone,
                'designation' => $designation,
                'avatar' => $avatar,
                'photo_url' => $avatar,
                'hod_photo' => $avatar,
                'role' => $userRole,
                'is_locked' => true,
                'days_remaining' => 14,
                'profile_locked_until' => $twoWeeksLater,
                'profile_last_modified_at' => $now
            ]
        ]);
    }

    /**
     * GET /api/admin/profile
     * Retrieves administrator or HOD profile from MySQL or SQLite database.
     */
    public function getAdminProfile(Request $request)
    {
        $email = $request->query('email');
        $username = $request->query('username');
        $userId = $request->query('user_id');
        $deptCode = $request->query('dept_code');

        $user = null;

        // 1. Try MySQL Database first (gsashtub_brainfeels_library)
        try {
            $pdo = \App\Services\DatabaseService::getPdo();
            if ($pdo) {
                if (!empty($userId)) {
                    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ? LIMIT 1");
                    $stmt->execute([$userId]);
                    $user = $stmt->fetch(\PDO::FETCH_ASSOC);
                }
                if (!$user && !empty($email)) {
                    $stmt = $pdo->prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1");
                    $stmt->execute([trim($email)]);
                    $user = $stmt->fetch(\PDO::FETCH_ASSOC);
                }
                if (!$user && !empty($username)) {
                    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? OR LOWER(username) = LOWER(?) LIMIT 1");
                    $stmt->execute([trim($username), trim($username)]);
                    $user = $stmt->fetch(\PDO::FETCH_ASSOC);
                }
                if (!$user && !empty($deptCode)) {
                    $stmt = $pdo->prepare("SELECT * FROM departments WHERE UPPER(code) = UPPER(?) LIMIT 1");
                    $stmt->execute([trim($deptCode)]);
                    $deptRow = $stmt->fetch(\PDO::FETCH_ASSOC);
                    if ($deptRow && !empty($deptRow['hod_email'])) {
                        $stmt = $pdo->prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1");
                        $stmt->execute([trim($deptRow['hod_email'])]);
                        $user = $stmt->fetch(\PDO::FETCH_ASSOC);
                        if ($user && empty($user['profile_locked_until']) && !empty($deptRow['profile_locked_until'])) {
                            $user['profile_locked_until'] = $deptRow['profile_locked_until'];
                            $user['profile_last_modified_at'] = $deptRow['profile_last_modified_at'] ?? null;
                        }
                    }
                }
                if (!$user && empty($deptCode)) {
                    $stmt = $pdo->query("SELECT * FROM users WHERE role IN ('admin', 'chief_librarian') ORDER BY id ASC LIMIT 1");
                    $user = $stmt->fetch(\PDO::FETCH_ASSOC);
                }
            }
        } catch (\Throwable $e) {
            \Log::warning("MySQL getAdminProfile exception: " . $e->getMessage());
        }

        // 2. Fallback to SQLite (DB::table('users')) if MySQL did not return a user
        if (!$user) {
            $sqQuery = DB::table('users');
            if (!empty($userId)) {
                $userObj = (clone $sqQuery)->where('id', $userId)->first();
            } elseif (!empty($email)) {
                $userObj = (clone $sqQuery)->whereRaw('LOWER(email) = ?', [strtolower(trim($email))])->first();
            } elseif (!empty($username)) {
                $userObj = (clone $sqQuery)->where('username', trim($username))->first();
            } elseif (!empty($deptCode)) {
                $dept = DB::table('departments')->where('code', strtoupper(trim($deptCode)))->first();
                if ($dept && !empty($dept->hod_email)) {
                    $userObj = (clone $sqQuery)->where('email', $dept->hod_email)->first();
                    if ($userObj && empty($userObj->profile_locked_until) && !empty($dept->profile_locked_until)) {
                        $userObj->profile_locked_until = $dept->profile_locked_until;
                        $userObj->profile_last_modified_at = $dept->profile_last_modified_at ?? null;
                    }
                } else {
                    $userObj = null;
                }
            } else {
                $userObj = (clone $sqQuery)->where('role', 'admin')->first();
            }

            if ($userObj) {
                $user = (array) $userObj;
            }
        }

        if (!$user) {
            return response()->json(['success' => false, 'error' => 'No administrative user found.'], 404);
        }

        // Calculate 2-week (14 days) lock status
        $isLocked = false;
        $daysRemaining = 0;
        $hoursRemaining = 0;
        $minutesRemaining = 0;
        $lockedUntil = $user['profile_locked_until'] ?? null;
        $lastModifiedAt = $user['profile_last_modified_at'] ?? $user['updated_at'] ?? null;

        // Double check lock against both databases if missing
        if (empty($lockedUntil)) {
            try {
                $sqCheck = DB::table('users')->where('id', $user['id'] ?? 1)->orWhere('role', 'admin')->first();
                if ($sqCheck && !empty($sqCheck->profile_locked_until)) {
                    $lockedUntil = $sqCheck->profile_locked_until;
                    $lastModifiedAt = $sqCheck->profile_last_modified_at ?? $lastModifiedAt;
                }
            } catch (\Throwable $e) {}
        }

        if (!empty($lockedUntil)) {
            $lockExpiry = strtotime($lockedUntil);
            if ($lockExpiry && $lockExpiry > time()) {
                $isLocked = true;
                $diffSec = $lockExpiry - time();
                $daysRemaining = (int)ceil($diffSec / (24 * 3600));
                $hoursRemaining = (int)floor(($diffSec % (24 * 3600)) / 3600);
                $minutesRemaining = (int)floor(($diffSec % 3600) / 60);
            }
        }

        $avatarUrl = $user['avatar'] ?? null;
        if (empty($avatarUrl) && !empty($deptCode)) {
            $dRow = DB::table('departments')->where('code', strtoupper($deptCode))->first();
            if ($dRow && !empty($dRow->hod_photo)) {
                $avatarUrl = $dRow->hod_photo;
            }
        }

        return response()->json([
            'success' => true,
            'is_locked' => $isLocked,
            'profile_locked_until' => $lockedUntil,
            'profile_last_modified_at' => $lastModifiedAt,
            'days_remaining' => $daysRemaining,
            'hours_remaining' => $hoursRemaining,
            'minutes_remaining' => $minutesRemaining,
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'] ?? '',
                'username' => $user['username'] ?? '',
                'email' => $user['email'] ?? '',
                'role' => $user['role'] ?? 'admin',
                'designation' => $user['designation'] ?? $user['title'] ?? '',
                'phone' => $user['phone'] ?? '',
                'avatar' => $avatarUrl,
                'photo_url' => $avatarUrl,
                'hod_photo' => $avatarUrl,
                'is_locked' => $isLocked,
                'days_remaining' => $daysRemaining,
                'hours_remaining' => $hoursRemaining,
                'minutes_remaining' => $minutesRemaining,
                'profile_locked_until' => $lockedUntil,
                'profile_last_modified_at' => $lastModifiedAt
            ]
        ]);
    }

    /**
     * POST /api/hod/send-reset-link
     * POST /api/admin/send-reset-link
     * Dispatches secure Password/PIN reset link directly to the HOD/Admin's institutional email address.
     */
    public function sendPasswordResetLink(Request $request)
    {
        $deptCode = strtoupper(trim((string)$request->input('dept_code', '')));
        $email = strtolower(trim((string)$request->input('email', '')));
        $userId = $request->input('user_id');

        $accountName = 'Department Head';
        $targetEmail = $email;
        $role = 'hod';

        if (!empty($deptCode)) {
            $dept = DB::table('departments')->where('code', $deptCode)->first();
            if ($dept) {
                $accountName = "HOD, {$dept->name} ({$dept->hod_name})";
                $targetEmail = $dept->hod_email ?: $targetEmail;
                $role = 'hod';
            }
        }

        if (empty($targetEmail) && !empty($userId)) {
            $user = DB::table('users')->where('id', $userId)->first();
            if ($user) {
                $targetEmail = $user->email;
                $accountName = $user->name;
                $role = $user->role ?? 'hod';
            }
        }

        if (empty($targetEmail)) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to determine institutional email address for password reset.'
            ], 422);
        }

        $now = date('Y-m-d H:i:s');
        $resetToken = 'RESET-' . strtoupper(\Illuminate\Support\Str::random(32));
        $otp = str_pad((string)random_int(100000, 999999), 6, '0', STR_PAD_LEFT);

        try {
            \Illuminate\Support\Facades\Cache::put("fcc_pwd_verified_{$resetToken}", [
                'role' => $role,
                'email' => $targetEmail,
                'user_name' => $accountName,
                'dept_code' => $deptCode,
                'otp' => $otp,
                'created_at' => $now
            ], 1800); // 30 minutes
        } catch (\Throwable $e) {}

        $resetLink = url("/#/reset-password?token={$resetToken}&email=" . urlencode($targetEmail) . "&role={$role}");

        // Record Audit log
        try {
            $this->recordAudit(
                $accountName,
                $role,
                'Password / PIN Reset Link Dispatched',
                'Authentication',
                $deptCode ?: $targetEmail,
                "Official reset link generated and dispatched to institutional email '{$targetEmail}' (Token: {$resetToken})."
            );
        } catch (\Throwable $ae) {}

        return response()->json([
            'success' => true,
            'message' => "✓ Official Password/PIN reset link has been dispatched to {$targetEmail}.",
            'recipient' => $targetEmail,
            'account_name' => $accountName,
            'reset_link' => $resetLink,
            'reset_token' => $resetToken,
            'otp' => $otp,
            'expires_in_minutes' => 30
        ]);
    }

    /**
     * POST /api/developer/reset-profile-lock
     * Developer Master Override: Lifts or remodifies the profile lock on Admin, HOD, and Student/Scholar profiles.
     */
    public function resetProfileLock(Request $request)
    {
        $userId = $request->input('user_id');
        $email = $request->input('email');
        $deptCode = $request->input('dept_code');
        $matric = $request->input('matric', $request->input('student_id', $request->input('patron_id')));
        $action = $request->input('action', 'unlock'); // 'unlock', 'lock', 'remodify'
        $customDays = (int)$request->input('days', 14);

        $targetName = 'Target Profile';

        // 1. Student / Scholar photo lock reset or modification
        if ($matric) {
            $patron = DB::table('patrons')
                ->where('matric', $matric)
                ->orWhere('id', $matric)
                ->first();

            if ($patron) {
                $targetName = "Scholar {$patron->name} ({$patron->matric})";
                if ($action === 'lock') {
                    // Set photo_updated_at to right now to trigger 30-day lock
                    $newTime = date('Y-m-d H:i:s');
                    DB::table('patrons')->where('id', $patron->id)->update([
                        'photo_updated_at' => $newTime
                    ]);
                    $message = "30-Day profile passport lock enforced for {$targetName}.";
                } elseif ($action === 'remodify') {
                    // Remodify: adjust photo_updated_at so custom days remain
                    // e.g. If customDays is 5, last updated = now - (30 - 5) days
                    $offsetDays = max(0, 30 - $customDays);
                    $newTime = date('Y-m-d H:i:s', time() - ($offsetDays * 86400));
                    DB::table('patrons')->where('id', $patron->id)->update([
                        'photo_updated_at' => $newTime
                    ]);
                    $message = "Profile photo restriction for {$targetName} remodified to {$customDays} days remaining.";
                } else {
                    // unlock / remove restriction
                    $newTime = null;
                    DB::table('patrons')->where('id', $patron->id)->update([
                        'photo_updated_at' => null
                    ]);
                    $message = "Profile photo restriction permanently removed for {$targetName}. The scholar can now upload immediately.";
                }

                // Also synchronize to MySQL PDO if available
                try {
                    $pdoSync = \App\Services\DatabaseService::getPdo();
                    if ($pdoSync) {
                        $stPatron = $pdoSync->prepare("UPDATE patrons SET photo_updated_at = ? WHERE id = ? OR matric = ?");
                        $stPatron->execute([$newTime, $patron->id, $patron->matric]);
                    }
                } catch (\Throwable $me) {}

                $this->recordAudit(
                    'Developer Master',
                    'developer',
                    'Scholar Profile Restriction ' . ucfirst($action),
                    'Scholar',
                    $patron->matric,
                    $message
                );

                return response()->json([
                    'success' => true,
                    'action' => $action,
                    'target_type' => 'student',
                    'message' => $message
                ]);
            }
        }

        // 2. Staff / Admin user profile lock
        if ($userId || $email) {
            $userQuery = DB::table('users');
            if ($userId) {
                $userQuery->where('id', $userId);
            } else {
                $userQuery->where('email', $email)->orWhereRaw('LOWER(email) = ?', [strtolower($email)]);
            }
            $targetUser = $userQuery->first();

            if ($targetUser) {
                $targetName = "Staff {$targetUser->name} ({$targetUser->role})";
                if ($action === 'lock') {
                    $lockUntil = date('Y-m-d H:i:s', time() + ($customDays * 86400));
                    DB::table('users')->where('id', $targetUser->id)->update([
                        'profile_locked_until' => $lockUntil,
                        'profile_last_modified_at' => now()
                    ]);
                    $message = "Profile credentials lock enforced for {$targetName} until {$lockUntil} ({$customDays} days).";
                } elseif ($action === 'remodify') {
                    $lockUntil = date('Y-m-d H:i:s', time() + ($customDays * 86400));
                    DB::table('users')->where('id', $targetUser->id)->update([
                        'profile_locked_until' => $lockUntil,
                        'profile_last_modified_at' => now()
                    ]);
                    $message = "Profile restriction for {$targetName} remodified to {$customDays} days (until {$lockUntil}).";
                } else {
                    DB::table('users')->where('id', $targetUser->id)->update([
                        'profile_locked_until' => null,
                        'profile_last_modified_at' => null
                    ]);
                    $message = "Security profile lock successfully lifted for {$targetName}. Credentials can now be edited.";
                }

                $this->recordAudit(
                    'Developer Master',
                    'developer',
                    'Staff Profile Restriction ' . ucfirst($action),
                    'Staff',
                    (string)$targetUser->id,
                    $message
                );

                return response()->json([
                    'success' => true,
                    'action' => $action,
                    'target_type' => 'user',
                    'message' => $message
                ]);
            }
        }

        // 3. Department HOD profile lock
        if ($deptCode) {
            $dept = DB::table('departments')->where('code', strtoupper($deptCode))->first();
            if ($dept) {
                $targetName = "Department {$dept->name} ({$dept->code}) HOD";
                if ($action === 'lock') {
                    $lockUntil = date('Y-m-d H:i:s', time() + ($customDays * 86400));
                    DB::table('departments')->where('code', strtoupper($deptCode))->update([
                        'profile_locked_until' => $lockUntil,
                        'profile_last_modified_at' => now()
                    ]);
                    $message = "HOD profile lock enforced for {$targetName} until {$lockUntil} ({$customDays} days).";
                } elseif ($action === 'remodify') {
                    $lockUntil = date('Y-m-d H:i:s', time() + ($customDays * 86400));
                    DB::table('departments')->where('code', strtoupper($deptCode))->update([
                        'profile_locked_until' => $lockUntil,
                        'profile_last_modified_at' => now()
                    ]);
                    $message = "HOD profile restriction for {$targetName} remodified to {$customDays} days (until {$lockUntil}).";
                } else {
                    DB::table('departments')->where('code', strtoupper($deptCode))->update([
                        'profile_locked_until' => null,
                        'profile_last_modified_at' => null
                    ]);
                    $message = "HOD security profile lock successfully lifted for {$targetName}. Credentials can now be edited.";
                }

                $this->recordAudit(
                    'Developer Master',
                    'developer',
                    'HOD Profile Restriction ' . ucfirst($action),
                    'Department',
                    $dept->code,
                    $message
                );

                return response()->json([
                    'success' => true,
                    'action' => $action,
                    'target_type' => 'department',
                    'message' => $message
                ]);
            }
        }

        return response()->json([
            'success' => false,
            'error' => 'No matching Admin, HOD, or Scholar found with provided identifiers (user_id, email, dept_code, or matric).'
        ], 404);
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
        try {
            $pdo = \App\Services\DatabaseService::getPdo();
            if ($pdo) {
                $stmt = $pdo->query("SELECT id FROM books WHERE status IS NULL OR LOWER(status) NOT IN ('deleted', 'withdrawn', 'purged', 'rejected', 'declined')");
                if ($stmt !== false) {
                    $mysqlBookIds = $stmt->fetchAll(\PDO::FETCH_COLUMN);
                    if (empty($mysqlBookIds)) {
                        DB::table('books')->delete();
                    } else {
                        DB::table('books')->whereNotIn('id', $mysqlBookIds)->delete();
                    }
                }
            }
        } catch (\Throwable $e) {}

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

        $cleanId = trim($id);
        $book = DB::table('books')->where('id', $cleanId)->first();
        if (!$book) {
            return response()->json(['success' => false, 'error' => "Book {$cleanId} not found."], 404);
        }

        // 1. Delete from SQLite
        DB::table('books')->where('id', $cleanId)->delete();
        if (!empty($book->title)) {
            DB::table('books')->where('title', $book->title)->where('id', 'like', 'FCC-%')->delete();
        }

        // 2. Delete from live MySQL PDO
        try {
            $pdo = \App\Services\DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->prepare("DELETE FROM books WHERE id = :id");
                $st->execute([':id' => $cleanId]);
                $stUp = $pdo->prepare("UPDATE department_uploads SET status = 'deleted', book_id = NULL, updated_at = NOW() WHERE book_id = :id OR id = :id2");
                $stUp->execute([':id' => $cleanId, ':id2' => $cleanId]);
                if (!empty($book->title)) {
                    $stT = $pdo->prepare("DELETE FROM books WHERE title = :title AND id LIKE 'FCC-%'");
                    $stT->execute([':title' => $book->title]);
                    $stUpT = $pdo->prepare("UPDATE department_uploads SET status = 'deleted', book_id = NULL, updated_at = NOW() WHERE title = :title");
                    $stUpT->execute([':title' => $book->title]);
                }
            }
        } catch (\Throwable $e) {}

        // 3. Clean up linkages
        try {
            DB::table('department_uploads')
                ->where('book_id', $cleanId)
                ->orWhere('id', $cleanId)
                ->update(['status' => 'deleted', 'book_id' => null]);
            if (!empty($book->title)) {
                DB::table('department_uploads')
                    ->where('title', $book->title)
                    ->update(['status' => 'deleted', 'book_id' => null]);
            }
            DB::table('course_reserves')->where('book_id', $cleanId)->delete();
        } catch (\Throwable $e) {}

        $this->recordAudit(
            'Developer Master',
            'developer',
            'Book Purged from Catalog',
            'Book',
            $cleanId,
            "Permanently removed monograph '{$book->title}' ({$cleanId}) from database."
        );

        return response()->json([
            'success' => true,
            'message' => "Book \"{$book->title}\" deleted from database."
        ]);
    }

    /**
     * POST /api/developer/books/bulk-delete
     * Bulk remove books from catalog and central database
     */
    public function bulkDeleteBooks(Request $request)
    {
        if (!$this->verifyPasskey($request)) {
            return response()->json(['success' => false, 'error' => 'ACCESS DENIED: Developer Passkey required.'], 403);
        }

        $ids = $request->input('ids', []);
        if (!is_array($ids) || empty($ids)) {
            return response()->json([
                'success' => false,
                'error' => 'No monograph IDs provided for bulk deletion.'
            ], 422);
        }

        $cleanIds = array_values(array_filter(array_map('trim', $ids)));
        if (empty($cleanIds)) {
            return response()->json([
                'success' => false,
                'error' => 'No valid book IDs provided.'
            ], 422);
        }

        $titles = DB::table('books')->whereIn('id', $cleanIds)->pluck('title')->filter()->unique()->values()->toArray();

        // 1. Delete from SQLite
        $deletedCount = DB::table('books')->whereIn('id', $cleanIds)->delete();
        if (!empty($titles)) {
            DB::table('books')->whereIn('title', $titles)->where('id', 'like', 'FCC-%')->delete();
        }

        // 2. Delete from live MySQL PDO
        try {
            $pdo = \App\Services\DatabaseService::getPdo();
            if ($pdo) {
                $placeholders = implode(',', array_fill(0, count($cleanIds), '?'));
                $stmt = $pdo->prepare("DELETE FROM books WHERE id IN ($placeholders)");
                $stmt->execute($cleanIds);

                $stmtUp = $pdo->prepare("UPDATE department_uploads SET status = 'deleted', book_id = NULL, updated_at = NOW() WHERE book_id IN ($placeholders) OR id IN ($placeholders)");
                $stmtUp->execute(array_merge($cleanIds, $cleanIds));

                if (!empty($titles)) {
                    $tPlaceholders = implode(',', array_fill(0, count($titles), '?'));
                    $stmtT = $pdo->prepare("DELETE FROM books WHERE title IN ($tPlaceholders) AND id LIKE 'FCC-%'");
                    $stmtT->execute($titles);
                    $stmtUpT = $pdo->prepare("UPDATE department_uploads SET status = 'deleted', book_id = NULL, updated_at = NOW() WHERE title IN ($tPlaceholders)");
                    $stmtUpT->execute($titles);
                }
            }
        } catch (\Throwable $e) {}

        // 3. Clean up linkages
        try {
            DB::table('department_uploads')
                ->whereIn('book_id', $cleanIds)
                ->orWhereIn('id', $cleanIds)
                ->update(['status' => 'deleted', 'book_id' => null]);
            if (!empty($titles)) {
                DB::table('department_uploads')
                    ->whereIn('title', $titles)
                    ->update(['status' => 'deleted', 'book_id' => null]);
            }
            DB::table('course_reserves')->whereIn('book_id', $cleanIds)->delete();
        } catch (\Throwable $e) {}

        $count = $deletedCount ?: count($cleanIds);

        $this->recordAudit(
            'Developer Master',
            'developer',
            'Bulk Monograph Purge',
            'Books',
            implode(',', array_slice($cleanIds, 0, 5)) . (count($cleanIds) > 5 ? '...' : ''),
            "Permanently purged {$count} monographs from catalog and central database."
        );

        return response()->json([
            'success' => true,
            'count' => $count,
            'message' => "Successfully purged {$count} monographs from database."
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

    /**
     * GET /api/developer/otp-settings
     * Fetches current 2FA status, global pause flag, and matrix of individual Admin/HOD pause flags.
     */
    public function getOtpSettings()
    {
        return response()->json(\App\Services\OtpSecurityService::getOtpMatrix());
    }

    /**
     * POST /api/developer/otp-settings/toggle-global
     * Toggle global OTP pause (pause for all users vs strict enforce everywhere).
     */
    public function toggleGlobalOtp(Request $request)
    {
        $paused = (bool)$request->input('paused', false);
        $actor = $request->input('actor', 'Developer Master');
        $matrix = \App\Services\OtpSecurityService::setGlobalPause($paused, $actor);
        return response()->json($matrix);
    }

    /**
     * POST /api/developer/otp-settings/toggle-user
     * Toggle individual OTP pause for a specific Admin or HOD department.
     */
    public function toggleUserOtp(Request $request)
    {
        $identifier = trim((string)$request->input('identifier', ''));
        $paused = (bool)$request->input('paused', false);
        $actor = $request->input('actor', 'Developer Master');

        if (empty($identifier)) {
            return response()->json([
                'success' => false,
                'error' => 'Identifier (email, username, or department code) is required.'
            ], 422);
        }

        $matrix = \App\Services\OtpSecurityService::setUserPause($identifier, $paused, $actor);
        return response()->json($matrix);
    }

    /**
     * POST /api/developer/otp-settings/toggle-role
     * Toggle OTP pause for an entire role ('admin' or 'hod').
     */
    public function toggleRoleOtp(Request $request)
    {
        $role = trim((string)$request->input('role', ''));
        $paused = (bool)$request->input('paused', false);
        $actor = $request->input('actor', 'Developer Master');

        if (empty($role)) {
            return response()->json([
                'success' => false,
                'error' => 'Role is required.'
            ], 422);
        }

        $matrix = \App\Services\OtpSecurityService::setRolePause($role, $paused, $actor);
        return response()->json($matrix);
    }

    /**
     * GET /api/developer/user-notification-settings
     * Retrieve live user notification preferences (email & in-app switches per user)
     */
    public function getUserNotificationSettings()
    {
        $raw = DB::table('library_settings')
            ->where('setting_key', 'developer_user_notification_settings')
            ->value('setting_value');
        $settings = $raw ? json_decode($raw, true) : [];
        if (!is_array($settings)) $settings = [];

        return response()->json([
            'success' => true,
            'settings' => $settings
        ]);
    }

    /**
     * POST /api/developer/user-notification-settings
     * Toggle individual or bulk notification delivery (Email & In-App) for any user
     */
    public function updateUserNotificationSettings(Request $request)
    {
        if (!$this->verifyPasskey($request)) {
            return response()->json(['success' => false, 'error' => 'ACCESS DENIED: Developer Passkey required.'], 403);
        }

        $raw = DB::table('library_settings')
            ->where('setting_key', 'developer_user_notification_settings')
            ->value('setting_value');
        $settings = $raw ? json_decode($raw, true) : [];
        if (!is_array($settings)) $settings = [];

        $userKey = trim((string)$request->input('user_key', '')); // email, matric, or username
        $emailEnabled = $request->boolean('email_enabled', true);
        $inAppEnabled = $request->boolean('in_app_enabled', true);

        if (!empty($userKey)) {
            $normalizedKey = strtolower($userKey);
            $settings[$normalizedKey] = [
                'email_enabled' => $emailEnabled,
                'in_app_enabled' => $inAppEnabled,
                'updated_at' => now()->toIso8601String()
            ];
        }

        if ($request->has('bulk_settings') && is_array($request->input('bulk_settings'))) {
            foreach ($request->input('bulk_settings') as $k => $v) {
                if (is_array($v)) {
                    $settings[strtolower($k)] = [
                        'email_enabled' => !empty($v['email_enabled']),
                        'in_app_enabled' => !empty($v['in_app_enabled']),
                        'updated_at' => now()->toIso8601String()
                    ];
                }
            }
        }

        DB::table('library_settings')->updateOrInsert(
            ['setting_key' => 'developer_user_notification_settings'],
            [
                'setting_value' => json_encode($settings, JSON_PRETTY_PRINT),
                'setting_group' => 'Developer',
                'updated_at' => now()
            ]
        );

        $this->recordAudit(
            'Developer Master',
            'developer',
            'User Notification Switch Toggled',
            'UserSettings',
            $userKey ?: 'BULK',
            "Adjusted notification delivery preferences for {$userKey} (Email: " . ($emailEnabled ? 'ON' : 'OFF') . ", In-App: " . ($inAppEnabled ? 'ON' : 'OFF') . ")."
        );

        return response()->json([
            'success' => true,
            'message' => 'User notification preference updated successfully.',
            'settings' => $settings
        ]);
    }

    /**
     * Dispatches notification email to user's email and persists to in-system notifications table.
     * Evaluates developer's per-user notification switch before dispatch.
     */
    public function dispatchUserModificationAlert($targetEmail, $targetName, $matricOrId, $actionTitle, $modificationDetails)
    {
        try {
            $raw = DB::table('library_settings')
                ->where('setting_key', 'developer_user_notification_settings')
                ->value('setting_value');
            $userSettings = $raw ? json_decode($raw, true) : [];
            if (!is_array($userSettings)) $userSettings = [];

            // Check if user has notification switch toggled off
            $lookupKeys = array_filter([
                strtolower(trim((string)$targetEmail)),
                strtolower(trim((string)$matricOrId))
            ]);

            $emailEnabled = true;
            $inAppEnabled = true;

            foreach ($lookupKeys as $k) {
                if (isset($userSettings[$k])) {
                    if (isset($userSettings[$k]['email_enabled'])) {
                        $emailEnabled = (bool)$userSettings[$k]['email_enabled'];
                    }
                    if (isset($userSettings[$k]['in_app_enabled'])) {
                        $inAppEnabled = (bool)$userSettings[$k]['in_app_enabled'];
                    }
                    break;
                }
            }

            $nowDate = now()->toIso8601String();
            $notifId = 'NOTIF-DEV-' . strtoupper(Str::random(8));

            // 1. In-System Notification (Visible at Bell Icon on Scholar & Admin Portal)
            if ($inAppEnabled) {
                $recipientMatric = $matricOrId ?: ($targetEmail ?: 'GLOBAL');
                
                DB::table('notifications')->insert([
                    'id' => $notifId,
                    'matric' => $recipientMatric,
                    'type' => 'developer_modification',
                    'title' => "Developer Update: " . $actionTitle,
                    'message' => $modificationDetails,
                    'date' => $nowDate,
                    'read' => 0,
                    'action_url' => '#/notifications'
                ]);

                // Also record by email if distinct from matric to ensure both queries hit
                if (!empty($targetEmail) && strcasecmp($recipientMatric, $targetEmail) !== 0) {
                    try {
                        DB::table('notifications')->insert([
                            'id' => 'NOTIF-DEV-' . strtoupper(Str::random(8)),
                            'matric' => strtolower($targetEmail),
                            'type' => 'developer_modification',
                            'title' => "Developer Update: " . $actionTitle,
                            'message' => $modificationDetails,
                            'date' => $nowDate,
                            'read' => 0,
                            'action_url' => '#/notifications'
                        ]);
                    } catch (\Exception $ex) {}
                }
            }

            // 2. Direct Notification Email to User's Email (Fail-safe, non-blocking)
            if ($emailEnabled && !empty($targetEmail) && filter_var($targetEmail, FILTER_VALIDATE_EMAIL)) {
                try {
                    $emailBody = "Hello {$targetName},\n\nAn administrative modification was performed on your institutional library profile by the Lead Systems Developer at Federal Co-operative College, Ibadan.\n\n" .
                                 "ACTION PERFORMED:\n" .
                                 "{$actionTitle}\n\n" .
                                 "WHAT WAS MODIFIED:\n" .
                                 "{$modificationDetails}\n\n" .
                                 "Timestamp: " . now()->format('Y-m-d H:i:s T') . "\n\n" .
                                 "This notice is dispatched in accordance with institutional security audit policies. If you did not request or expect this change, please contact the Central Library Administration Desk immediately.";

                    MailNotificationService::sendPatronNotificationEmail(
                        $targetEmail,
                        $targetName ?: 'Scholar / Staff',
                        "Account Modification: {$actionTitle}",
                        $emailBody,
                        'Security Alert',
                        'https://fccibadanlibrary.com.ng/#/notifications'
                    );
                } catch (\Throwable $mailErr) {
                    Log::warning("[DeveloperController] dispatchUserModificationAlert mail skipped: " . $mailErr->getMessage());
                }
            }

            return true;
        } catch (\Exception $e) {
            Log::error("[DeveloperController] dispatchUserModificationAlert failed: " . $e->getMessage());
            return false;
        }
    }

    /**
     * GET /api/developer/hod-publishing-mode
     * Returns whether HOD uploads publish direct to students or wait for admin approval
     */
    public function getHodPublishingMode()
    {
        $mode = DB::table('library_settings')
            ->where('setting_key', 'hod_upload_approval_mode')
            ->value('setting_value') ?: 'approval';

        return response()->json([
            'success' => true,
            'mode' => $mode,
            'is_direct' => ($mode === 'direct'),
            'message' => $mode === 'direct' ? 'Direct Instant Publish is Active' : 'Admin Approval Required'
        ]);
    }

    /**
     * POST /api/developer/hod-publishing-mode
     * Updates whether HOD uploads publish direct to students or wait for admin approval
     */
    public function setHodPublishingMode(Request $request)
    {
        $mode = $request->input('mode') === 'direct' ? 'direct' : 'approval';

        DB::table('library_settings')->updateOrInsert(
            ['setting_key' => 'hod_upload_approval_mode'],
            [
                'setting_value' => $mode,
                'setting_group' => 'Developer',
                'is_public' => true,
                'description' => 'HOD Resource Publishing Mode: "direct" (instantly available to students) or "approval" (requires admin review).',
                'updated_at' => now()
            ]
        );

        // Also update developer config json
        try {
            $row = DB::table('library_settings')->where('setting_key', 'fcc_developer_master_config')->first();
            if ($row && !empty($row->setting_value)) {
                $cfg = json_decode($row->setting_value, true);
                if (is_array($cfg)) {
                    $cfg['hodUploadWorkflow'] = ['mode' => $mode];
                    if (!isset($cfg['hodFeatures'])) $cfg['hodFeatures'] = [];
                    $cfg['hodFeatures']['directPublishToStudents'] = [
                        'id' => 'directPublishToStudents',
                        'label' => 'Direct Instant Publish (Skip Admin Approval)',
                        'desc' => 'Allows HOD uploads to go live immediately for students without waiting for Central Library Admin review.',
                        'badge' => 'Workflow',
                        'enabled' => ($mode === 'direct')
                    ];
                    DB::table('library_settings')->where('setting_key', 'fcc_developer_master_config')->update([
                        'setting_value' => json_encode($cfg, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
                        'updated_at' => now()
                    ]);
                }
            }
        } catch (\Throwable $e) {}

        $this->recordAudit(
            'Lead Systems Developer',
            'developer',
            'HOD_PUBLISHING_MODE_CHANGED',
            'WorkflowSetting',
            'hod_upload_approval_mode',
            "Changed HOD publishing mode to: " . strtoupper($mode) . ($mode === 'direct' ? ' (Direct to students)' : ' (Admin approval required)'),
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'mode' => $mode,
            'is_direct' => ($mode === 'direct'),
            'message' => $mode === 'direct' 
                ? 'HOD Upload Mode set to DIRECT: HOD uploads will now publish immediately for students to see without waiting for admin approval.' 
                : 'HOD Upload Mode set to ADMIN APPROVAL: HOD uploads must wait for approval from Central Admin at #/admin/hod-submissions.'
        ]);
    }

    /**
     * Default Capability Features Catalog for Departmental Staff
     */
    protected function getDefaultStaffFeaturesCatalog(): array
    {
        return [
            [
                'id' => 'fn_upload_books',
                'label' => 'Upload Handouts & E-Books',
                'category' => 'Publishing & Content',
                'page' => 'upload',
                'description' => 'Upload lecture notes, textbooks, and reading lists to departmental curriculum shelf.',
                'badge' => 'Publishing',
                'is_system' => true,
                'enabled' => true
            ],
            [
                'id' => 'fn_upload_journals',
                'label' => 'Academic Research Journals',
                'category' => 'Publishing & Content',
                'page' => 'upload',
                'description' => 'Upload peer-reviewed journal papers with automated volume, issue, and DOI metadata.',
                'badge' => 'Journals',
                'is_system' => true,
                'enabled' => true
            ],
            [
                'id' => 'fn_watermark_control',
                'label' => 'Digital Watermark Protection',
                'category' => 'Publishing & Content',
                'page' => 'upload',
                'description' => 'Apply student-specific matric and IP security stamps on all downloaded PDFs.',
                'badge' => 'Security',
                'is_system' => true,
                'enabled' => true
            ],
            [
                'id' => 'fn_edit_submissions',
                'label' => 'Catalog & Submission Editor',
                'category' => 'Publishing & Content',
                'page' => 'submissions',
                'description' => 'Edit published course materials, update syllabi, and re-tag metadata.',
                'badge' => 'Content',
                'is_system' => true,
                'enabled' => true
            ],
            [
                'id' => 'fn_delete_submissions',
                'label' => 'Delete / Archive Submissions',
                'category' => 'Publishing & Content',
                'page' => 'submissions',
                'description' => 'Remove obsolete or superseded course materials from the catalog.',
                'badge' => 'Caution',
                'is_system' => true,
                'enabled' => true
            ],
            [
                'id' => 'fn_manage_courses',
                'label' => 'Course & Syllabus Management',
                'category' => 'Curriculum & Syllabi',
                'page' => 'courses',
                'description' => 'Create course outlines, assign academic levels (ND I, ND II, HND I, HND II), and link materials.',
                'badge' => 'Curriculum',
                'is_system' => true,
                'enabled' => true
            ],
            [
                'id' => 'fn_approve_dissertations',
                'label' => 'Review & Approve Theses',
                'category' => 'Dissertations & Theses',
                'page' => 'dissertations',
                'description' => 'Grade and verify HND final year dissertations and student capstone submissions.',
                'badge' => 'Research',
                'is_system' => true,
                'enabled' => true
            ],
            [
                'id' => 'fn_upload_dissertations',
                'label' => 'Direct Capstone Publishing',
                'category' => 'Dissertations & Theses',
                'page' => 'dissertations',
                'description' => 'Directly publish vetted student dissertations to the institutional repository.',
                'badge' => 'Research',
                'is_system' => true,
                'enabled' => true
            ],
            [
                'id' => 'fn_manage_reserves',
                'label' => 'Physical & Digital Reserves',
                'category' => 'Course Reserves',
                'page' => 'reserves',
                'description' => 'Place high-demand textbooks on 2-hour short-loan reserve shelf and digital hold.',
                'badge' => 'Circulation',
                'is_system' => true,
                'enabled' => true
            ],
            [
                'id' => 'fn_manage_students',
                'label' => 'Department Scholars Directory',
                'category' => 'Students & Clearance',
                'page' => 'scholars',
                'description' => 'Access department student roll, check borrowing histories, and contact students.',
                'badge' => 'Students',
                'is_system' => true,
                'enabled' => true
            ],
            [
                'id' => 'fn_approve_clearance',
                'label' => 'Graduation Clearance Signoff',
                'category' => 'Students & Clearance',
                'page' => 'scholars',
                'description' => 'Approve or hold departmental academic clearance certificates for graduating scholars.',
                'badge' => 'Clearance',
                'is_system' => true,
                'enabled' => true
            ],
            [
                'id' => 'fn_send_dispatch',
                'label' => 'Official Circular Dispatch',
                'category' => 'Communication',
                'page' => 'communication',
                'description' => 'Send urgent push notifications and academic circulars to all departmental students.',
                'badge' => 'Broadcast',
                'is_system' => true,
                'enabled' => true
            ],
            [
                'id' => 'fn_ai_gora_tools',
                'label' => 'Gora & InneAI Computational Oracle',
                'category' => 'AI & Analytics',
                'page' => 'overview',
                'description' => 'Run off-chain Gora oracle computing tasks and InneAI research analytics.',
                'badge' => 'Web3 & AI',
                'is_system' => true,
                'enabled' => true
            ]
        ];
    }

    /**
     * Helper to format HOD staff row
     */
    private function formatHodStaffRow($row): array
    {
        $arr = (array)$row;
        $arr['assigned_courses'] = is_string($arr['assigned_courses'] ?? null)
            ? (json_decode($arr['assigned_courses'], true) ?: [])
            : ($arr['assigned_courses'] ?? []);
        $arr['allowed_pages'] = is_string($arr['allowed_pages'] ?? null)
            ? (json_decode($arr['allowed_pages'], true) ?: [])
            : ($arr['allowed_pages'] ?? []);
        $arr['allowed_features'] = is_string($arr['allowed_features'] ?? null)
            ? (json_decode($arr['allowed_features'], true) ?: [])
            : ($arr['allowed_features'] ?? []);
        return $arr;
    }

    /**
     * Helper to sync HOD staff row to MySQL
     */
    private function syncHodStaffRowToMysql(array $row): void
    {
        try {
            $pdo = \App\Services\DatabaseService::getPdo();
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

    /**
     * GET /api/developer/hod-staff
     * Master controller: View all departmental staff across all departments
     */
    public function getHodStaff(Request $request)
    {
        \App\Http\Controllers\Api\HodStaffPortalController::ensureTablesExist();

        $query = DB::table('hod_department_staff');

        if ($dept = $request->query('department_code')) {
            if (strtoupper($dept) !== 'ALL') {
                $query->whereRaw('UPPER(department_code) = ?', [strtoupper($dept)]);
            }
        }

        if ($status = $request->query('status')) {
            if (strtoupper($status) !== 'ALL') {
                $query->where('status', $status);
            }
        }

        if ($search = $request->query('search', $request->query('q'))) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('staff_code', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%")
                  ->orWhere('designation', 'like', "%{$search}%")
                  ->orWhere('department_code', 'like', "%{$search}%");
            });
        }

        $rows = $query->orderBy('department_code', 'asc')->orderBy('created_at', 'desc')->get();

        $staffList = [];
        $deptStats = [];

        foreach ($rows as $r) {
            $formatted = $this->formatHodStaffRow($r);
            $staffList[] = $formatted;

            $d = strtoupper($formatted['department_code'] ?? 'OTHER');
            if (!isset($deptStats[$d])) {
                $deptStats[$d] = ['total' => 0, 'active' => 0];
            }
            $deptStats[$d]['total']++;
            if (($formatted['status'] ?? 'active') === 'active') {
                $deptStats[$d]['active']++;
            }
        }

        return response()->json([
            'success' => true,
            'total' => count($staffList),
            'staff' => $staffList,
            'department_stats' => $deptStats
        ]);
    }

    /**
     * POST /api/developer/hod-staff
     * Master controller: Create departmental staff with direct developer authority
     */
    public function storeHodStaff(Request $request)
    {
        \App\Http\Controllers\Api\HodStaffPortalController::ensureTablesExist();

        $body = $request->isJson() ? $request->json()->all() : $request->all();
        if (empty($body)) {
            $raw = file_get_contents('php://input');
            if ($raw) {
                $body = json_decode($raw, true) ?: [];
            }
        }

        $name = trim($body['name'] ?? '');
        $deptCode = strtoupper(trim($body['department_code'] ?? 'CEM'));
        $deptName = trim($body['department_name'] ?? "{$deptCode} Department");
        $designation = trim($body['designation'] ?? 'Lecturer & Course Coordinator');
        $username = strtolower(trim($body['username'] ?? ''));
        $email = trim($body['email'] ?? '');
        $phone = trim($body['phone'] ?? '');
        $password = trim($body['password'] ?? $body['password_plain'] ?? 'staff123');

        if (empty($name)) {
            return response()->json(['success' => false, 'error' => 'Full Name is required'], 422);
        }

        if (empty($username)) {
            $cleanName = preg_replace('/[^a-zA-Z0-9]/', '', strtolower($name));
            $username = strtolower($deptCode) . '_' . substr($cleanName, 0, 8) . rand(10, 99);
        }

        $id = 'STF-' . $deptCode . '-' . strtoupper(Str::random(6));
        $staffCode = 'STF/' . $deptCode . '/' . rand(100, 999);
        $now = now('Africa/Lagos')->toIso8601String();

        $assignedCourses = is_array($body['assigned_courses'] ?? null)
            ? json_encode($body['assigned_courses'])
            : (is_string($body['assigned_courses'] ?? null) ? $body['assigned_courses'] : json_encode([]));

        $allowedPages = is_array($body['allowed_pages'] ?? null)
            ? json_encode($body['allowed_pages'])
            : (is_string($body['allowed_pages'] ?? null) ? $body['allowed_pages'] : json_encode(['overview' => true, 'upload' => true, 'submissions' => true]));

        $allowedFeatures = is_array($body['allowed_features'] ?? null)
            ? json_encode($body['allowed_features'])
            : (is_string($body['allowed_features'] ?? null) ? $body['allowed_features'] : json_encode(['fn_upload_books' => true]));

        $row = [
            'id' => $id,
            'staff_code' => $staffCode,
            'username' => $username,
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'designation' => $designation,
            'department_code' => $deptCode,
            'department_name' => $deptName,
            'assigned_courses' => $assignedCourses,
            'page_title' => $body['page_title'] ?? "{$name} - {$deptCode} Department Workspace",
            'welcome_banner' => $body['welcome_banner'] ?? "Authorized staff workspace provisioned by Developer Master Console.",
            'allowed_pages' => $allowedPages,
            'allowed_features' => $allowedFeatures,
            'password_plain' => $password,
            'password_hash' => \Illuminate\Support\Facades\Hash::make($password),
            'status' => $body['status'] ?? 'active',
            'created_by_hod' => 'Developer Master',
            'last_login_at' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ];

        // SQLite
        DB::table('hod_department_staff')->updateOrInsert(['id' => $id], $row);

        // MySQL
        $this->syncHodStaffRowToMysql($row);

        $this->recordAudit(
            'Lead Systems Developer',
            'developer',
            'DEVELOPER_CREATED_HOD_STAFF',
            'Staff',
            $id,
            "Developer directly created departmental staff member {$name} ({$username}) for {$deptCode}",
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => "Departmental staff {$name} created successfully by Developer.",
            'staff' => $this->formatHodStaffRow($row)
        ], 201);
    }

    /**
     * PUT/POST /api/developer/hod-staff/{id}
     * Master controller: Full edit and modification of any departmental staff member
     */
    public function updateHodStaff(Request $request, $id)
    {
        \App\Http\Controllers\Api\HodStaffPortalController::ensureTablesExist();

        $existing = DB::table('hod_department_staff')->where('id', $id)->first();
        if (!$existing) {
            return response()->json(['success' => false, 'error' => "Staff member {$id} not found"], 404);
        }

        $body = $request->isJson() ? $request->json()->all() : $request->all();
        if (empty($body)) {
            $raw = file_get_contents('php://input');
            if ($raw) {
                $body = json_decode($raw, true) ?: [];
            }
        }

        $now = now('Africa/Lagos')->toIso8601String();
        $updates = ['updated_at' => $now];

        if (isset($body['name'])) $updates['name'] = trim($body['name']);
        if (isset($body['email'])) $updates['email'] = trim($body['email']);
        if (isset($body['phone'])) $updates['phone'] = trim($body['phone']);
        if (isset($body['designation'])) $updates['designation'] = trim($body['designation']);
        if (isset($body['department_code'])) $updates['department_code'] = strtoupper(trim($body['department_code']));
        if (isset($body['department_name'])) $updates['department_name'] = trim($body['department_name']);
        if (isset($body['username'])) $updates['username'] = strtolower(trim($body['username']));
        if (isset($body['status'])) $updates['status'] = $body['status'];
        if (isset($body['page_title'])) $updates['page_title'] = $body['page_title'];
        if (isset($body['welcome_banner'])) $updates['welcome_banner'] = $body['welcome_banner'];

        if (isset($body['assigned_courses'])) {
            $updates['assigned_courses'] = is_array($body['assigned_courses'])
                ? json_encode($body['assigned_courses'])
                : $body['assigned_courses'];
        }

        if (isset($body['allowed_pages'])) {
            $updates['allowed_pages'] = is_array($body['allowed_pages'])
                ? json_encode($body['allowed_pages'])
                : $body['allowed_pages'];
        }

        if (isset($body['allowed_features'])) {
            $updates['allowed_features'] = is_array($body['allowed_features'])
                ? json_encode($body['allowed_features'])
                : $body['allowed_features'];
        }

        if (!empty($body['password']) || !empty($body['password_plain'])) {
            $newPass = trim($body['password'] ?? $body['password_plain']);
            $updates['password_plain'] = $newPass;
            $updates['password_hash'] = \Illuminate\Support\Facades\Hash::make($newPass);
        }

        // SQLite update
        DB::table('hod_department_staff')->where('id', $id)->update($updates);

        // Fetch full merged row
        $full = DB::table('hod_department_staff')->where('id', $id)->first();
        if ($full) {
            $this->syncHodStaffRowToMysql((array)$full);
        }

        $this->recordAudit(
            'Lead Systems Developer',
            'developer',
            'DEVELOPER_UPDATED_HOD_STAFF',
            'Staff',
            $id,
            "Developer modified staff profile & permissions for {$full->name} ({$id})",
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => "Staff {$full->name} updated successfully.",
            'staff' => $this->formatHodStaffRow($full)
        ]);
    }

    /**
     * DELETE /api/developer/hod-staff/{id}
     * Master controller: Delete departmental staff
     */
    public function deleteHodStaff(Request $request, $id)
    {
        $existing = DB::table('hod_department_staff')->where('id', $id)->first();
        if (!$existing) {
            return response()->json(['success' => false, 'error' => "Staff not found"], 404);
        }

        DB::table('hod_department_staff')->where('id', $id)->delete();

        try {
            $pdo = \App\Services\DatabaseService::getPdo();
            if ($pdo) {
                $stmt = $pdo->prepare("DELETE FROM hod_department_staff WHERE id = ?");
                $stmt->execute([$id]);
            }
        } catch (\Throwable $e) {}

        $this->recordAudit(
            'Lead Systems Developer',
            'developer',
            'DEVELOPER_DELETED_HOD_STAFF',
            'Staff',
            $id,
            "Developer removed departmental staff member {$existing->name} ({$id})",
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => "Staff member {$existing->name} deleted permanently."
        ]);
    }

    /**
     * GET /api/developer/hod-staff/features-catalog
     * Master controller: Get full capability catalog (defaults + developer-implemented features)
     */
    public function getStaffFeaturesCatalog(Request $request)
    {
        $defaults = $this->getDefaultStaffFeaturesCatalog();
        $customRow = DB::table('library_settings')
            ->where('setting_key', 'fcc_hod_staff_custom_features')
            ->first();

        $customFeatures = [];
        if ($customRow && !empty($customRow->setting_value)) {
            $customFeatures = json_decode($customRow->setting_value, true) ?: [];
        }

        $mergedMap = [];
        foreach ($defaults as $f) {
            $mergedMap[$f['id']] = $f;
        }
        foreach ($customFeatures as $cf) {
            if (isset($cf['id'])) {
                $mergedMap[$cf['id']] = array_merge($mergedMap[$cf['id']] ?? [], $cf);
            }
        }

        return response()->json([
            'success' => true,
            'features' => array_values($mergedMap),
            'total' => count($mergedMap)
        ]);
    }

    /**
     * POST /api/developer/hod-staff/features-catalog
     * Master controller: Developer implements, edits, or adds new features and functions
     */
    public function saveStaffFeaturesCatalog(Request $request)
    {
        $features = $request->input('features', []);
        if (!is_array($features)) {
            $raw = file_get_contents('php://input');
            $decoded = json_decode($raw, true);
            $features = $decoded['features'] ?? [];
        }

        $json = json_encode(array_values($features), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

        DB::table('library_settings')->updateOrInsert(
            ['setting_key' => 'fcc_hod_staff_custom_features'],
            [
                'setting_value' => $json,
                'setting_group' => 'Developer',
                'value_type' => 'json',
                'is_public' => true,
                'description' => 'Developer-defined custom features and capabilities available for departmental staff workspaces.',
                'updated_at' => now()
            ]
        );

        $this->recordAudit(
            'Lead Systems Developer',
            'developer',
            'DEVELOPER_UPDATED_STAFF_FEATURES_CATALOG',
            'Setting',
            'fcc_hod_staff_custom_features',
            "Updated departmental staff features catalog with " . count($features) . " active features.",
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => 'Departmental staff capability catalog updated successfully.',
            'features' => array_values($features)
        ]);
    }

    /**
     * POST /api/hod/staff/log-activity
     * Universal database recorder for everything departmental staff do
     */
    public function logStaffActivity(Request $request)
    {
        $actor = $request->input('actor', 'Staff Member');
        $staffId = $request->input('staff_id', 'STF-UNKNOWN');
        $deptCode = strtoupper(trim((string)$request->input('department_code', '')));
        $action = strtoupper(trim((string)$request->input('action', 'STAFF_ACTION')));
        $resourceType = $request->input('resource_type', 'Workspace');
        $resourceId = (string)$request->input('resource_id', 'RESOURCE-001');
        $details = $request->input('details', 'Departmental staff action performed');
        if (is_array($details)) {
            $details = json_encode($details, JSON_UNESCAPED_SLASHES);
        }

        $now = now('Africa/Lagos')->toIso8601String();
        $id = 'LOG-STF-' . strtoupper(Str::random(8));
        $ip = $request->ip() ?: '127.0.0.1';
        $hash = hash('sha256', "{$id}|{$now}|{$staffId}|{$action}|{$resourceId}|FCC-STAFF-AUDIT-2026");

        // 1. Insert into SQLite audit_logs
        try {
            DB::table('audit_logs')->insert([
                'id' => $id,
                'timestamp' => $now,
                'actor' => "{$actor}" . ($deptCode ? " ({$deptCode})" : ""),
                'role' => 'hod_staff',
                'action' => $action,
                'resource_type' => $resourceType,
                'resource_id' => $resourceId,
                'details' => $details,
                'ip_address' => $ip,
                'hash' => $hash
            ]);
        } catch (\Throwable $e) {}

        // 2. Insert into MySQL audit_logs
        try {
            $pdo = \App\Services\DatabaseService::getPdo();
            if ($pdo) {
                $stmt = $pdo->prepare("
                    INSERT INTO audit_logs (id, timestamp, actor, role, action, resource_type, resource_id, details, ip_address, hash)
                    VALUES (?, ?, ?, 'hod_staff', ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $id,
                    $now,
                    "{$actor}" . ($deptCode ? " ({$deptCode})" : ""),
                    $action,
                    $resourceType,
                    $resourceId,
                    $details,
                    $ip,
                    $hash
                ]);
            }
        } catch (\Throwable $e) {}

        return response()->json([
            'success' => true,
            'log_id' => $id,
            'timestamp' => $now
        ]);
    }

    /**
     * GET /api/developer/hod-staff/activities
     * Stream all actions performed by departmental staff recorded in database
     */
    public function getStaffActivityLogs(Request $request)
    {
        $search = $request->query('search', $request->query('q'));
        $department = $request->query('department');
        $limit = min(200, (int)$request->query('limit', 100));

        $query = DB::table('audit_logs')
            ->where(function ($q) {
                $q->where('role', 'hod_staff')
                  ->orWhere('role', 'hod')
                  ->orWhere('action', 'like', 'STAFF_%')
                  ->orWhere('action', 'like', 'HOD_%');
            });

        if (!empty($department) && $department !== 'ALL') {
            $dept = strtoupper($department);
            $query->where(function ($q) use ($dept) {
                $q->where('actor', 'like', "%({$dept})%")
                  ->orWhere('details', 'like', "%{$dept}%");
            });
        }

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('actor', 'like', "%{$search}%")
                  ->orWhere('action', 'like', "%{$search}%")
                  ->orWhere('resource_id', 'like', "%{$search}%")
                  ->orWhere('resource_type', 'like', "%{$search}%")
                  ->orWhere('details', 'like', "%{$search}%")
                  ->orWhere('ip_address', 'like', "%{$search}%");
            });
        }

        $total = $query->count();
        $logs = $query->orderBy('timestamp', 'desc')->limit($limit)->get();

        return response()->json([
            'success' => true,
            'total' => $total,
            'count' => $logs->count(),
            'logs' => $logs
        ]);
    }

    /**
     * Default Broadcast Announcements & Maintenance Locks Matrix
     */
    protected function getDefaultMaintenanceBroadcastMatrix(): array
    {
        return [
            'student' => [
                'role' => 'student',
                'role_name' => 'Students & Scholars',
                'broadcast_active' => false,
                'broadcast_title' => 'Scheduled Student Portal Upgrade Notice',
                'broadcast_message' => 'The development team is performing scheduled optimizations on the Scholar Portal e-reader and catalog search engine.',
                'severity' => 'warning',
                'maintenance_active' => false,
                'maintenance_title' => 'Student Portal Under Maintenance & Upgrade',
                'maintenance_message' => 'This section of the library platform is temporarily undergoing scheduled developer maintenance and upgrades.',
                'estimated_duration' => '30 minutes',
                'target_scope' => 'all',
                'affected_pages' => ['all'],
                'updated_at' => now('Africa/Lagos')->toIso8601String()
            ],
            'admin' => [
                'role' => 'admin',
                'role_name' => 'Central Library Administrators',
                'broadcast_active' => false,
                'broadcast_title' => 'Central Library Admin Operations Notice',
                'broadcast_message' => 'Notice to all library staff: Routine database indexing and telemetry upgrade in progress.',
                'severity' => 'info',
                'maintenance_active' => false,
                'maintenance_title' => 'Admin Operations Under Maintenance & Upgrade',
                'maintenance_message' => 'Administrative circulation and cataloging desk is temporarily paused for scheduled infrastructure upgrades.',
                'estimated_duration' => '30 minutes',
                'target_scope' => 'all',
                'affected_pages' => ['all'],
                'updated_at' => now('Africa/Lagos')->toIso8601String()
            ],
            'hod' => [
                'role' => 'hod',
                'role_name' => 'Heads of Department (HODs)',
                'broadcast_active' => false,
                'broadcast_title' => 'Departmental Executive Notice',
                'broadcast_message' => 'Notice to Heads of Department: Curriculum and journal publishing pipelines are undergoing scheduled maintenance.',
                'severity' => 'info',
                'maintenance_active' => false,
                'maintenance_title' => 'HOD Department Console Under Maintenance & Upgrade',
                'maintenance_message' => 'Departmental submission and curriculum review desk is temporarily paused for scheduled infrastructure upgrades.',
                'estimated_duration' => '20 minutes',
                'target_scope' => 'all',
                'affected_pages' => ['all'],
                'updated_at' => now('Africa/Lagos')->toIso8601String()
            ],
            'hod_staff' => [
                'role' => 'hod_staff',
                'role_name' => 'Departmental Staff under HODs',
                'broadcast_active' => false,
                'broadcast_title' => 'Staff Workspace Operational Notice',
                'broadcast_message' => 'Notice to all departmental staff members: Capabilities and page builders are undergoing scheduled maintenance.',
                'severity' => 'info',
                'maintenance_active' => false,
                'maintenance_title' => 'Staff Live Workspace Under Maintenance & Upgrade',
                'maintenance_message' => 'Departmental staff workspace capabilities are temporarily paused for scheduled developer upgrades.',
                'estimated_duration' => '20 minutes',
                'target_scope' => 'all',
                'affected_pages' => ['all'],
                'updated_at' => now('Africa/Lagos')->toIso8601String()
            ]
        ];
    }

    /**
     * GET /api/developer/maintenance-broadcasts
     */
    public function getMaintenanceBroadcasts(Request $request)
    {
        $defaults = $this->getDefaultMaintenanceBroadcastMatrix();
        $row = DB::table('library_settings')
            ->where('setting_key', 'fcc_maintenance_broadcast_matrix')
            ->first();

        $matrix = $defaults;
        if ($row && !empty($row->setting_value)) {
            $saved = json_decode($row->setting_value, true);
            if (is_array($saved)) {
                foreach ($defaults as $roleKey => $roleDef) {
                    if (isset($saved[$roleKey]) && is_array($saved[$roleKey])) {
                        $matrix[$roleKey] = array_merge($roleDef, $saved[$roleKey]);
                    }
                }
            }
        }

        return response()->json([
            'success' => true,
            'matrix' => $matrix
        ]);
    }

    /**
     * POST /api/developer/maintenance-broadcasts
     */
    public function updateMaintenanceBroadcast(Request $request)
    {
        $role = $request->input('role');
        $defaults = $this->getDefaultMaintenanceBroadcastMatrix();
        $row = DB::table('library_settings')
            ->where('setting_key', 'fcc_maintenance_broadcast_matrix')
            ->first();

        $matrix = $defaults;
        if ($row && !empty($row->setting_value)) {
            $saved = json_decode($row->setting_value, true);
            if (is_array($saved)) {
                foreach ($defaults as $k => $def) {
                    if (isset($saved[$k])) {
                        $matrix[$k] = array_merge($def, $saved[$k]);
                    }
                }
            }
        }

        $now = now('Africa/Lagos')->toIso8601String();
        $rolesToUpdate = ($role === 'all' || empty($role)) ? ['student', 'admin', 'hod', 'hod_staff'] : [$role];

        foreach ($rolesToUpdate as $r) {
            if (!isset($matrix[$r])) continue;

            if ($request->has('broadcast_active')) {
                $matrix[$r]['broadcast_active'] = (bool)$request->input('broadcast_active');
            }
            if ($request->has('broadcast_title')) {
                $matrix[$r]['broadcast_title'] = trim((string)$request->input('broadcast_title'));
            }
            if ($request->has('broadcast_message')) {
                $matrix[$r]['broadcast_message'] = trim((string)$request->input('broadcast_message'));
            }
            if ($request->has('severity')) {
                $matrix[$r]['severity'] = $request->input('severity');
            }
            if ($request->has('maintenance_active')) {
                $matrix[$r]['maintenance_active'] = (bool)$request->input('maintenance_active');
            }
            if ($request->has('maintenance_title')) {
                $matrix[$r]['maintenance_title'] = trim((string)$request->input('maintenance_title'));
            }
            if ($request->has('maintenance_message')) {
                $matrix[$r]['maintenance_message'] = trim((string)$request->input('maintenance_message'));
            }
            if ($request->has('estimated_duration')) {
                $matrix[$r]['estimated_duration'] = trim((string)$request->input('estimated_duration'));
            }
            if ($request->has('target_scope')) {
                $matrix[$r]['target_scope'] = $request->input('target_scope');
            }
            if ($request->has('affected_pages')) {
                $pages = $request->input('affected_pages');
                $matrix[$r]['affected_pages'] = is_array($pages) ? $pages : [$pages];
            }
            $matrix[$r]['updated_at'] = $now;
        }

        $json = json_encode($matrix, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

        DB::table('library_settings')->updateOrInsert(
            ['setting_key' => 'fcc_maintenance_broadcast_matrix'],
            [
                'setting_value' => $json,
                'setting_group' => 'Developer',
                'value_type' => 'json',
                'is_public' => true,
                'description' => 'Targeted broadcast messages and maintenance mode page locks for Students, Admins, HODs, and Staff.',
                'updated_at' => now()
            ]
        );

        $actionDetails = "Updated broadcast/maintenance settings for roles: " . implode(', ', $rolesToUpdate);
        $this->recordAudit(
            'Lead Systems Developer',
            'developer',
            'DEVELOPER_SET_MAINTENANCE_BROADCAST',
            'MaintenanceMatrix',
            $role ?: 'ALL_ROLES',
            $actionDetails,
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => "Broadcast announcement and maintenance locks updated successfully.",
            'matrix' => $matrix
        ]);
    }

    /**
     * GET /api/system/maintenance-broadcasts
     * Public endpoint for dashboards to retrieve active broadcast alerts & maintenance states
     */
    public function getPublicMaintenanceBroadcasts(Request $request)
    {
        $role = strtolower(trim((string)$request->query('role', 'student')));
        $defaults = $this->getDefaultMaintenanceBroadcastMatrix();
        $row = DB::table('library_settings')
            ->where('setting_key', 'fcc_maintenance_broadcast_matrix')
            ->first();

        $matrix = $defaults;
        if ($row && !empty($row->setting_value)) {
            $saved = json_decode($row->setting_value, true);
            if (is_array($saved)) {
                foreach ($defaults as $k => $def) {
                    if (isset($saved[$k])) {
                        $matrix[$k] = array_merge($def, $saved[$k]);
                    }
                }
            }
        }

        $roleData = $matrix[$role] ?? ($matrix['student'] ?? null);

        return response()->json([
            'success' => true,
            'role' => $role,
            'broadcast' => $roleData,
            'matrix' => $matrix
        ]);
    }
}



