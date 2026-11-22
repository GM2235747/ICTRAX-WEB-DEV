<?php
declare(strict_types=1);

$root = dirname(__DIR__);
$api = (string)file_get_contents($root . '/api/incidents.php');
$frontend = (string)file_get_contents($root . '/script.js');
$schema = (string)file_get_contents($root . '/api/schema.sql');
$migration = (string)file_get_contents($root . '/api/migrate_repair_verification.sql');
$passed = 0;
$failed = [];

function repairVerificationTest(bool $condition, string $description): void
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

echo "ICTRAX repair submitter verification smoke tests\n\n";

repairVerificationTest(
    str_contains($schema, 'repair_verification_status')
        && str_contains($schema, 'repair_verification_notes')
        && str_contains($schema, 'repair_verified_at')
        && str_contains($migration, "SET repair_verification_status = 'Awaiting Verification'"),
    'Schema and migration preserve the second verification state'
);
repairVerificationTest(
    str_contains($api, "'PATCH' => ['faculty']")
        && str_contains($api, "\$action !== 'verify-resolution'")
        && str_contains($api, 'Only the original submitter can verify this repair.'),
    'Only a faculty/non-teaching submitter can use the verification endpoint'
);
repairVerificationTest(
    str_contains($api, "'Awaiting Verification'")
        && str_contains($api, "'Verified'")
        && str_contains($api, "'Not Accomplished'"),
    'Backend records awaiting, verified, and not-accomplished outcomes'
);
repairVerificationTest(
    str_contains($api, "\$nextStatus = \$accomplished ? 'Resolved' : 'In Progress'")
        && str_contains($api, "\$equipmentStatus = 'Under Repair'")
        && str_contains($api, "\$equipmentStatus = 'Operational'"),
    'Verification confirms completion or reopens the repair and equipment state'
);
repairVerificationTest(
    str_contains($frontend, "verificationStatus==='Awaiting Verification'")
        && str_contains($frontend, 'Verify Repair</button>')
        && str_contains($frontend, '>Not Accomplished</button>')
        && !str_contains($frontend, 'Verify Repair Accomplished</button>')
        && !str_contains($frontend, '>Repair Not Accomplished</button>'),
    'Submitters receive both verification choices in the incident modal'
);
repairVerificationTest(
    str_contains((string)file_get_contents($root . '/assets/css/styles.css'), 'grid-template-columns:repeat(2,minmax(0,1fr))')
        && str_contains((string)file_get_contents($root . '/assets/css/styles.css'), 'overflow-wrap:anywhere;text-align:center'),
    'Shared buttons and modal footers prevent clipped or overflowing labels'
);
repairVerificationTest(
    str_contains($frontend, "method:'PATCH'")
        && str_contains($frontend, "action:'verify-resolution'")
        && str_contains($frontend, "navigate(accomplished?'completed':'myreports')"),
    'Frontend persists verification and routes reopened reports back to active reports'
);
repairVerificationTest(
    str_contains($frontend, "columnFilterHeader('completed','status','Incident Status')")
        && str_contains($frontend, "columnFilterHeader('completed','verificationStatus','Verification Status')")
        && str_contains($frontend, "{label:'Incident Status',get:r=>r.status}")
        && str_contains($frontend, "{label:'Verification Status',get:r=>r.verificationStatus||'Not Required'}"),
    'Completed Incident Reports displays and exports clarified status labels'
);
repairVerificationTest(
    str_contains($frontend, '<span class="k">Incident Status</span>')
        && str_contains($frontend, '<span class="k">Verification Status</span>')
        && str_contains($frontend, '<label>Update Incident Status</label>')
        && str_contains($frontend, '<label>Verification Notes</label>'),
    'Shared incident modal uses the clarified status terminology'
);
repairVerificationTest(
    str_contains($frontend, "columnFilterHeader('incidents','status','Incident Status')")
        && str_contains($frontend, "sortableFilterHeader('myreports','status','Incident Status')"),
    'Administrator and faculty active-report tables use Incident Status'
);
repairVerificationTest(
    str_contains($api, "'verify',\n            'incident'")
        && str_contains($api, "'reason' => \$accomplished ? 'repair_verified' : 'repair_not_accomplished'"),
    'Verification results are included in the audit trail'
);

echo "\n{$passed} passed, " . count($failed) . " failed.\n";
exit($failed ? 1 : 0);
