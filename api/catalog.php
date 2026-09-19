<?php
require __DIR__ . '/config.php';

header('Content-Type: application/json');

function requireCatalogAdmin(): void
{
    session_start();
    if (($_SESSION['role'] ?? null) !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Administrator access is required.']);
        exit;
    }
}

function catalogTable(string $type): string
{
    if ($type === 'category') return 'equipment_categories';
    if ($type === 'location') return 'equipment_locations';
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid catalog type.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $categories = $pdo->query('SELECT id, name, is_builtin AS isBuiltin FROM equipment_categories WHERE deleted_at IS NULL ORDER BY is_builtin DESC, name ASC')->fetchAll();
    $locations = $pdo->query('SELECT id, name, is_builtin AS isBuiltin FROM equipment_locations WHERE deleted_at IS NULL ORDER BY is_builtin DESC, name ASC')->fetchAll();
    echo json_encode(['success' => true, 'categories' => $categories, 'locations' => $locations]);
    exit;
}

requireCatalogAdmin();
$data = json_decode(file_get_contents('php://input'), true) ?? [];
$type = (string)($data['type'] ?? $_GET['type'] ?? '');
$table = catalogTable($type);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim((string)($data['name'] ?? ''));
    if ($name === '' || strlen($name) > 150) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'A valid name is required.']);
        exit;
    }
    try {
        $stmt = $pdo->prepare("SELECT id, deleted_at FROM {$table} WHERE name = :name LIMIT 1");
        $stmt->execute([':name' => $name]);
        $existing = $stmt->fetch();
        if ($existing && $existing['deleted_at'] === null) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'That option already exists.']);
            exit;
        }
        if ($existing) {
            $stmt = $pdo->prepare("UPDATE {$table} SET deleted_at = NULL, created_by_user_id = :user_id WHERE id = :id");
            $stmt->execute([':user_id' => currentUserId(), ':id' => $existing['id']]);
            $id = (int)$existing['id'];
        } else {
            $stmt = $pdo->prepare("INSERT INTO {$table} (name, is_builtin, created_by_user_id) VALUES (:name, 0, :user_id)");
            $stmt->execute([':name' => $name, ':user_id' => currentUserId()]);
            $id = (int)$pdo->lastInsertId();
        }
        writeAudit($pdo, 'create', $type, (string)$id, ['current' => ['name' => $name]]);
        echo json_encode(['success' => true, 'id' => $id, 'name' => $name]);
    } catch (PDOException $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Unable to save that option.']);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = (int)($_GET['id'] ?? $data['id'] ?? 0);
    $stmt = $pdo->prepare("SELECT * FROM {$table} WHERE id = :id AND deleted_at IS NULL");
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    if (!$row) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Option not found.']);
        exit;
    }
    if ((int)$row['is_builtin'] === 1) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Built-in options cannot be removed.']);
        exit;
    }
    $column = $type === 'category' ? 'category' : 'location';
    $used = $pdo->prepare("SELECT COUNT(*) FROM equipment WHERE {$column} = :name AND deleted_at IS NULL");
    $used->execute([':name' => $row['name']]);
    if ((int)$used->fetchColumn() > 0) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'This option is in use by equipment and cannot be removed.']);
        exit;
    }
    $stmt = $pdo->prepare("UPDATE {$table} SET deleted_at = NOW() WHERE id = :id");
    $stmt->execute([':id' => $id]);
    writeAudit($pdo, 'delete', $type, (string)$id, ['previous' => ['name' => $row['name']]]);
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
