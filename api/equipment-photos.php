<?php
require __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

const EQUIPMENT_PHOTO_MAX_BYTES = 5242880;

function photoEquipmentCode(): string
{
    $value = $_GET['equipment'] ?? $_POST['equipment'] ?? '';
    if (!is_string($value) && !is_numeric($value)) {
        jsonResponse(['success' => false, 'message' => 'A valid equipment ID is required.'], 400);
    }
    $value = trim((string)$value);
    if ($value === '' || strlen($value) > 50 || !preg_match('/^[A-Za-z0-9][A-Za-z0-9._-]*$/', $value)) {
        jsonResponse(['success' => false, 'message' => 'A valid equipment ID is required.'], 400);
    }
    return $value;
}

function photoDirectory(): string
{
    $directory = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'equipment';
    if (!is_dir($directory) && !mkdir($directory, 0750, true) && !is_dir($directory)) {
        throw new RuntimeException('Photo storage is unavailable.');
    }
    return $directory;
}

function photoPayload(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'name' => $row['original_name'],
        'mimeType' => $row['mime_type'],
        'size' => (int)$row['file_size'],
        'createdAt' => $row['created_at'],
        'url' => 'api/equipment-photo.php?id=' . (int)$row['id'],
    ];
}

function photoOriginalName(mixed $value): string
{
    $value = basename(trim((string)$value));
    if ($value === '' || strlen($value) > 255 || preg_match('/[\x00-\x1F\x7F]/', $value)) {
        return 'photo';
    }
    return $value;
}

$method = requireRequestMethod(['GET', 'POST', 'DELETE']);
$userId = requireAuthenticatedUser($method === 'GET' ? ['admin', 'faculty'] : ['admin']);
if ($method !== 'GET') {
    requireCsrfToken();
}

$equipmentCode = photoEquipmentCode();
$stmt = $pdo->prepare('SELECT id, equipment_code FROM equipment WHERE equipment_code = :code AND deleted_at IS NULL');
$stmt->execute([':code' => $equipmentCode]);
$equipment = $stmt->fetch();
if (!$equipment) {
    jsonResponse(['success' => false, 'message' => 'Equipment not found.'], 404);
}

if ($method === 'GET') {
    try {
        $stmt = $pdo->prepare(
            'SELECT id, original_name, mime_type, file_size, created_at
             FROM equipment_photos
             WHERE equipment_id = :equipment_id
             ORDER BY created_at DESC, id DESC'
        );
        $stmt->execute([':equipment_id' => (int)$equipment['id']]);
        jsonResponse(['success' => true, 'photos' => array_map('photoPayload', $stmt->fetchAll())]);
    } catch (Throwable $e) {
        error_log('Equipment photo lookup failed: ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => 'Unable to load equipment photos.'], 500);
    }
}

if ($method === 'DELETE') {
    $photoId = filter_var($_GET['id'] ?? 0, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if (!$photoId) {
        jsonResponse(['success' => false, 'message' => 'A valid photo ID is required.'], 400);
    }
    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare(
            'SELECT id, original_name, stored_name
             FROM equipment_photos
             WHERE id = :id AND equipment_id = :equipment_id
             FOR UPDATE'
        );
        $stmt->execute([':id' => $photoId, ':equipment_id' => (int)$equipment['id']]);
        $photo = $stmt->fetch();
        if (!$photo) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => 'Photo not found.'], 404);
        }
        $stmt = $pdo->prepare('DELETE FROM equipment_photos WHERE id = :id AND equipment_id = :equipment_id');
        $stmt->execute([':id' => $photoId, ':equipment_id' => (int)$equipment['id']]);
        writeAudit($pdo, 'delete', 'equipment_photo', (string)$photoId, [
            'equipment_code' => $equipmentCode,
            'name' => $photo['original_name'],
        ]);
        $pdo->commit();

        $path = photoDirectory() . DIRECTORY_SEPARATOR . $photo['stored_name'];
        if (is_file($path) && !unlink($path)) {
            error_log('Equipment photo file could not be deleted: ' . $path);
        }
        jsonResponse(['success' => true]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log('Equipment photo deletion failed: ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => 'Unable to remove the equipment photo.'], 500);
    }
}

if (!isset($_FILES['photo']) || !is_array($_FILES['photo'])) {
    jsonResponse(['success' => false, 'message' => 'Choose an image to attach.'], 400);
}
$file = $_FILES['photo'];
if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    jsonResponse(['success' => false, 'message' => 'The photo upload failed.'], 400);
}
if ((int)$file['size'] <= 0 || (int)$file['size'] > EQUIPMENT_PHOTO_MAX_BYTES) {
    jsonResponse(['success' => false, 'message' => 'Photos must be smaller than 5 MB.'], 413);
}
$info = @getimagesize((string)$file['tmp_name']);
$mime = is_array($info) ? (string)($info['mime'] ?? '') : '';
$extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
if (!isset($extensions[$mime])) {
    jsonResponse(['success' => false, 'message' => 'Attach a JPG, PNG, or WebP image.'], 400);
}

$path = null;
try {
    $storedName = bin2hex(random_bytes(24)) . '.' . $extensions[$mime];
    $path = photoDirectory() . DIRECTORY_SEPARATOR . $storedName;
    if (!move_uploaded_file((string)$file['tmp_name'], $path)) {
        throw new RuntimeException('The uploaded photo could not be stored.');
    }

    $originalName = photoOriginalName($file['name'] ?? 'photo');
    $pdo->beginTransaction();
    $stmt = $pdo->prepare(
        'INSERT INTO equipment_photos
            (equipment_id, original_name, stored_name, mime_type, file_size, created_by_user_id)
         VALUES (:equipment_id, :original_name, :stored_name, :mime_type, :file_size, :user_id)'
    );
    $stmt->execute([
        ':equipment_id' => (int)$equipment['id'],
        ':original_name' => $originalName,
        ':stored_name' => $storedName,
        ':mime_type' => $mime,
        ':file_size' => (int)$file['size'],
        ':user_id' => $userId,
    ]);
    $photoId = (int)$pdo->lastInsertId();
    writeAudit($pdo, 'create', 'equipment_photo', (string)$photoId, [
        'equipment_code' => $equipmentCode,
        'name' => $originalName,
        'mime_type' => $mime,
        'file_size' => (int)$file['size'],
    ]);
    $stmt = $pdo->prepare(
        'SELECT id, original_name, mime_type, file_size, created_at
         FROM equipment_photos
         WHERE id = :id'
    );
    $stmt->execute([':id' => $photoId]);
    $created = $stmt->fetch();
    if (!$created) {
        throw new RuntimeException('The attached photo could not be reloaded.');
    }
    $pdo->commit();
    jsonResponse(['success' => true, 'photo' => photoPayload($created)], 201);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if (is_string($path) && is_file($path)) {
        unlink($path);
    }
    error_log('Equipment photo upload failed: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Unable to attach the photo.'], 500);
}
