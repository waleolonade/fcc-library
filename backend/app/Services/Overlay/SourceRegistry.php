<?php

namespace App\Services\Overlay;

use App\Models\LibraryApi;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * SourceRegistry
 *
 * Central catalogue of every external API the overlay can talk to.
 * Each source knows how to:
 *   1. build an HTTP request for a search query   (request())
 *   2. normalise the raw response into resources  (parse())
 *
 * Every resource returned by every source shares ONE schema, so the
 * frontend never has to care which API a record came from:
 *
 *   uid, source, sourceLabel, externalId, type, title, subtitle, authors[],
 *   year, publisher, description, subjects[], isbn, doi, coverUrl, url,
 *   readUrl, access, citations, language, holdings
 *
 *   type   : book | ebook | paper | thesis | archive | newspaper
 *   access : on_shelf | full | preview | borrow | metadata
 *
 * Admin control: built-in sources that map to a row in `library_apis`
 * are disabled automatically when the librarian sets that row to
 * anything other than "Active". Any additional (custom) API the
 * librarian registers is queried through the generic adapter.
 */
class SourceRegistry
{
    /** Built-in sources and the `library_apis` preset row that controls them. */
    public const DEFINITIONS = [
        'local' => [
            'label' => 'FCC Library Catalogue',
            'types' => ['book', 'ebook', 'thesis'],
            'strengths' => ['owned', 'borrow', 'thesis', 'textbook'],
            'preset' => null,
            'description' => 'Physical copies, digital uploads and HND/ND projects owned by FCC.',
        ],
        'thetechguy44' => [
            'label' => 'Thetechguy44 Library API',
            'types' => ['book', 'ebook'],
            'strengths' => ['owned', 'borrow', 'textbook', 'academic'],
            'preset' => 'API-THETECHGUY44',
            'description' => 'Library Management System API authored by Thetechguy44 with full-text search, live copy stacks, hold reservation queue, and peer review metrics.',
        ],
        'lms_api' => [
            'label' => 'Thetechguy44 Library API (LMS)',
            'types' => ['book', 'ebook'],
            'strengths' => ['owned', 'borrow', 'textbook', 'academic'],
            'preset' => 'API-LMS',
            'description' => 'Real-time Library Management System API authored by Thetechguy44 with full-text search, live copy stacks, hold reservation queue, and peer review metrics.',
        ],
        'simplelib' => [
            'label' => 'SimpleLib REST API (BassemGhoniem)',
            'types' => ['book', 'ebook'],
            'strengths' => ['owned', 'academic', 'classic', 'free'],
            'preset' => 'API-SIMPLELIB',
            'description' => 'RESTful Library Management System API with HATEOAS hypermedia links, genre indexing, 1-5 star ratings, and author entities.',
        ],
        'google_books' => [
            'label' => 'Google Books',
            'types' => ['book', 'ebook'],
            'strengths' => ['textbook', 'preview', 'general'],
            'preset' => 'API-GOOGLEBOOKS',
            'description' => 'Millions of books with previews and metadata.',
        ],
        'open_library' => [
            'label' => 'Open Library',
            'types' => ['book', 'ebook'],
            'strengths' => ['textbook', 'borrow', 'general'],
            'preset' => 'API-OPENLIB',
            'description' => 'Open catalogue of books with borrowable scans.',
        ],
        'gutendex' => [
            'label' => 'Project Gutenberg',
            'types' => ['ebook'],
            'strengths' => ['classic', 'free'],
            'preset' => 'API-GUTENDEX',
            'description' => '70,000+ free public-domain eBooks.',
        ],
        'internet_archive' => [
            'label' => 'Internet Archive',
            'types' => ['archive', 'ebook'],
            'strengths' => ['history', 'free', 'archive'],
            'preset' => null,
            'description' => 'Digitised books and historical texts, many free to read.',
        ],
        'doab' => [
            'label' => 'Directory of Open Access Books',
            'types' => ['ebook'],
            'strengths' => ['free', 'textbook', 'academic'],
            'preset' => 'API-DOAB',
            'description' => 'Peer-reviewed academic books, free to read.',
        ],
        'openalex' => [
            'label' => 'OpenAlex',
            'types' => ['paper'],
            'strengths' => ['research', 'academic'],
            'preset' => 'API-OPENALEX',
            'description' => '250M+ scholarly works with open-access links.',
        ],
        'crossref' => [
            'label' => 'Crossref',
            'types' => ['paper'],
            'strengths' => ['research', 'academic', 'doi'],
            'preset' => 'API-CROSSREF',
            'description' => 'DOI registry for journal articles.',
        ],
        'semantic_scholar' => [
            'label' => 'Semantic Scholar',
            'types' => ['paper'],
            'strengths' => ['research', 'academic'],
            'preset' => 'API-SEMANTICSCHOLAR',
            'description' => 'AI-indexed scientific literature.',
        ],
        'europepmc' => [
            'label' => 'Europe PMC',
            'types' => ['paper'],
            'strengths' => ['research', 'science', 'agriculture', 'health'],
            'preset' => 'API-EUROPEPMC',
            'description' => 'Life sciences, health and agriculture literature.',
        ],
        'arxiv' => [
            'label' => 'arXiv',
            'types' => ['paper'],
            'strengths' => ['research', 'science', 'computing', 'free'],
            'preset' => 'API-ARXIV',
            'description' => 'Open pre-prints in CS, maths, physics and economics.',
        ],
        'loc' => [
            'label' => 'Library of Congress',
            'types' => ['book', 'archive'],
            'strengths' => ['history', 'archive'],
            'preset' => 'API-LOC',
            'description' => 'US national library catalogue and digital collections.',
        ],
        'trove' => [
            'label' => 'Trove (NLA)',
            'types' => ['newspaper', 'book', 'archive'],
            'strengths' => ['history', 'newspaper', 'archive'],
            'preset' => null,
            'requires' => 'trove_key',
            'description' => 'National Library of Australia – newspapers and archives.',
        ],
    ];

    private ?array $presetStatus = null;
    private ?array $customApis = null;
    public bool $truncateDescriptions = true;

    // ---------------------------------------------------------------------
    // Discovery
    // ---------------------------------------------------------------------

    /** All sources (built-in + custom) with their current availability. */
    public function all(): array
    {
        $list = [];
        foreach (self::DEFINITIONS as $key => $def) {
            [$enabled, $reason] = $this->availability($key);
            $list[] = [
                'key' => $key,
                'label' => $def['label'],
                'types' => $def['types'],
                'strengths' => $def['strengths'],
                'description' => $def['description'],
                'kind' => $key === 'local' ? 'local' : 'builtin',
                'enabled' => $enabled,
                'reason' => $reason,
            ];
        }

        foreach ($this->customApis() as $api) {
            $list[] = [
                'key' => 'custom:' . $api->id,
                'label' => $api->name,
                'types' => ['book'],
                'strengths' => ['general'],
                'description' => $api->description ?: 'Custom API registered by the librarian.',
                'kind' => 'custom',
                'enabled' => true,
                'reason' => null,
            ];
        }

        return $list;
    }

    public function enabledKeys(): array
    {
        return array_values(array_map(
            fn ($s) => $s['key'],
            array_filter($this->all(), fn ($s) => $s['enabled'])
        ));
    }

    public function label(string $key): string
    {
        if (isset(self::DEFINITIONS[$key])) {
            return self::DEFINITIONS[$key]['label'];
        }
        if (str_starts_with($key, 'custom:')) {
            $api = $this->customApi(substr($key, 7));
            return $api?->name ?? $key;
        }
        return $key;
    }

    /** @return array{0: bool, 1: ?string} */
    private function availability(string $key): array
    {
        $def = self::DEFINITIONS[$key];

        if (!empty($def['requires']) && empty(config('services.overlay.' . $def['requires']))) {
            return [false, 'Requires ' . strtoupper($def['requires']) . ' in backend .env'];
        }

        if ($def['preset']) {
            $status = $this->presetStatus()[$def['preset']] ?? null;
            if ($status !== null && $status !== 'Active') {
                return [false, "Disabled by librarian (status: {$status})"];
            }
        }

        return [true, null];
    }

    private function presetStatus(): array
    {
        if ($this->presetStatus === null) {
            $this->presetStatus = [];
            try {
                if (Schema::hasTable('library_apis')) {
                    $this->presetStatus = LibraryApi::pluck('status', 'id')->toArray();
                }
            } catch (\Throwable $e) {
                // Table unavailable: treat every preset as active.
            }
        }
        return $this->presetStatus;
    }

    private function customApis(): array
    {
        if ($this->customApis === null) {
            $this->customApis = [];
            try {
                if (Schema::hasTable('library_apis')) {
                    $presets = array_filter(array_column(self::DEFINITIONS, 'preset'));
                    $this->customApis = LibraryApi::where('status', 'Active')
                        ->whereNotIn('id', $presets)
                        ->get()
                        ->all();
                }
            } catch (\Throwable $e) {
                // ignore
            }
        }
        return $this->customApis;
    }

    private function customApi(string $id): ?LibraryApi
    {
        foreach ($this->customApis() as $api) {
            if ($api->id === $id) {
                return $api;
            }
        }
        return null;
    }

    // ---------------------------------------------------------------------
    // Request builders
    // ---------------------------------------------------------------------

    /**
     * Build the outgoing HTTP request for a source.
     * Returns null when the source can't serve this query.
     *
     * @return array{url: string, query: array, headers: array}|null
     */
    public function request(string $key, string $q, array $opts = []): ?array
    {
        $limit = (int) ($opts['limit'] ?? 10);
        $mail = config('services.overlay.contact_email');
        $ua = "FCC-SmartLibrary-Overlay/1.0 (mailto:{$mail})";
        $headers = ['Accept' => 'application/json', 'User-Agent' => $ua];

        switch ($key) {
            case 'google_books':
                $query = ['q' => $q, 'maxResults' => min($limit, 40), 'printType' => 'books'];
                if (!empty($opts['freeOnly'])) {
                    $query['filter'] = 'free-ebooks';
                }
                if ($k = config('services.overlay.google_books_key')) {
                    $query['key'] = $k;
                }
                return ['url' => 'https://www.googleapis.com/books/v1/volumes', 'query' => $query, 'headers' => $headers];

            case 'open_library':
                $query = [
                    'q' => $q,
                    'limit' => $limit,
                    'fields' => 'key,title,subtitle,author_name,first_publish_year,isbn,cover_i,publisher,subject,ebook_access,ia,language',
                ];
                return ['url' => 'https://openlibrary.org/search.json', 'query' => $query, 'headers' => $headers];

            case 'simplelib':
                $query = ['q' => $q];
                return ['url' => url('/api/simplelib/books'), 'query' => $query, 'headers' => $headers];

            case 'gutendex':
                $query = [];
                if ($q !== '') {
                    $query['search'] = $q;
                }
                if (!empty($opts['topic'])) {
                    $query['topic'] = $opts['topic'];
                }
                if (!empty($opts['languages'])) {
                    $query['languages'] = is_array($opts['languages']) ? implode(',', $opts['languages']) : $opts['languages'];
                } elseif (!empty($opts['language'])) {
                    $query['languages'] = $opts['language'];
                }
                if (!empty($opts['author_year_start'])) {
                    $query['author_year_start'] = (int) $opts['author_year_start'];
                } elseif (!empty($opts['yearFrom'])) {
                    $query['author_year_start'] = (int) $opts['yearFrom'];
                }
                if (!empty($opts['author_year_end'])) {
                    $query['author_year_end'] = (int) $opts['author_year_end'];
                } elseif (!empty($opts['yearTo'])) {
                    $query['author_year_end'] = (int) $opts['yearTo'];
                }
                if (!empty($opts['freeOnly'])) {
                    $query['copyright'] = 'false';
                } elseif (isset($opts['copyright']) && $opts['copyright'] !== '') {
                    $query['copyright'] = $opts['copyright'];
                }
                if (!empty($opts['mime_type'])) {
                    $query['mime_type'] = $opts['mime_type'];
                }
                if (!empty($opts['ids'])) {
                    $query['ids'] = is_array($opts['ids']) ? implode(',', $opts['ids']) : $opts['ids'];
                }
                if (!empty($opts['sort']) && in_array($opts['sort'], ['popular', 'ascending', 'descending'])) {
                    $query['sort'] = $opts['sort'];
                }

                // If nothing specific was specified, default search to $q
                if (empty($query['search']) && empty($query['topic']) && empty($query['ids'])) {
                    $query['search'] = $q;
                }

                return ['url' => 'https://gutendex.com/books', 'query' => $query, 'headers' => $headers];

            case 'internet_archive':
                $clean = trim(preg_replace('/[^\w\s\-]/u', ' ', $q));
                $parts = ['mediatype:(texts)', "({$clean})"];
                if (!empty($opts['freeOnly'])) {
                    $parts[] = '-access-restricted-item:true';
                }
                return [
                    'url' => 'https://archive.org/advancedsearch.php',
                    'query' => [
                        'q' => implode(' AND ', $parts),
                        'fl' => ['identifier', 'title', 'creator', 'description', 'year', 'subject', 'downloads', 'access-restricted-item', 'publisher', 'language'],
                        'rows' => $limit,
                        'output' => 'json',
                    ],
                    'headers' => $headers,
                ];

            case 'doab':
                return [
                    'url' => 'https://directory.doabooks.org/rest/search',
                    'query' => ['query' => $q, 'expand' => 'metadata,bitstreams', 'limit' => $limit],
                    'headers' => $headers,
                ];

            case 'openalex':
                $query = ['search' => $q, 'per-page' => $limit, 'mailto' => $mail];
                $filters = [];
                if (!empty($opts['yearFrom'])) {
                    $filters[] = 'from_publication_date:' . (int) $opts['yearFrom'] . '-01-01';
                }
                if (!empty($opts['yearTo'])) {
                    $filters[] = 'to_publication_date:' . (int) $opts['yearTo'] . '-12-31';
                }
                if (!empty($opts['freeOnly'])) {
                    $filters[] = 'is_oa:true';
                }
                if ($filters) {
                    $query['filter'] = implode(',', $filters);
                }
                return ['url' => 'https://api.openalex.org/works', 'query' => $query, 'headers' => $headers];

            case 'crossref':
                $query = ['query' => $q, 'rows' => $limit, 'mailto' => $mail,
                    'select' => 'DOI,title,author,issued,publisher,subject,URL,is-referenced-by-count,abstract,type,container-title,link'];
                $filters = [];
                if (!empty($opts['yearFrom'])) {
                    $filters[] = 'from-pub-date:' . (int) $opts['yearFrom'];
                }
                if (!empty($opts['yearTo'])) {
                    $filters[] = 'until-pub-date:' . (int) $opts['yearTo'];
                }
                if ($filters) {
                    $query['filter'] = implode(',', $filters);
                }
                return ['url' => 'https://api.crossref.org/works', 'query' => $query, 'headers' => $headers];

            case 'semantic_scholar':
                $query = ['query' => $q, 'limit' => $limit,
                    'fields' => 'title,authors,year,abstract,citationCount,externalIds,url,openAccessPdf,venue,fieldsOfStudy'];
                if (!empty($opts['yearFrom']) || !empty($opts['yearTo'])) {
                    $query['year'] = ($opts['yearFrom'] ?? '') . '-' . ($opts['yearTo'] ?? '');
                }
                if (!empty($opts['freeOnly'])) {
                    $query['openAccessPdf'] = '';
                }
                return ['url' => 'https://api.semanticscholar.org/graph/v1/paper/search', 'query' => $query, 'headers' => $headers];

            case 'europepmc':
                $search = $q;
                if (!empty($opts['freeOnly'])) {
                    $search .= ' AND OPEN_ACCESS:y';
                }
                return [
                    'url' => 'https://www.ebi.ac.uk/europepmc/webservices/rest/search',
                    'query' => ['query' => $search, 'format' => 'json', 'pageSize' => $limit, 'resultType' => 'core'],
                    'headers' => $headers,
                ];

            case 'arxiv':
                $terms = $this->terms($q);
                if (!$terms) {
                    return null;
                }
                $sq = implode(' AND ', array_map(fn ($t) => 'all:' . $t, array_slice($terms, 0, 6)));
                return [
                    'url' => 'https://export.arxiv.org/api/query',
                    'query' => ['search_query' => $sq, 'start' => 0, 'max_results' => $limit, 'sortBy' => 'relevance'],
                    'headers' => array_merge($headers, ['Accept' => 'application/atom+xml']),
                ];

            case 'loc':
                return [
                    'url' => 'https://www.loc.gov/books/',
                    'query' => ['q' => $q, 'fo' => 'json', 'c' => $limit],
                    'headers' => $headers,
                ];

            case 'trove':
                $k = config('services.overlay.trove_key');
                if (!$k) {
                    return null;
                }
                return [
                    'url' => 'https://api.trove.nla.gov.au/v3/result',
                    'query' => ['q' => $q, 'category' => 'book,newspaper', 'encoding' => 'json', 'n' => $limit, 'include' => 'links', 'reclevel' => 'brief'],
                    'headers' => array_merge($headers, ['X-API-KEY' => $k]),
                ];
        }

        if (str_starts_with($key, 'custom:')) {
            $api = $this->customApi(substr($key, 7));
            if (!$api) {
                return null;
            }
            $url = str_replace(['{query}', '{isbn}'], [urlencode($q), urlencode($q)], $api->endpoint_template);
            if ($api->api_key && $api->auth_type === 'Bearer Token') {
                $headers['Authorization'] = 'Bearer ' . $api->api_key;
            }
            return ['url' => $url, 'query' => [], 'headers' => $headers];
        }

        return null;
    }

    // ---------------------------------------------------------------------
    // Response parsers
    // ---------------------------------------------------------------------

    /** Normalise a raw API response into overlay resources. */
    public function parse(string $key, Response $response): array
    {
        if ($key === 'arxiv') {
            return $this->parseArxiv($response->body());
        }

        $data = $response->json();
        if (!is_array($data)) {
            return [];
        }

        return $this->parseArray($key, $data);
    }

    /** Normalise raw associative array payload into overlay resources. */
    public function parseArray(string $key, array $data): array
    {
        $method = 'parse' . Str::studly($key);
        if (method_exists($this, $method)) {
            return array_values(array_filter($this->{$method}($data), fn ($r) => !empty($r['title'])));
        }

        if (str_starts_with($key, 'custom:')) {
            return $this->parseCustom($key, $data);
        }

        return [];
    }

    private function parseSimplelib(array $data): array
    {
        $out = [];
        $items = isset($data['data']) ? $data['data'] : $data;
        if (!is_array($items)) return [];

        foreach ($items as $b) {
            if (!is_array($b) || empty($b['title'])) continue;
            $id = $b['id'] ?? ($b['_id'] ?? null);
            $out[] = $this->make('simplelib', (string) $id, [
                'type' => 'book',
                'title' => $b['title'],
                'authors' => !empty($b['author']) ? [$b['author']] : [],
                'year' => isset($b['year']) ? $this->year($b['year']) : (int) date('Y'),
                'publisher' => 'SimpleLib Global Press (BassemGhoniem)',
                'description' => "Genre: " . ($b['genre'] ?? 'Literature') . " | Star Rating: " . ($b['rating'] ?? 5) . "/5.0 | REST HATEOAS",
                'subjects' => !empty($b['genre']) ? [$b['genre']] : ['Literature'],
                'coverUrl' => $b['cover_url'] ?? null,
                'url' => "/api/simplelib/books/{$id}",
                'access' => 'full',
            ]);
        }
        return $out;
    }

    private function parseGoogleBooks(array $data): array
    {
        $out = [];
        foreach ($data['items'] ?? [] as $item) {
            $v = $item['volumeInfo'] ?? [];
            $a = $item['accessInfo'] ?? [];
            $isbn = null;
            foreach ($v['industryIdentifiers'] ?? [] as $id) {
                if (in_array($id['type'] ?? '', ['ISBN_13', 'ISBN_10'])) {
                    $isbn = $id['identifier'];
                    if ($id['type'] === 'ISBN_13') break;
                }
            }
            $viewability = $a['viewability'] ?? 'NO_PAGES';
            $access = match (true) {
                $viewability === 'ALL_PAGES' || ($a['accessViewStatus'] ?? '') === 'FULL_PUBLIC_DOMAIN' => 'full',
                $viewability === 'PARTIAL' => 'preview',
                default => 'metadata',
            };
            $cover = $v['imageLinks']['thumbnail'] ?? ($v['imageLinks']['smallThumbnail'] ?? null);

            $out[] = $this->make('google_books', $item['id'] ?? null, [
                'type' => ($item['saleInfo']['isEbook'] ?? false) ? 'ebook' : 'book',
                'title' => $v['title'] ?? null,
                'subtitle' => $v['subtitle'] ?? null,
                'authors' => $v['authors'] ?? [],
                'year' => $this->year($v['publishedDate'] ?? null),
                'publisher' => $v['publisher'] ?? null,
                'description' => $v['description'] ?? null,
                'subjects' => $v['categories'] ?? [],
                'isbn' => $isbn,
                'coverUrl' => $cover ? preg_replace('#^http://#', 'https://', $cover) : null,
                'url' => $v['infoLink'] ?? ($v['canonicalVolumeLink'] ?? null),
                'readUrl' => $access !== 'metadata' ? ($a['webReaderLink'] ?? ($v['previewLink'] ?? null)) : null,
                'access' => $access,
                'language' => $v['language'] ?? null,
                'pageCount' => $v['pageCount'] ?? null,
                'rating' => $v['averageRating'] ?? null,
            ]);
        }
        return $out;
    }

    private function parseOpenLibrary(array $data): array
    {
        $out = [];
        foreach ($data['docs'] ?? [] as $doc) {
            $workId = isset($doc['key']) ? str_replace('/works/', '', $doc['key']) : null;
            $ebook = $doc['ebook_access'] ?? 'no_ebook';
            $access = match ($ebook) {
                'public' => 'full',
                'borrowable', 'printdisabled' => 'borrow',
                default => 'metadata',
            };
            $ia = $doc['ia'][0] ?? null;

            $out[] = $this->make('open_library', $workId, [
                'type' => $access === 'metadata' ? 'book' : 'ebook',
                'title' => $doc['title'] ?? null,
                'subtitle' => $doc['subtitle'] ?? null,
                'authors' => $doc['author_name'] ?? [],
                'year' => $doc['first_publish_year'] ?? null,
                'publisher' => $doc['publisher'][0] ?? null,
                'subjects' => array_slice($doc['subject'] ?? [], 0, 8),
                'isbn' => $this->preferIsbn13($doc['isbn'] ?? []),
                'coverUrl' => isset($doc['cover_i']) ? "https://covers.openlibrary.org/b/id/{$doc['cover_i']}-M.jpg" : null,
                'url' => $workId ? "https://openlibrary.org/works/{$workId}" : null,
                'readUrl' => ($access !== 'metadata' && $ia) ? "https://archive.org/details/{$ia}" : null,
                'access' => $access,
                'language' => $doc['language'][0] ?? null,
            ]);
        }
        return $out;
    }

    private function parseGutendex(array $data): array
    {
        $out = [];
        foreach (array_slice($data['results'] ?? [], 0, 15) as $b) {
            $f = $b['formats'] ?? [];
            $id = $b['id'] ?? null;
            $read = null;
            foreach ($f as $mime => $url) {
                if (str_starts_with($mime, 'text/html')) { $read = $url; break; }
            }
            $read = $read ?? ($f['text/plain; charset=utf-8'] ?? ($f['application/epub+zip'] ?? null));
            $author = $b['authors'][0] ?? null;

            // Clean summary (remove escaped quotes or automated summary tag if present)
            $rawSummary = $b['summaries'][0] ?? null;
            $summary = null;
            if ($rawSummary) {
                $summary = trim(stripslashes($rawSummary));
            }

            // Cover fallback: if image/jpeg is not in formats, use canonical Gutenberg CDN path
            $coverUrl = $f['image/jpeg'] ?? ($id ? "https://www.gutenberg.org/cache/epub/{$id}/pg{$id}.cover.medium.jpg" : null);

            $out[] = $this->make('gutendex', $id, [
                'type' => 'ebook',
                'title' => $b['title'] ?? null,
                'authors' => array_map(fn ($a) => $this->flipName($a['name'] ?? ''), $b['authors'] ?? []),
                'year' => $author['death_year'] ?? ($author['birth_year'] ?? null),
                'publisher' => 'Project Gutenberg',
                'description' => $summary,
                'subjects' => array_slice(array_merge($b['bookshelves'] ?? [], $b['subjects'] ?? []), 0, 10),
                'coverUrl' => $coverUrl,
                'url' => isset($b['id']) ? "https://www.gutenberg.org/ebooks/{$b['id']}" : null,
                'readUrl' => $read,
                'downloadUrl' => $f['application/epub+zip'] ?? ($f['text/plain; charset=utf-8'] ?? null),
                'access' => 'full',
                'language' => $b['languages'][0] ?? null,
                'downloads' => $b['download_count'] ?? null,
            ]);
        }
        return $out;
    }

    private function parseInternetArchive(array $data): array
    {
        $out = [];
        foreach ($data['response']['docs'] ?? [] as $d) {
            $id = $d['identifier'] ?? null;
            if (!$id) continue;
            $restricted = ($d['access-restricted-item'] ?? 'false') === 'true' || ($d['access-restricted-item'] ?? false) === true;
            $desc = $d['description'] ?? null;

            $out[] = $this->make('internet_archive', $id, [
                'type' => 'archive',
                'title' => is_array($d['title'] ?? null) ? $d['title'][0] : ($d['title'] ?? null),
                'authors' => (array) ($d['creator'] ?? []),
                'year' => $this->year($d['year'] ?? null),
                'publisher' => is_array($d['publisher'] ?? null) ? $d['publisher'][0] : ($d['publisher'] ?? null),
                'description' => is_array($desc) ? implode(' ', $desc) : $desc,
                'subjects' => array_slice((array) ($d['subject'] ?? []), 0, 8),
                'coverUrl' => "https://archive.org/services/img/{$id}",
                'url' => "https://archive.org/details/{$id}",
                'readUrl' => "https://archive.org/details/{$id}",
                'access' => $restricted ? 'borrow' : 'full',
                'language' => is_array($d['language'] ?? null) ? $d['language'][0] : ($d['language'] ?? null),
                'downloads' => $d['downloads'] ?? null,
            ]);
        }
        return $out;
    }

    private function parseDoab(array $data): array
    {
        $out = [];
        foreach ($data as $item) {
            if (!is_array($item)) continue;
            $meta = [];
            foreach ($item['metadata'] ?? [] as $m) {
                $meta[$m['key']][] = $m['value'];
            }
            $handle = $item['handle'] ?? null;
            $pdf = null;
            foreach ($item['bitstreams'] ?? [] as $bs) {
                if (($bs['mimeType'] ?? '') === 'application/pdf' && !empty($bs['retrieveLink'])) {
                    $pdf = 'https://directory.doabooks.org' . $bs['retrieveLink'];
                    break;
                }
            }
            $landing = $meta['oapen.identifier.downloadUrl'][0] ?? ($meta['dc.identifier.uri'][0] ?? ($handle ? "https://directory.doabooks.org/handle/{$handle}" : null));

            $out[] = $this->make('doab', $handle ?? ($item['uuid'] ?? null), [
                'type' => 'ebook',
                'title' => $meta['dc.title'][0] ?? ($item['name'] ?? null),
                'authors' => $meta['dc.contributor.author'] ?? ($meta['dc.contributor.editor'] ?? []),
                'year' => $this->year($meta['dc.date.issued'][0] ?? null),
                'publisher' => $meta['publisher.name'][0] ?? ($meta['dc.publisher'][0] ?? null),
                'description' => $meta['dc.description.abstract'][0] ?? null,
                'subjects' => array_slice(array_merge($meta['dc.subject.other'] ?? [], $meta['dc.subject.classification'] ?? []), 0, 8),
                'isbn' => $this->preferIsbn13($meta['oapen.identifier.isbn'] ?? []),
                'doi' => $this->cleanDoi($meta['oapen.identifier.doi'][0] ?? null),
                'url' => $handle ? "https://directory.doabooks.org/handle/{$handle}" : $landing,
                'readUrl' => $pdf ?? $landing,
                'access' => 'full',
                'language' => $meta['dc.language'][0] ?? null,
            ]);
        }
        return $out;
    }

    private function parseOpenalex(array $data): array
    {
        $out = [];
        foreach ($data['results'] ?? [] as $w) {
            $oa = $w['open_access'] ?? [];
            $oaUrl = $oa['oa_url'] ?? ($w['best_oa_location']['pdf_url'] ?? null);
            $doi = $this->cleanDoi($w['doi'] ?? null);
            $id = isset($w['id']) ? basename($w['id']) : null;
            $source = $w['primary_location']['source']['display_name'] ?? null;

            $out[] = $this->make('openalex', $id, [
                'type' => ($w['type'] ?? '') === 'book' ? 'book' : (($w['type'] ?? '') === 'dissertation' ? 'thesis' : 'paper'),
                'title' => $w['display_name'] ?? ($w['title'] ?? null),
                'authors' => array_slice(array_map(fn ($a) => $a['author']['display_name'] ?? '', $w['authorships'] ?? []), 0, 8),
                'year' => $w['publication_year'] ?? null,
                'publisher' => $source,
                'description' => $this->invertedAbstract($w['abstract_inverted_index'] ?? null),
                'subjects' => array_slice(array_map(fn ($c) => $c['display_name'] ?? '', $w['topics'] ?? ($w['concepts'] ?? [])), 0, 6),
                'doi' => $doi,
                'url' => $doi ? "https://doi.org/{$doi}" : ($w['id'] ?? null),
                'readUrl' => ($oa['is_oa'] ?? false) ? $oaUrl : null,
                'access' => ($oa['is_oa'] ?? false) && $oaUrl ? 'full' : 'metadata',
                'citations' => $w['cited_by_count'] ?? 0,
                'language' => $w['language'] ?? null,
            ]);
        }
        return $out;
    }

    private function parseCrossref(array $data): array
    {
        $out = [];
        foreach ($data['message']['items'] ?? [] as $w) {
            $doi = $this->cleanDoi($w['DOI'] ?? null);
            $authors = array_map(fn ($a) => trim(($a['given'] ?? '') . ' ' . ($a['family'] ?? ($a['name'] ?? ''))), $w['author'] ?? []);
            $pdf = null;
            foreach ($w['link'] ?? [] as $l) {
                if (($l['content-type'] ?? '') === 'application/pdf' && ($l['intended-application'] ?? '') !== 'text-mining') {
                    $pdf = $l['URL'];
                    break;
                }
            }

            $out[] = $this->make('crossref', $doi, [
                'type' => in_array($w['type'] ?? '', ['book', 'monograph', 'edited-book', 'book-chapter']) ? 'book' : (($w['type'] ?? '') === 'dissertation' ? 'thesis' : 'paper'),
                'title' => $w['title'][0] ?? null,
                'authors' => array_slice(array_filter($authors), 0, 8),
                'year' => $w['issued']['date-parts'][0][0] ?? null,
                'publisher' => $w['container-title'][0] ?? ($w['publisher'] ?? null),
                'description' => isset($w['abstract']) ? trim(strip_tags($w['abstract'])) : null,
                'subjects' => array_slice($w['subject'] ?? [], 0, 6),
                'doi' => $doi,
                'url' => $doi ? "https://doi.org/{$doi}" : ($w['URL'] ?? null),
                'readUrl' => null,
                'access' => 'metadata',
                'citations' => $w['is-referenced-by-count'] ?? 0,
            ]);
        }
        return $out;
    }

    private function parseSemanticScholar(array $data): array
    {
        $out = [];
        foreach ($data['data'] ?? [] as $p) {
            $pdf = $p['openAccessPdf']['url'] ?? null;
            $doi = $this->cleanDoi($p['externalIds']['DOI'] ?? null);

            $out[] = $this->make('semantic_scholar', $p['paperId'] ?? null, [
                'type' => 'paper',
                'title' => $p['title'] ?? null,
                'authors' => array_slice(array_map(fn ($a) => $a['name'] ?? '', $p['authors'] ?? []), 0, 8),
                'year' => $p['year'] ?? null,
                'publisher' => $p['venue'] ?: null,
                'description' => $p['abstract'] ?? null,
                'subjects' => $p['fieldsOfStudy'] ?? [],
                'doi' => $doi,
                'url' => $p['url'] ?? null,
                'readUrl' => $pdf,
                'access' => $pdf ? 'full' : 'metadata',
                'citations' => $p['citationCount'] ?? 0,
            ]);
        }
        return $out;
    }

    private function parseEuropepmc(array $data): array
    {
        $out = [];
        foreach ($data['resultList']['result'] ?? [] as $r) {
            $isOa = ($r['isOpenAccess'] ?? 'N') === 'Y';
            $pmcid = $r['pmcid'] ?? null;
            $doi = $this->cleanDoi($r['doi'] ?? null);
            $read = null;
            foreach ($r['fullTextUrlList']['fullTextUrl'] ?? [] as $ft) {
                if (($ft['availabilityCode'] ?? '') === 'OA' || ($ft['availability'] ?? '') === 'Open access') {
                    $read = $ft['url'];
                    break;
                }
            }
            if (!$read && $isOa && $pmcid) {
                $read = "https://europepmc.org/article/PMC/{$pmcid}";
            }

            $out[] = $this->make('europepmc', ($r['source'] ?? 'MED') . ':' . ($r['id'] ?? ''), [
                'type' => 'paper',
                'title' => isset($r['title']) ? rtrim(strip_tags($r['title']), '.') : null,
                'authors' => array_slice(array_map('trim', explode(',', $r['authorString'] ?? '')), 0, 8),
                'year' => $this->year($r['pubYear'] ?? null),
                'publisher' => $r['journalInfo']['journal']['title'] ?? ($r['journalTitle'] ?? null),
                'description' => isset($r['abstractText']) ? strip_tags($r['abstractText']) : null,
                'subjects' => array_slice($r['keywordList']['keyword'] ?? [], 0, 6),
                'doi' => $doi,
                'url' => "https://europepmc.org/article/" . ($r['source'] ?? 'MED') . '/' . ($r['id'] ?? ''),
                'readUrl' => $read,
                'access' => $read ? 'full' : 'metadata',
                'citations' => $r['citedByCount'] ?? 0,
            ]);
        }
        return $out;
    }

    private function parseArxiv(string $xml): array
    {
        $out = [];
        libxml_use_internal_errors(true);
        $feed = simplexml_load_string($xml);
        if (!$feed) {
            return [];
        }
        foreach ($feed->entry as $e) {
            $absUrl = (string) $e->id;
            $id = preg_replace('#^https?://arxiv\.org/abs/#', '', $absUrl);
            $pdf = null;
            foreach ($e->link as $l) {
                if ((string) $l['title'] === 'pdf') {
                    $pdf = (string) $l['href'];
                }
            }
            $authors = [];
            foreach ($e->author as $a) {
                $authors[] = (string) $a->name;
            }
            $cats = [];
            foreach ($e->category as $c) {
                $cats[] = (string) $c['term'];
            }

            $out[] = $this->make('arxiv', $id, [
                'type' => 'paper',
                'title' => trim(preg_replace('/\s+/', ' ', (string) $e->title)),
                'authors' => array_slice($authors, 0, 8),
                'year' => $this->year((string) $e->published),
                'publisher' => 'arXiv pre-print',
                'description' => trim(preg_replace('/\s+/', ' ', (string) $e->summary)),
                'subjects' => array_slice($cats, 0, 5),
                'url' => $absUrl,
                'readUrl' => $pdf ?: $absUrl,
                'access' => 'full',
            ]);
        }
        return $out;
    }

    private function parseLoc(array $data): array
    {
        $out = [];
        foreach ($data['results'] ?? [] as $r) {
            if (!isset($r['title'])) continue;
            $online = !empty($r['online_format']) || in_array('online text', (array) ($r['online_format'] ?? []));
            $url = $r['url'] ?? ($r['id'] ?? null);

            $out[] = $this->make('loc', $r['id'] ?? $url, [
                'type' => 'book',
                'title' => is_array($r['title']) ? $r['title'][0] : $r['title'],
                'authors' => array_slice((array) ($r['contributor'] ?? []), 0, 5),
                'year' => $this->year($r['date'] ?? null),
                'description' => is_array($r['description'] ?? null) ? implode(' ', $r['description']) : ($r['description'] ?? null),
                'subjects' => array_slice((array) ($r['subject'] ?? []), 0, 6),
                'coverUrl' => isset($r['image_url'][0]) ? (str_starts_with($r['image_url'][0], '//') ? 'https:' . $r['image_url'][0] : $r['image_url'][0]) : null,
                'url' => $url,
                'readUrl' => $online ? $url : null,
                'access' => $online ? 'full' : 'metadata',
                'language' => $r['language'][0] ?? null,
            ]);
        }
        return $out;
    }

    private function parseTrove(array $data): array
    {
        $out = [];
        foreach ($data['category'] ?? [] as $cat) {
            $code = $cat['code'] ?? 'book';
            $records = $cat['records'] ?? [];
            $rows = array_merge($records['work'] ?? [], $records['article'] ?? []);
            foreach ($rows as $w) {
                $full = null;
                foreach ($w['identifier'] ?? [] as $idn) {
                    if (($idn['linktype'] ?? '') === 'fulltext' || ($idn['type'] ?? '') === 'url') {
                        $full = $idn['value'] ?? null;
                        if (($idn['linktype'] ?? '') === 'fulltext') break;
                    }
                }
                $isArticle = $code === 'newspaper';
                $url = $w['troveUrl'] ?? ($w['url'] ?? null);

                $out[] = $this->make('trove', $w['id'] ?? $url, [
                    'type' => $isArticle ? 'newspaper' : 'book',
                    'title' => $isArticle ? ($w['heading'] ?? null) : (is_string($w['title'] ?? null) ? $w['title'] : null),
                    'authors' => (array) ($w['contributor'] ?? []),
                    'year' => $this->year($w['issued'] ?? ($w['date'] ?? null)),
                    'publisher' => $isArticle && is_array($w['title'] ?? null) ? ($w['title']['title'] ?? ($w['title']['value'] ?? null)) : null,
                    'description' => $w['abstract'] ?? ($w['snippet'] ?? null),
                    'url' => $url,
                    'readUrl' => $isArticle ? $url : $full,
                    'access' => ($isArticle || $full) ? 'full' : 'metadata',
                ]);
            }
        }
        return $out;
    }

    private function parseCustom(string $key, array $data): array
    {
        $items = $data['items'] ?? $data['results'] ?? $data['docs'] ?? $data['data'] ?? $data;
        if (!is_array($items) || !array_is_list($items)) {
            return [];
        }
        $out = [];
        foreach (array_slice($items, 0, 10) as $i => $e) {
            if (!is_array($e)) continue;
            $title = $e['title'] ?? $e['name'] ?? $e['volumeInfo']['title'] ?? null;
            if (is_array($title)) $title = $title[0] ?? null;
            if (!$title) continue;
            $author = $e['author'] ?? $e['authors'] ?? $e['creator'] ?? $e['author_name'] ?? [];
            $url = $e['url'] ?? $e['link'] ?? $e['html_url'] ?? null;

            $out[] = $this->make($key, (string) ($e['id'] ?? $e['key'] ?? $i), [
                'type' => 'book',
                'title' => $title,
                'authors' => array_map(fn ($a) => is_array($a) ? ($a['name'] ?? '') : (string) $a, (array) $author),
                'year' => $this->year($e['year'] ?? $e['date'] ?? $e['first_publish_year'] ?? null),
                'publisher' => is_string($e['publisher'] ?? null) ? $e['publisher'] : null,
                'description' => is_string($e['description'] ?? null) ? $e['description'] : ($e['abstract'] ?? null),
                'isbn' => is_string($e['isbn'] ?? null) ? $e['isbn'] : null,
                'url' => is_string($url) ? $url : null,
                'access' => 'metadata',
            ]);
        }
        return $out;
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    /** Build a resource with the canonical overlay schema. */
    public function make(string $source, $externalId, array $f): array
    {
        $externalId = $externalId !== null ? (string) $externalId : md5(($f['title'] ?? '') . $source);
        $desc = $f['description'] ?? null;
        if (is_string($desc)) {
            $desc = trim(html_entity_decode(strip_tags($desc)));
            if ($this->truncateDescriptions && mb_strlen($desc) > 900) {
                $desc = mb_substr($desc, 0, 900) . '…';
            }
        }

        return [
            'uid' => $source . '|' . $externalId,
            'source' => $source,
            'sourceLabel' => $this->label($source),
            'externalId' => $externalId,
            'type' => $f['type'] ?? 'book',
            'title' => is_string($f['title'] ?? null) ? trim($f['title']) : null,
            'subtitle' => $f['subtitle'] ?? null,
            'authors' => array_values(array_filter(array_map(fn ($a) => trim((string) $a), (array) ($f['authors'] ?? [])))),
            'year' => isset($f['year']) && is_numeric($f['year']) ? (int) $f['year'] : null,
            'publisher' => $f['publisher'] ?? null,
            'description' => $desc ?: null,
            'subjects' => array_values(array_filter(array_map(fn ($s) => is_string($s) ? trim($s) : null, (array) ($f['subjects'] ?? [])))),
            'isbn' => $f['isbn'] ?? null,
            'doi' => $f['doi'] ?? null,
            'coverUrl' => $f['coverUrl'] ?? null,
            'url' => $f['url'] ?? null,
            'readUrl' => $f['readUrl'] ?? null,
            'downloadUrl' => $f['downloadUrl'] ?? null,
            'access' => $f['access'] ?? 'metadata',
            'citations' => isset($f['citations']) ? (int) $f['citations'] : null,
            'language' => $f['language'] ?? null,
            'pageCount' => $f['pageCount'] ?? null,
            'downloads' => $f['downloads'] ?? null,
            'holdings' => $f['holdings'] ?? null,
            'appRoute' => $f['appRoute'] ?? null,
        ];
    }

    public function terms(string $q): array
    {
        $q = mb_strtolower($q);
        $q = preg_replace('/[^\p{L}\p{N}\s\-]/u', ' ', $q);
        $stop = ['the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'for', 'to', 'with', 'by', 'at', 'from', 'is', 'are'];
        return array_values(array_filter(
            preg_split('/\s+/', trim($q)),
            fn ($t) => mb_strlen($t) > 1 && !in_array($t, $stop)
        ));
    }

    private function year($value): ?int
    {
        if ($value === null || $value === '') return null;
        if (is_numeric($value)) return (int) $value;
        if (preg_match('/(1[5-9]\d{2}|20\d{2})/', (string) $value, $m)) return (int) $m[1];
        return null;
    }

    private function preferIsbn13(array $list): ?string
    {
        foreach ($list as $i) {
            $c = preg_replace('/[^0-9X]/i', '', (string) $i);
            if (strlen($c) === 13) return $c;
        }
        $first = $list[0] ?? null;
        return $first ? preg_replace('/[^0-9X]/i', '', (string) $first) : null;
    }

    private function cleanDoi(?string $doi): ?string
    {
        if (!$doi) return null;
        return strtolower(preg_replace('#^(https?://(dx\.)?doi\.org/|doi:)#i', '', trim($doi)));
    }

    private function flipName(string $name): string
    {
        // Gutendex returns "Austen, Jane" → "Jane Austen"
        if (str_contains($name, ',')) {
            [$last, $first] = array_map('trim', explode(',', $name, 2));
            return trim("{$first} {$last}");
        }
        return $name;
    }

    private function invertedAbstract(?array $index): ?string
    {
        if (!$index) return null;
        $words = [];
        foreach ($index as $word => $positions) {
            foreach ($positions as $p) {
                $words[$p] = $word;
            }
        }
        ksort($words);
        return implode(' ', $words);
    }
}
