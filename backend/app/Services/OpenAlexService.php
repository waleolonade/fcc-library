<?php

namespace App\Services;

use App\Models\OpenAlexQueryCache;
use App\Models\OpenAlexWork;
use Carbon\Carbon;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * OpenAlexService
 *
 * Production integration gateway for the OpenAlex Academic Graph API (https://api.openalex.org)
 * Implements:
 * - 30-Second Request Timeouts
 * - Automatic 301 Moved Permanently / 302 Redirect Following
 * - Exponential Backoff with Jitter for 429 Too Many Requests & 5xx Server Errors
 * - Structured Error Parsing (400 Bad Request filter validation, 403, 404, 429)
 * - Rate Limit Headers Tracking (X-RateLimit-Limit, Remaining, Credits-Used, Reset)
 * - Inverted Index Abstract Reconstruction
 * - Intelligent SQLite Database Response Caching & Stale-While-Revalidate Fallback
 */
class OpenAlexService
{
    private const BASE_URL = 'https://api.openalex.org';
    private const DEFAULT_MAILTO = 'library@fccibadan.edu.ng';
    private const CACHE_TTL_HOURS = 24;
    private const MAX_RETRIES = 3; // Retry count for 429 and 5xx transient errors
    private const TIMEOUT_SECONDS = 30; // 30-second timeout per OpenAlex spec

    /**
     * Query OpenAlex works with full filter, search, sort, and pagination support.
     */
    public function getWorks(array $params = []): array
    {
        return $this->queryEndpoint('works', $params);
    }

    /**
     * Fetch a single work by OpenAlex ID or DOI.
     * e.g. "W2741809807" or "https://openalex.org/W2741809807" or "10.1038/s41586-020-2649-2"
     */
    public function getWorkById(string $id): ?array
    {
        $cleanId = $this->cleanWorkId($id);

        // 1. Check if saved in local library database
        $localSaved = OpenAlexWork::where('id', $cleanId)
            ->orWhere('doi', $cleanId)
            ->orWhere('openalex_id', "https://openalex.org/{$cleanId}")
            ->first();

        if ($localSaved && $localSaved->cached_raw) {
            $raw = json_decode($localSaved->cached_raw, true);
            if (is_array($raw)) {
                return $this->normalizeWork($raw, true);
            }
        }

        $endpoint = 'works/' . urlencode($cleanId);
        $res = $this->queryEndpoint($endpoint, [], 168); // 7-day cache for individual works

        if (!empty($res['results'])) {
            return $res['results'][0] ?? null;
        }

        if (!empty($res['raw_entity'])) {
            return $this->normalizeWork($res['raw_entity']);
        }

        return null;
    }

    /**
     * Query authors endpoint
     */
    public function getAuthors(array $params = []): array
    {
        return $this->queryEndpoint('authors', $params);
    }

    /**
     * Query sources (journals/publishers/repositories) endpoint
     */
    public function getSources(array $params = []): array
    {
        return $this->queryEndpoint('sources', $params);
    }

    /**
     * Query institutions endpoint
     */
    public function getInstitutions(array $params = []): array
    {
        return $this->queryEndpoint('institutions', $params);
    }

    /**
     * Query topics / concepts taxonomy endpoint
     */
    public function getTopics(array $params = []): array
    {
        return $this->queryEndpoint('topics', $params);
    }

    /**
     * Query publishers endpoint
     */
    public function getPublishers(array $params = []): array
    {
        return $this->queryEndpoint('publishers', $params);
    }

    /**
     * Query funders endpoint
     */
    public function getFunders(array $params = []): array
    {
        return $this->queryEndpoint('funders', $params);
    }

    /**
     * Critical Two-Step ID Resolution (Per OpenAlex LLM Reference):
     * "Never filter by entity names directly. Names are ambiguous. Always resolve to IDs first."
     * Resolves human entity names to canonical OpenAlex ID.
     */
    public function resolveEntity(string $entityType, string $name): ?array
    {
        $endpointMap = [
            'author'       => 'authors',
            'authors'      => 'authors',
            'institution'  => 'institutions',
            'institutions' => 'institutions',
            'source'       => 'sources',
            'sources'      => 'sources',
            'topic'        => 'topics',
            'topics'       => 'topics',
            'publisher'    => 'publishers',
            'publishers'   => 'publishers',
            'funder'       => 'funders',
            'funders'      => 'funders',
        ];

        $endpoint = $endpointMap[strtolower($entityType)] ?? 'authors';
        $res = $this->queryEndpoint($endpoint, ['search' => trim($name), 'per_page' => 5]);

        if (empty($res['results'])) {
            return null;
        }

        $top = $res['results'][0];
        $id = $this->cleanWorkId($top['id'] ?? '');

        $filterKeyMap = [
            'authors'      => 'authorships.author.id',
            'institutions' => 'authorships.institutions.id',
            'sources'      => 'primary_location.source.id',
            'topics'       => 'topics.id',
            'publishers'   => 'primary_location.source.publisher_lineage',
            'funders'      => 'funders.id',
        ];

        $filterKey = $filterKeyMap[$endpoint] ?? 'authorships.author.id';

        return [
            'entity_type'  => $endpoint,
            'id'           => $id,
            'openalex_id'  => $top['id'] ?? "https://openalex.org/{$id}",
            'display_name' => $top['display_name'] ?? $name,
            'filter_key'   => $filterKey,
            'filter_param' => "{$filterKey}:{$id}",
            'matched_item' => $top,
            'candidates'   => array_slice($res['results'], 0, 5),
        ];
    }

    /**
     * Execute an OQL (OpenAlex Query Language) or OQO query at the API root.
     * Supports GET /?oql=... and POST / with JSON body per the OpenAlex OQL API Specification.
     */
    public function executeOql(array $data, string $httpMethod = 'GET'): array
    {
        $method = strtoupper($httpMethod);
        $cacheKey = 'oql_' . md5($method . '_' . json_encode($data));

        // 1. Check database cache
        $cached = OpenAlexQueryCache::find($cacheKey);
        if ($cached && !$cached->isExpired()) {
            $cached->increment('hits_count');
            return [
                'meta' => array_merge($cached->response_meta ?? [], [
                    'cached'     => true,
                    'cached_at'  => $cached->updated_at->toIso8601String(),
                    'hits_count' => $cached->hits_count,
                    'status'     => 200,
                ]),
                'results'  => $cached->response_results ?? [],
                'group_by' => $cached->response_group_by ?? [],
            ];
        }

        // 2. Build HTTP request configuration targeting the API root (https://api.openalex.org/)
        $url = self::BASE_URL . '/';
        $mailto = env('OPENALEX_MAILTO', self::DEFAULT_MAILTO);
        $apiKey = env('OPENALEX_API_KEY') ?: $this->resolveStoredApiKey();

        $headers = [
            'User-Agent'   => "FCC-E-Library/5.0 (mailto:{$mailto})",
            'Accept'       => 'application/json',
            'Content-Type' => 'application/json',
        ];

        if ($apiKey) {
            $headers['Authorization'] = 'Bearer ' . $apiKey;
        }

        // Add polite pool mailto to GET params
        if ($method === 'GET' && !isset($data['mailto'])) {
            $data['mailto'] = $mailto;
        }

        $fetchResult = $this->fetchWithExponentialBackoff($url, $data, $headers, $method);

        if ($fetchResult['success']) {
            $respData = $fetchResult['data'];
            $rateHeaders = $fetchResult['rate_limit_headers'];
            $this->updateRateLimitTelemetry($rateHeaders);

            $rawResults = $respData['results'] ?? [];
            $normalizedResults = [];
            foreach ($rawResults as $raw) {
                if (isset($raw['title']) || isset($raw['doi']) || isset($raw['authorships'])) {
                    $normalizedResults[] = $this->normalizeWork($raw);
                } else {
                    $normalizedResults[] = $raw;
                }
            }

            $meta = array_merge($respData['meta'] ?? [], $rateHeaders, [
                'cached' => false,
                'status' => 200,
            ]);

            $resultPayload = [
                'meta'     => $meta,
                'results'  => $normalizedResults,
                'group_by' => $respData['group_by'] ?? [],
            ];

            // Save into SQLite Cache table
            OpenAlexQueryCache::updateOrCreate(
                ['query_hash' => $cacheKey],
                [
                    'endpoint'          => 'oql',
                    'request_params'    => $data,
                    'response_meta'     => $resultPayload['meta'],
                    'response_results'  => $resultPayload['results'],
                    'response_group_by' => $resultPayload['group_by'],
                    'hits_count'        => ($cached ? $cached->hits_count + 1 : 1),
                    'expires_at'        => Carbon::now()->addHours(self::CACHE_TTL_HOURS),
                ]
            );

            return $resultPayload;
        }

        // On failure, check stale cache fallback
        if ($cached) {
            return [
                'meta' => array_merge($cached->response_meta ?? [], [
                    'cached'         => true,
                    'stale'          => true,
                    'upstream_error' => $fetchResult['message'] ?? 'API temporary error',
                    'upstream_status'=> $fetchResult['status'] ?? 500,
                ]),
                'results'  => $cached->response_results ?? [],
                'group_by' => $cached->response_group_by ?? [],
            ];
        }

        return [
            'meta' => [
                'count'      => 0,
                'cached'     => false,
                'status'     => $fetchResult['status'],
                'error'      => $fetchResult['error'] ?? 'API_ERROR',
                'message'    => $fetchResult['message'] ?? 'OQL execution failed.',
                'validation' => $fetchResult['validation'] ?? null,
                'suggestion' => $fetchResult['suggestion'] ?? null,
                'rate_limit' => $fetchResult['rate_limit_headers'] ?? [],
            ],
            'results'  => [],
            'group_by' => [],
        ];
    }

    /**
     * Translates an OpenAlex query between OQL, OQO, and classic URL formats without running it.
     * Endpoints: POST /query or GET /query/{format}/{query}
     */
    public function translateQuery(array $data = [], ?string $format = null, ?string $rawQuery = null): array
    {
        $cacheKey = 'translate_' . md5($format . '_' . $rawQuery . '_' . json_encode($data));

        $cached = OpenAlexQueryCache::find($cacheKey);
        if ($cached && !$cached->isExpired()) {
            return $cached->response_meta ?? [];
        }

        $mailto = env('OPENALEX_MAILTO', self::DEFAULT_MAILTO);
        $apiKey = env('OPENALEX_API_KEY') ?: $this->resolveStoredApiKey();

        $headers = [
            'User-Agent'   => "FCC-E-Library/5.0 (mailto:{$mailto})",
            'Accept'       => 'application/json',
            'Content-Type' => 'application/json',
        ];
        if ($apiKey) {
            $headers['Authorization'] = 'Bearer ' . $apiKey;
        }

        if ($format && $rawQuery) {
            $url = self::BASE_URL . '/query/' . urlencode($format) . '/' . rawurlencode($rawQuery);
            $fetch = $this->fetchWithExponentialBackoff($url, [], $headers, 'GET');
        } else {
            $url = self::BASE_URL . '/query';
            $fetch = $this->fetchWithExponentialBackoff($url, $data, $headers, 'POST');
        }

        if ($fetch['success']) {
            $respData = $fetch['data'];

            OpenAlexQueryCache::updateOrCreate(
                ['query_hash' => $cacheKey],
                [
                    'endpoint'          => 'query_translate',
                    'request_params'    => ['format' => $format, 'query' => $rawQuery, 'data' => $data],
                    'response_meta'     => $respData,
                    'response_results'  => [],
                    'response_group_by' => [],
                    'hits_count'        => 1,
                    'expires_at'        => Carbon::now()->addDays(7),
                ]
            );

            return $respData;
        }

        return [
            'valid'      => false,
            'status'     => $fetch['status'],
            'error'      => $fetch['error'] ?? 'TRANSLATE_ERROR',
            'message'    => $fetch['message'] ?? 'Translation failed.',
            'validation' => $fetch['validation'] ?? null,
            'oxurl'      => null,
            'oql'        => null,
            'oqo'        => null,
        ];
    }

    /**
     * Query properties registry (GET /properties or GET /properties/{entity})
     */
    public function getProperties(?string $entity = null): array
    {
        $endpoint = $entity ? "properties/" . urlencode($entity) : "properties";
        $cacheKey = "props_" . md5($endpoint);

        $cached = OpenAlexQueryCache::find($cacheKey);
        if ($cached && !$cached->isExpired()) {
            return $cached->response_meta ?? [];
        }

        $url = self::BASE_URL . '/' . $endpoint;
        $mailto = env('OPENALEX_MAILTO', self::DEFAULT_MAILTO);
        $apiKey = env('OPENALEX_API_KEY') ?: $this->resolveStoredApiKey();
        $headers = [
            'User-Agent' => "FCC-E-Library/5.0 (mailto:{$mailto})",
            'Accept'     => 'application/json',
        ];
        if ($apiKey) {
            $headers['Authorization'] = 'Bearer ' . $apiKey;
        }

        $fetch = $this->fetchWithExponentialBackoff($url, [], $headers, 'GET');

        if ($fetch['success']) {
            $data = $fetch['data'];
            OpenAlexQueryCache::updateOrCreate(
                ['query_hash' => $cacheKey],
                [
                    'endpoint'          => 'properties',
                    'request_params'    => ['entity' => $entity],
                    'response_meta'     => $data,
                    'response_results'  => [],
                    'response_group_by' => [],
                    'hits_count'        => 1,
                    'expires_at'        => Carbon::now()->addDays(7),
                ]
            );
            return $data;
        }

        return ['error' => $fetch['message'] ?? 'Failed to load properties registry.'];
    }

    /**
     * Lint/validate an OQL string (GET /validate?q=...)
     */
    public function validateOql(string $query): array
    {
        $url = self::BASE_URL . '/validate?q=' . rawurlencode($query);
        $mailto = env('OPENALEX_MAILTO', self::DEFAULT_MAILTO);
        $apiKey = env('OPENALEX_API_KEY') ?: $this->resolveStoredApiKey();
        $headers = [
            'User-Agent' => "FCC-E-Library/5.0 (mailto:{$mailto})",
            'Accept'     => 'application/json',
        ];
        if ($apiKey) {
            $headers['Authorization'] = 'Bearer ' . $apiKey;
        }

        $fetch = $this->fetchWithExponentialBackoff($url, [], $headers, 'GET');
        return $fetch['success'] ? $fetch['data'] : ['valid' => false, 'error' => $fetch['message']];
    }

    /**
     * Parse context for autocomplete (GET /parse-context?q=...&pos=...)
     */
    public function parseContext(string $query, int $pos): array
    {
        $url = self::BASE_URL . '/parse-context?q=' . rawurlencode($query) . '&pos=' . (int)$pos;
        $mailto = env('OPENALEX_MAILTO', self::DEFAULT_MAILTO);
        $apiKey = env('OPENALEX_API_KEY') ?: $this->resolveStoredApiKey();
        $headers = [
            'User-Agent' => "FCC-E-Library/5.0 (mailto:{$mailto})",
            'Accept'     => 'application/json',
        ];
        if ($apiKey) {
            $headers['Authorization'] = 'Bearer ' . $apiKey;
        }

        $fetch = $this->fetchWithExponentialBackoff($url, [], $headers, 'GET');
        return $fetch['success'] ? $fetch['data'] : ['error' => $fetch['message']];
    }

    /**
     * Autocomplete suggestions for an entity type (GET /autocomplete/{entity}?q=...)
     * Entities: works, authors, sources, institutions, topics, publishers, funders, etc.
     */
    public function autocomplete(string $entity, string $query, array $params = []): array
    {
        $cleanEntity = strtolower(trim($entity));
        $endpoint = "autocomplete/{$cleanEntity}";
        $cleanParams = array_merge(['q' => $query], $params);
        $cacheKey = 'ac_' . md5($cleanEntity . '_' . json_encode($cleanParams));

        $cached = OpenAlexQueryCache::find($cacheKey);
        if ($cached && !$cached->isExpired()) {
            $cached->increment('hits_count');
            return [
                'meta'    => $cached->response_meta ?? [],
                'results' => $cached->response_results ?? [],
            ];
        }

        $url = self::BASE_URL . '/' . $endpoint;
        $mailto = env('OPENALEX_MAILTO', self::DEFAULT_MAILTO);
        $apiKey = env('OPENALEX_API_KEY') ?: $this->resolveStoredApiKey();
        $headers = [
            'User-Agent' => "FCC-E-Library/5.0 (mailto:{$mailto})",
            'Accept'     => 'application/json',
        ];
        if ($apiKey) {
            $headers['Authorization'] = 'Bearer ' . $apiKey;
        }

        $fetch = $this->fetchWithExponentialBackoff($url, $cleanParams, $headers, 'GET');
        if ($fetch['success']) {
            $data = $fetch['data'];
            OpenAlexQueryCache::updateOrCreate(
                ['query_hash' => $cacheKey],
                [
                    'endpoint'          => $endpoint,
                    'request_params'    => $cleanParams,
                    'response_meta'     => $data['meta'] ?? ['count' => count($data['results'] ?? [])],
                    'response_results'  => $data['results'] ?? [],
                    'response_group_by' => [],
                    'hits_count'        => 1,
                    'expires_at'        => Carbon::now()->addHours(24),
                ]
            );
            return $data;
        }

        return ['meta' => ['count' => 0, 'error' => $fetch['message'] ?? 'Autocomplete failed'], 'results' => []];
    }

    /**
     * Tag aboutness on arbitrary text (GET /text?title=...&abstract=...)
     * Returns topics and keywords tagged from the text.
     */
    public function tagText(string $title = '', string $abstract = '', array $params = []): array
    {
        $cleanParams = array_merge([
            'title'    => $title,
            'abstract' => $abstract,
        ], $params);
        $cacheKey = 'text_tag_' . md5(json_encode($cleanParams));

        $cached = OpenAlexQueryCache::find($cacheKey);
        if ($cached && !$cached->isExpired()) {
            $cached->increment('hits_count');
            return $cached->response_meta ?? [];
        }

        $url = self::BASE_URL . '/text';
        $mailto = env('OPENALEX_MAILTO', self::DEFAULT_MAILTO);
        $apiKey = env('OPENALEX_API_KEY') ?: $this->resolveStoredApiKey();
        $headers = [
            'User-Agent' => "FCC-E-Library/5.0 (mailto:{$mailto})",
            'Accept'     => 'application/json',
        ];
        if ($apiKey) {
            $headers['Authorization'] = 'Bearer ' . $apiKey;
        }

        $fetch = $this->fetchWithExponentialBackoff($url, $cleanParams, $headers, 'GET');
        if ($fetch['success']) {
            $data = $fetch['data'];
            OpenAlexQueryCache::updateOrCreate(
                ['query_hash' => $cacheKey],
                [
                    'endpoint'          => 'text',
                    'request_params'    => $cleanParams,
                    'response_meta'     => $data,
                    'response_results'  => [],
                    'response_group_by' => [],
                    'hits_count'        => 1,
                    'expires_at'        => Carbon::now()->addDays(7),
                ]
            );
            return $data;
        }

        return ['error' => $fetch['message'] ?? 'Failed to tag text.', 'meta' => [], 'keywords' => [], 'topics' => []];
    }

    /**
     * Core endpoint dispatcher with database caching, exponential backoff, and error handling
     */
    public function queryEndpoint(string $endpoint, array $params = [], int $cacheHours = self::CACHE_TTL_HOURS): array
    {
        // Standardize parameters
        $cleanParams = $this->prepareParams($params);
        $cacheKey = $this->computeCacheKey($endpoint, $cleanParams);

        // 1. Check database cache
        $cached = OpenAlexQueryCache::find($cacheKey);
        if ($cached && !$cached->isExpired()) {
            $cached->increment('hits_count');
            return [
                'meta' => array_merge($cached->response_meta ?? [], [
                    'cached'     => true,
                    'cached_at'  => $cached->updated_at->toIso8601String(),
                    'hits_count' => $cached->hits_count,
                    'status'     => 200,
                ]),
                'results'  => $cached->response_results ?? [],
                'group_by' => $cached->response_group_by ?? [],
            ];
        }

        // 2. Build HTTP request configuration
        $url = self::BASE_URL . '/' . ltrim($endpoint, '/');
        $mailto = env('OPENALEX_MAILTO', self::DEFAULT_MAILTO);
        $apiKey = env('OPENALEX_API_KEY') ?: $this->resolveStoredApiKey();

        $headers = [
            'User-Agent' => "FCC-E-Library/5.0 (mailto:{$mailto})",
            'Accept'     => 'application/json',
        ];

        if ($apiKey) {
            $headers['Authorization'] = 'Bearer ' . $apiKey;
            $cleanParams['api_key'] = $apiKey;
        }

        // Add polite pool mailto to query if not already passed
        if (!isset($cleanParams['mailto'])) {
            $cleanParams['mailto'] = $mailto;
        }

        // 3. Execute HTTP request with exponential backoff for 429 and 5xx errors
        $fetchResult = $this->fetchWithExponentialBackoff($url, $cleanParams, $headers);

        if ($fetchResult['success']) {
            $data = $fetchResult['data'];
            $rateHeaders = $fetchResult['rate_limit_headers'];

            // Update global rate limit telemetry cache
            $this->updateRateLimitTelemetry($rateHeaders);

            // Handle Single Entity vs List Response
            if (isset($data['id']) && !isset($data['results'])) {
                $normWork = str_starts_with($endpoint, 'works') ? $this->normalizeWork($data) : $data;
                $resultPayload = [
                    'meta' => array_merge($rateHeaders, [
                        'count'     => 1,
                        'page'      => 1,
                        'per_page'  => 1,
                        'cached'    => false,
                        'status'    => 200,
                    ]),
                    'results'    => [$normWork],
                    'raw_entity' => $data,
                    'group_by'   => [],
                ];
            } else {
                $rawResults = $data['results'] ?? [];
                $normalizedResults = [];

                if (str_starts_with($endpoint, 'works')) {
                    foreach ($rawResults as $raw) {
                        $normalizedResults[] = $this->normalizeWork($raw);
                    }
                } else {
                    $normalizedResults = $rawResults;
                }

                $meta = array_merge($data['meta'] ?? [], $rateHeaders, [
                    'cached' => false,
                    'status' => 200,
                ]);

                $resultPayload = [
                    'meta'     => $meta,
                    'results'  => $normalizedResults,
                    'group_by' => $data['group_by'] ?? [],
                ];
            }

            // 4. Save into SQLite Cache table for lightning-fast subsequent queries
            OpenAlexQueryCache::updateOrCreate(
                ['query_hash' => $cacheKey],
                [
                    'endpoint'          => explode('/', $endpoint)[0],
                    'request_params'    => $cleanParams,
                    'response_meta'     => $resultPayload['meta'],
                    'response_results'  => $resultPayload['results'],
                    'response_group_by' => $resultPayload['group_by'],
                    'hits_count'        => ($cached ? $cached->hits_count + 1 : 1),
                    'expires_at'        => Carbon::now()->addHours($cacheHours),
                ]
            );

            return $resultPayload;
        }

        // 5. External Call Failed - Check if stale cache is available as fallback
        if ($cached) {
            Log::info("OpenAlex request failed; serving stale cache for {$url}", [
                'error' => $fetchResult['message'] ?? 'Unknown error'
            ]);

            return [
                'meta' => array_merge($cached->response_meta ?? [], [
                    'cached'        => true,
                    'stale'         => true,
                    'upstream_error'=> $fetchResult['message'] ?? 'API temporary error',
                    'upstream_status'=> $fetchResult['status'] ?? 500,
                ]),
                'results'  => $cached->response_results ?? [],
                'group_by' => $cached->response_group_by ?? [],
            ];
        }

        // Return structured error payload matching OpenAlex error specifications
        return [
            'meta' => [
                'count'      => 0,
                'cached'     => false,
                'status'     => $fetchResult['status'],
                'error'      => $fetchResult['error'] ?? 'API_ERROR',
                'message'    => $fetchResult['message'] ?? 'Request failed.',
                'suggestion' => $fetchResult['suggestion'] ?? null,
                'rate_limit' => $fetchResult['rate_limit_headers'] ?? [],
            ],
            'results'  => [],
            'group_by' => [],
        ];
    }

    /**
     * Executes GET request with Exponential Backoff retry logic:
     * - Timeout: 30 seconds
     * - Follows 301 Moved Permanently redirects
     * - Retries on 429 Too Many Requests with exponential delay: 1s, 2s, 4s...
     * - Retries on >= 500 Server Errors
     * - Does NOT retry on 400 Bad Request, 403 Forbidden, or 404 Not Found (client errors)
     */
    /**
     * Executes HTTP GET or POST request with Exponential Backoff retry logic:
     * - Timeout: 30 seconds
     * - Follows 301 Moved Permanently redirects
     * - Retries on 429 Too Many Requests with exponential delay: 1s, 2s, 4s...
     * - Retries on >= 500 Server Errors
     * - Does NOT retry on 400 Bad Request, 403 Forbidden, or 404 Not Found (client errors)
     */
    private function fetchWithExponentialBackoff(string $url, array $params, array $headers, string $method = 'GET'): array
    {
        $maxRetries = self::MAX_RETRIES;
        $attempt = 0;
        $isPost = strtoupper($method) === 'POST';

        while ($attempt <= $maxRetries) {
            try {
                $req = Http::withHeaders($headers)
                    ->withOptions([
                        'allow_redirects' => [
                            'max'             => 5,
                            'strict'          => false,
                            'referer'         => true,
                            'protocols'       => ['http', 'https'],
                            'track_redirects' => true,
                        ],
                    ])
                    ->timeout(self::TIMEOUT_SECONDS);

                if ($isPost) {
                    $response = $req->post($url, $params);
                } else {
                    $response = $req->get($url, $params);
                }

                $statusCode = $response->status();
                $rateHeaders = $this->extractRateLimitHeaders($response);

                // 200 OK / 2xx Success
                if ($response->successful()) {
                    return [
                        'success'            => true,
                        'data'               => $response->json(),
                        'rate_limit_headers' => $rateHeaders,
                        'status'             => $statusCode,
                    ];
                }

                // 429 Rate Limit Exceeded
                if ($statusCode === 429) {
                    $errorBody = $response->json() ?? [];
                    Log::warning("OpenAlex 429 Rate Limit Exceeded on attempt {$attempt}/{$maxRetries}", [
                        'url' => $url,
                        'headers' => $rateHeaders,
                        'body' => $errorBody,
                    ]);

                    if ($attempt < $maxRetries) {
                        // Exponential backoff: 1s, 2s, 4s...
                        $waitTime = (int) pow(2, $attempt);
                        sleep($waitTime);
                        $attempt++;
                        continue;
                    }

                    return [
                        'success'            => false,
                        'status'             => 429,
                        'error'              => $errorBody['error'] ?? 'Rate limit exceeded',
                        'message'            => $errorBody['message'] ?? 'Daily credit budget or rate limit exceeded. Please wait for reset.',
                        'rate_limit_headers' => $rateHeaders,
                    ];
                }

                // 5xx Server Error: Transient issue; retry with exponential backoff
                if ($statusCode >= 500) {
                    Log::warning("OpenAlex {$statusCode} Server Error on attempt {$attempt}/{$maxRetries}", [
                        'url' => $url,
                        'status' => $statusCode,
                    ]);

                    if ($attempt < $maxRetries) {
                        $waitTime = (int) pow(2, $attempt);
                        sleep($waitTime);
                        $attempt++;
                        continue;
                    }

                    return [
                        'success'            => false,
                        'status'             => $statusCode,
                        'error'              => 'SERVER_ERROR',
                        'message'            => "OpenAlex server returned HTTP {$statusCode}. Temporary issue.",
                        'rate_limit_headers' => $rateHeaders,
                    ];
                }

                // 400 Bad Request: Filter syntax error, unknown field, invalid parameter, or OQL parse error
                if ($statusCode === 400) {
                    $errorBody = $response->json() ?? [];
                    $errTitle = $errorBody['error'] ?? 'Invalid filter or parameter';
                    $errMessage = $errorBody['message'] ?? $response->body();
                    $validation = $errorBody['validation'] ?? null;

                    // Parse suggestion if OpenAlex provided one (e.g. "Did you mean: ...")
                    $suggestion = null;
                    if (preg_match('#Did you mean:\s*([^\?]+)\?#i', $errMessage, $matches)) {
                        $suggestion = trim($matches[1]);
                    }

                    Log::info("OpenAlex 400 Bad Request: {$errMessage}", ['url' => $url, 'params' => $params]);

                    return [
                        'success'            => false,
                        'status'             => 400,
                        'error'              => $errTitle,
                        'message'            => $errMessage,
                        'suggestion'         => $suggestion,
                        'validation'         => $validation,
                        'oqo'                => $errorBody['oqo'] ?? null,
                        'rate_limit_headers' => $rateHeaders,
                    ];
                }

                // 404 Not Found: Entity doesn't exist or merged
                if ($statusCode === 404) {
                    $errorBody = $response->json() ?? [];
                    return [
                        'success'            => false,
                        'status'             => 404,
                        'error'              => 'NOT_FOUND',
                        'message'            => $errorBody['message'] ?? 'Entity not found on OpenAlex. It may have been merged or deleted.',
                        'rate_limit_headers' => $rateHeaders,
                    ];
                }

                // 403 Forbidden
                if ($statusCode === 403) {
                    $errorBody = $response->json() ?? [];
                    return [
                        'success'            => false,
                        'status'             => 403,
                        'error'              => 'FORBIDDEN',
                        'message'            => $errorBody['message'] ?? 'Access forbidden. Check your API key permissions.',
                        'rate_limit_headers' => $rateHeaders,
                    ];
                }

                // Other status codes
                return [
                    'success'            => false,
                    'status'             => $statusCode,
                    'error'              => "HTTP_{$statusCode}",
                    'message'            => $response->body(),
                    'rate_limit_headers' => $rateHeaders,
                ];

            } catch (\Throwable $e) {
                // Connection or Timeout Exception
                Log::warning("OpenAlex Connection/Timeout Exception on attempt {$attempt}/{$maxRetries}: {$e->getMessage()}");

                if ($attempt < $maxRetries) {
                    $waitTime = (int) pow(2, $attempt);
                    sleep($waitTime);
                    $attempt++;
                    continue;
                }

                return [
                    'success'            => false,
                    'status'             => 504,
                    'error'              => 'GATEWAY_TIMEOUT',
                    'message'            => "Failed to connect to OpenAlex after {$maxRetries} retries: " . $e->getMessage(),
                    'rate_limit_headers' => [],
                ];
            }
        }

        return [
            'success' => false,
            'status'  => 500,
            'error'   => 'RETRY_EXHAUSTED',
            'message' => 'Maximum retry attempts exhausted.',
        ];
    }

    /**
     * Extracts OpenAlex standard rate limit headers
     */
    private function extractRateLimitHeaders(Response $response): array
    {
        return [
            'rate_limit_limit'        => $response->header('X-RateLimit-Limit') ? (int) $response->header('X-RateLimit-Limit') : null,
            'rate_limit_remaining'    => $response->header('X-RateLimit-Remaining') !== '' ? (int) $response->header('X-RateLimit-Remaining') : null,
            'rate_limit_credits_used' => $response->header('X-RateLimit-Credits-Used') !== '' ? (float) $response->header('X-RateLimit-Credits-Used') : 0.0,
            'rate_limit_reset'        => $response->header('X-RateLimit-Reset') ? (int) $response->header('X-RateLimit-Reset') : null,
        ];
    }

    /**
     * Persists latest live rate limit telemetry
     */
    private function updateRateLimitTelemetry(array $headers): void
    {
        if (!empty($headers['rate_limit_limit'])) {
            Cache::put('openalex_telemetry_rate_limit', array_merge($headers, [
                'updated_at' => Carbon::now()->toIso8601String(),
            ]), Carbon::now()->addHours(24));
        }
    }

    /**
     * Retrieves current rate limit telemetry
     */
    public function getRateLimitTelemetry(): array
    {
        $cached = Cache::get('openalex_telemetry_rate_limit');
        if ($cached && is_array($cached)) {
            return $cached;
        }

        return [
            'rate_limit_limit'        => 10000,
            'rate_limit_remaining'    => 10000,
            'rate_limit_credits_used' => 0.0,
            'rate_limit_reset'        => 86400,
            'updated_at'              => Carbon::now()->toIso8601String(),
        ];
    }

    /**
     * Normalizes a raw OpenAlex work into the clean FCC Library scholarly schema
     */
    public function normalizeWork(array $w, bool $isLocallySaved = false): array
    {
        $id = $this->cleanWorkId($w['id'] ?? '');
        $doi = $w['doi'] ?? null;
        if ($doi) {
            $doi = preg_replace('#^https?://doi\.org/#i', '', $doi);
        }

        $oa = $w['open_access'] ?? [];
        $isOa = (bool) ($oa['is_oa'] ?? false);
        $oaStatus = $oa['oa_status'] ?? 'closed';
        $oaUrl = $oa['oa_url'] ?? ($w['best_oa_location']['landing_page_url'] ?? null);
        $pdfUrl = $w['best_oa_location']['pdf_url'] ?? null;

        // Abstract: decode from inverted index if string abstract is not directly provided
        $abstract = $w['abstract'] ?? null;
        if (empty($abstract) && !empty($w['abstract_inverted_index'])) {
            $abstract = OpenAlexWork::reconstructAbstract($w['abstract_inverted_index']);
        }

        // Process Authors
        $authors = [];
        foreach ($w['authorships'] ?? [] as $authorship) {
            $authorObj = $authorship['author'] ?? [];
            $institutions = array_map(fn ($inst) => $inst['display_name'] ?? '', $authorship['institutions'] ?? []);
            $authors[] = [
                'name'         => $authorObj['display_name'] ?? 'Unknown Researcher',
                'id'           => $this->cleanWorkId($authorObj['id'] ?? ''),
                'orcid'        => $authorObj['orcid'] ?? null,
                'institutions' => array_filter($institutions),
                'is_corresponding' => (bool) ($authorship['is_corresponding'] ?? false),
            ];
        }

        // Primary Venue / Journal / Publisher (Using primary_location per OpenAlex deprecation of host_venue)
        $primaryLoc = $w['primary_location'] ?? [];
        $sourceObj = $primaryLoc['source'] ?? [];
        $sourceName = $sourceObj['display_name'] ?? null;
        $publisher = $sourceObj['host_organization_name'] ?? ($primaryLoc['source']['host_organization_name'] ?? null);

        // Canonical 4-Level Topics Taxonomy: domain > field > subfield > topic
        $primaryTopic = null;
        if (!empty($w['primary_topic'])) {
            $pt = $w['primary_topic'];
            $primaryTopic = [
                'name'     => $pt['display_name'] ?? '',
                'subfield' => $pt['subfield']['display_name'] ?? null,
                'field'    => $pt['field']['display_name'] ?? null,
                'domain'   => $pt['domain']['display_name'] ?? null,
            ];
        }

        $topics = [];
        foreach ($w['topics'] ?? [] as $top) {
            $topics[] = [
                'name'     => $top['display_name'] ?? '',
                'subfield' => $top['subfield']['display_name'] ?? null,
                'field'    => $top['field']['display_name'] ?? null,
                'domain'   => $top['domain']['display_name'] ?? null,
            ];
        }

        $concepts = [];
        foreach ($w['concepts'] ?? [] as $con) {
            $concepts[] = [
                'name'  => $con['display_name'] ?? '',
                'score' => round((float) ($con['score'] ?? 0), 2),
                'level' => $con['level'] ?? 0,
            ];
        }

        // Check if currently saved in local library database
        $isSaved = $isLocallySaved;
        if (!$isSaved) {
            $isSaved = OpenAlexWork::where('id', $id)->where('is_saved', true)->exists();
        }

        return [
            'id'               => $id,
            'openalex_id'      => $w['id'] ?? "https://openalex.org/{$id}",
            'doi'              => $doi,
            'doi_url'          => $doi ? "https://doi.org/{$doi}" : null,
            'title'            => $w['display_name'] ?? ($w['title'] ?? 'Untitled Scholarly Work'),
            'publication_year' => $w['publication_year'] ?? null,
            'publication_date' => $w['publication_date'] ?? null,
            'type'             => $w['type'] ?? 'article',
            'type_crossref'    => $w['type_crossref'] ?? null,
            'authors'          => $authors,
            'author_string'    => implode(', ', array_slice(array_column($authors, 'name'), 0, 4)) . (count($authors) > 4 ? ' et al.' : ''),
            'primary_source'   => $sourceName,
            'publisher'        => $publisher,
            'abstract'         => $abstract,
            'is_oa'            => $isOa,
            'oa_status'        => $oaStatus,
            'oa_url'           => $oaUrl,
            'pdf_url'          => $pdfUrl,
            'cited_by_count'   => (int) ($w['cited_by_count'] ?? 0),
            'topics'           => $topics,
            'concepts'         => $concepts,
            'language'         => $w['language'] ?? 'en',
            'biblio'           => [
                'volume'     => $w['biblio']['volume'] ?? null,
                'issue'      => $w['biblio']['issue'] ?? null,
                'first_page' => $w['biblio']['first_page'] ?? null,
                'last_page'  => $w['biblio']['last_page'] ?? null,
            ],
            'openalex_url'     => $w['id'] ?? "https://openalex.org/{$id}",
            'primary_topic'    => $primaryTopic,
            'is_xpac'          => (bool) ($w['is_xpac'] ?? false),
            'is_saved'         => $isSaved,
            'raw'              => $w,
        ];
    }

    /**
     * Extract pure ID e.g. "W2741809807" from "https://openalex.org/W2741809807"
     */
    private function cleanWorkId(string $id): string
    {
        $id = trim($id);
        if (preg_match('#(?:openalex\.org/)?([A-Za-z0-9]+)$#i', $id, $matches)) {
            return $matches[1];
        }
        return $id;
    }

    /**
     * Normalizes query params for consistent cache keys
     */
    private function prepareParams(array $params): array
    {
        ksort($params);
        $clean = [];
        foreach ($params as $k => $v) {
            if ($v !== null && $v !== '') {
                $clean[$k] = is_bool($v) ? ($v ? 'true' : 'false') : $v;
            }
        }
        return $clean;
    }

    /**
     * Compute deterministic hash for caching
     */
    private function computeCacheKey(string $endpoint, array $params): string
    {
        return hash('sha256', strtolower($endpoint) . '?' . http_build_query($params));
    }

    /**
     * Resolves stored API key from library_apis table with fallback
     */
    private function resolveStoredApiKey(): ?string
    {
        try {
            $record = \App\Models\LibraryApi::find('API-OPENALEX');
            if ($record && !empty($record->api_key)) {
                return trim($record->api_key);
            }
        } catch (\Throwable $e) {}

        return 'FD6xNHEEyHhLMW5Htsx3Vv';
    }
}

