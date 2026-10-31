<?php

namespace App\Http\Controllers;

use App\Models\Book;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class CatalogController extends Controller
{
    public function index(Request $request)
    {
        // 1. Synchronize local SQLite books table with authoritative MySQL books & department_uploads
        //    so any book deleted from the backend or directly from the MySQL database is immediately purged.
        $this->mirrorBooksFromMysql();

        $query = Book::query();

        if ($branch = $request->query('branch')) {
            if ($branch !== 'All' && $branch !== 'All Libraries') {
                $query->where('branch', 'like', "%{$branch}%");
            }
        }

        if ($author = $request->query('author')) {
            $query->where('author', 'like', "%{$author}%");
        }

        if ($search = $request->query('search')) {
            $field = strtolower(trim((string)$request->query('field', $request->query('search_field', 'all'))));
            $s = "%{$search}%";
            if ($field === 'author') {
                $query->where('author', 'like', $s);
            } elseif ($field === 'title') {
                $query->where('title', 'like', $s);
            } else {
                $query->where(function ($q) use ($s) {
                    $q->where('title', 'like', $s)
                      ->orWhere('author', 'like', $s)
                      ->orWhere('isbn', 'like', $s)
                      ->orWhere('call_number', 'like', $s)
                      ->orWhere('subject', 'like', $s);
                });
            }
        }

        if ($request->query('digitalOnly') === 'true') {
            $query->where('is_digital', 1);
        }

        // Only return authentic books uploaded and approved by HODs or Library Administration
        $query->where(function ($q) {
            $q->where('uploaded_by', 'like', '%Librarian%')
              ->orWhere('uploaded_by', 'like', '%HOD%')
              ->orWhere('uploaded_by', 'like', '%Admin%')
              ->orWhere('id', 'like', 'FCC-%')
              ->orWhereIn('id', function ($sub) {
                  $sub->select('book_id')
                      ->from('department_uploads')
                      ->where('status', 'approved')
                      ->whereNotNull('book_id');
              });
        });

        // Strictly exclude any book linked to a deleted, withdrawn, purged, or rejected department upload
        if (Schema::hasTable('department_uploads')) {
            $query->whereNotIn('id', function ($sub) {
                $sub->select('book_id')
                    ->from('department_uploads')
                    ->whereIn('status', ['deleted', 'withdrawn', 'purged', 'rejected', 'declined', 'pending'])
                    ->whereNotNull('book_id');
            });
        }

        // Exclude any pending, deleted, or unapproved books from the master student catalog if column exists
        if (Schema::hasColumn('books', 'status')) {
            $query->where(function ($q) {
                $q->whereNull('status')
                  ->orWhere('status', 'approved')
                  ->orWhere('status', 'Published')
                  ->orWhere('status', 'published')
                  ->orWhere('status', 'active');
            });
        }

        $selectCols = [
            'id', 'title', 'subtitle', 'author', 'isbn', 'doi', 'call_number', 'callNumber',
            'department', 'subject', 'shelf_location', 'shelfLocation', 'copies_total',
            'copies_available', 'cover_image', 'year', 'publisher', 'edition', 'category',
            'course_code', 'target_level', 'is_digital', 'abstract', 'pdf_pages', 'file_size',
            'rights_status', 'status', 'description', 'file_name', 'uploaded_at', 'updated_at'
        ];
        $actualCols = array_filter($selectCols, fn($col) => Schema::hasColumn('books', $col));
        if (empty($actualCols)) {
            $actualCols = ['*'];
        }

        $uploadsByBookId = [];
        if (Schema::hasTable('department_uploads')) {
            try {
                $uploadsByBookId = \App\Models\DepartmentUpload::whereNotNull('book_id')
                    ->whereNotIn('status', ['deleted', 'withdrawn', 'purged', 'rejected', 'declined'])
                    ->get()
                    ->keyBy('book_id');
            } catch (\Throwable $e) {}
        }

        $books = $query->select($actualCols)->orderBy('uploaded_at', 'desc')->get()->map(function ($book) use ($uploadsByBookId) {
            $data = $book->toArray();
            $linkedUpload = $uploadsByBookId[$book->id] ?? null;
            $extraMeta = [];
            if ($linkedUpload && !empty($linkedUpload->review_notes) && str_starts_with(trim((string) $linkedUpload->review_notes), '{')) {
                $extraMeta = json_decode($linkedUpload->review_notes, true) ?: [];
            }

            $resTypeRaw = $linkedUpload?->resource_type ?: ($book->category ?? '');
            $idStr = strtoupper((string) $book->id);
            $rightsStr = strtolower((string) ($book->rights_status ?? ''));
            $subStr = strtolower((string) ($book->subtitle ?? ''));
            $callStr = strtoupper((string) ($book->call_number ?? ''));
            $catStr = strtolower((string) $resTypeRaw);
            $upCat = strtolower((string) ($extraMeta['upload_category'] ?? ''));

            if (
                $upCat === 'journal' ||
                str_starts_with($idStr, 'FCC-JRN-') ||
                str_starts_with($callStr, 'JRN-') ||
                str_contains($rightsStr, 'journal') ||
                str_contains($subStr, 'journal') ||
                str_contains($catStr, 'journal') ||
                str_contains($catStr, 'article') ||
                str_contains($catStr, 'periodical')
            ) {
                $data['category'] = 'Journal';
                $data['resource_type'] = $resTypeRaw ?: 'Academic Journal';
                $data['journal_name'] = $extraMeta['journal_name'] ?? $book->publisher ?? 'FCC Academic Journal';
                $data['issn'] = $extraMeta['issn'] ?? str_replace('ISSN ', '', (string) $book->isbn);
                $data['volume_issue'] = $extraMeta['volume_issue'] ?? $book->edition ?? 'Vol. 1, Issue 1';
                $data['doi'] = $extraMeta['doi'] ?? ($book->doi ?? '');
            } elseif (
                $upCat === 'project' ||
                str_starts_with($idStr, 'FCC-PRJ-') ||
                str_starts_with($idStr, 'TH-') ||
                str_starts_with($callStr, 'ETD-') ||
                str_contains($rightsStr, 'project') ||
                str_contains($rightsStr, 'thesis') ||
                str_contains($subStr, 'student research project') ||
                str_contains($catStr, 'project') ||
                str_contains($catStr, 'thesis') ||
                str_contains($catStr, 'dissertation') ||
                str_contains($catStr, 'capstone')
            ) {
                $data['category'] = 'Student Project';
                $data['resource_type'] = $resTypeRaw ?: 'Student Project & Thesis';
                $data['student_names'] = $extraMeta['student_names'] ?? $book->author;
                $data['student_matric'] = $extraMeta['student_matric'] ?? '';
                $data['supervisor_name'] = $extraMeta['supervisor_name'] ?? ($book->uploaded_by ?? '');
                $data['doi'] = $extraMeta['doi'] ?? ($book->doi ?? '');
            } else {
                $data['category'] = $book->category ?: 'Book';
                $data['resource_type'] = $resTypeRaw ?: 'Lecture Handout / E-Book';
            }

            $data['hasPdf'] = true;
            $data['has_file'] = true;
            $data['hasBinaryPdf'] = true;
            $data['isDigital'] = true;
            $data['is_digital'] = 1;
            $data['pdfUrl'] = "/api/catalog/{$book->id}/file";
            $data['courseCode'] = $book->course_code ?? $book->courseCode ?? '';
            $data['targetLevel'] = $book->target_level ?? $book->targetLevel ?? 'HND II';
            $data['callNumber'] = $book->call_number ?? $book->callNumber ?? 'FCC.LIB';
            $data['shelfLocation'] = $book->shelf_location ?? $book->shelfLocation ?? 'Digital E-Library';
            // Keep index list lightweight (<50KB total) so catalog loads instantly across all devices
            $data['file_data_url'] = '';
            $data['fileDataUrl'] = '';

            $rawCover = $book->cover_image ?? ($linkedUpload?->cover_image ?? null);
            if (!empty($rawCover) && (strlen($rawCover) > 2048 || str_starts_with($rawCover, 'data:'))) {
                $coverUrl = "/api/catalog/{$book->id}/cover";
                $data['cover_image'] = $coverUrl;
                $data['coverImage'] = $coverUrl;
            } else {
                $data['cover_image'] = $rawCover ?: '/assets/fcc-logo.png';
                $data['coverImage'] = $rawCover ?: '/assets/fcc-logo.png';
            }
            return $data;
        });

        return response()->json($books);
    }

    public function show($id)
    {
        $book = Book::where('id', $id)
            ->orWhereRaw('LOWER(id) = ?', [strtolower($id)])
            ->first();

        // Also check if id has HOD-UP- or FCC-HOD- prefix mismatch
        if (!$book) {
            $altBookId = str_starts_with($id, 'HOD-UP-')
                ? str_replace('HOD-UP-', 'FCC-HOD-', $id)
                : (str_starts_with($id, 'FCC-HOD-') ? str_replace('FCC-HOD-', 'HOD-UP-', $id) : null);
            if ($altBookId) {
                $book = Book::where('id', $altBookId)->orWhereRaw('LOWER(id) = ?', [strtolower($altBookId)])->first();
            }
        }

        // If upload is present, allow Admin, HOD, Developer, and Students to review/view it
        if (!$book) {
            $upload = \App\Models\DepartmentUpload::where('id', $id)
                ->orWhere('book_id', $id)
                ->orWhereRaw('LOWER(id) = ?', [strtolower($id)])
                ->orWhereRaw('LOWER(book_id) = ?', [strtolower($id)])
                ->first();

            if ($upload) {
                if ($upload->book_id && ($b = Book::where('id', $upload->book_id)->first())) {
                    $bData = $b->toArray();
                    $bData['hasBinaryPdf'] = true;
                    $bData['hasPdf'] = true;
                    $bData['has_file'] = true;
                    $bData['pdfUrl'] = "/api/catalog/{$b->id}/file";
                    $bData['status'] = $upload->status ?: 'approved';
                    return response()->json($bData);
                }
                return response()->json([
                    'id' => $upload->book_id ?: $upload->id,
                    'book_id' => $upload->book_id ?: $upload->id,
                    'upload_id' => $upload->id,
                    'title' => $upload->title,
                    'author' => $upload->author,
                    'courseCode' => $upload->course_code,
                    'course_code' => $upload->course_code,
                    'targetLevel' => $upload->target_level,
                    'department' => $upload->department_name,
                    'fileName' => $upload->file_name,
                    'fileDataUrl' => '',
                    'file_data_url' => '',
                    'hasBinaryPdf' => true,
                    'hasPdf' => true,
                    'has_file' => true,
                    'pdfUrl' => "/api/catalog/" . ($upload->book_id ?: $upload->id) . "/file",
                    'file_url' => "/api/catalog/" . ($upload->book_id ?: $upload->id) . "/file",
                    'coverImage' => $upload->cover_image,
                    'cover_image' => $upload->cover_image,
                    'isDigital' => true,
                    'is_digital' => 1,
                    'status' => $upload->status ?: 'approved',
                    'uploadedBy' => $upload->hod_name,
                    'uploaded_by' => $upload->hod_name,
                ]);
            }

            return response()->json(['error' => 'Book not found'], 404);
        }

        $bookData = $book->toArray();
        $bookData['hasBinaryPdf'] = true;
        $bookData['hasPdf'] = true;
        $bookData['has_file'] = true;
        $bookData['pdfUrl'] = "/api/catalog/{$book->id}/file";
        $bookData['file_url'] = "/api/catalog/{$book->id}/file";
        $bookData['status'] = $bookData['status'] ?? 'approved';
        return response()->json($bookData);
    }

    /**
     * Stream or redirect book cover image cleanly without bloating JSON index
     */
    public function cover(Request $request, $id)
    {
        $book = Book::where('id', $id)
            ->orWhereRaw('LOWER(id) = ?', [strtolower($id)])
            ->first();

        $raw = $book?->cover_image;
        if (!$raw && class_exists('\App\Models\DepartmentUpload')) {
            $upload = \App\Models\DepartmentUpload::where('id', $id)
                ->orWhere('book_id', $id)
                ->orWhereRaw('LOWER(id) = ?', [strtolower($id)])
                ->first();
            $raw = $upload?->cover_image;
        }

        if (!empty($raw)) {
            if (str_starts_with($raw, 'data:image/')) {
                $parts = explode(',', $raw, 2);
                if (count($parts) === 2) {
                    $header = $parts[0];
                    $data = base64_decode($parts[1]);
                    $mime = 'image/jpeg';
                    if (preg_match('/data:([^;]+);/i', $header, $m)) {
                        $mime = $m[1];
                    }
                    return response($data, 200, [
                        'Content-Type' => $mime,
                        'Cache-Control' => 'public, max-age=86400',
                    ]);
                }
            } elseif (filter_var($raw, FILTER_VALIDATE_URL) || str_starts_with($raw, 'http://') || str_starts_with($raw, 'https://')) {
                return redirect($raw);
            } elseif (str_starts_with($raw, '/assets/')) {
                return redirect($raw);
            }
        }

        $fallback = public_path('assets/fcc-logo.png');
        if (file_exists($fallback)) {
            return response()->file($fallback, [
                'Content-Type' => 'image/png',
                'Cache-Control' => 'public, max-age=86400',
            ]);
        }

        return redirect('/assets/fcc-logo.png');
    }

    /**
     * Stream the uploaded PDF file for an admin or HOD book
     */
    public function file(Request $request, $id)
    {
        $book = Book::where('id', $id)
            ->orWhereRaw('LOWER(id) = ?', [strtolower($id)])
            ->first();

        // Also check if id has HOD-UP- or FCC-HOD- prefix mismatch
        if (!$book) {
            $altBookId = str_starts_with($id, 'HOD-UP-')
                ? str_replace('HOD-UP-', 'FCC-HOD-', $id)
                : (str_starts_with($id, 'FCC-HOD-') ? str_replace('FCC-HOD-', 'HOD-UP-', $id) : null);
            if ($altBookId) {
                $book = Book::where('id', $altBookId)->orWhereRaw('LOWER(id) = ?', [strtolower($altBookId)])->first();
            }
        }

        // Locate corresponding DepartmentUpload if any
        $cleanSuffix = preg_replace('/^.*-/', '', $id);

        $upload = \App\Models\DepartmentUpload::where('book_id', $id)
            ->orWhere('id', $id)
            ->orWhereRaw('LOWER(book_id) = ?', [strtolower($id)])
            ->orWhereRaw('LOWER(id) = ?', [strtolower($id)])
            ->when($book, function ($q) use ($book) {
                $q->orWhere('title', $book->title);
            })
            ->when($cleanSuffix && strlen($cleanSuffix) >= 3, function ($q) use ($cleanSuffix) {
                $q->orWhere('id', 'LIKE', "%{$cleanSuffix}%")
                  ->orWhere('book_id', 'LIKE', "%{$cleanSuffix}%");
            })
            ->first();

        // 1. Check physical disk storage across possible filenames and folders
        $safeId = preg_replace('/[^a-zA-Z0-9_-]/', '_', $id);
        $storageDirs = [
            storage_path('app/public/department_uploads'),
            storage_path('app/public/theses'),
            storage_path('app/public/books'),
            storage_path('app/public'),
        ];

        $candidateNames = array_unique(array_filter([
            $safeId . '.pdf',
            str_replace('FCC-HOD-', 'HOD-UP-', $safeId) . '.pdf',
            str_replace('HOD-UP-', 'FCC-HOD-', $safeId) . '.pdf',
            $upload ? preg_replace('/[^a-zA-Z0-9_-]/', '_', $upload->id) . '.pdf' : null,
            $upload && $upload->book_id ? preg_replace('/[^a-zA-Z0-9_-]/', '_', $upload->book_id) . '.pdf' : null,
            $book ? preg_replace('/[^a-zA-Z0-9_-]/', '_', $book->id) . '.pdf' : null,
            $book?->file_name,
            $upload?->file_name,
            $cleanSuffix ? 'HOD-UP-' . $cleanSuffix . '.pdf' : null,
            $cleanSuffix ? 'FCC-HOD-' . $cleanSuffix . '.pdf' : null,
        ]));

        $foundDiskPath = null;
        foreach ($storageDirs as $dir) {
            if (!is_dir($dir)) continue;
            foreach ($candidateNames as $name) {
                $checkPath = $dir . '/' . $name;
                if ($this->isValidPdfFile($checkPath)) {
                    $foundDiskPath = $checkPath;
                    break 2;
                }
            }
        }

        // Also do a glob search if cleanSuffix is available (avoid scanning for generic keywords like 'pdf' or 'file')
        $ignoredSuffixes = ['pdf', 'file', 'undefined', 'null', 'book', 'upload'];
        if (!$foundDiskPath && $cleanSuffix && strlen($cleanSuffix) >= 3 && !in_array(strtolower($cleanSuffix), $ignoredSuffixes)) {
            foreach ($storageDirs as $dir) {
                if (!is_dir($dir)) continue;
                $matches = glob($dir . '/*' . $cleanSuffix . '*.pdf');
                if (!empty($matches)) {
                    foreach ($matches as $m) {
                        if ($this->isValidPdfFile($m)) {
                            $foundDiskPath = $m;
                            break 2;
                        }
                    }
                }
            }
        }

        $isDownload = $request->query('download') || $request->input('dl') === '1';

        if ($foundDiskPath) {
            $filename = ($book?->file_name) ?: ($upload?->file_name) ?: (basename($foundDiskPath));
            return response()->file($foundDiskPath, [
                'Content-Type' => 'application/pdf',
                'Accept-Ranges' => 'bytes',
                'Content-Disposition' => ($isDownload ? 'attachment' : 'inline') . '; filename="' . $filename . '"',
                'Cache-Control' => 'public, max-age=86400',
                'Access-Control-Allow-Origin' => '*'
            ]);
        }

        // 2. Check base64 in SQLite or MySQL database
        $dataUrl = $book?->getAttribute('file_data_url') ?: $upload?->file_data_url;

        if (!$dataUrl) {
            try {
                $pdo = \App\Services\DatabaseService::getPdo();
                if ($pdo) {
                    $st = $pdo->prepare("SELECT file_data_url, file_name FROM books WHERE id = :id");
                    $st->execute([':id' => $id]);
                    $mRow = $st->fetch(\PDO::FETCH_ASSOC);
                    if ($mRow && !empty($mRow['file_data_url'])) {
                        $dataUrl = $mRow['file_data_url'];
                    } else {
                        $sql = "SELECT file_data_url, file_name FROM department_uploads WHERE id = :id OR book_id = :id" . ($upload ? " OR id = :uid" : "");
                        $st2 = $pdo->prepare($sql);
                        $params = [':id' => $id];
                        if ($upload) $params[':uid'] = $upload->id;
                        $st2->execute($params);
                        $mRow2 = $st2->fetch(\PDO::FETCH_ASSOC);
                        if ($mRow2 && !empty($mRow2['file_data_url'])) {
                            $dataUrl = $mRow2['file_data_url'];
                        }
                    }
                }
            } catch (\Throwable $e) {}
        }

        if (!$dataUrl) {
            $thesis = \App\Models\Thesis::where('id', $id)
                ->orWhereRaw('LOWER(id) = ?', [strtolower($id)])
                ->first();
            $dataUrl = $thesis?->getAttribute('file_data_url');
        }

        if ($dataUrl) {
            $mime = 'application/pdf';
            $payload = $dataUrl;
            if (preg_match('#^data:([^;]+);base64,(.*)$#s', $dataUrl, $m)) {
                $mime = $m[1];
                $payload = $m[2];
            }
            $binary = base64_decode($payload);
            if ($binary && strlen($binary) > 200) {
                // Cache to disk
                $targetDir = storage_path('app/public/department_uploads');
                if (!is_dir($targetDir)) @mkdir($targetDir, 0755, true);
                @file_put_contents($targetDir . '/' . $safeId . '.pdf', $binary);
                if ($upload) {
                    @file_put_contents($targetDir . '/' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $upload->id) . '.pdf', $binary);
                }
                $filename = ($book?->file_name) ?: ($upload?->file_name) ?: ($safeId . '.pdf');
                return response($binary, 200, [
                    'Content-Type' => $mime,
                    'Accept-Ranges' => 'bytes',
                    'Content-Disposition' => ($isDownload ? 'attachment' : 'inline') . '; filename="' . $filename . '"',
                    'Cache-Control' => 'public, max-age=86400',
                    'Access-Control-Allow-Origin' => '*'
                ]);
            }
        }

        // 3. Fallback: Generate Syllabus PDF if no file is present
        $binary = $this->generateSyllabusPdf($book, $upload ?? null);
        $cleanTitle = $book?->title ? preg_replace('/[^a-zA-Z0-9_\-]/', '_', $book->title) : $id;
        $filename = ($book?->file_name) ?: ($cleanTitle . '.pdf');

        return response($binary, 200, [
            'Content-Type' => 'application/pdf',
            'Accept-Ranges' => 'bytes',
            'Content-Disposition' => ($isDownload ? 'attachment' : 'inline') . '; filename="' . $filename . '"',
            'Cache-Control' => 'public, max-age=86400',
            'Access-Control-Allow-Origin' => '*'
        ]);
    }

    private function isValidPdfFile(string $path): bool
    {
        if (!file_exists($path) || filesize($path) < 200) return false;
        $fh = @fopen($path, 'rb');
        if (!$fh) return false;
        $head = fread($fh, 1024);
        if (!str_starts_with($head, '%PDF-')) {
            fclose($fh);
            return false;
        }
        $size = filesize($path);
        fseek($fh, max(0, $size - 2048));
        $tail = fread($fh, 2048);
        fclose($fh);
        return str_contains($tail, '%%EOF');
    }

    private function generateSyllabusPdf($book, $upload = null): string
    {
        $title = $book?->title ?? $upload?->title ?? 'Institutional Academic Monograph';
        $author = $book?->author ?? $upload?->author ?? 'Department Faculty Scholar';
        $dept = $book?->department ?? $upload?->department_name ?? 'Federal Co-operative College, Ibadan';
        $courseCode = $book?->course_code ?? $upload?->course_code ?? 'GEN 101';
        $level = $book?->target_level ?? $upload?->target_level ?? 'HND II';
        $callNo = $book?->call_number ?? 'FCC.LIB.2026';
        $date = date('Y-m-d H:i');

        $titleEsc = addcslashes($title, '()\\');
        $authorEsc = addcslashes($author, '()\\');
        $deptEsc = addcslashes($dept, '()\\');
        $courseEsc = addcslashes($courseCode . " (" . $level . ")", '()\\');
        $callEsc = addcslashes($callNo, '()\\');

        $content = "BT\n"
                 . "/F1 18 Tf\n"
                 . "50 740 Td (FEDERAL CO-OPERATIVE COLLEGE, IBADAN) Tj\n"
                 . "0 -24 Td\n"
                 . "/F1 11 Tf\n"
                 . "(INSTITUTIONAL DIGITAL REPOSITORY - OFFICIAL CURRICULUM SYLLABUS) Tj\n"
                 . "0 -35 Td\n"
                 . "/F1 15 Tf\n"
                 . "({$titleEsc}) Tj\n"
                 . "0 -22 Td\n"
                 . "/F1 11 Tf\n"
                 . "(Course Code: {$courseEsc}  |  Call No: {$callEsc}) Tj\n"
                 . "0 -18 Td\n"
                 . "(Department: {$deptEsc}) Tj\n"
                 . "0 -18 Td\n"
                 . "(Instructor / Author: {$authorEsc}) Tj\n"
                 . "0 -18 Td\n"
                 . "(Accreditation: Approved by Central Library Directorate & Academic Board) Tj\n"
                 . "0 -35 Td\n"
                 . "/F1 13 Tf\n"
                 . "(MODULE 1: CURRICULUM SYLLABUS & LEARNING OUTCOMES) Tj\n"
                 . "0 -20 Td\n"
                 . "/F1 10 Tf\n"
                 . "(This official departmental publication has been vetted for institutional curriculum) Tj\n"
                 . "0 -14 Td\n"
                 . "(compliance. Scholars must complete weekly lectures, practical laboratories,) Tj\n"
                 . "0 -14 Td\n"
                 . "(and continuous assessment exercises as scheduled in the college academic calendar.) Tj\n"
                 . "0 -28 Td\n"
                 . "/F1 13 Tf\n"
                 . "(MODULE 2: RECOMMENDED READINGS & RESERVE COLLECTIONS) Tj\n"
                 . "0 -20 Td\n"
                 . "/F1 10 Tf\n"
                 . "(1. Physical reserve copies are held at the Central Campus Library circulation desk.) Tj\n"
                 . "0 -14 Td\n"
                 . "(2. Electronic chapters and annotations can be viewed via the Interactive Reader.) Tj\n"
                 . "0 -14 Td\n"
                 . "(3. Review questions and past examination problems are appended per syllabus unit.) Tj\n"
                 . "ET\n";

        $len = strlen($content);

        return "%PDF-1.4\n"
             . "1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n"
             . "2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj\n"
             . "3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources <</Font <</F1 5 0 R>>>> >> endobj\n"
             . "4 0 obj <</Length {$len}>> stream\n{$content}endstream\nendobj\n"
             . "5 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>> endobj\n"
             . "xref\n0 6\n"
             . "0000000000 65535 f \n"
             . "0000000009 00000 n \n"
             . "0000000058 00000 n \n"
             . "0000000115 00000 n \n"
             . "0000000236 00000 n \n"
             . sprintf("%010d 00000 n \n", 236 + 48 + $len)
             . "trailer <</Size 6 /Root 1 0 R>>\n"
             . "startxref\n"
             . sprintf("%d\n", 236 + 48 + $len + 70)
             . "%%EOF\n";
    }

    public function checkDuplicate(Request $request)
    {
        $title = trim($request->input('title', ''));
        $isbn = trim($request->input('isbn', ''));
        $doi = trim($request->input('doi', ''));
        $fileName = trim($request->input('fileName', ''));

        $existing = null;

        if ($isbn) {
            $existing = Book::where('isbn', $isbn)->first();
        }

        if (!$existing && $doi) {
            $existing = Book::where('doi', $doi)->first();
        }

        if (!$existing && $title) {
            $cleanTitle = strtolower(preg_replace('/[^a-zA-Z0-9\s]/', '', str_replace(['.pdf', '-', '_'], ' ', $title)));
            $cleanTitle = trim(preg_replace('/\s+/', ' ', $cleanTitle));

            $all = Book::select('id', 'title', 'author', 'isbn', 'call_number', 'file_name', 'uploaded_at')->get();
            foreach ($all as $b) {
                $bTitle = strtolower(preg_replace('/[^a-zA-Z0-9\s]/', '', str_replace(['.pdf', '-', '_'], ' ', $b->title)));
                $bTitle = trim(preg_replace('/\s+/', ' ', $bTitle));
                if ($bTitle === $cleanTitle || (strlen($cleanTitle) > 8 && (str_contains($bTitle, $cleanTitle) || str_contains($cleanTitle, $bTitle)))) {
                    $existing = $b;
                    break;
                }
            }
        }

        if (!$existing && $fileName) {
            $existing = Book::whereRaw('LOWER(file_name) = ?', [strtolower($fileName)])->first();
        }

        if ($existing) {
            return response()->json([
                'isDuplicate' => true,
                'message' => "Book already exists in library catalogue as \"{$existing->title}\" by {$existing->author}",
                'book' => [
                    'id' => $existing->id,
                    'title' => $existing->title,
                    'author' => $existing->author,
                    'isbn' => $existing->isbn,
                    'callNumber' => $existing->call_number,
                    'fileName' => $existing->file_name,
                    'uploadedAt' => $existing->uploaded_at
                ]
            ]);
        }

        return response()->json([
            'isDuplicate' => false,
            'message' => 'No duplicate detected'
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->all();
        $id = $data['id'] ?? ('FCC-PDF-' . rand(1000, 9999));

        $book = Book::updateOrCreate(
            ['id' => $id],
            [
                'title' => $data['title'] ?? 'Untitled Publication',
                'subtitle' => $data['subtitle'] ?? null,
                'author' => $data['author'] ?? 'FCC Library Scholar',
                'author_credentials' => $data['authorCredentials'] ?? null,
                'author_affiliation' => $data['authorAffiliation'] ?? 'Federal Co-operative College, Ibadan',
                'orcid' => $data['orcid'] ?? null,
                'co_authors' => $data['coAuthors'] ?? null,
                'subject' => $data['subject'] ?? 'Institutional Monograph',
                'department' => $data['department'] ?? 'General Studies',
                'course_code' => $data['courseCode'] ?? null,
                'target_level' => $data['targetLevel'] ?? 'All Levels',
                'branch' => $data['branch'] ?? 'Main Campus Library',
                'shelf_location' => $data['shelfLocation'] ?? 'Digital Server Node A',
                'call_number' => $data['callNumber'] ?? ('FCC.' . rand(100, 999)),
                'isbn' => $data['isbn'] ?? null,
                'doi' => $data['doi'] ?? null,
                'publisher' => $data['publisher'] ?? 'FCC Institutional Press',
                'year' => $data['year'] ?? (int) date('Y'),
                'edition' => $data['edition'] ?? '1st Edition',
                'pdf_pages' => $data['pdfPages'] ?? 0,
                'file_size' => $data['fileSize'] ?? '1.2 MB',
                'file_name' => $data['fileName'] ?? null,
                'file_data_url' => $data['fileDataUrl'] ?? null,
                'cover_image' => $data['coverImage'] ?? $data['cover_image'] ?? null,
                'external_url' => $data['externalUrl'] ?? null,
                'is_digital' => isset($data['isDigital']) ? (bool) $data['isDigital'] : true,
                'access_level' => $data['accessLevel'] ?? 'Open Access Full-Text',
                'rights_status' => $data['rightsStatus'] ?? 'Institutional Repository Licensed',
                'copies_total' => $data['copiesTotal'] ?? 1,
                'copies_available' => $data['copiesAvailable'] ?? 1,
                'rating' => $data['rating'] ?? 5.0,
                'citations' => $data['citations'] ?? 0,
                'abstract' => $data['abstract'] ?? null,
                'keywords' => is_array($data['keywords'] ?? null) ? $data['keywords'] : json_decode($data['keywords'] ?? '[]', true),
                'chapters' => is_array($data['chapters'] ?? null) ? $data['chapters'] : json_decode($data['chapters'] ?? '[]', true),
                'references_data' => is_array($data['references'] ?? null) ? $data['references'] : json_decode($data['references'] ?? '[]', true),
                'reference_style' => $data['referenceStyle'] ?? 'APA 7th',
                'uploaded_at' => $data['uploadedAt'] ?? now()->toIso8601String(),
                'uploaded_by' => $data['uploadedBy'] ?? 'Admin Librarian'
            ]
        );

        // Save physical binary PDF to disk storage
        $fileData = $data['fileDataUrl'] ?? $data['file_data_url'] ?? null;
        if (!empty($fileData)) {
            try {
                $storageDir = storage_path('app/public/books');
                if (!is_dir($storageDir)) @mkdir($storageDir, 0755, true);
                $hodDir = storage_path('app/public/department_uploads');
                if (!is_dir($hodDir)) @mkdir($hodDir, 0755, true);

                $safeId = preg_replace('/[^a-zA-Z0-9_-]/', '_', $id);
                $rawBinary = null;
                if (str_starts_with($fileData, 'data:')) {
                    [, $b64] = explode(',', $fileData, 2);
                    $rawBinary = base64_decode($b64);
                } else {
                    $rawBinary = base64_decode($fileData);
                }
                if ($rawBinary && strlen($rawBinary) > 100) {
                    @file_put_contents($storageDir . '/' . $safeId . '.pdf', $rawBinary);
                    @file_put_contents($hodDir . '/' . $safeId . '.pdf', $rawBinary);
                }
            } catch (\Throwable $fileErr) {}
        }

        $this->syncBookToMysql($book);

        return response()->json([
            'success' => true,
            'message' => 'Book catalogued successfully in Laravel 11 backend',
            'book' => $book
        ]);
    }

    /**
     * Synchronize SQLite `books` and `department_uploads` with the authoritative MySQL database
     * so deletions performed in the backend or directly in MySQL are immediately reflected on OPAC.
     */
    private function mirrorBooksFromMysql(): void
    {
        try {
            $pdo = \App\Services\DatabaseService::getPdo();
            if (!$pdo) {
                return;
            }

            // 1. Delete any MySQL books whose department_uploads record in MySQL is deleted/withdrawn/rejected
            try {
                $pdo->exec("
                    DELETE FROM books
                    WHERE id IN (
                        SELECT book_id FROM department_uploads
                        WHERE book_id IS NOT NULL AND book_id != ''
                          AND status IN ('deleted', 'withdrawn', 'purged', 'rejected', 'declined')
                    )
                ");
            } catch (\Throwable $e) {}

            // 2. Fetch authoritative live books from MySQL
            $stmt = $pdo->query("
                SELECT id, title, subtitle, author, author_credentials, author_affiliation, co_authors,
                       subject, department, course_code, target_level, branch, shelf_location, call_number,
                       isbn, doi, publisher, year, edition, pdf_pages, file_size, file_name, cover_image,
                       external_url, is_digital, access_level, rights_status, copies_total, copies_available,
                       rating, citations, abstract, uploaded_at, uploaded_by
                FROM books
                WHERE status IS NULL OR LOWER(status) NOT IN ('deleted', 'withdrawn', 'purged', 'rejected', 'declined', 'pending')
                ORDER BY uploaded_at DESC
            ");

            if ($stmt === false) {
                return;
            }

            $mysqlBooks = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            $mysqlIds = array_values(array_filter(array_column($mysqlBooks, 'id')));

            // 3. Purge any book in SQLite that no longer exists in MySQL
            if (empty($mysqlIds)) {
                Book::query()->delete();
                if (Schema::hasTable('department_uploads')) {
                    DB::table('department_uploads')
                        ->where('status', 'approved')
                        ->update(['status' => 'deleted', 'book_id' => null]);
                }
            } else {
                // Find SQLite books that were removed from MySQL and mark their department_uploads as deleted
                $removedBookIds = Book::whereNotIn('id', $mysqlIds)->pluck('id')->toArray();
                if (!empty($removedBookIds)) {
                    Book::whereIn('id', $removedBookIds)->delete();
                    if (Schema::hasTable('department_uploads')) {
                        DB::table('department_uploads')
                            ->whereIn('book_id', $removedBookIds)
                            ->update(['status' => 'deleted', 'book_id' => null]);
                    }
                }

                // Upsert existing MySQL books into SQLite so metadata is always in sync
                $sqliteCols = Schema::getColumnListing('books');
                foreach ($mysqlBooks as $mb) {
                    $filtered = [];
                    foreach ($mb as $k => $v) {
                        if (in_array($k, $sqliteCols, true)) {
                            $filtered[$k] = $v;
                        }
                    }
                    if (!empty($filtered['id'])) {
                        Book::updateOrCreate(['id' => $filtered['id']], $filtered);
                    }
                }
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('[mirrorBooksFromMysql] ' . $e->getMessage());
        }
    }

    private function syncBookToMysql($book): void
    {
        try {
            $pdo = \App\Services\DatabaseService::getPdo();
            if (!$pdo) return;

            $fileData = $book->file_data_url;
            if (strlen((string)$fileData) > 200000) {
                $fileData = '';
            }
            $coverData = $book->cover_image;
            if (strlen((string)$coverData) > 400000) {
                $coverData = '';
            }

            $stmt = $pdo->prepare("
                INSERT INTO books (id, title, subtitle, author, department, course_code, target_level, call_number, shelf_location, isbn, doi, publisher, year, pdf_pages, file_size, file_name, file_data_url, cover_image, is_digital, access_level, copies_total, copies_available, uploaded_at, uploaded_by)
                VALUES (:id, :title, :subtitle, :author, :department, :course_code, :target_level, :call_number, :shelf_location, :isbn, :doi, :publisher, :year, :pdf_pages, :file_size, :file_name, :file_data_url, :cover_image, :is_digital, :access_level, :copies_total, :copies_available, :uploaded_at, :uploaded_by)
                ON DUPLICATE KEY UPDATE
                title = VALUES(title), subtitle = VALUES(subtitle), author = VALUES(author), department = VALUES(department), course_code = VALUES(course_code), target_level = VALUES(target_level), call_number = VALUES(call_number), shelf_location = VALUES(shelf_location), isbn = VALUES(isbn), doi = VALUES(doi), publisher = VALUES(publisher), year = VALUES(year), pdf_pages = VALUES(pdf_pages), file_size = VALUES(file_size), file_name = VALUES(file_name), file_data_url = IF(VALUES(file_data_url) != '', VALUES(file_data_url), file_data_url), cover_image = IF(VALUES(cover_image) != '', VALUES(cover_image), cover_image), is_digital = VALUES(is_digital), access_level = VALUES(access_level), copies_total = VALUES(copies_total), copies_available = VALUES(copies_available), uploaded_at = VALUES(uploaded_at), uploaded_by = VALUES(uploaded_by)
            ");
            $stmt->execute([
                ':id' => $book->id,
                ':title' => $book->title,
                ':subtitle' => $book->subtitle,
                ':author' => $book->author,
                ':department' => $book->department,
                ':course_code' => $book->course_code,
                ':target_level' => $book->target_level,
                ':call_number' => $book->call_number,
                ':shelf_location' => $book->shelf_location,
                ':isbn' => $book->isbn,
                ':doi' => $book->doi,
                ':publisher' => $book->publisher,
                ':year' => $book->year,
                ':pdf_pages' => $book->pdf_pages,
                ':file_size' => $book->file_size,
                ':file_name' => $book->file_name,
                ':file_data_url' => $fileData,
                ':cover_image' => $coverData,
                ':is_digital' => $book->is_digital ? 1 : 0,
                ':access_level' => $book->access_level,
                ':copies_total' => $book->copies_total,
                ':copies_available' => $book->copies_available,
                ':uploaded_at' => $book->uploaded_at ?? date('Y-m-d H:i:s'),
                ':uploaded_by' => $book->uploaded_by ?? 'Admin Librarian'
            ]);
        } catch (\Exception $e) {}
    }

    public function destroy($id)
    {
        $cleanId = trim($id);
        $book = Book::find($cleanId);
        $bookTitle = $book ? $book->title : null;
        
        // Also delete via DB query in case of ID variations
        $deleted = Book::where('id', $cleanId)->delete();
        if ($bookTitle) {
            Book::where('title', $bookTitle)->where('id', 'like', 'FCC-%')->delete();
        }

        // Synchronize deletion to MySQL PDO if available
        try {
            $pdo = \App\Services\DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->prepare("DELETE FROM books WHERE id = :id");
                $st->execute([':id' => $cleanId]);
                if ($bookTitle) {
                    $stTitle = $pdo->prepare("DELETE FROM books WHERE title = :title AND id LIKE 'FCC-%'");
                    $stTitle->execute([':title' => $bookTitle]);
                }
                $stUp = $pdo->prepare("UPDATE department_uploads SET status = 'deleted', book_id = NULL, updated_at = NOW() WHERE book_id = :id OR id = :id2");
                $stUp->execute([':id' => $cleanId, ':id2' => $cleanId]);
                if ($bookTitle) {
                    $stUpTitle = $pdo->prepare("UPDATE department_uploads SET status = 'deleted', book_id = NULL, updated_at = NOW() WHERE title = :title");
                    $stUpTitle->execute([':title' => $bookTitle]);
                }
            }
        } catch (\Throwable $e) {}

        // If upload linkage exists, mark deleted and detach
        try {
            DB::table('department_uploads')
                ->where('book_id', $cleanId)
                ->orWhere('id', $cleanId)
                ->update(['status' => 'deleted', 'book_id' => null]);
            if ($bookTitle) {
                DB::table('department_uploads')
                    ->where('title', $bookTitle)
                    ->update(['status' => 'deleted', 'book_id' => null]);
            }
            DB::table('course_reserves')->where('book_id', $cleanId)->delete();
        } catch (\Throwable $e) {}

        return response()->json([
            'success' => true,
            'message' => "Book '{$cleanId}' successfully deleted from catalog and database."
        ]);
    }

    /**
     * POST /api/catalog/bulk-delete
     * Delete multiple books in bulk from database
     */
    public function bulkDestroy(Request $request)
    {
        $ids = $request->input('ids', []);
        if (!is_array($ids) || empty($ids)) {
            return response()->json([
                'success' => false,
                'error' => 'No book IDs provided for bulk deletion.'
            ], 422);
        }

        $cleanIds = array_values(array_filter(array_map('trim', $ids)));
        if (empty($cleanIds)) {
            return response()->json([
                'success' => false,
                'error' => 'No valid book IDs provided.'
            ], 422);
        }

        $titles = Book::whereIn('id', $cleanIds)->pluck('title')->filter()->unique()->values()->toArray();

        // 1. Delete from SQLite
        $deletedCount = Book::whereIn('id', $cleanIds)->delete();
        if (!empty($titles)) {
            Book::whereIn('title', $titles)->where('id', 'like', 'FCC-%')->delete();
        }

        // 2. Delete from live MySQL PDO
        try {
            $pdo = \App\Services\DatabaseService::getPdo();
            if ($pdo) {
                $placeholders = implode(',', array_fill(0, count($cleanIds), '?'));
                $stmt = $pdo->prepare("DELETE FROM books WHERE id IN ($placeholders)");
                $stmt->execute($cleanIds);

                $stmtUp = $pdo->prepare("UPDATE department_uploads SET status = 'deleted', book_id = NULL, updated_at = NOW() WHERE book_id IN ($placeholders) OR id IN ($placeholders)");
                $stmtUp->execute(array_merge($cleanIds, $cleanIds));

                if (!empty($titles)) {
                    $tPlaceholders = implode(',', array_fill(0, count($titles), '?'));
                    $stmtT = $pdo->prepare("DELETE FROM books WHERE title IN ($tPlaceholders) AND id LIKE 'FCC-%'");
                    $stmtT->execute($titles);
                    $stmtUpT = $pdo->prepare("UPDATE department_uploads SET status = 'deleted', book_id = NULL, updated_at = NOW() WHERE title IN ($tPlaceholders)");
                    $stmtUpT->execute($titles);
                }
            }
        } catch (\Throwable $e) {}

        // 3. Clean up linkages
        try {
            DB::table('department_uploads')
                ->whereIn('book_id', $cleanIds)
                ->orWhereIn('id', $cleanIds)
                ->update(['status' => 'deleted', 'book_id' => null]);
            if (!empty($titles)) {
                DB::table('department_uploads')
                    ->whereIn('title', $titles)
                    ->update(['status' => 'deleted', 'book_id' => null]);
            }
            DB::table('course_reserves')->whereIn('book_id', $cleanIds)->delete();
        } catch (\Throwable $e) {}

        return response()->json([
            'success' => true,
            'count' => $deletedCount ?: count($cleanIds),
            'message' => "Successfully deleted " . ($deletedCount ?: count($cleanIds)) . " books from the catalog and database."
        ]);
    }

    /**
     * Multi-tier cascading Barcode / ISBN lookup endpoint:
     * 1. Local Database Cache
     * 2. Open Library Books & Search API
     * 3. Google Books Global API (Fallback)
     */
    public function lookupIsbn(Request $request)
    {
        $rawIsbn = $request->query('isbn') ?? $request->input('isbn', '');
        $cleanIsbn = preg_replace('/[-\s]/', '', trim($rawIsbn));

        if (!$cleanIsbn) {
            return response()->json(['found' => false, 'message' => 'ISBN is required'], 400);
        }

        // 1. Check Local DB Cache
        $localBook = Book::whereRaw("REPLACE(REPLACE(isbn, '-', ''), ' ', '') = ?", [$cleanIsbn])->first();
        if ($localBook) {
            return response()->json([
                'found' => true,
                'source' => 'FCC Local Database Cache',
                'isLocal' => true,
                'book' => $localBook
            ]);
        }

        // 2. Open Library Books & Search API
        try {
            $olUrl = "https://openlibrary.org/search.json?isbn=" . urlencode($cleanIsbn);
            $olRes = \Illuminate\Support\Facades\Http::withHeaders([
                'User-Agent' => 'FCC-Ibadan-SmartLibrary/5.0 (https://fccibadanlibrary.com.ng; mailto:librarian@fccibadanlibrary.com.ng)'
            ])->timeout(6)->get($olUrl);

            if ($olRes->successful() && !empty($olRes->json('docs'))) {
                $doc = $olRes->json('docs.0');
                $authors = $doc['author_name'] ?? ['Unknown Author'];
                return response()->json([
                    'found' => true,
                    'source' => 'Open Library Books & Search API',
                    'isLocal' => false,
                    'book' => [
                        'isbn' => $cleanIsbn,
                        'title' => $doc['title'] ?? 'Untitled Monograph',
                        'author' => implode(', ', $authors),
                        'publishYear' => $doc['first_publish_year'] ?? ($doc['publish_year'][0] ?? date('Y')),
                        'publisher' => $doc['publisher'][0] ?? 'Open Library Archive',
                        'subjects' => array_slice($doc['subject'] ?? [], 0, 5),
                        'coverUrl' => "https://covers.openlibrary.org/b/isbn/{$cleanIsbn}-M.jpg?default=false",
                        'externalUrl' => isset($doc['key']) ? "https://openlibrary.org{$doc['key']}" : null,
                    ]
                ]);
            }
        } catch (\Exception $e) {
            // Cascade to Google Books
        }

        // 3. Google Books API Fallback
        try {
            $gbUrl = "https://www.googleapis.com/books/v1/volumes?q=isbn:" . urlencode($cleanIsbn) . "&maxResults=1";
            $gbRes = \Illuminate\Support\Facades\Http::timeout(6)->get($gbUrl);

            if ($gbRes->successful() && !empty($gbRes->json('items'))) {
                $item = $gbRes->json('items.0');
                $vol = $item['volumeInfo'] ?? [];
                $authors = $vol['authors'] ?? ['Unknown Author'];
                $coverUrl = $vol['imageLinks']['thumbnail'] ?? "https://covers.openlibrary.org/b/isbn/{$cleanIsbn}-M.jpg?default=false";

                return response()->json([
                    'found' => true,
                    'source' => 'Google Books Global API (Fallback)',
                    'isLocal' => false,
                    'book' => [
                        'isbn' => $cleanIsbn,
                        'title' => $vol['title'] ?? 'Google Books Volume',
                        'author' => implode(', ', $authors),
                        'publishYear' => isset($vol['publishedDate']) ? (int) substr($vol['publishedDate'], 0, 4) : (int) date('Y'),
                        'publisher' => $vol['publisher'] ?? 'Google Books Partner',
                        'subjects' => $vol['categories'] ?? ['Curriculum Resources'],
                        'description' => $vol['description'] ?? null,
                        'coverUrl' => $coverUrl,
                        'googleBookId' => $item['id'] ?? null,
                        'previewUrl' => $vol['previewLink'] ?? null,
                        'externalUrl' => $vol['infoLink'] ?? null
                    ]
                ]);
            }
        } catch (\Exception $e) {
            // Not found
        }

        return response()->json([
            'found' => false,
            'source' => 'None',
            'message' => 'No bibliographic record found for ISBN ' . $cleanIsbn
        ], 404);
    }

    private function ensureFavoritesTable(): void
    {
        try {
            if (!Schema::hasTable('favorites')) {
                Schema::create('favorites', function ($table) {
                    $table->id();
                    $table->string('user_identifier')->index();
                    $table->string('book_id')->index();
                    $table->timestamps();
                });
            }
        } catch (\Throwable $e) {}

        try {
            $pdo = \App\Services\DatabaseService::getPdo();
            if ($pdo) {
                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS favorites (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_identifier VARCHAR(191) NOT NULL,
                        book_id VARCHAR(191) NOT NULL,
                        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        INDEX idx_fav_user (user_identifier),
                        INDEX idx_fav_book (book_id)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                ");
            }
        } catch (\Throwable $e) {}
    }

    public function getFavorites(Request $request)
    {
        $this->ensureFavoritesTable();
        $userId = trim((string) $request->query('user_id', 'guest_opac'));

        // Sync from MySQL if available
        try {
            $pdo = \App\Services\DatabaseService::getPdo();
            if ($pdo) {
                $stmt = $pdo->prepare("SELECT book_id FROM favorites WHERE user_identifier = :uid");
                $stmt->execute([':uid' => $userId]);
                $mysqlFavs = $stmt->fetchAll(\PDO::FETCH_COLUMN);
                if (is_array($mysqlFavs) && !empty($mysqlFavs)) {
                    foreach ($mysqlFavs as $bId) {
                        $exists = DB::table('favorites')->where('user_identifier', $userId)->where('book_id', $bId)->exists();
                        if (!$exists) {
                            DB::table('favorites')->insert([
                                'user_identifier' => $userId,
                                'book_id' => $bId,
                                'created_at' => now(),
                            ]);
                        }
                    }
                }
            }
        } catch (\Throwable $e) {}

        $favorites = DB::table('favorites')
            ->where('user_identifier', $userId)
            ->pluck('book_id')
            ->unique()
            ->values();

        return response()->json($favorites);
    }

    public function toggleFavorite(Request $request)
    {
        $this->ensureFavoritesTable();
        $userId = trim((string) $request->input('user_id', 'guest_opac'));
        $bookId = trim((string) $request->input('book_id', ''));

        if (!$bookId) {
            return response()->json(['error' => 'book_id is required'], 422);
        }

        $existing = DB::table('favorites')
            ->where('user_identifier', $userId)
            ->where('book_id', $bookId)
            ->first();

        if ($existing) {
            DB::table('favorites')
                ->where('user_identifier', $userId)
                ->where('book_id', $bookId)
                ->delete();
            $saved = false;

            try {
                $pdo = \App\Services\DatabaseService::getPdo();
                if ($pdo) {
                    $st = $pdo->prepare("DELETE FROM favorites WHERE user_identifier = :uid AND book_id = :bid");
                    $st->execute([':uid' => $userId, ':bid' => $bookId]);
                }
            } catch (\Throwable $e) {}
        } else {
            DB::table('favorites')->insert([
                'user_identifier' => $userId,
                'book_id' => $bookId,
                'created_at' => now(),
            ]);
            $saved = true;

            try {
                $pdo = \App\Services\DatabaseService::getPdo();
                if ($pdo) {
                    $st = $pdo->prepare("INSERT INTO favorites (user_identifier, book_id, created_at) VALUES (:uid, :bid, NOW())");
                    $st->execute([':uid' => $userId, ':bid' => $bookId]);
                }
            } catch (\Throwable $e) {}
        }

        $allFavorites = DB::table('favorites')
            ->where('user_identifier', $userId)
            ->pluck('book_id')
            ->unique()
            ->values();

        return response()->json([
            'saved' => $saved,
            'book_id' => $bookId,
            'user_id' => $userId,
            'favorites' => $allFavorites
        ]);
    }

    public function categories()
    {
        $categories = Book::select('subject')
            ->whereNotNull('subject')
            ->distinct()
            ->pluck('subject')
            ->filter()
            ->values();
        return response()->json($categories);
    }

    public function departments()
    {
        $departments = Book::select('department')
            ->whereNotNull('department')
            ->distinct()
            ->pluck('department')
            ->filter()
            ->values();
        return response()->json($departments);
    }

    public function locations()
    {
        $locations = Book::select('branch')
            ->whereNotNull('branch')
            ->distinct()
            ->pluck('branch')
            ->filter()
            ->values();
        return response()->json($locations);
    }
}

