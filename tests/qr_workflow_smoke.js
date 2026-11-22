'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'assets', 'css', 'styles.css'), 'utf8');
const login = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const serviceCards = fs.readFileSync(path.join(root, 'api', 'service_cards.php'), 'utf8');

function section(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  if (start < 0 || end < 0) throw new Error(`Unable to locate QR section: ${startMarker}`);
  return source.slice(start, end);
}

let passed = 0;
const failures = [];
function check(condition, description) {
  if (condition) {
    passed++;
    console.log(`[PASS] ${description}`);
  } else {
    failures.push(description);
    console.log(`[FAIL] ${description}`);
  }
}

async function main() {
  const apiRequestSource = section('async function apiRequest', 'async function loadPersistedDb');
  const lookupSource = section('function findEquipmentByCode', 'async function disposeQrScanner');
  const routeSource = section('function claimQrScanResult', 'function equipmentDetailsGridMarkup');
  const calls = [];
  const context = vm.createContext({
    URL,
    window: {location: {href: 'http://localhost/ICTRAX_WEBSITE/browse-equipment.html'}},
    DB: {equipment: [
      {id: 'EMS-CL1-DT-001'},
      {id: 'CUSTOM01-01'},
    ]},
    state: {user: {role: 'faculty'}},
    qrScanHandling: false,
    openEquipmentInformationModal: async (id, options) => calls.push(`${context.state.user.role}:${id}:${options?.showServiceCardAction===true}:${options?.source}`),
  });
  vm.runInContext(`${lookupSource}\n${routeSource}\nthis.qrApi={parseEquipmentCodeFromQr,claimQrScanResult,openScannedEquipmentDetails};`, context);

  check(context.qrApi.parseEquipmentCodeFromQr('ems-cl1-dt-001') === 'EMS-CL1-DT-001', 'Direct tag IDs match case-insensitively');
  check(context.qrApi.parseEquipmentCodeFromQr('/inventory.html?equipment_id=CUSTOM01-01') === 'CUSTOM01-01', 'Relative QR URLs resolve an equipment query parameter');
  check(context.qrApi.parseEquipmentCodeFromQr('asset: EMS-CL1-DT-001') === 'EMS-CL1-DT-001', 'Embedded registered EMS tag IDs are recognized');
  check(context.qrApi.parseEquipmentCodeFromQr('not-a-registered-tag') === '', 'Malformed or unregistered QR payloads are rejected');

  await context.qrApi.openScannedEquipmentDetails('EMS-CL1-DT-001');
  context.state.user.role = 'admin';
  await context.qrApi.openScannedEquipmentDetails('CUSTOM01-01');
  check(calls[0] === 'faculty:EMS-CL1-DT-001:false:scan', 'Faculty scans open the shared read-only equipment information viewer');
  check(calls[1] === 'admin:CUSTOM01-01:true:scan', 'Administrator scans use the same viewer with the separate service-card action preserved');
  check(context.qrApi.claimQrScanResult() === true && context.qrApi.claimQrScanResult() === false, 'Duplicate success callbacks are accepted only once per scanner session');

  let logoutCalls = 0;
  const requestContext = vm.createContext({
    API_BASE_URL: 'api',
    csrfToken: 'test-token',
    Headers,
    FormData,
    currentPage: () => 'browse',
    terminateSessionAndReturnToLogin: () => { logoutCalls++; },
    fetch: async () => ({ok: false, status: 403, json: async () => ({message: 'Forbidden'})}),
  });
  vm.runInContext(`${apiRequestSource}\nthis.apiRequest=apiRequest;`, requestContext);
  await requestContext.apiRequest('service_cards.php?equipment=EMS-CL1-DT-001').catch(() => {});
  check(logoutCalls === 0, 'A forbidden optional lookup does not redirect an authenticated faculty session');

  check(login.includes('Faculty/Non-Teaching</button>'), 'Login role button uses the requested label');
  check(styles.includes('.modal-panel.equipment-details-modal') && styles.includes('max-height:92dvh'), 'Equipment detail dialogs use scoped viewport-constrained sizing');
  check(styles.includes('.modal-panel.modal-wide') && styles.includes('width:min(1120px,96vw)'), 'Administrator service-card dialogs use the enlarged responsive width');
  check(serviceCards.includes("$method === 'GET' ? ['admin', 'faculty'] : ['admin']"), 'Faculty access is read-only while service-card writes remain administrator-only');
  check(source.includes('qrScannerGeneration'), 'Stale asynchronous camera starts are guarded');
  check(source.includes('activeEquipmentInformationRequest') && source.includes("requestId!==activeEquipmentInformationRequest"), 'Stale equipment lookups cannot replace a newer scan or selection');
  check(source.includes("equipmentInformationErrorModal('This equipment record is no longer available") && source.includes("allowRetry:source==='scan'"), 'A record removed after scanning exposes a recoverable scanner action');
  check(source.includes('viewOnlyEquipmentQrMarkup') && source.includes('renderViewOnlyEquipmentQr'), 'Browse and Scan share one view-only QR card renderer');
  check(!source.includes('The QR card is view-only.'), 'Equipment information modal omits the clipped view-only notice');
  check(source.includes('equip-card-interactive') && source.includes('activateEquipmentCard(event'), 'Browse equipment cards expose pointer and keyboard activation');
  check(source.includes("onclick=\"openEquipmentInformationModal('") && source.includes('View details'), 'Faculty browse equipment cards retain the full equipment-information modal');
  check(source.includes("select.innerHTML='<option value=\"\">Scanner library unavailable</option>'"), 'Scanner library failures retain the manual equipment lookup path');
  const browseViewer = section('function openEquipDetailModal', '/* ============================================================\n   FACULTY');
  check(!browseViewer.includes('downloadEquipmentQrJpg') && !browseViewer.includes('window.print'), 'Browse equipment viewing exposes no QR download or direct print controls');
  check(styles.includes('body.modal-open') && source.includes("panel.setAttribute('aria-modal','true')"), 'Equipment dialogs lock background scrolling and identify themselves as modal dialogs');

  console.log(`\n${passed} passed, ${failures.length} failed.`);
  if (failures.length) process.exit(1);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
