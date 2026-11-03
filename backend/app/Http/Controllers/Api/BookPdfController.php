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
        $mysqlUploadId = null;
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

                $sqlUp = "SELECT id, book_id, file_name, title, file_data_url FROM department_uploads WHERE id = :id OR book_id = :id";
                if ($altId) $sqlUp .= " OR id = :altId OR book_id = :altId";
                $stUp = $pdo->prepare($sqlUp);
                $stUp->execute($p);
                $mUp = $stUp->fetch(\PDO::FETCH_ASSOC);
                if ($mUp) {
                    $mysqlUploadId = $mUp['id'] ?? null;
                    if (!$mysqlFileName) $mysqlFileName = $mUp['file_name'] ?? null;
                    if (!$mysqlTitle) $mysqlTitle = $mUp['title'] ?? null;
                    if (!$mysqlDataUrl) $mysqlDataUrl = $mUp['file_data_url'] ?? null;
                }

                // If file_name exists, search for any department_uploads row with that filename to find upload ID
                if ($mysqlFileName && !$mysqlUploadId) {
                    $stFn = $pdo->prepare("SELECT id, file_data_url FROM department_uploads WHERE file_name = :fn OR file_name LIKE :fnLike LIMIT 1");
                    $stFn->execute([':fn' => $mysqlFileName, ':fnLike' => '%' . basename($mysqlFileName) . '%']);
                    $mFn = $stFn->fetch(\PDO::FETCH_ASSOC);
                    if ($mFn) {
                        $mysqlUploadId = $mFn['id'] ?? null;
                        if (!$mysqlDataUrl) $mysqlDataUrl = $mFn['file_data_url'] ?? null;
                    }
                }

                // Automatic Title Auto-Repair: Fix publisher city/year imprint mistakenly stored as title (e.g. "Budapest, 2018.")
                if ($mysqlTitle && preg_match('/^[A-Za-z\s.-]+,\s*(?:19|20)\d{2}\.?$/i', trim($mysqlTitle)) && $mysqlFileName) {
                    $cleanFn = pathinfo($mysqlFileName, PATHINFO_FILENAME);
                    $cleanFn = preg_replace('/^\d+[\s._-]+/', '', $cleanFn);
                    $cleanFn = preg_replace('/[-_.]+/', ' ', $cleanFn);
                    $cleanFn = trim(preg_replace('/\s+/', ' ', $cleanFn));
                    if (preg_match('/^(.*?)(?:\s+Authors|\s+by|\s+edition)/i', $cleanFn, $match)) {
                        $cleanFn = trim($match[1]);
                    }
                    if (strlen($cleanFn) >= 3) {
                        $repairedTitle = ucwords($cleanFn);
                        $mysqlTitle = $repairedTitle;
                        try {
                            $pdo->prepare("UPDATE books SET title = :t WHERE id = :id")->execute([':t' => $repairedTitle, ':id' => $id]);
                            $pdo->prepare("UPDATE department_uploads SET title = :t WHERE id = :id OR book_id = :id")->execute([':t' => $repairedTitle, ':id' => $id]);
                        } catch (\Throwable $te) {}
                    }
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
            $mysqlUploadId ? ($mysqlUploadId . '.pdf') : null,
            $mysqlUploadId ? preg_replace('/[^a-zA-Z0-9_-]/', '_', $mysqlUploadId) . '.pdf' : null,
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
            // Mirror to safeId.pdf and altId.pdf across storage for zero-latency lookups
            try {
                $libDir = storage_path('app/library-books');
                if (!is_dir($libDir)) @mkdir($libDir, 0755, true);
                $mirrorPath = $libDir . '/' . $safeId . '.pdf';
                if (!file_exists($mirrorPath)) {
                    @copy($foundAbsolutePath, $mirrorPath);
                }
                if ($altId) {
                    $altMirrorPath = $libDir . '/' . $altId . '.pdf';
                    if (!file_exists($altMirrorPath)) @copy($foundAbsolutePath, $altMirrorPath);
                }
            } catch (\Throwable $e) {}

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

    public function attachPdf(Request $request, $id)
    {
        if (!$request->hasFile('file') || !$request->file('file')->isValid()) {
            return response()->json(['success' => false, 'error' => 'No valid PDF file uploaded.'], 422);
        }

        $file = $request->file('file');
        $rawBinary = @file_get_contents($file->getRealPath());
        if (!$rawBinary || strlen($rawBinary) < 100 || !str_contains(substr($rawBinary, 0, 128), '%PDF-')) {
            return response()->json(['success' => false, 'error' => 'Uploaded file is not a valid PDF manuscript.'], 422);
        }

        $origName = $file->getClientOriginalName();
        $altId = str_starts_with($id, 'FCC-HOD-')
            ? str_replace('FCC-HOD-', 'HOD-UP-', $id)
            : (str_starts_with($id, 'HOD-UP-') ? str_replace('HOD-UP-', 'FCC-HOD-', $id) : null);

        // 1. Mirror binary to all physical storage directories
        $deptUp = app(\App\Http\Controllers\DepartmentUploadController::class);
        $deptUp->persistPdfManuscriptToAllDisks($rawBinary, $id, $altId, $origName);

        // 2. Mirror Base64 to MySQL & SQLite databases
        $b64 = 'data:application/pdf;base64,' . base64_encode($rawBinary);
        try {
            $pdo = \App\Services\DatabaseService::getPdo();
            if ($pdo) {
                $p = [':b' => $b64, ':fn' => $origName, ':id' => $id];
                $pdo->prepare("UPDATE books SET file_data_url = :b, file_name = :fn WHERE id = :id")->execute($p);
                $pdo->prepare("UPDATE department_uploads SET file_data_url = :b, file_name = :fn WHERE id = :id OR book_id = :id")->execute($p);
                if ($altId) {
                    $pAlt = [':b' => $b64, ':fn' => $origName, ':id' => $altId];
                    $pdo->prepare("UPDATE books SET file_data_url = :b, file_name = :fn WHERE id = :id")->execute($pAlt);
                    $pdo->prepare("UPDATE department_uploads SET file_data_url = :b, file_name = :fn WHERE id = :id OR book_id = :id")->execute($pAlt);
                }
            }
        } catch (\Throwable $e) {}

        return response()->json([
            'success' => true,
            'message' => 'PDF manuscript successfully attached, mirrored to storage and database synchronized.',
            'book_id' => $id,
            'file_name' => $origName,
            'has_pdf' => true
        ]);
    }
}
