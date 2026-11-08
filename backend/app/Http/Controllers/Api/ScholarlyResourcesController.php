<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Client\Pool;
use Illuminate\Http\Client\Response as HttpResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

/**
 * Federated Scholarly E-Resources Engine (v3)
 * ===========================================
 * AGORA (Research4Life) • JSTOR • ScienceDirect / Scopus • EBSCOhost • DOAJ • Europe PMC
 *
 * Upgrades over v2:
 *  - All platforms are queried CONCURRENTLY (Http::pool) instead of one-by-one
 *    (worst case drops from ~30s to ~8s).
 *  - Correct JSTOR Crossref member (1121) – the old filter (member:340) returned
 *    non-JSTOR records.
 *  - AGORA now uses OpenAlex subject-field filtering (Agriculture, Environment,
 *    Veterinary) instead of a hard-coded keyword string, so results are relevant.
 *  - ScienceDirect falls back to Elsevier's Crossref member (78) if Scopus fails.
 *  - Abstracts, keywords, publisher, document type, APA citation per record.
 *  - Filters: open-access only, year range, sort (relevance | newest | citations),
 *    pagination (page), and per-platform selection.
 *  - Duplicate DOIs across platforms are merged ("also_in").
 *  - Per-platform health report (status, latency, result count, total available).
 *  - Stable record IDs (no more rand()), and empty responses are never cached.
 */
class ScholarlyResourcesController extends Controller
{
    private const USER_AGENT = 'FCCSmartLibrary/3.0 (mailto:library@fccibadanlibrary.com.ng)';
    private const TIMEOUT = 8;

    /** Platform registry (display metadata) */
    private const PLATFORMS = [
        'sciencedirect' => [
            'name' => 'ScienceDirect', 'label' => 'Elsevier ScienceDirect & Scopus',
            'badge' => '🔬 ScienceDirect', 'color' => '#ff6f00',
            'portal' => 'https://www.sciencedirect.com/',
            'search' => 'https://www.sciencedirect.com/search?qs=',
            'discipline' => 'Science, Technology & Medicine',
        ],
        'agora' => [
            'name' => 'AGORA (Research4Life)', 'label' => 'AGORA – Research4Life / FAO',
            'badge' => '🌾 AGORA', 'color' => '#16a34a',
            'portal' => 'https://agora.research4life.org/',
            'search' => 'https://agris.fao.org/search/en?query=',
            'discipline' => 'Agriculture, Food & Environmental Sciences',
        ],
        'jstor' => [
            'name' => 'JSTOR', 'label' => 'JSTOR Digital Library',
            'badge' => '🏛️ JSTOR', 'color' => '#b91c1c',
            'portal' => 'https://www.jstor.org/',
            'search' => 'https://www.jstor.org/action/doBasicSearch?Query=',
            'discipline' => 'Humanities, Social Sciences & Economics',
        ],
        'ebsco' => [
            'name' => 'EBSCOhost', 'label' => 'EBSCOhost Research Databases',
            'badge' => '📚 EBSCOhost', 'color' => '#2563eb',
            'portal' => 'https://search.ebscohost.com/',
            'search' => 'https://search.ebscohost.com/login.aspx?direct=true&scope=site&bquery=',
            'discipline' => 'Business, Management & Multidisciplinary',
        ],
        'doaj' => [
            'name' => 'DOAJ', 'label' => 'Directory of Open Access Journals',
            'badge' => '🌐 DOAJ', 'color' => '#ca8a04',
            'portal' => 'https://doaj.org/',
            'search' => 'https://doaj.org/search/articles?ref=homepage-box&source=%7B%22query%22%3A%7B%22query_string%22%3A%7B%22query%22%3A%22',
            'discipline' => 'Open Access Scholarly Serials',
        ],
        'europe_pmc' => [
            'name' => 'Europe PMC', 'label' => 'Europe PMC Life Sciences',
            'badge' => '🧬 Europe PMC', 'color' => '#059669',
            'portal' => 'https://europepmc.org/',
            'search' => 'https://europepmc.org/search?query=',
            'discipline' => 'Life, Agricultural & Biomedical Sciences',
        ],
    ];

    private const ALIASES = [
        'elsevier' => 'sciencedirect', 'scopus' => 'sciencedirect',
        'research4life' => 'agora', 'agris' => 'agora',
        'ebscohost' => 'ebsco', 'pmc' => 'europe_pmc', 'europepmc' => 'europe_pmc',
    ];

    /**
     * Retrieve live Developer External Library APIs configuration
     */
    protected function getExternalApisConfig(): array
    {
        try {
            $row = DB::table('library_settings')
                ->where('setting_key', 'fcc_developer_master_config')
                ->first();
            if ($row && !empty($row->setting_value)) {
                $cfg = json_decode($row->setting_value, true);
                if (!empty($cfg['externalLibraryApis']) && is_array($cfg['externalLibraryApis'])) {
                    return $cfg['externalLibraryApis'];
                }
            }
        } catch (\Throwable $e) {}

        return [];
    }

    /**
     * Check if a specific external library API is enabled by the developer
     */
    protected function isApiEnabled(string $apiId, array $config): bool
    {
        if (isset($config[$apiId])) {
            return !empty($config[$apiId]['enabled']);
        }
        return true; // Default enabled unless developer toggles OFF
    }

    /**
     * GET /api/scholarly/platforms – platform registry + developer status
     */
    public function platforms()
    {
        $cfg = $this->getExternalApisConfig();
        $out = [];
        foreach (self::PLATFORMS as $id => $p) {
            $out[] = array_merge(['id' => $id, 'enabled' => $this->isApiEnabled($id, $cfg)], $p);
        }
        return response()->json(['success' => true, 'platforms' => $out]);
    }

    /**
     * Unified Federated E-Resource Search across AGORA, JSTOR, ScienceDirect, EBSCOhost, DOAJ and Europe PMC.
     *
     * Query params:
     *  query|q, platform|platforms (all | comma list), per_page (2-25), page (>=1),
     *  oa_only (0|1), year_from, year_to, sort (relevance|newest|citations), refresh (0|1)
     */
    public function search(Request $request)
    {
        $rawQuery = trim((string) $request->input('query', $request->input('q', '')));
        $rawQuery = mb_substr(preg_replace('/[<>"{}\\\\]/u', ' ', $rawQuery), 0, 200);
        if ($rawQuery === '') {
            $rawQuery = 'cooperative agriculture economics';
        }

        $perPlatform = max(2, min((int) $request->input('per_page', 8), 25));
        $page = max(1, min((int) $request->input('page', 1), 20));
        $oaOnly = filter_var($request->input('oa_only', false), FILTER_VALIDATE_BOOLEAN);
        $sort = in_array($request->input('sort'), ['newest', 'citations', 'relevance'], true) ? $request->input('sort') : 'relevance';
        $currentYear = (int) date('Y');
        $yearFrom = (int) $request->input('year_from', 0);
        $yearTo = (int) $request->input('year_to', 0);
        $yearFrom = ($yearFrom >= 1800 && $yearFrom <= $currentYear + 1) ? $yearFrom : null;
        $yearTo = ($yearTo >= 1800 && $yearTo <= $currentYear + 1) ? $yearTo : null;
        if ($yearFrom && $yearTo && $yearFrom > $yearTo) {
            [$yearFrom, $yearTo] = [$yearTo, $yearFrom];
        }

        $apiConfig = $this->getExternalApisConfig();
        $requested = $this->resolvePlatforms((string) $request->input('platform', $request->input('platforms', 'all')));

        $active = array_values(array_filter($requested, fn ($p) => $this->isApiEnabled($p, $apiConfig)));

        $opts = compact('perPlatform', 'page', 'oaOnly', 'yearFrom', 'yearTo', 'sort');
        $cacheKey = 'scholarly_v3_' . md5(json_encode([$rawQuery, $active, $opts]));

        if (!$request->boolean('refresh')) {
            $cached = Cache::get($cacheKey);
            if ($cached) {
                $cached['cached'] = true;
                return response()->json($cached);
            }
        }

        $started = microtime(true);
        $responses = [];
        if (!empty($active)) {
            try {
                $responses = Http::pool(function (Pool $pool) use ($active, $rawQuery, $opts) {
                    $reqs = [];
                    foreach ($active as $platform) {
                        $reqs[] = $this->buildPoolRequest($pool, $platform, $rawQuery, $opts);
                    }
                    return $reqs;
                });
            } catch (\Throwable $e) {
                $responses = [];
            }
        }

        $byPlatform = [];
        $health = [];

        foreach (array_keys(self::PLATFORMS) as $platform) {
            $meta = self::PLATFORMS[$platform];
            $entry = [
                'id' => $platform, 'name' => $meta['name'], 'label' => $meta['label'],
                'badge' => $meta['badge'], 'color' => $meta['color'],
                'portal_url' => $meta['portal'],
                'search_url' => $meta['search'] . rawurlencode($rawQuery),
                'status' => 'skipped', 'count' => 0, 'total_available' => 0, 'latency_ms' => null, 'error' => null,
            ];

            if (!$this->isApiEnabled($platform, $apiConfig)) {
                $entry['status'] = 'disabled';
                $health[] = $entry;
                continue;
            }
            if (!in_array($platform, $active, true)) {
                $health[] = $entry;
                continue;
            }

            $res = $responses[$platform] ?? null;
            $items = [];
            $total = 0;

            if ($res instanceof HttpResponse && $res->successful()) {
                try {
                    [$items, $total] = $this->parsePlatform($platform, $res->json() ?? [], $rawQuery, $opts);
                    $entry['status'] = 'ok';
                } catch (\Throwable $e) {
                    $entry['status'] = 'error';
                    $entry['error'] = 'Unexpected response format';
                }
                $entry['latency_ms'] = $this->latencyOf($res);
            } else {
                $entry['status'] = 'error';
                $entry['error'] = $res instanceof HttpResponse
                    ? ('HTTP ' . $res->status())
                    : ($res instanceof \Throwable ? 'Connection timeout / unreachable' : 'No response');
            }

            // ScienceDirect fallback: Elsevier records via Crossref (member 78)
            if ($platform === 'sciencedirect' && empty($items)) {
                try {
                    $fb = Http::withHeaders(['User-Agent' => self::USER_AGENT])
                        ->timeout(self::TIMEOUT)
                        ->get('https://api.crossref.org/works', $this->crossrefParams($rawQuery, $opts, 'member:78'));
                    if ($fb->successful()) {
                        [$items, $total] = $this->parseCrossref($fb->json() ?? [], 'sciencedirect', $opts);
                        if (!empty($items)) {
                            $entry['status'] = 'ok';
                            $entry['error'] = null;
                            $entry['fallback'] = 'Crossref (Elsevier member 78)';
                        }
                    }
                } catch (\Throwable $e) {}
            }

            $items = $this->postFilter($items, $opts);
            $entry['count'] = count($items);
            $entry['total_available'] = (int) $total;
            $byPlatform[$platform] = $items;
            $health[] = $entry;
        }

        $results = $this->mergeAndRank($byPlatform, $sort);

        // Facets
        $years = [];
        $oaCount = 0;
        $pdfCount = 0;
        foreach ($results as $r) {
            if (!empty($r['year'])) {
                $years[$r['year']] = ($years[$r['year']] ?? 0) + 1;
            }
            if (!empty($r['is_open_access'])) $oaCount++;
            if (!empty($r['pdf_url'])) $pdfCount++;
        }
        krsort($years);

        $countBy = fn (string $name) => count(array_filter($results, fn ($r) => $r['platform'] === $name));

        $payload = [
            'success' => true,
            'engine' => 'FCC Federated Scholarly Engine v3',
            'query' => $rawQuery,
            'page' => $page,
            'per_page' => $perPlatform,
            'filters' => [
                'oa_only' => $oaOnly, 'year_from' => $yearFrom, 'year_to' => $yearTo, 'sort' => $sort,
                'platforms' => $active,
            ],
            'total_matches' => count($results),
            'total_available' => array_sum(array_column($health, 'total_available')),
            'has_more' => (bool) array_filter($health, fn ($h) => $h['total_available'] > $page * $perPlatform),
            'took_ms' => (int) round((microtime(true) - $started) * 1000),
            'facets' => [
                'open_access' => $oaCount,
                'with_pdf' => $pdfCount,
                'years' => array_slice($years, 0, 15, true),
            ],
            'platforms' => $health,
            // Backwards-compatible summary fields
            'platforms_included' => [
                'ScienceDirect' => $countBy('ScienceDirect'),
                'AGORA' => $countBy('AGORA (Research4Life)'),
                'JSTOR' => $countBy('JSTOR'),
                'EBSCOhost' => $countBy('EBSCOhost'),
                'DOAJ' => $countBy('DOAJ'),
                'Europe PMC' => $countBy('Europe PMC'),
            ],
            'api_status' => array_combine(
                array_keys(self::PLATFORMS),
                array_map(fn ($p) => $this->isApiEnabled($p, $apiConfig), array_keys(self::PLATFORMS))
            ),
            'results' => $results,
            'cached' => false,
        ];

        if (count($results) > 0) {
            Cache::put($cacheKey, $payload, now()->addMinutes(30));
        }

        return response()->json($payload);
    }

    // ---------------------------------------------------------------------
    // Request building
    // ---------------------------------------------------------------------

    private function resolvePlatforms(string $filter): array
    {
        $filter = strtolower(trim($filter));
        if ($filter === '' || $filter === 'all') {
            return array_keys(self::PLATFORMS);
        }
        $out = [];
        foreach (preg_split('/[\s,|]+/', $filter) as $p) {
            $p = self::ALIASES[$p] ?? $p;
            if (isset(self::PLATFORMS[$p]) && !in_array($p, $out, true)) {
                $out[] = $p;
            }
        }
        return $out ?: array_keys(self::PLATFORMS);
    }

    private function buildPoolRequest(Pool $pool, string $platform, string $q, array $o)
    {
        $limit = $o['perPlatform'];
        $page = $o['page'];
        $base = $pool->as($platform)->withHeaders(['User-Agent' => self::USER_AGENT, 'Accept' => 'application/json'])->timeout(self::TIMEOUT);

        switch ($platform) {
            case 'sciencedirect':
                $scopusQ = 'TITLE-ABS-KEY(' . $q . ')';
                if ($o['yearFrom']) $scopusQ .= ' AND PUBYEAR > ' . ($o['yearFrom'] - 1);
                if ($o['yearTo']) $scopusQ .= ' AND PUBYEAR < ' . ($o['yearTo'] + 1);
                if ($o['oaOnly']) $scopusQ .= ' AND OPENACCESS(1)';
                $params = ['query' => $scopusQ, 'count' => $limit, 'start' => ($page - 1) * $limit, 'view' => 'STANDARD'];
                if ($o['sort'] === 'newest') $params['sort'] = '-coverDate';
                if ($o['sort'] === 'citations') $params['sort'] = '-citedby-count';
                return $base->withHeaders(['X-ELS-APIKey' => env('ELSEVIER_API_KEY', 'bf3c85cf8f30e3518e1f3ce95244187c')])
                    ->get('https://api.elsevier.com/content/search/scopus', $params);

            case 'agora':
                return $base->get('https://api.openalex.org/works', $this->openAlexParams($q, $o, 'primary_topic.field.id:fields/11|fields/23|fields/34'));

            case 'ebsco':
                return $base->get('https://api.openalex.org/works', $this->openAlexParams($q, $o, 'primary_topic.field.id:fields/14|fields/20|fields/33|fields/18|fields/17'));

            case 'jstor':
                $params = $this->crossrefParams($q, $o, 'member:1121');
                $params['filter'] .= ',type:journal-article';
                // Over-fetch slightly so front/back-matter records can be dropped without short pages.
                $params['rows'] = min($o['perPlatform'] + 6, 40);
                return $base->get('https://api.crossref.org/works', $params);

            case 'doaj':
                $dq = $q;
                if ($o['yearFrom'] || $o['yearTo']) {
                    $dq = '(' . $q . ') AND bibjson.year:[' . ($o['yearFrom'] ?: 1800) . ' TO ' . ($o['yearTo'] ?: date('Y') + 1) . ']';
                }
                $params = ['pageSize' => $limit, 'page' => $page];
                if ($o['sort'] === 'newest') $params['sort'] = 'created_date:desc';
                return $base->get('https://doaj.org/api/search/articles/' . rawurlencode($dq), $params);

            case 'europe_pmc':
                $eq = $q;
                if ($o['oaOnly']) $eq .= ' AND OPEN_ACCESS:y';
                if ($o['yearFrom'] || $o['yearTo']) {
                    $eq .= ' AND PUB_YEAR:[' . ($o['yearFrom'] ?: 1800) . ' TO ' . ($o['yearTo'] ?: date('Y') + 1) . ']';
                }
                if ($o['sort'] === 'newest') $eq .= ' sort_date:y';
                if ($o['sort'] === 'citations') $eq .= ' sort_cited:y';
                // Europe PMC uses cursors; fetch enough rows to cover the requested page and slice later.
                return $base->get('https://www.ebi.ac.uk/europepmc/webservices/rest/search', [
                    'query' => $eq, 'format' => 'json', 'resultType' => 'core',
                    'pageSize' => min($limit * $page, 200),
                ]);
        }

        return $base->get('about:blank');
    }

    private function openAlexParams(string $q, array $o, string $fieldFilter): array
    {
        $filters = [$fieldFilter];
        if ($o['oaOnly']) $filters[] = 'is_oa:true';
        if ($o['yearFrom'] || $o['yearTo']) {
            $filters[] = 'publication_year:' . ($o['yearFrom'] ?: 1800) . '-' . ($o['yearTo'] ?: date('Y') + 1);
        }
        $params = [
            'search' => $q,
            'filter' => implode(',', $filters),
            'per-page' => $o['perPlatform'],
            'page' => $o['page'],
            'select' => 'id,doi,title,authorships,publication_year,primary_location,open_access,best_oa_location,cited_by_count,biblio,abstract_inverted_index,type,keywords,primary_topic',
        ];
        if ($o['sort'] === 'newest') $params['sort'] = 'publication_date:desc';
        if ($o['sort'] === 'citations') $params['sort'] = 'cited_by_count:desc';
        if ($mail = env('OPENALEX_MAILTO')) $params['mailto'] = $mail;
        if ($key = env('OPENALEX_API_KEY')) $params['api_key'] = $key;
        return $params;
    }

    private function crossrefParams(string $q, array $o, string $memberFilter): array
    {
        $filters = [$memberFilter];
        if ($o['yearFrom']) $filters[] = 'from-pub-date:' . $o['yearFrom'];
        if ($o['yearTo']) $filters[] = 'until-pub-date:' . $o['yearTo'] . '-12-31';
        $params = [
            'query.bibliographic' => $q,
            'filter' => implode(',', $filters),
            'rows' => $o['perPlatform'],
            'offset' => ($o['page'] - 1) * $o['perPlatform'],
            'select' => 'DOI,title,author,container-title,published-print,published-online,issued,ISSN,volume,issue,page,is-referenced-by-count,link,license,abstract,type,publisher,URL',
        ];
        if ($o['sort'] === 'newest') { $params['sort'] = 'published'; $params['order'] = 'desc'; }
        elseif ($o['sort'] === 'citations') { $params['sort'] = 'is-referenced-by-count'; $params['order'] = 'desc'; }
        else { $params['sort'] = 'relevance'; }
        return $params;
    }

    // ---------------------------------------------------------------------
    // Parsing
    // ---------------------------------------------------------------------

    private function parsePlatform(string $platform, array $data, string $q, array $o): array
    {
        switch ($platform) {
            case 'sciencedirect': return $this->parseScopus($data);
            case 'agora':
            case 'ebsco': return $this->parseOpenAlex($data, $platform);
            case 'jstor': return $this->parseCrossref($data, 'jstor', $o);
            case 'doaj': return $this->parseDoaj($data);
            case 'europe_pmc':
                [$items, $total] = $this->parseEuropePmc($data);
                $offset = ($o['page'] - 1) * $o['perPlatform'];
                return [array_slice($items, $offset, $o['perPlatform']), $total];
        }
        return [[], 0];
    }

    private function parseScopus(array $data): array
    {
        $entries = $data['search-results']['entry'] ?? [];
        $total = (int) ($data['search-results']['opensearch:totalResults'] ?? 0);
        $items = [];
        foreach ($entries as $e) {
            if (empty($e['dc:title']) || isset($e['error'])) continue;
            $doi = $e['prism:doi'] ?? null;
            $link = null;
            foreach ($e['link'] ?? [] as $lk) {
                if (($lk['@ref'] ?? '') === 'scopus') { $link = $lk['@href']; }
            }
            $isOa = !empty($e['openaccess']) && (string) $e['openaccess'] === '1';
            $items[] = $this->record('sciencedirect', [
                'key' => $doi ?: ($e['dc:identifier'] ?? $e['dc:title']),
                'title' => $e['dc:title'],
                'author' => $e['dc:creator'] ?? null,
                'source' => $e['prism:publicationName'] ?? 'Elsevier Journal',
                'year' => isset($e['prism:coverDate']) ? (int) substr($e['prism:coverDate'], 0, 4) : null,
                'doi' => $doi,
                'issn' => $e['prism:issn'] ?? ($e['prism:eIssn'] ?? null),
                'volume' => $e['prism:volume'] ?? null,
                'issue' => $e['prism:issueIdentifier'] ?? null,
                'pages' => $e['prism:pageRange'] ?? null,
                'type' => $e['subtypeDescription'] ?? 'Article',
                'publisher' => 'Elsevier',
                'is_open_access' => $isOa,
                'url' => $doi ? "https://doi.org/{$doi}" : ($link ?: self::PLATFORMS['sciencedirect']['portal']),
                'pdf_url' => null,
                'citations' => (int) ($e['citedby-count'] ?? 0),
            ]);
        }
        return [$items, $total];
    }

    private function parseOpenAlex(array $data, string $platform): array
    {
        $total = (int) ($data['meta']['count'] ?? 0);
        $items = [];
        foreach ($data['results'] ?? [] as $w) {
            if (empty($w['title'])) continue;
            $names = [];
            foreach (array_slice($w['authorships'] ?? [], 0, 4) as $a) {
                if (!empty($a['author']['display_name'])) $names[] = $a['author']['display_name'];
            }
            $doi = !empty($w['doi']) ? preg_replace('#^https?://(dx\.)?doi\.org/#i', '', $w['doi']) : null;
            $isOa = !empty($w['open_access']['is_oa']);
            $pdf = $w['best_oa_location']['pdf_url'] ?? null;
            $keywords = array_slice(array_values(array_filter(array_map(fn ($k) => $k['display_name'] ?? null, $w['keywords'] ?? []))), 0, 5);

            $items[] = $this->record($platform, [
                'key' => $doi ?: ($w['id'] ?? $w['title']),
                'title' => $w['title'],
                'author' => $names ? implode(', ', $names) . (count($w['authorships'] ?? []) > 4 ? ' et al.' : '') : null,
                'source' => $w['primary_location']['source']['display_name'] ?? null,
                'year' => $w['publication_year'] ?? null,
                'doi' => $doi,
                'issn' => $w['primary_location']['source']['issn_l'] ?? null,
                'volume' => $w['biblio']['volume'] ?? null,
                'issue' => $w['biblio']['issue'] ?? null,
                'pages' => (!empty($w['biblio']['first_page']) ? $w['biblio']['first_page'] . (!empty($w['biblio']['last_page']) ? '–' . $w['biblio']['last_page'] : '') : null),
                'type' => ucfirst(str_replace('-', ' ', $w['type'] ?? 'article')),
                'publisher' => $w['primary_location']['source']['host_organization_name'] ?? null,
                'abstract' => $this->rebuildAbstract($w['abstract_inverted_index'] ?? null),
                'keywords' => $keywords,
                'subject' => $w['primary_topic']['field']['display_name'] ?? null,
                'is_open_access' => $isOa,
                'url' => $doi ? "https://doi.org/{$doi}" : ($w['primary_location']['landing_page_url'] ?? self::PLATFORMS[$platform]['portal']),
                'pdf_url' => $pdf,
                'oa_url' => $w['open_access']['oa_url'] ?? null,
                'citations' => (int) ($w['cited_by_count'] ?? 0),
            ]);
        }
        return [$items, $total];
    }

    private function parseCrossref(array $data, string $platform, array $o): array
    {
        $total = (int) ($data['message']['total-results'] ?? 0);
        $items = [];
        foreach ($data['message']['items'] ?? [] as $w) {
            $title = is_array($w['title'] ?? null) ? ($w['title'][0] ?? '') : ($w['title'] ?? '');
            if ($title === '') continue;
            $names = [];
            foreach (array_slice($w['author'] ?? [], 0, 4) as $a) {
                $n = trim(($a['given'] ?? '') . ' ' . ($a['family'] ?? ($a['name'] ?? '')));
                if ($n !== '') $names[] = $n;
            }
            $doi = $w['DOI'] ?? null;
            $year = $w['published-print']['date-parts'][0][0]
                ?? ($w['published-online']['date-parts'][0][0] ?? ($w['issued']['date-parts'][0][0] ?? null));
            $pdf = null;
            foreach ($w['link'] ?? [] as $lk) {
                if (($lk['content-type'] ?? '') === 'application/pdf') { $pdf = $lk['URL']; break; }
            }
            $hasLicense = false;
            foreach ($w['license'] ?? [] as $lic) {
                if (str_contains(strtolower($lic['URL'] ?? ''), 'creativecommons')) { $hasLicense = true; break; }
            }
            $abstract = !empty($w['abstract']) ? trim(preg_replace('/\s+/', ' ', strip_tags($w['abstract']))) : null;
            $abstract = $abstract ? preg_replace('/^Abstract\s*/i', '', $abstract) : null;

            $items[] = $this->record($platform, [
                'key' => $doi ?: $title,
                'title' => $title,
                'author' => $names ? implode(', ', $names) . (count($w['author'] ?? []) > 4 ? ' et al.' : '') : null,
                'source' => is_array($w['container-title'] ?? null) ? ($w['container-title'][0] ?? null) : ($w['container-title'] ?? null),
                'year' => $year ? (int) $year : null,
                'doi' => $doi,
                'issn' => is_array($w['ISSN'] ?? null) ? ($w['ISSN'][0] ?? null) : ($w['ISSN'] ?? null),
                'volume' => $w['volume'] ?? null,
                'issue' => $w['issue'] ?? null,
                'pages' => $w['page'] ?? null,
                'type' => ucfirst(str_replace('-', ' ', $w['type'] ?? 'journal article')),
                'publisher' => $w['publisher'] ?? null,
                'abstract' => $abstract,
                'is_open_access' => $hasLicense,
                'url' => $doi ? "https://doi.org/{$doi}" : ($w['URL'] ?? self::PLATFORMS[$platform]['portal']),
                'pdf_url' => $hasLicense ? $pdf : null,
                'citations' => (int) ($w['is-referenced-by-count'] ?? 0),
            ]);
        }
        return [$items, $total];
    }

    private function parseDoaj(array $data): array
    {
        $total = (int) ($data['total'] ?? 0);
        $items = [];
        foreach ($data['results'] ?? [] as $r) {
            $b = $r['bibjson'] ?? [];
            if (empty($b['title'])) continue;
            $names = [];
            foreach (array_slice($b['author'] ?? [], 0, 4) as $a) {
                if (!empty($a['name'])) $names[] = $a['name'];
            }
            $doi = null;
            foreach ($b['identifier'] ?? [] as $idObj) {
                if (strtolower($idObj['type'] ?? '') === 'doi') { $doi = $idObj['id']; break; }
            }
            $full = null;
            $pdf = null;
            foreach ($b['link'] ?? [] as $lk) {
                if (($lk['type'] ?? '') === 'fulltext' && !empty($lk['url'])) {
                    $full = $lk['url'];
                    if (str_ends_with(strtolower(parse_url($full, PHP_URL_PATH) ?? ''), '.pdf') || strtolower($lk['content_type'] ?? '') === 'pdf') {
                        $pdf = $full;
                    }
                }
            }
            $items[] = $this->record('doaj', [
                'key' => $doi ?: ($r['id'] ?? $b['title']),
                'title' => $b['title'],
                'author' => $names ? implode(', ', $names) : null,
                'source' => $b['journal']['title'] ?? null,
                'year' => isset($b['year']) ? (int) $b['year'] : null,
                'doi' => $doi,
                'issn' => $b['journal']['issns'][0] ?? null,
                'volume' => $b['journal']['volume'] ?? null,
                'issue' => $b['journal']['number'] ?? null,
                'pages' => !empty($b['start_page']) ? $b['start_page'] . (!empty($b['end_page']) ? '–' . $b['end_page'] : '') : null,
                'type' => 'Journal article',
                'publisher' => $b['journal']['publisher'] ?? null,
                'abstract' => !empty($b['abstract']) ? trim(strip_tags($b['abstract'])) : null,
                'keywords' => array_slice($b['keywords'] ?? [], 0, 5),
                'is_open_access' => true,
                'url' => $full ?: ($doi ? "https://doi.org/{$doi}" : 'https://doaj.org/article/' . ($r['id'] ?? '')),
                'pdf_url' => $pdf,
                'citations' => 0,
            ]);
        }
        return [$items, $total];
    }

    private function parseEuropePmc(array $data): array
    {
        $total = (int) ($data['hitCount'] ?? 0);
        $items = [];
        foreach ($data['resultList']['result'] ?? [] as $e) {
            if (empty($e['title'])) continue;
            $doi = $e['doi'] ?? null;
            $pmcid = $e['pmcid'] ?? null;
            $isOa = ($e['isOpenAccess'] ?? 'N') === 'Y';
            $keywords = $e['keywordList']['keyword'] ?? [];
            $items[] = $this->record('europe_pmc', [
                'key' => $doi ?: ($e['id'] ?? $e['title']),
                'title' => rtrim($e['title'], '.'),
                'author' => $e['authorString'] ?? null,
                'source' => $e['journalInfo']['journal']['title'] ?? ($e['journalTitle'] ?? null),
                'year' => isset($e['pubYear']) ? (int) $e['pubYear'] : null,
                'doi' => $doi,
                'issn' => $e['journalInfo']['journal']['issn'] ?? null,
                'volume' => $e['journalInfo']['volume'] ?? null,
                'issue' => $e['journalInfo']['issue'] ?? null,
                'pages' => $e['pageInfo'] ?? null,
                'type' => 'Research article',
                'publisher' => null,
                'abstract' => !empty($e['abstractText']) ? trim(strip_tags($e['abstractText'])) : null,
                'keywords' => array_slice(is_array($keywords) ? $keywords : [], 0, 5),
                'is_open_access' => $isOa,
                'url' => $pmcid ? "https://europepmc.org/article/PMC/{$pmcid}" : ($doi ? "https://doi.org/{$doi}" : 'https://europepmc.org/article/' . ($e['source'] ?? 'MED') . '/' . ($e['id'] ?? '')),
                'pdf_url' => ($isOa && $pmcid) ? "https://europepmc.org/backend/ptpmcrender.fcgi?accid={$pmcid}&blobtype=pdf" : null,
                'citations' => (int) ($e['citedByCount'] ?? 0),
            ]);
        }
        return [$items, $total];
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    /** Build a normalised record with consistent field names for every platform. */
    private function record(string $platform, array $f): array
    {
        $meta = self::PLATFORMS[$platform];
        $prefix = ['sciencedirect' => 'SD', 'agora' => 'AGORA', 'jstor' => 'JSTOR', 'ebsco' => 'EBSCO', 'doaj' => 'DOAJ', 'europe_pmc' => 'EPMC'][$platform];
        $title = trim(preg_replace('/\s+/', ' ', strip_tags(html_entity_decode((string) $f['title'], ENT_QUOTES | ENT_HTML5, 'UTF-8'))));
        $author = $f['author'] ?: 'Unknown author';
        $abstract = $f['abstract'] ?? null;
        if ($abstract && mb_strlen($abstract) > 1200) {
            $abstract = mb_substr($abstract, 0, 1200) . '…';
        }
        $volumeIssue = trim(($f['volume'] ? 'Vol. ' . $f['volume'] : '') . ($f['issue'] ? ' (' . $f['issue'] . ')' : ''));
        $isOa = (bool) ($f['is_open_access'] ?? false);

        $rec = [
            'id' => $prefix . '-' . substr(md5(strtolower((string) $f['key'])), 0, 12),
            'platform_id' => $platform,
            'title' => $title,
            'author' => $author,
            'source' => $f['source'] ?: $meta['label'],
            'year' => $f['year'] ?: null,
            'doi' => $f['doi'] ?? null,
            'issn' => $f['issn'] ?? null,
            'volume_issue' => $volumeIssue,
            'pages' => $f['pages'] ?? null,
            'type' => $f['type'] ?? 'Article',
            'publisher' => $f['publisher'] ?? null,
            'abstract' => $abstract,
            'keywords' => array_values(array_filter($f['keywords'] ?? [], 'is_string')),
            'subject' => $f['subject'] ?? null,
            'platform' => $meta['name'],
            'platform_badge' => $meta['badge'],
            'platform_color' => $meta['color'],
            'is_open_access' => $isOa,
            'access_type' => $isOa ? 'Open Access' : ($meta['name'] . ' Institutional Access'),
            'url' => $f['url'],
            'portal_url' => $meta['portal'],
            'pdf_url' => $f['pdf_url'] ?? null,
            'oa_url' => $f['oa_url'] ?? null,
            'citations' => (int) ($f['citations'] ?? 0),
            'discipline' => $f['subject'] ?? $meta['discipline'],
            'also_in' => [],
        ];
        $rec['citation_apa'] = $this->apaCitation($rec);
        return $rec;
    }

    private function apaCitation(array $r): string
    {
        $authors = $r['author'] !== 'Unknown author' ? $r['author'] : ($r['source'] ?? 'Anonymous');
        $parts = $authors . ' (' . ($r['year'] ?: 'n.d.') . '). ' . rtrim($r['title'], '.') . '. ';
        if (!empty($r['source'])) {
            $parts .= $r['source'];
            if (!empty($r['volume_issue'])) $parts .= ', ' . str_replace(['Vol. ', ' (', ')'], ['', '(', ')'], $r['volume_issue']);
            if (!empty($r['pages'])) $parts .= ', ' . $r['pages'];
            $parts .= '. ';
        }
        if (!empty($r['doi'])) $parts .= 'https://doi.org/' . $r['doi'];
        return trim($parts);
    }

    private function rebuildAbstract($inverted): ?string
    {
        if (!is_array($inverted) || empty($inverted)) return null;
        $words = [];
        foreach ($inverted as $word => $positions) {
            foreach ((array) $positions as $pos) {
                $words[(int) $pos] = $word;
            }
        }
        ksort($words);
        $text = trim(implode(' ', $words));
        return $text !== '' ? $text : null;
    }

    private function latencyOf(HttpResponse $res): ?int
    {
        try {
            $stats = $res->handlerStats();
            if (isset($stats['total_time'])) return (int) round($stats['total_time'] * 1000);
        } catch (\Throwable $e) {}
        return null;
    }

    private function postFilter(array $items, array $o): array
    {
        $junk = '/^(\[.*\]|front matter|back matter|index|contents|table of contents|title page|copyright page|acknowledg(e)?ments?|notes on contributors|bibliography|references|review|book reviews?|books received|volume information|editorial board|erratum)\.?$/i';
        $items = array_values(array_filter($items, function ($r) use ($o, $junk) {
            if (mb_strlen($r['title']) < 6 || preg_match($junk, trim($r['title']))) return false;
            if ($o['oaOnly'] && empty($r['is_open_access'])) return false;
            if ($o['yearFrom'] && !empty($r['year']) && $r['year'] < $o['yearFrom']) return false;
            if ($o['yearTo'] && !empty($r['year']) && $r['year'] > $o['yearTo']) return false;
            return true;
        }));
        return array_slice($items, 0, $o['perPlatform']);
    }

    /**
     * Merge platform lists, de-duplicate by DOI (recording "also_in"), and rank.
     * Relevance = round-robin interleave that preserves each API's own relevance order.
     */
    private function mergeAndRank(array $byPlatform, string $sort): array
    {
        $merged = [];
        $doiIndex = [];
        $lists = array_values($byPlatform);
        $max = $lists ? max(array_map('count', $lists)) : 0;

        for ($i = 0; $i < $max; $i++) {
            foreach ($lists as $list) {
                if (!isset($list[$i])) continue;
                $r = $list[$i];
                $doiKey = !empty($r['doi']) ? strtolower($r['doi']) : null;
                if ($doiKey && isset($doiIndex[$doiKey])) {
                    $idx = $doiIndex[$doiKey];
                    if (!in_array($r['platform'], $merged[$idx]['also_in'], true) && $r['platform'] !== $merged[$idx]['platform']) {
                        $merged[$idx]['also_in'][] = $r['platform'];
                    }
                    // Enrich missing fields from the duplicate
                    foreach (['abstract', 'pdf_url', 'oa_url'] as $fld) {
                        if (empty($merged[$idx][$fld]) && !empty($r[$fld])) $merged[$idx][$fld] = $r[$fld];
                    }
                    $merged[$idx]['citations'] = max($merged[$idx]['citations'], $r['citations']);
                    $merged[$idx]['is_open_access'] = $merged[$idx]['is_open_access'] || $r['is_open_access'];
                    continue;
                }
                if ($doiKey) $doiIndex[$doiKey] = count($merged);
                $merged[] = $r;
            }
        }

        if ($sort === 'newest') {
            usort($merged, fn ($a, $b) => ($b['year'] ?? 0) <=> ($a['year'] ?? 0));
        } elseif ($sort === 'citations') {
            usort($merged, fn ($a, $b) => ($b['citations'] ?? 0) <=> ($a['citations'] ?? 0));
        }

        return $merged;
    }
}
