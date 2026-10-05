<?php

namespace App\Services\Overlay;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * TaskPlanner
 *
 * Turns a student's natural-language request ("I need recent papers on
 * cooperative banking in Nigeria for my HND project") into a concrete
 * fetch plan:
 *
 *   - the clean search query  ("cooperative banking nigeria")
 *   - the intents behind it   (research, recent, thesis…)
 *   - filters                 (yearFrom, freeOnly, author…)
 *   - which APIs to call, and why
 *
 * If GEMINI_API_KEY is configured the plan is produced by Gemini and
 * validated; otherwise (or on any failure) the built-in rule engine runs.
 */
class TaskPlanner
{
    private const INTENT_SIGNALS = [
        'research' => ['paper', 'papers', 'journal', 'journals', 'article', 'articles', 'peer', 'peer-reviewed', 'study', 'studies', 'literature review', 'empirical', 'scholarly', 'publication', 'publications', 'conference', 'citation', 'citations'],
        'textbook' => ['textbook', 'textbooks', 'book', 'books', 'course', 'syllabus', 'exam', 'lecture', 'introduction to', 'principles of', 'fundamentals', 'handbook', 'manual', 'guide'],
        'free' => ['free', 'download', 'pdf', 'read online', 'full text', 'full-text', 'open access', 'ebook', 'e-book', 'epub', 'read now'],
        'classic' => ['novel', 'novels', 'classic', 'classics', 'poetry', 'poem', 'poems', 'fiction', 'literature', 'drama', 'play', 'shakespeare', 'philosophy'],
        'history' => ['history', 'historical', 'archive', 'archives', 'colonial', 'old', 'newspaper', 'newspapers', 'century', 'heritage', 'manuscript'],
        'borrow' => ['borrow', 'shelf', 'physical', 'library copy', 'hard copy', 'hardcopy', 'available in the library', 'check out', 'checkout', 'on campus'],
        'thesis' => ['project', 'projects', 'thesis', 'theses', 'dissertation', 'dissertations', 'hnd project', 'nd project', 'capstone', 'past project'],
        'recent' => ['recent', 'latest', 'current', 'new', 'newest', 'up to date', 'up-to-date', 'modern'],
    ];

    private const DOMAIN_SIGNALS = [
        'science' => ['agric', 'agriculture', 'agricultural', 'farm', 'farming', 'crop', 'crops', 'livestock', 'poultry', 'fishery', 'soil', 'health', 'medical', 'medicine', 'nutrition', 'biology', 'food', 'veterinary', 'disease', 'environment'],
        'computing' => ['computer', 'computing', 'software', 'algorithm', 'algorithms', 'programming', 'machine learning', 'artificial intelligence', 'ai', 'data', 'database', 'network', 'networks', 'cyber', 'security', 'statistics', 'mathematics', 'math', 'econometrics', 'quantitative'],
    ];

    private const FILLER = [
        "i'm looking for", 'i am looking for', 'looking for', 'i need', 'i want', 'i would like', "i'd like",
        'can you', 'could you', 'please', 'help me', 'find me', 'get me', 'give me', 'show me', 'search for',
        'recommend', 'suggest', 'find', 'some', 'any', 'good', 'best', 'materials', 'material', 'resources',
        'resource', 'sources', 'source', 'information', 'reading', 'readings', 'references', 'reference',
        'related to', 'relating to', 'regarding', 'concerning', 'about', 'on the topic of', 'topic',
        'that i can', 'which i can', 'i can', 'to read', 'to download', 'to borrow',
    ];

    private const GENERIC_WORDS = [
        'book', 'books', 'textbook', 'textbooks', 'ebook', 'ebooks', 'e-book', 'paper', 'papers', 'article', 'articles',
        'journal', 'journals', 'research', 'study', 'studies', 'free', 'pdf', 'download', 'online', 'read', 'borrow',
        'library', 'available', 'recent', 'latest', 'current', 'new', 'newest', 'my', 'me', 'assignment', 'project',
        'thesis', 'seminar', 'essay', 'exam', 'course', 'class', 'term', 'hnd', 'nd', 'scholarly', 'peer', 'reviewed',
        'peer-reviewed', 'full', 'text', 'open', 'access', 'copy', 'copies', 'shelf', 'physical', 'need', 'want', 'get',
        'publications', 'publication', 'novel', 'novels', 'classic', 'classics', 'that', 'which', 'can', 'will', 'should',
        'years', 'year', 'last', 'past', 'since', 'after', 'before', 'between', 'from', 'until', 'up', 'date',
    ];

    public function __construct(private SourceRegistry $registry)
    {
    }

    public function plan(string $request): array
    {
        $request = trim($request);
        $rules = $this->rulePlan($request);

        if (config('services.overlay.gemini_key')) {
            $ai = $this->geminiPlan($request, $rules);
            if ($ai) {
                return $ai;
            }
        }

        return $rules;
    }

    // ---------------------------------------------------------------------
    // Rule-based planner
    // ---------------------------------------------------------------------

    public function rulePlan(string $request): array
    {
        $lower = mb_strtolower($request);
        $enabled = $this->registry->enabledKeys();
        $filters = ['yearFrom' => null, 'yearTo' => null, 'freeOnly' => false, 'author' => null];
        $identifiers = ['isbn' => null, 'doi' => null];

        // 1. Direct identifiers short-circuit everything else.
        if (preg_match('/\b10\.\d{4,9}\/[^\s"<>]+/i', $request, $m)) {
            $identifiers['doi'] = rtrim($m[0], '.,;)');
        }
        if (preg_match('/\b(97[89][\d\- ]{10,16}|\d{9}[\dXx])\b/', $request, $m)) {
            $digits = preg_replace('/[^\dXx]/', '', $m[1]);
            if (in_array(strlen($digits), [10, 13])) {
                $identifiers['isbn'] = strtoupper($digits);
            }
        }

        // 2. Intents & domains.
        $intents = [];
        foreach (self::INTENT_SIGNALS as $intent => $signals) {
            foreach ($signals as $s) {
                if (preg_match('/\b' . preg_quote($s, '/') . '\b/u', $lower)) {
                    $intents[] = $intent;
                    break;
                }
            }
        }
        $domains = [];
        foreach (self::DOMAIN_SIGNALS as $domain => $signals) {
            foreach ($signals as $s) {
                if (preg_match('/\b' . preg_quote($s, '/') . '/u', $lower)) {
                    $domains[] = $domain;
                    break;
                }
            }
        }

        // 3. Filters.
        $now = (int) date('Y');
        if (preg_match('/between\s+(\d{4})\s+(?:and|to|-)\s+(\d{4})/', $lower, $m)) {
            $filters['yearFrom'] = (int) $m[1];
            $filters['yearTo'] = (int) $m[2];
        } else {
            if (preg_match('/(?:since|after|from)\s+(\d{4})/', $lower, $m)) {
                $filters['yearFrom'] = (int) $m[1];
            }
            if (preg_match('/(?:before|until|up to|prior to)\s+(\d{4})/', $lower, $m)) {
                $filters['yearTo'] = (int) $m[1];
            }
            if (preg_match('/(?:last|past)\s+(\d{1,2})\s+years?/', $lower, $m)) {
                $filters['yearFrom'] = $now - (int) $m[1];
            }
        }
        if (in_array('recent', $intents) && !$filters['yearFrom']) {
            $filters['yearFrom'] = $now - 5;
        }
        if (in_array('free', $intents)) {
            $filters['freeOnly'] = true;
        }
        if (preg_match("/\bby\s+((?:[A-Z][\w.\-']*\s?){1,4})/u", $request, $m)) {
            $filters['author'] = trim($m[1]);
        }

        // 4. Clean topic query.
        $query = $this->extractTopic($request, $filters['author']);
        if ($identifiers['isbn']) {
            $query = $identifiers['isbn'];
        } elseif ($identifiers['doi']) {
            $query = $identifiers['doi'];
        }
        $fullQuery = trim($query . ($filters['author'] ? ' ' . $filters['author'] : ''));

        // 5. Pick sources.
        [$sources, $reasons] = $this->chooseSources($intents, $domains, $identifiers, $enabled);
        $types = $this->typesFor($intents);

        return $this->finalise([
            'request' => $request,
            'query' => $fullQuery !== '' ? $fullQuery : $request,
            'topic' => $query,
            'intents' => array_values(array_unique($intents)),
            'domains' => $domains,
            'types' => $types,
            'filters' => $filters,
            'identifiers' => $identifiers,
            'sources' => $sources,
            'reasons' => $reasons,
            'planner' => 'rules',
        ]);
    }

    private function extractTopic(string $request, ?string $author): string
    {
        $t = mb_strtolower($request);
        if ($author) {
            $t = str_replace('by ' . mb_strtolower($author), ' ', $t);
        }
        // Remove "for my HND project/assignment…" style tails.
        $t = preg_replace('/\bfor (?:my|our|a|an|the)\s+(?:\w+\s+){0,2}(?:assignment|project|thesis|seminar|essay|exam|exams|course|class|term paper|research|presentation|report|homework)\b/u', ' ', $t);
        // Remove time filters.
        $t = preg_replace('/\b(?:since|after|from|before|until|up to|prior to)\s+\d{4}\b|\bbetween\s+\d{4}\s+(?:and|to|-)\s+\d{4}\b|\b(?:last|past)\s+\d{1,2}\s+years?\b/u', ' ', $t);
        foreach (self::FILLER as $f) {
            $t = preg_replace('/\b' . preg_quote($f, '/') . '\b/u', ' ', $t);
        }
        $terms = $this->registry->terms($t);
        $specific = array_values(array_filter($terms, fn ($w) => !in_array($w, self::GENERIC_WORDS)));
        $chosen = $specific ?: $terms;
        return implode(' ', array_slice($chosen, 0, 8));
    }

    /** @return array{0: array, 1: array} */
    private function chooseSources(array $intents, array $domains, array $ids, array $enabled): array
    {
        $picked = [];
        $add = function (string $key, string $why) use (&$picked) {
            if (!isset($picked[$key])) {
                $picked[$key] = $why;
            }
        };

        $add('local', 'Checks what FCC already owns (shelf copies, uploads, past projects).');

        if ($ids['isbn']) {
            $add('google_books', 'Looks the ISBN up in Google Books.');
            $add('open_library', 'Looks the ISBN up in Open Library (borrowable scans).');
        } elseif ($ids['doi']) {
            $add('openalex', 'Resolves the DOI and finds an open-access copy.');
            $add('crossref', 'Gets the official publisher record for the DOI.');
            $add('semantic_scholar', 'Finds a free PDF of the paper if one exists.');
        } else {
            $i = array_flip($intents);
            $d = array_flip($domains);
            $hasFocus = isset($i['research']) || isset($i['textbook']) || isset($i['classic']) || isset($i['history']) || isset($i['thesis']);

            if (isset($i['research']) || isset($i['thesis'])) {
                $add('openalex', 'Best coverage of scholarly papers, with open-access links.');
                $add('crossref', 'Official DOI records for journal articles.');
                $add('semantic_scholar', 'Adds citation counts and free PDFs.');
                if (isset($d['science'])) $add('europepmc', 'Specialist index for agriculture, health and life sciences.');
                if (isset($d['computing'])) $add('arxiv', 'Free pre-prints for computing, maths and economics.');
            }
            if (isset($i['textbook']) || !$hasFocus) {
                $add('google_books', 'Largest book index, with page previews.');
                $add('open_library', 'Free catalogue with borrowable digital copies.');
                $add('doab', 'Peer-reviewed academic books that are free to read.');
            }
            if (isset($i['classic'])) {
                $add('gutendex', 'Free public-domain classics.');
                $add('internet_archive', 'Digitised editions, free to read.');
                $add('open_library', 'More editions and borrowable copies.');
            }
            if (isset($i['history'])) {
                $add('internet_archive', 'Historical books and documents.');
                $add('loc', 'Library of Congress historical collections.');
                $add('trove', 'Historical newspapers and archives.');
            }
            if (isset($i['free'])) {
                $add('doab', 'Free, peer-reviewed academic books.');
                $add('internet_archive', 'Free digitised texts.');
                if (isset($i['research'])) $add('arxiv', 'Free research pre-prints.');
            }
            if (isset($i['borrow'])) {
                $add('open_library', 'Digital loans when the shelf copy is out.');
            }
            if (!$hasFocus) {
                $add('openalex', 'Adds relevant scholarly papers.');
                $add('internet_archive', 'Adds free digitised texts.');
            }
        }

        // Keep only enabled sources, max 8 network calls + local.
        $final = [];
        $reasons = [];
        foreach ($picked as $key => $why) {
            if (in_array($key, $enabled, true)) {
                $final[] = $key;
                $reasons[$key] = $why;
            }
            if (count($final) >= 9) break;
        }

        return [$final, $reasons];
    }

    private function typesFor(array $intents): array
    {
        $types = [];
        if (in_array('research', $intents)) array_push($types, 'paper');
        if (in_array('thesis', $intents)) array_push($types, 'thesis', 'paper');
        if (in_array('textbook', $intents)) array_push($types, 'book', 'ebook');
        if (in_array('classic', $intents) || in_array('free', $intents)) array_push($types, 'ebook');
        if (in_array('history', $intents)) array_push($types, 'archive', 'newspaper');
        return array_values(array_unique($types));
    }

    /** Add human-readable "how I'm handling this" steps. */
    private function finalise(array $plan): array
    {
        $steps = [];
        $understood = 'Topic: "' . ($plan['topic'] ?: $plan['query']) . '"';
        if ($plan['identifiers']['isbn']) $understood = 'ISBN lookup: ' . $plan['identifiers']['isbn'];
        if ($plan['identifiers']['doi']) $understood = 'DOI lookup: ' . $plan['identifiers']['doi'];
        $steps[] = $understood;

        $f = $plan['filters'];
        $bits = [];
        if ($plan['intents']) $bits[] = 'needs: ' . implode(', ', $plan['intents']);
        if ($f['yearFrom'] || $f['yearTo']) $bits[] = 'published ' . ($f['yearFrom'] ?: '…') . '–' . ($f['yearTo'] ?: 'now');
        if ($f['freeOnly']) $bits[] = 'free to read only';
        if ($f['author']) $bits[] = 'author: ' . $f['author'];
        if ($bits) $steps[] = ucfirst(implode(' · ', $bits));

        $steps[] = 'Fetching live from ' . count($plan['sources']) . ' sources in parallel';
        $steps[] = 'Merging duplicates and ranking by relevance and access';

        $plan['steps'] = $steps;
        $plan['sourceDetails'] = array_map(fn ($k) => [
            'key' => $k,
            'label' => $this->registry->label($k),
            'reason' => $plan['reasons'][$k] ?? null,
        ], $plan['sources']);
        unset($plan['reasons']);

        return $plan;
    }

    // ---------------------------------------------------------------------
    // Optional Gemini planner
    // ---------------------------------------------------------------------

    private function geminiPlan(string $request, array $fallback): ?array
    {
        $catalog = array_map(
            fn ($s) => "- {$s['key']}: {$s['description']} (types: " . implode(',', $s['types']) . ')',
            array_filter($this->registry->all(), fn ($s) => $s['enabled'])
        );

        $prompt = "You plan library searches for students at the Federal Cooperative College, Ibadan (Nigeria).\n"
            . "Convert the student's request into a JSON search plan.\n\n"
            . "Available sources:\n" . implode("\n", $catalog) . "\n\n"
            . "Return ONLY JSON with keys:\n"
            . "  topic (string, 2-8 search keywords, no filler words),\n"
            . "  intents (array from: research, textbook, free, classic, history, borrow, thesis, recent),\n"
            . "  types (array from: book, ebook, paper, thesis, archive, newspaper),\n"
            . "  yearFrom (int|null), yearTo (int|null), freeOnly (bool), author (string|null),\n"
            . "  sources (array of 3-8 source keys from the list above; always include \"local\"),\n"
            . "  reasons (object mapping each chosen source key to a short reason).\n\n"
            . "Student request: \"" . str_replace('"', "'", $request) . '"';

        try {
            $model = config('services.overlay.gemini_model');
            $res = Http::timeout(10)->post(
                "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . config('services.overlay.gemini_key'),
                [
                    'contents' => [['parts' => [['text' => $prompt]]]],
                    'generationConfig' => ['responseMimeType' => 'application/json', 'temperature' => 0.2],
                ]
            );
            if (!$res->successful()) {
                Log::info('Overlay Gemini planner HTTP ' . $res->status());
                return null;
            }
            $json = json_decode($res->json('candidates.0.content.parts.0.text') ?? '', true);
            if (!is_array($json) || empty($json['topic'])) {
                return null;
            }

            $enabled = $this->registry->enabledKeys();
            $sources = array_values(array_intersect((array) ($json['sources'] ?? []), $enabled));
            if (!in_array('local', $sources) && in_array('local', $enabled)) {
                array_unshift($sources, 'local');
            }
            if (count($sources) < 2) {
                $sources = $fallback['sources'];
            }
            $reasons = [];
            foreach ($sources as $k) {
                $reasons[$k] = $json['reasons'][$k] ?? null;
            }

            $allowedIntents = array_keys(self::INTENT_SIGNALS);
            $allowedTypes = ['book', 'ebook', 'paper', 'thesis', 'archive', 'newspaper'];
            $filters = [
                'yearFrom' => is_numeric($json['yearFrom'] ?? null) ? (int) $json['yearFrom'] : null,
                'yearTo' => is_numeric($json['yearTo'] ?? null) ? (int) $json['yearTo'] : null,
                'freeOnly' => (bool) ($json['freeOnly'] ?? false),
                'author' => is_string($json['author'] ?? null) && $json['author'] !== '' ? $json['author'] : null,
            ];
            $topic = trim((string) $json['topic']);
            $ids = $fallback['identifiers'];

            return $this->finalise([
                'request' => $request,
                'query' => $ids['isbn'] ?? $ids['doi'] ?? trim($topic . ($filters['author'] ? ' ' . $filters['author'] : '')),
                'topic' => $topic,
                'intents' => array_values(array_intersect((array) ($json['intents'] ?? []), $allowedIntents)),
                'domains' => $fallback['domains'],
                'types' => array_values(array_intersect((array) ($json['types'] ?? []), $allowedTypes)),
                'filters' => $filters,
                'identifiers' => $ids,
                'sources' => array_slice($sources, 0, 9),
                'reasons' => $reasons,
                'planner' => 'gemini',
            ]);
        } catch (\Throwable $e) {
            Log::info('Overlay Gemini planner failed: ' . $e->getMessage());
            return null;
        }
    }

    // ---------------------------------------------------------------------
    // Result briefing
    // ---------------------------------------------------------------------

    /** Short, student-friendly summary of what was found. */
    public function brief(array $plan, array $results, array $sourceStatus): string
    {
        $total = count($results);
        $ok = count(array_filter($sourceStatus, fn ($s) => in_array($s['status'], ['ok', 'cached'])));
        if ($total === 0) {
            return "I checked {$ok} sources but couldn't find a match for \"{$plan['topic']}\". Try fewer or broader keywords, or remove the year or free-only filters.";
        }

        $shelf = count(array_filter($results, fn ($r) => $r['access'] === 'on_shelf'));
        $free = count(array_filter($results, fn ($r) => $r['access'] === 'full'));
        $papers = count(array_filter($results, fn ($r) => $r['type'] === 'paper'));
        $theses = count(array_filter($results, fn ($r) => $r['type'] === 'thesis'));

        $parts = [];
        if ($shelf) $parts[] = "{$shelf} on the shelf at FCC";
        if ($free) $parts[] = "{$free} free to read online now";
        if ($papers) $parts[] = "{$papers} scholarly papers";
        if ($theses) $parts[] = "{$theses} projects/theses";

        $msg = "I searched {$ok} sources live and found {$total} resources";
        $msg .= $parts ? ' — ' . implode(', ', $parts) . '.' : '.';

        $top = $results[0];
        $msg .= ' Top match: "' . $top['title'] . '"';
        if (!empty($top['authors'])) $msg .= ' by ' . implode(', ', array_slice($top['authors'], 0, 2));
        $msg .= ' (' . $top['sourceLabel'] . ').';

        return $msg;
    }
}
