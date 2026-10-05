<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Book;
use App\Models\Loan;

class RecommendationController extends Controller
{
    /**
     * Get personalized dynamic recommendations based on patron borrowings or popular faculty subjects
     */
    public function getRecommendations(Request $request)
    {
        $matric = $request->query('matric', $request->query('user_id'));

        // If matric provided, find subjects/authors user borrowed
        if ($matric) {
            $userLoans = Loan::where('matric', $matric)->pluck('author')->filter()->unique();

            if ($userLoans->isNotEmpty()) {
                $recommendations = Book::whereIn('author', $userLoans)
                    ->where('copies_available', '>', 0)
                    ->orderBy('rating', 'desc')
                    ->limit(6)
                    ->get();

                if ($recommendations->isNotEmpty()) {
                    return response()->json([
                        'strategy' => 'Author-Affinity Match',
                        'data' => $recommendations
                    ]);
                }
            }
        }

        // Default: Top-rated & recent digital acquisitions
        $topBooks = Book::where('is_digital', true)
            ->orWhere('copies_available', '>', 0)
            ->orderBy('rating', 'desc')
            ->orderBy('uploaded_at', 'desc')
            ->limit(6)
            ->get();

        return response()->json([
            'strategy' => 'Top Curated & Digital Holdings',
            'data' => $topBooks
        ]);
    }
}
