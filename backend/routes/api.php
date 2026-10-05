<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\PatronController;
use App\Http\Controllers\LoanController;
use App\Http\Controllers\LibrarySystemController;
use App\Http\Controllers\LibraryApiController;
use App\Http\Controllers\ResourceController;
use App\Http\Controllers\CopiesBarcodeController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TroveController;
use App\Http\Controllers\GutenbergController;
use App\Http\Controllers\InternetArchiveController;
use App\Http\Controllers\GoogleBooksController;
use App\Http\Controllers\OverlayController;
use App\Http\Controllers\Api\FineController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\AuthorController;
use App\Http\Controllers\Api\RecommendationController;
use App\Http\Controllers\Api\LmsApiController;

// 00. LMS Academic Library API Gateway (Dedicated First-Class Engine)
Route::prefix('lms')->group(function () {
    Route::get('/books',      [LmsApiController::class, 'index']);
    Route::get('/search',     [LmsApiController::class, 'search']);
    Route::get('/books/{id}', [LmsApiController::class, 'show']);
    Route::get('/categories', [LmsApiController::class, 'categories']);
    Route::get('/stats',      [LmsApiController::class, 'stats']);
});

// 00b. Federated API Overlay (Unified On-Demand Resource Engine)
Route::prefix('overlay')->group(function () {
    Route::get('/sources',      [OverlayController::class, 'sources']);
    Route::post('/ask',         [OverlayController::class, 'ask']);
    Route::get('/search',       [OverlayController::class, 'search']);
    Route::get('/detail',       [OverlayController::class, 'detail']);
    Route::post('/test-source', [OverlayController::class, 'testSource']);
});

// 0. Trove API Proxy
Route::get('/trove/search', [TroveController::class, 'search']);

// 0b. Gutendex (Project Gutenberg) API Proxy
Route::prefix('gutenberg')->group(function () {
    Route::get('/books',      [GutenbergController::class, 'books']);
    Route::get('/books/{id}', [GutenbergController::class, 'book'])->where('id', '[0-9]+');
});

// 0c. Internet Archive Official API Integration
Route::prefix('internet-archive')->group(function () {
    Route::get('/search',                [InternetArchiveController::class, 'search']);
    Route::get('/metadata/{identifier}', [InternetArchiveController::class, 'metadata']);
});
Route::prefix('external/internet-archive')->group(function () {
    Route::get('/search',                [InternetArchiveController::class, 'search']);
    Route::get('/metadata/{identifier}', [InternetArchiveController::class, 'metadata']);
});

// 0d. Google Books Official API & Embedded Viewer Integration (Recommended)
Route::prefix('google-books')->group(function () {
    Route::get('/search',                [GoogleBooksController::class, 'search']);
    Route::get('/volume/{volumeId}',     [GoogleBooksController::class, 'volume']);
    Route::get('/recommendations',       [GoogleBooksController::class, 'recommendations']);
    Route::get('/saved',                 [GoogleBooksController::class, 'savedBooks']);
    Route::post('/save',                 [GoogleBooksController::class, 'saveBook']);
});
Route::prefix('external/google-books')->group(function () {
    Route::get('/search',                [GoogleBooksController::class, 'search']);
    Route::get('/volume/{volumeId}',     [GoogleBooksController::class, 'volume']);
    Route::get('/recommendations',       [GoogleBooksController::class, 'recommendations']);
    Route::get('/saved',                 [GoogleBooksController::class, 'savedBooks']);
    Route::post('/save',                 [GoogleBooksController::class, 'saveBook']);
});

// 1. Telemetry & Health Check
Route::get('/health', [LibrarySystemController::class, 'health']);

// 2. Authentication API (Prompt 36 & Module 6)
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    Route::get('/me', [AuthController::class, 'me']);
});

// 3. Normalized Resources & Search Engine API (Prompt 33, 34, 36)
// Provides server-side pagination (20, 50, 100), full-text search, and multi-field filtering
Route::get('/resources', [ResourceController::class, 'index']);
Route::get('/search', [ResourceController::class, 'search']);
Route::get('/resources/{id}', [ResourceController::class, 'show']);
Route::post('/resources', [ResourceController::class, 'store']);
Route::put('/resources/{id}', [ResourceController::class, 'update']);
Route::delete('/resources/{id}', [ResourceController::class, 'destroy']);

// 4. Copies & Barcode Physical Inventory API (Prompt 31, 32)
Route::get('/copies', [CopiesBarcodeController::class, 'index']);
Route::get('/copies/barcode/{barcode}', [CopiesBarcodeController::class, 'lookupBarcode']);
Route::post('/copies', [CopiesBarcodeController::class, 'store']);

// 5. Configurable Library Settings & Multi-Library Branches (Prompt 48, 49)
Route::get('/settings', [SettingsController::class, 'index']);
Route::post('/settings', [SettingsController::class, 'update']);
Route::get('/branches', [SettingsController::class, 'getBranches']);

// 6. Backward Compatibility Catalog API
Route::get('/catalog', [CatalogController::class, 'index']);
Route::get('/catalog/lookup-isbn', [CatalogController::class, 'lookupIsbn']);
Route::get('/catalog/{id}', [CatalogController::class, 'show']);
Route::post('/catalog/check-duplicate', [CatalogController::class, 'checkDuplicate']);
Route::post('/catalog', [CatalogController::class, 'store']);
Route::delete('/catalog/{id}', [CatalogController::class, 'destroy']);
Route::get('/favorites', [CatalogController::class, 'getFavorites']);
Route::post('/favorites/toggle', [CatalogController::class, 'toggleFavorite']);


// 7. Patrons API
Route::get('/patrons', [PatronController::class, 'index']);
Route::get('/patrons/{id}', [PatronController::class, 'show']);
Route::post('/patrons/verify-pin', [PatronController::class, 'verifyPin']);
Route::post('/patrons', [PatronController::class, 'store']);
Route::get('/users', [PatronController::class, 'index']);
Route::get('/users/{id}', [PatronController::class, 'show']);

// 8. Circulation & Book Loans API (Prompt 36)
Route::get('/loans', [LoanController::class, 'index']);
Route::post('/loans', [LoanController::class, 'store']);
Route::post('/loans/{id}/return', [LoanController::class, 'returnBook']);
Route::put('/loans/{id}/return', [LoanController::class, 'returnBook']);
Route::post('/loans/{id}/renew', [LoanController::class, 'renew']);
Route::put('/loans/{id}/renew', [LoanController::class, 'renew']);

// 9. Theses & Institutional Repository API
Route::get('/theses', [LibrarySystemController::class, 'getTheses']);
Route::post('/theses', [LibrarySystemController::class, 'storeThesis']);

// 10. Consortia, Serials, Study Rooms & Facilities API
Route::get('/partner-libraries', [LibrarySystemController::class, 'getPartnerLibrariesFull']);
Route::get('/external-links', [LibrarySystemController::class, 'getExternalLinks']);
Route::get('/acquisitions', [LibrarySystemController::class, 'getAcquisitions']);
Route::post('/acquisitions', [LibrarySystemController::class, 'storeAcquisition']);
Route::get('/serials', [LibrarySystemController::class, 'getSerials']);
Route::get('/study-rooms', [LibrarySystemController::class, 'getStudyRooms']);
Route::get('/reservations', [LibrarySystemController::class, 'getReservations']);
Route::post('/reservations', [LibrarySystemController::class, 'getReservations']);
Route::get('/audit-logs', [LibrarySystemController::class, 'getAuditLogs']);
Route::get('/shelves', [LibrarySystemController::class, 'getShelves']);
Route::get('/analytics', [LibrarySystemController::class, 'getAnalytics']);

// 11. AI Smart Reference Desk API
Route::post('/ai-chat', [LibrarySystemController::class, 'aiChat']);

// 12. Dynamic World Library APIs & Custom Admin API Ingestion
Route::get('/library-apis', [LibraryApiController::class, 'index']);
Route::post('/library-apis', [LibraryApiController::class, 'store']);
Route::put('/library-apis/{id}', [LibraryApiController::class, 'update']);
Route::delete('/library-apis/{id}', [LibraryApiController::class, 'destroy']);
Route::get('/library-apis/{id}/test', [LibraryApiController::class, 'test']);
Route::get('/library-apis/search', [LibraryApiController::class, 'searchFederated']);
Route::get('/admin/apis', [LibraryApiController::class, 'index']);
Route::post('/admin/apis', [LibraryApiController::class, 'store']);

// 13. Department Management & HOD Staging Pipeline API
Route::get('/departments', [\App\Http\Controllers\DepartmentUploadController::class, 'getDepartments']);
Route::get('/department-uploads', [\App\Http\Controllers\DepartmentUploadController::class, 'index']);
Route::post('/department-uploads', [\App\Http\Controllers\DepartmentUploadController::class, 'store']);
Route::post('/department-uploads/{id}/approve', [\App\Http\Controllers\DepartmentUploadController::class, 'approve']);
Route::post('/department-uploads/{id}/reject', [\App\Http\Controllers\DepartmentUploadController::class, 'reject']);
Route::post('/hod/login', [\App\Http\Controllers\DepartmentUploadController::class, 'hodLogin']);

// 14. Inter-Role Tri-Party Institutional Communication & Dispatch API
// Connects HODs, Central Library Admin, and Students/Scholars
Route::get('/communications', [\App\Http\Controllers\CommunicationController::class, 'index']);
Route::post('/communications', [\App\Http\Controllers\CommunicationController::class, 'store']);
Route::post('/communications/{threadId}/reply', [\App\Http\Controllers\CommunicationController::class, 'reply']);
Route::put('/communications/{id}/status', [\App\Http\Controllers\CommunicationController::class, 'updateStatus']);

// 15. Integrated Library Management System API (Fines, Reservations, Reviews, Authors, Recommendations)
// Fines & Penalties Management
Route::prefix('fines')->group(function () {
    Route::get('/', [FineController::class, 'index']);
    Route::get('/{id}', [FineController::class, 'show']);
    Route::post('/calculate/{loanId}', [FineController::class, 'calculateFine']);
    Route::patch('/{id}/pay', [FineController::class, 'payFine']);
    Route::post('/{id}/pay', [FineController::class, 'payFine']);
});

// Book Reservations
Route::prefix('book-reservations')->group(function () {
    Route::get('/', [ReservationController::class, 'index']);
    Route::get('/{id}', [ReservationController::class, 'show']);
    Route::post('/', [ReservationController::class, 'store']);
    Route::patch('/{id}', [ReservationController::class, 'update']);
    Route::delete('/{id}', [ReservationController::class, 'destroy']);
});

// Book Reviews & Star Ratings
Route::prefix('books/{bookId}/reviews')->group(function () {
    Route::get('/', [ReviewController::class, 'index']);
    Route::post('/', [ReviewController::class, 'store']);
});
Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);

// Authors Authority Directory
Route::prefix('authors')->group(function () {
    Route::get('/', [AuthorController::class, 'index']);
    Route::get('/{id}', [AuthorController::class, 'show']);
    Route::post('/', [AuthorController::class, 'store']);
    Route::put('/{id}', [AuthorController::class, 'update']);
    Route::delete('/{id}', [AuthorController::class, 'destroy']);
});

// Algorithmic Dynamic Book Recommendations
Route::get('/recommendations', [RecommendationController::class, 'getRecommendations']);

