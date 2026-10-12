<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CourseReserve;
use Illuminate\Http\Request;

class CourseReserveController extends Controller
{
    public function index(Request $request)
    {
        $query = CourseReserve::query();

        if ($dept = $request->input('department')) {
            $query->where(function ($q) use ($dept) {
                $q->where('department_code', 'like', "%{$dept}%")
                  ->orWhere('department_name', 'like', "%{$dept}%");
            });
        }

        if ($course = $request->input('course')) {
            $query->where('reserved_for', 'like', "%{$course}%");
        }

        $reserves = $query->orderBy('created_at', 'desc')->get();
        return response()->json($reserves);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'author' => 'nullable|string|max:255',
            'department_code' => 'required|string|max:50',
            'department_name' => 'nullable|string|max:255',
            'reserved_for' => 'nullable|string|max:50',
            'shelf' => 'nullable|string|max:100',
            'duration' => 'nullable|string|max:100',
            'copies' => 'nullable|integer|min:1',
        ]);

        $reserve = CourseReserve::create([
            'title' => trim($validated['title']),
            'author' => trim($validated['author'] ?? 'Academic Faculty'),
            'department_code' => strtoupper(trim($validated['department_code'])),
            'department_name' => trim($validated['department_name'] ?? ''),
            'reserved_for' => strtoupper(trim($validated['reserved_for'] ?? '')),
            'shelf' => trim($validated['shelf'] ?? 'Reserve Desk Bay 1'),
            'duration' => trim($validated['duration'] ?? '2 Hours In-Library Reading Only'),
            'copies' => (int) ($validated['copies'] ?? 3),
            'status' => 'active',
        ]);

        return response()->json([
            'success' => true,
            'message' => "Textbook '{$reserve->title}' placed on reserve desk successfully!",
            'reserve' => $reserve
        ], 201);
    }

    public function destroy($id)
    {
        $reserve = CourseReserve::findOrFail($id);
        $title = $reserve->title;
        $reserve->delete();

        return response()->json([
            'success' => true,
            'message' => "Removed '{$title}' from course reserves desk."
        ]);
    }
}
