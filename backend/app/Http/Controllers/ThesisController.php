<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Thesis;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Theses / HND Dissertations repository.
 *
 * Workflow: Student submits (Under Review) -> HOD endorses (Published) or
 * requests revision (Revision Requested) -> student resubmits (Under Review).
 * Published theses appear in the Scholar repository, Admin research module and OPAC overlay.
 */
class ThesisController extends Controller
{
    /** Columns added on top of the original theses schema */
    private const EXTRA_COLUMNS = [
        'department_code' => 'string',
        'revision_note'   => 'text',
        'reviewed_by'     => 'string',
        'reviewed_at'     => 'string',
        'file_data_url'   => 'longText',
    ];

    private function ensureSchema(): void
    {
        static $checked = false;
        if ($checked) return;
        $checked = true;

        try {
            foreach (self::EXTRA_COLUMNS as $col => $type) {
                if (!Schema::hasColumn('theses', $col)) {
                    Schema::table('theses', function ($table) use ($col, $type) {
                        $table->{$type}($col)->nullable();
                    });
                }
            }
        } catch (\Throwable $e) {
            // keep API resilient
        }

        if ($pdo = $this->mysql()) {
            try {
                $existing = array_column($pdo->query('DESCRIBE theses')->fetchAll(\PDO::FETCH_ASSOC) ?: [], 'Field');
                $sqlTypes = ['string' => 'VARCHAR(255)', 'text' => 'TEXT', 'longText' => 'LONGTEXT'];
                foreach (self::EXTRA_COLUMNS as $col => $type) {
                    if ($existing && !in_array($col, $existing, true)) {
                        $pdo->exec("ALTER TABLE theses ADD COLUMN `{$col}` {$sqlTypes[$type]} NULL");
                    }
                }
            } catch (\Throwable $e) {
            }
        }
    }

    private function mysql(): ?\PDO
    {
        static $pdo = false;
        if ($pdo !== false) return $pdo;
        try {
            $pdo = new \PDO(
                'mysql:host=' . env('DB_MYSQL_HOST', '127.0.0.1') . ';port=' . env('DB_MYSQL_PORT', '3306') . ';dbname=' . env('DB_MYSQL_DATABASE', 'brainfeels_library'),
                env('DB_MYSQL_USERNAME', 'root'),
                env('DB_MYSQL_PASSWORD', ''),
                [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_SILENT, \PDO::ATTR_TIMEOUT => 2]
            );
        } catch (\Throwable $e) {
            $pdo = null;
        }
        return $pdo;
    }

    private function syncToMysql(Thesis $thesis, string $action = 'save'): void
    {
        $pdo = $this->mysql();
        if (!$pdo) return;
        try {
            if ($action === 'delete') {
                $pdo->prepare('DELETE FROM theses WHERE id = ?')->execute([$thesis->id]);
                return;
            }
            $cols = array_column($pdo->query('DESCRIBE theses')->fetchAll(\PDO::FETCH_ASSOC) ?: [], 'Field');
            $row = array_intersect_key($thesis->getAttributes(), array_flip($cols));
            if (!$row) return;
            $names = array_keys($row);
            $sql = 'INSERT INTO theses (`' . implode('`,`', $names) . '`) VALUES (' . implode(',', array_fill(0, count($names), '?')) . ') ON DUPLICATE KEY UPDATE '
                . implode(',', array_map(fn ($c) => "`{$c}` = VALUES(`{$c}`)", array_diff($names, ['id'])));
            $pdo->prepare($sql)->execute(array_values($row));
        } catch (\Throwable $e) {
        }
    }

    private function audit(Request $request, string $action, string $details, string $actor, string $role, string $id): void
    {
        try {
            AuditLog::create([
                'id' => 'AUD-' . strtoupper(substr(uniqid(), -8)),
                'action' => $action,
                'details' => $details,
                'actor' => $actor,
                'role' => $role,
                'resource_type' => 'Thesis',
                'resource_id' => $id,
                'ip_address' => $request->ip() ?? '127.0.0.1',
                'hash' => hash('sha256', microtime(true) . $id),
                'timestamp' => Carbon::now()->toIso8601String(),
            ]);
        } catch (\Throwable $e) {
        }
    }

    /** Resolve department code from explicit code, matric (FCC/CSC/2024/001) or department name */
    private function resolveDepartmentCode(array $data): ?string
    {
        if (!empty($data['department_code'])) return strtoupper(trim($data['department_code']));
        if (!empty($data['matric']) && preg_match('#^[A-Z]+/([A-Z]{2,5})/#i', trim($data['matric']), $m)) {
            return strtoupper($m[1]);
        }
        if (!empty($data['department'])) {
            try {
                $dept = DB::table('departments')
                    ->where('name', $data['department'])
                    ->orWhere('code', strtoupper($data['department']))
                    ->first();
                if ($dept) return strtoupper($dept->code);
            } catch (\Throwable $e) {
            }
        }
        return null;
    }

    private function present(Thesis $t, bool $withFile = false): array
    {
        $a = $t->toArray();
        $a['has_file'] = !empty($t->getAttribute('file_data_url'));
        if (!$withFile) unset($a['file_data_url']);
        return $a;
    }

    public function index(Request $request)
    {
        $this->ensureSchema();
        $query = Thesis::query();

        $code = $request->query('department_code');
        $name = $request->query('department');
        if ($code || $name) {
            $query->where(function ($q) use ($code, $name) {
                if ($code) {
                    $code = strtoupper($code);
                    $q->orWhere('department_code', $code)
                      ->orWhere('matric', 'like', "%/{$code}/%");
                }
                if ($name) {
                    $q->orWhere('department', $name)
                      ->orWhere('department', 'like', "%{$name}%");
                }
            });
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($matric = $request->query('matric')) {
            $query->where('matric', $matric);
        }
        if ($search = $request->query('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('author', 'like', "%{$search}%")
                  ->orWhere('abstract', 'like', "%{$search}%");
            });
        }

        $theses = $query->orderBy('submitted_at', 'desc')->get();
        return response()->json($theses->map(fn ($t) => $this->present($t))->values());
    }

    public function show($id)
    {
        $this->ensureSchema();
        $thesis = Thesis::where('id', $id)->first();
        if (!$thesis) return response()->json(['message' => 'Thesis not found'], 404);
        return response()->json($this->present($thesis, true));
    }

    /** Stream the uploaded manuscript PDF */
    public function file(Request $request, $id)
    {
        $this->ensureSchema();
        $thesis = Thesis::where('id', $id)->first();
        $dataUrl = $thesis?->getAttribute('file_data_url');
        if (!$thesis || !$dataUrl) {
            return response()->json(['message' => 'No manuscript file uploaded for this thesis'], 404);
        }

        $mime = 'application/pdf';
        $payload = $dataUrl;
        if (preg_match('#^data:([^;]+);base64,(.*)$#s', $dataUrl, $m)) {
            $mime = $m[1];
            $payload = $m[2];
        }
        $binary = base64_decode($payload);

        if ($request->query('download')) {
            $thesis->downloads = (int) $thesis->downloads + 1;
            $thesis->save();
            $this->syncToMysql($thesis);
        }

        $filename = $thesis->file_name ?: ($thesis->id . '.pdf');
        $disposition = $request->query('download') ? 'attachment' : 'inline';
        return response($binary, 200, [
            'Content-Type' => $mime,
            'Content-Disposition' => "{$disposition}; filename=\"{$filename}\"",
        ]);
    }

    public function store(Request $request)
    {
        $this->ensureSchema();
        $data = $request->all();

        foreach (['title', 'author', 'matric', 'abstract'] as $field) {
            if (empty(trim((string) ($data[$field] ?? '')))) {
                return response()->json(['message' => "The {$field} field is required."], 422);
            }
        }

        $code = $this->resolveDepartmentCode($data);
        $deptName = $data['department'] ?? null;
        if ($code && (!$deptName || strlen($deptName) <= 5)) {
            try {
                $dept = DB::table('departments')->where('code', $code)->first();
                if ($dept) $deptName = $dept->name;
            } catch (\Throwable $e) {
            }
        }

        $id = 'TH-' . date('Y') . '-' . strtoupper(substr(uniqid(), -5));
        $fileData = $data['file_data_url'] ?? $data['fileDataUrl'] ?? null;

        $thesis = Thesis::create([
            'id' => $id,
            'title' => trim($data['title']),
            'author' => trim($data['author']),
            'matric' => strtoupper(trim($data['matric'])),
            'year' => (int) ($data['year'] ?? date('Y')),
            'advisor' => $data['advisor'] ?? null,
            'department' => $deptName,
            'department_code' => $code,
            'faculty' => $data['faculty'] ?? null,
            'degree' => $data['degree'] ?? 'HND Dissertation',
            'status' => 'Under Review',
            'access' => 'Pending HOD Endorsement',
            'downloads' => 0,
            'citations' => 0,
            'doi' => $data['doi'] ?? null,
            'file_size' => $data['file_size'] ?? $data['fileSize'] ?? null,
            'file_name' => $data['file_name'] ?? $data['fileName'] ?? null,
            'file_data_url' => $fileData,
            'abstract' => trim($data['abstract']),
            'submitted_at' => Carbon::now()->toIso8601String(),
        ]);

        $this->syncToMysql($thesis);
        $this->audit($request, 'THESIS_SUBMITTED', "Scholar {$thesis->author} ({$thesis->matric}) submitted '{$thesis->title}' for {$code} HOD review", $thesis->author, 'Student', $thesis->id);

        return response()->json([
            'success' => true,
            'message' => 'Thesis submitted to the departmental HOD review queue',
            'thesis' => $this->present($thesis),
        ], 201);
    }

    public function updateStatus(Request $request, $id)
    {
        $this->ensureSchema();
        $thesis = Thesis::where('id', $id)->first();
        if (!$thesis) return response()->json(['message' => 'Thesis not found'], 404);

        $allowed = ['Under Review', 'Published', 'Revision Requested', 'Rejected'];
        $status = $request->input('status');
        if (!in_array($status, $allowed, true)) {
            return response()->json(['message' => 'Invalid status. Allowed: ' . implode(', ', $allowed)], 422);
        }

        $note = trim((string) $request->input('revision_note', ''));
        if (in_array($status, ['Revision Requested', 'Rejected'], true) && $note === '') {
            return response()->json(['message' => 'A note to the scholar is required.'], 422);
        }

        $reviewer = $request->input('reviewed_by') ?: 'Head of Department';
        $thesis->status = $status;
        $thesis->reviewed_by = $reviewer;
        $thesis->reviewed_at = Carbon::now()->toIso8601String();
        $thesis->revision_note = $status === 'Published' ? null : ($note ?: null);

        if ($status === 'Published') {
            $thesis->access = 'Open Access Full-Text';
            if (empty($thesis->doi)) {
                $thesis->doi = '10.5281/fcc.' . strtolower($thesis->id);
            }
        } elseif ($status === 'Revision Requested') {
            $thesis->access = 'Returned to Scholar for Revision';
        } elseif ($status === 'Rejected') {
            $thesis->access = 'Not Approved';
        } else {
            $thesis->access = 'Pending HOD Endorsement';
        }
        $thesis->save();

        $this->syncToMysql($thesis);
        $this->audit($request, 'THESIS_' . strtoupper(str_replace(' ', '_', $status)), "{$reviewer} set '{$thesis->title}' ({$thesis->matric}) to {$status}" . ($note ? "- Note: {$note}" : ''), $reviewer, 'HOD', $thesis->id);

        return response()->json([
            'success' => true,
            'message' => "Dissertation '{$thesis->title}' status updated to {$status}",
            'thesis' => $this->present($thesis),
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $this->ensureSchema();
        $thesis = Thesis::where('id', $id)->first();
        if (!$thesis) return response()->json(['message' => 'Thesis not found'], 404);

        $this->syncToMysql($thesis, 'delete');
        $thesis->delete();
        $actor = $request->input('actor', 'Administrator');
        $this->audit($request, 'THESIS_DELETED', "{$actor} deleted thesis '{$thesis->title}' ({$thesis->matric})", $actor, 'Admin', $id);

        return response()->json(['success' => true]);
    }
}
