<?php
require __DIR__ . '/config.php';

header('Content-Type: application/json');
requireRequestMethod('GET');
requireAuthenticatedUser(['admin']);

$requestedLimit = $_GET['limit'] ?? 100;
if (!is_scalar($requestedLimit) || filter_var($requestedLimit, FILTER_VALIDATE_INT) === false) {
    jsonResponse(['success' => false, 'message' => 'The limit must be a whole number.'], 400);
}
$limit = min(max((int)$requestedLimit, 1), 500);

try {
    $stmt = $pdo->prepare(
        'SELECT audit_logs.id, audit_logs.action, audit_logs.entity_type, audit_logs.entity_id,
                audit_logs.details, audit_logs.created_at, users.username
         FROM audit_logs
         LEFT JOIN users ON users.id = audit_logs.user_id
         ORDER BY audit_logs.id DESC
         LIMIT :limit'
    );
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll();

    foreach ($rows as &$row) {
        $row['details'] = $row['details'] ? json_decode($row['details'], true) : null;
    }
    unset($row);

    jsonResponse(['success' => true, 'data' => $rows]);
} catch (Throwable $e) {
    error_log('Audit log lookup failed: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Unable to load the audit log.'], 500);
}
