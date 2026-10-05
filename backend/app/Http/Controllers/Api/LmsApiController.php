<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\Author;
use App\Models\Review;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LmsApiController extends Controller
{
    /**
     * Search & Browse Books via LMS API
     * GET /api/lms/books
     */
    public function index(Request $request)
    {
        $start = microtime(true);
        $query = Book::query();

        // 1. Search Query
        if ($search = trim($request->input('search', $request->input('q', '')))) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('author', 'like', "%{$search}%")
                  ->orWhere('subject', 'like', "%{$search}%")
                  ->orWhere('isbn', 'like', "%{$search}%")
                  ->orWhere('call_number', 'like', "%{$search}%")
                  ->orWhere('abstract', 'like', "%{$search}%")
                  ->orWhere('department', 'like', "%{$search}%");
            });
        }

        // 2. Filters
        if ($author = $request->input('author')) {
            $query->where('author', 'like', "%{$author}%");
        }

        if ($department = $request->input('department', $request->input('category'))) {
            if ($department !== 'All' && $department !== 'Everything') {
                $query->where(function ($q) use ($department) {
                    $q->where('department', 'like', "%{$department}%")
                      ->orWhere('subject', 'like', "%{$department}%");
                });
            }
        }

        if ($request->has('is_digital')) {
            $isDigital = filter_var($request->input('is_digital'), FILTER_VALIDATE_BOOLEAN);
            $query->where('is_digital', $isDigital);
        }

        if ($request->boolean('available_only')) {
            $query->where('copies_available', '>', 0);
        }

        if ($minRating = $request->input('min_rating')) {
            $query->where('rating', '>=', (float) $minRating);
        }

        // 3. Sorting
        $sort = $request->input('sort', 'relevance');
        switch ($sort) {
            case 'newest':
                $query->orderBy('year', 'desc');
                break;
            case 'rating':
                $query->orderBy('rating', 'desc');
                break;
            case 'title':
                $query->orderBy('title', 'asc');
                break;
            case 'author':
                $query->orderBy('author', 'asc');
                break;
            case 'copies':
                $query->orderBy('copies_available', 'desc');
                break;
            default:
                // Default order
                $query->orderBy('rating', 'desc')->orderBy('title', 'asc');
                break;
        }

        // 4. Pagination
        $perPage = min((int) $request->input('per_page', 12), 50);
        $paginator = $query->withCount(['reviews', 'reservations'])->paginate($perPage);

        $latencyMs = round((microtime(true) - $start) * 1000);

        return response()->json([
            'status' => 'success',
            'api' => 'Thetechguy44 Library Management System API',
            'author' => 'Thetechguy44 (Dev Gana)',
            'repository' => 'https://github.com/Thetechguy44/library-management-system-api',
            'latency_ms' => $latencyMs,
            'api_metadata' => [
                'name' => 'Thetechguy44 Library Management System API',
                'author' => 'Thetechguy44 (Muhammad Yahaya Gana / Dev Gana)',
                'repository' => 'https://github.com/Thetechguy44/library-management-system-api',
                'commits_url' => 'https://github.com/Thetechguy44/library-management-system-api/commits?author=Thetechguy44',
                'routes' => ['/api/books', '/api/authors', '/api/recommendations', '/api/reservations', '/api/fines', '/api/books/{id}/reviews']
            ],
            'total' => $paginator->total(),
            'per_page' => $paginator->perPage(),
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'data' => $paginator->items(),
        ]);
    }

    /**
     * Unified Multi-Source Overlay Search
     * GET /api/lms/search or /api/thetechguy44/search
     * Returns schema-normalized records compatible with federated search
     */
    public function search(Request $request)
    {
        $q = trim($request->input('q', $request->input('query', '')));
        $limit = min((int) $request->input('limit', 15), 50);

        $query = Book::query();
        if ($q !== '') {
            $query->where(function ($b) use ($q) {
                $b->where('title', 'like', "%{$q}%")
                  ->orWhere('author', 'like', "%{$q}%")
                  ->orWhere('subject', 'like', "%{$q}%")
                  ->orWhere('isbn', 'like', "%{$q}%")
                  ->orWhere('department', 'like', "%{$q}%");
            });
        }

        $books = $query->withCount('reviews')->take($limit)->get();

        $normalized = $books->map(function ($book) {
            $access = $book->is_digital
                ? 'full'
                : ($book->copies_available > 0 ? 'on_shelf' : 'borrow');

            return [
                'uid' => 'ttg_' . $book->id,
                'source' => 'thetechguy44',
                'sourceLabel' => 'Thetechguy44 Library API',
                'externalId' => (string) $book->id,
                'type' => $book->is_digital ? 'ebook' : 'book',
                'title' => $book->title,
                'subtitle' => $book->subtitle ?? null,
                'authors' => [$book->author],
                'year' => $book->year ?: 2024,
                'publisher' => $book->publisher ?: 'FCC Academic Press',
                'description' => $book->abstract ?: "Academic work curated in the FCC Smart Library under call number {$book->call_number}.",
                'subjects' => is_array($book->keywords) ? $book->keywords : array_filter(array_map('trim', explode(',', $book->keywords ?: $book->subject ?: ''))),
                'isbn' => $book->isbn,
                'doi' => $book->doi,
                'coverUrl' => $book->cover_url ?: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80',
                'url' => "/#/book/{$book->id}",
                'readUrl' => $book->is_digital ? "/#/read/{$book->id}" : null,
                'access' => $access,
                'citations' => (int) ($book->citations ?? 0),
                'rating' => (float) ($book->rating ?? 5.0),
                'reviews_count' => (int) ($book->reviews_count ?? 0),
                'language' => 'en',
                'holdings' => [
                    'available' => (int) ($book->copies_available ?? 1),
                    'total' => (int) ($book->copies_total ?? 1),
                    'shelf' => $book->shelf_location ?: 'Main Stacks',
                    'callNumber' => $book->call_number ?: 'GEN-LIB'
                ]
            ];
        });

        return response()->json([
            'status' => 'success',
            'source' => 'lms_api',
            'count' => $normalized->count(),
            'results' => $normalized,
        ]);
    }

    /**
     * Retrieve single book with full relations
     * GET /api/lms/books/{id}
     */
    public function show($id)
    {
        $book = Book::with(['reviews', 'reservations'])->find($id);

        if (!$book) {
            return response()->json([
                'status' => 'error',
                'message' => "Book record [{$id}] not found in LMS database."
            ], 404);
        }

        // Try to find author record
        $authorRecord = Author::where('name', 'like', "%{$book->author}%")->first();

        return response()->json([
            'status' => 'success',
            'data' => $book,
            'author_profile' => $authorRecord,
            'reviews_summary' => [
                'total_reviews' => $book->reviews->count(),
                'average_rating' => round($book->reviews->avg('rating') ?: 5.0, 1),
            ],
            'hold_queue' => [
                'active_reservations' => $book->reservations->whereIn('status', ['Pending', 'Confirmed'])->count(),
                'is_available' => $book->copies_available > 0,
            ]
        ]);
    }

    /**
     * Get distinct categories / departments
     * GET /api/lms/categories
     */
    public function categories()
    {
        $departments = Book::select('department', DB::raw('count(*) as count'))
            ->whereNotNull('department')
            ->where('department', '!=', '')
            ->groupBy('department')
            ->orderBy('count', 'desc')
            ->get();

        $subjects = Book::select('subject', DB::raw('count(*) as count'))
            ->whereNotNull('subject')
            ->where('subject', '!=', '')
            ->groupBy('subject')
            ->orderBy('count', 'desc')
            ->take(15)
            ->get();

        return response()->json([
            'departments' => $departments,
            'subjects' => $subjects
        ]);
    }

    /**
     * Get high-level stats for the LMS API Hub
     * GET /api/lms/stats
     */
    public function stats()
    {
        $totalBooks = Book::count();
        $digitalCount = Book::where('is_digital', true)->count();
        $physicalCount = Book::where('is_digital', false)->count();
        $totalReservations = Reservation::count();
        $totalReviews = Review::count();
        $avgRating = round(Review::avg('rating') ?: 4.9, 1);

        $featured = Book::orderBy('rating', 'desc')
            ->take(6)
            ->get();

        return response()->json([
            'developer_info' => [
                'name' => 'Thetechguy44 Library Management System API',
                'author' => 'Thetechguy44 (Muhammad Yahaya Gana / Dev Gana)',
                'repository' => 'https://github.com/Thetechguy44/library-management-system-api',
                'commits_url' => 'https://github.com/Thetechguy44/library-management-system-api/commits?author=Thetechguy44'
            ],
            'total_books' => $totalBooks,
            'digital_books' => $digitalCount,
            'physical_books' => $physicalCount,
            'total_reservations' => $totalReservations,
            'total_reviews' => $totalReviews,
            'average_rating' => $avgRating,
            'featured' => $featured,
        ]);
    }
}
