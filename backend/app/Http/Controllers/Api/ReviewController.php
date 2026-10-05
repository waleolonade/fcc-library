<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Review;
use App\Models\Book;

class ReviewController extends Controller
{
    /**
     * Get a list of reviews for a book
     */
    public function index($bookId)
    {
        $reviews = Review::where('book_id', $bookId)
            ->orderBy('created_at', 'desc')
            ->get();

        $averageRating = $reviews->count() > 0 ? round($reviews->avg('rating'), 1) : 5.0;

        return response()->json([
            'book_id' => $bookId,
            'total_reviews' => $reviews->count(),
            'average_rating' => $averageRating,
            'reviews' => $reviews
        ]);
    }

    /**
     * Create a new review for a book
     */
    public function store(Request $request, $bookId)
    {
        $validated = $request->validate([
            'comment' => 'required|string|max:1000',
            'rating' => 'required|integer|min:1|max:5',
            'user_identifier' => 'nullable|string',
            'user_name' => 'nullable|string'
        ]);

        $book = Book::where('id', $bookId)->first();
        if (!$book) {
            return response()->json(['message' => 'Book not found'], 404);
        }

        $review = Review::create([
            'book_id' => $book->id,
            'user_identifier' => $validated['user_identifier'] ?? 'SCHOLAR-PATRON',
            'user_name' => $validated['user_name'] ?? 'Faculty Scholar',
            'comment' => $validated['comment'],
            'rating' => (int) $validated['rating'],
            'is_verified' => true
        ]);

        // Re-calculate and update book average rating
        $avg = Review::where('book_id', $book->id)->avg('rating');
        if ($avg) {
            $book->rating = round($avg, 1);
            $book->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Review submitted and authenticated successfully!',
            'review' => $review
        ], 201);
    }

    /**
     * Delete a review
     */
    public function destroy($id)
    {
        $review = Review::findOrFail($id);
        $bookId = $review->book_id;
        $review->delete();

        // Update book rating
        $book = Book::where('id', $bookId)->first();
        if ($book) {
            $avg = Review::where('book_id', $bookId)->avg('rating');
            $book->rating = $avg ? round($avg, 1) : 5.0;
            $book->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Review removed successfully'
        ]);
    }
}
