<?php
declare(strict_types=1);

// Background polling must not count as user activity for the idle timeout.
define('ICTRAX_PASSIVE_SESSION_REQUEST', true);
require __DIR__ . '/config.php';

header('Content-Type: application/json');

/** Decode an audit row without exposing its full details to the browser. */
function incidentNotificationDetails(mixed $details): array
{
    if (is_array($details)) {
        return $details;
    }
    if (!is_string($details) || $details === '') {
        return [];
    }
    $decoded = json_decode($details, true);
    return is_array($decoded) ? $decoded : [];
}

/** Convert one incident audit event into the minimal notification for a role. */
function incidentNotificationForRole(array $row, string $role, int $userId): ?array
{
    $details = incidentNotificationDetails($row['details'] ?? null);
    $current = is_array($details['current'] ?? null) ? $details['current'] : [];
    $previous = is_array($details['previous'] ?? null) ? $details['previous'] : [];
    $eventId = (string)($row['id'] ?? '');
    $incidentId = (string)($row['entity_id'] ?? '');
    $createdAt = str_replace(' ', 'T', trim((string)($row['created_at'] ?? '')));

    if ($role === 'admin'
        && ($row['action'] ?? '') === 'create'
        && (int)($row['user_id'] ?? 0) !== $userId) {
        return [
            'eventId' => $eventId,
            'kind' => 'new_report',
            'incidentId' => $incidentId,
            'reporterName' => trim((string)($current['reported_by_name'] ?? '')),
            'createdAt' => $createdAt,
        ];
    }

    $verificationStatus = trim((string)($current['repair_verification_status'] ?? ''));
    if ($role === 'admin'
        && ($row['action'] ?? '') === 'verify'
        && (int)($row['user_id'] ?? 0) !== $userId
        && in_array($verificationStatus, ['Verified', 'Not Accomplished'], true)) {
        return [
            'eventId' => $eventId,
            'kind' => $verificationStatus === 'Verified' ? 'repair_verified' : 'repair_disputed',
            'incidentId' => $incidentId,
            'verificationStatus' => $verificationStatus,
            'createdAt' => $createdAt,
        ];
    }

    $reporterId = (int)($current['reported_by_user_id'] ?? $previous['reported_by_user_id'] ?? 0);
    $previousStatus = trim((string)($previous['status'] ?? ''));
    $currentStatus = trim((string)($current['status'] ?? ''));
    if ($role === 'faculty'
        && ($row['action'] ?? '') === 'update'
        && $reporterId === $userId
        && $previousStatus !== ''
        && $currentStatus !== ''
        && $previousStatus !== $currentStatus) {
        return [
            'eventId' => $eventId,
            'kind' => 'status_change',
            'incidentId' => $incidentId,
            'status' => $currentStatus,
            'createdAt' => $createdAt,
        ];
    }

    return null;
}

/** Build one stable administrator alert for warranty coverage ending within 30 days. */
function warrantyNotificationForEquipment(array $row, ?DateTimeImmutable $today = null): ?array
{
    $expirationText = trim((string)($row['warranty_expiration'] ?? ''));
    $expiration = DateTimeImmutable::createFromFormat('!Y-m-d', $expirationText);
    if (!$expiration || $expiration->format('Y-m-d') !== $expirationText) {
        return null;
    }

    $referenceTime = $today ?? new DateTimeImmutable('now');
    $today = $referenceTime->setTime(0, 0);
    $daysRemaining = (int)$today->diff($expiration)->format('%r%a');
    if ($daysRemaining < 0 || $daysRemaining > 30) {
        return null;
    }

    $equipmentId = trim((string)($row['equipment_code'] ?? ''));
    $databaseId = (int)($row['id'] ?? 0);
    if ($equipmentId === '' || $databaseId < 1) {
        return null;
    }

    return [
        'eventId' => "warranty-{$databaseId}-{$expirationText}",
        'kind' => 'warranty_expiring',
        'equipmentId' => $equipmentId,
        'equipmentName' => trim((string)($row['name'] ?? '')),
        'warrantyProvider' => trim((string)($row['warranty_provider'] ?? '')),
        'warrantyExpiration' => $expirationText,
        'daysRemaining' => $daysRemaining,
        'createdAt' => $referenceTime->format(DATE_ATOM),
    ];
}

requireRequestMethod('GET');
$userId = requireAuthenticatedUser(['admin', 'faculty']);
$role = (string)($_SESSION['role'] ?? '');

$afterProvided = array_key_exists('after', $_GET);
$bootstrapProvided = array_key_exists('bootstrap', $_GET);
$bootstrapValue = $bootstrapProvided && is_scalar($_GET['bootstrap']) ? (string)$_GET['bootstrap'] : '';
if ($afterProvided && $bootstrapProvided) {
    jsonResponse(['success' => false, 'message' => 'Choose either a notification cursor or a bootstrap window.'], 400);
}
if ($bootstrapProvided && $bootstrapValue !== '1') {
    jsonResponse(['success' => false, 'message' => 'The notification bootstrap option is invalid.'], 400);
}
$after = 0;
if ($afterProvided) {
    $rawAfter = $_GET['after'];
    if (!is_scalar($rawAfter)
        || !preg_match('/^[0-9]{1,19}$/', (string)$rawAfter)
        || filter_var($rawAfter, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]) === false) {
        jsonResponse(['success' => false, 'message' => 'The notification cursor is invalid.'], 400);
    }
    $after = (int)$rawAfter;
} elseif (!$bootstrapProvided) {
    $sessionCursor = (string)($_SESSION['_incident_notification_cursor'] ?? '');
    if (preg_match('/^[0-9]{1,19}$/', $sessionCursor)
        && filter_var($sessionCursor, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]) !== false) {
        $after = (int)$sessionCursor;
    }
}

try {
    if ($bootstrapProvided) {
        // A new browser/user cursor receives only recent relevant activity.
        // This covers changes made while that role was signed out without
        // replaying the full audit history.
        $baselineStmt = $pdo->query(
            "SELECT COALESCE(MAX(id), 0)
             FROM audit_logs
             WHERE entity_type = 'incident'
               AND created_at < (CURRENT_TIMESTAMP - INTERVAL 1 DAY)"
        );
        $after = (int)($baselineStmt->fetchColumn() ?: 0);
    }

    // Sessions created before cursor support use their authentication time as
    // a one-time fallback, ensuring events that occurred after sign-in are not
    // silently treated as historical during the first poll.
    if (!$bootstrapProvided && !$afterProvided && !isset($_SESSION['_incident_notification_cursor'])) {
        $sessionStartedAt = max((int)($_SESSION['_created_at'] ?? time()), 0);
        $baselineStmt = $pdo->prepare(
            "SELECT COALESCE(MAX(id), 0)
             FROM audit_logs
             WHERE entity_type = 'incident' AND created_at < FROM_UNIXTIME(:session_started_at)"
        );
        $baselineStmt->bindValue(':session_started_at', $sessionStartedAt, PDO::PARAM_INT);
        $baselineStmt->execute();
        $after = (int)($baselineStmt->fetchColumn() ?: 0);
    }

    $latestCursor = (string)($pdo->query(
        "SELECT COALESCE(MAX(id), 0) FROM audit_logs WHERE entity_type = 'incident'"
    )->fetchColumn() ?: '0');

    $stmt = $pdo->prepare(
        "SELECT id, user_id, action, entity_id, details, created_at
         FROM audit_logs
         WHERE entity_type = 'incident' AND id > :after_id AND id <= :latest_id
         ORDER BY id ASC
         LIMIT 250"
    );
    $stmt->bindValue(':after_id', $after, PDO::PARAM_INT);
    $stmt->bindValue(':latest_id', (int)$latestCursor, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll();

    $notifications = [];
    foreach ($rows as $row) {
        $notification = incidentNotificationForRole($row, $role, $userId);
        if ($notification !== null) {
            $notifications[] = $notification;
        }
    }

    if ($role === 'admin') {
        $warrantyStmt = $pdo->query(
            "SELECT id, equipment_code, name, warranty_provider, warranty_expiration
             FROM equipment
             WHERE deleted_at IS NULL
               AND warranty_expiration BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY)
             ORDER BY warranty_expiration ASC, equipment_code ASC"
        );
        foreach ($warrantyStmt->fetchAll() as $equipmentRow) {
            $warrantyNotification = warrantyNotificationForEquipment($equipmentRow);
            if ($warrantyNotification !== null) {
                $notifications[] = $warrantyNotification;
            }
        }
    }

    $hasMore = count($rows) === 250 && (string)end($rows)['id'] !== $latestCursor;
    $nextCursor = $hasMore ? (string)end($rows)['id'] : $latestCursor;
    $_SESSION['_incident_notification_cursor'] = $nextCursor;
    jsonResponse([
        'success' => true,
        'cursor' => $nextCursor,
        'notifications' => $notifications,
        'hasMore' => $hasMore,
    ]);
} catch (Throwable $e) {
    error_log('Notification lookup failed: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Unable to load notifications.'], 500);
}
