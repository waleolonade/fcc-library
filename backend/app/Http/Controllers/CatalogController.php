<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\DepartmentUpload;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class CatalogController extends Controller
{
    public function index(Request $request)
    {
        // 1. Synchronize local SQLite books table with authoritative MySQL books & department_uploads
        $this->mirrorBooksFromMysql();

        // 2. Auto-promote and synchronize any active department uploads into the books catalog table
        if (Schema::hasTable('department_uploads')) {
            try {
                $activeUploads = \App\Models\DepartmentUpload::whereNotIn('status', ['deleted', 'withdrawn', 'purged', 'rejected', 'declined'])
                    ->get();
                foreach ($activeUploads as $upload) {
                    if ($upload->status !== 'approved') {
                        $upload->status = 'approved';
                    }
                    $targetBookId = $upload->book_id;
                    if (empty($targetBookId)) {
                        $num = preg_replace('/[^0-9]/', '', (string)$upload->id);
                        $targetBookId = 'FCC-HOD-' . ($num ?: rand(1000, 9999));
                        $upload->book_id = $targetBookId;
                    }
                    $upload->save();

                    $bookExists = Book::where('id', $targetBookId)
                        ->orWhere('id', $upload->id)
                        ->exists();

                    if (!$bookExists) {
                        $resType = $upload->resource_type ?: 'Book';
                        $isProject = stripos($resType, 'Project') !== false || stripos($resType, 'Thesis') !== false || stripos($resType, 'Dissertation') !== false;
                        $isJournal = stripos($resType, 'Journal') !== false || stripos($resType, 'Article') !== false || stripos($resType, 'Periodical') !== false;

                        Book::create([
                            'id' => $targetBookId,
                            'title' => $upload->title,
                            'subtitle' => !empty($upload->course_code) ? "Course: {$upload->course_code} ({$upload->target_level})" : "Departmental Academic Resource",
                            'author' => $upload->author ?: ($upload->hod_name ?: 'HOD / Faculty'),
                            'author_credentials' => $isProject ? 'Student Researcher / Scholar' : ($isJournal ? 'Peer-Reviewed Academic Author' : 'Faculty Contributor / HOD'),
                            'author_affiliation' => "Federal Co-operative College, Ibadan ({$upload->department_name})",
                            'subject' => $upload->department_name ?: 'Academic Studies',
                            'department' => $upload->department_name ?: 'Academic Department',
                            'course_code' => $upload->course_code ?: '',
                            'target_level' => $upload->target_level ?: 'HND II',
                            'branch' => 'Main Campus Library (Prof. Hezekiah Complex)',
                            'shelf_location' => $upload->assigned_shelf ?: 'Digital E-Library',
                            'call_number' => $upload->assigned_call_number ?: 'QA76.9 .FCC 2026',
                            'publisher' => $isJournal ? "FCC Directorate of Research & Academic Publications" : "FCC Department of {$upload->department_name} Press",
                            'year' => (int) date('Y', strtotime($upload->created_at ?? 'now')),
                            'edition' => '1st Official Edition',
                            'pdf_pages' => 120,
                            'file_size' => '4.5 MB',
                            'file_name' => $upload->file_name,
                            'file_path' => $upload->file_path ?: ($upload->file_name ?: ($targetBookId . '.pdf')),
                            'file_data_url' => $upload->file_data_url ?: '',
                            'cover_image' => $upload->cover_image ?: '',
                            'is_digital' => 1,
                            'access_level' => $upload->access_scope ?: 'Public Institution-Wide',
                            'rights_status' => $isProject ? 'Student Capstone Project / Thesis' : ($isJournal ? 'Academic Research Journal' : 'Approved Academic Book'),
                            'status' => 'approved',
                            'copies_total' => 10,
                            'copies_available' => 10,
                            'rating' => 5.0,
                            'citations' => 0,
                            'abstract' => "Official academic resource uploaded by {$upload->hod_name} for {$upload->department_name}.",
                            'uploaded_at' => $upload->created_at ?? date('Y-m-d H:i:s'),
                            'uploaded_by' => $upload->hod_name ?: 'Department HOD'
                        ]);
                    }
                }
            } catch (\Throwable $e) {}
        }

        $query = Book::query();

        // Strict Separation of Books vs Journals at the query level
        $filterType = strtolower(trim((string)$request->query('type', $request->query('category', $request->query('resource_type', '')))));
        $hasCatCol = Schema::hasColumn('books', 'category');
        if (in_array($filterType, ['book', 'books', 'ebook', 'ebooks', 'textbook', 'textbooks'])) {
            if ($hasCatCol) {
                $query->where(function($q) {
                    $q->whereNull('category')
                      ->orWhere('category', 'Book')
                      ->orWhere('category', '')
                      ->orWhereNotIn(DB::raw('LOWER(category)'), ['journal', 'student project', 'thesis', 'dissertation']);
                });
            }
            $query->where('id', 'not like', 'FCC-JRN-%')
              ->where('id', 'not like', 'FCC-PRJ-%')
              ->where('id', 'not like', 'TH-%')
              ->where(function($q) {
                  $q->whereNull('call_number')
                    ->orWhere(function($sub) {
                        $sub->where('call_number', 'not like', 'JRN-%')
                            ->where('call_number', 'not like', 'ETD-%');
                    });
              });
        } elseif (in_array($filterType, ['journal', 'journals', 'periodical', 'periodicals', 'serial', 'serials', 'article', 'articles'])) {
            $query->where(function($q) use ($hasCatCol) {
                if ($hasCatCol) {
                    $q->where(DB::raw('LOWER(category)'), 'like', '%journal%');
                }
                $q->orWhere('id', 'like', 'FCC-JRN-%')
                  ->orWhere('call_number', 'like', 'JRN-%')
                  ->orWhere(DB::raw('LOWER(rights_status)'), 'like', '%journal%');
            });
        } elseif (in_array($filterType, ['project', 'projects', 'thesis', 'theses', 'dissertation', 'dissertations', 'student project'])) {
            $query->where(function($q) use ($hasCatCol) {
                if ($hasCatCol) {
                    $q->where(DB::raw('LOWER(category)'), 'like', '%project%')
                      ->orWhere(DB::raw('LOWER(category)'), 'like', '%thesis%');
                }
                $q->orWhere('id', 'like', 'FCC-PRJ-%')
                  ->orWhere('id', 'like', 'TH-%')
                  ->orWhere('call_number', 'like', 'ETD-%')
                  ->orWhere(DB::raw('LOWER(rights_status)'), 'like', '%project%')
                  ->orWhere(DB::raw('LOWER(rights_status)'), 'like', '%thesis%');
            });
        }

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

        // Strictly exclude any book linked to a deleted, withdrawn, or rejected department upload
        if (Schema::hasTable('department_uploads')) {
            $query->whereNotIn('id', function ($sub) {
                $sub->select('book_id')
                    ->from('department_uploads')
                    ->whereIn('status', ['deleted', 'withdrawn', 'purged', 'rejected', 'declined'])
                    ->whereNotNull('book_id');
            });
        }

        // Exclude any deleted or rejected books from the catalog
        if (Schema::hasColumn('books', 'status')) {
            $query->where(function ($q) {
                $q->whereNull('status')
                  ->orWhere('status', '')
                  ->orWhereNotIn(DB::raw('LOWER(status)'), ['deleted', 'withdrawn', 'purged', 'rejected', 'declined']);
            });
        }

        $selectCols = [
            'id', 'title', 'subtitle', 'author', 'isbn', 'doi', 'call_number', 'callNumber',
            'department', 'subject', 'shelf_location', 'shelfLocation', 'copies_total',
            'copies_available', 'cover_image', 'year', 'publisher', 'edition', 'category',
            'course_code', 'target_level', 'is_digital', 'abstract', 'pdf_pages', 'file_size',
            'rights_status', 'status', 'description', 'file_name', 'uploaded_at', 'uploaded_by', 'updated_at'
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
            $data['uploaded_by'] = $book->uploaded_by ?: ($linkedUpload?->hod_name ?: 'HOD / Department Faculty');
            $data['uploadedBy'] = $data['uploaded_by'];
            $data['uploaded_at'] = $book->uploaded_at ?? ($linkedUpload?->created_at ?? date('Y-m-d H:i:s'));
            $data['uploadedAt'] = $data['uploaded_at'];
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

        // Ensure 100% inclusion: If any active department upload was not in books, append it directly
        $existingCatalogIds = [];
        foreach ($books as $b) {
            $existingCatalogIds[strtolower($b['id'])] = true;
            if (!empty($b['upload_id'])) {
                $existingCatalogIds[strtolower($b['upload_id'])] = true;
            }
        }

        if (Schema::hasTable('department_uploads')) {
            try {
                $extraUploadsQuery = \App\Models\DepartmentUpload::whereNotIn('status', ['deleted', 'withdrawn', 'purged', 'rejected', 'declined']);
                if ($search = $request->query('search')) {
                    $s = "%{$search}%";
                    $extraUploadsQuery->where(function ($q) use ($s) {
                        $q->where('title', 'like', $s)
                          ->orWhere('author', 'like', $s)
                          ->orWhere('course_code', 'like', $s)
                          ->orWhere('department_name', 'like', $s)
                          ->orWhere('assigned_call_number', 'like', $s);
                    });
                }
                $extraUploads = $extraUploadsQuery->get();
                $extraItems = [];
                foreach ($extraUploads as $u) {
                    $uId = strtolower((string)$u->id);
                    $bId = strtolower((string)($u->book_id ?? ''));
                    if (!isset($existingCatalogIds[$uId]) && (!empty($bId) ? !isset($existingCatalogIds[$bId]) : true)) {
                        $cId = $u->book_id ?: $u->id;
                        $resType = $u->resource_type ?: 'Book';
                        $isJrn = stripos($resType, 'Journal') !== false || stripos($resType, 'Article') !== false || stripos($resType, 'Periodical') !== false || stripos($resType, 'Serial') !== false;
                        $isPrj = stripos($resType, 'Project') !== false || stripos($resType, 'Thesis') !== false || stripos($resType, 'Dissertation') !== false || stripos($resType, 'Capstone') !== false;
                        $isBk = !$isJrn && !$isPrj;

                        if (in_array($filterType, ['book', 'books', 'ebook', 'ebooks', 'textbook', 'textbooks']) && !$isBk) {
                            continue;
                        }
                        if (in_array($filterType, ['journal', 'journals', 'periodical', 'periodicals', 'serial', 'serials', 'article', 'articles']) && !$isJrn) {
                            continue;
                        }
                        if (in_array($filterType, ['project', 'projects', 'thesis', 'theses', 'dissertation', 'dissertations', 'student project']) && !$isPrj) {
                            continue;
                        }

                        $extraItems[] = [
                            'id' => $cId,
                            'upload_id' => $u->id,
                            'book_id' => $cId,
                            'title' => $u->title,
                            'subtitle' => !empty($u->course_code) ? "Course: {$u->course_code} ({$u->target_level})" : "Departmental Academic Resource",
                            'author' => $u->author ?: ($u->hod_name ?: 'HOD / Faculty'),
                            'author_credentials' => 'Faculty Contributor / HOD',
                            'author_affiliation' => "Federal Co-operative College, Ibadan ({$u->department_name})",
                            'department' => $u->department_name ?: 'Academic Department',
                            'subject' => $u->department_name ?: 'Academic Studies',
                            'category' => $isJrn ? 'Journal' : ($isPrj ? 'Student Project' : 'Book'),
                            'resource_type' => $resType,
                            'course_code' => $u->course_code ?: '',
                            'courseCode' => $u->course_code ?: '',
                            'target_level' => $u->target_level ?: 'HND II',
                            'targetLevel' => $u->target_level ?: 'HND II',
                            'shelf_location' => $u->assigned_shelf ?: 'Digital E-Library',
                            'shelfLocation' => $u->assigned_shelf ?: 'Digital E-Library',
                            'call_number' => $u->assigned_call_number ?: 'QA76.9 .FCC 2026',
                            'callNumber' => $u->assigned_call_number ?: 'QA76.9 .FCC 2026',
                            'copies_total' => 10,
                            'copiesTotal' => 10,
                            'copies_available' => 10,
                            'copiesAvailable' => 10,
                            'pdf_pages' => 120,
                            'pdfPages' => 120,
                            'file_size' => '4.5 MB',
                            'fileSize' => '4.5 MB',
                            'file_name' => $u->file_name,
                            'fileName' => $u->file_name,
                            'file_data_url' => '',
                            'fileDataUrl' => '',
                            'cover_image' => $u->cover_image ?: '/assets/fcc-logo.png',
                            'coverImage' => $u->cover_image ?: '/assets/fcc-logo.png',
                            'isDigital' => true,
                            'is_digital' => 1,
                            'hasPdf' => true,
                            'has_file' => true,
                            'hasBinaryPdf' => true,
                            'pdfUrl' => "/api/department-uploads/{$u->id}/file",
                            'rights_status' => $isJrn ? 'Academic Research Journal' : ($isPrj ? 'Student Capstone Project / Thesis' : 'Approved Academic Book'),
                            'status' => 'approved',
                            'uploaded_at' => $u->created_at ?? date('Y-m-d H:i:s'),
                            'uploaded_by' => $u->hod_name ?: 'Department HOD'
                        ];
                        $existingCatalogIds[$uId] = true;
                    }
                }
                if (!empty($extraItems)) {
                    $books = array_merge($books->all(), $extraItems);
                }
            } catch (\Throwable $e) {}
        }

        $rawItems = is_array($books) ? $books : (method_exists($books, 'all') ? $books->all() : (array) $books);

        // Strict Separation: Guarantee that books and journals are NEVER merged
        if (!empty($filterType)) {
            $rawItems = array_values(array_filter($rawItems, function($item) use ($filterType) {
                $itemCat = strtolower((string)($item['category'] ?? ''));
                $itemRes = strtolower((string)($item['resource_type'] ?? ''));
                $itemId = strtoupper((string)($item['id'] ?? ''));
                $callStr = strtoupper((string)($item['call_number'] ?? ''));
                $rightsStr = strtolower((string)($item['rights_status'] ?? ''));
                $subStr = strtolower((string)($item['subtitle'] ?? ''));

                $isJournal = $itemCat === 'journal' ||
                    str_contains($itemRes, 'journal') ||
                    str_contains($itemRes, 'periodical') ||
                    str_contains($itemRes, 'serial') ||
                    str_contains($itemRes, 'article') ||
                    str_starts_with($itemId, 'FCC-JRN-') ||
                    str_starts_with($callStr, 'JRN-') ||
                    str_contains($rightsStr, 'journal') ||
                    str_contains($subStr, 'journal') ||
                    !empty($item['issn']);

                $isProject = $itemCat === 'student project' ||
                    str_contains($itemRes, 'project') ||
                    str_contains($itemRes, 'thesis') ||
                    str_contains($itemRes, 'dissertation') ||
                    str_contains($itemRes, 'capstone') ||
                    str_starts_with($itemId, 'FCC-PRJ-') ||
                    str_starts_with($itemId, 'TH-') ||
                    str_starts_with($callStr, 'ETD-') ||
                    str_contains($rightsStr, 'project') ||
                    str_contains($rightsStr, 'thesis') ||
                    str_contains($subStr, 'student research project');

                $isBook = !$isJournal && !$isProject;

                if (in_array($filterType, ['book', 'books', 'ebook', 'ebooks', 'textbook', 'textbooks'])) {
                    return $isBook;
                }
                if (in_array($filterType, ['journal', 'journals', 'periodical', 'periodicals', 'serial', 'serials', 'article', 'articles'])) {
                    return $isJournal;
                }
                if (in_array($filterType, ['project', 'projects', 'thesis', 'theses', 'dissertation', 'dissertations', 'student project'])) {
                    return $isProject;
                }
                return true;
            }));
        }

        return response()->json($rawItems);
    }

    /**
     * Dedicated Journals Endpoint (/api/journals or /api/catalog/journals)
     * Strictly returns ONLY academic journals, serials, and periodicals.
     */
    public function journals(Request $request)
    {
        $request->merge(['type' => 'journal', 'category' => 'journal']);
        return $this->index($request);
    }

    /**
     * Dedicated Books Endpoint (/api/catalog/books)
     * Strictly returns ONLY academic books, textbooks, and lecture handouts.
     */
    public function books(Request $request)
    {
        $request->merge(['type' => 'book', 'category' => 'book']);
        return $this->index($request);
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

        // 1. Look up authoritative MySQL record for file_name, title, and file_data_url
        $mysqlFileName = null;
        $mysqlTitle = null;
        $mysqlDataUrl = null;
        try {
            $pdo = \App\Services\DatabaseService::getPdo();
            if ($pdo) {
                $p = [':id' => $id];
                $sqlB = "SELECT file_name, title, file_data_url FROM books WHERE id = :id";
                if ($altBookId) {
                    $sqlB .= " OR id = :altId";
                    $p[':altId'] = $altBookId;
                }
                $stB = $pdo->prepare($sqlB);
                $stB->execute($p);
                $mBook = $stB->fetch(\PDO::FETCH_ASSOC);
                if ($mBook) {
                    $mysqlFileName = $mBook['file_name'] ?? null;
                    $mysqlTitle = $mBook['title'] ?? null;
                    $mysqlDataUrl = $mBook['file_data_url'] ?? null;
                }

                $sqlUp = "SELECT id, book_id, file_name, title, file_data_url FROM department_uploads WHERE id = :id OR book_id = :id";
                if ($altBookId) $sqlUp .= " OR id = :altId OR book_id = :altId";
                if ($upload) $sqlUp .= " OR id = :uid";
                if ($upload) $p[':uid'] = $upload->id;
                $stUp = $pdo->prepare($sqlUp);
                $stUp->execute($p);
                $mUp = $stUp->fetch(\PDO::FETCH_ASSOC);
                $mysqlUploadId = null;
                if ($mUp) {
                    $mysqlUploadId = $mUp['id'] ?? null;
                    if (!$mysqlFileName) $mysqlFileName = $mUp['file_name'] ?? null;
                    if (!$mysqlTitle) $mysqlTitle = $mUp['title'] ?? null;
                    if (!$mysqlDataUrl) $mysqlDataUrl = $mUp['file_data_url'] ?? null;
                }

                if ($mysqlFileName && !$mysqlUploadId) {
                    $stFn = $pdo->prepare("SELECT id, file_data_url FROM department_uploads WHERE file_name = :fn OR file_name LIKE :fnLike LIMIT 1");
                    $stFn->execute([':fn' => $mysqlFileName, ':fnLike' => '%' . basename($mysqlFileName) . '%']);
                    $mFn = $stFn->fetch(\PDO::FETCH_ASSOC);
                    if ($mFn) {
                        $mysqlUploadId = $mFn['id'] ?? null;
                        if (!$mysqlDataUrl) $mysqlDataUrl = $mFn['file_data_url'] ?? null;
                    }
                }

                // Automatic Title Auto-Repair for city/year imprint mistakenly stored as title
                if ($mysqlTitle && preg_match('/^[A-Za-z\s.-]+,\s*(?:19|20)\d{2}\.?$/i', trim($mysqlTitle)) && $mysqlFileName) {
                    $cleanFn = pathinfo($mysqlFileName, PATHINFO_FILENAME);
                    $cleanFn = preg_replace('/^\d+[\s._-]+/', '', $cleanFn);
                    $cleanFn = preg_replace('/[-_.]+/', ' ', $cleanFn);
                    $cleanFn = trim(preg_replace('/\s+/', ' ', $cleanFn));
                    if (preg_match('/^(.*?)(?:\s+Authors|\s+by|\s+edition)/i', $cleanFn, $match)) {
                        $cleanFn = trim($match[1]);
                    }
                    if (strlen($cleanFn) >= 3) {
                        $repairedTitle = ucwords($cleanFn);
                        $mysqlTitle = $repairedTitle;
                        try {
                            $pdo->prepare("UPDATE books SET title = :t WHERE id = :id")->execute([':t' => $repairedTitle, ':id' => $id]);
                            $pdo->prepare("UPDATE department_uploads SET title = :t WHERE id = :id OR book_id = :id")->execute([':t' => $repairedTitle, ':id' => $id]);
                        } catch (\Throwable $te) {}
                    }
                }
            }
        } catch (\Throwable $e) {}

        // Comprehensive search paths across standard, cPanel, and public storage directories
        $safeId = preg_replace('/[^a-zA-Z0-9_-]/', '_', $id);
        $storageDirs = array_unique(array_filter([
            storage_path('app/library-books'),
            storage_path('app/public/books'),
            storage_path('app/public/department_uploads'),
            storage_path('app/public/theses'),
            storage_path('app/department_uploads'),
            storage_path('app/department-uploads'),
            storage_path('app/books'),
            storage_path('app/theses'),
            storage_path('app'),
            public_path('storage/department_uploads'),
            public_path('storage/books'),
            public_path('storage/theses'),
            public_path('uploads'),
            base_path('../public_html/storage/department_uploads'),
            base_path('../public_html/storage/books'),
            base_path('../public_html/backend/storage/app/library-books'),
            base_path('../public_html/backend/storage/app/public/department_uploads'),
            base_path('../storage/app/library-books'),
            base_path('../storage/app/public/department_uploads'),
        ]));

        $candidateNames = array_unique(array_filter([
            $mysqlFileName,
            $mysqlFileName ? basename($mysqlFileName) : null,
            $mysqlFileName ? (basename($mysqlFileName) . '.pdf') : null,
            $mysqlUploadId ? ($mysqlUploadId . '.pdf') : null,
            $mysqlUploadId ? preg_replace('/[^a-zA-Z0-9_-]/', '_', $mysqlUploadId) . '.pdf' : null,
            $safeId . '.pdf',
            $id . '.pdf',
            $altBookId ? ($altBookId . '.pdf') : null,
            str_replace('FCC-HOD-', 'HOD-UP-', $safeId) . '.pdf',
            str_replace('HOD-UP-', 'FCC-HOD-', $safeId) . '.pdf',
            $upload ? preg_replace('/[^a-zA-Z0-9_-]/', '_', $upload->id) . '.pdf' : null,
            $upload && $upload->book_id ? preg_replace('/[^a-zA-Z0-9_-]/', '_', $upload->book_id) . '.pdf' : null,
            $book ? preg_replace('/[^a-zA-Z0-9_-]/', '_', $book->id) . '.pdf' : null,
            $book?->file_name,
            $book?->file_name ? (basename($book->file_name) . '.pdf') : null,
            $upload?->file_name,
            $upload?->file_name ? (basename($upload->file_name) . '.pdf') : null,
            $cleanSuffix ? 'HOD-UP-' . $cleanSuffix . '.pdf' : null,
            $cleanSuffix ? 'FCC-HOD-' . $cleanSuffix . '.pdf' : null,
        ]));

        $foundDiskPath = null;
        foreach ($storageDirs as $dir) {
            if (!is_dir($dir)) continue;
            foreach ($candidateNames as $name) {
                $checkPath = $dir . '/' . basename($name);
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

        // Glob fallback for original filename fragment (e.g. "02.-Basics-of-Finance")
        $effectiveFn = $mysqlFileName ?: ($book?->file_name ?: ($upload?->file_name ?: null));
        if (!$foundDiskPath && $effectiveFn && strlen($effectiveFn) > 5) {
            $fnStem = pathinfo($effectiveFn, PATHINFO_FILENAME);
            $cleanStem = preg_replace('/[^a-zA-Z0-9]/', ' ', $fnStem);
            $words = array_values(array_filter(explode(' ', $cleanStem), fn($w) => strlen($w) >= 4));
            $globKey = !empty($words) ? implode('*', array_slice($words, 0, 3)) : null;
            if ($globKey) {
                foreach ($storageDirs as $dir) {
                    if (!is_dir($dir)) continue;
                    $matches = glob($dir . '/*' . $globKey . '*.pdf');
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
        }

        $isDownload = $request->query('download') || $request->input('dl') === '1';

        if ($foundDiskPath) {
            $filename = ($book?->file_name) ?: ($upload?->file_name) ?: ($mysqlFileName ?: basename($foundDiskPath));
            return response()->file($foundDiskPath, [
                'Content-Type' => 'application/pdf',
                'Accept-Ranges' => 'bytes',
                'Content-Disposition' => ($isDownload ? 'attachment' : 'inline') . '; filename="' . $filename . '"',
                'Cache-Control' => 'public, max-age=86400',
                'Access-Control-Allow-Origin' => '*'
            ]);
        }

        // 2. Check base64 in SQLite or MySQL database
        $dataUrl = $book?->getAttribute('file_data_url') ?: ($upload?->file_data_url ?: $mysqlDataUrl);

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

        // 3. Fallback: Check if item has a DOI or external OA link to stream authentic scholarly PDF
        $doi = $book?->doi ?: ($upload?->doi ?? null);
        if (!empty($doi)) {
            try {
                $openAlex = app(\App\Services\OpenAlexService::class);
                $work = $openAlex->getWorkByDoi($doi);
                $oaUrl = $work['open_access']['oa_url']
                      ?? $work['best_oa_location']['pdf_url']
                      ?? $work['primary_location']['pdf_url']
                      ?? null;
                if ($oaUrl) {
                    return redirect()->away($oaUrl);
                }
            } catch (\Throwable $e) {}
        }

        $extUrl = $book?->external_url ?: ($upload?->external_url ?? ($book?->pdf_url ?: ($upload?->pdf_url ?? null)));
        if (!empty($extUrl) && filter_var($extUrl, FILTER_VALIDATE_URL)) {
            return redirect()->away($extUrl);
        }

        // Return honest 404 response instead of forging fake syllabus monograph
        return response()->json([
            'error' => 'Digital PDF document not available for this catalog record.',
            'id' => $id,
            'title' => $book?->title ?: ($upload?->title ?? 'Document'),
            'has_pdf' => false
        ], 404);
    }

    private function isValidPdfFile(string $path): bool
    {
        if (!file_exists($path) || filesize($path) < 200) return false;
        $fh = @fopen($path, 'rb');
        if (!$fh) return false;
        $head = fread($fh, 1024);
        fclose($fh);
        if (!str_contains(substr($head, 0, 128), '%PDF-')) {
            return false;
        }
        if (str_contains($head, 'OFFICIAL INSTITUTIONAL CURRICULUM MANUSCRIPT') || str_contains($head, 'CENTRAL LIBRARY DIRECTORATE')) {
            return false;
        }
        return true;
    }

    public function checkDuplicate(Request $request)
    {
        $title = trim($request->input('title', ''));
        $author = trim($request->input('author', ''));
        $isbn = trim($request->input('isbn', ''));
        $doi = trim($request->input('doi', ''));
        $fileName = trim($request->input('fileName', $request->input('file_name', '')));

        $result = $this->findExistingDuplicateItem($title, $author, $isbn, $doi, $fileName);
        if ($result) {
            return response()->json($result);
        }

        return response()->json([
            'isDuplicate' => false,
            'message' => 'No duplicate detected'
        ]);
    }

    public function checkDuplicateBatch(Request $request)
    {
        $items = $request->input('items', []);
        if (!is_array($items)) {
            $items = [];
        }

        $results = [];
        foreach ($items as $index => $item) {
            $title = trim($item['title'] ?? '');
            $author = trim($item['author'] ?? '');
            $isbn = trim($item['isbn'] ?? '');
            $doi = trim($item['doi'] ?? '');
            $fileName = trim($item['fileName'] ?? $item['file_name'] ?? '');

            $dup = $this->findExistingDuplicateItem($title, $author, $isbn, $doi, $fileName);
            $results[$index] = $dup ?: ['isDuplicate' => false, 'message' => 'No duplicate detected'];
        }

        return response()->json([
            'success' => true,
            'results' => $results
        ]);
    }

    public function findExistingDuplicateItem(?string $title, ?string $author, ?string $isbn, ?string $doi, ?string $fileName): ?array
    {
        $existing = null;
        $existingUpload = null;

        // 1. Check ISBN match
        if (!empty($isbn) && strlen($isbn) >= 6) {
            $existing = Book::where('isbn', $isbn)->first();
            if (!$existing) {
                $existingUpload = DepartmentUpload::where('isbn', $isbn)->first();
            }
        }

        // 2. Check DOI match
        if (!$existing && !$existingUpload && !empty($doi) && strlen($doi) >= 5) {
            $existing = Book::where('doi', $doi)->first();
            if (!$existing) {
                $existingUpload = DepartmentUpload::where('doi', $doi)->first();
            }
        }

        // 3. Check Exact / High-Similarity Title match
        if (!$existing && !$existingUpload && !empty($title) && strlen($title) >= 4) {
            $cleanTitle = strtolower(preg_replace('/[^a-zA-Z0-9\s]/', '', str_replace(['.pdf', '-', '_'], ' ', $title)));
            $cleanTitle = trim(preg_replace('/\s+/', ' ', $cleanTitle));

            // Search books
            $allBooks = Book::select('id', 'title', 'author', 'department', 'shelf_location', 'call_number', 'isbn', 'doi', 'file_name', 'uploaded_at', 'created_at')->get();
            foreach ($allBooks as $b) {
                $bTitle = strtolower(preg_replace('/[^a-zA-Z0-9\s]/', '', str_replace(['.pdf', '-', '_'], ' ', $b->title)));
                $bTitle = trim(preg_replace('/\s+/', ' ', $bTitle));
                if ($bTitle === $cleanTitle || (strlen($cleanTitle) > 10 && (str_contains($bTitle, $cleanTitle) || str_contains($cleanTitle, $bTitle)))) {
                    $existing = $b;
                    break;
                }
            }

            // Search department uploads if not found in catalog books
            if (!$existing) {
                $allUploads = DepartmentUpload::select('id', 'book_id', 'title', 'author', 'course_code', 'department_name', 'assigned_call_number', 'assigned_shelf', 'file_name', 'status', 'created_at', 'hod_name')->get();
                foreach ($allUploads as $u) {
                    $uTitle = strtolower(preg_replace('/[^a-zA-Z0-9\s]/', '', str_replace(['.pdf', '-', '_'], ' ', $u->title)));
                    $uTitle = trim(preg_replace('/\s+/', ' ', $uTitle));
                    if ($uTitle === $cleanTitle || (strlen($cleanTitle) > 10 && (str_contains($uTitle, $cleanTitle) || str_contains($cleanTitle, $uTitle)))) {
                        $existingUpload = $u;
                        break;
                    }
                }
            }
        }

        // 4. Check Exact Filename match (if not generic like document.pdf)
        $genericNames = ['document.pdf', 'file.pdf', 'download.pdf', 'upload.pdf', 'book.pdf'];
        if (!$existing && !$existingUpload && !empty($fileName) && !in_array(strtolower($fileName), $genericNames) && strlen($fileName) >= 5) {
            $cleanFile = strtolower(basename($fileName));
            $existing = Book::whereRaw('LOWER(file_name) = ?', [$cleanFile])->first();
            if (!$existing) {
                $existingUpload = DepartmentUpload::whereRaw('LOWER(file_name) = ?', [$cleanFile])->first();
            }
        }

        // Construct Rich Tracing Metadata
        if ($existing) {
            $cardNo = $existing->id;
            $callNo = $existing->call_number ?: ($existing->assigned_call_number ?: 'FCC.LIB.2026');
            $shelf = $existing->shelf_location ?: 'Central Campus Library';
            $dept = $existing->department ?: 'Federal Co-operative College';

            return [
                'isDuplicate' => true,
                'card_number' => $cardNo,
                'call_number' => $callNo,
                'shelf_location' => $shelf,
                'source' => 'Central Library Catalog',
                'status' => 'Cataloged & Active in OPAC',
                'message' => "This document already exists in the institutional repository! Card No: [{$cardNo}] • Call No: [{$callNo}]",
                'book' => [
                    'id' => $existing->id,
                    'card_number' => $cardNo,
                    'call_number' => $callNo,
                    'callNumber' => $callNo,
                    'shelf_location' => $shelf,
                    'shelfLocation' => $shelf,
                    'title' => $existing->title,
                    'author' => $existing->author,
                    'department' => $dept,
                    'course_code' => $existing->course_code ?? '',
                    'target_level' => $existing->target_level ?? '',
                    'uploaded_by' => $existing->uploaded_by ?? 'Central Library Administration',
                    'isbn' => $existing->isbn ?? '',
                    'doi' => $existing->doi ?? '',
                    'file_name' => $existing->file_name ?? '',
                    'fileName' => $existing->file_name ?? '',
                    'uploaded_at' => $existing->uploaded_at ?? $existing->created_at ?? date('Y-m-d'),
                    'uploadedAt' => $existing->uploaded_at ?? $existing->created_at ?? date('Y-m-d'),
                    'status' => 'Cataloged & Active'
                ]
            ];
        }

        if ($existingUpload) {
            $cardNo = $existingUpload->book_id ?: $existingUpload->id;
            $callNo = $existingUpload->assigned_call_number ?: 'FCC.LIB.HOD.2026';
            $shelf = $existingUpload->assigned_shelf ?: 'Departmental Digital Repository';
            $dept = $existingUpload->department_name ?: 'Academic Faculty';

            return [
                'isDuplicate' => true,
                'card_number' => $cardNo,
                'call_number' => $callNo,
                'shelf_location' => $shelf,
                'source' => 'Departmental Ingestion Repository',
                'status' => ucfirst($existingUpload->status ?: 'Pending Review'),
                'message' => "This document already exists in the departmental repository! Card No: [{$cardNo}] • Call No: [{$callNo}]",
                'book' => [
                    'id' => $existingUpload->id,
                    'book_id' => $existingUpload->book_id,
                    'card_number' => $cardNo,
                    'call_number' => $callNo,
                    'callNumber' => $callNo,
                    'shelf_location' => $shelf,
                    'shelfLocation' => $shelf,
                    'title' => $existingUpload->title,
                    'author' => $existingUpload->author,
                    'department' => $dept,
                    'course_code' => $existingUpload->course_code ?? '',
                    'target_level' => $existingUpload->target_level ?? '',
                    'uploaded_by' => $existingUpload->hod_name ?? 'Faculty Unit',
                    'isbn' => $existingUpload->isbn ?? '',
                    'doi' => $existingUpload->doi ?? '',
                    'file_name' => $existingUpload->file_name ?? '',
                    'fileName' => $existingUpload->file_name ?? '',
                    'uploaded_at' => $existingUpload->created_at ? $existingUpload->created_at->format('Y-m-d') : date('Y-m-d'),
                    'uploadedAt' => $existingUpload->created_at ? $existingUpload->created_at->format('Y-m-d') : date('Y-m-d'),
                    'status' => ucfirst($existingUpload->status ?: 'Pending Review')
                ]
            ];
        }

        return null;
    }

    public function store(Request $request)
    {
        $data = $request->all();
        $id = $data['id'] ?? ('FCC-PDF-' . rand(1000, 9999));

        // Duplicate document protection
        if (!$request->boolean('allow_duplicate') && !Book::where('id', $id)->exists() && !empty($data['title'])) {
            $dup = $this->findExistingDuplicateItem(
                $data['title'],
                $data['author'] ?? null,
                $data['isbn'] ?? null,
                $data['doi'] ?? null,
                $data['fileName'] ?? $data['file_name'] ?? null
            );
            if ($dup && !empty($dup['isDuplicate']) && ($dup['card_number'] !== $id)) {
                return response()->json([
                    'success' => false,
                    'isDuplicate' => true,
                    'card_number' => $dup['card_number'],
                    'call_number' => $dup['call_number'],
                    'shelf_location' => $dup['shelf_location'],
                    'source' => $dup['source'] ?? 'Central Library Catalog',
                    'message' => "This document already exists in the institutional repository! Card No: [{$dup['card_number']}] • Call No: [{$dup['call_number']}]",
                    'book' => $dup['book']
                ], 409);
            }
        }

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

        // Broadcast real-time upload event
        \App\Http\Controllers\Api\RealtimeSyncController::recordEvent([
            'action' => 'UPLOAD',
            'entity' => 'book',
            'id' => $book->id,
            'title' => $book->title,
            'data' => $book->toArray()
        ]);

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
            if (config('database.default') === 'sqlite' && !env('ENABLE_MYSQL_MIRROR', false)) {
                return;
            }
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

            // Auto-promote any approved department uploads in MySQL into the MySQL books table if missing
            try {
                $missingApprovedStmt = $pdo->query("
                    SELECT du.* FROM department_uploads du
                    LEFT JOIN books b ON b.id = du.book_id
                    WHERE du.status = 'approved' AND du.book_id IS NOT NULL AND du.book_id != '' AND b.id IS NULL
                ");
                if ($missingApprovedStmt !== false) {
                    $missingApproved = $missingApprovedStmt->fetchAll(\PDO::FETCH_ASSOC);
                    foreach ($missingApproved as $mdu) {
                        $this->syncBookToMysql((object)[
                            'id' => $mdu['book_id'],
                            'title' => $mdu['title'] ?? 'Institutional Resource',
                            'subtitle' => !empty($mdu['course_code']) ? "Course Text - {$mdu['course_code']}" : 'Academic Resource',
                            'author' => $mdu['author'] ?? ($mdu['hod_name'] ?? 'HOD / Department Faculty'),
                            'department' => $mdu['department_name'] ?? 'Academic Department',
                            'subject' => $mdu['department_name'] ?? 'Academic Studies',
                            'course_code' => $mdu['course_code'] ?? 'GEN 101',
                            'target_level' => $mdu['target_level'] ?? 'HND II',
                            'call_number' => $mdu['assigned_call_number'] ?? 'QA76.9 .FCC 2026',
                            'shelf_location' => $mdu['assigned_shelf'] ?? 'Digital E-Library',
                            'isbn' => null,
                            'doi' => null,
                            'publisher' => 'FCC Department Press',
                            'year' => (int) date('Y', strtotime($mdu['created_at'] ?? 'now')),
                            'edition' => '1st Official Edition',
                            'pdf_pages' => 120,
                            'file_size' => '4.5 MB',
                            'file_name' => $mdu['file_name'] ?? null,
                            'file_path' => $mdu['file_name'] ?? ($mdu['book_id'] . '.pdf'),
                            'file_data_url' => $mdu['file_data_url'] ?? '',
                            'cover_image' => $mdu['cover_image'] ?? '',
                            'is_digital' => 1,
                            'access_level' => $mdu['access_scope'] ?? 'Public Institution-Wide',
                            'rights_status' => 'Approved Academic Book',
                            'status' => 'approved',
                            'copies_total' => 10,
                            'copies_available' => 10,
                            'rating' => 5.0,
                            'citations' => 0,
                            'abstract' => "Official academic resource uploaded by " . ($mdu['hod_name'] ?? 'HOD') . " for " . ($mdu['department_name'] ?? 'Department') . ".",
                            'uploaded_at' => $mdu['created_at'] ?? date('Y-m-d H:i:s'),
                            'uploaded_by' => $mdu['hod_name'] ?? 'Department HOD'
                        ]);
                    }
                }
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

            // 3. Only sync when MySQL returns a valid non-empty book list
            if (empty($mysqlIds)) {
                return;
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

            $describe = $pdo->query("DESCRIBE books");
            if ($describe === false) return;
            $bookCols = $describe->fetchAll(\PDO::FETCH_COLUMN);

            $fileData = $book->file_data_url;
            // Guard against extreme payload exceeding 25MB while preserving full authentic academic PDFs
            if (strlen((string)$fileData) > 25000000) {
                $fileData = '';
            }
            $coverData = $book->cover_image;
            if (strlen((string)$coverData) > 400000) {
                $coverData = '';
            }

            $candidateData = [
                'id' => $book->id,
                'title' => $book->title,
                'subtitle' => $book->subtitle,
                'author' => $book->author,
                'department' => $book->department,
                'subject' => $book->subject ?: $book->department,
                'course_code' => $book->course_code,
                'target_level' => $book->target_level,
                'call_number' => $book->call_number,
                'shelf_location' => $book->shelf_location,
                'isbn' => $book->isbn,
                'doi' => $book->doi,
                'publisher' => $book->publisher,
                'year' => $book->year,
                'edition' => $book->edition ?: '1st Official Edition',
                'pdf_pages' => $book->pdf_pages ?: 120,
                'file_size' => $book->file_size ?: '4.5 MB',
                'file_name' => $book->file_name,
                'file_path' => $book->file_path ?: ($book->id . '.pdf'),
                'file_data_url' => $fileData,
                'cover_image' => $coverData,
                'is_digital' => $book->is_digital ? 1 : 0,
                'access_level' => $book->access_level ?: 'Public Institution-Wide',
                'rights_status' => $book->rights_status ?: 'Approved Academic Book',
                'status' => 'approved',
                'copies_total' => $book->copies_total ?: 10,
                'copies_available' => $book->copies_available ?: 10,
                'rating' => $book->rating ?: 5.0,
                'citations' => $book->citations ?: 0,
                'abstract' => $book->abstract ?: '',
                'uploaded_at' => $book->uploaded_at ?? date('Y-m-d H:i:s'),
                'uploaded_by' => $book->uploaded_by ?? 'Admin Librarian'
            ];

            // Only insert columns that actually exist in the live MySQL books table
            $data = array_intersect_key($candidateData, array_flip($bookCols));
            $fields = array_keys($data);
            $placeholders = array_map(fn($f) => ":{$f}", $fields);
            $updates = array_map(fn($f) => "{$f} = VALUES({$f})", array_filter($fields, fn($f) => $f !== 'id'));

            $sql = "INSERT INTO books (" . implode(', ', $fields) . ")
                    VALUES (" . implode(', ', $placeholders) . ")
                    ON DUPLICATE KEY UPDATE " . implode(', ', $updates);

            $stmt = $pdo->prepare($sql);
            $params = [];
            foreach ($data as $k => $v) {
                $params[":{$k}"] = $v;
            }
            $stmt->execute($params);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("[syncBookToMysql] error: " . $e->getMessage());
        }
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

        // Broadcast real-time deletion event across all connected tabs & devices
        \App\Http\Controllers\Api\RealtimeSyncController::recordEvent([
            'action' => 'DELETE',
            'entity' => 'book',
            'id' => $cleanId,
            'title' => $bookTitle ?: $cleanId,
        ]);

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

        // Broadcast real-time bulk deletion event
        \App\Http\Controllers\Api\RealtimeSyncController::recordEvent([
            'action' => 'DELETE',
            'entity' => 'book',
            'ids' => $cleanIds,
            'title' => count($cleanIds) . ' books deleted in bulk',
        ]);

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

