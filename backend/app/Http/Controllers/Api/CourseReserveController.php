<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CourseReserve;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CourseReserveController extends Controller
{
    /**
     * Synchronize a course reserve record to MySQL if available.
     */
    protected function syncToMysql($reserve, $action = 'save')
    {
        try {
            $mysql = DB::connection('mysql');
            $mysql->getPdo();

            if ($action === 'delete') {
                $mysql->table('course_reserves')
                    ->where('id', $reserve->id)
                    ->orWhere(function ($q) use ($reserve) {
                        $q->where('title', $reserve->title)
                          ->where('department_code', $reserve->department_code);
                    })
                    ->delete();
                return;
            }

            // Upsert into MySQL
            $exists = $mysql->table('course_reserves')->where('id', $reserve->id)->first();
            $data = [
                'department_code' => $reserve->department_code,
                'department_name' => $reserve->department_name,
                'title'           => $reserve->title,
                'author'          => $reserve->author,
                'reserved_for'    => $reserve->reserved_for,
                'shelf'           => $reserve->shelf,
                'duration'        => $reserve->duration,
                'copies'          => $reserve->copies,
                'status'          => $reserve->status ?? 'active',
                'updated_at'      => now(),
            ];

            if ($exists) {
                $mysql->table('course_reserves')->where('id', $reserve->id)->update($data);
            } else {
                $data['id'] = $reserve->id;
                $data['created_at'] = $reserve->created_at ?? now();
                $mysql->table('course_reserves')->insert($data);
            }
        } catch (\Throwable $e) {
            // Non-fatal if MySQL is offline or not configured
        }
    }

    /**
     * Auto-seed realistic reserve desk textbooks if department has 0 reserves.
     */
    protected function seedDefaultReservesIfEmpty()
    {
        if (CourseReserve::count() >= 12) {
            return;
        }

        $seeds = [
            // CSC Department Reserves
            [
                'department_code' => 'CSC',
                'department_name' => 'Computer Science & Information Technology',
                'title'           => 'Database System Concepts (Silberschatz)',
                'author'          => 'A. Silberschatz, H. F. Korth, S. Sudarshan',
                'reserved_for'    => 'CSC 211',
                'shelf'           => 'Reserve Desk Bay 1',
                'duration'        => '2 Hours In-Library Reading Only',
                'copies'          => 4,
                'status'          => 'active'
            ],
            [
                'department_code' => 'CSC',
                'department_name' => 'Computer Science & Information Technology',
                'title'           => 'Operating System Principles & Linux Internals',
                'author'          => 'William Stallings',
                'reserved_for'    => 'CSC 101',
                'shelf'           => 'Reserve Desk Bay 1',
                'duration'        => '2 Hours In-Library Reading Only',
                'copies'          => 3,
                'status'          => 'active'
            ],
            [
                'department_code' => 'CSC',
                'department_name' => 'Computer Science & Information Technology',
                'title'           => 'Artificial Intelligence: A Modern Approach',
                'author'          => 'Stuart Russell & Peter Norvig',
                'reserved_for'    => 'CSC 411',
                'shelf'           => 'Reserve Desk Bay 2',
                'duration'        => 'Overnight Loan (After 4 PM)',
                'copies'          => 2,
                'status'          => 'active'
            ],
            [
                'department_code' => 'CSC',
                'department_name' => 'Computer Science & Information Technology',
                'title'           => 'Cloud Computing & Microservices Architecture',
                'author'          => 'Thomas Erl & Zaigham Mahmood',
                'reserved_for'    => 'CSC 312',
                'shelf'           => 'Faculty Carrel Stack A',
                'duration'        => 'Weekend Restricted Borrowing',
                'copies'          => 3,
                'status'          => 'active'
            ],

            // CEM Department Reserves
            [
                'department_code' => 'CEM',
                'department_name' => 'Co-operative Economics & Management',
                'title'           => 'Principles and Practice of Co-operative Economics',
                'author'          => 'Prof. A. O. Adebayo',
                'reserved_for'    => 'CEM 411',
                'shelf'           => 'Reserve Desk Bay 1',
                'duration'        => '2 Hours In-Library Reading Only',
                'copies'          => 4,
                'status'          => 'active'
            ],
            [
                'department_code' => 'CEM',
                'department_name' => 'Co-operative Economics & Management',
                'title'           => 'Micro-Credit Administration & Cooperative Financing',
                'author'          => 'Dr. Mrs. F. A. Babalola',
                'reserved_for'    => 'CEM 211',
                'shelf'           => 'Reserve Desk Bay 2',
                'duration'        => '2 Hours In-Library Reading Only',
                'copies'          => 3,
                'status'          => 'active'
            ],
            [
                'department_code' => 'CEM',
                'department_name' => 'Co-operative Economics & Management',
                'title'           => 'Agribusiness Management & Marketing Cooperatives',
                'author'          => 'Dr. E. O. Olarinde',
                'reserved_for'    => 'CEM 315',
                'shelf'           => 'Faculty Carrel Stack A',
                'duration'        => 'Overnight Loan (After 4 PM)',
                'copies'          => 5,
                'status'          => 'active'
            ],

            // BNF Department Reserves
            [
                'department_code' => 'BNF',
                'department_name' => 'Banking & Finance',
                'title'           => 'Central Banking and Monetary Policy in Nigeria',
                'author'          => 'Dr. S. O. Falegan',
                'reserved_for'    => 'BNF 311',
                'shelf'           => 'Reserve Desk Bay 1',
                'duration'        => '2 Hours In-Library Reading Only',
                'copies'          => 4,
                'status'          => 'active'
            ],
            [
                'department_code' => 'BNF',
                'department_name' => 'Banking & Finance',
                'title'           => 'Financial Institutions Management: A Risk Approach',
                'author'          => 'Anthony Saunders & Marcia Cornett',
                'reserved_for'    => 'BNF 412',
                'shelf'           => 'Reserve Desk Bay 3',
                'duration'        => 'Weekend Restricted Borrowing',
                'copies'          => 3,
                'status'          => 'active'
            ],

            // AGR Department Reserves
            [
                'department_code' => 'AGR',
                'department_name' => 'Agricultural Extension & Management',
                'title'           => 'Principles of Crop Production & Post-Harvest Storage',
                'author'          => 'Dr. T. A. Adediran',
                'reserved_for'    => 'AGR 101',
                'shelf'           => 'Reserve Desk Bay 2',
                'duration'        => '2 Hours In-Library Reading Only',
                'copies'          => 4,
                'status'          => 'active'
            ],
            [
                'department_code' => 'AGR',
                'department_name' => 'Agricultural Extension & Management',
                'title'           => 'Farm Machinery & Precision Agricultural Mechanization',
                'author'          => 'Engr. J. K. Babatunde',
                'reserved_for'    => 'AGR 315',
                'shelf'           => 'Faculty Carrel Stack A',
                'duration'        => 'Overnight Loan (After 4 PM)',
                'copies'          => 2,
                'status'          => 'active'
            ],

            // BAM Department Reserves
            [
                'department_code' => 'BAM',
                'department_name' => 'Business Administration & Management',
                'title'           => 'Strategic Corporate Management & Policy Formulation',
                'author'          => 'Prof. Michael Porter',
                'reserved_for'    => 'BAM 411',
                'shelf'           => 'Reserve Desk Bay 1',
                'duration'        => '2 Hours In-Library Reading Only',
                'copies'          => 5,
                'status'          => 'active'
            ],

            // PAD Department Reserves
            [
                'department_code' => 'PAD',
                'department_name' => 'Public Administration',
                'title'           => 'Administrative Law & Civil Service Regulations',
                'author'          => 'Barrister O. A. Solanke',
                'reserved_for'    => 'PAD 201',
                'shelf'           => 'Reserve Desk Bay 3',
                'duration'        => '2 Hours In-Library Reading Only',
                'copies'          => 3,
                'status'          => 'active'
            ],
        ];

        foreach ($seeds as $item) {
            $existing = CourseReserve::where('title', $item['title'])
                ->where('department_code', $item['department_code'])
                ->first();

            if (!$existing) {
                $created = CourseReserve::create($item);
                $this->syncToMysql($created, 'save');
            }
        }
    }

    public function index(Request $request)
    {
        $this->seedDefaultReservesIfEmpty();

        $query = CourseReserve::query();

        // Department filter (by code or name)
        $dept = $request->input('department_code') ?: $request->input('department');
        if ($dept) {
            $query->where(function ($q) use ($dept) {
                $q->where('department_code', 'like', "%{$dept}%")
                  ->orWhere('department_name', 'like', "%{$dept}%")
                  ->orWhere('reserved_for', 'like', "{$dept}%");
            });
        }

        // Target Course filter
        if ($course = $request->input('course')) {
            $query->where('reserved_for', 'like', "%{$course}%");
        }

        // Shelf location filter
        if ($shelf = $request->input('shelf')) {
            if ($shelf !== 'All') {
                $query->where('shelf', 'like', "%{$shelf}%");
            }
        }

        // Full-text search
        if ($q = $request->input('q')) {
            $query->where(function ($sq) use ($q) {
                $sq->where('title', 'like', "%{$q}%")
                   ->orWhere('author', 'like', "%{$q}%")
                   ->orWhere('reserved_for', 'like', "%{$q}%")
                   ->orWhere('shelf', 'like', "%{$q}%");
            });
        }

        $reserves = $query->orderBy('created_at', 'desc')->get();
        return response()->json($reserves);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'           => 'required|string|max:255',
            'author'          => 'nullable|string|max:255',
            'department_code' => 'required|string|max:50',
            'department_name' => 'nullable|string|max:255',
            'reserved_for'    => 'nullable|string|max:50',
            'shelf'           => 'nullable|string|max:100',
            'duration'        => 'nullable|string|max:100',
            'copies'          => 'nullable|integer|min:1',
            'status'          => 'nullable|string|max:50',
        ]);

        $reserve = CourseReserve::create([
            'title'           => trim($validated['title']),
            'author'          => trim($validated['author'] ?? 'Academic Faculty'),
            'department_code' => strtoupper(trim($validated['department_code'])),
            'department_name' => trim($validated['department_name'] ?? ''),
            'reserved_for'    => strtoupper(trim($validated['reserved_for'] ?? '')),
            'shelf'           => trim($validated['shelf'] ?? 'Reserve Desk Bay 1'),
            'duration'        => trim($validated['duration'] ?? '2 Hours In-Library Reading Only'),
            'copies'          => (int) ($validated['copies'] ?? 3),
            'status'          => $validated['status'] ?? 'active',
        ]);

        $this->syncToMysql($reserve, 'save');

        return response()->json([
            'success' => true,
            'message' => "Textbook '{$reserve->title}' placed on reserve desk successfully!",
            'reserve' => $reserve
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $reserve = CourseReserve::findOrFail($id);

        $validated = $request->validate([
            'title'           => 'required|string|max:255',
            'author'          => 'nullable|string|max:255',
            'department_code' => 'nullable|string|max:50',
            'department_name' => 'nullable|string|max:255',
            'reserved_for'    => 'nullable|string|max:50',
            'shelf'           => 'nullable|string|max:100',
            'duration'        => 'nullable|string|max:100',
            'copies'          => 'nullable|integer|min:1',
            'status'          => 'nullable|string|max:50',
        ]);

        $reserve->update([
            'title'           => trim($validated['title']),
            'author'          => trim($validated['author'] ?? $reserve->author),
            'department_code' => strtoupper(trim($validated['department_code'] ?? $reserve->department_code)),
            'department_name' => trim($validated['department_name'] ?? $reserve->department_name),
            'reserved_for'    => strtoupper(trim($validated['reserved_for'] ?? $reserve->reserved_for)),
            'shelf'           => trim($validated['shelf'] ?? $reserve->shelf),
            'duration'        => trim($validated['duration'] ?? $reserve->duration),
            'copies'          => (int) ($validated['copies'] ?? $reserve->copies),
            'status'          => $validated['status'] ?? $reserve->status,
        ]);

        $this->syncToMysql($reserve, 'save');

        return response()->json([
            'success' => true,
            'message' => "Course reserve #{$id} updated successfully in database!",
            'reserve' => $reserve
        ]);
    }

    public function destroy($id)
    {
        $reserve = CourseReserve::findOrFail($id);
        $title = $reserve->title;

        $this->syncToMysql($reserve, 'delete');
        $reserve->delete();

        return response()->json([
            'success' => true,
            'message' => "Removed '{$title}' from course reserves desk."
        ]);
    }
}

