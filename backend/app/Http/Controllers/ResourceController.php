<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ResourceController extends Controller
{
    /**
     * GET /api/resources & GET /api/search
     * High-efficiency paginated search engine for institutional catalogues.
     * Prevents loading full catalogue into client browser.
     */
    public function index(Request $request)
    {
        return $this->performSearch($request);
    }

    public function search(Request $request)
    {
        return $this->performSearch($request);
    }

    private function performSearch(Request $request)
    {
        $q = trim($request->query('q', $request->query('search', '')));
        $field = $request->query('field', 'all');
        $branch = $request->query('branch', 'All');
        $department = $request->query('department', 'All');
        $subject = $request->query('subject', 'All');
        $format = $request->query('format', 'All');
        $availability = $request->query('availability', 'All');
        $yearFrom = $request->query('yearFrom');
        $yearTo = $request->query('yearTo');
        $sort = $request->query('sort', 'relevance');

        // Pagination limits per prompt: 20, 50, 100 (default: 20)
        $limit = (int)$request->query('limit', 20);
        if (!in_array($limit, [10, 20, 50, 100])) {
            $limit = 20;
        }
        $page = max(1, (int)$request->query('page', 1));
        $offset = ($page - 1) * $limit;

        $query = DB::table('books');

        // 1. Text Search Filter with Multi-field support
        if (!empty($q)) {
            $term = "%{$q}%";
            if ($field === 'title') {
                $query->where('title', 'like', $term);
            } elseif ($field === 'author') {
                $query->where('author', 'like', $term);
            } elseif ($field === 'isbn') {
                $cleanIsbn = preg_replace('/[^0-9X]/i', '', $q);
                $query->where('isbn', 'like', "%{$cleanIsbn}%");
            } elseif ($field === 'call_number' || $field === 'call') {
                $query->where('call_number', 'like', $term);
            } elseif ($field === 'subject') {
                $query->where('subject', 'like', $term);
            } elseif ($field === 'publisher') {
                $query->where('publisher', 'like', $term);
            } elseif ($field === 'barcode') {
                // Join or match with copies
                $bookIds = DB::table('copies')
                    ->where('barcode', 'like', $term)
                    ->orWhere('accession_number', 'like', $term)
                    ->pluck('book_id');
                $query->whereIn('id', $bookIds);
            } else {
                // All fields keyword search
                $query->where(function ($sub) use ($term, $q) {
                    $sub->where('title', 'like', $term)
                        ->orWhere('author', 'like', $term)
                        ->orWhere('isbn', 'like', $term)
                        ->orWhere('call_number', 'like', $term)
                        ->orWhere('subject', 'like', $term)
                        ->orWhere('publisher', 'like', $term)
                        ->orWhere('abstract', 'like', $term);
                });
            }
        }

        // 2. Facet Filters
        if ($branch !== 'All' && $branch !== 'All Libraries') {
            $query->where('branch', 'like', "%{$branch}%");
        }

        if ($department !== 'All') {
            $query->where('department', $department);
        }

        if ($subject !== 'All') {
            $query->where('subject', $subject);
        }

        if ($format === 'Digital' || $format === 'Electronic' || $request->query('digitalOnly') === 'true') {
            $query->where('is_digital', 1);
        } elseif ($format === 'Physical') {
            $query->where('is_digital', 0);
        }

        if ($availability === 'Available') {
            $query->where('copies_available', '>', 0);
        } elseif ($availability === 'CheckedOut') {
            $query->where('copies_available', '<=', 0);
        }

        if (!empty($yearFrom) && is_numeric($yearFrom)) {
            $query->where('year', '>=', (int)$yearFrom);
        }
        if (!empty($yearTo) && is_numeric($yearTo)) {
            $query->where('year', '<=', (int)$yearTo);
        }

        // 3. Count Total Before Pagination
        $total = $query->count();
        $lastPage = max(1, (int)ceil($total / $limit));

        // 4. Sorting
        if ($sort === 'title_asc') {
            $query->orderBy('title', 'asc');
        } elseif ($sort === 'title_desc') {
            $query->orderBy('title', 'desc');
        } elseif ($sort === 'year_desc') {
            $query->orderBy('year', 'desc');
        } elseif ($sort === 'year_asc') {
            $query->orderBy('year', 'asc');
        } else {
            // Default ranking: newest additions and available copies first
            $query->orderBy('copies_available', 'desc')->orderBy('uploaded_at', 'desc');
        }

        // 5. Fetch Page Slice
        $records = $query->skip($offset)->take($limit)->get();

        // 6. Enrich with copy inventory summary
        $records = $records->map(function ($book) {
            $copiesCount = DB::table('copies')->where('book_id', $book->id)->count();
            $availableCopies = DB::table('copies')
                ->where('book_id', $book->id)
                ->where('status', 'Available')
                ->count();
            
            return (array)$book + [
                'callNumber' => $book->call_number ?? '',
                'shelfLocation' => $book->shelf_location ?? '',
                'copiesTotal' => max((int)$book->copies_total, $copiesCount),
                'copiesAvailable' => $copiesCount > 0 ? $availableCopies : (int)$book->copies_available,
                'isDigital' => (bool)$book->is_digital,
                'pdfPages' => (int)($book->pdf_pages ?? 0),
                'qrCodeUrl' => "/book/{$book->id}",
            ];
        });

        // 7. Calculate Facet Aggregations
        $deptFacets = DB::table('books')
            ->select('department', DB::raw('count(*) as count'))
            ->whereNotNull('department')
            ->groupBy('department')
            ->pluck('count', 'department');

        $subjectFacets = DB::table('books')
            ->select('subject', DB::raw('count(*) as count'))
            ->whereNotNull('subject')
            ->groupBy('subject')
            ->pluck('count', 'subject');

        return response()->json([
            'data' => $records,
            'current_page' => $page,
            'per_page' => $limit,
            'total' => $total,
            'last_page' => $lastPage,
            'from' => $total > 0 ? $offset + 1 : 0,
            'to' => min($offset + $limit, $total),
            'facets' => [
                'departments' => $deptFacets,
                'subjects' => $subjectFacets,
                'total_holdings' => DB::table('books')->count(),
                'active_copies' => DB::table('copies')->count(),
            ]
        ]);
    }

    /**
     * GET /api/resources/{id}
     * Full bibliographic dossier with physical copy inventory and barcodes.
     */
    public function show($id)
    {
        $book = DB::table('books')
            ->where('id', $id)
            ->orWhereRaw('LOWER(id) = ?', [strtolower($id)])
            ->first();

        if (!$book) {
            return response()->json(['error' => 'Resource not found in library catalogue'], 404);
        }

        // Fetch physical copies with barcode and shelf metadata
        $copies = DB::table('copies')
            ->leftJoin('shelves', 'copies.shelf_id', '=', 'shelves.id')
            ->where('copies.book_id', $book->id)
            ->select(
                'copies.id',
                'copies.copy_number',
                'copies.barcode',
                'copies.rfid_tag',
                'copies.accession_number',
                'copies.status',
                'copies.condition',
                'copies.branch_id',
                'shelves.shelf_code',
                'shelves.floor',
                'shelves.aisle'
            )
            ->orderBy('copies.copy_number', 'asc')
            ->get();

        // If no copies in table yet, auto-synthesize default copy records
        if ($copies->isEmpty()) {
            $total = max(1, (int)$book->copies_total);
            $cleanId = preg_replace('/[^0-9A-Za-z]/', '', $book->id);
            for ($c = 1; $c <= $total; $c++) {
                $copyBarcode = "BC-{$cleanId}-C{$c}";
                DB::table('copies')->insertOrIgnore([
                    'id' => "{$book->id}-C{$c}",
                    'book_id' => $book->id,
                    'branch_id' => $book->branch ?? 'Main Central Library',
                    'shelf_id' => 'SHELF-FL1-A1',
                    'copy_number' => $c,
                    'barcode' => $copyBarcode,
                    'rfid_tag' => "RFID-{$copyBarcode}",
                    'accession_number' => "ACC-2026-{$cleanId}-C{$c}",
                    'status' => 'Available',
                    'condition' => 'Good',
                    'acquisition_cost' => 15000.00,
                    'acquisition_date' => now()->toDateString(),
                ]);
            }
            $copies = DB::table('copies')->where('book_id', $book->id)->get();
        }

        return response()->json((array)$book + [
            'callNumber' => $book->call_number ?? '',
            'shelfLocation' => $book->shelf_location ?? '',
            'isDigital' => (bool)$book->is_digital,
            'copies' => $copies,
            'qrCode' => [
                'target_url' => "http://localhost:5173/#/book/{$book->id}",
                'label' => "Scan for Mobile OPAC Dossier: {$book->title}"
            ]
        ]);
    }

    /**
     * POST /api/resources
     * Create resource with barcode generation and physical copy registration.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:500',
            'author' => 'required|string|max:255',
            'isbn' => 'nullable|string|max:50',
            'callNumber' => 'nullable|string|max:100',
            'subject' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:150',
            'copiesTotal' => 'nullable|integer|min:1',
            'branch' => 'nullable|string|max:255',
        ]);

        $id = $request->input('id') ?: 'FCC-B' . str_pad((string)(DB::table('books')->count() + 1), 3, '0', STR_PAD_LEFT);
        
        $bookData = [
            'id' => $id,
            'title' => $validated['title'],
            'subtitle' => $request->input('subtitle'),
            'author' => $validated['author'],
            'isbn' => $validated['isbn'] ?? '978-978-' . rand(1000, 9999) . '-' . rand(10, 99) . '-1',
            'doi' => $request->input('doi'),
            'call_number' => $validated['callNumber'] ?? 'HD2963 .F33 2026',
            'subject' => $validated['subject'] ?? 'Co-operative Economics',
            'department' => $validated['department'] ?? 'Co-operative Economics & Management',
            'branch' => $validated['branch'] ?? 'Main Central Library',
            'shelf_location' => $request->input('shelfLocation', 'Floor 1 • Aisle 1 • Shelf 04'),
            'year' => (int)($request->input('year') ?: date('Y')),
            'publisher' => $request->input('publisher', 'Federal Co-operative College Academic Press'),
            'edition' => $request->input('edition', '1st Edition'),
            'copies_total' => (int)($validated['copiesTotal'] ?? 3),
            'copies_available' => (int)($validated['copiesTotal'] ?? 3),
            'is_digital' => $request->boolean('isDigital', false),
            'abstract' => $request->input('abstract', 'Institutional catalogue resource.'),
            'uploaded_at' => now(),
            'uploaded_by' => $request->input('uploadedBy', 'Library Staff')
        ];

        DB::table('books')->updateOrInsert(['id' => $id], $bookData);

        // Generate physical copy records with unique barcodes
        $totalCopies = (int)$bookData['copies_total'];
        $cleanId = preg_replace('/[^0-9A-Za-z]/', '', $id);
        for ($c = 1; $c <= $totalCopies; $c++) {
            $copyId = "{$id}-C{$c}";
            $barcodeVal = "BC-{$cleanId}-C{$c}";
            DB::table('copies')->updateOrInsert(
                ['id' => $copyId],
                [
                    'book_id' => $id,
                    'branch_id' => $bookData['branch'],
                    'shelf_id' => 'SHELF-FL1-A1',
                    'copy_number' => $c,
                    'barcode' => $barcodeVal,
                    'rfid_tag' => "RFID-{$barcodeVal}",
                    'accession_number' => "ACC-2026-{$cleanId}-C{$c}",
                    'status' => 'Available',
                    'condition' => 'Good',
                    'acquisition_cost' => 12500.00,
                    'acquisition_date' => now()->toDateString(),
                ]
            );

            DB::table('barcodes')->updateOrInsert(
                ['barcode_value' => $barcodeVal],
                [
                    'barcode_type' => 'Code 128',
                    'entity_type' => 'copy',
                    'entity_id' => $copyId,
                    'is_active' => true,
                    'print_count' => 1,
                    'last_scanned_at' => now(),
                ]
            );
        }

        // Record Audit Log
        DB::table('audit_logs')->insert([
            'id' => 'LOG-' . Str::upper(Str::random(8)),
            'timestamp' => now(),
            'actor' => $bookData['uploaded_by'],
            'role' => 'Cataloguer',
            'action' => 'Resource Catalogued',
            'resource_type' => 'Book',
            'resource_id' => $id,
            'details' => "Resource \"{$bookData['title']}\" catalogued with {$totalCopies} physical barcode copies.",
            'ip_address' => $request->ip() ?? '127.0.0.1'
        ]);

        return response()->json([
            'message' => 'Resource successfully catalogued with physical barcode copies.',
            'book' => $bookData
        ], 201);
    }

    /**
     * PUT /api/resources/{id}
     */
    public function update(Request $request, $id)
    {
        $book = DB::table('books')->where('id', $id)->first();
        if (!$book) {
            return response()->json(['error' => 'Resource not found'], 404);
        }

        $fields = $request->only(['title', 'author', 'isbn', 'call_number', 'subject', 'department', 'abstract', 'shelf_location', 'year', 'publisher']);
        DB::table('books')->where('id', $id)->update($fields);

        return response()->json(['message' => 'Resource updated successfully']);
    }

    /**
     * DELETE /api/resources/{id}
     */
    public function destroy($id)
    {
        $book = DB::table('books')->where('id', $id)->first();
        if (!$book) {
            return response()->json(['error' => 'Resource not found'], 404);
        }

        DB::table('copies')->where('book_id', $id)->delete();
        DB::table('books')->where('id', $id)->delete();

        return response()->json(['message' => 'Resource and copies decommissioned from active catalogue.']);
    }
}
