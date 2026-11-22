<?php
require __DIR__ . '/config.php';

requireAuthenticatedUser(['admin', 'faculty']);
$photoId = filter_var($_GET['id'] ?? 0, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
if (!$photoId) {
    http_response_code(400);
    exit;
}

$stmt = $pdo->prepare(
    'SELECT photos.stored_name, photos.mime_type, photos.original_name
     FROM equipment_photos AS photos
     JOIN equipment ON equipment.id = photos.equipment_id
     WHERE photos.id = :id AND equipment.deleted_at IS NULL'
);
$stmt->execute([':id' => $photoId]);
$photo = $stmt->fetch();
if (!$photo) {
    http_response_code(404);
    exit;
}

$path = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR
    . 'equipment' . DIRECTORY_SEPARATOR . basename((string)$photo['stored_name']);
if (!is_file($path)) {
    http_response_code(404);
    exit;
}

$downloadName = preg_replace('/[\x00-\x1F\x7F"\\\\]/', '', (string)$photo['original_name']) ?: 'photo';
header('Content-Type: ' . $photo['mime_type']);
header('Content-Length: ' . (string)filesize($path));
header('Content-Disposition: inline; filename="' . $downloadName . '"');
header('Cache-Control: private, no-store');
header('X-Content-Type-Options: nosniff');
readfile($path);
