<?php
// Logout must remain available when the database is degraded so the browser
// can still revoke its server session and cookie.
define('ICTRAX_ALLOW_DB_FAILURE', true);
require __DIR__ . '/config.php';

requireRequestMethod('POST');

$body = null;
$contentType = strtolower(trim(explode(';', (string)($_SERVER['CONTENT_TYPE'] ?? ''))[0]));
if ($contentType === 'application/json' || substr($contentType, -5) === '+json') {
    $body = readJsonBody(4096);
}

$userId = currentUserId();
if ($userId !== null) {
    requireCsrfToken($body);

    if ($pdo instanceof PDO) {
        try {
            writeAudit($pdo, 'logout', 'user', (string)$userId, ['method' => 'google']);
        } catch (Throwable $e) {
            // Session termination has priority over audit availability.
            error_log('ICTRAX logout audit write failed.');
        }
    }
}

destroyCurrentSession();
jsonResponse(['success' => true, 'authenticated' => false]);
