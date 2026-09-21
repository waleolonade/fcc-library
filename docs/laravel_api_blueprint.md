# FCC Smart Library Management & Digital Repository Platform
## Laravel 11/12 REST API & Backend Architecture Blueprint

This blueprint specifies the production backend implementation for the **Federal Co-operative College, Ibadan (FCC Ibadan)** Integrated Library Services Platform (ILMS/LSP).

---

### 1. Technology Architecture Stack
* **Framework:** Laravel 11.x / 12.x on PHP 8.3+
* **Authentication:** Laravel Sanctum (PAT & Stateful SPA) + Bcrypt PIN Hashing + TOTP MFA
* **Database:** PostgreSQL 16+ with `pgcrypto` and full-text GIN indexing
* **Cache & Queues:** Redis 7.x (High-throughput circulation, loan queue worker)
* **Search Engine:** Meilisearch / OpenSearch for sub-10ms faceted OPAC discovery
* **Storage:** S3-Compatible Object Storage (AWS / MinIO / Local Intranet NAS) for full-text PDFs
* **External Scholarly Gateways:** OpenAlex API v2, Crossref REST, OAI-PMH 2.0 provider

---

### 2. Core API Routing Structure (`routes/api.php`)

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CatalogController;
use App\Http\Controllers\Api\V1\CirculationController;
use App\Http\Controllers\Api\V1\RepositoryController;
use App\Http\Controllers\Api\V1\StudyRoomController;
use App\Http\Controllers\Api\V1\AcquisitionsController;
use App\Http\Controllers\Api\V1\MarcController;
use App\Http\Controllers\Api\V1\ResearchGatewayController;
use App\Http\Controllers\Api\V1\PaymentWebhookController;
use App\Http\Controllers\Api\V1\AnalyticsController;

Route::prefix('v1')->group(function () {

    // -------------------------------------------------------------------------
    // PUBLIC / DISCOVERY OPAC (Unauthenticated)
    // -------------------------------------------------------------------------
    Route::prefix('opac')->group(function () {
        Route::get('/search', [CatalogController::class, 'search']);
        Route::get('/records/{id}', [CatalogController::class, 'show']);
        Route::get('/facets', [CatalogController::class, 'facets']);
        Route::get('/citations/{id}', [CatalogController::class, 'generateCitation']);
        Route::get('/theses', [RepositoryController::class, 'indexPublic']);
    });

    // -------------------------------------------------------------------------
    // AUTHENTICATION & DUAL-DOORWAY PORTAL
    // -------------------------------------------------------------------------
    Route::prefix('auth')->group(function () {
        Route::post('/student-pin', [AuthController::class, 'studentPinLogin']);
        Route::post('/staff-mfa', [AuthController::class, 'staffMfaLogin']);
        Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);
    });

    // -------------------------------------------------------------------------
    // STUDENT & SCHOLAR PORTAL (Role: Student / Researcher)
    // -------------------------------------------------------------------------
    Route::middleware(['auth:sanctum', 'role:student,lecturer,researcher'])->prefix('scholar')->group(function () {
        Route::get('/profile', [AuthController::class, 'profile']);
        Route::get('/loans', [CirculationController::class, 'myLoans']);
        Route::post('/loans/{id}/renew', [CirculationController::class, 'renewLoan']);
        Route::post('/theses/submit', [RepositoryController::class, 'submitThesis']);
        Route::post('/rooms/book', [StudyRoomController::class, 'bookRoom']);
        Route::post('/ai-assistant/query', [CatalogController::class, 'aiSemanticQuery']);
    });

    // -------------------------------------------------------------------------
    // STAFF & LIBRARIAN OPERATIONS HUB (Role: Librarian / Super Admin)
    // -------------------------------------------------------------------------
    Route::middleware(['auth:sanctum', 'role:librarian,super_admin,cataloguer'])->prefix('admin')->group(function () {
        
        // Circulation Desk
        Route::post('/circulation/checkout', [CirculationController::class, 'checkout']);
        Route::post('/circulation/checkin', [CirculationController::class, 'checkin']);
        Route::post('/circulation/override', [CirculationController::class, 'overrideLoan']);
        Route::get('/circulation/active-loans', [CirculationController::class, 'allLoans']);

        // MARC21 & Cataloguing Suite
        Route::post('/marc/records', [MarcController::class, 'store']);
        Route::get('/marc/records/{id}', [MarcController::class, 'showMarcXml']);
        Route::get('/marc/export-mrc', [MarcController::class, 'exportMrc']);

        // Global Research Ingestion
        Route::get('/research/openalex', [ResearchGatewayController::class, 'queryOpenAlex']);
        Route::get('/research/crossref', [ResearchGatewayController::class, 'queryCrossref']);
        Route::post('/research/import', [ResearchGatewayController::class, 'importToCatalog']);

        // Acquisitions & Serials
        Route::get('/acquisitions/orders', [AcquisitionsController::class, 'index']);
        Route::post('/acquisitions/orders', [AcquisitionsController::class, 'store']);
        Route::patch('/acquisitions/orders/{id}/approve', [AcquisitionsController::class, 'approve']);

        // Analytics & Audit Trail
        Route::get('/analytics/dashboard', [AnalyticsController::class, 'summary']);
        Route::get('/audit-logs', [AnalyticsController::class, 'auditLogs']);
    });

    // -------------------------------------------------------------------------
    // PAYMENT WEBHOOKS (Paystack, Flutterwave, Moniepoint)
    // -------------------------------------------------------------------------
    Route::post('/webhooks/paystack', [PaymentWebhookController::class, 'handlePaystack']);
    Route::post('/webhooks/flutterwave', [PaymentWebhookController::class, 'handleFlutterwave']);
});
```

---

### 3. Key Controller Implementations (Sample: `CirculationController.php`)

```php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ItemCopy;
use App\Models\Patron;
use App\Models\Loan;
use App\Services\AuditLogger;
use Carbon\Carbon;
use DB;

class CirculationController extends Controller
{
    public function checkout(Request $request)
    {
        $validated = $request->validate([
            'patron_matric' => 'required|string|exists:patrons,matric_or_staff_id',
            'barcode' => 'required|string|exists:item_copies,barcode',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $patron = Patron::where('matric_or_staff_id', $validated['patron_matric'])->firstOrFail();
            $copy = ItemCopy::where('barcode', $validated['barcode'])->lockForUpdate()->firstOrFail();

            if ($copy->status !== 'available') {
                return response()->json(['error' => 'Item is currently ' . $copy->status], 422);
            }

            // Check Patron Quota
            $activeLoansCount = Loan::where('patron_id', $patron->id)->where('status', 'active')->count();
            if ($activeLoansCount >= $patron->borrow_quota) {
                return response()->json(['error' => 'Patron has reached maximum borrowing limit (' . $patron->borrow_quota . ')'], 422);
            }

            // Create Loan
            $dueDate = Carbon::now()->addDays($patron->patron_type === 'lecturer' ? 30 : 14);
            $loan = Loan::create([
                'loan_reference' => 'LN-' . strtoupper(uniqid()),
                'item_copy_id' => $copy->id,
                'patron_id' => $patron->id,
                'issued_by_patron_id' => $request->user()->id,
                'checkout_date' => Carbon::today(),
                'due_date' => $dueDate,
                'status' => 'active'
            ]);

            $copy->update(['status' => 'on_loan']);

            AuditLogger::log('CIRC_CHECKOUT', "Issued barcode {$copy->barcode} to {$patron->matric_or_staff_id}");

            return response()->json(['message' => 'Checkout successful', 'loan' => $loan], 201);
        });
    }
}
```

---

### 4. OAI-PMH 2.0 Repository Provider Endpoint (`/oai-pmh`)
The institutional repository supports automated harvesting by national repositories, WorldCat, and Google Scholar using the OAI-PMH Dublin Core protocol schema (`Identify`, `ListRecords`, `GetRecord`, `ListIdentifiers`).
