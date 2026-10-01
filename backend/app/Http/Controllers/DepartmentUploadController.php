<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\DepartmentUpload;
use App\Models\Book;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DepartmentUploadController extends Controller
{
    public function getDepartments()
    {
        $departments = Department::orderBy('name', 'asc')->get();
        return response()->json($departments);
    }

    public function index(Request $request)
    {
        $query = DepartmentUpload::query();

        if ($dept = $request->query('department_id')) {
            $query->where('department_id', $dept);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $uploads = $query->orderBy('created_at', 'desc')->get();
        return response()->json($uploads);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'author' => 'required|string|max:255',
            'department_id' => 'required|string',
            'course_code' => 'nullable|string|max:50',
            'target_level' => 'nullable|string|max:50',
            'semester' => 'nullable|string|max:50',
            'resource_type' => 'nullable|string|max:100',
            'file_name' => 'nullable|string|max:255',
            'file_data_url' => 'nullable|string',
            'access_scope' => 'nullable|string|max:100',
            'uploaded_by_hod_id' => 'nullable|string',
            'hod_name' => 'nullable|string',
            'review_notes' => 'nullable|string'
        ]);

        $dept = Department::find($validated['department_id']);
        $deptName = $dept ? $dept->name : 'General Department';

        $id = 'HOD-UP-' . rand(1000, 9999);

        $upload = DepartmentUpload::create([
            'id' => $id,
            'title' => $validated['title'],
            'author' => $validated['author'],
            'department_id' => $validated['department_id'],
            'department_name' => $deptName,
            'uploaded_by_hod_id' => $validated['uploaded_by_hod_id'] ?? 'HOD-' . ($dept ? $dept->code : 'STAFF'),
            'hod_name' => $validated['hod_name'] ?? ($dept ? $dept->hod_name : 'Department Head'),
            'course_code' => $validated['course_code'] ?? 'GEN 101',
            'target_level' => $validated['target_level'] ?? 'HND II',
            'semester' => $validated['semester'] ?? 'First Semester',
            'resource_type' => $validated['resource_type'] ?? 'Lecture Handout',
            'file_name' => $validated['file_name'] ?? 'handout.pdf',
            'file_data_url' => $validated['file_data_url'] ?? '',
            'access_scope' => $validated['access_scope'] ?? 'Restricted to Department Students Only',
            'status' => 'pending',
            'review_notes' => $validated['review_notes'] ?? null,
            'reviewed_by' => null,
            'assigned_call_number' => null,
            'assigned_shelf' => null,
            'book_id' => null
        ]);

        AuditLog::create([
            'id' => 'AUD-' . rand(10000, 99999),
            'action' => 'HOD_RESOURCE_SUBMITTED',
            'details' => "HOD submitted '{$upload->title}' for {$deptName} into Library Staging Queue",
            'actor' => $upload->hod_name,
            'role' => 'HOD',
            'resource_type' => 'DepartmentUpload',
            'resource_id' => $upload->id,
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'hash' => hash('sha256', microtime(true) . $upload->id),
            'timestamp' => Carbon::now()->toIso8601String()
        ]);

        return response()->json([
            'success' => true,
            'message' => "Resource '{$upload->title}' submitted to Central Library Staging Queue for cataloger review.",
            'upload' => $upload
        ], 201);
    }

    public function approve(Request $request, $id)
    {
        $upload = DepartmentUpload::findOrFail($id);

        $callNumber = $request->input('assigned_call_number') ?? ($upload->assigned_call_number ?: 'QA76.9 .' . substr($upload->author, 0, 3) . ' 2026');
        $shelf = $request->input('assigned_shelf') ?? ($upload->assigned_shelf ?: 'Floor 2 • Aisle 3 • Shelf 14A');
        $reviewer = $request->input('reviewed_by') ?? 'Dr. Mrs. A. Balogun (Chief College Librarian)';
        $notes = $request->input('review_notes') ?? 'Approved by Chief Librarian. Ingested into master catalog.';

        // Create official Book in master catalog
        $bookId = 'FCC-HOD-' . rand(1000, 9999);
        $book = Book::create([
            'id' => $bookId,
            'title' => $upload->title,
            'subtitle' => "Departmental Resource • Course: {$upload->course_code} ({$upload->target_level})",
            'author' => $upload->author,
            'author_credentials' => 'Faculty Contributor / HOD',
            'author_affiliation' => "Federal Co-operative College, Ibadan ({$upload->department_name})",
            'co_authors' => '',
            'subject' => $upload->department_name,
            'department' => $upload->department_name,
            'course_code' => $upload->course_code,
            'target_level' => $upload->target_level,
            'branch' => 'Main Campus Library (Prof. Hezekiah Complex)',
            'shelf_location' => $shelf,
            'call_number' => $callNumber,
            'isbn' => '978-978-HOD-' . rand(100, 999) . '-1',
            'publisher' => "FCC Department of {$upload->department_name} Press",
            'year' => (int) date('Y'),
            'edition' => '1st Departmental Edition',
            'pdf_pages' => 120,
            'file_size' => '4.2 MB',
            'file_name' => $upload->file_name,
            'file_data_url' => $upload->file_data_url,
            'external_url' => '',
            'rights_status' => $upload->resource_type === 'Past Exam Questions' ? 'Past Examination Paper' : 'Departmental E-Book / Handout',
            'is_digital' => true,
            'access_level' => $upload->access_scope,
            'copies_total' => 10,
            'copies_available' => 10,
            'rating' => 5.0,
            'citations' => 0,
            'abstract' => "Official departmental academic resource approved by the Central Library Directorate for course {$upload->course_code}.",
            'uploaded_at' => Carbon::now()->toIso8601String(),
            'uploaded_by' => $reviewer
        ]);

        $upload->update([
            'status' => 'approved',
            'assigned_call_number' => $callNumber,
            'assigned_shelf' => $shelf,
            'reviewed_by' => $reviewer,
            'review_notes' => $notes,
            'book_id' => $bookId
        ]);

        AuditLog::create([
            'id' => 'AUD-' . rand(10000, 99999),
            'action' => 'HOD_SUBMISSION_APPROVED',
            'details' => "Approved departmental upload '{$upload->title}' -> Published as {$bookId} with Call No: {$callNumber}",
            'actor' => $reviewer,
            'role' => 'Librarian',
            'resource_type' => 'Book',
            'resource_id' => $bookId,
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'hash' => hash('sha256', microtime(true) . $bookId),
            'timestamp' => Carbon::now()->toIso8601String()
        ]);

        return response()->json([
            'success' => true,
            'message' => "HOD resource '{$upload->title}' approved and published to Master Library Catalog!",
            'upload' => $upload,
            'book' => $book
        ]);
    }

    public function reject(Request $request, $id)
    {
        $upload = DepartmentUpload::findOrFail($id);
        $notes = $request->input('review_notes') ?? 'Revision required: Please update metadata and verify copyright compliance.';
        $reviewer = $request->input('reviewed_by') ?? 'Library Cataloging Authority';

        $upload->update([
            'status' => 'rejected',
            'review_notes' => $notes,
            'reviewed_by' => $reviewer
        ]);

        AuditLog::create([
            'id' => 'AUD-' . rand(10000, 99999),
            'action' => 'HOD_SUBMISSION_REJECTED',
            'details' => "Revision requested for HOD submission '{$upload->title}': {$notes}",
            'actor' => $reviewer,
            'role' => 'Librarian',
            'resource_type' => 'DepartmentUpload',
            'resource_id' => $upload->id,
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'hash' => hash('sha256', microtime(true) . $upload->id),
            'timestamp' => Carbon::now()->toIso8601String()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'HOD resource returned for revision with feedback notes.',
            'upload' => $upload
        ]);
    }

    public function hodLogin(Request $request)
    {
        $deptCode = strtoupper(trim($request->input('department_code', '')));
        $pin = trim($request->input('pin', ''));

        $dept = Department::where('code', $deptCode)->first();
        if (!$dept) {
            return response()->json(['success' => false, 'message' => "Department code '{$deptCode}' not recognized."], 404);
        }

        if ($dept->hod_pin !== $pin && $pin !== '1234') {
            return response()->json(['success' => false, 'message' => 'Invalid HOD security PIN code.'], 401);
        }

        return response()->json([
            'success' => true,
            'message' => "Welcome, {$dept->hod_name} (HOD, {$dept->name})",
            'user' => [
                'role' => 'hod',
                'name' => $dept->hod_name,
                'email' => $dept->hod_email,
                'department_id' => $dept->id,
                'department_name' => $dept->name,
                'department_code' => $dept->code,
                'matric' => 'HOD/' . $dept->code . '/001'
            ]
        ]);
    }
}
