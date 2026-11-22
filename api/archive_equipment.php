<?php
require __DIR__ . '/config.php';

header('Content-Type: application/json');
requireRequestMethod('POST');
$userId = requireAuthenticatedUser(['admin']);
requireCsrfToken();

$data = readJsonBody(16384);
$rawEquipmentCode = $data['equipment_id'] ?? '';
if (!is_string($rawEquipmentCode) && !is_numeric($rawEquipmentCode)) {
    jsonResponse(['success' => false, 'message' => 'A valid equipment ID is required.'], 400);
}
$equipmentCode = trim((string)$rawEquipmentCode);
if (strlen($equipmentCode) > 50 || !preg_match('/^[A-Za-z0-9][A-Za-z0-9._-]*$/', $equipmentCode)) {
    jsonResponse(['success' => false, 'message' => 'A valid equipment ID is required.'], 400);
}

$rawReason = $data['archive_reason'] ?? '';
if (!is_string($rawReason) && !is_numeric($rawReason)) {
    jsonResponse(['success' => false, 'message' => 'A valid archive reason is required.'], 400);
}
$archiveReason = trim((string)$rawReason);
if ($archiveReason === '' || strlen($archiveReason) > 255
    || preg_match('/[\x00-\x1F\x7F]/', $archiveReason)) {
    jsonResponse(['success' => false, 'message' => 'A valid archive reason is required.'], 400);
}

try {
    $pdo->beginTransaction();

    $check = $pdo->prepare(
        'SELECT *
         FROM equipment
         WHERE equipment_code = :equipment_code AND deleted_at IS NULL
         FOR UPDATE'
    );
    $check->execute([':equipment_code' => $equipmentCode]);
    $equipment = $check->fetch();
    if (!$equipment) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => 'Equipment was not found or has already been archived.'], 404);
    }

    $incidentStmt = $pdo->prepare(
        'SELECT *
         FROM incidents
         WHERE equipment_id = :equipment_id
         ORDER BY id
         FOR UPDATE'
    );
    $incidentStmt->execute([':equipment_id' => $equipment['id']]);
    $incidents = $incidentStmt->fetchAll();

    $serviceCardStmt = $pdo->prepare(
        'SELECT office, model, unit_cost, service_rows, created_at, updated_at
         FROM service_cards
         WHERE equipment_id = :equipment_id
         FOR UPDATE'
    );
    $serviceCardStmt->execute([':equipment_id' => $equipment['id']]);
    $serviceCard = $serviceCardStmt->fetch();
    if ($serviceCard && is_string($serviceCard['service_rows'])) {
        $decodedRows = json_decode($serviceCard['service_rows'], true);
        $serviceCard['service_rows'] = is_array($decodedRows) ? $decodedRows : [];
    }

    $equipmentJson = json_encode($equipment, JSON_THROW_ON_ERROR);
    $incidentsJson = json_encode($incidents, JSON_THROW_ON_ERROR);
    $serviceCardJson = $serviceCard ? json_encode($serviceCard, JSON_THROW_ON_ERROR) : null;

    $insert = $pdo->prepare(
        'INSERT INTO equipment_archive
            (equipment_id, equipment_code, equipment_name, department, location, archive_reason,
             archived_by, archived_date, service_card_json, equipment_json, incidents_json)
         VALUES
            (:equipment_id, :equipment_code, :equipment_name, :department, :location, :archive_reason,
             :archived_by, CURRENT_TIMESTAMP, :service_card_json, :equipment_json, :incidents_json)'
    );
    $insert->execute([
        ':equipment_id' => (int)$equipment['id'],
        ':equipment_code' => $equipment['equipment_code'],
        ':equipment_name' => $equipment['name'],
        ':department' => $equipment['department'] ?? null,
        ':location' => $equipment['location'],
        ':archive_reason' => $archiveReason,
        ':archived_by' => $userId,
        ':service_card_json' => $serviceCardJson,
        ':equipment_json' => $equipmentJson,
        ':incidents_json' => $incidentsJson,
    ]);
    $archiveId = (int)$pdo->lastInsertId();

    if ($serviceCard) {
        $deleteServiceCard = $pdo->prepare('DELETE FROM service_cards WHERE equipment_id = :equipment_id');
        $deleteServiceCard->execute([':equipment_id' => $equipment['id']]);
        if ($deleteServiceCard->rowCount() !== 1) {
            throw new RuntimeException('Service card was not moved to the archive.');
        }
    }

    $deleteIncidents = $pdo->prepare('DELETE FROM incidents WHERE equipment_id = :equipment_id');
    $deleteIncidents->execute([':equipment_id' => $equipment['id']]);
    if ($deleteIncidents->rowCount() !== count($incidents)) {
        throw new RuntimeException('Not all incident records were moved to the archive.');
    }

    $delete = $pdo->prepare('DELETE FROM equipment WHERE id = :id AND deleted_at IS NULL');
    $delete->execute([':id' => $equipment['id']]);
    if ($delete->rowCount() !== 1) {
        throw new RuntimeException('Equipment was not moved to the archive.');
    }

    writeAudit($pdo, 'archive', 'equipment', $equipment['equipment_code'], [
        'archive_record_id' => $archiveId,
        'archive_reason' => $archiveReason,
        'incident_count' => count($incidents),
        'service_card_preserved' => $serviceCard !== false,
    ]);

    $pdo->commit();
    jsonResponse(['success' => true, 'archive_id' => $archiveId], 201);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Equipment archive failed: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Unable to archive equipment. No records were changed.'], 500);
}
