<?php
require __DIR__ . '/config.php';

header('Content-Type: application/json');
requireRequestMethod('GET');
requireAuthenticatedUser(['admin']);

try {
    $stmt = $pdo->query(
        "SELECT id, username, full_name AS name, email, role
         FROM users
         WHERE role = 'admin' AND active = 1 AND deleted_at IS NULL
         ORDER BY full_name, id"
    );
    jsonResponse($stmt->fetchAll());
} catch (Throwable $e) {
    error_log('Administrator list lookup failed: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Unable to load administrators.'], 500);
}
