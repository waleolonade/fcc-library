<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/qr-approve', function (\Illuminate\Http\Request $request) {
    $qs = $request->getQueryString();
    return redirect('/#/qr-approve' . ($qs ? '?' . $qs : ''));
});

Route::get('/mobile-pass', function (\Illuminate\Http\Request $request) {
    $qs = $request->getQueryString();
    return redirect('/#/mobile-pass' . ($qs ? '?' . $qs : ''));
});

Route::get('/qr-login', function (\Illuminate\Http\Request $request) {
    $qs = $request->getQueryString();
    return redirect('/#/qr-approve' . ($qs ? '?' . $qs : ''));
});
