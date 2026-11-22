<?php
require __DIR__ . '/config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true) ?? [];
$fullName = trim((string)($data['fullName'] ?? ''));
$facultyId = trim((string)($data['facultyId'] ?? ''));
$department = trim((string)($data['department'] ?? ''));
$username = trim((string)($data['username'] ?? ''));
$password = (string)($data['password'] ?? '');
$confirmPassword = (string)($data['confirmPassword'] ?? '');

if ($fullName === '' || $facultyId === '' || $department === '' || $username === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'All registration fields are required.']);
    exit;
}
if (!preg_match('/^[A-Za-z0-9._-]{3,100}$/', $username)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Username must be 3-100 characters using only letters, numbers, dots, underscores, or hyphens.']);
    exit;
}
if (strlen($password) < 8) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters.']);
    exit;
}
if ($password !== $confirmPassword) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Passwords do not match.']);
    exit;
}

try {
    $stmt = $pdo->prepare('SELECT username, faculty_id FROM users WHERE username = :username OR faculty_id = :faculty_id LIMIT 1');
    $stmt->execute([':username' => $username, ':faculty_id' => $facultyId]);
    $existing = $stmt->fetch();
    if ($existing) {
        http_response_code(409);
        $message = strcasecmp((string)$existing['username'], $username) === 0 ? 'That username is already registered.' : 'That faculty ID is already registered.';
        echo json_encode(['success' => false, 'message' => $message]);
        exit;
    }

    $initials = strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $fullName), 0, 2));
    $stmt = $pdo->prepare(
        'INSERT INTO users (username, password_hash, role, full_name, initials, faculty_id, department, active)
         VALUES (:username, :password_hash, :role, :full_name, :initials, :faculty_id, :department, 1)'
    );
    $stmt->execute([
        ':username' => $username,
        ':password_hash' => password_hash($password, PASSWORD_DEFAULT),
        ':role' => 'faculty',
        ':full_name' => $fullName,
        ':initials' => $initials,
        ':faculty_id' => $facultyId,
        ':department' => $department,
    ]);
    $userId = (int)$pdo->lastInsertId();
    writeAudit($pdo, 'create', 'user', (string)$userId, ['current' => ['username' => $username, 'role' => 'faculty', 'full_name' => $fullName, 'faculty_id' => $facultyId, 'department' => $department]]);

    echo json_encode(['success' => true, 'message' => 'Faculty account created.']);
} catch (PDOException $e) {
    if (($e->errorInfo[1] ?? null) === 1062) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'That username or faculty ID is already registered.']);
        exit;
    }
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Unable to create the account.']);
}
