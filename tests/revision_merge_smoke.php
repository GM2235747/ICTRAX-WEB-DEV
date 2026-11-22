<?php
declare(strict_types=1);

$root = dirname(__DIR__);
$script = (string)file_get_contents($root . '/script.js');
$serviceCards = (string)file_get_contents($root . '/api/service_cards.php');
$catalog = (string)file_get_contents($root . '/api/catalog.php');
$equipment = (string)file_get_contents($root . '/api/equipment.php');
$photoApi = (string)file_get_contents($root . '/api/equipment-photos.php');
$schema = (string)file_get_contents($root . '/api/schema.sql');
$styles = (string)file_get_contents($root . '/assets/css/styles.css');
$theme = (string)file_get_contents($root . '/assets/css/ceu-theme.css');
$authenticatedPages = [
    'audit.html',
    'browse-equipment.html',
    'completed-incidents.html',
    'dashboard.html',
    'incidents.html',
    'inventory.html',
    'my-reports.html',
    'report-issue.html',
    'risk.html',
];
$clocklessTopbars = array_reduce(
    $authenticatedPages,
    static function (bool $valid, string $page) use ($root): bool {
        $html = (string)file_get_contents($root . '/' . $page);
        return $valid
            && str_contains($html, '<div class="top-actions"></div>')
            && !str_contains($html, 'id="live-clock"')
            && str_contains($html, 'styles.css?v=20261110-equipment-no-icon-v1')
            && str_contains($html, 'ceu-theme.css?v=20261110-equipment-no-icon-v1')
            && str_contains($html, 'script.js?v=20261110-equipment-no-icon-v1');
    },
    true
);

$checks = [
    'Completed Incident Reports remains available after the merge' =>
        str_contains($script, 'function renderCompletedIncidentsView()')
        && file_exists($root . '/completed-incidents.html'),
    'Equipment forms attach note photos and details display them' =>
        str_contains($script, 'Attach photos to Notes')
        && str_contains($script, 'function uploadEquipmentPhotos(')
        && str_contains($script, 'function equipmentPhotosMarkup(')
        && str_contains($script, 'Notes photos'),
    'Destructive actions use the styled confirmation modal' =>
        str_contains($script, 'function confirmAction(')
        && str_contains($script, 'window.__ictConfirm=value=>finish(value)')
        && str_contains($script, 'if(activeConfirmationResolve){')
        && str_contains($script, "confirmAction('Remove this attached photo?',{title:'Remove photo',confirmLabel:'Remove'})")
        && str_contains($script, "{title:'Delete incident?',confirmLabel:'Delete'}")
        && str_contains($script, "confirmAction('Restore this equipment?',{title:'Restore equipment',confirmLabel:'Restore'})"),
    'Modals are centered and authenticated headers omit the clock' =>
        str_contains($styles, 'align-items:center;justify-content:center;')
        && str_contains($styles, '#modal-root.open{display:flex;}')
        && str_contains($theme, 'margin:0 auto;')
        && !str_contains($script, 'function startClock(')
        && $clocklessTopbars,
    'Banner account options supplement the existing sidebar controls' =>
        str_contains($script, 'function renderAccountControl()')
        && str_contains($script, 'aria-label="Account options for ${esc(state.user.name)}"')
        && str_contains($script, 'class="account-signout"')
        && substr_count($script, 'renderAccountControl();') >= 2
        && substr_count($script, 'onclick="logout()"') >= 2,
    'Data-table titles remain visible while scrolling, searching, and sorting' =>
        str_contains($styles, '.table-wrap{max-height:min(68vh,720px);overflow:auto;')
        && str_contains($styles, 'position:sticky;top:0;z-index:4;')
        && str_contains($theme, "table.dtable th{\n  position:sticky;"),
    'Toast messages have larger color-coded accessible feedback' =>
        str_contains($script, "t.setAttribute('role',tone.className==='bad'?'alert':'status')")
        && str_contains($script, "label:'Action needed',duration:6000")
        && str_contains($script, 'class="toast-close"')
        && str_contains($styles, '#toast-root{position:fixed;top:22px;right:22px;bottom:auto;')
        && str_contains($theme, '#toast-root{top:24px;right:24px;bottom:auto;')
        && str_contains($styles, 'min-width:320px;')
        && str_contains($theme, '.toast.t-good{')
        && str_contains($theme, '.toast.t-bad{')
        && str_contains($theme, '.toast.t-info{'),
    'Incident status toasts specify and emphasize the incident ID and new status' =>
        str_contains($script, 'function incidentStatusToastMessage(id,status)')
        && str_contains($script, "{text:id||'Unknown',strong:true}")
        && str_contains($script, "{text:status||'Updated',strong:true}")
        && str_contains($script, 'toast(incidentStatusToastMessage(id,i.status)')
        && str_contains($styles, '.toast-message .toast-emphasis{'),
    'Priority badges and risk legends use standard severity colors' =>
        str_contains($script, "'Low':'green','Medium':'yellow','High':'orange','Critical':'red'")
        && str_contains($script, "label:'Low',color:'green',hex:'#2e7d32'")
        && str_contains($script, "label:'Medium',color:'yellow',hex:'#f9a825'")
        && str_contains($script, "label:'High',color:'orange',hex:'#ef6c00'")
        && str_contains($script, "label:'Critical',color:'red',hex:'#c62828'")
        && str_contains($styles, '.badge-green{')
        && str_contains($styles, '.badge-yellow{')
        && str_contains($styles, '.badge-orange{'),
    'Photo storage enforces authentication, CSRF, file size, and image MIME checks' =>
        str_contains($photoApi, 'requireAuthenticatedUser')
        && str_contains($photoApi, 'requireCsrfToken')
        && str_contains($photoApi, 'EQUIPMENT_PHOTO_MAX_BYTES')
        && str_contains($photoApi, 'getimagesize')
        && str_contains($schema, 'CREATE TABLE IF NOT EXISTS equipment_photos'),
    'Manage Equipment Options exposes the master automatic Tag ID toggle' =>
        str_contains($script, 'id="master-tag-automatic"')
        && str_contains($script, 'function saveMasterTagMode(')
        && str_contains($catalog, "\$type === 'tag-mode'"),
    'Each category can choose automatic or manual Tag ID generation' =>
        str_contains($script, 'id="new-category-automatic"')
        && str_contains($script, "data.tagIdMode=\$('#new-category-automatic')?.checked?'automatic':'manual'")
        && str_contains($script, 'onclick="openCategorySettings(${Number(x.id)})"')
        && str_contains($script, 'function saveCategorySettings('),
    'Automatically generated equipment numbers are disabled in the form' =>
        str_contains($script, 'input.disabled=true;')
        && str_contains($script, 'input.disabled=false;')
        && str_contains($script, "initialSettings.tagIdMode!=='manual'?'disabled readonly':''"),
    'Manual-mode equipment Tag IDs remain editable during updates' =>
        str_contains($script, "Manual mode: you may edit this equipment Tag ID.")
        && str_contains($script, 'body:JSON.stringify({...data,originalId:id})')
        && str_contains($equipment, "equipmentInputString(\$data, 'originalId'")
        && str_contains($equipment, 'equipment_code = :equipment_code'),
    'Repair requests populate service cards using only request-form Remarks text' =>
        str_contains($serviceCards, 'function serviceCardRequestRemarks(')
        && str_contains($serviceCards, "foreach (['hardwareRemarks', 'softwareRemarks'] as \$field)")
        && str_contains($serviceCards, "'remarks' => serviceCardRequestRemarks(\$form)"),
    'Repair-request duplicate tracking stays hidden in row metadata' =>
        str_contains($serviceCards, "'requestIncidentId' => \$incidentId")
        && str_contains($script, 'data-request-incident-id="${esc(r.requestIncidentId||\'\')}"')
        && str_contains($script, "requestIncidentId: row.dataset.requestIncidentId || ''"),
    'Required fields show markers and invalid highlighting after validation' =>
        str_contains($styles, '.field:has(input[required]:not([disabled])')
        && str_contains($script, "classList.add('validation-attempted')")
        && str_contains($script, "control.setAttribute('aria-invalid','true')"),
    'Catalog validation toasts identify and highlight the related input' =>
        str_contains($script, 'function showFieldValidationError(control,message)')
        && str_contains($script, "type==='category'?'Enter a category name first':'Enter a location name first'")
        && str_contains($script, "showFieldValidationError($('#new-category-prefix')")
        && str_contains($styles, '.field input[aria-invalid="true"]'),
];

$passed = 0;
$failed = [];
foreach ($checks as $description => $condition) {
    if ($condition) {
        $passed++;
        echo "[PASS] {$description}" . PHP_EOL;
    } else {
        $failed[] = $description;
        echo "[FAIL] {$description}" . PHP_EOL;
    }
}

echo PHP_EOL . "{$passed} passed, " . count($failed) . " failed." . PHP_EOL;
exit($failed === [] ? 0 : 1);
