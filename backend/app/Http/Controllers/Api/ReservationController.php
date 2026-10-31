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
        $query = Reservation::query();

        if ($matric = $request->query('matric', $request->query('user_identifier'))) {
            $query->where(function ($q) use ($matric) {
                $q->where('matric', 'like', "%{$matric}%")
                  ->orWhere('patron_name', 'like', "%{$matric}%");
            });
        }

        if ($bookId = $request->query('book_id')) {
            $query->where('book_id', $bookId);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $reservations = $query->orderBy('reserved_date', 'desc')->get();
        return response()->json($reservations);
    }

    /**
     * Get a reservation by ID
     */
    public function show($id)
    {
        $reservation = Reservation::findOrFail($id);
        return response()->json($reservation);
    }

    /**
     * Create a new reservation for a book
     */
    public function store(Request $request)
    {
        $bookId = $request->input('book_id', $request->input('book.id'));
        $matric = $request->input('matric', $request->input('user_identifier', 'FCC/SCHOLAR/2026/001'));
        $patronName = $request->input('patron_name', $request->input('name', $request->input('user_name', 'Library Scholar')));
        $bookTitle = $request->input('book_title', $request->input('book.title', 'Textbook'));
        $callNumber = $request->input('call_number', $request->input('book.callNumber', 'LIB-GEN-01'));
        $reservedDate = $request->input('reserved_date', $request->input('reserved_from', date('Y-m-d')));
        $expiryDate = $request->input('expiry_date', $request->input('reserved_to', date('Y-m-d', strtotime('+7 days'))));
        $pickupBranch = $request->input('pickup_branch', 'Main Campus Circulation Desk');
        $status = $request->input('status', 'Confirmed');

        if (($patronName === 'Library Scholar' || empty($patronName)) && !empty($matric)) {
            $patron = \App\Models\Patron::where('matric', $matric)->orWhere('barcode', $matric)->first();
            if ($patron && !empty($patron->name)) {
                $patronName = $patron->name;
            } else {
                $user = \App\Models\User::where('matric', $matric)->orWhere('username', $matric)->orWhere('email', $matric)->first();
                if ($user && !empty($user->name)) {
                    $patronName = $user->name;
                }
            }
        }

        if (!$bookId) {
            return response()->json(['success' => false, 'message' => 'Book ID is required to reserve.'], 422);
        }

        $book = Book::where('id', $bookId)->first();
        if ($book) {
            $bookTitle = $book->title;
            $callNumber = $book->call_number ?? $callNumber;
        }

        $queuePosition = Reservation::where('book_id', $bookId)->where('status', 'Confirmed')->count() + 1;
        $id = 'RES-' . strtoupper(bin2hex(random_bytes(4)));

        $reservation = Reservation::create([
            'id' => $id,
            'matric' => $matric,
            'patron_name' => $patronName,
            'book_id' => $bookId,
            'book_title' => $bookTitle,
            'call_number' => $callNumber,
            'reserved_date' => $reservedDate,
            'expiry_date' => $expiryDate,
            'status' => $status,
            'pickup_branch' => $pickupBranch,
            'queue_position' => $queuePosition
        ]);

        try {
            $pdo = \App\Services\DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->prepare("
                    INSERT INTO reservations (id, matric, patron_name, book_id, book_title, call_number, reserved_date, expiry_date, status, pickup_branch, queue_position)
                    VALUES (:id, :matric, :patron_name, :book_id, :book_title, :call_number, :reserved_date, :expiry_date, :status, :pickup_branch, :queue_position)
                    ON DUPLICATE KEY UPDATE status = VALUES(status)
                ");
                $st->execute([
                    ':id' => $id,
                    ':matric' => $matric,
                    ':patron_name' => $patronName,
                    ':book_id' => $bookId,
                    ':book_title' => $bookTitle,
                    ':call_number' => $callNumber,
                    ':reserved_date' => $reservedDate,
                    ':expiry_date' => $expiryDate,
                    ':status' => $status,
                    ':pickup_branch' => $pickupBranch,
                    ':queue_position' => $queuePosition
                ]);
            }
        } catch (\Throwable $e) {}

        return response()->json([
            'success' => true,
            'message' => "Book \"{$bookTitle}\" reserved successfully until {$expiryDate}!",
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

        try {
            $pdo = \App\Services\DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->prepare("UPDATE reservations SET status = :status WHERE id = :id");
                $st->execute([':status' => $validated['status'], ':id' => $id]);
            }
        } catch (\Throwable $e) {}

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

        try {
            $pdo = \App\Services\DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->prepare("DELETE FROM reservations WHERE id = :id");
                $st->execute([':id' => $id]);
            }
        } catch (\Throwable $e) {}

        return response()->json([
            'success' => true,
            'message' => 'Reservation removed successfully'
        ]);
    }
}
