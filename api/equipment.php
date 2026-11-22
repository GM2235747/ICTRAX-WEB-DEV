<?php
require __DIR__ . '/config.php';

header('Content-Type: application/json');

function equipmentPayload(array $row): array
{
    return [
        'id' => $row['equipment_code'],
        'recordSequence' => (int)$row['id'],
        'createdAt' => $row['created_at'] ?? null,
        'name' => $row['name'],
        'category' => $row['category'],
        'location' => $row['location'],
        'serial' => $row['serial_number'],
        'status' => $row['status'],
        'condition' => $row['condition_status'],
        'dateAcquired' => $row['date_acquired'],
        'lastMaintenance' => $row['last_maintenance'],
        'warrantyProvider' => $row['warranty_provider'] ?? '',
        'warrantyExpiration' => $row['warranty_expiration'] ?? '',
        'notes' => $row['notes'] ?? '',
    ];
}

function equipmentAuditPayload(array $row): array
{
    return [
        'equipment_code' => $row['equipment_code'],
        'name' => $row['name'],
        'category' => $row['category'],
        'location' => $row['location'],
        'serial_number' => $row['serial_number'],
        'status' => $row['status'],
        'condition_status' => $row['condition_status'],
        'date_acquired' => $row['date_acquired'],
        'last_maintenance' => $row['last_maintenance'],
        'warranty_provider' => $row['warranty_provider'] ?? null,
        'warranty_expiration' => $row['warranty_expiration'] ?? null,
        'notes' => $row['notes'] ?? '',
    ];
}

function equipmentInputAuditPayload(array $fields, string $equipmentCode): array
{
    return [
        'equipment_code' => $equipmentCode,
        'name' => $fields[':name'],
        'category' => $fields[':category'],
        'location' => $fields[':location'],
        'serial_number' => $fields[':serial_number'],
        'status' => $fields[':status'],
        'condition_status' => $fields[':condition_status'],
        'date_acquired' => $fields[':date_acquired'],
        'last_maintenance' => $fields[':last_maintenance'],
        'warranty_provider' => $fields[':warranty_provider'],
        'warranty_expiration' => $fields[':warranty_expiration'],
        'notes' => $fields[':notes'],
    ];
}

function nextAutomaticEquipmentCode(PDO $pdo, string $prefix, string $sequence): string
{
    $stem = $prefix . $sequence . '-';
    $codes = [];

    $stmt = $pdo->prepare('SELECT equipment_code FROM equipment WHERE equipment_code LIKE :pattern');
    $stmt->execute([':pattern' => $stem . '%']);
    $codes = array_column($stmt->fetchAll(), 'equipment_code');

    $archiveTable = $pdo->query(
        "SELECT COUNT(*) FROM information_schema.tables
         WHERE table_schema = DATABASE() AND table_name = 'equipment_archive'"
    )->fetchColumn();
    if ((int)$archiveTable > 0) {
        $stmt = $pdo->prepare('SELECT equipment_code FROM equipment_archive WHERE equipment_code LIKE :pattern');
        $stmt->execute([':pattern' => $stem . '%']);
        $codes = array_merge($codes, array_column($stmt->fetchAll(), 'equipment_code'));
    }

    $highest = 0;
    $pattern = '/^' . preg_quote($stem, '/') . '([0-9]+)$/D';
    foreach ($codes as $code) {
        if (preg_match($pattern, (string)$code, $match)) {
            $highest = max($highest, (int)$match[1]);
        }
    }

    return $stem . str_pad((string)($highest + 1), 2, '0', STR_PAD_LEFT);
}

function validManualEquipmentCode(string $code): bool
{
    return strlen($code) <= 50 && preg_match('/^[A-Za-z0-9][A-Za-z0-9._-]*$/', $code) === 1;
}

function equipmentInputString(array $data, string $field, int $maximumLength, bool $required = true): string
{
    $value = $data[$field] ?? '';
    if (!is_string($value) && !is_numeric($value)) {
        jsonResponse(['success' => false, 'message' => "The {$field} field is invalid."], 400);
    }

    $value = trim((string)$value);
    if (($required && $value === '') || strlen($value) > $maximumLength) {
        jsonResponse(['success' => false, 'message' => "The {$field} field is invalid."], 400);
    }
    if (preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $value)) {
        jsonResponse(['success' => false, 'message' => "The {$field} field contains unsupported characters."], 400);
    }
    return $value;
}

function equipmentData(array $data): array
{
    $name = equipmentInputString($data, 'name', 150);
    $category = equipmentInputString($data, 'category', 100);
    $location = equipmentInputString($data, 'location', 150);
    $serial = equipmentInputString($data, 'serial', 150);
    $status = equipmentInputString($data, 'status', 50);
    $condition = equipmentInputString($data, 'condition', 50);
    $dateAcquiredText = equipmentInputString($data, 'dateAcquired', 10);
    $lastMaintenanceText = equipmentInputString($data, 'lastMaintenance', 10);
    $warrantyProvider = equipmentInputString($data, 'warrantyProvider', 150, false);
    $warrantyExpirationText = equipmentInputString($data, 'warrantyExpiration', 10, false);
    $notes = equipmentInputString($data, 'notes', 10000, false);

    $dateAcquired = DateTimeImmutable::createFromFormat('!Y-m-d', $dateAcquiredText);
    $lastMaintenance = DateTimeImmutable::createFromFormat('!Y-m-d', $lastMaintenanceText);
    $minimumDate = new DateTimeImmutable('2000-01-01');
    $today = new DateTimeImmutable('today');
    if (!$dateAcquired || $dateAcquired->format('Y-m-d') !== $dateAcquiredText) {
        jsonResponse(['success' => false, 'message' => 'Date acquired must be a valid date.'], 400);
    }
    if (!$lastMaintenance || $lastMaintenance->format('Y-m-d') !== $lastMaintenanceText) {
        jsonResponse(['success' => false, 'message' => 'Last maintenance must be a valid date.'], 400);
    }
    if ($dateAcquired < $minimumDate || $lastMaintenance < $minimumDate) {
        jsonResponse(['success' => false, 'message' => 'Equipment dates cannot be earlier than 2000-01-01.'], 400);
    }
    if ($dateAcquired > $today || $lastMaintenance > $today) {
        jsonResponse(['success' => false, 'message' => 'Equipment dates cannot be in the future.'], 400);
    }
    if ($lastMaintenance < $dateAcquired) {
        jsonResponse(['success' => false, 'message' => 'Last maintenance cannot be before the acquisition date.'], 400);
    }

    if ($warrantyExpirationText !== '') {
        $warrantyExpiration = DateTimeImmutable::createFromFormat('!Y-m-d', $warrantyExpirationText);
        if (!$warrantyExpiration || $warrantyExpiration->format('Y-m-d') !== $warrantyExpirationText) {
            jsonResponse(['success' => false, 'message' => 'Warranty expiration must be a valid date.'], 400);
        }
        if ($warrantyExpiration < $dateAcquired) {
            jsonResponse(['success' => false, 'message' => 'Warranty expiration cannot be before the acquisition date.'], 400);
        }
    } elseif ($warrantyProvider !== '') {
        jsonResponse(['success' => false, 'message' => 'Enter a warranty expiration date when a warranty provider is recorded.'], 400);
    }

    if (!in_array($status, ['Operational', 'Under Repair', 'Damaged', 'Missing', 'Condemned'], true)) {
        jsonResponse(['success' => false, 'message' => 'Invalid equipment status.'], 400);
    }
    if (!in_array($condition, ['New', 'Good', 'Fair', 'Poor'], true)) {
        jsonResponse(['success' => false, 'message' => 'Invalid equipment condition.'], 400);
    }

    return [
        ':name' => $name,
        ':category' => $category,
        ':location' => $location,
        ':serial_number' => $serial,
        ':status' => $status,
        ':condition_status' => $condition,
        ':date_acquired' => $dateAcquiredText,
        ':last_maintenance' => $lastMaintenanceText,
        ':warranty_provider' => $warrantyProvider === '' ? null : $warrantyProvider,
        ':warranty_expiration' => $warrantyExpirationText === '' ? null : $warrantyExpirationText,
        ':notes' => $notes,
    ];
}

$method = requireRequestMethod(['GET', 'POST', 'PUT', 'DELETE']);
$userId = requireAuthenticatedUser($method === 'GET' ? ['admin', 'faculty'] : ['admin']);
if ($method !== 'GET') {
    requireCsrfToken();
}

if ($method === 'POST') {
    $data = readJsonBody(32768);
    $fields = equipmentData($data);

    try {
        $pdo->beginTransaction();
        $categoryStmt = $pdo->prepare(
            'SELECT id, name, tag_id_mode, tag_prefix, tag_sequence
             FROM equipment_categories
             WHERE name = :name AND deleted_at IS NULL
             FOR UPDATE'
        );
        $categoryStmt->execute([':name' => $fields[':category']]);
        $category = $categoryStmt->fetch();
        if (!$category) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => 'Select an active equipment category.'], 400);
        }

        $locationStmt = $pdo->prepare(
            'SELECT id
             FROM equipment_locations
             WHERE name = :name AND deleted_at IS NULL
             FOR UPDATE'
        );
        $locationStmt->execute([':name' => $fields[':location']]);
        if (!$locationStmt->fetchColumn()) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => 'Select an active equipment location.'], 400);
        }

        if ($category['tag_id_mode'] === 'manual') {
            $equipmentCode = equipmentInputString($data, 'id', 50);
            if ($equipmentCode === '' || !validManualEquipmentCode($equipmentCode)) {
                $pdo->rollBack();
                jsonResponse(['success' => false, 'message' => 'Enter a valid unique Tag ID for this manual category.'], 400);
            }
        } else {
            $prefix = strtoupper(trim((string)($category['tag_prefix'] ?? '')));
            $sequence = trim((string)($category['tag_sequence'] ?? ''));
            if (!preg_match('/^[A-Z0-9]{1,12}$/', $prefix) || !preg_match('/^[0-9]{1,6}$/', $sequence)) {
                $pdo->rollBack();
                jsonResponse(['success' => false, 'message' => 'This category needs a valid tag prefix and sequence before equipment can be added.'], 409);
            }
            $equipmentCode = nextAutomaticEquipmentCode($pdo, $prefix, $sequence);
        }

        $stmt = $pdo->prepare(
            'INSERT INTO equipment
                (equipment_code, name, category, location, serial_number, status, condition_status, date_acquired, last_maintenance,
                 warranty_provider, warranty_expiration, notes, created_by_user_id, updated_by_user_id)
             VALUES
                (:equipment_code, :name, :category, :location, :serial_number, :status, :condition_status, :date_acquired, :last_maintenance,
                 :warranty_provider, :warranty_expiration, :notes, :created_by_user_id, :updated_by_user_id)'
        );
        $stmt->execute(array_merge([
            ':equipment_code' => $equipmentCode,
            ':created_by_user_id' => $userId,
            ':updated_by_user_id' => $userId,
        ], $fields));

        $id = (int)$pdo->lastInsertId();
        $stmt = $pdo->prepare('SELECT * FROM equipment WHERE id = :id AND deleted_at IS NULL');
        $stmt->execute([':id' => $id]);
        $created = $stmt->fetch();
        if (!$created) {
            throw new RuntimeException('Created equipment could not be reloaded.');
        }
        writeAudit($pdo, 'create', 'equipment', $equipmentCode, [
            'current' => equipmentAuditPayload($created),
            'tag_settings' => [
                'mode' => $category['tag_id_mode'],
                'prefix' => $category['tag_prefix'],
                'sequence' => $category['tag_sequence'],
            ],
        ]);
        $pdo->commit();

        jsonResponse(['success' => true, 'data' => equipmentPayload($created)], 201);
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log('Equipment creation failed: ' . $e->getMessage());
        if (($e->errorInfo[1] ?? null) === 1062) {
            jsonResponse(['success' => false, 'message' => 'The equipment tag or serial number is already registered at this location.'], 409);
        }
        jsonResponse(['success' => false, 'message' => 'Unable to add equipment. No records were changed.'], 500);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log('Equipment creation failed: ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => 'Unable to add equipment. No records were changed.'], 500);
    }
}

if ($method === 'PUT') {
    $data = readJsonBody(32768);
    $code = equipmentInputString($data, 'originalId', 50, false);
    if ($code === '') {
        $code = equipmentInputString($data, 'id', 50);
    }
    $newCode = equipmentInputString($data, 'id', 50);
    if (!validManualEquipmentCode($code) || !validManualEquipmentCode($newCode)) {
        jsonResponse(['success' => false, 'message' => 'Enter a valid unique Tag ID.'], 400);
    }
    $fields = equipmentData($data);
    $fields[':equipment_code'] = $newCode;

    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare(
            'SELECT *
             FROM equipment
             WHERE equipment_code = :equipment_code AND deleted_at IS NULL
             FOR UPDATE'
        );
        $stmt->execute([':equipment_code' => $code]);
        $previous = $stmt->fetch();
        if (!$previous) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => 'Equipment not found.'], 404);
        }

        $categoryStmt = $pdo->prepare(
            'SELECT id, tag_id_mode
             FROM equipment_categories
             WHERE name = :name AND deleted_at IS NULL
             FOR UPDATE'
        );
        $categoryStmt->execute([':name' => $fields[':category']]);
        $category = $categoryStmt->fetch();
        if (!$category) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => 'Select an active equipment category.'], 400);
        }
        if ($category['tag_id_mode'] !== 'manual' && $newCode !== $code) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => 'Automatic Tag ID mode keeps the existing equipment number unchanged.'], 409);
        }

        $locationStmt = $pdo->prepare(
            'SELECT id
             FROM equipment_locations
             WHERE name = :name AND deleted_at IS NULL
             FOR UPDATE'
        );
        $locationStmt->execute([':name' => $fields[':location']]);
        if (!$locationStmt->fetchColumn()) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => 'Select an active equipment location.'], 400);
        }

        if (equipmentAuditPayload($previous) === equipmentInputAuditPayload($fields, $newCode)) {
            $pdo->rollBack();
            jsonResponse([
                'success' => true,
                'unchanged' => true,
                'message' => 'No equipment changes to save.',
                'data' => equipmentPayload($previous),
            ]);
        }

        $stmt = $pdo->prepare(
            'UPDATE equipment SET equipment_code = :equipment_code, name = :name, category = :category, location = :location,
                serial_number = :serial_number, status = :status, condition_status = :condition_status,
                date_acquired = :date_acquired, last_maintenance = :last_maintenance,
                warranty_provider = :warranty_provider, warranty_expiration = :warranty_expiration, notes = :notes,
                updated_by_user_id = :user_id
             WHERE equipment_code = :original_equipment_code'
        );
        $fields[':user_id'] = $userId;
        $fields[':original_equipment_code'] = $code;
        $stmt->execute($fields);
        $stmt = $pdo->prepare('SELECT * FROM equipment WHERE equipment_code = :equipment_code AND deleted_at IS NULL');
        $stmt->execute([':equipment_code' => $newCode]);
        $row = $stmt->fetch();
        if (!$row) {
            throw new RuntimeException('Updated equipment could not be reloaded.');
        }
        writeAudit($pdo, 'update', 'equipment', $newCode, ['previous' => equipmentAuditPayload($previous), 'current' => equipmentAuditPayload($row)]);
        $pdo->commit();
        jsonResponse(['success' => true, 'data' => equipmentPayload($row)]);
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log('Equipment update failed: ' . $e->getMessage());
        if (($e->errorInfo[1] ?? null) === 1062) {
            jsonResponse(['success' => false, 'message' => 'The equipment tag or serial number is already registered at this location.'], 409);
        }
        jsonResponse(['success' => false, 'message' => 'Unable to update equipment. No records were changed.'], 500);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log('Equipment update failed: ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => 'Unable to update equipment. No records were changed.'], 500);
    }
}

if ($method === 'DELETE') {
    $rawCode = $_GET['id'] ?? '';
    if (!is_string($rawCode) && !is_numeric($rawCode)) {
        jsonResponse(['success' => false, 'message' => 'A valid equipment ID is required.'], 400);
    }
    $code = trim((string)$rawCode);
    if (!validManualEquipmentCode($code)) {
        jsonResponse(['success' => false, 'message' => 'A valid equipment ID is required.'], 400);
    }

    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare(
            'SELECT *
             FROM equipment
             WHERE equipment_code = :equipment_code AND deleted_at IS NULL
             FOR UPDATE'
        );
        $stmt->execute([':equipment_code' => $code]);
        $previous = $stmt->fetch();
        if (!$previous) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => 'Equipment not found.'], 404);
        }

        $equipmentId = (int)$previous['id'];
        $stmt = $pdo->prepare('UPDATE incidents SET deleted_at = NOW(), deleted_by_user_id = :user_id WHERE equipment_id = :equipment_id AND deleted_at IS NULL');
        $stmt->execute([':equipment_id' => $equipmentId, ':user_id' => $userId]);
        $incidentCount = $stmt->rowCount();
        $stmt = $pdo->prepare('UPDATE equipment SET deleted_at = NOW(), deleted_by_user_id = :deleted_by_user_id, updated_by_user_id = :updated_by_user_id WHERE id = :id AND deleted_at IS NULL');
        $stmt->execute([
            ':id' => $equipmentId,
            ':deleted_by_user_id' => $userId,
            ':updated_by_user_id' => $userId,
        ]);
        if ($stmt->rowCount() !== 1) {
            throw new RuntimeException('Equipment was not archived.');
        }
        writeAudit($pdo, 'delete', 'equipment', $code, [
            'previous' => equipmentAuditPayload($previous),
            'linked_incidents_soft_deleted' => $incidentCount,
        ]);
        $pdo->commit();
        jsonResponse(['success' => true]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log('Equipment delete failed: ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => 'Unable to archive equipment. No records were changed.'], 500);
    }
}

try {
    $stmt = $pdo->query('SELECT * FROM equipment WHERE deleted_at IS NULL ORDER BY created_at DESC, id DESC');
    $equipment = array_map('equipmentPayload', $stmt->fetchAll());
    jsonResponse(['success' => true, 'data' => $equipment]);
} catch (Throwable $e) {
    error_log('Equipment lookup failed: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Unable to load equipment.'], 500);
}
