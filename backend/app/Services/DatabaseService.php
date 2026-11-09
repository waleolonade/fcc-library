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

        @ini_set('default_socket_timeout', '1');

        $configuredHost = env('DB_MYSQL_HOST', env('DB_HOST', '127.0.0.1'));
        $port = (int) env('DB_MYSQL_PORT', env('DB_PORT', 3306));
        $db   = env('DB_MYSQL_DATABASE', env('DB_DATABASE', 'gsashtub_brainfeels_library'));
        $user = env('DB_MYSQL_USER', 'gsashtub_brainfeels_library');
        $pass = env('DB_MYSQL_PASSWORD', 'brainfeels_library');

        $isWindows = (PHP_OS_FAMILY === 'Windows' || DIRECTORY_SEPARATOR === '\\');

        // Fast TCP port pre-check on local Windows/TCP hosts so offline MySQL fails in <15ms instead of 8700ms
        $checkHost = ($configuredHost === 'localhost' && $isWindows) ? '127.0.0.1' : $configuredHost;
        if (in_array($checkHost, ['127.0.0.1', 'localhost'], true)) {
            $fp = @fsockopen('127.0.0.1', $port, $errno, $errstr, 0.08);
            if (!$fp) {
                return null;
            }
            @fclose($fp);
        }

        $options = [
            PDO::ATTR_ERRMODE                  => PDO::ERRMODE_SILENT,
            PDO::ATTR_DEFAULT_FETCH_MODE       => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT                  => 1,
            PDO::MYSQL_ATTR_MULTI_STATEMENTS   => true,
        ];

        // On Linux / cPanel, 'localhost' connects via local unix socket immediately (0ms).
        // On Windows, '127.0.0.1' avoids the 2000ms IPv6 ::1 lookup delay.
        $candidateHosts = $isWindows
            ? array_unique(array_filter(['127.0.0.1', $configuredHost]))
            : array_unique(array_filter(['localhost', $configuredHost, '127.0.0.1']));

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
        $rootHost = $isWindows ? '127.0.0.1' : 'localhost';
        try {
            $dsn = "mysql:host={$rootHost};port={$port};dbname={$db}";
            self::$pdo = new PDO($dsn, "root", "", $options);
            if (self::$pdo) {
                return self::$pdo;
            }
        } catch (Throwable $e) {}

        return null;
    }
}
