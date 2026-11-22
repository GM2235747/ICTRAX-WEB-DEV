<?php
require __DIR__ . '/config.php';
require_once __DIR__ . '/incident-repair-form.php';

header('Content-Type: application/json');
requireRequestMethod('POST');
$userId = requireAuthenticatedUser(['admin']);
requireCsrfToken();

function restorePositiveId(mixed $value): int
{
    if (!is_int($value) && !is_string($value)) {
        return 0;
    }
    $value = trim((string)$value);
    if (!preg_match('/^[1-9][0-9]*$/', $value)) {
        return 0;
    }
    $id = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    return $id === false ? 0 : (int)$id;
}

function validRestoreText(mixed $value, int $maximumLength, bool $required = true): bool
{
    if (!is_string($value) && !is_numeric($value)) {
        return false;
    }
    $value = trim((string)$value);
    return (!$required || $value !== '')
        && strlen($value) <= $maximumLength
        && !preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $value);
}

function validRestoreDate(mixed $value): bool
{
    if (!is_string($value)) {
        return false;
    }
    $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value);
    return $date !== false
        && $date->format('Y-m-d') === $value
        && $date >= new DateTimeImmutable('2000-01-01')
        && $date <= new DateTimeImmutable('today');
}

function validRestoreWarrantyDate(mixed $value, string $acquiredDate): bool
{
    if ($value === null || $value === '') {
        return true;
    }
    if (!is_string($value)) {
        return false;
    }
    $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value);
    return $date !== false
        && $date->format('Y-m-d') === $value
        && $date >= new DateTimeImmutable($acquiredDate);
}

function validEquipmentRestoreSnapshot(array $snapshot): bool
{
    if (!validRestoreText($snapshot['equipment_code'] ?? null, 50)
        || !preg_match('/^[A-Za-z0-9][A-Za-z0-9._-]*$/', (string)$snapshot['equipment_code'])
        || !validRestoreText($snapshot['name'] ?? null, 150)
        || !validRestoreText($snapshot['category'] ?? null, 100)
        || !validRestoreText($snapshot['location'] ?? null, 150)
        || !validRestoreText($snapshot['serial_number'] ?? null, 150)
        || !in_array($snapshot['status'] ?? null, ['Operational', 'Under Repair', 'Damaged', 'Missing', 'Condemned'], true)
        || !in_array($snapshot['condition_status'] ?? null, ['New', 'Good', 'Fair', 'Poor'], true)
        || !validRestoreDate($snapshot['date_acquired'] ?? null)
        || !validRestoreDate($snapshot['last_maintenance'] ?? null)
        || (string)$snapshot['last_maintenance'] < (string)$snapshot['date_acquired']
        || !validRestoreText($snapshot['warranty_provider'] ?? '', 150, false)
        || !validRestoreWarrantyDate($snapshot['warranty_expiration'] ?? null, (string)$snapshot['date_acquired'])
        || (trim((string)($snapshot['warranty_provider'] ?? '')) !== '' && empty($snapshot['warranty_expiration']))
        || !validRestoreText($snapshot['notes'] ?? '', 10000, false)) {
        return false;
    }
    return true;
}

function normalizedArchivedServiceCard(mixed $value): ?array
{
    if (!is_array($value)) {
        return null;
    }
    $rows = $value['service_rows'] ?? [];
    if (is_string($rows)) {
        $decodedRows = json_decode($rows, true);
        $rows = is_array($decodedRows) ? $decodedRows : [];
    }
    if (!is_array($rows) || count($rows) > 210) {
        throw new UnexpectedValueException('Archived service-card rows are invalid.');
    }
    return [
        'office' => validRestoreText($value['office'] ?? '', 200, false) ? trim((string)($value['office'] ?? '')) : null,
        'model' => validRestoreText($value['model'] ?? '', 150, false) ? trim((string)($value['model'] ?? '')) : null,
        'unit_cost' => ($value['unit_cost'] ?? '') === '' ? null : $value['unit_cost'],
        'service_rows' => array_values($rows),
    ];
}

function archivedIncidentValue(array $incident, string $field, int $maximumLength, bool $required = true): ?string
{
    $value = $incident[$field] ?? null;
    if ($value === null && !$required) {
        return null;
    }
    if (!validRestoreText($value, $maximumLength, $required)) {
        throw new UnexpectedValueException("Archived incident {$field} is invalid.");
    }
    return trim((string)$value);
}

$data = readJsonBody(16384);
$archiveId = restorePositiveId($data['archive_id'] ?? null);
if ($archiveId < 1) {
    jsonResponse(['success' => false, 'message' => 'A valid archive record ID is required.'], 400);
}

try {
    $pdo->beginTransaction();

    $archiveStmt = $pdo->prepare('SELECT * FROM equipment_archive WHERE id = :id FOR UPDATE');
    $archiveStmt->execute([':id' => $archiveId]);
    $archive = $archiveStmt->fetch();
    if (!$archive) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => 'This archived record was not found. Refresh the archive list and try again.'], 404);
    }

    $snapshot = json_decode((string)($archive['equipment_json'] ?? ''), true);
    if (!is_array($snapshot) || !validEquipmentRestoreSnapshot($snapshot)) {
        $pdo->rollBack();
        jsonResponse([
            'success' => false,
            'message' => 'This archive is missing valid inventory details and cannot be restored safely.',
        ], 409);
    }

    $existingStmt = $pdo->prepare('SELECT id FROM equipment WHERE equipment_code = :code FOR UPDATE');
    $existingStmt->execute([':code' => $snapshot['equipment_code']]);
    if ($existingStmt->fetchColumn()) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => 'An equipment record with this tag ID already exists.'], 409);
    }

    $categoryStmt = $pdo->prepare(
        'SELECT id FROM equipment_categories WHERE name = :name AND deleted_at IS NULL FOR UPDATE'
    );
    $categoryStmt->execute([':name' => $snapshot['category']]);
    $locationStmt = $pdo->prepare(
        'SELECT id FROM equipment_locations WHERE name = :name AND deleted_at IS NULL FOR UPDATE'
    );
    $locationStmt->execute([':name' => $snapshot['location']]);
    if (!$categoryStmt->fetchColumn() || !$locationStmt->fetchColumn()) {
        $pdo->rollBack();
        jsonResponse([
            'success' => false,
            'message' => 'Restore the archived equipment category and location before restoring this record.',
        ], 409);
    }

    $insertEquipment = $pdo->prepare(
        'INSERT INTO equipment
            (equipment_code, name, category, location, serial_number, status, condition_status,
             date_acquired, last_maintenance, warranty_provider, warranty_expiration, notes,
             created_by_user_id, updated_by_user_id)
         VALUES
            (:equipment_code, :name, :category, :location, :serial_number, :status, :condition_status,
             :date_acquired, :last_maintenance, :warranty_provider, :warranty_expiration, :notes,
             :created_by_user_id, :updated_by_user_id)'
    );
    $originalCreator = filter_var($snapshot['created_by_user_id'] ?? null, FILTER_VALIDATE_INT);
    $insertEquipment->execute([
        ':equipment_code' => trim((string)$snapshot['equipment_code']),
        ':name' => trim((string)$snapshot['name']),
        ':category' => trim((string)$snapshot['category']),
        ':location' => trim((string)$snapshot['location']),
        ':serial_number' => trim((string)$snapshot['serial_number']),
        ':status' => $snapshot['status'],
        ':condition_status' => $snapshot['condition_status'],
        ':date_acquired' => $snapshot['date_acquired'],
        ':last_maintenance' => $snapshot['last_maintenance'],
        ':warranty_provider' => ($snapshot['warranty_provider'] ?? '') === '' ? null : trim((string)$snapshot['warranty_provider']),
        ':warranty_expiration' => ($snapshot['warranty_expiration'] ?? '') === '' ? null : $snapshot['warranty_expiration'],
        ':notes' => trim((string)($snapshot['notes'] ?? '')),
        ':created_by_user_id' => $originalCreator === false ? $userId : (int)$originalCreator,
        ':updated_by_user_id' => $userId,
    ]);
    $equipmentId = (int)$pdo->lastInsertId();

    $serviceCardRaw = json_decode((string)($archive['service_card_json'] ?? ''), true);
    $serviceCard = normalizedArchivedServiceCard($serviceCardRaw);
    if ($serviceCard) {
        $unitCost = $serviceCard['unit_cost'];
        if ($unitCost !== null
            && (!is_string($unitCost) && !is_numeric($unitCost)
                || !preg_match('/^(?:0|[1-9][0-9]{0,9})(?:\.[0-9]{1,2})?$/', (string)$unitCost))) {
            throw new UnexpectedValueException('Archived service-card unit cost is invalid.');
        }
        $insertCard = $pdo->prepare(
            'INSERT INTO service_cards
                (equipment_id, office, model, unit_cost, service_rows, created_by_user_id, updated_by_user_id)
             VALUES
                (:equipment_id, :office, :model, :unit_cost, :service_rows, :created_by_user_id, :updated_by_user_id)'
        );
        $insertCard->execute([
            ':equipment_id' => $equipmentId,
            ':office' => $serviceCard['office'] ?: null,
            ':model' => $serviceCard['model'] ?: null,
            ':unit_cost' => $unitCost,
            ':service_rows' => json_encode($serviceCard['service_rows'], JSON_THROW_ON_ERROR),
            ':created_by_user_id' => $userId,
            ':updated_by_user_id' => $userId,
        ]);
    }

    $archivedIncidents = json_decode((string)($archive['incidents_json'] ?? '[]'), true);
    if (!is_array($archivedIncidents) || count($archivedIncidents) > 10000) {
        throw new UnexpectedValueException('Archived incidents are invalid.');
    }
    $idMap = [];
    $idAvailableStmt = $pdo->prepare('SELECT 1 FROM incidents WHERE id = :id');
    $insertIncidentWithId = $pdo->prepare(
        'INSERT INTO incidents
            (id, equipment_id, reported_by_user_id, reported_by_name, reported_by_department,
             date_reported, category, description, repair_form_json, status, priority, remarks, resolved_date,
             created_by_user_id, updated_by_user_id, deleted_at, deleted_by_user_id, created_at, updated_at)
         VALUES
            (:id, :equipment_id, :reported_by_user_id, :reported_by_name, :reported_by_department,
             :date_reported, :category, :description, :repair_form_json, :status, :priority, :remarks, :resolved_date,
             :created_by_user_id, :updated_by_user_id, :deleted_at, :deleted_by_user_id, :created_at, :updated_at)'
    );
    $insertIncidentWithoutId = $pdo->prepare(
        'INSERT INTO incidents
            (equipment_id, reported_by_user_id, reported_by_name, reported_by_department,
             date_reported, category, description, repair_form_json, status, priority, remarks, resolved_date,
             created_by_user_id, updated_by_user_id, deleted_at, deleted_by_user_id, created_at, updated_at)
         VALUES
            (:equipment_id, :reported_by_user_id, :reported_by_name, :reported_by_department,
             :date_reported, :category, :description, :repair_form_json, :status, :priority, :remarks, :resolved_date,
             :created_by_user_id, :updated_by_user_id, :deleted_at, :deleted_by_user_id, :created_at, :updated_at)'
    );

    foreach ($archivedIncidents as $incident) {
        if (!is_array($incident)) {
            throw new UnexpectedValueException('Archived incident entry is invalid.');
        }
        $repairFormJson = null;
        if (incidentRepairRowContainsForm($incident)) {
            $repairForm = incidentRepairFormFromRow($incident);
            if ($repairForm === null || !incidentRepairStoredFormIsValid($repairForm)) {
                throw new UnexpectedValueException('Archived request-for-repair data is invalid.');
            }
            $repairFormJson = incidentRepairStorage($repairForm);
            $incident['category'] = incidentRepairCategory($repairForm);
            $incident['description'] = incidentRepairSummary($repairForm);
        }
        $originalId = restorePositiveId($incident['id'] ?? null);
        if ($originalId < 1
            || !validRestoreDate($incident['date_reported'] ?? null)
            || !validRestoreText($incident['category'] ?? null, 100)
            || !in_array($incident['status'] ?? null, ['Pending', 'In Progress', 'Resolved', 'Rejected'], true)
            || !in_array($incident['priority'] ?? null, ['Low', 'Medium', 'High', 'Critical'], true)) {
            throw new UnexpectedValueException('Archived incident fields are invalid.');
        }
        $resolvedDate = $incident['resolved_date'] ?? null;
        if ($resolvedDate !== null && !validRestoreDate($resolvedDate)) {
            throw new UnexpectedValueException('Archived incident resolution date is invalid.');
        }

        $params = [
            ':equipment_id' => $equipmentId,
            ':reported_by_user_id' => restorePositiveId($incident['reported_by_user_id'] ?? null) ?: null,
            ':reported_by_name' => archivedIncidentValue($incident, 'reported_by_name', 150),
            ':reported_by_department' => archivedIncidentValue($incident, 'reported_by_department', 150, false),
            ':date_reported' => $incident['date_reported'],
            ':category' => $incident['category'],
            ':description' => archivedIncidentValue($incident, 'description', 5000),
            ':repair_form_json' => $repairFormJson,
            ':status' => $incident['status'],
            ':priority' => $incident['priority'],
            ':remarks' => archivedIncidentValue($incident, 'remarks', 5000, false),
            ':resolved_date' => $resolvedDate,
            ':created_by_user_id' => restorePositiveId($incident['created_by_user_id'] ?? null) ?: null,
            ':updated_by_user_id' => $userId,
            ':deleted_at' => $incident['deleted_at'] ?? null,
            ':deleted_by_user_id' => restorePositiveId($incident['deleted_by_user_id'] ?? null) ?: null,
            ':created_at' => $incident['created_at'] ?? date('Y-m-d H:i:s'),
            ':updated_at' => $incident['updated_at'] ?? date('Y-m-d H:i:s'),
        ];

        $idAvailableStmt->execute([':id' => $originalId]);
        if (!$idAvailableStmt->fetchColumn()) {
            $insertIncidentWithId->execute([':id' => $originalId] + $params);
            $restoredId = $originalId;
        } else {
            $insertIncidentWithoutId->execute($params);
            $restoredId = (int)$pdo->lastInsertId();
        }
        $idMap[(string)$originalId] = $restoredId;
    }

    $deleteArchive = $pdo->prepare('DELETE FROM equipment_archive WHERE id = :id');
    $deleteArchive->execute([':id' => $archiveId]);
    if ($deleteArchive->rowCount() !== 1) {
        throw new RuntimeException('The archive record was not removed after restoration.');
    }

    writeAudit($pdo, 'restore', 'equipment', $snapshot['equipment_code'], [
        'archive_record_id' => $archiveId,
        'archive_reason' => $archive['archive_reason'] ?? '',
        'service_card_restored' => $serviceCard !== null,
        'incident_count' => count($archivedIncidents),
        'incident_id_map' => $idMap,
    ]);

    $pdo->commit();
    jsonResponse([
        'success' => true,
        'equipment' => [
            'id' => $snapshot['equipment_code'],
            'name' => $snapshot['name'],
            'category' => $snapshot['category'],
            'location' => $snapshot['location'],
            'serial' => $snapshot['serial_number'],
            'status' => $snapshot['status'],
            'condition' => $snapshot['condition_status'],
            'dateAcquired' => $snapshot['date_acquired'],
            'lastMaintenance' => $snapshot['last_maintenance'],
            'warrantyProvider' => $snapshot['warranty_provider'] ?? '',
            'warrantyExpiration' => $snapshot['warranty_expiration'] ?? '',
            'notes' => $snapshot['notes'] ?? '',
        ],
        'restored_incidents' => count($archivedIncidents),
    ]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Equipment restore failed: ' . $e->getMessage());
    if (($e->errorInfo[1] ?? null) === 1062) {
        jsonResponse(['success' => false, 'message' => 'The equipment tag or serial number already exists in the inventory.'], 409);
    }
    jsonResponse(['success' => false, 'message' => 'Unable to restore equipment. No records were changed.'], 500);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Equipment restore failed: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Unable to restore equipment. No records were changed.'], 500);
}
