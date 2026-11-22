<?php
declare(strict_types=1);

$root = dirname(__DIR__);
$frontend = (string)file_get_contents($root . '/script.js');
$api = (string)file_get_contents($root . '/api/incidents.php');
$page = (string)file_get_contents($root . '/completed-incidents.html');
$passed = 0;
$failed = [];

function completedIncidentTest(bool $condition, string $description): void
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

echo "ICTRAX completed incident reports smoke tests\n\n";

completedIncidentTest(
    str_contains($frontend, "completed:'completed-incidents.html'")
        && str_contains($frontend, "completed:['admin','faculty']"),
    'Completed incident reports page is available to administrators and faculty'
);
completedIncidentTest(
    substr_count($frontend, "label:'Completed Incident Reports'") === 2,
    'Both role navigation menus include Completed Incident Reports'
);
completedIncidentTest(
    str_contains($frontend, "if(completed ? i.status!=='Resolved' : i.status==='Resolved') return false;")
        && str_contains($frontend, "filteredIncidentRows('completed')"),
    'Resolved reports are separated from active incident reports'
);
completedIncidentTest(
    str_contains($frontend, "(myReports || state.user?.role==='faculty') && String(i.reportedByUserId)!==String(state.user.id)")
        && str_contains($frontend, "filteredIncidentRows('myreports')"),
    'Faculty active and completed lists remain restricted to their own reports'
);
completedIncidentTest(
    str_contains($frontend, "columnFilterHeader('completed','resolvedDate','Resolved')")
        && str_contains($frontend, 'onCompletedSearch(this.value)')
        && str_contains($frontend, "exportIncidentXLSX('completed')"),
    'Completed reports support column filters, search, and filtered export'
);
completedIncidentTest(
    str_contains($frontend, "incident?.status==='Resolved'")
        && str_contains($frontend, "? 'completed'"),
    'Resolved-report notifications route to the completed page'
);
completedIncidentTest(
    str_contains($frontend, '${icon(\'trash\')} Delete</button>')
        && !str_contains($frontend, '${icon(\'archive\')} Archive</button><button class="btn btn-primary" type="button" id="incident-save-button"'),
    'Incident modal presents a Delete action instead of Archive'
);
completedIncidentTest(
    str_contains($api, 'Incident was not deleted.')
        && str_contains($api, 'Unable to delete the incident. No records were changed.')
        && !str_contains($api, 'Unable to archive the incident.'),
    'Incident deletion API uses delete-oriented errors'
);
completedIncidentTest(
    str_contains($page, '<body data-page="completed">')
        && str_contains($page, 'assets/js/xlsx.bundle.js')
        && str_contains($page, 'script.js?v=20261110-equipment-no-icon-v1'),
    'Completed incident reports page loads the correct view and export dependency'
);

echo "\n{$passed} passed, " . count($failed) . " failed.\n";
exit($failed ? 1 : 0);
