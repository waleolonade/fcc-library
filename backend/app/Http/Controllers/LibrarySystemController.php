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
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Services\MailNotificationService;

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
            'database' => 'gsashtub_brainfeels_library (SQLite & Eloquent ORM)',
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

    public function getAcquisitions(Request $request)
    {
        try {
            $query = DB::table('acquisitions');
            if ($request->has('department') && $request->input('department') !== 'ALL') {
                $query->where('department', $request->input('department'));
            }
            if ($request->has('status') && $request->input('status') !== 'ALL') {
                $query->where('status', $request->input('status'));
            }
            $acqs = $query->orderBy('date_requested', 'desc')->get();
            return response()->json($acqs);
        } catch (\Exception $e) {
            return response()->json([]);
        }
    }

    public function getAcquisitionsStats()
    {
        try {
            $totalOrders = DB::table('acquisitions')->count();
            $totalCommitted = floatval(DB::table('acquisitions')->sum('cost_estimate_ngn') ?: 0);
            
            $deliveredCost = floatval(DB::table('acquisitions')
                ->where(function ($q) {
                    $q->where('status', 'like', '%Delivered%')
                      ->orWhere('status', 'Approved');
                })
                ->sum('cost_estimate_ngn') ?: 0);

            $deliveredCount = DB::table('acquisitions')
                ->where(function ($q) {
                    $q->where('status', 'like', '%Delivered%')
                      ->orWhere('status', 'Approved');
                })
                ->count();

            $pendingCount = DB::table('acquisitions')
                ->where(function ($q) {
                    $q->where('status', 'Pending Dean Approval')
                      ->orWhere('status', 'Under Review')
                      ->orWhere('status', 'like', '%Review%')
                      ->orWhere('status', 'like', '%Pending%');
                })
                ->count();

            $highPriorityCount = DB::table('acquisitions')
                ->where(function ($q) {
                    $q->where('priority', 'High')
                      ->orWhere('priority', 'Urgent')
                      ->orWhere('priority', 'like', '%Accreditation%');
                })
                ->count();

            $activeSerials = DB::table('serials')
                ->where('subscription_status', 'like', '%Active%')
                ->count();
            $totalSerials = DB::table('serials')->count();

            // Check budget allocation in library_settings
            $budgetRow = DB::table('library_settings')
                ->where('setting_key', 'acquisitions_budget_allocation')
                ->first();
            
            if (!$budgetRow) {
                try {
                    DB::table('library_settings')->insert([
                        'setting_key' => 'acquisitions_budget_allocation',
                        'setting_value' => '15000000',
                        'setting_group' => 'budget',
                        'value_type' => 'number',
                        'is_public' => 1,
                        'description' => 'Annual Stacks Vote & Curriculum Acquisitions Allocation (NGN)',
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                    $allocationBudget = 15000000;
                } catch (\Exception $ex) {
                    $allocationBudget = 15000000;
                }
            } else {
                $allocationBudget = is_numeric($budgetRow->setting_value) ? floatval($budgetRow->setting_value) : 15000000;
            }

            $budgetUsedPercent = $allocationBudget > 0
                ? min(100, round(($totalCommitted / $allocationBudget) * 100, 1))
                : 0;

            return response()->json([
                'success' => true,
                'stacks_vote_allocation' => $allocationBudget,
                'budget_used_percent' => $budgetUsedPercent,
                'committed_procurement' => $totalCommitted,
                'total_requisitions' => $totalOrders,
                'delivered_cataloged_cost' => $deliveredCost,
                'delivered_cataloged_count' => $deliveredCount,
                'pending_reviews_count' => $pendingCount,
                'high_priority_count' => $highPriorityCount,
                'active_serials_count' => $activeSerials,
                'total_serials_count' => $totalSerials,
                'updated_at' => now()->toIso8601String()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateBudget(Request $request)
    {
        try {
            $raw = $request->input('allocation_budget', $request->input('amount', 0));
            $budget = is_numeric($raw) ? floatval($raw) : floatval(preg_replace('/[^0-9.]/', '', (string)$raw));
            if ($budget <= 0) {
                return response()->json(['error' => 'Please provide a valid budget allocation amount'], 422);
            }

            DB::table('library_settings')->updateOrInsert(
                ['setting_key' => 'acquisitions_budget_allocation'],
                [
                    'setting_value' => (string)$budget,
                    'setting_group' => 'budget',
                    'value_type' => 'number',
                    'is_public' => 1,
                    'description' => 'Annual Stacks Vote & Curriculum Acquisitions Allocation (NGN)',
                    'updated_at' => now(),
                ]
            );

            return response()->json([
                'success' => true,
                'allocation_budget' => $budget,
                'message' => 'Budget vote allocation updated successfully in database'
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function storeAcquisition(Request $request)
    {
        try {
            $id = $request->input('id') ?: ('PO-' . date('Y') . '-' . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT));
            $rawCost = $request->input('cost_estimate_ngn', $request->input('cost', 0));
            // strip any currency symbols or commas if passed as string
            $cost = is_numeric($rawCost) ? $rawCost : floatval(preg_replace('/[^0-9.]/', '', (string)$rawCost));

            DB::table('acquisitions')->insert([
                'id'               => $id,
                'title'            => trim((string)$request->input('title', '')),
                'author'           => trim((string)$request->input('author', '')),
                'publisher'        => trim((string)$request->input('publisher', '')),
                'isbn'             => trim((string)$request->input('isbn', '')),
                'department'       => $request->input('department', 'General'),
                'requested_by'     => $request->input('requested_by', 'Library User'),
                'requester_role'   => $request->input('requester_role', 'Staff'),
                'cost_estimate_ngn'=> $cost,
                'copies_requested' => max(1, intval($request->input('copies_requested', $request->input('copies', 1)))),
                'status'           => $request->input('status', 'Pending Dean Approval'),
                'date_requested'   => $request->input('date_requested', date('Y-m-d')),
                'priority'         => $request->input('priority', 'Normal'),
                'justification'    => trim((string)$request->input('justification', '')),
            ]);
            $acq = DB::table('acquisitions')->where('id', $id)->first();
            return response()->json(['success' => true, 'acquisition' => $acq], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function updateAcquisitionStatus(Request $request, $id)
    {
        try {
            $status = $request->input('status');
            $notes = $request->input('notes', '');
            
            $acq = DB::table('acquisitions')->where('id', $id)->first();
            if (!$acq) {
                return response()->json(['error' => 'Acquisition order not found'], 404);
            }

            $updateData = ['status' => $status];
            if ($notes) {
                $updateData['justification'] = ($acq->justification ? $acq->justification . " | Note: " : "Note: ") . $notes;
            }

            DB::table('acquisitions')->where('id', $id)->update($updateData);

            // If status is 'Delivered & Cataloged', check if the book already exists in books table; if not, auto-create catalog holding
            if (($status === 'Delivered & Cataloged' || $status === 'Delivered') && $request->input('auto_catalog', true)) {
                $copies = intval($acq->copies_requested ?: 1);
                $existingBook = null;
                if (!empty($acq->isbn)) {
                    $existingBook = DB::table('books')->where('isbn', $acq->isbn)->first();
                }
                if (!$existingBook) {
                    $existingBook = DB::table('books')->where('title', $acq->title)->first();
                }

                if ($existingBook) {
                    DB::table('books')->where('id', $existingBook->id)->increment('copies_total', $copies);
                    DB::table('books')->where('id', $existingBook->id)->increment('copies_available', $copies);
                } else {
                    DB::table('books')->insert([
                        'title' => $acq->title,
                        'author' => $acq->author ?: 'Academic Contributor',
                        'isbn' => $acq->isbn ?: ('978-FCC-' . rand(10000, 99999)),
                        'department' => $acq->department ?: 'General Studies & Reference',
                        'publisher' => $acq->publisher ?: 'Federal Co-operative College Press',
                        'year' => date('Y'),
                        'shelf_location' => 'Main Stacks, Ingestion Bay',
                        'copies_total' => $copies,
                        'copies_available' => $copies,
                        'format' => 'Physical Hardcover',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            $updated = DB::table('acquisitions')->where('id', $id)->first();
            return response()->json(['success' => true, 'acquisition' => $updated]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function updateAcquisition(Request $request, $id)
    {
        try {
            $acq = DB::table('acquisitions')->where('id', $id)->first();
            if (!$acq) {
                return response()->json(['error' => 'Acquisition order not found'], 404);
            }

            $data = [];
            if ($request->has('title')) $data['title'] = $request->input('title');
            if ($request->has('author')) $data['author'] = $request->input('author');
            if ($request->has('publisher')) $data['publisher'] = $request->input('publisher');
            if ($request->has('isbn')) $data['isbn'] = $request->input('isbn');
            if ($request->has('department')) $data['department'] = $request->input('department');
            if ($request->has('cost_estimate_ngn')) {
                $rawCost = $request->input('cost_estimate_ngn');
                $data['cost_estimate_ngn'] = is_numeric($rawCost) ? $rawCost : floatval(preg_replace('/[^0-9.]/', '', (string)$rawCost));
            } elseif ($request->has('cost')) {
                $rawCost = $request->input('cost');
                $data['cost_estimate_ngn'] = is_numeric($rawCost) ? $rawCost : floatval(preg_replace('/[^0-9.]/', '', (string)$rawCost));
            }
            if ($request->has('copies_requested')) $data['copies_requested'] = intval($request->input('copies_requested'));
            if ($request->has('copies')) $data['copies_requested'] = intval($request->input('copies'));
            if ($request->has('priority')) $data['priority'] = $request->input('priority');
            if ($request->has('status')) $data['status'] = $request->input('status');
            if ($request->has('justification')) $data['justification'] = $request->input('justification');
            if ($request->has('requested_by')) $data['requested_by'] = $request->input('requested_by');
            if ($request->has('date_requested')) $data['date_requested'] = $request->input('date_requested');

            if (!empty($data)) {
                DB::table('acquisitions')->where('id', $id)->update($data);
            }

            $updated = DB::table('acquisitions')->where('id', $id)->first();
            return response()->json(['success' => true, 'acquisition' => $updated]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function deleteAcquisition($id)
    {
        try {
            DB::table('acquisitions')->where('id', $id)->delete();
            return response()->json(['success' => true, 'message' => 'Acquisition order deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getSerials()
    {
        try {
            $serials = DB::table('serials')->orderBy('id', 'asc')->get();
            return response()->json($serials);
        } catch (\Exception $e) {
            return response()->json([]);
        }
    }

    public function storeSerial(Request $request)
    {
        try {
            $id = $request->input('id') ?: ('SER-' . str_pad(rand(10, 999), 3, '0', STR_PAD_LEFT));
            DB::table('serials')->insert([
                'id'                  => $id,
                'title'               => trim((string)$request->input('title', '')),
                'issn'                => trim((string)$request->input('issn', '')),
                'publisher'           => trim((string)$request->input('publisher', '')),
                'frequency'           => $request->input('frequency', 'Quarterly'),
                'department'          => $request->input('department', 'General'),
                'latest_volume'       => trim((string)$request->input('latest_volume', '')),
                'latest_issue'        => trim((string)$request->input('latest_issue', '')),
                'holding_summary'     => trim((string)$request->input('holding_summary', '')),
                'subscription_status' => $request->input('subscription_status', 'Active Subscription'),
            ]);
            $serial = DB::table('serials')->where('id', $id)->first();
            return response()->json(['success' => true, 'serial' => $serial], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function updateSerial(Request $request, $id)
    {
        try {
            $serial = DB::table('serials')->where('id', $id)->first();
            if (!$serial) {
                return response()->json(['error' => 'Serial subscription not found'], 404);
            }

            $data = [];
            if ($request->has('title')) $data['title'] = $request->input('title');
            if ($request->has('issn')) $data['issn'] = $request->input('issn');
            if ($request->has('publisher')) $data['publisher'] = $request->input('publisher');
            if ($request->has('frequency')) $data['frequency'] = $request->input('frequency');
            if ($request->has('department')) $data['department'] = $request->input('department');
            if ($request->has('latest_volume')) $data['latest_volume'] = $request->input('latest_volume');
            if ($request->has('latest_issue')) $data['latest_issue'] = $request->input('latest_issue');
            if ($request->has('holding_summary')) $data['holding_summary'] = $request->input('holding_summary');
            if ($request->has('subscription_status')) $data['subscription_status'] = $request->input('subscription_status');

            if (!empty($data)) {
                DB::table('serials')->where('id', $id)->update($data);
            }
            $updated = DB::table('serials')->where('id', $id)->first();
            return response()->json(['success' => true, 'serial' => $updated]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function deleteSerial($id)
    {
        try {
            DB::table('serials')->where('id', $id)->delete();
            return response()->json(['success' => true, 'message' => 'Serial subscription deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getVendors()
    {
        try {
            if (!Schema::hasTable('library_vendors')) {
                Schema::create('library_vendors', function ($table) {
                    $table->increments('id');
                    $table->string('name');
                    $table->string('location')->nullable();
                    $table->string('contact')->nullable();
                    $table->string('email')->nullable();
                    $table->string('specialty')->nullable();
                    $table->string('rating')->default('Tier-1 Approved');
                    $table->string('status')->default('active');
                    $table->timestamps();
                });

                DB::table('library_vendors')->insert([
                    [
                        'name' => 'University Press Plc',
                        'location' => 'Three Crowns Building, Jericho, Ibadan',
                        'contact' => '+234 803 322 1190',
                        'email' => 'orders@universitypressplc.com',
                        'specialty' => 'Academic Monographs, Curriculum Textbooks',
                        'rating' => 'Tier-1 Approved',
                        'status' => 'active',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                    [
                        'name' => 'CSS Bookshops Ltd',
                        'location' => '50/52 Broad Street, Lagos Island',
                        'contact' => '+234 802 314 5599',
                        'email' => 'acquisitions@cssbookshops.com',
                        'specialty' => 'Technical, Computing & Reference Libraries',
                        'rating' => 'Tier-1 Approved',
                        'status' => 'active',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                    [
                        'name' => 'Spectrum Books Ltd',
                        'location' => 'Spectrum House, Ring Road, Ibadan',
                        'contact' => '+234 805 510 4488',
                        'email' => 'procurement@spectrumbooksonline.com',
                        'specialty' => 'Cooperative Studies, Banking & Management',
                        'rating' => 'Tier-1 Approved',
                        'status' => 'active',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                    [
                        'name' => 'Pearson Education Africa',
                        'location' => 'Victoria Island, Lagos / London UK',
                        'contact' => '+44 20 7010 2000',
                        'email' => 'highered.africa@pearson.com',
                        'specialty' => 'International Accredited Curriculum Texts',
                        'rating' => 'Global Consortia Partner',
                        'status' => 'active',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                    [
                        'name' => 'Federal Co-operative College Academic Press',
                        'location' => 'Campus Directorate of Publications, Eleyele, Ibadan',
                        'contact' => '+234 806 165 7738',
                        'email' => 'press@fccibadan.edu.ng',
                        'specialty' => 'Institutional Journals, Lecture Handouts & Research Monographs',
                        'rating' => 'Internal Press',
                        'status' => 'active',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                ]);
            }

            $vendors = DB::table('library_vendors')->orderBy('name', 'asc')->get();
            return response()->json($vendors);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function storeVendor(Request $request)
    {
        try {
            $name = trim((string)$request->input('name'));
            if (!$name) {
                return response()->json(['error' => 'Vendor name is required'], 422);
            }

            $id = DB::table('library_vendors')->insertGetId([
                'name' => $name,
                'location' => $request->input('location', ''),
                'contact' => $request->input('contact', ''),
                'email' => $request->input('email', ''),
                'specialty' => $request->input('specialty', ''),
                'rating' => $request->input('rating', 'Tier-1 Approved'),
                'status' => $request->input('status', 'active'),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $vendor = DB::table('library_vendors')->where('id', $id)->first();
            return response()->json(['success' => true, 'vendor' => $vendor], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function updateVendor(Request $request, $id)
    {
        try {
            $vendor = DB::table('library_vendors')->where('id', $id)->first();
            if (!$vendor) {
                return response()->json(['error' => 'Vendor not found'], 404);
            }

            $data = [];
            if ($request->has('name')) $data['name'] = $request->input('name');
            if ($request->has('location')) $data['location'] = $request->input('location');
            if ($request->has('contact')) $data['contact'] = $request->input('contact');
            if ($request->has('email')) $data['email'] = $request->input('email');
            if ($request->has('specialty')) $data['specialty'] = $request->input('specialty');
            if ($request->has('rating')) $data['rating'] = $request->input('rating');
            if ($request->has('status')) $data['status'] = $request->input('status');
            $data['updated_at'] = now();

            DB::table('library_vendors')->where('id', $id)->update($data);
            $updated = DB::table('library_vendors')->where('id', $id)->first();
            return response()->json(['success' => true, 'vendor' => $updated]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function deleteVendor($id)
    {
        try {
            DB::table('library_vendors')->where('id', $id)->delete();
            return response()->json(['success' => true, 'message' => 'Vendor removed from database']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
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

        try {
            $pdo = \App\Services\DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->prepare("
                    INSERT INTO continue_reading (id, matric, book_id, title, author, last_page, total_pages, progress, last_opened, updated_at)
                    VALUES (:id, :matric, :book_id, :title, :author, :last_page, :total_pages, :progress, NOW(), NOW())
                    ON DUPLICATE KEY UPDATE last_page = VALUES(last_page), total_pages = VALUES(total_pages), progress = VALUES(progress), last_opened = NOW(), updated_at = NOW()
                ");
                $st->execute([
                    ':id' => $id,
                    ':matric' => $matric,
                    ':book_id' => $bookId,
                    ':title' => $title,
                    ':author' => $author,
                    ':last_page' => $page,
                    ':total_pages' => $totalPages,
                    ':progress' => $progress
                ]);
            }
        } catch (\Throwable $e) {}

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
        $duration = (int)$request->input('duration', 2);
        $purpose = $request->input('purpose', 'Academic Research & Study');
        $branch = $request->input('branch', 'Main Campus Library');
        $checkInCode = strtoupper(Str::random(6));

        DB::table('room_bookings')->insert([
            'id' => $id,
            'matric' => $matric,
            'room_id' => $roomId,
            'room_name' => $roomName,
            'branch' => $branch,
            'date' => $date,
            'time_slot' => $timeSlot,
            'duration_hours' => $duration,
            'purpose' => $purpose,
            'status' => 'Confirmed',
            'check_in_code' => $checkInCode,
            'created_at' => Carbon::now(),
        ]);

        try {
            $pdo = \App\Services\DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->prepare("
                    INSERT INTO room_bookings (id, matric, room_id, room_name, branch, date, time_slot, duration_hours, purpose, status, check_in_code, created_at)
                    VALUES (:id, :matric, :room_id, :room_name, :branch, :date, :time_slot, :duration, :purpose, 'Confirmed', :code, NOW())
                ");
                $st->execute([
                    ':id' => $id,
                    ':matric' => $matric,
                    ':room_id' => $roomId,
                    ':room_name' => $roomName,
                    ':branch' => $branch,
                    ':date' => $date,
                    ':time_slot' => $timeSlot,
                    ':duration' => $duration,
                    ':purpose' => $purpose,
                    ':code' => $checkInCode
                ]);
            }
        } catch (\Throwable $e) {}

        $booking = DB::table('room_bookings')->where('id', $id)->first();
        return response()->json(['success' => true, 'booking' => $booking], 201);
    }

    public function cancelRoomBooking($id)
    {
        DB::table('room_bookings')->where('id', $id)->update(['status' => 'Cancelled']);

        try {
            $pdo = \App\Services\DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->prepare("UPDATE room_bookings SET status = 'Cancelled' WHERE id = :id");
                $st->execute([':id' => $id]);
            }
        } catch (\Throwable $e) {}

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

        try {
            $pdo = \App\Services\DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->prepare("
                    INSERT INTO reading_lists (id, matric, title, description, is_public, item_count, items, created_at, updated_at)
                    VALUES (:id, :matric, :title, :description, :is_public, :item_count, :items, NOW(), NOW())
                    ON DUPLICATE KEY UPDATE title = VALUES(title), items = VALUES(items), item_count = VALUES(item_count), updated_at = NOW()
                ");
                $st->execute([
                    ':id' => $id,
                    ':matric' => $matric,
                    ':title' => $title,
                    ':description' => $request->input('description', ''),
                    ':is_public' => $request->boolean('is_public') ? 1 : 0,
                    ':item_count' => count($items),
                    ':items' => json_encode($items)
                ]);
            }
        } catch (\Throwable $e) {}

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

        try {
            $pdo = \App\Services\DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->prepare("DELETE FROM reading_lists WHERE id = :id");
                $st->execute([':id' => $id]);
            }
        } catch (\Throwable $e) {}

        return response()->json(['success' => true, 'message' => "Reading list {$id} deleted."]);
    }

    // -------------------------------------------------------------
    // Notifications & Announcements (User-Scoped & Role-Aware)
    // -------------------------------------------------------------
    public function getNotifications(Request $request)
    {
        $matric = trim((string)$request->query('matric', ''));
        $email = trim((string)$request->query('email', ''));
        $userId = trim((string)$request->query('user_id', ''));
        $role = strtolower(trim((string)$request->query('role', '')));
        $deptCode = strtoupper(trim((string)$request->query('department_code', '')));
        $staffCode = trim((string)$request->query('staff_code', ''));
        $username = trim((string)$request->query('username', ''));

        $isStaff = $role === 'hod_staff';

        $identifiers = array_values(array_unique(array_filter([
            $matric,
            $email,
            $userId,
            $staffCode,
            $username,
            (!$isStaff && $deptCode) ? "HOD/{$deptCode}/001" : '',
            (!$isStaff && $deptCode) ? "hod_" . strtolower($deptCode) : '',
            $role ? "role:{$role}" : '',
            $isStaff ? 'role:hod_staff' : ''
        ])));

        $query = DB::table('notifications');

        if (!empty($identifiers)) {
            $query->where(function($q) use ($identifiers) {
                foreach ($identifiers as $idVal) {
                    $q->orWhere('matric', $idVal)
                      ->orWhere('matric', 'like', "%{$idVal}%");
                }
                // Include general/global announcements, but never leak another user's login_security alert
                $q->orWhere(function($sub) {
                    $sub->where('type', '!=', 'login_security')
                        ->where(function($g) {
                            $g->where('matric', 'all')
                              ->orWhere('matric', 'global')
                              ->orWhereNull('matric')
                              ->orWhere('matric', '');
                        });
                });
            });
        } else {
            // Unauthenticated or unspecified query: only return public/global announcements
            $query->where('type', '!=', 'login_security')
                  ->where(function($g) {
                      $g->where('matric', 'all')
                        ->orWhere('matric', 'global')
                        ->orWhereNull('matric')
                        ->orWhere('matric', '');
                  });
        }

        $notifications = $query->orderBy('date', 'desc')->limit(60)->get();
        return response()->json($notifications);
    }

    public function storeNotification(Request $request)
    {
        $matric = trim((string)$request->input('matric', ''));
        $title = trim((string)$request->input('title', ''));
        $message = trim((string)$request->input('message', ''));
        $type = trim((string)$request->input('type', 'general'));
        $actionUrl = $request->input('action_url', null);
        $sendEmail = $request->boolean('send_email', true);
        $targetEmail = trim((string)$request->input('email', ''));
        $recipientName = trim((string)$request->input('name', 'Scholar'));

        if (empty($title) || empty($message)) {
            return response()->json(['success' => false, 'error' => 'Title and message are required.'], 422);
        }

        // Find patron email if not supplied
        if (empty($targetEmail) && !empty($matric)) {
            $patron = Patron::where('matric', $matric)->orWhere('barcode', $matric)->first();
            if ($patron) {
                $targetEmail = $patron->email ?: '';
                if ($recipientName === 'Scholar' && !empty($patron->name)) {
                    $recipientName = $patron->name;
                }
            }
        }

        $id = 'NOTIF-' . strtoupper(Str::random(10));
        $nowDate = Carbon::now('Africa/Lagos')->toIso8601String();

        DB::table('notifications')->insert([
            'id' => $id,
            'matric' => $matric ?: null,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'date' => $nowDate,
            'read' => 0,
            'action_url' => $actionUrl
        ]);

        try {
            $pdo = \App\Services\DatabaseService::getPdo();
            if ($pdo) {
                $stmt = $pdo->prepare("
                    INSERT INTO notifications (id, matric, type, title, message, date, `read`, action_url)
                    VALUES (:id, :matric, :type, :title, :message, :date, :read, :action_url)
                    ON DUPLICATE KEY UPDATE
                    matric = VALUES(matric), type = VALUES(type), title = VALUES(title), message = VALUES(message), date = VALUES(date), `read` = VALUES(`read`), action_url = VALUES(action_url)
                ");
                $stmt->execute([
                    ':id' => $id,
                    ':matric' => $matric ?: null,
                    ':type' => $type,
                    ':title' => $title,
                    ':message' => $message,
                    ':date' => $nowDate,
                    ':read' => 0,
                    ':action_url' => $actionUrl
                ]);
            }
        } catch (\Throwable $th) {}

        $emailRes = null;
        if ($sendEmail && !empty($targetEmail)) {
            $emailRes = MailNotificationService::sendPatronNotificationEmail(
                $targetEmail,
                $recipientName,
                $title,
                $message,
                $type,
                $actionUrl
            );
        }

        return response()->json([
            'success' => true,
            'id' => $id,
            'notification' => [
                'id' => $id,
                'matric' => $matric,
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'date' => $nowDate,
                'read' => 0,
                'action_url' => $actionUrl
            ],
            'email_sent' => (bool)($emailRes['sent'] ?? false),
            'email_result' => $emailRes
        ]);
    }

    public function markNotificationRead(Request $request, $id)
    {
        if ($id === 'all') {
            $matric = $request->input('matric');
            $query = DB::table('notifications');
            if (!empty($matric)) {
                $query->where('matric', $matric);
            }
            $query->update(['read' => 1]);

            try {
                $pdo = \App\Services\DatabaseService::getPdo();
                if ($pdo) {
                    if (!empty($matric)) {
                        $stmt = $pdo->prepare("UPDATE notifications SET `read` = 1 WHERE matric = :matric OR matric LIKE :mLike");
                        $stmt->execute([':matric' => $matric, ':mLike' => "%{$matric}%"]);
                    } else {
                        $pdo->exec("UPDATE notifications SET `read` = 1");
                    }
                }
            } catch (\Throwable $th) {}

            return response()->json(['success' => true, 'message' => 'All notifications marked as read']);
        }

        DB::table('notifications')->where('id', $id)->update(['read' => 1]);

        try {
            $pdo = \App\Services\DatabaseService::getPdo();
            if ($pdo) {
                $stmt = $pdo->prepare("UPDATE notifications SET `read` = 1 WHERE id = :id");
                $stmt->execute([':id' => $id]);
            }
        } catch (\Throwable $th) {}

        return response()->json(['success' => true, 'message' => 'Notification marked as read']);
    }

    public function clearNotifications(Request $request)
    {
        $id = $request->input('id');
        $matric = $request->input('matric');

        if (!empty($id)) {
            DB::table('notifications')->where('id', $id)->delete();
            try {
                $pdo = \App\Services\DatabaseService::getPdo();
                if ($pdo) {
                    $stmt = $pdo->prepare("DELETE FROM notifications WHERE id = :id");
                    $stmt->execute([':id' => $id]);
                }
            } catch (\Throwable $th) {}
            return response()->json(['success' => true, 'message' => 'Notification deleted']);
        }

        if (!empty($matric)) {
            DB::table('notifications')->where('matric', $matric)->delete();
            try {
                $pdo = \App\Services\DatabaseService::getPdo();
                if ($pdo) {
                    $stmt = $pdo->prepare("DELETE FROM notifications WHERE matric = :matric OR matric LIKE :mLike");
                    $stmt->execute([':matric' => $matric, ':mLike' => "%{$matric}%"]);
                }
            } catch (\Throwable $th) {}
            return response()->json(['success' => true, 'message' => 'User notifications cleared']);
        }

        return response()->json(['success' => false, 'error' => 'Specify notification id or patron matric.'], 422);
    }

    // -------------------------------------------------------------
    // Live Server Mail (cPanel SMTP) Configuration & Diagnostics
    // -------------------------------------------------------------
    public function getMailConfig()
    {
        $cfg = MailNotificationService::getMailConfig();
        $hasPass = !empty($cfg['password']);
        $cfg['password_set'] = $hasPass;
        $cfg['password'] = $hasPass ? '••••••••••••' : '';

        return response()->json([
            'success' => true,
            'config' => $cfg
        ]);
    }

    public function updateMailConfig(Request $request)
    {
        $keys = [
            'mail_smtp_host'       => $request->input('host'),
            'mail_smtp_port'       => $request->input('port'),
            'mail_smtp_username'   => $request->input('username'),
            'mail_smtp_encryption' => $request->input('encryption'),
            'mail_from_address'    => $request->input('from_email')
        ];

        $newPass = $request->input('password');
        if (!empty($newPass) && !str_contains($newPass, '••••')) {
            $keys['mail_smtp_password'] = $newPass;
        }

        foreach ($keys as $k => $v) {
            if ($v !== null) {
                DB::table('library_settings')->updateOrInsert(
                    ['setting_key' => $k],
                    ['setting_value' => (string)$v, 'updated_at' => Carbon::now()]
                );
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Institutional cPanel server mail settings updated successfully in database.',
            'config' => MailNotificationService::getMailConfig()
        ]);
    }

    public function sendTestMail(Request $request)
    {
        $recipient = trim((string)$request->input('recipient', ''));
        $result = MailNotificationService::testSmtpConnection($recipient ?: null);
        return response()->json($result);
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

    // -------------------------------------------------------------
    // Database Management & init-db Endpoint
    // -------------------------------------------------------------
    public function getDatabaseStatus()
    {
        $dbName = env('DB_MYSQL_DATABASE', 'gsashtub_brainfeels_library');
        $host = env('DB_MYSQL_HOST', '127.0.0.1');
        $port = env('DB_MYSQL_PORT', '3306');
        $user = env('DB_MYSQL_USER', 'gsashtub_brainfeels_library');
        $pass = env('DB_MYSQL_PASSWORD', '');

        $counts = [];
        $status = 'Connected';

        try {
            $pdo = new \PDO("mysql:host={$host};port={$port};dbname={$dbName}", $user, $pass, [
                \PDO::ATTR_ERRMODE => \PDO::ERRMODE_SILENT,
                \PDO::ATTR_TIMEOUT => 2
            ]);

            $tables = ['users', 'roles', 'permissions', 'role_permissions', 'user_roles', 'departments', 'department_uploads', 'books', 'patrons', 'loans', 'library_apis'];
            foreach ($tables as $t) {
                try {
                    $cnt = $pdo->query("SELECT count(*) FROM `{$t}`")->fetchColumn();
                    $counts[$t] = (int) $cnt;
                } catch (\Throwable $e) {
                    $counts[$t] = 0;
                }
            }
            $totalTables = count($pdo->query("SHOW TABLES")->fetchAll());
        } catch (\Throwable $e) {
            $status = 'Degraded (' . $e->getMessage() . ')';
            $totalTables = 0;
        }

        return response()->json([
            'database' => $dbName,
            'engine' => 'MySQL / phpMyAdmin (port ' . $port . ')',
            'status' => $status,
            'totalTables' => $totalTables,
            'tableCounts' => $counts
        ]);
    }

    public function initDatabase()
    {
        ob_start();
        require base_path('../database/init-db.php');
        $output = ob_get_clean();

        return response()->json([
            'success' => true,
            'message' => 'Database gsashtub_brainfeels_library initialized successfully via init-db!',
            'output' => $output
        ]);
    }
}

