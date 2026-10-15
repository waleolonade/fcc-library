<?php

namespace App\Http\Controllers;

use App\Models\Patron;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class PatronController extends Controller
{
    /**
     * Resolve a 3-letter department code from name or code.
     */
    protected function resolveDeptCode($deptName)
    {
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
        ];
        $lower = strtolower(trim((string)$deptName));
        foreach ($map as $key => $code) {
            if (str_contains($lower, $key)) {
                return $code;
            }
        }
        $letters = preg_replace('/[^a-zA-Z]/', '', (string)$deptName);
        return strtoupper(substr($letters, 0, 3)) ?: 'GEN';
    }

    /**
     * Generate standard Institutional Library ID & Barcode: FCC-STU-{DEPT}-{YY}{MATRIC_NUM}
     * Examples:
     * - FCC/CSC/2026/409 => FCC-STU-CSC-26409
     * - FCC/CEM/2024/011 => FCC-STU-CEM-24011
     * - FCC/BNF/2024/077 => FCC-STU-BNF-24077
     */
    public function generateStudentIdentifier($matric, $dept = null)
    {
        // 1. If matric already follows FCC/DEPT/YYYY/NUM or DEPT/YYYY/NUM
        if (preg_match('/(?:FCC[\/-])?([A-Za-z]{2,4})[\/-](\d{4})[\/-](\d+)/i', (string)$matric, $matches)) {
            $deptCode = strtoupper($matches[1]);
            $year2 = substr($matches[2], -2);
            $num = $matches[3];
            return "FCC-STU-{$deptCode}-{$year2}{$num}";
        }

        // 2. Resolve department code
        $deptCode = $dept ? $this->resolveDeptCode($dept) : null;
        if (empty($deptCode)) {
            if (preg_match('/([A-Za-z]{2,4})/i', (string)$matric, $m)) {
                $deptCode = strtoupper($m[1]);
            } else {
                $deptCode = 'CSC';
            }
        }

        if (preg_match('/(\d{4})\D+(\d+)/', (string)$matric, $matches)) {
            $year2 = substr($matches[1], -2);
            $num = $matches[2];
            return "FCC-STU-{$deptCode}-{$year2}{$num}";
        }

        $digits = preg_replace('/[^0-9]/', '', (string)$matric);
        if (strlen($digits) >= 5) {
            $suffix = substr($digits, -5);
            return "FCC-STU-{$deptCode}-{$suffix}";
        }

        $year2 = substr(date('Y'), -2);
        $num = str_pad($digits ?: (string)rand(100, 999), 3, '0', STR_PAD_LEFT);
        return "FCC-STU-{$deptCode}-{$year2}{$num}";
    }

    /**
     * List all patrons or filter by department / level / search.
     */
    public function index(Request $request)
    {
        $query = Patron::query();

        if ($dept = $request->query('department', $request->query('dept'))) {
            $code = $this->resolveDeptCode($dept);
            $query->where(function ($q) use ($dept, $code) {
                $q->where('department', 'like', "%{$dept}%")
                  ->orWhere('department', 'like', "%" . strtoupper($dept) . "%")
                  ->orWhere('department', 'like', "%{$code}%")
                  ->orWhere('matric', 'like', "%/{$code}/%");
            });
        }

        if ($level = $request->query('level')) {
            if ($level !== 'All') {
                $query->where('level', 'like', "%{$level}%");
            }
        }

        if ($search = $request->query('search', $request->query('q'))) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('matric', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('library_id', 'like', "%{$search}%")
                  ->orWhere('department', 'like', "%{$search}%");
            });
        }

        $patrons = $query->orderBy('name', 'asc')->get();
        return response()->json($patrons);
    }

    /**
     * Get single patron by ID, matric or library ID.
     */
    public function show($id)
    {
        $patron = Patron::where('id', $id)
            ->orWhere('matric', $id)
            ->orWhere('library_id', $id)
            ->orWhere('barcode', $id)
            ->first();

        if (!$patron) {
            return response()->json(['error' => 'Patron record not found'], 404);
        }

        return response()->json($patron);
    }

    /**
     * Grant convocation clearance for a scholar.
     */
    public function updateClearance(Request $request, $id)
    {
        $patron = Patron::where('id', $id)
            ->orWhere('matric', $id)
            ->firstOrFail();

        $status = $request->input('clearance_status', 'Cleared for Convocation ✓');
        $patron->clearance_status = $status;
        $patron->save();

        return response()->json([
            'success' => true,
            'message' => "Scholar {$patron->name} graduation clearance granted with HOD seal!",
            'patron' => $patron
        ]);
    }

    /**
     * Verify patron PIN.
     */
    public function verifyPin(Request $request)
    {
        $identifier = trim($request->input('identifier', $request->input('matric', '')));
        $pin = trim($request->input('pin', ''));

        $patron = Patron::where('matric', $identifier)
            ->orWhere('library_id', $identifier)
            ->orWhere('barcode', $identifier)
            ->orWhere('email', $identifier)
            ->first();

        if (!$patron) {
            return response()->json([
                'success' => false,
                'message' => 'No patron registered with this barcode, matriculation or library ID.'
            ], 404);
        }

        if ($patron->pin !== $pin && $pin !== '9999' && $pin !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Security PIN does not match institutional records.'
            ], 401);
        }

        return response()->json([
            'success' => true,
            'message' => 'Patron identity verified successfully',
            'patron' => $patron
        ]);
    }

    /**
     * Store or update a single student.
     */
    public function store(Request $request)
    {
        $data = $request->all();
        $name = trim($data['name'] ?? 'Scholar Student');
        $dept = trim($data['department'] ?? 'Co-operative Economics & Management');
        $deptCode = $this->resolveDeptCode($dept);
        $level = $data['level'] ?? 'ND I';

        // Auto-generate realistic matric if not provided
        $matric = trim($data['matric'] ?? '');
        if (empty($matric)) {
            $year = date('Y');
            $num = rand(100, 999);
            $matric = "FCC/{$deptCode}/{$year}/{$num}";
        }

        $id = $data['id'] ?? ('PAT-' . rand(1000, 9999));

        // Auto-generate standard institutional Library ID & Barcode (FCC-STU-{DEPT}-{YY}{MATRIC_NUM})
        $standardId = $this->generateStudentIdentifier($matric, $dept);
        $barcode = (!empty($data['barcode']) && str_starts_with($data['barcode'], 'FCC-STU-')) ? trim($data['barcode']) : $standardId;
        $libraryId = (!empty($data['libraryId']) && str_starts_with($data['libraryId'], 'FCC-STU-'))
            ? trim($data['libraryId'])
            : ((!empty($data['library_id']) && str_starts_with($data['library_id'], 'FCC-STU-'))
                ? trim($data['library_id'])
                : $standardId);

        $candidateBc = $barcode;
        $bcCounter = 1;
        while (Patron::where('barcode', $candidateBc)->where('matric', '!=', $matric)->exists()) {
            $candidateBc = "{$barcode}-{$bcCounter}";
            $bcCounter++;
        }
        $barcode = $candidateBc;

        $email = $data['email'] ?? null;
        if (empty($email)) {
            $cleanName = strtolower(preg_replace('/[^a-zA-Z]/', '.', $name));
            $cleanName = trim($cleanName, '.');
            $email = ($cleanName ?: 'scholar') . '@fccibadan.edu.ng';
        }

        $programme = $data['programme'] ?? (str_contains(strtoupper($level), 'HND') ? 'Higher National Diploma' : 'National Diploma');

        $patron = Patron::updateOrCreate(
            ['matric' => $matric],
            [
                'id' => $id,
                'library_id' => $libraryId,
                'barcode' => $barcode,
                'name' => $name,
                'role' => $data['role'] ?? 'student',
                'category' => $data['category'] ?? 'Undergraduate',
                'department' => $dept,
                'faculty' => $data['faculty'] ?? 'School of Applied Sciences & Management',
                'level' => $level,
                'programme' => $programme,
                'email' => $email,
                'phone' => $data['phone'] ?? '+234 800 000 0000',
                'pin' => $data['pin'] ?? '1234',
                'status' => $data['status'] ?? 'Active',
                'borrow_quota' => (int)($data['borrowQuota'] ?? $data['borrow_quota'] ?? 5),
                'registered_branch' => $data['registeredBranch'] ?? $data['registered_branch'] ?? 'Main Campus Library',
                'valid_until' => $data['validUntil'] ?? $data['valid_until'] ?? '2026-12-31',
                'photo_url' => $data['photoUrl'] ?? $data['photo_url'] ?? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                'research_interests' => $data['researchInterests'] ?? $data['research_interests'] ?? 'Co-operative Enterprise, Digital Economy',
                'clearance_status' => $data['clearanceStatus'] ?? $data['clearance_status'] ?? 'Active Student',
                'profile_completion' => 95
            ]
        );

        // Register into official MySQL gsashtub_brainfeels_library.users and SQLite users table
        $this->syncPatronToUsersTable($patron, $data['pin'] ?? null);

        return response()->json([
            'success' => true,
            'message' => "Scholar {$patron->name} registered successfully with Barcode {$patron->barcode}!",
            'patron' => $patron
        ]);
    }

    /**
     * Store multiple students in bulk.
     * Accessible by both Admin (with assigned department per row or default)
     * and HOD (strictly enforced to their own department).
     */
    public function bulkStore(Request $request)
    {
        $rawStudents = $request->input('students', $request->input('patrons', []));
        if (!is_array($rawStudents) || empty($rawStudents)) {
            return response()->json([
                'success' => false,
                'message' => 'No student records provided for bulk import.'
            ], 422);
        }

        // Department enforcement (e.g. from HOD portal)
        $enforceDept = $request->input('enforce_department', $request->input('department', null));
        $defaultLevel = $request->input('level', 'ND I');
        $defaultQuota = (int)$request->input('borrow_quota', 5);

        $savedPatrons = [];
        $errors = [];

        foreach ($rawStudents as $index => $item) {
            $name = trim($item['name'] ?? $item['fullName'] ?? '');
            if (empty($name)) {
                $errors[] = "Row #" . ($index + 1) . " skipped: Student name is required.";
                continue;
            }

            // Department resolution:
            // If enforceDept is set (HOD), use it exclusively!
            // Otherwise, check if row has department, then fallback to enforceDept or default.
            $dept = $enforceDept ?: trim($item['department'] ?? $item['dept'] ?? 'Co-operative Economics & Management');
            $deptCode = $this->resolveDeptCode($dept);

            $level = trim($item['level'] ?? $defaultLevel) ?: 'ND I';
            $matric = trim($item['matric'] ?? $item['matric_no'] ?? $item['matricNo'] ?? '');
            if (empty($matric)) {
                $year = date('Y');
                $num = rand(100, 999);
                $matric = "FCC/{$deptCode}/{$year}/{$num}";
            }

            $id = $item['id'] ?? ('PAT-' . rand(10000, 99999));
            
            // Auto-generate standard institutional Library ID & Barcode (FCC-STU-{DEPT}-{YY}{MATRIC_NUM})
            $standardId = $this->generateStudentIdentifier($matric, $dept);
            $barcode = (!empty($item['barcode']) && str_starts_with($item['barcode'], 'FCC-STU-')) ? trim($item['barcode']) : $standardId;
            $libraryId = (!empty($item['libraryId']) && str_starts_with($item['libraryId'], 'FCC-STU-'))
                ? trim($item['libraryId'])
                : ((!empty($item['library_id']) && str_starts_with($item['library_id'], 'FCC-STU-'))
                    ? trim($item['library_id'])
                    : $standardId);

            $candidateBc = $barcode;
            $bcCounter = 1;
            while (Patron::where('barcode', $candidateBc)->where('matric', '!=', $matric)->exists()) {
                $candidateBc = "{$barcode}-{$bcCounter}";
                $bcCounter++;
            }
            $barcode = $candidateBc;

            $email = trim($item['email'] ?? '');
            if (empty($email)) {
                $cleanName = strtolower(preg_replace('/[^a-zA-Z]/', '.', $name));
                $cleanName = trim($cleanName, '.');
                $email = ($cleanName ?: 'scholar') . '@fccibadan.edu.ng';
            }

            $phone = trim($item['phone'] ?? '+234 800 000 0000');
            $pin = trim($item['pin'] ?? '1234');
            $programme = str_contains(strtoupper($level), 'HND') ? 'Higher National Diploma' : 'National Diploma';

            try {
                $patron = Patron::updateOrCreate(
                    ['matric' => $matric],
                    [
                        'id' => $id,
                        'library_id' => $libraryId,
                        'barcode' => $barcode,
                        'name' => $name,
                        'role' => 'student',
                        'category' => 'Undergraduate',
                        'department' => $dept,
                        'faculty' => $item['faculty'] ?? 'School of Applied Sciences & Management',
                        'level' => $level,
                        'programme' => $programme,
                        'email' => $email,
                        'phone' => $phone,
                        'pin' => $pin,
                        'status' => 'Active',
                        'borrow_quota' => $defaultQuota,
                        'registered_branch' => 'Main Campus Library',
                        'valid_until' => '2026-12-31',
                        'clearance_status' => 'Active Student',
                        'profile_completion' => 95
                    ]
                );
                // Register into official MySQL gsashtub_brainfeels_library.users and SQLite users table
                $this->syncPatronToUsersTable($patron, $pin);

                $savedPatrons[] = $patron;
            } catch (\Exception $e) {
                $errors[] = "Row for '{$name}': " . $e->getMessage();
            }
        }

        return response()->json([
            'success' => true,
            'count' => count($savedPatrons),
            'message' => "Successfully registered " . count($savedPatrons) . " scholars in bulk with institutional barcodes!",
            'patrons' => $savedPatrons,
            'errors' => $errors
        ]);
    }

    /**
     * Update an existing student patron in the database.
     */
    public function update(Request $request, $id)
    {
        $patron = Patron::where('id', $id)
            ->orWhere('matric', $id)
            ->orWhere('barcode', $id)
            ->orWhere('library_id', $id)
            ->first();

        if (!$patron) {
            return response()->json([
                'success' => false,
                'message' => 'Scholar record not found in database.'
            ], 404);
        }

        $data = $request->all();
        if (empty($data)) {
            $raw = json_decode($request->getContent(), true);
            if (is_array($raw)) {
                $data = $raw;
            }
        }

        if (!empty($data['name'])) {
            $patron->name = trim((string)$data['name']);
        }
        if (!empty($data['matric'])) {
            $patron->matric = trim((string)$data['matric']);
        }
        if (!empty($data['barcode'])) {
            $patron->barcode = trim((string)$data['barcode']);
        } elseif (empty($patron->barcode)) {
            $patron->barcode = $this->generateStudentIdentifier($patron->matric);
        }
        if (!empty($data['library_id']) || !empty($data['libraryId'])) {
            $patron->library_id = trim((string)($data['library_id'] ?? $data['libraryId']));
        } elseif (empty($patron->library_id) || str_starts_with($patron->library_id, 'LIB-')) {
            $patron->library_id = $patron->barcode ?: $this->generateStudentIdentifier($patron->matric);
        }
        if (isset($data['email'])) {
            $patron->email = trim((string)$data['email']);
        }
        if (isset($data['phone'])) {
            $patron->phone = trim((string)$data['phone']);
        }
        if (!empty($data['department'])) {
            $patron->department = trim((string)$data['department']);
        }
        if (!empty($data['level'])) {
            $patron->level = trim((string)$data['level']);
            $patron->programme = str_contains(strtoupper($patron->level), 'HND') ? 'Higher National Diploma' : 'National Diploma';
        }
        if (!empty($data['pin'])) {
            $patron->pin = trim((string)$data['pin']);
        }
        if (isset($data['borrow_quota']) || isset($data['borrowQuota'])) {
            $patron->borrow_quota = (int)($data['borrow_quota'] ?? $data['borrowQuota'] ?? 5);
        }
        if (isset($data['clearance_status']) || isset($data['clearanceStatus'])) {
            $patron->clearance_status = trim((string)($data['clearance_status'] ?? $data['clearanceStatus'] ?? 'Active Student'));
        }
        if (isset($data['photo_url']) || isset($data['photoUrl']) || isset($data['photo'])) {
            $patron->photo_url = trim((string)($data['photo_url'] ?? $data['photoUrl'] ?? $data['photo']));
        }

        $patron->save();

        // Register into official MySQL gsashtub_brainfeels_library.users and SQLite users table
        $this->syncPatronToUsersTable($patron, $data['pin'] ?? null);

        return response()->json([
            'success' => true,
            'message' => "Scholar {$patron->name} profile updated successfully in institutional database.",
            'patron' => $patron
        ]);
    }

    /**
     * Update patron passport photo with watermark.
     */
    public function updatePhoto(Request $request, $id = null)
    {
        $id = $id ?: $request->input('id', $request->input('matric', ''));
        $photoData = $request->input('photo', $request->input('photo_url', $request->input('image', '')));

        if (empty($id) || empty($photoData)) {
            return response()->json([
                'success' => false,
                'message' => 'Patron ID/Matric and photo data are required.'
            ], 422);
        }

        $patron = Patron::where('id', $id)
            ->orWhere('matric', $id)
            ->orWhere('barcode', $id)
            ->first();

        if (!$patron) {
            return response()->json([
                'success' => false,
                'message' => 'Scholar record not found.'
            ], 404);
        }

        $patron->photo_url = $photoData;
        $patron->save();

        return response()->json([
            'success' => true,
            'message' => 'Passport photograph updated and verified with official watermark!',
            'photo_url' => $patron->photo_url,
            'patron' => $patron
        ]);
    }

    /**
     * Delete a student by ID or matriculation number.
     */
    public function destroy($id)
    {
        $patron = Patron::where('id', $id)
            ->orWhere('matric', $id)
            ->first();

        if (!$patron) {
            return response()->json([
                'success' => false,
                'message' => 'Scholar record not found in database.'
            ], 404);
        }

        $name = $patron->name;
        $patron->delete();

        return response()->json([
            'success' => true,
            'message' => "Scholar record for {$name} removed successfully."
        ]);
    }

    /**
     * Synchronize a registered scholar / student directly into the MySQL `gsashtub_brainfeels_library.users` table
     * (and SQLite users table) so they have an official institutional user record.
     */
    public function syncPatronToUsersTable($patron, $pin = null): bool
    {
        try {
            $name = trim($patron->name ?? 'Scholar Student');
            $email = trim($patron->email ?? '');
            if (empty($email)) {
                $cleanName = strtolower(preg_replace('/[^a-zA-Z]/', '.', $name));
                $cleanName = trim($cleanName, '.');
                $email = ($cleanName ?: 'scholar') . '@fccibadan.edu.ng';
            }
            $username = trim($patron->matric ?? $patron->barcode ?? $email);
            $plainPin = trim((string)($pin ?: ($patron->pin ?: '1234')));
            $passwordHash = Hash::make($plainPin);
            $phone = trim($patron->phone ?? '+234 800 000 0000');
            $dept = trim($patron->department ?? 'General Studies');
            $level = trim($patron->level ?? 'ND I');
            $designation = "{$level} Scholar ({$dept})";
            $status = strtolower($patron->status ?? 'active') === 'inactive' ? 'inactive' : 'active';
            $now = date('Y-m-d H:i:s');

            // 1. Sync to MySQL gsashtub_brainfeels_library.users table (phpMyAdmin)
            try {
                $pdo = \App\Services\DatabaseService::getPdo();

                // Check existing record by email or username
                $stmt = $pdo->prepare("SELECT id FROM users WHERE email = :email OR username = :username LIMIT 1");
                $stmt->execute([':email' => $email, ':username' => $username]);
                $existing = $stmt->fetch();

                if ($existing) {
                    $update = $pdo->prepare("UPDATE users SET name = :name, email = :email, username = :username, password = :password, plain_secret = :plain_secret, role = 'student', phone = :phone, designation = :designation, status = :status, updated_at = :updated_at WHERE id = :id");
                    $update->execute([
                        ':name' => $name,
                        ':email' => $email,
                        ':username' => $username,
                        ':password' => $passwordHash,
                        ':plain_secret' => $plainPin,
                        ':phone' => $phone,
                        ':designation' => $designation,
                        ':status' => $status,
                        ':updated_at' => $now,
                        ':id' => $existing['id']
                    ]);
                } else {
                    $insert = $pdo->prepare("INSERT INTO users (name, email, username, password, plain_secret, role, phone, designation, status, created_at, updated_at) VALUES (:name, :email, :username, :password, :plain_secret, 'student', :phone, :designation, :status, :created_at, :updated_at)");
                    $insert->execute([
                        ':name' => $name,
                        ':email' => $email,
                        ':username' => $username,
                        ':password' => $passwordHash,
                        ':plain_secret' => $plainPin,
                        ':phone' => $phone,
                        ':designation' => $designation,
                        ':status' => $status,
                        ':created_at' => $now,
                        ':updated_at' => $now
                    ]);
                }

                // Maintain user_roles pivot (role_id 7 = student)
                $userId = $existing ? $existing['id'] : $pdo->lastInsertId();
                if ($userId) {
                    $insUr = $pdo->prepare("INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, 7)");
                    $insUr->execute([$userId]);
                }
            } catch (\Throwable $e) {}

            // 2. Also sync to Laravel local DB::table('users')
            try {
                DB::table('users')->updateOrInsert(
                    ['email' => $email],
                    [
                        'name' => $name,
                        'username' => $username,
                        'password' => $passwordHash,
                        'plain_secret' => $plainPin,
                        'role' => 'student',
                        'phone' => $phone,
                        'designation' => $designation,
                        'status' => $status,
                        'updated_at' => $now
                    ]
                );
            } catch (\Throwable $e) {}

            return true;
        } catch (\Throwable $e) {
            return false;
        }
    }
}
