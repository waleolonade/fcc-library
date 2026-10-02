<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * InternetArchiveController
 *
 * Direct integration with the official Internet Archive API:
 * - Advanced Search API: https://archive.org/advancedsearch.php
 * - Item Metadata API:   https://archive.org/metadata/{identifier}
 * - Direct File Downloads: https://archive.org/download/{identifier}/{filename}
 *
 * Enables students to search, view metadata, and read 100% complete books
 * (PDFs, TXT, EPUBs) directly through the library without hitting iframe restrictions.
 */
class InternetArchiveController extends Controller
{
    private const BASE_URL = 'https://archive.org';

    /**
     * GET /api/internet-archive/search
     *
     * Search books on Internet Archive.
     * Supported query parameters:
     *   - q          : Search keyword (title, author, or general term)
     *   - filter     : 'open' (default: 100% free full access) | 'all' (includes CDL borrowable)
     *   - rows       : Number of results (default: 24, max: 50)
     *   - page       : Page number (default: 1)
     *   - sort       : '-downloads' (default) | '-publicdate' | 'titleSorter'
     */
    public function search(Request $request)
    {
        try {
            $userQuery = trim($request->input('q', ''));
            $filter = $request->input('filter', 'open'); // 'open' | 'all'
            $rows = min(max((int)$request->input('rows', 24), 1), 50);
            $page = max((int)$request->input('page', 1), 1);
            $sort = $request->input('sort', '-downloads');

            // Construct advanced query targeting text books
            $queryParts = ['mediatype:(texts)'];

            if ($userQuery !== '') {
                // Escape special solr/lucene syntax characters if not explicitly structured
                $cleaned = preg_replace('/[^\w\s\-\:\(\)]/u', ' ', $userQuery);
                $cleaned = trim(preg_replace('/\s+/', ' ', $cleaned));
                if (!empty($cleaned)) {
                    $queryParts[] = "({$cleaned})";
                }
            } else {
                // Default discovery set
                $queryParts[] = '(collection:opensource OR collection:folkscanomy OR collection:americana)';
            }

            // If user wants only open unrestricted books, filter out access-restricted items
            if ($filter === 'open') {
                $queryParts[] = '(-access-restricted-item:true)';
            }

            $solrQuery = implode(' AND ', $queryParts);

            $fields = [
                'identifier',
                'title',
                'creator',
                'description',
                'year',
                'date',
                'subject',
                'mediatype',
                'publicdate',
                'downloads',
                'format',
                'access-restricted-item',
                'licenseurl'
            ];

            $response = Http::timeout(15)
                ->withHeaders(['Accept' => 'application/json'])
                ->get(self::BASE_URL . '/advancedsearch.php', [
                    'q'      => $solrQuery,
                    'fl'     => $fields,
                    'rows'   => $rows,
                    'page'   => $page,
                    'sort'   => [$sort],
                    'output' => 'json'
                ]);

            if ($response->failed()) {
                Log::warning('Internet Archive search failed', [
                    'status' => $response->status(),
                    'query'  => $solrQuery,
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Internet Archive search unavailable.',
                    'count'   => 0,
                    'results' => []
                ], 502);
            }

            $data = $response->json();
            $numFound = $data['response']['numFound'] ?? 0;
            $rawDocs = $data['response']['docs'] ?? [];

            $results = array_map(function ($doc) {
                $id = $doc['identifier'] ?? '';
                $formats = (array)($doc['format'] ?? []);
                $isRestricted = isset($doc['access-restricted-item']) && $doc['access-restricted-item'] === 'true';

                // Check available document formats
                $hasPdf = in_array('Text PDF', $formats) || in_array('Additional Text PDF', $formats) || in_array('PDF', $formats);
                $hasEpub = in_array('EPUB', $formats);
                $hasTxt = in_array('DjVuTXT', $formats) || in_array('Text', $formats);

                $subjects = isset($doc['subject']) ? (is_array($doc['subject']) ? $doc['subject'] : [$doc['subject']]) : [];
                $creator = isset($doc['creator']) ? (is_array($doc['creator']) ? implode(', ', $doc['creator']) : $doc['creator']) : 'Unknown Author';

                return [
                    'identifier'    => $id,
                    'title'         => $doc['title'] ?? 'Untitled Item',
                    'creator'       => $creator,
                    'year'          => $doc['year'] ?? (isset($doc['date']) ? substr($doc['date'], 0, 4) : null),
                    'description'   => is_array($doc['description'] ?? null) ? implode(' ', $doc['description']) : ($doc['description'] ?? ''),
                    'subjects'      => array_slice($subjects, 0, 10),
                    'downloads'     => (int)($doc['downloads'] ?? 0),
                    'cover_url'     => "https://archive.org/services/img/{$id}",
                    'details_url'   => "https://archive.org/details/{$id}",
                    'is_restricted' => $isRestricted,
                    'has_pdf'       => $hasPdf,
                    'has_epub'      => $hasEpub,
                    'has_txt'       => $hasTxt,
                    'access_level'  => $isRestricted ? 'borrowable' : 'full_open'
                ];
            }, $rawDocs);

            return response()->json([
                'success' => true,
                'count'   => $numFound,
                'page'    => $page,
                'rows'    => $rows,
                'results' => $results
            ]);

        } catch (\Throwable $e) {
            Log::error('InternetArchiveController@search Exception: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error querying Internet Archive API: ' . $e->getMessage(),
                'count'   => 0,
                'results' => []
            ], 500);
        }
    }

    /**
     * GET /api/internet-archive/metadata/{identifier}
     *
     * Retrieves full metadata and direct download files for an Internet Archive item.
     */
    public function metadata(Request $request, $identifier)
    {
        try {
            $identifier = trim($identifier);
            if (empty($identifier)) {
                return response()->json(['success' => false, 'message' => 'Identifier required'], 400);
            }

            $response = Http::timeout(15)
                ->withHeaders(['Accept' => 'application/json'])
                ->get(self::BASE_URL . "/metadata/{$identifier}");

            if ($response->failed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Item not found on Internet Archive.'
                ], 404);
            }

            $raw = $response->json();
            $meta = $raw['metadata'] ?? [];
            $files = $raw['files'] ?? [];

            $isRestricted = isset($meta['access-restricted-item']) && $meta['access-restricted-item'] === 'true';
            $totalPages = $meta['imagecount'] ?? $meta['pages'] ?? null;

            // Resolve best readable files (unencrypted PDFs, text, EPUB)
            $bestPdf = null;
            $bestTxt = null;
            $bestEpub = null;
            $allDownloadable = [];

            foreach ($files as $file) {
                $name = $file['name'] ?? '';
                $format = $file['format'] ?? '';
                $size = (int)($file['size'] ?? 0);

                // Skip encrypted / protected files
                if (str_contains($name, '_encrypted') || str_contains($name, '_lcp') || str_contains($format, 'Encrypted')) {
                    continue;
                }

                $downloadUrl = self::BASE_URL . "/download/{$identifier}/" . rawurlencode($name);

                // PDF resolution
                if (str_ends_with(strtolower($name), '.pdf')) {
                    $itemInfo = [
                        'name'   => $name,
                        'format' => $format,
                        'size'   => $size,
                        'url'    => $downloadUrl
                    ];
                    if ($format === 'Text PDF' || $bestPdf === null || $size > ($bestPdf['size'] ?? 0)) {
                        $bestPdf = $itemInfo;
                    }
                    $allDownloadable[] = $itemInfo;
                }

                // Text / DjVu OCR resolution
                if (str_ends_with(strtolower($name), '_djvu.txt') || str_ends_with(strtolower($name), '.txt')) {
                    if (!str_contains($name, '_meta') && !str_contains($name, '_files')) {
                        $bestTxt = [
                            'name'   => $name,
                            'format' => $format ?: 'Plain Text',
                            'size'   => $size,
                            'url'    => $downloadUrl
                        ];
                    }
                }

                // EPUB resolution
                if (str_ends_with(strtolower($name), '.epub')) {
                    $bestEpub = [
                        'name'   => $name,
                        'format' => 'EPUB',
                        'size'   => $size,
                        'url'    => $downloadUrl
                    ];
                }
            }

            // Determine best reading URL: prioritize direct PDF for full access to all pages
            $readUrl = null;
            $readerType = 'embed';

            if ($bestPdf) {
                $readUrl = $bestPdf['url'];
                $readerType = 'pdf';
            } elseif ($bestTxt) {
                $readUrl = $bestTxt['url'];
                $readerType = 'txt';
            } else {
                $readUrl = self::BASE_URL . "/details/{$identifier}?view=theater&ui=embed";
                $readerType = 'embed';
            }

            $creator = $meta['creator'] ?? 'Unknown Author';
            if (is_array($creator)) {
                $creator = implode(', ', $creator);
            }

            $subjects = $meta['subject'] ?? [];
            if (!is_array($subjects)) {
                $subjects = [$subjects];
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'identifier'    => $identifier,
                    'title'         => $meta['title'] ?? $identifier,
                    'creator'       => $creator,
                    'year'          => $meta['year'] ?? (isset($meta['date']) ? substr($meta['date'], 0, 4) : null),
                    'date'          => $meta['date'] ?? null,
                    'publisher'     => $meta['publisher'] ?? null,
                    'description'   => is_array($meta['description'] ?? null) ? implode(' ', $meta['description']) : ($meta['description'] ?? ''),
                    'language'      => $meta['language'] ?? 'eng',
                    'subjects'      => $subjects,
                    'total_pages'   => $totalPages,
                    'is_restricted' => $isRestricted,
                    'can_read_full' => ($bestPdf !== null || $bestTxt !== null || !$isRestricted),
                    'cover_url'     => self::BASE_URL . "/services/img/{$identifier}",
                    'details_url'   => self::BASE_URL . "/details/{$identifier}",
                    'borrow_url'    => self::BASE_URL . "/details/{$identifier}",
                    'read_url'      => $readUrl,
                    'reader_type'   => $readerType,
                    'files' => [
                        'pdf'  => $bestPdf,
                        'epub' => $bestEpub,
                        'txt'  => $bestTxt,
                        'all'  => $allDownloadable
                    ]
                ]
            ]);

        } catch (\Throwable $e) {
            Log::error("InternetArchiveController@metadata Exception for {$identifier}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving item metadata: ' . $e->getMessage()
            ], 500);
        }
    }
}
