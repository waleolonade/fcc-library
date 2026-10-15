<?php

namespace App\Services;

use PDO;
use Throwable;

class DatabaseService
{
    private static ?PDO $pdo = null;

    /**
     * Get configured PDO connection for gsashtub_brainfeels_library
     */
    public static function getPdo(): PDO
    {
        if (self::$pdo !== null) {
            return self::$pdo;
        }

        $host = env('DB_MYSQL_HOST', env('DB_HOST', '127.0.0.1'));
        $port = env('DB_MYSQL_PORT', env('DB_PORT', '3306'));
        $db   = env('DB_MYSQL_DATABASE', env('DB_DATABASE', 'gsashtub_brainfeels_library'));
        $user = env('DB_MYSQL_USER', 'gsashtub_brainfeels_library');
        $pass = env('DB_MYSQL_PASSWORD', 'brainfeels_library');

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_SILENT,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT            => 3,
            PDO::MYSQL_ATTR_MULTI_STATEMENTS => true
        ];

        // 1. Try with configured credentials (gsashtub_brainfeels_library)
        try {
            self::$pdo = new PDO("mysql:host={$host};port={$port};dbname={$db}", $user, $pass, $options);
            return self::$pdo;
        } catch (Throwable $e1) {
            // 2. Fallback to local root connection if testing on local dev machine
            try {
                self::$pdo = new PDO("mysql:host={$host};port={$port};dbname={$db}", "root", "", $options);
                return self::$pdo;
            } catch (Throwable $e2) {
                // Throw first error for cPanel diagnostics
                throw $e1;
            }
        }
    }
}
