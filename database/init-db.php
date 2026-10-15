<?php
/**
 * FCC Smart Library - Database Initializer (init-db)
 * Target Database: gsashtub_brainfeels_library
 * Standalone CLI & API script
 */

$host = getenv('DB_HOST') ?: '127.0.0.1';
$port = getenv('DB_PORT') ?: '3306';
$user = getenv('DB_USERNAME') ?: 'root';
$pass = getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : '';
$dbName = getenv('DB_DATABASE') ?: (getenv('DB_MYSQL_DATABASE') ?: 'gsashtub_brainfeels_library');

echo "============================================================\n";
echo "FCC SMART LIBRARY - DATABASE INITIALIZER (init-db)\n";
echo "Target Database: {$dbName}\n";
echo "Host: {$host}:{$port} | User: {$user}\n";
echo "Time: " . date('Y-m-d H:i:s') . "\n";
echo "============================================================\n\n";

try {
    // 1. Connect without db to create database if not exists
    $pdo = new PDO("mysql:host={$host};port={$port}", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "  [OK] Database `{$dbName}` verified / created.\n";

    // 2. Connect to target database
    $pdo->exec("USE `{$dbName}`");
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");

    // 3. Read and execute database/brainfeels_library_mysql.sql or init-db.sql if available
    $sqlFiles = [
        __DIR__ . '/../update_cpanel_users_and_covers.sql'
    ];

    foreach ($sqlFiles as $file) {
        if (file_exists($file)) {
            echo "  [EXEC] Executing: " . basename($file) . " ...\n";
            $sqlContent = file_get_contents($file);
            // Replace any old db references with current dbName
            $sqlContent = str_replace('`brainfeels_library`', "`{$dbName}`", $sqlContent);
            $sqlContent = str_replace('`gsashtub_brainfeels_library`', "`{$dbName}`", $sqlContent);

            // Execute multi-query statements
            $pdo->exec($sqlContent);
            echo "  [OK] Applied " . basename($file) . "\n";
        }
    }

    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

    // 4. Verification and table stats
    echo "\n------------------------------------------------------------\n";
    echo "DATABASE TABLE VERIFICATION:\n";
    echo "------------------------------------------------------------\n";

    $keyTables = ['users', 'roles', 'permissions', 'role_permissions', 'user_roles', 'departments', 'department_uploads', 'books', 'patrons', 'loans', 'library_apis'];
    foreach ($keyTables as $t) {
        try {
            $cnt = $pdo->query("SELECT count(*) FROM `{$t}`")->fetchColumn();
            echo sprintf("  %-25s : %d records\n", $t, $cnt);
        } catch (\Exception $e) {
            echo sprintf("  %-25s : TABLE MISSING (%s)\n", $t, $e->getMessage());
        }
    }

    echo "\n------------------------------------------------------------\n";
    echo "USER ROLES ACTIVE LINKING:\n";
    echo "------------------------------------------------------------\n";
    $urStmt = $pdo->query("
        SELECT u.id, u.name, u.email, u.role, r.name as role_name, r.display_name
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        ORDER BY u.id ASC
    ");
    while ($row = $urStmt->fetch(PDO::FETCH_ASSOC)) {
        echo sprintf("  User #%-2d | %-20s | Role: %-10s | user_roles link: %s\n", 
            $row['id'], 
            substr($row['name'], 0, 20), 
            $row['role'], 
            $row['role_name'] ?: 'None'
        );
    }

    echo "\n============================================================\n";
    echo "INITIALIZATION COMPLETED SUCCESSFULLY INTO `{$dbName}`!\n";
    echo "============================================================\n";

} catch (Exception $e) {
    echo "\n[ERROR]: " . $e->getMessage() . "\n";
    exit(1);
}
