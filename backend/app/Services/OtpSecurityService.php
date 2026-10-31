<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class OtpSecurityService
{
    /**
     * Check if 2FA OTP is paused globally or for a specific user / department / role.
     *
     * @param string|null $identifier Account username, matric, email, or dept code
     * @param string|null $role Role ('admin', 'hod', 'developer', 'student')
     * @param string|null $email Optional verified email address
     * @return bool True if 2FA OTP is paused/bypassed
     */
    public static function isOtpPausedFor(?string $identifier, ?string $role = null, ?string $email = null): bool
    {
        try {
            // 1. Check Global Pause
            $globalSetting = self::getSettingValue('otp_pause_global', '0');
            if ($globalSetting === '1' || $globalSetting === 'true' || $globalSetting === true || $globalSetting === 1) {
                return true;
            }

            // 2. Check Role-Level Pause
            if ($role) {
                $pausedRoles = self::getJsonSetting('otp_paused_roles', []);
                $normalizedRole = strtolower(trim($role));
                if (in_array($normalizedRole, array_map('strtolower', $pausedRoles), true)) {
                    return true;
                }
            }

            // 3. Check Individual User / Department Pause
            $pausedUsers = self::getJsonSetting('otp_paused_users', []);
            if (!empty($pausedUsers)) {
                $candidates = array_filter([
                    $identifier ? strtolower(trim($identifier)) : null,
                    $email ? strtolower(trim($email)) : null,
                ]);

                // Also strip prefixes like 'hod_' or 'STAFF/'
                if ($identifier) {
                    $cleanId = strtolower(trim(str_replace(['hod_', 'hod/', 'hod-', 'staff/', 'dep-'], '', $identifier)));
                    if ($cleanId) $candidates[] = $cleanId;
                }

                foreach ($pausedUsers as $pausedTarget) {
                    $normTarget = strtolower(trim((string)$pausedTarget));
                    if (in_array($normTarget, $candidates, true)) {
                        return true;
                    }
                    // If target is like 'CSC', and candidate is 'hod_csc'
                    foreach ($candidates as $cand) {
                        if ($cand === $normTarget || $cand === "hod_{$normTarget}" || $cand === "dep-{$normTarget}") {
                            return true;
                        }
                    }
                }
            }
        } catch (\Throwable $e) {
            // In case of table query issue, do not block login
        }

        return false;
    }

    /**
     * Fetch complete 2FA OTP configuration, matrix of admins, and matrix of departments
     */
    public static function getOtpMatrix(): array
    {
        $globalPaused = self::getSettingValue('otp_pause_global', '0') === '1';
        $pausedRoles = self::getJsonSetting('otp_paused_roles', []);
        $pausedUsers = self::getJsonSetting('otp_paused_users', []);

        // Retrieve Admin Staff
        $admins = [];
        try {
            $users = DB::table('users')
                ->whereIn('role', ['admin', 'librarian', 'superadmin'])
                ->orWhereNull('role')
                ->select('id', 'name', 'email', 'username', 'role', 'designation', 'phone')
                ->orderBy('id', 'asc')
                ->get();

            foreach ($users as $u) {
                $isPaused = $globalPaused
                    || in_array('admin', $pausedRoles, true)
                    || in_array(strtolower($u->email ?? ''), array_map('strtolower', $pausedUsers), true)
                    || in_array(strtolower($u->username ?? ''), array_map('strtolower', $pausedUsers), true)
                    || in_array((string)$u->id, $pausedUsers, true);

                $admins[] = [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'username' => $u->username ?? 'admin',
                    'role' => $u->role ?? 'admin',
                    'designation' => $u->designation ?? 'Library Administrator',
                    'phone' => $u->phone ?? '',
                    'otp_paused' => $isPaused,
                    'individually_paused' => in_array(strtolower($u->email ?? ''), array_map('strtolower', $pausedUsers), true)
                        || in_array(strtolower($u->username ?? ''), array_map('strtolower', $pausedUsers), true)
                ];
            }
        } catch (\Throwable $e) {}

        // Retrieve Academic Departments & HODs
        $departments = [];
        try {
            $depts = DB::table('departments')
                ->select('id', 'name', 'code', 'hod_name', 'hod_email', 'hod_phone', 'faculty')
                ->orderBy('code', 'asc')
                ->get();

            foreach ($depts as $d) {
                $code = strtolower($d->code);
                $isPaused = $globalPaused
                    || in_array('hod', $pausedRoles, true)
                    || in_array($code, array_map('strtolower', $pausedUsers), true)
                    || in_array("hod_{$code}", array_map('strtolower', $pausedUsers), true)
                    || in_array(strtolower($d->hod_email ?? ''), array_map('strtolower', $pausedUsers), true)
                    || in_array(strtolower($d->id ?? ''), array_map('strtolower', $pausedUsers), true);

                $departments[] = [
                    'id' => $d->id,
                    'code' => $d->code,
                    'name' => $d->name,
                    'hod_name' => $d->hod_name,
                    'hod_email' => $d->hod_email,
                    'hod_phone' => $d->hod_phone ?? '',
                    'faculty' => $d->faculty ?? 'Academic Division',
                    'otp_paused' => $isPaused,
                    'individually_paused' => in_array($code, array_map('strtolower', $pausedUsers), true)
                        || in_array("hod_{$code}", array_map('strtolower', $pausedUsers), true)
                        || in_array(strtolower($d->hod_email ?? ''), array_map('strtolower', $pausedUsers), true)
                ];
            }
        } catch (\Throwable $e) {}

        return [
            'success' => true,
            'global_paused' => $globalPaused,
            'paused_roles' => $pausedRoles,
            'paused_users' => array_values(array_unique($pausedUsers)),
            'admins' => $admins,
            'departments' => $departments,
            'summary' => [
                'total_admins' => count($admins),
                'admins_paused' => count(array_filter($admins, fn($a) => $a['otp_paused'])),
                'total_departments' => count($departments),
                'departments_paused' => count(array_filter($departments, fn($d) => $d['otp_paused'])),
                'status_label' => $globalPaused
                    ? '2FA OTP BYPASS ACTIVE (ALL USERS ENTER WITHOUT OTP)'
                    : 'STRICT 2FA ENFORCED (LIVE CPANEL EMAIL VERIFICATION)'
            ]
        ];
    }

    /**
     * Toggle global 2FA pause
     */
    public static function setGlobalPause(bool $paused, string $actor = 'Developer Master'): array
    {
        self::saveSettingValue('otp_pause_global', $paused ? '1' : '0');
        self::recordAudit(
            $actor,
            $paused ? '2FA Global Pause Activated' : '2FA Global Enforced',
            $paused
                ? 'Developer Master paused Two-Factor OTP for all Admins and HODs. System will allow direct password login without OTP verification.'
                : 'Developer Master re-enforced strict Two-Factor OTP for all users. System requires live email OTP verification.'
        );

        return self::getOtpMatrix();
    }

    /**
     * Toggle individual user or department pause
     */
    public static function setUserPause(string $identifier, bool $paused, string $actor = 'Developer Master'): array
    {
        $pausedUsers = self::getJsonSetting('otp_paused_users', []);
        $target = strtolower(trim($identifier));

        if ($paused) {
            if (!in_array($target, array_map('strtolower', $pausedUsers), true)) {
                $pausedUsers[] = $target;
            }
        } else {
            $pausedUsers = array_values(array_filter($pausedUsers, function ($u) use ($target) {
                return strtolower(trim($u)) !== $target
                    && strtolower(trim($u)) !== "hod_{$target}"
                    && str_replace('hod_', '', strtolower(trim($u))) !== $target;
            }));
        }

        self::saveJsonSetting('otp_paused_users', array_values(array_unique($pausedUsers)));

        self::recordAudit(
            $actor,
            $paused ? "2FA OTP Paused for [{$identifier}]" : "2FA OTP Re-Enforced for [{$identifier}]",
            $paused
                ? "Developer Master granted OTP bypass exception for '{$identifier}'. User can log in with password alone."
                : "Developer Master revoked OTP bypass exception for '{$identifier}'. Strict 2FA email verification is now required."
        );

        return self::getOtpMatrix();
    }

    /**
     * Toggle role-level pause (e.g. 'admin' or 'hod')
     */
    public static function setRolePause(string $role, bool $paused, string $actor = 'Developer Master'): array
    {
        $pausedRoles = self::getJsonSetting('otp_paused_roles', []);
        $targetRole = strtolower(trim($role));

        if ($paused) {
            if (!in_array($targetRole, array_map('strtolower', $pausedRoles), true)) {
                $pausedRoles[] = $targetRole;
            }
        } else {
            $pausedRoles = array_values(array_filter($pausedRoles, fn($r) => strtolower(trim($r)) !== $targetRole));
        }

        self::saveJsonSetting('otp_paused_roles', array_values(array_unique($pausedRoles)));

        self::recordAudit(
            $actor,
            $paused ? "2FA Paused for Role [{$role}]" : "2FA Enforced for Role [{$role}]",
            $paused
                ? "Developer Master paused 2FA OTP for all '{$role}' accounts."
                : "Developer Master re-enforced strict 2FA OTP for all '{$role}' accounts."
        );

        return self::getOtpMatrix();
    }

    // =========================================================================
    // INTERNAL HELPERS
    // =========================================================================

    private static function getSettingValue(string $key, string $default = ''): string
    {
        try {
            $row = DB::table('library_settings')->where('setting_key', $key)->first();
            return $row ? (string)$row->setting_value : $default;
        } catch (\Throwable $e) {
            return $default;
        }
    }

    private static function saveSettingValue(string $key, string $value): void
    {
        try {
            $exists = DB::table('library_settings')->where('setting_key', $key)->exists();
            if ($exists) {
                DB::table('library_settings')->where('setting_key', $key)->update([
                    'setting_value' => $value,
                    'updated_at' => now()
                ]);
            } else {
                DB::table('library_settings')->insert([
                    'setting_key' => $key,
                    'setting_value' => $value,
                    'setting_group' => 'security_2fa',
                    'value_type' => 'string',
                    'is_public' => false,
                    'description' => 'Two-Factor OTP access control flag',
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
            Cache::forget("lib_setting_{$key}");
        } catch (\Throwable $e) {}
    }

    private static function getJsonSetting(string $key, array $default = []): array
    {
        $val = self::getSettingValue($key, '');
        if (empty($val)) return $default;
        $decoded = json_decode($val, true);
        return is_array($decoded) ? $decoded : $default;
    }

    private static function saveJsonSetting(string $key, array $data): void
    {
        self::saveSettingValue($key, json_encode(array_values(array_unique($data))));
    }

    private static function recordAudit(string $actor, string $action, string $details): void
    {
        try {
            DB::table('audit_logs')->insert([
                'user' => $actor,
                'role' => 'developer',
                'action' => $action,
                'category' => 'Security & 2FA Governance',
                'target' => 'Access Control Matrix',
                'details' => $details,
                'created_at' => now()
            ]);
        } catch (\Throwable $e) {}
    }
}
