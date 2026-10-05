<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Author;

class AuthorController extends Controller
{
    /**
     * Get all authors
     */
    public function index(Request $request)
    {
        $query = Author::query();

        if ($search = $request->query('search')) {
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('affiliation', 'like', "%{$search}%")
                  ->orWhere('biography', 'like', "%{$search}%");
        }

        $authors = $query->orderBy('name', 'asc')->paginate(20);
        return response()->json($authors);
    }

    /**
     * Get a specific author
     */
    public function show($id)
    {
        $author = Author::findOrFail($id);
        return response()->json($author);
    }

    /**
     * Store a new author
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'orcid' => 'nullable|string|max:50',
            'affiliation' => 'nullable|string|max:255',
            'nationality' => 'nullable|string|max:100',
            'biography' => 'nullable|string'
        ]);

        $author = Author::create($validated);

        return response()->json([
            'success' => true,
            'message' => "Author \"{$author->name}\" added to Institutional Authority File",
            'author' => $author
        ], 201);
    }

    /**
     * Update an author
     */
    public function update(Request $request, $id)
    {
        $author = Author::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'orcid' => 'nullable|string|max:50',
            'affiliation' => 'nullable|string|max:255',
            'nationality' => 'nullable|string|max:100',
            'biography' => 'nullable|string'
        ]);

        $author->update($validated);

        return response()->json([
            'success' => true,
            'message' => "Author updated successfully",
            'author' => $author
        ]);
    }

    /**
     * Delete an author
     */
    public function destroy($id)
    {
        $author = Author::findOrFail($id);
        $author->delete();

        return response()->json([
            'success' => true,
            'message' => 'Author record removed'
        ]);
    }
}
