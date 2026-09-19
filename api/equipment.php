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
                (equipment_code, name, category, location, serial_number, status, condition_status, date_acquired, last_maintenance, notes)
             VALUES
                (:equipment_code, :name, :category, :location, :serial_number, :status, :condition_status, :date_acquired, :last_maintenance, :notes)'
        );
        $stmt->execute(array_merge([':equipment_code' => $data['id']], $fields));

        $id = (int)$pdo->lastInsertId();
        $stmt = $pdo->prepare('SELECT * FROM equipment WHERE id = :id');
        $stmt->execute([':id' => $id]);

        echo json_encode(['success' => true, 'data' => equipmentPayload($stmt->fetch())]);
    } catch (PDOException $e) {
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
        $stmt = $pdo->prepare(
            'UPDATE equipment SET name = :name, category = :category, location = :location,
                serial_number = :serial_number, status = :status, condition_status = :condition_status,
                date_acquired = :date_acquired, last_maintenance = :last_maintenance, notes = :notes
             WHERE equipment_code = :equipment_code'
        );
        $stmt->execute($fields);
        $stmt = $pdo->prepare('SELECT * FROM equipment WHERE equipment_code = :equipment_code');
        $stmt->execute([':equipment_code' => $code]);
        $row = $stmt->fetch();
        if (!$row) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Equipment not found.']);
            exit;
        }
        echo json_encode(['success' => true, 'data' => equipmentPayload($row)]);
    } catch (PDOException $e) {
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
        $stmt = $pdo->prepare('SELECT id FROM equipment WHERE equipment_code = :equipment_code');
        $stmt->execute([':equipment_code' => $code]);
        $equipmentId = $stmt->fetchColumn();
        if (!$equipmentId) {
            $pdo->rollBack();
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Equipment not found.']);
            exit;
        }
        $stmt = $pdo->prepare('DELETE FROM incidents WHERE equipment_id = :equipment_id');
        $stmt->execute([':equipment_id' => $equipmentId]);
        $stmt = $pdo->prepare('DELETE FROM equipment WHERE id = :id');
        $stmt->execute([':id' => $equipmentId]);
        $pdo->commit();
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Unable to delete equipment.', 'error' => $e->getMessage()]);
    }
    exit;
}

$stmt = $pdo->query('SELECT * FROM equipment ORDER BY id ASC');
$equipment = array_map('equipmentPayload', $stmt->fetchAll());

echo json_encode([
    'success' => true,
    'data' => $equipment,
]);
