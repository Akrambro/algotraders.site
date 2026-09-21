<?php
/**
 * AlgoTraders - InfinityFree MySQL Live Sync Bridge
 * 
 * Instructions:
 * 1. Upload this file to your InfinityFree account under `htdocs/sync.php`
 * 2. Because this script runs LOCALLY on InfinityFree's servers, it connects
 *    directly to localhost / sql313.infinityfree.com without remote firewall blocks!
 * 3. It can accept database commands or verify table health.
 */

header('Content-Type: application/json; charset=utf-8');

$db_host = 'localhost'; // Or 'sql313.infinityfree.com' inside InfinityFree
$db_user = 'if0_42963020';
$db_pass = 'RWq7haWqgPnbpp';
$db_name = 'if0_42963020_algotraders';

try {
    $pdo = new PDO("mysql:host={$db_host};dbname={$db_name};charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    // Try fallback to external hostname
    try {
        $pdo = new PDO("mysql:host=sql313.infinityfree.com;dbname={$db_name};charset=utf8mb4", $db_user, $db_pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);
    } catch (PDOException $e2) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Database connection failed: ' . $e2->getMessage()
        ]);
        exit;
    }
}

$action = $_GET['action'] ?? 'status';

if ($action === 'status') {
    $tables = [];
    $stmt = $pdo->query("SHOW TABLES");
    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
        $tables[] = $row[0];
    }

    $counts = [];
    foreach ($tables as $table) {
        $countStmt = $pdo->query("SELECT COUNT(*) FROM `{$table}`");
        $counts[$table] = (int)$countStmt->fetchColumn();
    }

    echo json_encode([
        'status' => 'connected',
        'database' => $db_name,
        'tables_count' => count($tables),
        'tables' => $counts,
        'timestamp' => date('c')
    ], JSON_PRETTY_PRINT);
    exit;
}

if ($action === 'execute' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawSql = file_get_contents('php://input');
    if (empty($rawSql)) {
        http_response_code(400);
        echo json_encode(['error' => 'No SQL script provided in POST body']);
        exit;
    }

    try {
        $pdo->exec($rawSql);
        echo json_encode([
            'status' => 'success',
            'message' => 'Executed SQL script successfully on InfinityFree MySQL database.'
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

echo json_encode(['error' => 'Invalid action']);
