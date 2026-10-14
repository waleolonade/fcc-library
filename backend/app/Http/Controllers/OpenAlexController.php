<?php

namespace App\Http\Controllers;

use App\Models\OpenAlexQueryCache;
use App\Models\OpenAlexWork;
use App\Services\OpenAlexService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * OpenAlexController
 *
 * Dedicated REST API controller routing OpenAlex academic graph requests through
 * the Federal Co-operative College Laravel backend & SQLite database.
 */
class OpenAlexController extends Controller
{
    public function __construct(private OpenAlexService $openAlex)
    {
    }

    /**
     * GET /api/openalex/works
     * Search and filter scholarly works through OpenAlex
     */
    public function works(Request $request): JsonResponse
    {
        $params = [];

        // 1. Search term & Search Mode mapping (Per OpenAlex Searching Specification)
        $rawSearch = trim((string) $request->input('search', $request->input('q', '')));
        $searchScope = strtolower(trim((string) $request->input('search_scope', 'title_abstract_keywords')));
        $isExact = $request->boolean('exact') || $request->input('exact') === 'true' || preg_match('/[*?]/', $rawSearch);
        $isSemantic = $request->boolean('semantic') || $searchScope === 'semantic' || $request->filled('search_semantic') || $request->filled('search.semantic');

        if ($isSemantic) {
            $semanticQuery = trim($request->input('search_semantic', $request->input('search.semantic', $rawSearch)));
            if ($semanticQuery !== '') {
                // OpenAlex constraint: up to 2,000 characters used for matching; longer input is truncated
                $params['search.semantic'] = mb_substr($semanticQuery, 0, 2000);
            }
        } elseif ($rawSearch !== '') {
            if ($searchScope === 'title_abstract_keywords') {
                $key = $isExact ? 'search.title_abstract_keywords.exact' : 'search.title_abstract_keywords';
                $params[$key] = $rawSearch;
            } elseif ($searchScope === 'title_and_abstract') {
                $key = $isExact ? 'search.title_and_abstract.exact' : 'search.title_and_abstract';
                $params[$key] = $rawSearch;
            } elseif ($searchScope === 'title') {
                $key = $isExact ? 'search.title.exact' : 'search.title';
                $params[$key] = $rawSearch;
            } elseif ($isExact) {
                $params['search.exact'] = $rawSearch;
            } else {
                $params['search'] = $rawSearch;
            }
        }

        // Direct scoped search parameter overrides
        if ($request->filled('search_title_abstract_keywords')) {
            $params['search.title_abstract_keywords'] = trim($request->input('search_title_abstract_keywords'));
        }
        if ($request->filled('search_title_and_abstract')) {
            $params['search.title_and_abstract'] = trim($request->input('search_title_and_abstract'));
        }
        if ($request->filled('search_title')) {
            $params['search.title'] = trim($request->input('search_title'));
        }
        if ($request->filled('search_exact')) {
            $params['search.exact'] = trim($request->input('search_exact'));
        }

        // 2. Filter assembly - Full OpenAlex Querying & Filtering specification
        $filters = [];

        // Raw filter passthrough (e.g. "type:book,cited_by_count:>100" or piped OR "institutions.country_code:fr|gb")
        if ($request->filled('filter')) {
            $filters[] = trim($request->input('filter'));
        }

        // Direct convenience & equality filters
        if ($request->filled('year')) {
            $filters[] = 'publication_year:' . (int) $request->input('year');
        }

        // Exact date range filters
        if ($request->filled('from_publication_date')) {
            $filters[] = 'from_publication_date:' . trim($request->input('from_publication_date'));
        } elseif ($request->filled('from_year')) {
            $filters[] = 'from_publication_date:' . (int) $request->input('from_year') . '-01-01';
        }

        if ($request->filled('to_publication_date')) {
            $filters[] = 'to_publication_date:' . trim($request->input('to_publication_date'));
        } elseif ($request->filled('to_year')) {
            $filters[] = 'to_publication_date:' . (int) $request->input('to_year') . '-12-31';
        }

        // Premium sync filters: from_created_date, from_updated_date
        if ($request->filled('from_created_date')) {
            $filters[] = 'from_created_date:' . trim($request->input('from_created_date'));
        }
        if ($request->filled('from_updated_date')) {
            $filters[] = 'from_updated_date:' . trim($request->input('from_updated_date'));
        }

        // Numeric inequalities (<, >) e.g. cited_by_count:>100
        // NOTE: cited_by_count is NOT supported on semantic search per OpenAlex spec
        if (!$isSemantic) {
            if ($request->filled('cited_by_count')) {
                $val = trim($request->input('cited_by_count'));
                $filters[] = 'cited_by_count:' . (preg_match('/^[<>]/', $val) ? $val : '>' . (int)$val);
            } elseif ($request->filled('min_citations')) {
                $filters[] = 'cited_by_count:>' . (int) $request->input('min_citations');
            }
        }

        // Boolean attributes
        if ($request->boolean('is_oa') || $request->input('is_oa') === 'true') {
            $filters[] = 'is_oa:true';
        }
        if ($request->boolean('has_abstract') || $request->input('has_abstract') === 'true') {
            $filters[] = 'has_abstract:true';
        }
        if ($request->boolean('has_fulltext') || $request->input('has_fulltext') === 'true') {
            $filters[] = 'has_fulltext:true';
        }
        if ($request->boolean('has_doi') || $request->input('has_doi') === 'true') {
            $filters[] = 'has_doi:true';
        }
        if ($request->boolean('has_orcid') || $request->input('has_orcid') === 'true') {
            $filters[] = 'authorships.author.has_orcid:true';
        }

        // Publication type (supports negation e.g. "!paratext" and OR e.g. "article|book")
        if ($request->filled('type') && $request->input('type') !== 'all') {
            $filters[] = 'type:' . trim($request->input('type'));
        }

        // Saved collection filter (e.g. col_8yWKmRNyEr or !col_xxx)
        if ($request->filled('collection')) {
            $filters[] = 'collection:' . trim($request->input('collection'));
        }

        // Bulk DOI matching with pipe OR: doi:https://...|https://... (up to 100)
        if ($request->filled('dois')) {
            $rawDois = $request->input('dois');
            $doiArray = is_array($rawDois) ? $rawDois : preg_split('/[\r\n,|]+/', (string)$rawDois, -1, PREG_SPLIT_NO_EMPTY);
            $cleanDois = array_slice(array_map('trim', $doiArray), 0, 100);
            if (!empty($cleanDois)) {
                $formattedDois = array_map(function ($d) {
                    return str_starts_with($d, 'http') ? $d : 'https://doi.org/' . ltrim($d, '/');
                }, $cleanDois);
                $filters[] = 'doi:' . implode('|', $formattedDois);
            }
        } elseif ($request->filled('doi')) {
            $d = trim($request->input('doi'));
            $filters[] = 'doi:' . (str_starts_with($d, 'http') ? $d : 'https://doi.org/' . ltrim($d, '/'));
        }

        // Author & Institution country filters (supports negation !us, OR fr|gb, AND fr+gb)
        // NOTE: country_code is NOT supported on semantic search per OpenAlex spec
        if (!$isSemantic) {
            if ($request->filled('country_code')) {
                $filters[] = 'authorships.institutions.country_code:' . trim($request->input('country_code'));
            }
            if ($request->filled('institution_country')) {
                $filters[] = 'authorships.institutions.country_code:' . trim($request->input('institution_country'));
            }
        }

        // Global South flag
        if ($request->boolean('is_global_south') || $request->input('is_global_south') === 'true') {
            $filters[] = 'authorships.institutions.is_global_south:true';
        }

        // Institution ID & Name resolution
        if ($request->filled('institution_id')) {
            $filters[] = 'authorships.institutions.id:' . trim($request->input('institution_id'));
        }
        if ($request->filled('institution_name')) {
            $resolved = $this->openAlex->resolveEntity('institution', $request->input('institution_name'));
            if ($resolved) {
                $filters[] = $resolved['filter_param'];
            }
        }

        // Author ID & Name resolution
        if ($request->filled('author_id')) {
            $filters[] = 'authorships.author.id:' . trim($request->input('author_id'));
        }
        if ($request->filled('author_name')) {
            $resolved = $this->openAlex->resolveEntity('author', $request->input('author_name'));
            if ($resolved) {
                $filters[] = $resolved['filter_param'];
            }
        }

        // Source (Journal/Repository) ID
        if ($request->filled('source_id')) {
            $filters[] = 'primary_location.source.id:' . trim($request->input('source_id'));
        }

        // Topic ID & Name resolution
        if ($request->filled('topic_id')) {
            $filters[] = 'topics.id:' . trim($request->input('topic_id'));
        }
        if ($request->filled('topic_name')) {
            $resolved = $this->openAlex->resolveEntity('topic', $request->input('topic_name'));
            if ($resolved) {
                $filters[] = $resolved['filter_param'];
            }
        }

        // Related Entity Reach-Through Filters:
        // Source country
        if ($request->filled('source_country_code')) {
            $filters[] = 'primary_location.source.country_code:' . trim($request->input('source_country_code'));
        }
        // Source Global South
        if ($request->boolean('source_is_global_south') || $request->input('source_is_global_south') === 'true') {
            $filters[] = 'primary_location.source.is_global_south:true';
        }
        // Source OJS (Open Journal Systems)
        if ($request->boolean('source_is_ojs') || $request->input('source_is_ojs') === 'true') {
            $filters[] = 'primary_location.source.is_ojs:true';
        }
        // Source High OA rate
        if ($request->boolean('source_is_high_oa_rate') || $request->input('source_is_high_oa_rate') === 'true') {
            $filters[] = 'primary_location.source.is_high_oa_rate:true';
        }
        // Source Preprint repository
        if ($request->boolean('source_is_preprint') || $request->input('source_is_preprint') === 'true') {
            $filters[] = 'primary_location.source.is_preprint_repository:true';
        }
        // Source metrics (h-index range e.g. >100)
        if ($request->filled('source_h_index')) {
            $val = trim($request->input('source_h_index'));
            $filters[] = 'primary_location.source.summary_stats.h_index:' . (preg_match('/^[<>]/', $val) ? $val : '>' . (int)$val);
        }
        // Host organization / Publisher country code
        if ($request->filled('publisher_country_code') || $request->filled('host_organization_country_code')) {
            $c = trim($request->input('publisher_country_code', $request->input('host_organization_country_code')));
            $filters[] = 'primary_location.source.host_organization.country_code:' . $c;
        }
        // Funder country code
        if ($request->filled('funder_country_code')) {
            $filters[] = 'funders.country_code:' . trim($request->input('funder_country_code'));
        }
        // Geographic region & city of institutions
        if ($request->filled('institution_region')) {
            $filters[] = 'authorships.institutions.geo.region:' . trim($request->input('institution_region'));
        }
        if ($request->filled('institution_city')) {
            $filters[] = 'authorships.institutions.geo.city:' . trim($request->input('institution_city'));
        }
        // Byline author search (exact string published in paper byline)
        if ($request->filled('byline_author')) {
            $ba = trim($request->input('byline_author'));
            $filters[] = 'raw_author_name.search:' . (str_starts_with($ba, '"') ? $ba : '"' . $ba . '"');
        }

        if (!empty($filters)) {
            $params['filter'] = implode(',', $filters);
        }

        // Corpus selection: core (~324M curated) | expansion (~193M) | all (~517M combined)
        if ($request->filled('corpus') && in_array(strtolower($request->input('corpus')), ['core', 'expansion', 'all'])) {
            $params['corpus'] = strtolower($request->input('corpus'));
        }

        // Rerank top 100 by relevance (incompatible with semantic search per OpenAlex spec)
        if (($request->boolean('rerank') || $request->input('rerank') === 'true') && !$isSemantic) {
            $params['rerank'] = 'true';
            $params['sort'] = 'relevance_score:desc';
        }

        // Sampling (sample and seed)
        if ($request->filled('sample')) {
            $params['sample'] = min(10000, max(1, (int) $request->input('sample')));
            if ($request->filled('seed')) {
                $params['seed'] = (int) $request->input('seed');
            }
        }

        // 3. Group By Aggregation (Per OpenAlex Grouping Specification)
        if ($request->filled('group_by')) {
            $groupByField = trim($request->input('group_by'));
            if ($request->boolean('include_unknown') && !str_contains($groupByField, ':include_unknown')) {
                $groupByField .= ':include_unknown';
            }
            $params['group_by'] = $groupByField;

            // When grouping, sort must be 'count', 'key', or <numeric_field>.<metric> (e.g. count:desc)
            if ($request->filled('sort')) {
                $s = trim($request->input('sort'));
                if (preg_match('/^(count|key|cited_by_count\.(mean|sum|min|max))(:asc|:desc)?$/i', $s)) {
                    $params['sort'] = $s;
                }
            }

            // Grouped response returns at most 200 groups per page
            $params['per_page'] = min(200, max(1, (int) $request->input('per_page', 50)));

            // group_by requires cursor paging rather than page=N
            if ($request->filled('cursor')) {
                $params['cursor'] = trim($request->input('cursor'));
            }
        } else {
            // Standard Sorting & Pagination
            $hasTextSearch = $rawSearch !== '' || !empty($params['search.semantic']);
            if (!isset($params['sort'])) {
                if ($request->filled('sort')) {
                    $sortVal = trim($request->input('sort'));
                    // Guard: OpenAlex throws HTTP 400 if sorting by relevance_score without an active search
                    if (!$hasTextSearch && str_contains($sortVal, 'relevance_score')) {
                        $sortVal = preg_replace('/,?\s*relevance_score(:desc|:asc)?/', '', $sortVal);
                        $sortVal = trim($sortVal, ', ');
                        if ($sortVal === '') {
                            $sortVal = 'cited_by_count:desc';
                        }
                    }
                    $params['sort'] = $sortVal;
                } else {
                    $params['sort'] = $hasTextSearch ? 'relevance_score:desc' : 'cited_by_count:desc';
                }
            }

            $maxLimit = $isSemantic ? 50 : 100;
            $params['page'] = max(1, (int) $request->input('page', 1));
            $params['per_page'] = min($maxLimit, max(1, (int) $request->input('per_page', $isSemantic ? 20 : 25)));
        }

        if ($request->filled('select')) {
            $params['select'] = trim($request->input('select'));
        }

        if ($request->filled('cursor')) {
            $params['cursor'] = trim($request->input('cursor'));
        }

        // Execute query through backend service with SQLite caching
        $response = $this->openAlex->getWorks($params);

        $status = $response['meta']['status'] ?? 200;
        $isSuccess = $status < 400 || !empty($response['meta']['stale']);

        $jsonPayload = [
            'success'    => $isSuccess,
            'meta'       => $response['meta'] ?? [],
            'results'    => $response['results'] ?? [],
            'group_by'   => $response['group_by'] ?? [],
            'error'      => $response['meta']['error'] ?? null,
            'message'    => $response['meta']['message'] ?? null,
            'suggestion' => $response['meta']['suggestion'] ?? null,
        ];

        $res = response()->json($jsonPayload, $isSuccess ? 200 : $status);

        // Forward OpenAlex rate limit headers
        if (!empty($response['meta']['rate_limit_limit'])) {
            $res->header('X-RateLimit-Limit', (string) $response['meta']['rate_limit_limit']);
        }
        if (isset($response['meta']['rate_limit_remaining'])) {
            $res->header('X-RateLimit-Remaining', (string) $response['meta']['rate_limit_remaining']);
        }
        if (isset($response['meta']['rate_limit_credits_used'])) {
            $res->header('X-RateLimit-Credits-Used', (string) $response['meta']['rate_limit_credits_used']);
        }
        if (isset($response['meta']['rate_limit_reset'])) {
            $res->header('X-RateLimit-Reset', (string) $response['meta']['rate_limit_reset']);
        }

        return $res;
    }

    /**
     * GET /api/openalex/aggregate
     * Aggregate entities into groups with counts (Per OpenAlex Grouping Specification)
     * e.g. group_by=type, group_by=authorships.institutions.id, group_by=open_access.is_oa
     */
    public function aggregate(Request $request): JsonResponse
    {
        $field = $request->input('group_by', $request->input('field', 'type'));
        $request->merge(['group_by' => $field]);

        $res = $this->works($request);
        $data = $res->getData(true);

        // Normalize unknown sentinel keys (-111 or 'unknown') for frontend display
        $normalizedGroups = [];
        foreach ($data['group_by'] ?? [] as $group) {
            $key = $group['key'];
            $displayName = $group['key_display_name'];
            if ($key === -111 || $key === '-111' || $key === -111.0) {
                $displayName = 'Unknown / Unrecorded';
            } elseif ($key === 'unknown' || $key === null) {
                $displayName = 'Unknown / Unrecorded';
            }

            $normalizedGroups[] = array_merge($group, [
                'display_name' => $displayName ?: (string)$key,
            ]);
        }

        return response()->json([
            'success'      => $data['success'] ?? true,
            'meta'         => $data['meta'] ?? [],
            'groups'       => $normalizedGroups,
            'groups_count' => count($normalizedGroups),
            'field'        => $field,
        ]);
    }

    /**
     * GET /api/openalex/works/{id}
     * Get single scholarly work by OpenAlex ID or DOI
     */
    public function show(string $id): JsonResponse
    {
        $work = $this->openAlex->getWorkById($id);

        if (!$work) {
            return response()->json([
                'success' => false,
                'message' => 'Scholarly work not found on OpenAlex.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'work'    => $work,
        ]);
    }

    /**
     * GET /api/openalex/authors
     * Query authors endpoint
     */
    public function authors(Request $request): JsonResponse
    {
        $params = [
            'search'   => $request->input('search', ''),
            'page'     => max(1, (int) $request->input('page', 1)),
            'per_page' => min(50, max(1, (int) $request->input('per_page', 20))),
        ];

        $filters = [];
        if ($request->filled('filter')) {
            $filters[] = trim($request->input('filter'));
        }
        if ($request->boolean('has_orcid') || $request->input('has_orcid') === 'true') {
            $filters[] = 'has_orcid:true';
        }
        if ($request->filled('works_count')) {
            $val = trim($request->input('works_count'));
            $filters[] = 'works_count:' . (preg_match('/^[<>]/', $val) ? $val : '>' . (int)$val);
        }
        if ($request->filled('cited_by_count')) {
            $val = trim($request->input('cited_by_count'));
            $filters[] = 'cited_by_count:' . (preg_match('/^[<>]/', $val) ? $val : '>' . (int)$val);
        }
        if ($request->filled('institution_id')) {
            $filters[] = 'last_known_institutions.id:' . trim($request->input('institution_id'));
        }
        if ($request->filled('city')) {
            $filters[] = 'last_known_institutions.geo.city:' . trim($request->input('city'));
        }
        if (!empty($filters)) {
            $params['filter'] = implode(',', $filters);
        }
        if ($request->filled('sort')) {
            $params['sort'] = trim($request->input('sort'));
        }
        if ($request->filled('group_by')) {
            $params['group_by'] = trim($request->input('group_by'));
        }

        $res = $this->openAlex->getAuthors($params);

        return response()->json([
            'success'  => true,
            'meta'     => $res['meta'] ?? [],
            'results'  => $res['results'] ?? [],
            'group_by' => $res['group_by'] ?? [],
        ]);
    }

    /**
     * GET /api/openalex/sources
     * Query sources (journals, book series, repositories)
     */
    public function sources(Request $request): JsonResponse
    {
        $params = [
            'search'   => $request->input('search', ''),
            'page'     => max(1, (int) $request->input('page', 1)),
            'per_page' => min(50, max(1, (int) $request->input('per_page', 20))),
        ];

        $filters = [];
        if ($request->filled('filter')) {
            $filters[] = trim($request->input('filter'));
        }
        if ($request->boolean('is_oa') || $request->input('is_oa') === 'true') {
            $filters[] = 'is_oa:true';
        }
        if ($request->boolean('is_in_doaj') || $request->input('is_in_doaj') === 'true') {
            $filters[] = 'is_in_doaj:true';
        }
        if ($request->filled('country_code')) {
            $filters[] = 'country_code:' . trim($request->input('country_code'));
        }
        if ($request->filled('type')) {
            $filters[] = 'type:' . trim($request->input('type'));
        }
        if ($request->filled('host_organization_country')) {
            $filters[] = 'host_organization.country_code:' . trim($request->input('host_organization_country'));
        }
        if (!empty($filters)) {
            $params['filter'] = implode(',', $filters);
        }
        if ($request->filled('sort')) {
            $params['sort'] = trim($request->input('sort'));
        }
        if ($request->filled('group_by')) {
            $params['group_by'] = trim($request->input('group_by'));
        }

        $res = $this->openAlex->getSources($params);

        return response()->json([
            'success'  => true,
            'meta'     => $res['meta'] ?? [],
            'results'  => $res['results'] ?? [],
            'group_by' => $res['group_by'] ?? [],
        ]);
    }

    /**
     * GET /api/openalex/institutions
     * Query universities, colleges, and research bodies
     */
    public function institutions(Request $request): JsonResponse
    {
        $params = [
            'search'   => $request->input('search', ''),
            'page'     => max(1, (int) $request->input('page', 1)),
            'per_page' => min(50, max(1, (int) $request->input('per_page', 20))),
        ];

        $filters = [];
        if ($request->filled('filter')) {
            $filters[] = trim($request->input('filter'));
        }
        if ($request->filled('country_code')) {
            $filters[] = 'country_code:' . trim($request->input('country_code'));
        }
        if ($request->filled('type')) {
            $filters[] = 'type:' . trim($request->input('type'));
        }
        if ($request->boolean('is_global_south') || $request->input('is_global_south') === 'true') {
            $filters[] = 'is_global_south:true';
        }
        if ($request->filled('continent')) {
            $filters[] = 'continent:' . trim($request->input('continent'));
        }
        if (!empty($filters)) {
            $params['filter'] = implode(',', $filters);
        }
        if ($request->filled('sort')) {
            $params['sort'] = trim($request->input('sort'));
        }
        if ($request->filled('group_by')) {
            $params['group_by'] = trim($request->input('group_by'));
        }

        $res = $this->openAlex->getInstitutions($params);

        return response()->json([
            'success'  => true,
            'meta'     => $res['meta'] ?? [],
            'results'  => $res['results'] ?? [],
            'group_by' => $res['group_by'] ?? [],
        ]);
    }

    /**
     * GET /api/openalex/topics
     * Query academic topics / concepts taxonomy
     */
    public function topics(Request $request): JsonResponse
    {
        $params = [
            'search'   => $request->input('search', ''),
            'page'     => max(1, (int) $request->input('page', 1)),
            'per_page' => min(50, max(1, (int) $request->input('per_page', 25))),
        ];

        $filters = [];
        if ($request->filled('filter')) {
            $filters[] = trim($request->input('filter'));
        }
        if ($request->filled('domain_id')) {
            $filters[] = 'domain.id:' . trim($request->input('domain_id'));
        }
        if ($request->filled('field_id')) {
            $filters[] = 'field.id:' . trim($request->input('field_id'));
        }
        if ($request->filled('subfield_id')) {
            $filters[] = 'subfield.id:' . trim($request->input('subfield_id'));
        }
        if (!empty($filters)) {
            $params['filter'] = implode(',', $filters);
        }
        if ($request->filled('sort')) {
            $params['sort'] = trim($request->input('sort'));
        }
        if ($request->filled('group_by')) {
            $params['group_by'] = trim($request->input('group_by'));
        }

        $res = $this->openAlex->getTopics($params);

        return response()->json([
            'success'  => true,
            'meta'     => $res['meta'] ?? [],
            'results'  => $res['results'] ?? [],
            'group_by' => $res['group_by'] ?? [],
        ]);
    }

    /**
     * GET /api/openalex/publishers
     * Query publishing organizations
     */
    public function publishers(Request $request): JsonResponse
    {
        $params = [
            'search'   => $request->input('search', ''),
            'page'     => max(1, (int) $request->input('page', 1)),
            'per_page' => min(50, max(1, (int) $request->input('per_page', 25))),
        ];

        $filters = [];
        if ($request->filled('filter')) {
            $filters[] = trim($request->input('filter'));
        }
        if ($request->filled('country_codes')) {
            $filters[] = 'country_codes:' . trim($request->input('country_codes'));
        }
        if (!empty($filters)) {
            $params['filter'] = implode(',', $filters);
        }
        if ($request->filled('sort')) {
            $params['sort'] = trim($request->input('sort'));
        }
        if ($request->filled('group_by')) {
            $params['group_by'] = trim($request->input('group_by'));
        }

        $res = $this->openAlex->getPublishers($params);

        return response()->json([
            'success'  => true,
            'meta'     => $res['meta'] ?? [],
            'results'  => $res['results'] ?? [],
            'group_by' => $res['group_by'] ?? [],
        ]);
    }

    /**
     * GET /api/openalex/funders
     * Query funding agencies and grant providers
     */
    public function funders(Request $request): JsonResponse
    {
        $params = [
            'search'   => $request->input('search', ''),
            'page'     => max(1, (int) $request->input('page', 1)),
            'per_page' => min(50, max(1, (int) $request->input('per_page', 25))),
        ];

        $filters = [];
        if ($request->filled('filter')) {
            $filters[] = trim($request->input('filter'));
        }
        if ($request->filled('country_code')) {
            $filters[] = 'country_code:' . trim($request->input('country_code'));
        }
        if ($request->boolean('is_global_south') || $request->input('is_global_south') === 'true') {
            $filters[] = 'is_global_south:true';
        }
        if ($request->filled('continent')) {
            $filters[] = 'continent:' . trim($request->input('continent'));
        }
        if (!empty($filters)) {
            $params['filter'] = implode(',', $filters);
        }
        if ($request->filled('sort')) {
            $params['sort'] = trim($request->input('sort'));
        }
        if ($request->filled('group_by')) {
            $params['group_by'] = trim($request->input('group_by'));
        }

        $res = $this->openAlex->getFunders($params);

        return response()->json([
            'success'  => true,
            'meta'     => $res['meta'] ?? [],
            'results'  => $res['results'] ?? [],
            'group_by' => $res['group_by'] ?? [],
        ]);
    }

    /**
     * GET /api/openalex/resolve
     * Two-Step ID Resolution endpoint per OpenAlex LLM guide:
     * Resolves ambiguous names to canonical OpenAlex ID.
     */
    public function resolve(Request $request): JsonResponse
    {
        $type = $request->input('type', 'author');
        $name = $request->input('name', $request->input('q', ''));

        if (trim($name) === '') {
            return response()->json([
                'success' => false,
                'message' => 'Query name is required for entity resolution.',
            ], 422);
        }

        $resolution = $this->openAlex->resolveEntity($type, $name);

        if (!$resolution) {
            return response()->json([
                'success' => false,
                'message' => "No {$type} entity found matching '{$name}'.",
            ], 404);
        }

        return response()->json([
            'success'    => true,
            'resolution' => $resolution,
        ]);
    }

    /**
     * GET /api/openalex/saved
     * List all scholarly papers saved into the library database
     */
    public function savedWorks(Request $request): JsonResponse
    {
        $query = OpenAlexWork::where('is_saved', true)->orderBy('created_at', 'desc');

        if ($request->filled('saved_by')) {
            $query->where('saved_by', $request->input('saved_by'));
        }

        if ($request->filled('type') && $request->input('type') !== 'all') {
            $query->where('type', $request->input('type'));
        }

        if ($request->filled('q')) {
            $term = '%' . trim($request->input('q')) . '%';
            $query->where(function ($q) use ($term) {
                $q->where('title', 'like', $term)
                  ->orWhere('abstract', 'like', $term)
                  ->orWhere('primary_source', 'like', $term);
            });
        }

        $saved = $query->paginate(30);

        return response()->json([
            'success' => true,
            'data'    => $saved->items(),
            'total'   => $saved->total(),
            'current_page' => $saved->currentPage(),
            'last_page'    => $saved->lastPage(),
        ]);
    }

    /**
     * POST /api/openalex/save
     * Persist an OpenAlex work into the institutional library database
     */
    public function saveWork(Request $request): JsonResponse
    {
        $raw = $request->input('work', $request->all());

        if (empty($raw['id']) && empty($raw['openalex_id'])) {
            return response()->json([
                'success' => false,
                'message' => 'Work ID or OpenAlex URL is required.',
            ], 422);
        }

        $cleanId = preg_replace('#^.*?([A-Za-z0-9]+)$#', '$1', $raw['id'] ?? $raw['openalex_id']);

        $savedBy = $request->input('saved_by', auth()->id() ?? 'FCC-SCHOLAR');
        $notes = $request->input('notes', '');

        $work = OpenAlexWork::updateOrCreate(
            ['id' => $cleanId],
            [
                'openalex_id'      => $raw['openalex_id'] ?? "https://openalex.org/{$cleanId}",
                'doi'              => $raw['doi'] ?? null,
                'title'            => $raw['title'] ?? 'Untitled Scholarly Work',
                'display_name'     => $raw['display_name'] ?? ($raw['title'] ?? null),
                'publication_year' => $raw['publication_year'] ?? null,
                'publication_date' => $raw['publication_date'] ?? null,
                'type'             => $raw['type'] ?? 'article',
                'type_crossref'    => $raw['type_crossref'] ?? null,
                'authors'          => $raw['authors'] ?? [],
                'primary_source'   => $raw['primary_source'] ?? null,
                'host_venue'       => $raw['host_venue'] ?? null,
                'publisher'        => $raw['publisher'] ?? null,
                'abstract'         => $raw['abstract'] ?? null,
                'is_oa'            => (bool) ($raw['is_oa'] ?? false),
                'oa_status'        => $raw['oa_status'] ?? 'closed',
                'oa_url'           => $raw['oa_url'] ?? null,
                'pdf_url'          => $raw['pdf_url'] ?? null,
                'cited_by_count'   => (int) ($raw['cited_by_count'] ?? 0),
                'topics'           => $raw['topics'] ?? [],
                'concepts'         => $raw['concepts'] ?? [],
                'language'         => $raw['language'] ?? 'en',
                'biblio'           => $raw['biblio'] ?? [],
                'openalex_url'     => $raw['openalex_url'] ?? "https://openalex.org/{$cleanId}",
                'saved_by'         => $savedBy,
                'notes'            => $notes,
                'is_saved'         => true,
                'cached_raw'       => json_encode($raw),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Scholarly work successfully saved to institutional library repository.',
            'work'    => $work,
        ]);
    }

    /**
     * DELETE /api/openalex/saved/{id}
     * Remove or unsave an OpenAlex work from the local database
     */
    public function removeSavedWork(string $id): JsonResponse
    {
        $cleanId = preg_replace('#^.*?([A-Za-z0-9]+)$#', '$1', $id);
        $work = OpenAlexWork::find($cleanId);

        if ($work) {
            $work->update(['is_saved' => false]);
            // Or completely delete:
            $work->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Work removed from institutional saved repository.',
        ]);
    }

    /**
     * GET /api/openalex/rate-limit
     * Returns rate limit and cache performance statistics
     */
    public function rateLimit(): JsonResponse
    {
        $totalCachedQueries = OpenAlexQueryCache::count();
        $totalSavedWorks = OpenAlexWork::where('is_saved', true)->count();
        $totalHits = OpenAlexQueryCache::sum('hits_count');
        $liveTelemetry = $this->openAlex->getRateLimitTelemetry();

        return response()->json([
            'success' => true,
            'gateway' => 'FCC OpenAlex Academic Proxy',
            'api_base' => 'https://api.openalex.org',
            'status' => 'operational',
            'rate_limit' => $liveTelemetry,
            'stats' => [
                'cached_queries' => $totalCachedQueries,
                'cache_hits'     => (int) $totalHits,
                'saved_works'    => $totalSavedWorks,
            ],
        ]);
    }

    /**
     * GET or POST /api/openalex/oql
     * Execute an OQL (OpenAlex Query Language) or OQO query at the API root.
     * Supports ?oql=..., ?oqo=..., or POST JSON body per the OpenAlex OQL API Specification.
     */
    public function executeOql(Request $request): JsonResponse
    {
        $method = $request->method();
        $payload = $method === 'POST' ? ($request->json()->all() ?: $request->all()) : $request->all();

        if (empty($payload['oql']) && empty($payload['oqo'])) {
            return response()->json([
                'success' => false,
                'error'   => 'MISSING_QUERY',
                'message' => 'Please provide either an "oql" text query (e.g. "works where year is (2024)") or an "oqo" JSON object.',
            ], 400);
        }

        $response = $this->openAlex->executeOql($payload, $method);

        $status = $response['meta']['status'] ?? 200;
        $isSuccess = $status < 400 || !empty($response['meta']['stale']);

        return response()->json([
            'success'    => $isSuccess,
            'meta'       => $response['meta'] ?? [],
            'results'    => $response['results'] ?? [],
            'group_by'   => $response['group_by'] ?? [],
            'validation' => $response['meta']['validation'] ?? null,
            'error'      => $response['meta']['error'] ?? null,
            'message'    => $response['meta']['message'] ?? null,
            'suggestion' => $response['meta']['suggestion'] ?? null,
        ], $isSuccess ? 200 : $status);
    }

    /**
     * GET /api/openalex/query/oql/{query}
     * Translate an OQL query string to canonical OQO, classic URL, and AST tree
     */
    public function translateOql(Request $request, string $query): JsonResponse
    {
        $res = $this->openAlex->translateQuery([], 'oql', $query);
        $status = $res['status'] ?? (isset($res['error']) ? 400 : 200);
        return response()->json($res, $status >= 400 ? $status : 200);
    }

    /**
     * GET /api/openalex/query/oxurl/{query}
     * Translate a classic OpenAlex URL to OQL and OQO
     */
    public function translateOxurl(Request $request, string $query): JsonResponse
    {
        $res = $this->openAlex->translateQuery([], 'oxurl', $query);
        $status = $res['status'] ?? (isset($res['error']) ? 400 : 200);
        return response()->json($res, $status >= 400 ? $status : 200);
    }

    /**
     * GET /api/openalex/query/oqo/{query}
     * Translate an OQO JSON string to OQL and classic URL
     */
    public function translateOqo(Request $request, string $query): JsonResponse
    {
        $res = $this->openAlex->translateQuery([], 'oqo', $query);
        $status = $res['status'] ?? (isset($res['error']) ? 400 : 200);
        return response()->json($res, $status >= 400 ? $status : 200);
    }

    /**
     * POST /api/openalex/query
     * Translate any query format (body: {"oql": ...} or {"oxurl": ...} or {"oqo": ...})
     */
    public function translateQuery(Request $request): JsonResponse
    {
        $payload = $request->json()->all() ?: $request->all();

        if (empty($payload['oql']) && empty($payload['oxurl']) && empty($payload['oqo'])) {
            return response()->json([
                'success' => false,
                'error'   => 'MISSING_FORMAT',
                'message' => 'Body must contain exactly one of "oql", "oxurl", or "oqo".',
            ], 400);
        }

        $res = $this->openAlex->translateQuery($payload);
        $status = $res['status'] ?? (isset($res['error']) ? 400 : 200);
        return response()->json($res, $status >= 400 ? $status : 200);
    }

    /**
     * GET /api/openalex/properties/{entity?}
     * Returns schema properties and operators registry for OpenAlex entities
     */
    public function properties(Request $request, ?string $entity = null): JsonResponse
    {
        $props = $this->openAlex->getProperties($entity);
        return response()->json($props);
    }

    /**
     * GET /api/openalex/validate?q=...
     * Lints an OQL string with stable error codes, spans, and fix-its
     */
    public function validateOql(Request $request): JsonResponse
    {
        $q = $request->input('q', $request->input('query', ''));
        if (trim($q) === '') {
            return response()->json(['valid' => false, 'message' => 'Empty query.'], 400);
        }
        $diag = $this->openAlex->validateOql($q);
        return response()->json($diag);
    }

    /**
     * GET /api/openalex/parse-context?q=...&pos=...
     * Returns grammar suggestions and autocomplete expectations for an OQL string
     */
    public function parseContext(Request $request): JsonResponse
    {
        $q = $request->input('q', $request->input('query', ''));
        $pos = (int) $request->input('pos', $request->input('position', 0));
        $context = $this->openAlex->parseContext($q, $pos);
        return response()->json($context);
    }

    /**
     * GET /api/openalex/autocomplete/{entity}?q=...
     * Fast type-ahead suggestions for any entity type (works, authors, sources, institutions, topics, etc.)
     */
    public function autocomplete(Request $request, string $entity): JsonResponse
    {
        $q = trim((string) $request->input('q', $request->input('query', '')));
        if ($q === '') {
            return response()->json(['meta' => ['count' => 0], 'results' => []]);
        }

        $params = $request->except(['q', 'query']);
        $result = $this->openAlex->autocomplete($entity, $q, $params);
        return response()->json($result);
    }

    /**
     * GET or POST /api/openalex/text
     * Tag arbitrary text with topics, keywords, and SDGs (OpenAlex Tag Aboutness API)
     */
    public function tagText(Request $request): JsonResponse
    {
        $title = trim((string) $request->input('title', ''));
        $abstract = trim((string) $request->input('abstract', $request->input('text', '')));

        if ($title === '' && $abstract === '') {
            return response()->json([
                'error'   => 'MISSING_TEXT',
                'message' => 'Please provide a "title" or "abstract" query parameter / JSON field to tag aboutness.',
            ], 400);
        }

        $result = $this->openAlex->tagText($title, $abstract);
        return response()->json($result);
    }

    /**
     * Universal OpenAlex Entity endpoint proxy (List or Single Entity)
     * Supports:
     * - Entities: works, authors, sources, institutions, publishers, funders, awards
     * - Components: locations, raw-affiliation-strings
     * - Aboutness: topics, subfields, fields, domains, keywords, sdgs, study-designs, concepts
     * - Vocabularies: work-types, source-types, institution-types, countries, continents, languages, licenses, indexes, source-lists
     * - Special: collections, curations, saved-searches
     *
     * GET /api/openalex/entity/{endpoint}/{id?}
     */
    public function entity(Request $request, string $endpoint, ?string $id = null): JsonResponse
    {
        $cleanEndpoint = strtolower(trim($endpoint));
        $target = $id ? "{$cleanEndpoint}/" . ltrim($id, '/') : $cleanEndpoint;

        $params = $request->all();

        $response = $this->openAlex->queryEndpoint($target, $params);

        $status = $response['meta']['status'] ?? 200;
        $isSuccess = $status < 400 || !empty($response['meta']['stale']);

        return response()->json([
            'success'  => $isSuccess,
            'meta'     => $response['meta'] ?? [],
            'results'  => $response['results'] ?? [],
            'group_by' => $response['group_by'] ?? [],
            'error'    => $response['meta']['error'] ?? null,
            'message'  => $response['meta']['message'] ?? null,
        ], $isSuccess ? 200 : $status);
    }
}
