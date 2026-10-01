<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CopiesBarcodeController extends Controller
{
    /**
     * GET /api/copies
     * List physical copy records, optionally filtered by book_id, branch, or status.
     */
    public function index(Request $request)
    {
        $query = DB::table('copies')
            ->join('books', 'copies.book_id', '=', 'books.id')
            ->leftJoin('shelves', 'copies.shelf_id', '=', 'shelves.id')
            ->select(
                'copies.*',
                'books.title as book_title',
                'books.author as book_author',
                'books.call_number as call_number',
                'books.isbn as isbn',
                'shelves.shelf_code',
                'shelves.floor as shelf_floor',
                'shelves.aisle as shelf_aisle'
            );

        if ($bookId = $request->query('book_id')) {
            $query->where('copies.book_id', $bookId);
        }

        if ($status = $request->query('status')) {
            $query->where('copies.status', $status);
        }

        if ($branch = $request->query('branch')) {
            $query->where('copies.branch_id', 'like', "%{$branch}%");
        }

        $copies = $query->orderBy('copies.book_id')->orderBy('copies.copy_number')->get();

        return response()->json($copies);
    }

    /**
     * GET /api/copies/barcode/{barcode}
     * Instant Barcode Scanner Lookup for physical scanners and camera scanners.
     * Identifies exact physical copy, borrower history, and current status.
     */
    public function lookupBarcode($barcode)
    {
        $trimmed = trim(strtoupper($barcode));

        // 1. Direct copy barcode search
        $copy = DB::table('copies')
            ->join('books', 'copies.book_id', '=', 'books.id')
            ->leftJoin('shelves', 'copies.shelf_id', '=', 'shelves.id')
            ->where('copies.barcode', $trimmed)
            ->orWhere('copies.rfid_tag', "RFID-{$trimmed}")
            ->orWhere('copies.accession_number', $trimmed)
            ->orWhereRaw('UPPER(copies.id) = ?', [$trimmed])
            ->select(
                'copies.*',
                'books.title as book_title',
                'books.author as book_author',
                'books.call_number as call_number',
                'books.isbn as isbn',
                'books.shelf_location as default_shelf_location',
                'shelves.shelf_code',
                'shelves.floor as shelf_floor',
                'shelves.aisle as shelf_aisle'
            )
            ->first();

        if ($copy) {
            // Check active loan if checked out
            $activeLoan = DB::table('loans')
                ->where('book_id', $copy->book_id)
                ->where('status', '!=', 'Returned')
                ->first();

            // Record scan event
            DB::table('barcodes')
                ->where('barcode_value', $copy->barcode)
                ->update(['last_scanned_at' => now()]);

            return response()->json([
                'found' => true,
                'type' => 'copy',
                'copy' => $copy,
                'active_loan' => $activeLoan,
                'message' => "Identified Copy #{$copy->copy_number} for \"{$copy->book_title}\""
            ]);
        }

        // 2. Fallback: Check if scanned value matches Book ISBN or Book ID
        $book = DB::table('books')
            ->where('id', $trimmed)
            ->orWhere('isbn', $trimmed)
            ->first();

        if ($book) {
            $firstCopy = DB::table('copies')
                ->where('book_id', $book->id)
                ->where('status', 'Available')
                ->first();

            return response()->json([
                'found' => true,
                'type' => 'book_title',
                'book' => $book,
                'suggested_copy' => $firstCopy,
                'message' => "Identified Book Title: \"{$book->title}\""
            ]);
        }

        // 3. Fallback: Check if scanned value is a Patron Student Barcode/Library ID
        $patron = DB::table('patrons')
            ->where('matric', $trimmed)
            ->orWhere('library_id', $trimmed)
            ->orWhere('barcode', $trimmed)
            ->first();

        if ($patron) {
            return response()->json([
                'found' => true,
                'type' => 'patron',
                'patron' => $patron,
                'message' => "Identified Patron: {$patron->name} ({$patron->matric})"
            ]);
        }

        return response()->json([
            'found' => false,
            'message' => "No matching copy, book, or patron found for scanned barcode \"{$barcode}\""
        ], 404);
    }

    /**
     * POST /api/copies
     * Manually add an extra copy with auto-generated barcode and accession number.
     */
    public function store(Request $request)
    {
        $bookId = $request->input('book_id');
        $book = DB::table('books')->where('id', $bookId)->first();

        if (!$book) {
            return response()->json(['error' => 'Book not found'], 404);
        }

        $existingCount = DB::table('copies')->where('book_id', $bookId)->count();
        $nextCopyNum = $existingCount + 1;
        $cleanId = preg_replace('/[^0-9A-Za-z]/', '', $bookId);

        $copyId = "{$bookId}-C{$nextCopyNum}";
        $barcodeVal = "BC-{$cleanId}-C{$nextCopyNum}";
        $accessionVal = "ACC-2026-{$cleanId}-C{$nextCopyNum}";

        DB::table('copies')->insert([
            'id' => $copyId,
            'book_id' => $bookId,
            'branch_id' => $request->input('branch_id', $book->branch ?? 'Main Central Library'),
            'shelf_id' => $request->input('shelf_id', 'SHELF-FL1-A1'),
            'copy_number' => $nextCopyNum,
            'barcode' => $barcodeVal,
            'rfid_tag' => "RFID-{$barcodeVal}",
            'accession_number' => $accessionVal,
            'status' => 'Available',
            'condition' => 'Good',
            'acquisition_cost' => (float)$request->input('cost', 15000.00),
            'acquisition_date' => now()->toDateString(),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Increment book copies_total and copies_available
        DB::table('books')->where('id', $bookId)->increment('copies_total');
        DB::table('books')->where('id', $bookId)->increment('copies_available');

        // Register in barcodes lookup
        DB::table('barcodes')->insert([
            'barcode_value' => $barcodeVal,
            'barcode_type' => 'Code 128',
            'entity_type' => 'copy',
            'entity_id' => $copyId,
            'is_active' => true,
            'print_count' => 1,
            'created_at' => now()
        ]);

        return response()->json([
            'message' => "Copy #{$nextCopyNum} created with Barcode {$barcodeVal}",
            'copy_id' => $copyId,
            'barcode' => $barcodeVal,
            'accession_number' => $accessionVal
        ], 201);
    }
}
