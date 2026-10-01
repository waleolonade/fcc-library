<?php

namespace App\Http\Controllers;

use App\Models\Loan;
use App\Models\Book;
use App\Models\Patron;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Carbon\Carbon;

class LoanController extends Controller
{
    public function index(Request $request)
    {
        $query = Loan::query();

        if ($matric = $request->query('matric')) {
            $query->where('matric', $matric);
        }

        $loans = $query->orderBy('borrow_date', 'desc')->get();
        return response()->json($loans);
    }

    public function store(Request $request)
    {
        $matric = trim($request->input('matric', ''));
        $bookId = trim($request->input('bookId', $request->input('book_id', '')));

        $book = Book::where('id', $bookId)
            ->orWhere('isbn', $bookId)
            ->orWhere('call_number', $bookId)
            ->first();

        if (!$book) {
            return response()->json(['error' => "Catalog item '{$bookId}' not found"], 404);
        }

        if ($book->copies_available <= 0) {
            return response()->json(['error' => "All copies of '{$book->title}' are currently on loan"], 400);
        }

        $patron = Patron::where('matric', $matric)->first();
        $patronName = $patron ? $patron->name : ($request->input('patronName') ?? 'Patron Scholar');

        $loanId = 'LN-' . rand(1000, 9999);
        $issueDate = Carbon::now()->toDateString();
        $dueDate = Carbon::now()->addDays(14)->toDateString();

        $loan = Loan::create([
            'id' => $loanId,
            'matric' => $matric,
            'patron_name' => $patronName,
            'book_id' => $book->id,
            'book_title' => $book->title,
            'author' => $book->author,
            'call_number' => $book->call_number,
            'branch' => $book->branch ?? 'Main Campus Library',
            'borrow_date' => $issueDate,
            'due_date' => $dueDate,
            'status' => 'Active',
            'renewal_count' => 0,
            'fine_amount' => 0.00,
            'rfid_tag' => 'FCC-RFID-' . rand(10000, 99990)
        ]);

        // Decrement copies available
        $book->decrement('copies_available');

        // Increment patron loans if exists
        if ($patron) {
            $patron->increment('active_loans_count');
        }

        // Log transaction
        AuditLog::create([
            'id' => 'AUD-' . rand(10000, 99999),
            'action' => 'CHECKOUT_BOOK',
            'details' => "Loan {$loanId} created for {$patronName} ({$matric}) - {$book->title}",
            'user' => 'Circulation Librarian',
            'timestamp' => Carbon::now()->toIso8601String()
        ]);

        return response()->json([
            'success' => true,
            'message' => "Checked out \"{$book->title}\" successfully. Due on {$dueDate}.",
            'loan' => $loan
        ]);
    }

    public function returnBook(Request $request, $id)
    {
        $loan = Loan::where('id', $id)
            ->orWhere('book_id', $id)
            ->orWhere('rfid_tag', $id)
            ->first();

        if (!$loan) {
            return response()->json(['error' => 'Active loan record not found'], 404);
        }

        $loan->status = 'Returned';
        $loan->return_date = Carbon::now()->toDateString();
        $loan->save();

        // Increment book copies
        $book = Book::where('id', $loan->book_id)->first();
        if ($book) {
            $book->increment('copies_available');
        }

        // Decrement patron active loans
        $patron = Patron::where('matric', $loan->matric)->first();
        if ($patron && $patron->active_loans_count > 0) {
            $patron->decrement('active_loans_count');
        }

        AuditLog::create([
            'id' => 'AUD-' . rand(10000, 99999),
            'action' => 'RETURN_BOOK',
            'details' => "Loan {$loan->id} returned: {$loan->book_title} by {$loan->matric}",
            'user' => 'Circulation Desk',
            'timestamp' => Carbon::now()->toIso8601String()
        ]);

        return response()->json([
            'success' => true,
            'message' => "Returned item \"{$loan->book_title}\" successfully.",
            'loan' => $loan
        ]);
    }

    public function renew(Request $request, $id)
    {
        $loan = Loan::where('id', $id)
            ->orWhere('book_id', $id)
            ->first();

        if (!$loan) {
            return response()->json(['error' => 'Loan record not found'], 404);
        }

        $newDueDate = Carbon::parse($loan->due_date)->addDays(14)->toDateString();
        $loan->due_date = $newDueDate;
        $loan->renewal_count = ($loan->renewal_count ?? 0) + 1;
        $loan->save();

        AuditLog::create([
            'id' => 'AUD-' . rand(10000, 99999),
            'action' => 'RENEW_LOAN',
            'details' => "Loan {$loan->id} renewed until {$newDueDate}",
            'user' => $loan->matric,
            'timestamp' => Carbon::now()->toIso8601String()
        ]);

        return response()->json([
            'success' => true,
            'message' => "Loan renewed. New due date is {$newDueDate}.",
            'loan' => $loan
        ]);
    }
}
