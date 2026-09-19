<?php
require __DIR__ . '/config.php';

header('Content-Type: application/json');

function incidentPayload(array $row): array
{
    return [
        'id' => 'INC-' . str_pad((string)$row['id'], 4, '0', STR_PAD_LEFT),
        'equipmentId' => $row['equipment_code'],
        'equipmentStatus' => $row['equipment_status'] ?? null,
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

function incidentAuditPayload(array $row): array
{
    return [
        'id' => 'INC-' . str_pad((string)$row['id'], 4, '0', STR_PAD_LEFT),
        'equipment_id' => $row['equipment_id'],
        'reported_by_user_id' => $row['reported_by_user_id'],
        'reported_by_name' => $row['reported_by_name'],
        'reported_by_course' => $row['reported_by_course'],
        'date_reported' => $row['date_reported'],
        'category' => $row['category'],
        'description' => $row['description'],
        'status' => $row['status'],
        'priority' => $row['priority'],
        'remarks' => $row['remarks'] ?? '',
        'resolved_date' => $row['resolved_date'],
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

    $dateReported = DateTime::createFromFormat('!Y-m-d', $data['dateReported']);
    if (!$dateReported || $dateReported->format('Y-m-d') !== $data['dateReported'] || $dateReported < new DateTime('2000-01-01') || $dateReported > new DateTime('today')) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Date noticed must be between 2000-01-01 and today.']);
        exit;
    }
    if (!in_array($data['category'], ['Damaged', 'Malfunctioning', 'Missing', 'Other'], true)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid incident category.']);
        exit;
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
                     (equipment_id, reported_by_user_id, reported_by_name, reported_by_course, date_reported, category, description, status, priority, remarks, resolved_date, created_by_user_id, updated_by_user_id)
             VALUES
                     (:equipment_id, :reported_by_user_id, :reported_by_name, :reported_by_course, :date_reported, :category, :description, :status, :priority, :remarks, :resolved_date, :user_id, :user_id)'
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
            ':user_id' => currentUserId(),
        ]);

        $incidentId = (int)$pdo->lastInsertId();
        $stmt = $pdo->prepare(
            'SELECT incidents.*, equipment.equipment_code
             FROM incidents
             JOIN equipment ON equipment.id = incidents.equipment_id
             WHERE incidents.id = :id AND incidents.deleted_at IS NULL'
        );
        $stmt->execute([':id' => $incidentId]);
        $created = $stmt->fetch();
        writeAudit($pdo, 'create', 'incident', 'INC-' . str_pad((string)$incidentId, 4, '0', STR_PAD_LEFT), ['current' => incidentAuditPayload($created)]);

        echo json_encode(['success' => true, 'data' => incidentPayload($created)]);
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
    if (!in_array($status, ['Pending', 'In Progress', 'Resolved', 'Rejected'], true) || !in_array($priority, ['Low', 'Medium', 'High', 'Critical'], true)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Status and priority are required.']);
        exit;
    }

    try {
        $stmt = $pdo->prepare('SELECT incidents.*, equipment.equipment_code, equipment.status AS equipment_status FROM incidents JOIN equipment ON equipment.id = incidents.equipment_id WHERE incidents.id = :id AND incidents.deleted_at IS NULL');
        $stmt->execute([':id' => $id]);
        $previous = $stmt->fetch();
        if (!$previous) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Incident not found.']);
            exit;
        }
        $equipmentStatus = null;
        if ($status === 'In Progress') {
            $equipmentStatus = 'Under Repair';
        } elseif (in_array($status, ['Resolved', 'Rejected'], true)) {
            $equipmentStatus = 'Operational';
        }
        $resolvedDate = $data['resolvedDate'] ?? null;
        if ($resolvedDate !== null) {
            $resolvedDateValue = DateTime::createFromFormat('!Y-m-d', $resolvedDate);
            if (!$resolvedDateValue || $resolvedDateValue->format('Y-m-d') !== $resolvedDate || $resolvedDateValue < new DateTime('2000-01-01') || $resolvedDateValue > new DateTime('today')) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Resolution date must be between 2000-01-01 and today.']);
                exit;
            }
        }
        $stmt = $pdo->prepare(
            'UPDATE incidents SET status = :status, priority = :priority, remarks = :remarks, resolved_date = :resolved_date, updated_by_user_id = :user_id
             WHERE id = :id'
        );
        $stmt->execute([
            ':status' => $status,
            ':priority' => $priority,
            ':remarks' => $data['remarks'] ?? '',
            ':resolved_date' => in_array($status, ['Resolved', 'Rejected'], true) ? ($resolvedDate ?? date('Y-m-d')) : null,
            ':id' => $id,
            ':user_id' => currentUserId(),
        ]);
        if ($equipmentStatus !== null && $equipmentStatus !== $previous['equipment_status']) {
            $equipmentUpdate = $pdo->prepare('UPDATE equipment SET status = :status, updated_by_user_id = :user_id WHERE id = :id AND deleted_at IS NULL');
            $equipmentUpdate->execute([':status' => $equipmentStatus, ':user_id' => currentUserId(), ':id' => $previous['equipment_id']]);
            writeAudit($pdo, 'update', 'equipment', $previous['equipment_code'], ['field' => 'status', 'previous' => $previous['equipment_status'], 'current' => $equipmentStatus, 'reason' => 'incident_status']);
        }
        $stmt = $pdo->prepare(
            'SELECT incidents.*, equipment.equipment_code, equipment.status AS equipment_status
             FROM incidents JOIN equipment ON equipment.id = incidents.equipment_id
             WHERE incidents.id = :id AND incidents.deleted_at IS NULL'
        );
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        if (!$row) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Incident not found.']);
            exit;
        }
        writeAudit($pdo, 'update', 'incident', 'INC-' . str_pad((string)$id, 4, '0', STR_PAD_LEFT), ['previous' => incidentAuditPayload($previous), 'current' => incidentAuditPayload($row)]);
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
    $stmt = $pdo->prepare('UPDATE incidents SET deleted_at = NOW(), deleted_by_user_id = :user_id WHERE id = :id AND deleted_at IS NULL');
    $stmt->execute([':id' => $id, ':user_id' => currentUserId()]);
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Incident not found.']);
        exit;
    }
    $stmt = $pdo->prepare('SELECT * FROM incidents WHERE id = :id');
    $stmt->execute([':id' => $id]);
    writeAudit($pdo, 'delete', 'incident', 'INC-' . str_pad((string)$id, 4, '0', STR_PAD_LEFT), ['previous' => incidentAuditPayload($stmt->fetch())]);
    echo json_encode(['success' => true]);
    exit;
}

$stmt = $pdo->query(
    'SELECT incidents.*, equipment.equipment_code, equipment.status AS equipment_status
     FROM incidents
     JOIN equipment ON equipment.id = incidents.equipment_id
    WHERE incidents.deleted_at IS NULL
    ORDER BY incidents.id ASC'
);
$incidents = array_map('incidentPayload', $stmt->fetchAll());

echo json_encode([
    'success' => true,
    'data' => $incidents,
]);
