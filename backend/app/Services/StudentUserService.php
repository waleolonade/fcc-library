<?php

namespace App\Services;

use App\Models\Patron;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use PDO;
use Throwable;

class StudentUserService
{
    /**
     * Resolve a 3-letter department code from name or code.
     */
    public static function resolveDeptCode(?string $deptName): string
    {
        if (empty($deptName)) return 'GEN';
        $lower = strtolower(trim($deptName));
        $map = [
            'computer science' => 'CSC',
            'csc' => 'CSC',
            'co-operative' => 'CEM',
            'cem' => 'CEM',
            'cooperative' => 'CEM',
            'banking' => 'BNF',
            'bnf' => 'BNF',
            'agricultural' => 'AGR',
            'agr' => 'AGR',
            'business' => 'BAM',
            'bam' => 'BAM',
            'public admin' => 'PAD',
            'pad' => 'PAD',
            'marketing' => 'MKT',
            'mkt' => 'MKT',
            'general studies' => 'GNS',
            'gns' => 'GNS',
            'home and rural' => 'HR',
            'hr' => 'HR',
            'software' => 'SOFTWARE',
        ];
        foreach ($map as $key => $code) {
            if (str_contains($lower, $key)) {
                return $code;
            }
        }
        $letters = preg_replace('/[^a-zA-Z]/', '', $deptName);
        return strtoupper(substr($letters, 0, 3)) ?: 'GEN';
    }

    /**
     * Generate standard Institutional Library ID & Barcode: FCC-STU-{DEPT}-{YY}{MATRIC_NUM}
     */
    public static function generateBarcode(?string $matric, ?string $dept = null): string
    {
        $matricStr = trim((string)$matric);

        // If matric matches FCC/DEPT/YYYY/NUM or DEPT/YYYY/NUM
        if (preg_match('/(?:FCC[\/-])?([A-Za-z]{2,8})[\/-](\d{4})[\/-](\d+)/i', $matricStr, $m)) {
            $deptCode = strtoupper($m[1]);
            $year2 = substr($m[2], -2);
            $num = $m[3];
            return "FCC-STU-{$deptCode}-{$year2}{$num}";
        }

        $deptCode = $dept ? self::resolveDeptCode($dept) : null;
        if (empty($deptCode)) {
            if (preg_match('/([A-Za-z]{2,8})/i', $matricStr, $m)) {
                $deptCode = strtoupper($m[1]);
            } else {
                $deptCode = 'CSC';
            }
        }

        if (preg_match('/(\d{4})\D+(\d+)/', $matricStr, $m)) {
            $year2 = substr($m[1], -2);
            $num = $m[2];
            return "FCC-STU-{$deptCode}-{$year2}{$num}";
        }

        $digits = preg_replace('/[^0-9]/', '', $matricStr);
        if (strlen($digits) >= 5) {
            $suffix = substr($digits, -5);
            return "FCC-STU-{$deptCode}-{$suffix}";
        }

        $year2 = substr(date('Y'), -2);
        $num = str_pad($digits ?: (string)rand(100, 999), 3, '0', STR_PAD_LEFT);
        return "FCC-STU-{$deptCode}-{$year2}{$num}";
    }

    /**
     * Save/enroll a student directly into MySQL `gsashtub_brainfeels_library.users` table
     * as well as SQLite `users` and `patrons` tables.
     */
    public static function saveStudent(array $data): array
    {
        $name = trim($data['name'] ?? $data['fullName'] ?? 'Scholar Student');
        $dept = trim($data['department'] ?? $data['dept'] ?? 'General Studies');
        $deptCode = self::resolveDeptCode($dept);
        $level = trim($data['level'] ?? 'ND I') ?: 'ND I';
        $designation = "{$level} Scholar ({$dept})";

        // Matriculation Number
        $matric = strtoupper(trim($data['matric'] ?? $data['matric_no'] ?? $data['matricNo'] ?? ''));
        if (empty($matric)) {
            $year = date('Y');
            $num = rand(100, 999);
            $matric = "FCC/{$deptCode}/{$year}/{$num}";
        }

        // Barcode / Library ID
        $standardBarcode = self::generateBarcode($matric, $dept);
        $barcode = (!empty($data['barcode']) && str_starts_with($data['barcode'], 'FCC-STU-'))
            ? trim($data['barcode'])
            : $standardBarcode;
        $libraryId = (!empty($data['libraryId']) && str_starts_with($data['libraryId'], 'FCC-STU-'))
            ? trim($data['libraryId'])
            : ((!empty($data['library_id']) && str_starts_with($data['library_id'], 'FCC-STU-'))
                ? trim($data['library_id'])
                : $barcode);

        // Username defaults to matric, fallback to barcode
        $username = trim($data['username'] ?? '') ?: $matric;

        // Email
        $email = strtolower(trim($data['email'] ?? ''));
        if (empty($email)) {
            $slug = strtolower(preg_replace('/[^a-zA-Z0-9]/', '.', $matric));
            $email = $slug . '@fccibadan.edu.ng';
        }

        // Security PIN / Password
        $pin = trim((string)($data['pin'] ?? $data['plain_secret'] ?? $data['password'] ?? '1234')) ?: '1234';
        $passwordHash = Hash::make($pin);

        $phone = trim($data['phone'] ?? '+234 800 000 0000');
        $status = strtolower($data['status'] ?? 'active') === 'inactive' ? 'inactive' : 'active';
        $avatar = $data['photo_url'] ?? $data['avatar'] ?? $data['photo'] ?? null;
        $borrowQuota = (int)($data['borrow_quota'] ?? $data['borrowQuota'] ?? 5);
        $now = date('Y-m-d H:i:s');

        // ---------------------------------------------------------------------
        // 1. MySQL `gsashtub_brainfeels_library.users` table (Authoritative phpMyAdmin)
        // ---------------------------------------------------------------------
        $mysqlId = null;
        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                // Check if columns exist
                $cols = $pdo->query("DESCRIBE users")->fetchAll(PDO::FETCH_COLUMN);

                // Find existing student by matric, barcode, username, or email
                $findStmt = $pdo->prepare("
                    SELECT id FROM users 
                    WHERE (matric = :m OR barcode = :b OR username = :u OR email = :e)
                    LIMIT 1
                ");
                $findStmt->execute([
                    ':m' => $matric,
                    ':b' => $barcode,
                    ':u' => $username,
                    ':e' => $email
                ]);
                $existingId = $findStmt->fetchColumn();

                if ($existingId) {
                    $mysqlId = $existingId;
                    $updateSql = "
                        UPDATE users SET 
                            name = :name,
                            email = :email,
                            username = :username,
                            matric = :matric,
                            barcode = :barcode,
                            role = 'student',
                            password = :password,
                            plain_secret = :plain_secret,
                            phone = :phone,
                            designation = :designation,
                            department = :department,
                            level = :level,
                            avatar = :avatar,
                            status = :status,
                            updated_at = :updated_at
                        WHERE id = :id
                    ";
                    $upStmt = $pdo->prepare($updateSql);
                    $upStmt->execute([
                        ':name' => $name,
                        ':email' => $email,
                        ':username' => $username,
                        ':matric' => $matric,
                        ':barcode' => $barcode,
                        ':password' => $passwordHash,
                        ':plain_secret' => $pin,
                        ':phone' => $phone,
                        ':designation' => $designation,
                        ':department' => $dept,
                        ':level' => $level,
                        ':avatar' => $avatar,
                        ':status' => $status,
                        ':updated_at' => $now,
                        ':id' => $existingId
                    ]);
                } else {
                    $insertSql = "
                        INSERT INTO users (
                            name, email, username, matric, barcode, role, 
                            password, plain_secret, phone, designation, 
                            department, level, avatar, status, created_at, updated_at
                        ) VALUES (
                            :name, :email, :username, :matric, :barcode, 'student', 
                            :password, :plain_secret, :phone, :designation, 
                            :department, :level, :avatar, :status, :created_at, :updated_at
                        )
                    ";
                    $inStmt = $pdo->prepare($insertSql);
                    $inStmt->execute([
                        ':name' => $name,
                        ':email' => $email,
                        ':username' => $username,
                        ':matric' => $matric,
                        ':barcode' => $barcode,
                        ':password' => $passwordHash,
                        ':plain_secret' => $pin,
                        ':phone' => $phone,
                        ':designation' => $designation,
                        ':department' => $dept,
                        ':level' => $level,
                        ':avatar' => $avatar,
                        ':status' => $status,
                        ':created_at' => $now,
                        ':updated_at' => $now
                    ]);
                    $mysqlId = $pdo->lastInsertId();
                }

                // Maintain user_roles pivot table (role_id 7 = student)
                if ($mysqlId) {
                    try {
                        $pdo->prepare("INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, 7)")->execute([$mysqlId]);
                    } catch (Throwable $te) {}
                }
            }
        } catch (Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('[StudentUserService::saveStudent] MySQL error: ' . $e->getMessage());
        }

        // ---------------------------------------------------------------------
        // 2. Synchronize to SQLite `users` table
        // ---------------------------------------------------------------------
        try {
            DB::table('users')->updateOrInsert(
                ['matric' => $matric],
                [
                    'name' => $name,
                    'email' => $email,
                    'username' => $username,
                    'barcode' => $barcode,
                    'role' => 'student',
                    'password' => $passwordHash,
                    'plain_secret' => $pin,
                    'phone' => $phone,
                    'designation' => $designation,
                    'department' => $dept,
                    'level' => $level,
                    'avatar' => $avatar,
                    'status' => $status,
                    'updated_at' => $now
                ]
            );
        } catch (Throwable $e) {}

        // ---------------------------------------------------------------------
        // 3. Synchronize to SQLite `patrons` table for borrowing & loans
        // ---------------------------------------------------------------------
        try {
            $programme = str_contains(strtoupper($level), 'HND') ? 'Higher National Diploma' : 'National Diploma';
            Patron::updateOrCreate(
                ['matric' => $matric],
                [
                    'id' => $data['id'] ?? ('PAT-' . rand(10000, 99999)),
                    'library_id' => $libraryId,
                    'barcode' => $barcode,
                    'name' => $name,
                    'role' => 'student',
                    'category' => 'Undergraduate',
                    'department' => $dept,
                    'faculty' => $data['faculty'] ?? ('School of ' . $dept),
                    'level' => $level,
                    'programme' => $programme,
                    'email' => $email,
                    'phone' => $phone,
                    'pin' => $pin,
                    'status' => ucfirst($status),
                    'borrow_quota' => $borrowQuota,
                    'registered_branch' => 'Main Campus Library',
                    'valid_until' => '2026-12-31',
                    'photo_url' => $avatar,
                    'clearance_status' => $data['clearance_status'] ?? 'Active Student',
                    'profile_completion' => 95
                ]
            );
        } catch (Throwable $e) {}

        return [
            'id' => $mysqlId ?: ($data['id'] ?? $matric),
            'name' => $name,
            'matric' => $matric,
            'barcode' => $barcode,
            'library_id' => $libraryId,
            'username' => $username,
            'email' => $email,
            'phone' => $phone,
            'department' => $dept,
            'level' => $level,
            'role' => 'student',
            'pin' => $pin,
            'plain_secret' => $pin,
            'status' => $status,
            'avatar' => $avatar,
            'photo_url' => $avatar,
            'borrow_quota' => $borrowQuota
        ];
    }

    /**
     * Delete student from MySQL `users` table and SQLite `users` / `patrons`.
     */
    public static function deleteStudent(string $identifier): bool
    {
        $cleanId = trim($identifier);

        // Delete from MySQL users
        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $stmt = $pdo->prepare("
                    DELETE FROM users 
                    WHERE (id = :id OR matric = :m OR barcode = :b OR username = :u OR email = :e)
                      AND role = 'student'
                ");
                $stmt->execute([
                    ':id' => $cleanId,
                    ':m' => $cleanId,
                    ':b' => $cleanId,
                    ':u' => $cleanId,
                    ':e' => $cleanId
                ]);
            }
        } catch (Throwable $e) {}

        // Delete from SQLite users & patrons
        try {
            DB::table('users')
                ->where(function ($q) use ($cleanId) {
                    $q->where('id', $cleanId)
                      ->orWhere('matric', $cleanId)
                      ->orWhere('barcode', $cleanId)
                      ->orWhere('username', $cleanId)
                      ->orWhere('email', $cleanId);
                })
                ->where('role', 'student')
                ->delete();
        } catch (Throwable $e) {}

        try {
            Patron::where('id', $cleanId)
                ->orWhere('matric', $cleanId)
                ->orWhere('barcode', $cleanId)
                ->orWhere('library_id', $cleanId)
                ->delete();
        } catch (Throwable $e) {}

        return true;
    }

    /**
     * Update student PIN in MySQL `users` table and mirrors.
     */
    public static function updatePin(string $identifier, string $newPin): bool
    {
        $cleanId = trim($identifier);
        $pin = trim($newPin);
        $hash = Hash::make($pin);
        $now = date('Y-m-d H:i:s');

        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $stmt = $pdo->prepare("
                    UPDATE users SET password = :p, plain_secret = :s, updated_at = :u 
                    WHERE (id = :id OR matric = :m OR barcode = :b OR username = :un OR email = :e)
                      AND role = 'student'
                ");
                $stmt->execute([
                    ':p' => $hash,
                    ':s' => $pin,
                    ':u' => $now,
                    ':id' => $cleanId,
                    ':m' => $cleanId,
                    ':b' => $cleanId,
                    ':un' => $cleanId,
                    ':e' => $cleanId
                ]);
            }
        } catch (Throwable $e) {}

        try {
            DB::table('users')
                ->where(function ($q) use ($cleanId) {
                    $q->where('id', $cleanId)
                      ->orWhere('matric', $cleanId)
                      ->orWhere('barcode', $cleanId)
                      ->orWhere('username', $cleanId)
                      ->orWhere('email', $cleanId);
                })
                ->where('role', 'student')
                ->update(['password' => $hash, 'plain_secret' => $pin, 'updated_at' => $now]);
        } catch (Throwable $e) {}

        try {
            DB::table('patrons')
                ->where(function ($q) use ($cleanId) {
                    $q->where('id', $cleanId)
                      ->orWhere('matric', $cleanId)
                      ->orWhere('barcode', $cleanId)
                      ->orWhere('library_id', $cleanId);
                })
                ->update(['pin' => $pin, 'pin_created_at' => $now, 'updated_at' => $now]);
        } catch (Throwable $e) {}

        return true;
    }

    /**
     * Update student status ('active' | 'suspended') in MySQL `users` and mirrors.
     */
    public static function updateStatus(string $identifier, string $status): bool
    {
        $cleanId = trim($identifier);
        $stat = strtolower(trim($status));
        $now = date('Y-m-d H:i:s');

        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $stmt = $pdo->prepare("
                    UPDATE users SET status = :s, updated_at = :u 
                    WHERE (id = :id OR matric = :m OR barcode = :b OR username = :un OR email = :e)
                      AND role = 'student'
                ");
                $stmt->execute([
                    ':s' => $stat,
                    ':u' => $now,
                    ':id' => $cleanId,
                    ':m' => $cleanId,
                    ':b' => $cleanId,
                    ':un' => $cleanId,
                    ':e' => $cleanId
                ]);
            }
        } catch (Throwable $e) {}

        try {
            DB::table('users')
                ->where(function ($q) use ($cleanId) {
                    $q->where('id', $cleanId)
                      ->orWhere('matric', $cleanId)
                      ->orWhere('barcode', $cleanId)
                      ->orWhere('username', $cleanId)
                      ->orWhere('email', $cleanId);
                })
                ->where('role', 'student')
                ->update(['status' => $stat, 'updated_at' => $now]);
        } catch (Throwable $e) {}

        try {
            DB::table('patrons')
                ->where(function ($q) use ($cleanId) {
                    $q->where('id', $cleanId)
                      ->orWhere('matric', $cleanId)
                      ->orWhere('barcode', $cleanId)
                      ->orWhere('library_id', $cleanId);
                })
                ->update(['status' => ucfirst($stat), 'updated_at' => $now]);
        } catch (Throwable $e) {}

        return true;
    }

    /**
     * Retrieve students directly from MySQL `users` table where role = 'student'.
     * Falls back to SQLite patrons if MySQL has no student rows or is unreachable.
     */
    public static function getStudents(?string $search = null, ?string $department = null, ?string $level = null, ?string $status = null): array
    {
        $students = [];

        // 1. Fetch from MySQL users table
        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $sql = "SELECT * FROM users WHERE role = 'student'";
                $params = [];

                if (!empty($department) && $department !== 'All') {
                    $sql .= " AND (department LIKE :dept OR designation LIKE :dept)";
                    $params[':dept'] = "%{$department}%";
                }

                if (!empty($level) && $level !== 'All' && $level !== 'all') {
                    $sql .= " AND (level LIKE :lvl OR designation LIKE :lvl)";
                    $params[':lvl'] = "%{$level}%";
                }

                if (!empty($status)) {
                    $sql .= " AND status = :st";
                    $params[':st'] = $status;
                }

                if (!empty($search)) {
                    $sql .= " AND (name LIKE :q OR matric LIKE :q OR barcode LIKE :q OR username LIKE :q OR email LIKE :q OR phone LIKE :q OR department LIKE :q)";
                    $params[':q'] = "%{$search}%";
                }

                $sql .= " ORDER BY name ASC";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

                if (!empty($rows)) {
                    foreach ($rows as $r) {
                        $matric = $r['matric'] ?: $r['username'];
                        $dept = $r['department'] ?: 'General Studies';
                        $barcode = $r['barcode'] ?: self::generateBarcode($matric, $dept);
                        $students[] = [
                            'id' => (string)$r['id'],
                            'name' => $r['name'],
                            'matric' => $matric,
                            'barcode' => $barcode,
                            'library_id' => $barcode,
                            'username' => $r['username'],
                            'email' => $r['email'],
                            'phone' => $r['phone'] ?? '+234 800 000 0000',
                            'role' => 'student',
                            'category' => 'Undergraduate',
                            'department' => $dept,
                            'faculty' => 'School of ' . $dept,
                            'level' => $r['level'] ?: 'ND I',
                            'programme' => str_contains(strtoupper($r['level'] ?? ''), 'HND') ? 'Higher National Diploma' : 'National Diploma',
                            'pin' => $r['plain_secret'] ?: '1234',
                            'plain_secret' => $r['plain_secret'] ?: '1234',
                            'status' => ucfirst($r['status'] ?: 'Active'),
                            'borrow_quota' => 5,
                            'clearance_status' => 'Active Student',
                            'photo_url' => $r['avatar'] ?? null,
                            'created_at' => $r['created_at'],
                            'updated_at' => $r['updated_at']
                        ];
                    }
                    return $students;
                }
            }
        } catch (Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('[StudentUserService::getStudents] MySQL error: ' . $e->getMessage());
        }

        // 2. Fallback to SQLite patrons if MySQL has 0 student rows yet
        $query = Patron::query();
        if (!empty($department) && $department !== 'All') {
            $query->where('department', 'like', "%{$department}%");
        }
        if (!empty($level) && $level !== 'All' && $level !== 'all') {
            $query->where('level', 'like', "%{$level}%");
        }
        if (!empty($status)) {
            $query->where('status', ucfirst($status));
        }
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('matric', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('department', 'like', "%{$search}%");
            });
        }
        return $query->orderBy('name', 'asc')->get()->toArray();
    }

    /**
     * Find a student for authentication by identifier (matric, barcode, email, username, phone).
     * Authoritative lookup against MySQL `users` table.
     */
    public static function findForAuth(string $identifier): ?object
    {
        $cleanId = trim($identifier);
        $lowerId = strtolower($cleanId);

        // 1. Authoritative lookup in MySQL users table
        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $stmt = $pdo->prepare("
                    SELECT * FROM users 
                    WHERE role = 'student'
                      AND (
                        matric = :id1 OR LOWER(matric) = :id2 
                        OR barcode = :id3 OR LOWER(barcode) = :id4
                        OR username = :id5 OR LOWER(username) = :id6
                        OR email = :id7 OR LOWER(email) = :id8
                        OR phone = :id9
                        OR id = :id10
                      )
                    LIMIT 1
                ");
                $stmt->execute([
                    ':id1' => $cleanId,
                    ':id2' => $lowerId,
                    ':id3' => $cleanId,
                    ':id4' => $lowerId,
                    ':id5' => $cleanId,
                    ':id6' => $lowerId,
                    ':id7' => $cleanId,
                    ':id8' => $lowerId,
                    ':id9' => $cleanId,
                    ':id10' => $cleanId
                ]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($user) {
                    return (object)$user;
                }
            }
        } catch (Throwable $e) {}

        // 2. Check SQLite users table
        try {
            $sqliteUser = DB::table('users')
                ->where('role', 'student')
                ->where(function ($q) use ($cleanId, $lowerId) {
                    $q->where('matric', $cleanId)
                      ->orWhereRaw('LOWER(matric) = ?', [$lowerId])
                      ->orWhere('barcode', $cleanId)
                      ->orWhereRaw('LOWER(barcode) = ?', [$lowerId])
                      ->orWhere('username', $cleanId)
                      ->orWhereRaw('LOWER(username) = ?', [$lowerId])
                      ->orWhere('email', $cleanId)
                      ->orWhereRaw('LOWER(email) = ?', [$lowerId])
                      ->orWhere('phone', $cleanId)
                      ->orWhere('id', $cleanId);
                })
                ->first();
            if ($sqliteUser) {
                return $sqliteUser;
            }
        } catch (Throwable $e) {}

        // 3. Fallback to SQLite patrons table
        $patron = Patron::where('barcode', $cleanId)
            ->orWhere('matric', $cleanId)
            ->orWhere('library_id', $cleanId)
            ->orWhere('email', $cleanId)
            ->orWhere('phone', $cleanId)
            ->orWhere('id', $cleanId)
            ->first();

        if ($patron) {
            return (object)[
                'id' => $patron->id,
                'name' => $patron->name,
                'matric' => $patron->matric,
                'barcode' => $patron->barcode,
                'username' => $patron->matric,
                'email' => $patron->email,
                'phone' => $patron->phone,
                'role' => 'student',
                'password' => Hash::make($patron->pin ?: '1234'),
                'plain_secret' => $patron->pin ?: '1234',
                'department' => $patron->department,
                'level' => $patron->level,
                'designation' => "{$patron->level} Scholar ({$patron->department})",
                'status' => strtolower($patron->status ?: 'active'),
                'avatar' => $patron->photo_url
            ];
        }

        return null;
    }
}
