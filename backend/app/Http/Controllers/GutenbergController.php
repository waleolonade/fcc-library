<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * GutenbergController
 *
 * Proxy controller for the Gutendex JSON API (https://gutendex.com).
 * All frontend requests route through this backend to:
 *   - Avoid browser CORS restrictions
 *   - Centralise external API traffic
 *   - Enable future caching / rate-limit protection
 *
 * Gutendex API Docs: https://gutendex.com/
 */
class GutenbergController extends Controller
{
    private const BASE_URL = 'https://gutendex.com';

    /**
     * GET /api/gutenberg/books
     *
     * Proxies the Gutendex /books endpoint.
     * Supported query parameters (all optional):
     *   - search           : Search in author names and book titles
     *   - topic            : Bookshelf / subject key-phrase search
     *   - languages        : Comma-separated 2-char language codes  (e.g. en,fr)
     *   - copyright        : true | false | null  (comma-separated)
     *   - author_year_start: Filter by author alive after this year
     *   - author_year_end  : Filter by author alive before this year
     *   - ids              : Comma-separated Project Gutenberg IDs
     *   - mime_type        : MIME-type prefix (e.g. text/html)
     *   - sort             : popular | ascending | descending
     *   - page             : Page number for pagination
     */
    public function books(Request $request)
    {
        try {
            $allowedParams = [
                'search', 'topic', 'languages', 'copyright',
                'author_year_start', 'author_year_end',
                'ids', 'mime_type', 'sort', 'page',
            ];

            $params = $request->only($allowedParams);

            $response = Http::timeout(15)
                ->withHeaders(['Accept' => 'application/json'])
                ->get(self::BASE_URL . '/books', $params);

            if ($response->failed()) {
                Log::warning('Gutendex /books request failed', [
                    'status' => $response->status(),
                    'params' => $params,
                ]);
                return response()->json(
                    ['error' => 'Gutendex API returned an error.', 'status' => $response->status()],
                    $response->status()
                );
            }

            return response()->json($response->json());
        } catch (\Exception $e) {
            Log::error('GutenbergController@books exception', ['message' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to contact Gutendex API.'], 503);
        }
    }

    /**
     * GET /api/gutenberg/books/{id}
     *
     * Proxies the Gutendex /books/<id> endpoint for individual book metadata.
     */
    public function book(int $id)
    {
        try {
            $response = Http::timeout(15)
                ->withHeaders(['Accept' => 'application/json'])
                ->get(self::BASE_URL . "/books/{$id}");

            if ($response->failed()) {
                return response()->json(
                    ['error' => "Book #{$id} not found on Gutendex.", 'detail' => $response->json('detail')],
                    $response->status()
                );
            }

            return response()->json($response->json());
        } catch (\Exception $e) {
            Log::error('GutenbergController@book exception', ['id' => $id, 'message' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to contact Gutendex API.'], 503);
        }
    }
}
