<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

define('ICTRAX_SKIP_SESSION', true);
require __DIR__ . '/config.php';
require_once __DIR__ . '/incident-repair-form.php';

if (!$pdo instanceof PDO) {
    fwrite(STDERR, "Database connection is unavailable.\n");
    exit(1);
}

$apply = in_array('--apply', $argv, true);
$columnStatement = $pdo->prepare(
    "SELECT COUNT(*) FROM information_schema.columns "
    . "WHERE table_schema = DATABASE() AND table_name = 'incidents' AND column_name = 'repair_form_json'"
);
$columnStatement->execute();
$columnExists = (int)$columnStatement->fetchColumn() === 1;

$incidentSql = $columnExists
    ? 'SELECT id, category, description, repair_form_json, updated_at FROM incidents ORDER BY id'
    : 'SELECT id, category, description, NULL AS repair_form_json, updated_at FROM incidents ORDER BY id';
$incidents = $pdo->query($incidentSql)->fetchAll();
$activeUpdates = [];
foreach ($incidents as $incident) {
    if (!incidentRepairRowContainsForm($incident)) {
        continue;
    }
    $form = incidentRepairFormFromRow($incident);
    if ($form === null || !incidentRepairStoredFormIsValid($form)) {
        throw new UnexpectedValueException('Incident ' . $incident['id'] . ' contains an invalid repair form.');
    }
    $normalized = [
        'repair_form_json' => incidentRepairStorage($form),
        'category' => incidentRepairCategory($form),
        'description' => incidentRepairSummary($form),
    ];
    if ($incident['repair_form_json'] !== $normalized['repair_form_json']
        || $incident['category'] !== $normalized['category']
        || $incident['description'] !== $normalized['description']) {
        $activeUpdates[] = $normalized + [
            'id' => (int)$incident['id'],
            'updated_at' => $incident['updated_at'],
        ];
    }
}

$archiveRows = $pdo->query(
    'SELECT id, incidents_json FROM equipment_archive WHERE incidents_json IS NOT NULL ORDER BY id'
)->fetchAll();
$archiveUpdates = [];
foreach ($archiveRows as $archiveRow) {
    try {
        $archivedIncidents = json_decode((string)$archiveRow['incidents_json'], true, 64, JSON_THROW_ON_ERROR);
    } catch (JsonException $e) {
        throw new UnexpectedValueException('Archive ' . $archiveRow['id'] . ' contains invalid incident JSON.');
    }
    if (!is_array($archivedIncidents) || count($archivedIncidents) > 10000) {
        throw new UnexpectedValueException('Archive ' . $archiveRow['id'] . ' contains an invalid incident collection.');
    }
    $changed = false;
    foreach ($archivedIncidents as &$incident) {
        if (!is_array($incident) || !incidentRepairRowContainsForm($incident)) {
            continue;
        }
        $form = incidentRepairFormFromRow($incident);
        if ($form === null || !incidentRepairStoredFormIsValid($form)) {
            throw new UnexpectedValueException('Archive ' . $archiveRow['id'] . ' contains an invalid repair form.');
        }
        $json = incidentRepairStorage($form);
        $category = incidentRepairCategory($form);
        $description = incidentRepairSummary($form);
        if (($incident['repair_form_json'] ?? null) !== $json
            || ($incident['category'] ?? null) !== $category
            || ($incident['description'] ?? null) !== $description) {
            $incident['repair_form_json'] = $json;
            $incident['category'] = $category;
            $incident['description'] = $description;
            $changed = true;
        }
    }
    unset($incident);
    if ($changed) {
        $archiveUpdates[] = [
            'id' => (int)$archiveRow['id'],
            'incidents_json' => json_encode(
                $archivedIncidents,
                JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR
            ),
        ];
    }
}

echo 'Request-for-repair database synchronization' . PHP_EOL;
echo '  Structured column: ' . ($columnExists ? 'present' : 'missing') . PHP_EOL;
echo '  Active incidents to synchronize: ' . count($activeUpdates) . PHP_EOL;
echo '  Archive records to synchronize: ' . count($archiveUpdates) . PHP_EOL;

if (!$apply) {
    echo 'Dry run only. Re-run with --apply after reviewing these counts.' . PHP_EOL;
    exit(0);
}

try {
    if (!$columnExists) {
        $pdo->exec('ALTER TABLE incidents ADD COLUMN repair_form_json JSON NULL AFTER description');
    }

    $pdo->beginTransaction();
    $updateIncident = $pdo->prepare(
        'UPDATE incidents SET repair_form_json = :repair_form_json, category = :category, '
        . 'description = :description, updated_at = :updated_at WHERE id = :id'
    );
    foreach ($activeUpdates as $update) {
        $updateIncident->execute([
            ':repair_form_json' => $update['repair_form_json'],
            ':category' => $update['category'],
            ':description' => $update['description'],
            ':updated_at' => $update['updated_at'],
            ':id' => $update['id'],
        ]);
        if ($updateIncident->rowCount() !== 1) {
            throw new RuntimeException('Incident ' . $update['id'] . ' was not synchronized.');
        }
    }

    $updateArchive = $pdo->prepare(
        'UPDATE equipment_archive SET incidents_json = :incidents_json WHERE id = :id'
    );
    foreach ($archiveUpdates as $update) {
        $updateArchive->execute([
            ':incidents_json' => $update['incidents_json'],
            ':id' => $update['id'],
        ]);
        if ($updateArchive->rowCount() !== 1) {
            throw new RuntimeException('Archive ' . $update['id'] . ' was not synchronized.');
        }
    }

    if (!$columnExists || $activeUpdates !== [] || $archiveUpdates !== []) {
        writeAudit($pdo, 'migrate', 'database', 'request-repair-storage-v1', [
            'repair_form_column_added' => !$columnExists,
            'active_incidents_synchronized' => count($activeUpdates),
            'archive_records_synchronized' => count($archiveUpdates),
        ]);
    }
    $pdo->commit();
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    fwrite(STDERR, 'Migration failed: ' . $e->getMessage() . PHP_EOL);
    exit(1);
}

echo 'Synchronization completed successfully.' . PHP_EOL;
