<?php

namespace App\Services\Overlay;

use Illuminate\Http\Client\Pool;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * ResourceOverlay
 *
 * The engine behind the "overlay on the APIs" architecture. Nothing about
 * external books/papers is stored permanently: every request is answered by
 * fetching live from the relevant APIs, in parallel, then:
 *
 *   1. normalising every record into one schema   (SourceRegistry)
 *   2. merging duplicates across sources          (DOI / ISBN / title+author)
 *   3. ranking by relevance, access and intent
 *
 * FCC-owned items (physical copies, uploads, theses) still come from the
 * local database, because that is the only place they exist.
 *
 * Per-source responses are cached briefly (OVERLAY_CACHE_MINUTES) so that
 * paging/filtering doesn't hammer the upstream APIs, and so one slow or
 * failing source never blocks the others.
 */
class ResourceOverlay
{
    /** Sources used for a plain search when the caller doesn't pick any. */
    public const DEFAULT_SOURCES = ['local', 'google_books', 'open_library', 'openalex', 'internet_archive', 'doab', 'gutendex'];

    private const ACCESS_RANK = ['on_shelf' => 5, 'full' => 4, 'preview' => 3, 'borrow' => 2, 'metadata' => 1];

    public function __construct(private SourceRegistry $registry)
    {
    }

    // ---------------------------------------------------------------------
    // Federated search
    // ---------------------------------------------------------------------

    /**
     * @param string     $q       Search query
     * @param array      $opts    limit, yearFrom, yearTo, freeOnly, types[], strictTypes, isbn, max
     * @param array|null $sources Source keys (null = defaults + custom APIs)
     */
    public function search(string $q, array $opts = [], ?array $sources = null): array
    {
        $q = trim($q);
        $started = microtime(true);
        $enabled = $this->registry->enabledKeys();

        if ($sources === null || $sources === []) {
            $custom = array_filter($enabled, fn ($k) => str_starts_with($k, 'custom:'));
            $sources = array_merge(self::DEFAULT_SOURCES, $custom);
        }
        $sources = array_values(array_unique(array_intersect($sources, $enabled)));

        $opts['limit'] = max(3, min((int) ($opts['limit'] ?? 10), 25));
        $timeout = (int) config('services.overlay.timeout', 9);
        $ttl = now()->addMinutes((int) config('services.overlay.cache_minutes', 15));

        $items = [];
        $status = [];
        $toFetch = [];

        foreach ($sources as $key) {
            if ($key === 'local') {
                $t = microtime(true);
                try {
                    $local = $this->searchLocal($q, $opts);
                    $items = array_merge($items, $local);
                    $status[$key] = $this->status($key, 'ok', count($local), $t);
                } catch (\Throwable $e) {
                    Log::warning('Overlay local search failed: ' . $e->getMessage());
                    $status[$key] = $this->status($key, 'error', 0, $t, 'Local catalogue unavailable');
                }
                continue;
            }

            $sourceQuery = $this->sourceQuery($key, $q, $opts);
            $cacheKey = $this->cacheKey($key, $sourceQuery, $opts);

            if (($cached = Cache::get($cacheKey)) !== null) {
                $items = array_merge($items, $cached);
                $status[$key] = $this->status($key, 'cached', count($cached), null);
                continue;
            }

            $req = $this->registry->request($key, $sourceQuery, $opts);
            if (!$req) {
                $status[$key] = $this->status($key, 'skipped', 0, null, 'Not applicable for this query');
                continue;
            }
            $toFetch[$key] = $req + ['cacheKey' => $cacheKey];
        }

        // Fire all external requests concurrently.
        if ($toFetch) {
            $responses = Http::pool(function (Pool $pool) use ($toFetch, $timeout) {
                $reqs = [];
                foreach ($toFetch as $key => $r) {
                    $reqs[] = $pool->as($key)
                        ->timeout($timeout)
                        ->connectTimeout(5)
                        ->withHeaders($r['headers'])
                        ->get($r['url'], $r['query'] ?: null);
                }
                return $reqs;
            });

            foreach ($toFetch as $key => $r) {
                $resp = $responses[$key] ?? null;
                $latency = null;

                if ($resp instanceof Response) {
                    $latency = $resp->transferStats ? (int) round($resp->transferStats->getTransferTime() * 1000) : null;
                    if ($resp->successful()) {
                        try {
                            $parsed = $this->registry->parse($key, $resp);
                            Cache::put($r['cacheKey'], $parsed, $ttl);
                            $items = array_merge($items, $parsed);
                            $status[$key] = $this->status($key, 'ok', count($parsed), null, null, $latency);
                        } catch (\Throwable $e) {
                            Log::warning("Overlay parse failed for {$key}: " . $e->getMessage());
                            $status[$key] = $this->status($key, 'error', 0, null, 'Unexpected response format', $latency);
                        }
                    } else {
                        $msg = $resp->status() === 429 ? 'Rate limited – try again shortly' : 'HTTP ' . $resp->status();
                        $status[$key] = $this->status($key, 'error', 0, null, $msg, $latency);
                    }
                } else {
                    $msg = $resp instanceof \Throwable ? $this->shortError($resp) : 'No response';
                    $status[$key] = $this->status($key, 'error', 0, null, $msg);
                }
            }
        }

        // Post-filters, merge, rank.
        $items = $this->applyFilters($items, $opts);
        $merged = $this->merge($items);
        $ranked = $this->rank($merged, $opts['topic'] ?? $q, $opts['types'] ?? []);

        if (!empty($opts['strictTypes']) && !empty($opts['types'])) {
            $ranked = array_values(array_filter($ranked, fn ($r) => in_array($r['type'], $opts['types'])));
        }

        $max = (int) ($opts['max'] ?? 60);

        return [
            'query' => $q,
            'total' => count($ranked),
            'results' => array_slice($ranked, 0, $max),
            'sources' => array_values($status),
            'facets' => $this->facets($ranked),
            'tookMs' => (int) round((microtime(true) - $started) * 1000),
        ];
    }

    /** Some sources need the query in a special form (e.g. ISBN prefixes). */
    private function sourceQuery(string $key, string $q, array $opts): string
    {
        if (!empty($opts['isbn']) && in_array($key, ['google_books', 'open_library'])) {
            return 'isbn:' . $opts['isbn'];
        }
        return $q;
    }

    // ---------------------------------------------------------------------
    // Local (FCC-owned) holdings
    // ---------------------------------------------------------------------

    private function searchLocal(string $q, array $opts): array
    {
        $isbn = $opts['isbn'] ?? null;
        $terms = $isbn ? [] : $this->registry->terms($q);
        if (!$isbn && !$terms) {
            return [];
        }

        $out = [];

        if (Schema::hasTable('books')) {
            $books = DB::table('books')
                ->select(['id', 'title', 'subtitle', 'author', 'co_authors', 'subject', 'department', 'course_code', 'branch',
                    'shelf_location', 'call_number', 'isbn', 'doi', 'publisher', 'year', 'is_digital', 'copies_total',
                    'copies_available', 'abstract', 'keywords', 'external_url', 'citations', 'pdf_pages'])
                ->where(function ($w) use ($terms, $isbn) {
                    if ($isbn) {
                        $w->where('isbn', 'like', "%{$isbn}%");
                        return;
                    }
                    foreach ($terms as $t) {
                        $like = "%{$t}%";
                        $w->orWhere('title', 'like', $like)
                            ->orWhere('subject', 'like', $like)
                            ->orWhere('keywords', 'like', $like)
                            ->orWhere('author', 'like', $like)
                            ->orWhere('abstract', 'like', $like)
                            ->orWhere('course_code', 'like', $like);
                    }
                })
                ->limit(25)
                ->get();

            $copyStats = $this->copyStats($books->pluck('id')->all());

            foreach ($books as $b) {
                $stats = $copyStats[$b->id] ?? null;
                $total = $stats ? max((int) $b->copies_total, (int) $stats->total) : (int) $b->copies_total;
                $available = $stats ? (int) $stats->available : (int) $b->copies_available;
                $digital = (bool) $b->is_digital;

                $out[] = $this->registry->make('local', $b->id, [
                    'type' => $digital ? 'ebook' : 'book',
                    'title' => $b->title,
                    'subtitle' => $b->subtitle,
                    'authors' => array_filter(array_merge([$b->author], $this->splitList($b->co_authors))),
                    'year' => $b->year,
                    'publisher' => $b->publisher,
                    'description' => $b->abstract,
                    'subjects' => array_filter(array_merge([$b->subject, $b->department], $this->splitList($b->keywords))),
                    'isbn' => $b->isbn ? preg_replace('/[^0-9X]/i', '', $b->isbn) : null,
                    'doi' => $b->doi,
                    'url' => $b->external_url,
                    'readUrl' => $digital ? ($b->external_url ?: null) : null,
                    'access' => $digital ? 'full' : ($available > 0 ? 'on_shelf' : 'metadata'),
                    'citations' => $b->citations,
                    'pageCount' => $b->pdf_pages,
                    'appRoute' => $digital ? "/scholar/reader?bookId={$b->id}" : null,
                    'holdings' => [
                        'available' => $available,
                        'total' => $total,
                        'callNumber' => $b->call_number,
                        'shelf' => $b->shelf_location,
                        'branch' => $b->branch,
                        'courseCode' => $b->course_code,
                        'digital' => $digital,
                    ],
                ]);
            }
        }

        if (!$isbn && Schema::hasTable('theses')) {
            $theses = DB::table('theses')
                ->select(['id', 'title', 'author', 'year', 'advisor', 'department', 'degree', 'access', 'doi', 'abstract', 'citations', 'downloads'])
                ->where(function ($w) use ($terms) {
                    foreach ($terms as $t) {
                        $like = "%{$t}%";
                        $w->orWhere('title', 'like', $like)
                            ->orWhere('abstract', 'like', $like)
                            ->orWhere('department', 'like', $like);
                    }
                })
                ->limit(15)
                ->get();

            foreach ($theses as $t) {
                $open = in_array(strtolower((string) $t->access), ['open', 'public', 'open access']);
                $out[] = $this->registry->make('local', 'thesis-' . $t->id, [
                    'type' => 'thesis',
                    'title' => $t->title,
                    'authors' => [$t->author],
                    'year' => $t->year,
                    'publisher' => trim(($t->degree ? $t->degree . ' · ' : '') . ($t->department ?? 'FCC Ibadan')),
                    'description' => $t->abstract,
                    'subjects' => array_filter([$t->department]),
                    'doi' => $t->doi,
                    'access' => $open ? 'full' : 'metadata',
                    'citations' => $t->citations,
                    'downloads' => $t->downloads,
                    'appRoute' => '/scholar/research_hnd_projects',
                    'holdings' => ['department' => $t->department, 'degree' => $t->degree, 'advisor' => $t->advisor, 'repository' => true],
                ]);
            }
        }

        return $out;
    }

    private function copyStats(array $ids): array
    {
        if (!$ids || !Schema::hasTable('copies')) {
            return [];
        }
        try {
            return DB::table('copies')
                ->whereIn('book_id', $ids)
                ->selectRaw("book_id, COUNT(*) as total, SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) as available")
                ->groupBy('book_id')
                ->get()
                ->keyBy('book_id')
                ->all();
        } catch (\Throwable $e) {
            return [];
        }
    }

    // ---------------------------------------------------------------------
    // Live detail fetch (on demand)
    // ---------------------------------------------------------------------

    /** Fetch the full, live record for one resource. */
    public function detail(string $source, string $id): ?array
    {
        $cacheKey = 'overlay:detail:' . md5($source . '|' . $id);
        return Cache::remember($cacheKey, now()->addMinutes(60), function () use ($source, $id) {
            return $this->fetchDetail($source, $id);
        });
    }

    private function fetchDetail(string $source, string $id): ?array
    {
        $mail = config('services.overlay.contact_email');
        $http = Http::timeout(12)->withHeaders(['Accept' => 'application/json', 'User-Agent' => "FCC-SmartLibrary-Overlay/1.0 (mailto:{$mail})"]);
        $this->registry->truncateDescriptions = false;

        try {
            switch ($source) {
                case 'local':
                    return $this->localDetail($id);

                case 'google_books':
                    $params = ($k = config('services.overlay.google_books_key')) ? ['key' => $k] : [];
                    $r = $http->get('https://www.googleapis.com/books/v1/volumes/' . rawurlencode($id), $params);
                    if (!$r->successful()) return null;
                    $item = $this->registry->parseArray('google_books', ['items' => [$r->json()]])[0] ?? null;
                    if ($item) {
                        $ai = $r->json('accessInfo') ?? [];
                        $item['extra'] = [
                            'embeddable' => $ai['embeddable'] ?? false,
                            'pdfAvailable' => $ai['pdf']['isAvailable'] ?? false,
                            'epubAvailable' => $ai['epub']['isAvailable'] ?? false,
                            'previewLink' => $r->json('volumeInfo.previewLink'),
                        ];
                    }
                    return $item;

                case 'open_library':
                    $r = $http->get('https://openlibrary.org/works/' . rawurlencode($id) . '.json');
                    if (!$r->successful()) return null;
                    $w = $r->json();
                    $desc = is_array($w['description'] ?? null) ? ($w['description']['value'] ?? null) : ($w['description'] ?? null);
                    $authors = [];
                    foreach (array_slice($w['authors'] ?? [], 0, 3) as $a) {
                        $ak = $a['author']['key'] ?? null;
                        if ($ak) {
                            $ar = $http->get("https://openlibrary.org{$ak}.json");
                            if ($ar->successful()) $authors[] = $ar->json('name');
                        }
                    }
                    $cover = $w['covers'][0] ?? null;
                    return $this->registry->make('open_library', $id, [
                        'type' => 'book',
                        'title' => $w['title'] ?? null,
                        'subtitle' => $w['subtitle'] ?? null,
                        'authors' => array_filter($authors),
                        'year' => isset($w['first_publish_date']) ? (int) preg_replace('/\D.*$/', '', substr($w['first_publish_date'], -4)) : null,
                        'description' => $desc,
                        'subjects' => array_slice($w['subjects'] ?? [], 0, 12),
                        'coverUrl' => $cover ? "https://covers.openlibrary.org/b/id/{$cover}-L.jpg" : null,
                        'url' => "https://openlibrary.org/works/{$id}",
                        'access' => 'metadata',
                    ]) + ['extra' => ['firstSentence' => $w['first_sentence']['value'] ?? null]];

                case 'gutendex':
                    $r = $http->get('https://gutendex.com/books/' . (int) $id);
                    if (!$r->successful()) return null;
                    $item = $this->registry->parseArray('gutendex', ['results' => [$r->json()]])[0] ?? null;
                    if ($item) {
                        $formats = [];
                        foreach ($r->json('formats') ?? [] as $mime => $url) {
                            $formats[] = ['label' => $this->mimeLabel($mime), 'mime' => $mime, 'url' => $url];
                        }
                        $item['extra'] = ['files' => $formats];
                    }
                    return $item;

                case 'internet_archive':
                    $r = $http->get('https://archive.org/metadata/' . rawurlencode($id));
                    if (!$r->successful() || !$r->json('metadata')) return null;
                    $m = $r->json('metadata');
                    $files = [];
                    foreach ($r->json('files') ?? [] as $f) {
                        $fmt = $f['format'] ?? '';
                        if (in_array($fmt, ['Text PDF', 'PDF', 'EPUB', 'DjVuTXT', 'Additional Text PDF'])) {
                            $files[] = ['label' => $fmt, 'url' => "https://archive.org/download/{$id}/" . rawurlencode($f['name']), 'size' => $f['size'] ?? null];
                        }
                    }
                    $restricted = ($m['access-restricted-item'] ?? 'false') === 'true';
                    $desc = $m['description'] ?? null;
                    return $this->registry->make('internet_archive', $id, [
                        'type' => 'archive',
                        'title' => is_array($m['title'] ?? null) ? $m['title'][0] : ($m['title'] ?? null),
                        'authors' => (array) ($m['creator'] ?? []),
                        'year' => isset($m['date']) ? (int) substr((string) $m['date'], 0, 4) : null,
                        'publisher' => is_array($m['publisher'] ?? null) ? $m['publisher'][0] : ($m['publisher'] ?? null),
                        'description' => is_array($desc) ? implode(' ', $desc) : $desc,
                        'subjects' => array_slice((array) ($m['subject'] ?? []), 0, 12),
                        'coverUrl' => "https://archive.org/services/img/{$id}",
                        'url' => "https://archive.org/details/{$id}",
                        'readUrl' => "https://archive.org/details/{$id}",
                        'access' => $restricted ? 'borrow' : 'full',
                        'language' => is_array($m['language'] ?? null) ? $m['language'][0] : ($m['language'] ?? null),
                    ]) + ['extra' => ['files' => $restricted ? [] : $files, 'embedUrl' => "https://archive.org/embed/{$id}"]];

                case 'openalex':
                    $r = $http->get('https://api.openalex.org/works/' . rawurlencode($id), ['mailto' => $mail]);
                    if (!$r->successful()) return null;
                    $item = $this->registry->parseArray('openalex', ['results' => [$r->json()]])[0] ?? null;
                    if ($item) {
                        $locations = [];
                        foreach ($r->json('locations') ?? [] as $loc) {
                            if (!empty($loc['is_oa']) && (!empty($loc['pdf_url']) || !empty($loc['landing_page_url']))) {
                                $locations[] = ['label' => $loc['source']['display_name'] ?? 'Open copy', 'url' => $loc['pdf_url'] ?? $loc['landing_page_url']];
                            }
                        }
                        $item['extra'] = ['openCopies' => array_slice($locations, 0, 6), 'referencedWorks' => $r->json('referenced_works_count')];
                    }
                    return $item;

                case 'crossref':
                    $r = $http->get('https://api.crossref.org/works/' . $id, ['mailto' => $mail]);
                    if (!$r->successful()) return null;
                    return $this->registry->parseArray('crossref', ['message' => ['items' => [$r->json('message')]]])[0] ?? null;

                case 'semantic_scholar':
                    $r = $http->get('https://api.semanticscholar.org/graph/v1/paper/' . rawurlencode($id), [
                        'fields' => 'title,authors,year,abstract,citationCount,externalIds,url,openAccessPdf,venue,fieldsOfStudy,tldr',
                    ]);
                    if (!$r->successful()) return null;
                    $item = $this->registry->parseArray('semantic_scholar', ['data' => [$r->json()]])[0] ?? null;
                    if ($item) $item['extra'] = ['tldr' => $r->json('tldr.text')];
                    return $item;

                case 'arxiv':
                    $r = Http::timeout(12)->get('https://export.arxiv.org/api/query', ['id_list' => $id]);
                    if (!$r->successful()) return null;
                    return $this->registry->parse('arxiv', $r)[0] ?? null;
            }
        } catch (\Throwable $e) {
            Log::warning("Overlay detail failed for {$source}/{$id}: " . $e->getMessage());
            return null;
        } finally {
            $this->registry->truncateDescriptions = true;
        }

        return null;
    }

    private function localDetail(string $id): ?array
    {
        if (str_starts_with($id, 'thesis-')) {
            $t = DB::table('theses')->where('id', substr($id, 7))->first();
            if (!$t) return null;
            return $this->registry->make('local', $id, [
                'type' => 'thesis',
                'title' => $t->title,
                'authors' => [$t->author],
                'year' => $t->year,
                'publisher' => trim(($t->degree ? $t->degree . ' · ' : '') . ($t->department ?? '')),
                'description' => $t->abstract,
                'subjects' => array_filter([$t->department, $t->faculty ?? null]),
                'doi' => $t->doi,
                'access' => in_array(strtolower((string) $t->access), ['open', 'public']) ? 'full' : 'metadata',
                'citations' => $t->citations,
                'appRoute' => '/scholar/research_hnd_projects',
                'holdings' => ['department' => $t->department, 'degree' => $t->degree, 'advisor' => $t->advisor, 'repository' => true],
            ]);
        }

        $b = DB::table('books')->where('id', $id)->first();
        if (!$b) return null;
        $stats = $this->copyStats([$b->id])[$b->id] ?? null;
        $available = $stats ? (int) $stats->available : (int) $b->copies_available;
        $digital = (bool) $b->is_digital;
        $copies = Schema::hasTable('copies')
            ? DB::table('copies')->where('book_id', $b->id)->get(['barcode', 'status', 'shelf_location'])->map(fn ($c) => (array) $c)->all()
            : [];

        return $this->registry->make('local', $b->id, [
            'type' => $digital ? 'ebook' : 'book',
            'title' => $b->title,
            'subtitle' => $b->subtitle,
            'authors' => array_filter(array_merge([$b->author], $this->splitList($b->co_authors))),
            'year' => $b->year,
            'publisher' => $b->publisher,
            'description' => $b->abstract,
            'subjects' => array_filter(array_merge([$b->subject, $b->department], $this->splitList($b->keywords))),
            'isbn' => $b->isbn,
            'doi' => $b->doi,
            'url' => $b->external_url,
            'access' => $digital ? 'full' : ($available > 0 ? 'on_shelf' : 'metadata'),
            'citations' => $b->citations,
            'pageCount' => $b->pdf_pages,
            'appRoute' => $digital ? "/scholar/reader?bookId={$b->id}" : null,
            'holdings' => [
                'available' => $available,
                'total' => $stats ? max((int) $b->copies_total, (int) $stats->total) : (int) $b->copies_total,
                'callNumber' => $b->call_number,
                'shelf' => $b->shelf_location,
                'branch' => $b->branch,
                'courseCode' => $b->course_code,
                'digital' => $digital,
                'copies' => $copies,
            ],
        ]) + ['extra' => ['chapters' => $this->decodeJson($b->chapters ?? null), 'edition' => $b->edition ?? null]];
    }

    // ---------------------------------------------------------------------
    // Filtering, merging and ranking
    // ---------------------------------------------------------------------

    private function applyFilters(array $items, array $opts): array
    {
        $from = !empty($opts['yearFrom']) ? (int) $opts['yearFrom'] : null;
        $to = !empty($opts['yearTo']) ? (int) $opts['yearTo'] : null;
        $freeOnly = !empty($opts['freeOnly']);

        return array_values(array_filter($items, function ($r) use ($from, $to, $freeOnly) {
            if ($from && $r['year'] && $r['year'] < $from) return false;
            if ($to && $r['year'] && $r['year'] > $to) return false;
            if ($freeOnly && $r['access'] !== 'full') return false;
            return true;
        }));
    }

    /** Collapse the same work found in several APIs into one record. */
    private function merge(array $items): array
    {
        $groups = [];
        $index = [];

        foreach ($items as $item) {
            $keys = $this->identityKeys($item);
            $target = null;
            foreach ($keys as $k) {
                if (isset($index[$k])) { $target = $index[$k]; break; }
            }
            if ($target === null) {
                $target = count($groups);
                $groups[] = [];
            }
            $groups[$target][] = $item;
            foreach ($keys as $k) {
                $index[$k] = $target;
            }
        }

        $merged = [];
        foreach ($groups as $group) {
            usort($group, function ($a, $b) {
                $ra = self::ACCESS_RANK[$a['access']] ?? 0;
                $rb = self::ACCESS_RANK[$b['access']] ?? 0;
                if ($ra !== $rb) return $rb <=> $ra;
                return (int) !empty($b['description']) + (int) !empty($b['coverUrl']) - (int) !empty($a['description']) - (int) !empty($a['coverUrl']);
            });

            $primary = $group[0];
            $primary['availableAt'] = [];
            foreach ($group as $g) {
                foreach (['coverUrl', 'description', 'year', 'isbn', 'doi', 'publisher', 'subtitle', 'pageCount', 'language'] as $f) {
                    if (empty($primary[$f]) && !empty($g[$f])) $primary[$f] = $g[$f];
                }
                if (empty($primary['authors']) && !empty($g['authors'])) $primary['authors'] = $g['authors'];
                if (empty($primary['subjects']) && !empty($g['subjects'])) $primary['subjects'] = $g['subjects'];
                if (($g['citations'] ?? 0) > ($primary['citations'] ?? 0)) $primary['citations'] = $g['citations'];
                if (empty($primary['readUrl']) && !empty($g['readUrl']) && in_array($g['access'], ['full', 'preview'])) {
                    $primary['readUrl'] = $g['readUrl'];
                    $primary['readVia'] = $g['sourceLabel'];
                }
                $primary['availableAt'][] = [
                    'source' => $g['source'],
                    'sourceLabel' => $g['sourceLabel'],
                    'externalId' => $g['externalId'],
                    'access' => $g['access'],
                    'url' => $g['url'],
                    'readUrl' => $g['readUrl'],
                ];
            }
            $merged[] = $primary;
        }

        return $merged;
    }

    private function identityKeys(array $r): array
    {
        $keys = [];
        if (!empty($r['doi'])) $keys[] = 'doi:' . strtolower($r['doi']);
        if (!empty($r['isbn'])) $keys[] = 'isbn:' . $this->isbn13($r['isbn']);

        $title = mb_strtolower($r['title'] ?? '');
        $title = preg_replace('/\s*[:;(\[].*$/u', '', $title);        // drop subtitle
        $title = preg_replace('/[^\p{L}\p{N}]+/u', '', $title);
        if (mb_strlen($title) >= 6) {
            $author = mb_strtolower($r['authors'][0] ?? '');
            $parts = preg_split('/\s+/', trim($author));
            $last = preg_replace('/[^\p{L}]/u', '', end($parts) ?: '');
            $keys[] = 't:' . mb_substr($title, 0, 80) . '|' . $last;
        }
        return $keys;
    }

    private function rank(array $items, string $q, array $preferredTypes): array
    {
        $q = preg_replace('/^isbn:/i', '', $q);
        $terms = $this->registry->terms($q);
        $phrase = mb_strtolower(trim($q));
        $n = max(count($terms), 1);

        foreach ($items as &$r) {
            $title = mb_strtolower(($r['title'] ?? '') . ' ' . ($r['subtitle'] ?? ''));
            $desc = mb_strtolower($r['description'] ?? '');
            $subjects = mb_strtolower(implode(' ', $r['subjects'] ?? []));

            $titleHits = 0; $descHits = 0; $subjHits = 0;
            foreach ($terms as $t) {
                if (str_contains($title, $t)) $titleHits++;
                if (str_contains($desc, $t)) $descHits++;
                if (str_contains($subjects, $t)) $subjHits++;
            }

            $score = ($titleHits / $n) * 10;
            if (mb_strlen($phrase) > 3 && str_contains($title, $phrase)) $score += 4;
            $score += min(3, $descHits * 0.5 + $subjHits * 0.75);
            $score += ['on_shelf' => 3.5, 'full' => 3, 'preview' => 1.5, 'borrow' => 1, 'metadata' => 0][$r['access']] ?? 0;
            if ($preferredTypes && in_array($r['type'], $preferredTypes)) $score += 2.5;
            $score += (count($r['availableAt'] ?? []) - 1) * 1.2;
            if (!empty($r['citations'])) $score += min(3, log10($r['citations'] + 1));
            if (!empty($r['coverUrl'])) $score += 0.4;
            if (!empty($r['description'])) $score += 0.4;
            if ($r['source'] === 'local') $score += 1.5;
            if ($titleHits === 0 && $descHits === 0 && $subjHits === 0 && $terms) $score *= 0.4;

            $r['score'] = round($score, 2);
        }
        unset($r);

        usort($items, fn ($a, $b) => $b['score'] <=> $a['score']);
        return $items;
    }

    private function facets(array $items): array
    {
        $count = fn (string $field) => array_count_values(array_map(fn ($r) => $r[$field], $items));
        $sources = [];
        foreach ($items as $r) {
            foreach ($r['availableAt'] ?? [] as $a) {
                $sources[$a['source']] = ($sources[$a['source']] ?? 0) + 1;
            }
        }
        return ['type' => $count('type'), 'access' => $count('access'), 'source' => $sources];
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    private function status(string $key, string $state, int $count, ?float $started, ?string $error = null, ?int $latency = null): array
    {
        return [
            'key' => $key,
            'label' => $this->registry->label($key),
            'status' => $state,
            'count' => $count,
            'latencyMs' => $latency ?? ($started ? (int) round((microtime(true) - $started) * 1000) : null),
            'error' => $error,
        ];
    }

    private function cacheKey(string $key, string $q, array $opts): string
    {
        $sig = [mb_strtolower($q), $opts['limit'] ?? 10, $opts['yearFrom'] ?? null, $opts['yearTo'] ?? null, !empty($opts['freeOnly'])];
        return 'overlay:src:' . $key . ':' . md5(json_encode($sig));
    }

    private function shortError(\Throwable $e): string
    {
        $m = $e->getMessage();
        if (stripos($m, 'timed out') !== false || stripos($m, 'timeout') !== false) return 'Timed out';
        if (stripos($m, 'resolve host') !== false) return 'Network unavailable';
        if (stripos($m, 'SSL') !== false) return 'SSL error';
        return mb_substr($m, 0, 80);
    }

    private function isbn13(string $isbn): string
    {
        $c = strtoupper(preg_replace('/[^0-9X]/i', '', $isbn));
        if (strlen($c) !== 10) return $c;
        $base = '978' . substr($c, 0, 9);
        $sum = 0;
        for ($i = 0; $i < 12; $i++) {
            $sum += (int) $base[$i] * ($i % 2 ? 3 : 1);
        }
        return $base . ((10 - $sum % 10) % 10);
    }

    private function splitList($value): array
    {
        if (!$value) return [];
        $decoded = $this->decodeJson($value);
        if (is_array($decoded)) return array_map('strval', array_filter($decoded, 'is_scalar'));
        return array_filter(array_map('trim', preg_split('/[,;|]/', (string) $value)));
    }

    private function decodeJson($value)
    {
        if (!is_string($value)) return $value;
        $d = json_decode($value, true);
        return json_last_error() === JSON_ERROR_NONE ? $d : null;
    }

    private function mimeLabel(string $mime): string
    {
        return match (true) {
            str_starts_with($mime, 'application/epub') => 'EPUB',
            str_starts_with($mime, 'application/x-mobipocket') => 'Kindle',
            str_starts_with($mime, 'text/html') => 'Read online (HTML)',
            str_starts_with($mime, 'text/plain') => 'Plain text',
            str_starts_with($mime, 'image/') => 'Cover image',
            str_starts_with($mime, 'application/rdf') => 'Metadata (RDF)',
            default => $mime,
        };
    }
}
