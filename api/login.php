<?php
require __DIR__ . '/config.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true) ?? [];
$username = trim((string)($data['username'] ?? ''));
$password = (string)($data['password'] ?? '');

if ($username === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Username and password are required.']);
    exit;
}

$stmt = $pdo->prepare('SELECT * FROM users WHERE username = :username AND active = 1 AND deleted_at IS NULL LIMIT 1');
$stmt->execute([':username' => $username]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Invalid credentials.']);
    exit;
}

session_start();
$_SESSION['user_id'] = (int)$user['id'];
$_SESSION['username'] = $user['username'];
$_SESSION['role'] = $user['role'];
$_SESSION['name'] = $user['full_name'];

echo json_encode([
    'success' => true,
    'user' => [
        'id' => (int)$user['id'],
        'username' => $user['username'],
        'role' => $user['role'],
        'name' => $user['full_name'],
        'student_id' => $user['student_id'],
        'course' => $user['course'],
        'title' => $user['title'] ?? null,
        'initials' => $user['initials'] ?? null,
    ]
]);
