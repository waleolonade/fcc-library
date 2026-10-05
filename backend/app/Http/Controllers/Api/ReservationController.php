<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Reservation;
use App\Models\Book;

class ReservationController extends Controller
{
    /**
     * Get a list of reservations
     */
    public function index(Request $request)
    {
        $query = Reservation::with('book');

        if ($userIdentifier = $request->query('user_identifier', $request->query('matric'))) {
            $query->where('user_identifier', $userIdentifier);
        }

        if ($bookId = $request->query('book_id')) {
            $query->where('book_id', $bookId);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $reservations = $query->orderBy('created_at', 'desc')->paginate(20);
        return response()->json($reservations);
    }

    /**
     * Get a reservation by ID
     */
    public function show($id)
    {
        $reservation = Reservation::with('book')->findOrFail($id);
        return response()->json($reservation);
    }

    /**
     * Create a new reservation for a book
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'book_id' => 'required|string',
            'user_identifier' => 'nullable|string',
            'user_name' => 'nullable|string',
            'reserved_from' => 'nullable|date',
            'reserved_to' => 'nullable|date',
            'notes' => 'nullable|string'
        ]);

        $book = Book::where('id', $validated['book_id'])->first();

        if (!$book) {
            return response()->json(['message' => 'Book not found in catalogue'], 404);
        }

        $reservedFrom = $validated['reserved_from'] ?? date('Y-m-d');
        $reservedTo = $validated['reserved_to'] ?? date('Y-m-d', strtotime('+3 days'));

        $reservation = Reservation::create([
            'user_identifier' => $validated['user_identifier'] ?? 'SCHOLAR-01',
            'user_name' => $validated['user_name'] ?? 'Library Patron',
            'book_id' => $book->id,
            'book_title' => $book->title,
            'reserved_from' => $reservedFrom,
            'reserved_to' => $reservedTo,
            'status' => 'Confirmed',
            'notes' => $validated['notes'] ?? 'Reserved via Smart OPAC Station'
        ]);

        return response()->json([
            'success' => true,
            'message' => "Book \"{$book->title}\" reserved successfully until {$reservedTo}!",
            'reservation' => $reservation
        ], 201);
    }

    /**
     * Update a reservation status (e.g. Cancelled, Fulfilled, Confirmed)
     */
    public function update(Request $request, $id)
    {
        $reservation = Reservation::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|string|in:Pending,Confirmed,Fulfilled,Cancelled'
        ]);

        $reservation->status = $validated['status'];
        $reservation->save();

        return response()->json([
            'success' => true,
            'message' => "Reservation status updated to {$reservation->status}",
            'reservation' => $reservation
        ]);
    }

    /**
     * Delete a reservation
     */
    public function destroy($id)
    {
        $reservation = Reservation::findOrFail($id);
        $reservation->delete();

        return response()->json([
            'success' => true,
            'message' => 'Reservation removed successfully'
        ]);
    }
}
