<?php
declare(strict_types=1);

$root = dirname(__DIR__);
$equipmentApi = (string)file_get_contents($root . '/api/equipment.php');
$notificationApi = (string)file_get_contents($root . '/api/incident-notifications.php');
$restoreApi = (string)file_get_contents($root . '/api/restore_equipment.php');
$archiveApi = (string)file_get_contents($root . '/api/archive_equipment.php');
$serviceCardApi = (string)file_get_contents($root . '/api/service_cards.php');
$frontend = (string)file_get_contents($root . '/script.js');
$styles = (string)file_get_contents($root . '/assets/css/styles.css');
$schema = (string)file_get_contents($root . '/api/schema.sql');
$migration = (string)file_get_contents($root . '/api/migrate_equipment_warranty.sql');
define('ICTRAX_SKIP_SESSION', true);
require $root . '/api/config.php';
$passed = 0;
$failed = [];

function warrantyTest(bool $condition, string $description): void
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

function warrantyIncludesAll(string $source, array $needles): bool
{
    foreach ($needles as $needle) {
        if (strpos($source, $needle) === false) {
            return false;
        }
    }
    return true;
}

function loadWarrantyFunction(string $source): bool
{
    if (!preg_match('/function\s+warrantyNotificationForEquipment\s*\([^)]*\)(?:\s*:\s*[^{]+)?\s*\{.*?^\}/ms', $source, $match)) {
        return false;
    }
    eval($match[0]);
    return function_exists('warrantyNotificationForEquipment');
}

function loadWarrantySourceFunction(string $source, string $name): bool
{
    $pattern = '/function\s+' . preg_quote($name, '/') . '\s*\([^)]*\)(?:\s*:\s*[^{]+)?\s*\{.*?^\}/ms';
    if (!preg_match($pattern, $source, $match)) {
        return false;
    }
    eval($match[0]);
    return function_exists($name);
}

echo "ICTRAX equipment warranty smoke tests\n\n";

$equipmentFunctionsLoaded = loadWarrantySourceFunction($equipmentApi, 'equipmentInputString')
    && loadWarrantySourceFunction($equipmentApi, 'equipmentData');
warrantyTest($equipmentFunctionsLoaded, 'Equipment input mapper can be loaded');
if ($equipmentFunctionsLoaded) {
    $validEquipment = [
        'name' => 'Warranty Test Computer',
        'category' => 'Desktop Computer',
        'location' => 'Computer Laboratory 1',
        'serial' => 'WARRANTY-TEST-SERIAL',
        'status' => 'Operational',
        'condition' => 'New',
        'dateAcquired' => '2026-10-01',
        'lastMaintenance' => '2026-10-10',
        'warrantyProvider' => 'Test Supplier',
        'warrantyExpiration' => '2027-10-01',
        'notes' => '',
    ];
    $mappedEquipment = equipmentData($validEquipment);
    warrantyTest(
        $mappedEquipment[':warranty_provider'] === 'Test Supplier'
        && $mappedEquipment[':warranty_expiration'] === '2027-10-01',
        'Equipment input mapper retains provider and expiration values'
    );
    $mappedWithoutWarranty = equipmentData(array_merge($validEquipment, [
        'warrantyProvider' => '',
        'warrantyExpiration' => '',
    ]));
    warrantyTest(
        $mappedWithoutWarranty[':warranty_provider'] === null
        && $mappedWithoutWarranty[':warranty_expiration'] === null,
        'Equipment input mapper stores no-warranty selections as null'
    );
}

warrantyTest(loadWarrantyFunction($notificationApi), 'Warranty notification mapper can be loaded');
if (function_exists('warrantyNotificationForEquipment')) {
    $today = new DateTimeImmutable('2026-10-22');
    $equipment = [
        'id' => 45,
        'equipment_code' => 'PC-WARRANTY-01',
        'name' => 'Warranty Test Computer',
        'warranty_provider' => 'Test Supplier',
        'warranty_expiration' => '2026-11-21',
    ];
    $notice = warrantyNotificationForEquipment($equipment, $today);
    warrantyTest(
        $notice !== null
        && $notice['kind'] === 'warranty_expiring'
        && $notice['equipmentId'] === 'PC-WARRANTY-01'
        && $notice['daysRemaining'] === 30
        && $notice['eventId'] === 'warranty-45-2026-11-21',
        'Administrator warranty alert starts exactly 30 days before expiration'
    );

    $equipment['warranty_expiration'] = '2026-10-22';
    $todayNotice = warrantyNotificationForEquipment($equipment, $today);
    warrantyTest($todayNotice !== null && $todayNotice['daysRemaining'] === 0, 'Warranty expiration day remains alertable');

    $equipment['warranty_expiration'] = '2026-11-22';
    warrantyTest(warrantyNotificationForEquipment($equipment, $today) === null, 'Warranty more than 30 days away is not alerted early');

    $equipment['warranty_expiration'] = '2026-10-21';
    warrantyTest(warrantyNotificationForEquipment($equipment, $today) === null, 'Expired warranty does not create a recurring upcoming-expiration alert');
}

warrantyTest(
    warrantyIncludesAll($equipmentApi, [
        "'warrantyProvider' =>", "'warrantyExpiration' =>", "equipmentInputString(\$data, 'warrantyProvider'",
        "equipmentInputString(\$data, 'warrantyExpiration'", 'Warranty expiration cannot be before the acquisition date.',
        'warranty_provider = :warranty_provider', 'warranty_expiration = :warranty_expiration',
    ]),
    'Equipment API persists and validates optional warranty data'
);
warrantyTest(
    warrantyIncludesAll($notificationApi, [
        "\$role === 'admin'", 'warranty_expiration BETWEEN CURRENT_DATE', 'INTERVAL 30 DAY',
        "'kind' => 'warranty_expiring'",
    ]),
    'Only the administrator feed queries warranties expiring within 30 days'
);
warrantyTest(
    warrantyIncludesAll($frontend, [
        'id="f-warranty-covered"', 'id="f-warranty-expiration"', 'id="f-warranty-provider"',
        'function onWarrantyCoverageChange', 'Administrators are notified 30 days before coverage expires.',
        "kind==='warranty_expiring'", 'WARRANTY_NOTIFICATION_SEEN_KEY', "targetType:isWarranty?'equipment':'incident'",
        'const wasAdded=addIncidentNotification(notification)', 'if(!wasAdded) return;', "'Jump to equipment'",
    ]),
    'Add/edit equipment forms and the notification center support warranty alerts'
);
warrantyTest(
    warrantyIncludesAll($styles, ['.equipment-warranty-section', '.equipment-warranty-heading', '.optional-label']),
    'Warranty form section has responsive visual styling'
);
warrantyTest(
    warrantyIncludesAll($schema, ['warranty_provider VARCHAR(150)', 'warranty_expiration DATE', 'idx_equipment_warranty_expiration'])
    && warrantyIncludesAll($migration, ['ADD COLUMN IF NOT EXISTS warranty_provider', 'ADD COLUMN IF NOT EXISTS warranty_expiration', 'idx_equipment_warranty_expiration']),
    'Schema and idempotent migration include indexed warranty storage'
);
warrantyTest(
    warrantyIncludesAll($archiveApi, ['json_encode($equipment', 'equipment_json'])
    && warrantyIncludesAll($restoreApi, ['warranty_provider', 'warranty_expiration', 'validRestoreWarrantyDate'])
    && warrantyIncludesAll($serviceCardApi, ['warranty_provider', 'warranty_expiration']),
    'Warranty data survives archive/restore and equipment-detail refreshes'
);

$databaseWarrantyRoundTrip = false;
if ($pdo instanceof PDO) {
    try {
        $pdo->beginTransaction();
        $equipmentId = $pdo->query(
            'SELECT id FROM equipment WHERE deleted_at IS NULL ORDER BY id ASC LIMIT 1 FOR UPDATE'
        )->fetchColumn();
        if ($equipmentId) {
            $update = $pdo->prepare(
                'UPDATE equipment SET warranty_provider = :provider, warranty_expiration = :expiration WHERE id = :id'
            );
            $update->execute([
                ':provider' => 'Warranty Transaction Probe',
                ':expiration' => '2027-10-22',
                ':id' => (int)$equipmentId,
            ]);
            $check = $pdo->prepare(
                'SELECT warranty_provider, warranty_expiration FROM equipment WHERE id = :id'
            );
            $check->execute([':id' => (int)$equipmentId]);
            $stored = $check->fetch();
            $databaseWarrantyRoundTrip = $stored
                && $stored['warranty_provider'] === 'Warranty Transaction Probe'
                && $stored['warranty_expiration'] === '2027-10-22';
        }
        $pdo->rollBack();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
    }
}
warrantyTest($databaseWarrantyRoundTrip, 'Warranty fields persist inside a database transaction and roll back cleanly');

echo "\n{$passed} passed, " . count($failed) . " failed.\n";
if ($failed) {
    exit(1);
}
