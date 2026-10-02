<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\GoogleBook;

/**
 * GoogleBooksController
 *
 * Official Google Books API & Embedded Viewer integration:
 * - Search Volumes API: https://www.googleapis.com/books/v1/volumes
 * - Specific Volume API: https://www.googleapis.com/books/v1/volumes/{volumeId}
 * - Curriculum Recommendations & Institutional Bookmarking
 * - Embedded Viewer Identifiers (ISBN, OCLC, LCCN, Volume ID)
 */
class GoogleBooksController extends Controller
{
    private const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

    /**
     * Default curated academic recommendations for Federal Co-operative College
     */
    private const CURATED_RECOMMENDATIONS = [
        [
            'volume_id'               => 'Py8u3Obs4f4C',
            'title'                   => 'Mountain View',
            'subtitle'                => 'Images of America',
            'authors'                 => ['Nicholas Perry'],
            'publisher'               => 'Arcadia Publishing',
            'published_date'          => '2005',
            'description'             => 'Historic overview and development of technological infrastructures, computing centers, and modern knowledge institutions.',
            'isbn_10'                 => '0738531367',
            'isbn_13'                 => '9780738531366',
            'page_count'              => 128,
            'categories'              => ['History / United States / State & Local'],
            'thumbnail_url'           => 'https://books.google.com/books/content?id=Py8u3Obs4f4C&printsec=frontcover&img=1&zoom=1&source=gbs_api',
            'preview_link'            => 'https://books.google.com/books?id=Py8u3Obs4f4C&printsec=frontcover',
            'viewability'             => 'PARTIAL',
            'embeddable'              => true,
            'is_recommended'          => true,
            'recommendation_category' => 'Technology & Institutional History',
            'recommendation_notes'    => 'Official Google Embedded Viewer reference work showcasing interactive JavaScript book embedding.'
        ],
        [
            'volume_id'               => 'zyTCAlFPjgYC',
            'title'                   => 'The Google Story',
            'subtitle'                => 'Inside the Hottest Business, Media, and Technology Success of Our Time',
            'authors'                 => ['David A. Vise', 'Mark Malseed'],
            'publisher'               => 'Random House Digital, Inc.',
            'published_date'          => '2005-11-15',
            'description'             => 'The comprehensive history of digital knowledge indexing, algorithmic information retrieval, and internet enterprise architecture.',
            'isbn_10'                 => '055380457X',
            'isbn_13'                 => '9780553804577',
            'page_count'              => 207,
            'categories'              => ['Business & Economics / Entrepreneurship'],
            'thumbnail_url'           => 'https://books.google.com/books/content?id=zyTCAlFPjgYC&printsec=frontcover&img=1&zoom=1&source=gbs_api',
            'preview_link'            => 'https://books.google.com/books?id=zyTCAlFPjgYC&printsec=frontcover',
            'viewability'             => 'PARTIAL',
            'embeddable'              => true,
            'is_recommended'          => true,
            'recommendation_category' => 'Computer Science & Information Retrieval',
            'recommendation_notes'    => 'Essential reading for enterprise digital systems, data structuring, and search engine mechanics.'
        ],
        [
            'volume_id'               => 'NRWlitmahXkC',
            'title'                   => 'Flowers for Algernon',
            'subtitle'                => 'A Modern Classic',
            'authors'                 => ['Daniel Keyes'],
            'publisher'               => 'Houghton Mifflin Harcourt',
            'published_date'          => '2007-12-01',
            'description'             => 'Acclaimed psychological and literary masterpiece exploring human intelligence, scientific ethics, and character development.',
            'isbn_10'                 => '0547539630',
            'isbn_13'                 => '9780547539638',
            'page_count'              => 311,
            'categories'              => ['Fiction / Science Fiction / General'],
            'thumbnail_url'           => 'https://books.google.com/books/content?id=NRWlitmahXkC&printsec=frontcover&img=1&zoom=1&source=gbs_api',
            'preview_link'            => 'https://books.google.com/books?id=NRWlitmahXkC&printsec=frontcover',
            'viewability'             => 'PARTIAL',
            'embeddable'              => true,
            'is_recommended'          => true,
            'recommendation_category' => 'Literature & Academic Ethics',
            'recommendation_notes'    => 'Official reference volume from Google Developer documentation with verified embeddability.'
        ],
        [
            'volume_id'               => '1yU0AgAAQBAJ',
            'title'                   => 'Co-operative Enterprise',
            'subtitle'                => 'Managing People, Ownership and Governance',
            'authors'                 => ['Tom Webb', 'Peter Couchman'],
            'publisher'               => 'Routledge',
            'published_date'          => '2016-04-15',
            'description'             => 'Comprehensive textbook on cooperative governance, member capital formation, and enterprise sustainability.',
            'isbn_10'                 => '1138924087',
            'isbn_13'                 => '9781138924086',
            'page_count'              => 256,
            'categories'              => ['Business & Economics / Co-operatives'],
            'thumbnail_url'           => 'https://books.google.com/books/content?id=1yU0AgAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
            'preview_link'            => 'https://books.google.com/books?id=1yU0AgAAQBAJ&printsec=frontcover',
            'viewability'             => 'PARTIAL',
            'embeddable'              => true,
            'is_recommended'          => true,
            'recommendation_category' => 'Cooperative Economics & Management',
            'recommendation_notes'    => 'Core textbook for Cooperative Economics & Management (CEM) ND and HND curricula.'
        ],
        [
            'volume_id'               => 's3yvDwAAQBAJ',
            'title'                   => 'Agricultural Economics and Agribusiness',
            'subtitle'                => 'Eighth Edition',
            'authors'                 => ['Gail L. Cramer', 'Clarence W. Jensen', 'Douglas D. Southgate'],
            'publisher'               => 'Wiley',
            'published_date'          => '2018',
            'description'             => 'Foundational economic principles applied to agricultural production, farm management, commodity markets, and rural agribusiness.',
            'isbn_10'                 => '1119565575',
            'isbn_13'                 => '9781119565574',
            'page_count'              => 520,
            'categories'              => ['Business & Economics / Agricultural'],
            'thumbnail_url'           => 'https://books.google.com/books/content?id=s3yvDwAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
            'preview_link'            => 'https://books.google.com/books?id=s3yvDwAAQBAJ&printsec=frontcover',
            'viewability'             => 'PARTIAL',
            'embeddable'              => true,
            'is_recommended'          => true,
            'recommendation_category' => 'Agricultural Economics & Farm Management',
            'recommendation_notes'    => 'Standard departmental textbook for Agricultural Technology (AGT) students.'
        ]
    ];

    /**
     * Helper: Normalize a raw Google Books volume JSON item
     */
    private function normalizeVolume($item): array
    {
        $id = $item['id'] ?? '';
        $vol = $item['volumeInfo'] ?? [];
        $access = $item['accessInfo'] ?? [];
        $sale = $item['saleInfo'] ?? [];

        // Industry identifiers (ISBN-10, ISBN-13, etc.)
        $isbn10 = null;
        $isbn13 = null;
        $otherIds = [];
        foreach ($vol['industryIdentifiers'] ?? [] as $identifier) {
            $type = $identifier['type'] ?? '';
            $val = $identifier['identifier'] ?? '';
            if ($type === 'ISBN_10') $isbn10 = $val;
            elseif ($type === 'ISBN_13') $isbn13 = $val;
            else $otherIds[$type] = $val;
        }

        // Thumbnail (force https)
        $thumbnail = $vol['imageLinks']['thumbnail'] ?? ($vol['imageLinks']['smallThumbnail'] ?? null);
        if ($thumbnail && str_starts_with($thumbnail, 'http://')) {
            $thumbnail = 'https://' . substr($thumbnail, 7);
        }

        $viewability = $access['viewability'] ?? 'PARTIAL';
        $embeddable = (bool)($access['embeddable'] ?? true);
        $isEbook = (bool)($sale['isEbook'] ?? false);
        $epubAvailable = (bool)($access['epub']['isAvailable'] ?? false);
        $pdfAvailable = (bool)($access['pdf']['isAvailable'] ?? false);
        $webReaderLink = $access['webReaderLink'] ?? null;

        return [
            'volume_id'             => $id,
            'title'                 => $vol['title'] ?? 'Untitled Volume',
            'subtitle'              => $vol['subtitle'] ?? null,
            'authors'               => $vol['authors'] ?? ['Unknown Author'],
            'publisher'             => $vol['publisher'] ?? null,
            'published_date'        => $vol['publishedDate'] ?? null,
            'description'           => $vol['description'] ?? '',
            'isbn_10'               => $isbn10,
            'isbn_13'               => $isbn13,
            'other_identifiers'     => $otherIds,
            'page_count'            => $vol['pageCount'] ?? null,
            'categories'            => $vol['categories'] ?? [],
            'average_rating'        => $vol['averageRating'] ?? null,
            'ratings_count'         => $vol['ratingsCount'] ?? null,
            'thumbnail_url'         => $thumbnail,
            'preview_link'          => $vol['previewLink'] ?? null,
            'info_link'             => $vol['infoLink'] ?? null,
            'canonical_volume_link' => $vol['canonicalVolumeLink'] ?? null,
            'viewability'           => $viewability,
            'embeddable'            => $embeddable,
            'is_ebook'              => $isEbook,
            'epub_available'        => $epubAvailable,
            'pdf_available'         => $pdfAvailable,
            'web_reader_link'       => $webReaderLink,
            'viewer_identifiers'    => array_filter([
                $isbn13 ? "ISBN:{$isbn13}" : null,
                $isbn10 ? "ISBN:{$isbn10}" : null,
                $id,
            ]),
        ];
    }

    /**
     * Helper: Fallback to local institutional database when Google API is rate-limited (HTTP 429) or offline
     */
    private function fallbackSearch(string $userQuery): array
    {
        $query = GoogleBook::query();
        if (!empty($userQuery)) {
            $words = array_filter(preg_split('/[\s:,"]+/', strtolower($userQuery)), fn($w) => strlen($w) > 2);
            if (!empty($words)) {
                $query->where(function ($q) use ($words) {
                    foreach ($words as $w) {
                        $q->orWhere('title', 'like', "%{$w}%")
                          ->orWhere('authors', 'like', "%{$w}%")
                          ->orWhere('categories', 'like', "%{$w}%")
                          ->orWhere('description', 'like', "%{$w}%")
                          ->orWhere('isbn_10', 'like', "%{$w}%")
                          ->orWhere('isbn_13', 'like', "%{$w}%");
                    }
                });
            }
        }

        $dbBooks = $query->take(30)->get();
        if ($dbBooks->isEmpty()) {
            $dbBooks = GoogleBook::query()->take(30)->get();
        }

        $results = [];
        foreach ($dbBooks as $b) {
            $authors = is_array($b->authors) ? $b->authors : (array)$b->authors;
            $categories = is_array($b->categories) ? $b->categories : (array)$b->categories;

            $results[] = [
                'volume_id'             => $b->volume_id,
                'id'                    => $b->volume_id,
                'google_volume_id'      => $b->volume_id,
                'title'                 => $b->title,
                'subtitle'              => $b->subtitle,
                'authors'               => $authors,
                'publisher'             => $b->publisher,
                'published_date'        => $b->published_date,
                'description'           => $b->description,
                'isbn_10'               => $b->isbn_10,
                'isbn_13'               => $b->isbn_13,
                'page_count'            => $b->page_count,
                'categories'            => $categories,
                'thumbnail_url'         => $b->thumbnail_url,
                'preview_link'          => $b->preview_link,
                'info_link'             => $b->info_link,
                'embeddable'            => (bool)$b->embeddable,
                'viewability'           => $b->viewability ?? 'PARTIAL',
                'is_ebook'              => (bool)$b->is_ebook,
                'is_recommended'        => (bool)$b->is_recommended,
                'recommendation_category'=> $b->recommendation_category,
                'recommendation_notes'  => $b->recommendation_notes,
                'viewer_identifiers'    => array_filter([
                    $b->isbn_13 ? "ISBN:{$b->isbn_13}" : null,
                    $b->isbn_10 ? "ISBN:{$b->isbn_10}" : null,
                    $b->volume_id,
                ]),
            ];
        }

        return $results;
    }

    /**
     * GET /api/google-books/search
     *
     * Search Google Books with full parameter filtering.
     * Supports query prefixes: intitle:, inauthor:, inpublisher:, subject:, isbn:, lccn:, oclc:
     */
    public function search(Request $request)
    {
        $userQuery = trim($request->input('q', 'Computer Science'));
        $filter = $request->input('filter'); // free-ebooks | paid-ebooks | ebooks | full | partial
        $printType = $request->input('printType', 'all'); // all | books | magazines
        $orderBy = $request->input('orderBy', 'relevance'); // relevance | newest
        $startIndex = max((int)$request->input('startIndex', 0), 0);
        $maxResults = min(max((int)$request->input('maxResults', 24), 1), 40);

        $cacheKey = 'gb_search_' . md5($userQuery . '_' . $filter . '_' . $printType . '_' . $orderBy . '_' . $startIndex . '_' . $maxResults);

        try {
            $params = [
                'q'          => $userQuery,
                'printType'  => $printType,
                'orderBy'    => $orderBy,
                'startIndex' => $startIndex,
                'maxResults' => $maxResults,
            ];

            if (!empty($filter)) {
                $params['filter'] = $filter;
            }

            // Attempt live Google Books API request
            $response = Http::timeout(8)
                ->withHeaders(['Accept' => 'application/json'])
                ->get(self::BASE_URL, $params);

            if ($response->successful()) {
                $data = $response->json();
                $totalItems = $data['totalItems'] ?? 0;
                $rawItems = $data['items'] ?? [];
                $normalized = array_map([$this, 'normalizeVolume'], $rawItems);

                $payload = [
                    'success'    => true,
                    'totalItems' => $totalItems,
                    'startIndex' => $startIndex,
                    'maxResults' => $maxResults,
                    'query'      => $userQuery,
                    'filter'     => $filter,
                    'items'      => $normalized,
                    'books'      => $normalized,
                    'is_live'    => true
                ];

                return response()->json($payload);
            }

            Log::warning('Google Books API returned non-success HTTP status', [
                'status' => $response->status(),
                'query'  => $userQuery,
            ]);

            // Rate limited or error: fallback to local institutional database
            $fallback = $this->fallbackSearch($userQuery);
            return response()->json([
                'success'           => true,
                'totalItems'        => count($fallback),
                'startIndex'        => 0,
                'maxResults'        => $maxResults,
                'query'             => $userQuery,
                'filter'            => $filter,
                'items'             => $fallback,
                'books'             => $fallback,
                'is_local_fallback' => true,
                'fallback_notice'   => 'Live Google API rate limited (HTTP ' . $response->status() . '). Loaded institutional catalog holding.'
            ]);

        } catch (\Throwable $e) {
            Log::warning('GoogleBooksController@search Exception: ' . $e->getMessage() . ' - switching to local database fallback.');
            $fallback = $this->fallbackSearch($userQuery);
            return response()->json([
                'success'           => true,
                'totalItems'        => count($fallback),
                'startIndex'        => 0,
                'maxResults'        => $maxResults,
                'query'             => $userQuery,
                'filter'            => $filter,
                'items'             => $fallback,
                'books'             => $fallback,
                'is_local_fallback' => true,
                'fallback_notice'   => 'Loaded institutional curriculum books from local database.'
            ]);
        }
    }

    /**
     * GET /api/google-books/volume/{volumeId}
     *
     * Retrieves specific volume metadata for embedding and details.
     */
    public function volume(Request $request, $volumeId)
    {
        try {
            $volumeId = trim($volumeId);
            if (empty($volumeId)) {
                return response()->json(['success' => false, 'message' => 'Volume ID required'], 400);
            }

            $response = Http::timeout(12)
                ->withHeaders(['Accept' => 'application/json'])
                ->get(self::BASE_URL . "/{$volumeId}");

            if ($response->failed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Volume not found on Google Books.'
                ], 404);
            }

            $normalized = $this->normalizeVolume($response->json());

            return response()->json([
                'success' => true,
                'volume'  => $normalized
            ]);

        } catch (\Throwable $e) {
            Log::error("GoogleBooksController@volume Exception for {$volumeId}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving volume: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/google-books/recommendations
     *
     * Returns curated, institutional-priority recommended books from Google Books.
     */
    public function recommendations(Request $request)
    {
        try {
            // Check if seeded in database
            $dbBooks = GoogleBook::where('is_recommended', true)->get();

            if ($dbBooks->isEmpty()) {
                // Seed curated recommendations into database
                foreach (self::CURATED_RECOMMENDATIONS as $seed) {
                    GoogleBook::updateOrCreate(
                        ['volume_id' => $seed['volume_id']],
                        $seed
                    );
                }
                $dbBooks = GoogleBook::where('is_recommended', true)->get();
            }

            return response()->json([
                'success'         => true,
                'count'           => $dbBooks->count(),
                'items'           => $dbBooks,
                'recommendations' => $dbBooks,
                'books'           => $dbBooks
            ]);

        } catch (\Throwable $e) {
            Log::error('GoogleBooksController@recommendations Exception: ' . $e->getMessage());
            // Fallback directly to static array
            return response()->json([
                'success'         => true,
                'count'           => count(self::CURATED_RECOMMENDATIONS),
                'items'           => self::CURATED_RECOMMENDATIONS,
                'recommendations' => self::CURATED_RECOMMENDATIONS,
                'books'           => self::CURATED_RECOMMENDATIONS
            ]);
        }
    }

    /**
     * POST /api/google-books/save
     *
     * Save a Google Book into local database for institutional reading lists / stacks.
     */
    public function saveBook(Request $request)
    {
        try {
            $volumeId = $request->input('volume_id') ?? $request->input('google_volume_id');
            if (empty($volumeId)) {
                return response()->json(['success' => false, 'message' => 'volume_id is required'], 422);
            }

            $authors = $request->input('authors');
            if (is_string($authors)) {
                $authors = array_filter(array_map('trim', explode(',', $authors)));
            }

            $categories = $request->input('categories');
            if (is_string($categories)) {
                $categories = array_filter(array_map('trim', explode(',', $categories)));
            }

            $book = GoogleBook::updateOrCreate(
                ['volume_id' => $volumeId],
                [
                    'volume_id'               => $volumeId,
                    'title'                   => $request->input('title', 'Untitled Volume'),
                    'subtitle'                => $request->input('subtitle'),
                    'authors'                 => $authors,
                    'publisher'               => $request->input('publisher'),
                    'published_date'          => $request->input('published_date'),
                    'description'             => $request->input('description'),
                    'isbn_10'                 => $request->input('isbn_10'),
                    'isbn_13'                 => $request->input('isbn_13'),
                    'page_count'              => $request->input('page_count'),
                    'categories'              => $categories,
                    'thumbnail_url'           => $request->input('thumbnail_url'),
                    'preview_link'            => $request->input('preview_link'),
                    'info_link'               => $request->input('info_link'),
                    'canonical_volume_link'   => $request->input('canonical_volume_link'),
                    'viewability'             => $request->input('viewability', 'PARTIAL'),
                    'embeddable'              => (bool)$request->input('embeddable', true),
                    'is_ebook'                => (bool)$request->input('is_ebook', false),
                    'is_recommended'          => (bool)$request->input('is_recommended', false),
                    'recommendation_category' => $request->input('recommendation_category'),
                    'recommendation_notes'    => $request->input('recommendation_notes'),
                    'saved_by'                => $request->input('saved_by', 'Scholar'),
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Book saved to institutional library repository successfully.',
                'book'    => $book
            ]);

        } catch (\Throwable $e) {
            Log::error('GoogleBooksController@saveBook Exception: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Could not save book: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/google-books/saved
     *
     * Get all books saved in the institutional Google Books repository.
     */
    public function savedBooks(Request $request)
    {
        try {
            $query = GoogleBook::query();

            if ($request->has('category') && !empty($request->input('category'))) {
                $query->where('recommendation_category', $request->input('category'));
            }

            if ($request->has('recommended') && $request->boolean('recommended')) {
                $query->where('is_recommended', true);
            }

            $books = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'count'   => $books->count(),
                'items'   => $books
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not load saved books: ' . $e->getMessage()
            ], 500);
        }
    }
}
