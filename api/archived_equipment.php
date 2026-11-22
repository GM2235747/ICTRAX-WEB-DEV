<?php
require __DIR__ . '/config.php';

header('Content-Type: application/json');
requireRequestMethod('GET');
requireAuthenticatedUser(['admin']);

function archivedPositiveId(mixed $value): int
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

try {
    $hasArchiveId = array_key_exists('archive_id', $_GET);
    $hasEquipmentId = array_key_exists('id', $_GET);
    if ($hasArchiveId && $hasEquipmentId) {
        jsonResponse(['success' => false, 'message' => 'Use only one archived-equipment identifier.'], 400);
    }

    if (!$hasArchiveId && !$hasEquipmentId) {
        $stmt = $pdo->query(
            'SELECT equipment_archive.id AS archive_record_id, equipment_archive.equipment_id,
                    equipment_archive.equipment_code, equipment_archive.equipment_name,
                    equipment_archive.department, equipment_archive.location,
                    equipment_archive.archive_reason, equipment_archive.archived_by,
                    equipment_archive.archived_date, users.username AS archived_by_username
             FROM equipment_archive
             LEFT JOIN users ON users.id = equipment_archive.archived_by
             ORDER BY equipment_archive.archived_date DESC, equipment_archive.id DESC'
        );
        jsonResponse($stmt->fetchAll());
    }

    if ($hasArchiveId) {
        $archiveId = archivedPositiveId($_GET['archive_id']);
        if ($archiveId < 1) {
            jsonResponse(['success' => false, 'message' => 'A valid archive record ID is required.'], 400);
        }
        $stmt = $pdo->prepare('SELECT * FROM equipment_archive WHERE id = :id');
        $stmt->execute([':id' => $archiveId]);
    } else {
        $rawEquipmentId = $_GET['id'];
        if (!is_string($rawEquipmentId) && !is_int($rawEquipmentId)) {
            jsonResponse(['success' => false, 'message' => 'A valid equipment identifier is required.'], 400);
        }
        $equipmentId = trim((string)$rawEquipmentId);
        if ($equipmentId === '' || strlen($equipmentId) > 50
            || !preg_match('/^[A-Za-z0-9][A-Za-z0-9._-]*$/', $equipmentId)) {
            jsonResponse(['success' => false, 'message' => 'A valid equipment identifier is required.'], 400);
        }
        $stmt = $pdo->prepare(
            'SELECT *
             FROM equipment_archive
             WHERE equipment_id = :numeric_id OR equipment_code = :equipment_code
             ORDER BY archived_date DESC, id DESC
             LIMIT 1'
        );
        $stmt->execute([
            ':numeric_id' => ctype_digit($equipmentId) ? (int)$equipmentId : 0,
            ':equipment_code' => $equipmentId,
        ]);
    }
    $equipment = $stmt->fetch();

    if (!$equipment) {
        jsonResponse(['success' => false, 'message' => 'Archived equipment record not found.'], 404);
    }

    $serviceCard = null;
    if (!empty($equipment['service_card_json'])) {
        $decodedCard = json_decode($equipment['service_card_json'], true);
        if (is_array($decodedCard)) {
            $serviceCard = $decodedCard;
        }
    }

    if (!$serviceCard) {
        $history = $pdo->prepare(
            "SELECT details, created_at
             FROM audit_logs
             WHERE entity_type = 'service_card' AND entity_id = :entity_id
               AND created_at <= :archived_date
             ORDER BY created_at DESC, id DESC
             LIMIT 1"
        );
        $history->execute([
            ':entity_id' => $equipment['equipment_code'] ?: (string)$equipment['equipment_id'],
            ':archived_date' => $equipment['archived_date'],
        ]);
        $audit = $history->fetch();
        if ($audit && $audit['details']) {
            $details = json_decode($audit['details'], true);
            $pastCard = is_array($details) ? ($details['current'] ?? null) : null;
            if (is_array($pastCard)) {
                $serviceCard = [
                    'office' => $pastCard['office'] ?? '',
                    'model' => $pastCard['model'] ?? '',
                    'unit_cost' => $pastCard['unit_cost'] ?? '',
                    'service_rows' => $pastCard['service_rows'] ?? [],
                    'updated_at' => $audit['created_at'],
                ];
            }
        }
    }

    if ($serviceCard) {
        $serviceRows = $serviceCard['service_rows'] ?? [];
        if (is_string($serviceRows)) {
            $decodedRows = json_decode($serviceRows, true);
            $serviceRows = is_array($decodedRows) ? $decodedRows : [];
        }
        if (!is_array($serviceRows)) {
            $serviceRows = [];
        }
        $serviceCard = [
            'office' => $serviceCard['office'] ?? '',
            'model' => $serviceCard['model'] ?? '',
            'unit_cost' => $serviceCard['unit_cost'] ?? '',
            'service_rows' => array_slice(array_values($serviceRows), 0, 210),
            'created_at' => $serviceCard['created_at'] ?? null,
            'updated_at' => $serviceCard['updated_at'] ?? null,
        ];
    }

    $snapshot = json_decode((string)($equipment['equipment_json'] ?? ''), true);
    if (!is_array($snapshot)) {
        $snapshot = [];
    }

    jsonResponse([
        'archive_record_id' => (int)$equipment['id'],
        'equipment_id' => (int)$equipment['equipment_id'],
        'equipment_code' => $equipment['equipment_code'],
        'equipment_name' => $equipment['equipment_name'],
        'department' => $equipment['department'],
        'location' => $equipment['location'],
        'archive_reason' => $equipment['archive_reason'],
        'archived_by' => $equipment['archived_by'] !== null ? (int)$equipment['archived_by'] : null,
        'archived_date' => $equipment['archived_date'],
        'category' => $snapshot['category'] ?? '',
        'serial_number' => $snapshot['serial_number'] ?? '',
        'status' => $snapshot['status'] ?? '',
        'condition_status' => $snapshot['condition_status'] ?? '',
        'date_acquired' => $snapshot['date_acquired'] ?? '',
        'last_maintenance' => $snapshot['last_maintenance'] ?? '',
        'warranty_provider' => $snapshot['warranty_provider'] ?? '',
        'warranty_expiration' => $snapshot['warranty_expiration'] ?? '',
        'notes' => $snapshot['notes'] ?? '',
        'service_card' => $serviceCard,
    ]);
} catch (Throwable $e) {
    error_log('Archived equipment lookup failed: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Unable to load archived equipment.'], 500);
}
