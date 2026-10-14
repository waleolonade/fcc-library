<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\PatronController;
use App\Http\Controllers\LoanController;
use App\Http\Controllers\LibrarySystemController;
use App\Http\Controllers\LibraryApiController;
use App\Http\Controllers\ThesisController;
use App\Http\Controllers\ResourceController;
use App\Http\Controllers\CopiesBarcodeController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TroveController;
use App\Http\Controllers\GutenbergController;
use App\Http\Controllers\InternetArchiveController;
use App\Http\Controllers\GoogleBooksController;
use App\Http\Controllers\OverlayController;
use App\Http\Controllers\OpenAlexController;
use App\Http\Controllers\Api\FineController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\AuthorController;
use App\Http\Controllers\Api\RecommendationController;
use App\Http\Controllers\Api\LmsApiController;
use App\Http\Controllers\Api\SimpleLibApiController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\PolicyController;

// Institutional Courses & Curriculum Syllabus API (Fetched from database)
Route::get('/courses', [CourseController::class, 'index']);
Route::get('/courses/{code}', [CourseController::class, 'show']);
Route::post('/courses', [CourseController::class, 'store']);

// 00. Thetechguy44 Library Management System API Gateway
Route::get('/books',      [LmsApiController::class, 'index']);
Route::get('/books/{id}', [LmsApiController::class, 'show']);

Route::prefix('thetechguy44')->group(function () {
    Route::get('/books',      [LmsApiController::class, 'index']);
    Route::get('/search',     [LmsApiController::class, 'search']);
    Route::get('/books/{id}', [LmsApiController::class, 'show']);
    Route::get('/categories', [LmsApiController::class, 'categories']);
    Route::get('/stats',      [LmsApiController::class, 'stats']);
});

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

// 0e. OpenAlex Official Academic Graph API Integration
Route::prefix('openalex')->group(function () {
    Route::get('/works',             [OpenAlexController::class, 'works']);
    Route::get('/works/{id}',        [OpenAlexController::class, 'show']);
    Route::get('/aggregate',         [OpenAlexController::class, 'aggregate']);
    Route::get('/authors',           [OpenAlexController::class, 'authors']);
    Route::get('/sources',           [OpenAlexController::class, 'sources']);
    Route::get('/institutions',       [OpenAlexController::class, 'institutions']);
    Route::get('/topics',            [OpenAlexController::class, 'topics']);
    Route::get('/publishers',        [OpenAlexController::class, 'publishers']);
    Route::get('/funders',           [OpenAlexController::class, 'funders']);
    Route::get('/resolve',           [OpenAlexController::class, 'resolve']);
    Route::get('/saved',             [OpenAlexController::class, 'savedWorks']);
    Route::post('/save',             [OpenAlexController::class, 'saveWork']);
    Route::delete('/saved/{id}',     [OpenAlexController::class, 'removeSavedWork']);
    Route::get('/rate-limit',        [OpenAlexController::class, 'rateLimit']);

    // OpenAlex Query Language (OQL) & Query Translation APIs
    Route::match(['get', 'post'], '/oql', [OpenAlexController::class, 'executeOql']);
    Route::match(['get', 'post'], '/execute', [OpenAlexController::class, 'executeOql']);
    Route::get('/query/oql/{query}', [OpenAlexController::class, 'translateOql'])->where('query', '.*');
    Route::get('/query/oxurl/{query}', [OpenAlexController::class, 'translateOxurl'])->where('query', '.*');
    Route::get('/query/oqo/{query}', [OpenAlexController::class, 'translateOqo'])->where('query', '.*');
    Route::post('/query',            [OpenAlexController::class, 'translateQuery']);
    Route::get('/properties/{entity?}', [OpenAlexController::class, 'properties']);
    Route::get('/validate',          [OpenAlexController::class, 'validateOql']);
    Route::get('/parse-context',     [OpenAlexController::class, 'parseContext']);

    // Special-Purpose Endpoints
    Route::get('/autocomplete/{entity}', [OpenAlexController::class, 'autocomplete']);
    Route::match(['get', 'post'], '/text', [OpenAlexController::class, 'tagText']);

    // Component & Aboutness Endpoints
    Route::get('/awards/{id?}',         fn(\Illuminate\Http\Request $req, ?string $id = null) => app(\App\Http\Controllers\OpenAlexController::class)->entity($req, 'awards', $id))->where('id', '.*');
    Route::get('/locations/{id?}',      fn(\Illuminate\Http\Request $req, ?string $id = null) => app(\App\Http\Controllers\OpenAlexController::class)->entity($req, 'locations', $id))->where('id', '.*');
    Route::get('/subfields/{id?}',      fn(\Illuminate\Http\Request $req, ?string $id = null) => app(\App\Http\Controllers\OpenAlexController::class)->entity($req, 'subfields', $id))->where('id', '.*');
    Route::get('/fields/{id?}',         fn(\Illuminate\Http\Request $req, ?string $id = null) => app(\App\Http\Controllers\OpenAlexController::class)->entity($req, 'fields', $id))->where('id', '.*');
    Route::get('/domains/{id?}',        fn(\Illuminate\Http\Request $req, ?string $id = null) => app(\App\Http\Controllers\OpenAlexController::class)->entity($req, 'domains', $id))->where('id', '.*');
    Route::get('/keywords/{id?}',       fn(\Illuminate\Http\Request $req, ?string $id = null) => app(\App\Http\Controllers\OpenAlexController::class)->entity($req, 'keywords', $id))->where('id', '.*');
    Route::get('/sdgs/{id?}',           fn(\Illuminate\Http\Request $req, ?string $id = null) => app(\App\Http\Controllers\OpenAlexController::class)->entity($req, 'sdgs', $id))->where('id', '.*');
    Route::get('/study-designs/{id?}',  fn(\Illuminate\Http\Request $req, ?string $id = null) => app(\App\Http\Controllers\OpenAlexController::class)->entity($req, 'study-designs', $id))->where('id', '.*');
    Route::get('/countries/{id?}',      fn(\Illuminate\Http\Request $req, ?string $id = null) => app(\App\Http\Controllers\OpenAlexController::class)->entity($req, 'countries', $id))->where('id', '.*');
    Route::get('/languages/{id?}',      fn(\Illuminate\Http\Request $req, ?string $id = null) => app(\App\Http\Controllers\OpenAlexController::class)->entity($req, 'languages', $id))->where('id', '.*');
    Route::get('/work-types/{id?}',     fn(\Illuminate\Http\Request $req, ?string $id = null) => app(\App\Http\Controllers\OpenAlexController::class)->entity($req, 'work-types', $id))->where('id', '.*');
    Route::get('/source-types/{id?}',   fn(\Illuminate\Http\Request $req, ?string $id = null) => app(\App\Http\Controllers\OpenAlexController::class)->entity($req, 'source-types', $id))->where('id', '.*');
    Route::get('/institution-types/{id?}', fn(\Illuminate\Http\Request $req, ?string $id = null) => app(\App\Http\Controllers\OpenAlexController::class)->entity($req, 'institution-types', $id))->where('id', '.*');
    Route::get('/continents/{id?}',     fn(\Illuminate\Http\Request $req, ?string $id = null) => app(\App\Http\Controllers\OpenAlexController::class)->entity($req, 'continents', $id))->where('id', '.*');
    Route::get('/licenses/{id?}',       fn(\Illuminate\Http\Request $req, ?string $id = null) => app(\App\Http\Controllers\OpenAlexController::class)->entity($req, 'licenses', $id))->where('id', '.*');
    Route::get('/indexes/{id?}',        fn(\Illuminate\Http\Request $req, ?string $id = null) => app(\App\Http\Controllers\OpenAlexController::class)->entity($req, 'indexes', $id))->where('id', '.*');
    Route::get('/source-lists/{id?}',   fn(\Illuminate\Http\Request $req, ?string $id = null) => app(\App\Http\Controllers\OpenAlexController::class)->entity($req, 'source-lists', $id))->where('id', '.*');
    Route::get('/collections/{id?}',    fn(\Illuminate\Http\Request $req, ?string $id = null) => app(\App\Http\Controllers\OpenAlexController::class)->entity($req, 'collections', $id))->where('id', '.*');
    Route::get('/saved-searches/{id?}', fn(\Illuminate\Http\Request $req, ?string $id = null) => app(\App\Http\Controllers\OpenAlexController::class)->entity($req, 'saved-searches', $id))->where('id', '.*');

    // Universal Entity & Catalog Route (Proxy & Cache Any OpenAlex Endpoint)
    Route::get('/entity/{endpoint}/{id?}', [OpenAlexController::class, 'entity'])->where('id', '.*');
    Route::get('/catalog/{endpoint}/{id?}', [OpenAlexController::class, 'entity'])->where('id', '.*');
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
    Route::get('/qr-session', [AuthController::class, 'createQrSession']);
    Route::get('/qr-session-status', [AuthController::class, 'checkQrSession']);
    Route::post('/qr-session-claim', [AuthController::class, 'claimQrSession']);

    // Dedicated Cross-Device Phone QR Login (Phone-Number Matching)
    Route::post('/qr-login/create', [AuthController::class, 'createQrLogin']);
    Route::get('/qr-login/status/{id?}', [AuthController::class, 'getQrLoginStatus']);
    Route::get('/qr-login/phone/details', [AuthController::class, 'getPhoneChallengeDetails']);
    Route::post('/qr-login/phone/verify-and-approve', [AuthController::class, 'phoneVerifyAndApprove']);
    Route::post('/qr-login/phone/send-otp', [AuthController::class, 'sendPhoneOtp']);
    Route::post('/qr-login/phone/verify-otp', [AuthController::class, 'verifyPhoneOtp']);
    Route::post('/qr-login/phone/app-session', [AuthController::class, 'phoneAppSession']);
    Route::post('/qr-login/phone/approve', [AuthController::class, 'phoneApprove']);
    Route::post('/qr-login/phone/deny', [AuthController::class, 'phoneDeny']);
    Route::post('/qr-login/consume', [AuthController::class, 'consumeQrLogin']);
});
Route::post('/hod/login', [AuthController::class, 'login']);


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

// 5b. Institutional Policies & Role-Based Access Control (RBAC) API
Route::get('/policies', [PolicyController::class, 'getPolicies']);
Route::post('/policies/tier', [PolicyController::class, 'updateTierPolicy']);
Route::post('/policies/fines', [PolicyController::class, 'updateFineRules']);
Route::get('/rbac/directory', [PolicyController::class, 'getRbacDirectory']);
Route::post('/rbac/users', [PolicyController::class, 'createStaffUser']);
Route::put('/rbac/users/{id}/role', [PolicyController::class, 'updateUserRole'])->where('id', '.*');
Route::patch('/rbac/users/{id}/role', [PolicyController::class, 'updateUserRole'])->where('id', '.*');

// 6. Backward Compatibility Catalog API
Route::get('/catalog', [CatalogController::class, 'index']);
Route::get('/catalog/lookup-isbn', [CatalogController::class, 'lookupIsbn']);
Route::get('/catalog/{id}/file', [CatalogController::class, 'file']);
Route::get('/catalog/{id}', [CatalogController::class, 'show']);
Route::get('/books/{id}/file', [CatalogController::class, 'file']);
Route::post('/catalog/check-duplicate', [CatalogController::class, 'checkDuplicate']);
Route::post('/catalog', [CatalogController::class, 'store']);
Route::delete('/catalog/{id}', [CatalogController::class, 'destroy']);
Route::get('/favorites', [CatalogController::class, 'getFavorites']);
Route::post('/favorites/toggle', [CatalogController::class, 'toggleFavorite']);


// 7. Patrons API
Route::get('/patrons', [PatronController::class, 'index']);
Route::post('/patrons/bulk', [PatronController::class, 'bulkStore']);
Route::get('/patrons/{id}', [PatronController::class, 'show'])->where('id', '.*');
Route::post('/patrons/verify-pin', [PatronController::class, 'verifyPin']);
Route::post('/patrons/auth', [PatronController::class, 'verifyPin']);
Route::post('/patrons', [PatronController::class, 'store']);
Route::put('/patrons/{id}', [PatronController::class, 'update'])->where('id', '.*');
Route::patch('/patrons/{id}', [PatronController::class, 'update'])->where('id', '.*');
Route::post('/patrons/{id}/update', [PatronController::class, 'update'])->where('id', '.*');
Route::delete('/patrons/{id}', [PatronController::class, 'destroy'])->where('id', '.*');
Route::post('/patrons/{id}/delete', [PatronController::class, 'destroy'])->where('id', '.*');
Route::post('/patrons/{id}/clearance', [PatronController::class, 'updateClearance'])->where('id', '.*');
Route::put('/patrons/{id}/clearance', [PatronController::class, 'updateClearance'])->where('id', '.*');
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
Route::get('/theses', [ThesisController::class, 'index']);
Route::post('/theses', [ThesisController::class, 'store']);
Route::get('/theses/{id}', [ThesisController::class, 'show']);
Route::get('/theses/{id}/file', [ThesisController::class, 'file']);
Route::post('/theses/{id}/status', [ThesisController::class, 'updateStatus']);
Route::put('/theses/{id}/status', [ThesisController::class, 'updateStatus']);
Route::delete('/theses/{id}', [ThesisController::class, 'destroy']);

// 9b. Course Reserves Desk API (HOD & Stacks)
Route::get('/course-reserves', [\App\Http\Controllers\Api\CourseReserveController::class, 'index']);
Route::post('/course-reserves', [\App\Http\Controllers\Api\CourseReserveController::class, 'store']);
Route::delete('/course-reserves/{id}', [\App\Http\Controllers\Api\CourseReserveController::class, 'destroy']);

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
Route::post('/departments', [\App\Http\Controllers\DepartmentUploadController::class, 'storeDepartment']);
Route::put('/departments/{id}', [\App\Http\Controllers\DepartmentUploadController::class, 'updateDepartment']);
Route::delete('/departments/{id}', [\App\Http\Controllers\DepartmentUploadController::class, 'deleteDepartment']);
Route::get('/department-uploads', [\App\Http\Controllers\DepartmentUploadController::class, 'index']);
Route::post('/department-uploads', [\App\Http\Controllers\DepartmentUploadController::class, 'store']);
Route::put('/department-uploads/{id}', [\App\Http\Controllers\DepartmentUploadController::class, 'updateUpload']);
Route::post('/department-uploads/{id}/update', [\App\Http\Controllers\DepartmentUploadController::class, 'updateUpload']);
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

// 16. BassemGhoniem SimpleLib REST API Gateway
Route::prefix('simplelib')->group(function () {
    // Books endpoints with HATEOAS & full CRUD
    Route::get('/books', [SimpleLibApiController::class, 'index']);
    Route::post('/books', [SimpleLibApiController::class, 'store']);
    Route::delete('/books', [SimpleLibApiController::class, 'destroyAll']);
    Route::get('/books/recent', [SimpleLibApiController::class, 'recent']);
    Route::get('/books/{id}', [SimpleLibApiController::class, 'show']);
    Route::put('/books/{id}', [SimpleLibApiController::class, 'update']);
    Route::patch('/books/{id}', [SimpleLibApiController::class, 'patch']);
    Route::delete('/books/{id}', [SimpleLibApiController::class, 'destroy']);

    // Authors endpoints
    Route::get('/authors', [SimpleLibApiController::class, 'authorsIndex']);
    Route::post('/authors', [SimpleLibApiController::class, 'authorStore']);
    Route::get('/authors/{id}', [SimpleLibApiController::class, 'authorShow']);
    Route::put('/authors/{id}', [SimpleLibApiController::class, 'authorUpdate']);
    Route::patch('/authors/{id}', [SimpleLibApiController::class, 'authorPatch']);
    Route::delete('/authors/{id}', [SimpleLibApiController::class, 'authorDestroy']);

    // System Telemetry & Seeder
    Route::get('/stats', [SimpleLibApiController::class, 'stats']);
    Route::post('/seed', [SimpleLibApiController::class, 'seed']);

    // Passport/JWT User Simulation
    Route::post('/users/register', [SimpleLibApiController::class, 'register']);
    Route::post('/users/login', [SimpleLibApiController::class, 'login']);
    Route::get('/users', [SimpleLibApiController::class, 'users']);
});

