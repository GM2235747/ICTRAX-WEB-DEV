<?php
require __DIR__ . '/config.php';
require_once __DIR__ . '/incident-repair-form.php';

header('Content-Type: application/json');

function serviceCardString(mixed $value, string $label, int $maximumLength, bool $required = false): string
{
    if ($value === null && !$required) {
        return '';
    }
    if (!is_string($value) && !is_numeric($value)) {
        jsonResponse(['success' => false, 'message' => "{$label} is invalid."], 400);
    }
    $value = trim((string)$value);
    if (($required && $value === '') || strlen($value) > $maximumLength) {
        jsonResponse(['success' => false, 'message' => "{$label} is invalid."], 400);
    }
    if (preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $value)) {
        jsonResponse(['success' => false, 'message' => "{$label} contains unsupported characters."], 400);
    }
    return $value;
}

function serviceCardMoney(mixed $value, string $label): ?string
{
    $value = serviceCardString($value, $label, 13);
    if ($value === '') {
        return null;
    }
    if (!preg_match('/^(?:0|[1-9][0-9]{0,9})(?:\.[0-9]{1,2})?$/', $value)) {
        jsonResponse(['success' => false, 'message' => "{$label} must be a non-negative amount with at most two decimal places."], 400);
    }
    return $value;
}

function serviceCardDate(mixed $value, string $acquiredDate): string
{
    $value = serviceCardString($value, 'Service date', 10);
    if ($value === '') {
        return '';
    }
    $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value);
    if (!$date || $date->format('Y-m-d') !== $value
        || $date < new DateTimeImmutable($acquiredDate)
        || $date > new DateTimeImmutable('today')) {
        jsonResponse(['success' => false, 'message' => 'Service dates must be on or after acquisition and cannot be in the future.'], 400);
    }
    return $value;
}

function serviceCardAuditPayload(array $card): array
{
    return [
        'office' => $card['office'] ?? '',
        'model' => $card['model'] ?? '',
        'unit_cost' => $card['unit_cost'] ?? null,
        'service_rows' => $card['service_rows'] ?? [],
    ];
}

function serviceCardRequestIncidentId(array $row): ?string
{
    $storedId = strtoupper(trim((string)($row['requestIncidentId'] ?? '')));
    if (preg_match('/^INC-[0-9]+$/D', $storedId)) {
        return $storedId;
    }

    $remarks = (string)($row['remarks'] ?? '');
    return preg_match('/\bRequest for Repair (INC-[0-9]+)\b/i', $remarks, $match)
        ? strtoupper($match[1])
        : null;
}

function serviceCardRowIsBlank(array $row): bool
{
    foreach (['date', 'remarks', 'preventive', 'cost', 'servicedBy'] as $field) {
        if (trim((string)($row[$field] ?? '')) !== '') {
            return false;
        }
    }
    return true;
}

function serviceCardRequestRemarks(array $form): string
{
    $remarks = [];
    foreach (['hardwareRemarks', 'softwareRemarks'] as $field) {
        $value = trim((string)($form[$field] ?? ''));
        if ($value !== '' && !in_array($value, $remarks, true)) {
            $remarks[] = $value;
        }
    }
    return implode(' | ', $remarks);
}

function serviceCardRequestRow(array $incident, array $form): array
{
    $incidentId = 'INC-' . str_pad((string)$incident['id'], 4, '0', STR_PAD_LEFT);
    return [
        'date' => (string)$incident['date_reported'],
        'remarks' => serviceCardRequestRemarks($form),
        'preventive' => !empty($form['maintenanceRepair']) ? 'Yes' : 'No',
        'cost' => '',
        'servicedBy' => trim((string)($form['actionTakenBy'] ?? '')),
        'requestIncidentId' => $incidentId,
    ];
}

function serviceCardMergeRepairRequests(PDO $pdo, int $equipmentId, array $rows): array
{
    $linkedIncidentRows = [];
    foreach ($rows as $index => $row) {
        if (!is_array($row)) {
            continue;
        }
        $incidentId = serviceCardRequestIncidentId($row);
        if ($incidentId !== null) {
            $linkedIncidentRows[$incidentId] = $index;
        }
    }

    $stmt = $pdo->prepare(
        'SELECT id, date_reported, description, repair_form_json
         FROM incidents
         WHERE equipment_id = :equipment_id
           AND deleted_at IS NULL
           AND (repair_form_json IS NOT NULL OR description LIKE :legacy_prefix)
         ORDER BY date_reported, id'
    );
    $stmt->execute([
        ':equipment_id' => $equipmentId,
        ':legacy_prefix' => INCIDENT_REPAIR_FORM_PREFIX . '%',
    ]);

    foreach ($stmt->fetchAll() as $incident) {
        $incidentId = 'INC-' . str_pad((string)$incident['id'], 4, '0', STR_PAD_LEFT);
        $form = incidentRepairFormFromRow($incident);
        if ($form === null) {
            continue;
        }

        if (isset($linkedIncidentRows[$incidentId])) {
            $rowIndex = $linkedIncidentRows[$incidentId];
            $existingRow = $rows[$rowIndex];
            if (!isset($existingRow['requestIncidentId'])) {
                $existingRow['remarks'] = serviceCardRequestRemarks($form);
            }
            $existingRow['requestIncidentId'] = $incidentId;
            $rows[$rowIndex] = $existingRow;
            continue;
        }

        $requestRow = serviceCardRequestRow($incident, $form);
        $blankIndex = null;
        foreach ($rows as $index => $row) {
            if (is_array($row) && serviceCardRowIsBlank($row)) {
                $blankIndex = $index;
                break;
            }
        }
        if ($blankIndex !== null) {
            $rows[$blankIndex] = $requestRow;
        } elseif (count($rows) < 210) {
            $rows[] = $requestRow;
        } else {
            break;
        }
        $linkedIncidentRows[$incidentId] = $blankIndex ?? array_key_last($rows);
    }

    return array_values($rows);
}

$method = requireRequestMethod(['GET', 'POST']);
$userId = requireAuthenticatedUser($method === 'GET' ? ['admin', 'faculty'] : ['admin']);
if ($method === 'POST') {
    requireCsrfToken();
}

$equipmentCode = serviceCardString($_GET['equipment'] ?? '', 'Equipment code', 50, true);
if (!preg_match('/^[A-Za-z0-9][A-Za-z0-9._-]*$/', $equipmentCode)) {
    jsonResponse(['success' => false, 'message' => 'Equipment code is invalid.'], 400);
}

if ($method === 'GET') {
    try {
        $equipmentStmt = $pdo->prepare(
            'SELECT id, equipment_code, name, category, serial_number, location, status,
                    condition_status, date_acquired, last_maintenance, warranty_provider,
                    warranty_expiration, notes
             FROM equipment
             WHERE equipment_code = :code AND deleted_at IS NULL'
        );
        $equipmentStmt->execute([':code' => $equipmentCode]);
        $equipment = $equipmentStmt->fetch();
        if (!$equipment) {
            jsonResponse(['success' => false, 'message' => 'Equipment not found.'], 404);
        }

        $stmt = $pdo->prepare(
            'SELECT office, model, unit_cost, service_rows, created_at, updated_at
             FROM service_cards
             WHERE equipment_id = :equipment_id'
        );
        $stmt->execute([':equipment_id' => $equipment['id']]);
        $card = $stmt->fetch() ?: [
            'office' => '',
            'model' => '',
            'unit_cost' => '',
            'service_rows' => [],
            'created_at' => null,
            'updated_at' => null,
        ];
        if (is_string($card['service_rows'])) {
            $decodedRows = json_decode($card['service_rows'], true);
            $card['service_rows'] = is_array($decodedRows) ? $decodedRows : [];
        }
        $card['service_rows'] = serviceCardMergeRepairRequests(
            $pdo,
            (int)$equipment['id'],
            is_array($card['service_rows']) ? $card['service_rows'] : []
        );
        $card['rows'] = $card['service_rows'] ?? [];
        unset($card['service_rows']);
        jsonResponse(['success' => true, 'equipment' => $equipment, 'card' => $card]);
    } catch (Throwable $e) {
        error_log('Service card lookup failed: ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => 'Unable to load the service card.'], 500);
    }
}

$data = readJsonBody(524288);
$rawRows = $data['rows'] ?? [];
if (!is_array($rawRows) || count($rawRows) > 210) {
    jsonResponse(['success' => false, 'message' => 'A service card can contain at most 210 service rows.'], 400);
}
$office = serviceCardString($data['office'] ?? '', 'Office', 200);
$model = serviceCardString($data['model'] ?? '', 'Model', 150);
$unitCost = serviceCardMoney($data['unitCost'] ?? '', 'Unit cost');

try {
    $pdo->beginTransaction();
    $equipmentStmt = $pdo->prepare(
        'SELECT id, equipment_code, name, category, serial_number, location, status,
                condition_status, date_acquired, last_maintenance, warranty_provider,
                warranty_expiration, notes
         FROM equipment
         WHERE equipment_code = :code AND deleted_at IS NULL
         FOR UPDATE'
    );
    $equipmentStmt->execute([':code' => $equipmentCode]);
    $equipment = $equipmentStmt->fetch();
    if (!$equipment) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => 'Equipment not found.'], 404);
    }

    $rows = [];
    foreach (array_values($rawRows) as $index => $row) {
        if (!is_array($row)) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => 'Each service row must be an object.'], 400);
        }
        $preventive = serviceCardString($row['preventive'] ?? '', 'Preventive maintenance value', 3);
        if (!in_array($preventive, ['', 'Yes', 'No'], true)) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => 'Preventive maintenance must be Yes, No, or blank.'], 400);
        }
        $requestIncidentId = strtoupper(serviceCardString(
            $row['requestIncidentId'] ?? '',
            'Request incident ID',
            20
        ));
        if ($requestIncidentId !== '' && !preg_match('/^INC-[0-9]+$/D', $requestIncidentId)) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => 'Request incident ID is invalid.'], 400);
        }
        $normalizedRow = [
            'date' => serviceCardDate($row['date'] ?? '', (string)$equipment['date_acquired']),
            'remarks' => serviceCardString($row['remarks'] ?? '', 'Service remarks', 2000),
            'preventive' => $preventive,
            'cost' => serviceCardMoney($row['cost'] ?? '', 'Repair cost') ?? '',
            'servicedBy' => serviceCardString($row['servicedBy'] ?? '', 'Serviced by', 150),
        ];
        if ($requestIncidentId !== '') {
            $normalizedRow['requestIncidentId'] = $requestIncidentId;
        }
        $rows[] = $normalizedRow;
    }

    $previousStmt = $pdo->prepare(
        'SELECT office, model, unit_cost, service_rows
         FROM service_cards
         WHERE equipment_id = :equipment_id
         FOR UPDATE'
    );
    $previousStmt->execute([':equipment_id' => $equipment['id']]);
    $previous = $previousStmt->fetch();
    if ($previous && is_string($previous['service_rows'])) {
        $decodedRows = json_decode($previous['service_rows'], true);
        $previous['service_rows'] = is_array($decodedRows) ? $decodedRows : [];
    }

    $encodedRows = json_encode($rows, JSON_THROW_ON_ERROR);
    if (strlen($encodedRows) > 262144) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => 'The service-card history is too large.'], 413);
    }

    $current = [
        'office' => $office,
        'model' => $model,
        'unit_cost' => $unitCost,
        'service_rows' => $rows,
    ];
    if ($previous && serviceCardAuditPayload($previous) === serviceCardAuditPayload($current)) {
        $pdo->rollBack();
        jsonResponse([
            'success' => true,
            'unchanged' => true,
            'message' => 'No service card changes to save.',
        ]);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO service_cards
            (equipment_id, office, model, unit_cost, service_rows, created_by_user_id, updated_by_user_id)
         VALUES (:equipment_id, :office, :model, :unit_cost, :service_rows, :created_by_user_id, :updated_by_user_id)
         ON DUPLICATE KEY UPDATE
            office = VALUES(office), model = VALUES(model), unit_cost = VALUES(unit_cost),
            service_rows = VALUES(service_rows), updated_by_user_id = VALUES(updated_by_user_id)'
    );
    $stmt->execute([
        ':equipment_id' => $equipment['id'],
        ':office' => $office ?: null,
        ':model' => $model ?: null,
        ':unit_cost' => $unitCost,
        ':service_rows' => $encodedRows,
        ':created_by_user_id' => $userId,
        ':updated_by_user_id' => $userId,
    ]);

    writeAudit($pdo, 'update', 'service_card', $equipmentCode, [
        'previous' => $previous ? serviceCardAuditPayload($previous) : null,
        'current' => serviceCardAuditPayload($current),
    ]);
    $pdo->commit();
    jsonResponse(['success' => true, 'message' => 'Service card saved.']);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Service card save failed: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Unable to save the service card. No records were changed.'], 500);
}
