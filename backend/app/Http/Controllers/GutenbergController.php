<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

use Illuminate\Support\Facades\Cache;

/**
 * GutenbergController
 *
 * Proxy controller for the Gutendex JSON API (https://gutendex.com).
 * All frontend requests route through this backend to:
 *   - Avoid browser CORS restrictions
 *   - Centralise external API traffic
 *   - Enable caching / rate-limit protection
 *
 * Gutendex API Docs: https://gutendex.com/
 */
class GutenbergController extends Controller
{
    private const BASE_URL = 'https://gutendex.com';

    /**
     * GET /api/gutenberg/books
     */
    public function books(Request $request)
    {
        $allowedParams = [
            'search', 'topic', 'languages', 'copyright',
            'author_year_start', 'author_year_end',
            'ids', 'mime_type', 'sort', 'page',
        ];

        $params = array_filter(
            $request->only($allowedParams),
            fn ($v) => $v !== null && $v !== ''
        );

        if (isset($params['sort']) && !in_array($params['sort'], ['popular', 'ascending', 'descending'])) {
            unset($params['sort']);
        }

        $cacheKey = 'gutendex:books:' . md5(json_encode($params));

        if ($cached = Cache::get($cacheKey)) {
            return response()->json($cached);
        }

        try {
            $response = Http::connectTimeout(5)
                ->timeout(10)
                ->withHeaders([
                    'Accept' => 'application/json',
                    'User-Agent' => 'FCC-SmartLibrary/1.0 (https://fcclibrary.edu.ng)',
                ])
                ->get(self::BASE_URL . '/books', $params);

            if ($response->successful()) {
                $data = $response->json();
                if (!empty($data['results'])) {
                    Cache::put($cacheKey, $data, now()->addMinutes(30));
                }
                return response()->json($data);
            }

            Log::warning('Gutendex /books request non-200', [
                'status' => $response->status(),
                'params' => $params,
            ]);

            return response()->json(['count' => 0, 'results' => []]);
        } catch (\Throwable $e) {
            Log::info('GutenbergController@books timeout/offline: ' . $e->getMessage());
            return response()->json(['count' => 0, 'results' => []]);
        }
    }

    /**
     * GET /api/gutenberg/books/{id}
     *
     * Proxies the Gutendex /books/<id> endpoint for individual book metadata.
     */
    public function book(int $id)
    {
        $cacheKey = 'gutendex:book:' . $id;
        if ($cached = Cache::get($cacheKey)) {
            return response()->json($cached);
        }

        try {
            $response = Http::connectTimeout(5)
                ->timeout(12)
                ->withHeaders([
                    'Accept' => 'application/json',
                    'User-Agent' => 'FCC-SmartLibrary/1.0 (https://fcclibrary.edu.ng)',
                ])
                ->get(self::BASE_URL . "/books/{$id}");

            if ($response->failed()) {
                return response()->json(
                    ['error' => "Book #{$id} not found on Gutendex.", 'detail' => $response->json('detail')],
                    $response->status()
                );
            }

            $data = $response->json();
            Cache::put($cacheKey, $data, now()->addHours(6));
            return response()->json($data);
        } catch (\Throwable $e) {
            Log::error('GutenbergController@book exception', ['id' => $id, 'message' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to contact Gutendex API.'], 503);
        }
    }
}
