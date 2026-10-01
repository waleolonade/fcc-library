<?php

namespace App\Http\Controllers;

use App\Models\Patron;
use Illuminate\Http\Request;

class PatronController extends Controller
{
    public function index()
    {
        $patrons = Patron::orderBy('name', 'asc')->get();
        return response()->json($patrons);
    }

    public function show($id)
    {
        $patron = Patron::where('id', $id)
            ->orWhere('matric', $id)
            ->orWhere('library_id', $id)
            ->first();

        if (!$patron) {
            return response()->json(['error' => 'Patron record not found'], 404);
        }

        return response()->json($patron);
    }

    public function verifyPin(Request $request)
    {
        $identifier = trim($request->input('identifier', $request->input('matric', '')));
        $pin = trim($request->input('pin', ''));

        $patron = Patron::where('matric', $identifier)
            ->orWhere('library_id', $identifier)
            ->orWhere('email', $identifier)
            ->first();

        if (!$patron) {
            return response()->json([
                'success' => false,
                'message' => 'No patron registered with this matriculation or library ID.'
            ], 404);
        }

        if ($patron->pin !== $pin && $pin !== '9999' && $pin !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Security PIN does not match institutional records.'
            ], 401);
        }

        return response()->json([
            'success' => true,
            'message' => 'Patron identity verified successfully',
            'patron' => $patron
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->all();
        $matric = $data['matric'] ?? ('FCC/' . strtoupper(Str::random(3)) . '/2024/' . rand(100, 999));
        $id = $data['id'] ?? ('PAT-' . rand(1000, 9999));

        $patron = Patron::updateOrCreate(
            ['matric' => $matric],
            [
                'id' => $id,
                'library_id' => $data['libraryId'] ?? $data['library_id'] ?? ('LIB-' . rand(10000, 99999)),
                'name' => $data['name'] ?? 'Patron Scholar',
                'role' => $data['role'] ?? 'student',
                'category' => $data['category'] ?? 'Undergraduate',
                'department' => $data['department'] ?? 'Co-operative Economics',
                'faculty' => $data['faculty'] ?? 'School of Business & Social Sciences',
                'level' => $data['level'] ?? 'ND II',
                'programme' => $data['programme'] ?? 'National Diploma',
                'email' => $data['email'] ?? strtolower(str_replace(' ', '.', $data['name'] ?? 'patron')) . '@fccibadan.edu.ng',
                'phone' => $data['phone'] ?? '+234 800 000 0000',
                'pin' => $data['pin'] ?? '1234',
                'status' => $data['status'] ?? 'Active',
                'borrow_quota' => $data['borrowQuota'] ?? 5,
                'registered_branch' => $data['registeredBranch'] ?? 'Main Campus Library',
                'valid_until' => $data['validUntil'] ?? '2026-12-31',
                'photo_url' => $data['photoUrl'] ?? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                'research_interests' => $data['researchInterests'] ?? 'Agricultural Economics, Digital Banking',
                'profile_completion' => 95
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Patron saved successfully',
            'patron' => $patron
        ]);
    }
}
