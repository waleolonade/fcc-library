<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Fine;
use App\Models\Loan;
use Carbon\Carbon;

class FineController extends Controller
{
    /**
     * Get a list of fines (filterable by patron_matric or status)
     */
    public function index(Request $request)
    {
        $query = Fine::with('loan');

        if ($matric = $request->query('matric', $request->query('patron_matric'))) {
            $query->where('patron_matric', $matric);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $fines = $query->orderBy('created_at', 'desc')->paginate(20);
        return response()->json($fines);
    }

    /**
     * Get a fine by ID
     */
    public function show($id)
    {
        $fine = Fine::with('loan')->findOrFail($id);
        return response()->json($fine);
    }

    /**
     * Calculate / assess fine for a loan record
     */
    public function calculateFine(Request $request, $loanId)
    {
        $loan = Loan::where('id', $loanId)->orWhere('book_id', $loanId)->firstOrFail();

        $dueDate = Carbon::parse($loan->due_date);
        $returnDate = $loan->return_date ? Carbon::parse($loan->return_date) : Carbon::now();

        if ($returnDate->gt($dueDate)) {
            $daysLate = $returnDate->diffInDays($dueDate);
            $ratePerDay = 100.00; // standard ₦100.00 per day statutory late fine
            $fineAmount = max(100.00, $daysLate * $ratePerDay);

            $fine = Fine::create([
                'loan_id' => $loan->id,
                'patron_matric' => $loan->matric,
                'amount' => $fineAmount,
                'balance_remaining' => $fineAmount,
                'reason' => "Overdue return by {$daysLate} day(s) for \"{$loan->book_title}\"",
                'status' => 'Unpaid'
            ]);

            // Update loan record with fine amount
            $loan->fine_amount = $fineAmount;
            $loan->save();

            return response()->json([
                'success' => true,
                'message' => "Fine of ₦{$fineAmount} generated for {$daysLate} days overdue.",
                'fine' => $fine
            ], 201);
        }

        return response()->json([
            'success' => true,
            'message' => 'No fine applicable; loan is within statutory borrowing window.',
            'amount' => 0.00
        ], 200);
    }

    /**
     * Pay / clear a fine
     */
    public function payFine(Request $request, $id)
    {
        $fine = Fine::findOrFail($id);

        $amountToPay = (float) $request->input('amount', $fine->balance_remaining);
        $fine->balance_remaining = max(0.00, $fine->balance_remaining - $amountToPay);

        if ($fine->balance_remaining <= 0) {
            $fine->status = 'Paid';
        } else {
            $fine->status = 'Partial';
        }
        $fine->save();

        return response()->json([
            'success' => true,
            'message' => "Payment of ₦{$amountToPay} processed successfully. Remaining balance: ₦{$fine->balance_remaining}.",
            'fine' => $fine
        ]);
    }
}
