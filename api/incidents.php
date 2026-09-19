<?php
require __DIR__ . '/config.php';

header('Content-Type: application/json');

function incidentPayload(array $row): array
{
    return [
        'id' => 'INC-' . str_pad((string)$row['id'], 4, '0', STR_PAD_LEFT),
        'equipmentId' => $row['equipment_code'],
        'reportedByUserId' => $row['reported_by_user_id'] !== null ? (string)$row['reported_by_user_id'] : null,
        'reportedByName' => $row['reported_by_name'],
        'reportedByCourse' => $row['reported_by_course'],
        'dateReported' => $row['date_reported'],
        'category' => $row['category'],
        'description' => $row['description'],
        'status' => $row['status'],
        'priority' => $row['priority'],
        'remarks' => $row['remarks'] ?? '',
        'resolvedDate' => $row['resolved_date'],
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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    session_start();
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'You must be logged in to submit an incident report.']);
        exit;
    }
    $required = ['equipmentId', 'reportedByName', 'dateReported', 'category', 'description'];

    foreach ($required as $field) {
        if (trim((string)($data[$field] ?? '')) === '') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => "The {$field} field is required."]);
            exit;
        }
    }

    $equipmentStmt = $pdo->prepare('SELECT id FROM equipment WHERE equipment_code = :equipment_code LIMIT 1');
    $equipmentStmt->execute([':equipment_code' => $data['equipmentId']]);
    $equipmentId = $equipmentStmt->fetchColumn();

    if (!$equipmentId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'The selected equipment was not found.']);
        exit;
    }

    $reportedByUserId = (int)$_SESSION['user_id'];

    try {
        $stmt = $pdo->prepare(
            'INSERT INTO incidents
                (equipment_id, reported_by_user_id, reported_by_name, reported_by_course, date_reported, category, description, status, priority, remarks, resolved_date)
             VALUES
                (:equipment_id, :reported_by_user_id, :reported_by_name, :reported_by_course, :date_reported, :category, :description, :status, :priority, :remarks, :resolved_date)'
        );
        $stmt->execute([
            ':equipment_id' => $equipmentId,
            ':reported_by_user_id' => $reportedByUserId,
            ':reported_by_name' => $data['reportedByName'],
            ':reported_by_course' => trim((string)($data['reportedByCourse'] ?? '')) ?: null,
            ':date_reported' => $data['dateReported'],
            ':category' => $data['category'],
            ':description' => $data['description'],
            ':status' => 'Pending',
            ':priority' => 'Medium',
            ':remarks' => '',
            ':resolved_date' => null,
        ]);

        $incidentId = (int)$pdo->lastInsertId();
        $stmt = $pdo->prepare(
            'SELECT incidents.*, equipment.equipment_code
             FROM incidents
             JOIN equipment ON equipment.id = incidents.equipment_id
             WHERE incidents.id = :id'
        );
        $stmt->execute([':id' => $incidentId]);

        echo json_encode(['success' => true, 'data' => incidentPayload($stmt->fetch())]);
    } catch (PDOException $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Unable to submit incident report.', 'error' => $e->getMessage()]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    requireAdmin();
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $id = (int)preg_replace('/\D+/', '', (string)($data['id'] ?? ''));
    if ($id < 1) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'A valid incident id is required.']);
        exit;
    }

    $status = trim((string)($data['status'] ?? ''));
    $priority = trim((string)($data['priority'] ?? ''));
    if ($status === '' || $priority === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Status and priority are required.']);
        exit;
    }

    try {
        $stmt = $pdo->prepare(
            'UPDATE incidents SET status = :status, priority = :priority, remarks = :remarks, resolved_date = :resolved_date
             WHERE id = :id'
        );
        $stmt->execute([
            ':status' => $status,
            ':priority' => $priority,
            ':remarks' => $data['remarks'] ?? '',
            ':resolved_date' => in_array($status, ['Resolved', 'Rejected'], true) ? ($data['resolvedDate'] ?? date('Y-m-d')) : null,
            ':id' => $id,
        ]);
        $stmt = $pdo->prepare(
            'SELECT incidents.*, equipment.equipment_code
             FROM incidents JOIN equipment ON equipment.id = incidents.equipment_id
             WHERE incidents.id = :id'
        );
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        if (!$row) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Incident not found.']);
            exit;
        }
        echo json_encode(['success' => true, 'data' => incidentPayload($row)]);
    } catch (PDOException $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Unable to update incident.', 'error' => $e->getMessage()]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    requireAdmin();
    $id = (int)preg_replace('/\D+/', '', (string)($_GET['id'] ?? ''));
    if ($id < 1) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'A valid incident id is required.']);
        exit;
    }
    $stmt = $pdo->prepare('DELETE FROM incidents WHERE id = :id');
    $stmt->execute([':id' => $id]);
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Incident not found.']);
        exit;
    }
    echo json_encode(['success' => true]);
    exit;
}

$stmt = $pdo->query(
    'SELECT incidents.*, equipment.equipment_code
     FROM incidents
     JOIN equipment ON equipment.id = incidents.equipment_id
     ORDER BY incidents.id ASC'
);
$incidents = array_map('incidentPayload', $stmt->fetchAll());

echo json_encode([
    'success' => true,
    'data' => $incidents,
]);
