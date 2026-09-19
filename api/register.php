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
$studentId = trim((string)($data['studentId'] ?? ''));
$course = trim((string)($data['course'] ?? ''));
$username = trim((string)($data['username'] ?? ''));
$password = (string)($data['password'] ?? '');
$confirmPassword = (string)($data['confirmPassword'] ?? '');

if ($fullName === '' || $studentId === '' || $course === '' || $username === '' || $password === '') {
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
    $stmt = $pdo->prepare('SELECT username, student_id FROM users WHERE username = :username OR student_id = :student_id LIMIT 1');
    $stmt->execute([':username' => $username, ':student_id' => $studentId]);
    $existing = $stmt->fetch();
    if ($existing) {
        http_response_code(409);
        $message = strcasecmp((string)$existing['username'], $username) === 0 ? 'That username is already registered.' : 'That student ID is already registered.';
        echo json_encode(['success' => false, 'message' => $message]);
        exit;
    }

    $initials = strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $fullName), 0, 2));
    $stmt = $pdo->prepare(
        'INSERT INTO users (username, password_hash, role, full_name, initials, student_id, course, active)
         VALUES (:username, :password_hash, :role, :full_name, :initials, :student_id, :course, 1)'
    );
    $stmt->execute([
        ':username' => $username,
        ':password_hash' => password_hash($password, PASSWORD_DEFAULT),
        ':role' => 'student',
        ':full_name' => $fullName,
        ':initials' => $initials,
        ':student_id' => $studentId,
        ':course' => $course,
    ]);
    $userId = (int)$pdo->lastInsertId();
    writeAudit($pdo, 'create', 'user', (string)$userId, ['current' => ['username' => $username, 'role' => 'student', 'full_name' => $fullName, 'student_id' => $studentId, 'course' => $course]]);

    echo json_encode(['success' => true, 'message' => 'Student account created.']);
} catch (PDOException $e) {
    if (($e->errorInfo[1] ?? null) === 1062) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'That username or student ID is already registered.']);
        exit;
    }
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Unable to create the account.']);
}
