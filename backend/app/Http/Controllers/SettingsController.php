<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SettingsController extends Controller
{
    /**
     * GET /api/settings
     * Configurable Library Settings per Prompt 49.
     */
    public function index(Request $request)
    {
        $all = DB::table('library_settings')->get();
        $map = [];
        foreach ($all as $s) {
            $val = $s->setting_value;
            if ($s->value_type === 'integer') $val = (int)$val;
            elseif ($s->value_type === 'boolean') $val = filter_var($val, FILTER_VALIDATE_BOOLEAN);
            elseif ($s->value_type === 'decimal') $val = (float)$val;
            $map[$s->setting_key] = $val;
        }

        return response()->json([
            'settings' => $map,
            'raw' => $all
        ]);
    }

    /**
     * POST /api/settings
     * Update institutional settings dynamically.
     */
    public function update(Request $request)
    {
        $data = $request->all();
        $actor = $request->input('_actor', 'Chief Librarian');
        unset($data['_actor']);

        foreach ($data as $key => $value) {
            if ($key === 'settings' && is_array($value)) {
                foreach ($value as $k => $v) {
                    DB::table('library_settings')->updateOrInsert(
                        ['setting_key' => $k],
                        ['setting_value' => (string)$v, 'updated_at' => now()]
                    );
                }
            } else {
                DB::table('library_settings')->updateOrInsert(
                    ['setting_key' => $key],
                    ['setting_value' => (string)$value, 'updated_at' => now()]
                );
            }
        }

        // Record Audit Log
        DB::table('audit_logs')->insert([
            'id' => 'LOG-' . Str::upper(Str::random(8)),
            'timestamp' => now(),
            'actor' => $actor,
            'role' => 'Administrator',
            'action' => 'Settings Updated',
            'resource_type' => 'SystemSettings',
            'resource_id' => 'GLOBAL_CONFIG',
            'details' => "Updated " . count($data) . " institutional library setting parameters.",
            'ip_address' => $request->ip() ?? '127.0.0.1'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Library settings successfully updated and persisted across system.'
        ]);
    }

    /**
     * GET /api/branches
     * Multi-library branches endpoint (Prompt 48).
     */
    public function getBranches()
    {
        $branches = DB::table('branches')->get();
        return response()->json($branches);
    }

    /**
     * GET /api/institution/config
     * Returns live institutional configuration & delegation permissions
     */
    public function getInstitutionConfig(Request $request)
    {
        $keys = [
            'institution_name',
            'institution_short_name',
            'institution_motto',
            'institution_established',
            'institution_campus',
            'institution_system_version',
            'institution_current_session',
            'institution_current_semester',
            'institution_today_hours',
            'institution_config_permissions'
        ];

        $rows = DB::table('library_settings')->whereIn('setting_key', $keys)->pluck('setting_value', 'setting_key');

        $perms = [
            'admin_allowed' => true,
            'allowed_hod_depts' => ['CSC', 'CEM']
        ];
        if (isset($rows['institution_config_permissions'])) {
            $decoded = json_decode($rows['institution_config_permissions'], true);
            if (is_array($decoded)) {
                $perms = array_merge($perms, $decoded);
            }
        }

        $institution = [
            'name'           => $rows['institution_name'] ?? 'Federal Co-operative College, Ibadan',
            'shortName'      => $rows['institution_short_name'] ?? 'FCC Ibadan',
            'motto'          => $rows['institution_motto'] ?? 'Pioneering Co-operative Excellence & Technological Advancement',
            'established'    => isset($rows['institution_established']) ? (int)$rows['institution_established'] : 1943,
            'campus'         => $rows['institution_campus'] ?? 'Eleyele, Ibadan, Oyo State, Nigeria',
            'systemVersion'  => $rows['institution_system_version'] ?? 'v4.8-LSP Enterprise (Localhost Edition)',
            'currentSession' => $rows['institution_current_session'] ?? '2026/2027 Academic Session',
            'currentSemester'=> $rows['institution_current_semester'] ?? 'Second Semester',
            'todayHours'     => $rows['institution_today_hours'] ?? '08:00 AM – 08:00 PM (Extended Exam Hours: 24/7 Virtual Hub)'
        ];

        return response()->json([
            'success' => true,
            'institution' => $institution,
            'permissions' => $perms
        ]);
    }

    /**
     * POST /api/institution/config
     * Set institution parameters by Admin or assigned HODs
     */
    public function updateInstitutionConfig(Request $request)
    {
        // Check permissions
        $devPass = $request->header('X-Developer-Passkey');
        $isDev = ($devPass === 'FCC@DevMaster2026!#');

        $rows = DB::table('library_settings')->where('setting_key', 'institution_config_permissions')->value('setting_value');
        $perms = [
            'admin_allowed' => true,
            'allowed_hod_depts' => ['CSC', 'CEM']
        ];
        if ($rows) {
            $decoded = json_decode($rows, true);
            if (is_array($decoded)) $perms = array_merge($perms, $decoded);
        }

        $role = $request->input('role', 'admin');
        $department = $request->input('department', '');
        $actor = $request->input('actor', 'Chief Librarian');

        if (!$isDev) {
            if ($role === 'admin' && empty($perms['admin_allowed'])) {
                return response()->json([
                    'success' => false,
                    'error' => 'PERMISSION DENIED: Institutional configuration editing has not been granted to Administrator by Developer.'
                ], 403);
            }
            if ($role === 'hod') {
                $allowed = false;
                foreach ($perms['allowed_hod_depts'] as $d) {
                    if (strcasecmp($d, $department) === 0 || (strlen($d) > 1 && str_contains(strtolower($department), strtolower($d)))) {
                        $allowed = true;
                        break;
                    }
                }
                if (!$allowed) {
                    return response()->json([
                        'success' => false,
                        'error' => "PERMISSION DENIED: HOD for department '{$department}' has not been granted authority to edit institutional parameters."
                    ], 403);
                }
            }
        }

        $inst = $request->input('institution', []);
        $fields = [
            'name'           => 'institution_name',
            'shortName'      => 'institution_short_name',
            'motto'          => 'institution_motto',
            'established'    => 'institution_established',
            'campus'         => 'institution_campus',
            'systemVersion'  => 'institution_system_version',
            'currentSession' => 'institution_current_session',
            'currentSemester'=> 'institution_current_semester',
            'todayHours'     => 'institution_today_hours'
        ];

        foreach ($fields as $prop => $key) {
            if (isset($inst[$prop])) {
                DB::table('library_settings')->updateOrInsert(
                    ['setting_key' => $key],
                    [
                        'setting_value' => (string)$inst[$prop],
                        'setting_group' => 'institution',
                        'is_public'     => 1,
                        'updated_at'    => now()
                    ]
                );
            }
        }

        // Record Audit Log
        DB::table('audit_logs')->insert([
            'id' => 'LOG-' . Str::upper(Str::random(8)),
            'timestamp' => now(),
            'actor' => $actor,
            'role' => ucfirst($role),
            'action' => 'Institutional Parameters Updated',
            'resource_type' => 'InstitutionProfile',
            'resource_id' => 'INSTITUTION',
            'details' => "Updated institutional parameters (Session: " . ($inst['currentSession'] ?? '') . ", Semester: " . ($inst['currentSemester'] ?? '') . ")",
            'ip_address' => $request->ip() ?? '127.0.0.1'
        ]);

        return $this->getInstitutionConfig($request);
    }

    /**
     * POST /api/developer/institution/permissions
     * Developer assigns edit permissions to Admin and specific HODs
     */
    public function updateInstitutionPermissions(Request $request)
    {
        $devPass = $request->header('X-Developer-Passkey');
        if ($devPass !== 'FCC@DevMaster2026!#') {
            return response()->json([
                'success' => false,
                'error' => 'ACCESS DENIED: Root Developer Passkey required to assign institutional permissions.'
            ], 401);
        }

        $adminAllowed = $request->boolean('admin_allowed', true);
        $allowedHods = $request->input('allowed_hod_depts', []);

        if (!is_array($allowedHods)) {
            $allowedHods = [];
        }

        $payload = [
            'admin_allowed' => $adminAllowed,
            'allowed_hod_depts' => $allowedHods,
            'updated_at' => now()->toIso8601String()
        ];

        DB::table('library_settings')->updateOrInsert(
            ['setting_key' => 'institution_config_permissions'],
            [
                'setting_value' => json_encode($payload),
                'setting_group' => 'security',
                'is_public'     => 1,
                'updated_at'    => now()
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Institutional edit permissions assigned successfully by Developer.',
            'permissions' => $payload
        ]);
    }
}
