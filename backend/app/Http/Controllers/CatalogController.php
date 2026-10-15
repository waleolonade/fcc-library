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

        // Exclude any pending or unapproved books from the master student catalog if column exists
        if (Schema::hasColumn('books', 'status')) {
            $query->where(function ($q) {
                $q->whereNull('status')
                  ->orWhere('status', 'approved')
                  ->orWhere('status', 'Published')
                  ->orWhere('status', 'active');
            });
        }

        $selectCols = [
            'id', 'title', 'subtitle', 'author', 'isbn', 'call_number', 'callNumber',
            'department', 'subject', 'shelf_location', 'shelfLocation', 'copies_total',
            'copies_available', 'cover_image', 'year', 'publisher', 'edition', 'category',
            'status', 'description', 'file_name', 'uploaded_at', 'updated_at'
        ];
        $actualCols = array_filter($selectCols, fn($col) => Schema::hasColumn('books', $col));
        if (empty($actualCols)) {
            $actualCols = ['*'];
        }

        $books = $query->select($actualCols)->orderBy('uploaded_at', 'desc')->get()->map(function ($book) {
            $data = $book->toArray();
            $hasPdf = !empty($book->file_name);
            $data['hasPdf'] = $hasPdf;
            $data['has_file'] = $hasPdf;
            $data['pdfUrl'] = "/api/catalog/{$book->id}/file";
            // Keep index list lightweight (<50KB total) so catalog loads instantly across all devices
            $data['file_data_url'] = '';
            $data['fileDataUrl'] = '';
            $data['cover_image'] = $book->cover_image ?? null;
            $data['coverImage'] = $book->cover_image ?? null;
            return $data;
        });

        return response()->json($books);
    }

    public function show($id)
    {
        $book = Book::where('id', $id)
            ->orWhereRaw('LOWER(id) = ?', [strtolower($id)])
            ->first();

        if ($book && ($book->status === 'pending' || $book->status === 'rejected')) {
            return response()->json([
                'error' => 'This resource is pending administrative approval at #/admin/hod-submissions and has not been approved for student access.'
            ], 403);
        }

        if (!$book) {
            $upload = \App\Models\DepartmentUpload::where('id', $id)
                ->orWhere('book_id', $id)
                ->orWhereRaw('LOWER(id) = ?', [strtolower($id)])
                ->orWhereRaw('LOWER(book_id) = ?', [strtolower($id)])
                ->first();

            if ($upload) {
                // RESTRICTION: HOD upload MUST be approved by Admin at #/admin/hod-submissions before student catalog access
                if (strtolower($upload->status ?? 'pending') !== 'approved') {
                    return response()->json([
                        'error' => 'This departmental resource is pending review and approval by the Central Library Administration at #/admin/hod-submissions before student access is permitted.',
                        'status' => $upload->status
                    ], 403);
                }

                if ($upload->book_id && ($b = Book::where('id', $upload->book_id)->first())) {
                    return response()->json($b);
                }
                return response()->json([
                    'id' => $upload->book_id ?: $upload->id,
                    'title' => $upload->title,
                    'author' => $upload->author,
                    'courseCode' => $upload->course_code,
                    'course_code' => $upload->course_code,
                    'targetLevel' => $upload->target_level,
                    'department' => $upload->department_name,
                    'fileName' => $upload->file_name,
                    'fileDataUrl' => $upload->file_data_url,
                    'file_data_url' => $upload->file_data_url,
                    'coverImage' => $upload->cover_image,
                    'cover_image' => $upload->cover_image,
                    'isDigital' => true,
                    'is_digital' => 1,
                    'status' => 'approved',
                    'uploadedBy' => $upload->hod_name,
                    'uploaded_by' => $upload->hod_name,
                ]);
            }

            return response()->json(['error' => 'Book not found'], 404);
        }

        return response()->json($book);
    }

    /**
     * Stream the uploaded PDF file for an admin or HOD book
     */
    public function file(Request $request, $id)
    {
        $book = Book::where('id', $id)
            ->orWhereRaw('LOWER(id) = ?', [strtolower($id)])
            ->first();

        if ($book && ($book->status === 'pending' || $book->status === 'rejected')) {
            return response()->json([
                'error' => 'Access Denied: Resource is pending administrative approval.'
            ], 403);
        }

        $dataUrl = $book?->getAttribute('file_data_url');
        $upload = null;
        if (!$dataUrl) {
            $upload = \App\Models\DepartmentUpload::where('book_id', $id)
                ->orWhere('id', $id)
                ->orWhereRaw('LOWER(book_id) = ?', [strtolower($id)])
                ->orWhereRaw('LOWER(id) = ?', [strtolower($id)])
                ->first();

            // RESTRICTION: HOD upload MUST be approved by Admin at #/admin/hod-submissions before file access
            if ($upload && strtolower($upload->status ?? 'pending') !== 'approved') {
                return response()->json([
                    'error' => 'Access Denied: This departmental document is pending review and approval by Central Library Admin at #/admin/hod-submissions before student reading is permitted.'
                ], 403);
            }

            $dataUrl = $upload?->file_data_url;
        }

        if (!$dataUrl) {
            $thesis = \App\Models\Thesis::where('id', $id)
                ->orWhereRaw('LOWER(id) = ?', [strtolower($id)])
                ->first();
            $dataUrl = $thesis?->getAttribute('file_data_url');
        }

        if (!$dataUrl) {
            $binary = $this->generateSyllabusPdf($book, $upload ?? null);
            $mime = 'application/pdf';
        } else {
            $mime = 'application/pdf';
            $payload = $dataUrl;
            if (preg_match('#^data:([^;]+);base64,(.*)$#s', $dataUrl, $m)) {
                $mime = $m[1];
                $payload = $m[2];
            }
            $binary = base64_decode($payload);
        }

        $cleanTitle = $book?->title ? preg_replace('/[^a-zA-Z0-9_\-]/', '_', $book->title) : $id;
        $filename = ($book?->file_name) ?: ($cleanTitle . '.pdf');
        $disposition = $request->query('download') ? 'attachment' : 'inline';

        return response($binary, 200, [
            'Content-Type' => $mime,
            'Content-Disposition' => "{$disposition}; filename=\"{$filename}\"",
            'Cache-Control' => 'public, max-age=86400',
            'Access-Control-Allow-Origin' => '*'
        ]);
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

        $this->syncBookToMysql($book);

        return response()->json([
            'success' => true,
            'message' => 'Book catalogued successfully in Laravel 11 backend',
            'book' => $book
        ]);
    }

    private function syncBookToMysql($book): void
    {
        try {
            $pdo = new \PDO("mysql:host=127.0.0.1;port=3306;dbname=brainfeels_library", "root", "", [
                \PDO::ATTR_ERRMODE => \PDO::ERRMODE_SILENT,
                \PDO::ATTR_TIMEOUT => 2
            ]);
            $stmt = $pdo->prepare("
                INSERT INTO books (id, title, subtitle, author, department, course_code, target_level, call_number, shelf_location, isbn, doi, publisher, year, pdf_pages, file_size, file_name, file_data_url, cover_image, is_digital, access_level, copies_total, copies_available, uploaded_at, uploaded_by)
                VALUES (:id, :title, :subtitle, :author, :department, :course_code, :target_level, :call_number, :shelf_location, :isbn, :doi, :publisher, :year, :pdf_pages, :file_size, :file_name, :file_data_url, :cover_image, :is_digital, :access_level, :copies_total, :copies_available, :uploaded_at, :uploaded_by)
                ON DUPLICATE KEY UPDATE
                title = VALUES(title), subtitle = VALUES(subtitle), author = VALUES(author), department = VALUES(department), course_code = VALUES(course_code), target_level = VALUES(target_level), call_number = VALUES(call_number), shelf_location = VALUES(shelf_location), isbn = VALUES(isbn), doi = VALUES(doi), publisher = VALUES(publisher), year = VALUES(year), pdf_pages = VALUES(pdf_pages), file_size = VALUES(file_size), file_name = VALUES(file_name), file_data_url = VALUES(file_data_url), cover_image = VALUES(cover_image), is_digital = VALUES(is_digital), access_level = VALUES(access_level), copies_total = VALUES(copies_total), copies_available = VALUES(copies_available), uploaded_at = VALUES(uploaded_at), uploaded_by = VALUES(uploaded_by)
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
                ':file_data_url' => $book->file_data_url,
                ':cover_image' => $book->cover_image,
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
        $book = Book::find($id);
        if (!$book) {
            return response()->json(['error' => 'Book not found'], 404);
        }

        $book->delete();
        return response()->json(['success' => true, 'message' => 'Item deaccessioned from catalog']);
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

    public function getFavorites(Request $request)
    {
        $userId = $request->query('user_id', 'guest_opac');
        $favorites = DB::table('favorites')
            ->where('user_identifier', $userId)
            ->pluck('book_id');

        return response()->json($favorites);
    }

    public function toggleFavorite(Request $request)
    {
        $userId = $request->input('user_id', 'guest_opac');
        $bookId = $request->input('book_id');

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
        } else {
            DB::table('favorites')->insert([
                'user_identifier' => $userId,
                'book_id' => $bookId,
                'created_at' => now(),
            ]);
            $saved = true;
        }

        $allFavorites = DB::table('favorites')
            ->where('user_identifier', $userId)
            ->pluck('book_id');

        return response()->json([
            'saved' => $saved,
            'book_id' => $bookId,
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

