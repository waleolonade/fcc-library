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
        if (!str_starts_with($head, '%PDF-')) {
            fclose($fh);
            return false;
        }
        if (str_contains($head, 'OFFICIAL INSTITUTIONAL CURRICULUM MANUSCRIPT') || str_contains($head, 'CENTRAL LIBRARY DIRECTORATE')) {
            fclose($fh);
            return false;
        }
        $size = filesize($path);
        fseek($fh, max(0, $size - 2048));
        $tail = fread($fh, 2048);
        fclose($fh);
        return str_contains($tail, '%%EOF');
    }

    private function servePdf(Request $request, $id, bool $download)
    {
        // 1. Locate book in books or department_uploads table
        $book = Book::where('id', $id)
            ->orWhereRaw('LOWER(id) = ?', [strtolower($id)])
            ->first();

        $upload = null;
        if (!$book) {
            $upload = DepartmentUpload::where('id', $id)
                ->orWhere('book_id', $id)
                ->orWhereRaw('LOWER(id) = ?', [strtolower($id)])
                ->first();
        } else {
            $upload = DepartmentUpload::where('book_id', $book->id)
                ->orWhere('id', $book->id)
                ->first();
        }

        $safeId = preg_replace('/[^a-zA-Z0-9_-]/', '_', $id);
        $cleanSuffix = preg_replace('/^.*-/', '', $id);
        $disk = Storage::disk('library_books');

        // Candidate search paths
        $searchDirs = [
            storage_path('app/library-books'),
            storage_path('app/public/books'),
            storage_path('app/public/department_uploads'),
            storage_path('app/public/theses')
        ];

        $candidateNames = array_unique(array_filter([
            $book?->getAttribute('file_path'),
            $upload?->getAttribute('file_path'),
            $safeId . '.pdf',
            $upload ? ($upload->id . '.pdf') : null,
            $book ? ($book->id . '.pdf') : null,
            $book?->file_name,
            $upload?->file_name,
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

        // Glob fallback for valid ID suffixes (avoid scanning for generic keywords like 'pdf' or 'file')
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

        // 2. Check base64 in SQLite or MySQL database
        $dataUrl = $book?->getAttribute('file_data_url') ?: $upload?->file_data_url;
        if (!$dataUrl) {
            try {
                $pdo = \App\Services\DatabaseService::getPdo();
                if ($pdo) {
                    $st = $pdo->prepare("SELECT file_data_url, file_name FROM department_uploads WHERE id = :id OR book_id = :id");
                    $st->execute([':id' => $id]);
                    $mRow = $st->fetch(\PDO::FETCH_ASSOC);
                    if ($mRow && !empty($mRow['file_data_url'])) {
                        $dataUrl = $mRow['file_data_url'];
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
            if ($binary && strlen($binary) > 200 && str_starts_with($binary, '%PDF-') && str_contains(substr($binary, -2048), '%%EOF')) {
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
