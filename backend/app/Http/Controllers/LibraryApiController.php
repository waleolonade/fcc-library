<?php

namespace App\Http\Controllers;

use App\Models\LibraryApi;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Carbon\Carbon;

class LibraryApiController extends Controller
{
    public function index()
    {
        $apis = LibraryApi::orderBy('is_preset', 'desc')
            ->orderBy('name', 'asc')
            ->get();
        return response()->json($apis);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'endpoint_template' => 'required|string',
            'provider' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:100',
            'auth_type' => 'nullable|string|max:50',
            'api_key' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'docs_url' => 'nullable|string|max:500'
        ]);

        $slug = strtoupper(Str::slug(substr($validated['name'], 0, 15)));
        $id = 'API-' . $slug . '-' . rand(100, 999);

        $api = LibraryApi::create([
            'id' => $id,
            'name' => $validated['name'],
            'provider' => $validated['provider'] ?? 'Independent Library Provider',
            'category' => $validated['category'] ?? 'Academic & Books',
            'endpoint_template' => $validated['endpoint_template'],
            'auth_type' => $validated['auth_type'] ?? 'Free Open Access',
            'api_key' => $validated['api_key'] ?? null,
            'description' => $validated['description'] ?? 'Custom external library API registered by FCC Chief Librarian.',
            'docs_url' => $validated['docs_url'] ?? null,
            'status' => 'Active',
            'is_preset' => false,
        ]);

        AuditLog::create([
            'id' => 'AUD-' . rand(10000, 99999),
            'action' => 'ADD_LIBRARY_API',
            'details' => "Registered new external library API: {$api->name} ({$api->endpoint_template})",
            'user' => 'Admin Librarian',
            'timestamp' => Carbon::now()->toIso8601String()
        ]);

        return response()->json([
            'success' => true,
            'message' => "Library API '{$api->name}' successfully registered and integrated!",
            'api' => $api
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $api = LibraryApi::findOrFail($id);

        $api->update($request->only([
            'name', 'provider', 'category', 'endpoint_template',
            'auth_type', 'api_key', 'description', 'docs_url', 'status'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Library API configuration updated.',
            'api' => $api
        ]);
    }

    public function destroy($id)
    {
        $api = LibraryApi::findOrFail($id);
        $name = $api->name;
        $api->delete();

        AuditLog::create([
            'id' => 'AUD-' . rand(10000, 99999),
            'action' => 'REMOVE_LIBRARY_API',
            'details' => "Deleted external library API: {$name} ({$id})",
            'user' => 'Admin Librarian',
            'timestamp' => Carbon::now()->toIso8601String()
        ]);

        return response()->json([
            'success' => true,
            'message' => "Library API '{$name}' removed."
        ]);
    }

    public function test(Request $request, $id)
    {
        $api = LibraryApi::findOrFail($id);
        $testQuery = urlencode($request->query('query', 'cooperative'));

        $url = str_replace('{query}', $testQuery, $api->endpoint_template);
        if (str_contains($url, '{isbn}')) {
            $url = str_replace('{isbn}', '9780134494166', $url);
        }

        $headers = [
            'User-Agent' => 'FCC-Ibadan-SmartLibrary/4.8.0 (Academic Higher Ed; mailto:librarian@fccibadan.edu.ng)'
        ];

        if ($api->api_key && $api->auth_type === 'Bearer Token') {
            $headers['Authorization'] = 'Bearer ' . $api->api_key;
        }

        $start = microtime(true);
        try {
            $response = Http::withHeaders($headers)
                ->timeout(8)
                ->get($url);

            $latencyMs = round((microtime(true) - $start) * 1000);

            if ($response->successful()) {
                $data = $response->json();
                $sampleCount = 0;
                if (is_array($data)) {
                    if (isset($data['docs'])) $sampleCount = count($data['docs']);
                    elseif (isset($data['items'])) $sampleCount = count($data['items']);
                    elseif (isset($data['results'])) $sampleCount = count($data['results']);
                    elseif (isset($data['message']['items'])) $sampleCount = count($data['message']['items']);
                    else $sampleCount = count($data);
                }

                return response()->json([
                    'status' => 'Online',
                    'httpCode' => $response->status(),
                    'latencyMs' => $latencyMs,
                    'testedUrl' => $url,
                    'itemsDiscovered' => $sampleCount,
                    'message' => "Connection Verified: {$api->name} responded in {$latencyMs}ms with {$sampleCount} records."
                ]);
            }

            return response()->json([
                'status' => 'Error',
                'httpCode' => $response->status(),
                'latencyMs' => $latencyMs,
                'testedUrl' => $url,
                'message' => "Server responded with HTTP {$response->status()}"
            ], 400);
        } catch (\Exception $e) {
            $latencyMs = round((microtime(true) - $start) * 1000);
            return response()->json([
                'status' => 'Offline / Network Failure',
                'latencyMs' => $latencyMs,
                'testedUrl' => $url,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function searchFederated(Request $request)
    {
        $rawQuery = trim($request->query('query', 'economics'));
        if (!$rawQuery) {
            return response()->json([]);
        }

        $query = urlencode($rawQuery);
        $targetApiId = $request->query('api_id');

        $apisQuery = LibraryApi::where('status', 'Active');
        if ($targetApiId && $targetApiId !== 'all') {
            $apisQuery->where('id', $targetApiId);
        }
        $apis = $apisQuery->get();

        $results = [];

        foreach ($apis as $api) {
            try {
                $url = str_replace('{query}', $query, $api->endpoint_template);
                if (str_contains($url, '{isbn}')) {
                    $url = str_replace('{isbn}', $rawQuery, $url);
                }

                $headers = [
                    'User-Agent' => 'FCC-Ibadan-SmartLibrary/4.8.0 (Academic; mailto:librarian@fccibadan.edu.ng)'
                ];
                if ($api->api_key && $api->auth_type === 'Bearer Token') {
                    $headers['Authorization'] = 'Bearer ' . $api->api_key;
                }

                $response = Http::withHeaders($headers)
                    ->timeout(6)
                    ->get($url);

                if ($response->successful()) {
                    $json = $response->json();
                    $parsed = $this->normalizeApiResponse($api, $json);
                    $results = array_merge($results, $parsed);
                }
            } catch (\Exception $e) {
                // Continue to next API resilience
            }
        }

        return response()->json($results);
    }

    private function normalizeApiResponse(LibraryApi $api, $data): array
    {
        $normalized = [];

        // 1. Open Library
        if ($api->id === 'API-OPENLIB' && isset($data['docs'])) {
            foreach (array_slice($data['docs'], 0, 6) as $doc) {
                $isbn = isset($doc['isbn'][0]) ? $doc['isbn'][0] : null;
                $coverUrl = isset($doc['cover_i']) ? "https://covers.openlibrary.org/b/id/{$doc['cover_i']}-M.jpg" : null;
                $author = isset($doc['author_name'][0]) ? $doc['author_name'][0] : 'Open Library Contributor';

                $normalized[] = [
                    'id' => 'EXT-OL-' . ($doc['key'] ? str_replace('/works/', '', $doc['key']) : rand(1000, 9999)),
                    'title' => $doc['title'] ?? 'Untitled Monograph',
                    'author' => $author,
                    'year' => $doc['first_publish_year'] ?? ($doc['publish_year'][0] ?? (int) date('Y')),
                    'isbn' => $isbn,
                    'coverUrl' => $coverUrl,
                    'publisher' => $doc['publisher'][0] ?? 'Open Library Archive',
                    'sourceApi' => $api->name,
                    'sourceId' => $api->id,
                    'externalUrl' => isset($doc['key']) ? "https://openlibrary.org{$doc['key']}" : null,
                    'subject' => isset($doc['subject'][0]) ? $doc['subject'][0] : 'General Collection',
                    'isDigital' => true,
                    'format' => 'Digital E-Book'
                ];
            }
        }
        // 2. Google Books
        elseif ($api->id === 'API-GOOGLEBOOKS' && isset($data['items'])) {
            foreach (array_slice($data['items'], 0, 6) as $item) {
                $vol = $item['volumeInfo'] ?? [];
                $authors = isset($vol['authors']) ? implode(', ', $vol['authors']) : 'Unknown Author';
                $isbn = null;
                if (isset($vol['industryIdentifiers'])) {
                    foreach ($vol['industryIdentifiers'] as $id) {
                        if ($id['type'] === 'ISBN_13' || $id['type'] === 'ISBN_10') {
                            $isbn = $id['identifier'];
                            break;
                        }
                    }
                }
                $coverUrl = $vol['imageLinks']['thumbnail'] ?? ($vol['imageLinks']['smallThumbnail'] ?? null);

                $normalized[] = [
                    'id' => 'EXT-GB-' . ($item['id'] ?? rand(1000, 9999)),
                    'title' => $vol['title'] ?? 'Google Books Record',
                    'author' => $authors,
                    'year' => isset($vol['publishedDate']) ? (int) substr($vol['publishedDate'], 0, 4) : (int) date('Y'),
                    'isbn' => $isbn,
                    'coverUrl' => $coverUrl,
                    'publisher' => $vol['publisher'] ?? 'Google Books Partner',
                    'abstract' => $vol['description'] ?? null,
                    'sourceApi' => $api->name,
                    'sourceId' => $api->id,
                    'externalUrl' => $vol['infoLink'] ?? null,
                    'subject' => isset($vol['categories'][0]) ? $vol['categories'][0] : 'Curriculum Resources',
                    'isDigital' => true,
                    'format' => 'E-Book / Preview'
                ];
            }
        }
        // 3. Crossref
        elseif ($api->id === 'API-CROSSREF' && isset($data['message']['items'])) {
            foreach (array_slice($data['message']['items'], 0, 6) as $work) {
                $authorStr = 'Scholarly Researcher';
                if (isset($work['author'][0])) {
                    $first = $work['author'][0]['given'] ?? '';
                    $last = $work['author'][0]['family'] ?? '';
                    $authorStr = trim("{$first} {$last}") ?: 'Scholarly Researcher';
                }

                $year = $work['issued']['date-parts'][0][0] ?? ($work['created']['date-parts'][0][0] ?? (int) date('Y'));

                $normalized[] = [
                    'id' => 'EXT-CR-' . rand(1000, 9999),
                    'title' => $work['title'][0] ?? 'Scholarly Research Paper',
                    'author' => $authorStr,
                    'doi' => $work['DOI'] ?? null,
                    'year' => (int) $year,
                    'publisher' => $work['publisher'] ?? 'Crossref Registered Publisher',
                    'sourceApi' => $api->name,
                    'sourceId' => $api->id,
                    'externalUrl' => $work['URL'] ?? ($work['DOI'] ? "https://doi.org/{$work['DOI']}" : null),
                    'subject' => isset($work['subject'][0]) ? $work['subject'][0] : 'Peer-Reviewed Research',
                    'citations' => $work['is-referenced-by-count'] ?? 0,
                    'isDigital' => true,
                    'format' => 'Peer-Reviewed Journal'
                ];
            }
        }
        // 4. Project Gutenberg (Gutendex)
        elseif ($api->id === 'API-GUTENDEX' && isset($data['results'])) {
            foreach (array_slice($data['results'], 0, 6) as $book) {
                $author = isset($book['authors'][0]['name']) ? $book['authors'][0]['name'] : 'Classic Author';
                $coverUrl = $book['formats']['image/jpeg'] ?? null;
                $readUrl = $book['formats']['text/html'] ?? ($book['formats']['application/epub+zip'] ?? null);

                $normalized[] = [
                    'id' => 'EXT-PG-' . ($book['id'] ?? rand(1000, 9999)),
                    'title' => $book['title'] ?? 'Classic Literature',
                    'author' => $author,
                    'year' => 1900,
                    'coverUrl' => $coverUrl,
                    'publisher' => 'Project Gutenberg Literary Archive',
                    'sourceApi' => $api->name,
                    'sourceId' => $api->id,
                    'externalUrl' => $readUrl,
                    'subject' => isset($book['subjects'][0]) ? $book['subjects'][0] : 'Public Domain Classic',
                    'isDigital' => true,
                    'format' => 'Full-Text Classic E-Book'
                ];
            }
        }
        // 5. OpenAlex
        elseif ($api->id === 'API-OPENALEX' && isset($data['results'])) {
            foreach (array_slice($data['results'], 0, 6) as $work) {
                $author = 'OpenAlex Scholar';
                if (isset($work['authorships'][0]['author']['display_name'])) {
                    $author = $work['authorships'][0]['author']['display_name'];
                }

                $normalized[] = [
                    'id' => 'EXT-OA-' . rand(1000, 9999),
                    'title' => $work['display_name'] ?? ($work['title'] ?? 'Scientific Work'),
                    'author' => $author,
                    'doi' => $work['doi'] ?? null,
                    'year' => $work['publication_year'] ?? (int) date('Y'),
                    'publisher' => $work['host_venue']['publisher'] ?? 'OpenAlex Repository',
                    'sourceApi' => $api->name,
                    'sourceId' => $api->id,
                    'externalUrl' => $work['doi'] ?? ($work['id'] ?? null),
                    'citations' => $work['cited_by_count'] ?? 0,
                    'subject' => isset($work['concepts'][0]['display_name']) ? $work['concepts'][0]['display_name'] : 'Academic Literature',
                    'isDigital' => true,
                    'format' => 'Scientific Work'
                ];
            }
        }
        // 6. Generic Custom / User-Added API
        elseif (is_array($data)) {
            $items = isset($data['items']) ? $data['items'] : (isset($data['results']) ? $data['results'] : (isset($data['data']) ? $data['data'] : $data));
            if (is_array($items)) {
                foreach (array_slice($items, 0, 6) as $idx => $entry) {
                    if (is_array($entry)) {
                        $normalized[] = [
                            'id' => 'EXT-CUSTOM-' . ($entry['id'] ?? rand(1000, 9999)),
                            'title' => $entry['title'] ?? ($entry['name'] ?? 'Catalogue Item #' . ($idx + 1)),
                            'author' => $entry['author'] ?? ($entry['creator'] ?? 'External Contributor'),
                            'year' => $entry['year'] ?? ($entry['date'] ?? (int) date('Y')),
                            'isbn' => $entry['isbn'] ?? null,
                            'publisher' => $entry['publisher'] ?? $api->provider,
                            'sourceApi' => $api->name,
                            'sourceId' => $api->id,
                            'externalUrl' => $entry['url'] ?? ($entry['link'] ?? null),
                            'subject' => $entry['subject'] ?? $api->category,
                            'isDigital' => true,
                            'format' => 'External Holding'
                        ];
                    }
                }
            }
        }

        return $normalized;
    }
}
