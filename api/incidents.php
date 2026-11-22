<?php
require __DIR__ . '/config.php';
require_once __DIR__ . '/incident-repair-form.php';

header('Content-Type: application/json');

function incidentRepairDate(string $value, string $label, bool $required = false): string
{
    $value = trim($value);
    if ($value === '' && !$required) {
        return '';
    }

    $format = preg_match('/^\d{2}\/\d{2}\/\d{4}$/D', $value) ? '!m/d/Y' : '!Y-m-d';
    $date = DateTimeImmutable::createFromFormat($format, $value);
    if (!$date || $date->format($format === '!m/d/Y' ? 'm/d/Y' : 'Y-m-d') !== $value
        || $date < new DateTimeImmutable('2000-01-01')
        || $date > new DateTimeImmutable('today')) {
        jsonResponse(['success' => false, 'message' => "{$label} must be a valid date between 01/01/2000 and today."], 400);
    }
    return $date->format('m/d/Y');
}

function incidentRepairFormInput(array $data): ?array
{
    if (!array_key_exists('repairForm', $data)) {
        return null;
    }
    if (!is_array($data['repairForm'])) {
        jsonResponse(['success' => false, 'message' => 'The request for repair form is invalid.'], 400);
    }

    $source = $data['repairForm'];
    $rules = incidentRepairTextRules();
    $form = ['formVersion' => '20260825-AMT-v1'];
    foreach ($rules as $field => [$maximumLength, $required]) {
        $form[$field] = incidentInputString($source, $field, $maximumLength, $required);
    }

    $form['requestDate'] = incidentRepairDate($form['requestDate'], 'Request date', true);
    foreach ([
        'approvalDate' => 'Approval date',
        'actionDate' => 'Action date',
        'attestedDate' => 'Attested date',
    ] as $field => $label) {
        $form[$field] = incidentRepairDate($form[$field], $label);
    }

    $booleanFields = incidentRepairBooleanFields();
    foreach ($booleanFields as $field) {
        $value = $source[$field] ?? false;
        if (!is_bool($value)) {
            jsonResponse(['success' => false, 'message' => "The {$field} selection is invalid."], 400);
        }
        $form[$field] = $value;
    }

    if (!$form['hardwareRepair'] && !$form['softwareEnhancement'] && !$form['maintenanceRepair']) {
        jsonResponse(['success' => false, 'message' => 'Select at least one requested service.'], 400);
    }
    if (incidentRepairSummary($form) === 'Request for repair form submitted.') {
        jsonResponse(['success' => false, 'message' => 'Describe the problem or requested software work.'], 400);
    }

    $json = json_encode($form, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    if (strlen($json) > 5000) {
        jsonResponse(['success' => false, 'message' => 'The request for repair form is too large.'], 413);
    }
    return $form;
}

function incidentPayload(array $row): array
{
    $repairForm = incidentRepairFormFromRow($row);
    return [
        'id' => 'INC-' . str_pad((string)$row['id'], 4, '0', STR_PAD_LEFT),
        'equipmentId' => $row['equipment_code'],
        'equipmentStatus' => $row['equipment_status'] ?? null,
        'reportedByUserId' => $row['reported_by_user_id'] !== null ? (string)$row['reported_by_user_id'] : null,
        'reportedByName' => $row['reported_by_name'],
        'reportedByDepartment' => $row['reported_by_department'],
        'dateReported' => $row['date_reported'],
        'category' => $repairForm ? incidentRepairCategory($repairForm) : $row['category'],
        'description' => $repairForm ? incidentRepairSummary($repairForm) : $row['description'],
        'repairForm' => $repairForm,
        'status' => $row['status'],
        'priority' => $row['priority'],
        'remarks' => $row['remarks'] ?? '',
        'resolvedDate' => $row['resolved_date'],
        'verificationStatus' => $row['repair_verification_status'] ?? 'Not Required',
        'verificationNotes' => $row['repair_verification_notes'] ?? '',
        'verifiedAt' => $row['repair_verified_at'] ?? null,
        'version' => incidentVersion($row),
    ];
}

/**
 * Return an opaque version for optimistic concurrency checks. Including the
 * editable values keeps the version reliable even when two writes occur in
 * the same one-second TIMESTAMP resolution window.
 */
function incidentVersion(array $row): string
{
    return hash('sha256', implode("\0", [
        (string)($row['id'] ?? ''),
        (string)($row['status'] ?? ''),
        (string)($row['priority'] ?? ''),
        (string)($row['remarks'] ?? ''),
        (string)($row['resolved_date'] ?? ''),
        (string)($row['repair_verification_status'] ?? ''),
        (string)($row['repair_verification_notes'] ?? ''),
        (string)($row['repair_verified_at'] ?? ''),
        (string)($row['updated_at'] ?? ''),
    ]));
}

function incidentAuditPayload(array $row): array
{
    $repairForm = incidentRepairFormFromRow($row);
    return [
        'id' => 'INC-' . str_pad((string)$row['id'], 4, '0', STR_PAD_LEFT),
        'equipment_id' => $row['equipment_id'],
        'reported_by_user_id' => $row['reported_by_user_id'],
        'reported_by_name' => $row['reported_by_name'],
        'reported_by_department' => $row['reported_by_department'],
        'date_reported' => $row['date_reported'],
        'category' => $repairForm ? incidentRepairCategory($repairForm) : $row['category'],
        'description' => $repairForm ? incidentRepairSummary($repairForm) : $row['description'],
        'repair_form' => $repairForm,
        'status' => $row['status'],
        'priority' => $row['priority'],
        'remarks' => $row['remarks'] ?? '',
        'resolved_date' => $row['resolved_date'],
        'repair_verification_status' => $row['repair_verification_status'] ?? 'Not Required',
        'repair_verification_notes' => $row['repair_verification_notes'] ?? '',
        'repair_verified_at' => $row['repair_verified_at'] ?? null,
    ];
}

function incidentInputString(array $data, string $field, int $maximumLength, bool $required = true): string
{
    $value = $data[$field] ?? '';
    if (!is_string($value) && !is_numeric($value)) {
        jsonResponse(['success' => false, 'message' => "The {$field} field is invalid."], 400);
    }

    $value = trim((string)$value);
    if (($required && $value === '') || strlen($value) > $maximumLength) {
        jsonResponse(['success' => false, 'message' => "The {$field} field is invalid."], 400);
    }
    if (preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $value)) {
        jsonResponse(['success' => false, 'message' => "The {$field} field contains unsupported characters."], 400);
    }
    return $value;
}

function incidentDate(string $value, string $label): DateTimeImmutable
{
    $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value);
    if (!$date || $date->format('Y-m-d') !== $value
        || $date < new DateTimeImmutable('2000-01-01')
        || $date > new DateTimeImmutable('today')) {
        jsonResponse(['success' => false, 'message' => "{$label} must be between 2000-01-01 and today."], 400);
    }
    return $date;
}

function incidentNumericId(mixed $value): int
{
    if (!is_string($value) && !is_int($value)) {
        return 0;
    }
    // Public IDs are deliberately zero-padded (for example INC-0004). Parse
    // the numeric part after removing padding while still rejecting zero,
    // signs, decimals, and mixed text.
    if (!preg_match('/^(?:INC-)?([0-9]+)$/i', trim((string)$value), $match)) {
        return 0;
    }
    $digits = ltrim($match[1], '0');
    if ($digits === '') {
        return 0;
    }
    $id = filter_var($digits, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    return $id === false ? 0 : (int)$id;
}

$method = requireRequestMethod(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
$allowedRoles = match ($method) {
    'PUT', 'DELETE' => ['admin'],
    'PATCH' => ['faculty'],
    default => ['admin', 'faculty'],
};
$userId = requireAuthenticatedUser($allowedRoles);
$role = (string)($_SESSION['role'] ?? '');

if ($method !== 'GET') {
    requireCsrfToken();
}

if ($method === 'POST') {
    $data = readJsonBody(32768);
    $equipmentCode = incidentInputString($data, 'equipmentId', 50);
    if (!preg_match('/^[A-Za-z0-9][A-Za-z0-9._-]*$/', $equipmentCode)) {
        jsonResponse(['success' => false, 'message' => 'The selected equipment code is invalid.'], 400);
    }
    $repairForm = incidentRepairFormInput($data);
    $repairFormJson = null;
    if ($repairForm !== null) {
        $requestDate = DateTimeImmutable::createFromFormat('!m/d/Y', $repairForm['requestDate']);
        $dateReportedText = $requestDate->format('Y-m-d');
        $category = incidentRepairCategory($repairForm);
        $description = incidentRepairSummary($repairForm);
        $repairFormJson = incidentRepairStorage($repairForm);
    } else {
        $dateReportedText = incidentInputString($data, 'dateReported', 10);
        incidentDate($dateReportedText, 'Date noticed');
        $category = incidentInputString($data, 'category', 100);
        if (!in_array($category, ['Damaged', 'Malfunctioning', 'Missing', 'Other'], true)) {
            jsonResponse(['success' => false, 'message' => 'Invalid incident category.'], 400);
        }
        $description = incidentInputString($data, 'description', 5000);
    }

    try {
        $pdo->beginTransaction();

        $reporterStmt = $pdo->prepare(
            'SELECT full_name, department
             FROM users
             WHERE id = :id AND active = 1 AND deleted_at IS NULL
             FOR UPDATE'
        );
        $reporterStmt->execute([':id' => $userId]);
        $reporter = $reporterStmt->fetch();
        if (!$reporter) {
            throw new RuntimeException('Authenticated reporter is no longer active.');
        }

        $equipmentStmt = $pdo->prepare(
            'SELECT id, status
             FROM equipment
             WHERE equipment_code = :equipment_code AND deleted_at IS NULL
             LIMIT 1 FOR UPDATE'
        );
        $equipmentStmt->execute([':equipment_code' => $equipmentCode]);
        $equipment = $equipmentStmt->fetch();
        if (!$equipment) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => 'The selected equipment was not found.'], 404);
        }
        if ($equipment['status'] === 'Condemned') {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => 'Condemned equipment cannot receive new incident reports.'], 409);
        }
        $equipmentId = (int)$equipment['id'];

        $stmt = $pdo->prepare(
            'INSERT INTO incidents
                    (equipment_id, reported_by_user_id, reported_by_name, reported_by_department,
                     date_reported, category, description, repair_form_json, status, priority, remarks, resolved_date,
                     created_by_user_id, updated_by_user_id)
             VALUES (:equipment_id, :reported_by_user_id, :reported_by_name, :reported_by_department,
                     :date_reported, :category, :description, :repair_form_json, :status, :priority, :remarks, :resolved_date,
                     :created_by_user_id, :updated_by_user_id)'
        );
        $stmt->execute([
            ':equipment_id' => (int)$equipmentId,
            ':reported_by_user_id' => $userId,
            ':reported_by_name' => $reporter['full_name'],
            ':reported_by_department' => $reporter['department'] ?: null,
            ':date_reported' => $dateReportedText,
            ':category' => $category,
            ':description' => $description,
            ':repair_form_json' => $repairFormJson,
            ':status' => 'Pending',
            ':priority' => 'Medium',
            ':remarks' => '',
            ':resolved_date' => null,
            ':created_by_user_id' => $userId,
            ':updated_by_user_id' => $userId,
        ]);

        $incidentId = (int)$pdo->lastInsertId();
        $stmt = $pdo->prepare(
            'SELECT incidents.*, equipment.equipment_code, equipment.status AS equipment_status
             FROM incidents
             JOIN equipment ON equipment.id = incidents.equipment_id
             WHERE incidents.id = :id AND incidents.deleted_at IS NULL'
        );
        $stmt->execute([':id' => $incidentId]);
        $created = $stmt->fetch();
        if (!$created) {
            throw new RuntimeException('Created incident could not be reloaded.');
        }

        writeAudit(
            $pdo,
            'create',
            'incident',
            'INC-' . str_pad((string)$incidentId, 4, '0', STR_PAD_LEFT),
            ['current' => incidentAuditPayload($created)]
        );
        $pdo->commit();

        jsonResponse(['success' => true, 'data' => incidentPayload($created)], 201);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log('Incident creation failed: ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => 'Unable to submit the incident report. No records were changed.'], 500);
    }
}

if ($method === 'PATCH') {
    $data = readJsonBody(16384);
    $id = incidentNumericId($data['id'] ?? null);
    if ($id < 1) {
        jsonResponse(['success' => false, 'message' => 'A valid incident ID is required.'], 400);
    }
    $action = incidentInputString($data, 'action', 40);
    if ($action !== 'verify-resolution') {
        jsonResponse(['success' => false, 'message' => 'The requested verification action is invalid.'], 400);
    }
    $accomplished = $data['accomplished'] ?? null;
    if (!is_bool($accomplished)) {
        jsonResponse(['success' => false, 'message' => 'Choose whether the repair was accomplished.'], 400);
    }
    $notes = incidentInputString($data, 'notes', 2000, false);
    if (!$accomplished && $notes === '') {
        jsonResponse(['success' => false, 'message' => 'Explain why the repair was not accomplished.'], 400);
    }
    $version = incidentInputString($data, 'version', 64);
    if (!preg_match('/^[a-f0-9]{64}$/', $version)) {
        jsonResponse(['success' => false, 'message' => 'The incident version is invalid. Refresh the report and try again.'], 400);
    }

    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare(
            'SELECT incidents.*, equipment.equipment_code, equipment.status AS equipment_status
             FROM incidents
             JOIN equipment ON equipment.id = incidents.equipment_id
             WHERE incidents.id = :id AND incidents.deleted_at IS NULL
             FOR UPDATE'
        );
        $stmt->execute([':id' => $id]);
        $previous = $stmt->fetch();
        if (!$previous) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => 'Incident not found.'], 404);
        }
        if ((int)($previous['reported_by_user_id'] ?? 0) !== $userId) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => 'Only the original submitter can verify this repair.'], 403);
        }
        if (!hash_equals(incidentVersion($previous), $version)) {
            $pdo->rollBack();
            jsonResponse([
                'success' => false,
                'message' => 'This incident was updated by another request. The latest values have been loaded; review them and try again.',
                'data' => incidentPayload($previous),
            ], 409);
        }
        if ((string)$previous['status'] !== 'Resolved'
            || (string)($previous['repair_verification_status'] ?? '') !== 'Awaiting Verification') {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => 'This repair is not awaiting verification.'], 409);
        }

        $nextStatus = $accomplished ? 'Resolved' : 'In Progress';
        $verificationStatus = $accomplished ? 'Verified' : 'Not Accomplished';
        $resolvedDate = $accomplished ? $previous['resolved_date'] : null;
        $update = $pdo->prepare(
            'UPDATE incidents
             SET status = :status, resolved_date = :resolved_date,
                 repair_verification_status = :verification_status,
                 repair_verification_notes = :verification_notes,
                 repair_verified_at = CURRENT_TIMESTAMP,
                 updated_by_user_id = :user_id
             WHERE id = :id AND deleted_at IS NULL'
        );
        $update->execute([
            ':status' => $nextStatus,
            ':resolved_date' => $resolvedDate,
            ':verification_status' => $verificationStatus,
            ':verification_notes' => $notes,
            ':user_id' => $userId,
            ':id' => $id,
        ]);
        if ($update->rowCount() !== 1) {
            throw new RuntimeException('The repair verification could not be saved.');
        }

        $equipmentStatus = null;
        if (!$accomplished && $previous['equipment_status'] !== 'Condemned') {
            $equipmentStatus = 'Under Repair';
        } elseif ($accomplished && $previous['equipment_status'] !== 'Condemned') {
            $openStmt = $pdo->prepare(
                "SELECT COUNT(*)
                 FROM incidents
                 WHERE equipment_id = :equipment_id AND id <> :id AND deleted_at IS NULL
                   AND status IN ('Pending', 'In Progress')"
            );
            $openStmt->execute([':equipment_id' => $previous['equipment_id'], ':id' => $id]);
            if ((int)$openStmt->fetchColumn() === 0) {
                $equipmentStatus = 'Operational';
            }
        }
        if ($equipmentStatus !== null && $equipmentStatus !== $previous['equipment_status']) {
            $equipmentUpdate = $pdo->prepare(
                'UPDATE equipment
                 SET status = :status, updated_by_user_id = :user_id
                 WHERE id = :id AND deleted_at IS NULL'
            );
            $equipmentUpdate->execute([
                ':status' => $equipmentStatus,
                ':user_id' => $userId,
                ':id' => $previous['equipment_id'],
            ]);
            if ($equipmentUpdate->rowCount() !== 1) {
                throw new RuntimeException('The linked equipment could not be updated.');
            }
            writeAudit($pdo, 'update', 'equipment', $previous['equipment_code'], [
                'field' => 'status',
                'previous' => $previous['equipment_status'],
                'current' => $equipmentStatus,
                'reason' => $accomplished ? 'repair_verified' : 'repair_not_accomplished',
            ]);
        }

        $stmt = $pdo->prepare(
            'SELECT incidents.*, equipment.equipment_code, equipment.status AS equipment_status
             FROM incidents
             JOIN equipment ON equipment.id = incidents.equipment_id
             WHERE incidents.id = :id AND incidents.deleted_at IS NULL'
        );
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        if (!$row) {
            throw new RuntimeException('Verified incident could not be reloaded.');
        }

        writeAudit(
            $pdo,
            'verify',
            'incident',
            'INC-' . str_pad((string)$id, 4, '0', STR_PAD_LEFT),
            ['previous' => incidentAuditPayload($previous), 'current' => incidentAuditPayload($row)]
        );
        $pdo->commit();
        jsonResponse(['success' => true, 'data' => incidentPayload($row)]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log('Repair verification failed: ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => 'Unable to verify the repair. No records were changed.'], 500);
    }
}

if ($method === 'PUT') {
    $data = readJsonBody(32768);
    $id = incidentNumericId($data['id'] ?? null);
    if ($id < 1) {
        jsonResponse(['success' => false, 'message' => 'A valid incident ID is required.'], 400);
    }

    $status = incidentInputString($data, 'status', 50);
    $priority = incidentInputString($data, 'priority', 50);
    if (!in_array($status, ['Pending', 'In Progress', 'Resolved', 'Rejected'], true)
        || !in_array($priority, ['Low', 'Medium', 'High', 'Critical'], true)) {
        jsonResponse(['success' => false, 'message' => 'The incident status or priority is invalid.'], 400);
    }
    $remarks = incidentInputString($data, 'remarks', 5000, false);
    $version = incidentInputString($data, 'version', 64);
    if (!preg_match('/^[a-f0-9]{64}$/', $version)) {
        jsonResponse(['success' => false, 'message' => 'The incident version is invalid. Refresh the report and try again.'], 400);
    }
    $resolvedDateText = null;
    if (in_array($status, ['Resolved', 'Rejected'], true)) {
        $resolvedDateText = incidentInputString($data, 'resolvedDate', 10, false);
        if ($resolvedDateText === '') {
            $resolvedDateText = date('Y-m-d');
        }
        incidentDate($resolvedDateText, 'Resolution date');
    }

    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare(
            'SELECT incidents.*, equipment.equipment_code, equipment.status AS equipment_status
             FROM incidents
             JOIN equipment ON equipment.id = incidents.equipment_id
             WHERE incidents.id = :id AND incidents.deleted_at IS NULL
             FOR UPDATE'
        );
        $stmt->execute([':id' => $id]);
        $previous = $stmt->fetch();
        if (!$previous) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => 'Incident not found.'], 404);
        }
        if (!hash_equals(incidentVersion($previous), $version)) {
            $pdo->rollBack();
            jsonResponse([
                'success' => false,
                'message' => 'This incident was updated by another request. The latest values have been loaded; review them and try again.',
                'data' => incidentPayload($previous),
            ], 409);
        }
        if ($resolvedDateText !== null
            && new DateTimeImmutable($resolvedDateText) < new DateTimeImmutable($previous['date_reported'])) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => 'Resolution date cannot be before the reported date.'], 400);
        }

        $verificationStatus = (string)($previous['repair_verification_status'] ?? 'Not Required');
        $verificationNotes = (string)($previous['repair_verification_notes'] ?? '');
        $verifiedAt = $previous['repair_verified_at'] ?? null;
        if ($status !== (string)$previous['status'] && $status === 'Resolved') {
            $verificationStatus = $previous['reported_by_user_id'] !== null
                ? 'Awaiting Verification'
                : 'Not Required';
            $verificationNotes = '';
            $verifiedAt = null;
        } elseif ($status !== (string)$previous['status'] && (string)$previous['status'] === 'Resolved') {
            $verificationStatus = 'Not Required';
            $verificationNotes = '';
            $verifiedAt = null;
        }

        $equipmentStatus = null;
        if ($status === 'In Progress'
            || ($status === 'Resolved' && $verificationStatus === 'Awaiting Verification')) {
            $equipmentStatus = 'Under Repair';
        } elseif ($status === 'Rejected'
            || ($status === 'Resolved' && $verificationStatus !== 'Awaiting Verification')) {
            $openStmt = $pdo->prepare(
                "SELECT COUNT(*)
                 FROM incidents
                 WHERE equipment_id = :equipment_id AND id <> :id AND deleted_at IS NULL
                   AND status IN ('Pending', 'In Progress')"
            );
            $openStmt->execute([':equipment_id' => $previous['equipment_id'], ':id' => $id]);
            if ((int)$openStmt->fetchColumn() === 0 && $previous['equipment_status'] !== 'Condemned') {
                $equipmentStatus = 'Operational';
            }
        }

        $incidentChanged = $status !== (string)$previous['status']
            || $priority !== (string)$previous['priority']
            || $remarks !== (string)($previous['remarks'] ?? '')
            || $resolvedDateText !== ($previous['resolved_date'] !== null ? (string)$previous['resolved_date'] : null)
            || $verificationStatus !== (string)($previous['repair_verification_status'] ?? 'Not Required')
            || $verificationNotes !== (string)($previous['repair_verification_notes'] ?? '')
            || $verifiedAt !== ($previous['repair_verified_at'] ?? null);
        $equipmentChanged = $equipmentStatus !== null && $equipmentStatus !== $previous['equipment_status'];

        // A repeated/no-op submission is safe and does not create a duplicate
        // audit event or overwrite the last editor metadata.
        if (!$incidentChanged && !$equipmentChanged) {
            $pdo->commit();
            jsonResponse(['success' => true, 'data' => incidentPayload($previous), 'unchanged' => true]);
        }

        if ($incidentChanged) {
            $stmt = $pdo->prepare(
                'UPDATE incidents
                 SET status = :status, priority = :priority, remarks = :remarks,
                     resolved_date = :resolved_date,
                     repair_verification_status = :verification_status,
                     repair_verification_notes = :verification_notes,
                     repair_verified_at = :verified_at,
                     updated_by_user_id = :user_id
                 WHERE id = :id AND deleted_at IS NULL'
            );
            $stmt->execute([
                ':status' => $status,
                ':priority' => $priority,
                ':remarks' => $remarks,
                ':resolved_date' => $resolvedDateText,
                ':verification_status' => $verificationStatus,
                ':verification_notes' => $verificationNotes !== '' ? $verificationNotes : null,
                ':verified_at' => $verifiedAt,
                ':id' => $id,
                ':user_id' => $userId,
            ]);
            if ($stmt->rowCount() !== 1) {
                throw new RuntimeException('The incident record could not be updated.');
            }
        }

        if ($equipmentChanged) {
            $equipmentUpdate = $pdo->prepare(
                'UPDATE equipment
                 SET status = :status, updated_by_user_id = :user_id
                 WHERE id = :id AND deleted_at IS NULL'
            );
            $equipmentUpdate->execute([
                ':status' => $equipmentStatus,
                ':user_id' => $userId,
                ':id' => $previous['equipment_id'],
            ]);
            if ($equipmentUpdate->rowCount() !== 1) {
                throw new RuntimeException('The linked equipment could not be updated.');
            }
            writeAudit($pdo, 'update', 'equipment', $previous['equipment_code'], [
                'field' => 'status',
                'previous' => $previous['equipment_status'],
                'current' => $equipmentStatus,
                'reason' => 'incident_status',
            ]);
        }

        $stmt = $pdo->prepare(
            'SELECT incidents.*, equipment.equipment_code, equipment.status AS equipment_status
             FROM incidents
             JOIN equipment ON equipment.id = incidents.equipment_id
             WHERE incidents.id = :id AND incidents.deleted_at IS NULL'
        );
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        if (!$row) {
            throw new RuntimeException('Updated incident could not be reloaded.');
        }

        writeAudit(
            $pdo,
            'update',
            'incident',
            'INC-' . str_pad((string)$id, 4, '0', STR_PAD_LEFT),
            ['previous' => incidentAuditPayload($previous), 'current' => incidentAuditPayload($row)]
        );
        $pdo->commit();

        jsonResponse(['success' => true, 'data' => incidentPayload($row)]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log('Incident update failed: ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => 'Unable to update the incident. No records were changed.'], 500);
    }
}

if ($method === 'DELETE') {
    $id = incidentNumericId($_GET['id'] ?? null);
    if ($id < 1) {
        jsonResponse(['success' => false, 'message' => 'A valid incident ID is required.'], 400);
    }

    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare(
            'SELECT incidents.*, equipment.equipment_code, equipment.status AS equipment_status
             FROM incidents
             JOIN equipment ON equipment.id = incidents.equipment_id
             WHERE incidents.id = :id AND incidents.deleted_at IS NULL
             FOR UPDATE'
        );
        $stmt->execute([':id' => $id]);
        $previous = $stmt->fetch();
        if (!$previous) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => 'Incident not found.'], 404);
        }

        $delete = $pdo->prepare(
            'UPDATE incidents
             SET deleted_at = NOW(), deleted_by_user_id = :deleted_by_user_id, updated_by_user_id = :updated_by_user_id
             WHERE id = :id AND deleted_at IS NULL'
        );
        $delete->execute([
            ':id' => $id,
            ':deleted_by_user_id' => $userId,
            ':updated_by_user_id' => $userId,
        ]);
        if ($delete->rowCount() !== 1) {
            throw new RuntimeException('Incident was not deleted.');
        }

        writeAudit(
            $pdo,
            'delete',
            'incident',
            'INC-' . str_pad((string)$id, 4, '0', STR_PAD_LEFT),
            ['previous' => incidentAuditPayload($previous)]
        );
        $pdo->commit();
        jsonResponse(['success' => true]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log('Incident delete failed: ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => 'Unable to delete the incident. No records were changed.'], 500);
    }
}

try {
    $sql =
        'SELECT incidents.*, equipment.equipment_code, equipment.status AS equipment_status
         FROM incidents
         JOIN equipment ON equipment.id = incidents.equipment_id
         WHERE incidents.deleted_at IS NULL';
    $parameters = [];
    if ($role === 'faculty') {
        $sql .= ' AND incidents.reported_by_user_id = :user_id';
        $parameters[':user_id'] = $userId;
    }
    $sql .= ' ORDER BY incidents.id ASC';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($parameters);
    $incidents = array_map('incidentPayload', $stmt->fetchAll());
    jsonResponse(['success' => true, 'data' => $incidents]);
} catch (Throwable $e) {
    error_log('Incident lookup failed: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Unable to load incidents.'], 500);
}
