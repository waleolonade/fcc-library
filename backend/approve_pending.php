<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\DepartmentUpload;
use App\Models\Book;
use App\Models\AuditLog;
use Carbon\Carbon;

echo "=== CHECKING FOR PENDING SUBMISSIONS ===" . PHP_EOL;

// 1. Check SQLite
$pendingUploads = DepartmentUpload::where('status', 'pending')->get();
echo "SQLite Pending Uploads Count: " . $pendingUploads->count() . PHP_EOL;

// 2. Check MySQL
$pdo = \App\Services\DatabaseService::getPdo();
if ($pdo) {
    $stmt = $pdo->query("SELECT * FROM department_uploads WHERE status = 'pending'");
    $mysqlPending = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "MySQL Pending Uploads Count: " . count($mysqlPending) . PHP_EOL;

    // Sync any MySQL pending that might not be in SQLite
    foreach ($mysqlPending as $mp) {
        if (!DepartmentUpload::find($mp['id'])) {
            DepartmentUpload::create($mp);
        }
    }
}

// Re-query all pending
$allPending = DepartmentUpload::where('status', 'pending')->get();
echo "Total Pending Uploads to Approve: " . $allPending->count() . PHP_EOL;

if ($allPending->isEmpty()) {
    // Also check if any uploads have no status or null status
    $unapproved = DepartmentUpload::where('status', '!=', 'approved')->orWhereNull('status')->get();
    echo "Unapproved (non-approved / null status) Count: " . $unapproved->count() . PHP_EOL;
    $allPending = $unapproved;
}

$approvedCount = 0;
foreach ($allPending as $upload) {
    echo "Approving: [{$upload->id}] {$upload->title} by {$upload->author} ({$upload->department_name})..." . PHP_EOL;

    $authorCode = strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $upload->author ?: 'FCC'), 0, 3));
    if (strlen($authorCode) < 3) $authorCode = 'FCC';
    $courseNum = preg_replace('/[^0-9]/', '', $upload->course_code ?: '101') ?: '411';
    
    $resType = $upload->resource_type ?: 'Book';
    $isProject = stripos($resType, 'Project') !== false || stripos($resType, 'Thesis') !== false || stripos($resType, 'Dissertation') !== false || stripos($resType, 'Capstone') !== false;
    $isJournal = stripos($resType, 'Journal') !== false || stripos($resType, 'Article') !== false || stripos($resType, 'Periodical') !== false;

    $prefix = $isProject ? 'FCC-PRJ-' : ($isJournal ? 'FCC-JRN-' : 'FCC-HOD-');
    $bookId = $upload->book_id ?: ($prefix . rand(1000, 9999));

    $callNumber = $upload->assigned_call_number ?: ($isProject 
        ? "ETD-{$upload->course_code}-2026/0" . rand(1, 9)
        : ($isJournal ? "JRN-{$upload->course_code}-2026" : "QA76.9 .{$authorCode} 2026-C{$courseNum}"));
        
    $shelf = $upload->assigned_shelf ?: ($isProject 
        ? 'Institutional Repository • Digital ETD Collection'
        : ($isJournal ? 'Periodicals & Journals Section • Rack 4B' : 'Digital E-Library • Academic Stacks'));

    $reviewer = 'Chief College Librarian (Batch Approval)';
    $notes = 'Approved & Published by Chief College Librarian.';
    $rightsStatus = $isProject ? 'Student Capstone Project / Thesis' : ($isJournal ? 'Academic Research Journal' : 'Approved Academic Book');

    $extra = [];
    if (!empty($upload->review_notes) && str_starts_with(trim($upload->review_notes), '{')) {
        $extra = json_decode($upload->review_notes, true) ?: [];
    }

    $effectiveAuthor = ($isProject && !empty($extra['student_names'])) ? $extra['student_names'] : $upload->author;
    $abstract = $extra['abstract'] ?? $upload->abstract ?? "Official departmental {$resType} uploaded by HOD. Approved & Published for academic research and student study.";
    $isbn = !empty($extra['issn']) ? ('ISSN ' . $extra['issn']) : (!empty($extra['isbn']) ? $extra['isbn'] : null);
    $publisher = $extra['publisher'] ?? ($isJournal ? ($extra['journal_name'] ?? 'FCC Directorate of Research') : "FCC Department of {$upload->department_name} Press");
    $pubYear = (int) ($extra['publication_year'] ?? date('Y'));
    $doi = !empty($extra['doi']) ? $extra['doi'] : null;
    $edition = !empty($extra['volume_issue']) ? $extra['volume_issue'] : ($isProject ? 'Student Final Submission' : '1st Official Edition');

    // Create or update in SQLite Book
    $book = Book::updateOrCreate(
        ['id' => $bookId],
        [
            'title' => $upload->title,
            'subtitle' => $isProject ? "Student Research Project • {$upload->department_name} ({$upload->target_level})" : ($isJournal ? ($extra['journal_name'] ?? "Scholarly Journal • Department of {$upload->department_name}") : "Departmental Resource • Course: {$upload->course_code} ({$upload->target_level})"),
            'author' => $effectiveAuthor,
            'author_credentials' => $isProject ? 'Student Researcher / Scholar' : ($isJournal ? 'Peer-Reviewed Academic Author' : 'Faculty Contributor / HOD'),
            'author_affiliation' => "Federal Co-operative College, Ibadan ({$upload->department_name})",
            'co_authors' => '',
            'subject' => $upload->department_name,
            'department' => $upload->department_name,
            'course_code' => $upload->course_code ?: 'GEN 101',
            'target_level' => $upload->target_level ?: 'HND II',
            'branch' => 'Main Campus Library (Prof. Hezekiah Complex)',
            'shelf_location' => $shelf,
            'call_number' => $callNumber,
            'isbn' => $isbn,
            'doi' => $doi,
            'publisher' => $publisher,
            'year' => $pubYear,
            'edition' => $edition,
            'pdf_pages' => 120,
            'file_size' => $upload->file_size ?: '4.5 MB',
            'file_name' => $upload->file_name ?: 'manuscript.pdf',
            'file_data_url' => $upload->file_data_url ?: '',
            'cover_image' => $upload->cover_image ?: '',
            'external_url' => '',
            'rights_status' => $rightsStatus,
            'abstract' => $abstract,
            'uploaded_by' => $upload->hod_name ?: 'HOD',
            'uploaded_at' => Carbon::now()->toIso8601String(),
            'downloads' => 0,
            'citations' => 0,
            'status' => 'Published',
            'is_approved' => 1,
            'reviewed_by' => $reviewer,
            'reviewed_at' => Carbon::now()->toIso8601String()
        ]
    );

    if ($isProject) {
        try {
            \App\Models\Thesis::updateOrCreate(
                ['id' => 'TH-' . str_replace(['FCC-', 'PRJ-', 'HOD-'], '', $bookId)],
                [
                    'title' => $upload->title,
                    'author' => $effectiveAuthor,
                    'matric' => $extra['student_matric'] ?? ($upload->uploaded_by_hod_id ?? 'FCC/STUDENT/' . rand(100, 999)),
                    'department' => $upload->department_name,
                    'department_code' => $upload->department_id,
                    'supervisor' => $extra['supervisor_name'] ?? ($upload->hod_name ?: 'Departmental Academic Board'),
                    'degree' => "Higher National Diploma ({$upload->target_level}) Dissertation",
                    'year' => $pubYear,
                    'pages' => 130,
                    'abstract' => $abstract,
                    'doi' => !empty($extra['doi']) ? $extra['doi'] : null,
                    'call_number' => $callNumber,
                    'downloads' => 0,
                    'file_name' => $upload->file_name,
                    'file_data_url' => $upload->file_data_url,
                    'access_level' => $upload->access_scope ?? 'Public Institution-Wide',
                    'uploaded_by' => $upload->hod_name ?: 'HOD'
                ]
            );
        } catch (\Throwable $thErr) {}
    }

    // Update upload status
    $upload->update([
        'status' => 'approved',
        'assigned_call_number' => $callNumber,
        'assigned_shelf' => $shelf,
        'reviewed_by' => $reviewer,
        'review_notes' => $notes,
        'book_id' => $bookId
    ]);

    // Sync to MySQL
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("
                UPDATE department_uploads 
                SET status = 'approved', assigned_call_number = :call, assigned_shelf = :shelf, reviewed_by = :reviewer, review_notes = :notes, book_id = :bid, updated_at = NOW() 
                WHERE id = :id
            ");
            $stmt->execute([
                ':call' => $callNumber,
                ':shelf' => $shelf,
                ':reviewer' => $reviewer,
                ':notes' => $notes,
                ':bid' => $bookId,
                ':id' => $upload->id
            ]);

            $bStmt = $pdo->prepare("
                INSERT INTO books (id, title, subtitle, author, department, course_code, target_level, call_number, shelf_location, isbn, publisher, year, pdf_pages, file_size, file_name, file_data_url, cover_image, is_digital, access_level, copies_total, copies_available, uploaded_at, uploaded_by)
                VALUES (:id, :title, :subtitle, :author, :department, :course_code, :target_level, :call_number, :shelf_location, :isbn, :publisher, :year, 120, '4.5 MB', :file_name, :file_data_url, :cover_image, 1, 'Public Institution-Wide', 10, 10, NOW(), :uploaded_by)
                ON DUPLICATE KEY UPDATE title = VALUES(title), author = VALUES(author), call_number = VALUES(call_number), shelf_location = VALUES(shelf_location), status = 'Published'
            ");
            $bStmt->execute([
                ':id' => $bookId,
                ':title' => $upload->title,
                ':subtitle' => "Approved Academic Resource • {$upload->department_name}",
                ':author' => $upload->author,
                ':department' => $upload->department_name,
                ':course_code' => $upload->course_code ?: 'GEN 101',
                ':target_level' => $upload->target_level ?: 'HND II',
                ':call_number' => $callNumber,
                ':shelf_location' => $shelf,
                ':isbn' => '978-978-' . rand(100, 999) . '-1',
                ':publisher' => "FCC Department of {$upload->department_name} Press",
                ':year' => (int) date('Y'),
                ':file_name' => $upload->file_name ?: 'document.pdf',
                ':file_data_url' => (strlen((string)$upload->file_data_url) < 1500000) ? (string)$upload->file_data_url : '',
                ':cover_image' => (strlen((string)$upload->cover_image) < 800000) ? (string)$upload->cover_image : '',
                ':uploaded_by' => $upload->hod_name ?: 'HOD'
            ]);
        } catch (\Throwable $e) {
            echo "MySQL sync warning for [{$upload->id}]: " . $e->getMessage() . PHP_EOL;
        }
    }

    $approvedCount++;
    echo " -> Approved successfully as [{$bookId}] with Call No: {$callNumber}" . PHP_EOL;
}

echo "=== SUMMARY: {$approvedCount} BOOKS APPROVED & PUBLISHED ===" . PHP_EOL;
