<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\DatabaseService;

class CourseController extends Controller
{
    /**
     * GET /api/courses
     * Returns all institutional courses dynamically linked with real data uploaded by HODs from the database
     */
    public function index(Request $request)
    {
        // 1. Synchronize from live MySQL to SQLite if available
        $this->syncFromMysql();

        // 2. Discover and register any courses HODs uploaded materials for in department_uploads
        $this->syncCoursesFromHodUploads();

        // 3. Query courses directly from the database
        $query = Course::query();

        // Strictly filter out any mock, demo, or dummy records
        $query->where(function ($w) {
            $w->whereNull('code')
              ->orWhere(function ($sub) {
                  $sub->where('code', 'not like', '%MOCK%')
                      ->where('code', 'not like', '%DEMO%')
                      ->where('code', 'not like', '%DUMMY%')
                      ->where('title', 'not like', '%Mock%')
                      ->where('title', 'not like', '%Demo%')
                      ->where('title', 'not like', '%Dummy%');
              });
        });

        // Department filter (flexible matching by code or name)
        $dept = $request->input('department') ?: $request->input('dept');
        $deptCode = $request->input('department_code') ?: $request->input('dept_code');

        if (($dept && strtolower($dept) !== 'all') || ($deptCode && strtolower($deptCode) !== 'all')) {
            $codeClean = strtoupper(str_replace(['DEP-', 'dep-'], '', $deptCode ?: $dept));
            $deptKeywords = array_filter(
                explode(' ', strtolower($dept ?: '')),
                fn($w) => strlen($w) > 3 && !in_array($w, ['school', 'studies', 'management', 'sciences', 'technology', 'department', 'and', 'the'])
            );

            $query->where(function ($w) use ($dept, $codeClean, $deptKeywords) {
                if ($dept) {
                    $w->where('department', 'like', "%{$dept}%");
                    foreach ($deptKeywords as $kw) {
                        $w->orWhere('department', 'like', "%{$kw}%");
                    }
                }
                if ($codeClean && strlen($codeClean) >= 2 && strlen($codeClean) <= 6) {
                    $w->orWhere('code', 'like', "{$codeClean}%")
                      ->orWhere('code', 'like', "%{$codeClean}%")
                      ->orWhere('department', 'like', "%{$codeClean}%");
                }
            });
        }

        // Level filter (ND I, ND II, HND I, HND II, GNS)
        if ($level = $request->input('level')) {
            if (strtolower($level) !== 'all') {
                $query->where('level', 'like', "%{$level}%");
            }
        }

        // Semester filter
        if ($semester = $request->input('semester')) {
            if (strtolower($semester) !== 'all') {
                $query->where('semester', 'like', "%{$semester}%");
            }
        }

        // Search query
        if ($q = $request->input('q', $request->input('search'))) {
            $query->where(function ($w) use ($q) {
                $w->where('code', 'like', "%{$q}%")
                  ->orWhere('title', 'like', "%{$q}%")
                  ->orWhere('lecturer', 'like', "%{$q}%")
                  ->orWhere('department', 'like', "%{$q}%")
                  ->orWhere('syllabus', 'like', "%{$q}%");
            });
        }

        $courses = $query->orderBy('code')->get();

        // 4. Fetch all real HOD uploads and books from the database
        $allUploads = DB::table('department_uploads')
            ->whereNotNull('course_code')
            ->where('course_code', '!=', '')
            ->where(function($w) {
                $w->where('status', 'approved')
                  ->orWhere('status', 'pending');
            })
            ->get();

        $allBooks = DB::table('books')
            ->where(function($w) {
                $w->whereNotNull('course_code')->where('course_code', '!=', '');
            })
            ->get();

        // 5. Format each course, dynamically linking real HOD uploads and catalog books
        $formatted = $courses->map(function ($c) use ($allUploads, $allBooks) {
            return $this->formatCourseWithRealData($c, $allUploads, $allBooks);
        });

        return response()->json($formatted);
    }

    /**
     * GET /api/courses/{code}
     * Returns a single course enriched with its real HOD uploads and books
     */
    public function show($code)
    {
        $cleanCode = strtoupper(trim($code));
        $c = Course::where('code', $cleanCode)->first();

        // If not found in courses table, try to find an HOD upload with this course code
        if (!$c) {
            $this->syncCoursesFromHodUploads();
            $c = Course::where('code', $cleanCode)->first();
        }

        if (!$c) {
            return response()->json(['message' => "Course '{$cleanCode}' not found."], 404);
        }

        $allUploads = DB::table('department_uploads')
            ->whereNotNull('course_code')
            ->where('course_code', '!=', '')
            ->get();

        $allBooks = DB::table('books')
            ->where(function($w) {
                $w->whereNotNull('course_code')->where('course_code', '!=', '');
            })
            ->get();

        return response()->json($this->formatCourseWithRealData($c, $allUploads, $allBooks));
    }

    /**
     * POST /api/courses
     * Allows HOD to register a new course directly into the database
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:courses,code',
            'title' => 'required|string|max:255',
            'department' => 'nullable|string|max:150',
            'faculty' => 'nullable|string|max:150',
            'level' => 'nullable|string|max:50',
            'semester' => 'nullable|string|max:50',
            'lecturer' => 'nullable|string|max:150',
            'syllabus' => 'nullable|string',
            'enrolled_students' => 'nullable|integer',
            'requiredBookIds' => 'nullable|array',
            'recommendedBookIds' => 'nullable|array',
            'pastQuestions' => 'nullable|array',
            'lectureMaterials' => 'nullable|array',
        ]);

        $code = strtoupper(trim($validated['code']));
        $title = trim($validated['title']);
        $dept = $validated['department'] ?? 'General Studies';
        $faculty = $validated['faculty'] ?? 'School of Academic Studies';
        $level = $validated['level'] ?? 'ND I';
        $semester = $validated['semester'] ?? 'First Semester';
        $lecturer = $validated['lecturer'] ?? 'Faculty Lecturer';
        $syllabus = $validated['syllabus'] ?? "Prescribed curriculum course outline for {$code} - {$title}.";
        $enrolled = (int)($validated['enrolled_students'] ?? 65);

        $course = Course::create([
            'code' => $code,
            'title' => $title,
            'department' => $dept,
            'faculty' => $faculty,
            'level' => $level,
            'semester' => $semester,
            'lecturer' => $lecturer,
            'syllabus' => $syllabus,
            'enrolled_students' => $enrolled,
            'required_texts' => json_encode($validated['requiredBookIds'] ?? []),
            'recommended_texts' => json_encode($validated['recommendedBookIds'] ?? []),
            'past_exams' => json_encode($validated['pastQuestions'] ?? []),
            'lecture_packs' => json_encode($validated['lectureMaterials'] ?? []),
        ]);

        $this->syncCourseToMysql($course);

        return response()->json($course, 201);
    }

    /**
     * PUT/POST /api/courses/{code}/update
     * Update an existing course in the database
     */
    public function update(Request $request, $code)
    {
        $cleanCode = strtoupper(trim($code));
        $course = Course::where('code', $cleanCode)->first();
        if (!$course) {
            return response()->json(['message' => "Course '{$cleanCode}' not found."], 404);
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'department' => 'sometimes|nullable|string|max:150',
            'faculty' => 'sometimes|nullable|string|max:150',
            'level' => 'sometimes|nullable|string|max:50',
            'semester' => 'sometimes|nullable|string|max:50',
            'lecturer' => 'sometimes|nullable|string|max:150',
            'syllabus' => 'sometimes|nullable|string',
            'enrolled_students' => 'sometimes|nullable|integer',
            'requiredBookIds' => 'sometimes|nullable|array',
            'recommendedBookIds' => 'sometimes|nullable|array',
            'pastQuestions' => 'sometimes|nullable|array',
            'lectureMaterials' => 'sometimes|nullable|array',
        ]);

        if (isset($validated['title'])) $course->title = trim($validated['title']);
        if (isset($validated['department'])) $course->department = $validated['department'];
        if (isset($validated['faculty'])) $course->faculty = $validated['faculty'];
        if (isset($validated['level'])) $course->level = $validated['level'];
        if (isset($validated['semester'])) $course->semester = $validated['semester'];
        if (isset($validated['lecturer'])) $course->lecturer = trim($validated['lecturer']);
        if (isset($validated['syllabus'])) $course->syllabus = $validated['syllabus'];
        if (isset($validated['enrolled_students'])) $course->enrolled_students = (int)$validated['enrolled_students'];
        if (isset($validated['requiredBookIds'])) $course->required_texts = json_encode($validated['requiredBookIds']);
        if (isset($validated['recommendedBookIds'])) $course->recommended_texts = json_encode($validated['recommendedBookIds']);
        if (isset($validated['pastQuestions'])) $course->past_exams = json_encode($validated['pastQuestions']);
        if (isset($validated['lectureMaterials'])) $course->lecture_packs = json_encode($validated['lectureMaterials']);

        $course->save();

        $this->syncCourseToMysql($course);

        return response()->json([
            'success' => true,
            'message' => "Course '{$course->code}' updated successfully in database.",
            'course' => $course
        ]);
    }

    /**
     * DELETE /api/courses/{code}
     * Remove a course from the database
     */
    public function destroy($code)
    {
        $cleanCode = strtoupper(trim($code));
        $course = Course::where('code', $cleanCode)->first();
        if (!$course) {
            return response()->json(['message' => "Course '{$cleanCode}' not found."], 404);
        }

        $title = $course->title;
        $course->delete();

        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->prepare("DELETE FROM courses WHERE code = :code");
                $st->execute([':code' => $cleanCode]);
            }
        } catch (\Throwable $e) {}

        return response()->json([
            'success' => true,
            'message' => "Course '{$cleanCode}' ({$title}) de-registered successfully from database."
        ]);
    }

    /**
     * Format a Course model with live HOD uploaded materials and catalog books
     */
    private function formatCourseWithRealData($c, $allUploads, $allBooks): array
    {
        $cleanCode = strtoupper(trim($c->code));
        $codeNoSpace = str_replace(' ', '', $cleanCode);

        // Find uploads matching this course code
        $matchedUploads = $allUploads->filter(function ($u) use ($cleanCode, $codeNoSpace) {
            $uCode = strtoupper(trim($u->course_code ?? ''));
            $uCodeNoSpace = str_replace(' ', '', $uCode);
            return $uCode === $cleanCode 
                || $uCodeNoSpace === $codeNoSpace
                || (!empty($cleanCode) && strlen($cleanCode) > 2 && str_contains($uCode, $cleanCode));
        });

        // Find books linked by course_code or by upload book_id
        $matchedBooks = $allBooks->filter(function ($b) use ($cleanCode, $codeNoSpace, $matchedUploads) {
            $bCode = strtoupper(trim($b->course_code ?? ''));
            $bCodeNoSpace = str_replace(' ', '', $bCode);
            $isCodeMatch = ($bCode === $cleanCode || $bCodeNoSpace === $codeNoSpace || (!empty($cleanCode) && strlen($cleanCode) > 2 && str_contains($bCode, $cleanCode)));
            $isUploadBookMatch = $matchedUploads->pluck('book_id')->filter()->contains($b->id);
            return $isCodeMatch || $isUploadBookMatch;
        });

        // Separate HOD uploads into past questions and lecture materials
        $pastQuestions = [];
        $lectureMaterials = [];

        foreach ($matchedUploads as $u) {
            $resType = strtolower($u->resource_type ?? '');
            $uTitle = strtolower($u->title ?? '');
            $isPastExam = str_contains($resType, 'exam') 
                || str_contains($resType, 'past') 
                || str_contains($resType, 'question')
                || str_contains($uTitle, 'past exam')
                || str_contains($uTitle, 'past question');

            $fileUrl = !empty($u->file_path)
                ? url("/api/department-uploads/{$u->id}/file")
                : ($u->file_data_url ?: null);

            $item = [
                'id' => $u->id,
                'title' => $u->title,
                'author' => $u->author ?: $u->hod_name ?: $c->lecturer,
                'lecturer' => $u->author ?: $u->hod_name ?: $c->lecturer,
                'department' => $u->department_name ?: $c->department,
                'course_code' => $u->course_code,
                'resource_type' => $u->resource_type ?: 'Lecture Handout / E-Book',
                'fileName' => $u->file_name ?: "{$c->code}_material.pdf",
                'file' => $u->file_name ?: "{$c->code}_material.pdf",
                'fileUrl' => $fileUrl,
                'downloadUrl' => $fileUrl,
                'cover_image' => $u->cover_image ? url("/api/department-uploads/{$u->id}/cover") : null,
                'status' => $u->status,
                'year' => date('Y', strtotime($u->created_at ?? 'now')),
                'semester' => $u->semester ?: $c->semester,
                'level' => $u->target_level ?: $c->level,
                'access_scope' => $u->access_scope ?: 'Public Institution-Wide',
                'created_at' => $u->created_at,
            ];

            if ($isPastExam) {
                $pastQuestions[] = $item;
            } else {
                $item['week'] = count($lectureMaterials) + 1;
                $lectureMaterials[] = $item;
            }
        }

        // Stored JSON columns fallback
        $req = is_string($c->required_texts) ? json_decode($c->required_texts, true) : ($c->required_texts ?? []);
        $rec = is_string($c->recommended_texts) ? json_decode($c->recommended_texts, true) : ($c->recommended_texts ?? []);
        $storedExams = is_string($c->past_exams) ? json_decode($c->past_exams, true) : ($c->past_exams ?? []);
        $storedPacks = is_string($c->lecture_packs) ? json_decode($c->lecture_packs, true) : ($c->lecture_packs ?? []);

        if (is_array($storedExams)) {
            foreach ($storedExams as $se) {
                if (!empty($se['title']) && !str_contains(strtolower($se['title']), 'mock')) {
                    $pastQuestions[] = $se;
                }
            }
        }

        if (is_array($storedPacks)) {
            foreach ($storedPacks as $sp) {
                if (!empty($sp['title']) && !str_contains(strtolower($sp['title']), 'mock')) {
                    $lectureMaterials[] = $sp;
                }
            }
        }

        // Format linked books
        $linkedBooks = $matchedBooks->map(function ($b) {
            return [
                'id' => $b->id,
                'title' => $b->title,
                'author' => $b->author,
                'department' => $b->department,
                'course_code' => $b->course_code,
                'call_number' => $b->call_number ?? '',
                'shelf_location' => $b->shelf_location ?? 'Main Reserve Desk',
                'shelf' => $b->shelf_location ?? 'Main Reserve Desk',
                'cover_image' => $b->cover_image ? url("/api/catalog/{$b->id}/cover") : null,
                'category' => $b->category ?? 'Prescribed Course Reserve',
            ];
        })->values()->toArray();

        $linkedBookIds = array_unique(array_merge(
            is_array($req) ? $req : [],
            $matchedBooks->pluck('id')->toArray()
        ));

        return [
            'code' => $c->code,
            'title' => $c->title,
            'department' => $c->department,
            'faculty' => $c->faculty ?: 'School of Academic Studies',
            'level' => $c->level ?: 'ND I',
            'semester' => $c->semester ?: 'First Semester',
            'lecturer' => $c->lecturer ?: 'Departmental Faculty',
            'syllabus' => $c->syllabus ?: "Official accredited curriculum syllabus module for {$c->code}.",
            'enrolledStudents' => (int)($c->enrolled_students ?: 65),
            'enrolled_students' => (int)($c->enrolled_students ?: 65),
            'requiredBookIds' => array_values($linkedBookIds),
            'recommendedBookIds' => is_array($rec) ? array_values($rec) : [],
            'pastQuestions' => array_values($pastQuestions),
            'lectureMaterials' => array_values($lectureMaterials),
            'linkedBooks' => $linkedBooks,
            'uploadsCount' => count($matchedUploads),
        ];
    }

    /**
     * Discover any courses HODs have uploaded in department_uploads and ensure they exist in courses table
     */
    private function syncCoursesFromHodUploads(): void
    {
        try {
            $uploads = DB::table('department_uploads')
                ->whereNotNull('course_code')
                ->where('course_code', '!=', '')
                ->where(function($w) {
                    $w->where('status', 'approved')
                      ->orWhere('status', 'pending');
                })
                ->get();

            $grouped = [];
            foreach ($uploads as $u) {
                $code = strtoupper(trim($u->course_code));
                if (!empty($code) && strlen($code) >= 3 && $code !== 'CSC') {
                    if (!isset($grouped[$code])) {
                        $grouped[$code] = $u;
                    }
                }
            }

            foreach ($grouped as $code => $firstUpload) {
                $existing = Course::where('code', $code)->first();
                if (!$existing) {
                    $title = $this->deriveCourseTitle($firstUpload->title, $code);
                    $newCourse = Course::create([
                        'code' => $code,
                        'title' => $title,
                        'department' => $firstUpload->department_name ?: 'Academic Studies',
                        'faculty' => 'School of Applied Sciences & Computing',
                        'level' => $firstUpload->target_level ?: 'ND I',
                        'semester' => $firstUpload->semester ?: 'First Semester',
                        'lecturer' => $firstUpload->author ?: $firstUpload->hod_name ?: 'Department Faculty',
                        'syllabus' => $firstUpload->abstract ?: "Official accredited curriculum syllabus module for {$code}.",
                        'enrolled_students' => 60,
                        'required_texts' => json_encode([]),
                        'recommended_texts' => json_encode([]),
                        'past_exams' => json_encode([]),
                        'lecture_packs' => json_encode([]),
                    ]);

                    $this->syncCourseToMysql($newCourse);
                }
            }
        } catch (\Throwable $e) {}
    }

    /**
     * Derive clean course title from upload title
     */
    private function deriveCourseTitle(string $rawTitle, string $code): string
    {
        $clean = trim($rawTitle);
        // Remove trailing file extensions
        $clean = preg_replace('/\.(pdf|docx?|pptx?)$/i', '', $clean);
        // Remove common prefixes
        $clean = preg_replace('/^(com|csc|gen|mth)\s*\d+\s*/i', '', $clean);
        $clean = ucwords(str_replace(['_', '-'], ' ', trim($clean)));

        if (strlen($clean) < 3 || is_numeric($clean)) {
            return "Curriculum Module {$code}";
        }
        return $clean;
    }

    /**
     * Synchronize courses from live MySQL database to SQLite
     */
    private function syncFromMysql(): void
    {
        try {
            $pdo = DatabaseService::getPdo();
            if ($pdo) {
                $mysqlCourses = $pdo->query("SELECT * FROM courses")->fetchAll();
                if (!empty($mysqlCourses)) {
                    foreach ($mysqlCourses as $mc) {
                        Course::firstOrCreate(
                            ['code' => strtoupper($mc['code'])],
                            [
                                'title' => $mc['title'] ?? 'Academic Course',
                                'department' => $mc['department'] ?? 'General Studies',
                                'faculty' => $mc['faculty'] ?? 'School of Academic Studies',
                                'level' => $mc['level'] ?? 'ND I',
                                'semester' => $mc['semester'] ?? 'First Semester',
                                'lecturer' => $mc['lecturer'] ?? 'Faculty Lecturer',
                                'syllabus' => $mc['syllabus'] ?? '',
                                'enrolled_students' => (int)($mc['enrolled_students'] ?? 60),
                                'required_texts' => is_string($mc['required_texts'] ?? null) ? json_decode($mc['required_texts'], true) : ($mc['required_texts'] ?? []),
                                'recommended_texts' => is_string($mc['recommended_texts'] ?? null) ? json_decode($mc['recommended_texts'], true) : ($mc['recommended_texts'] ?? []),
                                'past_exams' => is_string($mc['past_exams'] ?? null) ? json_decode($mc['past_exams'], true) : ($mc['past_exams'] ?? []),
                                'lecture_packs' => is_string($mc['lecture_packs'] ?? null) ? json_decode($mc['lecture_packs'], true) : ($mc['lecture_packs'] ?? []),
                            ]
                        );
                    }
                }
            }
        } catch (\Throwable $e) {}
    }

    /**
     * Synchronize a Course to MySQL Database
     */
    private function syncCourseToMysql($course): void
    {
        try {
            $pdo = DatabaseService::getPdo();
            if (!$pdo) return;

            $req = is_array($course->required_texts) ? json_encode($course->required_texts) : ($course->required_texts ?: '[]');
            $rec = is_array($course->recommended_texts) ? json_encode($course->recommended_texts) : ($course->recommended_texts ?: '[]');
            $exams = is_array($course->past_exams) ? json_encode($course->past_exams) : ($course->past_exams ?: '[]');
            $packs = is_array($course->lecture_packs) ? json_encode($course->lecture_packs) : ($course->lecture_packs ?: '[]');

            $stmt = $pdo->prepare("
                INSERT INTO courses (code, title, department, faculty, level, semester, lecturer, enrolled_students, required_texts, recommended_texts, past_exams, lecture_packs, syllabus)
                VALUES (:code, :title, :department, :faculty, :level, :semester, :lecturer, :enrolled_students, :required_texts, :recommended_texts, :past_exams, :lecture_packs, :syllabus)
                ON DUPLICATE KEY UPDATE
                title = VALUES(title),
                department = VALUES(department),
                faculty = VALUES(faculty),
                level = VALUES(level),
                semester = VALUES(semester),
                lecturer = VALUES(lecturer),
                enrolled_students = VALUES(enrolled_students),
                required_texts = VALUES(required_texts),
                recommended_texts = VALUES(recommended_texts),
                past_exams = VALUES(past_exams),
                lecture_packs = VALUES(lecture_packs),
                syllabus = VALUES(syllabus)
            ");

            $stmt->execute([
                ':code' => $course->code,
                ':title' => $course->title,
                ':department' => $course->department,
                ':faculty' => $course->faculty,
                ':level' => $course->level,
                ':semester' => $course->semester ?: 'First Semester',
                ':lecturer' => $course->lecturer,
                ':enrolled_students' => (int)($course->enrolled_students ?: 60),
                ':required_texts' => $req,
                ':recommended_texts' => $rec,
                ':past_exams' => $exams,
                ':lecture_packs' => $packs,
                ':syllabus' => $course->syllabus ?: ''
            ]);
        } catch (\Throwable $e) {}
    }
}
