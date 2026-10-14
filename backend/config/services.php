<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Resource Overlay (federated API layer)
    |--------------------------------------------------------------------------
    |
    | The overlay fetches resources live from external APIs whenever a student
    | asks for something. All keys are optional: sources without a key are
    | either used anonymously (Google Books) or skipped (Trove). When a Gemini
    | key is set, student requests are planned by Gemini; otherwise the
    | built-in rule-based planner is used.
    |
    */
    'overlay' => [
        'contact_email'    => env('OVERLAY_CONTACT_EMAIL', 'librarian@fccibadanlibrary.com.ng'),
        'cache_minutes'    => (int) env('OVERLAY_CACHE_MINUTES', 15),
        'timeout'          => (int) env('OVERLAY_TIMEOUT', 9),
        'google_books_key' => env('GOOGLE_BOOKS_API_KEY'),
        'trove_key'        => env('TROVE_API_KEY'),
        'gemini_key'       => env('GEMINI_API_KEY'),
        'gemini_model'     => env('GEMINI_MODEL', 'gemini-2.0-flash'),
    ],

];
