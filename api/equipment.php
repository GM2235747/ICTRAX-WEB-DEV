<?php
require __DIR__ . '/config.php';

header('Content-Type: application/json');

function equipmentPayload(array $row): array
{
    return [
        'id' => $row['equipment_code'],
        'name' => $row['name'],
        'category' => $row['category'],
        'location' => $row['location'],
        'serial' => $row['serial_number'],
        'status' => $row['status'],
        'condition' => $row['condition_status'],
        'dateAcquired' => $row['date_acquired'],
        'lastMaintenance' => $row['last_maintenance'],
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
        'notes' => $row['notes'] ?? '',
    ];
}

function requireAdmin(): void
{
    session_start();
    if (($_SESSION['role'] ?? null) !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Administrator access is required.']);
        exit;
    }
}

function equipmentData(array $data): array
{
    $required = ['name', 'category', 'location', 'serial', 'status', 'condition', 'dateAcquired', 'lastMaintenance'];
    foreach ($required as $field) {
        if (trim((string)($data[$field] ?? '')) === '') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => "The {$field} field is required."]);
            exit;
        }
    }

    $dateAcquired = DateTime::createFromFormat('!Y-m-d', $data['dateAcquired']);
    $lastMaintenance = DateTime::createFromFormat('!Y-m-d', $data['lastMaintenance']);
    $minimumDate = new DateTime('2000-01-01');
    $today = new DateTime('today');
    if (!$dateAcquired || $dateAcquired->format('Y-m-d') !== $data['dateAcquired']) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Date acquired must be a valid date.']);
        exit;
    }
    if (!$lastMaintenance || $lastMaintenance->format('Y-m-d') !== $data['lastMaintenance']) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Last maintenance must be a valid date.']);
        exit;
    }
    if ($dateAcquired < $minimumDate || $lastMaintenance < $minimumDate) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Equipment dates cannot be earlier than 2000-01-01.']);
        exit;
    }
    if ($dateAcquired > $today || $lastMaintenance > $today) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Equipment dates cannot be in the future.']);
        exit;
    }
    if ($lastMaintenance < $dateAcquired) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Last maintenance cannot be before the acquisition date.']);
        exit;
    }

    if (!in_array($data['status'], ['Operational', 'Under Repair', 'Damaged', 'Missing', 'Decommissioned'], true)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid equipment status.']);
        exit;
    }
    if (!in_array($data['condition'], ['New', 'Good', 'Fair', 'Poor'], true)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid equipment condition.']);
        exit;
    }

    return [
        ':name' => $data['name'],
        ':category' => $data['category'],
        ':location' => $data['location'],
        ':serial_number' => $data['serial'],
        ':status' => $data['status'],
        ':condition_status' => $data['condition'],
        ':date_acquired' => $data['dateAcquired'],
        ':last_maintenance' => $data['lastMaintenance'],
        ':notes' => $data['notes'] ?? '',
    ];
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    requireAdmin();
    if (trim((string)($data['id'] ?? '')) === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'The id field is required.']);
        exit;
    }
    $fields = equipmentData($data);

    try {
        $stmt = $pdo->prepare(
            'INSERT INTO equipment
                (equipment_code, name, category, location, serial_number, status, condition_status, date_acquired, last_maintenance, notes, created_by_user_id, updated_by_user_id)
             VALUES
                (:equipment_code, :name, :category, :location, :serial_number, :status, :condition_status, :date_acquired, :last_maintenance, :notes, :user_id, :user_id)'
        );
        $stmt->execute(array_merge([':equipment_code' => $data['id'], ':user_id' => currentUserId()], $fields));

        $id = (int)$pdo->lastInsertId();
        $stmt = $pdo->prepare('SELECT * FROM equipment WHERE id = :id AND deleted_at IS NULL');
        $stmt->execute([':id' => $id]);
        $created = $stmt->fetch();
        writeAudit($pdo, 'create', 'equipment', $data['id'], ['current' => equipmentAuditPayload($created)]);

        echo json_encode(['success' => true, 'data' => equipmentPayload($created)]);
    } catch (PDOException $e) {
        if ($e->errorInfo[1] === 1062) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'The equipment tag or serial number is already registered at this location.']);
            exit;
        }
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Unable to add equipment.', 'error' => $e->getMessage()]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    requireAdmin();
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $code = trim((string)($data['id'] ?? ''));
    if ($code === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'The id field is required.']);
        exit;
    }
    $fields = equipmentData($data);
    $fields[':equipment_code'] = $code;

    try {
        $stmt = $pdo->prepare('SELECT * FROM equipment WHERE equipment_code = :equipment_code AND deleted_at IS NULL');
        $stmt->execute([':equipment_code' => $code]);
        $previous = $stmt->fetch();
        if (!$previous) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Equipment not found.']);
            exit;
        }
        $stmt = $pdo->prepare(
            'UPDATE equipment SET name = :name, category = :category, location = :location,
                serial_number = :serial_number, status = :status, condition_status = :condition_status,
                date_acquired = :date_acquired, last_maintenance = :last_maintenance, notes = :notes,
                updated_by_user_id = :user_id
             WHERE equipment_code = :equipment_code'
        );
        $fields[':user_id'] = currentUserId();
        $stmt->execute($fields);
        $stmt = $pdo->prepare('SELECT * FROM equipment WHERE equipment_code = :equipment_code AND deleted_at IS NULL');
        $stmt->execute([':equipment_code' => $code]);
        $row = $stmt->fetch();
        if (!$row) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Equipment not found.']);
            exit;
        }
        writeAudit($pdo, 'update', 'equipment', $code, ['previous' => equipmentAuditPayload($previous), 'current' => equipmentAuditPayload($row)]);
        echo json_encode(['success' => true, 'data' => equipmentPayload($row)]);
    } catch (PDOException $e) {
        if ($e->errorInfo[1] === 1062) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'The serial number is already registered at this location.']);
            exit;
        }
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Unable to update equipment.', 'error' => $e->getMessage()]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    requireAdmin();
    $code = trim((string)($_GET['id'] ?? ''));
    if ($code === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'The id query parameter is required.']);
        exit;
    }

    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare('SELECT id FROM equipment WHERE equipment_code = :equipment_code AND deleted_at IS NULL');
        $stmt->execute([':equipment_code' => $code]);
        $equipmentId = $stmt->fetchColumn();
        if (!$equipmentId) {
            $pdo->rollBack();
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Equipment not found.']);
            exit;
        }
        $stmt = $pdo->prepare('SELECT * FROM equipment WHERE id = :id');
        $stmt->execute([':id' => $equipmentId]);
        $previous = $stmt->fetch();
        $stmt = $pdo->prepare('UPDATE incidents SET deleted_at = NOW(), deleted_by_user_id = :user_id WHERE equipment_id = :equipment_id AND deleted_at IS NULL');
        $stmt->execute([':equipment_id' => $equipmentId, ':user_id' => currentUserId()]);
        $stmt = $pdo->prepare('UPDATE equipment SET deleted_at = NOW(), deleted_by_user_id = :user_id WHERE id = :id');
        $stmt->execute([':id' => $equipmentId, ':user_id' => currentUserId()]);
        writeAudit($pdo, 'delete', 'equipment', $code, ['previous' => equipmentAuditPayload($previous), 'linked_incidents_soft_deleted' => true]);
        $pdo->commit();
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Unable to delete equipment.', 'error' => $e->getMessage()]);
    }
    exit;
}

$stmt = $pdo->query('SELECT * FROM equipment WHERE deleted_at IS NULL ORDER BY id ASC');
$equipment = array_map('equipmentPayload', $stmt->fetchAll());

echo json_encode([
    'success' => true,
    'data' => $equipment,
]);
