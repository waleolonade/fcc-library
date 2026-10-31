<?php

namespace App\Services;

use PDO;
use Throwable;

class DatabaseService
{
    private static ?PDO $pdo = null;
    private static bool $attempted = false;

    /**
     * Get configured PDO connection for gsashtub_brainfeels_library
     */
    public static function getPdo(): ?PDO
    {
        if (self::$pdo !== null) {
            return self::$pdo;
        }

        if (self::$attempted) {
            return null;
        }
        self::$attempted = true;

        @ini_set('default_socket_timeout', '2');

        $configuredHost = env('DB_MYSQL_HOST', env('DB_HOST', 'localhost'));
        $port = env('DB_MYSQL_PORT', env('DB_PORT', '3306'));
        $db   = env('DB_MYSQL_DATABASE', env('DB_DATABASE', 'gsashtub_brainfeels_library'));
        $user = env('DB_MYSQL_USER', 'gsashtub_brainfeels_library');
        $pass = env('DB_MYSQL_PASSWORD', 'brainfeels_library');

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_SILENT,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT            => 2,
            PDO::MYSQL_ATTR_MULTI_STATEMENTS => true
        ];

        // On Linux / cPanel, 'localhost' connects via local unix socket immediately (0ms).
        // Try localhost first, then configured host, then 127.0.0.1
        $candidateHosts = array_unique(array_filter([
            'localhost',
            $configuredHost,
            '127.0.0.1'
        ]));

        foreach ($candidateHosts as $h) {
            try {
                $dsn = "mysql:host={$h};dbname={$db}";
                if ($h !== 'localhost') {
                    $dsn .= ";port={$port}";
                }
                self::$pdo = new PDO($dsn, $user, $pass, $options);
                if (self::$pdo) {
                    return self::$pdo;
                }
            } catch (Throwable $e) {}
        }

        // Fallback for local dev root connection
        foreach (['127.0.0.1', 'localhost'] as $h) {
            try {
                $dsn = "mysql:host={$h};dbname={$db}";
                self::$pdo = new PDO($dsn, "root", "", $options);
                if (self::$pdo) {
                    return self::$pdo;
                }
            } catch (Throwable $e) {}
        }

        return null;
    }
}
