<?php
declare(strict_types=1);

/**
 * Regression coverage for formatted incident IDs, optimistic concurrency,
 * and transactional incident persistence. Database writes are rolled back.
 */

$root = dirname(__DIR__);
$repairFormSource = (string)file_get_contents($root . '/api/incident-repair-form.php');
$source = $repairFormSource . "\n" . (string)file_get_contents($root . '/api/incidents.php');
$frontend = (string)file_get_contents($root . '/script.js');
$passed = 0;
$failed = [];

function incidentTest(bool $condition, string $description): void
{
    global $passed, $failed;
    if ($condition) {
        $passed++;
        echo "[PASS] {$description}\n";
        return;
    }
    $failed[] = $description;
    echo "[FAIL] {$description}\n";
}

function loadIncidentFunction(string $source, string $name): bool
{
    $pattern = '/function\s+' . preg_quote($name, '/') . '\s*\([^)]*\)(?:\s*:\s*[^{]+)?\s*\{.*?^\}/ms';
    if (!preg_match($pattern, $source, $match)) {
        return false;
    }
    eval($match[0]);
    return function_exists($name);
}

define('ICTRAX_SKIP_SESSION', true);
require $root . '/api/config.php';

echo "ICTRAX incident update smoke tests\n\n";

incidentTest(loadIncidentFunction($source, 'incidentNumericId'), 'Incident ID parser can be loaded');
if (function_exists('incidentNumericId')) {
    incidentTest(incidentNumericId('INC-0004') === 4, 'Zero-padded public incident IDs are accepted');
    incidentTest(incidentNumericId('inc-0010') === 10, 'Formatted incident IDs are case-insensitive');
    incidentTest(incidentNumericId('4') === 4, 'Numeric incident IDs remain accepted');
    incidentTest(incidentNumericId('INC-0000') === 0, 'The all-zero incident ID is rejected');
    incidentTest(incidentNumericId('INC-4x') === 0, 'Mixed or malformed incident IDs are rejected');
}

incidentTest(loadIncidentFunction($source, 'incidentVersion'), 'Incident version generator can be loaded');
if (function_exists('incidentVersion')) {
    $row = ['id' => 4, 'status' => 'Pending', 'priority' => 'Medium', 'remarks' => '', 'resolved_date' => null, 'updated_at' => '2026-10-19 14:21:49'];
    $version = incidentVersion($row);
    incidentTest((bool)preg_match('/^[a-f0-9]{64}$/', $version), 'Incident versions are opaque SHA-256 values');
    $row['remarks'] = 'Changed';
    incidentTest(!hash_equals($version, incidentVersion($row)), 'Editable field changes produce a different version');
}

incidentTest(loadIncidentFunction($source, 'incidentRepairSummary'), 'Request-for-repair description mapper can be loaded');
if (function_exists('incidentRepairSummary')) {
    incidentTest(
        incidentRepairSummary([
            'hardwareRepair' => true,
            'specificProblem' => 'Cannot print',
            'hardwareRemarks' => 'Redownload printer drivers',
        ]) === 'Redownload printer drivers',
        'Hardware request descriptions use the hardware Remarks field'
    );
    incidentTest(
        incidentRepairSummary([
            'softwareEnhancement' => true,
            'applications' => 'Microsoft Office',
            'softwareRemarks' => 'Install the licensed version',
        ]) === 'Install the licensed version',
        'Software request descriptions use the software Remarks field'
    );
    incidentTest(
        incidentRepairSummary([
            'maintenanceRepair' => true,
            'specificProblem' => 'Preventive maintenance',
            'softwareRemarks' => 'Clean and inspect the unit',
        ]) === 'Clean and inspect the unit',
        'Maintenance request descriptions use the right-side Remarks field'
    );
}

incidentTest(loadIncidentFunction($source, 'incidentRepairCategoryText'), 'Request-for-repair category text limiter can be loaded');
incidentTest(loadIncidentFunction($source, 'incidentRepairCategory'), 'Request-for-repair category mapper can be loaded');
if (function_exists('incidentRepairCategory')) {
    incidentTest(
        incidentRepairCategory(['hardwareRepair' => true, 'specificProblem' => "Can't print"]) === "Can't print",
        'Hardware requests use Specific Problem as the incident category'
    );
    incidentTest(
        incidentRepairCategory([
            'softwareEnhancement' => true,
            'addition' => true,
            'replacement' => false,
            'deletion' => true,
            'reinstallation' => false,
        ]) === 'Addition, Deletion',
        'Software requests use the checked Specific Request options as the incident category'
    );
}
incidentTest(
    substr_count($source, "'category' => \$repairForm ? incidentRepairCategory(\$repairForm) : \$row['category']") === 2,
    'Existing request-for-repair records expose their form-derived category in list and audit payloads'
);

incidentTest(strpos($source, "], 409);") !== false && strpos($source, 'hash_equals(incidentVersion($previous), $version)') !== false, 'Stale incident updates return an HTTP 409 conflict');
incidentTest(strpos($source, "'unchanged' => true") !== false, 'Repeated no-op submissions are handled without duplicate writes');
incidentTest(
    strpos($frontend, 'incidentUpdateInFlight') !== false
    && strpos($frontend, 'saveButton.disabled=true') !== false,
    'Frontend incident updates prevent duplicate submissions'
);
incidentTest(
    strpos($frontend, "err.status===409") !== false
    && strpos($frontend, 'error.data = payload.data ?? null') !== false,
    'Frontend reloads the authoritative incident after a conflict'
);
incidentTest(
    strpos($frontend, "toast(err.message||'Incident update failed. No changes were saved.'") !== false,
    'Frontend displays the server-provided incident error instead of a misleading database toast'
);

if (!$pdo instanceof PDO) {
    incidentTest(false, 'Database connection is available for transactional persistence verification');
} else {
    $stmt = $pdo->query(
        'SELECT id, remarks FROM incidents WHERE deleted_at IS NULL ORDER BY id ASC LIMIT 1'
    );
    $incident = $stmt->fetch();
    incidentTest(is_array($incident), 'An active incident is available for transactional verification');

    if (is_array($incident)) {
        $original = (string)($incident['remarks'] ?? '');
        $probe = $original . ' [rolled-back incident smoke test]';
        try {
            $pdo->beginTransaction();
            $update = $pdo->prepare(
                'UPDATE incidents SET remarks = :remarks WHERE id = :id AND deleted_at IS NULL'
            );
            $update->execute([':remarks' => $probe, ':id' => (int)$incident['id']]);
            $verify = $pdo->prepare('SELECT remarks FROM incidents WHERE id = :id');
            $verify->execute([':id' => (int)$incident['id']]);
            incidentTest($update->rowCount() === 1 && $verify->fetchColumn() === $probe, 'A valid incident change persists inside a database transaction');
        } finally {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
        }

        $verify = $pdo->prepare('SELECT remarks FROM incidents WHERE id = :id');
        $verify->execute([':id' => (int)$incident['id']]);
        incidentTest($verify->fetchColumn() === $original, 'The persistence probe rolls back without changing production data');
    }
}

echo "\n{$passed} passed, " . count($failed) . " failed.\n";
if ($failed) {
    exit(1);
}

exit(0);
