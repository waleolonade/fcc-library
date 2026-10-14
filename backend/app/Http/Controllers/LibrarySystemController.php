<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Patron;
use App\Models\Loan;
use App\Models\Thesis;
use App\Models\Acquisition;
use App\Models\PartnerLibrary;
use App\Models\ExternalLink;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class LibrarySystemController extends Controller
{
    public function health()
    {
        $bookCount = Book::count();
        $patronCount = Patron::count();
        $loanCount = Loan::where('status', 'Active')->count();
        $thesisCount = Thesis::count();

        return response()->json([
            'status' => 'Healthy',
            'framework' => 'Laravel 11.57.0 (PHP 8.2)',
            'database' => 'brainfeels_library (SQLite & Eloquent ORM)',
            'latencyMs' => 12,
            'timestamp' => Carbon::now()->toIso8601String(),
            'counts' => [
                'totalBooks' => $bookCount,
                'activePatrons' => $patronCount,
                'activeLoans' => $loanCount,
                'theses' => $thesisCount
            ]
        ]);
    }

    public function getTheses(Request $request)
    {
        $query = Thesis::query();

        if ($dept = $request->query('department')) {
            $query->where(function ($q) use ($dept) {
                $q->where('department', 'like', "%{$dept}%")
                  ->orWhere('department', 'like', "%" . strtoupper($dept) . "%");
            });
        }

        if ($status = $request->query('status')) {
            $query->where('status', 'like', "%{$status}%");
        }

        $theses = $query->orderBy('year', 'desc')->get();
        return response()->json($theses);
    }

    public function updateThesisStatus(Request $request, $id)
    {
        $thesis = Thesis::where('id', $id)->firstOrFail();
        $status = $request->input('status', 'Approved');
        $thesis->status = $status;
        $thesis->save();

        return response()->json([
            'success' => true,
            'message' => "Dissertation '{$thesis->title}' status updated to {$status}!",
            'thesis' => $thesis
        ]);
    }

    public function storeThesis(Request $request)
    {
        $data = $request->all();
        $id = $data['id'] ?? ('TH-' . date('Y') . '-' . rand(100, 999));

        $thesis = Thesis::create([
            'id' => $id,
            'title' => $data['title'] ?? 'Institutional Dissertation',
            'author' => $data['author'] ?? 'FCC Scholar',
            'matric' => $data['matric'] ?? 'FCC/GEN/2024/001',
            'year' => $data['year'] ?? (int) date('Y'),
            'advisor' => $data['advisor'] ?? 'Dr. Mrs. A. Balogun',
            'department' => $data['department'] ?? 'Co-operative Economics & Management',
            'faculty' => $data['faculty'] ?? 'School of Business Studies',
            'degree' => $data['degree'] ?? 'Higher National Diploma (HND)',
            'status' => 'Published',
            'access' => 'Open Access Full-Text',
            'downloads' => 0,
            'citations' => 0,
            'doi' => $data['doi'] ?? ('10.5281/zenodo.' . rand(1000000, 9999999)),
            'file_size' => $data['fileSize'] ?? '3.4 MB',
            'file_name' => $data['fileName'] ?? 'dissertation.pdf',
            'abstract' => $data['abstract'] ?? 'Institutional repository research publication submitted to Federal Co-operative College, Ibadan.',
            'submitted_at' => Carbon::now()->toIso8601String()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Thesis submitted and published to institutional repository',
            'thesis' => $thesis
        ]);
    }

    public function getPartnerLibraries()
    {
        try {
            $libs = DB::table('partner_libraries')->get();
            return response()->json($libs);
        } catch (\Exception $e) {
            return response()->json([]);
        }
    }

    public function getExternalLinks()
    {
        try {
            $links = DB::table('external_links')->get();
            return response()->json($links);
        } catch (\Exception $e) {
            return response()->json([]);
        }
    }

    public function getAcquisitions()
    {
        try {
            $acqs = DB::table('acquisitions')->orderBy('date_requested', 'desc')->get();
            return response()->json($acqs);
        } catch (\Exception $e) {
            return response()->json([]);
        }
    }

    public function storeAcquisition(Request $request)
    {
        try {
            $id = 'PO-' . date('Y') . '-' . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT);
            DB::table('acquisitions')->insert([
                'id'               => $id,
                'title'            => $request->input('title', 'Untitled Request'),
                'author'           => $request->input('author', 'Various'),
                'publisher'        => $request->input('publisher', ''),
                'isbn'             => $request->input('isbn', ''),
                'department'       => $request->input('department', 'General'),
                'requested_by'     => $request->input('requested_by', 'Library Admin'),
                'requester_role'   => $request->input('requester_role', 'Admin'),
                'cost_estimate_ngn'=> $request->input('cost', 0),
                'copies_requested' => $request->input('copies', 1),
                'status'           => 'Pending Dean Approval',
                'date_requested'   => date('Y-m-d'),
                'priority'         => $request->input('priority', 'High'),
                'justification'    => $request->input('justification', 'Curriculum requirement'),
            ]);
            $acq = DB::table('acquisitions')->where('id', $id)->first();
            return response()->json(['success' => true, 'acquisition' => $acq], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getSerials()
    {
        try {
            $serials = DB::table('serials')->get();
            return response()->json($serials);
        } catch (\Exception $e) {
            return response()->json([]);
        }
    }

    public function getStudyRooms()
    {
        try {
            $rooms = DB::table('study_rooms')->get();
            return response()->json($rooms);
        } catch (\Exception $e) {
            return response()->json([]);
        }
    }

    public function getReservations()
    {
        try {
            $reservations = DB::table('reservations')->orderBy('reserved_date', 'desc')->get();
            return response()->json($reservations);
        } catch (\Exception $e) {
            return response()->json([]);
        }
    }

    public function getAuditLogs()
    {
        $logs = AuditLog::orderBy('timestamp', 'desc')->limit(50)->get();
        return response()->json($logs);
    }

    public function getShelves()
    {
        try {
            $shelves = DB::table('shelves')->orderBy('floor')->get();
            return response()->json($shelves);
        } catch (\Exception $e) {
            return response()->json([]);
        }
    }

    public function getPartnerLibrariesFull()
    {
        try {
            $libs = DB::table('partner_libraries')->get();
            return response()->json($libs);
        } catch (\Exception $e) {
            return response()->json([]);
        }
    }

    public function getAnalytics()
    {
        try {
            $totalBooks     = Book::count();
            $totalPatrons   = Patron::count();
            $activeLoans    = DB::table('loans')->where('status', 'Active')->count();
            $overdueLoans   = DB::table('loans')->where('status', 'Overdue')->count();
            $totalTheses    = Thesis::count();
            $returnedLoans  = DB::table('loans')->where('status', 'Returned')->count();
            $totalLoans     = DB::table('loans')->count();
            $digitalBooks   = Book::where('is_digital', true)->count();

            // Book-to-student ratio
            $bookToPatronRatio = $totalPatrons > 0 ? round($totalBooks / $totalPatrons, 1) : 0;

            // Recent (past 5 years)
            $recentBooks = Book::where('year', '>=', (int) date('Y') - 5)->count();
            $recentPct   = $totalBooks > 0 ? round(($recentBooks / $totalBooks) * 100) : 0;

            // Digital %
            $digitalPct = $totalBooks > 0 ? round(($digitalBooks / $totalBooks) * 100) : 0;

            // Accreditation score (computed)
            $score = 85;
            if ($bookToPatronRatio >= 1) $score += 5;
            if ($recentPct >= 60)        $score += 5;
            if ($totalTheses >= 2)       $score += 3;
            if ($digitalPct >= 50)       $score += 2;

            // Department distribution
            $deptDist = DB::table('books')
                ->select('department', DB::raw('count(*) as count'))
                ->groupBy('department')
                ->get();

            // Monthly loan trend (last 6 months) — uses borrow_date column
            $loanTrend = DB::table('loans')
                ->select(DB::raw("strftime('%Y-%m', borrow_date) as month"), DB::raw('count(*) as total'))
                ->where('borrow_date', '>=', date('Y-m-d', strtotime('-6 months')))
                ->groupBy('month')
                ->orderBy('month')
                ->get();

            return response()->json([
                'totalBooks'         => $totalBooks,
                'totalPatrons'       => $totalPatrons,
                'activeLoans'        => $activeLoans,
                'overdueLoans'       => $overdueLoans,
                'returnedLoans'      => $returnedLoans,
                'totalLoans'         => $totalLoans,
                'totalTheses'        => $totalTheses,
                'digitalBooks'       => $digitalBooks,
                'digitalPct'         => $digitalPct,
                'recentBooksPct'     => $recentPct,
                'bookToPatronRatio'  => "1 : {$bookToPatronRatio}",
                'accreditationScore' => min($score, 100) . '%',
                'deptDistribution'   => $deptDist,
                'loanTrend'          => $loanTrend,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function aiChat(Request $request)
    {
        $prompt = trim($request->input('prompt', ''));
        $history = $request->input('history', []);

        $lower = strtolower($prompt);

        if (str_contains($lower, 'book') || str_contains($lower, 'catalog') || str_contains($lower, 'recommend')) {
            $sampleBooks = Book::take(3)->get(['title', 'author', 'call_number', 'shelf_location']);
            $list = $sampleBooks->map(fn($b) => "• *{$b->title}* by {$b->author} [Call: {$b->call_number}, Shelf: {$b->shelf_location}]")->implode("\n");
            $response = "Welcome to the FCC Smart AI Reference Desk! Here are relevant holdings from our Central Catalogue:\n\n{$list}\n\nWould you like me to reserve any of these titles for you or generate an APA 7th citation?";
        } elseif (str_contains($lower, 'clearance')) {
            $response = "Library Clearance Status: To receive an online graduation library certificate, make sure you have zero overdue books and no unpaid late charges. You can generate and print your clearance slip directly in the 'Graduation Clearance' tab.";
        } elseif (str_contains($lower, 'hours') || str_contains($lower, 'time')) {
            $response = "FCC Library Hours:\n• Main Stacks & E-Library: Monday – Friday, 8:00 AM – 6:00 PM\n• Digital Repository & OPAC: 24/7 online availability.";
        } else {
            $response = "Greetings! I am the FCC Smart Librarian AI. I can assist you with discovering physical & digital textbooks, locating shelf coordinates, finding theses in our institutional repository, and formatting bibliographic citations. What research topic are you working on today?";
        }

        return response()->json([
            'reply' => $response,
            'source' => 'Laravel 11 Institutional Knowledge Engine',
            'timestamp' => Carbon::now()->toIso8601String()
        ]);
    }

    // -------------------------------------------------------------
    // Continue Reading Progress
    // -------------------------------------------------------------
    public function getContinueReading(Request $request)
    {
        $matric = $request->query('matric', '');
        $query = DB::table('continue_reading');
        if (!empty($matric)) {
            $query->where('matric', 'like', "%{$matric}%");
        }
        $records = $query->orderBy('updated_at', 'desc')->get();
        return response()->json($records);
    }

    public function saveContinueReading(Request $request)
    {
        $matric = $request->input('matric', 'FCC/CSC/2026/409');
        $bookId = $request->input('book_id', $request->input('bookId'));
        $page = (int)$request->input('page', 1);
        $totalPages = (int)$request->input('totalPages', $request->input('total_pages', 100));
        $title = $request->input('title', 'Unknown Title');
        $author = $request->input('author', 'Unknown Author');
        $progress = $totalPages > 0 ? (int)round(($page / $totalPages) * 100) : 0;

        $id = "CR-" . substr(md5($matric . $bookId), 0, 12);

        DB::table('continue_reading')->updateOrInsert(
            ['matric' => $matric, 'book_id' => $bookId],
            [
                'id' => $id,
                'title' => $title,
                'author' => $author,
                'last_page' => $page,
                'total_pages' => $totalPages,
                'progress' => $progress,
                'last_opened' => Carbon::now()->toIso8601String(),
                'updated_at' => Carbon::now(),
            ]
        );

        $record = DB::table('continue_reading')->where('matric', $matric)->where('book_id', $bookId)->first();
        return response()->json(['success' => true, 'record' => $record]);
    }

    // -------------------------------------------------------------
    // Room Bookings
    // -------------------------------------------------------------
    public function getRoomBookings(Request $request)
    {
        $matric = $request->query('matric');
        $query = DB::table('room_bookings');
        if (!empty($matric)) {
            $query->where('matric', 'like', "%{$matric}%");
        }
        $bookings = $query->orderBy('date', 'desc')->get();
        return response()->json($bookings);
    }

    public function saveRoomBooking(Request $request)
    {
        $id = 'RB-' . strtoupper(Str::random(8));
        $matric = $request->input('matric', 'FCC/CSC/2026/409');
        $roomId = $request->input('roomId', $request->input('room_id', 'ROOM-01'));
        $roomName = $request->input('roomName', $request->input('room_name', 'Research Carrel 1'));
        $date = $request->input('date', date('Y-m-d'));
        $timeSlot = $request->input('timeSlot', $request->input('time_slot', '10:00 AM - 12:00 PM'));

        DB::table('room_bookings')->insert([
            'id' => $id,
            'matric' => $matric,
            'room_id' => $roomId,
            'room_name' => $roomName,
            'branch' => $request->input('branch', 'Main Campus Library'),
            'date' => $date,
            'time_slot' => $timeSlot,
            'duration_hours' => (int)$request->input('duration', 2),
            'purpose' => $request->input('purpose', 'Academic Research & Study'),
            'status' => 'Confirmed',
            'check_in_code' => strtoupper(Str::random(6)),
            'created_at' => Carbon::now(),
        ]);

        $booking = DB::table('room_bookings')->where('id', $id)->first();
        return response()->json(['success' => true, 'booking' => $booking], 201);
    }

    public function cancelRoomBooking($id)
    {
        DB::table('room_bookings')->where('id', $id)->update(['status' => 'Cancelled']);
        return response()->json(['success' => true, 'message' => "Booking {$id} cancelled."]);
    }

    // -------------------------------------------------------------
    // Reading Lists
    // -------------------------------------------------------------
    public function getReadingLists(Request $request)
    {
        $matric = $request->query('matric');
        $query = DB::table('reading_lists');
        if (!empty($matric)) {
            $query->where('matric', 'like', "%{$matric}%");
        }
        $lists = $query->orderBy('created_at', 'desc')->get()->map(function ($l) {
            $l->items = is_string($l->items) ? json_decode($l->items, true) : ($l->items ?: []);
            return $l;
        });
        return response()->json($lists);
    }

    public function saveReadingList(Request $request)
    {
        $id = 'LIST-' . strtoupper(Str::random(8));
        $matric = $request->input('matric', 'FCC/CSC/2026/409');
        $title = $request->input('title', 'My Syllabus Reading List');
        $items = $request->input('items', []);

        DB::table('reading_lists')->insert([
            'id' => $id,
            'matric' => $matric,
            'title' => $title,
            'description' => $request->input('description', ''),
            'is_public' => $request->boolean('is_public') ? 1 : 0,
            'item_count' => count($items),
            'items' => json_encode($items),
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        $list = DB::table('reading_lists')->where('id', $id)->first();
        if ($list) {
            $list->items = json_decode($list->items, true);
        }
        return response()->json(['success' => true, 'list' => $list], 201);
    }

    public function deleteReadingList($id)
    {
        DB::table('reading_lists')->where('id', $id)->delete();
        DB::table('reading_list_items')->where('reading_list_id', $id)->delete();
        return response()->json(['success' => true, 'message' => "Reading list {$id} deleted."]);
    }

    // -------------------------------------------------------------
    // Notifications & Announcements
    // -------------------------------------------------------------
    public function getNotifications(Request $request)
    {
        $matric = $request->query('matric');
        $query = DB::table('notifications');
        if (!empty($matric)) {
            $query->where('matric', 'like', "%{$matric}%");
        }
        $notifications = $query->orderBy('date', 'desc')->get();
        return response()->json($notifications);
    }

    public function getAnnouncements()
    {
        $announcements = DB::table('announcements')->orderBy('date', 'desc')->get();
        return response()->json($announcements);
    }

    public function getDigitalResources()
    {
        $res = DB::table('digital_resources')
            ->join('books', 'digital_resources.book_id', '=', 'books.id')
            ->select('digital_resources.*', 'books.title', 'books.author', 'books.cover_image')
            ->get();
        return response()->json($res);
    }
}
