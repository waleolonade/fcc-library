<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\DepartmentUpload;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BookPdfController extends Controller
{
    public function show(Request $request, $id)
    {
        return $this->servePdf($request, $id, false);
    }

    public function download(Request $request, $id)
    {
        return $this->servePdf($request, $id, true);
    }

    private function isValidPdfFile(string $path): bool
    {
        if (!file_exists($path) || filesize($path) < 200) return false;
        $fh = @fopen($path, 'rb');
        if (!$fh) return false;
        $head = fread($fh, 1024);
        fclose($fh);
        if (!str_contains(substr($head, 0, 128), '%PDF-')) {
            return false;
        }
        if (str_contains($head, 'OFFICIAL INSTITUTIONAL CURRICULUM MANUSCRIPT') || str_contains($head, 'CENTRAL LIBRARY DIRECTORATE')) {
            return false;
        }
        return true;
    }

    private function servePdf(Request $request, $id, bool $download)
    {
        // 1. Locate book in books or department_uploads table
        $altId = str_starts_with($id, 'FCC-HOD-')
            ? str_replace('FCC-HOD-', 'HOD-UP-', $id)
            : (str_starts_with($id, 'HOD-UP-') ? str_replace('HOD-UP-', 'FCC-HOD-', $id) : null);

        $book = Book::where('id', $id)
            ->orWhereRaw('LOWER(id) = ?', [strtolower($id)])
            ->when($altId, fn($q) => $q->orWhere('id', $altId)->orWhereRaw('LOWER(id) = ?', [strtolower($altId)]))
            ->first();

        $upload = null;
        if (!$book) {
            $upload = DepartmentUpload::where('id', $id)
                ->orWhere('book_id', $id)
                ->orWhereRaw('LOWER(id) = ?', [strtolower($id)])
                ->when($altId, fn($q) => $q->orWhere('id', $altId)->orWhere('book_id', $altId))
                ->first();
        } else {
            $upload = DepartmentUpload::where('book_id', $book->id)
                ->orWhere('id', $book->id)
                ->when($altId, fn($q) => $q->orWhere('book_id', $altId)->orWhere('id', $altId))
                ->first();
        }

        $safeId = preg_replace('/[^a-zA-Z0-9_-]/', '_', $id);
        $cleanSuffix = preg_replace('/^.*-/', '', $id);
        $disk = Storage::disk('library_books');

        // Look up authoritative MySQL record for file_name, title, and file_data_url
        $mysqlFileName = null;
        $mysqlTitle = null;
        $mysqlDataUrl = null;
        try {
            $pdo = \App\Services\DatabaseService::getPdo();
            if ($pdo) {
                $p = [':id' => $id];
                $sqlB = "SELECT file_name, title, file_data_url FROM books WHERE id = :id";
                if ($altId) {
                    $sqlB .= " OR id = :altId";
                    $p[':altId'] = $altId;
                }
                $stB = $pdo->prepare($sqlB);
                $stB->execute($p);
                $mBook = $stB->fetch(\PDO::FETCH_ASSOC);
                if ($mBook) {
                    $mysqlFileName = $mBook['file_name'] ?? null;
                    $mysqlTitle = $mBook['title'] ?? null;
                    $mysqlDataUrl = $mBook['file_data_url'] ?? null;
                }

                $sqlUp = "SELECT file_name, title, file_data_url FROM department_uploads WHERE id = :id OR book_id = :id";
                if ($altId) $sqlUp .= " OR id = :altId OR book_id = :altId";
                $stUp = $pdo->prepare($sqlUp);
                $stUp->execute($p);
                $mUp = $stUp->fetch(\PDO::FETCH_ASSOC);
                if ($mUp) {
                    if (!$mysqlFileName) $mysqlFileName = $mUp['file_name'] ?? null;
                    if (!$mysqlTitle) $mysqlTitle = $mUp['title'] ?? null;
                    if (!$mysqlDataUrl) $mysqlDataUrl = $mUp['file_data_url'] ?? null;
                }
            }
        } catch (\Throwable $e) {}

        // Comprehensive search paths across standard, cPanel, and public storage directories
        $searchDirs = array_unique(array_filter([
            storage_path('app/library-books'),
            storage_path('app/public/books'),
            storage_path('app/public/department_uploads'),
            storage_path('app/public/theses'),
            storage_path('app/department_uploads'),
            storage_path('app/department-uploads'),
            storage_path('app/books'),
            storage_path('app/theses'),
            storage_path('app'),
            public_path('storage/department_uploads'),
            public_path('storage/books'),
            public_path('storage/theses'),
            public_path('uploads'),
            base_path('../public_html/storage/department_uploads'),
            base_path('../public_html/storage/books'),
            base_path('../public_html/backend/storage/app/library-books'),
            base_path('../public_html/backend/storage/app/public/department_uploads'),
            base_path('../storage/app/library-books'),
            base_path('../storage/app/public/department_uploads'),
        ]));

        $candidateNames = array_unique(array_filter([
            $book?->getAttribute('file_path'),
            $upload?->getAttribute('file_path'),
            $mysqlFileName,
            $mysqlFileName ? basename($mysqlFileName) : null,
            $mysqlFileName ? (basename($mysqlFileName) . '.pdf') : null,
            $safeId . '.pdf',
            $id . '.pdf',
            $altId ? ($altId . '.pdf') : null,
            $altId ? preg_replace('/[^a-zA-Z0-9_-]/', '_', $altId) . '.pdf' : null,
            $upload ? ($upload->id . '.pdf') : null,
            $upload && $upload->book_id ? ($upload->book_id . '.pdf') : null,
            $book ? ($book->id . '.pdf') : null,
            $book?->file_name,
            $book?->file_name ? ($book->file_name . '.pdf') : null,
            $upload?->file_name,
            $upload?->file_name ? ($upload->file_name . '.pdf') : null,
            $cleanSuffix ? 'HOD-UP-' . $cleanSuffix . '.pdf' : null,
            $cleanSuffix ? 'FCC-HOD-' . $cleanSuffix . '.pdf' : null,
        ]));

        $foundAbsolutePath = null;
        foreach ($searchDirs as $dir) {
            if (!is_dir($dir)) continue;
            foreach ($candidateNames as $name) {
                if (!$name) continue;
                $p = $dir . '/' . basename($name);
                if ($this->isValidPdfFile($p)) {
                    $foundAbsolutePath = $p;
                    break 2;
                }
            }
        }

        // Glob fallback for valid ID suffixes or filename fragments
        $ignoredSuffixes = ['pdf', 'file', 'undefined', 'null', 'book', 'upload'];
        if (!$foundAbsolutePath && $cleanSuffix && strlen($cleanSuffix) >= 3 && !in_array(strtolower($cleanSuffix), $ignoredSuffixes)) {
            foreach ($searchDirs as $dir) {
                if (!is_dir($dir)) continue;
                $matches = glob($dir . '/*' . $cleanSuffix . '*.pdf');
                if (!empty($matches)) {
                    foreach ($matches as $m) {
                        if ($this->isValidPdfFile($m)) {
                            $foundAbsolutePath = $m;
                            break 2;
                        }
                    }
                }
            }
        }

        // Glob fallback for original filename fragment (e.g. "02.-Basics-of-Finance")
        $effectiveFn = $mysqlFileName ?: ($book?->file_name ?: ($upload?->file_name ?: null));
        if (!$foundAbsolutePath && $effectiveFn && strlen($effectiveFn) > 5) {
            $fnStem = pathinfo($effectiveFn, PATHINFO_FILENAME);
            $cleanStem = preg_replace('/[^a-zA-Z0-9]/', ' ', $fnStem);
            $words = array_values(array_filter(explode(' ', $cleanStem), fn($w) => strlen($w) >= 4));
            $globKey = !empty($words) ? implode('*', array_slice($words, 0, 3)) : null;
            if ($globKey) {
                foreach ($searchDirs as $dir) {
                    if (!is_dir($dir)) continue;
                    $matches = glob($dir . '/*' . $globKey . '*.pdf');
                    if (!empty($matches)) {
                        foreach ($matches as $m) {
                            if ($this->isValidPdfFile($m)) {
                                $foundAbsolutePath = $m;
                                break 2;
                            }
                        }
                    }
                }
            }
        }

        $title = $book?->title ?: ($upload?->title ?: 'Document');
        $cleanTitle = preg_replace('/[^a-zA-Z0-9_-]/', '_', $title);
        $filename = ($book?->file_name) ?: ($upload?->file_name) ?: ($cleanTitle . '.pdf');
        if (!str_ends_with(strtolower($filename), '.pdf')) $filename .= '.pdf';

        $headers = [
            'Content-Type' => 'application/pdf',
            'X-Content-Type-Options' => 'nosniff',
            'Accept-Ranges' => 'bytes',
            'Cache-Control' => 'public, max-age=86400',
            'Access-Control-Allow-Origin' => '*',
            'Access-Control-Allow-Headers' => '*',
            'Access-Control-Allow-Methods' => 'GET, HEAD, OPTIONS',
            'Content-Disposition' => ($download ? 'attachment' : 'inline') . '; filename="' . $filename . '"',
        ];

        // If file found and valid on disk
        if ($foundAbsolutePath && is_readable($foundAbsolutePath)) {
            return response()->file($foundAbsolutePath, $headers);
        }

        // 2. Check base64 in SQLite or MySQL database (querying both books and department_uploads)
        $dataUrl = $book?->getAttribute('file_data_url') ?: ($upload?->file_data_url ?: $mysqlDataUrl);
        if (!$dataUrl) {
            try {
                $pdo = \App\Services\DatabaseService::getPdo();
                if ($pdo) {
                    $sql = "SELECT file_data_url, file_name FROM department_uploads WHERE id = :id OR book_id = :id";
                    if ($altId) $sql .= " OR id = :altId OR book_id = :altId";
                    $st = $pdo->prepare($sql);
                    $params = [':id' => $id];
                    if ($altId) $params[':altId'] = $altId;
                    $st->execute($params);
                    $mRow = $st->fetch(\PDO::FETCH_ASSOC);
                    if ($mRow && !empty($mRow['file_data_url'])) {
                        $dataUrl = $mRow['file_data_url'];
                    } else {
                        $sqlB = "SELECT file_data_url, file_name FROM books WHERE id = :id";
                        if ($altId) $sqlB .= " OR id = :altId";
                        $stB = $pdo->prepare($sqlB);
                        $stB->execute($params);
                        $mRowB = $stB->fetch(\PDO::FETCH_ASSOC);
                        if ($mRowB && !empty($mRowB['file_data_url'])) {
                            $dataUrl = $mRowB['file_data_url'];
                        }
                    }
                }
            } catch (\Throwable $e) {}
        }

        if ($dataUrl) {
            $payload = $dataUrl;
            if (preg_match('#^data:([^;]+);base64,(.*)$#s', $dataUrl, $m)) {
                $payload = $m[2];
            }
            $binary = base64_decode($payload);
            if ($binary && strlen($binary) > 200 && str_contains(substr($binary, 0, 128), '%PDF-')) {
                // Cache to disk
                $targetDir = storage_path('app/library-books');
                if (!is_dir($targetDir)) @mkdir($targetDir, 0755, true);
                @file_put_contents($targetDir . '/' . $safeId . '.pdf', $binary);

                return response($binary, 200, $headers);
            }
        }

        // 3. Fallback: Check if item has a DOI or external OA link to stream authentic scholarly PDF
        $doi = $book?->doi ?: $upload?->doi;
        if (!empty($doi)) {
            try {
                $openAlex = app(\App\Services\OpenAlexService::class);
                $work = $openAlex->getWorkByDoi($doi);
                $oaUrl = $work['open_access']['oa_url']
                      ?? $work['best_oa_location']['pdf_url']
                      ?? $work['primary_location']['pdf_url']
                      ?? null;
                if ($oaUrl) {
                    return redirect()->away($oaUrl);
                }
            } catch (\Throwable $e) {}
        }

        $extUrl = $book?->external_url ?: $upload?->external_url ?: $book?->pdf_url ?: $upload?->pdf_url;
        if (!empty($extUrl) && filter_var($extUrl, FILTER_VALIDATE_URL)) {
            return redirect()->away($extUrl);
        }

        // Return honest 404 response instead of forging fake syllabus monograph
        return response()->json([
            'error' => 'Digital PDF document not available for this catalog record.',
            'book_id' => $id,
            'title' => $title,
            'has_pdf' => false
        ], 404);
    }
}
