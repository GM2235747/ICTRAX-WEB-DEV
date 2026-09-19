<?php
require __DIR__ . '/config.php';

header('Content-Type: application/json');
session_start();

if (($_SESSION['role'] ?? null) !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Administrator access is required.']);
    exit;
}

$limit = min(max((int)($_GET['limit'] ?? 100), 1), 500);
$stmt = $pdo->prepare(
    'SELECT audit_logs.id, audit_logs.action, audit_logs.entity_type, audit_logs.entity_id,
            audit_logs.details, audit_logs.created_at, users.username
     FROM audit_logs
     LEFT JOIN users ON users.id = audit_logs.user_id
     ORDER BY audit_logs.id DESC
     LIMIT ' . $limit
);
$stmt->execute();
$rows = $stmt->fetchAll();

foreach ($rows as &$row) {
    $row['details'] = $row['details'] ? json_decode($row['details'], true) : null;
}

 echo json_encode(['success' => true, 'data' => $rows]);
