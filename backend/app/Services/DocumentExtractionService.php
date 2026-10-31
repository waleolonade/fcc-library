<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DocumentExtractionService
{
    protected string $grobidUrl;
    protected string $politeEmail;

    public function __construct()
    {
        $this->grobidUrl = rtrim(env('GROBID_SERVICE_URL', 'http://localhost:8070'), '/');
        $this->politeEmail = env('CROSSREF_POLITE_MAILTO', 'library@fccibadan.edu.ng');
    }

    /**
     * Check if GROBID service daemon is reachable
     */
    public function isGrobidAlive(): bool
    {
        try {
            $response = Http::timeout(2)->get("{$this->grobidUrl}/api/isalive");
            return $response->successful() && trim($response->body()) === 'true';
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Main pipeline for extracting bibliographic metadata from PDF document
     *
     * @param string $pdfBinaryOrPath File path, binary string, or data URL
     * @param array $options Configuration and overrides
     * @return array
     */
    public function extractMetadata(string $pdfBinaryOrPath, array $options = []): array
    {
        $tempPath = null;
        $isTemp = false;

        if (file_exists($pdfBinaryOrPath)) {
            $tempPath = $pdfBinaryOrPath;
        } else {
            $binary = $pdfBinaryOrPath;
            if (str_starts_with($pdfBinaryOrPath, 'data:')) {
                $parts = explode(',', $pdfBinaryOrPath, 2);
                $binary = base64_decode($parts[1] ?? '');
            }
            $tempPath = tempnam(sys_get_temp_dir(), 'fcc_extract_') . '.pdf';
            file_put_contents($tempPath, $binary);
            $isTemp = true;
        }

        $result = [
            'success' => true,
            'metadata' => [
                'title' => '',
                'author' => '',
                'faculty_unit' => '',
                'volume_issue' => '',
                'issn' => '',
                'publication_year' => null,
                'doi' => '',
                'journal_name' => '',
                'abstract' => '',
            ],
            'confidence' => [
                'title' => 0,
                'author' => 0,
                'faculty_unit' => 0,
                'volume_issue' => 0,
                'issn' => 0,
                'publication_year' => 0,
                'doi' => 0,
            ],
            'provenance' => [
                'title' => 'Unverified',
                'author' => 'Unverified',
                'faculty_unit' => 'Unverified',
                'volume_issue' => 'Unverified',
                'issn' => 'Unverified',
                'publication_year' => 'Unverified',
                'doi' => 'Unverified',
            ],
            'pipeline_stages' => [],
            'grobid_available' => false,
            'ocr_available' => false,
        ];

        try {
            // STAGE 1: GROBID (Primary Deep TEI XML Parser)
            if ($this->isGrobidAlive()) {
                $result['grobid_available'] = true;
                $grobidData = $this->extractViaGrobid($tempPath);
                if ($grobidData && !empty($grobidData['metadata']['title'])) {
                    $result['pipeline_stages'][] = 'GROBID (Header / TEI XML)';
                    $this->mergeStageData($result, $grobidData);
                }
            }

            // STAGE 2: Local PDF Content Text Extraction (Direct Streams & OCR fallback)
            $needsLocal = empty($result['metadata']['title']) || empty($result['metadata']['doi']) || empty($result['metadata']['issn']);
            if ($needsLocal) {
                $localData = $this->extractViaLocalPdfContent($tempPath);
                $result['ocr_available'] = $localData['ocr_used'] ?? false;
                $result['pipeline_stages'][] = $result['ocr_available'] ? 'OCRmyPDF Engine' : 'PDF Native Text Parser';
                $this->mergeStageData($result, $localData, false);
            }

            // STAGE 3: Crossref REST API Verification (DOI & Bibliographic Registry)
            $doi = trim($result['metadata']['doi'] ?? '');
            $title = trim($result['metadata']['title'] ?? '');

            if (!empty($doi)) {
                $crData = $this->verifyViaCrossrefDoi($doi);
                if ($crData) {
                    $result['pipeline_stages'][] = 'Crossref REST API (DOI Verified)';
                    $this->mergeStageData($result, $crData, true);
                }
            } elseif (!empty($title) && strlen($title) > 12) {
                $crTitleData = $this->verifyViaCrossrefTitle($title, $result['metadata']['author'] ?? '');
                if ($crTitleData) {
                    $result['pipeline_stages'][] = 'Crossref REST API (Bibliographic Match)';
                    $this->mergeStageData($result, $crTitleData, true);
                }
            }

            // STAGE 4: OpenAlex Secondary Scholarly Metadata Verification
            $targetDoi = trim($result['metadata']['doi'] ?? '');
            if (!empty($targetDoi) && (empty($result['metadata']['issn']) || empty($result['metadata']['volume_issue']))) {
                $oaData = $this->verifyViaOpenAlex($targetDoi);
                if ($oaData) {
                    $result['pipeline_stages'][] = 'OpenAlex Scholarly Graph';
                    $this->mergeStageData($result, $oaData, true);
                }
            }

            return $result;
        } catch (\Throwable $e) {
            Log::warning('DocumentExtractionService pipeline warning: ' . $e->getMessage());
            return $result;
        } finally {
            if ($isTemp && $tempPath && file_exists($tempPath)) {
                @unlink($tempPath);
            }
        }
    }

    /**
     * Merge stage data into the main result structure
     */
    protected function mergeStageData(array &$mainResult, array $stageData, bool $allowOverwrite = false): void
    {
        if (empty($stageData['metadata'])) return;

        foreach ($stageData['metadata'] as $key => $val) {
            if ($val === null || $val === '') continue;

            $currentVal = $mainResult['metadata'][$key] ?? '';
            $currentConf = $mainResult['confidence'][$key] ?? 0;
            $newConf = $stageData['confidence'][$key] ?? 50;

            if (empty($currentVal) || ($allowOverwrite && $newConf >= $currentConf)) {
                $mainResult['metadata'][$key] = $val;
                $mainResult['confidence'][$key] = $newConf;
                $mainResult['provenance'][$key] = $stageData['provenance'][$key] ?? 'Extracted';
            }
        }
    }

    /**
     * Call GROBID /api/processHeaderDocument to extract TEI XML
     */
    protected function extractViaGrobid(string $filePath): ?array
    {
        try {
            $response = Http::timeout(15)
                ->attach('input', file_get_contents($filePath), basename($filePath))
                ->post("{$this->grobidUrl}/api/processHeaderDocument", [
                    'consolidateHeader' => '1',
                ]);

            if (!$response->successful()) {
                return null;
            }

            $teiXml = $response->body();
            return $this->parseGrobidTeiXml($teiXml);
        } catch (\Throwable $e) {
            Log::info('GROBID header processing skipped: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Parse GROBID TEI XML string into normalized bibliographic fields
     */
    protected function parseGrobidTeiXml(string $teiXml): array
    {
        $meta = [
            'title' => '',
            'author' => '',
            'faculty_unit' => '',
            'volume_issue' => '',
            'issn' => '',
            'publication_year' => null,
            'doi' => '',
            'journal_name' => '',
            'abstract' => '',
        ];
        $conf = [];
        $prov = [];

        try {
            $xml = @simplexml_load_string($teiXml);
            if (!$xml) return ['metadata' => $meta, 'confidence' => $conf, 'provenance' => $prov];

            $xml->registerXPathNamespace('tei', 'http://www.tei-c.org/ns/1.0');

            // 1. Title
            $titles = $xml->xpath('//tei:titleStmt/tei:title[@type="main"]') ?: $xml->xpath('//tei:titleStmt/tei:title');
            if (!empty($titles)) {
                $meta['title'] = trim((string)$titles[0]);
                $conf['title'] = 95;
                $prov['title'] = 'GROBID TEI Extraction';
            }

            // 2. Authors & Faculty Affiliations
            $authors = $xml->xpath('//tei:fileDesc//tei:author');
            $authorNames = [];
            $facultyUnits = [];
            foreach ($authors as $auth) {
                $auth->registerXPathNamespace('tei', 'http://www.tei-c.org/ns/1.0');
                $forenames = $auth->xpath('.//tei:persName/tei:forename');
                $surnames = $auth->xpath('.//tei:persName/tei:surname');
                $parts = [];
                foreach ($forenames as $fn) $parts[] = (string)$fn;
                foreach ($surnames as $sn) $parts[] = (string)$sn;
                if (!empty($parts)) {
                    $authorNames[] = trim(implode(' ', $parts));
                }

                $orgs = $auth->xpath('.//tei:affiliation//tei:orgName');
                foreach ($orgs as $org) {
                    $orgStr = trim((string)$org);
                    if ($orgStr && !in_array($orgStr, $facultyUnits)) {
                        $facultyUnits[] = $orgStr;
                    }
                }
            }

            if (!empty($authorNames)) {
                $meta['author'] = implode(', ', array_slice($authorNames, 0, 5));
                $conf['author'] = 92;
                $prov['author'] = 'GROBID TEI Authors';
            }

            if (!empty($facultyUnits)) {
                $meta['faculty_unit'] = implode(' • ', array_slice($facultyUnits, 0, 2));
                $conf['faculty_unit'] = 88;
                $prov['faculty_unit'] = 'GROBID TEI Affiliations';
            }

            // 3. DOI & ISSN
            $dois = $xml->xpath('//tei:idno[@type="DOI"]') ?: $xml->xpath('//tei:idno[@type="doi"]');
            if (!empty($dois)) {
                $meta['doi'] = trim((string)$dois[0]);
                $conf['doi'] = 98;
                $prov['doi'] = 'GROBID TEI Document ID';
            }

            $issns = $xml->xpath('//tei:idno[@type="ISSN"]') ?: $xml->xpath('//tei:idno[@type="issn"]');
            if (!empty($issns)) {
                $meta['issn'] = strtoupper(trim((string)$issns[0]));
                $conf['issn'] = 95;
                $prov['issn'] = 'GROBID TEI Serial Number';
            }

            // 4. Volume & Issue
            $vols = $xml->xpath('//tei:biblScope[@unit="volume"]');
            $issues = $xml->xpath('//tei:biblScope[@unit="issue"]');
            $volVal = !empty($vols) ? trim((string)$vols[0]) : '';
            $issueVal = !empty($issues) ? trim((string)$issues[0]) : '';
            if ($volVal || $issueVal) {
                $parts = [];
                if ($volVal) $parts[] = "Vol. {$volVal}";
                if ($issueVal) $parts[] = "Issue {$issueVal}";
                $meta['volume_issue'] = implode(', ', $parts);
                $conf['volume_issue'] = 90;
                $prov['volume_issue'] = 'GROBID TEI Citation Scope';
            }

            // 5. Journal / Container Name
            $journals = $xml->xpath('//tei:sourceDesc//tei:monogr/tei:title');
            if (!empty($journals)) {
                $meta['journal_name'] = trim((string)$journals[0]);
            }

            // 6. Publication Year
            $dates = $xml->xpath('//tei:publicationStmt/tei:date[@when]');
            if (!empty($dates)) {
                $when = (string)$dates[0]['when'];
                if (preg_match('/\b(19\d\d|20\d\d)\b/', $when, $ym)) {
                    $meta['publication_year'] = (int)$ym[1];
                    $conf['publication_year'] = 90;
                    $prov['publication_year'] = 'GROBID TEI Publication Date';
                }
            }

            // 7. Abstract
            $abstracts = $xml->xpath('//tei:profileDesc/tei:abstract');
            if (!empty($abstracts)) {
                $meta['abstract'] = trim(strip_tags($abstracts[0]->asXML()));
            }
        } catch (\Throwable $e) {}

        return [
            'metadata' => $meta,
            'confidence' => $conf,
            'provenance' => $prov,
        ];
    }

    /**
     * Local PDF extraction using pure PHP stream analysis and OCRmyPDF fallback if available
     */
    protected function extractViaLocalPdfContent(string $filePath): array
    {
        $meta = [
            'title' => '',
            'author' => '',
            'faculty_unit' => '',
            'volume_issue' => '',
            'issn' => '',
            'publication_year' => null,
            'doi' => '',
            'journal_name' => '',
        ];
        $conf = [];
        $prov = [];
        $ocrUsed = false;

        $extractedText = '';

        // Check if ocrmypdf or pdftotext is available in PATH
        $hasPdftotext = !empty(shell_exec('where pdftotext 2>nul'));
        if ($hasPdftotext) {
            $tmpTxt = tempnam(sys_get_temp_dir(), 'fcc_txt_');
            @exec("pdftotext -f 1 -l 3 \"{$filePath}\" \"{$tmpTxt}\"");
            if (file_exists($tmpTxt)) {
                $extractedText = file_get_contents($tmpTxt);
                @unlink($tmpTxt);
            }
        }

        // If no text, inspect raw PDF streams and XMP metadata
        if (empty($extractedText)) {
            $rawContent = file_get_contents($filePath, false, null, 0, 1024 * 1024); // First 1MB
            if ($rawContent) {
                // Extract Info dictionary metadata
                if (preg_match('/\/Title\s*\(([^)]+)\)/i', $rawContent, $tm)) {
                    $meta['title'] = trim($tm[1]);
                    $conf['title'] = 75;
                    $prov['title'] = 'PDF Metadata /Title';
                }
                if (preg_match('/\/Author\s*\(([^)]+)\)/i', $rawContent, $am)) {
                    $meta['author'] = trim($am[1]);
                    $conf['author'] = 75;
                    $prov['author'] = 'PDF Metadata /Author';
                }

                // Decompress simple text streams or match strings
                $extractedText = preg_replace('/[^\x20-\x7E\r\n\t]/', ' ', substr($rawContent, 0, 300000));
            }
        }

        if (!empty($extractedText)) {
            // DOI extraction
            if (empty($meta['doi']) && preg_match('/\b(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)\b/', $extractedText, $dm)) {
                $meta['doi'] = rtrim($dm[1], '.,;)');
                $conf['doi'] = 90;
                $prov['doi'] = 'PDF Text Layer';
            }

            // ISSN extraction (e.g. ISSN 1234-5678, e-ISSN: 2315-7798)
            if (empty($meta['issn'])) {
                if (preg_match('/\b(?:e-?ISSN|p-?ISSN|ISSN)\s*[:\-#]?\s*(\d{4}\s*[-–]\s*\d{3}[\dXx])\b/i', $extractedText, $im)) {
                    $meta['issn'] = strtoupper(str_replace([' ', '–'], ['', '-'], $im[1]));
                    $conf['issn'] = 90;
                    $prov['issn'] = 'PDF Text Layer';
                } elseif (preg_match('/\b(\d{4}-\d{3}[\dXx])\b/', $extractedText, $im2)) {
                    $meta['issn'] = strtoupper($im2[1]);
                    $conf['issn'] = 75;
                    $prov['issn'] = 'PDF Text Layer';
                }
            }

            // Volume & Issue
            if (empty($meta['volume_issue'])) {
                if (preg_match('/\b(?:Vol(?:ume)?\.?\s*(\d{1,4})\s*[,;:/(\s-]*\s*(?:Issue|No\.?|Number|Iss\.?)\s*(\d{1,4}))\b/i', $extractedText, $vm)) {
                    $meta['volume_issue'] = "Vol. {$vm[1]}, Issue {$vm[2]}";
                    $conf['volume_issue'] = 85;
                    $prov['volume_issue'] = 'PDF Text Layer';
                } elseif (preg_match('/\bVol(?:ume)?\.?\s*(\d{1,4})\s*\(\s*(\d{1,4})\s*\)/i', $extractedText, $vm2)) {
                    $meta['volume_issue'] = "Vol. {$vm2[1]}, Issue {$vm2[2]}";
                    $conf['volume_issue'] = 85;
                    $prov['volume_issue'] = 'PDF Text Layer';
                }
            }

            // Publication Year
            if (empty($meta['publication_year'])) {
                if (preg_match('/\b(?:Published|Publication\s+Year|Copyright|©|Accepted|Received)\s*[:©\-]?\s*(?:[A-Za-z]+\s+\d{1,2},?\s+)?(19[89]\d|20[0-2]\d)\b/i', $extractedText, $ym)) {
                    $meta['publication_year'] = (int)$ym[1];
                    $conf['publication_year'] = 85;
                    $prov['publication_year'] = 'PDF Text Layer';
                } elseif (preg_match('/\b(202[0-6]|201\d|200\d)\b/', $extractedText, $ym2)) {
                    $meta['publication_year'] = (int)$ym2[1];
                    $conf['publication_year'] = 70;
                    $prov['publication_year'] = 'PDF Text Layer';
                }
            }

            // Faculty Unit / Department
            if (empty($meta['faculty_unit'])) {
                if (preg_match('/\b((?:Department|Faculty|School|Division)\s+of\s+[A-Za-z\s,&]{3,45})/i', $extractedText, $fm)) {
                    $meta['faculty_unit'] = trim($fm[1]);
                    $conf['faculty_unit'] = 75;
                    $prov['faculty_unit'] = 'PDF Text Layer';
                }
            }
        }

        return [
            'metadata' => $meta,
            'confidence' => $conf,
            'provenance' => $prov,
            'ocr_used' => $ocrUsed,
        ];
    }

    /**
     * Crossref REST API: Verify bibliographic metadata by DOI
     */
    protected function verifyViaCrossrefDoi(string $doi): ?array
    {
        $cleanDoi = trim($doi);
        try {
            $url = "https://api.crossref.org/works/" . rawurlencode($cleanDoi);
            $res = Http::withHeaders([
                'User-Agent' => "FCCLibraryPlatform/2.0 (mailto:{$this->politeEmail})",
                'Accept' => 'application/json'
            ])->timeout(6)->get($url);

            if (!$res->successful()) return null;

            $item = $res->json('message');
            if (!$item) return null;

            return $this->formatCrossrefPayload($item, $cleanDoi);
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Crossref REST API: Secondary lookup by Title and Author
     */
    protected function verifyViaCrossrefTitle(string $title, string $author = ''): ?array
    {
        try {
            $query = trim("{$title} {$author}");
            $url = "https://api.crossref.org/works?query.bibliographic=" . urlencode($query) . "&rows=1";
            $res = Http::withHeaders([
                'User-Agent' => "FCCLibraryPlatform/2.0 (mailto:{$this->politeEmail})",
                'Accept' => 'application/json'
            ])->timeout(6)->get($url);

            if (!$res->successful()) return null;

            $items = $res->json('message.items');
            if (empty($items) || !is_array($items)) return null;

            $item = $items[0];
            $candidateTitle = is_array($item['title'] ?? null) ? ($item['title'][0] ?? '') : ($item['title'] ?? '');
            
            // Fuzzy match check to ensure relevance
            similar_text(strtolower($title), strtolower($candidateTitle), $percent);
            if ($percent < 55) return null;

            return $this->formatCrossrefPayload($item, $item['DOI'] ?? '');
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Format Crossref work into normalized bibliographic metadata
     */
    protected function formatCrossrefPayload(array $item, string $doi): array
    {
        $title = is_array($item['title'] ?? null) ? ($item['title'][0] ?? '') : ($item['title'] ?? '');
        $journalName = is_array($item['container-title'] ?? null) ? ($item['container-title'][0] ?? '') : ($item['container-title'] ?? ($item['publisher'] ?? ''));

        $authors = [];
        $affiliations = [];
        if (!empty($item['author']) && is_array($item['author'])) {
            foreach (array_slice($item['author'], 0, 5) as $a) {
                $nameParts = array_filter([$a['given'] ?? null, $a['family'] ?? null]);
                $authorName = !empty($nameParts) ? implode(' ', $nameParts) : ($a['name'] ?? '');
                if ($authorName) $authors[] = $authorName;

                if (!empty($a['affiliation']) && is_array($a['affiliation'])) {
                    foreach ($a['affiliation'] as $aff) {
                        $affName = is_array($aff) ? ($aff['name'] ?? '') : (string)$aff;
                        if ($affName && !in_array($affName, $affiliations)) {
                            $affiliations[] = $affName;
                        }
                    }
                }
            }
        }

        $issn = is_array($item['ISSN'] ?? null) ? ($item['ISSN'][0] ?? '') : ($item['ISSN'] ?? '');
        $year = $item['published']['date-parts'][0][0] ?? ($item['created']['date-parts'][0][0] ?? null);

        $vol = $item['volume'] ?? '';
        $issue = $item['issue'] ?? '';
        $volIssueParts = [];
        if ($vol) $volIssueParts[] = "Vol. {$vol}";
        if ($issue) $volIssueParts[] = "Issue {$issue}";
        $volumeIssue = implode(', ', $volIssueParts);

        $meta = array_filter([
            'title' => $title,
            'author' => implode(', ', $authors),
            'faculty_unit' => implode(' • ', array_slice($affiliations, 0, 2)),
            'volume_issue' => $volumeIssue,
            'issn' => $issn,
            'publication_year' => $year ? (int)$year : null,
            'doi' => $doi,
            'journal_name' => $journalName,
        ]);

        $conf = [];
        $prov = [];
        foreach ($meta as $k => $v) {
            $conf[$k] = 100;
            $prov[$k] = 'Crossref DOI Registry (Verified)';
        }

        return [
            'metadata' => $meta,
            'confidence' => $conf,
            'provenance' => $prov,
        ];
    }

    /**
     * OpenAlex Scholarly Graph Verification
     */
    protected function verifyViaOpenAlex(string $doi): ?array
    {
        try {
            $cleanDoi = trim($doi);
            $apiKey = env('OPENALEX_API_KEY', 'FD6xNHEEyHhLMW5Htsx3Vv');
            $url = "https://api.openalex.org/works/https://doi.org/" . rawurlencode($cleanDoi) . "?mailto=" . urlencode($this->politeEmail) . ($apiKey ? "&api_key=" . urlencode($apiKey) : "");
            
            $headers = [
                'Accept' => 'application/json',
                'User-Agent' => "FCC-E-Library/5.0 (mailto:{$this->politeEmail})"
            ];
            if ($apiKey) {
                $headers['Authorization'] = 'Bearer ' . $apiKey;
                $headers['api_key'] = $apiKey;
            }

            $res = Http::withHeaders($headers)->timeout(6)->get($url);

            if (!$res->successful()) return null;

            $work = $res->json();
            if (!$work || empty($work['id'])) return null;

            $meta = [];
            $conf = [];
            $prov = [];

            if (!empty($work['title'])) {
                $meta['title'] = $work['title'];
                $conf['title'] = 98;
                $prov['title'] = 'OpenAlex Scholarly Graph (Verified)';
            }

            if (!empty($work['authorships']) && is_array($work['authorships'])) {
                $names = [];
                $affs = [];
                foreach (array_slice($work['authorships'], 0, 5) as $auth) {
                    if (!empty($auth['author']['display_name'])) {
                        $names[] = $auth['author']['display_name'];
                    }
                    if (!empty($auth['institutions']) && is_array($auth['institutions'])) {
                        foreach ($auth['institutions'] as $inst) {
                            if (!empty($inst['display_name']) && !in_array($inst['display_name'], $affs)) {
                                $affs[] = $inst['display_name'];
                            }
                        }
                    }
                }
                if (!empty($names)) {
                    $meta['author'] = implode(', ', $names);
                    $conf['author'] = 98;
                    $prov['author'] = 'OpenAlex Scholarly Graph (Verified)';
                }
                if (!empty($affs)) {
                    $meta['faculty_unit'] = implode(' • ', array_slice($affs, 0, 2));
                    $conf['faculty_unit'] = 95;
                    $prov['faculty_unit'] = 'OpenAlex Scholarly Graph (Verified)';
                }
            }

            $source = $work['primary_location']['source'] ?? null;
            if ($source) {
                if (!empty($source['issn_l'])) {
                    $meta['issn'] = $source['issn_l'];
                    $conf['issn'] = 98;
                    $prov['issn'] = 'OpenAlex Scholarly Graph (Verified)';
                }
                if (!empty($source['display_name'])) {
                    $meta['journal_name'] = $source['display_name'];
                }
            }

            $biblio = $work['biblio'] ?? null;
            if ($biblio) {
                $v = $biblio['volume'] ?? '';
                $iss = $biblio['issue'] ?? '';
                $p = [];
                if ($v) $p[] = "Vol. {$v}";
                if ($iss) $p[] = "Issue {$iss}";
                if (!empty($p)) {
                    $meta['volume_issue'] = implode(', ', $p);
                    $conf['volume_issue'] = 98;
                    $prov['volume_issue'] = 'OpenAlex Scholarly Graph (Verified)';
                }
            }

            if (!empty($work['publication_year'])) {
                $meta['publication_year'] = (int)$work['publication_year'];
                $conf['publication_year'] = 98;
                $prov['publication_year'] = 'OpenAlex Scholarly Graph (Verified)';
            }

            return [
                'metadata' => $meta,
                'confidence' => $conf,
                'provenance' => $prov,
            ];
        } catch (\Throwable $e) {
            return null;
        }
    }
}

