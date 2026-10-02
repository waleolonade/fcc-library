<?php

namespace App\Http\Controllers;

use App\Models\Book;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

        if ($search = $request->query('search')) {
            $s = "%{$search}%";
            $query->where(function ($q) use ($s) {
                $q->where('title', 'like', $s)
                  ->orWhere('author', 'like', $s)
                  ->orWhere('isbn', 'like', $s)
                  ->orWhere('call_number', 'like', $s)
                  ->orWhere('subject', 'like', $s);
            });
        }

        if ($request->query('digitalOnly') === 'true') {
            $query->where('is_digital', 1);
        }

        $books = $query->orderBy('uploaded_at', 'desc')->get();

        return response()->json($books);
    }

    public function show($id)
    {
        $book = Book::where('id', $id)
            ->orWhereRaw('LOWER(id) = ?', [strtolower($id)])
            ->first();

        if (!$book) {
            return response()->json(['error' => 'Book not found'], 404);
        }

        return response()->json($book);
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

        return response()->json([
            'success' => true,
            'message' => 'Book catalogued successfully in Laravel 11 backend',
            'book' => $book
        ]);
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
                'User-Agent' => 'FCC-Ibadan-SmartLibrary/5.0 (mailto:librarian@fccibadan.edu.ng)'
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
}

