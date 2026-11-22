<?php
include 'config.php';
require_once __DIR__ . '/google-auth-config.php';

header('Content-Type: application/json');
if (($_SESSION['role'] ?? null) !== 'superadmin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Superadmin access is required.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim((string)($_POST['name'] ?? ''));
    $email = strtolower(trim((string)($_POST['email'] ?? '')));
    if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || !hash_equals(GOOGLE_ADMIN_EMAIL, $email)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'The supplied email is not authorized for administrator access.']);
        exit;
    }
    $username = 'admin.' . strtolower((string)strtok($email, '@'));
    $stmt = $pdo->prepare(
        "INSERT INTO users(username, email, role, full_name, title, initials, active)
         VALUES(:username, :email, 'admin', :full_name, 'ICT Administrator', :initials, 1)"
    );
    try {
        $stmt->execute([
            ':username' => $username,
            ':email' => $email,
            ':full_name' => $name,
            ':initials' => strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $name), 0, 2)),
        ]);
        echo json_encode(['success' => true, 'message' => 'Administrator created.']);
    } catch (PDOException $e) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'That administrator email or username is already registered.']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
?>
