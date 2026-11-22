<?php
declare(strict_types=1);

$root = dirname(__DIR__);
$endpoint = (string)file_get_contents($root . '/api/incident-notifications.php');
$frontend = (string)file_get_contents($root . '/script.js');
$styles = (string)file_get_contents($root . '/assets/css/styles.css');
$googleLogin = (string)file_get_contents($root . '/api/google-login.php');
$passed = 0;
$failed = [];

function notificationTest(bool $condition, string $description): void
{
    global $passed, $failed;
    if ($condition) {
        $passed++;
        echo "[PASS] {$description}\n";
        return;
    }
    $failed[] = $description;
    echo "[FAIL] {$description}\n";
}

function loadNotificationFunction(string $source, string $name): bool
{
    $pattern = '/function\s+' . preg_quote($name, '/') . '\s*\([^)]*\)(?:\s*:\s*[^{]+)?\s*\{.*?^\}/ms';
    if (!preg_match($pattern, $source, $match)) {
        return false;
    }
    eval($match[0]);
    return function_exists($name);
}

echo "ICTRAX two-way incident notification smoke tests\n\n";

notificationTest(loadNotificationFunction($endpoint, 'incidentNotificationDetails'), 'Audit detail decoder can be loaded');
notificationTest(loadNotificationFunction($endpoint, 'incidentNotificationForRole'), 'Role notification mapper can be loaded');

if (function_exists('incidentNotificationForRole')) {
    $create = [
        'id' => '301',
        'user_id' => '12',
        'action' => 'create',
        'entity_id' => 'INC-0022',
        'created_at' => '2026-10-22 21:42:00',
        'details' => json_encode(['current' => [
            'reported_by_user_id' => 12,
            'reported_by_name' => 'Faculty Test',
            'status' => 'Pending',
        ]]),
    ];
    $adminNotice = incidentNotificationForRole($create, 'admin', 1);
    notificationTest(
        $adminNotice !== null
        && $adminNotice['kind'] === 'new_report'
        && $adminNotice['incidentId'] === 'INC-0022'
        && $adminNotice['createdAt'] === '2026-10-22T21:42:00',
        'Administrator receives a new-report notification'
    );
    notificationTest(
        incidentNotificationForRole($create, 'faculty', 12) === null,
        'Faculty does not receive an administrator new-report notification'
    );
    notificationTest(
        incidentNotificationForRole($create, 'admin', 12) === null,
        'The reporter does not receive a duplicate new-report notification'
    );

    $statusUpdate = [
        'id' => '302',
        'action' => 'update',
        'entity_id' => 'INC-0022',
        'details' => json_encode([
            'previous' => ['reported_by_user_id' => 12, 'status' => 'In Progress'],
            'current' => ['reported_by_user_id' => 12, 'status' => 'Resolved'],
        ]),
    ];
    $facultyNotice = incidentNotificationForRole($statusUpdate, 'faculty', 12);
    notificationTest(
        $facultyNotice !== null
        && $facultyNotice['kind'] === 'status_change'
        && $facultyNotice['status'] === 'Resolved',
        'Faculty receives every status transition, not only Pending transitions'
    );
    notificationTest(
        incidentNotificationForRole($statusUpdate, 'faculty', 99) === null,
        'Faculty cannot receive another reporter’s notification'
    );

    $priorityOnly = $statusUpdate;
    $priorityOnly['details'] = json_encode([
        'previous' => ['reported_by_user_id' => 12, 'status' => 'In Progress', 'priority' => 'Medium'],
        'current' => ['reported_by_user_id' => 12, 'status' => 'In Progress', 'priority' => 'High'],
    ]);
    notificationTest(
        incidentNotificationForRole($priorityOnly, 'faculty', 12) === null,
        'Priority-only edits do not create misleading status notifications'
    );

    $verification = [
        'id' => '303',
        'user_id' => '12',
        'action' => 'verify',
        'entity_id' => 'INC-0022',
        'created_at' => '2026-10-22 22:05:00',
        'details' => json_encode([
            'previous' => [
                'reported_by_user_id' => 12,
                'status' => 'Resolved',
                'repair_verification_status' => 'Awaiting Verification',
            ],
            'current' => [
                'reported_by_user_id' => 12,
                'status' => 'Resolved',
                'repair_verification_status' => 'Verified',
            ],
        ]),
    ];
    $verificationNotice = incidentNotificationForRole($verification, 'admin', 1);
    notificationTest(
        $verificationNotice !== null
        && $verificationNotice['kind'] === 'repair_verified'
        && $verificationNotice['verificationStatus'] === 'Verified',
        'Administrator receives the submitter repair-verification result'
    );
    $verification['details'] = json_encode([
        'previous' => ['reported_by_user_id' => 12, 'status' => 'Resolved'],
        'current' => [
            'reported_by_user_id' => 12,
            'status' => 'In Progress',
            'repair_verification_status' => 'Not Accomplished',
        ],
    ]);
    notificationTest(
        incidentNotificationForRole($verification, 'admin', 1)['kind'] === 'repair_disputed',
        'Administrator is notified when the submitter reopens an unaccomplished repair'
    );
}

notificationTest(
    strpos($endpoint, "requireAuthenticatedUser(['admin', 'faculty'])") !== false
    && strpos($endpoint, "id > :after_id AND id <= :latest_id") !== false
    && strpos($endpoint, "_incident_notification_cursor") !== false
    && strpos($endpoint, "CURRENT_TIMESTAMP - INTERVAL 1 DAY") !== false,
    'Notification feed is authenticated and bootstraps recent signed-out activity'
);
notificationTest(
    strpos($googleLogin, "_incident_notification_cursor") !== false
    && strpos($googleLogin, "MAX(id), 0") !== false,
    'Notification baseline is established at sign-in before a page can miss an event'
);
notificationTest(
    strpos($frontend, "INCIDENT_NOTIFICATION_ENDPOINT = 'incident-notifications.php'") !== false
    && strpos($frontend, 'INCIDENT_NOTIFICATION_CURSOR_PREFIX') !== false
    && strpos($frontend, 'localStorage.getItem(key)') !== false
    && strpos($frontend, 'localStorage.setItem(key,String(cursor))') !== false
    && strpos($frontend, '${INCIDENT_NOTIFICATION_ENDPOINT}?bootstrap=1') !== false
    && strpos($frontend, 'setTimeout(') !== false,
    'Frontend keeps a per-user cursor across role changes and uses non-overlapping polling'
);
notificationTest(
    strpos($frontend, 'New report received from') !== false
    && strpos($frontend, 'status changed to') !== false
    && strpos($frontend, 'was verified as accomplished') !== false
    && strpos($frontend, 'was reopened by the submitter') !== false
    && strpos($frontend, "document.addEventListener('visibilitychange'") !== false
    && strpos($frontend, "'info', 6500") !== false,
    'Both notification messages remain visible when a role tab is in the background'
);
notificationTest(
    strpos($frontend, "bell:'<svg") !== false
    && strpos($frontend, 'function renderNotificationControl') !== false
    && strpos($frontend, 'function viewNotificationDetails') !== false
    && strpos($frontend, 'function jumpToNotification') !== false
    && strpos($frontend, 'function clearNotifications') !== false,
    'Notification bell exposes the list, detail, jump, and clear controls'
);
notificationTest(
    strpos($frontend, 'NOTIFICATIONS_STORAGE_KEY') !== false
    && strpos($frontend, 'event-${String(event.eventId)}') !== false
    && strpos($frontend, 'notification.reportId') !== false,
    'Notification history is isolated per user and deduplicated by audit event'
);
notificationTest(
    strpos($styles, '.notification-panel') !== false
    && strpos($styles, '.notification-item.unread') !== false
    && strpos($styles, '.notification-count') !== false,
    'Notification panel, unread state, and counter are styled'
);

$notificationPages = [
    'index.html', 'dashboard.html', 'inventory.html', 'browse-equipment.html',
    'report-issue.html', 'my-reports.html', 'incidents.html', 'audit.html',
    'risk.html', 'completed-incidents.html',
];
$cacheVersionApplied = true;
foreach ($notificationPages as $page) {
    $markup = (string)file_get_contents($root . '/' . $page);
    $cacheVersionApplied = $cacheVersionApplied
        && strpos($markup, 'script.js?v=20261110-equipment-no-icon-v1') !== false
        && strpos($markup, 'styles.css?v=20261110-equipment-no-icon-v1') !== false;
}
notificationTest($cacheVersionApplied, 'All application pages load the notification center script and styles versions');
notificationTest(
    !file_exists($root . '/reports.html')
    && strpos($frontend, "reports:'reports.html'") === false
    && strpos($frontend, "id:'reports'") === false
    && strpos($frontend, 'renderReportsView') === false,
    'Redundant Reports & Export page, route, navigation, and view are removed'
);

echo "\n{$passed} passed, " . count($failed) . " failed.\n";
if ($failed) {
    exit(1);
}

exit(0);
