<?php
require __DIR__ . '/config.php';

header('Content-Type: application/json');

function catalogTable(string $type): string
{
    if ($type === 'category') return 'equipment_categories';
    if ($type === 'location') return 'equipment_locations';
    jsonResponse(['success' => false, 'message' => 'Invalid catalog type.'], 400);
}

function catalogInputString(array $data, string $field, int $maximumLength, bool $required = true): string
{
    $value = $data[$field] ?? '';
    if (!is_string($value) && !is_numeric($value)) {
        jsonResponse(['success' => false, 'message' => "The {$field} field is invalid."], 400);
    }
    $value = trim((string)$value);
    if (($required && $value === '') || strlen($value) > $maximumLength) {
        jsonResponse(['success' => false, 'message' => "The {$field} field is invalid."], 400);
    }
    if (preg_match('/[\x00-\x1F\x7F]/', $value)) {
        jsonResponse(['success' => false, 'message' => "The {$field} field contains unsupported characters."], 400);
    }
    return $value;
}

function catalogNumericId(mixed $value): int
{
    if (!is_int($value) && !is_string($value)) {
        return 0;
    }
    $value = trim((string)$value);
    if (!preg_match('/^[1-9][0-9]*$/', $value)) {
        return 0;
    }
    $id = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    return $id === false ? 0 : (int)$id;
}

function suggestedTagPrefix(string $categoryName): string
{
    $words = preg_split('/[^A-Za-z0-9]+/', strtoupper(trim($categoryName)), -1, PREG_SPLIT_NO_EMPTY) ?: [];
    if (count($words) > 1) {
        return substr(implode('', array_map(static fn($word) => $word[0], $words)), 0, 12);
    }
    return substr($words[0] ?? 'EQ', 0, 2);
}

function categorySettings(array $data, string $categoryName = ''): array
{
    $modeWasProvided = array_key_exists('tagIdMode', $data);
    $mode = strtolower(catalogInputString($data + ['tagIdMode' => 'automatic'], 'tagIdMode', 20));
    if ($mode === 'auto') $mode = 'automatic';
    if (!in_array($mode, ['automatic', 'manual'], true)) {
        jsonResponse(['success' => false, 'message' => 'Tag ID mode must be automatic or manual.'], 400);
    }

    if ($mode === 'manual') {
        return ['mode' => 'manual', 'prefix' => null, 'sequence' => null];
    }

    $prefix = strtoupper(catalogInputString($data, 'tagPrefix', 12, false));
    $sequence = catalogInputString($data, 'tagSequence', 6, false);
    // Compatibility for a page that was already open before category tag
    // controls were deployed. The refreshed UI always sends explicit values.
    if (!$modeWasProvided) {
        if ($prefix === '') $prefix = suggestedTagPrefix($categoryName);
        if ($sequence === '') $sequence = '01';
    }
    if (!preg_match('/^[A-Z0-9]{1,12}$/', $prefix)) {
        jsonResponse(['success' => false, 'message' => 'Automatic tag prefixes must contain 1 to 12 letters or numbers.'], 400);
    }
    if (!preg_match('/^[0-9]{1,6}$/', $sequence)) {
        jsonResponse(['success' => false, 'message' => 'Tag sequences must contain 1 to 6 numbers, such as 01.'], 400);
    }

    return ['mode' => 'automatic', 'prefix' => $prefix, 'sequence' => $sequence];
}

function ensureUniqueAutomaticTagSeries(PDO $pdo, array $settings, int $excludeId = 0): void
{
    if ($settings['mode'] !== 'automatic') return;
    $stmt = $pdo->prepare(
        'SELECT id, name FROM equipment_categories
         WHERE tag_id_mode = :mode AND tag_prefix = :prefix AND tag_sequence = :sequence
           AND deleted_at IS NULL AND id <> :id
         LIMIT 1 FOR UPDATE'
    );
    $stmt->execute([
        ':mode' => 'automatic',
        ':prefix' => $settings['prefix'],
        ':sequence' => $settings['sequence'],
        ':id' => $excludeId,
    ]);
    $existing = $stmt->fetch();
    if ($existing) {
        jsonResponse([
            'success' => false,
            'message' => "That prefix and sequence are already assigned to {$existing['name']}.",
        ], 409);
    }
}

$method = requireRequestMethod(['GET', 'POST', 'PUT', 'DELETE']);
$userId = requireAuthenticatedUser($method === 'GET' ? ['admin', 'faculty'] : ['admin']);
if ($method !== 'GET') {
    requireCsrfToken();
}

if ($method === 'GET') {
    try {
        $categories = $pdo->query(
            'SELECT id, name, tag_id_mode AS tagIdMode, tag_prefix AS tagPrefix,
                    tag_sequence AS tagSequence, is_builtin AS isBuiltin
             FROM equipment_categories
             WHERE deleted_at IS NULL
             ORDER BY is_builtin DESC, name ASC'
        )->fetchAll();
        $locations = $pdo->query(
            'SELECT id, name, is_builtin AS isBuiltin
             FROM equipment_locations
             WHERE deleted_at IS NULL
             ORDER BY is_builtin DESC, name ASC'
        )->fetchAll();
        jsonResponse(['success' => true, 'categories' => $categories, 'locations' => $locations]);
    } catch (Throwable $e) {
        error_log('Catalog lookup failed: ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => 'Unable to load equipment catalogs.'], 500);
    }
}

$data = in_array($method, ['POST', 'PUT'], true) ? readJsonBody(16384) : [];
$rawType = $data['type'] ?? $_GET['type'] ?? '';
if (!is_string($rawType)) {
    jsonResponse(['success' => false, 'message' => 'Invalid catalog type.'], 400);
}
$type = trim($rawType);

if ($method === 'PUT' && $type === 'tag-mode') {
    $automatic = $data['automatic'] ?? null;
    if (!is_bool($automatic)) {
        jsonResponse(['success' => false, 'message' => 'The automatic Tag ID setting is invalid.'], 400);
    }
    try {
        $pdo->beginTransaction();
        $mode = $automatic ? 'automatic' : 'manual';
        if ($automatic) {
            $categories = $pdo->query(
                'SELECT id, name, tag_prefix, tag_sequence
                 FROM equipment_categories
                 WHERE deleted_at IS NULL
                 ORDER BY id
                 FOR UPDATE'
            )->fetchAll();
            $usedSeries = [];
            $update = $pdo->prepare(
                'UPDATE equipment_categories
                 SET tag_id_mode = :mode, tag_prefix = :prefix, tag_sequence = :sequence
                 WHERE id = :id'
            );
            foreach ($categories as $category) {
                $prefix = strtoupper(trim((string)($category['tag_prefix'] ?? '')));
                if (!preg_match('/^[A-Z0-9]{1,12}$/D', $prefix)) {
                    $prefix = suggestedTagPrefix((string)$category['name']);
                }
                $sequence = trim((string)($category['tag_sequence'] ?? ''));
                if (!preg_match('/^[0-9]{1,6}$/D', $sequence)) {
                    $sequence = '01';
                }
                $width = max(2, strlen($sequence));
                while (isset($usedSeries[$prefix . ':' . $sequence])) {
                    $next = (int)$sequence + 1;
                    if ($next > 999999) {
                        throw new RuntimeException('No available automatic Tag ID sequence remains.');
                    }
                    $sequence = str_pad((string)$next, $width, '0', STR_PAD_LEFT);
                }
                $usedSeries[$prefix . ':' . $sequence] = true;
                $update->execute([
                    ':mode' => 'automatic',
                    ':prefix' => $prefix,
                    ':sequence' => $sequence,
                    ':id' => (int)$category['id'],
                ]);
            }
        } else {
            $stmt = $pdo->prepare(
                'UPDATE equipment_categories
                 SET tag_id_mode = :mode
                 WHERE deleted_at IS NULL'
            );
            $stmt->execute([':mode' => 'manual']);
        }
        writeAudit($pdo, 'update', 'tag-mode', 'all', [
            'current' => ['tag_id_mode' => $mode],
        ]);
        $pdo->commit();
        jsonResponse(['success' => true, 'automatic' => $automatic]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log('Master catalog tag mode update failed: ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => 'Unable to save the automatic Tag ID setting. No records were changed.'], 500);
    }
}

$table = catalogTable($type);

if ($method === 'POST') {
    $maximumLength = $type === 'category' ? 100 : 150;
    $name = catalogInputString($data, 'name', $maximumLength);
    $settings = $type === 'category' ? categorySettings($data, $name) : null;
    try {
        $pdo->beginTransaction();
        if ($settings) ensureUniqueAutomaticTagSeries($pdo, $settings);
        $stmt = $pdo->prepare("SELECT id, deleted_at FROM {$table} WHERE name = :name LIMIT 1 FOR UPDATE");
        $stmt->execute([':name' => $name]);
        $existing = $stmt->fetch();
        if ($existing && $existing['deleted_at'] === null) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => 'That option already exists.'], 409);
        }
        if ($existing) {
            if ($type === 'category') {
                $stmt = $pdo->prepare(
                    "UPDATE {$table}
                     SET deleted_at = NULL, tag_id_mode = :mode, tag_prefix = :prefix,
                         tag_sequence = :sequence, created_by_user_id = :user_id
                     WHERE id = :id"
                );
                $stmt->execute([
                    ':mode' => $settings['mode'],
                    ':prefix' => $settings['prefix'],
                    ':sequence' => $settings['sequence'],
                    ':user_id' => $userId,
                    ':id' => $existing['id'],
                ]);
            } else {
                $stmt = $pdo->prepare("UPDATE {$table} SET deleted_at = NULL, created_by_user_id = :user_id WHERE id = :id");
                $stmt->execute([':user_id' => $userId, ':id' => $existing['id']]);
            }
            $id = (int)$existing['id'];
        } else {
            if ($type === 'category') {
                $stmt = $pdo->prepare(
                    "INSERT INTO {$table}
                        (name, tag_id_mode, tag_prefix, tag_sequence, is_builtin, created_by_user_id)
                     VALUES (:name, :mode, :prefix, :sequence, 0, :user_id)"
                );
                $stmt->execute([
                    ':name' => $name,
                    ':mode' => $settings['mode'],
                    ':prefix' => $settings['prefix'],
                    ':sequence' => $settings['sequence'],
                    ':user_id' => $userId,
                ]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO {$table} (name, is_builtin, created_by_user_id) VALUES (:name, 0, :user_id)");
                $stmt->execute([':name' => $name, ':user_id' => $userId]);
            }
            $id = (int)$pdo->lastInsertId();
        }
        $current = ['name' => $name];
        if ($settings) {
            $current += [
                'tag_id_mode' => $settings['mode'],
                'tag_prefix' => $settings['prefix'],
                'tag_sequence' => $settings['sequence'],
            ];
        }
        writeAudit($pdo, 'create', $type, (string)$id, ['current' => $current]);
        $pdo->commit();
        jsonResponse(['success' => true, 'id' => $id, 'name' => $name] + ($settings ? [
            'tagIdMode' => $settings['mode'],
            'tagPrefix' => $settings['prefix'],
            'tagSequence' => $settings['sequence'],
        ] : []), 201);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log('Catalog option creation failed: ' . $e->getMessage());
        if ($e instanceof PDOException && ($e->errorInfo[1] ?? null) === 1062) {
            jsonResponse(['success' => false, 'message' => 'That option already exists.'], 409);
        }
        jsonResponse(['success' => false, 'message' => 'Unable to save that option. No records were changed.'], 500);
    }
}

if ($method === 'PUT') {
    if ($type !== 'category') {
        jsonResponse(['success' => false, 'message' => 'Only category tag settings can be edited.'], 405);
    }
    $id = catalogNumericId($data['id'] ?? $_GET['id'] ?? null);
    if ($id < 1) {
        jsonResponse(['success' => false, 'message' => 'A valid category ID is required.'], 400);
    }

    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare(
            'SELECT *
             FROM equipment_categories
             WHERE id = :id AND deleted_at IS NULL
             FOR UPDATE'
        );
        $stmt->execute([':id' => $id]);
        $previous = $stmt->fetch();
        if (!$previous) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => 'Category not found.'], 404);
        }

        $settings = categorySettings($data, (string)$previous['name']);
        $previousSettings = [
            'mode' => $previous['tag_id_mode'],
            'prefix' => $previous['tag_prefix'],
            'sequence' => $previous['tag_sequence'],
        ];
        if ($previousSettings === $settings) {
            $pdo->rollBack();
            jsonResponse([
                'success' => true,
                'unchanged' => true,
                'message' => 'No category changes to save.',
            ]);
        }
        ensureUniqueAutomaticTagSeries($pdo, $settings, $id);
        $stmt = $pdo->prepare(
            'UPDATE equipment_categories
             SET tag_id_mode = :mode, tag_prefix = :prefix, tag_sequence = :sequence
             WHERE id = :id AND deleted_at IS NULL'
        );
        $stmt->execute([
            ':mode' => $settings['mode'],
            ':prefix' => $settings['prefix'],
            ':sequence' => $settings['sequence'],
            ':id' => $id,
        ]);
        writeAudit($pdo, 'update', 'category', (string)$id, [
            'previous' => [
                'name' => $previous['name'],
                'tag_id_mode' => $previous['tag_id_mode'],
                'tag_prefix' => $previous['tag_prefix'],
                'tag_sequence' => $previous['tag_sequence'],
            ],
            'current' => [
                'name' => $previous['name'],
                'tag_id_mode' => $settings['mode'],
                'tag_prefix' => $settings['prefix'],
                'tag_sequence' => $settings['sequence'],
            ],
        ]);
        $pdo->commit();
        jsonResponse(['success' => true]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log('Catalog category update failed: ' . $e->getMessage());
        if ($e instanceof PDOException && ($e->errorInfo[1] ?? null) === 1062) {
            jsonResponse(['success' => false, 'message' => 'Those tag settings are already in use.'], 409);
        }
        jsonResponse(['success' => false, 'message' => 'Unable to update the category. No records were changed.'], 500);
    }
}

if ($method === 'DELETE') {
    $id = catalogNumericId($_GET['id'] ?? null);
    if ($id < 1) {
        jsonResponse(['success' => false, 'message' => 'A valid catalog option ID is required.'], 400);
    }

    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare("SELECT * FROM {$table} WHERE id = :id AND deleted_at IS NULL FOR UPDATE");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        if (!$row) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => 'Option not found.'], 404);
        }
        if ((int)$row['is_builtin'] === 1) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => 'Built-in options cannot be removed.'], 400);
        }
        $column = $type === 'category' ? 'category' : 'location';
        $used = $pdo->prepare("SELECT COUNT(*) FROM equipment WHERE {$column} = :name AND deleted_at IS NULL");
        $used->execute([':name' => $row['name']]);
        if ((int)$used->fetchColumn() > 0) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => 'This option is in use by equipment and cannot be removed.'], 409);
        }
        $stmt = $pdo->prepare("UPDATE {$table} SET deleted_at = NOW() WHERE id = :id AND deleted_at IS NULL");
        $stmt->execute([':id' => $id]);
        if ($stmt->rowCount() !== 1) {
            throw new RuntimeException('Catalog option was not removed.');
        }
        writeAudit($pdo, 'delete', $type, (string)$id, ['previous' => ['name' => $row['name']]]);
        $pdo->commit();
        jsonResponse(['success' => true]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log('Catalog option delete failed: ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => 'Unable to remove the option. No records were changed.'], 500);
    }
}
