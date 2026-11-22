<?php
declare(strict_types=1);

/**
 * Read-only database compatibility checks for the current ICTRAX APIs.
 * Run from the project directory with C:\xampp\php\php.exe.
 */

define('ICTRAX_SKIP_SESSION', true);
require dirname(__DIR__) . '/api/config.php';
require_once dirname(__DIR__) . '/api/google-auth-config.php';
require_once dirname(__DIR__) . '/api/incident-repair-form.php';

if (!$pdo instanceof PDO) {
    fwrite(STDERR, "[FAIL] Database connection is unavailable.\n");
    exit(1);
}

$passed = 0;
$failed = [];

function preflightResult(bool $condition, string $description): void
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

function databaseColumns(PDO $pdo, string $table): array
{
    $stmt = $pdo->prepare(
        'SELECT COLUMN_NAME FROM information_schema.columns '
        . 'WHERE table_schema = DATABASE() AND table_name = :table'
    );
    $stmt->execute([':table' => $table]);
    return array_map('strtolower', array_column($stmt->fetchAll(), 'COLUMN_NAME'));
}

function hasColumns(PDO $pdo, string $table, array $required): bool
{
    $available = databaseColumns($pdo, $table);
    foreach ($required as $column) {
        if (!in_array(strtolower($column), $available, true)) {
            return false;
        }
    }
    return true;
}

function hasIndex(PDO $pdo, string $table, array $columns, bool $mustBeUnique = false): bool
{
    $stmt = $pdo->prepare(
        'SELECT INDEX_NAME, NON_UNIQUE, COLUMN_NAME, SEQ_IN_INDEX '
        . 'FROM information_schema.statistics '
        . 'WHERE table_schema = DATABASE() AND table_name = :table '
        . 'ORDER BY INDEX_NAME, SEQ_IN_INDEX'
    );
    $stmt->execute([':table' => $table]);
    $indexes = [];
    foreach ($stmt->fetchAll() as $row) {
        $name = (string)$row['INDEX_NAME'];
        $indexes[$name]['unique'] = (int)$row['NON_UNIQUE'] === 0;
        $indexes[$name]['columns'][] = strtolower((string)$row['COLUMN_NAME']);
    }

    $expected = array_map('strtolower', $columns);
    foreach ($indexes as $index) {
        if ($index['columns'] === $expected && (!$mustBeUnique || $index['unique'])) {
            return true;
        }
    }
    return false;
}

echo "ICTRAX database preflight\n\n";

preflightResult(hasColumns($pdo, 'users', [
    'id', 'email', 'google_sub', 'role', 'active', 'deleted_at',
]), 'Users support Google identity, roles, and revocation');
preflightResult(hasColumns($pdo, 'equipment', [
    'id', 'equipment_code', 'category', 'location', 'serial_number', 'status',
    'condition_status', 'date_acquired', 'last_maintenance', 'warranty_provider',
    'warranty_expiration', 'deleted_at',
]), 'Equipment columns include secured warranty tracking');
preflightResult(
    hasColumns($pdo, 'equipment_photos', [
        'id', 'equipment_id', 'original_name', 'stored_name', 'mime_type',
        'file_size', 'created_by_user_id', 'created_at',
    ]) && hasIndex($pdo, 'equipment_photos', ['equipment_id']),
    'Equipment note-photo storage is available and indexed'
);
$incidentRepairStorageAvailable = hasColumns($pdo, 'incidents', [
    'id', 'equipment_id', 'reported_by_user_id', 'status', 'priority',
    'description', 'repair_form_json', 'resolved_date',
    'repair_verification_status', 'repair_verification_notes', 'repair_verified_at',
    'deleted_at',
]);
preflightResult($incidentRepairStorageAvailable, 'Incident columns include structured repair requests and submitter verification');
$repairJsonIsDatabaseValidated = false;
if ($incidentRepairStorageAvailable) {
    $repairColumn = $pdo->query(
        "SELECT DATA_TYPE FROM information_schema.columns "
        . "WHERE table_schema = DATABASE() AND table_name = 'incidents' "
        . "AND column_name = 'repair_form_json' LIMIT 1"
    )->fetchColumn();
    $repairJsonIsDatabaseValidated = strtolower((string)$repairColumn) === 'json';
    if (!$repairJsonIsDatabaseValidated) {
        $checkStatement = $pdo->prepare(
            'SELECT CHECK_CLAUSE FROM information_schema.check_constraints '
            . 'WHERE constraint_schema = DATABASE() AND table_name = :table'
        );
        $checkStatement->execute([':table' => 'incidents']);
        foreach ($checkStatement->fetchAll() as $check) {
            $clause = strtolower((string)($check['CHECK_CLAUSE'] ?? ''));
            if (str_contains($clause, 'json_valid') && str_contains($clause, 'repair_form_json')) {
                $repairJsonIsDatabaseValidated = true;
                break;
            }
        }
    }
}
preflightResult($repairJsonIsDatabaseValidated, 'Request-for-repair JSON validity is enforced by the database');
preflightResult(hasColumns($pdo, 'service_cards', [
    'equipment_id', 'office', 'model', 'unit_cost', 'service_rows',
]), 'Service-card persistence is available');
preflightResult(hasColumns($pdo, 'equipment_archive', [
    'id', 'equipment_code', 'archive_reason', 'service_card_json',
    'equipment_json', 'incidents_json',
]), 'Archive snapshots preserve equipment, service cards, and incidents');
preflightResult(hasColumns($pdo, 'audit_logs', [
    'user_id', 'action', 'entity_type', 'entity_id', 'details', 'created_at',
]), 'Audit storage is available');
preflightResult(hasColumns($pdo, 'equipment_categories', [
    'name', 'tag_id_mode', 'tag_prefix', 'tag_sequence', 'deleted_at',
]), 'Category tag settings are available');
preflightResult(hasColumns($pdo, 'equipment_locations', [
    'name', 'deleted_at',
]), 'Location catalog is available');

$activeRepairFormsSynchronized = $incidentRepairStorageAvailable;
if ($incidentRepairStorageAvailable) {
    $repairIncidents = $pdo->query(
        'SELECT id, category, description, repair_form_json FROM incidents '
        . "WHERE repair_form_json IS NOT NULL OR LEFT(description, " . strlen(INCIDENT_REPAIR_FORM_PREFIX) . ") = "
        . $pdo->quote(INCIDENT_REPAIR_FORM_PREFIX)
    )->fetchAll();
    foreach ($repairIncidents as $repairIncident) {
        $form = incidentRepairFormFromRow($repairIncident);
        if (!is_string($repairIncident['repair_form_json'])
            || trim($repairIncident['repair_form_json']) === ''
            || $form === null
            || !incidentRepairStoredFormIsValid($form)
            || $repairIncident['category'] !== incidentRepairCategory($form)
            || $repairIncident['description'] !== incidentRepairSummary($form)
            || str_starts_with($repairIncident['description'], INCIDENT_REPAIR_FORM_PREFIX)) {
            $activeRepairFormsSynchronized = false;
            break;
        }
    }
}
preflightResult(
    $activeRepairFormsSynchronized,
    'Active request-for-repair rows keep form JSON, category, and description synchronized'
);

$archivedRepairFormsSynchronized = true;
$archiveIncidentRows = $pdo->query(
    'SELECT incidents_json FROM equipment_archive WHERE incidents_json IS NOT NULL'
)->fetchAll();
foreach ($archiveIncidentRows as $archiveIncidentRow) {
    $archivedIncidents = json_decode((string)$archiveIncidentRow['incidents_json'], true);
    if (!is_array($archivedIncidents)) {
        $archivedRepairFormsSynchronized = false;
        break;
    }
    foreach ($archivedIncidents as $archivedIncident) {
        if (!is_array($archivedIncident) || !incidentRepairRowContainsForm($archivedIncident)) {
            continue;
        }
        $form = incidentRepairFormFromRow($archivedIncident);
        if (!is_string($archivedIncident['repair_form_json'] ?? null)
            || trim($archivedIncident['repair_form_json']) === ''
            || $form === null
            || !incidentRepairStoredFormIsValid($form)
            || ($archivedIncident['category'] ?? null) !== incidentRepairCategory($form)
            || ($archivedIncident['description'] ?? null) !== incidentRepairSummary($form)) {
            $archivedRepairFormsSynchronized = false;
            break 2;
        }
    }
}
preflightResult(
    $archivedRepairFormsSynchronized,
    'Archived request-for-repair snapshots preserve synchronized structured form data'
);

$activeUsers = $pdo->query(
    'SELECT email, role FROM users WHERE active = 1 AND deleted_at IS NULL'
)->fetchAll();
$activePolicyValid = true;
foreach ($activeUsers as $activeUser) {
    if (!isGoogleEmailAuthorizedForRole((string)$activeUser['email'], (string)$activeUser['role'])) {
        $activePolicyValid = false;
        break;
    }
}
preflightResult($activePolicyValid, 'Every active account satisfies the Google role/email policy');
preflightResult(
    isGoogleEmailAuthorizedForRole('faculty.member@mls.ceu.edu.ph', 'faculty')
    && isGoogleEmailAuthorizedForRole('faculty.member@ceu.edu.ph', 'faculty')
    && !isGoogleEmailAuthorizedForRole('faculty.member@gmail.com', 'faculty')
    && !isGoogleEmailAuthorizedForRole('faculty.member@notceu.edu.ph', 'faculty'),
    'Faculty Google policy accepts both exact CEU domains and rejects lookalikes'
);

preflightResult(hasIndex($pdo, 'equipment', ['equipment_code'], true), 'Equipment tag IDs are unique');
preflightResult(hasIndex($pdo, 'equipment', ['serial_number', 'location'], true), 'Equipment serial/location pairs are unique');
preflightResult(hasIndex($pdo, 'equipment', ['status']), 'Equipment status queries are indexed');
preflightResult(hasIndex($pdo, 'equipment', ['location']), 'Equipment location queries are indexed');
preflightResult(hasIndex($pdo, 'equipment', ['warranty_expiration']), 'Upcoming equipment warranty queries are indexed');
preflightResult(hasIndex($pdo, 'incidents', ['status']), 'Incident status queries are indexed');
preflightResult(hasIndex($pdo, 'incidents', ['repair_verification_status']), 'Repair verification queries are indexed');
preflightResult(hasIndex($pdo, 'audit_logs', ['created_at']), 'Audit timeline queries are indexed');
preflightResult(hasIndex($pdo, 'equipment_archive', ['equipment_code']), 'Archive code queries are indexed');
preflightResult(hasIndex($pdo, 'equipment_archive', ['archived_date']), 'Archive date queries are indexed');

echo "\n{$passed} passed, " . count($failed) . " failed.\n";
if ($failed) {
    echo "Apply the documented migrations before testing the affected workflows.\n";
    exit(1);
}

exit(0);
