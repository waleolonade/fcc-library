<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    /**
     * GET /api/courses
     * Returns all institutional courses fetched directly from database
     */
    public function index(Request $request)
    {
        $query = Course::query();

        if ($dept = $request->input('department')) {
            $query->where('department', 'like', "%{$dept}%");
        }

        if ($level = $request->input('level')) {
            $query->where('level', 'like', "%{$level}%");
        }

        if ($q = $request->input('q', $request->input('search'))) {
            $query->where(function ($w) use ($q) {
                $w->where('code', 'like', "%{$q}%")
                  ->orWhere('title', 'like', "%{$q}%")
                  ->orWhere('lecturer', 'like', "%{$q}%")
                  ->orWhere('department', 'like', "%{$q}%");
            });
        }

        $courses = $query->orderBy('code')->get();

        $formatted = $courses->map(function ($c) {
            $req = is_string($c->required_texts) ? json_decode($c->required_texts, true) : ($c->required_texts ?? []);
            $rec = is_string($c->recommended_texts) ? json_decode($c->recommended_texts, true) : ($c->recommended_texts ?? []);
            $exams = is_string($c->past_exams) ? json_decode($c->past_exams, true) : ($c->past_exams ?? []);
            $lectures = is_string($c->lecture_packs) ? json_decode($c->lecture_packs, true) : ($c->lecture_packs ?? []);

            return [
                'code' => $c->code,
                'title' => $c->title,
                'department' => $c->department,
                'faculty' => $c->faculty,
                'level' => $c->level,
                'semester' => $c->semester,
                'lecturer' => $c->lecturer,
                'syllabus' => $c->syllabus,
                'requiredBookIds' => $req ?: [],
                'recommendedBookIds' => $rec ?: [],
                'pastQuestions' => $exams ?: [],
                'lectureMaterials' => $lectures ?: [],
            ];
        });

        return response()->json($formatted);
    }

    /**
     * GET /api/courses/{code}
     */
    public function show($code)
    {
        $c = Course::where('code', strtoupper($code))->first();
        if (!$c) {
            return response()->json(['message' => 'Course not found'], 404);
        }

        $req = is_string($c->required_texts) ? json_decode($c->required_texts, true) : ($c->required_texts ?? []);
        $rec = is_string($c->recommended_texts) ? json_decode($c->recommended_texts, true) : ($c->recommended_texts ?? []);
        $exams = is_string($c->past_exams) ? json_decode($c->past_exams, true) : ($c->past_exams ?? []);
        $lectures = is_string($c->lecture_packs) ? json_decode($c->lecture_packs, true) : ($c->lecture_packs ?? []);

        return response()->json([
            'code' => $c->code,
            'title' => $c->title,
            'department' => $c->department,
            'faculty' => $c->faculty,
            'level' => $c->level,
            'semester' => $c->semester,
            'lecturer' => $c->lecturer,
            'syllabus' => $c->syllabus,
            'requiredBookIds' => $req ?: [],
            'recommendedBookIds' => $rec ?: [],
            'pastQuestions' => $exams ?: [],
            'lectureMaterials' => $lectures ?: [],
        ]);
    }

    /**
     * POST /api/courses
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:courses,code',
            'title' => 'required|string|max:255',
            'department' => 'nullable|string|max:150',
            'faculty' => 'nullable|string|max:150',
            'level' => 'nullable|string|max:50',
            'lecturer' => 'nullable|string|max:150',
            'syllabus' => 'nullable|string',
            'requiredBookIds' => 'nullable|array',
            'recommendedBookIds' => 'nullable|array',
            'pastQuestions' => 'nullable|array',
            'lectureMaterials' => 'nullable|array',
        ]);

        $course = Course::create([
            'code' => strtoupper($validated['code']),
            'title' => $validated['title'],
            'department' => $validated['department'] ?? 'General Studies',
            'faculty' => $validated['faculty'] ?? 'General Faculty',
            'level' => $validated['level'] ?? 'ND I',
            'lecturer' => $validated['lecturer'] ?? 'Faculty Lecturer',
            'syllabus' => $validated['syllabus'] ?? '',
            'required_texts' => json_encode($validated['requiredBookIds'] ?? []),
            'recommended_texts' => json_encode($validated['recommendedBookIds'] ?? []),
            'past_exams' => json_encode($validated['pastQuestions'] ?? []),
            'lecture_packs' => json_encode($validated['lectureMaterials'] ?? []),
        ]);

        return response()->json($course, 201);
    }
}
