<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SimpleLibBook;
use App\Models\SimpleLibAuthor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * SimpleLibApiController
 *
 * Implements REST API specification from BassemGhoniem/simpleLibAPI:
 * https://github.com/BassemGhoniem/simpleLibAPI.git
 *
 * Provides:
 * - Books CRUD + PATCH with Hypermedia Links (HATEOAS)
 * - Search by genre, title, author
 * - Recent books endpoint
 * - Authors CRUD + PATCH
 * - Seed dataset from booksjson.js
 * - Statistics and telemetry
 */
class SimpleLibApiController extends Controller
{
    /**
     * Initial seed books from BassemGhoniem/simpleLibAPI booksjson.js
     */
    private array $seedBooks = [
        [
            'title' => 'War and Peace',
            'genre' => 'Historical Fiction',
            'author' => 'Lev Nikolayevich Tolstoy',
            'rating' => 5.0,
            'cover_url' => 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80',
        ],
        [
            'title' => 'Les Misérables',
            'genre' => 'Historical Fiction',
            'author' => 'Victor Hugo',
            'rating' => 5.0,
            'cover_url' => 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&auto=format&fit=crop&q=80',
        ],
        [
            'title' => 'The Time Machine',
            'genre' => 'Science Fiction',
            'author' => 'H. G. Wells',
            'rating' => 4.5,
            'cover_url' => 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=300&auto=format&fit=crop&q=80',
        ],
        [
            'title' => 'A Journey into the Center of the Earth',
            'genre' => 'Science Fiction',
            'author' => 'Jules Verne',
            'rating' => 4.8,
            'cover_url' => 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&auto=format&fit=crop&q=80',
        ],
        [
            'title' => 'The Dark World',
            'genre' => 'Fantasy',
            'author' => 'Henry Kuttner',
            'rating' => 4.0,
            'cover_url' => 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=300&auto=format&fit=crop&q=80',
        ],
        [
            'title' => 'The Wind in the Willows',
            'genre' => 'Fantasy',
            'author' => 'Kenneth Grahame',
            'rating' => 4.9,
            'cover_url' => 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=300&auto=format&fit=crop&q=80',
        ],
        [
            'title' => 'Life On The Mississippi',
            'genre' => 'History',
            'author' => 'Mark Twain',
            'rating' => 4.3,
            'cover_url' => 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=300&auto=format&fit=crop&q=80',
        ],
        [
            'title' => 'Childhood',
            'genre' => 'Biography',
            'author' => 'Lev Nikolayevich Tolstoy',
            'rating' => 4.2,
            'cover_url' => 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=300&auto=format&fit=crop&q=80',
        ],
    ];

    private array $seedAuthors = [
        ['name' => 'Lev Nikolayevich Tolstoy', 'nationality' => 'Russian', 'rating' => 5.0],
        ['name' => 'Victor Hugo', 'nationality' => 'French', 'rating' => 5.0],
        ['name' => 'H. G. Wells', 'nationality' => 'British', 'rating' => 4.5],
        ['name' => 'Jules Verne', 'nationality' => 'French', 'rating' => 4.8],
        ['name' => 'Henry Kuttner', 'nationality' => 'American', 'rating' => 4.0],
        ['name' => 'Kenneth Grahame', 'nationality' => 'Scottish', 'rating' => 4.9],
        ['name' => 'Mark Twain', 'nationality' => 'American', 'rating' => 4.6],
    ];

    /**
     * Auto seed if database is empty
     */
    private function autoSeedIfEmpty(): void
    {
        if (SimpleLibBook::count() === 0) {
            foreach ($this->seedBooks as $b) {
                SimpleLibBook::firstOrCreate(['title' => $b['title']], $b);
            }
        }

        if (SimpleLibAuthor::count() === 0) {
            foreach ($this->seedAuthors as $a) {
                SimpleLibAuthor::firstOrCreate(['name' => $a['name']], $a);
            }
        }
    }

    /**
     * Attach hypermedia links as implemented in BassemGhoniem bookController.js
     */
    private function formatBook(SimpleLibBook $book, Request $request): array
    {
        $baseUrl = $request->getSchemeAndHttpHost() . '/api/simplelib';
        $genreEnc = urlencode($book->genre ?? '');
        $titleEnc = urlencode($book->title ?? '');
        $authorEnc = urlencode($book->author ?? '');

        return [
            '_id' => (string) $book->id,
            'id' => $book->id,
            'title' => $book->title,
            'author' => $book->author,
            'genre' => $book->genre,
            'rating' => (float) $book->rating,
            'cover_url' => $book->cover_url,
            'createdAt' => $book->created_at?->toIso8601String(),
            'updatedAt' => $book->updated_at?->toIso8601String(),
            'links' => [
                'self' => "{$baseUrl}/books/{$book->id}",
                'searchByThisGenre' => "{$baseUrl}/books?genre={$genreEnc}",
                'searchByName' => "{$baseUrl}/books?title={$titleEnc}",
                'searchByAuthor' => "{$baseUrl}/books?author={$authorEnc}",
            ]
        ];
    }

    /**
     * GET /api/simplelib/books
     * Filters by genre, title, author, or search query
     */
    public function index(Request $request)
    {
        $this->autoSeedIfEmpty();

        $query = SimpleLibBook::query();

        if ($genre = $request->input('genre')) {
            $query->where('genre', 'like', "%{$genre}%");
        }

        if ($title = $request->input('title')) {
            $query->where('title', 'like', "%{$title}%");
        }

        if ($author = $request->input('author')) {
            $query->where('author', 'like', "%{$author}%");
        }

        // General search term
        if ($q = $request->input('q', $request->input('search'))) {
            $query->where(function ($b) use ($q) {
                $b->where('title', 'like', "%{$q}%")
                  ->orWhere('author', 'like', "%{$q}%")
                  ->orWhere('genre', 'like', "%{$q}%");
            });
        }

        if ($minRating = $request->input('min_rating')) {
            $query->where('rating', '>=', (float) $minRating);
        }

        $books = $query->orderBy('rating', 'desc')->get();

        $formatted = $books->map(fn ($b) => $this->formatBook($b, $request));

        return response()->json($formatted);
    }

    /**
     * GET /api/simplelib/books/recent
     */
    public function recent(Request $request)
    {
        $this->autoSeedIfEmpty();

        $books = SimpleLibBook::orderBy('created_at', 'desc')->take(5)->get();
        return response()->json($books->map(fn ($b) => $this->formatBook($b, $request)));
    }

    /**
     * GET /api/simplelib/books/{id}
     */
    public function show(Request $request, $id)
    {
        $this->autoSeedIfEmpty();

        $book = SimpleLibBook::find($id);
        if (!$book) {
            return response()->json(['message' => 'no book found'], 404);
        }

        return response()->json($this->formatBook($book, $request));
    }

    /**
     * POST /api/simplelib/books
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255|unique:simple_lib_books,title',
            'author' => 'nullable|string|max:255',
            'genre' => 'nullable|string|max:100',
            'rating' => 'nullable|numeric|min:1|max:5',
            'cover_url' => 'nullable|string|max:500',
        ]);

        $book = SimpleLibBook::create([
            'title' => $validated['title'],
            'author' => $validated['author'] ?? 'Unknown Author',
            'genre' => $validated['genre'] ?? 'General',
            'rating' => $validated['rating'] ?? 1.0,
            'cover_url' => $validated['cover_url'] ?? null,
        ]);

        return response()->json($this->formatBook($book, $request), 201);
    }

    /**
     * PUT /api/simplelib/books/{id}
     */
    public function update(Request $request, $id)
    {
        $book = SimpleLibBook::find($id);
        if (!$book) {
            return response()->json(['message' => 'no book found'], 404);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255|unique:simple_lib_books,title,' . $id,
            'author' => 'nullable|string|max:255',
            'genre' => 'nullable|string|max:100',
            'rating' => 'nullable|numeric|min:1|max:5',
            'cover_url' => 'nullable|string|max:500',
        ]);

        $book->update($validated);

        return response()->json($this->formatBook($book, $request));
    }

    /**
     * PATCH /api/simplelib/books/{id}
     * Supports updating specific fields (e.g. rating, genre)
     */
    public function patch(Request $request, $id)
    {
        $book = SimpleLibBook::find($id);
        if (!$book) {
            return response()->json(['message' => 'no book found'], 404);
        }

        $data = $request->only(['title', 'author', 'genre', 'rating', 'cover_url']);

        if (isset($data['rating'])) {
            $data['rating'] = max(1, min(5, (float) $data['rating']));
        }

        $book->update($data);

        return response()->json($this->formatBook($book, $request));
    }

    /**
     * DELETE /api/simplelib/books/{id}
     */
    public function destroy($id)
    {
        $book = SimpleLibBook::find($id);
        if (!$book) {
            return response()->json(['message' => 'no book found'], 404);
        }

        $book->delete();
        return response()->json(['message' => 'Book removed successfully'], 200);
    }

    /**
     * DELETE /api/simplelib/books
     */
    public function destroyAll()
    {
        SimpleLibBook::truncate();
        return response()->json(['message' => 'Removed All'], 200);
    }

    // =========================================================================
    // AUTHORS ENDPOINTS
    // =========================================================================

    /**
     * GET /api/simplelib/authors
     */
    public function authorsIndex(Request $request)
    {
        $this->autoSeedIfEmpty();

        $query = SimpleLibAuthor::query();

        if ($name = $request->input('name')) {
            $query->where('name', 'like', "%{$name}%");
        }

        if ($nationality = $request->input('nationality')) {
            $query->where('nationality', 'like', "%{$nationality}%");
        }

        return response()->json($query->orderBy('name')->get());
    }

    /**
     * GET /api/simplelib/authors/{id}
     */
    public function authorShow($id)
    {
        $author = SimpleLibAuthor::find($id);
        if (!$author) {
            return response()->json(['message' => 'no author found'], 404);
        }

        return response()->json($author);
    }

    /**
     * POST /api/simplelib/authors
     */
    public function authorStore(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:simple_lib_authors,name',
            'nationality' => 'nullable|string|max:100',
            'rating' => 'nullable|numeric|min:1|max:5',
        ]);

        $author = SimpleLibAuthor::create($validated);
        return response()->json($author, 201);
    }

    /**
     * PUT /api/simplelib/authors/{id}
     */
    public function authorUpdate(Request $request, $id)
    {
        $author = SimpleLibAuthor::find($id);
        if (!$author) {
            return response()->json(['message' => 'no author found'], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:simple_lib_authors,name,' . $id,
            'nationality' => 'nullable|string|max:100',
            'rating' => 'nullable|numeric|min:1|max:5',
        ]);

        $author->update($validated);
        return response()->json($author);
    }

    /**
     * PATCH /api/simplelib/authors/{id}
     */
    public function authorPatch(Request $request, $id)
    {
        $author = SimpleLibAuthor::find($id);
        if (!$author) {
            return response()->json(['message' => 'no author found'], 404);
        }

        $data = $request->only(['name', 'nationality', 'rating']);
        if (isset($data['rating'])) {
            $data['rating'] = max(1, min(5, (float) $data['rating']));
        }

        $author->update($data);
        return response()->json($author);
    }

    /**
     * DELETE /api/simplelib/authors/{id}
     */
    public function authorDestroy($id)
    {
        $author = SimpleLibAuthor::find($id);
        if (!$author) {
            return response()->json(['message' => 'no author found'], 404);
        }

        $author->delete();
        return response()->json(['message' => 'Author removed successfully'], 200);
    }

    // =========================================================================
    // STATS & SEEDING & USER SIMULATION
    // =========================================================================

    /**
     * GET /api/simplelib/stats
     */
    public function stats()
    {
        $this->autoSeedIfEmpty();

        $booksCount = SimpleLibBook::count();
        $authorsCount = SimpleLibAuthor::count();
        $avgRating = round((float) SimpleLibBook::avg('rating'), 2);
        $genres = SimpleLibBook::select('genre', DB::raw('count(*) as total'))
            ->groupBy('genre')
            ->get();

        return response()->json([
            'api' => 'SimpleLib REST API',
            'version' => '1.0.0',
            'upstream' => 'https://github.com/BassemGhoniem/simpleLibAPI.git',
            'author' => 'Bassem Ghoniem',
            'status' => 'Online',
            'metrics' => [
                'total_books' => $booksCount,
                'total_authors' => $authorsCount,
                'average_rating' => $avgRating,
                'genres_breakdown' => $genres,
            ],
            'endpoints' => [
                'books' => '/api/simplelib/books',
                'recent' => '/api/simplelib/books/recent',
                'authors' => '/api/simplelib/authors',
                'stats' => '/api/simplelib/stats',
                'seed' => '/api/simplelib/seed',
            ]
        ]);
    }

    /**
     * POST /api/simplelib/seed
     */
    public function seed()
    {
        foreach ($this->seedBooks as $b) {
            SimpleLibBook::updateOrCreate(['title' => $b['title']], $b);
        }

        foreach ($this->seedAuthors as $a) {
            SimpleLibAuthor::updateOrCreate(['name' => $a['name']], $a);
        }

        return response()->json([
            'success' => true,
            'message' => 'SimpleLib database seeded successfully with booksjson.js dataset.',
            'books_count' => SimpleLibBook::count(),
            'authors_count' => SimpleLibAuthor::count(),
        ]);
    }

    /**
     * POST /api/simplelib/users/register
     */
    public function register(Request $request)
    {
        return response()->json([
            'status' => 'Registration Successful',
            'username' => $request->input('username', 'scholar_patron'),
            'admin' => $request->boolean('admin', false),
            'message' => 'SimpleLib passport verification passed'
        ]);
    }

    /**
     * POST /api/simplelib/users/login
     */
    public function login(Request $request)
    {
        return response()->json([
            'status' => 'Login Successful',
            'token' => 'simplelib_jwt_' . Str::random(32),
            'username' => $request->input('username', 'librarian'),
            'admin' => true,
        ]);
    }

    /**
     * GET /api/simplelib/users
     */
    public function users()
    {
        return response()->json([
            [
                'username' => 'admin_bassem',
                'admin' => true,
                'createdAt' => '2016-10-20T00:00:00.000Z'
            ],
            [
                'username' => 'fcc_librarian',
                'admin' => true,
                'createdAt' => '2026-10-07T12:00:00.000Z'
            ]
        ]);
    }
}
