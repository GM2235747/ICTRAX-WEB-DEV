<?php
declare(strict_types=1);

const INCIDENT_REPAIR_FORM_PREFIX = 'ICTRAX_REPAIR_FORM_V1:';

function incidentRepairTextRules(): array
{
    return [
        'requisitioner' => [150, true],
        'requestDate' => [10, true],
        'department' => [150, true],
        'technicianResponseTime' => [20, false],
        'brandName' => [150, false],
        'serialNumber' => [150, false],
        'otherEquipment' => [150, false],
        'specificProblem' => [1000, false],
        'hardwareRemarks' => [1000, false],
        'softwareName' => [150, false],
        'applications' => [1500, false],
        'softwareRemarks' => [1500, false],
        'approvedBy' => [150, false],
        'approvalDate' => [10, false],
        'actionTakenBy' => [150, false],
        'actionDate' => [10, false],
        'attestedBy' => [150, false],
        'attestedDate' => [10, false],
        'completionTime' => [20, false],
    ];
}

function incidentRepairBooleanFields(): array
{
    return [
        'hardwareRepair', 'softwareEnhancement', 'maintenanceRepair',
        'computer', 'cpu', 'monitor', 'keyboard', 'mouse', 'printer',
        'repaired', 'replaced', 'pulledOut', 'returned', 'reformatted', 'forCondemnation',
        'addition', 'replacement', 'deletion', 'reinstallation',
    ];
}

function incidentDecodedRepairJson(?string $json): ?array
{
    if ($json === null || trim($json) === '') {
        return null;
    }
    try {
        $decoded = json_decode($json, true, 32, JSON_THROW_ON_ERROR);
    } catch (JsonException $e) {
        return null;
    }
    return is_array($decoded) ? $decoded : null;
}

/** Decode the temporary legacy format that stored JSON inside description. */
function incidentDecodedRepairForm(?string $description): ?array
{
    if ($description === null || !str_starts_with($description, INCIDENT_REPAIR_FORM_PREFIX)) {
        return null;
    }
    return incidentDecodedRepairJson(substr($description, strlen(INCIDENT_REPAIR_FORM_PREFIX)));
}

function incidentRepairRowContainsForm(array $row): bool
{
    $json = $row['repair_form_json'] ?? null;
    return (is_string($json) && trim($json) !== '')
        || str_starts_with((string)($row['description'] ?? ''), INCIDENT_REPAIR_FORM_PREFIX);
}

function incidentRepairFormFromRow(array $row): ?array
{
    $json = $row['repair_form_json'] ?? null;
    if (is_string($json) && trim($json) !== '') {
        $form = incidentDecodedRepairJson($json);
        return $form !== null && incidentRepairStoredFormIsValid($form) ? $form : null;
    }
    $form = incidentDecodedRepairForm((string)($row['description'] ?? ''));
    return $form !== null && incidentRepairStoredFormIsValid($form) ? $form : null;
}

function incidentRepairSummary(array $form): string
{
    $serviceRemarkFields = [];
    if (!empty($form['hardwareRepair'])) {
        $serviceRemarkFields[] = 'hardwareRemarks';
    }
    if (!empty($form['softwareEnhancement']) || !empty($form['maintenanceRepair'])) {
        $serviceRemarkFields[] = 'softwareRemarks';
    }

    foreach (array_unique(array_merge(
        $serviceRemarkFields,
        ['hardwareRemarks', 'softwareRemarks', 'specificProblem', 'applications']
    )) as $field) {
        $value = trim((string)($form[$field] ?? ''));
        if ($value !== '') {
            return $value;
        }
    }
    return 'Request for repair form submitted.';
}

function incidentRepairCategory(array $form): string
{
    $specificProblem = trim((string)($form['specificProblem'] ?? ''));
    if (!empty($form['hardwareRepair'])) {
        return $specificProblem !== '' ? incidentRepairCategoryText($specificProblem) : 'Hardware Repair';
    }

    if (!empty($form['softwareEnhancement'])) {
        $requests = [];
        foreach ([
            'addition' => 'Addition',
            'replacement' => 'Replacement',
            'deletion' => 'Deletion',
            'reinstallation' => 'Reinstallation',
        ] as $field => $label) {
            if (!empty($form[$field])) {
                $requests[] = $label;
            }
        }
        return $requests !== [] ? implode(', ', $requests) : 'Software Enhancement';
    }

    if (!empty($form['maintenanceRepair'])) {
        return $specificProblem !== '' ? incidentRepairCategoryText($specificProblem) : 'Maintenance/Repair';
    }
    return 'Other';
}

function incidentRepairCategoryText(string $value): string
{
    if (function_exists('mb_substr')) {
        return mb_substr($value, 0, 100, 'UTF-8');
    }
    return preg_match('/^.{0,100}/us', $value, $match) ? $match[0] : substr($value, 0, 100);
}

function incidentRepairStorage(array $form): string
{
    return json_encode(
        $form,
        JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR
    );
}

function incidentRepairStoredDateIsValid(string $value, bool $required): bool
{
    $value = trim($value);
    if ($value === '') {
        return !$required;
    }
    if (!preg_match('/^(\d{2})\/(\d{2})\/(\d{4})$/D', $value, $match)) {
        return false;
    }
    if (!checkdate((int)$match[1], (int)$match[2], (int)$match[3])) {
        return false;
    }
    $date = DateTimeImmutable::createFromFormat('!m/d/Y', $value);
    return $date !== false
        && $date >= new DateTimeImmutable('2000-01-01')
        && $date <= new DateTimeImmutable('today');
}

/** Validate data read from a database or archive before it is exposed or restored. */
function incidentRepairStoredFormIsValid(array $form): bool
{
    if (($form['formVersion'] ?? null) !== '20260825-AMT-v1') {
        return false;
    }
    foreach (incidentRepairTextRules() as $field => [$maximumLength, $required]) {
        if (!array_key_exists($field, $form) || !is_string($form[$field])) {
            return false;
        }
        $value = trim($form[$field]);
        if (($required && $value === '') || strlen($value) > $maximumLength
            || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $value)) {
            return false;
        }
    }
    foreach (incidentRepairBooleanFields() as $field) {
        if (!array_key_exists($field, $form) || !is_bool($form[$field])) {
            return false;
        }
    }
    if (!$form['hardwareRepair'] && !$form['softwareEnhancement'] && !$form['maintenanceRepair']) {
        return false;
    }
    if (!incidentRepairStoredDateIsValid($form['requestDate'], true)
        || !incidentRepairStoredDateIsValid($form['approvalDate'], false)
        || !incidentRepairStoredDateIsValid($form['actionDate'], false)
        || !incidentRepairStoredDateIsValid($form['attestedDate'], false)) {
        return false;
    }
    try {
        return strlen(incidentRepairStorage($form)) <= 5000
            && incidentRepairSummary($form) !== 'Request for repair form submitted.';
    } catch (JsonException $e) {
        return false;
    }
}
