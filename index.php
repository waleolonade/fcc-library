<?php
// =========================================================================
// Production Web Gateway Router for fccibadanlibrary.com.ng
// Handles direct PHP serving for Frontend and Laravel API
// =========================================================================

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

// 1. Route API requests directly to Laravel Backend Front Controller
if (str_starts_with($uri, '/api')) {
    require_once __DIR__ . '/backend/public/index.php';
    exit;
}

// 2. Route Student Portal
if (str_starts_with($uri, '/student') && file_exists(__DIR__ . '/dist/student.html')) {
    include __DIR__ . '/dist/student.html';
    exit;
}

// 3. Route Admin Library Portal
if (str_starts_with($uri, '/admin') && file_exists(__DIR__ . '/dist/admin.html')) {
    include __DIR__ . '/dist/admin.html';
    exit;
}

// 4. Default: Serve Primary Landing Page / OPAC Discovery
if (file_exists(__DIR__ . '/dist/index.html')) {
    include __DIR__ . '/dist/index.html';
    exit;
}

header("Location: dist/index.html");
exit;
